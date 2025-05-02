import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from 'url'; // Import fileURLToPath

const __filename = fileURLToPath(import.meta.url); // Get current file path
const __dirname = path.dirname(__filename); // Get current directory path

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"), // Use standard __dirname
      "@shared": path.resolve(__dirname, "shared"), // Use standard __dirname
      "@assets": path.resolve(__dirname, "attached_assets"), // Use standard __dirname
    },
  },
  root: path.resolve(__dirname, "client"), // Use standard __dirname
  build: {
    outDir: path.resolve(__dirname, "dist/public"), // Use standard __dirname
    emptyOutDir: true,
  },
});
