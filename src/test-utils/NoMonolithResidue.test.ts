import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Guarda da remoção do substrato legacy (Spec 0024 · CO-3.3).
 *
 * O monólito (`cli/governance/monolith/**`: compiler, rules-parser/builder,
 * rules-loader, token-budget) foi migrado para o compilador TypeScript em
 * `src/` e removido. Este guarda fixa o critério de aceitação
 * "`grep monolith = 0`": nenhum arquivo de código em `cli/` ou `src/` pode
 * voltar a referenciar o substrato.
 *
 * Escopo: código (`.mjs`/`.js`/`.ts`), excluindo este próprio arquivo,
 * `dist/`, `node_modules/` e fixtures. Docs históricas (ADRs, research,
 * specs já em revisão) preservam o termo como registro e ficam fora do escopo.
 */
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SCAN_ROOTS = [path.join(REPO_ROOT, "cli"), path.join(REPO_ROOT, "src")];
const CODE_EXTENSIONS = new Set([".mjs", ".js", ".ts"]);
const SELF = path.join(__dirname, "NoMonolithResidue.test.ts");
const IGNORED_DIRS = new Set(["node_modules", "dist", "__fixtures__", "coverage"]);

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

describe("Substrato legacy removido — grep monolith = 0 (CO-3.3)", () => {
  it("DADO o código em cli/ e src/ QUANDO procuro 'monolith' ENTÃO não há nenhuma referência", () => {
    const offenders: string[] = [];
    for (const root of SCAN_ROOTS) {
      for (const file of listCodeFiles(root)) {
        if (path.resolve(file) === SELF) continue;
        const content = fs.readFileSync(file, "utf-8");
        if (/monolith/i.test(content)) {
          offenders.push(path.relative(REPO_ROOT, file));
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("DADO a árvore do repositório QUANDO inspeciono ENTÃO o diretório do monólito não existe mais", () => {
    expect(fs.existsSync(path.join(REPO_ROOT, "cli", "governance", "monolith"))).toBe(false);
  });
});
