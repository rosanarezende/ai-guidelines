import { consolidate, SpecArtifacts } from "./reviewCheck.js";
import {
  parseReview,
  parseReviewEvent,
  parseResolutions,
  fingerprintOf,
  reviewEventFingerprintOf,
  reviewFingerprintOf,
  ReviewArtifactParseError,
  ReviewArtifact,
  ResolutionArtifact,
  GateArtifact,
  Finding,
  FindingSeverity,
  FindingDisposition,
} from "../infrastructure/yaml/reviewArtifactsReader.js";

const CP = "3";
const ROLE = "technical_audit";

// Constrói uma review YAML válida (per-finding + envelope fingerprints corretos).
function reviewYaml(
  findings: Array<{
    id: string;
    severity: string;
    location: string;
    description: string;
    disposition: string;
  }>,
  emitted = findings.length
): string {
  const body = findings
    .map(
      (f) =>
        `  - id: ${f.id}\n    severity: ${f.severity}\n    location: "${f.location}"\n    description: "${f.description}"\n    disposition: ${f.disposition}\n    fingerprint: ${fingerprintOf({ checkpoint: CP, role: ROLE, ...f })}`
    )
    .join("\n");
  const rfp = reviewFingerprintOf({
    checkpoint: CP,
    role: ROLE,
    findingsEmitted: emitted,
    ids: findings.map((f) => f.id),
  });
  return `checkpoint: "${CP}"\nrole: ${ROLE}\nactor: codex-cli\ndecision: changes_requested\nfindings_emitted: ${emitted}\nreview_fingerprint: ${rfp}\nfindings:\n${body}\n`;
}

const okFinding = {
  id: "F1",
  severity: "high",
  location: "src/x.ts#L1-L2",
  description: "falta validacao",
  disposition: "open",
};

describe("reviewArtifactsReader [Checkpoint 2.4a]", () => {
  it("parseReview — review válida (fingerprint correto)", () => {
    const r = parseReview(reviewYaml([okFinding]), "reviews/c3-audit.yml");
    expect(r.findingsEmitted).toBe(1);
    expect(r.findings[0]).toMatchObject({ id: "F1", severity: "high", disposition: "open" });
  });

  it("parseReview — TAMPER: editar a claim sem re-selar → rejeita (fingerprint inválido)", () => {
    const valid = reviewYaml([okFinding]);
    const tampered = valid.replace("severity: high", "severity: low"); // downgrade silencioso
    expect(() => parseReview(tampered, "f.yml")).toThrow(/fingerprint inválido/);
  });

  it("parseReview — DELEÇÃO: findings_emitted != nº de blocos → rejeita", () => {
    const yaml = reviewYaml([okFinding], 2); // declara 2, tem 1
    expect(() => parseReview(yaml, "f.yml")).toThrow(/findings_emitted/);
  });

  it("parseReview — ids não-contíguos → rejeita", () => {
    const yaml = reviewYaml([{ ...okFinding, id: "F2" }]);
    expect(() => parseReview(yaml, "f.yml")).toThrow(/deve ser "F1"/);
  });

  it("parseReview — location ausente → rejeita", () => {
    const yaml = reviewYaml([okFinding]).replace(/    location: "[^"]*"\n/, "");
    expect(() => parseReview(yaml, "f.yml")).toThrow(/location/);
  });

  it("parseReview — disposition inválida → rejeita", () => {
    const yaml = reviewYaml([{ ...okFinding, disposition: "resolved" }]); // 'resolved' não existe mais
    expect(() => parseReview(yaml, "f.yml")).toThrow(/disposition must be one of/);
  });

  it("PODA FINAL: deletar a cauda + decrementar count (review_fingerprint stale) → rejeita", () => {
    const f1fp = fingerprintOf({
      checkpoint: CP,
      role: ROLE,
      id: "F1",
      severity: "high",
      location: "x",
      description: "d",
    });
    // envelope selado para o conjunto ORIGINAL {F1,F2}; a cauda F2 foi podada e count -> 1
    const staleEnvelope = reviewFingerprintOf({
      checkpoint: CP,
      role: ROLE,
      findingsEmitted: 2,
      ids: ["F1", "F2"],
    });
    const pruned = `checkpoint: "${CP}"\nrole: ${ROLE}\nactor: a\ndecision: changes_requested\nfindings_emitted: 1\nreview_fingerprint: ${staleEnvelope}\nfindings:\n  - id: F1\n    severity: high\n    location: "x"\n    description: "d"\n    disposition: open\n    fingerprint: ${f1fp}\n`;
    expect(() => parseReview(pruned, "f.yml")).toThrow(/review_fingerprint inválido/);
  });

  it("AMBIGUIDADE (2.4c): \\n em location vs description NÃO colide (serialização canônica)", () => {
    const a = fingerprintOf({
      checkpoint: CP,
      role: ROLE,
      id: "F1",
      severity: "high",
      location: "src/file.ts\nCorrigir",
      description: "aqui",
    });
    const b = fingerprintOf({
      checkpoint: CP,
      role: ROLE,
      id: "F1",
      severity: "high",
      location: "src/file.ts",
      description: "Corrigir\naqui",
    });
    expect(a).not.toBe(b);
  });

  it("TRANSPLANTE: bloco com fingerprint de outro checkpoint/role → rejeita", () => {
    const foreignFp = fingerprintOf({
      checkpoint: "2.1",
      role: "technical_audit",
      id: "F1",
      severity: "high",
      location: "x",
      description: "d",
    });
    const transplanted = `checkpoint: "${CP}"\nrole: architectural_review\nactor: a\ndecision: changes_requested\nfindings_emitted: 1\nreview_fingerprint: zzz\nfindings:\n  - id: F1\n    severity: high\n    location: "x"\n    description: "d"\n    disposition: open\n    fingerprint: ${foreignFp}\n`;
    expect(() => parseReview(transplanted, "f.yml")).toThrow(/fingerprint inválido/);
  });

  it("parseResolutions — válida + action inválida", () => {
    const ok = parseResolutions(
      `checkpoint: "3"\nby: claude-cli\nresolutions:\n  - finding: F1\n    action: fixed\n`,
      "r.yml"
    );
    expect(ok.resolutions[0]).toMatchObject({ finding: "F1", action: "fixed" });
    expect(() =>
      parseResolutions(
        `checkpoint: "3"\nby: x\nresolutions:\n  - finding: F1\n    action: done\n`,
        "r.yml"
      )
    ).toThrow(ReviewArtifactParseError);
  });
});

function finding(id: string, severity: FindingSeverity, disposition: FindingDisposition): Finding {
  return { id, severity, location: "global", description: "d", disposition, fingerprint: "x" };
}
function review(
  role: "technical_audit" | "architectural_review",
  findings: Finding[]
): ReviewArtifact {
  return {
    checkpoint: "3",
    role,
    actor: "x",
    decision: "changes_requested",
    findingsEmitted: findings.length,
    findings,
    reviewFingerprint: "abcdef123456",
    file: `reviews/c3-${role}.yml`,
  };
}
function resolutions(
  items: Array<{ finding: string; action: "fixed" | "wontfix" | "needs-discussion" }>
): ResolutionArtifact {
  return {
    checkpoint: "3",
    by: "claude-cli",
    resolutions: items,
    file: "reviews/c3-resolutions.yml",
  };
}
function gate(decision: "approved" | "changes_requested"): GateArtifact {
  return { checkpoint: "3", actor: "@owner", decision, file: "gates/c3.yml" };
}

function reviewEventYaml(verifies: string[], eventId = "EV1"): string {
  const executor = { platform: "claude-code", model: "claude-opus-4-8" };
  const auditEvidence = {
    coverage: ["cli/governance/script-contracts.mjs"],
    scope: "re-auditoria focal",
    basis: "finding tecnicamente resolvido",
  };
  const eventFingerprint = reviewEventFingerprintOf({
    checkpoint: CP,
    role: ROLE,
    eventId,
    kind: "reaudit",
    decision: "approved",
    verifies,
    auditEvidence,
    executor,
  });
  return `checkpoint: "${CP}"
role: ${ROLE}
event_id: ${eventId}
kind: reaudit
executor:
  platform: ${executor.platform}
  model: ${executor.model}
decision: approved
verifies:
${verifies.map((v) => `  - ${v}`).join("\n")}
audit_evidence:
  coverage:
    - ${auditEvidence.coverage[0]}
  scope: "${auditEvidence.scope}"
  basis: "${auditEvidence.basis}"
event_fingerprint: ${eventFingerprint}
`;
}

function artifacts(partial: {
  reviews?: SpecArtifacts["reviews"];
  reviewEvents?: SpecArtifacts["reviewEvents"];
  resolutions?: SpecArtifacts["resolutions"];
  gates?: SpecArtifacts["gates"];
  allowedCheckpoints?: string[];
  requiredReviewRolesByCheckpoint?: SpecArtifacts["requiredReviewRolesByCheckpoint"];
  policy?: SpecArtifacts["policy"];
}): SpecArtifacts {
  return {
    reviews: partial.reviews ?? [],
    reviewEvents: partial.reviewEvents ?? [],
    resolutions: partial.resolutions ?? [],
    gates: partial.gates ?? [],
    allowedCheckpoints: partial.allowedCheckpoints ?? ["checkpoint-3"],
    ...(partial.requiredReviewRolesByCheckpoint
      ? { requiredReviewRolesByCheckpoint: partial.requiredReviewRolesByCheckpoint }
      : {}),
    ...(partial.policy ? { policy: partial.policy } : {}),
  };
}

describe("consolidate (enforcement) [Checkpoint 2.4a]", () => {
  it("ANTI-AUTOAPROVAÇÃO: resolução `fixed` NÃO destrava o gate enquanto disposition=open", () => {
    const a: SpecArtifacts = artifacts({
      reviews: [review("technical_audit", [finding("F1", "high", "open")])],
      resolutions: [resolutions([{ finding: "technical_audit#F1", action: "fixed" }])], // implementador "resolveu"
      gates: [gate("approved")],
    });
    const { violations } = consolidate(a);
    // gate aprovado mas finding bloqueante segue open → VIOLAÇÃO (só o reviewer fecha)
    expect(violations.join("\n")).toMatch(/disposition: open/);
  });

  it("gate approved com bloqueantes fechados pelo reviewer (accepted/dismissed) → OK", () => {
    const a: SpecArtifacts = artifacts({
      reviews: [
        review("technical_audit", [
          finding("F1", "high", "accepted"),
          finding("F2", "critical", "dismissed"),
        ]),
      ],
      resolutions: [],
      gates: [gate("approved")],
    });
    expect(consolidate(a).violations).toHaveLength(0);
  });

  it("gate approved com só medium/low open → OK (não-bloqueantes)", () => {
    const a: SpecArtifacts = artifacts({
      reviews: [review("architectural_review", [finding("F1", "medium", "open")])],
      resolutions: [],
      gates: [gate("approved")],
    });
    expect(consolidate(a).violations).toHaveLength(0);
  });

  it("resolução órfã (finding inexistente) → VIOLAÇÃO", () => {
    const a: SpecArtifacts = artifacts({
      reviews: [review("technical_audit", [finding("F1", "high", "accepted")])],
      resolutions: [resolutions([{ finding: "technical_audit#F9", action: "fixed" }])],
      gates: [],
    });
    expect(consolidate(a).violations.join("\n")).toMatch(/inexistente/);
  });

  it("COLISÃO CROSS-ROLE (2.4c): resolução qualificada NÃO casa finding de outra role", () => {
    // só technical_audit tem F1; resolução aponta architectural_review#F1 → órfã (sem endsWith)
    const a: SpecArtifacts = artifacts({
      reviews: [review("technical_audit", [finding("F1", "high", "accepted")])],
      resolutions: [resolutions([{ finding: "architectural_review#F1", action: "fixed" }])],
      gates: [],
    });
    expect(consolidate(a).violations.join("\n")).toMatch(/architectural_review#F1.*inexistente/);
    // a qualificada correta NÃO é órfã
    const b: SpecArtifacts = artifacts({
      reviews: [review("technical_audit", [finding("F1", "high", "accepted")])],
      resolutions: [resolutions([{ finding: "technical_audit#F1", action: "fixed" }])],
      gates: [],
    });
    expect(consolidate(b).violations).toHaveLength(0);
  });

  it("consolida contagens (open/closed) por checkpoint", () => {
    const a: SpecArtifacts = artifacts({
      reviews: [
        review("technical_audit", [
          finding("F1", "high", "open"),
          finding("F2", "low", "accepted"),
        ]),
      ],
      resolutions: [],
      gates: [],
    });
    const c = consolidate(a).byCheckpoint[0];
    expect(c.totalOpen).toBe(1);
    expect(c.totalClosed).toBe(1);
    expect(c.openBlocking.map((f) => f.id)).toEqual(["F1"]);
  });

  it("checkpoint fora da topologia → VIOLAÇÃO", () => {
    const a = artifacts({
      reviews: [review("technical_audit", [finding("F1", "low", "open")])],
      allowedCheckpoints: ["checkpoint-outra-coisa"],
    });
    expect(consolidate(a).violations.join("\n")).toMatch(/fora de state\.yml/);
  });

  it("review-policy exige role ausente no checkpoint → VIOLAÇÃO", () => {
    const a = artifacts({
      reviews: [review("technical_audit", [])],
      requiredReviewRolesByCheckpoint: { "3": ["technical_audit", "architectural_review"] },
    });
    expect(consolidate(a).violations.join("\n")).toMatch(/architectural_review/);
  });

  it("review event aprovado verifica finding existente e destrava política de accepted+fixed", () => {
    const event = parseReviewEvent(reviewEventYaml(["technical_audit#F1"]), "events/e.yml");
    const a = artifacts({
      reviews: [review("technical_audit", [finding("F1", "high", "accepted")])],
      reviewEvents: [event],
      resolutions: [resolutions([{ finding: "technical_audit#F1", action: "fixed" }])],
      policy: {
        implementationPr: { requiredReviewRoles: [], requiredNativeApprovals: 0 },
        integrationPr: { requiredReviewRoles: [], requiredNativeApprovals: 0 },
        acceptedFindings: {
          requireResolution: true,
          requireVerificationEventForFixed: true,
        },
        github: {
          minimumApprovingReviews: 0,
          requireCodeOwnerReview: false,
          dismissStaleReviewsOnPush: false,
          requireLastPushApproval: false,
        },
      },
    });
    expect(consolidate(a).violations).toHaveLength(0);
  });

  it("review event que referencia finding inexistente → VIOLAÇÃO", () => {
    const event = parseReviewEvent(reviewEventYaml(["technical_audit#F9"]), "events/e.yml");
    const a = artifacts({
      reviews: [review("technical_audit", [finding("F1", "high", "accepted")])],
      reviewEvents: [event],
    });
    expect(consolidate(a).violations.join("\n")).toMatch(/F9.*inexistente/);
  });

  it("review events com event_id duplicado no mesmo checkpoint/role → VIOLAÇÃO", () => {
    const a = artifacts({
      reviews: [review("technical_audit", [finding("F1", "high", "accepted")])],
      reviewEvents: [
        parseReviewEvent(reviewEventYaml(["technical_audit#F1"], "EV1"), "events/e1.yml"),
        parseReviewEvent(reviewEventYaml(["technical_audit#F1"], "EV1"), "events/e2.yml"),
      ],
    });
    expect(consolidate(a).violations.join("\n")).toMatch(/duplicado/);
  });

  it("review events com lacuna na sequência EV1..EVN → VIOLAÇÃO", () => {
    const a = artifacts({
      reviews: [review("technical_audit", [finding("F1", "high", "accepted")])],
      reviewEvents: [
        parseReviewEvent(reviewEventYaml(["technical_audit#F1"], "EV1"), "events/e1.yml"),
        parseReviewEvent(reviewEventYaml(["technical_audit#F1"], "EV3"), "events/e3.yml"),
      ],
    });
    expect(consolidate(a).violations.join("\n")).toMatch(/falta EV2/);
  });

  it("review event com event_id fora do padrão EVN → VIOLAÇÃO", () => {
    const a = artifacts({
      reviews: [review("technical_audit", [finding("F1", "high", "accepted")])],
      reviewEvents: [
        parseReviewEvent(reviewEventYaml(["technical_audit#F1"], "REAUDIT-1"), "events/e1.yml"),
      ],
    });
    expect(consolidate(a).violations.join("\n")).toMatch(/event_id.*inválido/);
  });
});

// Constrói uma review SEM findings (aprovação limpa). `evidence: null` omite a
// `audit_evidence` (caso inválido). `actor`/`decision` parametrizáveis.
function cleanReviewYaml(
  evidence: { scope: string; basis: string } | null,
  opts: { decision?: string; actor?: string; coverage?: string[] } = {}
): string {
  const decision = opts.decision ?? "approved";
  const actor = opts.actor ?? "gemini-3-pro-high";
  const coverage = opts.coverage ?? ["src/domain/knowledge"];
  const auditEvidence = evidence ? { ...evidence, coverage } : undefined;
  const rfp = reviewFingerprintOf({
    checkpoint: CP,
    role: ROLE,
    findingsEmitted: 0,
    ids: [],
    ...(auditEvidence ? { auditEvidence } : {}),
  });
  const covBlock = coverage.map((c) => `    - ${c}`).join("\n");
  const ev = evidence
    ? `\naudit_evidence:\n  coverage:\n${covBlock}\n  scope: "${evidence.scope}"\n  basis: "${evidence.basis}"`
    : "";
  return `checkpoint: "${CP}"\nrole: ${ROLE}\nactor: ${actor}\ndecision: ${decision}\nfindings_emitted: 0\nreview_fingerprint: ${rfp}${ev}\n`;
}

describe("audit_evidence — aprovação limpa [2.4e]", () => {
  const ev = {
    scope: "domain/knowledge, app/projections — invariantes §3",
    basis: "invariantes sustentados; débitos §5 isentos; sem issue impeditiva",
  };

  it("0 findings COM audit_evidence (scope+basis) → parseia e expõe a evidência selada", () => {
    const r = parseReview(cleanReviewYaml(ev), "reviews/c-x-technical_audit.yml");
    expect(r.findingsEmitted).toBe(0);
    expect(r.findings).toHaveLength(0);
    expect(r.auditEvidence).toMatchObject(ev);
    expect(r.auditEvidence?.coverage).toEqual(["src/domain/knowledge"]);
  });

  it("0 findings SEM audit_evidence → rejeita (review cego para recuperabilidade)", () => {
    expect(() => parseReview(cleanReviewYaml(null), "f.yml")).toThrow(/audit_evidence/);
  });

  it("0 findings com scope vazio → rejeita", () => {
    expect(() => parseReview(cleanReviewYaml({ scope: "", basis: "x" }), "f.yml")).toThrow(/scope/);
  });

  it("0 findings com basis vazio → rejeita", () => {
    expect(() => parseReview(cleanReviewYaml({ scope: "x", basis: "" }), "f.yml")).toThrow(/basis/);
  });

  it("audit_evidence PROIBIDA quando há findings (lá a evidência são os findings) → rejeita", () => {
    const withFindings = reviewYaml([okFinding]) + `audit_evidence:\n  scope: "x"\n  basis: "y"\n`;
    expect(() => parseReview(withFindings, "f.yml")).toThrow(/proibido quando há findings/);
  });

  it("TAMPER: editar a base da aprovação sem re-selar → review_fingerprint inválido", () => {
    const tampered = cleanReviewYaml(ev).replace(ev.basis, "aprovado sem checar nada");
    expect(() => parseReview(tampered, "f.yml")).toThrow(/review_fingerprint inválido/);
  });

  it("PROVENIÊNCIA legada: `actor` (string) preservado quando sem executor", () => {
    expect(parseReview(cleanReviewYaml(ev, { actor: "codex-cli" }), "f.yml").actor).toBe(
      "codex-cli"
    );
    expect(parseReview(cleanReviewYaml(ev, { actor: "gpt-oss-120b" }), "f.yml").actor).toBe(
      "gpt-oss-120b"
    );
  });
});

const EXEC = { platform: "antigravity", model: "gemini-3.1-pro-high" };

// Aprovação limpa (0 findings) com `executor` estruturado + audit_evidence.
// `executor: null` omite o bloco (proveniência ausente); `alsoActor` injeta `actor`
// junto (caso ambíguo proibido).
function execCleanYaml(
  executor: { platform: string; model: string } | null,
  opts: { alsoActor?: string } = {}
): string {
  const evidence = {
    coverage: ["src/domain/knowledge"],
    scope: "domain/knowledge",
    basis: "invariantes ok; sem issue",
  };
  const rfp = reviewFingerprintOf({
    checkpoint: CP,
    role: ROLE,
    findingsEmitted: 0,
    ids: [],
    auditEvidence: evidence,
    ...(executor ? { executor } : {}),
  });
  const execBlock = executor
    ? `executor:\n  platform: ${executor.platform}\n  model: ${executor.model}\n`
    : "";
  const actorBlock = opts.alsoActor ? `actor: ${opts.alsoActor}\n` : "";
  return `checkpoint: "${CP}"\nrole: ${ROLE}\n${execBlock}${actorBlock}decision: approved\nfindings_emitted: 0\naudit_evidence:\n  coverage:\n    - src/domain/knowledge\n  scope: "${evidence.scope}"\n  basis: "${evidence.basis}"\nreview_fingerprint: ${rfp}\n`;
}

describe("executor — proveniência estruturada [2.4f]", () => {
  it("executor { platform, model } (+ audit_evidence) → parseia e sela; actor ausente", () => {
    const r = parseReview(execCleanYaml(EXEC), "reviews/c-x-technical_audit.yml");
    expect(r.executor).toEqual(EXEC);
    expect(r.actor).toBeUndefined();
  });

  it("executor sem platform → rejeita", () => {
    expect(() => parseReview(execCleanYaml({ platform: "", model: "x" }), "f.yml")).toThrow(
      /platform/
    );
  });

  it("executor sem model → rejeita", () => {
    expect(() => parseReview(execCleanYaml({ platform: "x", model: "" }), "f.yml")).toThrow(
      /model/
    );
  });

  it("actor E executor juntos → rejeita (proveniência ambígua)", () => {
    expect(() => parseReview(execCleanYaml(EXEC, { alsoActor: "rosana" }), "f.yml")).toThrow(
      /não ambos/
    );
  });

  it("nem actor nem executor → rejeita (proveniência obrigatória)", () => {
    expect(() => parseReview(execCleanYaml(null), "f.yml")).toThrow(/proveniência obrigatória/);
  });

  it("TAMPER: trocar executor.model sem re-selar → review_fingerprint inválido", () => {
    const tampered = execCleanYaml(EXEC).replace(EXEC.model, "claude-opus-4-8");
    expect(() => parseReview(tampered, "f.yml")).toThrow(/review_fingerprint inválido/);
  });

  it("executor com findings (sem audit_evidence) → sela executor na extensão tagueada", () => {
    const f = okFinding;
    const ffp = fingerprintOf({ checkpoint: CP, role: ROLE, ...f });
    const rfp = reviewFingerprintOf({
      checkpoint: CP,
      role: ROLE,
      findingsEmitted: 1,
      ids: ["F1"],
      executor: EXEC,
    });
    const yaml = `checkpoint: "${CP}"\nrole: ${ROLE}\nexecutor:\n  platform: ${EXEC.platform}\n  model: ${EXEC.model}\ndecision: changes_requested\nfindings_emitted: 1\nreview_fingerprint: ${rfp}\nfindings:\n  - id: F1\n    severity: ${f.severity}\n    location: "${f.location}"\n    description: "${f.description}"\n    disposition: ${f.disposition}\n    fingerprint: ${ffp}\n`;
    const r = parseReview(yaml, "f.yml");
    expect(r.executor).toEqual(EXEC);
    expect(r.findings).toHaveLength(1);
  });

  it("COMPAT: review legado com actor (string, sem executor) segue válido", () => {
    const r = parseReview(cleanReviewYaml({ scope: "x", basis: "y" }), "f.yml");
    expect(r.actor).toBe("gemini-3-pro-high");
    expect(r.executor).toBeUndefined();
  });
});

describe("coverage — o 'onde' estruturado [2.4g]", () => {
  const ev = { scope: "narrativa do que/como", basis: "por que aprovou" };

  it("coverage (lista de caminhos) → parseia e sela; scope/basis seguem texto", () => {
    const r = parseReview(
      cleanReviewYaml(ev, {
        coverage: ["src/domain/insight", "src/app/projections/KnowledgeGraph.ts"],
      }),
      "reviews/c-x-technical_audit.yml"
    );
    expect(r.auditEvidence?.coverage).toEqual([
      "src/domain/insight",
      "src/app/projections/KnowledgeGraph.ts",
    ]);
    expect(r.auditEvidence?.scope).toBe(ev.scope);
  });

  it("coverage ausente → rejeita (cobertura não-queryável)", () => {
    const noCov = `checkpoint: "${CP}"\nrole: ${ROLE}\nactor: a\ndecision: approved\nfindings_emitted: 0\naudit_evidence:\n  scope: "x"\n  basis: "y"\nreview_fingerprint: zzz\n`;
    expect(() => parseReview(noCov, "f.yml")).toThrow(/coverage/);
  });

  it("coverage lista vazia → rejeita", () => {
    const emptyCov = `checkpoint: "${CP}"\nrole: ${ROLE}\nactor: a\ndecision: approved\nfindings_emitted: 0\naudit_evidence:\n  coverage: []\n  scope: "x"\n  basis: "y"\nreview_fingerprint: zzz\n`;
    expect(() => parseReview(emptyCov, "f.yml")).toThrow(/NÃO-vazia/);
  });

  it("coverage com prosa (espaço) → rejeita (queryabilidade exige tokens de caminho)", () => {
    const y = cleanReviewYaml(ev, {
      coverage: ["src/domain/insight", "domain/insight (transições, serializer)"],
    });
    expect(() => parseReview(y, "f.yml")).toThrow(/espaço/);
  });

  it("TAMPER: trocar um caminho de coverage sem re-selar → review_fingerprint inválido", () => {
    const y = cleanReviewYaml(ev, { coverage: ["src/domain/insight"] });
    const tampered = y.replace("src/domain/insight", "src/domain/knowledge");
    expect(() => parseReview(tampered, "f.yml")).toThrow(/review_fingerprint inválido/);
  });
});
