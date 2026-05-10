import * as fs from "node:fs";
import * as path from "node:path";

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
 * Implementação atual — provisória e deliberadamente simples:
 *   - lê cada `.ts` de produção (testes excluídos);
 *   - extrai imports relativos via regex;
 *   - resolve o destino e classifica origem/destino em domain/app/infra/other;
 *   - reporta como violação qualquer aresta proibida.
 *
 * Limitações conhecidas:
 *   - Não cobre `import("...")` dinâmico nem `require()`.
 *   - Não acompanha re-exports indiretos cross-camada.
 *   - Não classifica imports de pacote (ex.: `node:fs`); aceitos por
 *     padrão — boundaries são entre camadas, não contra a stdlib.
 *
 * Evolução prevista: substituir o regex por análise via TS Compiler API
 * (AST/dependency graph) quando o LivingDocumentation runtime existir e
 * já tivermos um pipeline AST consolidado [DEC-0021-C01].
 */
const SRC_ROOT = path.resolve(__dirname, "..");

interface ImportEdge {
  from: string;
  to: string;
}

const IMPORT_RE = /(?:^|\n)\s*import[^"';]*?from\s+["']([^"']+)["']/g;

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listTsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

function resolveImportTarget(fromFile: string, spec: string): string | null {
  if (!spec.startsWith(".")) return null;
  const fromDir = path.dirname(fromFile);
  const noExt = spec.replace(/\.js$/, "");
  return path.normalize(path.resolve(fromDir, noExt));
}

type Layer = "domain" | "app" | "infra" | "other";

function classify(file: string): Layer {
  const rel = path.relative(SRC_ROOT, file).split(path.sep).join("/");
  if (rel.startsWith("domain/")) return "domain";
  if (rel.startsWith("app/")) return "app";
  if (rel.startsWith("infrastructure/")) return "infra";
  return "other";
}

function collectEdges(): ImportEdge[] {
  const files = listTsFiles(SRC_ROOT).filter((f) => !f.endsWith(".test.ts"));
  const edges: ImportEdge[] = [];
  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    let m: RegExpExecArray | null;
    IMPORT_RE.lastIndex = 0;
    while ((m = IMPORT_RE.exec(src)) !== null) {
      const target = resolveImportTarget(file, m[1]);
      if (target) edges.push({ from: file, to: target });
    }
  }
  return edges;
}

describe("Blueprint Integrity Lock — Boundaries", () => {
  const edges = collectEdges();

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
