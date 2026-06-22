import {
  deriveGovernancePreflight,
  renderGovernancePreflight,
  runGovernancePreflight,
} from "./governancePreflight.js";
import { GovernanceDoctorReport } from "./governanceDoctor.js";

function cleanReport(): GovernanceDoctorReport {
  return { status: "ok", summary: "ok", checked: [], issues: [] };
}

function attentionReport(): GovernanceDoctorReport {
  return {
    status: "attention",
    summary: "2 pontos",
    checked: [],
    issues: [
      {
        id: "active-consistency:0024:branch",
        severity: "warning",
        title: "O índice público aponta para a branch errada",
        whatHappened: "branch stale",
        whyItMatters: "retomada errada",
        safeRepair: "Republique a projeção ativa com preview.",
        repairAuthority: "confirm",
        technicalDetails: [],
      },
      {
        id: "topology:state.yml:narrated-next-omits-canonical",
        severity: "warning",
        title: "O próximo narrado diverge da topologia",
        whatHappened: "next stale",
        whyItMatters: "topologia vence",
        safeRepair: "Prepare uma decisão humana para reconciliar a narração.",
        repairAuthority: "human-decision",
        technicalDetails: [],
      },
    ],
  };
}

describe("GovernancePreflight — autodetecção de drift no fluxo humano", () => {
  it("DADO relatório limpo QUANDO entrada pública ENTÃO não renderiza ruído", () => {
    const result = deriveGovernancePreflight(cleanReport(), "entry");

    expect(result.status).toBe("ok");
    expect(result.shouldBlock).toBe(false);
    expect(renderGovernancePreflight(result)).toEqual([]);
  });

  it("DADO drift QUANDO entrada pública ENTÃO explica sem bloquear", () => {
    const result = deriveGovernancePreflight(attentionReport(), "entry");
    const text = renderGovernancePreflight(result).join("\n");

    expect(result.status).toBe("attention");
    expect(result.shouldBlock).toBe(false);
    expect(text).toContain("Detectei 2 drift");
    expect(text).toContain("Reparável com preview e confirmação");
    expect(text).toContain("Exige decisão humana");
    expect(text).toContain("npx ai-guidelines drift");
  });

  it("DADO drift QUANDO ação sensível ENTÃO bloqueia e orienta reparo/decisão", () => {
    const result = deriveGovernancePreflight(attentionReport(), "sensitive");
    const text = renderGovernancePreflight(result).join("\n");

    expect(result.status).toBe("blocked");
    expect(result.shouldBlock).toBe(true);
    expect(text).toContain("bloqueada até o drift ser reconciliado");
    expect(text).toContain("npx ai-guidelines repair");
  });

  it("DADO repositório governado com drift QUANDO roda preflight real ENTÃO delega ao GovernanceDoctor", () => {
    const result = runGovernancePreflight("/repo", "hook", {
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
              updatedAt: "2026-06-21T00:00:00Z",
            },
          },
        ],
        warnings: [],
      }),
      discoverStateFiles: () => [],
      fileExists: () => false,
      currentBranch: () => "feat/spec-0024-x",
    });

    expect(result.shouldBlock).toBe(true);
    expect(result.nonAutomatic[0].id).toBe("missing-spec-path:0024");
  });
});
