import { defineConfig } from "vite";
import path from "path";
import reactRefresh from "@vitejs/plugin-react-refresh";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), reactRefresh()],
  server: {
    proxy: {
      "/api": "http://localhost:1337",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@layout": path.resolve(__dirname, "./src/components/layout"),
      "@pages": path.resolve(__dirname, "./src/components/pages"),
      "@auth": path.resolve(__dirname, "./src/components/auth"),
    },
  },
});
