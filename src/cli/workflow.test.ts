import { WorkflowState } from "../domain/workflow/WorkflowState.js";
import { ClipboardWriter } from "../app/ports/ClipboardWriter.js";
import { ConfirmOptions, InputOptions, Prompts, SelectOptions } from "../app/ports/Prompts.js";
import { WorkflowFileSystem } from "../app/ports/WorkflowFileSystem.js";
import { ListActiveSpecsResult } from "../app/workflow/ListActiveSpecs.js";
import {
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

/**
 * Stub de `Prompts` para tests. Cada chamada (`select` / `input` / `confirm`)
 * consome a próxima resposta do array unificado. Aceita `string` (para
 * select/input) e `boolean` (para confirm); tipo é validado por consumidor
 * para detectar mismatch de script em test fail-fast.
 */
class FakePrompts implements Prompts {
  private idx = 0;
  constructor(private readonly answers: ReadonlyArray<string | boolean>) {}
  async select<T = string>(options: SelectOptions<T>): Promise<T> {
    const answer = this.answers[this.idx++];
    if (answer === undefined) {
      throw new Error(`FakePrompts: select sem resposta restante (message="${options.message}")`);
    }
    if (typeof answer !== "string") {
      throw new Error(
        `FakePrompts: select esperava string mas recebeu ${typeof answer} (message="${options.message}")`
      );
    }
    const choice = options.choices.find((c) => String(c.value) === answer);
    if (!choice) {
      throw new Error(
        `FakePrompts: nenhum choice match para "${answer}" em select "${options.message}". ` +
          `Choices disponíveis: ${options.choices.map((c) => c.value).join(", ")}`
      );
    }
    return choice.value;
  }
  async input(options: InputOptions): Promise<string> {
    const answer = this.answers[this.idx++];
    if (answer === undefined) {
      throw new Error(`FakePrompts: input sem resposta restante (message="${options.message}")`);
    }
    if (typeof answer !== "string") {
      throw new Error(`FakePrompts: input esperava string mas recebeu ${typeof answer}`);
    }
    return answer;
  }
  async confirm(options: ConfirmOptions): Promise<boolean> {
    const answer = this.answers[this.idx++];
    if (answer === undefined) {
      throw new Error(`FakePrompts: confirm sem resposta restante (message="${options.message}")`);
    }
    if (typeof answer !== "boolean") {
      throw new Error(
        `FakePrompts: confirm esperava boolean mas recebeu ${typeof answer} (message="${options.message}")`
      );
    }
    return answer;
  }
}

class FakeClipboard implements ClipboardWriter {
  copied: string | null = null;
  constructor(private readonly shouldCopy = true) {}
  async copy(text: string): Promise<boolean> {
    this.copied = text;
    return this.shouldCopy;
  }
}

/**
 * Auto-populate dirs Set with all ancestors of each entry, and derive
 * `listDirectory` listings from it. Mimics real filesystem semantics needed
 * by `DetectActiveSpec` (id-based lookup per [DEC-0023-I01]): given a dir
 * `.governance/specs/0023-workflow-runtime`, `directoryExists(".governance/specs")`
 * must be true and `listDirectory(".governance/specs")` must include
 * `0023-workflow-runtime`.
 */
function expandAncestors(dirs: Set<string>): Set<string> {
  const expanded = new Set<string>(dirs);
  for (const d of dirs) {
    const parts = d.split("/");
    for (let i = parts.length - 1; i > 0; i--) {
      const ancestor = parts.slice(0, i).join("/");
      if (ancestor) expanded.add(ancestor);
    }
  }
  return expanded;
}

function deriveListing(allDirs: Set<string>, path: string): ReadonlyArray<string> {
  const prefix = `${path}/`;
  const children = new Set<string>();
  for (const d of allDirs) {
    if (d.startsWith(prefix)) {
      const firstSeg = d.slice(prefix.length).split("/")[0];
      if (firstSeg) children.add(firstSeg);
    }
  }
  return [...children];
}

class StubFs implements WorkflowFileSystem {
  private readonly allDirs: Set<string>;

  constructor(
    private readonly files: Map<string, string>,
    dirs: Set<string>,
    private readonly branch: string | null
  ) {
    this.allDirs = expandAncestors(dirs);
  }
  fileExists(p: string): boolean {
    return this.files.has(p);
  }
  directoryExists(p: string): boolean {
    return this.allDirs.has(p);
  }
  readTextFile(p: string): string {
    const f = this.files.get(p);
    if (f === undefined) throw new Error(`missing ${p}`);
    return f;
  }
  writeTextFile(): void {
    throw new Error("not used");
  }
  listDirectory(p: string): ReadonlyArray<string> {
    return deriveListing(this.allDirs, p);
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

function makeFsWithSpecAndTasks(): StubFs {
  return new StubFs(
    new Map([
      [".governance/specs/0023-workflow-runtime/spec.md", sampleSpec],
      [".governance/specs/0023-workflow-runtime/state.yml", sampleState],
      [".governance/specs/0023-workflow-runtime/tasks.md", "# Tasks\n- [ ] tarefa 1"],
    ]),
    new Set([".governance/specs/0023-workflow-runtime"]),
    "feat/spec-0023-workflow-runtime"
  );
}

// review.md com TODOS os gates de readiness (R1–R8) fechados — permite que as
// opções 4 e 5 passem do gate determinístico (CheckIntegrationReadiness) para o plan.
const reviewAllClosed = [
  "# Review",
  "- [x] **R1** ok",
  "- [x] **R2** ok",
  "- [x] **R3** ok",
  "- [x] **R4** ok",
  "- [x] **R5** ok",
  "- [x] **R6** ok",
  "- [x] **R7** ok",
  "- [x] **R8** ok",
].join("\n");

function makeFsWithSpecReviewClosed(): StubFs {
  return new StubFs(
    new Map([
      [".governance/specs/0023-workflow-runtime/spec.md", sampleSpec],
      [".governance/specs/0023-workflow-runtime/state.yml", sampleState],
      [".governance/specs/0023-workflow-runtime/review.md", reviewAllClosed],
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
    it("DADO gate fechado ENTÃO inclui apenas uma opção de 'blockers' (omite a segunda variante)", () => {
      const state: WorkflowState = {
        stage: "implementation",
        gate: { status: "closed" },
        focus: [],
        next: ["x"],
      };
      const menu = buildMenu(state);
      const blockersItems = menu.filter((m) => m.action === "blockers");
      expect(blockersItems).toHaveLength(1);
    });

    it("DADO gate aberto ENTÃO inclui as duas variantes de 'blockers' (lacunas E critérios)", () => {
      const state: WorkflowState = {
        stage: "discovery",
        gate: { status: "open" },
        focus: [],
        next: [],
      };
      const menu = buildMenu(state);
      const blockersItems = menu.filter((m) => m.action === "blockers");
      expect(blockersItems).toHaveLength(2);
    });

    it("DADO state.next vazio ENTÃO não oferece ação 'execute-next'", () => {
      const state: WorkflowState = {
        stage: "discovery",
        gate: { status: "open" },
        focus: [],
        next: [],
      };
      const menu = buildMenu(state);
      expect(menu.find((m) => m.action === "execute-next")).toBeUndefined();
    });

    it("DADO gate fechado E state.next presente ENTÃO keys numéricas são sequenciais 1,2,3 sem gaps (regressão runtime 2026-05-23)", () => {
      // Bug observado em runtime: com gate=closed, menu exibia 1,2,4 (pulando
      // 3 porque key "3" era omitido literal). Fix: renumeração dinâmica
      // posicional. Inconsistência posicional destrói confiança operacional
      // do wizard — `key` agora é display puro, dispatch usa `action`.
      const state: WorkflowState = {
        stage: "implementation",
        gate: { status: "closed" },
        focus: [],
        next: ["fazer X"],
      };
      const menu = buildMenu(state);
      const numericKeys = menu.filter((m) => m.key !== "q").map((m) => m.key);
      expect(numericKeys).toEqual(["1", "2", "3"]);
    });

    it("DADO gate aberto E state.next presente ENTÃO keys numéricas sequenciais 1,2,3,4 (sanity check)", () => {
      const state: WorkflowState = {
        stage: "discovery",
        gate: { status: "open" },
        focus: [],
        next: ["fazer X"],
      };
      const menu = buildMenu(state);
      const numericKeys = menu.filter((m) => m.key !== "q").map((m) => m.key);
      expect(numericKeys).toEqual(["1", "2", "3", "4"]);
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
    it("DADO wizard opção 1 (continuar spec atual) E usuário escolhe sair no REPL ENTÃO retorna 0 com briefing emitido", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current", "q"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/Spec: 0023-workflow-runtime/);
    });

    it("DADO opção 1 com tasks.md 100% [x] + review.md R1–R7 [x] ENTÃO mostra Execution=complete / Integration=PASS / Closure=não iniciado", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current", "q"]);
      const fs = new StubFs(
        new Map([
          [".governance/specs/0023-workflow-runtime/spec.md", sampleSpec],
          [".governance/specs/0023-workflow-runtime/state.yml", sampleState],
          [".governance/specs/0023-workflow-runtime/tasks.md", "# Tasks\n- [x] **1.1** feito"],
          [".governance/specs/0023-workflow-runtime/review.md", reviewAllClosed],
        ]),
        new Set([".governance/specs/0023-workflow-runtime"]),
        "feat/spec-0023-workflow-runtime"
      );
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs,
      });
      const out = logger.lines.join("\n");
      expect(code).toBe(0);
      expect(out).toMatch(/Boundaries da spec:/);
      expect(out).toMatch(/Execution \(tasks\.md\): +complete/);
      expect(out).toMatch(/Integration readiness \(review\): +PASS/);
      expect(out).toMatch(/Release log \(release-log\.md\): +não iniciado/);
    });

    it("DADO opção 1 com tasks.md aberto + review.md ausente ENTÃO mostra Execution=in progress / Integration=BLOCKED", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current", "q"]);
      const fs = new StubFs(
        new Map([
          [".governance/specs/0023-workflow-runtime/spec.md", sampleSpec],
          [".governance/specs/0023-workflow-runtime/state.yml", sampleState],
          [
            ".governance/specs/0023-workflow-runtime/tasks.md",
            "# Tasks\n- [x] **1.1** feito\n- [ ] **1.2** pendente",
          ],
        ]),
        new Set([".governance/specs/0023-workflow-runtime"]),
        "feat/spec-0023-workflow-runtime"
      );
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs,
      });
      const out = logger.lines.join("\n");
      expect(code).toBe(0);
      expect(out).toMatch(/Execution \(tasks\.md\): +in progress \(1 aberto\(s\)\)/);
      expect(out).toMatch(/Integration readiness \(review\): +BLOCKED — review\.md ausente/);
    });

    it("DADO wizard opção 1 + texto livre digitado ENTÃO gera contexto da spec e copia para clipboard", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts([
        "continue-current",
        "acho que estamos overengineering",
        "q",
      ]);
      const clip = new FakeClipboard();
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: clip,
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(0);
      expect(clip.copied).not.toBeNull();
      expect(clip.copied!).toMatch(/Pergunta: acho que estamos overengineering/);
    });

    it("DADO wizard opção 1 mas branch fora do padrão ENTÃO retorna 1 com mensagem de erro", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current"]);
      const fs = new StubFs(new Map(), new Set(), "main");
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs,
      });
      expect(code).toBe(1);
      expect(logger.lines.some((l) => l.startsWith("ERR:"))).toBe(true);
    });

    // ─── REPL menu dispatch coverage (action-based per Item 7.5) ───
    // Tests cobrem o switch (item.action) em runReplOnce — os cases
    // "briefing"/"blockers"/"execute-next" foram impactados pela
    // refatoração de keys posicionais (separação key ↔ action) e
    // precisam cobertura proporcional. Cases "quit" e dispatch
    // posicional via diferentes keys já são exercitados por outros
    // testes do describe e por buildMenu.

    it("DADO REPL menu input '1' (briefing) ENTÃO chama assembleBriefing novamente — case 'briefing'", async () => {
      const logger = new CollectingLogger();
      // ["continue-current", "1", "q"] → wizard → REPL briefing → quit
      const prompts = new FakePrompts(["continue-current", "1", "q"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(0);
      // Briefing aparece ≥ 2x: na entrada do REPL + ao acionar menu "1".
      const briefingHits = logger.lines.filter((l) => /Spec: 0023-workflow-runtime/.test(l));
      expect(briefingHits.length).toBeGreaterThanOrEqual(2);
    });

    it("DADO REPL menu input '2' (blockers) E research.md ausente ENTÃO mensagem 'nenhum blocker extraído' — case 'blockers' (vazio)", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current", "2", "q"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(), // sem research.md → headers.blockers vazio
      });
      expect(code).toBe(0);
      expect(logger.lines.some((l) => l.includes("nenhum blocker extraído"))).toBe(true);
    });

    it("DADO REPL menu input '2' (blockers) E research.md COM seção §8 ENTÃO loga 'Lacunas/blockers do gate:' + bullets — case 'blockers' (não-vazio)", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current", "2", "q"]);
      // research.md no formato esperado por extractBlockers
      // (regex `### 8.\d+ Lacunas?` + bullets `- **...** `).
      const sampleResearch = `# Research — Spec 0023

## 8. Lacunas

### 8.1 Lacunas operacionais

- **Bloqueador A**: descrição do bloqueador A
- **Bloqueador B**: descrição do bloqueador B
`;
      const fs = new StubFs(
        new Map([
          [".governance/specs/0023-workflow-runtime/spec.md", sampleSpec],
          [".governance/specs/0023-workflow-runtime/state.yml", sampleState],
          [".governance/specs/0023-workflow-runtime/research.md", sampleResearch],
        ]),
        new Set([".governance/specs/0023-workflow-runtime"]),
        "feat/spec-0023-workflow-runtime"
      );
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs,
      });
      expect(code).toBe(0);
      expect(logger.lines.some((l) => l.includes("Lacunas/blockers do gate:"))).toBe(true);
      expect(logger.lines.some((l) => l.includes("Bloqueador A"))).toBe(true);
      expect(logger.lines.some((l) => l.includes("Bloqueador B"))).toBe(true);
    });

    it("DADO REPL menu input '3' (execute-next; gate fechado + state.next presente) ENTÃO loga 'Próxima ação registrada' + nota execução manual — case 'execute-next'", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current", "3", "q"]);
      // sampleState tem gate.status='closed' E state.next=['executar PR1']
      // → menu posicional: 1=briefing, 2=blockers, 3=execute-next, q=quit
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(0);
      expect(logger.lines.some((l) => l.includes("Próxima ação registrada: executar PR1"))).toBe(
        true
      );
      expect(logger.lines.some((l) => l.includes("execução automática não está no escopo"))).toBe(
        true
      );
    });

    it("DADO structured command 'gate' digitado no REPL ENTÃO mostra o status atual do gate", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current", "gate", "q"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });

      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/Gate atual: closed/);
    });

    it("DADO structured command 'next' digitado no REPL ENTÃO lista state.next sem executar ação", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current", "next", "q"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });

      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/executar PR1/);
    });

    it("DADO structured command 'gaps' digitado no REPL E sem blockers ENTÃO mostra mensagem vazia enxuta", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current", "gaps", "q"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });

      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/nenhum blocker extraído/);
    });

    it("DADO structured command 'quit' digitado no REPL ENTÃO encerra o loop com exit 0", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current", "quit"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });

      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/Ações:/);
    });

    it("DADO wizard opção q (sair) no boot ENTÃO retorna 0 sem invocar briefing nem REPL", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["quit"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(0);
      // Quit no wizard NÃO deve disparar briefing nem REPL.
      expect(logger.lines.join("\n")).not.toMatch(/Spec: 0023-workflow-runtime/);
      // Inquirer renderiza o menu direto no stdout/TTY (não via logger),
      // então não asseguramos texto "Wizard operacional" no logger — apenas
      // a ausência de side-effects pós-quit.
    });

    it("DADO wizard opção 2 MAS identificador vazio ENTÃO encerra com mensagem honesta e retorna 0", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-other", ""]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });

      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/Identificador vazio — encerrando wizard/);
    });

    it("DADO wizard lança exceção QUANDO runWorkflow captura ENTÃO retorna 1 com erro narrativo", async () => {
      const logger = new CollectingLogger();
      const prompts: Prompts = {
        async select() {
          throw new Error("prompt abortado");
        },
        async input() {
          return "";
        },
        async confirm() {
          return false;
        },
      };

      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });

      expect(code).toBe(1);
      expect(logger.lines.join("\n")).toMatch(/Wizard interrompido: prompt abortado/);
    });

    it("DADO wizard opção 3 (publish-state help) ENTÃO emite instruções e retorna 0", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["publish-state-help"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/publish-state --status=/);
    });

    // NOTA: o teste antigo "opção desconhecida no wizard" foi removido após migração para
    // inquirer/select — agora é impossível digitar opção fora da lista (inquirer restringe
    // navegação às choices declaradas).

    // ─── Wizard options 4 e 5: tier 2 transactional (cf. [DEC-0023-L01]) ───
    // Estes options têm side-effects via StackOps. Tests usam FakeStackOps
    // injetado via `options.stack` para registrar chamadas sem invocar `gh`.

    it("DADO wizard opção 4 (open-integration-pr) + integration-pr.md presente + confirmação ENTÃO chama StackOps.createPullRequest e loga URL do PR", async () => {
      const logger = new CollectingLogger();
      // ["open-integration-pr", true] = wizard select + confirm "y"
      const prompts = new FakePrompts(["open-integration-pr", true]);
      const fs = new StubFs(
        new Map([
          [".governance/specs/0023-workflow-runtime/spec.md", sampleSpec],
          [".governance/specs/0023-workflow-runtime/state.yml", sampleState],
          [".governance/specs/0023-workflow-runtime/review.md", reviewAllClosed],
          [
            ".governance/specs/0023-workflow-runtime/integration-pr.md",
            "## Integration PR\n\nHomologação da stack.",
          ],
        ]),
        new Set([".governance/specs/0023-workflow-runtime"]),
        "feat/spec-0023-workflow-runtime"
      );
      const stack: import("../app/ports/StackOps.js").StackOps = {
        createPullRequest: jest.fn().mockReturnValue({
          number: 99,
          title: "irrelevant",
          body: "",
          state: "OPEN" as const,
          isDraft: true,
          headRefName: "feat/spec-0023-workflow-runtime",
          baseRefName: "main",
          labels: [],
          url: "https://github.com/test/repo/pull/99",
          mergeCommitSha: null,
        }),
        getPullRequest: jest.fn().mockReturnValue(null),
        editPullRequestBase: jest.fn(),
        listReviewComments: jest.fn().mockReturnValue([]),
        mergePullRequest: jest.fn(),
        closePullRequest: jest.fn(),
        listOpenPullRequests: jest.fn().mockReturnValue([]),
      };
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs,
        stack,
      });
      expect(code).toBe(0);
      expect(stack.createPullRequest).toHaveBeenCalledTimes(1);
      expect(logger.lines.join("\n")).toMatch(
        /PR #99 aberto: https:\/\/github\.com\/test\/repo\/pull\/99/
      );
    });

    it("DADO wizard opção 4 + negação da confirmação ENTÃO NÃO chama createPullRequest e loga cancelamento", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["open-integration-pr", false]);
      const fs = new StubFs(
        new Map([
          [".governance/specs/0023-workflow-runtime/spec.md", sampleSpec],
          [".governance/specs/0023-workflow-runtime/state.yml", sampleState],
          [".governance/specs/0023-workflow-runtime/review.md", reviewAllClosed],
          [
            ".governance/specs/0023-workflow-runtime/integration-pr.md",
            "## Integration PR\n\nbody",
          ],
        ]),
        new Set([".governance/specs/0023-workflow-runtime"]),
        "feat/spec-0023-workflow-runtime"
      );
      const stack: import("../app/ports/StackOps.js").StackOps = {
        createPullRequest: jest.fn(),
        getPullRequest: jest.fn(),
        editPullRequestBase: jest.fn(),
        listReviewComments: jest.fn().mockReturnValue([]),
        mergePullRequest: jest.fn(),
        closePullRequest: jest.fn(),
        listOpenPullRequests: jest.fn().mockReturnValue([]),
      };
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs,
        stack,
      });
      expect(code).toBe(0);
      expect(stack.createPullRequest).not.toHaveBeenCalled();
      expect(logger.lines.join("\n")).toMatch(/Abertura cancelada/);
    });

    it("DADO wizard opção 5 (merge-stack) + stack detectada via title + confirmação ENTÃO mergeia PRs sequencialmente via StackOps", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["merge-stack", "sequential", true]);
      const fs = makeFsWithSpecReviewClosed();
      const stackPrs: import("../app/ports/StackOps.js").PullRequestData[] = [
        {
          number: 18,
          title: "[🛠️🔒] [Spec 0023] Workflow runtime",
          body: "",
          state: "OPEN" as const,
          isDraft: false,
          headRefName: "feat/spec-0023-workflow-runtime",
          baseRefName: "main",
          labels: [],
          url: "https://github.com/test/repo/pull/18",
          mergeCommitSha: null,
        },
        {
          number: 19,
          title: "[🧾🔒] [Spec 0023] Lifecycle",
          body: "",
          state: "OPEN" as const,
          isDraft: false,
          headRefName: "feat/spec-0023-lifecycle",
          baseRefName: "feat/spec-0023-workflow-runtime",
          labels: [],
          url: "https://github.com/test/repo/pull/19",
          mergeCommitSha: null,
        },
      ];
      const stack: import("../app/ports/StackOps.js").StackOps = {
        createPullRequest: jest.fn(),
        getPullRequest: jest.fn((n: number) => stackPrs.find((p) => p.number === n) ?? null),
        editPullRequestBase: jest.fn(),
        listReviewComments: jest.fn().mockReturnValue([]),
        mergePullRequest: jest.fn(),
        closePullRequest: jest.fn(),
        listOpenPullRequests: jest.fn().mockReturnValue(stackPrs),
      };
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs,
        stack,
      });
      expect(code).toBe(0);
      // #18 (base=main) NÃO precisa editBase; #19 precisa
      expect(stack.editPullRequestBase).toHaveBeenCalledTimes(1);
      expect(stack.editPullRequestBase).toHaveBeenCalledWith(19, "main");
      // ambos mergeados em ordem
      expect(stack.mergePullRequest).toHaveBeenCalledTimes(2);
      expect(stack.mergePullRequest).toHaveBeenNthCalledWith(1, {
        number: 18,
        strategy: "squash",
        deleteBranch: true,
      });
      expect(stack.mergePullRequest).toHaveBeenNthCalledWith(2, {
        number: 19,
        strategy: "squash",
        deleteBranch: true,
      });
      expect(logger.lines.join("\n")).toMatch(/Stack atomic merge completo: 2 PRs/);
    });

    it("DADO wizard opção 5 modo unit com Integration PR (base=main) ENTÃO Integration é veículo e stack PRs fecham via landed-via", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["merge-stack", "unit", true]);
      const fs = makeFsWithSpecReviewClosed();
      const allPrs: import("../app/ports/StackOps.js").PullRequestData[] = [
        {
          number: 18,
          title: "[🛠️🔒] [Spec 0023] Workflow runtime",
          body: "",
          state: "OPEN" as const,
          isDraft: false,
          headRefName: "feat/spec-0023-workflow-runtime",
          baseRefName: "main",
          labels: [],
          url: "https://github.com/test/repo/pull/18",
          mergeCommitSha: null,
        },
        {
          number: 19,
          title: "[🧾🔒] [Spec 0023] Lifecycle",
          body: "",
          state: "OPEN" as const,
          isDraft: false,
          headRefName: "feat/spec-0023-lifecycle",
          baseRefName: "feat/spec-0023-workflow-runtime",
          labels: [],
          url: "https://github.com/test/repo/pull/19",
          mergeCommitSha: null,
        },
        {
          number: 27,
          title: "[🔗] [Integration] [Spec 0023] Homologação final da stack",
          body: "",
          state: "OPEN" as const,
          isDraft: false,
          headRefName: "feat/spec-0023-lifecycle",
          baseRefName: "main",
          labels: [],
          url: "https://github.com/test/repo/pull/27",
          mergeCommitSha: null,
        },
      ];
      const stack: import("../app/ports/StackOps.js").StackOps = {
        createPullRequest: jest.fn(),
        getPullRequest: jest.fn((n: number) => allPrs.find((p) => p.number === n) ?? null),
        editPullRequestBase: jest.fn(),
        listReviewComments: jest.fn().mockReturnValue([]),
        mergePullRequest: jest.fn(),
        closePullRequest: jest.fn(),
        listOpenPullRequests: jest.fn().mockReturnValue(allPrs),
      };
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs,
        stack,
      });
      expect(code).toBe(0);
      // Integration (#27, base=main) é o veículo — mergeado diretamente, sem edit-base
      expect(stack.mergePullRequest).toHaveBeenCalledTimes(1);
      expect(stack.mergePullRequest).toHaveBeenCalledWith(
        expect.objectContaining({ number: 27, strategy: "squash" })
      );
      expect(stack.editPullRequestBase).not.toHaveBeenCalled();
      // stack PRs (#18, #19) fechados via landed-via reconciliation
      expect(stack.closePullRequest).toHaveBeenCalledTimes(2);
      const closedNumbers = (stack.closePullRequest as jest.Mock).mock.calls.map((c) => c[0]);
      expect(closedNumbers.sort()).toEqual([18, 19]);
      expect((stack.closePullRequest as jest.Mock).mock.calls[0][1]).toMatch(/landed-via: #27/);
      expect(logger.lines.join("\n")).toMatch(/Atomic merge \(unit\) completo: veículo #27/);
    });

    it("DADO wizard opção 5 + negação da confirmação ENTÃO 0 merges executados e loga cancelamento", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["merge-stack", "unit", false]);
      const fs = makeFsWithSpecReviewClosed();
      const stack: import("../app/ports/StackOps.js").StackOps = {
        createPullRequest: jest.fn(),
        getPullRequest: jest.fn().mockReturnValue({
          number: 18,
          title: "[🛠️🔒] [Spec 0023] Workflow runtime",
          body: "",
          state: "OPEN" as const,
          isDraft: false,
          headRefName: "feat/spec-0023-workflow-runtime",
          baseRefName: "main",
          labels: [],
          url: "https://github.com/test/repo/pull/18",
        }),
        editPullRequestBase: jest.fn(),
        listReviewComments: jest.fn().mockReturnValue([]),
        mergePullRequest: jest.fn(),
        closePullRequest: jest.fn(),
        listOpenPullRequests: jest.fn().mockReturnValue([
          {
            number: 18,
            title: "[🛠️🔒] [Spec 0023] Workflow runtime",
            body: "",
            state: "OPEN" as const,
            isDraft: false,
            headRefName: "feat/spec-0023-workflow-runtime",
            baseRefName: "main",
            labels: [],
            url: "https://github.com/test/repo/pull/18",
          },
        ]),
      };
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs,
        stack,
      });
      expect(code).toBe(0);
      expect(stack.mergePullRequest).not.toHaveBeenCalled();
      expect(stack.editPullRequestBase).not.toHaveBeenCalled();
      expect(logger.lines.join("\n")).toMatch(/Merge cancelado/);
    });

    // ─── Gate determinístico de Integration readiness (closing hardening) ───

    it("DADO wizard opção 4 com gates de homologação abertos (R1, R3) no review.md ENTÃO bloqueia (não chama createPullRequest), lista itens abertos e copia contexto", async () => {
      const logger = new CollectingLogger();
      const clip = new FakeClipboard();
      // Só o select da opção 4 — bloqueio ocorre ANTES de qualquer confirm.
      const prompts = new FakePrompts(["open-integration-pr"]);
      // R7 (public-facing) fechado; R8 (merge auth) aberto mas NÃO entra no gate
      // do #26 (só R1–R7). Open de integração = [R1, R3].
      const reviewOpen = [
        "# Review",
        "- [ ] **R1** CI canônico verde.",
        "- [x] **R2** ok",
        "- [ ] **R3** NEXT → backlog.",
        "- [x] **R4** ok",
        "- [x] **R5** ok",
        "- [x] **R6** ok",
        "- [x] **R7** Stack reviewed/ready (não se aplica).",
        "- [ ] **R8** Merge authorization.",
      ].join("\n");
      const fs = new StubFs(
        new Map([
          [".governance/specs/0023-workflow-runtime/spec.md", sampleSpec],
          [".governance/specs/0023-workflow-runtime/state.yml", sampleState],
          [".governance/specs/0023-workflow-runtime/review.md", reviewOpen],
        ]),
        new Set([".governance/specs/0023-workflow-runtime"]),
        "feat/spec-0023-workflow-runtime"
      );
      const stack: import("../app/ports/StackOps.js").StackOps = {
        createPullRequest: jest.fn(),
        getPullRequest: jest.fn(),
        editPullRequestBase: jest.fn(),
        listReviewComments: jest.fn().mockReturnValue([]),
        mergePullRequest: jest.fn(),
        closePullRequest: jest.fn(),
        listOpenPullRequests: jest.fn().mockReturnValue([]),
      };
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: clip,
        fs,
        stack,
      });
      const out = logger.lines.join("\n");
      expect(code).toBe(1);
      expect(stack.createPullRequest).not.toHaveBeenCalled();
      expect(out).toMatch(/Integration PR bloqueado/);
      // Lista os itens abertos detectados (R1, R3), não os fechados nem R8 (gate de merge).
      expect(out).toMatch(/\*\*R1\*\*/);
      expect(out).toMatch(/\*\*R3\*\*/);
      expect(out).not.toMatch(/\*\*R2\*\*/);
      expect(out).not.toMatch(/\*\*R8\*\*/);
      // Bloco copiável foi para o clipboard com contexto da spec + linhas abertas.
      expect(clip.copied).toMatch(/Spec: 0023 \/ workflow-runtime/);
      expect(clip.copied).toMatch(/\*\*R1\*\*/);
    });

    it("DADO wizard opção 4 com R1–R7 FECHADOS ENTÃO prossegue (chama createPullRequest)", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["open-integration-pr", true]);
      const fs = new StubFs(
        new Map([
          [".governance/specs/0023-workflow-runtime/spec.md", sampleSpec],
          [".governance/specs/0023-workflow-runtime/state.yml", sampleState],
          [".governance/specs/0023-workflow-runtime/review.md", reviewAllClosed],
          [
            ".governance/specs/0023-workflow-runtime/integration-pr.md",
            "## Integration PR\n\nbody",
          ],
        ]),
        new Set([".governance/specs/0023-workflow-runtime"]),
        "feat/spec-0023-workflow-runtime"
      );
      const stack: import("../app/ports/StackOps.js").StackOps = {
        createPullRequest: jest.fn().mockReturnValue({
          number: 26,
          title: "irrelevant",
          body: "",
          state: "OPEN" as const,
          isDraft: true,
          headRefName: "feat/spec-0023-workflow-runtime",
          baseRefName: "main",
          labels: [],
          url: "https://github.com/test/repo/pull/26",
        }),
        getPullRequest: jest.fn().mockReturnValue(null),
        editPullRequestBase: jest.fn(),
        listReviewComments: jest.fn().mockReturnValue([]),
        mergePullRequest: jest.fn(),
        closePullRequest: jest.fn(),
        listOpenPullRequests: jest.fn().mockReturnValue([]),
      };
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs,
        stack,
      });
      expect(code).toBe(0);
      expect(stack.createPullRequest).toHaveBeenCalledTimes(1);
      expect(logger.lines.join("\n")).not.toMatch(/bloqueado/);
    });

    it("DADO wizard opção 5 com R8 (merge authorization) ABERTO ENTÃO bloqueia merge atômico e copia contexto", async () => {
      const logger = new CollectingLogger();
      const clip = new FakeClipboard();
      const prompts = new FakePrompts(["merge-stack"]);
      // R1–R7 fechados (#26 já poderia abrir), mas R8 aberto bloqueia o merge.
      const reviewOpen = [
        "# Review",
        "- [x] **R1** ok",
        "- [x] **R2** ok",
        "- [x] **R3** ok",
        "- [x] **R4** ok",
        "- [x] **R5** ok",
        "- [x] **R6** ok",
        "- [x] **R7** ok",
        "- [ ] **R8** Merge authorization explícita (owner).",
      ].join("\n");
      const fs = new StubFs(
        new Map([
          [".governance/specs/0023-workflow-runtime/spec.md", sampleSpec],
          [".governance/specs/0023-workflow-runtime/state.yml", sampleState],
          [".governance/specs/0023-workflow-runtime/review.md", reviewOpen],
        ]),
        new Set([".governance/specs/0023-workflow-runtime"]),
        "feat/spec-0023-workflow-runtime"
      );
      const stack: import("../app/ports/StackOps.js").StackOps = {
        createPullRequest: jest.fn(),
        getPullRequest: jest.fn(),
        editPullRequestBase: jest.fn(),
        listReviewComments: jest.fn().mockReturnValue([]),
        mergePullRequest: jest.fn(),
        closePullRequest: jest.fn(),
        listOpenPullRequests: jest.fn().mockReturnValue([]),
      };
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: clip,
        fs,
        stack,
      });
      const out = logger.lines.join("\n");
      expect(code).toBe(1);
      expect(stack.mergePullRequest).not.toHaveBeenCalled();
      expect(stack.listOpenPullRequests).not.toHaveBeenCalled();
      expect(out).toMatch(/Merge atômico bloqueado/);
      expect(out).toMatch(/\*\*R8\*\*/);
      expect(clip.copied).toMatch(/Gate de readiness: merge-stack/);
    });

    it("DADO wizard opção 6 + tipo 'a' (arquitetura, sem contexto) E template existe ENTÃO copia briefing para clipboard, emite confirmação no logger E NÃO renderiza o prompt", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["visual-prompt", "architecture"]);
      const clip = new FakeClipboard();
      const files = new Map<string, string>([
        [
          ".governance/visual-prompts/architecture-end-to-end.prompt.md",
          "Investigate the current repo and produce a finished image prompt.\n",
        ],
      ]);
      const fs = new StubFs(files, new Set(), "feat/spec-0023-workflow-runtime");
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: clip,
        fs,
      });
      const out = logger.lines.join("\n");
      expect(code).toBe(0);
      // Mensagem de copy + instruções aparecem; arquitetura agora vai para IA conversacional
      // (caminho consistente com value-delivered).
      expect(out).toMatch(/COMO USAR \(destino: IA conversacional/);
      expect(out).toMatch(/✓ Prompt copiado para o clipboard/);
      // O conteúdo do briefing NÃO aparece no terminal (por design — está no clipboard)
      expect(out).not.toMatch(/Investigate the current repo/);
      // Mas o conteúdo correto foi para o clipboard
      expect(clip.copied).toBe(
        "Investigate the current repo and produce a finished image prompt.\n"
      );
    });

    it("DADO wizard opção 6 E clipboard indisponível ENTÃO imprime prompt entre delimitadores para copy manual", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["visual-prompt", "architecture"]);
      const files = new Map<string, string>([
        [
          ".governance/visual-prompts/architecture-end-to-end.prompt.md",
          "Investigate the current repo and produce a finished image prompt.\n",
        ],
      ]);
      const fs = new StubFs(files, new Set(), "feat/spec-0023-workflow-runtime");

      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(false),
        fs,
      });

      const out = logger.lines.join("\n");
      expect(code).toBe(0);
      expect(out).toMatch(/clipboard indisponível/);
      expect(out).toMatch(/──── PROMPT/);
      expect(out).toMatch(/Investigate the current repo/);
      expect(out).toMatch(/──── FIM/);
    });

    it("DADO wizard opção 6 + tipo 'b' (valor) + contexto 'PR #25' ENTÃO substitui {{context}} e envia para clipboard com sucesso", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["visual-prompt", "value-delivered", "PR #25"]);
      const clip = new FakeClipboard();
      const files = new Map<string, string>([
        [
          ".governance/visual-prompts/value-delivered.prompt.md",
          "Investigate {{context}} and produce a finished image prompt for {{context}}.\n",
        ],
      ]);
      const fs = new StubFs(files, new Set(), "feat/spec-0023-workflow-runtime");
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: clip,
        fs,
      });
      const out = logger.lines.join("\n");
      expect(code).toBe(0);
      // Instruções de IA conversacional + confirmação de copy
      expect(out).toMatch(/COMO USAR \(destino: IA conversacional/);
      expect(out).toMatch(/✓ Prompt copiado para o clipboard/);
      // Conteúdo enviado ao clipboard tem {{context}} substituído por "PR #25"
      expect(clip.copied).toBe(
        "Investigate PR #25 and produce a finished image prompt for PR #25.\n"
      );
      expect(clip.copied).not.toMatch(/\{\{context\}\}/);
    });

    it("DADO wizard opção 6 + tipo 'b' + contexto inválido 'spec' (sem identificador) ENTÃO emite erro narrativo e quit gracioso", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["visual-prompt", "value-delivered", "spec"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(0);
      expect(logger.lines.some((l) => l.includes('Contexto não reconhecido: "spec"'))).toBe(true);
    });

    // NOTA: opção `value-delivered-auto` (placeholder "em breve") removida do
    // menu — confundia UX expor opção não-funcional. Modo automático fica
    // como sub-escopo da candidata `governance-dashboard-and-visual-artifacts`
    // (backlog Now); quando materializar, adicionará variantes ao menu.

    it("DADO wizard opção 6 + tipo 'b' SEM contexto fornecido ENTÃO emite erro e quit gracioso", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["visual-prompt", "value-delivered", ""]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(0);
      expect(logger.lines.some((l) => l.includes("Contexto vazio"))).toBe(true);
    });

    it("DADO wizard opção 2 com identifier válido ENTÃO delega para continue via índice público", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-other", "0023"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpecAndTasks(),
        loadActiveSpecsIndex: () => ({
          indexAvailable: true,
          entries: [
            {
              entry: {
                id: "0023",
                slug: "workflow-runtime",
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
        }),
      });

      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/Próxima ação: executar PR1/);
    });

    // NOTA: o teste antigo "tipo desconhecido em visual prompts" foi removido após migração
    // para inquirer/select — o submenu de tipos restringe escolhas válidas na fonte.

    it("DADO wizard opção 6 + tipo válido MAS template ausente no filesystem ENTÃO emite erro e retorna 1", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["visual-prompt", "architecture"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(1);
      expect(logger.lines.some((l) => l.includes('Template "architecture-end-to-end"'))).toBe(true);
    });
  });

  describe("runContinue", () => {
    it("DADO spec detectada com state.next ENTÃO imprime briefing + próxima ação", async () => {
      const logger = new CollectingLogger();
      const code = await runContinue({
        repoRoot: "/repo",
        logger,
        fs: makeFsWithSpecAndTasks(),
      });
      expect(code).toBe(0);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/Stage: implementation/);
      expect(out).toMatch(/Próxima ação: executar PR1/);
    });

    it("DADO spec detectada MAS tasks.md ausente QUANDO runContinue ENTÃO recusa narrativamente E retorna 1", async () => {
      const logger = new CollectingLogger();
      const code = await runContinue({
        repoRoot: "/repo",
        logger,
        fs: makeFsWithSpec(),
      });
      expect(code).toBe(1);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/ERR: Execution locked\./);
      expect(out).toMatch(/ERR: Missing:/);
      expect(out).toMatch(
        /ERR: - tasks\.md em \.governance\/specs\/0023-workflow-runtime\/tasks\.md \(não encontrado\)/
      );
      expect(out).not.toMatch(/gate\.status/);
    });

    it("DADO spec detectada MAS gate aberto QUANDO runContinue ENTÃO recusa narrativamente E retorna 1", async () => {
      const logger = new CollectingLogger();
      const openState = sampleState.replace("status: closed", "status: open");
      const fs = new StubFs(
        new Map([
          [".governance/specs/0023-workflow-runtime/spec.md", sampleSpec],
          [".governance/specs/0023-workflow-runtime/state.yml", openState],
          [".governance/specs/0023-workflow-runtime/tasks.md", "# Tasks"],
        ]),
        new Set([".governance/specs/0023-workflow-runtime"]),
        "feat/spec-0023-workflow-runtime"
      );

      const code = await runContinue({
        repoRoot: "/repo",
        logger,
        fs,
      });
      expect(code).toBe(1);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/ERR: Execution locked\./);
      expect(out).toMatch(/ERR: Missing:/);
      expect(out).toMatch(/ERR: - planning gate\.status == closed \(atual: open\)/);
      expect(out).not.toMatch(/tasks\.md/);
    });

    it("DADO spec detectada MAS tasks.md ausente E gate aberto QUANDO runContinue ENTÃO recusa com ambas as violações E retorna 1", async () => {
      const logger = new CollectingLogger();
      const openState = sampleState.replace("status: closed", "status: open");
      const fs = new StubFs(
        new Map([
          [".governance/specs/0023-workflow-runtime/spec.md", sampleSpec],
          [".governance/specs/0023-workflow-runtime/state.yml", openState],
        ]),
        new Set([".governance/specs/0023-workflow-runtime"]),
        "feat/spec-0023-workflow-runtime"
      );

      const code = await runContinue({
        repoRoot: "/repo",
        logger,
        fs,
      });
      expect(code).toBe(1);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/ERR: Execution locked\./);
      expect(out).toMatch(/ERR: Missing:/);
      expect(out).toMatch(
        /ERR: - tasks\.md em \.governance\/specs\/0023-workflow-runtime\/tasks\.md \(não encontrado\)/
      );
      expect(out).toMatch(/ERR: - planning gate\.status == closed \(atual: open\)/);
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
      warnings: ["Index not found. Run yarn guidelines workflow publish-state to populate."],
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

    it("DADO wizard opção 1 + spec local detectada + índice presente com a mesma spec ENTÃO loga briefing + seção do índice marcando spec corrente com '*'", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current", "q"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
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

    it("DADO wizard opção 1 + spec local detectada + índice ausente ENTÃO loga briefing sem seção de índice (silencioso quando branch já orienta)", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current", "q"]);
      const absent: ListActiveSpecsResult = {
        indexAvailable: false,
        entries: [],
        warnings: ["not found"],
      };
      await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
        loadActiveSpecsIndex: () => absent,
      });
      const out = logger.lines.join("\n");
      expect(out).not.toMatch(/Índice operacional público/);
      expect(out).not.toMatch(/Specs ativas no índice público/);
    });

    it("DADO wizard opção 1 + branch fora do padrão + índice presente com 1 entry ENTÃO erro + seção do índice exibida + retorna 1", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
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

    it("DADO wizard opção 1 + branch fora do padrão + índice ausente ENTÃO erro + heading com aviso de publish-state + retorna 1", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current"]);
      const absent: ListActiveSpecsResult = {
        indexAvailable: false,
        entries: [],
        warnings: ["Index not found. Run yarn guidelines workflow publish-state to populate."],
      };
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: new StubFs(new Map(), new Set(), "main"),
        loadActiveSpecsIndex: () => absent,
      });
      expect(code).toBe(1);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/Índice operacional público/);
      expect(out).toMatch(/publish-state/);
    });

    it("DADO wizard opção 4 (ver specs ativas) ENTÃO loga índice e retorna 0 sem invocar briefing", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["list-active"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
        loadActiveSpecsIndex: () => indexWithCurrent,
      });
      const out = logger.lines.join("\n");
      expect(code).toBe(0);
      expect(out).toMatch(/Specs ativas no índice público/);
      expect(out).not.toMatch(/Stage: implementation/);
    });

    it("DADO wizard opção 5 (diagnosticar drift) com entries sem drift ENTÃO loga 'Nenhum drift' e retorna 0", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["diagnose-drift"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
        loadActiveSpecsIndex: () => indexWithCurrent,
      });
      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/Nenhum drift detectado/);
    });

    it("DADO wizard opção 5 (diagnosticar drift) sem índice ENTÃO loga dica de publish-state e retorna 0", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["diagnose-drift"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
        loadActiveSpecsIndex: () => ({
          indexAvailable: false,
          entries: [],
          warnings: ["not found"],
        }),
      });

      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/índice operacional público/i);
      expect(logger.lines.join("\n")).toMatch(/publish-state/);
    });

    it("DADO wizard opção 5 (diagnosticar drift) com spec_path ausente ENTÃO lista a entry divergente", async () => {
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["diagnose-drift"]);
      const code = await runWorkflow({
        repoRoot: "/repo",
        logger,
        prompts,
        clipboard: new FakeClipboard(),
        fs: makeFsWithSpec(),
        loadActiveSpecsIndex: () => ({
          indexAvailable: true,
          entries: [
            {
              entry: {
                id: "0023",
                slug: "workflow-runtime",
                branch: "feat/spec-0023-workflow-runtime",
                stage: "implementation",
                status: "active",
                specPath: ".governance/specs/0023-workflow-runtime",
                updatedAt: "2026-05-21T00:00:00Z",
              },
              specPathExists: false,
            },
          ],
          warnings: [],
        }),
      });

      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(/1 entry\(ies\) com drift/);
      expect(logger.lines.join("\n")).toMatch(/workflow-runtime/);
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
          fs: makeFsWithSpecAndTasks(),
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
      expect(out).toMatch(/yarn guidelines workflow publish-state/);
    });

    it("DADO main(['continue', '<identifier>'], opts) QUANDO entry casa E path existe ENTÃO encaminha identifier para runContinue (lookup via índice)", async () => {
      const logger = new CollectingLogger();
      const code = await main(["continue", "0023"], {
        repoRoot: "/repo",
        logger,
        fs: makeFsWithSpecAndTasks(),
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
        fs: makeFsWithSpecAndTasks(),
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
        this.dirs = expandAncestors(dirs);
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
      listDirectory(p: string): ReadonlyArray<string> {
        return deriveListing(this.dirs, p);
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
      fs.branch = "main"; // branch fora do padrão → DetectActiveSpec falha narrativamente per [DEC-0023-I01]
      const code = await runPublishState(
        { repoRoot: "/repo", logger, fs },
        { status: "active", updatedBy: "@x" }
      );
      expect(code).toBe(1);
      // pós-[DEC-0023-I01]: PublishState propaga o reason de DetectActiveSpec
      // sem consultar projection layer (active-specs.yml).
      expect(
        logger.lines.some(
          (l) =>
            l.startsWith("ERR:") &&
            /Não foi possível detectar spec ativa/.test(l) &&
            /branch "main" não segue o padrão/.test(l)
        )
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
