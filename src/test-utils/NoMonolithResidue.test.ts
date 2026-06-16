import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Guarda ARQUITETURAL da remoção do substrato legacy (Spec 0024 · CO-3.3).
 *
 * O monólito (`cli/governance/monolith/**`: compiler, rules-parser/builder,
 * rules-loader, token-budget) foi migrado para o compilador TypeScript em `src/`
 * e removido. Este guarda NÃO proíbe a palavra "monolith" no código — comentário,
 * proveniência histórica, documentação e nomes sem dependência arquitetural são
 * legítimos. Ele verifica a ARQUITETURA: que nada DEPENDE mais do substrato.
 *
 *   1. o diretório `cli/governance/monolith/` não existe;
 *   2. o alias `#governance/monolith/*` saiu de `package.json#imports`;
 *   3. nenhum import/require/dynamic-import resolve um path do substrato;
 *   4. nenhum consumidor vivo dos módulos removidos (corolário de 3);
 *   5. os entrypoints antigos (re-export `index.mjs`) não existem.
 */
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SCAN_ROOTS = [path.join(REPO_ROOT, "cli"), path.join(REPO_ROOT, "src")];
const CODE_EXTENSIONS = new Set([".mjs", ".js", ".ts"]);
const IGNORED_DIRS = new Set(["node_modules", "dist", "coverage"]);

const MONOLITH_DIR = path.join(REPO_ROOT, "cli", "governance", "monolith");
const LEGACY_INDEX = path.join(REPO_ROOT, "cli", "governance", "index.mjs");
// Este próprio arquivo contém uma string de import FALSA (meta-teste do extrator);
// é o único excluído do escaneamento.
const SELF = path.join(__dirname, "NoMonolithResidue.test.ts");

/**
 * Extrai os ESPECIFICADORES de módulo de cada `import … from "X"`, `import("X")`,
 * `export … from "X"` e `require("X")`. Só strings em statements de módulo —
 * comentários e prosa de proveniência (em crases, sem keyword) NÃO entram.
 * Regex FRESCA por chamada (evita estado de `lastIndex` compartilhado).
 */
function extractModuleSpecifiers(content: string): string[] {
  const re = /\b(?:from|import|require)\b\s*\(?\s*["']([^"']+)["']/g;
  return [...content.matchAll(re)].map((m) => m[1]);
}

/** Um specifier referencia o substrato se `monolith` aparece como segmento de path. */
function referencesMonolithSubstrate(specifier: string): boolean {
  return /(^|[/@])monolith([/]|$)|governance\/monolith/.test(specifier);
}

function listCodeFiles(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      out.push(...listCodeFiles(path.join(dir, entry.name)));
    } else if (entry.isFile() && CODE_EXTENSIONS.has(path.extname(entry.name))) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

describe("Substrato legacy removido — guarda ARQUITETURAL (CO-3.3)", () => {
  it("DADO a árvore QUANDO inspeciono ENTÃO o diretório do monólito e o re-export não existem", () => {
    expect(fs.existsSync(MONOLITH_DIR)).toBe(false);
    // `cli/governance/index.mjs` re-exportava o substrato — entrypoint antigo.
    expect(fs.existsSync(LEGACY_INDEX)).toBe(false);
  });

  it("DADO package.json#imports QUANDO inspeciono ENTÃO o alias do substrato não existe", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf-8"));
    const imports: Record<string, unknown> = pkg.imports ?? {};
    const offenders = Object.keys(imports).filter((k) => /monolith/.test(k));
    expect(offenders).toEqual([]);
  });

  it("DADO o código de cli/ e src/ QUANDO extraio os imports ENTÃO nenhum resolve o substrato", () => {
    const offenders: string[] = [];
    for (const root of SCAN_ROOTS) {
      for (const file of listCodeFiles(root)) {
        if (path.resolve(file) === SELF) continue;
        const content = fs.readFileSync(file, "utf-8");
        for (const specifier of extractModuleSpecifiers(content)) {
          if (referencesMonolithSubstrate(specifier)) {
            offenders.push(`${path.relative(REPO_ROOT, file)} → import "${specifier}"`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("DADO proveniência em COMENTÁRIO QUANDO o path aparece em crases ENTÃO NÃO é dependência (não falha)", () => {
    // O guarda é arquitetural: um comentário citando o path antigo é proveniência
    // legítima, não um import. Falsificação positiva do extrator.
    const provenance = "// Migrado de `cli/governance/monolith/token-budget.mjs` (CO-3.3)";
    expect(extractModuleSpecifiers(provenance)).toEqual([]);
    // Mas um import real seria pego:
    const realImport = 'import { x } from "#governance/monolith/token-budget";';
    expect(extractModuleSpecifiers(realImport).some(referencesMonolithSubstrate)).toBe(true);
  });
});
