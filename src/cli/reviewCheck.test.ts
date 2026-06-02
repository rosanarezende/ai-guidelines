import { consolidate, SpecArtifacts } from "./reviewCheck.js";
import {
  parseReview,
  parseResolutions,
  fingerprintOf,
  ReviewArtifactParseError,
  ReviewArtifact,
  ResolutionArtifact,
  GateArtifact,
  Finding,
  FindingSeverity,
  FindingDisposition,
} from "../infrastructure/yaml/reviewArtifactsReader.js";

// Constrói uma review YAML válida (fingerprints corretos computados).
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
        `  - id: ${f.id}\n    severity: ${f.severity}\n    location: "${f.location}"\n    description: "${f.description}"\n    disposition: ${f.disposition}\n    fingerprint: ${fingerprintOf(f)}`
    )
    .join("\n");
  return `checkpoint: "3"\nrole: technical_audit\nactor: codex-cli\ndecision: changes_requested\nfindings_emitted: ${emitted}\nfindings:\n${body}\n`;
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
      resolutions: [resolutions([{ finding: "F1", action: "fixed" }])], // implementador "resolveu"
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
      resolutions: [resolutions([{ finding: "F9", action: "fixed" }])],
      gates: [],
    };
    expect(consolidate(a).violations.join("\n")).toMatch(/finding "F9" inexistente/);
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
