import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry"
  },
  webServer: {
    command: "rm -rf .next && npm run build && npm run start -- --hostname 127.0.0.1 --port 3100",
    port: 3100,
    reuseExistingServer: false,
    timeout: 180000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
