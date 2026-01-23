import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
// @ts-expect-error process is a nodejs global
const isMobile = process.env.TAURI_ENV_PLATFORM === 'ios' || process.env.TAURI_ENV_PLATFORM === 'android';

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    // For mobile development, bind to all interfaces if TAURI_DEV_HOST not set
    host: host || (isMobile ? '0.0.0.0' : false),
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : isMobile
        ? {
            protocol: "ws",
            host: '0.0.0.0',
            port: 1421,
          }
        : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
