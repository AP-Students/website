// Removes hidden metadata from images before they're uploaded. Photos from
// phones and cameras carry EXIF data: where the photo was taken (GPS), when,
// and on what device. Uploaded images are public, so that shouldn't go with
// them.
//
// This edits the file's structure and copies the image data as is, so the
// picture doesn't lose any quality. JPEG, PNG and WebP are handled. Other
// formats (GIF, SVG, ...) don't carry camera data and are left alone.

const ascii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length));

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

class MalformedImage extends Error {}

// ---------- JPEG ----------

// The EXIF orientation (1-8) from an APP1 segment's data, or 1.
function exifOrientation(data: Uint8Array): number {
  if (data.length < 14 || ascii(data, 0, 6) !== "Exif\0\0") return 1;
  const tiff = 6;
  const order = ascii(data, tiff, 2);
  if (order !== "II" && order !== "MM") return 1;
  const little = order === "II";
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const u16 = (at: number) => view.getUint16(at, little);
  const u32 = (at: number) => view.getUint32(at, little);
  if (tiff + 8 > data.length) return 1;
  const ifd = tiff + u32(tiff + 4);
  if (ifd + 2 > data.length) return 1;
  const count = u16(ifd);
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > data.length) return 1;
    // Tag 0x0112 is the orientation, stored as a SHORT.
    if (u16(entry) === 0x0112 && u16(entry + 2) === 3) {
      const value = u16(entry + 8);
      return value >= 1 && value <= 8 ? value : 1;
    }
  }
  return 1;
}

// An APP1 segment holding only the orientation. Without it a phone photo
// taken upright would show up sideways once the rest of the EXIF is gone.
function orientationOnlyExif(orientation: number): Uint8Array {
  // prettier-ignore
  return new Uint8Array([
    0xff, 0xe1, 0x00, 0x22,             // APP1, length 34
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // "Exif\0\0"
    0x4d, 0x4d, 0x00, 0x2a,             // big-endian TIFF header
    0x00, 0x00, 0x00, 0x08,             // first IFD at offset 8
    0x00, 0x01,                         // one entry:
    0x01, 0x12, 0x00, 0x03,             //   orientation, SHORT
    0x00, 0x00, 0x00, 0x01,             //   count 1
    0x00, orientation, 0x00, 0x00,      //   value
    0x00, 0x00, 0x00, 0x00,             // no next IFD
  ]);
}

// Which segments before the image data to keep. Everything else in APP1-APP15
// and comments is metadata: EXIF and XMP (APP1), IPTC/Photoshop (APP13),
// multi-picture info (APP2 "MPF"), and so on.
function keepJpegSegment(marker: number, data: Uint8Array): boolean {
  if (marker === 0xfe) return false; // comment
  if (marker < 0xe0 || marker > 0xef) return true; // not metadata
  if (marker === 0xe0) return true; // JFIF
  if (marker === 0xe2) return ascii(data, 0, 12) === "ICC_PROFILE\0"; // colours
  if (marker === 0xee) return ascii(data, 0, 5) === "Adobe"; // colour transform
  return false;
}

function stripJpeg(bytes: Uint8Array): Uint8Array {
  const kept: Uint8Array[] = [bytes.subarray(0, 2)]; // SOI
  let orientation = 1;
  let afterJfif = 1; // where the orientation segment goes in `kept`
  let pos = 2;

  while (pos < bytes.length) {
    if (bytes[pos] !== 0xff) throw new MalformedImage("expected a marker");
    // Any number of 0xFF fill bytes can come before a marker.
    while (bytes[pos + 1] === 0xff) pos++;
    const marker = bytes[pos + 1];
    if (marker === undefined) throw new MalformedImage("cut off");

    if (marker === 0xd9) {
      // End of image. Anything after it (extra pictures, an embedded motion
      // photo video, ...) is dropped too.
      kept.push(bytes.subarray(pos, pos + 2));
      break;
    }
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      kept.push(bytes.subarray(pos, pos + 2));
      pos += 2;
      continue;
    }

    if (pos + 4 > bytes.length) throw new MalformedImage("cut off");
    const length = (bytes[pos + 2]! << 8) | bytes[pos + 3]!;
    const end = pos + 2 + length;
    if (length < 2 || end > bytes.length) {
      throw new MalformedImage("bad segment length");
    }
    const data = bytes.subarray(pos + 4, end);

    if (marker === 0xda) {
      // Start of scan: the segment, then compressed data up to the next
      // marker. Inside it 0xFF is always followed by 0x00 or a restart marker.
      let scan = end;
      while (scan < bytes.length) {
        if (bytes[scan] === 0xff) {
          const next = bytes[scan + 1];
          if (
            next === 0x00 ||
            (next !== undefined && next >= 0xd0 && next <= 0xd7)
          ) {
            scan += 2;
            continue;
          }
          if (next !== undefined) break;
        }
        scan++;
      }
      kept.push(bytes.subarray(pos, scan));
      pos = scan;
      continue;
    }

    if (marker === 0xe1)
      orientation = Math.max(orientation, exifOrientation(data));
    if (keepJpegSegment(marker, data)) {
      kept.push(bytes.subarray(pos, end));
      if (marker === 0xe0 && kept.length === 2) afterJfif = 2;
    }
    pos = end;
  }

  if (orientation !== 1) {
    kept.splice(afterJfif, 0, orientationOnlyExif(orientation));
  }
  return concat(kept);
}

// ---------- PNG ----------

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
// Text (often XMP or the software and author), EXIF, and the last-modified
// time.
const PNG_METADATA = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"]);

function stripPng(bytes: Uint8Array): Uint8Array {
  const kept: Uint8Array[] = [bytes.subarray(0, 8)];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let pos = 8;
  while (pos < bytes.length) {
    if (pos + 12 > bytes.length) throw new MalformedImage("cut off");
    const length = view.getUint32(pos);
    const type = ascii(bytes, pos + 4, 4);
    const end = pos + 12 + length;
    if (end > bytes.length) throw new MalformedImage("bad chunk length");
    if (!PNG_METADATA.has(type)) kept.push(bytes.subarray(pos, end));
    pos = end;
    if (type === "IEND") break; // drops anything stuck on after the image
  }
  return concat(kept);
}

// ---------- WebP ----------

function stripWebp(bytes: Uint8Array): Uint8Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const riffEnd = Math.min(bytes.length, 8 + view.getUint32(4, true));
  const kept: Uint8Array[] = [];
  let pos = 12;
  while (pos + 8 <= riffEnd) {
    const type = ascii(bytes, pos, 4);
    const size = view.getUint32(pos + 4, true);
    const end = pos + 8 + size + (size % 2); // chunks are padded to even
    if (pos + 8 + size > riffEnd) throw new MalformedImage("bad chunk size");
    if (type !== "EXIF" && type !== "XMP ") {
      const chunk = bytes.slice(pos, Math.min(end, riffEnd));
      // VP8X flags say which chunks exist; clear the EXIF and XMP ones.
      if (type === "VP8X" && chunk.length > 8) chunk[8] = chunk[8]! & ~0x0c;
      kept.push(chunk);
    }
    pos = end;
  }
  const body = concat(kept);
  const header = new Uint8Array(12);
  header.set(bytes.subarray(0, 4), 0); // "RIFF"
  new DataView(header.buffer).setUint32(4, body.length + 4, true);
  header.set(bytes.subarray(8, 12), 8); // "WEBP"
  return concat([header, body]);
}

// ---------- entry points ----------

export type ImageFormat = "jpeg" | "png" | "webp";

// Goes by the file's first bytes, not its name or claimed type.
export function detectImageFormat(bytes: Uint8Array): ImageFormat | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (PNG_SIGNATURE.every((byte, i) => bytes[i] === byte)) return "png";
  if (
    bytes.length >= 12 &&
    ascii(bytes, 0, 4) === "RIFF" &&
    ascii(bytes, 8, 4) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

// The same image without its metadata. Returns the input unchanged if it
// isn't a format we handle, or if it's too damaged to read: such a file isn't
// a normal photo, and refusing it would just block the upload.
export function stripImageMetadata(bytes: Uint8Array): Uint8Array {
  const format = detectImageFormat(bytes);
  try {
    if (format === "jpeg") return stripJpeg(bytes);
    if (format === "png") return stripPng(bytes);
    if (format === "webp") return stripWebp(bytes);
  } catch (error) {
    if (!(error instanceof MalformedImage)) throw error;
    console.warn("Couldn't read this image to remove its metadata:", error);
  }
  return bytes;
}

// For uploads: the file with its metadata removed, same name and type.
export async function withoutImageMetadata(file: File): Promise<File> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const stripped = stripImageMetadata(bytes);
  if (stripped === bytes) return file;
  return new File([stripped as BlobPart], file.name, {
    type: file.type,
    lastModified: file.lastModified,
  });
}
