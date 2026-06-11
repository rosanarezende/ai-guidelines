import { sealReview } from "./reviewSeal.js";
import { writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import {
  fingerprintOf,
  reviewFingerprintOf,
} from "../infrastructure/yaml/reviewArtifactsReader.js";

const logger = { info: jest.fn(), error: jest.fn() };

describe("reviewSeal", () => {
  let tmpFile: string;

  beforeEach(() => {
    tmpFile = join(tmpdir(), `test-review-${randomUUID()}.yml`);
    jest.clearAllMocks();
  });

  it("sela os placeholders de findings e review_fingerprint", () => {
    const yaml = `
checkpoint: cp-1
role: audit
findings_emitted: 1
findings:
  - id: F1
    severity: low
    location: global
    description: Test finding
    fingerprint: "<placeholder>"
    disposition: open
review_fingerprint: "<preencher>"
`;
    writeFileSync(tmpFile, yaml);

    const code = sealReview(tmpFile, logger);
    expect(code).toBe(0);

    const result = readFileSync(tmpFile, "utf-8");
    const expectedFindingHash = fingerprintOf({
      checkpoint: "cp-1",
      role: "audit",
      id: "F1",
      severity: "low",
      location: "global",
      description: "Test finding",
    });

    const expectedReviewHash = reviewFingerprintOf({
      checkpoint: "cp-1",
      role: "audit",
      findingsEmitted: 1,
      ids: ["F1"],
    });

    expect(result).toMatch(new RegExp(`fingerprint:\\s*['"]?${expectedFindingHash}['"]?`));
    expect(result).toMatch(new RegExp(`review_fingerprint:\\s*['"]?${expectedReviewHash}['"]?`));
    expect(result).not.toContain("<placeholder>");
    expect(result).not.toContain("<preencher>");
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("✅ Arquivo selado com sucesso")
    );
  });

  it("não altera se já estiver selado corretamente (idempotente)", () => {
    const findingHash = fingerprintOf({
      checkpoint: "cp-1",
      role: "audit",
      id: "F1",
      severity: "low",
      location: "global",
      description: "Test finding",
    });

    const reviewHash = reviewFingerprintOf({
      checkpoint: "cp-1",
      role: "audit",
      findingsEmitted: 1,
      ids: ["F1"],
    });

    const yaml = `checkpoint: cp-1
role: audit
findings_emitted: 1
findings:
  - id: F1
    severity: low
    location: global
    description: Test finding
    fingerprint: ${findingHash}
    disposition: open
review_fingerprint: ${reviewHash}
`;
    writeFileSync(tmpFile, yaml);

    const code = sealReview(tmpFile, logger);
    expect(code).toBe(0);

    const result = readFileSync(tmpFile, "utf-8");
    expect(result).toBe(yaml); // Nenhuma alteração estrutural
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("✅ Selos já estão corretos"));
  });

  it("falha se houver selo não-placeholder divergente", () => {
    const yaml = `checkpoint: cp-1
role: audit
findings_emitted: 1
findings:
  - id: F1
    severity: low
    location: global
    description: Test finding alterado
    fingerprint: 123456789012
    disposition: open
review_fingerprint: abcdefabcdef
`;
    writeFileSync(tmpFile, yaml);

    const code = sealReview(tmpFile, logger);
    expect(code).toBe(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        "Divergência no finding F1: selo atual (123456789012) não bate com calculado"
      )
    );
  });

  it("falha se o YAML for inválido", () => {
    writeFileSync(tmpFile, "invalid: yaml: : :");
    const code = sealReview(tmpFile, logger);
    expect(code).toBe(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Falha ao fazer parse do YAML")
    );
  });
});
