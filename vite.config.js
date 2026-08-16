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
      injectRegister: "auto",
      manifest: {
        name: "HTTI Studio",
        short_name: "HTTI Studio",
        description: "Turn text into cards people actually use",
        theme_color: "#3D5AFE",
        background_color: "#FFFFFF",
        display: "standalone",
        start_url: "/home",
        icons: [
          {
            src: "/android-icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/ms-icon-144x144.png",
            sizes: "144x144",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
