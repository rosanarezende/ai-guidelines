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
  findActiveSpecByIdentifier,
  main,
  renderActiveSpecsIndex,
  runContinue,
  runPublishState,
  runWorkflow,
} from "./workflow.js";
import { PublishState } from "../app/workflow/PublishState.js";
import {
  parseActiveSpecs,
  stringifyActiveSpecs,
} from "../infrastructure/yaml/activeSpecsSerializer.js";
import { parseWorkflowState } from "../infrastructure/yaml/workflowStateSerializer.js";

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

    it("DADO currentSlug no formato id-slug (nome do diretório de DetectActiveSpec) QUANDO renderActiveSpecsIndex ENTÃO marca corrente — match tri-form (descoberta operacional Passo 7)", () => {
      // ctx.location.slug = "0023-workflow-runtime" (formato do diretório);
      // entry.slug do índice = "workflow-runtime" (formato editorial).
      // Match deve aceitar ambos para que a spec corrente seja sinalizada
      // corretamente quando o REPL roda na branch dela.
      const lines = renderActiveSpecsIndex(oneEntryResult, "0023-workflow-runtime");
      expect(lines.join("\n")).toMatch(/\* ✓ workflow-runtime/);
    });

    it("DADO currentSlug = id puro QUANDO renderActiveSpecsIndex ENTÃO marca corrente — match tri-form", () => {
      const lines = renderActiveSpecsIndex(oneEntryResult, "0023");
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

    it("DADO runContinue sem identifier QUANDO há índice com entries ENTÃO NÃO loga seção do índice (atalho focado na spec corrente)", async () => {
      const logger = new CollectingLogger();
      await runContinue({
        repoRoot: "/repo",
        logger,
        fs: makeFsWithSpec(),
        // mesmo se passado, runContinue sem identifier não consulta o índice
        loadActiveSpecsIndex: () => indexWithCurrent,
      });
      const out = logger.lines.join("\n");
      expect(out).not.toMatch(/Specs ativas no índice público/);
    });
  });

  describe("findActiveSpecByIdentifier — match exato em id | slug | id-slug", () => {
    const entries = [
      {
        entry: {
          id: "0023",
          slug: "workflow-runtime",
          branch: "feat/spec-0023-runtime-active-state",
          stage: "implementation" as const,
          status: "active" as const,
          specPath: ".governance/specs/0023-workflow-runtime",
          updatedAt: "2026-05-21T00:00:00Z",
        },
        specPathExists: true,
      },
      {
        entry: {
          id: "0099",
          slug: "foo-bar",
          branch: "feat/spec-0099-foo-bar",
          stage: "discovery" as const,
          status: "paused" as const,
          specPath: ".governance/specs/0099-foo-bar",
          updatedAt: "2026-05-01T00:00:00Z",
        },
        specPathExists: false,
      },
    ];

    it("DADO identifier = id puro QUANDO findActiveSpecByIdentifier ENTÃO retorna a entry correspondente", () => {
      expect(findActiveSpecByIdentifier(entries, "0023")?.entry.slug).toBe("workflow-runtime");
      expect(findActiveSpecByIdentifier(entries, "0099")?.entry.slug).toBe("foo-bar");
    });

    it("DADO identifier = slug puro QUANDO findActiveSpecByIdentifier ENTÃO retorna a entry correspondente", () => {
      expect(findActiveSpecByIdentifier(entries, "workflow-runtime")?.entry.id).toBe("0023");
    });

    it("DADO identifier = id-slug (formato de diretório) QUANDO findActiveSpecByIdentifier ENTÃO retorna a entry correspondente", () => {
      expect(findActiveSpecByIdentifier(entries, "0023-workflow-runtime")?.entry.id).toBe("0023");
    });

    it("DADO identifier que não casa QUANDO findActiveSpecByIdentifier ENTÃO retorna null (sem fuzzy)", () => {
      expect(findActiveSpecByIdentifier(entries, "workflow")).toBeNull();
      expect(findActiveSpecByIdentifier(entries, "WORKFLOW-RUNTIME")).toBeNull();
      expect(findActiveSpecByIdentifier(entries, "23")).toBeNull();
      expect(findActiveSpecByIdentifier([], "0023")).toBeNull();
    });
  });

  describe("runContinue + identifier (lookup via índice, sem auto-checkout)", () => {
    function makeIndexResult(
      opts: {
        indexAvailable?: boolean;
        entries?: ListActiveSpecsResult["entries"];
        warnings?: ListActiveSpecsResult["warnings"];
      } = {}
    ): ListActiveSpecsResult {
      return {
        indexAvailable: opts.indexAvailable ?? true,
        entries: opts.entries ?? [],
        warnings: opts.warnings ?? [],
      };
    }

    const reachableEntry = {
      entry: {
        id: "0023",
        slug: "workflow-runtime",
        branch: "feat/spec-0023-runtime-active-state",
        stage: "implementation" as const,
        status: "active" as const,
        specPath: ".governance/specs/0023-workflow-runtime",
        updatedAt: "2026-05-21T00:00:00Z",
      },
      specPathExists: true,
    };

    const unreachableEntry = {
      ...reachableEntry,
      specPathExists: false,
    };

    it("DADO identifier que casa entry com spec_path existente QUANDO runContinue ENTÃO loga briefing E próxima ação da spec encontrada", async () => {
      const logger = new CollectingLogger();
      const code = await runContinue(
        {
          repoRoot: "/repo",
          logger,
          fs: makeFsWithSpec(),
          loadActiveSpecsIndex: () => makeIndexResult({ entries: [reachableEntry] }),
        },
        "workflow-runtime"
      );
      expect(code).toBe(0);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/Stage: implementation/);
      expect(out).toMatch(/Próxima ação: executar PR1/);
    });

    it("DADO identifier que casa entry mas spec_path NÃO existe localmente QUANDO runContinue ENTÃO erro instrutivo com git checkout + retorna 1 (sem auto-checkout)", async () => {
      const logger = new CollectingLogger();
      const code = await runContinue(
        {
          repoRoot: "/repo",
          logger,
          fs: new StubFs(new Map(), new Set(), null),
          loadActiveSpecsIndex: () => makeIndexResult({ entries: [unreachableEntry] }),
        },
        "0023"
      );
      expect(code).toBe(1);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/diretório não existe localmente/);
      expect(out).toMatch(/git fetch origin && git checkout feat\/spec-0023-runtime-active-state/);
    });

    it("DADO identifier que NÃO casa nenhuma entry QUANDO runContinue ENTÃO erro listando specs disponíveis + retorna 1", async () => {
      const logger = new CollectingLogger();
      const code = await runContinue(
        {
          repoRoot: "/repo",
          logger,
          fs: new StubFs(new Map(), new Set(), null),
          loadActiveSpecsIndex: () => makeIndexResult({ entries: [reachableEntry] }),
        },
        "ghost"
      );
      expect(code).toBe(1);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/Spec "ghost" não encontrada/);
      expect(out).toMatch(/Specs disponíveis no índice/);
      expect(out).toMatch(/0023 \/ workflow-runtime/);
    });

    it("DADO identifier presente E índice ausente QUANDO runContinue ENTÃO erro com aviso de publish-state + retorna 1", async () => {
      const logger = new CollectingLogger();
      const code = await runContinue(
        {
          repoRoot: "/repo",
          logger,
          fs: new StubFs(new Map(), new Set(), null),
          loadActiveSpecsIndex: () =>
            makeIndexResult({
              indexAvailable: false,
              warnings: ["Index not found."],
            }),
        },
        "0023"
      );
      expect(code).toBe(1);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/Índice operacional público.*não encontrado/);
      expect(out).toMatch(/yarn workflow publish-state/);
    });

    it("DADO main(['continue', '<identifier>'], opts) QUANDO entry casa E path existe ENTÃO encaminha identifier para runContinue (lookup via índice)", async () => {
      const logger = new CollectingLogger();
      const code = await main(["continue", "0023"], {
        repoRoot: "/repo",
        logger,
        fs: makeFsWithSpec(),
        loadActiveSpecsIndex: () => makeIndexResult({ entries: [reachableEntry] }),
      });
      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/Stage: implementation/);
    });

    it("DADO main(['continue'], opts) sem identifier QUANDO branch detecta spec ENTÃO mantém comportamento legado (detecção via branch)", async () => {
      const logger = new CollectingLogger();
      const code = await main(["continue"], {
        repoRoot: "/repo",
        logger,
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/Próxima ação: executar PR1/);
    });
  });

  describe("runPublishState — CLI wrapper do PublishState use case", () => {
    class WritableFakeFs implements WorkflowFileSystem {
      files: Map<string, string>;
      dirs: Set<string>;
      branch: string | null;
      constructor(files: Map<string, string>, dirs: Set<string>, branch: string | null) {
        this.files = new Map(files);
        this.dirs = new Set(dirs);
        this.branch = branch;
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
      writeTextFile(p: string, contents: string): void {
        this.files.set(p, contents);
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

    function makeWritableFs(): WritableFakeFs {
      return new WritableFakeFs(
        new Map([
          [
            ".governance/specs/0023-workflow-runtime/state.yml",
            `stage: implementation\ngate:\n  status: closed\nfocus: []\nnext: []\n`,
          ],
        ]),
        new Set([".governance/specs/0023-workflow-runtime"]),
        "feat/spec-0023-workflow-runtime"
      );
    }

    function buildPublishStateWithFixedNow(now: Date) {
      return (fs: WorkflowFileSystem) =>
        new PublishState(fs, parseActiveSpecs, stringifyActiveSpecs, parseWorkflowState, () => now);
    }

    it("DADO --status ausente QUANDO runPublishState ENTÃO erro narrativo citando [DEC-0023-G04] E retorna 1", async () => {
      const logger = new CollectingLogger();
      const code = await runPublishState(
        { repoRoot: "/repo", logger, fs: makeWritableFs() },
        { updatedBy: "@x" }
      );
      expect(code).toBe(1);
      expect(logger.lines.join("\n")).toMatch(/--status/);
      expect(logger.lines.join("\n")).toMatch(/\[DEC-0023-G04\]/);
    });

    it("DADO --updated-by ausente QUANDO runPublishState ENTÃO erro narrativo distinguindo 'autorizou' E retorna 1", async () => {
      const logger = new CollectingLogger();
      const code = await runPublishState(
        { repoRoot: "/repo", logger, fs: makeWritableFs() },
        { status: "active" }
      );
      expect(code).toBe(1);
      expect(logger.lines.join("\n")).toMatch(/--updated-by/);
      expect(logger.lines.join("\n")).toMatch(/autorizou/i);
    });

    it("DADO args válidos QUANDO runPublishState ENTÃO escreve índice, loga confirmação E retorna 0", async () => {
      const logger = new CollectingLogger();
      const fs = makeWritableFs();
      const code = await runPublishState(
        {
          repoRoot: "/repo",
          logger,
          fs,
          buildPublishState: buildPublishStateWithFixedNow(new Date("2026-05-21T10:00:00Z")),
        },
        { status: "active", updatedBy: "@rosanarezende" }
      );
      expect(code).toBe(0);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/Spec 0023 \/ workflow-runtime publicada/);
      expect(out).toMatch(/stage=implementation/);
      expect(out).toMatch(/status=active/);
      expect(fs.fileExists(".governance/runtime/active-specs.yml")).toBe(true);
    });

    it("DADO publish já tem entry E args válidos QUANDO runPublishState ENTÃO loga 'atualizada' (não 'publicada')", async () => {
      const logger = new CollectingLogger();
      const fs = makeWritableFs();
      // primeiro publish para popular o índice
      await runPublishState(
        {
          repoRoot: "/repo",
          logger: new CollectingLogger(),
          fs,
          buildPublishState: buildPublishStateWithFixedNow(new Date("2026-05-21T10:00:00Z")),
        },
        { status: "active", updatedBy: "@x" }
      );
      // segundo publish — agora deve ser update
      await runPublishState(
        {
          repoRoot: "/repo",
          logger,
          fs,
          buildPublishState: buildPublishStateWithFixedNow(new Date("2026-05-21T11:00:00Z")),
        },
        { status: "blocked", updatedBy: "@x" }
      );
      expect(logger.lines.join("\n")).toMatch(/atualizada/);
    });

    it("DADO PublishStateError lançado pelo use case QUANDO runPublishState ENTÃO loga mensagem do erro E retorna 1 (sem stack trace)", async () => {
      const logger = new CollectingLogger();
      const fs = makeWritableFs();
      fs.branch = "main"; // DetectActiveSpec falha; fallback via índice também falha (índice ausente)
      const code = await runPublishState(
        { repoRoot: "/repo", logger, fs },
        { status: "active", updatedBy: "@x" }
      );
      expect(code).toBe(1);
      // pós-fallback: mensagem narrativa cita branch + ausência do índice
      expect(
        logger.lines.some((l) => l.startsWith("ERR:") && /Branch "main" não casa diretório/.test(l))
      ).toBe(true);
    });

    it("DADO main(['workflow', 'publish-state'], opts com publishStateArgs) QUANDO main ENTÃO encaminha para runPublishState", async () => {
      const logger = new CollectingLogger();
      const fs = makeWritableFs();
      const code = await main(["workflow", "publish-state"], {
        repoRoot: "/repo",
        logger,
        fs,
        buildPublishState: buildPublishStateWithFixedNow(new Date("2026-05-21T10:00:00Z")),
        publishStateArgs: { status: "active", updatedBy: "@rosanarezende" },
      } as Parameters<typeof main>[1]);
      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/publicada/);
    });
  });
});
