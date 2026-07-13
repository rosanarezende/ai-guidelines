import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Guarda ARQUITETURAL das fronteiras de camada (Spec 0024 · PR #46,
 * checkpoint internal-architecture-refactor-ddd-bdd, fatia 1).
 *
 * Rede de segurança behavior-preserving de `src/cli`. As regras de direção:
 *
 *   - `src/domain`         não importa `app`, `infrastructure` nem `cli`;
 *   - `src/app`            não importa `cli`;
 *   - `src/infrastructure` não importa `cli`.
 *
 * O checkpoint eliminou a baseline inicial. Qualquer aresta proibida agora
 * falha sem exceção: o guard não é uma lista permanente de débitos aceitos.
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

describe("fronteiras de camada (guarda arquitetural · PR #46)", () => {
  const violations = collectViolations();

  it("nenhuma camada importa uma camada proibida", () => {
    expect([...violations].sort()).toEqual([]);
  });
});
