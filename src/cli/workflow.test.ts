import { WorkflowState } from "../domain/workflow/WorkflowState.js";
import { WorkflowFileSystem } from "../app/ports/WorkflowFileSystem.js";
import { ListActiveSpecsResult } from "../app/workflow/ListActiveSpecs.js";
import {
  ClipboardWriter,
  InputReader,
  Logger,
  buildContextBundle,
  buildMenu,
  classifyInput,
  renderActiveSpecsIndex,
  runContinue,
  runWorkflow,
} from "./workflow.js";

class CollectingLogger implements Logger {
  readonly lines: string[] = [];
  info(msg: string): void {
    this.lines.push(msg);
  }
  error(msg: string): void {
    this.lines.push(`ERR: ${msg}`);
  }
}

class ScriptedReader implements InputReader {
  private idx = 0;
  closed = false;
  constructor(private readonly answers: ReadonlyArray<string>) {}
  question(): Promise<string> {
    const answer = this.answers[this.idx++];
    if (answer === undefined) return Promise.resolve("q");
    return Promise.resolve(answer);
  }
  close(): void {
    this.closed = true;
  }
}

class FakeClipboard implements ClipboardWriter {
  copied: string | null = null;
  async copy(text: string): Promise<boolean> {
    this.copied = text;
    return true;
  }
}

class StubFs implements WorkflowFileSystem {
  constructor(
    private readonly files: Map<string, string>,
    private readonly dirs: Set<string>,
    private readonly branch: string | null
  ) {}
  fileExists(p: string): boolean {
    return this.files.has(p);
  }
  directoryExists(p: string): boolean {
    return this.dirs.has(p);
  }
  readTextFile(p: string): string {
    const f = this.files.get(p);
    if (f === undefined) throw new Error(`missing ${p}`);
    return f;
  }
  writeTextFile(): void {
    throw new Error("not used");
  }
  listDirectory(): ReadonlyArray<string> {
    return [];
  }
  currentBranch(): string | null {
    return this.branch;
  }
  resolveAbsolute(p: string): string {
    return `/repo/${p}`;
  }
}

const sampleSpec = `# Spec 0023 — Workflow Runtime

> Status: Draft (Stage B)

Conteúdo.
`;
const sampleState = `stage: implementation
gate:
  status: closed
focus:
  - workflow-runtime
next:
  - executar PR1
`;

function makeFsWithSpec(): StubFs {
  return new StubFs(
    new Map([
      [".governance/specs/0023-workflow-runtime/spec.md", sampleSpec],
      [".governance/specs/0023-workflow-runtime/state.yml", sampleState],
    ]),
    new Set([".governance/specs/0023-workflow-runtime"]),
    "feat/spec-0023-workflow-runtime"
  );
}

describe("CLI — workflow [BR-WORKFLOW-CLI]", () => {
  describe("classifyInput", () => {
    it("DADO input vazio ENTÃO trata como 'briefing'", () => {
      expect(classifyInput("")).toEqual({ kind: "structured", name: "briefing" });
    });

    it("DADO 'q' ENTÃO retorna menu key q", () => {
      expect(classifyInput("q")).toEqual({ kind: "menu", key: "q" });
    });

    it("DADO número ENTÃO retorna menu key", () => {
      expect(classifyInput("3")).toEqual({ kind: "menu", key: "3" });
    });

    it("DADO 'briefing' ou 'quit' ENTÃO classifica como structured", () => {
      expect(classifyInput("briefing")).toEqual({ kind: "structured", name: "briefing" });
      expect(classifyInput("quit")).toEqual({ kind: "structured", name: "quit" });
      expect(classifyInput("exit")).toEqual({ kind: "structured", name: "quit" });
    });

    it("DADO texto livre ENTÃO classifica como free-text", () => {
      expect(classifyInput("acho que estamos overengineering")).toEqual({
        kind: "free-text",
        text: "acho que estamos overengineering",
      });
    });
  });

  describe("buildMenu", () => {
    it("DADO gate fechado ENTÃO não inclui opção 'mostrar critérios para fechar'", () => {
      const state: WorkflowState = {
        stage: "implementation",
        gate: { status: "closed" },
        focus: [],
        next: ["x"],
      };
      const menu = buildMenu(state);
      expect(menu.find((m) => m.key === "3")).toBeUndefined();
    });

    it("DADO gate aberto ENTÃO inclui opção 'mostrar critérios para fechar'", () => {
      const state: WorkflowState = {
        stage: "discovery",
        gate: { status: "open" },
        focus: [],
        next: [],
      };
      const menu = buildMenu(state);
      expect(menu.find((m) => m.key === "3")).toBeDefined();
    });

    it("DADO state.next vazio ENTÃO não oferece 'executar próxima ação'", () => {
      const state: WorkflowState = {
        stage: "discovery",
        gate: { status: "open" },
        focus: [],
        next: [],
      };
      const menu = buildMenu(state);
      expect(menu.find((m) => m.key === "4")).toBeUndefined();
    });
  });

  describe("buildContextBundle", () => {
    it("DADO pergunta em texto livre ENTÃO produz bundle com contexto + pergunta", () => {
      const bundle = buildContextBundle(
        {
          location: {
            slug: "0023-workflow-runtime",
            absolutePath: "/repo/.governance/specs/0023-workflow-runtime",
            source: "governance",
          },
          state: {
            stage: "decision",
            gate: { status: "awaiting-review" },
            focus: ["x"],
            next: ["y"],
          },
          defaulted: false,
          headers: { title: "Workflow Runtime", status: null, openHypotheses: [], blockers: [] },
        },
        "acho que estamos overengineering"
      );
      expect(bundle).toMatch(/Spec: 0023-workflow-runtime/);
      expect(bundle).toMatch(/Stage: decision/);
      expect(bundle).toMatch(/Pergunta: acho que estamos overengineering/);
    });
  });

  describe("runWorkflow", () => {
    it("DADO spec detectada e usuário escolhe sair ENTÃO retorna 0", async () => {
      const logger = new CollectingLogger();
      const reader = new ScriptedReader(["q"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        reader,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(0);
      expect(reader.closed).toBe(true);
      expect(logger.lines.join("\n")).toMatch(/Spec: 0023-workflow-runtime/);
    });

    it("DADO texto livre digitado ENTÃO gera context bundle e copia para clipboard", async () => {
      const logger = new CollectingLogger();
      const reader = new ScriptedReader(["acho que estamos overengineering", "q"]);
      const clip = new FakeClipboard();
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        reader,
        clipboard: clip,
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(0);
      expect(clip.copied).not.toBeNull();
      expect(clip.copied!).toMatch(/Pergunta: acho que estamos overengineering/);
    });

    it("DADO branch fora do padrão ENTÃO retorna 1 com mensagem de erro", async () => {
      const logger = new CollectingLogger();
      const reader = new ScriptedReader([]);
      const fs = new StubFs(new Map(), new Set(), "main");
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        reader,
        clipboard: new FakeClipboard(),
        fs,
      });
      expect(code).toBe(1);
      expect(logger.lines.some((l) => l.startsWith("ERR:"))).toBe(true);
    });
  });

  describe("runContinue", () => {
    it("DADO spec detectada com state.next ENTÃO imprime briefing + próxima ação", async () => {
      const logger = new CollectingLogger();
      const code = await runContinue({
        repoRoot: "/repo",
        logger,
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(0);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/Stage: implementation/);
      expect(out).toMatch(/Próxima ação: executar PR1/);
    });

    it("DADO spec não detectada ENTÃO retorna 1", async () => {
      const logger = new CollectingLogger();
      const code = await runContinue({
        repoRoot: "/repo",
        logger,
        fs: new StubFs(new Map(), new Set(), null),
      });
      expect(code).toBe(1);
    });
  });

  describe("renderActiveSpecsIndex — helper puro (lookup-only, sem coordination)", () => {
    const emptyResult: ListActiveSpecsResult = {
      indexAvailable: true,
      entries: [],
      warnings: [],
    };
    const absentResult: ListActiveSpecsResult = {
      indexAvailable: false,
      entries: [],
      warnings: ["Index not found. Run yarn workflow publish-state to populate."],
    };
    const oneEntryResult: ListActiveSpecsResult = {
      indexAvailable: true,
      entries: [
        {
          entry: {
            id: "0023",
            slug: "workflow-runtime",
            branch: "feat/spec-0023-runtime-active-state",
            stage: "implementation",
            status: "active",
            specPath: ".governance/specs/0023-workflow-runtime",
            updatedAt: "2026-05-21T00:00:00Z",
          },
          specPathExists: true,
        },
      ],
      warnings: [],
    };

    it("DADO indexAvailable=false E showWhenAbsent default(false) QUANDO renderActiveSpecsIndex ENTÃO retorna lista vazia (silencioso no bootstrap)", () => {
      expect(renderActiveSpecsIndex(absentResult)).toEqual([]);
    });

    it("DADO indexAvailable=false E showWhenAbsent=true QUANDO renderActiveSpecsIndex ENTÃO retorna heading + warning informativo", () => {
      const lines = renderActiveSpecsIndex(absentResult, undefined, { showWhenAbsent: true });
      expect(lines.join("\n")).toMatch(/Índice operacional público/);
      expect(lines.join("\n")).toMatch(/publish-state/);
    });

    it("DADO indexAvailable=true E entries vazio QUANDO renderActiveSpecsIndex ENTÃO retorna lista vazia (sem heading inútil)", () => {
      expect(renderActiveSpecsIndex(emptyResult)).toEqual([]);
    });

    it("DADO 1 entry E currentSlug ausente QUANDO renderActiveSpecsIndex ENTÃO loga linha sem marca de spec corrente", () => {
      const lines = renderActiveSpecsIndex(oneEntryResult);
      const out = lines.join("\n");
      expect(out).toMatch(/Specs ativas no índice público/);
      expect(out).toMatch(/workflow-runtime/);
      expect(out).toMatch(/implementation\/active/);
      expect(out).toMatch(/feat\/spec-0023-runtime-active-state/);
      // sem asterisco quando currentSlug é undefined
      expect(out).not.toMatch(/\* ✓ workflow-runtime/);
    });

    it("DADO entry cujo slug === currentSlug QUANDO renderActiveSpecsIndex ENTÃO marca a entry corrente com '*'", () => {
      const lines = renderActiveSpecsIndex(oneEntryResult, "workflow-runtime");
      expect(lines.join("\n")).toMatch(/\* ✓ workflow-runtime/);
    });

    it("DADO entry com specPathExists=false QUANDO renderActiveSpecsIndex ENTÃO mostra '✗' E loga linha de drift narrativa", () => {
      const driftResult: ListActiveSpecsResult = {
        indexAvailable: true,
        entries: [
          {
            entry: oneEntryResult.entries[0].entry,
            specPathExists: false,
          },
        ],
        warnings: [
          `Spec "workflow-runtime" declares spec_path "${oneEntryResult.entries[0].entry.specPath}" in the index, but the directory is missing locally.`,
        ],
      };
      const out = renderActiveSpecsIndex(driftResult).join("\n");
      expect(out).toMatch(/✗ workflow-runtime/);
      expect(out).toMatch(/\(drift\) Spec "workflow-runtime"/);
    });
  });

  describe("runWorkflow + índice operacional público", () => {
    const indexWithCurrent: ListActiveSpecsResult = {
      indexAvailable: true,
      entries: [
        {
          entry: {
            id: "0023",
            slug: "0023-workflow-runtime",
            branch: "feat/spec-0023-workflow-runtime",
            stage: "implementation",
            status: "active",
            specPath: ".governance/specs/0023-workflow-runtime",
            updatedAt: "2026-05-21T00:00:00Z",
          },
          specPathExists: true,
        },
      ],
      warnings: [],
    };

    it("DADO spec local detectada E índice presente com a mesma spec QUANDO runWorkflow ENTÃO loga briefing + seção do índice marcando spec corrente com '*'", async () => {
      const logger = new CollectingLogger();
      const reader = new ScriptedReader(["q"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        reader,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
        loadActiveSpecsIndex: () => indexWithCurrent,
      });
      const out = logger.lines.join("\n");
      expect(code).toBe(0);
      expect(out).toMatch(/Spec: 0023-workflow-runtime/);
      expect(out).toMatch(/Specs ativas no índice público/);
      expect(out).toMatch(/\* ✓ 0023-workflow-runtime/);
    });

    it("DADO spec local detectada E índice ausente QUANDO runWorkflow ENTÃO loga briefing sem seção de índice (silencioso quando branch já orienta)", async () => {
      const logger = new CollectingLogger();
      const reader = new ScriptedReader(["q"]);
      const absent: ListActiveSpecsResult = {
        indexAvailable: false,
        entries: [],
        warnings: ["not found"],
      };
      await runWorkflow({
        repoRoot: "/repo",
        logger,
        reader,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
        loadActiveSpecsIndex: () => absent,
      });
      const out = logger.lines.join("\n");
      expect(out).not.toMatch(/Índice operacional público/);
      expect(out).not.toMatch(/Specs ativas no índice público/);
    });

    it("DADO branch fora do padrão E índice presente com 1 entry QUANDO runWorkflow ENTÃO erro + seção do índice exibida + retorna 1", async () => {
      const logger = new CollectingLogger();
      const reader = new ScriptedReader([]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        reader,
        clipboard: new FakeClipboard(),
        fs: new StubFs(new Map(), new Set(), "main"),
        loadActiveSpecsIndex: () => indexWithCurrent,
      });
      const out = logger.lines.join("\n");
      expect(code).toBe(1);
      expect(logger.lines.some((l) => l.startsWith("ERR:"))).toBe(true);
      expect(out).toMatch(/Specs ativas no índice público/);
      expect(out).toMatch(/0023-workflow-runtime/);
    });

    it("DADO branch fora do padrão E índice ausente QUANDO runWorkflow ENTÃO erro + heading com aviso de publish-state + retorna 1", async () => {
      const logger = new CollectingLogger();
      const reader = new ScriptedReader([]);
      const absent: ListActiveSpecsResult = {
        indexAvailable: false,
        entries: [],
        warnings: ["Index not found. Run yarn workflow publish-state to populate."],
      };
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        reader,
        clipboard: new FakeClipboard(),
        fs: new StubFs(new Map(), new Set(), "main"),
        loadActiveSpecsIndex: () => absent,
      });
      expect(code).toBe(1);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/Índice operacional público/);
      expect(out).toMatch(/publish-state/);
    });

    it("DADO runContinue (atalho) QUANDO há índice com entries ENTÃO NÃO loga seção do índice (atalho focado, lookup cross-spec fica para Passo 4)", async () => {
      const logger = new CollectingLogger();
      await runContinue({
        repoRoot: "/repo",
        logger,
        fs: makeFsWithSpec(),
        // mesmo se passado, runContinue não invoca (não usa essa opção)
        loadActiveSpecsIndex: () => indexWithCurrent,
      });
      const out = logger.lines.join("\n");
      expect(out).not.toMatch(/Specs ativas no índice público/);
    });
  });
});
