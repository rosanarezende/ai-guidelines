import {
  HandoffFacts,
  HandoffLifecycleFact,
  HandoffPrFact,
  HandoffSourceFact,
  HandoffTaskFact,
  computeSeal,
  deriveHandoff,
  deriveNextAction,
  deriveProhibitions,
  parseCheckpointTasks,
} from "./handoffFacts.js";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const CURSOR = { pr: "co-projection", checkpoint: "checkpoint-co-projection" };

const OPEN_TASK: HandoffTaskFact = {
  text:
    "**Checkpoint co-projection** (nó `co-projection`, seq 8 / CO-4) — autorizado pelo Human Gate do #39: " +
    "handoff situado DERIVADO + contrato de carga. Escopo: estender o comando `handoff` (modelo puro " +
    "`deriveHandoff`; reviews/gates via `discover()`/`consolidate()`); `handoff:check` advisory-first.",
  done: false,
  line: 98,
};

const LIFECYCLE_EMPTY: HandoffLifecycleFact = {
  reviewDecisions: [],
  requiredReviewRoles: ["technical_audit", "architectural_review"],
  openFindings: 0,
  openBlocking: 0,
  closedFindings: 0,
  resolutions: 0,
  gateDecision: null,
};

const PR_DRAFT: HandoffPrFact = {
  number: 41,
  state: "open",
  isDraft: true,
  baseRefName: "feat/spec-0024-toolchain-simplification",
  headRefName: "feat/spec-0024-co-projection",
  headRefOid: "0c796fb0000000",
  checks: { pass: 11, fail: 0, pending: 0 },
  bodyReadyReasons: [],
};

const SOURCES_FRESH: HandoffSourceFact[] = [
  { id: "state.yml", origin: "spec/state.yml", status: "fresh", fingerprint: "aaa111" },
  { id: "active.yml", origin: "runtime/specs/active.yml", status: "fresh", fingerprint: "bbb222" },
  { id: "git", origin: "git local", status: "fresh", fingerprint: "ccc333" },
  { id: "reviews", origin: "spec/{reviews,gates}/", status: "fresh", fingerprint: "ddd444" },
  { id: "tasks.md", origin: "spec/tasks.md", status: "fresh", fingerprint: "eee555" },
  { id: "pull-request", origin: "gh api (PR #41)", status: "fresh", fingerprint: "fff666" },
];

/** Fixture base: espelha o estado REAL do PR #41 nesta rodada (reconciliado). */
function facts(overrides: Partial<HandoffFacts> = {}): HandoffFacts {
  return {
    spec: {
      label: "0024-context-architecture",
      path: ".governance/specs/0024-context-architecture",
    },
    stage: "implementation",
    gateStatus: "closed",
    cursor: CURSOR,
    activeNode: { id: "co-projection", githubPr: 41, sequence: 8, terminal: false },
    nextPlannedNode: { id: "co-enforcement", githubPr: null, sequence: 9, terminal: false },
    narrativeNextHead: "canonical-next: co-projection. (narrativa derivada)",
    git: {
      branch: "feat/spec-0024-co-projection",
      head: "0c796fb",
      workingTreeClean: true,
      ahead: 0,
      behind: 0,
      upstream: "origin/feat/spec-0024-co-projection",
    },
    pullRequest: PR_DRAFT,
    lifecycle: LIFECYCLE_EMPTY,
    tasks: [OPEN_TASK],
    insights: [{ id: "PIT-0011", excerpt: "Contrato executavel invisivel…" }],
    driftWarnings: [],
    sources: SOURCES_FRESH,
    ...overrides,
  };
}

// ── deriveNextAction · precedência 1–8 ───────────────────────────────────────

describe("deriveNextAction · precedência [CO-4]", () => {
  it("1 — drift de projeção precede QUALQUER trabalho funcional", () => {
    const action = deriveNextAction(
      facts({ driftWarnings: ["Branch projetada STALE: specs/active.yml diz X, fato é Y"] })
    );
    expect(action.kind).toBe("reconcile-drift");
    expect(action.blocking).toBe(true);
    expect(action.basis[0]).toContain("STALE");
  });

  it("2 — findings abertos → resolver findings (com base citável)", () => {
    const action = deriveNextAction(
      facts({
        lifecycle: { ...LIFECYCLE_EMPTY, openFindings: 3, openBlocking: 1, closedFindings: 2 },
      })
    );
    expect(action.kind).toBe("resolve-findings");
    expect(action.blocking).toBe(true);
    expect(action.description).toContain("3 finding(s)");
    expect(action.basis.join(" ")).toContain("3 open / 2 closed");
  });

  it("3 — implementação concluída + review exigido pendente → executar o review", () => {
    const action = deriveNextAction(
      facts({
        tasks: [{ ...OPEN_TASK, done: true }],
        lifecycle: {
          ...LIFECYCLE_EMPTY,
          reviewDecisions: [{ role: "technical_audit", decision: "approved" }],
        },
      })
    );
    expect(action.kind).toBe("run-required-review");
    expect(action.description).toContain("architectural_review");
    expect(action.basis.join(" ")).toContain("review-policy exige");
  });

  it("4 — reviews concluídos + Draft + body incompleto → preparar Ready", () => {
    const action = deriveNextAction(
      facts({
        tasks: [{ ...OPEN_TASK, done: true }],
        lifecycle: {
          ...LIFECYCLE_EMPTY,
          reviewDecisions: [
            { role: "technical_audit", decision: "approved" },
            { role: "architectural_review", decision: "approved" },
          ],
        },
        pullRequest: { ...PR_DRAFT, bodyReadyReasons: ["Valor entregue ainda é placeholder"] },
      })
    );
    expect(action.kind).toBe("prepare-ready");
    expect(action.basis.join(" ")).toContain("Valor entregue");
  });

  it("5 — PR Ready + Human Gate ausente → exercer o Human Gate (humano decide)", () => {
    const action = deriveNextAction(
      facts({
        tasks: [{ ...OPEN_TASK, done: true }],
        lifecycle: {
          ...LIFECYCLE_EMPTY,
          reviewDecisions: [
            { role: "technical_audit", decision: "approved" },
            { role: "architectural_review", decision: "approved" },
          ],
        },
        pullRequest: { ...PR_DRAFT, isDraft: false },
      })
    );
    expect(action.kind).toBe("exercise-human-gate");
    expect(action.blocking).toBe(true);
    expect(action.description).toContain("gate artifact nasce DEPOIS");
  });

  it("6 — gate aprovado + nó ainda ativo → concluir o nó e abrir o próximo autorizado", () => {
    // Estado realista pós-gate: lanes exigidas approved (review:check enforça
    // gate approved ⟹ ciclo de review fechado) + gate do CURSOR approved.
    const action = deriveNextAction(
      facts({
        tasks: [{ ...OPEN_TASK, done: true }],
        lifecycle: {
          ...LIFECYCLE_EMPTY,
          reviewDecisions: [
            { role: "technical_audit", decision: "approved" },
            { role: "architectural_review", decision: "approved" },
          ],
          gateDecision: "approved",
        },
      })
    );
    expect(action.kind).toBe("conclude-node-open-next");
    expect(action.description).toContain("co-enforcement");
    expect(action.basis.join(" ")).toContain("approved");
  });

  it("7 — tarefa aberta do checkpoint → primeira tarefa aberta (descrição derivada do escopo real)", () => {
    const action = deriveNextAction(facts());
    expect(action.kind).toBe("execute-task");
    expect(action.description).toContain("checkpoint-co-projection");
    expect(action.description).toContain("estender o comando `handoff`");
    expect(action.basis.join(" ")).toContain("tasks.md linha 98");
  });

  it("8 — sem tarefas materializadas → investigar/planejar o checkpoint", () => {
    const action = deriveNextAction(facts({ tasks: [] }));
    expect(action.kind).toBe("investigate-checkpoint");
    expect(action.description).toContain("checkpoint-co-projection");
  });

  it("9 — state.next[0] stale NÃO altera a decisão (narrativa não é fonte)", () => {
    const a = deriveNextAction(facts({ narrativeNextHead: "canonical-next: co-projection" }));
    const b = deriveNextAction(
      facts({ narrativeNextHead: "canonical-next: NÓ-ERRADO-STALE. abrir co-enforcement JÁ" })
    );
    expect(a).toEqual(b);
  });

  it("10 — gate de OUTRO checkpoint (gate.next histórico) não dita a ação do nó atual", () => {
    // O gate do nó anterior (npm-toolchain, approved) NÃO entra no lifecycle do
    // cursor atual — o coletor filtra por checkpoint. Com gateDecision null no
    // cursor, a ação segue a tarefa aberta, não "concluir/abrir próximo".
    const action = deriveNextAction(
      facts({ lifecycle: { ...LIFECYCLE_EMPTY, gateDecision: null } })
    );
    expect(action.kind).toBe("execute-task");
    expect(action.kind).not.toBe("conclude-node-open-next");
  });

  it("11 — API indisponível quando a decisão depende do remoto → reconciliar fonte remota (sem inventar estado)", () => {
    const action = deriveNextAction(
      facts({
        tasks: [{ ...OPEN_TASK, done: true }],
        lifecycle: {
          ...LIFECYCLE_EMPTY,
          reviewDecisions: [
            { role: "technical_audit", decision: "approved" },
            { role: "architectural_review", decision: "approved" },
          ],
        },
        pullRequest: null,
        sources: [
          ...SOURCES_FRESH.filter((s) => s.id !== "pull-request"),
          {
            id: "pull-request",
            origin: "gh api (PR #41)",
            status: "unavailable",
            fingerprint: "-",
            detail: "gh: connection refused",
          },
        ],
      })
    );
    expect(action.kind).toBe("reconcile-remote-source");
    expect(action.basis.join(" ")).toContain("unavailable");
  });

  it("12 — estado real do #41 (fixture desta rodada) → implementar o contrato do handoff situado", () => {
    const action = deriveNextAction(facts());
    expect(action.kind).toBe("execute-task");
    expect(action.description).toContain("handoff");
    expect(action.description).toContain("deriveHandoff");
    expect(action.blocking).toBe(false);
  });

  it("é determinística (mesmos fatos ⇒ mesma ação, deep equal)", () => {
    expect(deriveNextAction(facts())).toEqual(deriveNextAction(facts()));
  });
});

// ── Selo de geração ──────────────────────────────────────────────────────────

describe("computeSeal · selo determinístico [CO-4]", () => {
  it("mesmas fontes ⇒ mesmo selo (sem timestamp)", () => {
    expect(computeSeal(facts())).toBe(computeSeal(facts()));
  });

  it("mudança relevante em UMA fonte ⇒ selo diferente", () => {
    const changed = facts({
      sources: SOURCES_FRESH.map((s) =>
        s.id === "state.yml" ? { ...s, fingerprint: "MUDOU99" } : s
      ),
    });
    expect(computeSeal(changed)).not.toBe(computeSeal(facts()));
  });

  it("ordem das fontes NÃO altera o selo (canônico)", () => {
    const reversed = facts({ sources: [...SOURCES_FRESH].reverse() });
    expect(computeSeal(reversed)).toBe(computeSeal(facts()));
  });

  it("status da fonte entra no selo (fresh→unavailable muda)", () => {
    const degraded = facts({
      sources: SOURCES_FRESH.map((s) =>
        s.id === "pull-request" ? { ...s, status: "unavailable" as const, fingerprint: "-" } : s
      ),
    });
    expect(computeSeal(degraded)).not.toBe(computeSeal(facts()));
  });
});

// ── Proibições derivadas ─────────────────────────────────────────────────────

describe("deriveProhibitions · derivadas do estado [CO-4]", () => {
  it("nó não-terminal + Draft + gate ausente ⇒ proíbe merge/Ready/gate/próximo nó/fora do checkpoint", () => {
    const prohibitions = deriveProhibitions(facts());
    const joined = prohibitions.join("\n");
    expect(joined).toContain("NÃO mergear o PR #41 isolado em main");
    expect(joined).toContain("NÃO converter o PR #41 para Ready");
    expect(joined).toContain("NÃO registrar gate artifact");
    expect(joined).toContain("NÃO abrir o próximo nó planejado (co-enforcement");
    expect(joined).toContain("NÃO implementar fora do checkpoint checkpoint-co-projection");
  });

  it("gate aprovado ⇒ deixa de proibir gate artifact e abertura do próximo nó", () => {
    const prohibitions = deriveProhibitions(
      facts({ lifecycle: { ...LIFECYCLE_EMPTY, gateDecision: "approved" } })
    );
    const joined = prohibitions.join("\n");
    expect(joined).not.toContain("NÃO registrar gate artifact");
    expect(joined).not.toContain("NÃO abrir o próximo nó");
  });

  it("PR elegível a Ready (reviews ok + body ok) ⇒ não proíbe a conversão", () => {
    const prohibitions = deriveProhibitions(
      facts({
        lifecycle: {
          ...LIFECYCLE_EMPTY,
          reviewDecisions: [
            { role: "technical_audit", decision: "approved" },
            { role: "architectural_review", decision: "approved" },
          ],
        },
      })
    );
    expect(prohibitions.join("\n")).not.toContain("NÃO converter o PR #41 para Ready");
  });
});

// ── parseCheckpointTasks ─────────────────────────────────────────────────────

describe("parseCheckpointTasks · associação conservadora [CO-4]", () => {
  const TASKS_MD = [
    "## Fase de Execução",
    "",
    "- [x] **Checkpoint npm-toolchain** (nó `toolchain-simplification`, seq 7) — concluído; `co-projection` reordenado para seq 8. _(próximo: `co-projection` / CO-4)_",
    "- [ ] **Checkpoint co-projection** (nó `co-projection`, seq 8 / CO-4) — Escopo: estender o comando `handoff`.",
    "  - **Dogfood 2026-06-11:** sub-bullet sem checkbox é ignorado.",
    "- [ ] Tarefa de outro nó qualquer sem marcador.",
  ].join("\n");

  it("associa pela convenção (título bold/nó), não por menção em prosa de outra tarefa", () => {
    const tasks = parseCheckpointTasks(TASKS_MD, CURSOR);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].done).toBe(false);
    expect(tasks[0].text).toContain("**Checkpoint co-projection**");
    expect(tasks[0].line).toBe(4);
  });

  it("tarefa concluída ([x]) carrega done=true e não é escolhida como próxima ação", () => {
    const tasks = parseCheckpointTasks(
      TASKS_MD.replace("- [ ] **Checkpoint co-projection**", "- [x] **Checkpoint co-projection**"),
      CURSOR
    );
    expect(tasks).toHaveLength(1);
    expect(tasks[0].done).toBe(true);
    const action = deriveNextAction(facts({ tasks }));
    expect(action.kind).not.toBe("execute-task");
  });
});

// ── deriveHandoff (integração pura) ──────────────────────────────────────────

describe("deriveHandoff · derivado completo [CO-4]", () => {
  it("é puro e serializável (round-trip JSON estável)", () => {
    const derived = deriveHandoff(facts());
    const roundTrip = JSON.parse(JSON.stringify(derived));
    expect(roundTrip.nextAction).toEqual(derived.nextAction);
    expect(roundTrip.seal).toBe(derived.seal);
    expect(derived.prohibitions.length).toBeGreaterThan(0);
  });
});
