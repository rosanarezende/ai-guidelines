/**
 * Port read-only para inspeção do filesystem.
 *
 * Separado de {@link ./WorkspaceProvisioner} porque discovery é puro de
 * leitura — e queremos compô-lo sem permissão de escrita.
 */
export interface FileSystemProbe {
  /** True se o caminho existe E é um diretório. False em qualquer outro caso. */
  directoryExists(relPath: string): boolean;
}
