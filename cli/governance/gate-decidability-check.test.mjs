import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateDec, isExempt, checkContent } from "./gate-decidability-check.mjs";

// Benchmark vivo (GG-0001): a própria reforma de G00/G02 valida o check.
// Fixtures fiéis ao texto real (git acd5da3 = pré-reforma; commit c2a9ef9 = reformado).

// G02 ANTIGO (pré-reforma), forçado Pendente. Falhas esperadas: C4 (sem concorrentes),
// C5/C6 (ato "Aceitar … + autorizar a migração").
const OLD_G02 = `### [DEC-0024-G02] Taxonomia removida; substituída por bloco + propriedade exige-julgamento

**Modo de gate:** \`aceitação\`

**O modelo substituto (o que se cristaliza):**

> A entidade de 1ª classe é o bloco. \`exige julgamento?\` é uma propriedade dele, não um tipo.

**O que está sendo aceito (bounded):** a propriedade migra de spec-level para bloco-level; \`mixed\` deixa de existir.

**O que NÃO está sendo aceito ainda:** a remoção física; o mecanismo exato de declaração.

**Por que a taxonomia caiu (justificativa da direção — settled):** exigia sincronização manual de 3 modelos.

**Decisão do Gate Humano (\`aceitação\`):**

- **Status:** [x] Pendente | [ ] Resolvido
- **Ato (no gate):** [ ] Aceitar o modelo substituto + autorizar a migração · [ ] Reenquadrar · [ ] Rejeitar o desenho
- **Data / Owner:** __ / @rosana
`;

// G02 REFORMADO, forçado Pendente. Deve PASSAR (afirmação única, aceito/não-aceito,
// concorrentes, ato sem execução).
const NEW_G02 = `### [DEC-0024-G02] Taxonomia removida; substituída por bloco + propriedade exige-julgamento

**Modo de gate:** \`aceitação\`

**O finding (o que foi aceito):**

> A entidade de 1ª classe é o bloco. \`exige julgamento?\` é uma propriedade dele, não um tipo.

**O que está sendo aceito (bounded):** a propriedade migra de spec-level para bloco-level; marcador explícito.

**O que NÃO está sendo aceito:** nada que exija nova pesquisa; a execução vive em plan/tasks, não é julgamento pendente.

**Por que as alternativas falham + o que reabriria:**

- Manter a taxonomia: refutada — drift recorrente. _Reabre se:_ G01 revelar invariante próprio de um tipo.
- Taxonomia binária: refutada pelo guard anti-taxonomia. _Reabre se:_ a propriedade for insuficiente.

**Decisão do Gate Humano (\`aceitação\`):**

- **Status:** [x] Pendente | [ ] Resolvido
- **Ato:** [x] Aceitar — o modelo substituto + mecanismo de declaração por marcador explícito (julgamento)/(determinístico).
- **Data / Owner:** 2026-05-31 / @rosana
`;

// G00 REFORMADO, forçado Pendente. Deve PASSAR.
const G00 = `### [DEC-0024-G00] (RAIZ) Unidade arquitetural primária do framework

> A unidade arquitetural primária do ai-guidelines é a transformação de contexto humano → governança executável.

**A única pergunta do gate:** concordo ou não concordo com a afirmação acima?

**O que está sendo aceito:** a unidade primária é uma transformação.

**O que NÃO está sendo aceito:** não é a afirmação de que isto explica tudo.

**Concorrentes considerados** (por que nenhum é a unidade primária): spec, task, decision, finding, artifact, workflow.

**Decisão do Gate Humano (\`aceitação\`):**

- **Status:** [x] Pendente | [ ] Resolvido
- **Ato do gate:** [x] Aceitar — concordo com a afirmação. [ ] Rejeitar [ ] Reenquadrar
- **Data / Owner:** 2026-05-31 / @rosana
`;

const RESOLVED = `### [DEC-9999-A01] Exemplo resolvido
**O que está sendo aceito:** x. **O que NÃO está sendo aceito:** y. **Concorrentes:** z.
- **Status:** [ ] Pendente | [x] **Resolvido**
`;

const WITH_OPEN = `### [DEC-9999-A02] Exemplo com Open
> afirmação.
**O que está sendo aceito:** x. **O que NÃO está sendo aceito:** y. **Concorrentes:** z.
- **Status:** Open
`;

describe("GG-0001 — Gate Decidability Check (benchmark da reforma G00/G02)", () => {
  it("G02 pré-reforma FALHA: sem concorrentes (C4) + ato combina aceitação e migração (C5/C6)", () => {
    const r = evaluateDec("DEC-0024-G02", OLD_G02);
    assert.equal(r.ok, false);
    const codes = r.violations.map((v) => v.code);
    assert.ok(codes.includes("C4"), "esperado C4 (sem concorrentes)");
    assert.ok(codes.includes("C5"), "esperado C5 (mistura arquitetura/implementação)");
    assert.ok(codes.includes("C6"), "esperado C6 (mais de um ato)");
    // não deve falsificar os critérios que o G02 antigo cumpria:
    assert.ok(!codes.includes("C2"));
    assert.ok(!codes.includes("C3"));
    assert.ok(!codes.includes("C1"));
    assert.ok(!codes.includes("C7"));
  });

  it("G02 reformado PASSA (decidível)", () => {
    const r = evaluateDec("DEC-0024-G02", NEW_G02);
    assert.deepEqual(r.violations, [], "G02 reformado não deveria ter violações");
    assert.equal(r.ok, true);
  });

  it("G00 reformado PASSA (decidível)", () => {
    const r = evaluateDec("DEC-0024-G00", G00);
    assert.equal(r.ok, true, JSON.stringify(r.violations));
  });

  it("status Open dispara C7", () => {
    const r = evaluateDec("DEC-9999-A02", WITH_OPEN);
    assert.ok(r.violations.map((v) => v.code).includes("C7"));
  });

  it("isExempt: Resolved/Deferred isento; Pendente checado", () => {
    assert.equal(isExempt(RESOLVED), true);
    assert.equal(isExempt(OLD_G02), false);
    assert.equal(isExempt(NEW_G02), false);
    assert.equal(isExempt("- **Status:** [x] Deferred com critério estrutural"), true);
  });

  it("checkContent ignora DEC resolvido e placeholder de template (DEC-NNNN-*)", () => {
    const content = RESOLVED + "\n## fim\n" + "### [DEC-NNNN-A01] template\n- **Status:** Open\n";
    assert.deepEqual(checkContent(content), []);
  });

  it("checkContent reporta o DEC não-decidível num brief misto", () => {
    const content = NEW_G02 + "\n## sep\n" + OLD_G02;
    const failed = checkContent(content);
    assert.equal(failed.length, 1);
    assert.equal(failed[0].id, "DEC-0024-G02");
  });
});
