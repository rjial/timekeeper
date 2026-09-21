import type { NextConfig } from "next";

// GitHub Pages serves a project site from /<repo>, so every asset and link
// needs that prefix. The deploy workflow fills this in; everywhere else it is
// empty and the app sits at the root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Every route here is static and the only backend is Supabase, so the build
  // is a folder of files. Cloudflare Pages serves `out/` directly — no adapter,
  // no server runtime, no cold start before a talk.
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  // /console resolves to /console/index.html on a plain file host.
  trailingSlash: true,
  // The display is judged on screenshots of a full-bleed screen; the dev
  // badge sits exactly where the clock wipe does.
  devIndicators: false,
};

export default nextConfig;
