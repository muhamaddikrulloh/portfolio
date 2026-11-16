import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => {
  if (command === "build") {
    process.env.NODE_ENV = "production";
  }

  return {
    publicDir: "public",
    experimental: {
      renderBuiltUrl(filename, { type }) {
        if (type === "public") return `/${filename}`;
      },
    },
    plugins: [
      laravel({
        input: ["resources/css/app.css", "resources/js/app.tsx"],
        refresh: true,
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@/shims": path.resolve(dirname, "resources/js/shims"),
        "@": path.resolve(dirname, "src"),
        "next/navigation": path.resolve(dirname, "resources/js/shims/navigation.ts"),
        "next/link": path.resolve(dirname, "resources/js/shims/link.tsx"),
        "next/dynamic": path.resolve(dirname, "resources/js/shims/dynamic.tsx"),
        "next/image": path.resolve(dirname, "resources/js/shims/image.tsx"),
      },
    },
    build: {
      copyPublicDir: false,
      target: "es2022",
      chunkSizeWarningLimit: 1200,
    },
  };
});
