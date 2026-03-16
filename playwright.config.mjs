import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: /capture\.spec\.mjs/,
  timeout: 45_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
  },
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:4173",
    timeout: 30_000,
    reuseExistingServer: false,
  },
});
