import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import {
  AuditEvidence,
  ExecutorProvenance,
  fingerprintOf,
  reviewEventFingerprintOf,
  reviewFingerprintOf,
} from "../infrastructure/yaml/reviewArtifactsReader.js";
import { ReviewBrief, collectReviewBrief } from "./reviewBrief.js";
import { discover } from "./reviewCheck.js";
import { evaluateProspectiveReviewPublication, runReviewPublish } from "./reviewPublish.js";
import { createLoadReceipt, writeReceipt } from "./handoffReceipt.js";

const EXECUTOR: ExecutorProvenance = { platform: "claude-code", model: "claude-opus-4-8" };
const EVIDENCE: AuditEvidence = {
  coverage: ["src/x.ts"],
  scope: "auditoria do checkpoint",
  basis: "sem regressões",
};

function gitIn(repo: string, args: string[]): string {
  return execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
}

function commitAll(repo: string, message = "fixture"): string {
  execFileSync("git", ["add", "-A"], { cwd: repo, stdio: "ignore" });
  execFileSync("git", ["commit", "--quiet", "-m", message], { cwd: repo, stdio: "ignore" });
  return gitIn(repo, ["rev-parse", "--short", "HEAD"]);
}

/** Fixture: repo com spec 0024 + contrato + REMOTE BARE real (push testável). */
function tempRepoWithRemote(): { repo: string; remote: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "review-publish-"));
  const repo = path.join(root, "work");
  const remote = path.join(root, "remote.git");
  fs.mkdirSync(repo, { recursive: true });
  execFileSync("git", ["init", "--quiet", "--bare", remote], { stdio: "ignore" });
  execFileSync("git", ["init", "--quiet"], { cwd: repo, stdio: "ignore" });
  execFileSync("git", ["symbolic-ref", "HEAD", "refs/heads/feat/spec-0024-co-knowledge"], {
    cwd: repo,
    stdio: "ignore",
  });
  execFileSync("git", ["config", "user.email", "t@t"], { cwd: repo, stdio: "ignore" });
  execFileSync("git", ["config", "user.name", "T"], { cwd: repo, stdio: "ignore" });
  execFileSync("git", ["remote", "add", "origin", remote], { cwd: repo, stdio: "ignore" });

  const spec = path.join(repo, ".governance", "specs", "0024-context-architecture");
  fs.mkdirSync(path.join(repo, ".governance", "runtime", "specs"), { recursive: true });
  fs.mkdirSync(path.join(repo, ".core", "rules", "_meta"), { recursive: true });
  fs.mkdirSync(path.join(repo, ".core", "governance"), { recursive: true });
  fs.mkdirSync(path.join(spec, "reviews", "events"), { recursive: true });
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
        { id: "CORE-T1", scope: "universal", tags: ["always_injected"], title: "R", file: "r.md" },
      ],
    })
  );
  fs.writeFileSync(path.join(spec, "tasks.md"), "- [ ] **Checkpoint co-knowledge** — x.\n");
  fs.writeFileSync(
    path.join(repo, ".governance", "runtime", "specs", "active.yml"),
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
  commitAll(repo, "baseline");
  execFileSync("git", ["push", "--quiet", "-u", "origin", "feat/spec-0024-co-knowledge"], {
    cwd: repo,
    stdio: "ignore",
  });
  return { repo, remote };
}

function sealedReviewYaml(opts: {
  role?: string;
  subjectRef: string;
  decision?: "approved" | "changes_requested";
  findings?: boolean;
  unsealed?: boolean;
  checkpoint?: string;
}): string {
  const role = opts.role ?? "technical_audit";
  const checkpoint = opts.checkpoint ?? "checkpoint-co-knowledge";
  const decision = opts.decision ?? "approved";
  if (opts.findings) {
    const findingFp = "x"; // selado abaixo só se !unsealed
    const lines = [
      `checkpoint: "${checkpoint}"`,
      `role: ${role}`,
      "executor:",
      `  platform: ${EXECUTOR.platform}`,
      `  model: ${EXECUTOR.model}`,
      `decision: ${decision}`,
      "findings_emitted: 1",
      "findings:",
      "  - id: F1",
      "    severity: low",
      '    location: "global"',
      '    description: "achado"',
      "    disposition: open",
      `    fingerprint: "${findingFp}"`,
      `subject_ref: "${opts.subjectRef}"`,
      "review_fingerprint: x",
    ];
    return lines.join("\n");
  }
  const fp = opts.unsealed
    ? "x"
    : reviewFingerprintOf({
        checkpoint,
        role,
        findingsEmitted: 0,
        ids: [],
        auditEvidence: EVIDENCE,
        executor: EXECUTOR,
        subjectRef: opts.subjectRef,
      });
  return [
    `checkpoint: "${checkpoint}"`,
    `role: ${role}`,
    "executor:",
    `  platform: ${EXECUTOR.platform}`,
    `  model: ${EXECUTOR.model}`,
    `decision: ${decision}`,
    "findings_emitted: 0",
    "audit_evidence:",
    "  coverage:",
    `    - ${EVIDENCE.coverage[0]}`,
    `  scope: "${EVIDENCE.scope}"`,
    `  basis: "${EVIDENCE.basis}"`,
    `subject_ref: "${opts.subjectRef}"`,
    `review_fingerprint: "${fp}"`,
  ].join("\n");
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

const REVIEW_PATH =
  ".governance/specs/0024-context-architecture/reviews/c-co-knowledge-technical_audit.yml";

describe("review:publish · autorização fail-closed [CO-4 rodada 8]", () => {
  it("4 — autorização AUSENTE: briefing funciona, publicação bloqueada (nenhum commit)", () => {
    const { repo } = tempRepoWithRemote();
    const head = gitIn(repo, ["rev-parse", "--short", "HEAD"]);
    fs.writeFileSync(path.join(repo, REVIEW_PATH), sealedReviewYaml({ subjectRef: head }));
    const { lines, logger } = fakeLogger();

    expect(runReviewPublish(repo, { file: REVIEW_PATH }, logger, null)).toBe(1);
    expect(lines.join("\n")).toContain("autorização AUSENTE");
    expect(gitIn(repo, ["rev-parse", "--short", "HEAD"])).toBe(head); // nenhum commit
    // briefing continua funcionando sem autorização
    const brief = collectReviewBrief(repo, "technical_audit", { remote: null }).brief;
    expect(brief.authorization).toBeNull();
  });

  it("5 — autorização inválida: bloqueada", () => {
    const { repo } = tempRepoWithRemote();
    const { lines, logger } = fakeLogger();
    expect(
      runReviewPublish(repo, { file: REVIEW_PATH, authorization: "eu-quero" }, logger, null)
    ).toBe(1);
    expect(lines.join("\n")).toContain("autorização inválida");
  });
});

describe("review:publish · ciclo completo autorizado [CO-4 rodada 8]", () => {
  const AUTH = { authorization: "explicit-review-request" };

  it("1/8/21/26/27/28 — TA create approved: commit exclusivo derivado + push real + lane CURRENT", () => {
    const { repo, remote } = tempRepoWithRemote();
    const head = gitIn(repo, ["rev-parse", "--short", "HEAD"]);
    fs.writeFileSync(path.join(repo, REVIEW_PATH), sealedReviewYaml({ subjectRef: head }));
    const { lines, logger } = fakeLogger();

    const code = runReviewPublish(repo, { file: REVIEW_PATH, ...AUTH }, logger, null);

    expect(code).toBe(0);
    const out = lines.join("\n");
    expect(out).toContain('"docs(spec-0024): registra technical audit do co-knowledge"');
    expect(out).toContain("push normal");
    // commit exclusivo: só o artefato
    const show = gitIn(repo, ["show", "--stat", "--name-only", "--format=%s", "HEAD"]);
    expect(show).toContain("registra technical audit");
    expect(show).toContain(REVIEW_PATH);
    expect(show.split("\n").filter((l) => l.includes(".governance"))).toHaveLength(1);
    // push real: remote ref == local
    const localSha = gitIn(repo, ["rev-parse", "HEAD"]);
    const remoteSha = execFileSync(
      "git",
      ["--git-dir", remote, "rev-parse", "refs/heads/feat/spec-0024-co-knowledge"],
      { encoding: "utf8" }
    ).trim();
    expect(remoteSha).toBe(localSha);
    // 28: lane volta CURRENT (commit review-only não move a cabeça funcional)
    const brief = collectReviewBrief(repo, "technical_audit", { remote: null }).brief;
    expect(brief.mode).toBe("current");
    // 6: republicar o mesmo arquivo agora bloqueia (nada pendente)
    const again = fakeLogger();
    expect(runReviewPublish(repo, { file: REVIEW_PATH, ...AUTH }, again.logger, null)).toBe(1);
    expect(again.lines.join("\n")).toContain("não está pendente");
  });

  it("3 — AR create: mensagem derivada da lane arquitetural", () => {
    const { repo } = tempRepoWithRemote();
    const head = gitIn(repo, ["rev-parse", "--short", "HEAD"]);
    const arPath =
      ".governance/specs/0024-context-architecture/reviews/c-co-knowledge-architectural_review.yml";
    fs.writeFileSync(
      path.join(repo, arPath),
      sealedReviewYaml({ role: "architectural_review", subjectRef: head })
    );
    const { lines, logger } = fakeLogger();

    expect(runReviewPublish(repo, { file: arPath, ...AUTH }, logger, null)).toBe(0);
    expect(lines.join("\n")).toContain(
      '"docs(spec-0024): registra architectural review do co-knowledge"'
    );
  });

  it("9 — changes_requested também é publicado (a autorização cobre o julgamento)", () => {
    const { repo } = tempRepoWithRemote();
    const head = gitIn(repo, ["rev-parse", "--short", "HEAD"]);
    // review com finding precisa dos selos: gera via fingerprintOf? usa aprovação limpa
    // changes_requested SEM findings é inválido (audit_evidence obrigatória p/ 0)…
    // findings=1 exige selos de finding — então usa decision changes_requested com evidence? proibido.
    // Caminho real: review com finding selado.
    const checkpoint = "checkpoint-co-knowledge";
    const role = "technical_audit";
    const { fingerprintOf } = require("../infrastructure/yaml/reviewArtifactsReader.js");
    const findingFp = fingerprintOf({
      checkpoint,
      role,
      id: "F1",
      severity: "low",
      location: "global",
      description: "achado",
    });
    const reviewFp = reviewFingerprintOf({
      checkpoint,
      role,
      findingsEmitted: 1,
      ids: ["F1"],
      executor: EXECUTOR,
      subjectRef: head,
    });
    const yaml = [
      `checkpoint: "${checkpoint}"`,
      `role: ${role}`,
      "executor:",
      `  platform: ${EXECUTOR.platform}`,
      `  model: ${EXECUTOR.model}`,
      "decision: changes_requested",
      "findings_emitted: 1",
      "findings:",
      "  - id: F1",
      "    severity: low",
      '    location: "global"',
      '    description: "achado"',
      "    disposition: open",
      `    fingerprint: "${findingFp}"`,
      `subject_ref: "${head}"`,
      `review_fingerprint: "${reviewFp}"`,
    ].join("\n");
    fs.writeFileSync(path.join(repo, REVIEW_PATH), yaml);
    const { lines, logger } = fakeLogger();

    expect(runReviewPublish(repo, { file: REVIEW_PATH, ...AUTH }, logger, null)).toBe(0);
    expect(lines.join("\n")).toContain("registra technical audit");
  });

  it("2/30 — e2e verification: review antigo + commit funcional → evento scope=review → publish → CURRENT", () => {
    const { repo } = tempRepoWithRemote();
    const oldHead = gitIn(repo, ["rev-parse", "--short", "HEAD"]);
    // review original committed cobrindo oldHead
    fs.writeFileSync(path.join(repo, REVIEW_PATH), sealedReviewYaml({ subjectRef: oldHead }));
    commitAll(repo, "registra TA");
    // implementação avança (commit funcional)
    fs.writeFileSync(path.join(repo, "novo.ts"), "export {};\n");
    const newHead = commitAll(repo, "funcional");
    execFileSync("git", ["push", "--quiet"], { cwd: repo, stdio: "ignore" });
    // briefing infere verification scope=review
    const brief = collectReviewBrief(repo, "technical_audit", { remote: null }).brief;
    if (brief.mode !== "verification") {
      const d = discover(repo);
      throw new Error(
        `DEBUG mode=${brief.mode} gitHead=${brief.gitHead} fnHead=${brief.effectiveFunctionalHead} tree=${brief.workingTreeState} reviews=${JSON.stringify(d.artifacts.reviews.map((r) => r.file))} errors=${JSON.stringify(d.errors)} subject=${JSON.stringify(brief.subject)} basis=${JSON.stringify(brief.modeBasis)}`
      );
    }
    expect(brief.artifact.verificationScope).toBe("review");
    // evento derivado, selado pelo algoritmo canônico
    const reviewFp = reviewFingerprintOf({
      checkpoint: "checkpoint-co-knowledge",
      role: "technical_audit",
      findingsEmitted: 0,
      ids: [],
      auditEvidence: EVIDENCE,
      executor: EXECUTOR,
      subjectRef: oldHead,
    });
    const eventFp = reviewEventFingerprintOf({
      checkpoint: "checkpoint-co-knowledge",
      role: "technical_audit",
      eventId: "EV1",
      kind: "verification",
      decision: "approved",
      verifies: [],
      auditEvidence: EVIDENCE,
      executor: EXECUTOR,
      subjectRef: `${oldHead}..${newHead}`,
      scope: "review",
      reviewFingerprint: reviewFp,
      previousSubjectRef: oldHead,
    });
    const eventPath =
      ".governance/specs/0024-context-architecture/reviews/events/c-co-knowledge-technical_audit-EV1.yml";
    fs.writeFileSync(
      path.join(repo, eventPath),
      [
        'checkpoint: "checkpoint-co-knowledge"',
        "role: technical_audit",
        "event_id: EV1",
        "kind: verification",
        "executor:",
        `  platform: ${EXECUTOR.platform}`,
        `  model: ${EXECUTOR.model}`,
        "decision: approved",
        "scope: review",
        `review_fingerprint: "${reviewFp}"`,
        `previous_subject_ref: "${oldHead}"`,
        `subject_ref: "${oldHead}..${newHead}"`,
        "audit_evidence:",
        "  coverage:",
        `    - ${EVIDENCE.coverage[0]}`,
        `  scope: "${EVIDENCE.scope}"`,
        `  basis: "${EVIDENCE.basis}"`,
        `event_fingerprint: "${eventFp}"`,
      ].join("\n")
    );
    const { lines, logger } = fakeLogger();

    expect(runReviewPublish(repo, { file: eventPath, ...AUTH }, logger, null)).toBe(0);
    expect(lines.join("\n")).toContain(
      '"docs(spec-0024): registra verification do technical audit"'
    );
    // lane volta CURRENT
    const after = collectReviewBrief(repo, "technical_audit", { remote: null }).brief;
    expect(after.mode).toBe("current");
  });

  it("[bug2][1/2/14/15] e2e EV1: VERIFICATION findings (open+resolution) → seal → publish → CURRENT", () => {
    const { repo, remote } = tempRepoWithRemote();
    const checkpoint = "checkpoint-co-knowledge";
    const role = "technical_audit";
    const oldHead = gitIn(repo, ["rev-parse", "--short", "HEAD"]);

    // review changes_requested com F1 open (selado), auditou oldHead.
    const findingFp = fingerprintOf({
      checkpoint,
      role,
      id: "F1",
      severity: "low",
      location: "global",
      description: "achado",
    });
    const reviewFp = reviewFingerprintOf({
      checkpoint,
      role,
      findingsEmitted: 1,
      ids: ["F1"],
      executor: EXECUTOR,
      subjectRef: oldHead,
    });
    fs.writeFileSync(
      path.join(repo, REVIEW_PATH),
      [
        `checkpoint: "${checkpoint}"`,
        `role: ${role}`,
        "executor:",
        `  platform: ${EXECUTOR.platform}`,
        `  model: ${EXECUTOR.model}`,
        "decision: changes_requested",
        "findings_emitted: 1",
        "findings:",
        "  - id: F1",
        "    severity: low",
        '    location: "global"',
        '    description: "achado"',
        "    disposition: open",
        `    fingerprint: "${findingFp}"`,
        `subject_ref: "${oldHead}"`,
        `review_fingerprint: "${reviewFp}"`,
      ].join("\n")
    );
    // resolution fixed para F1 (lane separada; NÃO fecha disposition).
    fs.writeFileSync(
      path.join(
        repo,
        ".governance/specs/0024-context-architecture/reviews/c-co-knowledge-resolutions.yml"
      ),
      [
        "checkpoint: checkpoint-co-knowledge",
        "by: t",
        "resolutions:",
        "  - finding: technical_audit#F1",
        "    action: fixed",
      ].join("\n")
    );
    commitAll(repo, "registra TA + resolution"); // review-only ⇒ functional HEAD não avança
    // implementação avança (commit funcional) ⇒ a lane precisa de verification.
    fs.writeFileSync(path.join(repo, "fix.ts"), "export {};\n");
    const newHead = commitAll(repo, "funcional");
    execFileSync("git", ["push", "--quiet"], { cwd: repo, stdio: "ignore" });

    // ANTES do EV: a lane infere VERIFICATION scope=findings (circularidade do bug).
    const before = collectReviewBrief(repo, "technical_audit", { remote: null }).brief;
    expect(before.mode).toBe("verification");
    expect(before.artifact.verificationScope).toBe("findings");

    // EV1 scope=findings verifica F1 cobrindo o functional HEAD; selado.
    const eventFp = reviewEventFingerprintOf({
      checkpoint,
      role,
      eventId: "EV1",
      kind: "verification",
      decision: "approved",
      verifies: ["technical_audit#F1"],
      auditEvidence: EVIDENCE,
      executor: EXECUTOR,
      subjectRef: `${oldHead}..${newHead}`,
      scope: "findings",
    });
    const eventPath =
      ".governance/specs/0024-context-architecture/reviews/events/c-co-knowledge-technical_audit-EV1.yml";
    fs.writeFileSync(
      path.join(repo, eventPath),
      [
        `checkpoint: "${checkpoint}"`,
        `role: ${role}`,
        "event_id: EV1",
        "kind: verification",
        "executor:",
        `  platform: ${EXECUTOR.platform}`,
        `  model: ${EXECUTOR.model}`,
        "decision: approved",
        "scope: findings",
        "verifies:",
        "  - technical_audit#F1",
        `subject_ref: "${oldHead}..${newHead}"`,
        "audit_evidence:",
        "  coverage:",
        `    - ${EVIDENCE.coverage[0]}`,
        `  scope: "${EVIDENCE.scope}"`,
        `  basis: "${EVIDENCE.basis}"`,
        `event_fingerprint: "${eventFp}"`,
      ].join("\n")
    );

    const fnHeadBefore = collectReviewBrief(repo, "technical_audit", { remote: null }).brief
      .effectiveFunctionalHead;
    const { lines, logger } = fakeLogger();

    // publish: a lane PROSPECTIVA (com o EV em disco) fecha como CURRENT ⇒ publica.
    expect(runReviewPublish(repo, { file: eventPath, ...AUTH }, logger, null)).toBe(0);
    expect(lines.join("\n")).toContain("registra verification do technical audit");

    // [14] commit review-only NÃO move o functional HEAD; lane vira CURRENT.
    const after = collectReviewBrief(repo, "technical_audit", { remote: null }).brief;
    expect(after.mode).toBe("current");
    expect(after.effectiveFunctionalHead).toBe(fnHeadBefore);
    // [1] push real: remote == local.
    const localSha = gitIn(repo, ["rev-parse", "HEAD"]);
    const remoteSha = execFileSync("git", [
      "--git-dir",
      remote,
      "rev-parse",
      "refs/heads/feat/spec-0024-co-knowledge",
    ])
      .toString()
      .trim();
    expect(remoteSha).toBe(localSha);
  });
});

describe("evaluateProspectiveReviewPublication · contrato prospectivo [bug2]", () => {
  function facts(
    over: Record<string, unknown> = {}
  ): Parameters<typeof evaluateProspectiveReviewPublication>[0]["facts"] {
    return {
      spec: {
        label: "0024-context-architecture",
        path: ".governance/specs/0024-context-architecture",
      },
      cursor: { pr: "co", checkpoint: "checkpoint-co-knowledge" },
      git: {
        branch: "feat/x",
        head: "h",
        workingTreeClean: true,
        ahead: 0,
        behind: 0,
        upstream: "origin/feat/x",
      },
      ...over,
    } as Parameters<typeof evaluateProspectiveReviewPublication>[0]["facts"];
  }

  function brief(mode: string, over: Record<string, unknown> = {}): ReviewBrief {
    return {
      mode,
      modeBasis: ["b"],
      effectiveFunctionalHead: "h",
      ...over,
    } as unknown as ReviewBrief;
  }

  const RELFILE =
    ".governance/specs/0024-context-architecture/reviews/events/c-co-knowledge-technical_audit-EV1.yml";
  const ARTIFACT = {
    role: "technical_audit",
    checkpoint: "checkpoint-co-knowledge",
    kind: "verification-event" as const,
    eventId: "EV1",
    relFile: RELFILE,
  };
  const CLEAN = { errors: [] as string[], violations: [] as string[] };

  it("[1] lane prospectiva CURRENT + diff review-only → ok (publica)", () => {
    const r = evaluateProspectiveReviewPublication({
      facts: facts(),
      brief: brief("current"),
      artifact: ARTIFACT,
      dirtyPaths: [RELFILE],
      consolidation: CLEAN,
    });
    expect(r.ok).toBe(true);
  });

  it("[9] lane prospectiva ainda VERIFICATION → bloqueia", () => {
    const r = evaluateProspectiveReviewPublication({
      facts: facts(),
      brief: brief("verification"),
      artifact: ARTIFACT,
      dirtyPaths: [RELFILE],
      consolidation: CLEAN,
    });
    expect(r.ok).toBe(false);
    expect(r.failures.join(" ")).toMatch(/não fecha como current/i);
  });

  it("[10] diff funcional misturado → bloqueia listando o path", () => {
    const r = evaluateProspectiveReviewPublication({
      facts: facts(),
      brief: brief("current"),
      artifact: ARTIFACT,
      dirtyPaths: [RELFILE, "src/x.ts"],
      consolidation: CLEAN,
    });
    expect(r.ok).toBe(false);
    expect(r.failures.join(" ")).toMatch(/src\/x\.ts/);
  });

  it("[15] artefato não pendente na working tree → bloqueia", () => {
    const r = evaluateProspectiveReviewPublication({
      facts: facts(),
      brief: brief("current"),
      artifact: ARTIFACT,
      dirtyPaths: [],
      consolidation: CLEAN,
    });
    expect(r.ok).toBe(false);
    expect(r.failures.join(" ")).toMatch(/não está pendente/);
  });

  it("[behind] branch atrás do remoto → bloqueia", () => {
    const r = evaluateProspectiveReviewPublication({
      facts: facts({
        git: {
          branch: "f",
          head: "h",
          workingTreeClean: true,
          ahead: 0,
          behind: 2,
          upstream: "origin/f",
        },
      }),
      brief: brief("current"),
      artifact: ARTIFACT,
      dirtyPaths: [RELFILE],
      consolidation: CLEAN,
    });
    expect(r.ok).toBe(false);
    expect(r.failures.join(" ")).toMatch(/BEHIND/);
  });

  it("[13] checkpoint/role divergente → bloqueia (path canônico ≠)", () => {
    const r = evaluateProspectiveReviewPublication({
      facts: facts(),
      brief: brief("current"),
      artifact: { ...ARTIFACT, checkpoint: "checkpoint-outro" },
      dirtyPaths: [RELFILE],
      consolidation: CLEAN,
    });
    expect(r.ok).toBe(false);
    expect(r.failures.join(" ")).toMatch(/checkpoint do artefato/);
  });

  it("[review:check] violação de consolidação → bloqueia", () => {
    const r = evaluateProspectiveReviewPublication({
      facts: facts(),
      brief: brief("current"),
      artifact: ARTIFACT,
      dirtyPaths: [RELFILE],
      consolidation: { errors: [], violations: ["fingerprint divergente"] },
    });
    expect(r.ok).toBe(false);
    expect(r.failures.join(" ")).toMatch(/review:check/);
  });
});

describe("review:publish · guard de diff e pré-condições [CO-4 rodada 8]", () => {
  const AUTH = { authorization: "explicit-review-request" };

  it("10/11 — artefato não selado (placeholder/fingerprint divergente) → bloqueado", () => {
    const { repo } = tempRepoWithRemote();
    const head = gitIn(repo, ["rev-parse", "--short", "HEAD"]);
    fs.writeFileSync(
      path.join(repo, REVIEW_PATH),
      sealedReviewYaml({ subjectRef: head, unsealed: true })
    );
    const { lines, logger } = fakeLogger();
    expect(runReviewPublish(repo, { file: REVIEW_PATH, ...AUTH }, logger, null)).toBe(1);
    expect(lines.join("\n")).toContain("não selado");
  });

  it("14/16 — diff misto (artefato + arquivo funcional) → bloqueado listando paths", () => {
    const { repo } = tempRepoWithRemote();
    const head = gitIn(repo, ["rev-parse", "--short", "HEAD"]);
    fs.writeFileSync(path.join(repo, REVIEW_PATH), sealedReviewYaml({ subjectRef: head }));
    fs.writeFileSync(path.join(repo, "src.ts"), "export {};\n");
    const { lines, logger } = fakeLogger();

    expect(runReviewPublish(repo, { file: REVIEW_PATH, ...AUTH }, logger, null)).toBe(1);
    const out = lines.join("\n");
    expect(out).toContain("nenhum commit, nenhum push");
    expect(out).toContain("src.ts");
    expect(gitIn(repo, ["rev-parse", "--short", "HEAD"])).toBe(head);
  });

  it("15/17 — segundo artefato/untracked extra → bloqueado", () => {
    const { repo } = tempRepoWithRemote();
    const head = gitIn(repo, ["rev-parse", "--short", "HEAD"]);
    fs.writeFileSync(path.join(repo, REVIEW_PATH), sealedReviewYaml({ subjectRef: head }));
    fs.writeFileSync(
      path.join(
        repo,
        ".governance/specs/0024-context-architecture/reviews/c-co-knowledge-architectural_review.yml"
      ),
      sealedReviewYaml({ role: "architectural_review", subjectRef: head })
    );
    const { lines, logger } = fakeLogger();

    expect(runReviewPublish(repo, { file: REVIEW_PATH, ...AUTH }, logger, null)).toBe(1);
    expect(lines.join("\n")).toContain("architectural_review.yml");
  });

  it("18 — path fora do canônico → bloqueado", () => {
    const { repo } = tempRepoWithRemote();
    const head = gitIn(repo, ["rev-parse", "--short", "HEAD"]);
    const wrong = ".governance/specs/0024-context-architecture/reviews/meu-review.yml";
    fs.writeFileSync(path.join(repo, wrong), sealedReviewYaml({ subjectRef: head }));
    const { lines, logger } = fakeLogger();

    expect(runReviewPublish(repo, { file: wrong, ...AUTH }, logger, null)).toBe(1);
    expect(lines.join("\n")).toContain("fora do canônico");
  });

  it("19 — checkpoint do artefato divergente do cursor → bloqueado", () => {
    const { repo } = tempRepoWithRemote();
    const head = gitIn(repo, ["rev-parse", "--short", "HEAD"]);
    fs.writeFileSync(
      path.join(repo, REVIEW_PATH),
      sealedReviewYaml({ subjectRef: head, checkpoint: "checkpoint-outro" })
    );
    const { lines, logger } = fakeLogger();

    expect(runReviewPublish(repo, { file: REVIEW_PATH, ...AUTH }, logger, null)).toBe(1);
    expect(lines.join("\n")).toContain("checkpoint do artefato");
  });

  it("20 — branch behind do upstream → bloqueado", () => {
    const { repo } = tempRepoWithRemote();
    // avança remoto e regride local
    fs.writeFileSync(path.join(repo, "extra.ts"), "export {};\n");
    commitAll(repo, "remoto avança");
    execFileSync("git", ["push", "--quiet"], { cwd: repo, stdio: "ignore" });
    execFileSync("git", ["reset", "--hard", "--quiet", "HEAD~1"], { cwd: repo, stdio: "ignore" });
    const head = gitIn(repo, ["rev-parse", "--short", "HEAD"]);
    fs.writeFileSync(path.join(repo, REVIEW_PATH), sealedReviewYaml({ subjectRef: head }));
    const { lines, logger } = fakeLogger();

    expect(runReviewPublish(repo, { file: REVIEW_PATH, ...AUTH }, logger, null)).toBe(1);
    expect(lines.join("\n")).toContain("BEHIND");
  });

  it("12 — review:check com violação (referência divergente) → bloqueado", () => {
    const { repo } = tempRepoWithRemote();
    const head = gitIn(repo, ["rev-parse", "--short", "HEAD"]);
    fs.writeFileSync(path.join(repo, REVIEW_PATH), sealedReviewYaml({ subjectRef: head }));
    commitAll(repo, "registra TA");
    execFileSync("git", ["push", "--quiet"], { cwd: repo, stdio: "ignore" });
    // evento com review_fingerprint ERRADO (12hex válido, referência divergente)
    const eventFp = reviewEventFingerprintOf({
      checkpoint: "checkpoint-co-knowledge",
      role: "technical_audit",
      eventId: "EV1",
      kind: "verification",
      decision: "approved",
      verifies: [],
      auditEvidence: EVIDENCE,
      executor: EXECUTOR,
      subjectRef: head,
      scope: "review",
      reviewFingerprint: "deadbeef0000",
    });
    const eventPath =
      ".governance/specs/0024-context-architecture/reviews/events/c-co-knowledge-technical_audit-EV1.yml";
    fs.writeFileSync(
      path.join(repo, eventPath),
      [
        'checkpoint: "checkpoint-co-knowledge"',
        "role: technical_audit",
        "event_id: EV1",
        "kind: verification",
        "executor:",
        `  platform: ${EXECUTOR.platform}`,
        `  model: ${EXECUTOR.model}`,
        "decision: approved",
        "scope: review",
        "review_fingerprint: deadbeef0000",
        `subject_ref: "${head}"`,
        "audit_evidence:",
        "  coverage:",
        `    - ${EVIDENCE.coverage[0]}`,
        `  scope: "${EVIDENCE.scope}"`,
        `  basis: "${EVIDENCE.basis}"`,
        `event_fingerprint: "${eventFp}"`,
      ].join("\n")
    );
    const { lines, logger } = fakeLogger();

    expect(runReviewPublish(repo, { file: eventPath, ...AUTH }, logger, null)).toBe(1);
    expect(lines.join("\n")).toContain("review:check");
  });

  it("22 — push falha → commit local PRESERVADO e erro claro", () => {
    const { repo } = tempRepoWithRemote();
    const head = gitIn(repo, ["rev-parse", "--short", "HEAD"]);
    fs.writeFileSync(path.join(repo, REVIEW_PATH), sealedReviewYaml({ subjectRef: head }));
    execFileSync(
      "git",
      ["remote", "set-url", "origin", path.join(os.tmpdir(), "nao-existe-xyz.git")],
      { cwd: repo, stdio: "ignore" }
    );
    const { lines, logger } = fakeLogger();

    expect(runReviewPublish(repo, { file: REVIEW_PATH, ...AUTH }, logger, null)).toBe(1);
    const out = lines.join("\n");
    expect(out).toContain("PUSH FALHOU");
    expect(out).toContain("permanece LOCAL");
    // commit preservado
    expect(gitIn(repo, ["rev-parse", "--short", "HEAD"])).not.toBe(head);
    expect(gitIn(repo, ["log", "-1", "--format=%s"])).toContain("registra technical audit");
  });
});

describe("review:publish · advisory-first do recibo de carga [CO-3.4]", () => {
  const AUTH = { authorization: "explicit-review-request" };

  it("missing → advisory 'nenhuma carga registrada' E publicação prossegue (exit 0)", () => {
    const { repo } = tempRepoWithRemote();
    const head = gitIn(repo, ["rev-parse", "--short", "HEAD"]);
    fs.writeFileSync(path.join(repo, REVIEW_PATH), sealedReviewYaml({ subjectRef: head }));
    const { lines, logger } = fakeLogger();

    const code = runReviewPublish(repo, { file: REVIEW_PATH, ...AUTH }, logger, null);

    expect(code).toBe(0); // advisory-first: recibo ausente NÃO bloqueia review:publish
    expect(lines.join("\n")).toContain(
      "⚠️  [advisory] retomada não reconciliada — nenhuma carga registrada"
    );
  });

  it("fresh → nenhum advisory emitido, publicação prossegue (exit 0)", () => {
    const { repo } = tempRepoWithRemote();
    const head = gitIn(repo, ["rev-parse", "--short", "HEAD"]);
    fs.writeFileSync(path.join(repo, REVIEW_PATH), sealedReviewYaml({ subjectRef: head }));
    // recibo genuíno fresh: mesmo snapshot {facts, seal} que o advisory deriva
    const snap = collectReviewBrief(repo, "technical_audit", {
      remote: null,
      authorization: "explicit-review-request",
    }).snapshot;
    writeReceipt(repo, createLoadReceipt(snap.collected.facts, snap.derived.seal));
    const { lines, logger } = fakeLogger();

    const code = runReviewPublish(repo, { file: REVIEW_PATH, ...AUTH }, logger, null);

    expect(code).toBe(0);
    expect(lines.join("\n")).not.toContain("[advisory]");
  });

  it("stale-head → advisory de HEAD E publicação prossegue (exit 0)", () => {
    const { repo } = tempRepoWithRemote();
    const head = gitIn(repo, ["rev-parse", "--short", "HEAD"]);
    fs.writeFileSync(path.join(repo, REVIEW_PATH), sealedReviewYaml({ subjectRef: head }));
    const snap = collectReviewBrief(repo, "technical_audit", {
      remote: null,
      authorization: "explicit-review-request",
    }).snapshot;
    // recibo carregado num HEAD diferente do atual
    writeReceipt(repo, {
      ...createLoadReceipt(snap.collected.facts, snap.derived.seal),
      head: "0000000",
    });
    const { lines, logger } = fakeLogger();

    const code = runReviewPublish(repo, { file: REVIEW_PATH, ...AUTH }, logger, null);

    expect(code).toBe(0);
    expect(lines.join("\n")).toMatch(
      /\[advisory\] retomada não reconciliada — recibo stale: HEAD carregado 0000000 ≠ HEAD atual/
    );
  });
});
