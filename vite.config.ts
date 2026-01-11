import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react-dom") || id.includes("react-router")) {
                return "vendor-react";
              }
              if (id.includes("@radix-ui")) {
                return "vendor-radix";
              }
              if (id.includes("lucide-react")) {
                return "vendor-icons";
              }
              if (id.includes("@tanstack/react-query")) {
                return "vendor-query";
              }
              if (id.includes("zustand") || id.includes("clsx") || id.includes("tailwind-merge")) {
                return "vendor-utils";
              }
            }
          },
        },
      },
    },
  };
});
