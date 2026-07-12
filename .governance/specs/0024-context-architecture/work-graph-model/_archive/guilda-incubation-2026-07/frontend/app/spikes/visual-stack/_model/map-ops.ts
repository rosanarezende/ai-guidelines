// map-ops.ts — operações puras sobre o GovernanceMapViewModel: filtro por
// tipo/confiança/risco/time/contrato, busca textual e vizinhança para foco.
// A lib visual só renderiza o resultado; nada aqui toca domínio ou SSOT.
import type { GovernanceMapNode, GovernanceMapViewModel, MapFilterState } from "./view-models";

export function applyMapFilter(
  map: GovernanceMapViewModel,
  filter: MapFilterState
): GovernanceMapViewModel {
  const text = filter.text.trim().toLowerCase();
  const nodes = map.nodes.filter((node) => {
    if (filter.kinds.length > 0 && !filter.kinds.includes(node.kind)) return false;
    if (filter.confidence && node.confidence !== filter.confidence) return false;
    if (filter.risk && node.risk !== filter.risk) return false;
    if (filter.team && node.team !== filter.team) return false;
    if (filter.onlyContract && !node.touchesContract) return false;
    if (text && !matchesText(node, text)) return false;
    return true;
  });
  const kept = new Set(nodes.map((node) => node.id));
  return {
    ...map,
    nodes,
    edges: map.edges.filter((edge) => kept.has(edge.from) && kept.has(edge.to)),
  };
}

function matchesText(node: GovernanceMapNode, text: string): boolean {
  return (
    node.title.toLowerCase().includes(text) ||
    node.id.toLowerCase().includes(text) ||
    (node.subtitle ?? "").toLowerCase().includes(text) ||
    (node.team ?? "").toLowerCase().includes(text) ||
    (node.owner ?? "").toLowerCase().includes(text)
  );
}

export function searchMapNodes(
  map: GovernanceMapViewModel,
  text: string,
  limit = 8
): GovernanceMapNode[] {
  const query = text.trim().toLowerCase();
  if (!query) return [];
  return map.nodes.filter((node) => matchesText(node, query)).slice(0, limit);
}

// Vizinhança não-direcionada até `depth` saltos, para foco/realce.
export function mapNeighborhood(
  map: GovernanceMapViewModel,
  rootId: string,
  depth = 2
): Set<string> {
  const reached = new Set([rootId]);
  let frontier = [rootId];
  for (let level = 0; level < depth && frontier.length > 0; level += 1) {
    const next: string[] = [];
    for (const edge of map.edges) {
      if (frontier.includes(edge.from) && !reached.has(edge.to)) {
        reached.add(edge.to);
        next.push(edge.to);
      }
      if (frontier.includes(edge.to) && !reached.has(edge.from)) {
        reached.add(edge.from);
        next.push(edge.from);
      }
    }
    frontier = next;
  }
  return reached;
}

export function mapTeams(map: GovernanceMapViewModel): string[] {
  return [...new Set(map.nodes.map((node) => node.team).filter(Boolean) as string[])].sort();
}
