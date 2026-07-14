import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { parse } from "yaml";
import { makeDecisionSnapshot, makeHandoffFacts } from "../../test-utils/decisionFixtures.js";
import type { DecisionGitOps } from "./model.js";
import {
  ReviewRevalidationDefinition,
  ReviewRevalidationProjectionSynchronizer,
} from "./reviewRevalidation.js";

const PROJECTIONS = ["projection/map.json", "projection/map.html", "projection/graph.json"];

function revalidation(
  role: string,
  recommendation: "waive" | "revalidate" | "human-assessment" = "waive"
) {
  return {
    role,
    coveredHead: "b4d0c834",
    functionalHead: "ec0d9b12",
    changedPaths: ["src/cli/reviewBrief.ts", "src/cli/reviewBrief.test.ts"],
    advice: {
      role,
      recommendation,
      reasons: ["delta estreito e CI verde"],
      paths: [
        { path: "src/cli/reviewBrief.ts", classification: "finding-location" as const },
        { path: "src/cli/reviewBrief.test.ts", classification: "test" as const },
      ],
    },
  };
}

function snapshot(recommendation: "waive" | "revalidate" | "human-assessment" = "waive") {
  const facts = makeHandoffFacts({
    activeNode: {
      id: "internal-architecture-refactor-ddd-bdd",
      githubPr: 46,
      sequence: 13,
      terminal: false,
    },
  });
  return makeDecisionSnapshot({
    facts,
    checkpoint: "checkpoint-internal-architecture-refactor-ddd-bdd",
    reviewRevalidations: [
      revalidation("technical_audit", recommendation),
      revalidation("architectural_review", recommendation),
    ],
  });
}

describe("review-revalidation · recomendação e briefing", () => {
  const definition = new ReviewRevalidationDefinition();

  it("fica disponível e explica que a recomendação não decide", () => {
    const current = snapshot();
    expect(definition.detect(current).status).toBe("available");
    const brief = definition.buildBrief(current, { technical: true });
    expect(brief.summary).toMatch(/cabe à owner/);
    expect(JSON.stringify(brief.sections)).toMatch(/recomenda dispensar/);
    expect(brief.notAuthorized.join(" ")).toMatch(/automaticamente/);
    expect(brief.technicalDetails.join(" ")).toBeDefined();
  });

  it("permite aceitar recomendações somente quando todas são conclusivas", () => {
    expect(
      definition.choices(snapshot()).find((choice) => choice.id === "accept-recommendations")
        ?.available
    ).toBe(true);
    expect(
      definition
        .choices(snapshot("human-assessment"))
        .find((choice) => choice.id === "accept-recommendations")?.available
    ).toBe(false);
  });

  it("não aparece quando não há lane stale aguardando decisão", () => {
    expect(definition.detect(makeDecisionSnapshot({ reviewRevalidations: [] })).status).toBe(
      "not-applicable"
    );
  });

  it("plano preserva reviews, gate, readiness e topologia", () => {
    const plan = definition.plan(snapshot(), "accept-recommendations");
    expect(plan.mutating).toBe(true);
    expect(plan.changes.filter((change) => change.path.endsWith("state.yml"))).toHaveLength(2);
    expect(plan.preserved.join(" ")).toMatch(/reviews e eventos append-only/);
    expect(plan.preserved.join(" ")).toMatch(/readiness, Human Gate/);
  });
});

describe("review-revalidation · efeito governado", () => {
  let repoRoot: string;
  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "review-revalidation-"));
    const stateRel = ".governance/specs/0024-context-architecture/state.yml";
    fs.mkdirSync(path.dirname(path.join(repoRoot, stateRel)), { recursive: true });
    fs.copyFileSync(path.join(process.cwd(), stateRel), path.join(repoRoot, stateRel));
  });
  afterEach(() => fs.rmSync(repoRoot, { recursive: true, force: true }));

  it("registra waiver atribuída, sincroniza projeções e publica diff exclusivo", async () => {
    const synchronizer: ReviewRevalidationProjectionSynchronizer = {
      paths: PROJECTIONS,
      async synchronize(root) {
        for (const file of PROJECTIONS) {
          fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
          fs.writeFileSync(path.join(root, file), "generated\n");
        }
      },
    };
    const calls: string[] = [];
    const stateRel = ".governance/specs/0024-context-architecture/state.yml";
    const git: DecisionGitOps = {
      porcelainPaths: () => [stateRel, ...PROJECTIONS],
      revParseShortHead: () => "abc1234",
      add: (file) => calls.push(`add:${file}`),
      commit: (message) => calls.push(`commit:${message}`),
      push: () => calls.push("push"),
    };
    const definition = new ReviewRevalidationDefinition(synchronizer);
    const result = await definition.apply(definition.plan(snapshot(), "waive-all"), {
      repoRoot,
      logger: { info: () => undefined, error: () => undefined },
      actor: { name: "Rosana", email: "rosana@example.com", handle: "@rosanarezende" },
      git,
      authorization: "explicit-human-decision",
    });
    expect(result.ok).toBe(true);
    expect(result.pushed).toBe(true);
    expect(calls).toContain("push");
    const state = parse(fs.readFileSync(path.join(repoRoot, stateRel), "utf8")) as any;
    const node = state.topology.prs.active.find(
      (item: any) => item.id === "internal-architecture-refactor-ddd-bdd"
    );
    expect(node.review_plan.technical_audit.revalidation).toMatchObject({
      owner_decision: "waived",
      analyzed_head: "ec0d9b12",
      actor: "@rosanarezende",
    });
    expect(node.review_plan.architectural_review.revalidation.owner_decision).toBe("waived");
    expect(node.review_plan.technical_audit.owner_decision).toBe("required");
  });

  it("restaura arquivos quando a sincronização falha", async () => {
    const synchronizer: ReviewRevalidationProjectionSynchronizer = {
      paths: PROJECTIONS,
      async synchronize() {
        throw new Error("projection failed");
      },
    };
    const stateRel = ".governance/specs/0024-context-architecture/state.yml";
    const before = fs.readFileSync(path.join(repoRoot, stateRel), "utf8");
    const definition = new ReviewRevalidationDefinition(synchronizer);
    const result = await definition.apply(definition.plan(snapshot(), "waive-all"), {
      repoRoot,
      logger: { info: () => undefined, error: () => undefined },
      actor: { name: "Rosana", email: "rosana@example.com", handle: "@rosanarezende" },
      git: {
        porcelainPaths: () => [],
        revParseShortHead: () => null,
        add: () => undefined,
        commit: () => undefined,
        push: () => undefined,
      },
      authorization: "explicit-human-decision",
    });
    expect(result.ok).toBe(false);
    expect(fs.readFileSync(path.join(repoRoot, stateRel), "utf8")).toBe(before);
  });
});
