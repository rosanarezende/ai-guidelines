// dev-app.ts — desenvolvimento em modo mock (QRD-01 development:mock).
// Sobe a mock API in-process e o app Next com GOVERNANCE_DATA_SOURCE=mock-api.
// Portável (Windows/POSIX): env é definida aqui, não por sintaxe de shell.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { createMockApp } from "./app.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(here, "..", "..", "frontend");
const port = Number(process.env.GOVERNANCE_MOCK_API_PORT || 3025);

serve({ fetch: createMockApp().fetch, port, hostname: "127.0.0.1" }, (info) => {
  console.log(`✓ mock-api em http://127.0.0.1:${info.port} — experiência, não governança`);
  const child = spawn("npm", ["run", "dev"], {
    cwd: frontendDir,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      GOVERNANCE_DATA_SOURCE: "mock-api",
      GOVERNANCE_API_BASE_URL: `http://127.0.0.1:${info.port}`,
      GOVERNANCE_APP_ENV: "development",
    },
  });
  child.on("exit", (code) => process.exit(code ?? 0));
});
