/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { NextRequest, NextResponse } from "next/server";
import { authenticate, jsonError, requireScopedCourse } from "@/lib/mcpApi";
import { getAdminDb, getAdminStorage } from "@/lib/mcpAdmin";

const MAX_ASSET_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);

function signatureMatches(type: string, bytes: Uint8Array) {
  if (type === "image/png") return bytes.length >= 8 && bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/gif") return new TextDecoder().decode(bytes.slice(0, 6)) === "GIF87a" || new TextDecoder().decode(bytes.slice(0, 6)) === "GIF89a";
  if (type === "image/webp") return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (type === "image/svg+xml") { const text = new TextDecoder().decode(bytes.slice(0, 200_000)); return /<svg[\s>]/i.test(text) && !/<script|xlink:href\s*=\s*["']https?:/i.test(text); }
  return false;
}

async function loadImport(request: NextRequest, id: string) {
  const auth = await authenticate(request);
  if (auth instanceof NextResponse) return { auth };
  const snap = await getAdminDb().doc(`mcpImports/${id}`).get();
  const data = snap.data();
  if (!snap.exists || !data || data.ownerUid !== auth.uid) return { auth: jsonError(404, "IMPORT_NOT_FOUND", "Import not found.") };
  const scopeError = requireScopedCourse(auth, data.destination?.subjectSlug);
  if (scopeError) return { auth: scopeError };
  return { auth, data };
}

export async function PUT(request: NextRequest, { params }: { params: { id: string; assetId: string } }) {
  const loaded = await loadImport(request, params.id);
  if (loaded.auth instanceof NextResponse) return loaded.auth;
  const contentType = request.headers.get("content-type")?.split(";", 1)[0] ?? "application/octet-stream";
  if (!ALLOWED_TYPES.has(contentType)) return jsonError(415, "UNSUPPORTED_IMAGE", "Only PNG, JPEG, WebP, GIF, and SVG images are accepted.");
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > MAX_ASSET_BYTES) return jsonError(413, "IMAGE_TOO_LARGE", "Images must be 5 MiB or smaller.");
  if (bytes.byteLength === 0) return jsonError(422, "EMPTY_IMAGE", "The uploaded image is empty.");
  if (!signatureMatches(contentType, bytes)) return jsonError(422, "INVALID_IMAGE", "The bytes do not match the declared image type.");
  const path = `mcp-assets/${loaded.auth.uid}/${params.id}/${params.assetId}`;
  await getAdminStorage().bucket().file(path).save(bytes, { resumable: false, metadata: { contentType, cacheControl: "private, no-store" } });
  await getAdminDb().doc(`contentAssets/${params.id}_${params.assetId}`).set({ importId: params.id, assetId: params.assetId, ownerUid: loaded.auth.uid, path, contentType, size: bytes.byteLength, createdAt: new Date() });
  return NextResponse.json({ assetId: params.assetId, size: bytes.byteLength, contentType }, { status: 201 });
}

export async function GET(request: NextRequest, { params }: { params: { id: string; assetId: string } }) {
  const loaded = await loadImport(request, params.id);
  if (loaded.auth instanceof NextResponse) return loaded.auth;
  const asset = (await getAdminDb().doc(`contentAssets/${params.id}_${params.assetId}`).get()).data();
  if (!asset || asset.ownerUid !== loaded.auth.uid) return jsonError(404, "ASSET_NOT_FOUND", "Asset not found.");
  const [bytes] = await getAdminStorage().bucket().file(asset.path).download();
  return new NextResponse(bytes as unknown as BodyInit, { headers: { "Content-Type": asset.contentType, "Cache-Control": "private, no-store" } });
}
