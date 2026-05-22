import { execSync } from "node:child_process";
import * as fsAsync from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { NodeWorkflowFileSystem } from "../infrastructure/filesystem/NodeWorkflowFileSystem.js";
import { parseActiveSpecs } from "../infrastructure/yaml/activeSpecsSerializer.js";
import {
  ClipboardWriter,
  InputReader,
  Logger,
  runContinue,
  runPublishState,
  runWorkflow,
} from "./workflow.js";

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

class ScriptedReader implements InputReader {
  private idx = 0;
  closed = false;
  constructor(private readonly answers: ReadonlyArray<string>) {}
  question(): Promise<string> {
    const answer = this.answers[this.idx++];
    return Promise.resolve(answer ?? "q");
  }
  close(): void {
    this.closed = true;
  }
}

class NullClipboard implements ClipboardWriter {
  async copy(): Promise<boolean> {
    return false;
  }
}

describe("CLI — workflow integration [BR-WORKFLOW-RUNTIME-INDEX-E2E]", () => {
  it("Cenário 1 — DADO branch + state.yml reais QUANDO publish-state ENTÃO escreve active-specs.yml parseável com a entry corrente", async () => {
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
      const indexPath = path.join(tempDir, ".governance", "runtime", "active-specs.yml");
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

  it("Cenário 2 — DADO active-specs.yml com 2 entries (uma com spec_path existente, outra sem) QUANDO runWorkflow ENTÃO lista entries E narra drift da ausente", async () => {
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

      const indexDir = path.join(tempDir, ".governance", "runtime");
      await fsAsync.mkdir(indexDir, { recursive: true });
      // entry 0024 com spec_path existente; entry 0099 com spec_path inexistente (drift)
      await fsAsync.writeFile(
        path.join(indexDir, "active-specs.yml"),
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

      // execute
      const logger = new CollectingLogger();
      const reader = new ScriptedReader(["q"]);
      const fs = new NodeWorkflowFileSystem(tempDir);
      const code = await runWorkflow({
        repoRoot: tempDir,
        logger,
        reader,
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

      const indexDir = path.join(tempDir, ".governance", "runtime");
      await fsAsync.mkdir(indexDir, { recursive: true });
      await fsAsync.writeFile(
        path.join(indexDir, "active-specs.yml"),
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

      const indexDir = path.join(tempDir, ".governance", "runtime");
      await fsAsync.mkdir(indexDir, { recursive: true });
      await fsAsync.writeFile(
        path.join(indexDir, "active-specs.yml"),
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
      const indexYaml = await fsAsync.readFile(path.join(indexDir, "active-specs.yml"), "utf8");
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
});
