import { consolidate, SpecArtifacts } from "./reviewCheck.js";
import {
  parseReview,
  parseGate,
  ReviewArtifactParseError,
  ReviewArtifact,
  GateArtifact,
} from "../infrastructure/yaml/reviewArtifactsReader.js";

const REVIEW_YAML = `checkpoint: "3"
role: technical_audit
actor: codex-cli
decision: changes_requested
summary: "audit do c3"
findings:
  - id: F1
    severity: high
    status: open
    description: "falta validação em X"
  - id: F2
    severity: low
    status: resolved
    description: "nit de naming"
`;

describe("reviewArtifactsReader [Checkpoint 2.4]", () => {
  it("parseReview — review válida com findings", () => {
    const r = parseReview(REVIEW_YAML, "reviews/c3-audit.yml");
    expect(r.role).toBe("technical_audit");
    expect(r.decision).toBe("changes_requested");
    expect(r.findings).toHaveLength(2);
    expect(r.findings[0]).toMatchObject({ id: "F1", severity: "high", status: "open" });
  });

  it("parseReview — severidade inválida rejeita", () => {
    const bad = REVIEW_YAML.replace("severity: high", "severity: blocker");
    expect(() => parseReview(bad, "f.yml")).toThrow(/severity must be one of/);
  });

  it("parseReview — status inválido rejeita", () => {
    const bad = REVIEW_YAML.replace("status: open", "status: wip");
    expect(() => parseReview(bad, "f.yml")).toThrow(/status must be one of/);
  });

  it("parseReview — finding id duplicado rejeita", () => {
    const bad = REVIEW_YAML.replace("id: F2", "id: F1");
    expect(() => parseReview(bad, "f.yml")).toThrow(/duplicate finding id/);
  });

  it("parseGate — decisão inválida rejeita", () => {
    const bad = `checkpoint: "3"\nactor: "@owner"\ndecision: maybe\n`;
    expect(() => parseGate(bad, "g.yml")).toThrow(ReviewArtifactParseError);
  });
});

function review(
  checkpoint: string,
  role: "technical_audit" | "architectural_review",
  decision: "approved" | "changes_requested" | "blocked",
  findings: ReviewArtifact["findings"],
  file = `reviews/c${checkpoint}-${role}.yml`
): ReviewArtifact {
  return { checkpoint, role, actor: "x", decision, findings, file };
}
function gate(checkpoint: string, decision: "approved" | "changes_requested"): GateArtifact {
  return { checkpoint, actor: "@owner", decision, file: `gates/c${checkpoint}.yml` };
}

describe("consolidate (enforcement) [Checkpoint 2.4]", () => {
  it("gate approved com finding bloqueante (high) `open` → VIOLAÇÃO", () => {
    const a: SpecArtifacts = {
      reviews: [
        review("3", "technical_audit", "changes_requested", [
          { id: "F1", severity: "high", status: "open", description: "x" },
        ]),
      ],
      gates: [gate("3", "approved")],
    };
    const { violations } = consolidate(a);
    expect(violations.join("\n")).toMatch(/gate.*approved.*bloqueante/i);
  });

  it("gate approved com bloqueantes todos resolved/accepted → OK", () => {
    const a: SpecArtifacts = {
      reviews: [
        review("3", "technical_audit", "approved", [
          { id: "F1", severity: "high", status: "resolved", description: "x" },
          { id: "F2", severity: "critical", status: "accepted", description: "y" },
        ]),
      ],
      gates: [gate("3", "approved")],
    };
    const { violations, byCheckpoint } = consolidate(a);
    expect(violations).toHaveLength(0);
    expect(byCheckpoint[0].totalOpen).toBe(0);
  });

  it("gate approved com apenas findings medium/low open → OK (não-bloqueantes)", () => {
    const a: SpecArtifacts = {
      reviews: [
        review("3", "architectural_review", "approved", [
          { id: "F1", severity: "medium", status: "open", description: "x" },
        ]),
      ],
      gates: [gate("3", "approved")],
    };
    expect(consolidate(a).violations).toHaveLength(0);
  });

  it("dois arquivos de review para a mesma (checkpoint, role) → VIOLAÇÃO", () => {
    const a: SpecArtifacts = {
      reviews: [
        review("3", "technical_audit", "approved", [], "reviews/c3-audit.yml"),
        review("3", "technical_audit", "approved", [], "reviews/c3-audit-2.yml"),
      ],
      gates: [],
    };
    expect(consolidate(a).violations.join("\n")).toMatch(/múltiplos arquivos de review/);
  });

  it("consolida contagens por checkpoint", () => {
    const a: SpecArtifacts = {
      reviews: [
        review("3", "technical_audit", "changes_requested", [
          { id: "F1", severity: "high", status: "open", description: "x" },
          { id: "F2", severity: "low", status: "resolved", description: "y" },
        ]),
        review("3", "architectural_review", "approved", [
          { id: "G1", severity: "medium", status: "open", description: "z" },
        ]),
      ],
      gates: [],
    };
    const c = consolidate(a).byCheckpoint[0];
    expect(c.totalOpen).toBe(2);
    expect(c.totalResolved).toBe(1);
    expect(c.openBlocking.map((f) => f.id)).toEqual(["F1"]);
    expect(c.reviewDecisions).toHaveLength(2);
  });
});
