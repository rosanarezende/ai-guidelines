import { main, KnowledgeCompileDeps } from "./knowledgeCompile.js";
import {
  CompiledConstraintManifest,
  CompileResult,
  ConstraintViolation,
} from "../app/constraints/compileConstraints.js";
import {
  CONSTRAINT_MANIFEST_VERSION,
  serializeConstraintManifest,
} from "../app/constraints/constraintManifest.js";

const MANIFEST: CompiledConstraintManifest = {
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
      },
      mechanism: { id: "script-contracts-check", status: "implemented" },
    },
  ],
  edges: [
    { from: "CORE-08", to: "surface:npm-script:script-contracts:check", relation: "constrains" },
  ],
  provenance: { sources: [{ path: ".core/constraints/constraints.yml", sha256: "abc123" }] },
};

const SERIALIZED = serializeConstraintManifest(MANIFEST);

function result(violations: readonly ConstraintViolation[] = []): CompileResult {
  return { manifest: MANIFEST, violations };
}

function logger() {
  const lines: string[] = [];
  return {
    lines,
    logger: { info: (m: string) => lines.push(m), error: (m: string) => lines.push(m) },
  };
}

/** Store em memória do artefato + spy do build:rules orquestrado. */
function harness(initial: string | null, over: Partial<KnowledgeCompileDeps> = {}) {
  let stored: string | null = initial;
  const buildRulesCalls: string[] = [];
  const deps: KnowledgeCompileDeps = {
    compile: () => result(),
    readManifest: () => stored,
    writeManifest: (text) => {
      stored = text;
    },
    buildRules: (packageRoot) => {
      buildRulesCalls.push(packageRoot);
      return Promise.resolve(0);
    },
    ...over,
  };
  return { deps, getStored: () => stored, buildRulesCalls };
}

// ── compile (escrita) ─────────────────────────────────────────────────────────

describe("knowledge:compile · compile [CO-3.2]", () => {
  it("[59] persiste o manifesto serializado e orquestra build:rules", async () => {
    const h = harness(null);
    const { logger: lg } = logger();
    const code = await main(["compile"], "/repo", { ...h.deps, logger: lg });
    expect(code).toBe(0);
    expect(h.getStored()).toBe(SERIALIZED);
    expect(h.buildRulesCalls).toEqual(["/repo"]); // guarda-chuva reusa o compilador de regras
  });

  it("[60] fonte com violação NÃO persiste e falha (exit 1)", async () => {
    const h = harness(null, {
      compile: () =>
        result([{ code: "PARITY_SOURCE_MISSING", constraintId: "CORE-08", message: "x" }]),
    });
    const { lines, logger: lg } = logger();
    const code = await main(["compile"], "/repo", { ...h.deps, logger: lg });
    expect(code).toBe(1);
    expect(h.getStored()).toBeNull(); // nada persistido
    expect(h.buildRulesCalls).toEqual([]); // não orquestra build:rules sob fonte inválida
    expect(lines.join("\n")).toMatch(/Nada foi persistido/);
  });

  it("[61] fonte core ausente ⇒ exit 2", async () => {
    const h = harness(null, {
      compile: () => {
        throw new Error("fonte core ausente: .core/constraints/constraints.yml.");
      },
    });
    const { logger: lg } = logger();
    const code = await main(["compile"], "/repo", { ...h.deps, logger: lg });
    expect(code).toBe(2);
  });

  it("[62] propaga falha do build:rules orquestrado", async () => {
    const h = harness(null, { buildRules: () => Promise.resolve(1) });
    const { logger: lg } = logger();
    const code = await main(["compile"], "/repo", { ...h.deps, logger: lg });
    expect(code).toBe(1);
    expect(h.getStored()).toBe(SERIALIZED); // manifesto persistido ANTES do build:rules
  });
});

// ── check (paridade derivada) ─────────────────────────────────────────────────

describe("knowledge:check · paridade [CO-3.2]", () => {
  it("[63] manifesto em sync ⇒ ok (exit 0)", async () => {
    const h = harness(SERIALIZED);
    const { lines, logger: lg } = logger();
    const code = await main(["check"], "/repo", { ...h.deps, logger: lg });
    expect(code).toBe(0);
    expect(lines.join("\n")).toMatch(/em sync/);
  });

  it("[64] EXISTÊNCIA: manifesto ausente ⇒ exit 1", async () => {
    const h = harness(null);
    const { lines, logger: lg } = logger();
    const code = await main(["check"], "/repo", { ...h.deps, logger: lg });
    expect(code).toBe(1);
    expect(lines.join("\n")).toMatch(/ausente/);
  });

  it("[65] CLASSE: manifesto de versão divergente ⇒ exit 1", async () => {
    const stale = serializeConstraintManifest({ ...MANIFEST, version: 99 });
    const h = harness(stale);
    const { lines, logger: lg } = logger();
    const code = await main(["check"], "/repo", { ...h.deps, logger: lg });
    expect(code).toBe(1);
    expect(lines.join("\n")).toMatch(/classe inválida/);
  });

  it("[66] SYNC: artefato divergente das fontes vivas ⇒ exit 1", async () => {
    // Persistido é classe-válido mas com conteúdo distinto do recompilado.
    const drifted = serializeConstraintManifest({
      ...MANIFEST,
      provenance: { sources: [{ path: "x", sha256: "DRIFT" }] },
    });
    const h = harness(drifted);
    const { lines, logger: lg } = logger();
    const code = await main(["check"], "/repo", { ...h.deps, logger: lg });
    expect(code).toBe(1);
    expect(lines.join("\n")).toMatch(/fora de sync/);
  });

  it("[67] SYNC: fonte viva com violação ⇒ manifesto não reproduzível (exit 1)", async () => {
    const h = harness(SERIALIZED, {
      compile: () => result([{ code: "MECHANISM_UNKNOWN", constraintId: "CORE-08", message: "x" }]),
    });
    const { lines, logger: lg } = logger();
    const code = await main(["check"], "/repo", { ...h.deps, logger: lg });
    expect(code).toBe(1);
    expect(lines.join("\n")).toMatch(/não é reproduzível/);
  });
});

describe("knowledge:compile · dispatcher [CO-3.2]", () => {
  it("[68] modo desconhecido ⇒ exit 2", async () => {
    const h = harness(null);
    const { logger: lg } = logger();
    expect(await main(["frobnicate"], "/repo", { ...h.deps, logger: lg })).toBe(2);
  });

  it("[69] sem argumento ⇒ default compile", async () => {
    const h = harness(null);
    const { logger: lg } = logger();
    const code = await main([], "/repo", { ...h.deps, logger: lg });
    expect(code).toBe(0);
    expect(h.getStored()).toBe(SERIALIZED);
  });
});
