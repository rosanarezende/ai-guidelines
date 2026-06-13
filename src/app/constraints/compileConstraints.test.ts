import { Constraint, EnforcementBinding } from "../../domain/constraints/Constraint.js";
import { RegistryCommandDescriptor } from "../../cli/registry/describeCommands.js";
import { compileConstraints, ConstraintSourceFacts } from "./compileConstraints.js";
import { NpmScriptContract, NpmScriptSurfaceResolver } from "./NpmScriptSurfaceResolver.js";
import { RegistryCommandSurfaceResolver } from "./RegistryCommandSurfaceResolver.js";
import { SurfaceResolverRegistry } from "./SurfaceResolver.js";

const SCRIPTS: NpmScriptContract[] = [
  { name: "gate-decidability:check", command: "node a", category: "governance", mutates: false },
  { name: "script-contracts:check", command: "node b", category: "governance", mutates: false },
  { name: "review:publish", command: "node c", category: "governance", mutates: true },
];
const COMMANDS: RegistryCommandDescriptor[] = [
  { name: "workflow", subcommands: ["publish-state"] },
];

function resolver(): SurfaceResolverRegistry {
  return new SurfaceResolverRegistry([
    new NpmScriptSurfaceResolver(SCRIPTS),
    new RegistryCommandSurfaceResolver(COMMANDS),
  ]);
}

function binding(p: Partial<EnforcementBinding> = {}): EnforcementBinding {
  return {
    surface: "npm-script:gate-decidability:check",
    surfaceClass: "event",
    enforcement: "gate-decidability-check",
    mode: "required",
    ...p,
  };
}

function constraint(p: Partial<Constraint> = {}): Constraint {
  return {
    id: "GG-0001",
    kind: "constraint",
    origin: { kind: "guardrail", sourceRef: ".core/process/governance-foundation.md#GG-0001" },
    bindings: [binding()],
    ...p,
  };
}

function compile(constraints: Constraint[], facts?: ConstraintSourceFacts) {
  return compileConstraints({
    constraints,
    sources: [{ path: "core", text: "x" }],
    surfaceResolver: resolver(),
    ...(facts ? { facts } : {}),
  });
}

const okFacts: ConstraintSourceFacts = {
  resolveSource: () => ({ contained: true, exists: true, root: "/repo" }),
  anchorIsCanonical: () => ({ ok: true, ambiguous: false }),
  isKnownRuleId: (id) => ["CORE-08", "CORE-09"].includes(id),
  isKnownGuardrailId: (id) => ["GG-0001", "GG-0004"].includes(id),
};

function codes(violations: readonly { code: string }[]): string[] {
  return violations.map((v) => v.code);
}

describe("compileConstraints · mecanismos [BR-CO-ENFORCEMENT-MECH]", () => {
  it("[28] binding válido resolve mecanismo implemented e entra no manifesto", () => {
    const { manifest, violations } = compile([constraint()]);
    expect(violations).toEqual([]);
    expect(manifest.bindings).toHaveLength(1);
    expect(manifest.bindings[0].mechanism).toEqual({
      id: "gate-decidability-check",
      status: "implemented",
    });
  });

  it("[29] mecanismo desconhecido falha", () => {
    const { violations } = compile([
      constraint({ bindings: [binding({ enforcement: "fantasma" })] }),
    ]);
    expect(codes(violations)).toEqual(["MECHANISM_UNKNOWN"]);
  });

  it("[30] required + planned (handoff-receipt) falha", () => {
    const c = constraint({
      bindings: [binding({ enforcement: "handoff-receipt", mode: "required" })],
    });
    expect(codes(compile([c]).violations)).toEqual(["MECHANISM_PLANNED_REQUIRED"]);
  });

  it("handoff-receipt advisory é reconhecido estruturalmente (planned, sem violação)", () => {
    const c = constraint({
      bindings: [binding({ enforcement: "handoff-receipt", mode: "advisory" })],
    });
    const { manifest, violations } = compile([c]);
    expect(violations).toEqual([]);
    expect(manifest.bindings[0].mechanism).toEqual({ id: "handoff-receipt", status: "planned" });
  });

  it("[31] mecanismo não suporta a surface_class declarada falha", () => {
    // npm-script não deriva classe observável → passa o lado-superfície; o mecanismo
    // gate-decidability-check só suporta `event`, então `state` falha no lado-mecanismo.
    const c = constraint({ bindings: [binding({ surfaceClass: "state" })] });
    expect(codes(compile([c]).violations)).toEqual(["MECHANISM_CLASS_UNSUPPORTED"]);
  });
});

describe("compileConstraints · classe de superfície [BR-CO-ENFORCEMENT-CLASS]", () => {
  it("[27] registry-command (event observável) + surface_class state falha", () => {
    const c = constraint({
      id: "GG-9001",
      bindings: [
        binding({
          surface: "registry-command:workflow/publish-state",
          surfaceClass: "state",
          enforcement: "handoff-receipt",
          mode: "advisory",
        }),
      ],
    });
    expect(codes(compile([c]).violations)).toEqual(["SURFACE_CLASS_INCOMPATIBLE"]);
  });
});

describe("compileConstraints · paridade com a fonte humana [BR-CO-ENFORCEMENT-PARITY]", () => {
  it("[13] source_ref aponta arquivo inexistente falha", () => {
    const facts: ConstraintSourceFacts = {
      ...okFacts,
      resolveSource: () => ({ contained: true, exists: false, root: "/repo" }),
    };
    expect(codes(compile([constraint()], facts).violations)).toEqual(["PARITY_SOURCE_MISSING"]);
  });

  it("source_ref que escapa a raiz governada falha [F2]", () => {
    const facts: ConstraintSourceFacts = {
      ...okFacts,
      resolveSource: () => ({ contained: false, exists: false, root: "/repo" }),
    };
    const { violations } = compile([constraint()], facts);
    expect(codes(violations)).toEqual(["PARITY_SOURCE_OUTSIDE"]);
    // mensagem nomeia a constraint e o source_ref recebido + repo root
    expect(violations[0].message).toContain("GG-0001");
    expect(violations[0].message).toContain(".core/process/governance-foundation.md#GG-0001");
    expect(violations[0].message).toContain("/repo");
  });

  it("âncora inexistente no arquivo falha", () => {
    const facts: ConstraintSourceFacts = {
      ...okFacts,
      anchorIsCanonical: () => ({ ok: false, ambiguous: false }),
    };
    expect(codes(compile([constraint()], facts).violations)).toEqual(["PARITY_ANCHOR_MISSING"]);
  });

  it("âncora com heading canônico duplicado é diagnosticada [F3]", () => {
    const facts: ConstraintSourceFacts = {
      ...okFacts,
      anchorIsCanonical: () => ({ ok: false, ambiguous: true }),
    };
    expect(codes(compile([constraint()], facts).violations)).toEqual(["PARITY_ANCHOR_AMBIGUOUS"]);
  });

  it("[14] rule ID inexistente no catálogo falha", () => {
    const c = constraint({
      id: "CORE-99",
      origin: { kind: "rule", sourceRef: ".core/rules/top/agents-core.md#CORE-99" },
    });
    expect(codes(compile([c], okFacts).violations)).toEqual(["PARITY_RULE_UNKNOWN"]);
  });

  it("[15] guardrail ID inexistente na foundation falha", () => {
    const c = constraint({
      id: "GG-9999",
      origin: { kind: "guardrail", sourceRef: ".core/process/governance-foundation.md#GG-9999" },
    });
    const facts: ConstraintSourceFacts = { ...okFacts, isKnownGuardrailId: () => false };
    expect(codes(compile([c], facts).violations)).toEqual(["PARITY_GUARDRAIL_UNKNOWN"]);
  });

  it("[16] origem não é provada pelo prefixo: GG-* declarado como rule falha no catálogo", () => {
    const c = constraint({
      id: "GG-0001",
      origin: { kind: "rule", sourceRef: ".core/rules/top/agents-core.md#GG-0001" },
    });
    // isKnownRuleId("GG-0001") === false ⇒ a origem declarada é confrontada com o catálogo real.
    expect(codes(compile([c], okFacts).violations)).toEqual(["PARITY_RULE_UNKNOWN"]);
  });

  it("source_ref sem âncora falha", () => {
    const c = constraint({
      origin: { kind: "guardrail", sourceRef: ".core/process/governance-foundation.md" },
    });
    expect(codes(compile([c], okFacts).violations)).toEqual(["PARITY_SOURCE_REF_MALFORMED"]);
  });

  it("[17] o binding compilado independe do corpo Markdown (paridade ≠ fonte do dado)", () => {
    const c = constraint();
    const withFacts = compile([c], okFacts).manifest.bindings;
    const withoutFacts = compile([c]).manifest.bindings; // sem fatos = sem paridade
    expect(withFacts).toEqual(withoutFacts); // o dado vem do YAML, não do Markdown
  });
});

describe("compileConstraints · manifesto e grafo [BR-CO-ENFORCEMENT-MANIFEST]", () => {
  const coreOk = constraint({
    id: "CORE-08",
    origin: { kind: "rule", sourceRef: ".core/rules/top/agents-core.md#CORE-08" },
    bindings: [
      binding({
        surface: "npm-script:script-contracts:check",
        enforcement: "script-contracts-check",
      }),
    ],
  });

  it("[32] ordenação determinística de constraints/bindings/edges", () => {
    const a = constraint({ id: "GG-0001" });
    const { manifest } = compile([coreOk, a]); // entrada CORE-08 antes de GG-0001
    expect(manifest.constraints.map((c) => c.id)).toEqual(["CORE-08", "GG-0001"]);
    expect(manifest.bindings.map((b) => b.constraintRef)).toEqual(["CORE-08", "GG-0001"]);
    expect(manifest.edges.map((e) => e.from)).toEqual(["CORE-08", "GG-0001"]);
  });

  it("[33] mesma entrada produz JSON byte-equivalente", () => {
    const input = [coreOk, constraint()];
    expect(JSON.stringify(compile(input).manifest)).toBe(JSON.stringify(compile(input).manifest));
  });

  it("[34] uma constraint com múltiplos bindings", () => {
    const c = constraint({
      id: "CORE-08",
      origin: { kind: "rule", sourceRef: ".core/rules/top/agents-core.md#CORE-08" },
      bindings: [
        binding({ surface: "npm-script:gate-decidability:check" }),
        binding({
          surface: "npm-script:script-contracts:check",
          enforcement: "script-contracts-check",
        }),
      ],
    });
    const { manifest, violations } = compile([c]);
    expect(violations).toEqual([]);
    expect(manifest.bindings).toHaveLength(2);
    expect(manifest.constraints[0].surfaces).toEqual([
      "npm-script:gate-decidability:check",
      "npm-script:script-contracts:check",
    ]);
  });

  it("[35] uma superfície com múltiplas constraints", () => {
    const c1 = constraint({
      id: "CORE-08",
      origin: { kind: "rule", sourceRef: "x#CORE-08" },
      bindings: [
        binding({
          surface: "npm-script:script-contracts:check",
          enforcement: "script-contracts-check",
        }),
      ],
    });
    const c2 = constraint({
      id: "CORE-09",
      origin: { kind: "rule", sourceRef: "x#CORE-09" },
      bindings: [
        binding({
          surface: "npm-script:script-contracts:check",
          enforcement: "script-contracts-check",
        }),
      ],
    });
    const { manifest, violations } = compile([c1, c2]);
    expect(violations).toEqual([]);
    const incoming = manifest.edges.filter(
      (e) => e.to === "surface:npm-script:script-contracts:check"
    );
    expect(incoming.map((e) => e.from)).toEqual(["CORE-08", "CORE-09"]);
  });

  it("[36] tupla (constraint, surface, enforcement) duplicada falha", () => {
    const c = constraint({ bindings: [binding(), binding()] }); // dois bindings idênticos
    expect(codes(compile([c]).violations)).toEqual(["BINDING_DUPLICATE"]);
  });

  it("[38] aresta `constrains` gerada (Constraint → surface ref)", () => {
    const { manifest } = compile([constraint()]);
    expect(manifest.edges).toEqual([
      {
        from: "GG-0001",
        to: "surface:npm-script:gate-decidability:check",
        relation: "constrains",
      },
    ]);
  });

  it("[39] nenhum nó Surface persistido (manifesto = constraints/bindings/edges/provenance)", () => {
    const { manifest } = compile([constraint()]);
    expect(Object.keys(manifest).sort()).toEqual([
      "bindings",
      "constraints",
      "edges",
      "provenance",
      "version",
    ]);
    // a superfície aparece só como REF (string) no alvo da aresta — nunca como entidade/nó.
    expect(typeof manifest.edges[0].to).toBe("string");
    expect(manifest.provenance.sources[0]).toHaveProperty("sha256");
  });

  it("[18] overlay não altera o core: o binding compilado do core é idêntico com/sem overlay", () => {
    const core = coreOk;
    const overlay = constraint({ id: "GG-0001" });
    const onlyCore = compile([core]).manifest.bindings;
    const withOverlay = compile([core, overlay]).manifest.bindings.filter(
      (b) => b.constraintRef === "CORE-08"
    );
    expect(withOverlay).toEqual(onlyCore);
  });
});
