import {
  CONSTRAINT_MANIFEST_VERSION,
  parseConstraintManifest,
  serializeConstraintManifest,
} from "./constraintManifest.js";
import { CompiledConstraintManifest } from "./compileConstraints.js";

function manifest(overrides: Partial<CompiledConstraintManifest> = {}): CompiledConstraintManifest {
  return {
    version: CONSTRAINT_MANIFEST_VERSION,
    constraints: [
      {
        id: "CORE-08",
        origin: { kind: "rule", sourceRef: ".core/rules/top/agents-core.md#CORE-08" },
        surfaces: ["npm-script:script-contracts:check"],
      },
    ],
    bindings: [
      {
        constraintRef: "CORE-08",
        surface: "npm-script:script-contracts:check",
        surfaceClass: "event",
        enforcement: "script-contracts-check",
        mode: "required",
        resolved: {
          namespace: "npm-script",
          name: "script-contracts:check",
          source: ".core/governance/script-contracts.yml",
          mutates: false,
        },
        mechanism: { id: "script-contracts-check", status: "implemented" },
      },
    ],
    edges: [
      {
        from: "CORE-08",
        to: "surface:npm-script:script-contracts:check",
        relation: "constrains",
      },
    ],
    provenance: { sources: [{ path: ".core/constraints/constraints.yml", sha256: "abc123" }] },
    ...overrides,
  };
}

describe("constraintManifest · serialização canônica [CO-3.2]", () => {
  it("[51] é determinística: mesmo manifesto ⇒ mesmos bytes", () => {
    expect(serializeConstraintManifest(manifest())).toBe(serializeConstraintManifest(manifest()));
  });

  it("[52] ordem das CHAVES não altera os bytes (canonicalização recursiva)", () => {
    // Mesmo conteúdo, chaves de topo em ordem inversa: bytes idênticos.
    const reordered: CompiledConstraintManifest = {
      provenance: manifest().provenance,
      edges: manifest().edges,
      bindings: manifest().bindings,
      constraints: manifest().constraints,
      version: manifest().version,
    } as CompiledConstraintManifest;
    expect(serializeConstraintManifest(reordered)).toBe(serializeConstraintManifest(manifest()));
  });

  it("[53] termina com newline e indenta com 2 espaços (forma owned, prettier-ignored)", () => {
    const text = serializeConstraintManifest(manifest());
    expect(text.endsWith("}\n")).toBe(true);
    expect(text).toMatch(/\n {2}"bindings":/);
  });

  it("[54] round-trip: serialize → parse devolve um manifesto de classe válida", () => {
    const parsed = parseConstraintManifest(serializeConstraintManifest(manifest()));
    expect("manifest" in parsed).toBe(true);
    if ("manifest" in parsed) expect(parsed.manifest.constraints[0].id).toBe("CORE-08");
  });
});

describe("constraintManifest · paridade de CLASSE [CO-3.2]", () => {
  it("[55] JSON inválido ⇒ erro de classe (não lança)", () => {
    const parsed = parseConstraintManifest("{ not json");
    expect("error" in parsed).toBe(true);
  });

  it("[56] versão divergente ⇒ erro de classe", () => {
    const text = serializeConstraintManifest(manifest({ version: 99 }));
    const parsed = parseConstraintManifest(text);
    expect("error" in parsed && /version/.test(parsed.error.reason)).toBe(true);
  });

  it("[57] campo de topo ausente ⇒ erro de classe", () => {
    const parsed = parseConstraintManifest(
      JSON.stringify({ version: CONSTRAINT_MANIFEST_VERSION })
    );
    expect("error" in parsed).toBe(true);
  });

  it("[58] raiz não-objeto (array) ⇒ erro de classe", () => {
    const parsed = parseConstraintManifest("[]");
    expect("error" in parsed).toBe(true);
  });
});
