import * as fs from "node:fs";
import * as path from "node:path";

import {
  HandoffFacts,
  deriveNextAction,
  parseSteps,
  resolveStepWork,
} from "../app/handoff/handoffFacts.js";
import { deriveWorkBrief } from "./workBrief.js";
import { parseWorkPolicy } from "../infrastructure/yaml/workPolicyReader.js";

/**
 * INVARIANTE handoff ↔ work (Spec 0024 · CO-3.3, dogfood).
 *
 * Bug: com CO-3.3 `[/]` em tasks.md, o `handoff` declarava "não há tarefa
 * executável" enquanto o `work` identificava CO-3.3 — duas projeções da MESMA
 * fonte divergindo. Após unificar a derivação (`resolveStepWork`),
 * ambos consomem a MESMA função e DEVEM nomear o mesmo objeto:
 *
 *   - se `work` deriva IMPLEMENT_CHECKPOINT com um objeto,
 *   - o `handoff` nomeia o MESMO objeto (mesmo id/linha),
 *   - e nenhum dos dois declara zero tarefas.
 */
const POLICY = parseWorkPolicy(
  fs.readFileSync(path.join(process.cwd(), ".core/governance/work-policy.yml"), "utf-8")
);

// tasks.md realista: CO-3.1/3.2 concluídos, CO-3.3 ATIVO, CO-3.4 pendente.
const TASKS_MD = [
  "## Execução",
  "",
  "- [/] **Checkpoint co-enforcement** (nó `co-enforcement`, seq 9 / CO-3)",
  "  - **Etapas internos (CO-3, PR #42):**",
  "    - [x] **CO-3.1 — Constraint + EnforcementBinding**: fatia vertical mínima.",
  "    - [x] **CO-3.2 — knowledge:compile + manifesto/paridade**: entrypoint humano.",
  "    - [/] **CO-3.3 — migração e remoção do substrato legacy**: port TS + reconexão.",
  "    - [ ] **CO-3.4 — dogfood do enforcement e recibo**: advisory-first.",
  "",
  "- [x] **Checkpoint outro** (nó `outro`)",
].join("\n");

function facts(over: Partial<HandoffFacts> = {}): HandoffFacts {
  return {
    spec: {
      label: "0024-context-architecture",
      path: ".governance/specs/0024-context-architecture",
    },
    contract: null,
    stage: "execution",
    gateStatus: "pending",
    cursor: { pr: "co-enforcement", checkpoint: "checkpoint-co-enforcement" },
    activeNode: { id: "co-enforcement", githubPr: 42, sequence: 9, terminal: false },
    nextPlannedNode: null,
    narrativeNextHead: null,
    git: {
      branch: "feat/spec-0024-co-enforcement",
      head: "aaaaaaa",
      workingTreeClean: true,
      ahead: 0,
      behind: 0,
      upstream: "origin/feat/spec-0024-co-enforcement",
    },
    pullRequest: {
      number: 42,
      state: "OPEN",
      isDraft: true,
      baseRefName: "base",
      headRefName: "feat/spec-0024-co-enforcement",
      headRefOid: "aaaaaaa",
      checks: { pass: 11, fail: 0, pending: 0 },
      bodyReadyReasons: [],
      labels: [],
    },
    lifecycle: {
      reviewDecisions: [],
      requiredReviewRoles: [],
      reviewStatuses: [],
      openFindings: 0,
      openBlocking: 0,
      closedFindings: 3,
      resolutions: 2,
      gateDecision: null,
    },
    tasks: [],
    steps: parseSteps(TASKS_MD, "checkpoint-co-enforcement"),
    insights: [],
    driftWarnings: [],
    sources: [{ id: "pull-request", origin: "gh", status: "fresh", fingerprint: "x" }],
    ...over,
  };
}

describe("Invariante handoff ↔ work (projeção unificada de etapa)", () => {
  it("DADO tasks.md com CO-3.1/3.2 done, CO-3.3 [/], CO-3.4 [ ] QUANDO parseia ENTÃO reconhece os 4 estados", () => {
    const subs = parseSteps(TASKS_MD, "checkpoint-co-enforcement");
    expect(subs.map((s) => [s.id, s.state])).toEqual([
      ["CO-3.1", "done"],
      ["CO-3.2", "done"],
      ["CO-3.3", "in-progress"],
      ["CO-3.4", "pending"],
    ]);
  });

  it("DADO o estado real QUANDO handoff e work derivam ENTÃO nomeiam o MESMO objeto (CO-3.3)", () => {
    const f = facts();

    // handoff
    const next = deriveNextAction(f);
    expect(next.kind).toBe("implement-step");
    expect(next.description).toContain("CO-3.3");
    expect(next.description).toContain("linha 7"); // linha do CO-3.3 no fixture

    // work (consome a próxima ação do handoff, como o CLI faz)
    const brief = deriveWorkBrief({
      facts: f,
      nextAction: next,
      findings: [],
      policy: POLICY,
      workingTreeState: "clean",
      authorization: null,
      advanceEligibility: { status: "available", reasons: [] },
    });
    expect(brief.mode).toBe("implement_checkpoint");
    expect(brief.object.step?.id).toBe("CO-3.3");

    // INVARIANTE: mesmo objeto factual dos dois lados.
    const sub = resolveStepWork(f);
    expect(sub.kind).toBe("implement");
    if (sub.kind === "implement") {
      expect(brief.object.step?.id).toBe(sub.step.id);
      expect(brief.object.step?.line).toBe(sub.step.line);
      expect(next.description).toContain(sub.step.id);
    }
  });

  it("DADO etapa ativa QUANDO handoff/work derivam ENTÃO NENHUM declara zero tarefas", () => {
    const f = facts();
    const next = deriveNextAction(f);
    // handoff NÃO cai no fallback de investigação ("0 abertas executáveis").
    expect(next.kind).not.toBe("investigate-checkpoint");
    expect(next.description).not.toMatch(/não há tarefa executável/);

    const brief = deriveWorkBrief({
      facts: f,
      nextAction: next,
      findings: [],
      policy: POLICY,
      workingTreeState: "clean",
      authorization: null,
      advanceEligibility: { status: "available", reasons: [] },
    });
    // work NÃO bloqueia por "nenhum objeto executável".
    expect(brief.mode).not.toBe("blocked");
  });

  it("DADO todos as etapas concluídos QUANDO não há [/] nem pendente ENTÃO cai no fallback (sem objeto)", () => {
    const allDone = parseSteps(
      TASKS_MD.replace("[/] **CO-3.3", "[x] **CO-3.3").replace("[ ] **CO-3.4", "[x] **CO-3.4"),
      "checkpoint-co-enforcement"
    );
    const f = facts({ steps: allDone });
    const next = deriveNextAction(f);
    // Sem etapa ativa nem pendente nem tarefa de topo: investigação.
    expect(next.kind).toBe("investigate-checkpoint");
    expect(resolveStepWork(f).kind).toBe("none");
  });

  it("DADO o CO-3.3 [/] com readiness declarada QUANDO handoff e work derivam ENTÃO recomendam a transição e nomeiam o CO-3.3", () => {
    const tasksReady = TASKS_MD.replace(
      "[/] **CO-3.3 — migração e remoção do substrato legacy**",
      "[/] **CO-3.3 — migração e remoção do substrato legacy** `readiness: ready-for-transition`"
    );
    const f = facts({
      steps: parseSteps(tasksReady, "checkpoint-co-enforcement"),
    });

    // handoff
    const next = deriveNextAction(f);
    expect(next.kind).toBe("advance-step-transition");
    expect(next.description).toContain("CO-3.3");

    // work
    const brief = deriveWorkBrief({
      facts: f,
      nextAction: next,
      findings: [],
      policy: POLICY,
      workingTreeState: "clean",
      authorization: null,
      advanceEligibility: { status: "available", reasons: [] },
    });
    expect(brief.mode).toBe("prepare_step_transition");
    expect(brief.object.transition?.conclude?.id).toBe("CO-3.3");
    expect(brief.object.transition?.activate.id).toBe("CO-3.4");

    // Ambos nomeiam CO-3.3
    const sub = resolveStepWork(f);
    expect(sub.kind).toBe("transition");
    if (sub.kind === "transition") {
      expect(sub.transition.conclude?.id).toBe("CO-3.3");
    }
  });
});
