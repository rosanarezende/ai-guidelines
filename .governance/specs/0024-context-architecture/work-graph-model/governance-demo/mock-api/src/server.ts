// server.ts — entrypoint da mock API (Node >= 22.18 roda .ts nativo).
// Porta: GOVERNANCE_MOCK_API_PORT (default 3025), somente loopback.
import { serve } from "@hono/node-server";
import { createMockApp } from "./app.ts";

const port = Number(process.env.GOVERNANCE_MOCK_API_PORT || 3025);

serve({ fetch: createMockApp().fetch, port, hostname: "127.0.0.1" }, (info) => {
  console.log(`✓ governance mock-api em http://127.0.0.1:${info.port} (lowdb em .data/db.json)`);
  console.log("  mock-api valida experiência, não governança real");
});
