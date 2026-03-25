import { defineConfig } from "vitest/config";

/**
 * Defines the unit test and coverage configuration.
 *
 * @returns Vitest configuration for the service scaffold.
 */
export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "extensions/dip/src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/server.ts",
        "src/types/**/*.ts",
        "extensions/dip/src/**/*.test.ts"
      ],
      reporter: ["text", "html"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90
      }
    }
  }
});
