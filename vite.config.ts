import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
  },
});
