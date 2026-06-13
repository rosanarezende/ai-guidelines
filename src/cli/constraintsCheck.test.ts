import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  CORE_CONSTRAINTS_PATH,
  loadConstraintSources,
  main,
  OVERLAY_CONSTRAINTS_PATH,
} from "./constraintsCheck.js";

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

function tmpRepo(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "constraints-"));
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

describe("constraints:check · repo real [BR-CO-ENFORCEMENT-GREEN]", () => {
  const repoRoot = process.cwd();

  it("compila as fontes reais verde (GG-0001 + CORE-08)", () => {
    const logs: string[] = [];
    const exit = main(repoRoot, { info: (m) => logs.push(m), error: (m) => logs.push(m) });
    expect(exit).toBe(0);
    expect(logs.join("\n")).toMatch(/✅ constraints:check — 2 constraints · 2 bindings/);
  });

  it("[50] nenhum artefato runtime persistido do CO-3.2", () => {
    main(repoRoot, { info: () => {}, error: () => {} });
    expect(fs.existsSync(path.join(repoRoot, ".governance/runtime/constraints"))).toBe(false);
  });

  it("CO-3.2 não antecipado: sem script knowledge:compile no package.json", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf-8"));
    expect(pkg.scripts["knowledge:compile"]).toBeUndefined();
  });
});
