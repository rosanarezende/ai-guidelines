import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Guarda ARQUITETURAL das fronteiras de camada (Spec 0024 · PR #46,
 * checkpoint internal-architecture-refactor-ddd-bdd, fatia 1).
 *
 * Rede de segurança ANTES da reorganização behavior-preserving de `src/cli`:
 * congela as violações de fronteira existentes como BASELINE e falha em
 * qualquer violação NOVA. As regras (direção permitida de dependência):
 *
 *   - `src/domain`         não importa `app`, `infrastructure` nem `cli`;
 *   - `src/app`            não importa `cli`;
 *   - `src/infrastructure` não importa `cli`.
 *
 * A BASELINE lista as violações conhecidas na criação do guard (ver
 * pre-coding-review 2026-07-12, PCR-F1/PCR-F2). Elas serão resolvidas nas
 * fatias seguintes do refactor; remover uma entrada daqui exige que o import
 * tenha REALMENTE sumido (o teste também falha se a baseline ficar órfã —
 * anti-lixo: baseline não é lista de exceção permanente).
 */
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SRC_ROOT = path.join(REPO_ROOT, "src");
const CODE_EXTENSIONS = new Set([".ts", ".mts", ".cts"]);
const IGNORED_DIRS = new Set(["node_modules", "dist", "coverage"]);

/** Camada de um path relativo a src/ ("domain" | "app" | "infrastructure" | "cli" | outra). */
function layerOf(relFromSrc: string): string {
  return relFromSrc.split(/[\\/]/)[0] ?? "";
}

/** Camadas que cada camada NÃO pode importar. */
const FORBIDDEN: Readonly<Record<string, readonly string[]>> = {
  domain: ["app", "infrastructure", "cli"],
  app: ["cli"],
  infrastructure: ["cli"],
};

/**
 * Violações conhecidas quando o guard nasceu (baseline congelada).
 * Formato: "<arquivo relativo a src/> -> <camada proibida>".
 */
const BASELINE = new Set<string>([
  "app/constraints/RegistryCommandSurfaceResolver.ts -> cli",
  "app/constraints/compileConstraints.test.ts -> cli",
  "app/constraints/surfaceResolvers.test.ts -> cli",
  "domain/templates/TasksEvidenceDrivenEquivalence.test.ts -> app",
  "domain/templates/TasksEvidenceDrivenEquivalence.test.ts -> infrastructure",
  "domain/workspace/WorkspaceDiscovery.test.ts -> app",
  "infrastructure/ast/SkipGuard.test.ts -> cli",
]);

function extractModuleSpecifiers(content: string): string[] {
  const re = /\b(?:from|import|require)\b\s*\(?\s*["']([^"']+)["']/g;
  return [...content.matchAll(re)].map((m) => m[1]);
}

function walk(dir: string, out: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) walk(path.join(dir, entry.name), out);
    } else if (CODE_EXTENSIONS.has(path.extname(entry.name))) {
      out.push(path.join(dir, entry.name));
    }
  }
}

/** Resolve um specifier relativo para camada de destino (só imports relativos internos a src/). */
function targetLayer(fileAbs: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) return null;
  const resolved = path.resolve(path.dirname(fileAbs), specifier);
  const relFromSrc = path.relative(SRC_ROOT, resolved);
  if (relFromSrc.startsWith("..")) return null;
  return layerOf(relFromSrc);
}

function collectViolations(): Set<string> {
  const files: string[] = [];
  walk(SRC_ROOT, files);
  const violations = new Set<string>();
  for (const fileAbs of files) {
    const relFromSrc = path.relative(SRC_ROOT, fileAbs).replace(/\\/g, "/");
    const forbidden = FORBIDDEN[layerOf(relFromSrc)];
    if (!forbidden) continue;
    const content = fs.readFileSync(fileAbs, "utf8");
    for (const specifier of extractModuleSpecifiers(content)) {
      const target = targetLayer(fileAbs, specifier);
      if (target !== null && forbidden.includes(target)) {
        violations.add(`${relFromSrc} -> ${target}`);
      }
    }
  }
  return violations;
}

describe("fronteiras de camada (guarda arquitetural · PR #46 fatia 1)", () => {
  const violations = collectViolations();

  it("nenhuma violação NOVA de fronteira além da baseline congelada", () => {
    const novel = [...violations].filter((v) => !BASELINE.has(v)).sort();
    expect(novel).toEqual([]);
  });

  it("baseline não contém entradas órfãs (violação resolvida sai da baseline)", () => {
    const orphans = [...BASELINE].filter((b) => !violations.has(b)).sort();
    expect(orphans).toEqual([]);
  });
});
