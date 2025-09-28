import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repo = "CAMPUS_BUDDY"; // GitHub Pages repo name (owner.github.io/<repo>)
// Explicit toggle for GitHub Pages static export. Set this to "true" only for Pages builds.
const isGitHubPages = process.env.NEXT_PUBLIC_GH_PAGES === "true";

const nextConfig: NextConfig = {
  // Only export statically when targeting GitHub Pages. On Vercel this must be undefined.
  ...(isGitHubPages ? { output: "export" as const } : {}),
  images: { unoptimized: !!isGitHubPages },
  trailingSlash: !!isGitHubPages,
  // Serve from subpath only for GitHub Pages
  basePath: isGitHubPages ? `/${repo}` : undefined,
  assetPrefix: isGitHubPages ? `/${repo}/` : undefined,
  // Keep builds resilient across environments
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
