"use client";

// GraphReagraph — candidato Reagraph (WebGL/three.js, React-first).
// three/@react-three não sobrevive a SSR: import dinâmico com ssr:false;
// o custo disso (bundle + hydration tardia) é achado do spike.
import { Box, Skeleton, Typography } from "@mui/material";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { nodeSize, degreeIndex, typeColor, type GraphCandidateProps } from "../shared/graph-shared";

const GraphCanvas = dynamic(() => import("reagraph").then((module) => module.GraphCanvas), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" height={440} />,
});

export function GraphReagraph({
  nodes,
  edges,
  selectedId,
  highlight,
  onSelect,
}: GraphCandidateProps) {
  const degrees = useMemo(() => degreeIndex(edges), [edges]);

  const reaNodes = useMemo(
    () =>
      nodes.map((node) => ({
        id: node.id,
        label: node.label,
        fill: highlight.size > 0 && !highlight.has(node.id) ? "#e5e7eb" : typeColor(node.type),
        size: nodeSize(degrees.get(node.id) ?? 0),
        data: node,
      })),
    [nodes, degrees, highlight]
  );

  const reaEdges = useMemo(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.type,
      })),
    [edges]
  );

  return (
    <Box sx={{ display: "grid", gap: 0.5 }}>
      <Box
        sx={{
          height: 440,
          position: "relative",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <GraphCanvas
          nodes={reaNodes}
          edges={reaEdges}
          layoutType="forceDirected2d"
          selections={selectedId ? [selectedId] : []}
          onNodeClick={(node) => onSelect(node.id)}
          onCanvasClick={() => onSelect(null)}
          labelType={nodes.length <= 400 ? "auto" : "none"}
          animated={nodes.length <= 800}
        />
      </Box>
      <Typography variant="caption" color="text.secondary">
        {nodes.length} nós · {edges.length} arestas · client-only (ssr:false)
      </Typography>
    </Box>
  );
}
