import type { NextConfig } from "next";

// Base path for GitHub Pages project sites (e.g. "/aparcagratis"). Empty for
// local dev or root deployments. Provided by the CI workflow at build time.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  // Fully static site — no server runtime. Outputs to ./out for GitHub Pages.
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  // Hide the dev tools indicator: it overlaps the mobile bottom shortcut bar.
  devIndicators: false,
};

export default nextConfig;
