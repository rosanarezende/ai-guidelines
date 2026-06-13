import * as fs from "node:fs";
import * as path from "node:path";
import { HandoffFacts, NextAction, NextActionKind } from "./handoffFacts.js";
import {
  WorkBriefInput,
  WorkFinding,
  deriveWorkBrief,
  parseWorkAuthorization,
  renderWorkBrief,
} from "./workBrief.js";
import { WorkMode, WorkPolicy, parseWorkPolicy } from "../infrastructure/yaml/workPolicyReader.js";

const POLICY: WorkPolicy = parseWorkPolicy(
  fs.readFileSync(path.join(process.cwd(), ".core/governance/work-policy.yml"), "utf-8")
);

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
      branch: "feat/x",
      head: "aaaaaaa",
      workingTreeClean: true,
      ahead: 0,
      behind: 0,
      upstream: "origin/feat/x",
    },
    pullRequest: {
      number: 42,
      state: "OPEN",
      isDraft: true,
      baseRefName: "base",
      headRefName: "feat/x",
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
      closedFindings: 0,
      resolutions: 0,
      gateDecision: null,
    },
    tasks: [],
    insights: [],
    driftWarnings: [],
    sources: [{ id: "pull-request", origin: "gh", status: "fresh", fingerprint: "x" }],
    ...over,
  };
}

function nextAction(kind: NextActionKind, over: Partial<NextAction> = {}): NextAction {
  return {
    kind,
    description: `next: ${kind}`,
    basis: [`basis: ${kind}`],
    blocking: false,
    ...over,
  };
}

function finding(over: Partial<WorkFinding> = {}): WorkFinding {
  return {
    qualified: "technical_audit#F1",
    role: "technical_audit",
    localId: "F1",
    severity: "high",
    disposition: "open",
    location: "src/cli/constraintsCheck.ts#L48",
    hasFixedResolution: true,
    ref: "5ad592a",
    refValid: true,
    ...over,
  };
}

function derive(over: Partial<WorkBriefInput>) {
  return deriveWorkBrief({
    facts: facts(),
    nextAction: nextAction("execute-task"),
    findings: [],
    policy: POLICY,
    workingTreeState: "clean",
    authorization: null,
    ...over,
  });
}

describe("workBrief · inferência de modo [work]", () => {
  it("[1] finding open sem resolution → resolve_findings", () => {
    const b = derive({
      nextAction: nextAction("resolve-findings"),
      findings: [finding({ hasFixedResolution: false, ref: null, refValid: null })],
    });
    expect(b.mode).toBe("resolve_findings");
  });

  it("[2] finding open com resolution pending (não-fixed) → resolve_findings", () => {
    const b = derive({
      nextAction: nextAction("resolve-findings"),
      findings: [finding({ hasFixedResolution: false })],
    });
    expect(b.mode).toBe("resolve_findings");
  });

  it("[3] todos open com fixed e refs válidas → await_revalidation", () => {
    const b = derive({
      nextAction: nextAction("resolve-findings"),
      findings: [
        finding({ localId: "F1" }),
        finding({ qualified: "technical_audit#F2", localId: "F2" }),
      ],
    });
    expect(b.mode).toBe("await_revalidation");
  });

  it("[4] resolution com ref inválida → resolve_findings", () => {
    const b = derive({
      nextAction: nextAction("resolve-findings"),
      findings: [finding({ refValid: false })],
    });
    expect(b.mode).toBe("resolve_findings");
  });

  it("[5] task aberta sem findings → implement_checkpoint", () => {
    const b = derive({
      nextAction: nextAction("execute-task"),
      facts: facts({ tasks: [{ text: "- **Tarefa X**", done: false, line: 10 }] }),
    });
    expect(b.mode).toBe("implement_checkpoint");
    expect(b.object.task?.line).toBe(10);
  });

  it("[6] tasks concluídas + PR Draft → prepare_close", () => {
    const b = derive({ nextAction: nextAction("prepare-ready") });
    expect(b.mode).toBe("prepare_close");
  });

  it("[7] gate aprovado → blocked (sem nova implementação)", () => {
    const b = derive({
      facts: facts({
        lifecycle: { ...facts().lifecycle!, gateDecision: "approved" },
      }),
      nextAction: nextAction("execute-task"),
    });
    expect(b.mode).toBe("blocked");
  });

  it("[8] review opcional stale não cria trabalho (task → implement_checkpoint)", () => {
    const b = derive({
      facts: facts({
        tasks: [{ text: "- **Tarefa X**", done: false, line: 10 }],
        lifecycle: {
          ...facts().lifecycle!,
          reviewStatuses: [
            {
              typeId: "technical_audit",
              applicability: "yes",
              requirement: "optional",
              state: "stale",
              decision: "approved",
              blocking: false,
              source: "default",
            },
          ],
        },
      }),
      nextAction: nextAction("execute-task"),
    });
    expect(b.mode).toBe("implement_checkpoint");
  });

  it("[9] review required stale → await_revalidation apontando review (não implementação)", () => {
    const b = derive({
      facts: facts({
        lifecycle: {
          ...facts().lifecycle!,
          reviewStatuses: [
            {
              typeId: "technical_audit",
              applicability: "yes",
              requirement: "required",
              state: "stale",
              decision: "approved",
              blocking: true,
              source: "rule:x",
            },
          ],
        },
      }),
      nextAction: nextAction("run-required-review"),
    });
    expect(b.mode).toBe("await_revalidation");
    expect(b.object.reviewLane).toBe("technical_audit");
    expect(b.forbiddenActions).toContain("run-review");
  });

  it("[10] precedência finding > task (resolve-findings vence task aberta)", () => {
    const b = derive({
      nextAction: nextAction("resolve-findings"),
      findings: [finding({ hasFixedResolution: false })],
      facts: facts({ tasks: [{ text: "- **Tarefa X**", done: false, line: 10 }] }),
    });
    expect(b.mode).toBe("resolve_findings");
  });
});

describe("workBrief · autoridade [work]", () => {
  it("[11] sem autorização → commit/push proibidos", () => {
    const b = derive({
      nextAction: nextAction("resolve-findings"),
      findings: [finding({ hasFixedResolution: false })],
      authorization: null,
    });
    expect(b.authorization.kind).toBe("none");
    expect(b.authorization.commitAllowed).toBe(false);
    expect(b.authorization.pushAllowed).toBe(false);
  });

  it("[12] autorização válida + modo escrevível → commit/push permitidos", () => {
    const b = derive({
      nextAction: nextAction("resolve-findings"),
      findings: [finding({ hasFixedResolution: false })],
      authorization: "explicit-work-request",
    });
    expect(b.authorization.commitAllowed).toBe(true);
    expect(b.authorization.pushAllowed).toBe(true);
  });

  it("[13] autorização NÃO cria trabalho (blocked → commit/push proibidos mesmo autorizado)", () => {
    const b = derive({
      facts: facts({ driftWarnings: ["projeção stale"] }),
      authorization: "explicit-work-request",
    });
    expect(b.mode).toBe("blocked");
    expect(b.authorization.commitAllowed).toBe(false);
    expect(b.authorization.pushAllowed).toBe(false);
  });

  it("[14] autorização inválida falha o parse", () => {
    expect(parseWorkAuthorization("foo")).toBe("invalid");
    expect(parseWorkAuthorization(undefined)).toBeNull();
    expect(parseWorkAuthorization("explicit-work-request")).toBe("explicit-work-request");
  });

  it("[15] escopo não se estende ao próximo sub-checkpoint", () => {
    const b = derive({
      nextAction: nextAction("resolve-findings"),
      findings: [finding({ hasFixedResolution: false })],
      authorization: "explicit-work-request",
    });
    expect(b.forbiddenActions).toContain("start-next-subcheckpoint");
  });
});

describe("workBrief · report contract governado [work]", () => {
  const MODES: WorkMode[] = [
    "blocked",
    "resolve_findings",
    "await_revalidation",
    "implement_checkpoint",
    "prepare_close",
    "current",
  ];

  function briefForMode(mode: WorkMode) {
    switch (mode) {
      case "blocked":
        return derive({ facts: facts({ driftWarnings: ["x"] }) });
      case "resolve_findings":
        return derive({
          nextAction: nextAction("resolve-findings"),
          findings: [finding({ hasFixedResolution: false })],
        });
      case "await_revalidation":
        return derive({ nextAction: nextAction("resolve-findings"), findings: [finding()] });
      case "implement_checkpoint":
        return derive({ nextAction: nextAction("execute-task") });
      case "prepare_close":
        return derive({ nextAction: nextAction("prepare-ready") });
      case "current":
        return derive({ nextAction: nextAction("exercise-human-gate") });
    }
  }

  it("[16] cada modo tem report_sections não-vazias", () => {
    for (const mode of MODES) {
      expect(briefForMode(mode).reportSections.length).toBeGreaterThan(0);
    }
  });

  it("[17] renderer inclui todos os headers do report contract do modo", () => {
    for (const mode of MODES) {
      const brief = briefForMode(mode);
      const out = renderWorkBrief({
        snapshot: {
          collected: { facts: facts() },
          derived: {
            nextAction: nextAction("resolve-findings"),
            seal: "deadbeef",
            prohibitions: [],
            facts: facts(),
          },
          receiptSkippedReason: null,
        } as never,
        brief,
      });
      for (const section of brief.reportSections) {
        expect(out).toContain(section);
      }
    }
  });

  it("[18] alteração da policy muda o report contract (sem duplicação em TS)", () => {
    const custom: WorkPolicy = {
      ...POLICY,
      modes: {
        ...POLICY.modes,
        implement_checkpoint: {
          ...POLICY.modes.implement_checkpoint,
          reportSections: ["Cabecalho Custom", "Outra"],
        },
      },
    };
    const b = derive({ nextAction: nextAction("execute-task"), policy: custom });
    expect(b.reportSections).toEqual(["Cabecalho Custom", "Outra"]);
  });

  it("[19] modo sem entrada na policy falha (contrato incompleto)", () => {
    const broken = {
      ...POLICY,
      modes: { ...POLICY.modes },
    } as { version: number; modes: Record<string, unknown> };
    delete broken.modes.implement_checkpoint;
    expect(() =>
      derive({ nextAction: nextAction("execute-task"), policy: broken as unknown as WorkPolicy })
    ).toThrow(/contrato incompleto/);
  });

  it("[20] nenhum header de outro modo vaza", () => {
    const blocked = briefForMode("blocked");
    expect(blocked.reportSections).not.toContain("Arquitetura implementada");
  });
});

describe("workBrief · snapshot e degradação [work]", () => {
  it("[22] functional HEAD e git HEAD distintos são exibidos", () => {
    const b = derive({
      facts: facts({ git: { ...facts().git, head: "gggggggg" } }),
      effectiveFunctionalHead: "ffffffff",
    });
    const out = renderWorkBrief({
      snapshot: {
        collected: { facts: facts({ git: { ...facts().git, head: "gggggggg" } }) },
        derived: {
          nextAction: nextAction("execute-task"),
          seal: "s",
          prohibitions: [],
          facts: facts(),
        },
        receiptSkippedReason: null,
      } as never,
      brief: b,
    });
    expect(out).toContain("git HEAD: gggggggg");
    expect(out).toContain("functional HEAD: ffffffff");
  });

  it("[23] working tree funcional suja bloqueia", () => {
    const b = derive({
      nextAction: nextAction("execute-task"),
      workingTreeState: "functional-dirty",
      functionalDirtyFiles: ["src/x.ts"],
    });
    expect(b.mode).toBe("blocked");
  });

  it("[24] review-only dirty é declarado (não bloqueia)", () => {
    const b = derive({ nextAction: nextAction("execute-task"), workingTreeState: "review-only" });
    expect(b.mode).toBe("implement_checkpoint");
    expect(b.degraded.join(" ")).toMatch(/review/i);
  });

  it("[25] remoto indisponível gera degradação, não fato inventado", () => {
    const b = derive({
      facts: facts({
        sources: [{ id: "pull-request", origin: "gh", status: "unavailable", fingerprint: "-" }],
      }),
      nextAction: nextAction("execute-task"),
    });
    expect(b.degraded.join(" ")).toMatch(/remota.*unavailable/i);
  });

  it("[26] branch behind bloqueia escrita", () => {
    const b = derive({
      facts: facts({
        git: { ...facts().git, head: "aaaaaaa", behind: 2 },
        pullRequest: { ...facts().pullRequest!, headRefOid: "zzzzzzz" },
      }),
      nextAction: nextAction("execute-task"),
      effectiveFunctionalHead: "aaaaaaa",
    });
    expect(b.mode).toBe("blocked");
  });
});

describe("workBrief · estado real (F1–F3 fixed/open) [work]", () => {
  function realStateBrief(authorization: "explicit-work-request" | null = null) {
    return derive({
      nextAction: nextAction("resolve-findings", {
        description:
          "Resolver os 3 finding(s) com disposition open do checkpoint (1 bloqueante(s)).",
        basis: ["reviews do checkpoint checkpoint-co-enforcement: 3 open / 0 closed"],
      }),
      findings: [
        finding({ qualified: "technical_audit#F1", localId: "F1", severity: "high" }),
        finding({ qualified: "technical_audit#F2", localId: "F2", severity: "medium" }),
        finding({ qualified: "technical_audit#F3", localId: "F3", severity: "medium" }),
      ],
      authorization,
    });
  }

  it("[27] F1–F3 fixed/open → await_revalidation", () => {
    expect(realStateBrief().mode).toBe("await_revalidation");
  });

  it("[28] próxima ação = revalidação independente", () => {
    expect(realStateBrief().nextAction.description).toMatch(/revalidação independente/i);
  });

  it("[29] CO-3.2 aparece proibido (start-next-subcheckpoint)", () => {
    expect(realStateBrief().forbiddenActions).toContain("start-next-subcheckpoint");
  });

  it("[30] nenhuma resolution nova é sugerida (expects_resolutions=false; create-resolutions proibido)", () => {
    const b = realStateBrief("explicit-work-request");
    expect(b.expectsResolutions).toBe(false);
    expect(b.forbiddenActions).toContain("create-resolutions");
  });
});

describe("workBrief · distribuição e read-only [work]", () => {
  it("[34] o contrato é distribuído via .core (package.json#files) e existe", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8")) as {
      files: string[];
    };
    expect(pkg.files).toContain(".core");
    expect(fs.existsSync(path.join(process.cwd(), ".core/governance/work-policy.yml"))).toBe(true);
  });

  it("[35] o contrato não vaza paths absolutos do workspace mantenedor", () => {
    const text = fs.readFileSync(
      path.join(process.cwd(), ".core/governance/work-policy.yml"),
      "utf-8"
    );
    expect(text).not.toMatch(/\/home\/|\/Users\/|[A-Za-z]:\\\\/);
  });

  it("[37] o briefing não persiste artefato (sem .governance/runtime/work)", () => {
    expect(fs.existsSync(path.join(process.cwd(), ".governance/runtime/work"))).toBe(false);
  });
});
