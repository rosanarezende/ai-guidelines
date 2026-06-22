import { CommandContext, Logger } from "../Command.js";
import { GovernanceDoctorReport } from "../../governanceDoctor.js";
import { WorkflowFileSystem } from "../../../app/ports/WorkflowFileSystem.js";
import { RepairPlan } from "../../repair/RepairPlan.js";
import { RepairDriftCommand } from "./RepairDriftCommand.js";

/**
 * Tests BDD pt-BR — comando `repair`. Foca na ORQUESTRAÇÃO:
 *   - preview por padrão não escreve;
 *   - apply só escreve depois de confirmação;
 *   - depois de aplicar, revalida;
 *   - sem drift reparável, explica que não há reparo automático.
 */
const ACTIVE_INDEX = ".governance/runtime/specs/active.yml";

class FakeFs implements WorkflowFileSystem {
  readonly writes = new Map<string, string>();
  fileExists(): boolean {
    return false;
  }
  directoryExists(): boolean {
    return false;
  }
  readTextFile(): string {
    return "";
  }
  writeTextFile(relPath: string, contents: string): void {
    this.writes.set(relPath, contents);
  }
  listDirectory(): ReadonlyArray<string> {
    return [];
  }
  currentBranch(): string | null {
    return null;
  }
  resolveAbsolute(relPath: string): string {
    return relPath;
  }
}

function capturingLogger(): { logger: Logger; infos: string[] } {
  const infos: string[] = [];
  return { logger: { info: (m) => infos.push(m), error: () => {} }, infos };
}

function context(logger: Logger): CommandContext {
  return { repoRoot: "/repo", logger };
}

function staleReport(): GovernanceDoctorReport {
  return {
    status: "attention",
    summary: "1 ponto",
    checked: [],
    issues: [
      {
        id: "active-consistency:0023:branch",
        severity: "warning",
        title: "branch",
        whatHappened: "branch stale",
        whyItMatters: "importa",
        safeRepair: "republique",
        repairAuthority: "confirm",
        technicalDetails: [],
      },
    ],
  };
}

function humanDecisionReport(): GovernanceDoctorReport {
  return {
    status: "attention",
    summary: "1 ponto",
    checked: [],
    issues: [
      {
        id: "topology:.governance/specs/0024-context-architecture/state.yml:narrated-next-omits-canonical",
        severity: "warning",
        title: "O próximo narrado diverge da topologia",
        whatHappened: "next[0] aponta para outro nó",
        whyItMatters: "a topologia é a fonte estrutural",
        safeRepair: "prepare a decisão governada correta",
        repairAuthority: "human-decision",
        technicalDetails: [],
      },
    ],
  };
}

function cleanReport(): GovernanceDoctorReport {
  return { status: "ok", summary: "ok", checked: [], issues: [] };
}

const PLAN: RepairPlan = {
  issueId: "active-consistency:0023:branch",
  pattern: "branch-stale",
  authority: "confirm",
  title: "A projeção ativa aponta para outra branch",
  whatHappened: "Você está na branch nova, mas o índice ativo aponta para a antiga.",
  whyItMatters: "Os checks usam o índice ativo.",
  actions: [
    {
      id: "republish-active-projection",
      authority: "confirm",
      summary: "Republicar a projeção ativa para a branch atual.",
      changes: [{ path: ACTIVE_INDEX, before: "old", after: "new" }],
    },
  ],
};

describe("RepairDriftCommand (`repair`) — reparo gated por preview + confirmação", () => {
  it("DADO drift reparável E sem --apply QUANDO run ENTÃO mostra preview e NÃO escreve", async () => {
    const { logger, infos } = capturingLogger();
    const fs = new FakeFs();
    const cmd = new RepairDriftCommand({
      diagnose: () => staleReport(),
      buildPlan: () => ({ kind: "plan", plan: PLAN }),
      fs: () => fs,
      confirm: async () => {
        throw new Error("preview não deve confirmar");
      },
    });

    const out = await cmd.run({ apply: false }, context(logger));

    expect(out.exitCode).toBe(0);
    const text = infos.join("\n");
    expect(text).toContain(PLAN.whatHappened); // explica o problema
    expect(text).toContain(ACTIVE_INDEX); // mostra o arquivo que mudaria
    expect(fs.writes.size).toBe(0); // contrato positivo: nada escrito
  });

  it("DADO --apply E confirmação positiva QUANDO run ENTÃO aplica o plano e revalida", async () => {
    const { logger, infos } = capturingLogger();
    const fs = new FakeFs();
    let calls = 0;
    const cmd = new RepairDriftCommand({
      diagnose: () => (calls++ === 0 ? staleReport() : cleanReport()),
      buildPlan: () => ({ kind: "plan", plan: PLAN }),
      fs: () => fs,
      confirm: async () => true,
    });

    const out = await cmd.run({ apply: true }, context(logger));

    expect(out.exitCode).toBe(0);
    expect(fs.writes.get(ACTIVE_INDEX)).toBe("new"); // escreveu só o que muda
    const text = infos.join("\n");
    expect(text).toContain("Reparo aplicado");
    expect(text).toContain("não aparece mais"); // revalidação confirma
  });

  it("DADO --apply E confirmação negativa QUANDO run ENTÃO cancela sem escrever", async () => {
    const { logger, infos } = capturingLogger();
    const fs = new FakeFs();
    const cmd = new RepairDriftCommand({
      diagnose: () => staleReport(),
      buildPlan: () => ({ kind: "plan", plan: PLAN }),
      fs: () => fs,
      confirm: async () => false,
    });

    await cmd.run({ apply: true }, context(logger));

    expect(fs.writes.size).toBe(0);
    expect(infos.join("\n")).toContain("cancelado");
  });

  it("DADO nenhum drift reparável QUANDO run ENTÃO explica que não há reparo automático", async () => {
    const { logger, infos } = capturingLogger();
    const cmd = new RepairDriftCommand({ diagnose: () => cleanReport() });

    const out = await cmd.run({ apply: false }, context(logger));

    expect(out.exitCode).toBe(0);
    expect(infos.join("\n")).toContain("Nenhum drift com reparo automático");
  });

  it("DADO drift que exige decisão humana QUANDO run ENTÃO explica sem montar plano de escrita", async () => {
    const { logger, infos } = capturingLogger();
    const cmd = new RepairDriftCommand({
      diagnose: () => humanDecisionReport(),
      buildPlan: () => {
        throw new Error("drift de decisão humana não deve montar plano automático");
      },
    });

    const out = await cmd.run({ apply: true }, context(logger));

    expect(out.exitCode).toBe(0);
    const text = infos.join("\n");
    expect(text).toContain("Nenhum drift com reparo automático");
    expect(text).toContain("decisão humana");
    expect(text).toContain("O próximo narrado diverge da topologia");
  });

  it("DADO drift bloqueado QUANDO run ENTÃO explica sem montar plano de escrita", async () => {
    const { logger, infos } = capturingLogger();
    const cmd = new RepairDriftCommand({
      diagnose: () => ({
        status: "attention",
        summary: "1 ponto",
        checked: [],
        issues: [
          {
            id: "state-parse:state.yml",
            severity: "warning",
            title: "Um state.yml não pôde ser interpretado",
            whatHappened: "schema inválido",
            whyItMatters: "sem estado não há reparo seguro",
            safeRepair: "corrija o schema primeiro",
            repairAuthority: "blocked",
            technicalDetails: [],
          },
        ],
      }),
      buildPlan: () => {
        throw new Error("drift bloqueado não deve montar plano automático");
      },
    });

    await cmd.run({ apply: true }, context(logger));

    const text = infos.join("\n");
    expect(text).toContain("bloqueado");
    expect(text).toContain("corrija o schema primeiro");
  });

  it("DADO drift reparável mas autoria desconhecida QUANDO run ENTÃO orienta a informar --updated-by", async () => {
    const { logger, infos } = capturingLogger();
    const cmd = new RepairDriftCommand({
      diagnose: () => staleReport(),
      buildPlan: () => ({ kind: "needs-updated-by" }),
    });

    await cmd.run({ apply: true }, context(logger));

    expect(infos.join("\n")).toContain("--updated-by");
  });

  it("DADO o comando QUANDO parse de argv ENTÃO lê --apply e --updated-by", () => {
    const cmd = new RepairDriftCommand();
    expect(cmd.parse(["--apply"])).toEqual({ apply: true, updatedBy: undefined });
    expect(cmd.parse(["--apply", "--updated-by=@rosanarezende"])).toEqual({
      apply: true,
      updatedBy: "@rosanarezende",
    });
    expect(cmd.parse([])).toEqual({ apply: false, updatedBy: undefined });
  });
});
