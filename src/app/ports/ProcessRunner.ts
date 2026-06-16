/**
 * Port para efeitos de processo do provisionamento: instalação de dependências
 * e marcação de executável (git chmod). Mantém `node:child_process` fora do
 * domínio e dos use cases.
 *
 * Migração Spec 0024 · CO-3.5. **Consumido a partir do Passo 2** (efeitos
 * `install`/`chmod`, exclusivos de init/adopt); declarado aqui para fechar o
 * contrato de ports que o use case de provisionamento exigirá. Substitui
 * `cli/app/install.mjs` + `ensureExecutable` de `cli/fs/file-system.mjs`.
 */
export interface InstallRequest {
  /** Diretório onde rodar o install. */
  readonly cwd: string;
  /** Comando do package manager já resolvido (ex.: `npm install`). */
  readonly command: string;
}

export interface ProcessRunner {
  /** Instala dependências no consumidor. */
  runInstall(request: InstallRequest): Promise<void>;
  /** Marca um arquivo como executável (chmod +x + `git add --chmod=+x`). Best-effort. */
  markExecutable(absolutePath: string): Promise<void>;
}
