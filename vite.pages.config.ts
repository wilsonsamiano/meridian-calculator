import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: process.env.ANDROID_APK === "1" ? "./" : "/meridian-calculator/",
  root: fileURLToPath(new URL("./pages-host", import.meta.url)),
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: fileURLToPath(new URL("./.output/public", import.meta.url)),
    emptyOutDir: true,
  },
});
