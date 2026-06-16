import { execSync } from "node:child_process";
import * as fs2 from "node:fs";
import * as fsAsync from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { NodeWorkflowFileSystem } from "../infrastructure/filesystem/NodeWorkflowFileSystem.js";
import { parseActiveSpecs } from "../infrastructure/yaml/activeSpecsSerializer.js";
import { ClipboardWriter } from "../app/ports/ClipboardWriter.js";
import { ConfirmOptions, InputOptions, Prompts, SelectOptions } from "../app/ports/Prompts.js";
import { Logger, runAdvancedOps, runContinue, runPublishState } from "./workflow.js";
import { collectHandoffFacts } from "./handoff.js";
import { deriveHandoff } from "./handoffFacts.js";
import { createLoadReceipt, writeReceipt, receiptPath } from "./handoffReceipt.js";

/**
 * Integration tests — loop operacional ponta-a-ponta com filesystem + git
 * reais, sem fakes nem mocks. Exercita a composição entre `src/cli/workflow.ts`,
 * `src/app/workflow/*`, `src/infrastructure/{filesystem,yaml}/*` e
 * `NodeWorkflowFileSystem` no caminho que o usuário vai usar de fato.
 *
 * **Disciplina explícita** (cf. memory `feedback-integration-tests-stay-linear`):
 *   - cada cenário monta seu ambiente inline (mkdtemp + git init + writes);
 *   - try/finally por test para cleanup; nenhum hook global com estado;
 *   - repetição de boilerplate de setup é desejada — auditabilidade visual;
 *   - sem helpers compartilhados, sem fixture DSL, sem builders.
 *
 * **Fora do escopo:** bridge legada `cli/app/engine.mjs → dist/cli/workflow.js`.
 * Esse cabling já foi exercitado pelos unit tests do parser (Passos 4+5) e
 * sua expansão exigiria build pipeline orquestrado — trade-off honesto:
 * valor adicional marginal vs custo de infraestrutura.
 */

class CollectingLogger implements Logger {
  readonly lines: string[] = [];
  info(msg: string): void {
    this.lines.push(msg);
  }
  error(msg: string): void {
    this.lines.push(`ERR: ${msg}`);
  }
}

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
        `FakePrompts: nenhum choice match para "${answer}" em select "${options.message}".`
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

class NullClipboard implements ClipboardWriter {
  async copy(): Promise<boolean> {
    return false;
  }
}

describe("CLI — workflow integration [BR-WORKFLOW-RUNTIME-INDEX-E2E]", () => {
  it("Cenário 1 — DADO branch + state.yml reais QUANDO publish-state ENTÃO escreve specs/active.yml parseável com a entry corrente", async () => {
    const tempDir = await fsAsync.mkdtemp(path.join(os.tmpdir(), "ws-e2e-publish-"));
    try {
      // setup inline: `git init -b` cria branch unborn; runtime real depende
      // de HEAD com commit válido (descoberta operacional do Passo 7), então
      // criamos commit empty explicitamente. user.email/name são locais ao
      // tempdir — não vazam config global.
      execSync("git init -b feat/spec-0024-foo", { cwd: tempDir, stdio: "ignore" });
      execSync("git config user.email test@example.com", { cwd: tempDir, stdio: "ignore" });
      execSync("git config user.name Test", { cwd: tempDir, stdio: "ignore" });
      execSync('git commit --allow-empty -m "initial"', { cwd: tempDir, stdio: "ignore" });
      const specDir = path.join(tempDir, ".governance", "specs", "0024-foo");
      await fsAsync.mkdir(specDir, { recursive: true });
      await fsAsync.writeFile(
        path.join(specDir, "state.yml"),
        `stage: planning
gate:
  status: open
focus:
  - integration-loop
next:
  - rodar integration test
`
      );

      // execute
      const logger = new CollectingLogger();
      const fs = new NodeWorkflowFileSystem(tempDir);
      const code = await runPublishState(
        { repoRoot: tempDir, logger, fs },
        { status: "active", updatedBy: "@rosanarezende", title: "Foo Spec" }
      );

      // assert
      expect(code).toBe(0);
      const indexPath = path.join(tempDir, ".governance", "runtime", "specs/active.yml");
      const indexYaml = await fsAsync.readFile(indexPath, "utf8");
      const reparsed = parseActiveSpecs(indexYaml);
      expect(reparsed.activeSpecs).toHaveLength(1);
      const entry = reparsed.activeSpecs[0];
      expect(entry.id).toBe("0024");
      expect(entry.slug).toBe("foo");
      expect(entry.title).toBe("Foo Spec");
      expect(entry.branch).toBe("feat/spec-0024-foo");
      expect(entry.stage).toBe("planning");
      expect(entry.status).toBe("active");
      expect(entry.specPath).toBe(".governance/specs/0024-foo");
      expect(entry.sourceStatePath).toBe(".governance/specs/0024-foo/state.yml");
      expect(entry.updatedBy).toBe("@rosanarezende");
      expect(logger.lines.join("\n")).toMatch(/Spec 0024 \/ foo publicada/);
    } finally {
      await fsAsync.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("Cenário 2 — DADO specs/active.yml com 2 entries (uma com spec_path existente, outra sem) QUANDO runWorkflow ENTÃO lista entries E narra drift da ausente", async () => {
    const tempDir = await fsAsync.mkdtemp(path.join(os.tmpdir(), "ws-e2e-drift-"));
    try {
      // setup inline: branch unborn + commit empty para HEAD válido (cf.
      // Cenário 1), depois spec real + índice com 2 entries.
      execSync("git init -b feat/spec-0024-foo", { cwd: tempDir, stdio: "ignore" });
      execSync("git config user.email test@example.com", { cwd: tempDir, stdio: "ignore" });
      execSync("git config user.name Test", { cwd: tempDir, stdio: "ignore" });
      execSync('git commit --allow-empty -m "initial"', { cwd: tempDir, stdio: "ignore" });
      const fooSpecDir = path.join(tempDir, ".governance", "specs", "0024-foo");
      await fsAsync.mkdir(fooSpecDir, { recursive: true });
      await fsAsync.writeFile(
        path.join(fooSpecDir, "spec.md"),
        "# Spec 0024 — Foo\n\n> Status: Draft\n"
      );
      await fsAsync.writeFile(
        path.join(fooSpecDir, "state.yml"),
        `stage: implementation
gate:
  status: closed
focus: []
next: []
`
      );

      const indexDir = path.join(tempDir, ".governance", "runtime", "specs");
      await fsAsync.mkdir(indexDir, { recursive: true });
      // entry 0024 com spec_path existente; entry 0099 com spec_path inexistente (drift)
      await fsAsync.writeFile(
        path.join(indexDir, "active.yml"),
        `version: 1
active_specs:
  - id: "0024"
    slug: "foo"
    branch: "feat/spec-0024-foo"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0024-foo"
    updated_at: "2026-05-21T10:00:00Z"
  - id: "0099"
    slug: "ghost"
    branch: "feat/spec-0099-ghost"
    stage: "discovery"
    status: "paused"
    spec_path: ".governance/specs/0099-ghost"
    updated_at: "2026-05-15T10:00:00Z"
`
      );

      // execute — wizard opção 1 (continuar spec atual) + quit no REPL
      const logger = new CollectingLogger();
      const prompts = new FakePrompts(["continue-current", "q"]);
      const fs = new NodeWorkflowFileSystem(tempDir);
      const code = await runAdvancedOps({
        repoRoot: tempDir,
        logger,
        prompts,
        clipboard: new NullClipboard(),
        fs,
      });

      // assert
      expect(code).toBe(0);
      const out = logger.lines.join("\n");
      // a spec corrente (0024) deve aparecer marcada com * e ✓
      expect(out).toMatch(/\* ✓ foo/);
      // a spec ghost (0099) deve aparecer com ✗ e drift narrado
      expect(out).toMatch(/✗ ghost/);
      expect(out).toMatch(/\(drift\) Spec "ghost"/);
      expect(out).toMatch(/feat\/spec-0099-ghost/);
    } finally {
      await fsAsync.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("Cenário 3 — DADO `continue <id>` E entry no índice aponta para spec_path existente em OUTRA branch lógica QUANDO runContinue ENTÃO loga briefing da spec encontrada via lookup (sem auto-checkout)", async () => {
    const tempDir = await fsAsync.mkdtemp(path.join(os.tmpdir(), "ws-e2e-continue-"));
    try {
      // setup inline: branch corrente é `main` (NÃO casa nenhuma spec via
      // DetectActiveSpec) + commit empty para HEAD válido (cf. Cenário 1);
      // o índice declara spec 0024 cuja branch lógica é diferente, mas
      // spec_path existe localmente — simula spec descoberta via índice
      // antes do checkout.
      execSync("git init -b main", { cwd: tempDir, stdio: "ignore" });
      execSync("git config user.email test@example.com", { cwd: tempDir, stdio: "ignore" });
      execSync("git config user.name Test", { cwd: tempDir, stdio: "ignore" });
      execSync('git commit --allow-empty -m "initial"', { cwd: tempDir, stdio: "ignore" });
      const fooSpecDir = path.join(tempDir, ".governance", "specs", "0024-foo");
      await fsAsync.mkdir(fooSpecDir, { recursive: true });
      await fsAsync.writeFile(
        path.join(fooSpecDir, "spec.md"),
        `# Spec 0024 — Foo Bar

> Status: Draft

Conteúdo da spec.
`
      );
      await fsAsync.writeFile(
        path.join(fooSpecDir, "state.yml"),
        `stage: decision
gate:
  status: closed
focus:
  - foo-focus
next:
  - próxima ação de foo
`
      );
      await fsAsync.writeFile(path.join(fooSpecDir, "tasks.md"), `# Tasks\n- [ ] tarefa 1`);

      const indexDir = path.join(tempDir, ".governance", "runtime", "specs");
      await fsAsync.mkdir(indexDir, { recursive: true });
      await fsAsync.writeFile(
        path.join(indexDir, "active.yml"),
        `version: 1
active_specs:
  - id: "0024"
    slug: "foo"
    branch: "feat/spec-0024-foo"
    stage: "decision"
    status: "active"
    spec_path: ".governance/specs/0024-foo"
    updated_at: "2026-05-21T10:00:00Z"
`
      );

      // execute: continue 0024 (identificador via id puro)
      const logger = new CollectingLogger();
      const fs = new NodeWorkflowFileSystem(tempDir);
      const code = await runContinue({ repoRoot: tempDir, logger, fs }, "0024");

      // assert
      expect(code).toBe(0);
      const out = logger.lines.join("\n");
      // briefing da spec resolvida via índice
      expect(out).toMatch(/Stage: decision/);
      expect(out).toMatch(/Próxima ação: próxima ação de foo/);
      // não tentou auto-checkout — nenhum efeito colateral em git
      expect(execSync("git rev-parse --abbrev-ref HEAD", { cwd: tempDir }).toString().trim()).toBe(
        "main"
      );
    } finally {
      await fsAsync.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("Cenário 4 — DADO branch 'de trabalho' (escopo do PR ≠ slug canônico) E entry no índice referencia essa branch QUANDO publish-state ENTÃO fallback via índice resolve E entry é atualizada (bug revelado pela validação humana do PR #23)", async () => {
    const tempDir = await fsAsync.mkdtemp(path.join(os.tmpdir(), "ws-e2e-fallback-"));
    try {
      // setup inline: branch corrente é "feat/spec-0099-trabalho-x" (nome
      // reflete escopo do PR), mas o slug canônico da spec é "foo-canonico"
      // — o diretório é ".governance/specs/0099-foo-canonico". DetectActiveSpec
      // sozinho falharia (procura ".../0099-trabalho-x" que não existe). O
      // fallback consulta o índice, encontra match exato em entry.branch e
      // resolve corretamente.
      execSync("git init -b feat/spec-0099-trabalho-x", { cwd: tempDir, stdio: "ignore" });
      execSync("git config user.email test@example.com", { cwd: tempDir, stdio: "ignore" });
      execSync("git config user.name Test", { cwd: tempDir, stdio: "ignore" });
      execSync('git commit --allow-empty -m "initial"', { cwd: tempDir, stdio: "ignore" });

      const specDir = path.join(tempDir, ".governance", "specs", "0099-foo-canonico");
      await fsAsync.mkdir(specDir, { recursive: true });
      await fsAsync.writeFile(
        path.join(specDir, "state.yml"),
        `stage: implementation
gate:
  status: closed
focus: []
next: []
`
      );

      const indexDir = path.join(tempDir, ".governance", "runtime", "specs");
      await fsAsync.mkdir(indexDir, { recursive: true });
      await fsAsync.writeFile(
        path.join(indexDir, "active.yml"),
        `version: 1
active_specs:
  - id: "0099"
    slug: "foo-canonico"
    branch: "feat/spec-0099-trabalho-x"
    stage: "decision"
    status: "paused"
    spec_path: ".governance/specs/0099-foo-canonico"
    updated_at: "2026-05-20T00:00:00Z"
`
      );

      // execute
      const logger = new CollectingLogger();
      const fs = new NodeWorkflowFileSystem(tempDir);
      const code = await runPublishState(
        { repoRoot: tempDir, logger, fs },
        { status: "active", updatedBy: "@rosanarezende" }
      );

      // assert: publish funcionou via fallback; entry foi atualizada
      expect(code).toBe(0);
      const indexYaml = await fsAsync.readFile(path.join(indexDir, "active.yml"), "utf8");
      const reparsed = parseActiveSpecs(indexYaml);
      expect(reparsed.activeSpecs).toHaveLength(1);
      const entry = reparsed.activeSpecs[0];
      expect(entry.id).toBe("0099");
      expect(entry.slug).toBe("foo-canonico");
      expect(entry.branch).toBe("feat/spec-0099-trabalho-x");
      expect(entry.stage).toBe("implementation"); // projetado do state.yml
      expect(entry.status).toBe("active"); // declarado pelo humano
      expect(logger.lines.join("\n")).toMatch(/Spec 0099 \/ foo-canonico atualizada/);
    } finally {
      await fsAsync.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("Cenário 5 — DADO spec com gate aberto e sem tasks.md QUANDO runContinue ENTÃO recusa a execução retornando exit code 1 e narrando dupla violação", async () => {
    const tempDir = await fsAsync.mkdtemp(path.join(os.tmpdir(), "ws-e2e-lock-both-"));
    try {
      execSync("git init -b feat/spec-0025-bar", { cwd: tempDir, stdio: "ignore" });
      execSync("git config user.email test@example.com", { cwd: tempDir, stdio: "ignore" });
      execSync("git config user.name Test", { cwd: tempDir, stdio: "ignore" });
      execSync('git commit --allow-empty -m "initial"', { cwd: tempDir, stdio: "ignore" });

      const specDir = path.join(tempDir, ".governance", "specs", "0025-bar");
      await fsAsync.mkdir(specDir, { recursive: true });
      await fsAsync.writeFile(
        path.join(specDir, "state.yml"),
        `stage: planning
gate:
  status: open
focus: []
next: []
`
      );

      const indexDir = path.join(tempDir, ".governance", "runtime", "specs");
      await fsAsync.mkdir(indexDir, { recursive: true });
      await fsAsync.writeFile(
        path.join(indexDir, "active.yml"),
        `version: 1
active_specs:
  - id: "0025"
    slug: "bar"
    branch: "feat/spec-0025-bar"
    stage: "planning"
    status: "active"
    spec_path: ".governance/specs/0025-bar"
    updated_at: "2026-05-21T10:00:00Z"
`
      );

      const logger = new CollectingLogger();
      const fs = new NodeWorkflowFileSystem(tempDir);
      const code = await runContinue({ repoRoot: tempDir, logger, fs }, "0025");

      expect(code).toBe(1);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/ERR: Execution locked\./);
      expect(out).toMatch(/ERR: Missing:/);
      expect(out).toMatch(/ERR: - tasks\.md em .*0025-bar\/tasks\.md \(não encontrado\)/);
      expect(out).toMatch(/ERR: - planning gate\.status == closed \(atual: open\)/);
    } finally {
      await fsAsync.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("Cenário 6 — DADO spec com gate fechado e sem tasks.md QUANDO runContinue ENTÃO recusa a execução retornando exit code 1 e narrando falta de tasks.md apenas", async () => {
    const tempDir = await fsAsync.mkdtemp(path.join(os.tmpdir(), "ws-e2e-lock-tasks-"));
    try {
      execSync("git init -b feat/spec-0025-bar", { cwd: tempDir, stdio: "ignore" });
      execSync("git config user.email test@example.com", { cwd: tempDir, stdio: "ignore" });
      execSync("git config user.name Test", { cwd: tempDir, stdio: "ignore" });
      execSync('git commit --allow-empty -m "initial"', { cwd: tempDir, stdio: "ignore" });

      const specDir = path.join(tempDir, ".governance", "specs", "0025-bar");
      await fsAsync.mkdir(specDir, { recursive: true });
      await fsAsync.writeFile(
        path.join(specDir, "state.yml"),
        `stage: implementation
gate:
  status: closed
focus: []
next: []
`
      );

      const indexDir = path.join(tempDir, ".governance", "runtime", "specs");
      await fsAsync.mkdir(indexDir, { recursive: true });
      await fsAsync.writeFile(
        path.join(indexDir, "active.yml"),
        `version: 1
active_specs:
  - id: "0025"
    slug: "bar"
    branch: "feat/spec-0025-bar"
    stage: "implementation"
    status: "active"
    spec_path: ".governance/specs/0025-bar"
    updated_at: "2026-05-21T10:00:00Z"
`
      );

      const logger = new CollectingLogger();
      const fs = new NodeWorkflowFileSystem(tempDir);
      const code = await runContinue({ repoRoot: tempDir, logger, fs }, "0025");

      expect(code).toBe(1);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/ERR: Execution locked\./);
      expect(out).toMatch(/ERR: Missing:/);
      expect(out).toMatch(/ERR: - tasks\.md em .*0025-bar\/tasks\.md \(não encontrado\)/);
      expect(out).not.toMatch(/planning gate\.status == closed/);
    } finally {
      await fsAsync.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("Cenário 7 — DADO spec com gate aberto e com tasks.md QUANDO runContinue ENTÃO recusa a execução retornando exit code 1 e narrando gate aberto apenas", async () => {
    const tempDir = await fsAsync.mkdtemp(path.join(os.tmpdir(), "ws-e2e-lock-gate-"));
    try {
      execSync("git init -b feat/spec-0025-bar", { cwd: tempDir, stdio: "ignore" });
      execSync("git config user.email test@example.com", { cwd: tempDir, stdio: "ignore" });
      execSync("git config user.name Test", { cwd: tempDir, stdio: "ignore" });
      execSync('git commit --allow-empty -m "initial"', { cwd: tempDir, stdio: "ignore" });

      const specDir = path.join(tempDir, ".governance", "specs", "0025-bar");
      await fsAsync.mkdir(specDir, { recursive: true });
      await fsAsync.writeFile(
        path.join(specDir, "state.yml"),
        `stage: planning
gate:
  status: open
focus: []
next: []
`
      );
      await fsAsync.writeFile(path.join(specDir, "tasks.md"), "# Tasks\n- [ ] tarefa 1");

      const indexDir = path.join(tempDir, ".governance", "runtime", "specs");
      await fsAsync.mkdir(indexDir, { recursive: true });
      await fsAsync.writeFile(
        path.join(indexDir, "active.yml"),
        `version: 1
active_specs:
  - id: "0025"
    slug: "bar"
    branch: "feat/spec-0025-bar"
    stage: "planning"
    status: "active"
    spec_path: ".governance/specs/0025-bar"
    updated_at: "2026-05-21T10:00:00Z"
`
      );

      const logger = new CollectingLogger();
      const fs = new NodeWorkflowFileSystem(tempDir);
      const code = await runContinue({ repoRoot: tempDir, logger, fs }, "0025");

      expect(code).toBe(1);
      const out = logger.lines.join("\n");
      expect(out).toMatch(/ERR: Execution locked\./);
      expect(out).toMatch(/ERR: Missing:/);
      expect(out).not.toMatch(/tasks\.md/);
      expect(out).toMatch(/ERR: - planning gate\.status == closed \(atual: open\)/);
    } finally {
      await fsAsync.rm(tempDir, { recursive: true, force: true });
    }
  });
});

/**
 * CO-3.4 — advisory-first do recibo de carga na superfície mutante situada
 * `workflow publish-state`. Disciplina linear: cada cenário monta seu ambiente
 * inline (mkdtemp + git + spec + recibo controlado), sem fakes nem helpers
 * compartilhados. Prova os 5 estados (fresh/missing/stale-head/stale-sources/
 * invalid), a degradação diagnosticável e — regressão crítica — que o caminho
 * advisory NÃO reescreve o recibo silenciosamente (bug do `loadHandoffSnapshot`).
 */
describe("publish-state · advisory-first do recibo de carga [CO-3.4]", () => {
  // Monta um repo governado mínimo onde `collectHandoffFacts` RESOLVE a spec
  // (branch feat/spec-0024-foo + dir da spec), pré-condição p/ o caminho advisory.
  async function governedRepo(): Promise<string> {
    const tempDir = await fsAsync.mkdtemp(path.join(os.tmpdir(), "ws-receipt-"));
    execSync("git init -b feat/spec-0024-foo", { cwd: tempDir, stdio: "ignore" });
    execSync("git config user.email test@example.com", { cwd: tempDir, stdio: "ignore" });
    execSync("git config user.name Test", { cwd: tempDir, stdio: "ignore" });
    execSync('git commit --allow-empty -m "initial"', { cwd: tempDir, stdio: "ignore" });
    const specDir = path.join(tempDir, ".governance", "specs", "0024-foo");
    await fsAsync.mkdir(specDir, { recursive: true });
    await fsAsync.writeFile(
      path.join(specDir, "state.yml"),
      "stage: planning\ngate:\n  status: open\nfocus: []\nnext: []\n"
    );
    return tempDir;
  }
  const PUBLISH = { status: "active", updatedBy: "@rosanarezende", title: "Foo Spec" } as const;

  it("missing → advisory 'nenhuma carga registrada', exit 0, e NÃO escreve recibo (regressão anti-reescrita)", async () => {
    const tempDir = await governedRepo();
    try {
      const logger = new CollectingLogger();
      const fs = new NodeWorkflowFileSystem(tempDir);
      const code = await runPublishState({ repoRoot: tempDir, logger, fs }, { ...PUBLISH });

      expect(code).toBe(0); // advisory-first: recibo ausente NÃO bloqueia a publicação
      expect(logger.lines.join("\n")).toContain(
        "⚠️  [advisory] retomada não reconciliada — nenhuma carga registrada"
      );
      // regressão do bug `loadHandoffSnapshot`: o caminho advisory não cria recibo
      const rp = receiptPath(tempDir);
      expect(rp && fs2.existsSync(rp)).toBeFalsy();
    } finally {
      await fsAsync.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("fresh → nenhum advisory emitido, exit 0", async () => {
    const tempDir = await governedRepo();
    try {
      const facts = collectHandoffFacts(tempDir).facts;
      writeReceipt(tempDir, createLoadReceipt(facts, deriveHandoff(facts).seal));

      const logger = new CollectingLogger();
      const fs = new NodeWorkflowFileSystem(tempDir);
      const code = await runPublishState({ repoRoot: tempDir, logger, fs }, { ...PUBLISH });

      expect(code).toBe(0);
      expect(logger.lines.join("\n")).not.toContain("[advisory]");
    } finally {
      await fsAsync.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("stale-head → advisory de HEAD, exit 0, e recibo PERMANECE stale (não reescrito)", async () => {
    const tempDir = await governedRepo();
    try {
      const facts = collectHandoffFacts(tempDir).facts;
      writeReceipt(tempDir, { ...createLoadReceipt(facts, "qualquer"), head: "0000000" });

      const logger = new CollectingLogger();
      const fs = new NodeWorkflowFileSystem(tempDir);
      const code = await runPublishState({ repoRoot: tempDir, logger, fs }, { ...PUBLISH });

      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(
        /\[advisory\] retomada não reconciliada — recibo stale: HEAD carregado 0000000 ≠ HEAD atual/
      );
      // regressão: o recibo stale NÃO foi reescrito para fresh pelo caminho advisory
      const rp = receiptPath(tempDir)!;
      expect(JSON.parse(fs2.readFileSync(rp, "utf8")).head).toBe("0000000");
    } finally {
      await fsAsync.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("stale-sources → advisory nomeando fontes divergentes, exit 0", async () => {
    const tempDir = await governedRepo();
    try {
      const facts = collectHandoffFacts(tempDir).facts;
      // mesmo HEAD, selo divergente + sources vazias ⇒ todas as fontes atuais divergem
      writeReceipt(tempDir, { ...createLoadReceipt(facts, "selo-divergente"), sources: {} });

      const logger = new CollectingLogger();
      const fs = new NodeWorkflowFileSystem(tempDir);
      const code = await runPublishState({ repoRoot: tempDir, logger, fs }, { ...PUBLISH });

      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(
        /\[advisory\] retomada não reconciliada — recibo stale: fontes divergiram \(/
      );
    } finally {
      await fsAsync.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("invalid → advisory de recibo inválido, exit 0", async () => {
    const tempDir = await governedRepo();
    try {
      const rp = receiptPath(tempDir)!;
      await fsAsync.mkdir(path.dirname(rp), { recursive: true });
      await fsAsync.writeFile(rp, "{ recibo quebrado", "utf8");

      const logger = new CollectingLogger();
      const fs = new NodeWorkflowFileSystem(tempDir);
      const code = await runPublishState({ repoRoot: tempDir, logger, fs }, { ...PUBLISH });

      expect(code).toBe(0);
      expect(logger.lines.join("\n")).toMatch(
        /\[advisory\] retomada não reconciliada — recibo inválido \(/
      );
    } finally {
      await fsAsync.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("degradação diagnosticável → contexto de carga indisponível (spec irresolvível) é NOMEADO, não engolido", async () => {
    const tempDir = await fsAsync.mkdtemp(path.join(os.tmpdir(), "ws-receipt-degr-"));
    try {
      // branch `main` + sem .governance ⇒ collectHandoffFacts lança (spec irresolvível)
      execSync("git init -b main", { cwd: tempDir, stdio: "ignore" });
      execSync("git config user.email test@example.com", { cwd: tempDir, stdio: "ignore" });
      execSync("git config user.name Test", { cwd: tempDir, stdio: "ignore" });
      execSync('git commit --allow-empty -m "initial"', { cwd: tempDir, stdio: "ignore" });

      const logger = new CollectingLogger();
      const fs = new NodeWorkflowFileSystem(tempDir);
      await runPublishState({ repoRoot: tempDir, logger, fs }, { ...PUBLISH });

      const out = logger.lines.join("\n");
      expect(out).toContain("ℹ️  [advisory] verificação de recibo de carga ignorada");
      expect(out).toContain("contexto de carga indisponível");
      // degradação é advisory (ℹ️), NUNCA um erro que bloqueie
      expect(out).not.toMatch(/ERR:.*recibo de carga/);
    } finally {
      await fsAsync.rm(tempDir, { recursive: true, force: true });
    }
  });
});
