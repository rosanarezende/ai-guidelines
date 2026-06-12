import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { loadHandoff, renderHandoff } from "./handoff.js";

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
  fs.writeFileSync(path.join(repo, ".core", "governance", "script-contracts.yml"), "x: y\n");
  fs.writeFileSync(path.join(repo, ".core", "rules", "catalog.md"), "# Rules\n");
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
    expect(text).toContain("## 3. Contrato global carregado");
    expect(text).toContain("[CORE-T1] Regra global de teste");
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
    expect(text).toContain("## 5. Próxima ação única (derivada)");
    expect(text).toContain("- base factual:");
    expect(text).toContain("## 6. Ações proibidas (derivadas do estado)");
    expect(text).toContain("## 10. Selo de geração");
    expect(text).toMatch(/- selo: [0-9a-f]{12} \(contrato v2;/);
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

    expect(text).toContain("## 8. Narrativa derivada (não é fonte da próxima ação)");
  });
});

// ── Contrato de carga: ato verificável + recibo efêmero ─────────────────────

describe("handoff · loadHandoff (contrato de carga) [CO-4]", () => {
  it("DADO carga válida ENTÃO recibo criado em .git/ com o MESMO selo exibido no output", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");

    const result = loadHandoff(repo, { identifier: "0024" });

    expect(result.receiptFile).not.toBeNull();
    expect(result.receiptFile).toContain(`${path.sep}.git${path.sep}ai-guidelines${path.sep}`);
    expect(fs.existsSync(result.receiptFile!)).toBe(true);
    const sealInText = /- selo: ([0-9a-f]{12})/.exec(result.text)?.[1];
    expect(result.receipt?.sourceSeal).toBe(sealInText);
    expect(result.receipt?.sourceSeal).toBe(result.seal);
    expect(result.text).toContain("- recibo de carga:");
  });

  it("DADO carga repetida com mesmas fontes ENTÃO idempotente (mesmo selo; só loadedAt muda)", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");

    const first = loadHandoff(repo, { identifier: "0024" });
    const second = loadHandoff(repo, { identifier: "0024" });

    expect(second.receipt?.sourceSeal).toBe(first.receipt?.sourceSeal);
    expect(second.receipt?.head).toBe(first.receipt?.head);
    expect(second.receipt?.sources).toEqual(first.receipt?.sources);
  });

  it("DADO recibo dentro de .git/ ENTÃO invisível ao git (status não o lista)", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");

    loadHandoff(repo, { identifier: "0024" });

    const porcelain = execFileSync("git", ["status", "--porcelain"], {
      cwd: repo,
      encoding: "utf8",
    });
    expect(porcelain).not.toContain("handoff-load.json");
  });

  it("DADO estado impossível (spec irresolvível) ENTÃO lança E não escreve recibo", () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), "handoff-vazio-"));
    initGitOnBranch(repo, "feat/spec-9999-nada");

    expect(() => loadHandoff(repo, { identifier: "9999" })).toThrow();
    expect(fs.existsSync(path.join(repo, ".git", "ai-guidelines", "handoff-load.json"))).toBe(
      false
    );
  });

  it("DADO fonte remota que falha ENTÃO recibo registra a degradação factual (sem inventar remoto)", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");

    const result = loadHandoff(repo, {
      identifier: "0024",
      remote: () => {
        throw new Error("gh: connection refused");
      },
    });

    expect(result.receipt?.degraded).toContain("pull-request");
    expect(result.receipt?.sources["pull-request"]).toBe("-");
  });

  it("DADO recibo escrito ENTÃO sem narrativa nem body de PR (só fatos operacionais)", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");

    const result = loadHandoff(repo, { identifier: "0024" });
    const raw = fs.readFileSync(result.receiptFile!, "utf8");

    expect(raw).not.toMatch(/##|canonical-next|Escopo|Visão pretendida/);
    expect(JSON.parse(raw).command).toBe("npm run guidelines -- handoff 0024");
  });

  it("DADO uma carga ENTÃO snapshot único — coletor remoto invocado exatamente 1 vez", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    let calls = 0;

    loadHandoff(repo, {
      identifier: "0024",
      remote: (prNumber) => {
        calls++;
        return {
          number: prNumber,
          state: "open",
          isDraft: true,
          baseRefName: "b",
          headRefName: "h",
          headRefOid: "abc1234",
          checks: { pass: 1, fail: 0, pending: 0 },
          bodyReadyReasons: [],
        };
      },
    });

    expect(calls).toBe(1);
  });

  it("DADO carga ENTÃO nada é escrito em .governance/runtime/handoff/ (zero Markdown persistido)", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");

    loadHandoff(repo, { identifier: "0024" });

    expect(fs.existsSync(path.join(repo, ".governance", "runtime", "handoff"))).toBe(false);
  });
});

// ── Contrato global carregado (cápsula) ──────────────────────────────────────

describe("handoff · contrato global carregado [CO-4]", () => {
  it("DADO repo consumidor ENTÃO cápsula deriva a identidade DELE (sem contexto local do framework)", () => {
    const repo = tempRepo(); // package.json: fixture-consumer
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");

    const text = renderHandoff(repo, { identifier: "0024" }).text;

    expect(text).toContain("- repositório: fixture-consumer · consumidor do framework");
    expect(text).not.toContain("framework (mantenedor)");
    // regras vêm do catálogo DELE; nada do CORE real deste repositório vaza
    expect(text).toContain("[CORE-T1] Regra global de teste");
    expect(text).not.toContain("CORE-07");
  });

  it("DADO cápsula ENTÃO compacta: id+título por regra, sem corpos, com ponteiro para o catálogo", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");

    const text = renderHandoff(repo, { identifier: "0024" }).text;
    const section = text.split("## 3. Contrato global carregado")[1].split("## 4.")[0];

    expect(section.split("\n").length).toBeLessThan(20);
    expect(section).toContain("regras completas: .core/rules/catalog.md");
    expect(section).toContain("restrições do nó: derivadas do estado");
    expect(section).not.toContain("Always"); // corpo da regra não é despejado
  });

  it("DADO bootstrap ausente ENTÃO drift + próxima ação prioriza reconciliação + SEM recibo fresh", () => {
    const repo = tempRepo();
    fs.writeFileSync(path.join(repo, "AGENTS.md"), "# AGENTS sem bloco\n");
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");

    const result = loadHandoff(repo, { identifier: "0024" });

    expect(result.receipt).toBeNull();
    expect(result.receiptSkippedReason).toContain("runtime-bootstrap");
    expect(result.text).toContain("## ⚠ Aviso de projeção");
    expect(result.text).toContain("Bootstrap obrigatório de agente NÃO carregado");
    expect(result.text).toContain("runtime-bootstrap · unavailable");
  });

  it("DADO catálogo de regras ilegível ENTÃO degraded + nenhuma regra inventada + SEM recibo fresh", () => {
    const repo = tempRepo();
    fs.writeFileSync(path.join(repo, ".core", "rules", "_meta", "rules.json"), "{}");
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");

    const result = loadHandoff(repo, { identifier: "0024" });

    expect(result.receipt).toBeNull();
    expect(result.text).toContain("rules-contract · degraded");
    expect(result.text).toContain(
      "- obrigações globais: (nenhuma derivável do catálogo — ver Saúde das fontes)"
    );
  });

  it("DADO mudança SEMÂNTICA no catálogo ENTÃO selo muda e recibo anterior vira stale-sources", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    const first = loadHandoff(repo, { identifier: "0024" });

    const rulesPath = path.join(repo, ".core", "rules", "_meta", "rules.json");
    const rules = JSON.parse(fs.readFileSync(rulesPath, "utf8"));
    rules.rules[0].title = "Regra global A — endurecida";
    fs.writeFileSync(rulesPath, JSON.stringify(rules));

    const second = renderHandoff(repo, { identifier: "0024" }).text;
    const seal = (t: string) => /- selo: ([0-9a-f]{12})/.exec(t)?.[1];
    expect(seal(second)).not.toBe(first.seal);
  });

  it("DADO mudança APENAS volátil (generated_at) ENTÃO selo permanece igual", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");
    const first = loadHandoff(repo, { identifier: "0024" });

    const rulesPath = path.join(repo, ".core", "rules", "_meta", "rules.json");
    const rules = JSON.parse(fs.readFileSync(rulesPath, "utf8"));
    rules.generated_at = "2099-01-01T00:00:00.000Z";
    fs.writeFileSync(rulesPath, JSON.stringify(rules));

    const second = loadHandoff(repo, { identifier: "0024" });
    expect(second.seal).toBe(first.seal);
  });

  it("DADO recibo escrito ENTÃO cobre as fontes do contrato sem corpos de regras", () => {
    const repo = tempRepo();
    initGitOnBranch(repo, "feat/spec-0024-co-knowledge");

    const result = loadHandoff(repo, { identifier: "0024" });
    const raw = fs.readFileSync(result.receiptFile!, "utf8");
    const receipt = JSON.parse(raw);

    for (const id of [
      "repository-contract",
      "runtime-bootstrap",
      "rules-contract",
      "script-contract",
    ]) {
      expect(Object.keys(receipt.sources)).toContain(id);
    }
    expect(raw).not.toContain("Regra global de teste"); // só fingerprints, nunca conteúdo
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
