import type { NextConfig } from "next";

const config: NextConfig = {
  // Complaint photos are plain <img> tags pointing at Vercel Blob in
  // production, or at /api/uploads when running with the local fallback.
  // No next/image remote configuration is required.
};

export default config;
