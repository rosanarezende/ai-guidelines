import { consolidate, SpecArtifacts } from "./reviewCheck.js";
import {
  parseReview,
  parseResolutions,
  fingerprintOf,
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

describe("consolidate (enforcement) [Checkpoint 2.4a]", () => {
  it("ANTI-AUTOAPROVAÇÃO: resolução `fixed` NÃO destrava o gate enquanto disposition=open", () => {
    const a: SpecArtifacts = {
      reviews: [review("technical_audit", [finding("F1", "high", "open")])],
      resolutions: [resolutions([{ finding: "technical_audit#F1", action: "fixed" }])], // implementador "resolveu"
      gates: [gate("approved")],
    };
    const { violations } = consolidate(a);
    // gate aprovado mas finding bloqueante segue open → VIOLAÇÃO (só o reviewer fecha)
    expect(violations.join("\n")).toMatch(/disposition: open/);
  });

  it("gate approved com bloqueantes fechados pelo reviewer (accepted/dismissed) → OK", () => {
    const a: SpecArtifacts = {
      reviews: [
        review("technical_audit", [
          finding("F1", "high", "accepted"),
          finding("F2", "critical", "dismissed"),
        ]),
      ],
      resolutions: [],
      gates: [gate("approved")],
    };
    expect(consolidate(a).violations).toHaveLength(0);
  });

  it("gate approved com só medium/low open → OK (não-bloqueantes)", () => {
    const a: SpecArtifacts = {
      reviews: [review("architectural_review", [finding("F1", "medium", "open")])],
      resolutions: [],
      gates: [gate("approved")],
    };
    expect(consolidate(a).violations).toHaveLength(0);
  });

  it("resolução órfã (finding inexistente) → VIOLAÇÃO", () => {
    const a: SpecArtifacts = {
      reviews: [review("technical_audit", [finding("F1", "high", "accepted")])],
      resolutions: [resolutions([{ finding: "technical_audit#F9", action: "fixed" }])],
      gates: [],
    };
    expect(consolidate(a).violations.join("\n")).toMatch(/inexistente/);
  });

  it("COLISÃO CROSS-ROLE (2.4c): resolução qualificada NÃO casa finding de outra role", () => {
    // só technical_audit tem F1; resolução aponta architectural_review#F1 → órfã (sem endsWith)
    const a: SpecArtifacts = {
      reviews: [review("technical_audit", [finding("F1", "high", "accepted")])],
      resolutions: [resolutions([{ finding: "architectural_review#F1", action: "fixed" }])],
      gates: [],
    };
    expect(consolidate(a).violations.join("\n")).toMatch(/architectural_review#F1.*inexistente/);
    // a qualificada correta NÃO é órfã
    const b: SpecArtifacts = {
      reviews: [review("technical_audit", [finding("F1", "high", "accepted")])],
      resolutions: [resolutions([{ finding: "technical_audit#F1", action: "fixed" }])],
      gates: [],
    };
    expect(consolidate(b).violations).toHaveLength(0);
  });

  it("consolida contagens (open/closed) por checkpoint", () => {
    const a: SpecArtifacts = {
      reviews: [
        review("technical_audit", [
          finding("F1", "high", "open"),
          finding("F2", "low", "accepted"),
        ]),
      ],
      resolutions: [],
      gates: [],
    };
    const c = consolidate(a).byCheckpoint[0];
    expect(c.totalOpen).toBe(1);
    expect(c.totalClosed).toBe(1);
    expect(c.openBlocking.map((f) => f.id)).toEqual(["F1"]);
  });
});
