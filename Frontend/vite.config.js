import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "Oceanify: Weather and Wave Application",
        short_name: "Oceanify",
        description: "Your React + Vite web application",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        start_url: "/",
        display: "standalone",
        icons: [
          {
            src: "/oceanify.png",
            sizes: "360x360",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  server: {
    host: true, // or '0.0.0.0'
    port: 5173,
  },
});
