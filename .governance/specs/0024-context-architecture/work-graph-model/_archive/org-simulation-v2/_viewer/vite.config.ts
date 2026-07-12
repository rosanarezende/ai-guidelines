import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// App de autoria: lê/escreve as Iniciativas via json-server (REST), proxiado em /api.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5174",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
