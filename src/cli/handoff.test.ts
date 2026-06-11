import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { renderHandoff } from "./handoff.js";

/**
 * Inicializa git real no diretório e aponta HEAD para `branchName` (branch
 * unborn basta para `git branch --show-current`). Cross-platform: execFileSync
 * com array de args, sem shell.
 */
function initGitOnBranch(repo: string, branchName: string): void {
  execFileSync("git", ["init", "--quiet"], { cwd: repo, stdio: "ignore" });
  execFileSync("git", ["symbolic-ref", "HEAD", `refs/heads/${branchName}`], {
    cwd: repo,
    stdio: "ignore",
  });
}

function tempRepo(): string {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "handoff-"));
  const spec = path.join(repo, ".governance", "specs", "0024-context-architecture");
  fs.mkdirSync(path.join(repo, ".core", "governance"), { recursive: true });
  fs.mkdirSync(path.join(repo, ".core", "rules", "_meta"), { recursive: true });
  fs.mkdirSync(path.join(repo, ".governance", "runtime", "specs"), { recursive: true });
  fs.mkdirSync(spec, { recursive: true });
  fs.writeFileSync(path.join(repo, "AGENTS.md"), "# AGENTS\n");
  fs.writeFileSync(path.join(repo, ".core", "governance", "script-contracts.yml"), "x: y\n");
  fs.writeFileSync(path.join(repo, ".core", "rules", "catalog.md"), "# Rules\n");
  fs.writeFileSync(path.join(repo, ".core", "rules", "_meta", "rules.json"), "{}\n");
  fs.writeFileSync(path.join(spec, "plan.md"), "# Plan\n");
  fs.writeFileSync(path.join(spec, "knowledge-backfill.yml"), "version: 1\nentries: []\n");
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
      "    checkpoint: checkpoint-runtime-bootstrap-readiness",
      "  prs:",
      "    concluded: []",
      "    active:",
      "      - id: co-knowledge",
      "        github_pr: 37",
      "        role: execution",
      "        terminal: false",
      "        sequence: 1",
      "        checkpoints:",
      "          - checkpoint-runtime-bootstrap-readiness",
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

describe("handoff [ADR-0022]", () => {
  it("DADO spec resolvida por identifier QUANDO renderHandoff ENTÃO emite contexto situado", () => {
    const repo = tempRepo();

    const text = renderHandoff(repo, { identifier: "0024" }).text;

    expect(text).toContain("# Handoff situado");
    expect(text).toContain("- spec: 0024-context-architecture");
    expect(text).toContain("- cursor: co-knowledge · checkpoint-runtime-bootstrap-readiness");
    expect(text).toContain("- PR ativo: #37");
    expect(text).toContain(".core/governance/script-contracts.yml");
    expect(text).toContain("AGENTS.md e canal/stub");
    expect(text).not.toContain("[TODO humano]");
  });

  it("DADO modo hybrid QUANDO renderHandoff ENTÃO inclui slots humanos sem decidir estado", () => {
    const repo = tempRepo();

    const text = renderHandoff(repo, { identifier: "0024", hybrid: true }).text;

    expect(text).toContain("## 11. Slots humanos (hybrid)");
    expect(text).toContain("[TODO humano]");
  });
});

// ── Núcleo CO-4: fatos + freshness + selo + próxima ação no output ──────────

describe("handoff · núcleo derivado [CO-4]", () => {
  it("DADO repo resolvido ENTÃO output traz saúde das fontes, próxima ação, proibições e selo", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");

    const text = renderHandoff(repo, { identifier: "0024" }).text;

    expect(text).toContain("## 2. Saúde das fontes");
    expect(text).toContain("- state.yml · fresh ·");
    expect(text).toContain("## 4. Próxima ação única (derivada)");
    expect(text).toContain("- base factual:");
    expect(text).toContain("## 5. Ações proibidas (derivadas do estado)");
    expect(text).toContain("## 10. Selo de geração");
    expect(text).toMatch(/- selo: [0-9a-f]{12} \(contrato v1;/);
  });

  it("DADO fonte remota não habilitada ENTÃO pull-request é declarado unavailable (nunca inventado)", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");

    const text = renderHandoff(repo, { identifier: "0024" }).text;

    expect(text).toContain("- pull-request · unavailable ·");
    expect(text).toContain("PR ativo: #37 (estado remoto NAO observado)");
    expect(text).not.toMatch(/PR ativo: #37 \(open/i);
  });

  it("DADO coletor remoto que FALHA (API indisponível) ENTÃO handoff continua com degradação explícita", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");

    const text = renderHandoff(repo, {
      identifier: "0024",
      remote: () => {
        throw new Error("gh: connection refused");
      },
    }).text;

    expect(text).toContain("# Handoff situado");
    expect(text).toContain("- pull-request · unavailable ·");
    expect(text).toContain("gh: connection refused");
  });

  it("DADO coletor remoto injetado ENTÃO PR/CI aparecem na retomada factual", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");

    const text = renderHandoff(repo, {
      identifier: "0024",
      remote: (prNumber) => ({
        number: prNumber,
        state: "open",
        isDraft: true,
        baseRefName: "feat/spec-0024-base",
        headRefName: "feat/spec-0024-co-knowledge",
        headRefOid: "abc1234567890",
        checks: { pass: 9, fail: 0, pending: 1 },
        bodyReadyReasons: [],
      }),
    }).text;

    expect(text).toContain("- PR ativo: #37 (open, Draft; base feat/spec-0024-base; head abc1234)");
    expect(text).toContain("- CI: 9 pass · 0 fail · 1 pending");
    expect(text).toContain("- pull-request · fresh ·");
  });

  it("DADO duas gerações com as MESMAS fontes ENTÃO o selo é idêntico (determinismo, sem timestamp)", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");

    const first = renderHandoff(repo, { identifier: "0024" }).text;
    const second = renderHandoff(repo, { identifier: "0024" }).text;

    const seal = (text: string) => /- selo: ([0-9a-f]{12})/.exec(text)?.[1];
    expect(seal(first)).toBeDefined();
    expect(seal(first)).toBe(seal(second));
  });

  it("DADO mudança em uma fonte (state.yml) ENTÃO o selo muda", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    const seal = (text: string) => /- selo: ([0-9a-f]{12})/.exec(text)?.[1];

    const before = seal(renderHandoff(repo, { identifier: "0024" }).text);
    const statePath = path.join(
      repo,
      ".governance",
      "specs",
      "0024-context-architecture",
      "state.yml"
    );
    fs.appendFileSync(statePath, "\n# comentario novo\n");
    const after = seal(renderHandoff(repo, { identifier: "0024" }).text);

    expect(before).not.toBe(after);
  });

  it("DADO geração do handoff ENTÃO NENHUM arquivo é persistido (stdout é a superfície)", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    const runtimeDir = path.join(repo, ".governance", "runtime");
    const listAll = (dir: string): string[] =>
      fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((e) =>
          e.isDirectory() ? listAll(path.join(dir, e.name)) : [path.join(dir, e.name)]
        );
    const before = listAll(runtimeDir).sort();

    renderHandoff(repo, { identifier: "0024" });

    expect(listAll(runtimeDir).sort()).toEqual(before);
    expect(fs.existsSync(path.join(runtimeDir, "handoff"))).toBe(false);
  });

  it("DADO narrativa next[] presente ENTÃO é rotulada como derivada, não fonte", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");

    const text = renderHandoff(repo, { identifier: "0024" }).text;

    expect(text).toContain("## 7. Narrativa derivada (não é fonte da próxima ação)");
  });
});

// Regressão do dogfood CO-4 (2026-06-11): handoff mascarou branch stale do
// active.yml porque (a) a resolução era projeção-primeiro e (b) os fallbacks
// eram silenciosos. Contrato cravado aqui: fallback NUNCA silencioso; projeção
// divergente NUNCA apresentada como íntegra.
describe("handoff · diagnóstico de projeção [dogfood CO-4]", () => {
  it("DADO projeção com branch stale e branch factual da mesma spec ENTÃO avisa DIVERGENTE e exige reconciliação", () => {
    const repo = tempRepo(); // active.yml projeta feat/spec-0024-co-knowledge
    initGitOnBranch(repo, "feat/spec-0024-co-projection");

    const text = renderHandoff(repo, { identifier: "0024" }).text;

    expect(text).toContain("## ⚠ Aviso de projeção — reconcilie antes de confiar");
    expect(text).toContain('DIVERGENTE (projeta branch "feat/spec-0024-co-knowledge"');
    expect(text).toContain("feat/spec-0024-co-projection");
    expect(text).toContain("workflow publish-state");
    // disponibilidade preservada: o handoff ainda é gerado por completo
    expect(text).toContain("## 1. Retomada factual");
    expect(text).toContain("- spec: 0024-context-architecture");
  });

  it("DADO projeção reconciliada (branch projetada == factual) ENTÃO sem aviso e linha 'fiel'", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");

    const text = renderHandoff(repo, { identifier: "0024" }).text;

    expect(text).not.toContain("## ⚠ Aviso de projeção");
    expect(text).toContain("- projecao specs/active.yml: fiel aos fatos observaveis");
  });

  it("DADO projeção ausente QUANDO resolve por detecção canônica de branch ENTÃO segue com aviso explícito", () => {
    const repo = tempRepo();
    fs.rmSync(path.join(repo, ".governance", "runtime", "specs", "active.yml"));
    initGitOnBranch(repo, "feat/spec-0024-co-projection");

    const text = renderHandoff(repo).text;

    expect(text).toContain("- spec: 0024-context-architecture");
    expect(text).toContain("- projecao specs/active.yml: ausente");
    expect(text).toContain("AUSENTE");
    expect(text).toContain("workflow publish-state");
  });

  it("DADO branch fora do padrão canônico resolvida via projeção ENTÃO declara o fallback", () => {
    const repo = tempRepo();
    // entry projetada com branch off-pattern; spec só é encontrável pela projeção
    const indexPath = path.join(repo, ".governance", "runtime", "specs", "active.yml");
    fs.writeFileSync(
      indexPath,
      fs.readFileSync(indexPath, "utf8").replace("feat/spec-0024-co-knowledge", "wip/retomada")
    );
    initGitOnBranch(repo, "wip/retomada");

    const text = renderHandoff(repo).text;

    expect(text).toContain("- spec: 0024-context-architecture");
    expect(text).toContain("resolvida pela PROJEÇÃO");
  });

  it("DADO branch canônica sem entry na projeção ENTÃO pede publish-state sem bloquear", () => {
    const repo = tempRepo();
    fs.writeFileSync(
      path.join(repo, ".governance", "runtime", "specs", "active.yml"),
      "version: 1\nactive_specs: []\n"
    );
    initGitOnBranch(repo, "feat/spec-0024-co-projection");

    const text = renderHandoff(repo).text;

    expect(text).toContain("- spec: 0024-context-architecture");
    expect(text).toContain("- projecao specs/active.yml: sem entry para esta spec");
    expect(text).toContain("workflow publish-state");
  });
});
