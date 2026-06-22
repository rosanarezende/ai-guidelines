import { DiagnoseDriftCommand } from "./DiagnoseDriftCommand.js";
import { Command, CommandContext, Logger } from "../Command.js";
import { DiagnoseDriftOptions } from "./DiagnoseDriftCommand.js";

function capturingLogger(): { logger: Logger; infos: string[] } {
  const infos: string[] = [];
  return { logger: { info: (m) => infos.push(m), error: () => {} }, infos };
}

function context(logger: Logger): CommandContext {
  return { repoRoot: "/repo", logger };
}

describe("DiagnoseDriftCommand (`drift`) — Governance Doctor read-only", () => {
  it("DADO repositório sem índice nem state.yml QUANDO run ENTÃO explica que não há drift governado", async () => {
    const { logger, infos } = capturingLogger();

    const out = await new DiagnoseDriftCommand({
      loadIndex: () => ({ indexAvailable: false, entries: [], warnings: [] }),
      discoverStateFiles: () => [],
      fileExists: () => false,
      readFile: () => {
        throw new Error("não deveria ler arquivos");
      },
    }).run({ check: false }, context(logger));

    expect(out.exitCode).toBe(0);
    const text = infos.join("\n");
    expect(text).toContain("# Diagnóstico de governança");
    expect(text).toContain("ainda não publicou specs governadas");
  });

  it("DADO spec_path ausente QUANDO run ENTÃO mostra problema, motivo e reparo seguro", async () => {
    const { logger, infos } = capturingLogger();

    const out = await new DiagnoseDriftCommand({
      loadIndex: () => ({
        indexAvailable: true,
        entries: [
          {
            specPathExists: false,
            entry: {
              id: "0024",
              slug: "context-architecture",
              branch: "feat/spec-0024-x",
              stage: "implementation",
              status: "active",
              specPath: ".governance/specs/0024-context-architecture",
              updatedAt: "2026-06-20T00:00:00Z",
            },
          },
        ],
        warnings: [],
      }),
      discoverStateFiles: () => [],
      fileExists: () => false,
      currentBranch: () => "feat/spec-0024-x",
    }).run({ check: false }, context(logger));

    expect(out.exitCode).toBe(0);
    const text = infos.join("\n");
    expect(text).toContain("Detectei 1 ponto");
    expect(text).toContain("O índice público aponta para uma pasta de spec que não existe aqui");
    expect(text).toContain("Por que importa:");
    expect(text).toContain("Reparo seguro:");
  });

  it("DADO comando QUANDO parse/run ENTÃO permanece read-only e sem prompt", async () => {
    const { logger } = capturingLogger();
    const cmd: Command<DiagnoseDriftOptions> = new DiagnoseDriftCommand({
      loadIndex: () => ({ indexAvailable: false, entries: [], warnings: [] }),
      discoverStateFiles: () => [],
      fileExists: () => false,
    });

    await cmd.run({ check: false }, context(logger));

    expect(cmd.parse(["lixo"])).toEqual({ check: false });
    expect(cmd.parse(["--check"])).toEqual({ check: true });
    expect(cmd.prompt).toBeUndefined();
  });

  it("DADO drift QUANDO roda --check ENTÃO falha sem escrever e orienta o reparo", async () => {
    const { logger, infos } = capturingLogger();

    const out = await new DiagnoseDriftCommand({
      loadIndex: () => ({
        indexAvailable: true,
        entries: [
          {
            specPathExists: false,
            entry: {
              id: "0024",
              slug: "context-architecture",
              branch: "feat/spec-0024-x",
              stage: "implementation",
              status: "active",
              specPath: ".governance/specs/0024-context-architecture",
              updatedAt: "2026-06-20T00:00:00Z",
            },
          },
        ],
        warnings: [],
      }),
      discoverStateFiles: () => [],
      fileExists: () => false,
      currentBranch: () => "feat/spec-0024-x",
    }).run({ check: true }, context(logger));

    expect(out.exitCode).toBe(1);
    const text = infos.join("\n");
    expect(text).toContain("Verificação de governança");
    expect(text).toContain("Exige decisão humana");
  });

  it("DADO loader de PR QUANDO roda sem --check ENTÃO inclui checks que dependem de GitHub", async () => {
    const { logger, infos } = capturingLogger();

    await new DiagnoseDriftCommand({
      loadIndex: () => ({ indexAvailable: false, entries: [], warnings: [] }),
      discoverStateFiles: () => [],
      fileExists: () => false,
      loadPullRequest: () => {
        throw new Error("não deveria consultar PR sem state.yml");
      },
    }).run({ check: false }, context(logger));

    const text = infos.join("\n");
    expect(text).toContain("descrição do PR no GitHub");
  });

  it("DADO --check sem loader de PR ENTÃO completa o diagnóstico local determinístico", async () => {
    const { logger, infos } = capturingLogger();

    const out = await new DiagnoseDriftCommand({
      loadIndex: () => ({ indexAvailable: false, entries: [], warnings: [] }),
      discoverStateFiles: () => [],
      fileExists: () => false,
    }).run({ check: true }, context(logger));

    const text = infos.join("\n");
    expect(out.exitCode).toBe(0);
    expect(text).toContain("índice público de specs");
  });
});
