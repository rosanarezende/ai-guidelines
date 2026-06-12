import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { parseArgs, runHandoffCheck } from "./handoffCheck.js";
import { loadHandoff } from "./handoff.js";

function initGitOnBranch(repo: string, branchName: string): void {
  execFileSync("git", ["init", "--quiet"], { cwd: repo, stdio: "ignore" });
  execFileSync("git", ["symbolic-ref", "HEAD", `refs/heads/${branchName}`], {
    cwd: repo,
    stdio: "ignore",
  });
}

/** Mesmo fixture mínimo do handoff.test (spec 0024 com topology e PR #37). */
function tempRepo(): string {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "handoff-check-"));
  const spec = path.join(repo, ".governance", "specs", "0024-context-architecture");
  fs.mkdirSync(path.join(repo, ".governance", "runtime", "specs"), { recursive: true });
  fs.mkdirSync(path.join(repo, ".core", "rules", "_meta"), { recursive: true });
  fs.mkdirSync(path.join(repo, ".core", "governance"), { recursive: true });
  fs.writeFileSync(path.join(repo, ".core", "governance", "script-contracts.yml"), "x: y\n");
  fs.mkdirSync(spec, { recursive: true });
  fs.writeFileSync(
    path.join(repo, "package.json"),
    JSON.stringify({ name: "fixture-consumer", description: "Repo de teste do handoff" })
  );
  fs.writeFileSync(
    path.join(repo, "AGENTS.md"),
    "# AGENTS\n\n<AI_GUIDELINES>\n\n## Runtime Bootstrap\n\n- Repository state beats transcript.\n\n</AI_GUIDELINES>\n"
  );
  fs.writeFileSync(
    path.join(repo, ".core", "rules", "_meta", "rules.json"),
    JSON.stringify({
      schema_version: "1.0",
      generated_at: "2026-01-01T00:00:00.000Z",
      rules: [
        {
          id: "CORE-T1",
          scope: "universal",
          tags: ["always_injected"],
          title: "Regra global de teste",
          file: ".core/rules/top/test.md",
        },
        { id: "OPT-T1", scope: "opt-in", tags: [], title: "Regra opcional", file: "x.md" },
      ],
    })
  );
  fs.writeFileSync(path.join(spec, "tasks.md"), "- [ ] **Checkpoint co-knowledge** — Escopo: x.\n");
  fs.writeFileSync(
    path.join(repo, ".governance", "runtime", "specs/active.yml"),
    [
      "version: 1",
      "active_specs:",
      "  - id: '0024'",
      "    slug: context-architecture",
      "    branch: feat/spec-0024-co-knowledge",
      "    stage: implementation",
      "    status: active",
      "    spec_path: .governance/specs/0024-context-architecture",
      "    updated_at: '2026-06-08T00:00:00.000Z'",
    ].join("\n")
  );
  fs.writeFileSync(
    path.join(spec, "state.yml"),
    [
      "stage: implementation",
      "gate:",
      "  status: closed",
      "focus: []",
      "next:",
      "  - 'canonical-next: co-knowledge'",
      "topology:",
      "  cursor:",
      "    pr: co-knowledge",
      "    checkpoint: checkpoint-co-knowledge",
      "  prs:",
      "    concluded: []",
      "    active:",
      "      - id: co-knowledge",
      "        github_pr: 37",
      "        role: execution",
      "        terminal: false",
      "        sequence: 1",
      "        checkpoints:",
      "          - checkpoint-co-knowledge",
      "    planned:",
      "      - id: integration-final",
      "        github_pr: null",
      "        role: integration",
      "        terminal: true",
      "        sequence: null",
      "        checkpoints:",
      "          - review-and-merge",
    ].join("\n")
  );
  return repo;
}

function fakeLogger(): {
  lines: string[];
  logger: { info: (m: string) => void; error: (m: string) => void };
} {
  const lines: string[] = [];
  return {
    lines,
    logger: { info: (m) => lines.push(m), error: (m) => lines.push(`ERR ${m}`) },
  };
}

describe("handoff:check · advisory-first [CO-4]", () => {
  it("parseArgs aceita --spec, --spec=, posicional e --no-remote", () => {
    expect(parseArgs(["--spec", "0024"])).toEqual({ identifier: "0024" });
    expect(parseArgs(["--spec=0024", "--no-remote"])).toEqual({
      identifier: "0024",
      noRemote: true,
    });
    expect(parseArgs(["0024"])).toEqual({ identifier: "0024" });
  });

  it("DADO estado coerente ENTÃO reporta fontes + selo + próxima ação e retorna 0", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    const { lines, logger } = fakeLogger();

    const code = runHandoffCheck(repo, { identifier: "0024" }, logger, null);

    expect(code).toBe(0);
    const out = lines.join("\n");
    expect(out).toContain("handoff:check (advisory)");
    expect(out).toMatch(/selo [0-9a-f]{12}/);
    expect(out).toContain("próxima ação derivada:");
    // fonte remota não habilitada (override null) é DECLARADA, não silenciosa
    expect(out).toContain("fonte indisponível: pull-request");
  });

  it("DADO drift de projeção ENTÃO warning estruturado SEM bloquear (exit 0) e compõe checks bloqueantes", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-OUTRA-BRANCH");
    const { lines, logger } = fakeLogger();

    const code = runHandoffCheck(repo, {}, logger, null);

    expect(code).toBe(0);
    const out = lines.join("\n");
    expect(out).toContain("⚠ drift:");
    expect(out).toContain("active-specs:check");
    expect(out).toContain("workflow publish-state");
  });

  it("DADO spec irresolvível (estado impossível) ENTÃO exit 1", () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), "handoff-check-vazio-"));
    const { lines, logger } = fakeLogger();

    const code = runHandoffCheck(repo, { identifier: "9999" }, logger, null);

    expect(code).toBe(1);
    expect(lines.join("\n")).toContain("estado irrecuperável");
  });

  it("NÃO depende de Markdown persistido (rederiva direto das fontes)", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    const { logger } = fakeLogger();

    // nenhum .governance/runtime/handoff/ existe — e o check funciona
    expect(fs.existsSync(path.join(repo, ".governance", "runtime", "handoff"))).toBe(false);
    expect(runHandoffCheck(repo, { identifier: "0024" }, logger, null)).toBe(0);
    // e continua não existindo depois (zero persistência)
    expect(fs.existsSync(path.join(repo, ".governance", "runtime", "handoff"))).toBe(false);
  });
});

// ── Reconcile-on-load: estado do recibo na consulta ─────────────────────────

describe("handoff:check · recibo de carga [CO-4]", () => {
  it("DADO recibo ausente ENTÃO advisory com comando de recarga (sem bloquear)", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    const { lines, logger } = fakeLogger();

    const code = runHandoffCheck(repo, { identifier: "0024" }, logger, null);

    expect(code).toBe(0);
    const out = lines.join("\n");
    expect(out).toContain("recibo de carga: ausente");
    expect(out).toContain("npm run guidelines -- handoff 0024");
  });

  it("DADO carga feita ENTÃO check reporta recibo fresh (retomada reconciliada)", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    loadHandoff(repo, { identifier: "0024", remote: null });
    const { lines, logger } = fakeLogger();

    const code = runHandoffCheck(repo, { identifier: "0024" }, logger, null);

    expect(code).toBe(0);
    expect(lines.join("\n")).toContain("recibo de carga: fresh — retomada reconciliada");
  });

  it("DADO fonte mudada após a carga ENTÃO check reporta STALE nomeando a fonte (nunca reescreve o recibo)", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    loadHandoff(repo, { identifier: "0024", remote: null });
    const receiptFile = path.join(repo, ".git", "ai-guidelines", "handoff-load.json");
    const before = fs.readFileSync(receiptFile, "utf8");
    fs.appendFileSync(
      path.join(repo, ".governance", "specs", "0024-context-architecture", "tasks.md"),
      "- [ ] **Checkpoint co-knowledge** — nova tarefa.\n"
    );
    const { lines, logger } = fakeLogger();

    const code = runHandoffCheck(repo, { identifier: "0024" }, logger, null);

    expect(code).toBe(0);
    const out = lines.join("\n");
    expect(out).toContain("recibo de carga: STALE (fontes)");
    expect(out).toContain("tasks.md");
    expect(out).toContain("npm run guidelines -- handoff 0024");
    // recibo stale NUNCA é atualizado silenciosamente por um check
    expect(fs.readFileSync(receiptFile, "utf8")).toBe(before);
  });

  it("DADO recibo corrompido ENTÃO check reporta inválido com comando de recarga", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    const receiptDir = path.join(repo, ".git", "ai-guidelines");
    fs.mkdirSync(receiptDir, { recursive: true });
    fs.writeFileSync(path.join(receiptDir, "handoff-load.json"), "{quebrado");
    const { lines, logger } = fakeLogger();

    const code = runHandoffCheck(repo, { identifier: "0024" }, logger, null);

    expect(code).toBe(0);
    const out = lines.join("\n");
    expect(out).toContain("recibo de carga: inválido");
    expect(out).toContain("npm run guidelines -- handoff 0024");
  });

  it("DADO bootstrap alterado após a carga ENTÃO check nomeia runtime-bootstrap como divergente", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    loadHandoff(repo, { identifier: "0024", remote: null });
    fs.writeFileSync(
      path.join(repo, "AGENTS.md"),
      "# AGENTS\n\n<AI_GUIDELINES>\n\n## Runtime Bootstrap v2 — regra nova\n\n</AI_GUIDELINES>\n"
    );
    const { lines, logger } = fakeLogger();

    runHandoffCheck(repo, { identifier: "0024" }, logger, null);

    const out = lines.join("\n");
    expect(out).toContain("recibo de carga: STALE (fontes)");
    expect(out).toContain("runtime-bootstrap");
  });

  it("DADO script-contracts alterado após a carga ENTÃO check nomeia script-contract como divergente", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    loadHandoff(repo, { identifier: "0024", remote: null });
    fs.writeFileSync(
      path.join(repo, ".core", "governance", "script-contracts.yml"),
      "x: y\nnovo-script: z\n"
    );
    const { lines, logger } = fakeLogger();

    runHandoffCheck(repo, { identifier: "0024" }, logger, null);

    const out = lines.join("\n");
    expect(out).toContain("recibo de carga: STALE (fontes)");
    expect(out).toContain("script-contract");
  });

  it("DADO recarga após mudança ENTÃO recibo volta a fresh (reconciliação)", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    loadHandoff(repo, { identifier: "0024", remote: null });
    fs.appendFileSync(
      path.join(repo, ".governance", "specs", "0024-context-architecture", "tasks.md"),
      "- [ ] **Checkpoint co-knowledge** — nova tarefa.\n"
    );
    loadHandoff(repo, { identifier: "0024", remote: null });
    const { lines, logger } = fakeLogger();

    runHandoffCheck(repo, { identifier: "0024" }, logger, null);

    expect(lines.join("\n")).toContain("recibo de carga: fresh");
  });
});
