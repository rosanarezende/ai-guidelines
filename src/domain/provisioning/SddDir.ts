/**
 * Política do diretório de assets locais do consumidor (`sdd_dir`).
 *
 * Migrado da parte PURA de `cli/features/core/config.mjs` (Spec 0024 · CO-3.5).
 * Valida que `sdd_dir` é um caminho relativo seguro contido em `targetDir` — o
 * valor vem do `config.json` lido do disco (potencialmente commitado por
 * terceiros em monorepos); um valor malicioso (`../../etc`, `/etc`) faria a CLI
 * escrever fora do alvo. `node:path` é usado só para manipulação de caminho
 * (puro, determinístico) — sem IO.
 */
import path from "node:path";

export const DEFAULT_SDD_DIR = ".ai-guidelines";

export function validateSddDir(sddDir: unknown, targetDir: string): void {
  if (typeof sddDir !== "string" || sddDir.trim() === "") {
    throw new Error(`sdd_dir inválido: deve ser uma string não-vazia (recebido: ${sddDir})`);
  }

  if (path.isAbsolute(sddDir)) {
    throw new Error(`sdd_dir inválido: caminho absoluto não é permitido (${sddDir})`);
  }

  const resolved = path.resolve(targetDir, sddDir);
  const resolvedTarget = path.resolve(targetDir);
  const relativeFromTarget = path.relative(resolvedTarget, resolved);

  if (
    relativeFromTarget.startsWith("..") ||
    path.isAbsolute(relativeFromTarget) ||
    relativeFromTarget === ".."
  ) {
    throw new Error(`sdd_dir inválido: deve permanecer dentro do targetDir (recebido: ${sddDir})`);
  }
}

export function getConfigPath(targetDir: string, sddDir: string = DEFAULT_SDD_DIR): string {
  return path.join(targetDir, sddDir, "config.json");
}
