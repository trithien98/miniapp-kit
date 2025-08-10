import { defineConfig } from "vite";

// Build the miniapp bundle at a stable path: /assets/index.js
export default defineConfig({
  build: {
    rollupOptions: {
      input: "index.html",
      output: {
        entryFileNames: "assets/index.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
