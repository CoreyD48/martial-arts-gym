import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
    resolveAlias: {
      // Map the bare CSS import to the actual tailwindcss package path.
      // Turbopack resolves @import "tailwindcss" in CSS from the wrong workspace
      // root (/Users/Opichi) when a package-lock.json exists there. This alias
      // forces resolution from the project's own node_modules.
      tailwindcss: path.resolve(__dirname, "node_modules/tailwindcss"),
    },
  },
};

export default nextConfig;
