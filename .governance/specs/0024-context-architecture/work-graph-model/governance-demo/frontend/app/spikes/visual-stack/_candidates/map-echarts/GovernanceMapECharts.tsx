"use client";

// GovernanceMapECharts — comparativo LEVE do mapa de governança na série
// `graph` do Apache ECharts, com camadas fixas (decisão→…→dashboard).
// Objetivo do spike: medir se ECharts consegue parecer fluxo guiado de produto
// ou se permanece com cara de grafo/chart (limite esperado: nó rico com CTA).
import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import type { GovernanceMapViewModel, MapNodeKind } from "../../_model/view-models";
import { EChartsPanel } from "../shared/EChartsPanel";
import { KIND_COLORS } from "../map-react-flow/MapNodeCard";

const KIND_LAYER: Record<MapNodeKind, number> = {
  objective: 0,
  target: 1,
  intent: 2,
  decision: 3,
  "repo-work": 3,
  contract: 4,
  outcome: 5,
  dashboard: 6,
};

const CONFIDENCE_GLYPH: Record<string, string> = {
  verified: "✓",
  pending: "…",
  "no-evidence": "∅",
  "self-declared": "s",
  "break-glass": "!",
  stale: "≠",
};

export function GovernanceMapECharts({ map }: { map: GovernanceMapViewModel }) {
  const option = useMemo<EChartsOption>(() => {
    const perLayerCount = new Map<number, number>();
    const kinds = [...new Set(map.nodes.map((node) => node.kind))];
    const data = map.nodes.map((node) => {
      const layer = KIND_LAYER[node.kind];
      const indexInLayer = perLayerCount.get(layer) ?? 0;
      perLayerCount.set(layer, indexInLayer + 1);
      return {
        id: node.id,
        name: `${node.title.slice(0, 34)}${node.title.length > 34 ? "…" : ""} ${
          CONFIDENCE_GLYPH[node.confidence] ?? ""
        }`,
        x: layer * 240,
        y: indexInLayer * 110 + layer * 18,
        category: kinds.indexOf(node.kind),
        symbolSize: node.risk === "high" ? 34 : 24,
        itemStyle: node.risk === "high" ? { borderColor: "#9f1239", borderWidth: 3 } : undefined,
        tooltip: {
          formatter: [
            `<b>${node.title}</b>`,
            node.subtitle ?? "",
            `confiança: ${node.confidence} · risco: ${node.risk}`,
            node.nextStep ? `próximo passo: ${node.nextStep}` : "",
            node.evidence ? `evidência: ${node.evidence}` : "",
          ]
            .filter(Boolean)
            .join("<br/>"),
        },
      };
    });

    return {
      tooltip: { trigger: "item" },
      legend: { data: kinds, bottom: 0, type: "scroll" },
      series: [
        {
          type: "graph",
          layout: "none",
          roam: true,
          data,
          categories: kinds.map((kind) => ({
            name: kind,
            itemStyle: { color: KIND_COLORS[kind] },
          })),
          edges: map.edges.map((edge) => ({
            source: edge.from,
            target: edge.to,
            label: edge.label
              ? { show: true, formatter: edge.label, fontSize: 9, color: "#6b7280" }
              : undefined,
          })),
          label: { show: true, position: "bottom", fontSize: 10, width: 150, overflow: "break" },
          edgeSymbol: ["none", "arrow"],
          edgeSymbolSize: 7,
          lineStyle: { curveness: 0.08, color: "#9ca3af" },
          emphasis: { focus: "adjacency" },
        },
      ],
    };
  }, [map]);

  return <EChartsPanel option={option} height={460} />;
}
