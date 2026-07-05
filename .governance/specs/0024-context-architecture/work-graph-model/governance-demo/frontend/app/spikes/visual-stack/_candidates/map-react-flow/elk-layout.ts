// elk-layout.ts — layout automático do mapa de governança com ELK (layered,
// esquerda→direita). Roda no cliente em thread principal; o resultado são
// posições x/y por nó do view-model, sem acoplar domínio ao renderer.
import ELK from "elkjs/lib/elk.bundled.js";
import type { GovernanceMapViewModel } from "../../_model/view-models";

export type LayoutedPosition = { x: number; y: number };

export const MAP_NODE_WIDTH = 260;

export function mapNodeHeight(hasDetails: boolean): number {
  return hasDetails ? 150 : 96;
}

export async function layoutGovernanceMap(
  map: GovernanceMapViewModel
): Promise<Map<string, LayoutedPosition>> {
  const elk = new ELK();
  const layouted = await elk.layout({
    id: map.scopeId,
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.layered.spacing.nodeNodeBetweenLayers": "90",
      "elk.spacing.nodeNode": "40",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
    },
    children: map.nodes.map((node) => ({
      id: node.id,
      width: MAP_NODE_WIDTH,
      height: mapNodeHeight(Boolean(node.nextStep || node.evidence || node.cta)),
    })),
    edges: map.edges.map((edge) => ({
      id: edge.id,
      sources: [edge.from],
      targets: [edge.to],
    })),
  });

  const positions = new Map<string, LayoutedPosition>();
  for (const child of layouted.children ?? []) {
    positions.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
  }
  return positions;
}
