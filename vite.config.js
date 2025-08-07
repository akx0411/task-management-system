import {fileURLToPath, URL} from "node:url";

import {defineConfig} from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@/services": fileURLToPath(new URL("./src/services", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/auth": "http://localhost:4000",
      "/fsm/event": "http://localhost:4000",
      "/fsm/state": "http://localhost:4000",
    },
  },
});
