/**
 * Check do `research-index.md` canônico (`.governance/specs/`).
 *
 * Garante a invariante de promoção de conhecimento (`governance-foundation.md` §4.5
 * + `GG-0005`): toda pesquisa consolidada em `research-library/<domínio>/` está
 * indexada, e todo link do índice para a biblioteca resolve para um arquivo real.
 *
 * Não decide conteúdo nem gera narrativa: o índice é curado por humano. Aqui só se
 * valida cobertura (nada não-indexado) e integridade (nenhum link quebrado), para
 * que conhecimento consolidado não fique invisível nem o índice aponte para o vazio.
 */
import * as fs from "node:fs";
import * as path from "node:path";

interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

const SPECS_DIR = ".governance/specs";
const INDEX_PATH = `${SPECS_DIR}/research-index.md`;
const LIBRARY_DIR = `${SPECS_DIR}/research-library`;

/** Arquivos `.md` da biblioteca (relativos a `research-library/`, posix), exceto `README.md`. */
function listLibraryFiles(absLibraryDir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(absLibraryDir)) return out;
  const walk = (dir: string, rel: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), childRel);
      } else if (entry.isFile() && entry.name.endsWith(".md") && entry.name !== "README.md") {
        out.push(childRel);
      }
    }
  };
  walk(absLibraryDir, "");
  return out.sort();
}

export function main(repoRoot: string, logger: Logger = defaultLogger): number {
  const absIndex = path.join(repoRoot, INDEX_PATH);
  if (!fs.existsSync(absIndex)) {
    logger.error(`❌ research-index:check — ${INDEX_PATH} ausente.`);
    return 1;
  }

  const indexText = fs.readFileSync(absIndex, "utf-8");
  const libraryFiles = listLibraryFiles(path.join(repoRoot, LIBRARY_DIR));
  const violations: string[] = [];

  // 1. Cobertura: todo arquivo consolidado da biblioteca está indexado.
  for (const rel of libraryFiles) {
    if (!indexText.includes(`research-library/${rel}`)) {
      violations.push(
        `não indexado: research-library/${rel} existe na biblioteca mas não está em ${INDEX_PATH}`
      );
    }
  }

  // 2. Integridade: todo link do índice para a biblioteca resolve para um arquivo real.
  const referenced = new Set<string>();
  for (const match of indexText.matchAll(/research-library\/[A-Za-z0-9._/-]+\.md/g)) {
    referenced.add(match[0]);
  }
  for (const ref of [...referenced].sort()) {
    if (!fs.existsSync(path.join(repoRoot, SPECS_DIR, ref))) {
      violations.push(
        `link quebrado: ${ref} é referenciado em ${INDEX_PATH} mas o arquivo não existe`
      );
    }
  }

  if (violations.length === 0) {
    logger.info(
      `✅ research-index:check — ${libraryFiles.length} arquivo(s) consolidado(s); todos indexados, 0 link(s) quebrado(s).`
    );
    return 0;
  }

  logger.error(`❌ research-index:check — ${violations.length} violação(ões):`);
  for (const v of violations) logger.error(`  ${v}`);
  return 1;
}
