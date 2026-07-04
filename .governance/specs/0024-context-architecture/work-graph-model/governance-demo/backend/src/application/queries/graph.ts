// graph.ts — use cases de consulta ao grafo derivado.
// Default: projeção em memória a partir do SSOT vivo (cache por revisão).
// Alternativa por env: read-model exportado em arquivo (hash-verificado).
// Neo4j permanece projeção derivada via export + loader dry-run/apply.
import {
  loadPublishedRepoContracts,
  validateRepoContracts,
} from "../../adapters/repo-first/repo-contracts.ts";
import {
  loadPublishedContexts,
  validateRepoContexts,
} from "../../adapters/repo-first/repo-contexts.ts";
import { loadPublishedRepoWorks, validateRepoWorks } from "../../adapters/repo-first/repo-works.ts";
import { FileReadModelSource } from "../../adapters/file/FileReadModelSource.ts";
import { InMemoryGraphSource } from "../../adapters/graph-memory/InMemoryGraphSource.ts";
import { buildGraphReadModel } from "../../domain/graph/build.ts";
import {
  contractImpact,
  detectGraphConflicts,
  graphAdjacency,
  graphNodeDetail,
  graphPath,
  listGraphEdges,
  listGraphNodes,
  type ContractImpact,
  type GraphConflict,
  type GraphNodeDetail,
  type IntentDependencies,
  intentDependencies,
} from "../../domain/graph/query.ts";
import type { GovernanceIssue, GraphEdge, GraphNode } from "../../domain/index.ts";
import type { GraphReadModelSource, GraphSnapshot } from "../../ports/GraphReadModelSource.ts";
import { openFileGovernanceRuntime } from "../runtime.ts";

async function projectLiveGraph(): Promise<GraphSnapshot> {
  const runtime = openFileGovernanceRuntime();
  const org = runtime.loadOrg();
  const sourceRevision = runtime.currentRevision();
  const repoContexts = loadPublishedContexts();
  const repoWorks = loadPublishedRepoWorks();
  const repoContracts = loadPublishedRepoContracts();
  const issues: GovernanceIssue[] = [
    ...runtime.validateOrg(org),
    ...(await validateRepoContexts(org, { publishedContexts: repoContexts })),
    ...validateRepoWorks(org, { publishedClaims: repoWorks }),
    ...validateRepoContracts(org, { publishedContracts: repoContracts }),
  ];
  const graph = buildGraphReadModel({ org, issues, repoContexts, repoWorks, repoContracts });
  return { graph, sourceRevision, projectedAt: new Date().toISOString() };
}

const liveSource = new InMemoryGraphSource(projectLiveGraph, () =>
  openFileGovernanceRuntime().currentRevision()
);

export function defaultGraphSource(): GraphReadModelSource {
  // GOVERNANCE_GRAPH_SOURCE=exported-file lê a projeção exportada (hash-verificada);
  // o default é a projeção viva em memória.
  if (process.env["GOVERNANCE_GRAPH_SOURCE"] === "exported-file") {
    return new FileReadModelSource();
  }
  return liveSource;
}

export type GraphQueryMeta = {
  sourceRevision: string;
  projectedAt: string;
  derived: true;
};

function meta(snapshot: GraphSnapshot): GraphQueryMeta {
  return {
    sourceRevision: snapshot.sourceRevision,
    projectedAt: snapshot.projectedAt,
    derived: true,
  };
}

export async function queryGraphOverview(
  filter: { type?: string; q?: string } = {},
  source: GraphReadModelSource = defaultGraphSource()
): Promise<GraphQueryMeta & { nodes: GraphNode[]; edges: GraphEdge[]; nodeTypes: string[] }> {
  const snapshot = await source.load();
  const nodes = listGraphNodes(snapshot.graph, filter);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = listGraphEdges(snapshot.graph).filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );
  const nodeTypes = [...new Set(snapshot.graph.nodes.map((node) => node.type))].sort();
  return { ...meta(snapshot), nodes, edges, nodeTypes };
}

export async function queryGraphNode(
  ref: string,
  source: GraphReadModelSource = defaultGraphSource()
): Promise<(GraphQueryMeta & GraphNodeDetail) | null> {
  const snapshot = await source.load();
  const detail = graphNodeDetail(snapshot.graph, ref);
  return detail ? { ...meta(snapshot), ...detail } : null;
}

export async function queryGraphAdjacency(
  ref: string,
  depth: number,
  source: GraphReadModelSource = defaultGraphSource()
): Promise<
  | (GraphQueryMeta & { root: GraphNode; nodes: GraphNode[]; edges: GraphEdge[]; depth: number })
  | null
> {
  const snapshot = await source.load();
  const result = graphAdjacency(snapshot.graph, ref, depth);
  return result ? { ...meta(snapshot), ...result, depth } : null;
}

export async function queryGraphPath(
  from: string,
  to: string,
  source: GraphReadModelSource = defaultGraphSource()
): Promise<(GraphQueryMeta & { nodes: GraphNode[]; edges: GraphEdge[] }) | null> {
  const snapshot = await source.load();
  const result = graphPath(snapshot.graph, from, to);
  return result ? { ...meta(snapshot), ...result } : null;
}

export async function queryContractImpact(
  contractId: string,
  source: GraphReadModelSource = defaultGraphSource()
): Promise<(GraphQueryMeta & ContractImpact) | null> {
  const snapshot = await source.load();
  const impact = contractImpact(snapshot.graph, contractId);
  return impact ? { ...meta(snapshot), ...impact } : null;
}

export async function queryIntentDependencies(
  intentId: string,
  source: GraphReadModelSource = defaultGraphSource()
): Promise<(GraphQueryMeta & IntentDependencies) | null> {
  const snapshot = await source.load();
  const deps = intentDependencies(snapshot.graph, intentId);
  return deps ? { ...meta(snapshot), ...deps } : null;
}

export async function queryGraphConflicts(
  source: GraphReadModelSource = defaultGraphSource()
): Promise<GraphQueryMeta & { conflicts: GraphConflict[] }> {
  const snapshot = await source.load();
  return { ...meta(snapshot), conflicts: detectGraphConflicts(snapshot.graph) };
}
