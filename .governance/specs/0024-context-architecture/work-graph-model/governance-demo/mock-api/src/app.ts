// app.ts — rotas Hono da mock API. Contrato mínimo e honesto:
//   GET  /health              — vivo + seed atual
//   GET  /api/shell/state     — AdoptionState completo (mesmo schema do real)
//   POST /api/shell/commands  — { command } → reducer puro do domínio
//   GET  /__seeds             — seeds disponíveis
//   POST /__reset             — { seed? } recarrega a seed (default: blank)
// A mock API valida EXPERIÊNCIA (UX/e2e); nunca conta como governança real.
import { Hono } from "hono";
import { applyShellCommand, type LocalShellCommand } from "../../backend/src/domain/index.ts";
import { emptyDb, openDb } from "./db.ts";
import { buildSeed, seedNames } from "./seeds/index.ts";

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
    const db = await openDb();
    if (db.data.events.some((event) => event.command.id === command.id)) {
      return c.json({ ok: false, error: "duplicate-command" }, 422);
    }
    const result = applyShellCommand(db.data.state, command);
    if (!result.ok) return c.json(result, 422);
    db.data.state = result.state;
    db.data.events.push({ schema: "governance.local-adoption-event/v1", command });
    await db.write();
    return c.json({ ok: true, state: result.state });
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
    const db = await openDb();
    db.data = { ...emptyDb(seedName), state };
    await db.write();
    return c.json({ ok: true, seed: seedName });
  });

  return app;
}
