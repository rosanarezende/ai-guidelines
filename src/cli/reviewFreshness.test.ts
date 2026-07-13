import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  collectRevalidationScopeStates,
  isReviewPublicationOnlyDelta,
  isReviewPublicationPath,
  isRevalidationDecisionCommit,
} from "./reviewFreshness.js";

const REVIEWS_DIR = ".governance/specs/0024-context-architecture/reviews";
const SNAPSHOT =
  ".governance/specs/0024-context-architecture/assets/governance-graph-snapshot.json";

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

  it("mantém a dispensa só através do commit atômico da decisão e a invalida após código", () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), "revalidation-scope-"));
    const git = (...args: string[]) =>
      execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
    const specPath = ".governance/specs/0024-context-architecture";
    try {
      git("init");
      git("config", "user.email", "test@example.com");
      git("config", "user.name", "Test");
      fs.mkdirSync(path.join(repo, specPath, "assets"), { recursive: true });
      fs.writeFileSync(path.join(repo, specPath, "state.yml"), "stage: implementation\n");
      git("add", ".");
      git("commit", "-m", "base");
      const analyzedHead = git("rev-parse", "--short", "HEAD");

      fs.appendFileSync(path.join(repo, specPath, "state.yml"), "focus: decision\n");
      fs.writeFileSync(path.join(repo, specPath, "assets", "governed-work-map.html"), "map\n");
      git("add", ".");
      git("commit", "-m", "docs(spec-0024): registra decisão sobre revalidação de reviews");
      const decisionHead = git("rev-parse", "--short", "HEAD");
      const plan = {
        technical_audit: {
          system_recommendation: "recommended" as const,
          owner_decision: "required" as const,
          revalidation: { owner_decision: "waived" as const, analyzed_head: analyzedHead },
        },
      };
      expect(
        collectRevalidationScopeStates(repo, plan, decisionHead, specPath).technical_audit.current
      ).toBe(true);

      fs.mkdirSync(path.join(repo, "src"), { recursive: true });
      fs.writeFileSync(path.join(repo, "src", "change.ts"), "export const changed = true;\n");
      git("add", ".");
      git("commit", "-m", "feat: muda runtime");
      const functionalHead = git("rev-parse", "--short", "HEAD");
      expect(
        collectRevalidationScopeStates(repo, plan, functionalHead, specPath).technical_audit.current
      ).toBe(false);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
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

  it("review + projeção determinística declarada continuam não funcionais", () => {
    expect(
      isReviewPublicationOnlyDelta(
        [`${REVIEWS_DIR}/events/c-co-enforcement-technical_audit-EV3.yml`, SNAPSHOT],
        REVIEWS_DIR
      )
    ).toBe(true);
    expect(isReviewPublicationOnlyDelta([SNAPSHOT], REVIEWS_DIR)).toBe(true);
  });

  it("normaliza paths Windows dentro do envelope de reviews", () => {
    expect(
      isReviewPublicationPath(
        ".governance\\specs\\0024-context-architecture\\reviews\\events\\ev.yml",
        REVIEWS_DIR
      )
    ).toBe(true);
  });

  it("reconhece somente o envelope exato da decisão de revalidação", () => {
    const specPath = ".governance/specs/0024-context-architecture";
    const subject = "docs(spec-0024): registra decisão sobre revalidação de reviews";
    expect(
      isRevalidationDecisionCommit(
        subject,
        [
          `${specPath}/state.yml`,
          `${specPath}/assets/governed-work-map.html`,
          `${specPath}/assets/governance-graph-snapshot.json`,
        ],
        specPath
      )
    ).toBe(true);
    expect(isRevalidationDecisionCommit(subject, ["src/cli/prReadyCheck.ts"], specPath)).toBe(
      false
    );
    expect(
      isRevalidationDecisionCommit("docs: decisão manual", [`${specPath}/state.yml`], specPath)
    ).toBe(false);
  });
});
