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
    prBody: `
## Status do ciclo de vida
## PR Type
## Posição na stack
- **Stack atual**: 1
## Merge authorization
## Resumo
## Test plan
## Cross-refs
## Checklist operacional
## Disclosure de IA
`,
    prLabels: [],
    repo: "owner/repo",
    prBranch: "feat/spec-0024-ruleset-producibility",
    // Draft (flag canônico): estes testes cobrem título/seções/stack, não o gate
    // visual — isentos por serem Draft. O checkbox do body é irrelevante agora.
    isDraft: true,
  };

  it("DADO um PR de execution válido segundo a topologia SSOT, ENTÃO retorna ok", () => {
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
      prBody: `
## Status do ciclo de vida
## PR Type
## Posição na stack
- **Stack atual**: 2
## Merge authorization
## Resumo
## Test plan
## Cross-refs
## Checklist operacional
## Disclosure de IA
`,
    };
    const result = runGovernancePrCheck(input, fs);
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

  // === Robustez O2 (Checkpoint 2.3a) — header ancorado a linha + stack tolerante ===

  it("DADO seção citada inline (não header de linha própria), ENTÃO falha (fecha falso-negativo de substring)", () => {
    const input = {
      ...baseInput,
      prBody: `
## Status do ciclo de vida
## PR Type
## Posição na stack
- **Stack atual**: 1
## Merge authorization
## Resumo
## Test plan
## Cross-refs
## Checklist operacional
> mencionei a ## Disclosure de IA do outro PR, mas não é um header aqui
`,
    };
    const result = runGovernancePrCheck(input, fs);
    expect(result.kind).toBe("fail");
    if (result.kind === "fail") {
      expect(result.reasons.some((r) => r.includes("## Disclosure de IA"))).toBe(true);
    }
  });

  it("DADO variação de formatação na linha 'Stack atual' (espaços, ':' fora do bold), ENTÃO ainda passa", () => {
    const input = {
      ...baseInput,
      prBody: `
## Status do ciclo de vida
## PR Type
## Posição na stack
-  **Stack atual** :  1
## Merge authorization
## Resumo
## Test plan
## Cross-refs
## Checklist operacional
## Disclosure de IA
`,
    };
    const result = runGovernancePrCheck(input, fs);
    expect(result.kind).toBe("ok");
  });

  it("DADO número de stack errado (2 quando sequence=1), ENTÃO falha (word-boundary preserva o contrato)", () => {
    const input = {
      ...baseInput,
      prBody: `
## Status do ciclo de vida
## PR Type
## Posição na stack
- **Stack atual**: 2
## Merge authorization
## Resumo
## Test plan
## Cross-refs
## Checklist operacional
## Disclosure de IA
`,
    };
    const result = runGovernancePrCheck(input, fs);
    expect(result.kind).toBe("fail");
    if (result.kind === "fail") {
      expect(result.reasons.some((r) => r.includes("Coerência de stack"))).toBe(true);
    }
  });
});

// === Governança visual (matriz aprovada) — prompt final é o artefato gateado ===
// Estado Draft/Ready vem do flag canônico do GitHub (`isDraft`), NUNCA do checkbox
// do body (apenas documental) — fonte única, idêntica ao MergeStack. #1 Problema +
// #3 Valor em execution Ready; #1 + #4 Convergência no Integration PR. Draft é isento.
// #2 Capacidade nunca falha. Fast-track bypassa.
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

  // Checkbox de lifecycle no body — DEVE ser ignorado pelo gate (só documental).
  const CHECKBOX = {
    ready: "- [x] **Ready for review** — ok",
    draft: "- [x] **Draft** — ok\n- [ ] **Ready for review** — ok",
    none: "",
  } as const;
  const IMG = "![valor](https://github.com/u/a/img.png)";
  const PROMPT = "```text\nGere um infográfico antes/depois do valor entregue…\n```";
  const VAZIO = "<!-- preencher -->";

  function execBody(o: {
    checkbox?: keyof typeof CHECKBOX;
    problema?: string;
    valor?: string;
  }): string {
    return [
      "## Status do ciclo de vida",
      CHECKBOX[o.checkbox ?? "none"],
      "## PR Type",
      "## Posição na stack",
      "- **Stack atual**: 1",
      "## Visão pretendida",
      o.problema ?? VAZIO,
      "## Valor entregue",
      o.valor ?? VAZIO,
      "## Merge authorization",
      "## Resumo",
      "## Test plan",
      "## Cross-refs",
      "## Checklist operacional",
      "## Disclosure de IA",
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

  // ── Regressão: estado vem de isDraft (GitHub); o checkbox do body é IGNORADO ──
  it("DADO GitHub Draft + checkbox Ready (sem visual) ENTÃO ok (Draft isenta; checkbox ignorado)", () => {
    const r = runGovernancePrCheck(
      execInput(execBody({ checkbox: "ready" }), true),
      fsWithTopology()
    );
    expect(r.kind).toBe("ok");
  });

  it("DADO GitHub Ready + checkbox Draft (sem visual) ENTÃO falha (Ready enforça; checkbox ignorado)", () => {
    const r = runGovernancePrCheck(
      execInput(execBody({ checkbox: "draft" }), false),
      fsWithTopology()
    );
    expect(r.kind).toBe("fail");
    if (r.kind === "fail") expect(r.reasons.some((x) => x.includes("Visão pretendida"))).toBe(true);
  });

  it("DADO GitHub Ready + checkbox ausente (sem visual) ENTÃO falha (Ready enforça)", () => {
    const r = runGovernancePrCheck(
      execInput(execBody({ checkbox: "none" }), false),
      fsWithTopology()
    );
    expect(r.kind).toBe("fail");
  });

  it("DADO GitHub Draft + checkbox ausente (sem visual) ENTÃO ok (Draft isenta)", () => {
    const r = runGovernancePrCheck(
      execInput(execBody({ checkbox: "none" }), true),
      fsWithTopology()
    );
    expect(r.kind).toBe("ok");
  });

  // ── Funcional: gate sobre o prompt/imagem quando GitHub Ready (isDraft=false) ──
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

  it("DADO Ready com #3 VAZIO ENTÃO falha", () => {
    const r = runGovernancePrCheck(
      execInput(execBody({ problema: PROMPT, valor: VAZIO }), false),
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
      "## Status do ciclo de vida",
      "## PR Type",
      "## Posição na stack",
      "## Visão pretendida",
      o.problema ?? VAZIO,
      "## Convergência da stack",
      o.convergencia ?? VAZIO,
      "## Merge authorization",
      "## Resumo",
      "## Test plan",
      "## Cross-refs",
      "## Checklist operacional",
      "## Disclosure de IA",
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
