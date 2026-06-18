import react from "@vitejs/plugin-react";
import { cpSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const siteRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(siteRoot, "..");

function copyFlowSite(): Plugin {
  return {
    name: "copy-flow-site",
    closeBundle() {
      const source = path.join(siteRoot, "flow");
      if (!existsSync(source)) return;
      cpSync(source, path.join(siteRoot, "dist", "flow"), { recursive: true });
    },
  };
}

export default defineConfig({
  root: siteRoot,
  plugins: [react(), copyFlowSite()],
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
