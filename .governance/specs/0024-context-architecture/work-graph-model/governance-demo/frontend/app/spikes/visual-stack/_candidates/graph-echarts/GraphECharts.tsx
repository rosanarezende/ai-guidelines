"use client";

// GraphECharts — candidato Apache ECharts (série graph, canvas 2D) para o
// grafo técnico: força embutida, tooltip/legenda prontos, integração natural
// com a superfície de dashboards.
import { Box, Typography } from "@mui/material";
import { useCallback, useMemo } from "react";
import type { EChartsOption } from "echarts";
import {
  clusterPositionsByType,
  degreeIndex,
  nodeSize,
  typeColor,
  type GraphCandidateProps,
} from "../shared/graph-shared";
import { EChartsPanel } from "../shared/EChartsPanel";

const CLUSTER_SCALE = 14;

export function GraphECharts({
  nodes,
  edges,
  selectedId,
  highlight,
  grouped,
  onSelect,
}: GraphCandidateProps) {
  const option = useMemo<EChartsOption>(() => {
    const degrees = degreeIndex(edges);
    const types = [...new Set(nodes.map((node) => node.type))];
    const dimmed = highlight.size > 0;
    const clusters = grouped ? clusterPositionsByType(nodes) : null;
    return {
      tooltip: {
        formatter: (params: unknown) => {
          const event = params as { data?: { id?: string; vm?: string } };
          return event.data?.vm ?? event.data?.id ?? "";
        },
      },
      legend: { type: "scroll", bottom: 0, data: types },
      series: [
        {
          type: "graph",
          layout: grouped ? "none" : "force",
          roam: true,
          draggable: false,
          force: {
            initLayout: "circular",
            repulsion: nodes.length > 1500 ? 18 : 60,
            gravity: 0.08,
            friction: 0.25,
            // layoutAnimation:false com milhares de nós calcula o force em um
            // único bloco síncrono e congela a main thread (achado do spike)
            layoutAnimation: true,
          },
          categories: types.map((type) => ({ name: type, itemStyle: { color: typeColor(type) } })),
          data: nodes.map((node) => ({
            id: node.id,
            name: node.label,
            category: types.indexOf(node.type),
            ...(clusters
              ? {
                  x: (clusters.get(node.id)?.x ?? 0) * CLUSTER_SCALE,
                  y: (clusters.get(node.id)?.y ?? 0) * CLUSTER_SCALE,
                }
              : {}),
            symbolSize: nodeSize(degrees.get(node.id) ?? 0) * 1.6,
            itemStyle:
              dimmed && !highlight.has(node.id) && node.id !== selectedId
                ? { color: "#e5e7eb" }
                : node.id === selectedId
                  ? { borderColor: "#111827", borderWidth: 2 }
                  : undefined,
            vm: [
              `<b>${node.label}</b> (${node.type})`,
              `time: ${node.team || "—"} · responsável: ${node.owner || "—"}`,
              `confiança: ${node.confidence} · status: ${node.status || "—"}`,
              `fonte: ${node.source || "—"}`,
            ].join("<br/>"),
          })),
          edges: edges.map((edge) => ({
            source: edge.source,
            target: edge.target,
            lineStyle:
              dimmed && !(highlight.has(edge.source) && highlight.has(edge.target))
                ? { color: "#f3f4f6" }
                : { color: "#d1d5db" },
          })),
          label: { show: nodes.length <= 300, position: "right", fontSize: 10 },
          emphasis: { focus: "adjacency" },
          progressive: 400,
          progressiveThreshold: 1000,
        },
      ],
    };
  }, [nodes, edges, selectedId, highlight, grouped]);

  const handleClick = useCallback(
    (payload: { id?: string }) => {
      onSelect(payload.id ?? null);
    },
    [onSelect]
  );

  return (
    <Box sx={{ display: "grid", gap: 0.5 }}>
      <EChartsPanel option={option} height={440} onNodeClick={handleClick} />
      <Typography variant="caption" color="text.secondary">
        {nodes.length} nós · {edges.length} arestas ·{" "}
        {grouped ? "agrupado por tipo (layout none)" : "força animada"} · canvas 2D com render
        progressivo
      </Typography>
    </Box>
  );
}
