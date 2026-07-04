// playwright.config.ts — e2e da governance-demo (QRD-06).
// Sobe mock-api (Hono+lowdb) + Next em modo mock; cada teste reseta a seed.
import { defineConfig } from "@playwright/test";

const MOCK_API_PORT = 3025;
const APP_PORT = 3024;

export const MOCK_API_URL = `http://127.0.0.1:${MOCK_API_PORT}`;

export default defineConfig({
  testDir: "./journeys",
  timeout: 60_000,
  retries: 0,
  workers: 1, // estado compartilhado (lowdb): jornadas rodam em série
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm --workspace acme-governance-mock-api run dev",
      cwd: "../../../../../..",
      url: `${MOCK_API_URL}/health`,
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: "npm --workspace acme-governance-next-app run dev",
      cwd: "../../../../../..",
      url: `http://127.0.0.1:${APP_PORT}`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        GOVERNANCE_DATA_SOURCE: "mock-api",
        GOVERNANCE_API_BASE_URL: MOCK_API_URL,
        GOVERNANCE_APP_ENV: "test",
      },
    },
  ],
});
