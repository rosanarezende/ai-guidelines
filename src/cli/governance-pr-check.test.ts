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
    it("DADO PR com label fast-track + rationale inline [fast-track: ...] ENTÃO retorna fast-track sem chamar API", () => {
      const api = new FakeApi(new Map());
      const result = runGovernancePrCheck(
        {
          prNumber: 42,
          prBody: "Hotfix urgente. [fast-track: prod incident; reviewer assume risco]",
          prLabels: ["fast-track"],
          repo: REPO,
        },
        api
      );
      expect(result.kind).toBe("fast-track");
    });

    it("DADO PR com label fast-track + seção ## Fast-track Rationale ENTÃO aceita", () => {
      const api = new FakeApi(new Map());
      const result = runGovernancePrCheck(
        {
          prNumber: 43,
          prBody:
            "## Fast-track Rationale\n\nFix mínimo; reviewer humano absorve responsabilidade.",
          prLabels: ["fast-track"],
          repo: REPO,
        },
        api
      );
      expect(result.kind).toBe("fast-track");
    });

    it("DADO PR com label fast-track MAS sem rationale no body ENTÃO falha (bypass disfarçado)", () => {
      const api = new FakeApi(new Map());
      const result = runGovernancePrCheck(
        {
          prNumber: 44,
          prBody: "Body without rationale",
          prLabels: ["fast-track"],
          repo: REPO,
        },
        api
      );
      expect(result.kind).toBe("fail");
      if (result.kind === "fail") {
        expect(result.reasons.join(" ")).toMatch(/rationale/i);
        expect(result.reasons.join(" ")).toMatch(/bypass disfar/i);
      }
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
          [`repos/${REPO}/pulls/99/files?per_page=100&page=1`, []],
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
            `repos/${REPO}/pulls/99/files?per_page=100&page=1`,
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
            `repos/${REPO}/pulls/99/files?per_page=100&page=1`,
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
            `repos/${REPO}/pulls/77/files?per_page=100&page=1`,
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

  describe("pagination", () => {
    it("DADO governance PR com >100 arquivos E tasks.md na página 2 ENTÃO pagina e aceita", () => {
      // Página 1: 100 arquivos sem tasks.md (força paginação a seguir)
      const page1: ReadonlyArray<{ filename: string }> = Array.from({ length: 100 }, (_, i) => ({
        filename: `src/file-${i}.ts`,
      }));
      // Página 2: contém o tasks.md
      const page2 = [{ filename: ".governance/specs/0023-workflow-runtime/tasks.md" }];
      // Página 3 vazia (sinaliza fim)
      const page3: ReadonlyArray<{ filename: string }> = [];

      const api = new FakeApi(
        new Map<string, unknown>([
          [`repos/${REPO}/pulls/55`, { state: "open", merged_at: null }],
          [`repos/${REPO}/pulls/55/files?per_page=100&page=1`, page1],
          [`repos/${REPO}/pulls/55/files?per_page=100&page=2`, page2],
          [`repos/${REPO}/pulls/55/files?per_page=100&page=3`, page3],
        ])
      );
      const result = runGovernancePrCheck(
        {
          prNumber: 66,
          prBody: "Depends on #55 (governance)",
          prLabels: [],
          repo: REPO,
        },
        api
      );
      expect(result.kind).toBe("ok");
    });

    it("DADO governance PR com exatamente 100 arquivos (todos sem tasks.md) ENTÃO falha sem buscar página 2", () => {
      // Última página com <PER_PAGE itens encerra a paginação; se for exatamente 100 e nenhum tasks.md, tenta página 2 e ela vazia confirma.
      const page1: ReadonlyArray<{ filename: string }> = Array.from({ length: 100 }, (_, i) => ({
        filename: `src/file-${i}.ts`,
      }));
      const api = new FakeApi(
        new Map<string, unknown>([
          [`repos/${REPO}/pulls/55`, { state: "open", merged_at: null }],
          [`repos/${REPO}/pulls/55/files?per_page=100&page=1`, page1],
          [`repos/${REPO}/pulls/55/files?per_page=100&page=2`, []],
        ])
      );
      const result = runGovernancePrCheck(
        {
          prNumber: 66,
          prBody: "Depends on #55 (governance)",
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
  });
});
