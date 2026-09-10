import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(rootDir, "web"),
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@shared": path.join(rootDir, "shared"),
    },
  },
  build: {
    outDir: path.join(rootDir, "web", "dist"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    fs: { allow: [rootDir] },
    proxy: {
      "/api": "http://127.0.0.1:3780",
    },
  },
});
