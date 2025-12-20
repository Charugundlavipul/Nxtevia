import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Standalone client config
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: "dist",
  },
  publicDir: path.resolve(__dirname, "public"),
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
}));
