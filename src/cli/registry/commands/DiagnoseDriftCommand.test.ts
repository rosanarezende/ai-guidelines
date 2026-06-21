import { DiagnoseDriftCommand } from "./DiagnoseDriftCommand.js";
import { Command, CommandContext, Logger } from "../Command.js";

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
    }).run(undefined, context(logger));

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
    }).run(undefined, context(logger));

    expect(out.exitCode).toBe(0);
    const text = infos.join("\n");
    expect(text).toContain("Detectei 1 ponto");
    expect(text).toContain("O índice público aponta para uma pasta de spec que não existe aqui");
    expect(text).toContain("Por que importa:");
    expect(text).toContain("Reparo seguro:");
  });

  it("DADO comando QUANDO parse/run ENTÃO permanece read-only e sem prompt", async () => {
    const { logger } = capturingLogger();
    const cmd: Command<void> = new DiagnoseDriftCommand({
      loadIndex: () => ({ indexAvailable: false, entries: [], warnings: [] }),
      discoverStateFiles: () => [],
      fileExists: () => false,
    });

    await cmd.run(undefined, context(logger));

    expect(cmd.parse(["lixo"])).toBeUndefined();
    expect(cmd.prompt).toBeUndefined();
  });
});
