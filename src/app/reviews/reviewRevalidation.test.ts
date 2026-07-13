import { deriveReviewRevalidationAdvice } from "./reviewRevalidation.js";

const base = {
  role: "architectural_review",
  findings: [
    {
      role: "architectural_review",
      severity: "medium",
      disposition: "accepted",
      location: "src/cli/reviewBrief.ts#L1-L20",
    },
  ],
  workingTreeState: "clean" as const,
  ci: { pass: 7, fail: 0, pending: 0 },
};

describe("deriveReviewRevalidationAdvice", () => {
  it("recomenda dispensar quando o delta está limitado à correção aceita e testes", () => {
    const result = deriveReviewRevalidationAdvice({
      ...base,
      changedPaths: ["src/cli/reviewBrief.ts", "src/cli/reviewBrief.test.ts"],
    });
    expect(result.recommendation).toBe("waive");
  });

  it("recomenda revalidar quando dependências mudam", () => {
    const result = deriveReviewRevalidationAdvice({ ...base, changedPaths: ["package-lock.json"] });
    expect(result.recommendation).toBe("revalidate");
  });

  it("pede avaliação humana para código funcional sem vínculo conhecido", () => {
    const result = deriveReviewRevalidationAdvice({
      ...base,
      changedPaths: ["src/cli/newBehavior.ts"],
    });
    expect(result.recommendation).toBe("human-assessment");
  });

  it("pede avaliação humana enquanto a CI está pendente", () => {
    const result = deriveReviewRevalidationAdvice({
      ...base,
      changedPaths: ["src/cli/reviewBrief.ts"],
      ci: { pass: 6, fail: 0, pending: 1 },
    });
    expect(result.recommendation).toBe("human-assessment");
  });

  it("recomenda revalidar se há finding bloqueante aberto", () => {
    const result = deriveReviewRevalidationAdvice({
      ...base,
      changedPaths: ["src/cli/reviewBrief.ts"],
      findings: [
        {
          role: "technical_audit",
          severity: "high",
          disposition: "open",
          location: "src/cli/reviewBrief.ts#L1",
        },
      ],
    });
    expect(result.recommendation).toBe("revalidate");
  });
});
