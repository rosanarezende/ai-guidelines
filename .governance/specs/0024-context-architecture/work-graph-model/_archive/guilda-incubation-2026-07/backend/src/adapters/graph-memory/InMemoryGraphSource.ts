// InMemoryGraphSource.ts — grafo derivado em memória, cacheado por revisão do SSOT.
// O projector é injetado pela aplicação; o cache é invalidado quando a revisão
// autoritativa muda, então nunca servimos projeção de um estado antigo como atual.
import type { GraphReadModelSource, GraphSnapshot } from "../../ports/GraphReadModelSource.ts";

export class InMemoryGraphSource implements GraphReadModelSource {
  private readonly projector: () => Promise<GraphSnapshot>;
  private readonly currentRevision: () => string;
  private cache: GraphSnapshot | null = null;

  constructor(projector: () => Promise<GraphSnapshot>, currentRevision: () => string) {
    this.projector = projector;
    this.currentRevision = currentRevision;
  }

  async load(): Promise<GraphSnapshot> {
    const revision = this.currentRevision();
    if (this.cache && this.cache.sourceRevision === revision) return this.cache;
    this.cache = await this.projector();
    return this.cache;
  }
}
