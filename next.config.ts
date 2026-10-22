import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Fotos subidas al Storage de Supabase
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
    // Solo para pruebas locales sin Supabase en la nube
    unoptimized: process.env.IMAGES_UNOPTIMIZED === "1",
  },
};

export default nextConfig;
