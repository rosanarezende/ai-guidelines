// io.ts — leitura/escrita do disco VERSIONADO. Não conhece o domínio: só YAML + Markdown(frontmatter) + fs.
// É o detalhe de infra do backend "arquivos"; o Neo4j adapter terá o seu io equivalente.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse, stringify } from "yaml";

/** Raiz do _org-simulation-v2 (este arquivo: _lib/adapters/file/io.ts → 3 níveis acima). */
export const SIM_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);

const abs = (rel: string): string => path.join(SIM_ROOT, rel);

export const exists = (rel: string): boolean => fs.existsSync(abs(rel));

export function readYaml<T>(rel: string): T {
  return parse(fs.readFileSync(abs(rel), "utf8")) as T;
}

export function writeYaml(rel: string, data: unknown): void {
  ensureDir(rel);
  fs.writeFileSync(abs(rel), stringify(data), "utf8");
}

/** Lê um `.md` → { frontmatter, body }. */
export function readMarkdown<T>(rel: string): { frontmatter: T; body: string } {
  const text = fs.readFileSync(abs(rel), "utf8");
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { frontmatter: {} as T, body: text.trim() };
  return { frontmatter: parse(m[1] ?? "") as T, body: (m[2] ?? "").trim() };
}

/** Escreve um `.md` a partir de { frontmatter, body }. */
export function writeMarkdown(rel: string, frontmatter: unknown, body: string): void {
  ensureDir(rel);
  const fm = stringify(frontmatter).trimEnd();
  fs.writeFileSync(abs(rel), `---\n${fm}\n---\n\n${body.trim()}\n`, "utf8");
}

/** Lista os nomes dos arquivos `.md` (ordenados) de uma pasta; [] se não existir. */
export function listMarkdown(rel: string): string[] {
  return exists(rel)
    ? fs
        .readdirSync(abs(rel))
        .filter((f) => f.endsWith(".md"))
        .sort()
    : [];
}

function ensureDir(rel: string): void {
  fs.mkdirSync(path.dirname(abs(rel)), { recursive: true });
}
