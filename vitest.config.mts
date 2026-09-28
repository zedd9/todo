import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    globals: true,
    hookTimeout: 60000,
    testTimeout: 30000,
    setupFiles: ["./tests/setup.ts"],
  },
});
