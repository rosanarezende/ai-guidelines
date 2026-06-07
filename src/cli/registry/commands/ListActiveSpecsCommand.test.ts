import { ListActiveSpecsCommand } from "./ListActiveSpecsCommand.js";
import { Command, CommandContext, Logger } from "../Command.js";
import {
  ListActiveSpecsResult,
  ResolvedActiveSpec,
} from "../../../app/workflow/ListActiveSpecs.js";
import { ActiveSpecEntry } from "../../../domain/workflow/ActiveSpecEntry.js";

function capturingLogger(): { logger: Logger; infos: string[]; errors: string[] } {
  const infos: string[] = [];
  const errors: string[] = [];
  return { logger: { info: (m) => infos.push(m), error: (m) => errors.push(m) }, infos, errors };
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

describe("ListActiveSpecsCommand (`specs`) — migração read-only do list-active-specs", () => {
  it("DADO índice com entries QUANDO run ENTÃO renderiza o bloco de specs ativas e exitCode 0", async () => {
    const result: ListActiveSpecsResult = {
      indexAvailable: true,
      entries: [resolved({ slug: "context-architecture" }, true)],
      warnings: [],
    };
    const { logger, infos } = capturingLogger();
    const cmd = new ListActiveSpecsCommand(() => result);

    const out = await cmd.run(undefined, context(logger));

    expect(out.exitCode).toBe(0);
    const text = infos.join("\n");
    expect(text).toContain("Specs ativas no índice público:");
    expect(text).toContain("context-architecture");
  });

  it("DADO índice ausente QUANDO run ENTÃO mostra o bloco mesmo ausente (showWhenAbsent) e exitCode 0", async () => {
    const result: ListActiveSpecsResult = {
      indexAvailable: false,
      entries: [],
      warnings: ["Index not found."],
    };
    const { logger, infos } = capturingLogger();
    const cmd = new ListActiveSpecsCommand(() => result);

    const out = await cmd.run(undefined, context(logger));

    expect(out.exitCode).toBe(0);
    expect(infos.join("\n")).toContain("Índice operacional público");
  });

  it("DADO o contexto QUANDO run ENTÃO carrega o índice a partir do repoRoot do contexto", async () => {
    const seen: string[] = [];
    const result: ListActiveSpecsResult = { indexAvailable: true, entries: [], warnings: [] };
    const { logger } = capturingLogger();
    const cmd = new ListActiveSpecsCommand((repoRoot) => {
      seen.push(repoRoot);
      return result;
    });

    await cmd.run(undefined, context(logger));

    expect(seen).toEqual(["/repo"]);
  });

  it("DADO argv qualquer QUANDO parse ENTÃO é read-only (não exige nem consome argumentos; sem prompt)", () => {
    const cmd: Command<void> = new ListActiveSpecsCommand(() => ({
      indexAvailable: true,
      entries: [],
      warnings: [],
    }));
    expect(cmd.parse(["lixo", "--flag"])).toBeUndefined();
    expect(cmd.prompt).toBeUndefined();
  });
});
