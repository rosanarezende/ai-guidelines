import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// App só de leitura: renderiza o snapshot DERIVADO (gerado pelo banco em public/snapshot.json).
export default defineConfig({
  plugins: [react()],
});
