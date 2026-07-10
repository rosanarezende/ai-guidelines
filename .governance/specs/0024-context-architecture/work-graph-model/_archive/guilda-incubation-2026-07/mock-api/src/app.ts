// app.ts — rotas Hono da mock API. Contrato mínimo e honesto:
//   GET  /health              — vivo + seed atual
//   GET  /api/shell/state     — AdoptionState completo (mesmo schema do real)
//   POST /api/shell/commands  — { command } → reducer puro do domínio
//   GET  /__seeds             — seeds disponíveis
//   POST /__reset             — { seed? } recarrega a seed (default: blank)
// A mock API valida EXPERIÊNCIA (UX/e2e); nunca conta como governança real.
import { Hono } from "hono";
import { applyAuthorizedShellCommand, type LocalShellCommand } from "@demo/domain";
import { emptyDb, openDb, writeDb } from "./db.ts";
import { buildSeed, seedNames } from "@demo/test-fixtures";

export function createMockApp(): Hono {
  const app = new Hono();

  app.get("/health", async (c) => {
    const db = await openDb();
    return c.json({ ok: true, service: "governance-mock-api", seed: db.data.seed });
  });

  app.get("/api/shell/state", async (c) => {
    const db = await openDb();
    return c.json(db.data.state);
  });

  app.post("/api/shell/commands", async (c) => {
    const body = (await c.req.json().catch(() => null)) as {
      command?: LocalShellCommand;
    } | null;
    const command = body?.command;
    if (!command?.id || !command.type) {
      return c.json({ ok: false, error: "command-schema" }, 400);
    }
    const response = await writeDb((db) => {
      if (db.data.events.some((event) => event.command.id === command.id)) {
        return { status: 422, body: { ok: false, error: "duplicate-command" } };
      }
      const result = applyAuthorizedShellCommand(db.data.state, command);
      if (!result.ok) return { status: 422, body: result };
      db.data.state = result.state;
      db.data.events.push({ schema: "governance.local-adoption-event/v1", command });
      return { status: 200, body: { ok: true, state: result.state } };
    });
    if (response.status === 422) return c.json(response.body, 422);
    return c.json(response.body);
  });

  app.get("/__seeds", (c) => c.json({ seeds: seedNames() }));

  app.post("/__reset", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { seed?: string };
    const seedName = body.seed || "blank";
    const state = buildSeed(seedName);
    if (!state) {
      return c.json(
        { ok: false, error: `seed desconhecida: ${seedName}`, seeds: seedNames() },
        400
      );
    }
    await writeDb((db) => {
      db.data = { ...emptyDb(seedName), state };
    });
    return c.json({ ok: true, seed: seedName });
  });

  return app;
}
