// graph-shared.ts — convenções visuais comuns do spike de grafo técnico:
// mesma cor por tipo de nó e mesmo dimensionamento por grau nos três
// candidatos, para a comparação medir o renderer, não o styling.
import type { GovernanceGraphEdge, GovernanceGraphNode } from "../../_model/view-models";

export const GRAPH_TYPE_COLORS: Record<string, string> = {
  objective: "#14532d",
  area: "#15803d",
  target: "#1f4b99",
  intent: "#0f766e",
  work: "#374151",
  "repo-work-ack": "#4b5563",
  repo: "#7c2d12",
  module: "#a16207",
  contract: "#9a5b00",
  "repo-contract": "#b45309",
  "contract-revision-proposal": "#d97706",
  outcome: "#166534",
  metric: "#0e7490",
  team: "#6d28d9",
  thesis: "#7e22ce",
  proposal: "#be185d",
  verdict: "#1e3a8a",
  incident: "#9f1239",
  standalone: "#525252",
  authority: "#334155",
  "break-glass": "#dc2626",
  "access-request": "#ea580c",
  "code-touchpoint": "#78716c",
  "repo-context": "#57534e",
  origin: "#a8a29e",
};

export const GRAPH_FALLBACK_COLOR = "#6b7280";

export function typeColor(type: string): string {
  return GRAPH_TYPE_COLORS[type] ?? GRAPH_FALLBACK_COLOR;
}

export function degreeIndex(edges: GovernanceGraphEdge[]): Map<string, number> {
  const degrees = new Map<string, number>();
  for (const edge of edges) {
    degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
    degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
  }
  return degrees;
}

export function nodeSize(degree: number): number {
  return 3 + Math.min(9, Math.sqrt(degree) * 2);
}

export type GraphCandidateProps = {
  nodes: GovernanceGraphNode[];
  edges: GovernanceGraphEdge[];
  selectedId: string | null;
  highlight: ReadonlySet<string>;
  onSelect: (id: string | null) => void;
};
