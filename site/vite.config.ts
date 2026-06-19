import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const siteRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(siteRoot, "..");

export default defineConfig({
  root: siteRoot,
  plugins: [react()],
  resolve: {
    alias: {
      "@app": path.resolve(siteRoot, "src/app"),
      "@assets": path.resolve(siteRoot, "src/assets"),
      "@content": path.resolve(siteRoot, "src/content"),
      "@features": path.resolve(siteRoot, "src/features"),
      "@generated": path.resolve(siteRoot, "src/generated"),
      "@pages": path.resolve(siteRoot, "src/pages"),
      "@shared": path.resolve(siteRoot, "src/shared"),
    },
  },
  server: {
    fs: {
      allow: [repoRoot],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
