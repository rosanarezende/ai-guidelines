import { runActiveSpecsConsistencyCheck } from "./activeSpecsConsistencyCheck.js";

/** Índice mínimo válido com UMA entry de `stage` dado. */
function indexWith(stage: string): string {
  return `
version: 1
active_specs:
  - id: "0024"
    slug: context-architecture
    branch: feat/spec-0024-x
    stage: ${stage}
    status: active
    spec_path: .governance/specs/0024-context-architecture
    source_state_path: .governance/specs/0024-context-architecture/state.yml
    updated_at: 2026-06-06T00:00:00.000-03:00
`;
}

function completedIndex(): string {
  return `
version: 1
active_specs:
  - id: "0023"
    slug: workflow-runtime
    branch: feat/spec-0023-x
    stage: done
    status: completed
    spec_path: .governance/specs/0023-workflow-runtime
    source_state_path: .governance/specs/0023-workflow-runtime/state.yml
    updated_at: 2026-06-06T00:00:00.000-03:00
`;
}

function historyWith(stage: string): string {
  return `
version: 1
specs_history:
  - id: "0023"
    slug: workflow-runtime
    branch: feat/spec-0023-x
    stage: ${stage}
    status: completed
    spec_path: .governance/specs/0023-workflow-runtime
    source_state_path: .governance/specs/0023-workflow-runtime/state.yml
    updated_at: 2026-06-06T00:00:00.000-03:00
`;
}

/** state.yml mínimo válido (schema 4-chave) com `stage` dado. */
function stateWith(stage: string): string {
  return `
stage: ${stage}
gate:
  status: closed
focus: []
next: []
`;
}

describe("CLI — active-specs:check · consistência stage↔SSOT [BR-ACTIVE-SPECS-DRIFT]", () => {
  it("DADO entry.stage == state.yml.stage QUANDO checa ENTÃO ok", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexWith("implementation"),
      readStateYml: () => stateWith("implementation"),
    });
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") expect(r.count).toBe(1);
  });

  // Regressão do bug real: 0023 listada como `closing` enquanto a SSOT dizia `done`.
  it("DADO entry.stage divergente da SSOT (closing vs done) ENTÃO falha apontando o stage stale", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexWith("closing"),
      readStateYml: () => stateWith("done"),
    });
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") {
      expect(r.failures).toHaveLength(1);
      expect(r.failures[0].id).toBe("0024");
      expect(r.failures[0].message).toMatch(/stage stale/);
      expect(r.failures[0].message).toContain("closing");
      expect(r.failures[0].message).toContain("done");
    }
  });

  it("DADO entry apontando state.yml inexistente ENTÃO falha (SSOT ausente)", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexWith("implementation"),
      readStateYml: () => null,
    });
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") {
      expect(r.failures[0].message).toMatch(/não encontrado/);
    }
  });

  it("DADO entry completed no índice ativo ENTÃO falha pedindo specs-history", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: completedIndex(),
      readStateYml: () => stateWith("done"),
    });
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") {
      expect(r.failures[0].message).toMatch(/completed não pertence/);
      expect(r.failures[0].message).toContain("specs/history.yml");
    }
  });

  it("DADO histórico com stage fiel à SSOT ENTÃO conta ativo + histórico", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexWith("implementation"),
      historyText: historyWith("done"),
      readStateYml: (rel) =>
        rel.includes("0023-workflow-runtime") ? stateWith("done") : stateWith("implementation"),
    });
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") expect(r.count).toBe(2);
  });
});

/** Entry parametrizável para os cenários de coerência fatos→projeção. */
interface EntryOverrides {
  id?: string;
  slug?: string;
  branch?: string;
  stage?: string;
  specPath?: string;
  sourceStatePath?: string;
}

function entryYaml(overrides: EntryOverrides = {}): string {
  const id = overrides.id ?? "0024";
  const slug = overrides.slug ?? "context-architecture";
  const specPath = overrides.specPath ?? `.governance/specs/${id}-${slug}`;
  return [
    `  - id: "${id}"`,
    `    slug: ${slug}`,
    `    branch: ${overrides.branch ?? `feat/spec-${id}-x`}`,
    `    stage: ${overrides.stage ?? "implementation"}`,
    `    status: active`,
    `    spec_path: ${specPath}`,
    `    source_state_path: ${overrides.sourceStatePath ?? `${specPath}/state.yml`}`,
    `    updated_at: 2026-06-06T00:00:00.000-03:00`,
  ].join("\n");
}

function indexOf(...entries: string[]): string {
  return `\nversion: 1\nactive_specs:\n${entries.join("\n")}\n`;
}

// Regressão do dogfood CO-4 (2026-06-11): active.yml ficou DUAS gerações stale em
// `branch` (#38→#41) e passou no check porque o escopo parava em `stage`; o handoff
// recuperou a spec por fallback canônico e o drift ficou invisível até reconciliação
// humana. Estes cenários cravam: projeção divergente de fato observável FALHA.
describe("CLI — active-specs:check · coerência branch/identidade fatos→projeção [dogfood CO-4]", () => {
  it("DADO branch projetada == branch factual da mesma spec ENTÃO ok", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexOf(entryYaml({ branch: "feat/spec-0024-co-projection" })),
      readStateYml: () => stateWith("implementation"),
      currentBranch: "feat/spec-0024-co-projection",
    });
    expect(r.kind).toBe("ok");
  });

  it("DADO branch projetada stale (cenário real #38→#41) ENTÃO falha com projetado × factual × comando", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexOf(entryYaml({ branch: "feat/spec-0024-bootstrap-compiler" })),
      readStateYml: () => stateWith("implementation"),
      currentBranch: "feat/spec-0024-co-projection",
    });
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") {
      expect(r.failures).toHaveLength(1);
      expect(r.failures[0].message).toMatch(/branch stale/);
      expect(r.failures[0].message).toContain("feat/spec-0024-bootstrap-compiler");
      expect(r.failures[0].message).toContain("feat/spec-0024-co-projection");
      expect(r.failures[0].message).toContain("fonte: git branch corrente");
      expect(r.failures[0].message).toContain("workflow publish-state");
    }
  });

  it("DADO stage fiel mas branch stale ENTÃO falha mesmo assim (stage correto não compra branch errada)", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexOf(entryYaml({ stage: "implementation", branch: "feat/spec-0024-old" })),
      readStateYml: () => stateWith("implementation"),
      currentBranch: "feat/spec-0024-new",
    });
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") expect(r.failures[0].message).toMatch(/branch stale/);
  });

  it("DADO branch correta mas spec_path com basename divergente de id-slug ENTÃO falha (identidade stale)", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexOf(
        entryYaml({
          branch: "feat/spec-0024-co-projection",
          specPath: ".governance/specs/0024-outra-coisa",
          sourceStatePath: ".governance/specs/0024-outra-coisa/state.yml",
        })
      ),
      readStateYml: () => stateWith("implementation"),
      currentBranch: "feat/spec-0024-co-projection",
    });
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") {
      expect(r.failures[0].message).toMatch(/identidade stale/);
      expect(r.failures[0].message).toContain("0024-context-architecture");
      expect(r.failures[0].message).toContain("0024-outra-coisa");
    }
  });

  it("DADO source_state_path fora do spec_path ENTÃO falha (round-trip do gerador)", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexOf(
        entryYaml({ sourceStatePath: ".governance/specs/0099-fantasma/state.yml" })
      ),
      readStateYml: () => stateWith("implementation"),
    });
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") expect(r.failures[0].message).toMatch(/source_state_path stale/);
  });

  it("DADO branch factual não observável (detached HEAD/CI) ENTÃO sub-check de branch é skipped", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexOf(entryYaml({ branch: "feat/spec-0024-qualquer" })),
      readStateYml: () => stateWith("implementation"),
      currentBranch: null,
    });
    expect(r.kind).toBe("ok");
  });

  it("DADO branch corrente fora do padrão feat/spec-NNNN-* (main) ENTÃO sub-check de branch é skipped", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexOf(entryYaml({ branch: "feat/spec-0024-qualquer" })),
      readStateYml: () => stateWith("implementation"),
      currentBranch: "main",
    });
    expect(r.kind).toBe("ok");
  });

  it("DADO múltiplas specs ativas e branch corrente de UMA delas stale ENTÃO falha só a entry correspondente", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexOf(
        entryYaml({ branch: "feat/spec-0024-bootstrap-compiler" }),
        entryYaml({ id: "0030", slug: "outra-spec", branch: "feat/spec-0030-inicio" })
      ),
      readStateYml: () => stateWith("implementation"),
      currentBranch: "feat/spec-0024-co-projection",
    });
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") {
      expect(r.failures).toHaveLength(1);
      expect(r.failures[0].id).toBe("0024");
    }
  });

  it("DADO entry de histórico com branch antiga da MESMA spec do branch corrente ENTÃO branch não é checada (spec concluída)", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexOf(entryYaml({ branch: "feat/spec-0024-co-projection" })),
      historyText: historyWith("done"), // entry 0023 com branch feat/spec-0023-x
      readStateYml: (rel) =>
        rel.includes("0023-workflow-runtime") ? stateWith("done") : stateWith("implementation"),
      currentBranch: "feat/spec-0023-revival",
    });
    expect(r.kind).toBe("ok");
  });
});

// Coerência ESTADO↔NARRATIVA dos sub-checkpoints (dogfood CO-3.3): um `[x]` que
// ainda diz "EM EXECUÇÃO" mente para a retomada — mesma classe de drift que
// stage/branch. O check reusa `parseSubCheckpoints` e lê o cursor da topologia.
describe("CLI — active-specs:check · coerência ESTADO↔NARRATIVA de sub-checkpoints [dogfood CO-3.3]", () => {
  /** state.yml com cursor de topologia apontando para o checkpoint dado. */
  function stateWithCursor(checkpoint: string): string {
    return [
      "stage: implementation",
      "gate:",
      "  status: closed",
      "focus: []",
      "next: []",
      "topology:",
      "  cursor:",
      "    pr: co-enforcement",
      `    checkpoint: ${checkpoint}`,
      "  prs:",
      "    concluded: []",
      "    active:",
      "      - id: co-enforcement",
      "        github_pr: 42",
      "        role: execution",
      "        terminal: false",
      "        sequence: 1",
      "        checkpoints:",
      `          - ${checkpoint}`,
      "    planned:",
      "      - id: integration-final",
      "        github_pr: null",
      "        role: integration",
      "        terminal: true",
      "        sequence: null",
      "        checkpoints:",
      "          - checkpoint-integration-final",
      "",
    ].join("\n");
  }

  function tasksMd(
    co31 = "[x]",
    co31Tail = "Concluído.",
    co33 = "[/]",
    co34Tail = "advisory."
  ): string {
    return [
      "## Execução",
      "",
      "- [/] **Checkpoint co-enforcement** (nó `co-enforcement`)",
      `    - ${co31} **CO-3.1 — Constraint + EnforcementBinding**: fatia vertical. ${co31Tail}`,
      "    - [x] **CO-3.2 — knowledge:compile**: entrypoint humano.",
      `    - ${co33} **CO-3.3 — migração e remoção do substrato legacy**: port TS.`,
      `    - [ ] **CO-3.4 — dogfood do enforcement e recibo**: ${co34Tail}`,
      "",
    ].join("\n");
  }

  /** Leitor que despacha por sufixo: state.yml × tasks.md. */
  function reader(state: string, tasks: string): (rel: string) => string | null {
    return (rel) => (rel.endsWith("tasks.md") ? tasks : rel.endsWith("state.yml") ? state : null);
  }

  it("DADO tasks.md coerente QUANDO checa ENTÃO ok", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexOf(entryYaml()),
      readStateYml: reader(stateWithCursor("checkpoint-co-enforcement"), tasksMd()),
    });
    expect(r.kind).toBe("ok");
  });

  it("DADO um [x] que ainda diz 'EM EXECUÇÃO' QUANDO checa ENTÃO falha citando o sub-checkpoint", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexOf(entryYaml()),
      readStateYml: reader(
        stateWithCursor("checkpoint-co-enforcement"),
        tasksMd("[x]", "EM EXECUÇÃO.")
      ),
    });
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") {
      expect(r.failures.some((f) => /CO-3\.1.*em execução/i.test(f.message))).toBe(true);
    }
  });

  it("DADO dois sub-checkpoints [/] QUANDO checa ENTÃO falha (exatamente um pode estar ativo)", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexOf(entryYaml()),
      // CO-3.1 vira [/] também → dois ativos.
      readStateYml: reader(
        stateWithCursor("checkpoint-co-enforcement"),
        tasksMd("[/]", "port TS.", "[/]")
      ),
    });
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") {
      expect(
        r.failures.some((f) => /mais de um sub-checkpoint \[\/\] ativo/i.test(f.message))
      ).toBe(true);
    }
  });

  it("DADO um [ ] que diz 'concluído' QUANDO checa ENTÃO falha", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexOf(entryYaml()),
      readStateYml: reader(
        stateWithCursor("checkpoint-co-enforcement"),
        tasksMd("[x]", "Concluído.", "[/]", "CONCLUÍDO.")
      ),
    });
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") {
      expect(r.failures.some((f) => /CO-3\.4.*concluído\/implementado/i.test(f.message))).toBe(
        true
      );
    }
  });

  it("DADO state.yml sem topologia QUANDO checa ENTÃO coerência é SKIPPED (sem cursor)", () => {
    const r = runActiveSpecsConsistencyCheck({
      indexText: indexOf(entryYaml()),
      // stateWith sem topology + tasks.md incoerente: o check não tem cursor → no-op.
      readStateYml: reader(stateWith("implementation"), tasksMd("[x]", "EM EXECUÇÃO.")),
    });
    expect(r.kind).toBe("ok");
  });
});
