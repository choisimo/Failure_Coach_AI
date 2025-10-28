import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { fileURLToPath } from "node:url";

// https://vitejs.dev/config/
export default defineConfig((configEnv) => {
  const homepage = process.env.npm_package_homepage || "/";
  const url = new URL(homepage, "https://placeholder.local");
  const buildBase = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  const base = configEnv.command === "build" ? buildBase : "/";

  return {
    base,
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./src"),
      },
    },
  };
});
