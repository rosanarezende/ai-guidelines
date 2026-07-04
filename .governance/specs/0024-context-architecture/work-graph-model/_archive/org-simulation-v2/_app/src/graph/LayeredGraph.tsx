// LayeredGraph — grafo SVG simples, SEM dependência (D3 fica p/ depois). Layout em CAMADAS (colunas):
// cada nó tem um `layer` (coluna); distribui na vertical. Arestas entre colunas = bezier; mesma coluna = arco.
// Passar o mouse num nó destaca suas arestas/vizinhos. Reutilizável (grafo de intents, de proposals, …).
import { useState } from "react";

export type GKind = "intent" | "repo" | "proposal" | "exploration" | "contract";

export interface GNode {
  id: string;
  label: string;
  sub?: string;
  layer: number;
  kind?: GKind;
}
export interface GEdge {
  from: string;
  to: string;
  label?: string;
}

const COL_W = 240;
const ROW_H = 66;
const NODE_W = 172;
const NODE_H = 44;
const PAD = 28;

const COLOR: Record<GKind, string> = {
  intent: "#3b82f6",
  repo: "#1c8a45",
  proposal: "#c9770f",
  exploration: "#8b5cf6",
  contract: "#0891b2",
};

const cut = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function LayeredGraph({
  nodes,
  edges,
  onSelect,
}: {
  nodes: GNode[];
  edges: GEdge[];
  onSelect?: (id: string) => void;
}) {
  const [hover, setHover] = useState<string | null>(null);

  // posições: agrupa por camada (coluna) e distribui na vertical, centralizando cada coluna.
  const byLayer = new Map<number, GNode[]>();
  for (const n of nodes) {
    const arr = byLayer.get(n.layer) ?? [];
    arr.push(n);
    byLayer.set(n.layer, arr);
  }
  const layers = [...byLayer.keys()].sort((a, b) => a - b);
  const maxRows = Math.max(1, ...layers.map((l) => (byLayer.get(l) ?? []).length));
  const pos = new Map<string, { x: number; y: number }>();
  layers.forEach((l, col) => {
    const arr = byLayer.get(l) ?? [];
    const offset = ((maxRows - arr.length) * ROW_H) / 2;
    arr.forEach((n, i) => pos.set(n.id, { x: PAD + col * COL_W, y: PAD + offset + i * ROW_H }));
  });
  const width = PAD * 2 + (layers.length - 1) * COL_W + NODE_W;
  const height = PAD * 2 + maxRows * ROW_H;

  const cx = (id: string): number => (pos.get(id)?.x ?? 0) + NODE_W / 2;
  const cy = (id: string): number => (pos.get(id)?.y ?? 0) + NODE_H / 2;
  const layerOf = (id: string): number => nodes.find((n) => n.id === id)?.layer ?? 0;

  const edgeOn = (e: GEdge): boolean => hover === null || e.from === hover || e.to === hover;
  const nodeOn = (id: string): boolean =>
    hover === null ||
    hover === id ||
    edges.some((e) => (e.from === hover && e.to === id) || (e.to === hover && e.from === id));

  function path(e: GEdge): string {
    const x1 = cx(e.from);
    const y1 = cy(e.from);
    const x2 = cx(e.to);
    const y2 = cy(e.to);
    if (layerOf(e.from) === layerOf(e.to)) {
      const mx = Math.max(x1, x2) + 80; // mesma coluna → arco pra direita
      return `M ${x1} ${y1} Q ${mx} ${(y1 + y2) / 2} ${x2} ${y2}`;
    }
    const ex1 = x1 < x2 ? x1 + NODE_W / 2 : x1 - NODE_W / 2;
    const ex2 = x1 < x2 ? x2 - NODE_W / 2 : x2 + NODE_W / 2;
    const mx = (ex1 + ex2) / 2;
    return `M ${ex1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${ex2} ${y2}`;
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ maxWidth: "100%" }}
    >
      {edges.map((e, i) => (
        <path
          key={`e${i}`}
          d={path(e)}
          fill="none"
          stroke="currentColor"
          strokeOpacity={edgeOn(e) ? (hover ? 0.55 : 0.28) : 0.08}
          strokeWidth={edgeOn(e) && hover ? 2 : 1.2}
        />
      ))}
      {hover &&
        edges.map((e, i) =>
          e.label && edgeOn(e) ? (
            <text
              key={`t${i}`}
              x={(cx(e.from) + cx(e.to)) / 2}
              y={(cy(e.from) + cy(e.to)) / 2 - 4}
              fontSize="9"
              fill="currentColor"
              fillOpacity={0.7}
              textAnchor="middle"
            >
              {cut(e.label, 22)}
            </text>
          ) : null
        )}
      {nodes.map((n) => {
        const p = pos.get(n.id) ?? { x: 0, y: 0 };
        const color = COLOR[n.kind ?? "repo"];
        const on = nodeOn(n.id);
        return (
          <g
            key={n.id}
            transform={`translate(${p.x},${p.y})`}
            opacity={on ? 1 : 0.32}
            style={{ cursor: onSelect ? "pointer" : "default" }}
            onMouseEnter={() => setHover(n.id)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onSelect?.(n.id)}
          >
            <rect
              width={NODE_W}
              height={NODE_H}
              rx={10}
              fill={`${color}22`}
              stroke={color}
              strokeWidth={1.5}
            />
            <text x={11} y={18} fontSize="11.5" fontWeight={600} fill="currentColor">
              {cut(n.label, 24)}
            </text>
            {n.sub && (
              <text x={11} y={32} fontSize="9" fill="currentColor" fillOpacity={0.6}>
                {cut(n.sub, 27)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
