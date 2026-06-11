import { mergePrBody, runPrBodyUpdate, PrBodyGateway, Logger } from "./prBodyUpdate.js";

// ── Fixtures (Template v3) ───────────────────────────────────────────────────

const IMG =
  '<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/02f85a35-1972-4ea7-aac8-206d5d25a58f" />';

const VISAO_BASELINE = [
  "",
  "<!-- Cole a imagem principal aqui, quando existir. -->",
  IMG,
  "",
  "<details>",
  "<summary><strong>Prompt final — visão pretendida</strong></summary>",
  "",
  "```text",
  "Infográfico antes/depois: Corepack/Yarn → npm puro.",
  "```",
  "",
  "</details>",
  "",
].join("\n");

function remoteBody(): string {
  return [
    "<!-- Metadados governados (Template v3). -->",
    "",
    "## Visão pretendida",
    VISAO_BASELINE,
    "## Resumo",
    "",
    "Resumo original.",
    "",
    "## Escopo",
    "",
    "### Dentro do escopo",
    "",
    "- item A",
    "",
    "### Fora do escopo",
    "",
    "- item B",
    "",
    "## Valor entregue",
    "",
    "```text",
    "<prompt pronto para colar no gerador>",
    "```",
    "",
    "## Test plan",
    "",
    "```bash",
    "npm run validate",
    "```",
    "",
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
    "## Cross-refs",
    "",
    "- Spec: 0024",
    "",
    "## Disclosure de IA",
    "",
    "Implementação assistida por IA.",
  ].join("\n");
}

function proposal(sections: ReadonlyArray<string>): string {
  return sections.join("\n");
}

class FakeGateway implements PrBodyGateway {
  applied: string | null = null;
  patched = false;
  edits = 0;

  constructor(
    private remote: string,
    private readonly failEdit = false
  ) {}

  fetchBody(): string {
    return this.applied ?? this.remote;
  }

  editBody(body: string): void {
    this.edits += 1;
    if (this.failEdit) throw new Error("GraphQL: Projects classic deprecation");
    this.applied = body;
  }

  patchBody(body: string): void {
    this.patched = true;
    this.applied = body;
  }
}

const silentLogger: Logger = { info: () => {}, error: () => {} };

describe("CLI — pr-body:update · merge preservativo [BR-PR-BODY-UPDATE]", () => {
  it("DADO proposta só com Test plan QUANDO merge ENTÃO atualiza Test plan e preserva Visão pretendida com imagem", () => {
    const result = mergePrBody(
      remoteBody(),
      proposal(["## Test plan", "", "```bash", "npm run validate && npm run test:smoke", "```", ""])
    );
    expect(result.errors).toEqual([]);
    expect(result.updatedSections).toEqual(["## Test plan"]);
    expect(result.merged).toContain(IMG);
    expect(result.merged).toContain("npm run test:smoke");
  });

  it("DADO atualização de seção mutável QUANDO merge ENTÃO o prompt final da visão pretendida permanece intacto", () => {
    const result = mergePrBody(remoteBody(), proposal(["## Resumo", "", "Resumo novo.", ""]));
    expect(result.errors).toEqual([]);
    expect(result.merged).toContain("Infográfico antes/depois: Corepack/Yarn → npm puro.");
    expect(result.merged).toContain("Resumo novo.");
    expect(result.merged).not.toContain("Resumo original.");
  });

  it("DADO proposta com Validação, evidências e checklist QUANDO merge ENTÃO atualiza sem tocar na visão", () => {
    const result = mergePrBody(
      remoteBody(),
      proposal([
        "## Validação, evidências e checklist",
        "",
        "### Evidências e gates",
        "",
        "- CI: verde (rodada nova)",
        "",
        "### Checklist operacional",
        "",
        "- [x] Formatação verde",
        "",
      ])
    );
    expect(result.errors).toEqual([]);
    expect(result.updatedSections).toEqual(["## Validação, evidências e checklist"]);
    expect(result.merged).toContain("rodada nova");
    expect(result.merged).toContain(IMG);
  });

  it("DADO proposta que reescreve a Visão pretendida QUANDO merge ENTÃO falha orientando o prompt complementar", () => {
    const result = mergePrBody(
      remoteBody(),
      proposal(["## Visão pretendida", "", "```text", "Visão totalmente nova.", "```", ""])
    );
    expect(
      result.errors.some((e) => e.includes("Prompt complementar — atualização de visão pretendida"))
    ).toBe(true);
    expect(result.merged).toBe(remoteBody());
  });

  it("DADO acréscimo que mantém o baseline como prefixo QUANDO merge ENTÃO aceita (prompt complementar)", () => {
    const complemento = [
      "## Visão pretendida",
      VISAO_BASELINE,
      "<details>",
      "<summary><strong>Prompt complementar — atualização de visão pretendida</strong></summary>",
      "",
      "```text",
      "Ajuste de visão autorizado pela owner.",
      "```",
      "",
      "</details>",
      "",
    ].join("\n");
    const result = mergePrBody(remoteBody(), complemento);
    expect(result.errors).toEqual([]);
    expect(result.updatedSections).toEqual([
      "## Visão pretendida (acréscimo preservando baseline)",
    ]);
    expect(result.merged).toContain(IMG);
    expect(result.merged).toContain("Ajuste de visão autorizado pela owner.");
  });

  it("DADO body remoto sem a seção preservada QUANDO merge ENTÃO falha pedindo restauração do baseline", () => {
    const semVisao = remoteBody().replace("## Visão pretendida", "## Visao (renomeada)");
    const result = mergePrBody(semVisao, proposal(["## Resumo", "", "x", ""]));
    expect(
      result.errors.some((e) => e.includes('não contém a seção preservada "## Visão pretendida"'))
    ).toBe(true);
  });

  it("DADO proposta de Escopo sem '### Fora do escopo' QUANDO merge ENTÃO falha (seção do Template v3 desapareceria)", () => {
    const result = mergePrBody(
      remoteBody(),
      proposal(["## Escopo", "", "### Dentro do escopo", "", "- item A2", ""])
    );
    expect(result.errors.some((e) => e.includes('"### Fora do escopo" desapareceria'))).toBe(true);
    expect(result.merged).toBe(remoteBody());
  });

  it("DADO proposta preenchendo Valor entregue sem flag QUANDO merge ENTÃO falha (só ao final, salvo instrução explícita)", () => {
    const result = mergePrBody(
      remoteBody(),
      proposal(["## Valor entregue", "", "```text", "Prompt final de valor.", "```", ""])
    );
    expect(result.errors.some((e) => e.includes("--update-valor-entregue"))).toBe(true);
  });

  it("DADO flag --update-valor-entregue QUANDO merge ENTÃO atualiza Valor entregue", () => {
    const result = mergePrBody(
      remoteBody(),
      proposal(["## Valor entregue", "", "```text", "Prompt final de valor.", "```", ""]),
      { updateValorEntregue: true }
    );
    expect(result.errors).toEqual([]);
    expect(result.updatedSections).toEqual(["## Valor entregue"]);
    expect(result.merged).toContain("Prompt final de valor.");
  });
});

describe("CLI — pr-body:update · aplicação com releitura e fallback [BR-PR-BODY-UPDATE]", () => {
  it("DADO proposta igual ao remoto QUANDO run ENTÃO no-op sem aplicar nada", () => {
    const gateway = new FakeGateway(remoteBody());
    const code = runPrBodyUpdate({ proposedBody: remoteBody(), gateway, logger: silentLogger });
    expect(code).toBe(0);
    expect(gateway.applied).toBeNull();
  });

  it("DADO atualização válida QUANDO run ENTÃO aplica, relê e confirma equivalência", () => {
    const gateway = new FakeGateway(remoteBody());
    const code = runPrBodyUpdate({
      proposedBody: proposal(["## Resumo", "", "Resumo novo.", ""]),
      gateway,
      logger: silentLogger,
    });
    expect(code).toBe(0);
    expect(gateway.applied).toContain("Resumo novo.");
    expect(gateway.applied).toContain(IMG);
    expect(gateway.patched).toBe(false);
  });

  it("DADO gh pr edit falhando QUANDO run ENTÃO usa fallback gh api PATCH e confirma", () => {
    const gateway = new FakeGateway(remoteBody(), true);
    const code = runPrBodyUpdate({
      proposedBody: proposal(["## Resumo", "", "Resumo novo.", ""]),
      gateway,
      logger: silentLogger,
    });
    expect(code).toBe(0);
    expect(gateway.edits).toBe(1);
    expect(gateway.patched).toBe(true);
    expect(gateway.applied).toContain("Resumo novo.");
  });

  it("DADO merge bloqueado QUANDO run ENTÃO retorna 1 sem aplicar", () => {
    const gateway = new FakeGateway(remoteBody());
    const code = runPrBodyUpdate({
      proposedBody: proposal(["## Visão pretendida", "", "```text", "Visão nova.", "```", ""]),
      gateway,
      logger: silentLogger,
    });
    expect(code).toBe(1);
    expect(gateway.applied).toBeNull();
  });
});

// === Baselines por perfil (Bloco 6): governance tem dois baselines; integration não tem ===
describe("CLI — pr-body:update · baselines por perfil [BR-PR-BODY-UPDATE]", () => {
  const GOV_PROMPT = "```text\nInfográfico de visão de valor da spec…\n```";
  const ARQ_PROMPT = "```text\nTopologia aprovada: nós, dependências, sequência…\n```";

  function govRemote(): string {
    return [
      "## Visão de valor",
      GOV_PROMPT,
      "## Problema de governança",
      "Dor estrutural X.",
      "## Decisões consolidadas",
      "- DEC-1",
      "## Arquitetura pretendida",
      ARQ_PROMPT,
      "## Cross-refs",
      "- Spec: NNNN",
    ].join("\n");
  }

  it("DADO body governance QUANDO atualiza seção mutável ENTÃO preserva Visão de valor e Arquitetura pretendida", () => {
    const result = mergePrBody(
      govRemote(),
      ["## Decisões consolidadas", "- DEC-1", "- DEC-2"].join("\n")
    );
    expect(result.errors).toEqual([]);
    expect(result.updatedSections).toEqual(["## Decisões consolidadas"]);
    expect(result.merged).toContain("Infográfico de visão de valor");
    expect(result.merged).toContain("Topologia aprovada");
  });

  it("DADO proposta que reescreve Arquitetura pretendida QUANDO merge ENTÃO falha (baseline da decisão)", () => {
    const result = mergePrBody(
      govRemote(),
      ["## Arquitetura pretendida", "```text", "Outra topologia.", "```"].join("\n")
    );
    expect(result.errors.some((e) => e.includes("Arquitetura pretendida"))).toBe(true);
    expect(result.merged).toBe(govRemote());
  });

  it("DADO body governance sem Visão de valor QUANDO merge ENTÃO falha exigindo o baseline do perfil", () => {
    const semBaseline = govRemote().replace("## Visão de valor", "## Visao de valor (renomeada)");
    const result = mergePrBody(semBaseline, ["## Decisões consolidadas", "- DEC-2"].join("\n"));
    expect(result.errors.some((e) => e.includes('"## Visão de valor"'))).toBe(true);
  });

  it("DADO body integration (sem baseline por perfil) QUANDO atualiza seção mutável ENTÃO não exige Visão pretendida", () => {
    const integRemote = [
      "## Resultado integrado",
      "- entrega 1",
      "## Componentes e PRs absorvidos",
      "- #1",
      "## Evidência de integração",
      "run antiga",
    ].join("\n");
    const result = mergePrBody(
      integRemote,
      ["## Evidência de integração", "run nova verde"].join("\n")
    );
    expect(result.errors).toEqual([]);
    expect(result.updatedSections).toEqual(["## Evidência de integração"]);
    expect(result.merged).toContain("run nova verde");
  });
});
