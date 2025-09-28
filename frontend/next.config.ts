import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repo = "CAMPUS_BUDDY"; // GitHub Pages repo name (owner.github.io/<repo>)

const nextConfig: NextConfig = {
  output: "export", // static export for GitHub Pages
  images: { unoptimized: true }, // no image optimization on Pages
  trailingSlash: true, // so routes map to folder/index.html
  // Serve from subpath only in production (GitHub Pages)
  basePath: isProd ? `/${repo}` : undefined,
  assetPrefix: isProd ? `/${repo}/` : undefined,
};

export default nextConfig;
