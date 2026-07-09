import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Reference-image upload for booking intake.
//
// MVP storage: files are written to /public/uploads on local disk (persisted via
// a Docker volume). This is fine for a single-instance deploy. For production /
// multi-instance hosting, swap this for object storage (S3, Vercel Blob, R2) —
// see TODO "production file storage". The public site only exposes the random
// filename, never the original path.

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use JPG, PNG, WEBP or HEIC." },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 8 MB)." },
      { status: 413 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const name = `${randomUUID()}.${EXT[file.type] ?? "bin"}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), bytes);

  return NextResponse.json({
    url: `/uploads/${name}`,
    fileName: file.name.slice(0, 200),
    mimeType: file.type,
    sizeBytes: file.size,
  });
}

// Guard against very large multipart bodies buffering.
export const runtime = "nodejs";
