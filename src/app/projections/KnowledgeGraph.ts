import { Falsification } from "../../domain/knowledge/Falsification.js";
import { GovernedRef } from "../../domain/knowledge/GovernedRef.js";
import { KnowledgeArtifact } from "../../domain/knowledge/KnowledgeArtifact.js";
import { KnowledgeRef } from "../../domain/knowledge/KnowledgeRef.js";
import { KnowledgeStage } from "../../domain/knowledge/KnowledgeStage.js";

/**
 * `KnowledgeGraph` — o **read-model** do domínio Knowledge (não um apêndice).
 *
 * É uma **projeção pura**: dado um conjunto de {@link KnowledgeArtifact} (eixo
 * POSITIVO/maturação) + {@link Falsification} (eixo NEGATIVO, CO-2), deriva nós e
 * arestas tipadas e oferece travessia bidirecional. Sem estado próprio —
 * recomputa-se das fontes.
 *
 * Cresce MONOTONICAMENTE: cada entidade adiciona seus nós e arestas ao MESMO grafo
 * sem refatorar este núcleo. O nó é uma **união discriminada** por `kind` —
 * `artifact` (pipeline, com `stage`) ou `falsification` (ortogonal, sem stage).
 */
export type KnowledgeNode =
  | { readonly kind: "artifact"; readonly id: string; readonly stage: KnowledgeStage }
  | { readonly kind: "falsification"; readonly id: string };

export type EdgeRelation = "graduatedTo" | "falsifies" | "constrains" | "crystallizedAs";

export interface KnowledgeEdge {
  readonly from: string;
  /** `KnowledgeRef` em graduatedTo/falsifies/crystallizedAs; `GovernedRef` em constrains. */
  readonly to: KnowledgeRef | GovernedRef;
  readonly relation: EdgeRelation;
}

/** Id do alvo de uma aresta (para indexar `incoming`), seja `KnowledgeRef` ou `GovernedRef`. */
function targetId(to: KnowledgeRef | GovernedRef): string {
  if ("space" in to) return to.space === "knowledge" ? to.ref.id : to.id;
  return to.id;
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

  static from(
    artifacts: ReadonlyArray<KnowledgeArtifact>,
    falsifications: ReadonlyArray<Falsification> = []
  ): KnowledgeGraph {
    const graph = new KnowledgeGraph();
    for (const artifact of artifacts) graph.add(artifact);
    for (const falsification of falsifications) graph.addFalsification(falsification);
    return graph;
  }

  private edge(from: string, to: KnowledgeRef | GovernedRef, relation: EdgeRelation): void {
    const edge: KnowledgeEdge = { from, to, relation };
    push(this.out, from, edge);
    push(this.inc, targetId(to), edge);
  }

  private add(artifact: KnowledgeArtifact): void {
    this.nodes.set(artifact.id, { kind: "artifact", id: artifact.id, stage: artifact.stage });
    if (artifact.graduatedTo) this.edge(artifact.id, artifact.graduatedTo, "graduatedTo");
  }

  /** Adiciona o nó NEGATIVO + suas arestas tipadas (CO-2). Alvos podem não estar materializados. */
  private addFalsification(f: Falsification): void {
    this.nodes.set(f.id, { kind: "falsification", id: f.id });
    if (f.falsifiesRef) this.edge(f.id, f.falsifiesRef, "falsifies");
    for (const target of f.constrains) this.edge(f.id, target, "constrains");
    if (f.crystallizedAs) this.edge(f.id, f.crystallizedAs, "crystallizedAs");
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

  /** O que `id` aponta (downstream/constrange/falsifica/cristaliza). */
  outgoing(id: string): ReadonlyArray<KnowledgeEdge> {
    return this.out.get(id) ?? [];
  }

  /** O que aponta para `id` — mesmo que o nó-alvo ainda não exista (alvo não-materializado). */
  incoming(id: string): ReadonlyArray<KnowledgeEdge> {
    return this.inc.get(id) ?? [];
  }
}
