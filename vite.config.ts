import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
  css: {
    // Tailwind is handled by the Vite plugin above. Pin an explicit (empty)
    // PostCSS config so Vite doesn't walk up to a stray config on the drive root.
    postcss: {},
  },
});
