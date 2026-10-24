import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development, /api (including WebSockets) is proxied to `wrangler dev` in voedgoem-server.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": { target: "http://localhost:8787", ws: true, changeOrigin: true } } }
});
