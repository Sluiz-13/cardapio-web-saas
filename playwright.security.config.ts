import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/security",
  timeout: 30_000,
  fullyParallel: false, // testes seguem ordem: seed → ataques → teardown
  reporter: [["list"]],
  use: {
    baseURL: process.env.TEST_BASE_URL ?? "http://localhost:3000",
  },
});