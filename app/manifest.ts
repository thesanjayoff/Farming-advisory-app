import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vayal Thunai — வயல் துணை — Farming Advisory",
    short_name: "Vayal Thunai",
    description:
      "Tamil-first farming advisory: weather alerts, mandi prices, crop calendar, farm diary and a voice assistant grounded in approved sources.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f5f4",
    theme_color: "#0f5132",
    lang: "ta",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
