import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// App da org: o frontend (vite, 5179) fala com o backend FINO (server.ts, 5180) via /api.
// O server lê/grava os arquivos .governance/ pela _lib — NÃO há banco paralelo nem modelo próprio.
export default defineConfig({
  server: {
    port: 5179,
    proxy: {
      "/api": { target: "http://localhost:5180", changeOrigin: true },
    },
  },
  plugins: [react()],
});
