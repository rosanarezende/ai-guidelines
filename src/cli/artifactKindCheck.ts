/**
 * Check BRANDO da taxonomia de artefatos (`artifact-kind`).
 *
 * Torna `.core/governance/artifact-taxonomy.yml` um contrato vivo sem forcar a
 * classificacao de todo arquivo legado:
 *  - FALHA apenas quando um arquivo `research/`-class declara um `artifact-kind`
 *    que NAO esta no conjunto fechado (valor invalido);
 *  - arquivos sem `artifact-kind` contam como nao-classificados e entram no
 *    relatorio advisory de cobertura, mas NAO bloqueiam.
 *
 * Sujeito = documento; nada aqui toca WorkItemKind/MECE.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { parse as parseYaml } from "yaml";

interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
}

const defaultLogger: Logger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

const TAXONOMY_PATH = ".core/governance/artifact-taxonomy.yml";
const SPECS_DIR = ".governance/specs";

/** Conjunto fechado de `artifact-kind` lido do contrato de enforcement. */
function validKinds(repoRoot: string): ReadonlySet<string> | undefined {
  const abs = path.join(repoRoot, TAXONOMY_PATH);
  if (!fs.existsSync(abs)) return undefined;
  try {
    const doc = parseYaml(fs.readFileSync(abs, "utf-8")) as {
      kinds?: ReadonlyArray<{ id?: unknown }>;
    };
    const ids = (doc.kinds ?? [])
      .map((k) => k.id)
      .filter((id): id is string => typeof id === "string");
    return new Set(ids);
  } catch {
    return undefined;
  }
}

/** Extrai `artifact-kind` do frontmatter YAML (`---`...`---`), se houver. */
function frontmatterKind(text: string): string | undefined {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!match) return undefined;
  try {
    const fm = parseYaml(match[1]) as Record<string, unknown> | null;
    const value = fm?.["artifact-kind"];
    return typeof value === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}

/** `.md` sob qualquer diretorio `research/` em `.governance/specs/`, exceto `README.md`. */
function researchMarkdownFiles(absSpecsDir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(absSpecsDir)) return out;
  const walk = (dir: string, inResearch: boolean): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs, inResearch || entry.name === "research");
      } else if (
        inResearch &&
        entry.isFile() &&
        entry.name.endsWith(".md") &&
        entry.name !== "README.md"
      ) {
        out.push(abs);
      }
    }
  };
  walk(absSpecsDir, false);
  return out.sort();
}

export function main(repoRoot: string, logger: Logger = defaultLogger): number {
  const kinds = validKinds(repoRoot);
  if (!kinds) {
    logger.error(`❌ artifact-kind:check — ${TAXONOMY_PATH} ausente ou inválido.`);
    return 1;
  }

  const files = researchMarkdownFiles(path.join(repoRoot, SPECS_DIR));
  const invalid: string[] = [];
  let classified = 0;

  for (const abs of files) {
    const kind = frontmatterKind(fs.readFileSync(abs, "utf-8"));
    if (kind === undefined) continue;
    classified += 1;
    if (!kinds.has(kind)) {
      invalid.push(
        `${path.relative(repoRoot, abs).replace(/\\/g, "/")}: artifact-kind "${kind}" fora do conjunto fechado (${[...kinds].sort().join(", ")})`
      );
    }
  }

  if (invalid.length > 0) {
    logger.error(`❌ artifact-kind:check — ${invalid.length} valor(es) inválido(s):`);
    for (const v of invalid) logger.error(`  ${v}`);
    return 1;
  }

  const total = files.length;
  logger.info(
    `✅ artifact-kind:check — ${classified}/${total} arquivo(s) research/ com artifact-kind válido; ` +
      `${total - classified} sem classificar (advisory, não bloqueia).`
  );
  return 0;
}
