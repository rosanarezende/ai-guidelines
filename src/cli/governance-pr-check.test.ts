import { runGovernancePrCheck, GovernancePrCheckInput } from "./governance-pr-check.js";
import { WorkflowFileSystem } from "../app/ports/WorkflowFileSystem.js";

class FakeFileSystem implements WorkflowFileSystem {
  private readonly dirs = new Map<string, string[]>();
  private readonly files = new Map<string, string>();

  directoryExists(path: string): boolean {
    return this.dirs.has(path);
  }

  listDirectory(path: string): string[] {
    return this.dirs.get(path) || [];
  }

  fileExists(path: string): boolean {
    return this.files.has(path);
  }

  readTextFile(path: string): string {
    const content = this.files.get(path);
    if (content === undefined) throw new Error(`File not found: ${path}`);
    return content;
  }

  writeTextFile(path: string, content: string): void {
    this.files.set(path, content);
  }

  currentBranch(): string | null {
    return "feat/spec-0024-ruleset-producibility";
  }

  resolveAbsolute(path: string): string {
    return path;
  }

  addDir(path: string, content: string[]) {
    this.dirs.set(path, content);
  }

  addFile(path: string, content: string) {
    this.files.set(path, content);
  }
}

// ── Fixtures comuns ──────────────────────────────────────────────────────────
// Prompt autorado (preenchido) vs placeholder `<…>` do template (não conta).
const PROMPT = "```text\nGere um infográfico antes/depois do valor entregue…\n```";
const PLACEHOLDER = "```text\n<prompt pronto para colar no gerador>\n```";
const VAZIO = "<!-- preencher -->";

const COMMON_TAIL_FILLED = [
  "## Validação, evidências e checklist",
  "",
  "### Evidências e gates",
  "",
  "- CI: verde",
  "",
  "### Checklist operacional",
  "",
  "- [x] Formatação verde",
  "",
  "## Disclosure de IA",
  "",
  "Implementação assistida por IA.",
  "",
  "## Cross-refs",
  "",
  "- Vazio",
];

/** Body EXECUTION no contrato de DRAFT: intenção preenchida; Valor entregue pode ser placeholder. */
function draftBodyV3(o: { visao?: string; valor?: string } = {}): string {
  return [
    "## Visão pretendida",
    o.visao ?? PROMPT,
    "## Resumo",
    "Migra o toolchain para npm puro; reduz fricção de bootstrap para humanos e agentes.",
    "## Escopo",
    "### Dentro do escopo",
    "- migração do package manager",
    "### Fora do escopo",
    "- CO-3+",
    "## Valor entregue",
    o.valor ?? PLACEHOLDER,
  ].join("\n");
}

/** Body EXECUTION no contrato de READY: entrega preenchida (valor, test plan, validação). */
function readyBodyV3(o: { visao?: string; valor?: string; testPlan?: string } = {}): string {
  return [
    "## Visão pretendida",
    o.visao ?? PROMPT,
    "## Resumo",
    "Migra o toolchain para npm puro; reduz fricção de bootstrap para humanos e agentes.",
    "## Escopo",
    "### Dentro do escopo",
    "- migração do package manager",
    "### Fora do escopo",
    "- CO-3+",
    "## Valor entregue",
    o.valor ?? PROMPT,
    "## Test plan",
    o.testPlan ?? "```bash\nnpm run validate\n```",
    ...COMMON_TAIL_FILLED,
    "## Cross-refs",
    "- Spec: 0024",
  ].join("\n");
}

describe("CLI — governance-pr-check [BR-GOV-PR-CHECK]", () => {
  let fs: FakeFileSystem;

  beforeEach(() => {
    fs = new FakeFileSystem();
    fs.addDir(".governance/specs", ["0024-context-architecture"]);
    fs.addFile(
      ".governance/specs/0024-context-architecture/state.yml",
      `
stage: implementation
gate:
  status: closed
focus: []
next: []
topology:
  cursor:
    pr: ruleset-producibility
    checkpoint: cp-1
  prs:
    active:
      - id: ruleset-producibility
        github_pr: 33
        role: execution
        terminal: false
        sequence: 1
        checkpoints:
          - cp-1
      - id: another
        github_pr: 34
        role: execution
        terminal: true
        sequence: 2
        checkpoints:
          - cp-2
    concluded: []
    planned: []
`
    );
  });

  const baseInput: GovernancePrCheckInput = {
    prNumber: 33,
    prTitle: "[🛠️1️⃣➜] [Spec 0024] O titulo",
    prBody: draftBodyV3(),
    prLabels: [],
    repo: "owner/repo",
    prBranch: "feat/spec-0024-ruleset-producibility",
    // Draft/Ready vem do flag canônico do GitHub (`isDraft`) — o Template v3
    // não duplica lifecycle no corpo visível (ADR 0024).
    isDraft: true,
  };

  it("DADO um PR Draft v3 com intenção preenchida (sem seções de Ready), ENTÃO retorna ok", () => {
    const result = runGovernancePrCheck(baseInput, fs);
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.note).toMatch(/validado contra SSOT/);
      expect(result.note).toMatch(/perfil execution/);
    }
  });

  it("DADO um PR com titulo faltando ➜ (terminalidade falsa), ENTÃO falha", () => {
    const input = { ...baseInput, prTitle: "[🛠️1️⃣] [Spec 0024] titulo errado" };
    const result = runGovernancePrCheck(input, fs);
    expect(result.kind).toBe("fail");
    if (result.kind === "fail") {
      expect(result.reasons[0]).toContain('o prefixo esperado é: "[🛠️1️⃣➜] [Spec 0024]"');
    }
  });

  it("DADO um PR terminal (sem ➜) valido na topologia, ENTÃO retorna ok", () => {
    const input = {
      ...baseInput,
      prNumber: 34,
      prBranch: "feat/spec-0024-another",
      prTitle: "[🛠️2️⃣] [Spec 0024] terminal",
    };
    const result = runGovernancePrCheck(input, fs);
    expect(result.kind).toBe("ok");
  });

  it("DADO body v3 sem linha 'Stack atual', ENTÃO ok (posição na stack vive no título/state.yml/base-head)", () => {
    const result = runGovernancePrCheck(
      { ...baseInput, prBody: readyBodyV3(), isDraft: false },
      fs
    );
    expect(result.kind).toBe("ok");
  });

  it("DADO um PR não atrelado a nenhuma spec, ENTÃO isenta da SSOT", () => {
    const input = { ...baseInput, prBranch: "fix/typo" };
    const result = runGovernancePrCheck(input, fs);
    expect(result.kind).toBe("exempt");
    if (result.kind === "exempt") {
      expect(result.note).toMatch(/não parece pertencer a uma Spec/);
    }
  });

  it("DADO um PR cujo ID não está na topologia, ENTÃO falha pedindo mapeamento", () => {
    const input = { ...baseInput, prBranch: "feat/spec-0024-ghost", prNumber: 99 };
    const result = runGovernancePrCheck(input, fs);
    expect(result.kind).toBe("fail");
    if (result.kind === "fail") {
      expect(result.reasons[0]).toMatch(/não encontrado na topologia do state.yml/);
    }
  });

  // === Robustez O2 (Checkpoint 2.3a) — header ancorado a linha própria ===

  it("DADO seção citada inline (não header de linha própria), ENTÃO falha (fecha falso-negativo de substring)", () => {
    const input = {
      ...baseInput,
      prBody: [
        "## Visão pretendida",
        PROMPT,
        "## Resumo",
        "resumo",
        "> mencionei o ## Escopo do outro PR, mas não é um header aqui",
        "### Dentro do escopo",
        "- a",
        "### Fora do escopo",
        "- b",
        "## Valor entregue",
        PLACEHOLDER,
      ].join("\n"),
    };
    const result = runGovernancePrCheck(input, fs);
    expect(result.kind).toBe("fail");
    if (result.kind === "fail") {
      expect(result.reasons.some((r) => r.includes('"## Escopo"'))).toBe(true);
    }
  });

  // === Contrato temporal (perfil execution) — Draft exige INTENÇÃO; Ready exige ENTREGA ===

  it("DADO Draft sem '### Fora do escopo', ENTÃO falha nomeando o perfil e a seção", () => {
    const body = draftBodyV3().replace("### Fora do escopo", "Fora do escopo (sem header)");
    const result = runGovernancePrCheck({ ...baseInput, prBody: body }, fs);
    expect(result.kind).toBe("fail");
    if (result.kind === "fail") {
      const reason = result.reasons.find((r) => r.includes('"### Fora do escopo"'));
      expect(reason).toBeDefined();
      expect(reason).toContain("perfil execution");
    }
  });

  it("DADO Ready v3 completo, ENTÃO retorna ok", () => {
    const result = runGovernancePrCheck(
      { ...baseInput, prBody: readyBodyV3(), isDraft: false },
      fs
    );
    expect(result.kind).toBe("ok");
  });

  it("DADO Ready sem '### Evidências e gates', ENTÃO falha (contrato de Ready)", () => {
    const body = readyBodyV3().replace("### Evidências e gates", "Evidências (sem header)");
    const result = runGovernancePrCheck({ ...baseInput, prBody: body, isDraft: false }, fs);
    expect(result.kind).toBe("fail");
    if (result.kind === "fail") {
      expect(result.reasons.some((r) => r.includes('"### Evidências e gates"'))).toBe(true);
    }
  });

  it("DADO Draft sem '## Validação, evidências e checklist', ENTÃO ok (seção só é exigida em Ready)", () => {
    const result = runGovernancePrCheck(baseInput, fs);
    expect(result.kind).toBe("ok");
  });

  it("DADO Ready com Test plan só com o esqueleto do template, ENTÃO falha (validação real exigida)", () => {
    const body = readyBodyV3({ testPlan: "```bash\n<comandos de validação>\n```" });
    const result = runGovernancePrCheck({ ...baseInput, prBody: body, isDraft: false }, fs);
    expect(result.kind).toBe("fail");
    if (result.kind === "fail") {
      expect(result.reasons.some((r) => r.includes("## Test plan"))).toBe(true);
    }
  });
});

// === 🚑 Perfil fast-track — curto, mas rigoroso (sem visuais; accountability real) ===
describe("CLI — governance-pr-check · perfil fast-track [BR-GOV-PR-CHECK]", () => {
  const fs = new FakeFileSystem();

  function fastTrackBody(o: { accountability?: string; semRollback?: boolean } = {}): string {
    const sections = [
      "## Incidente ou falha",
      "Build de release quebrado por dependência removida do registry.",
      "## Correção",
      "Pin da dependência na última versão publicada.",
      "## Impacto e risco",
      "Baixo — afeta apenas o pipeline de release.",
      "## Evidência mínima",
      "CI verde na branch + smoke local.",
      ...(o.semRollback ? [] : ["## Rollback", "`git revert` do commit único."]),
      "## Accountability",
      o.accountability ??
        "[fast-track: registry indisponível] — @rosanarezende responde pela correção.",
      ...COMMON_TAIL_FILLED,
    ];
    return sections.join("\n");
  }

  const ftInput = (body: string): GovernancePrCheckInput => ({
    prNumber: 77,
    prTitle: "[🚑] [fix] corrige build de release",
    prBody: body,
    prLabels: ["fast-track"],
    repo: "o/r",
    prBranch: "fix/release-build",
    isDraft: true,
  });

  it("DADO fast-track com perfil completo ENTÃO bypassa linkage estrutural com accountability transferida", () => {
    const result = runGovernancePrCheck(ftInput(fastTrackBody()), fs);
    expect(result.kind).toBe("fast-track");
    if (result.kind === "fast-track") {
      expect(result.note).toMatch(/accountability transferida/);
    }
  });

  it("DADO fast-track sem '## Rollback' ENTÃO falha exigindo o perfil", () => {
    const result = runGovernancePrCheck(ftInput(fastTrackBody({ semRollback: true })), fs);
    expect(result.kind).toBe("fail");
    if (result.kind === "fail") {
      expect(result.reasons.some((r) => r.includes('"## Rollback"'))).toBe(true);
      expect(result.reasons.some((r) => r.includes("perfil fast-track"))).toBe(true);
    }
  });

  it("DADO fast-track com Accountability vazia ENTÃO falha (accountability não é bypassável)", () => {
    const result = runGovernancePrCheck(ftInput(fastTrackBody({ accountability: VAZIO })), fs);
    expect(result.kind).toBe("fail");
    if (result.kind === "fail") {
      expect(result.reasons.some((r) => r.includes('"## Accountability"'))).toBe(true);
    }
  });

  it("DADO fast-track sem nenhuma seção do perfil ENTÃO falha listando o contrato", () => {
    const result = runGovernancePrCheck(ftInput("hotfix urgente, confia"), fs);
    expect(result.kind).toBe("fail");
    if (result.kind === "fail") {
      expect(result.reasons.some((r) => r.includes('"## Incidente ou falha"'))).toBe(true);
      expect(result.reasons.some((r) => r.includes('"## Accountability"'))).toBe(true);
    }
  });

  it("DADO fast-track válido ENTÃO nenhuma exigência de artefato visual aparece", () => {
    const result = runGovernancePrCheck(ftInput(fastTrackBody()), fs);
    expect(result.kind).toBe("fast-track");
  });
});

// === Perfis por tipo (governance / integration) + governança visual ===
// Estado Draft/Ready vem do flag canônico do GitHub (`isDraft`). Placeholder
// `<…>` do template NÃO satisfaz slot visual. Tipo derivado do role na topologia.
describe("CLI — governance-pr-check · perfis e governança visual [BR-GOV-VISUAL]", () => {
  function fsWithTopology(): FakeFileSystem {
    const fs = new FakeFileSystem();
    fs.addDir(".governance/specs", ["0024-context-architecture"]);
    fs.addFile(
      ".governance/specs/0024-context-architecture/state.yml",
      `
stage: implementation
gate:
  status: closed
focus: []
next: []
topology:
  cursor:
    pr: exec-node
    checkpoint: cp-1
  prs:
    active:
      - id: exec-node
        github_pr: 50
        role: execution
        terminal: false
        sequence: 1
        checkpoints:
          - cp-1
      - id: integ-node
        github_pr: 51
        role: integration
        terminal: true
        sequence: null
        checkpoints:
          - cp-i
      - id: gov-node
        github_pr: 52
        role: governance
        terminal: false
        sequence: null
        checkpoints:
          - cp-g
    concluded: []
    planned: []
`
    );
    return fs;
  }

  const IMG = "![valor](https://github.com/u/a/img.png)";

  // ── 🛠️ Execution: #1 desde o Draft; #3 só em Ready ──
  function execBody(o: { problema?: string; valor?: string }): string {
    return [
      "## Visão pretendida",
      o.problema ?? VAZIO,
      "## Resumo",
      "Intenção humana do PR.",
      "## Escopo",
      "### Dentro do escopo",
      "- frente A",
      "### Fora do escopo",
      "- frente B",
      "## Valor entregue",
      o.valor ?? VAZIO,
      "## Test plan",
      "```bash\nnpm run validate\n```",
      ...COMMON_TAIL_FILLED,
    ].join("\n");
  }

  const execInput = (body: string, isDraft: boolean): GovernancePrCheckInput => ({
    prNumber: 50,
    prTitle: "[🛠️1️⃣➜] [Spec 0024] exec",
    prBody: body,
    prLabels: [],
    repo: "o/r",
    prBranch: "feat/spec-0024-exec-node",
    isDraft,
  });

  it("DADO Draft execution com Visão pretendida vazia ENTÃO falha (visão é preenchida ao abrir o Draft)", () => {
    const r = runGovernancePrCheck(execInput(execBody({}), true), fsWithTopology());
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") expect(r.reasons.some((x) => x.includes("Visão pretendida"))).toBe(true);
  });

  it("DADO Draft execution com Visão = placeholder ENTÃO falha (placeholder não satisfaz)", () => {
    const r = runGovernancePrCheck(
      execInput(execBody({ problema: PLACEHOLDER }), true),
      fsWithTopology()
    );
    expect(r.kind).toBe("fail");
  });

  it("DADO Draft execution com Visão preenchida + Valor placeholder ENTÃO ok", () => {
    const r = runGovernancePrCheck(
      execInput(execBody({ problema: PROMPT, valor: PLACEHOLDER }), true),
      fsWithTopology()
    );
    expect(r.kind).toBe("ok");
  });

  it("DADO Ready execution com prompt em #1 e #3 ENTÃO ok (prompt é o artefato gateado)", () => {
    const r = runGovernancePrCheck(
      execInput(execBody({ problema: PROMPT, valor: PROMPT }), false),
      fsWithTopology()
    );
    expect(r.kind).toBe("ok");
  });

  it("DADO Ready execution com imagens em #1 e #3 ENTÃO ok (imagem satisfaz)", () => {
    const r = runGovernancePrCheck(
      execInput(execBody({ problema: IMG, valor: IMG }), false),
      fsWithTopology()
    );
    expect(r.kind).toBe("ok");
  });

  it("DADO Ready execution com #3 só placeholder ENTÃO falha", () => {
    const r = runGovernancePrCheck(
      execInput(execBody({ problema: PROMPT, valor: PLACEHOLDER }), false),
      fsWithTopology()
    );
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") expect(r.reasons.some((x) => x.includes("Valor entregue"))).toBe(true);
  });

  // ── 🧾 Governance: Visão de valor no Draft; Arquitetura pretendida em Ready ──
  function govBody(o: { visaoValor?: string; arquitetura?: string; ready?: boolean }): string {
    const draft = [
      "## Visão de valor",
      o.visaoValor ?? VAZIO,
      "## Problema de governança",
      "Contexto humano não vira governança executável sem atrito.",
      "## Hipóteses e perguntas",
      "- H1: …",
      "## Escopo",
      "### Dentro do escopo",
      "- modelagem",
      "### Fora do escopo",
      "- implementação",
    ];
    const ready = [
      "## Processo decisório",
      "Research → decision-brief → gate (fechado).",
      "## Decisões consolidadas",
      "- DEC-XXXX-G00 …",
      "## Arquitetura pretendida",
      o.arquitetura ?? VAZIO,
      "## Evidências e falsificação",
      "- FAL-0001 …",
      "## Impactos downstream",
      "- consumidores via adopt",
      ...COMMON_TAIL_FILLED,
    ];
    return [...draft, ...(o.ready ? ready : [])].join("\n");
  }

  const govInput = (body: string, isDraft: boolean): GovernancePrCheckInput => ({
    prNumber: 52,
    prTitle: "[🧾] [Spec 0024] governança da spec",
    prBody: body,
    prLabels: [],
    repo: "o/r",
    prBranch: "feat/spec-0024-gov-node",
    isDraft,
  });

  it("DADO Draft governance sem Visão de valor preenchida ENTÃO falha (baseline da intenção)", () => {
    const r = runGovernancePrCheck(govInput(govBody({}), true), fsWithTopology());
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") {
      expect(r.reasons.some((x) => x.includes("Visão de valor"))).toBe(true);
      expect(r.reasons.some((x) => x.includes("perfil governance"))).toBe(true);
    }
  });

  it("DADO Draft governance com Visão de valor preenchida ENTÃO ok (sem exigir Arquitetura ainda)", () => {
    const r = runGovernancePrCheck(
      govInput(govBody({ visaoValor: PROMPT }), true),
      fsWithTopology()
    );
    expect(r.kind).toBe("ok");
  });

  it("DADO fase pré-Execution (Ready) sem Arquitetura pretendida preenchida ENTÃO falha (baseline da decisão)", () => {
    const r = runGovernancePrCheck(
      govInput(govBody({ visaoValor: PROMPT, ready: true }), false),
      fsWithTopology()
    );
    expect(r.kind).toBe("fail");
    if (r.kind === "fail")
      expect(r.reasons.some((x) => x.includes("Arquitetura pretendida"))).toBe(true);
  });

  it("DADO Ready governance com Visão de valor + Arquitetura pretendida preenchidas ENTÃO ok", () => {
    const r = runGovernancePrCheck(
      govInput(govBody({ visaoValor: PROMPT, arquitetura: PROMPT, ready: true }), false),
      fsWithTopology()
    );
    expect(r.kind).toBe("ok");
  });

  // ── 🔗 Integration: convergência da stack, não Execution ──
  function integBody(o: {
    convergencia?: string;
    semResultado?: boolean;
    ready?: boolean;
  }): string {
    const draft = [
      ...(o.semResultado ? [] : ["## Resultado integrado", "- entrega consolidada 1"]),
      "## Componentes e PRs absorvidos",
      "| PR | Entrega |\n| #1 | x |",
      "## Convergência",
      o.convergencia ?? VAZIO,
      "## Rollback",
      "`git revert <SHA-canônico>` — 1 comando.",
    ];
    const ready = [
      "## Compatibilidade e conflitos resolvidos",
      "- nenhum conflito semântico; rebase limpo",
      "## Evidência de integração",
      "Run verde: https://github.com/o/r/actions/runs/1",
      "## Validação final da stack",
      "- review.md R1–R9 fechados",
      ...COMMON_TAIL_FILLED,
    ];
    return [...draft, ...(o.ready ? ready : [])].join("\n");
  }

  const integInput = (body: string, isDraft: boolean): GovernancePrCheckInput => ({
    prNumber: 51,
    prTitle: "[🔗] [Integration] [Spec 0024] homologação",
    prBody: body,
    prLabels: [],
    repo: "o/r",
    prBranch: "feat/spec-0024-integ-node",
    isDraft,
  });

  it("DADO Integration Draft sem '## Resultado integrado' ENTÃO falha", () => {
    const r = runGovernancePrCheck(
      integInput(integBody({ semResultado: true }), true),
      fsWithTopology()
    );
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") {
      expect(r.reasons.some((x) => x.includes('"## Resultado integrado"'))).toBe(true);
      expect(r.reasons.some((x) => x.includes("perfil integration"))).toBe(true);
    }
  });

  it("DADO Integration Ready com convergência visual + evidência ENTÃO ok — sem exigir Visão pretendida/Valor entregue", () => {
    const r = runGovernancePrCheck(
      integInput(integBody({ convergencia: PROMPT, ready: true }), false),
      fsWithTopology()
    );
    expect(r.kind).toBe("ok");
  });

  it("DADO Integration Ready com '## Convergência' vazia ENTÃO falha (narrativa visual #4)", () => {
    const r = runGovernancePrCheck(
      integInput(integBody({ convergencia: VAZIO, ready: true }), false),
      fsWithTopology()
    );
    expect(r.kind).toBe("fail");
    if (r.kind === "fail")
      expect(r.reasons.some((x) => x.includes('"## Convergência"'))).toBe(true);
  });

  it("DADO Integration incompleto ENTÃO nenhuma razão menciona Visão pretendida (perfil não-Execution)", () => {
    const r = runGovernancePrCheck(
      integInput(integBody({ semResultado: true }), true),
      fsWithTopology()
    );
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") {
      expect(r.reasons.some((x) => x.includes("Visão pretendida"))).toBe(false);
    }
  });

  // ── Contrato-base comum ──
  it("DADO body válido cheio de comentários HTML ENTÃO comentários não invalidam o contrato", () => {
    const body =
      "<!-- METADADOS GOVERNADOS: comentários são intencionais -->\n" +
      execBody({ problema: PROMPT, valor: PLACEHOLDER }) +
      "\n<!-- rodapé de template -->";
    const r = runGovernancePrCheck(execInput(body, true), fsWithTopology());
    expect(r.kind).toBe("ok");
  });
});
