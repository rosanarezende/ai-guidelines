import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Guarda mínima contra byte NUL em fontes TEXTUAIS governadas (dogfood EV1 do
 * CO-3.1: um `\0` literal usado como separador de chave fez o Git tratar o `.ts`
 * como binário, derrubando diff/blame/reviewability). Pequena e transversal:
 * NÃO inspeciona binários legítimos (filtra por extensão textual conhecida),
 * cross-platform (usa `path`, sem shell-isms).
 */
export const TEXT_SOURCE_EXTENSIONS: ReadonlySet<string> = new Set([
  ".ts",
  ".tsx",
  ".mjs",
  ".js",
  ".cjs",
  ".json",
  ".yml",
  ".yaml",
  ".md",
]);

/** O conteúdo bruto contém um byte NUL (0x00)? */
export function bufferHasNulByte(buf: Buffer): boolean {
  return buf.includes(0);
}

/** O arquivo é uma fonte textual governada (por extensão)? Binários ficam de fora. */
export function isTextSourceFile(filePath: string): boolean {
  return TEXT_SOURCE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

/**
 * Varre `roots` (relativos a `repoRoot`) por arquivos de extensão textual que
 * contenham byte NUL. Retorna paths relativos ordenados. Ignora `node_modules`,
 * `.git` e qualquer arquivo de extensão não-textual (não lê binários).
 */
export function scanTextSourcesForNul(repoRoot: string, roots: readonly string[]): string[] {
  const hits: string[] = [];
  const walk = (dir: string): void => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && isTextSourceFile(full)) {
        if (bufferHasNulByte(fs.readFileSync(full))) {
          hits.push(path.relative(repoRoot, full).split(path.sep).join("/"));
        }
      }
    }
  };
  for (const root of roots) walk(path.join(repoRoot, root));
  return hits.sort();
}

/** Raízes de fontes textuais governadas auditadas pela guarda. */
export const GOVERNED_TEXT_ROOTS: readonly string[] = ["src", "cli", ".core", ".governance"];
