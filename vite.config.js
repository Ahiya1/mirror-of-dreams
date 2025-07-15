import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3002,
    proxy: {
      "/api": {
        target: process.env.VITE_API_TARGET || "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    // Single entry point - much cleaner!
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
    },
  },
  base: "./",
});
