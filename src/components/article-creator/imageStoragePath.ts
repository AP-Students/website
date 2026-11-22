// Where an uploaded article image is stored in Firebase Storage.
//
// The time alone isn't enough to keep paths apart: one paste from Google Docs
// can hold several images, they upload at the same moment, and they're all
// called pasted-image.png. Two uploads on the same path means the second
// replaces the first, so both blocks show the same picture (and deleting one
// deletes the other's file). The random part prevents that.
export function imageStoragePath(fileName: string, now = Date.now()): string {
  const random = Array.from(crypto.getRandomValues(new Uint8Array(6)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  // The name stays at the end, since the renderer checks for ".svg".
  return `images/${now}_${random}_${fileName}`;
}
