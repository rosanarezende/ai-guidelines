import { DiagnoseDriftCommand } from "./DiagnoseDriftCommand.js";
import { Command, CommandContext, Logger } from "../Command.js";
import {
  ListActiveSpecsResult,
  ResolvedActiveSpec,
} from "../../../app/workflow/ListActiveSpecs.js";
import { ActiveSpecEntry } from "../../../domain/workflow/ActiveSpecEntry.js";

function capturingLogger(): { logger: Logger; infos: string[] } {
  const infos: string[] = [];
  return { logger: { info: (m) => infos.push(m), error: () => {} }, infos };
}

function entry(over: Partial<ActiveSpecEntry> = {}): ActiveSpecEntry {
  return {
    id: "0024",
    slug: "context-architecture",
    branch: "feat/spec-0024-context-architecture",
    stage: "implementation",
    status: "active",
    specPath: ".governance/specs/0024-context-architecture",
    updatedAt: "2026-06-04T00:00:00Z",
    ...over,
  };
}

function resolved(over: Partial<ActiveSpecEntry>, specPathExists: boolean): ResolvedActiveSpec {
  return { entry: entry(over), specPathExists };
}

function context(logger: Logger): CommandContext {
  return { repoRoot: "/repo", logger };
}

describe("DiagnoseDriftCommand (`drift`) — migração read-only do diagnose-drift", () => {
  it("DADO índice ausente QUANDO run ENTÃO informa ausência + dica de publish-state e exitCode 0", async () => {
    const result: ListActiveSpecsResult = { indexAvailable: false, entries: [], warnings: [] };
    const { logger, infos } = capturingLogger();

    const out = await new DiagnoseDriftCommand(() => result).run(undefined, context(logger));

    expect(out.exitCode).toBe(0);
    const text = infos.join("\n");
    expect(text).toContain("não encontrado");
    expect(text).toContain("publish-state");
  });

  it("DADO índice sem drift QUANDO run ENTÃO informa que nada divergiu e exitCode 0", async () => {
    const result: ListActiveSpecsResult = {
      indexAvailable: true,
      entries: [resolved({ slug: "a" }, true), resolved({ slug: "b" }, true)],
      warnings: [],
    };
    const { logger, infos } = capturingLogger();

    const out = await new DiagnoseDriftCommand(() => result).run(undefined, context(logger));

    expect(out.exitCode).toBe(0);
    expect(infos.join("\n")).toContain("Nenhum drift detectado");
  });

  it("DADO entries com spec_path ausente QUANDO run ENTÃO conta e lista só as que divergiram, exitCode 0", async () => {
    const result: ListActiveSpecsResult = {
      indexAvailable: true,
      entries: [
        resolved({ slug: "ok", branch: "feat/ok", specPath: ".governance/specs/ok" }, true),
        resolved(
          { slug: "sumiu", branch: "feat/sumiu", specPath: ".governance/specs/sumiu" },
          false
        ),
      ],
      warnings: [],
    };
    const { logger, infos } = capturingLogger();

    const out = await new DiagnoseDriftCommand(() => result).run(undefined, context(logger));

    expect(out.exitCode).toBe(0);
    const text = infos.join("\n");
    expect(text).toContain("1 entry(ies) com drift:");
    expect(text).toContain("sumiu");
    expect(text).toContain("feat/sumiu");
    expect(text).toContain(".governance/specs/sumiu");
    expect(text).not.toContain("- ok"); // a que existe não é listada como drift
  });

  it("DADO o contexto QUANDO run ENTÃO carrega o índice a partir do repoRoot; read-only sem prompt", async () => {
    const seen: string[] = [];
    const cmd: Command<void> = new DiagnoseDriftCommand((repoRoot) => {
      seen.push(repoRoot);
      return { indexAvailable: true, entries: [], warnings: [] };
    });
    const { logger } = capturingLogger();

    await cmd.run(undefined, context(logger));

    expect(seen).toEqual(["/repo"]);
    expect(cmd.parse(["lixo"])).toBeUndefined();
    expect(cmd.prompt).toBeUndefined();
  });
});
