import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  AuditEvidence,
  ExecutorProvenance,
  parseReview,
  parseReviewEvent,
  reviewEventFingerprintOf,
  reviewFingerprintOf,
} from "../infrastructure/yaml/reviewArtifactsReader.js";
import { consolidate, SpecArtifacts } from "./reviewCheck.js";
import { sealReview } from "./reviewSeal.js";

const EXECUTOR: ExecutorProvenance = { platform: "claude-code", model: "claude-opus-4-8" };
const EVIDENCE: AuditEvidence = {
  coverage: ["src/x.ts"],
  scope: "revalidação completa",
  basis: "sem regressões",
};

/** Review APROVADO com zero findings (o caso que bloqueava a verification). */
function cleanReviewYaml(checkpoint = "checkpoint-co-projection"): string {
  const fp = reviewFingerprintOf({
    checkpoint,
    role: "technical_audit",
    findingsEmitted: 0,
    ids: [],
    auditEvidence: EVIDENCE,
    executor: EXECUTOR,
  });
  return [
    `checkpoint: "${checkpoint}"`,
    "role: technical_audit",
    "executor:",
    `  platform: ${EXECUTOR.platform}`,
    `  model: ${EXECUTOR.model}`,
    "decision: approved",
    "findings_emitted: 0",
    "audit_evidence:",
    `  coverage:`,
    `    - ${EVIDENCE.coverage[0]}`,
    `  scope: "${EVIDENCE.scope}"`,
    `  basis: "${EVIDENCE.basis}"`,
    `review_fingerprint: ${fp}`,
  ].join("\n");
}

function reviewScopeEventYaml(opts: {
  reviewFingerprint: string;
  subjectRef?: string;
  previousSubjectRef?: string;
  withVerifies?: boolean;
  fingerprint?: string;
  checkpoint?: string;
}): string {
  const checkpoint = opts.checkpoint ?? "checkpoint-co-projection";
  const lines = [
    `checkpoint: "${checkpoint}"`,
    "role: technical_audit",
    "event_id: EV1",
    "kind: verification",
    "executor:",
    `  platform: ${EXECUTOR.platform}`,
    `  model: ${EXECUTOR.model}`,
    "decision: approved",
    "scope: review",
    `review_fingerprint: ${opts.reviewFingerprint}`,
  ];
  if (opts.previousSubjectRef) lines.push(`previous_subject_ref: "${opts.previousSubjectRef}"`);
  if (opts.subjectRef) lines.push(`subject_ref: "${opts.subjectRef}"`);
  if (opts.withVerifies) lines.push("verifies:", "  - technical_audit#F1");
  lines.push(
    "audit_evidence:",
    `  coverage:`,
    `    - ${EVIDENCE.coverage[0]}`,
    `  scope: "${EVIDENCE.scope}"`,
    `  basis: "${EVIDENCE.basis}"`,
    `event_fingerprint: ${opts.fingerprint ?? expectedEventFp(opts, checkpoint)}`
  );
  return lines.join("\n");
}

function expectedEventFp(
  opts: { reviewFingerprint: string; subjectRef?: string; previousSubjectRef?: string },
  checkpoint: string
): string {
  return reviewEventFingerprintOf({
    checkpoint,
    role: "technical_audit",
    eventId: "EV1",
    kind: "verification",
    decision: "approved",
    verifies: [],
    auditEvidence: EVIDENCE,
    executor: EXECUTOR,
    ...(opts.subjectRef ? { subjectRef: opts.subjectRef } : {}),
    scope: "review",
    reviewFingerprint: opts.reviewFingerprint,
    ...(opts.previousSubjectRef ? { previousSubjectRef: opts.previousSubjectRef } : {}),
  });
}

function artifactsWith(reviewYaml: string, eventYaml: string): SpecArtifacts {
  return {
    reviews: [parseReview(reviewYaml, "reviews/r.yml")],
    reviewEvents: [parseReviewEvent(eventYaml, "reviews/events/e.yml")],
    resolutions: [],
    gates: [],
    allowedCheckpoints: ["checkpoint-co-projection"],
  };
}

describe("verification scope=review · parser/fingerprint [CO-4 rodada 6]", () => {
  it("4/5/8 — aceita review com ZERO findings: sem verifies, com review_fingerprint + subject_ref", () => {
    const review = parseReview(cleanReviewYaml(), "reviews/r.yml");
    const event = parseReviewEvent(
      reviewScopeEventYaml({
        reviewFingerprint: review.reviewFingerprint,
        subjectRef: "64015b6",
        previousSubjectRef: "unknown",
      }),
      "events/e.yml"
    );
    expect(event.scope).toBe("review");
    expect(event.verifies).toEqual([]);
    expect(event.reviewFingerprint).toBe(review.reviewFingerprint);
    expect(event.previousSubjectRef).toBe("unknown");
    expect(event.subjectRef).toBe("64015b6");
  });

  it("rejeita verifies em scope=review (não inventar finding artificial)", () => {
    expect(() =>
      parseReviewEvent(
        reviewScopeEventYaml({
          reviewFingerprint: "abcdefabcdef",
          subjectRef: "64015b6",
          withVerifies: true,
          fingerprint: "x",
        }),
        "events/e.yml"
      )
    ).toThrow(/NÃO aceita "verifies"/);
  });

  it("8 — subject_ref novo é obrigatório em scope=review", () => {
    expect(() =>
      parseReviewEvent(
        reviewScopeEventYaml({ reviewFingerprint: "abcdefabcdef", fingerprint: "x" }),
        "events/e.yml"
      )
    ).toThrow(/exige "subject_ref"/);
  });

  it("scope=review exige review_fingerprint (12 hex)", () => {
    const yaml = reviewScopeEventYaml({
      reviewFingerprint: "abcdefabcdef",
      subjectRef: "64015b6",
    }).replace(/review_fingerprint: .*/, "review_fingerprint: nao-hex");
    expect(() => parseReviewEvent(yaml, "events/e.yml")).toThrow(/review_fingerprint/);
  });

  it("2 — scope=findings (e eventos históricos SEM scope) continuam exigindo verifies", () => {
    const yaml = reviewScopeEventYaml({
      reviewFingerprint: "abcdefabcdef",
      subjectRef: "64015b6",
    })
      .replace("scope: review\n", "")
      .replace(/review_fingerprint: .*\n/, "");
    expect(() => parseReviewEvent(yaml, "events/e.yml")).toThrow(/NÃO-vazia/);
  });

  it("1/18 — evento histórico sem scope: fingerprint ANTIGO permanece válido (scope=findings implícito)", () => {
    // envelope sem subject_ref e sem scope:review — formato original
    const fp = reviewEventFingerprintOf({
      checkpoint: "checkpoint-x",
      role: "technical_audit",
      eventId: "EV1",
      kind: "reaudit",
      decision: "approved",
      verifies: ["technical_audit#F1"],
      auditEvidence: EVIDENCE,
      executor: EXECUTOR,
    });
    const fpWithScopeParam = reviewEventFingerprintOf({
      checkpoint: "checkpoint-x",
      role: "technical_audit",
      eventId: "EV1",
      kind: "reaudit",
      decision: "approved",
      verifies: ["technical_audit#F1"],
      auditEvidence: EVIDENCE,
      executor: EXECUTOR,
      scope: "findings",
    });
    expect(fpWithScopeParam).toBe(fp);
  });

  it("mudança de scope ou subject muda o fingerprint do evento", () => {
    const base = expectedEventFp({ reviewFingerprint: "abcdefabcdef", subjectRef: "aaa" }, "c");
    const otherSubject = expectedEventFp(
      { reviewFingerprint: "abcdefabcdef", subjectRef: "bbb" },
      "c"
    );
    const otherReview = expectedEventFp(
      { reviewFingerprint: "123456789abc", subjectRef: "aaa" },
      "c"
    );
    expect(otherSubject).not.toBe(base);
    expect(otherReview).not.toBe(base);
  });
});

describe("verification scope=review · review:check (consolidate) [CO-4 rodada 6]", () => {
  it("6/19 — consolida verification do review limpo SEM violação e SEM finding inventado", () => {
    const reviewYaml = cleanReviewYaml();
    const review = parseReview(reviewYaml, "reviews/r.yml");
    const result = consolidate(
      artifactsWith(
        reviewYaml,
        reviewScopeEventYaml({
          reviewFingerprint: review.reviewFingerprint,
          subjectRef: "64015b6",
          previousSubjectRef: "unknown",
        })
      )
    );
    expect(result.violations).toHaveLength(0);
    const cp = result.byCheckpoint[0];
    expect(cp.reviewScopeVerifications).toBe(1);
    expect(cp.totalOpen).toBe(0);
    expect(cp.totalClosed).toBe(0); // nenhum finding fechado inventado
  });

  it("7 — fingerprint original divergente → violação tamper-evident", () => {
    const reviewYaml = cleanReviewYaml();
    const result = consolidate(
      artifactsWith(
        reviewYaml,
        reviewScopeEventYaml({ reviewFingerprint: "deadbeef0000", subjectRef: "64015b6" })
      )
    );
    expect(result.violations.join("\n")).toMatch(/referência divergente/);
  });

  it("scope=review sem review da lane no checkpoint → violação", () => {
    const reviewYaml = cleanReviewYaml();
    const review = parseReview(reviewYaml, "reviews/r.yml");
    const a = artifactsWith(
      reviewYaml,
      reviewScopeEventYaml({
        reviewFingerprint: review.reviewFingerprint,
        subjectRef: "64015b6",
      })
    );
    const without: SpecArtifacts = { ...a, reviews: [] };
    expect(consolidate(without).violations.join("\n")).toMatch(/não existe neste checkpoint/);
  });
});

describe("review:seal polimórfico [CO-4 rodada 6]", () => {
  function tmpFile(content: string, name: string): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "seal-"));
    const file = path.join(dir, name);
    fs.writeFileSync(file, content);
    return file;
  }
  function logger(): {
    lines: string[];
    logger: { info: (m: string) => void; error: (m: string) => void };
  } {
    const lines: string[] = [];
    return { lines, logger: { info: (m) => lines.push(m), error: (m) => lines.push(`ERR ${m}`) } };
  }

  it("9 — evento scope=review com placeholder é selado pelo comando canônico", () => {
    const review = parseReview(cleanReviewYaml(), "reviews/r.yml");
    const yaml = reviewScopeEventYaml({
      reviewFingerprint: review.reviewFingerprint,
      subjectRef: "64015b6",
      previousSubjectRef: "unknown",
      fingerprint: "x",
    });
    const file = tmpFile(`# comentário preservado\n${yaml}\n`, "ev.yml");
    const { lines, logger: log } = logger();

    expect(sealReview(file, log)).toBe(0);
    const sealed = fs.readFileSync(file, "utf-8");
    expect(sealed).toContain("# comentário preservado"); // 14
    const sealedFp = /event_fingerprint: ([0-9a-f]{12})/.exec(sealed)?.[1];
    expect(sealedFp).toBe(
      expectedEventFp(
        {
          reviewFingerprint: review.reviewFingerprint,
          subjectRef: "64015b6",
          previousSubjectRef: "unknown",
        },
        "checkpoint-co-projection"
      )
    );
    // e o artefato selado parseia limpo
    expect(() => parseReviewEvent(sealed, "ev.yml")).not.toThrow();
    expect(lines.join("\n")).toContain("selado com sucesso");
  });

  it("10 — evento scope=findings sela pelo MESMO comando", () => {
    const fp = reviewEventFingerprintOf({
      checkpoint: "c",
      role: "technical_audit",
      eventId: "EV1",
      kind: "reaudit",
      decision: "approved",
      verifies: ["technical_audit#F1"],
      auditEvidence: EVIDENCE,
      executor: EXECUTOR,
    });
    const yaml = [
      'checkpoint: "c"',
      "role: technical_audit",
      "event_id: EV1",
      "kind: reaudit",
      "executor:",
      `  platform: ${EXECUTOR.platform}`,
      `  model: ${EXECUTOR.model}`,
      "decision: approved",
      "verifies:",
      "  - technical_audit#F1",
      "audit_evidence:",
      "  coverage:",
      "    - src/x.ts",
      '  scope: "revalidação completa"',
      '  basis: "sem regressões"',
      "event_fingerprint: x",
    ].join("\n");
    const file = tmpFile(yaml, "ev-findings.yml");
    const { logger: log } = logger();

    expect(sealReview(file, log)).toBe(0);
    expect(fs.readFileSync(file, "utf-8")).toContain(`event_fingerprint: ${fp}`);
  });

  it("11/12 — review normal continua selando; selo correto é no-op", () => {
    const file = tmpFile(cleanReviewYaml(), "review.yml");
    const { lines, logger: log } = logger();
    const before = fs.readFileSync(file, "utf-8");

    expect(sealReview(file, log)).toBe(0);
    expect(fs.readFileSync(file, "utf-8")).toBe(before); // no-op
    expect(lines.join("\n")).toContain("já estão corretos");
  });

  it("13 — selo divergente não-placeholder → falha tamper-evident (não sobrescreve)", () => {
    const review = parseReview(cleanReviewYaml(), "reviews/r.yml");
    const yaml = reviewScopeEventYaml({
      reviewFingerprint: review.reviewFingerprint,
      subjectRef: "64015b6",
      fingerprint: "aaaaaaaaaaaa",
    });
    const file = tmpFile(yaml, "ev-tamper.yml");
    const { lines, logger: log } = logger();

    expect(sealReview(file, log)).toBe(1);
    expect(lines.join("\n")).toContain("Não será sobrescrito");
    expect(fs.readFileSync(file, "utf-8")).toContain("event_fingerprint: aaaaaaaaaaaa");
  });

  it("artefato desconhecido → erro explícito", () => {
    const file = tmpFile("foo: bar\n", "desconhecido.yml");
    const { lines, logger: log } = logger();
    expect(sealReview(file, log)).toBe(1);
    expect(lines.join("\n")).toContain("Artefato desconhecido");
  });
});

describe("e2e — review limpo revalidável de ponta a ponta [CO-4 rodada 6]", () => {
  it("review approved 0 findings + HEAD avançou → evento scope=review → seal → check verde", () => {
    // 1. review original (selado) — fixture
    const reviewYaml = cleanReviewYaml();
    const review = parseReview(reviewYaml, "reviews/r.yml");

    // 2. evento prescrito pelo briefing (placeholder no selo) — fluxo OFICIAL
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-verification-"));
    const eventFile = path.join(dir, "c-co-projection-technical_audit-EV1.yml");
    fs.writeFileSync(
      eventFile,
      reviewScopeEventYaml({
        reviewFingerprint: review.reviewFingerprint,
        subjectRef: "b8f18c0..64015b6",
        previousSubjectRef: "unknown",
        fingerprint: "x",
      })
    );

    // 3. selo pelo comando canônico (nenhum script temporário)
    const silent = { info: () => {}, error: () => {} };
    expect(sealReview(eventFile, silent)).toBe(0);

    // 4. check consolida verde, distinguindo a verification de review
    const sealed = fs.readFileSync(eventFile, "utf-8");
    const result = consolidate(artifactsWith(reviewYaml, sealed));
    expect(result.violations).toHaveLength(0);
    expect(result.byCheckpoint[0].reviewScopeVerifications).toBe(1);
  });
});
