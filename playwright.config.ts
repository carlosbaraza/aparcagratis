import { defineConfig, devices } from "@playwright/test";

const PORT = 3123;
const BASE = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec next dev -p ${PORT} -H 127.0.0.1`,
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
