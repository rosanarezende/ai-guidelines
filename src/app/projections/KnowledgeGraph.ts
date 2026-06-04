import { KnowledgeArtifact } from "../../domain/knowledge/KnowledgeArtifact.js";
import { KnowledgeRef } from "../../domain/knowledge/KnowledgeRef.js";
import { KnowledgeStage } from "../../domain/knowledge/KnowledgeStage.js";

/**
 * `KnowledgeGraph` — o **read-model** do domínio Knowledge (não um apêndice).
 *
 * É uma **projeção pura**: dado um conjunto de {@link KnowledgeArtifact}, deriva
 * nós (artefatos) e arestas (as `KnowledgeRef` que eles carregam) e oferece
 * travessia bidirecional. Sem estado próprio — recomputa-se das fontes.
 *
 * Cresce MONOTONICAMENTE: hoje semeado só por `Insight` (estágio 0); cada
 * entidade futura (Doctrine/Decision/Rule/Guardrail) **adiciona seus nós e
 * arestas ao MESMO grafo**, sem refatorar este núcleo — o payoff de navegação
 * começa na chegada de cada entidade, não num PR-grafo final.
 */
export interface KnowledgeNode {
  readonly id: string;
  readonly stage: KnowledgeStage;
}

export interface KnowledgeEdge {
  readonly from: string;
  readonly to: KnowledgeRef;
  readonly relation: "graduatedTo";
}

function push(map: Map<string, KnowledgeEdge[]>, key: string, edge: KnowledgeEdge): void {
  const bucket = map.get(key) ?? [];
  bucket.push(edge);
  map.set(key, bucket);
}

export class KnowledgeGraph {
  private readonly nodes = new Map<string, KnowledgeNode>();
  private readonly out = new Map<string, KnowledgeEdge[]>();
  private readonly inc = new Map<string, KnowledgeEdge[]>();

  static from(artifacts: ReadonlyArray<KnowledgeArtifact>): KnowledgeGraph {
    const graph = new KnowledgeGraph();
    for (const artifact of artifacts) graph.add(artifact);
    return graph;
  }

  private add(artifact: KnowledgeArtifact): void {
    this.nodes.set(artifact.id, { id: artifact.id, stage: artifact.stage });
    if (artifact.graduatedTo) {
      const edge: KnowledgeEdge = {
        from: artifact.id,
        to: artifact.graduatedTo,
        relation: "graduatedTo",
      };
      push(this.out, artifact.id, edge);
      push(this.inc, artifact.graduatedTo.id, edge);
    }
  }

  node(id: string): KnowledgeNode | undefined {
    return this.nodes.get(id);
  }

  nodeCount(): number {
    return this.nodes.size;
  }

  edges(): ReadonlyArray<KnowledgeEdge> {
    return [...this.out.values()].flat();
  }

  /** O que `id` aponta downstream (para onde graduou). */
  outgoing(id: string): ReadonlyArray<KnowledgeEdge> {
    return this.out.get(id) ?? [];
  }

  /** O que aponta para `id` (quem graduou para cá) — mesmo que o nó-alvo ainda
   *  não exista (aresta para um estágio não-materializado). */
  incoming(id: string): ReadonlyArray<KnowledgeEdge> {
    return this.inc.get(id) ?? [];
  }
}
