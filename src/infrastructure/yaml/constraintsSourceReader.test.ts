import {
  ConstraintsParseError,
  ConstraintSource,
  mergeConstraintSources,
  parseConstraints,
} from "./constraintsSourceReader.js";

const VALID = `
version: 1
constraints:
  - id: GG-0001
    kind: constraint
    origin:
      kind: guardrail
      source_ref: .core/process/governance-foundation.md#GG-0001
      sources: [DOGFOOD-0024]
    bindings:
      - surface: npm-script:gate-decidability:check
        surface_class: event
        enforcement: gate-decidability-check
        mode: required
`;

function source(path: string, text: string): ConstraintSource {
  // `root` é irrelevante para os testes de merge (a fusão usa só `constraints`).
  return { path, text, constraints: parseConstraints(text), root: `/tmp/${path}` };
}

describe("constraintsSourceReader · schema [BR-CO-ENFORCEMENT-SCHEMA]", () => {
  it("[1] core válido parseia uma constraint normalizada com binding de 4 campos", () => {
    const [c] = parseConstraints(VALID);
    expect(c.id).toBe("GG-0001");
    expect(c.kind).toBe("constraint");
    expect(c.origin).toEqual({
      kind: "guardrail",
      sourceRef: ".core/process/governance-foundation.md#GG-0001",
      sources: ["DOGFOOD-0024"],
    });
    expect(c.bindings).toEqual([
      {
        surface: "npm-script:gate-decidability:check",
        surfaceClass: "event",
        enforcement: "gate-decidability-check",
        mode: "required",
      },
    ]);
  });

  it("arquivo vazio = lista vazia legítima", () => {
    expect(parseConstraints("")).toEqual([]);
  });

  it("[5] kind diferente de constraint falha", () => {
    expect(() => parseConstraints(VALID.replace("kind: constraint", "kind: rule"))).toThrow(
      ConstraintsParseError
    );
  });

  it("[6] origin ausente falha", () => {
    const noOrigin = `
version: 1
constraints:
  - id: GG-0001
    kind: constraint
    bindings:
      - surface: npm-script:gate-decidability:check
        surface_class: event
        enforcement: gate-decidability-check
        mode: required
`;
    expect(() => parseConstraints(noOrigin)).toThrow(/origin é obrigatório/i);
  });

  it("[7] source_ref ausente falha", () => {
    const noSourceRef = `
version: 1
constraints:
  - id: GG-0001
    kind: constraint
    origin: { kind: guardrail }
    bindings:
      - surface: npm-script:gate-decidability:check
        surface_class: event
        enforcement: gate-decidability-check
        mode: required
`;
    expect(() => parseConstraints(noSourceRef)).toThrow(/source_ref/i);
  });

  it("[8] bindings vazio falha", () => {
    const emptyBindings = `
version: 1
constraints:
  - id: GG-0001
    kind: constraint
    origin: { kind: guardrail, source_ref: x#GG-0001 }
    bindings: []
`;
    expect(() => parseConstraints(emptyBindings)).toThrow(/bindings.*não-vazio/i);
  });

  it("[9] campo de binding ausente falha", () => {
    const noEnforcement = `
version: 1
constraints:
  - id: GG-0001
    kind: constraint
    origin: { kind: guardrail, source_ref: x#GG-0001 }
    bindings:
      - surface: npm-script:gate-decidability:check
        surface_class: event
        mode: required
`;
    expect(() => parseConstraints(noEnforcement)).toThrow(/enforcement/i);
  });

  it("[10] mode inválido falha", () => {
    expect(() => parseConstraints(VALID.replace("mode: required", "mode: hard"))).toThrow(
      /mode "hard" inválido/i
    );
  });

  it("[11] surface_class inválida falha", () => {
    expect(() =>
      parseConstraints(VALID.replace("surface_class: event", "surface_class: blob"))
    ).toThrow(/surface_class "blob" inválido/i);
  });

  it("[12] campo desconhecido (root/constraint/binding) falha", () => {
    expect(() => parseConstraints("version: 1\nconstraints: []\nextra: 1\n")).toThrow(
      /chave desconhecida "extra"/i
    );
    const weirdConstraintKey = `
version: 1
constraints:
  - id: GG-0001
    kind: constraint
    weird: 1
    origin: { kind: guardrail, source_ref: x#GG-0001 }
    bindings:
      - surface: npm-script:gate-decidability:check
        surface_class: event
        enforcement: gate-decidability-check
        mode: required
`;
    expect(() => parseConstraints(weirdConstraintKey)).toThrow(/chave desconhecida "weird"/i);
  });

  it("origin.kind fora de rule|guardrail falha", () => {
    expect(() => parseConstraints(VALID.replace("kind: guardrail", "kind: doctrine"))).toThrow(
      /origin.kind "doctrine" inválido/i
    );
  });

  it("version diferente de 1 falha", () => {
    expect(() => parseConstraints(VALID.replace("version: 1", "version: 2"))).toThrow(
      /version deve ser 1/i
    );
  });
});

describe("constraintsSourceReader · merge core+overlay [BR-CO-ENFORCEMENT-MERGE]", () => {
  const OVERLAY = `
version: 1
constraints:
  - id: CORE-08
    kind: constraint
    origin: { kind: rule, source_ref: .core/rules/top/agents-core.md#CORE-08 }
    bindings:
      - surface: npm-script:script-contracts:check
        surface_class: event
        enforcement: script-contracts-check
        mode: required
`;

  it("[3] overlay válido funde sem alterar a ordem do resultado final", () => {
    const merged = mergeConstraintSources([
      source(".core/constraints/constraints.yml", VALID),
      source(".governance/constraints.yml", OVERLAY),
    ]);
    expect(merged.map((c) => c.id)).toEqual(["GG-0001", "CORE-08"]);
  });

  it("ordem de entrada não muda o conjunto fundido", () => {
    const a = mergeConstraintSources([source("core", VALID), source("overlay", OVERLAY)]);
    const b = mergeConstraintSources([source("overlay", OVERLAY), source("core", VALID)]);
    expect(new Set(a.map((c) => c.id))).toEqual(new Set(b.map((c) => c.id)));
  });

  it("[4] ID duplicado entre core e overlay falha (sem override implícito)", () => {
    expect(() => mergeConstraintSources([source("core", VALID), source("overlay", VALID)])).toThrow(
      /id duplicado "GG-0001".*sem override implícito/is
    );
  });

  it("[2] overlay ausente = só core (merge de uma fonte)", () => {
    const merged = mergeConstraintSources([source("core", VALID)]);
    expect(merged.map((c) => c.id)).toEqual(["GG-0001"]);
  });
});
