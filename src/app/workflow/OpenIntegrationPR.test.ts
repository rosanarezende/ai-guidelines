import {
  CreatePullRequestInput,
  MergePullRequestInput,
  PullRequestData,
  StackOps,
} from "../ports/StackOps.js";
import { WorkflowFileSystem } from "../ports/WorkflowFileSystem.js";
import { OpenIntegrationPR, OpenIntegrationPRError } from "./OpenIntegrationPR.js";

class FakeStackOps implements StackOps {
  createdPRs: CreatePullRequestInput[] = [];
  nextPrNumber = 26;

  createPullRequest(input: CreatePullRequestInput): PullRequestData {
    this.createdPRs.push(input);
    const number = this.nextPrNumber++;
    return {
      number,
      title: input.title,
      body: input.body,
      state: "OPEN",
      isDraft: !!input.draft,
      headRefName: input.head,
      baseRefName: input.base,
      labels: [...(input.labels ?? [])],
      url: `https://github.com/test/repo/pull/${number}`,
      mergeCommitSha: null,
    };
  }
  getPullRequest(): PullRequestData | null {
    return null;
  }
  setPullRequestBody(): void {}
  editPullRequestBase(): void {
    throw new Error("not used in OpenIntegrationPR tests");
  }
  mergePullRequest(_input: MergePullRequestInput): void {
    throw new Error("not used in OpenIntegrationPR tests");
  }
  closePullRequest(): void {
    throw new Error("not used in OpenIntegrationPR tests");
  }
  listOpenPullRequests(): ReadonlyArray<PullRequestData> {
    return [];
  }
  listReviewComments() {
    return [];
  }
}

class FakeFs implements WorkflowFileSystem {
  files: Map<string, string>;
  dirs: Set<string>;
  branch: string | null;
  constructor(opts: { files?: Map<string, string>; dirs?: Set<string>; branch?: string | null }) {
    this.files = new Map(opts.files ?? []);
    this.dirs = new Set(opts.dirs ?? []);
    this.branch = opts.branch ?? null;
  }
  fileExists(p: string): boolean {
    return this.files.has(p);
  }
  directoryExists(p: string): boolean {
    return this.dirs.has(p);
  }
  readTextFile(p: string): string {
    const c = this.files.get(p);
    if (c === undefined) throw new Error(`missing ${p}`);
    return c;
  }
  writeTextFile(): void {
    throw new Error("not used");
  }
  listDirectory(p: string): ReadonlyArray<string> {
    const prefix = `${p}/`;
    const set = new Set<string>();
    for (const d of this.dirs) {
      if (d.startsWith(prefix)) {
        const seg = d.slice(prefix.length).split("/")[0];
        if (seg) set.add(seg);
      }
    }
    return [...set];
  }
  currentBranch(): string | null {
    return this.branch;
  }
  resolveAbsolute(p: string): string {
    return `/repo/${p}`;
  }
}

const SPEC_DIR = ".governance/specs/0023-workflow-runtime";
const BODY_PATH = `${SPEC_DIR}/integration-pr.md`;
const SAMPLE_BODY = `## Integration PR

Homologação da stack.

Stack: #18 → #19 → #22 → #23 → #24 → #25
`;

function makeFs(opts: { branch?: string; bodyExists?: boolean; body?: string } = {}): FakeFs {
  const files = new Map<string, string>();
  if (opts.bodyExists !== false) {
    files.set(BODY_PATH, opts.body ?? SAMPLE_BODY);
  }
  return new FakeFs({
    files,
    dirs: new Set([SPEC_DIR, ".governance/specs"]),
    branch: opts.branch ?? "feat/spec-0023-dx-thinking",
  });
}

describe("App — OpenIntegrationPR [BR-WORKFLOW-OPEN-INTEGRATION-PR]", () => {
  describe("plan", () => {
    it("DADO spec ativa + body file presente + branch corrente ENTÃO devolve plan com title canônico e draft=true", () => {
      const fs = makeFs();
      const stack = new FakeStackOps();
      const result = new OpenIntegrationPR(fs, stack).plan();

      expect(result.specId).toBe("0023");
      expect(result.specSlug).toBe("workflow-runtime");
      expect(result.title).toBe("[🔗] [Integration] [Spec 0023] Homologação final da stack");
      expect(result.body).toBe(SAMPLE_BODY);
      expect(result.bodyFilePath).toBe(BODY_PATH);
      expect(result.base).toBe("main");
      expect(result.head).toBe("feat/spec-0023-dx-thinking");
      expect(result.draft).toBe(true);
    });

    it("DADO titleOverride fornecido ENTÃO usa override em vez do auto-gerado", () => {
      const fs = makeFs();
      const result = new OpenIntegrationPR(fs, new FakeStackOps()).plan({
        titleOverride: "[🔗] [Integration] [Spec 0023] Custom title",
      });
      expect(result.title).toBe("[🔗] [Integration] [Spec 0023] Custom title");
    });

    it("DADO body file ausente ENTÃO erro narrativo orientando criar o arquivo", () => {
      const fs = makeFs({ bodyExists: false });
      expect(() => new OpenIntegrationPR(fs, new FakeStackOps()).plan()).toThrow(
        OpenIntegrationPRError
      );
      expect(() => new OpenIntegrationPR(fs, new FakeStackOps()).plan()).toThrow(
        /Body file não encontrado.*integration-pr\.md/
      );
    });

    it("DADO body file vazio ENTÃO erro narrativo", () => {
      const fs = makeFs({ body: "   \n\n   " });
      expect(() => new OpenIntegrationPR(fs, new FakeStackOps()).plan()).toThrow(
        /Body file.*está vazio/
      );
    });

    it("DADO branch null (HEAD detached) ENTÃO erro de detecção de spec citando HEAD detached", () => {
      // DetectActiveSpec roda primeiro e captura branch null; OpenIntegrationPR
      // propaga o reason. Esperar mensagem de detecção, não a do head local.
      const fs = makeFs({ branch: undefined });
      fs.branch = null;
      expect(() => new OpenIntegrationPR(fs, new FakeStackOps()).plan()).toThrow(
        /Não foi possível detectar spec ativa.*HEAD detached/
      );
    });

    it("DADO branch fora do padrão feat/spec-NNNN-* ENTÃO erro de detecção de spec", () => {
      const fs = new FakeFs({ branch: "main", dirs: new Set() });
      expect(() => new OpenIntegrationPR(fs, new FakeStackOps()).plan()).toThrow(
        /Não foi possível detectar spec ativa/
      );
    });
  });

  describe("execute", () => {
    it("DADO plan válido ENTÃO chama StackOps.createPullRequest com inputs do plan E retorna PR criado", () => {
      const fs = makeFs();
      const stack = new FakeStackOps();
      const useCase = new OpenIntegrationPR(fs, stack);
      const plan = useCase.plan();
      const pr = useCase.execute(plan);

      expect(stack.createdPRs).toHaveLength(1);
      expect(stack.createdPRs[0].title).toBe(plan.title);
      expect(stack.createdPRs[0].body).toBe(plan.body);
      expect(stack.createdPRs[0].base).toBe("main");
      expect(stack.createdPRs[0].head).toBe("feat/spec-0023-dx-thinking");
      expect(stack.createdPRs[0].draft).toBe(true);
      expect(pr.number).toBe(26);
      expect(pr.url).toBe("https://github.com/test/repo/pull/26");
    });
  });
});
