"use client";

// GraphSigma — candidato Sigma.js v3 + Graphology para o grafo técnico.
// WebGL, vocação large-graph. Dois layouts determinísticos: força (círculo
// inicial + ForceAtlas2 síncrono) e agrupado por tipo (clusters phyllotaxis).
import { Box, Typography } from "@mui/material";
import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";
import { useEffect, useRef, useState } from "react";
import Sigma from "sigma";
import {
  clusterPositionsByType,
  degreeIndex,
  nodeSize,
  typeColor,
  type GraphCandidateProps,
} from "../shared/graph-shared";

export function GraphSigma({
  nodes,
  edges,
  selectedId,
  highlight,
  grouped,
  onSelect,
}: GraphCandidateProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const [layoutMs, setLayoutMs] = useState<number | null>(null);

  // (re)construção do grafo quando o dataset ou o layout muda
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const graph = new Graph({ multi: true, type: "mixed" });
    const degrees = degreeIndex(edges);
    const clusters = grouped ? clusterPositionsByType(nodes) : null;
    const typeOrder = [...new Set(nodes.map((node) => node.type))];
    const perType = new Map<string, number>();
    for (const node of nodes) {
      const typeIndex = typeOrder.indexOf(node.type);
      const indexInType = perType.get(node.type) ?? 0;
      perType.set(node.type, indexInType + 1);
      // círculo determinístico por tipo (raio cresce com o tipo)
      const angle = indexInType * 2.399963; // golden angle: espalha sem RNG
      const radius = 4 + typeIndex * 3 + (indexInType % 7) * 0.35;
      const position = clusters?.get(node.id) ?? {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
      graph.addNode(node.id, {
        label: node.label,
        color: typeColor(node.type),
        size: nodeSize(degrees.get(node.id) ?? 0),
        x: position.x,
        y: position.y,
      });
    }
    for (const edge of edges) {
      if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
        graph.addEdgeWithKey(edge.id, edge.source, edge.target, { color: "#d1d5db", size: 0.6 });
      }
    }

    if (!grouped) {
      const startedAt = performance.now();
      const iterations = nodes.length > 2000 ? 30 : 80;
      forceAtlas2.assign(graph, {
        iterations,
        settings: { ...forceAtlas2.inferSettings(graph), adjustSizes: false },
      });
      setLayoutMs(Math.round(performance.now() - startedAt));
    } else {
      setLayoutMs(null);
    }

    const sigma = new Sigma(graph, container, {
      renderLabels: nodes.length <= 400,
      labelFont: "Inter, sans-serif",
      labelSize: 11,
      minCameraRatio: 0.03,
      maxCameraRatio: 20,
    });
    sigmaRef.current = sigma;
    sigma.on("clickNode", ({ node }) => onSelect(node));
    sigma.on("clickStage", () => onSelect(null));

    return () => {
      sigma.kill();
      sigmaRef.current = null;
    };
    // onSelect estável via section; dataset/layout são as dependências reais
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, grouped]);

  // realce de seleção/caminho sem reconstruir o grafo
  useEffect(() => {
    const sigma = sigmaRef.current;
    if (!sigma) return;
    const graph = sigma.getGraph();
    const neighbors =
      selectedId && graph.hasNode(selectedId)
        ? new Set(graph.neighbors(selectedId))
        : new Set<string>();
    sigma.setSetting("nodeReducer", (node, data) => {
      const emphasized = highlight.has(node) || node === selectedId || neighbors.has(node);
      if (!selectedId && highlight.size === 0) return data;
      return emphasized
        ? { ...data, zIndex: 1, highlighted: node === selectedId }
        : { ...data, color: "#e5e7eb", label: null, zIndex: 0 };
    });
    sigma.setSetting("edgeReducer", (edge, data) => {
      if (!selectedId && highlight.size === 0) return data;
      const [source, target] = graph.extremities(edge);
      const active =
        (highlight.has(source) && highlight.has(target)) ||
        source === selectedId ||
        target === selectedId;
      return active ? { ...data, color: "#14532d", size: 1.4 } : { ...data, color: "#f3f4f6" };
    });
    sigma.refresh();
  }, [selectedId, highlight]);

  return (
    <Box sx={{ display: "grid", gap: 0.5 }}>
      <Box
        ref={containerRef}
        sx={{ height: 440, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
      />
      <Typography variant="caption" color="text.secondary">
        {nodes.length} nós · {edges.length} arestas
        {grouped
          ? " · agrupado por tipo (clusters determinísticos, sem força)"
          : layoutMs !== null
            ? ` · ForceAtlas2 em ${layoutMs}ms (main thread)`
            : ""}
      </Typography>
    </Box>
  );
}
