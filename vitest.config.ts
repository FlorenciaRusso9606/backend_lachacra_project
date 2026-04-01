import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
   globalSetup: ["./test/setup/global-setup.ts"],
    setupFiles: ["./test/setup/setup-env.ts"],
   pool: 'forks',
    maxWorkers: 1,
   
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@test": path.resolve(__dirname, "./test"),
    },
  },
});