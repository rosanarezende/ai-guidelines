import {
  isReviewPublicationEnvelopePath,
  reviewPublicationProjectionPaths,
  reviewPublicationProjectionPathsForArtifact,
} from "./reviewPublicationPolicy.js";

const REVIEWS_DIR = ".governance/specs/0024-context-architecture/reviews";
const SNAPSHOT =
  ".governance/specs/0024-context-architecture/assets/governance-graph-snapshot.json";

describe("reviewPublicationPolicy", () => {
  it("deriva a projeção companheira a partir da casa canônica de reviews", () => {
    expect(reviewPublicationProjectionPaths(REVIEWS_DIR)).toEqual([SNAPSHOT]);
    expect(
      reviewPublicationProjectionPathsForArtifact(
        `${REVIEWS_DIR}/events/c-checkpoint-technical_audit-EV1.yml`
      )
    ).toEqual([SNAPSHOT]);
  });

  it("aceita somente review/evento e projeção declarada no envelope", () => {
    expect(
      isReviewPublicationEnvelopePath(
        `${REVIEWS_DIR}/c-checkpoint-technical_audit.yml`,
        REVIEWS_DIR
      )
    ).toBe(true);
    expect(isReviewPublicationEnvelopePath(SNAPSHOT, REVIEWS_DIR)).toBe(true);
    expect(isReviewPublicationEnvelopePath("src/cli/reviewCheck.ts", REVIEWS_DIR)).toBe(false);
  });

  it("normaliza paths Windows sem ampliar o envelope", () => {
    expect(
      isReviewPublicationEnvelopePath(
        ".governance\\specs\\0024-context-architecture\\assets\\governance-graph-snapshot.json",
        REVIEWS_DIR
      )
    ).toBe(true);
  });
});
