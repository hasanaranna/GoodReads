import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This tells Vite to listen on 0.0.0.0
    port: 5173,
    watch: {
      usePolling: true, // Helps with HMR in Docker/WSL
    },
  },
});
