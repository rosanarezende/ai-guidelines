/**
 * Porta do filesystem específica para o workflow runtime.
 *
 * Mantida lean propositadamente: read/write text, exists, list, current
 * git branch. Crescer esta porta exige decisão própria — não acreção
 * silenciosa.
 *
 * Caminhos `relPath` são sempre relativos ao workspace root.
 */
export interface WorkflowFileSystem {
  fileExists(relPath: string): boolean;
  directoryExists(relPath: string): boolean;
  readTextFile(relPath: string): string;
  writeTextFile(relPath: string, contents: string): void;
  listDirectory(relPath: string): ReadonlyArray<string>;
  /** Branch git atual; `null` se HEAD detached ou não-repo. */
  currentBranch(): string | null;
  /** Absolutiza um relPath; usado pela UI para mostrar caminho amigável. */
  resolveAbsolute(relPath: string): string;
}
