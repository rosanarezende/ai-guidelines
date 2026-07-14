import * as path from "node:path";
import { collectSourceDependencyGraph } from "./sourceDependencyGraph.js";

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

function collectViolations(): Set<string> {
  const violations = new Set<string>();
  for (const reference of collectSourceDependencyGraph(SRC_ROOT).references) {
    if (!reference.targetFile) continue;
    const relFromSrc = path.relative(SRC_ROOT, reference.sourceFile).replace(/\\/g, "/");
    const forbidden = FORBIDDEN[layerOf(relFromSrc)];
    if (!forbidden) continue;
    const target = layerOf(path.relative(SRC_ROOT, reference.targetFile));
    if (forbidden.includes(target)) {
      violations.add(`${relFromSrc} -> ${target}`);
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
