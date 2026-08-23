import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { handleError } from "@/lib/api";
import { LOCAL_UPLOAD_DIR } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};

/**
 * Serves photos stored by the development fallback in lib/storage.ts.
 * In production photos live on Vercel Blob and never reach this route.
 */
export async function GET(_request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  try {
    await requireApiUser();
    const { path: segments } = await ctx.params;

    // Flatten to a bare filename so no path segment can escape the directory.
    const name = path.basename(segments.at(-1) ?? "");
    const extension = path.extname(name).toLowerCase();
    if (!CONTENT_TYPES[extension]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const file = await readFile(path.join(LOCAL_UPLOAD_DIR, name)).catch(() => null);
    if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": CONTENT_TYPES[extension],
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
