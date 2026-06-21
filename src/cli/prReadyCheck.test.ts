import {
  evaluateReadyPreconditions,
  main,
  normalizeCheckRuns,
  detectSmokeTestsSuspended,
  deriveSmokeReadinessPolicy,
  smokeRelevantChangedPaths,
  ReadyCheckSnapshot,
  SnapshotCollector,
  Logger,
} from "./prReadyCheck.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** Builder de status efetivo (CO-4 r8): blocking derivado do contrato real. */
function readyStatus(
  typeId: string,
  requirement: "disabled" | "optional" | "recommended" | "required",
  state: "missing" | "current" | "stale" | "in-progress",
  decision: string | null = null
) {
  return {
    typeId,
    applicability: "yes" as const,
    requirement,
    state,
    decision,
    blocking: requirement === "required" && !(state === "current" && decision === "approved"),
    source: "repo-default",
    errors: [] as string[],
  };
}

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
    smokeTestsSuspended: false,
    checkpoint: {
      id: "checkpoint-exemplo",
      gateDecision: null,
      openBlockingCount: 0,
      reviewDecisions: [
        { role: "technical_audit", decision: "approved" },
        { role: "architectural_review", decision: "approved" },
      ],
      reviewStatuses: [
        readyStatus("technical_audit", "required", "current", "approved"),
        readyStatus("architectural_review", "required", "current", "approved"),
      ],
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

  it("DADO smoke temporariamente suspenso QUANDO avalia ENTÃO bloqueia Ready/Human Gate", () => {
    const result = evaluateReadyPreconditions(
      validSnapshot({
        smokeTestsSuspended: true,
        smokePolicy: {
          suspended: true,
          required: true,
          reason: "mudança de pacote",
          changedPaths: ["package.json"],
          triggerPaths: ["package.json"],
        },
      })
    );
    expect(result.ok).toBe(false);
    expect(
      result.failures.some((f) => f.includes("smoke tests estão temporariamente suspensos"))
    ).toBe(true);
  });

  it("DADO smoke suspenso em PR intermediário sem impacto de pacote QUANDO avalia ENTÃO não bloqueia Ready", () => {
    const result = evaluateReadyPreconditions(
      validSnapshot({
        smokeTestsSuspended: true,
        smokePolicy: {
          suspended: true,
          required: false,
          reason: "PR intermediário sem mudança de pacote/consumidor",
          changedPaths: ["src/cli/flow/GovernedFlow.ts"],
          triggerPaths: [],
        },
      })
    );
    expect(result.ok).toBe(true);
    expect(result.warnings.join(" ")).toContain("smoke real temporariamente suspenso");
  });

  it("DADO smoke suspenso em PR intermediário com mudança de pacote QUANDO avalia ENTÃO avisa sem bloquear", () => {
    const result = evaluateReadyPreconditions(
      validSnapshot({
        smokeTestsSuspended: true,
        smokePolicy: {
          suspended: true,
          required: false,
          reason:
            "PR intermediário com mudança de pacote/runtime consumidor (package.json); smoke real fica adiado para o fechamento final da spec e para o release",
          changedPaths: ["package.json"],
          triggerPaths: ["package.json"],
        },
      })
    );
    expect(result.ok).toBe(true);
    expect(result.failures.join(" ")).not.toContain("smoke");
    expect(result.warnings.join(" ")).toContain("smoke real temporariamente suspenso");
  });

  it("DADO smoke obrigatório ausente QUANDO avalia ENTÃO falha", () => {
    const result = evaluateReadyPreconditions(
      validSnapshot({
        checks: [{ name: "repo-validation", bucket: "pass" }],
        smokePolicy: {
          suspended: false,
          required: true,
          reason: "último nó antes da integração final",
          changedPaths: [],
          triggerPaths: [],
        },
      })
    );
    expect(result.ok).toBe(false);
    expect(result.failures.join(" ")).toContain('check obrigatório "smoke" não encontrado');
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

  it("DADO review obrigatório em changes_requested QUANDO avalia ENTÃO falha", () => {
    const snapshot = validSnapshot();
    const result = evaluateReadyPreconditions({
      ...snapshot,
      checkpoint: {
        ...snapshot.checkpoint!,
        reviewStatuses: [
          readyStatus("technical_audit", "required", "current", "changes_requested"),
          readyStatus("architectural_review", "required", "current", "approved"),
        ],
      },
    });
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.includes('"technical_audit"'))).toBe(true);
  });

  it("required MISSING e required STALE bloqueiam; required current libera", () => {
    const snapshot = validSnapshot();
    const missing = evaluateReadyPreconditions({
      ...snapshot,
      checkpoint: {
        ...snapshot.checkpoint!,
        reviewStatuses: [readyStatus("security_review", "required", "missing")],
      },
    });
    expect(missing.ok).toBe(false);
    expect(
      missing.failures.some((f) => f.includes("security_review") && f.includes("ausente"))
    ).toBe(true);

    const stale = evaluateReadyPreconditions({
      ...snapshot,
      checkpoint: {
        ...snapshot.checkpoint!,
        reviewStatuses: [readyStatus("security_review", "required", "stale", "approved")],
      },
    });
    expect(stale.ok).toBe(false);
    expect(stale.failures.some((f) => f.includes("stale"))).toBe(true);

    const current = evaluateReadyPreconditions({
      ...snapshot,
      checkpoint: {
        ...snapshot.checkpoint!,
        reviewStatuses: [readyStatus("security_review", "required", "current", "approved")],
      },
    });
    expect(current.ok).toBe(true);
  });

  it("optional/recommended stale ou missing NÃO bloqueiam Ready; recommended vira advisory", () => {
    const snapshot = validSnapshot();
    const result = evaluateReadyPreconditions({
      ...snapshot,
      checkpoint: {
        ...snapshot.checkpoint!,
        reviewStatuses: [
          readyStatus("technical_audit", "optional", "stale", "approved"),
          readyStatus("architectural_review", "optional", "missing"),
          readyStatus("mece_review", "recommended", "missing"),
        ],
      },
    });
    expect(result.ok).toBe(true);
    expect(result.warnings.some((w) => w.includes("mece_review") && w.includes("advisory"))).toBe(
      true
    );
    expect(result.warnings.some((w) => w.includes("technical_audit"))).toBe(false);
  });

  it("conflito de policy (mesma prioridade) propagado no status FALHA o check", () => {
    const snapshot = validSnapshot();
    const result = evaluateReadyPreconditions({
      ...snapshot,
      checkpoint: {
        ...snapshot.checkpoint!,
        reviewStatuses: [
          {
            ...readyStatus("security_review", "optional", "missing"),
            errors: ['conflito de policy para "security_review": regras de MESMA prioridade'],
          },
        ],
      },
    });
    expect(result.ok).toBe(false);
    expect(result.failures.some((f) => f.includes("policy de reviews inválida"))).toBe(true);
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

describe("CLI — pr-ready:check · política de smoke real", () => {
  it("classifica caminhos que afetam pacote/consumidor", () => {
    expect(
      smokeRelevantChangedPaths([
        "src/cli/flow/GovernedFlow.ts",
        ".github/workflows/smoke-multi-os.yml",
        "package.json",
        "src/domain/provisioning/ProviderCatalog.ts",
      ])
    ).toEqual(["package.json", "src/domain/provisioning/ProviderCatalog.ts"]);
  });

  it("não exige smoke real em PR intermediário sem impacto de pacote", () => {
    const policy = deriveSmokeReadinessPolicy({
      suspended: true,
      changedPaths: ["src/cli/flow/GovernedFlow.ts"],
      activeNode: { id: "co-flow-convergence", role: "execution", terminal: false },
      nextNode: { id: "co-capture", role: "execution", terminal: false },
    });

    expect(policy.required).toBe(false);
    expect(policy.suspended).toBe(true);
  });

  it("mantém mudança de pacote como aviso em PR intermediário, não como bloqueio", () => {
    const policy = deriveSmokeReadinessPolicy({
      suspended: true,
      changedPaths: ["package.json", "package-lock.json"],
      activeNode: { id: "co-flow-convergence", role: "execution", terminal: false },
      nextNode: { id: "co-capture", role: "execution", terminal: false },
    });

    expect(policy.required).toBe(false);
    expect(policy.triggerPaths).toEqual(["package.json", "package-lock.json"]);
    expect(policy.reason).toContain("PR intermediário");
  });

  it("exige smoke real no último nó antes da integração", () => {
    const policy = deriveSmokeReadinessPolicy({
      suspended: true,
      changedPaths: ["docs/scripts.md"],
      activeNode: { id: "knowledge-readiness", role: "execution", terminal: false },
      nextNode: { id: "integration-final", role: "integration", terminal: true },
    });

    expect(policy.required).toBe(true);
    expect(policy.reason).toContain("integração final");
  });

  it("exige smoke real quando o diff não pode ser classificado", () => {
    const policy = deriveSmokeReadinessPolicy({
      suspended: true,
      changedPaths: null,
      activeNode: { id: "co-flow-convergence", role: "execution", terminal: false },
      nextNode: { id: "co-capture", role: "execution", terminal: false },
    });

    expect(policy.required).toBe(true);
    expect(policy.reason).toContain("não foi possível classificar");
  });
});

describe("CLI — pr-ready:check · normalização de checks", () => {
  it("deduplica check-runs por nome mantendo o run mais recente", () => {
    const checks = normalizeCheckRuns([
      {
        name: "governance-pr-check",
        status: "completed",
        conclusion: "failure",
        started_at: "2026-06-16T12:00:00Z",
      },
      {
        name: "governance-pr-check",
        status: "completed",
        conclusion: "success",
        started_at: "2026-06-16T12:53:00Z",
      },
      {
        name: "repo-validation",
        status: "completed",
        conclusion: "success",
        started_at: "2026-06-16T12:38:00Z",
      },
    ]);

    expect(checks).toEqual([
      { name: "governance-pr-check", bucket: "pass" },
      { name: "repo-validation", bucket: "pass" },
    ]);
  });
});

describe("CLI — pr-ready:check · suspensão temporária de smoke", () => {
  it("detecta a suspensão governada pelo marcador do workflow smoke", () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), "ai-guidelines-smoke-suspended-"));
    const workflow = path.join(repo, ".github", "workflows");
    fs.mkdirSync(workflow, { recursive: true });
    fs.writeFileSync(
      path.join(workflow, "smoke-multi-os.yml"),
      'env:\n  AI_GUIDELINES_SMOKE_TEMPORARILY_SUSPENDED: "true"\n'
    );

    expect(detectSmokeTestsSuspended(repo)).toBe(true);
  });

  it("não marca suspensão quando o workflow smoke não declara o marcador", () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), "ai-guidelines-smoke-active-"));
    const workflow = path.join(repo, ".github", "workflows");
    fs.mkdirSync(workflow, { recursive: true });
    fs.writeFileSync(path.join(workflow, "smoke-multi-os.yml"), "jobs:\n  smoke:\n");

    expect(detectSmokeTestsSuspended(repo)).toBe(false);
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
