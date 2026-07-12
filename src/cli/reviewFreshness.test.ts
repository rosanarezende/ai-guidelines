import { isReviewPublicationOnlyDelta, isReviewPublicationPath } from "./reviewFreshness.js";

const REVIEWS_DIR = ".governance/specs/0024-context-architecture/reviews";

describe("reviewFreshness · deltas de publicação governada", () => {
  it("review aprovado no HEAD X + delta só de review event continua review-only", () => {
    expect(
      isReviewPublicationOnlyDelta(
        [
          ".governance/specs/0024-context-architecture/reviews/events/c-co-enforcement-technical_audit-EV3.yml",
        ],
        REVIEWS_DIR
      )
    ).toBe(true);
  });

  it("commit posterior em src não é review-only", () => {
    expect(isReviewPublicationOnlyDelta(["src/cli/reviewCheck.ts"], REVIEWS_DIR)).toBe(false);
  });

  it("fix funcional na máquina de review reabre freshness; evento de review posterior não", () => {
    expect(isReviewPublicationOnlyDelta(["src/cli/reviewCheck.ts"], REVIEWS_DIR)).toBe(false);
    expect(
      isReviewPublicationOnlyDelta(
        [
          ".governance/specs/0024-context-architecture/reviews/c-artifact-taxonomy-and-model-review-contract-architectural_review.yml",
        ],
        REVIEWS_DIR
      )
    ).toBe(true);
  });

  it("delta misto review event + código não é review-only", () => {
    expect(
      isReviewPublicationOnlyDelta(
        [
          ".governance/specs/0024-context-architecture/reviews/events/c-co-enforcement-technical_audit-EV3.yml",
          "src/cli/reviewCheck.ts",
        ],
        REVIEWS_DIR
      )
    ).toBe(false);
  });

  it("normaliza paths Windows dentro do envelope de reviews", () => {
    expect(
      isReviewPublicationPath(
        ".governance\\specs\\0024-context-architecture\\reviews\\events\\ev.yml",
        REVIEWS_DIR
      )
    ).toBe(true);
  });
});
