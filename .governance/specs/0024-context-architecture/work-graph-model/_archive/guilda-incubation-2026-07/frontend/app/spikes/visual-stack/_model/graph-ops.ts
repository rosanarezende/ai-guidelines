// graph-ops.ts — operações puras sobre o GovernanceGraphViewModel:
// filtro, vizinhança, menor caminho, impacto de contrato e deps de intent.
// São operações de EXPLORAÇÃO sobre projeção derivada; qualquer ação governada
// precisa reler a fonte autoritativa (sourceRevision) no backend.
import type {
  GovernanceGraphEdge,
  GovernanceGraphNode,
  GovernanceGraphViewModel,
  GraphFilterState,
} from "./view-models";

export type GraphSlice = { nodes: GovernanceGraphNode[]; edges: GovernanceGraphEdge[] };

export function applyGraphFilter(
  graph: GovernanceGraphViewModel,
  filter: GraphFilterState
): GraphSlice {
  const nodes = graph.nodes.filter((node) => {
    if (filter.types.length > 0 && !filter.types.includes(node.type)) return false;
    if (filter.owner && node.owner !== filter.owner) return false;
    if (filter.team && node.team !== filter.team) return false;
    if (filter.cycle && node.cycle !== filter.cycle) return false;
    if (filter.confidence && node.confidence !== filter.confidence) return false;
    if (filter.status && node.status !== filter.status) return false;
    if (filter.onlyContract && !node.touchesContract) return false;
    if (filter.source && node.source !== filter.source) return false;
    return true;
  });
  const kept = new Set(nodes.map((node) => node.id));
  const edges = graph.edges.filter((edge) => kept.has(edge.source) && kept.has(edge.target));
  return { nodes, edges };
}

type AdjacencyIndex = Map<string, Array<{ other: string; edge: GovernanceGraphEdge }>>;

export function buildAdjacency(edges: GovernanceGraphEdge[]): AdjacencyIndex {
  const index: AdjacencyIndex = new Map();
  const push = (key: string, other: string, edge: GovernanceGraphEdge) => {
    const bucket = index.get(key);
    if (bucket) bucket.push({ other, edge });
    else index.set(key, [{ other, edge }]);
  };
  for (const edge of edges) {
    push(edge.source, edge.target, edge);
    push(edge.target, edge.source, edge);
  }
  return index;
}

export function neighborhood(
  graph: GraphSlice,
  rootId: string,
  depth: number,
  adjacency: AdjacencyIndex = buildAdjacency(graph.edges)
): GraphSlice & { distances: Map<string, number> } {
  const distances = new Map<string, number>([[rootId, 0]]);
  const edgeIds = new Set<string>();
  let frontier = [rootId];
  for (let level = 1; level <= depth && frontier.length > 0; level += 1) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const { other, edge } of adjacency.get(id) ?? []) {
        edgeIds.add(edge.id);
        if (!distances.has(other)) {
          distances.set(other, level);
          next.push(other);
        }
      }
    }
    frontier = next;
  }
  return {
    nodes: graph.nodes.filter((node) => distances.has(node.id)),
    edges: graph.edges.filter(
      (edge) => edgeIds.has(edge.id) && distances.has(edge.source) && distances.has(edge.target)
    ),
    distances,
  };
}

export function shortestPath(
  graph: GraphSlice,
  fromId: string,
  toId: string,
  adjacency: AdjacencyIndex = buildAdjacency(graph.edges)
): GraphSlice | null {
  if (fromId === toId) {
    const node = graph.nodes.find((entry) => entry.id === fromId);
    return node ? { nodes: [node], edges: [] } : null;
  }
  const previous = new Map<string, { node: string; edge: GovernanceGraphEdge }>();
  const visited = new Set([fromId]);
  let frontier = [fromId];
  while (frontier.length > 0 && !visited.has(toId)) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const { other, edge } of adjacency.get(id) ?? []) {
        if (visited.has(other)) continue;
        visited.add(other);
        previous.set(other, { node: id, edge });
        next.push(other);
      }
    }
    frontier = next;
  }
  if (!visited.has(toId)) return null;
  const nodeIds: string[] = [toId];
  const edges: GovernanceGraphEdge[] = [];
  let cursor = toId;
  while (cursor !== fromId) {
    const step = previous.get(cursor);
    if (!step) return null;
    edges.unshift(step.edge);
    nodeIds.unshift(step.node);
    cursor = step.node;
  }
  const wanted = new Set(nodeIds);
  return { nodes: graph.nodes.filter((node) => wanted.has(node.id)), edges };
}

// Impacto de contrato: contrato + consumidores diretos + intents que mudam ou
// consomem o contrato + outcomes que citam a revisão (via vizinhança tipada).
export function contractImpactSlice(graph: GraphSlice, contractId: string): GraphSlice {
  const relevantEdgeTypes = new Set([
    "consumed-by",
    "changes",
    "consumes",
    "publishes",
    "has-revision-proposal",
    "coordinates",
    "affects-consumer",
    "backs-contract",
  ]);
  const keep = new Set([contractId]);
  const edges = graph.edges.filter((edge) => {
    if (!relevantEdgeTypes.has(edge.type)) return false;
    return edge.source === contractId || edge.target === contractId;
  });
  for (const edge of edges) {
    keep.add(edge.source);
    keep.add(edge.target);
  }
  // segundo salto: propostas de revisão puxam intents coordenadas
  for (const edge of graph.edges) {
    if (!relevantEdgeTypes.has(edge.type)) continue;
    if (keep.has(edge.source) || keep.has(edge.target)) {
      keep.add(edge.source);
      keep.add(edge.target);
      if (!edges.includes(edge)) edges.push(edge);
    }
  }
  return { nodes: graph.nodes.filter((node) => keep.has(node.id)), edges };
}

// Dependências de intent: depends-on transitivo + superfície imediata (works).
export function intentDepsSlice(graph: GraphSlice, intentId: string): GraphSlice {
  const keep = new Set([intentId]);
  const edges: GovernanceGraphEdge[] = [];
  let frontier = [intentId];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const edge of graph.edges) {
      if (edge.type !== "depends-on") continue;
      if (frontier.includes(edge.source) && !keep.has(edge.target)) {
        keep.add(edge.target);
        edges.push(edge);
        next.push(edge.target);
      }
    }
    frontier = next;
  }
  for (const edge of graph.edges) {
    if (edge.type === "piece" && keep.has(edge.source)) {
      keep.add(edge.target);
      edges.push(edge);
    }
  }
  return { nodes: graph.nodes.filter((node) => keep.has(node.id)), edges };
}

export function uniqueValues(
  nodes: GovernanceGraphNode[],
  key: "owner" | "team" | "cycle" | "status" | "source"
): string[] {
  return [...new Set(nodes.map((node) => node[key]).filter(Boolean))].sort();
}
