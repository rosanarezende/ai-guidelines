import {
  evaluateReadyPreconditions,
  main,
  ReadyCheckSnapshot,
  SnapshotCollector,
  Logger,
} from "./prReadyCheck.js";

const SHA = "abc1234def5678abc1234def5678abc1234def56";

function validSnapshot(overrides: Partial<ReadyCheckSnapshot> = {}): ReadyCheckSnapshot {
  return {
    pr: {
      number: 39,
      state: "open",
      isDraft: true,
      title: "[🛠️7️⃣➜] [Spec 0024] exemplo",
      body: "(body já validado via readyBodyContractReasons)",
      labels: [],
      headRefOid: SHA,
      headRefName: "feat/spec-0024-exemplo",
    },
    checks: [
      { name: "repo-validation", bucket: "pass" },
      { name: "smoke", bucket: "pass" },
      { name: "governance-pr-check", bucket: "pass" },
    ],
    readyBodyContractReasons: [],
    localHeadSha: SHA,
    workingTreeClean: true,
    checkpoint: {
      id: "checkpoint-exemplo",
      gateDecision: null,
      openBlockingCount: 0,
      reviewDecisions: [
        { role: "technical_audit", decision: "approved" },
        { role: "architectural_review", decision: "approved" },
      ],
      requiredReviewRoles: ["technical_audit", "architectural_review"],
    },
    ...overrides,
  };
}

describe("CLI — pr-ready:check · precondições de Ready [BR-PR-READY-CHECK]", () => {
  it("DADO snapshot válido QUANDO avalia ENTÃO passa (pronto para Ready)", () => {
    const result = evaluateReadyPreconditions(validSnapshot());
    expect(result.failures).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("DADO body Draft incompleto para o contrato Ready QUANDO avalia ENTÃO falha", () => {
    const result = evaluateReadyPreconditions(
      validSnapshot({
        readyBodyContractReasons: [
          'Template incompleto: seção obrigatória "## Validação, evidências e checklist" não encontrada (precisa ser um header markdown em linha própria).',
        ],
      })
    );
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.startsWith("contrato Ready do body:"))).toBe(true);
  });

  it("DADO Valor entregue só com placeholder QUANDO avalia ENTÃO falha", () => {
    const result = evaluateReadyPreconditions(
      validSnapshot({
        readyBodyContractReasons: [
          'Governança visual: a seção "## Valor entregue" está vazia ou só com placeholder — preencha o prompt final autorado.',
        ],
      })
    );
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.includes("Valor entregue"))).toBe(true);
  });

  it("DADO check de CI vermelho QUANDO avalia ENTÃO falha", () => {
    const result = evaluateReadyPreconditions(
      validSnapshot({
        checks: [
          { name: "repo-validation", bucket: "pass" },
          { name: "smoke", bucket: "fail" },
        ],
      })
    );
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.includes('"smoke" = fail'))).toBe(true);
  });

  it("DADO check de CI pendente QUANDO avalia ENTÃO falha (verde no HEAD final é precondição)", () => {
    const result = evaluateReadyPreconditions(
      validSnapshot({ checks: [{ name: "smoke", bucket: "pending" }] })
    );
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.includes("pendente"))).toBe(true);
  });

  it("DADO finding bloqueante aberto QUANDO avalia ENTÃO falha", () => {
    const snapshot = validSnapshot();
    const result = evaluateReadyPreconditions({
      ...snapshot,
      checkpoint: { ...snapshot.checkpoint!, openBlockingCount: 2 },
    });
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.includes("2 finding(s) bloqueante(s)"))).toBe(true);
  });

  it("DADO Human Gate já registrado antes de Ready QUANDO avalia ENTÃO falha como inconsistência de sequência", () => {
    const snapshot = validSnapshot();
    const result = evaluateReadyPreconditions({
      ...snapshot,
      checkpoint: { ...snapshot.checkpoint!, gateDecision: "approved" },
    });
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.includes("ANTES do Ready"))).toBe(true);
  });

  it("DADO review obrigatória em changes_requested QUANDO avalia ENTÃO falha", () => {
    const snapshot = validSnapshot();
    const result = evaluateReadyPreconditions({
      ...snapshot,
      checkpoint: {
        ...snapshot.checkpoint!,
        reviewDecisions: [
          { role: "technical_audit", decision: "changes_requested" },
          { role: "architectural_review", decision: "approved" },
        ],
      },
    });
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.includes('"technical_audit"'))).toBe(true);
  });

  it("DADO HEAD local diferente do HEAD remoto QUANDO avalia ENTÃO falha (body/CI devem cobrir o HEAD final)", () => {
    const result = evaluateReadyPreconditions(validSnapshot({ localHeadSha: "fff0000fff0000" }));
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.includes("difere do HEAD remoto"))).toBe(true);
  });

  it("DADO working tree suja QUANDO avalia ENTÃO falha", () => {
    const result = evaluateReadyPreconditions(validSnapshot({ workingTreeClean: false }));
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.includes("working tree"))).toBe(true);
  });

  it("DADO PR já Ready QUANDO avalia ENTÃO reporta como aviso (check é pré-conversão), sem falhar por isso", () => {
    const snapshot = validSnapshot();
    const result = evaluateReadyPreconditions({
      ...snapshot,
      pr: { ...snapshot.pr, isDraft: false },
    });
    expect(result.ok).toBe(true);
    expect(result.warnings.some((w) => w.includes("já está Ready"))).toBe(true);
  });
});

describe("CLI — pr-ready:check · saída e semântica [BR-PR-READY-CHECK]", () => {
  function capture(): { logger: Logger; lines: string[] } {
    const lines: string[] = [];
    return {
      logger: { info: (m) => lines.push(m), error: (m) => lines.push(m) },
      lines,
    };
  }

  function collectorOf(snapshot: ReadyCheckSnapshot): SnapshotCollector {
    return { collect: () => snapshot };
  }

  it("DADO PR válido para Ready QUANDO main ENTÃO passa deixando explícito que Ready NÃO autoriza merge nem converte", () => {
    const { logger, lines } = capture();
    const code = main(["--pr", "39", "--repo", "o/r"], {
      logger,
      collector: collectorOf(validSnapshot()),
    });
    expect(code).toBe(0);
    const output = lines.join("\n");
    expect(output).toContain("NÃO autoriza merge");
    expect(output).toContain("não converte nada");
    expect(output).toContain("Human Gate");
  });

  it("DADO precondições faltando QUANDO main ENTÃO retorna 1 e mostra a sequência canônica", () => {
    const { logger, lines } = capture();
    const code = main(["--pr", "39", "--repo", "o/r"], {
      logger,
      collector: collectorOf(validSnapshot({ workingTreeClean: false })),
    });
    expect(code).toBe(1);
    expect(lines.join("\n")).toContain(
      "PR body final → CI verde no HEAD final → Draft → Ready → Human Gate"
    );
  });

  it("DADO argumentos inválidos QUANDO main ENTÃO retorna 2 com uso", () => {
    const { logger, lines } = capture();
    expect(main([], { logger })).toBe(2);
    expect(lines.join("\n")).toContain("pr-ready:check -- --pr");
  });
});
