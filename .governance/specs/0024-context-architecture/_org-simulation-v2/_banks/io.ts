// Leitura tipada do disco. O banco NÃO guarda estado derivado — recomputa do grafo a cada run.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

/** Raiz do _org-simulation-v2 (este arquivo vive em _org-simulation-v2/_banks/). */
export const SIM_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const abs = (relToSim: string): string => path.join(SIM_ROOT, relToSim);

export function readYaml<T>(relToSim: string): T {
  return parse(fs.readFileSync(abs(relToSim), "utf8")) as T;
}

/** Lê o frontmatter YAML de um `.md` (ex.: o `verdict` do exploration-answer — conteúdo). */
export function readFrontmatter<T>(relToSim: string): T {
  const text = fs.readFileSync(abs(relToSim), "utf8");
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  return (match ? parse(match[1]) : {}) as T;
}

export function fileExists(relToSim: string): boolean {
  return fs.existsSync(abs(relToSim));
}

/** Os repos da sim = pastas com `registry/` (exclui a governança e o tooling `_*`). */
export function listRepos(): string[] {
  return fs
    .readdirSync(SIM_ROOT)
    .filter((name) => !name.startsWith("_") && name !== "acme-governance")
    .filter((name) => fileExists(`${name}/registry`));
}
