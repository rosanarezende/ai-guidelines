/**
 * Check BRANDO da taxonomia de artefatos (`artifact-kind`).
 *
 * Torna `.core/governance/artifact-taxonomy.yml` um contrato vivo sem forcar a
 * classificacao de todo arquivo legado:
 *  - FALHA apenas quando um arquivo `research/`-class declara um `artifact-kind`
 *    que NAO esta no conjunto fechado (valor invalido);
 *  - FALHA quando um arquivo declara `disposition` fora do conjunto fechado;
 *  - FALHA quando `artifact-kind: pre-coding-review` nao declara `subject` e
 *    `date` no frontmatter;
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

interface Taxonomy {
  kinds: ReadonlySet<string>;
  dispositions: ReadonlySet<string>;
}

interface ArtifactFrontmatter {
  kind?: string;
  disposition?: string;
  subject?: string;
  date?: string;
}

/** Conjuntos fechados lidos do contrato de enforcement. */
function readTaxonomy(repoRoot: string): Taxonomy | undefined {
  const abs = path.join(repoRoot, TAXONOMY_PATH);
  if (!fs.existsSync(abs)) return undefined;
  try {
    const doc = parseYaml(fs.readFileSync(abs, "utf-8")) as {
      kinds?: ReadonlyArray<{ id?: unknown }>;
      dispositions?: ReadonlyArray<{ id?: unknown }>;
    };
    const kindIds = (doc.kinds ?? [])
      .map((k) => k.id)
      .filter((id): id is string => typeof id === "string");
    const dispositionIds = (doc.dispositions ?? [])
      .map((d) => d.id)
      .filter((id): id is string => typeof id === "string");
    if (kindIds.length === 0 || dispositionIds.length === 0) return undefined;
    return { kinds: new Set(kindIds), dispositions: new Set(dispositionIds) };
  } catch {
    return undefined;
  }
}

/** Extrai os campos governados do frontmatter YAML (`---`...`---`), se houver. */
function artifactFrontmatter(text: string): ArtifactFrontmatter {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!match) return {};
  try {
    const fm = parseYaml(match[1]) as Record<string, unknown> | null;
    const value = fm ?? {};
    return {
      kind: stringField(value, "artifact-kind"),
      disposition: stringField(value, "disposition"),
      subject: stringField(value, "subject"),
      date: dateField(value, "date"),
    };
  } catch {
    return {};
  }
}

function stringField(fm: Record<string, unknown>, key: string): string | undefined {
  const value = fm[key];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function dateField(fm: Record<string, unknown>, key: string): string | undefined {
  const value = fm[key];
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10);
  }
  return undefined;
}

/**
 * `.md` sob diretorios `research/` ou `assets/` em `.governance/specs/`,
 * exceto `README.md` sem classificacao. READMEs classificados continuam validados.
 */
function artifactMarkdownFiles(absSpecsDir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(absSpecsDir)) return out;
  const walk = (dir: string, inArtifactScope: boolean): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs, inArtifactScope || entry.name === "research" || entry.name === "assets");
      } else if (inArtifactScope && entry.isFile() && entry.name.endsWith(".md")) {
        out.push(abs);
      }
    }
  };
  walk(absSpecsDir, false);
  return out.sort();
}

export function main(repoRoot: string, logger: Logger = defaultLogger): number {
  const taxonomy = readTaxonomy(repoRoot);
  if (!taxonomy) {
    logger.error(`❌ artifact-kind:check — ${TAXONOMY_PATH} ausente ou inválido.`);
    return 1;
  }

  const files = artifactMarkdownFiles(path.join(repoRoot, SPECS_DIR));
  const invalid: string[] = [];
  let classified = 0;

  for (const abs of files) {
    const fm = artifactFrontmatter(fs.readFileSync(abs, "utf-8"));
    const rel = path.relative(repoRoot, abs).replace(/\\/g, "/");
    if (fm.kind === undefined && fm.disposition === undefined) continue;
    const kind = fm.kind;
    if (kind === undefined) {
      invalid.push(`${rel}: disposition declarado sem artifact-kind`);
      continue;
    }
    classified += 1;
    if (!taxonomy.kinds.has(kind)) {
      invalid.push(
        `${rel}: artifact-kind "${kind}" fora do conjunto fechado (${[...taxonomy.kinds].sort().join(", ")})`
      );
    }
    if (fm.disposition !== undefined && !taxonomy.dispositions.has(fm.disposition)) {
      invalid.push(
        `${rel}: disposition "${fm.disposition}" fora do conjunto fechado (${[...taxonomy.dispositions].sort().join(", ")})`
      );
    }
    if (kind === "pre-coding-review") {
      if (fm.subject === undefined) invalid.push(`${rel}: pre-coding-review sem subject`);
      if (fm.date === undefined) invalid.push(`${rel}: pre-coding-review sem date YYYY-MM-DD`);
    }
  }

  if (invalid.length > 0) {
    logger.error(`❌ artifact-kind:check — ${invalid.length} valor(es) inválido(s):`);
    for (const v of invalid) logger.error(`  ${v}`);
    return 1;
  }

  const total = files.length;
  logger.info(
    `✅ artifact-kind:check — ${classified}/${total} arquivo(s) research/assets com artifact-kind válido; ` +
      `${total - classified} sem classificar (advisory, não bloqueia).`
  );
  return 0;
}
