// GraphReadModelSource.ts — porta de leitura do grafo DERIVADO.
// Contrato: o grafo nunca autoriza ação; toda mutação relê o SSOT autoritativo
// e falha fechado em revisão stale (backend/examples/read-models/ACTION-CONTRACT.md).
import type { GraphReadModel } from "@demo/domain/server";

export type GraphSnapshot = {
  graph: GraphReadModel;
  // Revisão do SSOT no momento da projeção — consumidores comparam antes de agir.
  sourceRevision: string;
  projectedAt: string;
};

export interface GraphReadModelSource {
  load(): Promise<GraphSnapshot>;
}
