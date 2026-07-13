import * as path from "node:path";
import { collectSourceDependencyGraph } from "./sourceDependencyGraph.js";

/**
 * Blueprint Integrity Lock — Boundary Enforcement.
 *
 * Garante (via análise estática de imports) que a topologia DDD do runtime
 * de governança não vaze:
 *
 *   - `src/domain/**` é puro: não pode importar `src/app/**` nem
 *     `src/infrastructure/**`.
 *   - `src/app/**` só toca infraestrutura através de ports declarados em
 *     `src/app/ports/**`; nunca importa `src/infrastructure/**` direto.
 *
 * Implementação atual:
 *   - lê fontes TypeScript de produção (testes excluídos);
 *   - extrai imports, reexports, imports dinâmicos e require via leitor compartilhado;
 *   - resolve o destino e classifica origem/destino em domain/app/infra/other;
 *   - reporta como violação qualquer aresta proibida.
 *
 * Limitações conhecidas:
 *   - Não classifica imports de pacote (ex.: `node:fs`); aceitos por
 *     padrão — boundaries são entre camadas, não contra a stdlib.
 *
 * Evolução prevista: substituir o regex por análise via TS Compiler API
 * (AST/dependency graph) quando o LivingDocumentation runtime existir e
 * já tivermos um pipeline AST consolidado [DEC-0021-C01].
 */
const SRC_ROOT = path.resolve(__dirname, "..");

type Layer = "domain" | "app" | "infra" | "other";

function classify(file: string): Layer {
  const rel = path.relative(SRC_ROOT, file).split(path.sep).join("/");
  if (rel.startsWith("domain/")) return "domain";
  if (rel.startsWith("app/")) return "app";
  if (rel.startsWith("infrastructure/")) return "infra";
  return "other";
}

describe("Blueprint Integrity Lock — Boundaries", () => {
  const edges = collectSourceDependencyGraph(SRC_ROOT, { excludeTests: true })
    .references.filter((reference) => reference.targetFile !== null)
    .map((reference) => ({ from: reference.sourceFile, to: reference.targetFile! }));

  it("DADO src/domain/** ENTÃO não deve importar src/app/** nem src/infrastructure/**", () => {
    const violations = edges
      .filter((e) => classify(e.from) === "domain")
      .filter((e) => {
        const t = classify(e.to);
        return t === "app" || t === "infra";
      })
      .map((e) => `${path.relative(SRC_ROOT, e.from)} -> ${path.relative(SRC_ROOT, e.to)}`);

    expect(violations).toEqual([]);
  });

  it("DADO src/app/** ENTÃO não deve importar src/infrastructure/** diretamente (somente via ports)", () => {
    const violations = edges
      .filter((e) => classify(e.from) === "app")
      .filter((e) => classify(e.to) === "infra")
      .map((e) => `${path.relative(SRC_ROOT, e.from)} -> ${path.relative(SRC_ROOT, e.to)}`);

    expect(violations).toEqual([]);
  });
});
