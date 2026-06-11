import path from "node:path";
import { readFileSync } from "node:fs";

import {
  deriveDisclosure,
  renderDisclosure,
  normalizeCheckpoint,
  DisclosureFacts,
} from "./disclosureRender.js";
import { ConsolidatedCheckpoint } from "./reviewCheck.js";
import { GateArtifact } from "../infrastructure/yaml/reviewArtifactsReader.js";
import { PrTopologyNode } from "../domain/workflow/WorkflowState.js";

function node(checkpoints: string[], github_pr: number | null = 33): PrTopologyNode {
  return {
    id: "ruleset-producibility",
    github_pr,
    role: "execution",
    terminal: false,
    sequence: 1,
    checkpoints,
  };
}

function gate(checkpoint: string, decision: "approved" | "changes_requested"): GateArtifact {
  return { checkpoint, actor: "rosanarezende", decision, file: `gates/c${checkpoint}.yml` };
}

function cp(
  checkpoint: string,
  opts: {
    reviews?: Array<{ role: string; decision: string }>;
    open?: number;
    closed?: number;
    gate?: GateArtifact;
  } = {}
): ConsolidatedCheckpoint {
  return {
    checkpoint,
    reviewDecisions: opts.reviews ?? [],
    reviewEventCount: 0,
    openBlocking: [],
    totalOpen: opts.open ?? 0,
    totalClosed: opts.closed ?? 0,
    ...(opts.gate ? { gate: opts.gate } : {}),
  };
}

describe("disclosureRender [Checkpoint 2.4d] — normalizeCheckpoint", () => {
  it("remove o prefixo checkpoint-", () => {
    expect(normalizeCheckpoint("checkpoint-2.3")).toBe("2.3");
  });
  it("tolera id já normalizado", () => {
    expect(normalizeCheckpoint("2.3")).toBe("2.3");
  });
});

describe("disclosureRender [Checkpoint 2.4d] — deriveDisclosure (derivação pura)", () => {
  it("escopo vazio → zero revisões / gate pendente", () => {
    const f = deriveDisclosure(node(["checkpoint-2.2"]), []);
    expect(f.reviewCount).toBe(0);
    expect(f.hasHumanGate).toBe(false);
    expect(f.gateState).toBe("pending");
  });

  it("dogfood #33: 1 review architectural_review, 6 findings, todos fechados, sem gate", () => {
    const f = deriveDisclosure(node(["checkpoint-2.3", "checkpoint-2.4c"]), [
      cp("2.3", {
        reviews: [{ role: "architectural_review", decision: "changes_requested" }],
        closed: 6,
      }),
    ]);
    expect(f.reviewCount).toBe(1);
    expect(f.categories).toEqual(["Architectural Review"]);
    expect(f.findingsEmitted).toBe(6);
    expect(f.findingsResolved).toBe(6);
    expect(f.hasHumanGate).toBe(false);
    expect(f.gateState).toBe("pending");
  });

  it("escopa pelos checkpoints do nó (ignora checkpoint fora de escopo)", () => {
    const f = deriveDisclosure(node(["checkpoint-2.3"]), [
      cp("2.3", { reviews: [{ role: "technical_audit", decision: "approved" }], closed: 2 }),
      cp("9.9", { reviews: [{ role: "architectural_review", decision: "approved" }], closed: 99 }),
    ]);
    expect(f.reviewCount).toBe(1);
    expect(f.findingsResolved).toBe(2); // 99 fora de escopo não entra
    expect(f.categories).toEqual(["Technical Audit"]);
  });

  it("findings emitidos = abertos + fechados; resolvidos = fechados", () => {
    const f = deriveDisclosure(node(["checkpoint-3"]), [
      cp("3", {
        reviews: [{ role: "technical_audit", decision: "changes_requested" }],
        open: 2,
        closed: 3,
      }),
    ]);
    expect(f.findingsEmitted).toBe(5);
    expect(f.findingsResolved).toBe(3);
  });

  it("gate aprovado em todos os checkpoints com gate → approved", () => {
    const f = deriveDisclosure(node(["checkpoint-3", "checkpoint-4"]), [
      cp("3", {
        reviews: [{ role: "technical_audit", decision: "approved" }],
        closed: 1,
        gate: gate("3", "approved"),
      }),
      cp("4", {
        reviews: [{ role: "architectural_review", decision: "approved" }],
        closed: 1,
        gate: gate("4", "approved"),
      }),
    ]);
    expect(f.hasHumanGate).toBe(true);
    expect(f.gateState).toBe("approved");
  });

  it("qualquer gate changes_requested ⇒ changes_requested (não mascara como aprovado)", () => {
    const f = deriveDisclosure(node(["checkpoint-3", "checkpoint-4"]), [
      cp("3", { gate: gate("3", "approved") }),
      cp("4", { gate: gate("4", "changes_requested") }),
    ]);
    expect(f.gateState).toBe("changes_requested");
  });

  it("Cenário A — gate approved só em PARTE do escopo → partial, NUNCA approved", () => {
    // node embarca 2.2/2.3/2.4; só 2.2 tem review+gate aprovado; 2.3/2.4 sem artefato.
    const f = deriveDisclosure(node(["checkpoint-2.2", "checkpoint-2.3", "checkpoint-2.4"]), [
      cp("2.2", {
        reviews: [{ role: "technical_audit", decision: "approved" }],
        closed: 2,
        gate: gate("2.2", "approved"),
      }),
    ]);
    expect(f.gateState).toBe("partial");
    expect(f.gatedCount).toBe(1);
    expect(f.checkpointsInScope.length).toBe(3);
  });

  it("role desconhecido passa cru (anti-taxonomia: sem enum fechado)", () => {
    const f = deriveDisclosure(node(["checkpoint-3"]), [
      cp("3", { reviews: [{ role: "security_review", decision: "approved" }], closed: 1 }),
    ]);
    expect(f.categories).toEqual(["security_review"]);
  });
});

describe("disclosureRender [Checkpoint 2.4d] — renderDisclosure (projeção pura)", () => {
  function facts(over: Partial<DisclosureFacts>): DisclosureFacts {
    return {
      reviewCount: 0,
      categories: [],
      findingsEmitted: 0,
      findingsResolved: 0,
      hasHumanGate: false,
      gatedCount: 0,
      gateState: "pending",
      checkpointsInScope: [],
      ...over,
    };
  }

  it("escopo vazio → frase honesta de ausência", () => {
    expect(renderDisclosure(facts({}))).toMatch(/Sem revisões independentes registradas/);
  });

  it("NÃO emite a frase editorial 'Implementação assistida por IA' (vive no template)", () => {
    const text = renderDisclosure(
      facts({
        reviewCount: 1,
        categories: ["Architectural Review"],
        findingsEmitted: 6,
        findingsResolved: 6,
      })
    );
    expect(text).not.toMatch(/assistida por IA/i);
  });

  it("singular/plural do substantivo + categorias", () => {
    const one = renderDisclosure(
      facts({
        reviewCount: 1,
        categories: ["Architectural Review"],
        findingsEmitted: 6,
        findingsResolved: 6,
      })
    );
    expect(one).toContain("1 artefato de revisão (Architectural Review)");
    expect(one).toContain("6 findings emitidos, 6 resolvidos");
    expect(one).toContain("Gate humano: pendente.");
    const two = renderDisclosure(
      facts({
        reviewCount: 2,
        categories: ["Technical Audit", "Architectural Review"],
        findingsEmitted: 9,
        findingsResolved: 9,
      })
    );
    expect(two).toContain("2 artefatos de revisão");
  });

  it("gate approved → consolidação e validação final pelo owner", () => {
    const text = renderDisclosure(
      facts({
        reviewCount: 2,
        findingsEmitted: 9,
        findingsResolved: 9,
        hasHumanGate: true,
        gateState: "approved",
      })
    );
    expect(text).toContain("Consolidação e validação final pelo owner.");
  });

  it("gate changes_requested → estado honesto", () => {
    const text = renderDisclosure(
      facts({
        reviewCount: 1,
        findingsEmitted: 3,
        findingsResolved: 1,
        hasHumanGate: true,
        gateState: "changes_requested",
      })
    );
    expect(text).toMatch(/changes requested/);
  });

  it("gate partial → cobertura honesta, sem alegar validação final", () => {
    const text = renderDisclosure(
      facts({
        reviewCount: 1,
        findingsEmitted: 2,
        findingsResolved: 2,
        hasHumanGate: true,
        gatedCount: 1,
        gateState: "partial",
        checkpointsInScope: ["2.2", "2.3", "2.4"],
      })
    );
    expect(text).toMatch(/parcial — 1 de 3/);
    expect(text).not.toContain("validação final pelo owner");
  });
});

describe("disclosureRender — no yarn residuals", () => {
  it("operational messages must use npm-canonical commands, not yarn", () => {
    // The string literals in disclosureRender.ts should not contain 'yarn '
    // as an operational instruction. This test reads the source file and
    // checks for yarn references that aren't in comments or documentation.
    const source = readFileSync(path.resolve(__dirname, "disclosureRender.ts"), "utf-8");
    // Match yarn followed by a script name in string literals (inside backticks or quotes)
    const yarnInstructions = source.match(/['"`].*\byarn\s+\w+.*['"`]/g) || [];
    expect(yarnInstructions).toEqual([]);
  });
});
