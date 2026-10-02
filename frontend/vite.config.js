import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Optional: "@" points to src folder for absolute imports
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173, // default dev server port
  },
});
