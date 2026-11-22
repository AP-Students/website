import assert from "node:assert/strict";
import { test } from "node:test";
import {
  detectImageFormat,
  stripImageMetadata,
  withoutImageMetadata,
} from "../src/lib/imageMetadata.ts";

const bytes = (...parts: (number[] | string | Uint8Array)[]) =>
  new Uint8Array(
    parts.flatMap((part) =>
      typeof part === "string"
        ? [...part].map((c) => c.charCodeAt(0))
        : [...part],
    ),
  );
const contains = (haystack: Uint8Array, text: string) =>
  Buffer.from(haystack).includes(Buffer.from(text, "latin1"));

// ---------- JPEG ----------

const segment = (marker: number, data: Uint8Array) =>
  bytes([0xff, marker, (data.length + 2) >> 8, (data.length + 2) & 0xff], data);

// A small EXIF block: orientation (if given) plus a fake GPS entry whose
// value is a recognisable string.
function exif(orientation?: number, order: "II" | "MM" = "II") {
  const little = order === "II";
  const u16 = (n: number) => (little ? [n & 255, n >> 8] : [n >> 8, n & 255]);
  const u32 = (n: number) =>
    little
      ? [n & 255, (n >> 8) & 255, (n >> 16) & 255, n >>> 24]
      : [n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255];
  const entries = [
    ...(orientation
      ? [[...u16(0x0112), ...u16(3), ...u32(1), ...u16(orientation), 0, 0]]
      : []),
    [...u16(0x8825), ...u16(4), ...u32(1), ...u32(0)],
  ];
  return bytes(
    "Exif\0\0",
    order,
    u16(42),
    u32(8),
    u16(entries.length),
    entries.flat(),
    u32(0),
    "GPS 51.5007N 0.1246W",
  );
}

const SOI = [0xff, 0xd8];
const EOI = [0xff, 0xd9];
const JFIF = segment(0xe0, bytes("JFIF\0", [1, 2, 0, 0, 1, 0, 1, 0, 0]));
const ICC = segment(0xe2, bytes("ICC_PROFILE\0", [1, 1], "colour data"));
const ADOBE = segment(0xee, bytes("Adobe", [0, 100, 0, 0, 0, 0, 1]));
const DQT = segment(0xdb, bytes([0], new Array(64).fill(1)));
const SOF = segment(0xc0, bytes([8, 0, 16, 0, 16, 1, 1, 0x11, 0]));
const DHT = segment(0xc4, bytes([0], new Array(16).fill(0)));
// Scan data containing a stuffed 0xFF 0x00 and a restart marker, which must
// not be mistaken for the end of the scan.
const SCAN = bytes(
  segment(0xda, bytes([1, 1, 0, 0, 63, 0])),
  [0x12, 0xff, 0x00, 0x34, 0xff, 0xd0, 0x56, 0x78],
);

const XMP = segment(
  0xe1,
  bytes("http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>Author: Jo</x:xmpmeta>"),
);
const IPTC = segment(0xed, bytes("Photoshop 3.0\0", "8BIM city: Paris"));
const COMMENT = segment(0xfe, bytes("taken at home"));
const MPF = segment(0xe2, bytes("MPF\0", "multi picture index"));

const image = (...extra: Uint8Array[]) =>
  bytes(SOI, JFIF, ...extra, ICC, ADOBE, DQT, SOF, DHT, SCAN, EOI);
const clean = bytes(SOI, JFIF, ICC, ADOBE, DQT, SOF, DHT, SCAN, EOI);

test("EXIF (with GPS), XMP, IPTC, comments and MPF come out of a JPEG", () => {
  const photo = image(segment(0xe1, exif()), XMP, IPTC, COMMENT, MPF);
  const out = stripImageMetadata(photo);
  for (const text of [
    "GPS 51.5007N",
    "Author: Jo",
    "city: Paris",
    "taken at home",
    "multi picture",
  ]) {
    assert.ok(contains(photo, text));
    assert.ok(!contains(out, text), text);
  }
  // Everything else is there, byte for byte and in order.
  assert.deepEqual(out, clean);
});

test("a sideways phone photo keeps just its orientation", () => {
  for (const order of ["II", "MM"] as const) {
    const out = stripImageMetadata(image(segment(0xe1, exif(6, order))));
    assert.ok(!contains(out, "GPS"));
    const orientationOnly = bytes(
      [0xff, 0xe1, 0x00, 0x22],
      "Exif\0\0MM",
      [
        0, 42, 0, 0, 0, 8, 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, 6, 0, 0, 0, 0,
        0, 0,
      ],
    );
    // Right after JFIF, where viewers look for it.
    assert.deepEqual(
      out,
      bytes(SOI, JFIF, orientationOnly, clean.subarray(2 + JFIF.length)),
    );
  }
});

test("an upright photo gets no EXIF at all", () => {
  assert.deepEqual(stripImageMetadata(image(segment(0xe1, exif(1)))), clean);
});

test("EXIF before JFIF is handled too", () => {
  const photo = bytes(
    SOI,
    segment(0xe1, exif(8)),
    JFIF,
    ICC,
    ADOBE,
    DQT,
    SOF,
    DHT,
    SCAN,
    EOI,
  );
  const out = stripImageMetadata(photo);
  assert.ok(!contains(out, "GPS"));
  assert.deepEqual(out.subarray(0, 2 + JFIF.length), bytes(SOI, JFIF));
  assert.equal(out[2 + JFIF.length + 1], 0xe1);
});

test("extra images and video after the end of the JPEG are dropped", () => {
  // Phones add a second picture (depth map, HDR) or a motion photo video
  // after the main image, and those carry their own EXIF.
  const trailer = bytes(
    SOI,
    segment(0xe1, exif()),
    "...",
    EOI,
    "ftypmp4 video",
  );
  const out = stripImageMetadata(bytes(image(MPF), trailer));
  assert.deepEqual(out, clean);
});

test("progressive JPEGs keep every scan", () => {
  const twoScans = bytes(SOI, JFIF, DQT, SOF, DHT, SCAN, DHT, SCAN, EOI);
  const withExif = bytes(
    SOI,
    JFIF,
    segment(0xe1, exif()),
    DQT,
    SOF,
    DHT,
    SCAN,
    DHT,
    SCAN,
    EOI,
  );
  assert.deepEqual(stripImageMetadata(withExif), twoScans);
});

test("fill bytes before a marker are fine", () => {
  const photo = bytes(
    SOI,
    [0xff, 0xff],
    JFIF,
    segment(0xe1, exif()),
    DQT,
    SOF,
    DHT,
    SCAN,
    EOI,
  );
  assert.ok(!contains(stripImageMetadata(photo), "GPS"));
});

test("a damaged JPEG is uploaded as it is rather than blocked", () => {
  const warn = console.warn;
  console.warn = () => {};
  try {
    for (const broken of [
      bytes(SOI, [0xff, 0xe1, 0xff, 0xff], "short"), // length past the end
      bytes(SOI, [0x00, 0x01]), // not a marker
      bytes(SOI, [0xff, 0xe1, 0x00]), // cut off
    ]) {
      assert.equal(stripImageMetadata(broken), broken);
    }
  } finally {
    console.warn = warn;
  }
});

// ---------- PNG ----------

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const chunk = (type: string, data: Uint8Array | string = "") => {
  const body = typeof data === "string" ? bytes(data) : data;
  const length = body.length;
  return bytes(
    [length >>> 24, (length >> 16) & 255, (length >> 8) & 255, length & 255],
    type,
    body,
    [1, 2, 3, 4], // CRC, not checked
  );
};

test("text, EXIF and timestamps come out of a PNG", () => {
  const ihdr = chunk("IHDR", bytes([0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]));
  const srgb = chunk("sRGB", bytes([0]));
  const idat = chunk("IDAT", "pixels");
  const iend = chunk("IEND");
  const png = bytes(
    PNG_SIG,
    ihdr,
    chunk("tEXt", "Author\0Jo"),
    srgb,
    chunk("iTXt", "XML:com.adobe.xmp\0\0\0\0\0<gps/>"),
    chunk("zTXt", "Comment\0\0compressed"),
    chunk("eXIf", exif()),
    chunk("tIME", bytes([7, 234, 11, 21, 12, 0, 0])),
    idat,
    iend,
    "data stuck on the end",
  );
  const out = stripImageMetadata(png);
  assert.deepEqual(out, bytes(PNG_SIG, ihdr, srgb, idat, iend));
});

// ---------- WebP ----------

const riffChunk = (type: string, data: Uint8Array | string) => {
  const body = typeof data === "string" ? bytes(data) : data;
  const size = body.length;
  return bytes(
    type,
    [size & 255, (size >> 8) & 255, (size >> 16) & 255, size >>> 24],
    body,
    size % 2 ? [0] : [],
  );
};
const riff = (...chunks: Uint8Array[]) => {
  const body = bytes(...chunks);
  const size = body.length + 4;
  return bytes(
    "RIFF",
    [size & 255, (size >> 8) & 255, (size >> 16) & 255, size >>> 24],
    "WEBP",
    body,
  );
};

test("EXIF and XMP come out of a WebP, and its header is fixed up", () => {
  // VP8X flags: ICC (0x20), EXIF (0x08), XMP (0x04).
  const vp8x = (flags: number) =>
    riffChunk("VP8X", bytes([flags, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
  const icc = riffChunk("ICCP", "colour");
  const pixels = riffChunk("VP8 ", "frame data!"); // odd length, padded
  const webp = riff(
    vp8x(0x2c),
    icc,
    pixels,
    riffChunk("EXIF", exif()),
    riffChunk("XMP ", "<gps/>"),
  );
  const out = stripImageMetadata(webp);
  assert.deepEqual(out, riff(vp8x(0x20), icc, pixels));
  assert.ok(!contains(out, "GPS"));
});

// ---------- everything else ----------

test("formats are told apart by their contents, not their names", () => {
  assert.equal(detectImageFormat(clean), "jpeg");
  assert.equal(detectImageFormat(bytes(PNG_SIG, chunk("IEND"))), "png");
  assert.equal(detectImageFormat(riff()), "webp");
  assert.equal(detectImageFormat(bytes("GIF89a")), null);
  assert.equal(detectImageFormat(bytes("<svg/>")), null);
});

test("other files are left exactly as they are", () => {
  for (const other of [
    bytes("GIF89a..."),
    bytes("<svg></svg>"),
    bytes("%PDF-1.7"),
    bytes(),
  ]) {
    assert.equal(stripImageMetadata(other), other);
  }
});

test("the uploaded file keeps its name and type", async () => {
  const photo = new File(
    [image(segment(0xe1, exif())) as BlobPart],
    "holiday.jpg",
    { type: "image/jpeg" },
  );
  const out = await withoutImageMetadata(photo);
  assert.equal(out.name, "holiday.jpg");
  assert.equal(out.type, "image/jpeg");
  assert.deepEqual(new Uint8Array(await out.arrayBuffer()), clean);

  const svg = new File(["<svg/>"], "logo.svg", { type: "image/svg+xml" });
  assert.equal(await withoutImageMetadata(svg), svg);
});
