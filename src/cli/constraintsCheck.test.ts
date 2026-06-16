import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  ConstraintRoots,
  CORE_CONSTRAINTS_PATH,
  createSourceFacts,
  loadConstraintSources,
  main,
  OVERLAY_CONSTRAINTS_PATH,
} from "./constraintsCheck.js";
import { mergeConstraintSources } from "../infrastructure/yaml/constraintsSourceReader.js";

const CORE_YML = `
version: 1
constraints:
  - id: GG-0001
    kind: constraint
    origin: { kind: guardrail, source_ref: .core/process/governance-foundation.md#GG-0001 }
    bindings:
      - surface: npm-script:gate-decidability:check
        surface_class: event
        enforcement: gate-decidability-check
        mode: required
`;

const OVERLAY_YML = `
version: 1
constraints:
  - id: GR-9001
    kind: constraint
    origin: { kind: rule, source_ref: .ai-guidelines/rules/local.md#GR-9001 }
    bindings:
      - surface: npm-script:lint
        surface_class: event
        enforcement: gate-decidability-check
        mode: advisory
`;

const silent = { info: () => {}, error: () => {} };

function tmpRepo(): string {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "constraints-")));
}

function writeFile(repo: string, rel: string, content: string): void {
  const abs = path.join(repo, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
}

describe("constraints:check · carregamento de fontes [BR-CO-ENFORCEMENT-SOURCES]", () => {
  it("[40] fixture com .governance/constraints.yml carrega core + overlay", () => {
    const repo = tmpRepo();
    writeFile(repo, CORE_CONSTRAINTS_PATH, CORE_YML);
    writeFile(repo, OVERLAY_CONSTRAINTS_PATH, OVERLAY_YML);
    const sources = loadConstraintSources(repo);
    expect(sources.map((s) => s.path)).toEqual([CORE_CONSTRAINTS_PATH, OVERLAY_CONSTRAINTS_PATH]);
    expect(sources.flatMap((s) => s.constraints.map((c) => c.id))).toEqual(["GG-0001", "GR-9001"]);
  });

  it("[41] consumidor sem overlay carrega só o core", () => {
    const repo = tmpRepo();
    writeFile(repo, CORE_CONSTRAINTS_PATH, CORE_YML);
    const sources = loadConstraintSources(repo);
    expect(sources.map((s) => s.path)).toEqual([CORE_CONSTRAINTS_PATH]);
  });

  it("[42][43] .ai-guidelines/constraints.yml é IGNORADO (ponte legada deferida)", () => {
    const repo = tmpRepo();
    writeFile(repo, CORE_CONSTRAINTS_PATH, CORE_YML);
    writeFile(repo, ".ai-guidelines/constraints.yml", OVERLAY_YML);
    const sources = loadConstraintSources(repo);
    // Nem o path local é lido, nem o id do overlay legado aparece.
    expect(sources.map((s) => s.path)).toEqual([CORE_CONSTRAINTS_PATH]);
    expect(sources.flatMap((s) => s.constraints.map((c) => c.id))).not.toContain("GR-9001");
  });

  it("[44] paths cross-platform: repoRoot aninhado resolve via path.join; ids estáveis POSIX", () => {
    const repo = path.join(tmpRepo(), "nested", "consumer");
    writeFile(repo, CORE_CONSTRAINTS_PATH, CORE_YML);
    const sources = loadConstraintSources(repo);
    expect(sources[0].path).toBe(CORE_CONSTRAINTS_PATH); // identificador lógico, não path do SO
    expect(sources[0].constraints[0].id).toBe("GG-0001");
  });

  it("fonte core ausente lança (exit 2 no main)", () => {
    const repo = tmpRepo();
    const logs: string[] = [];
    const exit = main(repo, { info: () => {}, error: (m) => logs.push(m) });
    expect(exit).toBe(2);
    expect(logs.join("\n")).toMatch(/fonte core ausente/);
  });
});

describe("constraints:check · overlay de consumidor wired end-to-end [F1]", () => {
  const REPO_ROOT = fs.realpathSync(process.cwd());

  it("[F1.1] mantenedor (packageRoot === consumerRoot) com core válido passa", () => {
    const exit = main({ packageRoot: REPO_ROOT, consumerRoot: REPO_ROOT }, silent);
    expect(exit).toBe(0);
  });

  it("[F1.2] mantenedor sem core falha (exit 2)", () => {
    const empty = tmpRepo();
    const logs: string[] = [];
    const exit = main(
      { packageRoot: empty, consumerRoot: empty },
      { info: () => {}, error: (m) => logs.push(m) }
    );
    expect(exit).toBe(2);
    expect(logs.join("\n")).toMatch(/fonte core ausente/);
  });

  it("[F1.3] consumidor só com .governance/constraints.yml compila (core vem do pacote)", () => {
    const consumer = tmpRepo();
    writeFile(consumer, OVERLAY_CONSTRAINTS_PATH, "version: 1\nconstraints: []\n");
    // Consumidor NÃO tem `.core/` local — antes do fix isto falhava "fonte core ausente".
    expect(fs.existsSync(path.join(consumer, CORE_CONSTRAINTS_PATH))).toBe(false);
    const exit = main({ packageRoot: REPO_ROOT, consumerRoot: consumer }, silent);
    expect(exit).toBe(0);
  });

  it("[F1.4] consumidor sem overlay compila só o core distribuído (defaults do framework)", () => {
    const consumer = tmpRepo();
    const exit = main({ packageRoot: REPO_ROOT, consumerRoot: consumer }, silent);
    expect(exit).toBe(0);
  });

  it("[F1.5] core distribuído + overlay do consumidor compõem com raízes distintas", () => {
    const pkg = tmpRepo();
    writeFile(pkg, CORE_CONSTRAINTS_PATH, CORE_YML);
    const consumer = tmpRepo();
    writeFile(consumer, OVERLAY_CONSTRAINTS_PATH, OVERLAY_YML);
    const sources = loadConstraintSources({ packageRoot: pkg, consumerRoot: consumer });
    expect(sources.map((s) => s.path)).toEqual([CORE_CONSTRAINTS_PATH, OVERLAY_CONSTRAINTS_PATH]);
    expect(sources[0].root).toBe(path.resolve(pkg));
    expect(sources[1].root).toBe(path.resolve(consumer));
  });

  it("[F1.6] id duplicado entre framework e consumidor falha (sem override implícito)", () => {
    const pkg = tmpRepo();
    writeFile(pkg, CORE_CONSTRAINTS_PATH, CORE_YML); // GG-0001
    const consumer = tmpRepo();
    writeFile(consumer, OVERLAY_CONSTRAINTS_PATH, CORE_YML); // GG-0001 de novo
    const sources = loadConstraintSources({ packageRoot: pkg, consumerRoot: consumer });
    expect(() => mergeConstraintSources(sources)).toThrow(/id duplicado.*GG-0001/);
  });

  it("[F1.7] overlay do consumidor não recebe a raiz do mantenedor", () => {
    const pkg = tmpRepo();
    writeFile(pkg, CORE_CONSTRAINTS_PATH, CORE_YML);
    const consumer = tmpRepo();
    writeFile(consumer, OVERLAY_CONSTRAINTS_PATH, OVERLAY_YML);
    const sources = loadConstraintSources({ packageRoot: pkg, consumerRoot: consumer });
    const overlay = sources.find((s) => s.path === OVERLAY_CONSTRAINTS_PATH)!;
    expect(overlay.path).toBe(OVERLAY_CONSTRAINTS_PATH); // identificador lógico, não path absoluto
    expect(overlay.root).toBe(path.resolve(consumer));
    expect(overlay.root.startsWith(path.resolve(pkg))).toBe(false);
  });

  it("[F1.8] core é resolvido pelo packageRoot, não pelo consumerRoot/cwd", () => {
    const consumer = tmpRepo(); // sem `.core/` local
    const sources = loadConstraintSources({ packageRoot: REPO_ROOT, consumerRoot: consumer });
    expect(sources.map((s) => s.path)).toEqual([CORE_CONSTRAINTS_PATH]);
    expect(sources[0].root).toBe(path.resolve(REPO_ROOT));
  });

  it("[F1.9] raízes aninhadas resolvem via path.join; identificador lógico estável", () => {
    const pkg = path.join(tmpRepo(), "nested", "pkg");
    writeFile(pkg, CORE_CONSTRAINTS_PATH, CORE_YML);
    const consumer = path.join(tmpRepo(), "deep", "consumer");
    writeFile(consumer, OVERLAY_CONSTRAINTS_PATH, OVERLAY_YML);
    const sources = loadConstraintSources({ packageRoot: pkg, consumerRoot: consumer });
    expect(sources[0].path).toBe(CORE_CONSTRAINTS_PATH);
    expect(sources[1].path).toBe(OVERLAY_CONSTRAINTS_PATH);
  });

  it("[F1.10] packaging distribui `.core` (constraints core empacotadas)", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf-8")) as {
      files: string[];
    };
    expect(pkg.files).toContain(".core");
    expect(fs.existsSync(path.join(REPO_ROOT, CORE_CONSTRAINTS_PATH))).toBe(true);
  });
});

describe("constraints:check · source_ref containment por raiz [F2]", () => {
  function fixtureWithOverlaySourceRef(sourceRef: string): {
    facts: ReturnType<typeof createSourceFacts>;
    overlayConstraint: ReturnType<typeof loadConstraintSources>[number]["constraints"][number];
    consumer: string;
  } {
    const pkg = tmpRepo();
    writeFile(pkg, CORE_CONSTRAINTS_PATH, CORE_YML);
    const consumer = tmpRepo();
    writeFile(
      consumer,
      OVERLAY_CONSTRAINTS_PATH,
      `version: 1
constraints:
  - id: GR-9001
    kind: constraint
    origin: { kind: rule, source_ref: ${sourceRef} }
    bindings:
      - { surface: npm-script:lint, surface_class: event, enforcement: gate-decidability-check, mode: advisory }
`
    );
    const roots: ConstraintRoots = { packageRoot: pkg, consumerRoot: consumer };
    const sources = loadConstraintSources(roots);
    const facts = createSourceFacts(pkg, sources);
    const overlayConstraint = sources.find((s) => s.path === OVERLAY_CONSTRAINTS_PATH)!
      .constraints[0];
    return { facts, overlayConstraint, consumer };
  }

  it("[F2-int] source_ref do overlay resolve contra a raiz do CONSUMIDOR", () => {
    const { facts, overlayConstraint, consumer } = fixtureWithOverlaySourceRef(
      ".ai-guidelines/rules/local.md#GR-9001"
    );
    const r = facts.resolveSource(overlayConstraint, ".ai-guidelines/rules/local.md");
    expect(r.root).toBe(path.resolve(consumer));
  });

  it("[F2-int] `../escape.md` no overlay é rejeitado (não-contido), root nomeado", () => {
    const { facts, overlayConstraint, consumer } =
      fixtureWithOverlaySourceRef("../escape.md#GR-9001");
    const r = facts.resolveSource(overlayConstraint, "../escape.md");
    expect(r.contained).toBe(false);
    expect(r.root).toBe(path.resolve(consumer));
  });

  it("[F2-int] source_ref do CORE resolve contra a raiz do PACOTE", () => {
    const pkg = tmpRepo();
    writeFile(pkg, CORE_CONSTRAINTS_PATH, CORE_YML);
    const sources = loadConstraintSources({ packageRoot: pkg, consumerRoot: tmpRepo() });
    const facts = createSourceFacts(pkg, sources);
    const core = sources[0].constraints[0]; // GG-0001
    const r = facts.resolveSource(core, ".core/process/governance-foundation.md");
    expect(r.root).toBe(path.resolve(pkg));
  });
});

describe("constraints:check · âncora canônica por origin.kind [F3]", () => {
  it("[F3-int] anchorIsCanonical exige heading canônico; menção em code falha", () => {
    const pkg = tmpRepo();
    writeFile(pkg, CORE_CONSTRAINTS_PATH, CORE_YML);
    writeFile(
      pkg,
      ".core/process/governance-foundation.md",
      "## Guardrails\n\n### [GG-0001] Decidibilidade\n\nCorpo.\n"
    );
    const sources = loadConstraintSources({ packageRoot: pkg, consumerRoot: pkg });
    const gg = sources[0].constraints[0]; // GG-0001 (guardrail)
    const facts = createSourceFacts(pkg, sources);
    expect(
      facts.anchorIsCanonical(gg, ".core/process/governance-foundation.md", "GG-0001")
    ).toEqual({ ok: true, ambiguous: false });

    // mesma âncora, mas só em bloco fenced → não conta como declaração
    writeFile(pkg, ".core/process/governance-foundation.md", "```\n### [GG-0001] x\n```\n");
    const factsCode = createSourceFacts(pkg, sources);
    expect(
      factsCode.anchorIsCanonical(gg, ".core/process/governance-foundation.md", "GG-0001").ok
    ).toBe(false);
  });
});

describe("constraints:check · repo real [BR-CO-ENFORCEMENT-GREEN]", () => {
  const repoRoot = process.cwd();

  it("compila as fontes reais verde (GG-0001 + CORE-08)", () => {
    const logs: string[] = [];
    const exit = main(repoRoot, { info: (m) => logs.push(m), error: (m) => logs.push(m) });
    expect(exit).toBe(0);
    expect(logs.join("\n")).toMatch(/✅ constraints:check — 2 constraints · 2 bindings/);
  });

  it("[50] constraints:check é in-memory: não persiste nem modifica o manifesto do CO-3.2", () => {
    // Separação cravada: o artefato runtime é OWNED por `knowledge:compile` (CO-3.2);
    // `constraints:check` (CO-3.1) compila só em memória e nunca toca no arquivo.
    const manifestPath = path.join(repoRoot, ".governance/runtime/constraints/manifest.json");
    const before = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, "utf-8") : null;
    main(repoRoot, { info: () => {}, error: () => {} });
    const after = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, "utf-8") : null;
    expect(after).toBe(before);
  });
});
