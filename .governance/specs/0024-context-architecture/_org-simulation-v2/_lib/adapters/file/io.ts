// io.ts — leitura/escrita do disco VERSIONADO. Não conhece o domínio: só YAML + Markdown(frontmatter) + fs.
// É o detalhe de infra do backend "arquivos"; o Neo4j adapter terá o seu io equivalente.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
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

/** lê um arquivo de texto cru (ex.: a key da API, gitignored). */
export function readText(rel: string): string {
  return fs.readFileSync(abs(rel), "utf8");
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

/** Os nomes das entradas de uma pasta (ordenados); [] se não existir. */
export function listNames(rel: string): string[] {
  return exists(rel) ? fs.readdirSync(abs(rel)).sort() : [];
}

/** Os repos de trabalho da sim = pastas com `.governance/registry/` (exclui a governança e o tooling `_*`). */
export function listRepoDirs(): string[] {
  return fs
    .readdirSync(SIM_ROOT)
    .filter((n) => !n.startsWith("_") && n !== "acme-governance")
    .filter((n) => exists(`${n}/.governance/registry`))
    .sort();
}

/** a origem está RASTREADA pelo git (e git disponível)? Best-effort: qualquer falha → false. */
function gitTracks(rel: string): boolean {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", rel], {
      cwd: SIM_ROOT,
      stdio: ["ignore", "ignore", "ignore"],
    });
    return true;
  } catch {
    return false; // não-rastreada, ou git indisponível
  }
}

/**
 * Move uma pasta (a ativação/arquivamento movem a candidata; a localização encoda a fase).
 * Se a origem é RASTREADA pelo git → usa `git mv` (rename explícito + estagiado, preserva histórico).
 * Senão → `fs.rename` (candidata nunca commitada = nada a preservar; e o git DETECTA o rename no commit
 * mesmo assim — provado: `git log --follow` atravessa um move simples).
 */
export function moveDir(fromRel: string, toRel: string): void {
  const to = abs(toRel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (gitTracks(fromRel)) {
    try {
      execFileSync("git", ["mv", fromRel, toRel], { cwd: SIM_ROOT, stdio: "ignore" });
      return;
    } catch {
      /* git mv falhou (ex.: pasta parcial) → cai pro fs.rename abaixo */
    }
  }
  fs.renameSync(abs(fromRel), to);
}

/** remove uma pasta recursivamente (raro — preferimos MOVER pra archived). */
export function removeDir(rel: string): void {
  fs.rmSync(abs(rel), { recursive: true, force: true });
}

function ensureDir(rel: string): void {
  fs.mkdirSync(path.dirname(abs(rel)), { recursive: true });
}
