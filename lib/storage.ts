import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { HttpError } from "./api";
import { ALLOWED_PHOTO_TYPES, MAX_PHOTO_BYTES } from "./constants";

/** Where the development fallback keeps uploaded photos. */
export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".uploads");

function extensionFor(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

/**
 * Stores a complaint photo and returns the URL it will be served from.
 *
 * Production uses Vercel Blob. Without BLOB_READ_WRITE_TOKEN the file is
 * written to .uploads/ and served back through /api/uploads, so the app runs
 * locally with no third-party account. That fallback is development-only:
 * serverless filesystems are ephemeral and do not survive a redeploy.
 */
export async function saveComplaintPhoto(file: File): Promise<string> {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    throw new HttpError(415, "Photo must be a JPEG, PNG or WebP image.");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new HttpError(413, "Photo must be 5 MB or smaller.");
  }

  const name = `${randomUUID()}.${extensionFor(file.type)}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`complaints/${name}`, file, { access: "public", contentType: file.type });
    return blob.url;
  }

  const target = path.join(LOCAL_UPLOAD_DIR, name);
  await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  await writeFile(target, Buffer.from(await file.arrayBuffer()));
  return `/api/uploads/${name}`;
}
