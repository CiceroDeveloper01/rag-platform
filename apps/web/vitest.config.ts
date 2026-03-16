import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json-summary"],
      thresholds: {
        statements: 80,
        lines: 80,
        functions: 80,
        branches: 75,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "@rag-platform/contracts": path.resolve(
        __dirname,
        "../../packages/contracts/src/index.ts",
      ),
      "@rag-platform/types": path.resolve(
        __dirname,
        "../../packages/types/src/index.ts",
      ),
      "@rag-platform/utils": path.resolve(
        __dirname,
        "../../packages/utils/src/index.ts",
      ),
    },
  },
});
