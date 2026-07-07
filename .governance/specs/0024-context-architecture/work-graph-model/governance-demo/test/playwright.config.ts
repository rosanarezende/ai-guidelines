// playwright.config.ts — e2e da governance-demo (QRD-06).
// Sobe mock-api (Hono+lowdb) + Next em modo mock; cada teste reseta a seed.
import { defineConfig } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MOCK_API_PORT = 3025;
const APP_PORT = 3024;
const REUSE_EXISTING_SERVER = process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === "1";
const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_STATE_DIR = path.join(TEST_DIR, "reports", "local-state", String(process.pid));

export const MOCK_API_URL = `http://127.0.0.1:${MOCK_API_PORT}`;

export default defineConfig({
  testDir: "./journeys",
  timeout: 60_000,
  expect: {
    timeout: 2_000,
  },
  retries: 0,
  workers: 1, // estado compartilhado (lowdb): jornadas rodam em série
  reporter: [
    ["list"],
    ["html", { outputFolder: "reports/html", open: "never" }],
    ["json", { outputFile: "reports/results.json" }],
    ["junit", { outputFile: "reports/results.xml" }],
  ],
  use: {
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    actionTimeout: 2_000,
    navigationTimeout: 15_000,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm --workspace acme-governance-mock-api run dev",
      cwd: "../../../../../..",
      url: `${MOCK_API_URL}/health`,
      reuseExistingServer: REUSE_EXISTING_SERVER,
      timeout: 30_000,
    },
    {
      command: "npm --workspace acme-governance-next-app run dev",
      cwd: "../../../../../..",
      url: `http://127.0.0.1:${APP_PORT}`,
      reuseExistingServer: REUSE_EXISTING_SERVER,
      timeout: 120_000,
      env: {
        GOVERNANCE_DATA_SOURCE: "mock-api",
        GOVERNANCE_API_BASE_URL: MOCK_API_URL,
        GOVERNANCE_APP_ENV: "test",
        GOVERNANCE_LOCAL_STATE_DIR: LOCAL_STATE_DIR,
      },
    },
  ],
});
