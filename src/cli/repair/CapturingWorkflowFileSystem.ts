/**
 * Filesystem de captura: lê do filesystem real, mas em vez de escrever no disco
 * registra as escritas em memória. Permite gerar o PREVIEW de um reparo
 * reusando um use-case mutante (ex.: `PublishState`) sem tocar o repositório.
 *
 * Leituras subsequentes enxergam o que já foi "escrito" na captura, então
 * use-cases que escrevem e depois releem (round-trip) continuam corretos.
 */
import { WorkflowFileSystem } from "../../app/ports/WorkflowFileSystem.js";

export class CapturingWorkflowFileSystem implements WorkflowFileSystem {
  /** Caminho relativo → conteúdo capturado (ordem de inserção preservada). */
  readonly writes = new Map<string, string>();

  constructor(private readonly inner: WorkflowFileSystem) {}

  fileExists(relPath: string): boolean {
    return this.writes.has(relPath) || this.inner.fileExists(relPath);
  }

  directoryExists(relPath: string): boolean {
    return this.inner.directoryExists(relPath);
  }

  readTextFile(relPath: string): string {
    const captured = this.writes.get(relPath);
    return captured !== undefined ? captured : this.inner.readTextFile(relPath);
  }

  writeTextFile(relPath: string, contents: string): void {
    this.writes.set(relPath, contents);
  }

  listDirectory(relPath: string): ReadonlyArray<string> {
    return this.inner.listDirectory(relPath);
  }

  currentBranch(): string | null {
    return this.inner.currentBranch();
  }

  resolveAbsolute(relPath: string): string {
    return this.inner.resolveAbsolute(relPath);
  }
}
