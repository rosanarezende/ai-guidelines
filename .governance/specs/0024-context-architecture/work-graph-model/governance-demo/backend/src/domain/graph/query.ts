// query.ts — consultas puras sobre o read-model de grafo derivado.
// O grafo é projeção: nenhuma query aqui autoriza ação; ação governada
// relê o SSOT via runtime (ver backend/examples/read-models/ACTION-CONTRACT.md).
import type { GraphEdge, GraphNode, GraphReadModel } from "../governance.ts";

export type GraphNeighbor = {
  node: GraphNode;
  edge: GraphEdge;
  direction: "in" | "out";
};

export type GraphNodeDetail = {
  node: GraphNode;
  neighbors: GraphNeighbor[];
};

export type ContractImpact = {
  contract: GraphNode;
  ownerRepo: string | null;
  consumers: string[];
  changedBy: string[];
  consumedBy: string[];
  revisionProposals: string[];
  outcomesCiting: string[];
  affectedIntents: string[];
  affectedTargets: string[];
};

export type IntentDependencies = {
  intent: GraphNode;
  dependsOn: string[];
  dependedBy: string[];
  transitiveDependsOn: string[];
  works: string[];
  repos: string[];
  contractsChanged: string[];
  contractsConsumed: string[];
};

export type GraphConflict = {
  kind: "contract-contention" | "attestation-collapse" | "validation-error";
  node: string;
  detail: string;
  parties: string[];
};

type GraphIndex = {
  byId: Map<string, GraphNode>;
  outEdges: Map<string, GraphEdge[]>;
  inEdges: Map<string, GraphEdge[]>;
};

function indexGraph(graph: GraphReadModel): GraphIndex {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const outEdges = new Map<string, GraphEdge[]>();
  const inEdges = new Map<string, GraphEdge[]>();
  for (const edge of graph.edges) {
    outEdges.set(edge.source, [...(outEdges.get(edge.source) || []), edge]);
    inEdges.set(edge.target, [...(inEdges.get(edge.target) || []), edge]);
  }
  return { byId, outEdges, inEdges };
}

export function listGraphNodes(
  graph: GraphReadModel,
  filter: { type?: string; q?: string } = {}
): GraphNode[] {
  const q = filter.q?.toLowerCase();
  return graph.nodes.filter((node) => {
    if (filter.type && node.type !== filter.type) return false;
    if (
      q &&
      !node.id.toLowerCase().includes(q) &&
      !String(node.label || "")
        .toLowerCase()
        .includes(q)
    )
      return false;
    return true;
  });
}

export function listGraphEdges(graph: GraphReadModel, filter: { type?: string } = {}): GraphEdge[] {
  return graph.edges.filter((edge) => !filter.type || edge.type === filter.type);
}

// Aceita id direto ("intent-cta-upgrade") ou GlobalRef ("intent:intent-cta-upgrade").
export function resolveGraphRef(graph: GraphReadModel, ref: string): GraphNode | null {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  if (byId.has(ref)) return byId.get(ref) || null;
  const [kind, id] = String(ref || "").split(":");
  if (!kind || !id) return null;
  const candidate = byId.get(id);
  return candidate && candidate.type === kind ? candidate : null;
}

export function graphNodeDetail(graph: GraphReadModel, ref: string): GraphNodeDetail | null {
  const node = resolveGraphRef(graph, ref);
  if (!node) return null;
  const { byId, outEdges, inEdges } = indexGraph(graph);
  const neighbors: GraphNeighbor[] = [];
  for (const edge of outEdges.get(node.id) || []) {
    const target = byId.get(edge.target);
    if (target) neighbors.push({ node: target, edge, direction: "out" });
  }
  for (const edge of inEdges.get(node.id) || []) {
    const source = byId.get(edge.source);
    if (source) neighbors.push({ node: source, edge, direction: "in" });
  }
  return { node, neighbors };
}

// Vizinhança até `depth` saltos (não-direcionada) — base de "caminho/adjacências".
export function graphAdjacency(
  graph: GraphReadModel,
  ref: string,
  depth = 1
): { root: GraphNode; nodes: GraphNode[]; edges: GraphEdge[] } | null {
  const root = resolveGraphRef(graph, ref);
  if (!root) return null;
  const { byId, outEdges, inEdges } = indexGraph(graph);
  const seen = new Set<string>([root.id]);
  const collectedEdges = new Map<string, GraphEdge>();
  let frontier = [root.id];
  for (let hop = 0; hop < depth && frontier.length; hop += 1) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const edge of [...(outEdges.get(id) || []), ...(inEdges.get(id) || [])]) {
        collectedEdges.set(edge.id, edge);
        for (const neighborId of [edge.source, edge.target]) {
          if (!seen.has(neighborId)) {
            seen.add(neighborId);
            next.push(neighborId);
          }
        }
      }
    }
    frontier = next;
  }
  return {
    root,
    nodes: [...seen].map((id) => byId.get(id)).filter((node): node is GraphNode => Boolean(node)),
    edges: [...collectedEdges.values()],
  };
}

// Menor caminho não-direcionado entre dois nós (BFS) — null quando não conectados.
export function graphPath(
  graph: GraphReadModel,
  fromRef: string,
  toRef: string
): { nodes: GraphNode[]; edges: GraphEdge[] } | null {
  const from = resolveGraphRef(graph, fromRef);
  const to = resolveGraphRef(graph, toRef);
  if (!from || !to) return null;
  const { byId, outEdges, inEdges } = indexGraph(graph);
  const previous = new Map<string, { node: string; edge: GraphEdge }>();
  const visited = new Set<string>([from.id]);
  let frontier = [from.id];
  while (frontier.length && !visited.has(to.id)) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const edge of [...(outEdges.get(id) || []), ...(inEdges.get(id) || [])]) {
        const neighbor = edge.source === id ? edge.target : edge.source;
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        previous.set(neighbor, { node: id, edge });
        next.push(neighbor);
      }
    }
    frontier = next;
  }
  if (!visited.has(to.id)) return null;
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  let cursor = to.id;
  while (cursor !== from.id) {
    const step = previous.get(cursor);
    if (!step) return null;
    const node = byId.get(cursor);
    if (node) nodes.unshift(node);
    edges.unshift(step.edge);
    cursor = step.node;
  }
  nodes.unshift(from);
  return { nodes, edges };
}

// contract -> consumers -> intents/repo-work/outcomes/targets afetados.
export function contractImpact(graph: GraphReadModel, contractRef: string): ContractImpact | null {
  const contract = resolveGraphRef(
    graph,
    contractRef.startsWith("contract:") ? contractRef : `contract:${contractRef}`
  );
  if (!contract || contract.type !== "contract") return null;
  const { outEdges, inEdges } = indexGraph(graph);
  const consumers = (outEdges.get(contract.id) || [])
    .filter((edge) => edge.type === "consumed-by")
    .map((edge) => edge.target);
  const ownerRepo =
    (inEdges.get(contract.id) || []).find((edge) => edge.type === "publishes")?.source || null;
  const changedBy = (inEdges.get(contract.id) || [])
    .filter((edge) => edge.type === "changes")
    .map((edge) => edge.source);
  const consumedBy = (inEdges.get(contract.id) || [])
    .filter((edge) => edge.type === "consumes")
    .map((edge) => edge.source);
  const revisionProposals = (outEdges.get(contract.id) || [])
    .filter((edge) => edge.type === "has-revision-proposal")
    .map((edge) => edge.target);
  const outcomesCiting = graph.nodes
    .filter((node) => node.type === "outcome")
    .filter((node) => {
      const revisions = (node.data as { "contract-revisions"?: string[] } | undefined)?.[
        "contract-revisions"
      ];
      return (revisions || []).some((cr) => String(cr).startsWith(`${contract.id}@`));
    })
    .map((node) => node.id);
  const affectedIntents = [...new Set([...changedBy, ...consumedBy])];
  const affectedTargets = affectedIntents
    .flatMap((intentId) => outEdges.get(intentId) || [])
    .filter((edge) => edge.type === "primary-target")
    .map((edge) => edge.target);
  return {
    contract,
    ownerRepo,
    consumers,
    changedBy,
    consumedBy,
    revisionProposals,
    outcomesCiting,
    affectedIntents,
    affectedTargets: [...new Set(affectedTargets)],
  };
}

export function intentDependencies(
  graph: GraphReadModel,
  intentRef: string
): IntentDependencies | null {
  const intent = resolveGraphRef(
    graph,
    intentRef.startsWith("intent:") ? intentRef : `intent:${intentRef}`
  );
  if (!intent || intent.type !== "intent") return null;
  const { outEdges, inEdges } = indexGraph(graph);
  const dependsOn = (outEdges.get(intent.id) || [])
    .filter((edge) => edge.type === "depends-on")
    .map((edge) => edge.target);
  const dependedBy = (inEdges.get(intent.id) || [])
    .filter((edge) => edge.type === "depends-on")
    .map((edge) => edge.source);
  const transitive = new Set<string>();
  let frontier = [...dependsOn];
  while (frontier.length) {
    const next: string[] = [];
    for (const id of frontier) {
      if (transitive.has(id)) continue;
      transitive.add(id);
      for (const edge of outEdges.get(id) || [])
        if (edge.type === "depends-on") next.push(edge.target);
    }
    frontier = next;
  }
  const works = (outEdges.get(intent.id) || [])
    .filter((edge) => edge.type === "piece")
    .map((edge) => edge.target);
  const repos = [
    ...new Set(
      works
        .flatMap((workId) => outEdges.get(workId) || [])
        .filter((edge) => edge.type === "in-repo")
        .map((edge) => edge.target)
    ),
  ];
  const contractsChanged = (outEdges.get(intent.id) || [])
    .filter((edge) => edge.type === "changes")
    .map((edge) => edge.target);
  const contractsConsumed = (outEdges.get(intent.id) || [])
    .filter((edge) => edge.type === "consumes")
    .map((edge) => edge.target);
  return {
    intent,
    dependsOn,
    dependedBy,
    transitiveDependsOn: [...transitive],
    works,
    repos,
    contractsChanged,
    contractsConsumed,
  };
}

// Conflitos/contensões já modelados: contrato mudado por 2+ intents, colapso de
// atestação visível e erros de validação anexados ao read-model.
export function detectGraphConflicts(graph: GraphReadModel): GraphConflict[] {
  const conflicts: GraphConflict[] = [];
  const { inEdges } = indexGraph(graph);
  for (const node of graph.nodes) {
    if (node.type === "contract") {
      const changers = (inEdges.get(node.id) || [])
        .filter((edge) => edge.type === "changes")
        .map((edge) => edge.source);
      if (changers.length > 1) {
        conflicts.push({
          kind: "contract-contention",
          node: node.id,
          detail: `contrato mudado por ${changers.length} intents — exige revision-proposal decidida`,
          parties: changers,
        });
      }
    }
    if (node.type === "target") {
      const collapse = (node.data as { "attestation-collapse"?: { "approved-by": string } })?.[
        "attestation-collapse"
      ];
      if (collapse) {
        conflicts.push({
          kind: "attestation-collapse",
          node: node.id,
          detail: "independência de atestação colapsada — badge obrigatório no dashboard",
          parties: [collapse["approved-by"]],
        });
      }
    }
  }
  for (const issue of graph.issues || []) {
    if (issue.level === "error") {
      conflicts.push({
        kind: "validation-error",
        node: issue.node,
        detail: `[${issue.rule}] ${issue.msg}`,
        parties: [],
      });
    }
  }
  return conflicts;
}
