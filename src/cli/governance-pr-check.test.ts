import { GitHubApiCaller, runGovernancePrCheck } from "./governance-pr-check.js";

class FakeApi implements GitHubApiCaller {
  constructor(private readonly responses: Map<string, unknown>) {}
  call(endpoint: string): unknown {
    if (!this.responses.has(endpoint)) {
      throw new Error(`not stubbed: ${endpoint}`);
    }
    return this.responses.get(endpoint);
  }
}

const REPO = "rosanarezende/ai-guidelines";

describe("CLI — governance-pr-check [BR-GOVERNANCE-CI]", () => {
  describe("fast-track bypass", () => {
    it("DADO PR com label fast-track ENTÃO retorna fast-track sem chamar API", () => {
      const api = new FakeApi(new Map());
      const result = runGovernancePrCheck(
        {
          prNumber: 42,
          prBody: "Body without depends on",
          prLabels: ["fast-track"],
          repo: REPO,
        },
        api
      );
      expect(result.kind).toBe("fast-track");
    });
  });

  describe("missing marker", () => {
    it("DADO PR sem 'Depends on #N (governance)' ENTÃO falha com mensagem orientativa", () => {
      const api = new FakeApi(new Map());
      const result = runGovernancePrCheck(
        {
          prNumber: 42,
          prBody: "Just an execution PR.",
          prLabels: [],
          repo: REPO,
        },
        api
      );
      expect(result.kind).toBe("fail");
      if (result.kind === "fail") {
        expect(result.reasons.join(" ")).toMatch(/Depends on #N \(governance\)/);
      }
    });
  });

  describe("governance PR inválido", () => {
    it("DADO governance PR não-existente ENTÃO falha citando o número", () => {
      const api: GitHubApiCaller = {
        call: (ep: string) => {
          if (ep === `repos/${REPO}/pulls/99`) throw new Error("404 Not Found");
          throw new Error(`not stubbed: ${ep}`);
        },
      };
      const result = runGovernancePrCheck(
        {
          prNumber: 100,
          prBody: "Depends on #99 (governance)",
          prLabels: [],
          repo: REPO,
        },
        api
      );
      expect(result.kind).toBe("fail");
      if (result.kind === "fail") {
        expect(result.reasons.join(" ")).toMatch(/Governance PR #99 não encontrado/);
      }
    });

    it("DADO governance PR fechado sem merge ENTÃO falha", () => {
      const api = new FakeApi(
        new Map<string, unknown>([
          [`repos/${REPO}/pulls/99`, { state: "closed", merged_at: null }],
          [`repos/${REPO}/pulls/99/files?per_page=100`, []],
        ])
      );
      const result = runGovernancePrCheck(
        {
          prNumber: 100,
          prBody: "Depends on #99 (governance)",
          prLabels: [],
          repo: REPO,
        },
        api
      );
      expect(result.kind).toBe("fail");
      if (result.kind === "fail") {
        const reasons = result.reasons.join(" ");
        expect(reasons).toMatch(/estado "closed"/);
      }
    });
  });

  describe("tasks.md missing", () => {
    it("DADO governance PR aberto SEM tasks.md no diff ENTÃO falha", () => {
      const api = new FakeApi(
        new Map<string, unknown>([
          [`repos/${REPO}/pulls/99`, { state: "open", merged_at: null }],
          [
            `repos/${REPO}/pulls/99/files?per_page=100`,
            [
              { filename: ".governance/specs/0023-workflow-runtime/spec.md" },
              { filename: ".governance/specs/0023-workflow-runtime/plan.md" },
            ],
          ],
        ])
      );
      const result = runGovernancePrCheck(
        {
          prNumber: 100,
          prBody: "Depends on #99 (governance)",
          prLabels: [],
          repo: REPO,
        },
        api
      );
      expect(result.kind).toBe("fail");
      if (result.kind === "fail") {
        expect(result.reasons.join(" ")).toMatch(/tasks\.md/);
      }
    });

    it("DADO governance PR mergeado COM tasks.md em .governance/ ENTÃO retorna ok", () => {
      const api = new FakeApi(
        new Map<string, unknown>([
          [`repos/${REPO}/pulls/99`, { state: "closed", merged_at: "2026-05-19T12:00:00Z" }],
          [
            `repos/${REPO}/pulls/99/files?per_page=100`,
            [{ filename: ".governance/specs/0023-workflow-runtime/tasks.md" }],
          ],
        ])
      );
      const result = runGovernancePrCheck(
        {
          prNumber: 100,
          prBody: "Depends on #99 (governance)",
          prLabels: [],
          repo: REPO,
        },
        api
      );
      expect(result.kind).toBe("ok");
      if (result.kind === "ok") {
        expect(result.governancePrNumber).toBe(99);
      }
    });

    it("DADO governance PR com tasks.md em .specify/ (bridge legacy) ENTÃO aceita", () => {
      const api = new FakeApi(
        new Map<string, unknown>([
          [`repos/${REPO}/pulls/77`, { state: "open", merged_at: null }],
          [
            `repos/${REPO}/pulls/77/files?per_page=100`,
            [{ filename: ".specify/specs/0015-foo/tasks.md" }],
          ],
        ])
      );
      const result = runGovernancePrCheck(
        {
          prNumber: 88,
          prBody: "Depends on #77 (governance)",
          prLabels: [],
          repo: REPO,
        },
        api
      );
      expect(result.kind).toBe("ok");
    });
  });
});
