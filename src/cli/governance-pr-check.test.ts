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

// ── Fixtures do Template v3 ──────────────────────────────────────────────────
// Prompt autorado (preenchido) vs placeholder `<…>` do template (não conta).
const PROMPT = "```text\nGere um infográfico antes/depois do valor entregue…\n```";
const PLACEHOLDER = "```text\n<prompt pronto para colar no gerador>\n```";
const VAZIO = "<!-- preencher -->";

/** Body v3 no contrato de DRAFT: intenção preenchida; Valor entregue pode ser placeholder. */
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

/** Body v3 no contrato de READY: entrega preenchida (valor, test plan, validação). */
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
    "## Validação, evidências e checklist",
    "### Evidências e gates",
    "- CI: verde",
    "### Checklist operacional",
    "- [x] Formatação verde",
    "## Cross-refs",
    "- Spec: 0024",
    "## Disclosure de IA",
    "Implementação assistida por IA.",
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

  it("DADO fast-track com rationale, ENTÃO bypassa SSOT validation com aviso", () => {
    const input = {
      ...baseInput,
      prLabels: ["fast-track"],
      prBody: "[fast-track: motivo urgente]",
    };
    const result = runGovernancePrCheck(input, fs);
    expect(result.kind).toBe("fast-track");
  });

  it("DADO fast-track sem rationale, ENTÃO falha", () => {
    const input = { ...baseInput, prLabels: ["fast-track"], prBody: "sem rationale" };
    const result = runGovernancePrCheck(input, fs);
    expect(result.kind).toBe("fail");
    if (result.kind === "fail") {
      expect(result.reasons[0]).toMatch(/não declara rationale no body/);
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

  // === Contrato temporal (Template v3) — Draft exige INTENÇÃO; Ready exige ENTREGA ===

  it("DADO Draft sem '### Fora do escopo', ENTÃO falha (escopo é contrato de Draft)", () => {
    const body = draftBodyV3().replace("### Fora do escopo", "Fora do escopo (sem header)");
    const result = runGovernancePrCheck({ ...baseInput, prBody: body }, fs);
    expect(result.kind).toBe("fail");
    if (result.kind === "fail") {
      expect(result.reasons.some((r) => r.includes('"### Fora do escopo"'))).toBe(true);
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

// === Governança visual (Template v3) — prompt final é o artefato gateado ===
// Estado Draft/Ready vem do flag canônico do GitHub (`isDraft`); o Template v3
// não tem checkbox de lifecycle no body. Contrato temporal: #1 Visão pretendida
// preenchida desde o Draft; #3 Valor entregue só em Ready; #1 + #4 Convergência
// no Integration PR (Ready). Placeholder `<…>` do template NÃO satisfaz.
// Fast-track bypassa.
describe("CLI — governance-pr-check · governança visual [BR-GOV-VISUAL]", () => {
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
    concluded: []
    planned: []
`
    );
    return fs;
  }

  const IMG = "![valor](https://github.com/u/a/img.png)";

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
      "## Validação, evidências e checklist",
      "### Evidências e gates",
      "- CI: verde",
      "### Checklist operacional",
      "- [x] Formatação verde",
      "## Disclosure de IA",
      "Implementação assistida por IA.",
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

  // ── Contrato temporal: #1 desde o Draft; #3 só em Ready ──
  it("DADO Draft com Visão pretendida vazia ENTÃO falha (visão é preenchida ao abrir o Draft)", () => {
    const r = runGovernancePrCheck(execInput(execBody({}), true), fsWithTopology());
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") expect(r.reasons.some((x) => x.includes("Visão pretendida"))).toBe(true);
  });

  it("DADO Draft com Visão = placeholder do template ENTÃO falha (placeholder não satisfaz)", () => {
    const r = runGovernancePrCheck(
      execInput(execBody({ problema: PLACEHOLDER }), true),
      fsWithTopology()
    );
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") expect(r.reasons.some((x) => x.includes("Visão pretendida"))).toBe(true);
  });

  it("DADO Draft com Visão preenchida + Valor placeholder ENTÃO ok (Valor é contrato de Ready)", () => {
    const r = runGovernancePrCheck(
      execInput(execBody({ problema: PROMPT, valor: PLACEHOLDER }), true),
      fsWithTopology()
    );
    expect(r.kind).toBe("ok");
  });

  it("DADO Ready com PROMPT FINAL (sem imagem) em #1 e #3 ENTÃO ok (prompt é o artefato gateado)", () => {
    const r = runGovernancePrCheck(
      execInput(execBody({ problema: PROMPT, valor: PROMPT }), false),
      fsWithTopology()
    );
    expect(r.kind).toBe("ok");
  });

  it("DADO Ready com imagens em #1 e #3 ENTÃO ok (imagem satisfaz)", () => {
    const r = runGovernancePrCheck(
      execInput(execBody({ problema: IMG, valor: IMG }), false),
      fsWithTopology()
    );
    expect(r.kind).toBe("ok");
  });

  it("DADO Ready com #1 VAZIO ENTÃO falha", () => {
    const r = runGovernancePrCheck(
      execInput(execBody({ problema: VAZIO, valor: PROMPT }), false),
      fsWithTopology()
    );
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") expect(r.reasons.some((x) => x.includes("Visão pretendida"))).toBe(true);
  });

  it("DADO Ready com #3 só placeholder ENTÃO falha", () => {
    const r = runGovernancePrCheck(
      execInput(execBody({ problema: PROMPT, valor: PLACEHOLDER }), false),
      fsWithTopology()
    );
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") expect(r.reasons.some((x) => x.includes("Valor entregue"))).toBe(true);
  });

  it("DADO fast-track + GitHub Ready com slots vazios ENTÃO bypassa", () => {
    const input: GovernancePrCheckInput = {
      ...execInput("[fast-track: urgente]\n" + execBody({}), false),
      prLabels: ["fast-track"],
    };
    const r = runGovernancePrCheck(input, fsWithTopology());
    expect(r.kind).toBe("fast-track");
  });

  function integBody(o: { problema?: string; convergencia?: string }): string {
    return [
      "## Visão pretendida",
      o.problema ?? VAZIO,
      "## Convergência da stack",
      o.convergencia ?? VAZIO,
      "## Resumo",
      "Homologação final da stack.",
      "## Escopo",
      "### Dentro do escopo",
      "- convergência",
      "### Fora do escopo",
      "- comportamento novo",
      "## Valor entregue",
      PLACEHOLDER,
      "## Test plan",
      "```bash\nnpm run validate\n```",
      "## Validação, evidências e checklist",
      "### Evidências e gates",
      "- CI: verde",
      "### Checklist operacional",
      "- [x] ok",
      "## Disclosure de IA",
      "Implementação assistida por IA.",
    ].join("\n");
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

  it("DADO Integration PR GitHub Ready com prompt em #1 e #4 ENTÃO ok", () => {
    const r = runGovernancePrCheck(
      integInput(integBody({ problema: PROMPT, convergencia: PROMPT }), false),
      fsWithTopology()
    );
    expect(r.kind).toBe("ok");
  });

  it("DADO Integration PR GitHub Ready com #4 Convergência VAZIO ENTÃO falha", () => {
    const r = runGovernancePrCheck(
      integInput(integBody({ problema: PROMPT, convergencia: VAZIO }), false),
      fsWithTopology()
    );
    expect(r.kind).toBe("fail");
    if (r.kind === "fail")
      expect(r.reasons.some((x) => x.includes("Convergência da stack"))).toBe(true);
  });
});
