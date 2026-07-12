import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import {
  ReviewArtifact,
  ResolutionArtifact,
} from "../infrastructure/yaml/reviewArtifactsReader.js";
import { HandoffFacts } from "./handoffFacts.js";
import {
  ReviewBriefInput,
  collectReviewBrief,
  deriveReviewBrief,
  normalizeRole,
  runReviewBrief,
} from "./reviewBrief.js";
import { buildReviewTypeRegistry } from "../app/reviews/reviewRequirements.js";

// ── Fixture pura (estado análogo ao PR #41) ──────────────────────────────────

function facts(overrides: Partial<HandoffFacts> = {}): HandoffFacts {
  return {
    spec: {
      label: "0024-context-architecture",
      path: ".governance/specs/0024-context-architecture",
    },
    contract: null,
    stage: "implementation",
    gateStatus: "closed",
    cursor: { pr: "co-projection", checkpoint: "checkpoint-co-projection" },
    activeNode: { id: "co-projection", githubPr: 41, sequence: 8, terminal: false },
    nextPlannedNode: { id: "co-enforcement", githubPr: null, sequence: 9, terminal: false },
    narrativeNextHead: null,
    git: {
      branch: "feat/spec-0024-co-projection",
      head: "b8f18c0",
      workingTreeClean: true,
      ahead: 0,
      behind: 0,
      upstream: "origin/feat/spec-0024-co-projection",
    },
    pullRequest: {
      number: 41,
      state: "open",
      isDraft: true,
      baseRefName: "feat/spec-0024-toolchain-simplification",
      headRefName: "feat/spec-0024-co-projection",
      headRefOid: "b8f18c0aaaaaa",
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
    steps: [],
    insights: [],
    driftWarnings: [],
    sources: [
      { id: "state.yml", origin: "x", status: "fresh", fingerprint: "a1" },
      { id: "pull-request", origin: "gh", status: "fresh", fingerprint: "b2" },
    ],
    ...overrides,
  };
}

function existingTa(overrides: Partial<ReviewArtifact> = {}): ReviewArtifact {
  return {
    checkpoint: "checkpoint-co-projection",
    role: "technical_audit",
    executor: { platform: "antigravity", model: "gemini" },
    decision: "approved",
    findingsEmitted: 0,
    findings: [],
    reviewFingerprint: "538f2be5aed1",
    file: "reviews/c-co-projection-technical_audit.yml",
    ...overrides,
  } as ReviewArtifact;
}

function input(overrides: Partial<ReviewBriefInput> = {}): ReviewBriefInput {
  return {
    facts: facts(),
    role: "technical_audit",
    existingReview: null,
    roleEvents: [],
    resolutions: [],
    lane: { objective: "Auditoria técnica.", vectors: ["correctness", "testes"] },
    publication: {
      canonical: "spec-artifact",
      githubComments: "forbidden-by-default",
      githubException: "explicit-owner-authorization",
    },
    ...overrides,
  };
}

describe("reviewBrief · inferência de modo [CO-4]", () => {
  it("1/2 — lane sem review existente → CREATE com path canônico e template", () => {
    for (const role of ["technical_audit", "architectural_review"]) {
      const brief = deriveReviewBrief(input({ role }));
      expect(brief.mode).toBe("create");
      expect(brief.artifact.kind).toBe("review");
      expect(brief.artifact.path).toBe(
        `.governance/specs/0024-context-architecture/reviews/c-co-projection-${role}.yml`
      );
      expect(brief.artifact.template).toContain("_TEMPLATE.review.yml");
    }
  });

  it("3 — review existente com subject_ref cuja cabeça == HEAD → CURRENT (nenhuma escrita)", () => {
    const brief = deriveReviewBrief(
      input({ existingReview: existingTa({ subjectRef: "aaa1111..b8f18c0" }) })
    );
    expect(brief.mode).toBe("current");
    expect(brief.artifact.kind).toBe("none");
    expect(brief.modeBasis.join(" ")).toContain("duplicada");
  });

  it("4 — implementação avançou após o subject_ref → VERIFICATION com delta exato", () => {
    const brief = deriveReviewBrief(
      input({ existingReview: existingTa({ subjectRef: "aaa1111..f04c5e8" }) })
    );
    expect(brief.mode).toBe("verification");
    expect(brief.subject.range).toBe("f04c5e8..b8f18c0");
    expect(brief.artifact.kind).toBe("verification-event");
    expect(brief.artifact.nextEventId).toBe("EV1");
    expect(brief.artifact.path).toContain("events/c-co-projection-technical_audit-EV1.yml");
  });

  it("5 — review sem subject_ref → VERIFICATION degradada (nunca fresh por suposição)", () => {
    const brief = deriveReviewBrief(input({ existingReview: existingTa() }));
    expect(brief.mode).toBe("verification");
    expect(brief.subject.provenance).toBe("unknown");
    expect(brief.degraded.join(" ")).toContain("subject_ref");
    // sugestão de subject_ref permanece token válido (SHA, sem espaços)
    expect(brief.subject.refSuggestion).toBe("b8f18c0");
  });

  it("6 — finding open com resolution posterior → VERIFICATION mesmo com ref atual", () => {
    const review = existingTa({
      subjectRef: "aaa1111..b8f18c0",
      decision: "changes_requested",
      findingsEmitted: 1,
      findings: [
        {
          id: "F1",
          severity: "high",
          location: "src/x.ts#L1-L2",
          description: "bug",
          disposition: "open",
          fingerprint: "ff",
        },
      ],
    });
    const resolutions: ResolutionArtifact[] = [
      {
        checkpoint: "checkpoint-co-projection",
        by: "@dev",
        resolutions: [{ finding: "technical_audit#F1", action: "fixed" }],
        file: "reviews/c-co-projection-resolutions.yml",
      } as ResolutionArtifact,
    ];
    const brief = deriveReviewBrief(input({ existingReview: review, resolutions }));
    expect(brief.mode).toBe("verification");
    expect(brief.modeBasis.join(" ")).toContain("resolution posterior");
    expect(brief.modeBasis.join(" ")).toContain("autoridade do reviewer/owner");
  });

  it("15/23 — TA limpo (0 findings) → verification scope=review com fp real e previous unknown", () => {
    const brief = deriveReviewBrief(
      input({ existingReview: existingTa({ reviewFingerprint: "538f2be5aed1" }) })
    );
    expect(brief.mode).toBe("verification");
    expect(brief.artifact.verificationScope).toBe("review");
    expect(brief.existingReview?.fingerprint).toBe("538f2be5aed1");
    expect(brief.subject.previousRef).toBeNull();
    expect(brief.allowedActions.join(" ")).toContain("scope: review");
    expect(brief.allowedActions.join(" ")).toContain("SEM verifies");
    expect(brief.validationCommands.join(" ")).toContain("review:seal -- --file");
  });

  it("16 — findings com resolutions → verification scope=findings", () => {
    const review = existingTa({
      subjectRef: "aaa1111..f04c5e8",
      decision: "changes_requested",
      findingsEmitted: 1,
      findings: [
        {
          id: "F1",
          severity: "high",
          location: "src/x.ts#L1-L2",
          description: "bug",
          disposition: "open",
          fingerprint: "ff",
        },
      ],
    });
    const resolutions: ResolutionArtifact[] = [
      {
        checkpoint: "checkpoint-co-projection",
        by: "@dev",
        resolutions: [{ finding: "technical_audit#F1", action: "fixed" }],
        file: "reviews/c-co-projection-resolutions.yml",
      } as ResolutionArtifact,
    ];
    const brief = deriveReviewBrief(input({ existingReview: review, resolutions }));
    expect(brief.mode).toBe("verification");
    expect(brief.artifact.verificationScope).toBe("findings");
  });

  const findingReview = () =>
    existingTa({
      subjectRef: "aaa1111..b8f18c0",
      decision: "changes_requested",
      findingsEmitted: 1,
      findings: [
        {
          id: "F1",
          severity: "high",
          location: "src/x.ts#L1",
          description: "bug",
          disposition: "open",
          fingerprint: "ff",
        },
      ],
    });
  const f1Resolution = (): ResolutionArtifact =>
    ({
      checkpoint: "checkpoint-co-projection",
      by: "@dev",
      resolutions: [{ finding: "technical_audit#F1", action: "fixed" }],
      file: "reviews/c-co-projection-resolutions.yml",
    }) as ResolutionArtifact;
  const ev1VerifyingF1 = (subjectRef: string) => ({
    checkpoint: "checkpoint-co-projection",
    role: "technical_audit" as const,
    eventId: "EV1",
    kind: "verification" as const,
    scope: "findings" as const,
    executor: { platform: "x", model: "y" },
    decision: "approved" as const,
    verifies: ["technical_audit#F1"],
    subjectRef,
    auditEvidence: { coverage: ["a"], scope: "s", basis: "b" },
    file: "events/c-co-projection-technical_audit-EV1.yml",
  });

  it("[bug2] finding open com resolution JÁ verificado por evento cobrindo o HEAD → CURRENT", () => {
    // A circularidade: sem este fix, a lane ficaria VERIFICATION para sempre
    // (disposition open permanece) e o EV nunca poderia ser publicado.
    const brief = deriveReviewBrief(
      input({
        existingReview: findingReview(),
        resolutions: [f1Resolution()],
        roleEvents: [ev1VerifyingF1("aaa1111..b8f18c0")], // cobre o HEAD atual
      })
    );
    expect(brief.mode).toBe("current");
    expect(brief.modeBasis.join(" ")).toMatch(/REVALIDAD/i);
  });

  it("[bug2] evento que NÃO cobre o HEAD atual não torna a lane current (verification)", () => {
    const brief = deriveReviewBrief(
      input({
        existingReview: findingReview(),
        resolutions: [f1Resolution()],
        roleEvents: [ev1VerifyingF1("aaa1111..f04c5e8")], // cabeça antiga ≠ HEAD
      })
    );
    expect(brief.mode).toBe("verification");
    expect(brief.artifact.verificationScope).toBe("findings");
  });

  it("17 — AR limpo posterior também usa scope=review", () => {
    const brief = deriveReviewBrief(
      input({
        role: "architectural_review",
        existingReview: existingTa({
          role: "architectural_review",
          subjectRef: "aaa1111..f04c5e8",
          reviewFingerprint: "abc123def456",
        }),
      })
    );
    expect(brief.mode).toBe("verification");
    expect(brief.artifact.verificationScope).toBe("review");
  });

  it("7 — verification proíbe reescrever o review selado (append-only)", () => {
    const brief = deriveReviewBrief(input({ existingReview: existingTa() }));
    expect(brief.prohibitedActions.join(" ")).toContain("APPEND-ONLY");
    expect(brief.allowedActions.join(" ")).toContain("EVENTO append-only");
  });

  it("8 — eventos existentes incrementam o event_id (EV2)", () => {
    const brief = deriveReviewBrief(
      input({
        existingReview: existingTa(),
        roleEvents: [
          {
            checkpoint: "checkpoint-co-projection",
            role: "technical_audit",
            eventId: "EV1",
            kind: "verification",
            scope: "findings" as const,
            executor: { platform: "x", model: "y" },
            decision: "approved",
            verifies: ["technical_audit#F1"],
            auditEvidence: { coverage: ["a"], scope: "s", basis: "b" },
            file: "events/old.yml",
          },
        ],
      })
    );
    expect(brief.artifact.nextEventId).toBe("EV2");
  });

  it("blocked — drift de fontes/contrato impede review (reconcilie primeiro)", () => {
    const brief = deriveReviewBrief(
      input({ facts: facts({ driftWarnings: ["Branch projetada STALE: x"] }) })
    );
    expect(brief.mode).toBe("blocked");
    expect(brief.modeBasis.join(" ")).toContain("reconcilie");
  });

  it("blocked — PR/HEAD divergentes com remoto À FRENTE (behind>0; pull pendente)", () => {
    const brief = deriveReviewBrief(
      input({
        facts: facts({
          git: { ...facts().git, behind: 2 },
          pullRequest: { ...facts().pullRequest!, headRefOid: "deadbeef00000" },
        }),
      })
    );
    expect(brief.mode).toBe("blocked");
    expect(brief.modeBasis.join(" ")).toContain("PR/HEAD divergentes");
  });

  it("local à frente do PR (push pendente) NÃO bloqueia — degrada e revisa o HEAD local", () => {
    const brief = deriveReviewBrief(
      input({
        facts: facts({
          pullRequest: { ...facts().pullRequest!, headRefOid: "deadbeef00000" },
        }),
      })
    );
    expect(brief.mode).toBe("create");
    expect(brief.degraded.join(" ")).toContain("push pendente");
  });

  it("blocked — gate do checkpoint já approved (review pós-gate é incompatível)", () => {
    const brief = deriveReviewBrief(
      input({ facts: facts({ lifecycle: { ...facts().lifecycle!, gateDecision: "approved" } }) })
    );
    expect(brief.mode).toBe("blocked");
    expect(brief.modeBasis.join(" ")).toContain("gate");
  });

  it("17 — mudança de HEAD muda subject e modo (current → verification)", () => {
    const review = existingTa({ subjectRef: "aaa1111..b8f18c0" });
    const atSameHead = deriveReviewBrief(input({ existingReview: review }));
    const afterNewCommit = deriveReviewBrief(
      input({
        existingReview: review,
        facts: facts({ git: { ...facts().git, head: "c0ffee1" } }),
      })
    );
    expect(atSameHead.mode).toBe("current");
    expect(afterNewCommit.mode).toBe("verification");
    expect(afterNewCommit.subject.range).toBe("b8f18c0..c0ffee1");
  });

  it("16 — determinístico: mesmo input ⇒ mesmo briefing (deep equal, sem campos temporais)", () => {
    expect(deriveReviewBrief(input())).toEqual(deriveReviewBrief(input()));
  });
});

describe("reviewBrief · freshness funcional [CO-4 rodada 7]", () => {
  const REVIEW_AT = (head: string) => existingTa({ subjectRef: `aaa1111..${head}` });

  it("1 — review cobre o functional HEAD e tree limpa → CURRENT", () => {
    const brief = deriveReviewBrief(
      input({
        existingReview: REVIEW_AT("b8f18c0"),
        effectiveFunctionalHead: "b8f18c0",
        workingTreeState: "clean",
      })
    );
    expect(brief.mode).toBe("current");
  });

  it("2/7 — commits posteriores SÓ de review (git HEAD avança; functional não) → CURRENT", () => {
    const brief = deriveReviewBrief(
      input({
        existingReview: REVIEW_AT("b8f18c0"),
        facts: facts({ git: { ...facts().git, head: "ffff111" } }), // git HEAD avançou (EVs)
        effectiveFunctionalHead: "b8f18c0", // cabeça auditável parada
        workingTreeState: "clean",
      })
    );
    expect(brief.mode).toBe("current");
    expect(brief.gitHead).toBe("ffff111");
    expect(brief.effectiveFunctionalHead).toBe("b8f18c0");
  });

  it("3/6 — commit funcional (ou misto) posterior ao subject → VERIFICATION", () => {
    const brief = deriveReviewBrief(
      input({
        existingReview: REVIEW_AT("b8f18c0"),
        facts: facts({ git: { ...facts().git, head: "ffff222" } }),
        effectiveFunctionalHead: "ffff222",
        workingTreeState: "clean",
      })
    );
    expect(brief.mode).toBe("verification");
    expect(brief.subject.range).toBe("b8f18c0..ffff222");
  });

  it("4 — mudança funcional NÃO commitada → BLOCKED listando os arquivos", () => {
    const brief = deriveReviewBrief(
      input({
        existingReview: REVIEW_AT("b8f18c0"),
        effectiveFunctionalHead: "b8f18c0",
        workingTreeState: "functional-dirty",
        functionalDirtyFiles: ["src/cli/reviewBrief.ts"],
      })
    );
    expect(brief.mode).toBe("blocked");
    expect(brief.modeBasis.join("\n")).toContain("src/cli/reviewBrief.ts");
    expect(brief.modeBasis.join(" ")).toContain("MUDANÇAS FUNCIONAIS");
  });

  it("5 — alteração não commitada APENAS em artefato de review → explícito, sem afirmar mudança funcional", () => {
    const brief = deriveReviewBrief(
      input({
        existingReview: REVIEW_AT("b8f18c0"),
        effectiveFunctionalHead: "b8f18c0",
        workingTreeState: "review-only",
      })
    );
    expect(brief.mode).toBe("current"); // não bloqueia; não vira verification
    expect(brief.degraded.join(" ")).toContain("APENAS artefatos de review");
    expect(brief.degraded.join(" ")).not.toContain("funcional mudou");
  });

  it("8 — Architectural Review usa a MESMA cabeça funcional", () => {
    const common = {
      effectiveFunctionalHead: "ffff333",
      workingTreeState: "clean" as const,
    };
    const ta = deriveReviewBrief(input({ ...common }));
    const ar = deriveReviewBrief(input({ ...common, role: "architectural_review" }));
    expect(ta.effectiveFunctionalHead).toBe("ffff333");
    expect(ar.effectiveFunctionalHead).toBe("ffff333");
    expect(ar.subject.headSha).toBe(ta.subject.headSha);
  });

  it("9 — sem ciclo de self-staleness: EV registrado avança o subject; commit review-only não move a cabeça", () => {
    const brief = deriveReviewBrief(
      input({
        existingReview: existingTa({ subjectRef: "aaa1111..b8f18c0" }),
        roleEvents: [
          {
            checkpoint: "checkpoint-co-projection",
            role: "technical_audit",
            eventId: "EV1",
            kind: "verification",
            scope: "review" as const,
            executor: { platform: "x", model: "y" },
            decision: "approved",
            verifies: [],
            auditEvidence: { coverage: ["a"], scope: "s", basis: "b" },
            reviewFingerprint: "538f2be5aed1",
            subjectRef: "cccc444",
            file: "events/ev1.yml",
          },
        ],
        facts: facts({ git: { ...facts().git, head: "dddd555" } }), // commit do EV moveu git HEAD
        effectiveFunctionalHead: "cccc444", // cabeça funcional auditada pelo EV1
        workingTreeState: "clean",
      })
    );
    // subject avançou pelo EV1 (cccc444) e a cabeça funcional é a mesma → CURRENT
    expect(brief.mode).toBe("current");
  });

  it("10 — output distingue git HEAD de functional HEAD e o estado da tree", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    commitAll(repo);
    const { lines, logger } = fakeLogger();

    runReviewBrief(repo, "technical-audit", logger, null);

    const out = lines.join("\n");
    expect(out).toMatch(/git HEAD: [0-9a-f]{7}/);
    expect(out).toMatch(/functional HEAD \(auditável\): [0-9a-f]{7}/);
    expect(out).toContain("working tree: clean");
  });

  it("integração — classificação real: funcional sujo BLOQUEIA; review-only não", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    commitAll(repo);

    // funcional sujo (arquivo fora de reviews/)
    fs.writeFileSync(path.join(repo, "src.ts"), "export {};\n");
    let collected = collectReviewBrief(repo, "technical_audit", { remote: null });
    expect(collected.brief.workingTreeState).toBe("functional-dirty");
    expect(collected.brief.mode).toBe("blocked");
    fs.rmSync(path.join(repo, "src.ts"));

    // review-only (artefato no diretório canônico da spec)
    const reviewsDir = path.join(
      repo,
      ".governance",
      "specs",
      "0024-context-architecture",
      "reviews"
    );
    fs.mkdirSync(reviewsDir, { recursive: true });
    fs.writeFileSync(path.join(reviewsDir, "rascunho.yml"), "checkpoint: x\n");
    collected = collectReviewBrief(repo, "technical_audit", { remote: null });
    expect(collected.brief.workingTreeState).toBe("review-only");
    expect(collected.brief.mode).toBe("create"); // não bloqueia
  });

  it("integração — commit review-only NÃO move a cabeça funcional; commit funcional move", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    const base = commitAll(repo);

    // commit review-only
    const reviewsDir = path.join(
      repo,
      ".governance",
      "specs",
      "0024-context-architecture",
      "reviews"
    );
    fs.mkdirSync(reviewsDir, { recursive: true });
    fs.writeFileSync(path.join(reviewsDir, "nota.yml"), "x: 1\n");
    commitAll(repo, "review only");
    let collected = collectReviewBrief(repo, "technical_audit", { remote: null });
    expect(collected.brief.effectiveFunctionalHead).toBe(base);
    expect(collected.brief.gitHead).not.toBe(base);

    // commit funcional (misto conta como funcional)
    fs.writeFileSync(path.join(repo, "novo.ts"), "export {};\n");
    const funcional = commitAll(repo, "funcional");
    collected = collectReviewBrief(repo, "technical_audit", { remote: null });
    expect(collected.brief.effectiveFunctionalHead).toBe(funcional);
  });
});

describe("reviewBrief · política e conteúdo [CO-4]", () => {
  it("11/12/13 — GitHub proibido por padrão; ações permitidas/proibidas presentes", () => {
    const brief = deriveReviewBrief(input());
    const prohibited = brief.prohibitedActions.join("\n");
    expect(prohibited).toContain("GitHub");
    expect(prohibited).toContain("forbidden-by-default");
    expect(brief.allowedActions.length).toBeGreaterThan(3);
    // mesmo SEM policy de publicação, GitHub segue proibido (default seguro)
    const noPolicy = deriveReviewBrief(input({ publication: null }));
    expect(noPolicy.prohibitedActions.join("\n")).toContain("GitHub");
  });

  it("14/15 — comandos de seal/check/validate e estrutura do relatório final", () => {
    const brief = deriveReviewBrief(input());
    const commands = brief.validationCommands.join("\n");
    expect(commands).toContain("review:seal");
    expect(commands).toContain("review:check");
    expect(commands).toContain("npm run validate");
    expect(brief.finalReportSections).toContain("Veredito");
    expect(brief.finalReportSections.join(" ")).toContain("fingerprint REAL");
  });

  it("vetores vêm da lane governada (review-policy), não inventados", () => {
    const brief = deriveReviewBrief(input({ lane: null }));
    expect(brief.lane).toBeNull(); // sem lane → renderer aponta a policy, sem inventar
  });

  it("9/10 — aliases canônicos resolvem via registry; tipo inválido é rejeitado", () => {
    const { registry } = buildReviewTypeRegistry(null);
    expect(normalizeRole("technical-audit", registry)).toBe("technical_audit");
    expect(normalizeRole("architectural-review", registry)).toBe("architectural_review");
    expect(normalizeRole("technical_audit", registry)).toBe("technical_audit");
    expect(normalizeRole("auditoria-tecnica", registry)).toBe("technical_audit");
    expect(normalizeRole("qualquer-coisa", registry)).toBeNull();
  });
});

// ── Integração mínima (fixture de repo) ──────────────────────────────────────

function initGitOnBranch(repo: string, branchName: string): void {
  execFileSync("git", ["init", "--quiet"], { cwd: repo, stdio: "ignore" });
  execFileSync("git", ["symbolic-ref", "HEAD", `refs/heads/${branchName}`], {
    cwd: repo,
    stdio: "ignore",
  });
}

/** Commita TODO o fixture (tree limpa) — classificação de freshness exige commits reais. */
function commitAll(repo: string, message = "fixture"): string {
  execFileSync("git", ["add", "-A"], { cwd: repo, stdio: "ignore" });
  execFileSync(
    "git",
    ["-c", "user.email=t@t", "-c", "user.name=T", "commit", "--quiet", "-m", message],
    { cwd: repo, stdio: "ignore" }
  );
  return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: repo,
    encoding: "utf8",
  }).trim();
}

function tempRepo(): string {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "review-brief-"));
  const spec = path.join(repo, ".governance", "specs", "0024-context-architecture");
  fs.mkdirSync(path.join(repo, ".governance", "runtime", "specs"), { recursive: true });
  fs.mkdirSync(path.join(repo, ".core", "rules", "_meta"), { recursive: true });
  fs.mkdirSync(path.join(repo, ".core", "governance"), { recursive: true });
  fs.mkdirSync(spec, { recursive: true });
  fs.writeFileSync(path.join(repo, ".core", "governance", "script-contracts.yml"), "x: y\n");
  fs.writeFileSync(
    path.join(repo, "package.json"),
    JSON.stringify({ name: "fixture-consumer", description: "Repo de teste" })
  );
  fs.writeFileSync(
    path.join(repo, "AGENTS.md"),
    "# AGENTS\n\n<AI_GUIDELINES>\n\n- Repo state beats transcript.\n\n</AI_GUIDELINES>\n"
  );
  fs.writeFileSync(
    path.join(repo, ".core", "rules", "_meta", "rules.json"),
    JSON.stringify({
      schema_version: "1.0",
      rules: [
        {
          id: "CORE-T1",
          scope: "universal",
          tags: ["always_injected"],
          title: "Regra",
          file: "r.md",
        },
      ],
    })
  );
  fs.writeFileSync(path.join(spec, "tasks.md"), "- [ ] **Checkpoint co-knowledge** — x.\n");
  fs.writeFileSync(
    path.join(repo, ".governance", "runtime", "specs/active.yml"),
    [
      "version: 1",
      "active_specs:",
      "  - id: '0024'",
      "    slug: context-architecture",
      "    branch: feat/spec-0024-co-knowledge",
      "    stage: implementation",
      "    status: active",
      "    spec_path: .governance/specs/0024-context-architecture",
      "    updated_at: '2026-06-08T00:00:00.000Z'",
    ].join("\n")
  );
  fs.writeFileSync(
    path.join(spec, "state.yml"),
    [
      "stage: implementation",
      "gate:",
      "  status: closed",
      "focus: []",
      "next: []",
      "topology:",
      "  cursor:",
      "    pr: co-knowledge",
      "    checkpoint: checkpoint-co-knowledge",
      "  prs:",
      "    concluded: []",
      "    active:",
      "      - id: co-knowledge",
      "        github_pr: 37",
      "        role: execution",
      "        terminal: false",
      "        sequence: 1",
      "        checkpoints:",
      "          - checkpoint-co-knowledge",
      "    planned:",
      "      - id: integration-final",
      "        github_pr: null",
      "        role: integration",
      "        terminal: true",
      "        sequence: null",
      "        checkpoints:",
      "          - review-and-merge",
    ].join("\n")
  );
  return repo;
}

function fakeLogger(): {
  lines: string[];
  logger: { info: (m: string) => void; error: (m: string) => void };
} {
  const lines: string[] = [];
  return {
    lines,
    logger: { info: (m) => lines.push(m), error: (m) => lines.push(`ERR ${m}`) },
  };
}

describe("reviewBrief · comando integrado [CO-4]", () => {
  it("18 — o comando É um ato de carga: recibo escrito do MESMO snapshot (anti-TOCTOU)", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    commitAll(repo);

    const collected = collectReviewBrief(repo, "technical_audit", { remote: null });

    expect(collected.snapshot.receiptFile).not.toBeNull();
    expect(fs.existsSync(collected.snapshot.receiptFile!)).toBe(true);
    expect(collected.brief.mode).toBe("create");
  });

  it("10 — papel inválido falha com usage (exit 2)", () => {
    const { lines, logger } = fakeLogger();
    expect(runReviewBrief("/tmp", "papel-errado", logger, null)).toBe(2);
    expect(lines.join("\n")).toContain("Tipos disponíveis: architectural_review | technical_audit");
  });

  it("22 — repo consumidor sem spec ativa falha com diagnóstico (exit 1)", () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), "review-brief-vazio-"));
    initGitOnBranch(repo, "main");
    const { lines, logger } = fakeLogger();

    expect(runReviewBrief(repo, "technical-audit", logger, null)).toBe(1);
    expect(lines.join("\n")).toContain("estado irrecuperável");
  });

  it("19 — API indisponível: briefing degradado declarado, nada inventado (exit 0)", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    commitAll(repo);
    const { lines, logger } = fakeLogger();

    const code = runReviewBrief(repo, "technical-audit", logger, () => {
      throw new Error("gh: connection refused");
    });

    expect(code).toBe(0);
    const out = lines.join("\n");
    expect(out).toContain("fonte remota (PR) unavailable");
    expect(out).toContain("estado remoto NÃO observado");
  });
});
