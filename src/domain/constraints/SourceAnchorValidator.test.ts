import { validateSourceAnchor } from "./SourceAnchorValidator.js";

const RULE_DOC = `# Agents Core

#### [CORE-08] HARNESS LOCK — contrato operacional obrigatório pré-commit

\`\`\`yaml
id: CORE-08
\`\`\`

Corpo doutrinário da rule.
`;

const GUARDRAIL_DOC = `## Guardrails

### [GG-0001] Decidibilidade de gate antes do mérito

**Origem:** DOGFOOD-0024. **Enforcement:** gate-decidability-check.
`;

describe("validateSourceAnchor · rules [F3]", () => {
  it("[F3.1] heading canônico da rule passa", () => {
    expect(validateSourceAnchor("rule", RULE_DOC, "CORE-08")).toMatchObject({ ok: true, count: 1 });
  });

  it("[F3.2] menção da rule no corpo falha", () => {
    const text = "Veja a regra [CORE-08] aplicada a commits.\n";
    expect(validateSourceAnchor("rule", text, "CORE-08").ok).toBe(false);
  });

  it("[F3.3] menção em fenced code falha", () => {
    const text = "Exemplo:\n\`\`\`md\n#### [CORE-08] HARNESS LOCK\n\`\`\`\n";
    expect(validateSourceAnchor("rule", text, "CORE-08").ok).toBe(false);
  });

  it("[F3.4] ID prefixado/sufixado não passa", () => {
    const text = "#### [CORE-080] OUTRA — título\n#### [XCORE-08] outro — título\n";
    expect(validateSourceAnchor("rule", text, "CORE-08").ok).toBe(false);
  });

  it("[F3.4b] heading sem título não passa", () => {
    const text = "#### [CORE-08]\n";
    expect(validateSourceAnchor("rule", text, "CORE-08").ok).toBe(false);
  });
});

describe("validateSourceAnchor · guardrails [F3]", () => {
  it("[F3.5] heading canônico do guardrail passa", () => {
    expect(validateSourceAnchor("guardrail", GUARDRAIL_DOC, "GG-0001")).toMatchObject({
      ok: true,
      count: 1,
    });
  });

  it("[F3.6] menção ao guardrail no corpo falha", () => {
    const text = "Conforme `[GG-0001]`, gates devem ser decidíveis.\n";
    expect(validateSourceAnchor("guardrail", text, "GG-0001").ok).toBe(false);
  });

  it("[F3.7] comentário HTML não passa", () => {
    const text = "<!--\n### [GG-0001] Decidibilidade\n-->\nCorpo.\n";
    expect(validateSourceAnchor("guardrail", text, "GG-0001").ok).toBe(false);
  });

  it("[F3.4c] GG-00010 não casa GG-0001 (sufixo)", () => {
    const text = "### [GG-00010] outro guardrail\n";
    expect(validateSourceAnchor("guardrail", text, "GG-0001").ok).toBe(false);
  });
});

describe("validateSourceAnchor · seleção e robustez [F3]", () => {
  it("[F3.8] duplicação de heading é diagnosticada (ambíguo)", () => {
    const text = "### [GG-0001] um\n\n### [GG-0001] dois\n";
    const v = validateSourceAnchor("guardrail", text, "GG-0001");
    expect(v.ok).toBe(false);
    expect(v.ambiguous).toBe(true);
    expect(v.count).toBe(2);
  });

  it("[F3.9] origin.kind=rule com apenas heading de guardrail falha", () => {
    const text = "### [CORE-08] HARNESS LOCK\n"; // nível 3 = guardrail, não rule
    expect(validateSourceAnchor("rule", text, "CORE-08").ok).toBe(false);
    // o mesmo texto como guardrail passaria — a seleção é por origin.kind
    expect(validateSourceAnchor("guardrail", text, "CORE-08").ok).toBe(true);
  });

  it("[F3.10] edição textual fora do heading não altera o resultado", () => {
    const base = validateSourceAnchor("rule", RULE_DOC, "CORE-08");
    const edited = validateSourceAnchor(
      "rule",
      RULE_DOC + "\n\nParágrafo novo citando [CORE-08] no corpo.\n",
      "CORE-08"
    );
    expect(edited).toEqual(base);
  });
});
