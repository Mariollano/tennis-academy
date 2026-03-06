import { defineConfig } from "vitest/config";
import path from "path";
import { loadEnv } from "vite";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig(({ mode }) => {
  // Load .env so secrets are available in vitest
  const env = loadEnv(mode ?? "test", templateRoot, "");
  return {
    root: templateRoot,
    resolve: {
      alias: {
        "@": path.resolve(templateRoot, "client", "src"),
        "@shared": path.resolve(templateRoot, "shared"),
        "@assets": path.resolve(templateRoot, "attached_assets"),
      },
    },
    test: {
      environment: "node",
      include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
      env,
    },
  };
});
