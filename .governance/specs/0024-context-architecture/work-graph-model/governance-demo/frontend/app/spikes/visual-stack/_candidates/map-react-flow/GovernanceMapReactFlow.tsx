"use client";

// GovernanceMapReactFlow — candidato principal do mapa de governança:
// React Flow (@xyflow/react) + ELK (elkjs) com nós ricos e layout automático.
import "@xyflow/react/dist/style.css";
import { Box, Skeleton, Typography } from "@mui/material";
import { Background, Controls, MarkerType, ReactFlow, type Edge } from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import type { GovernanceMapViewModel } from "../../_model/view-models";
import { layoutGovernanceMap, type LayoutedPosition } from "./elk-layout";
import { MapNodeCard, type MapFlowNode } from "./MapNodeCard";

const nodeTypes = { governance: MapNodeCard };

export function GovernanceMapReactFlow({ map }: { map: GovernanceMapViewModel }) {
  const [positions, setPositions] = useState<Map<string, LayoutedPosition> | null>(null);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPositions(null);
    layoutGovernanceMap(map)
      .then((result) => {
        if (!cancelled) setPositions(result);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLayoutError(error instanceof Error ? error.message : String(error));
      });
    return () => {
      cancelled = true;
    };
  }, [map]);

  const nodes = useMemo<MapFlowNode[]>(() => {
    if (!positions) return [];
    return map.nodes.map((vm) => ({
      id: vm.id,
      type: "governance" as const,
      position: positions.get(vm.id) ?? { x: 0, y: 0 },
      data: { vm },
    }));
  }, [map, positions]);

  const edges = useMemo<Edge[]>(
    () =>
      map.edges.map((edge) => ({
        id: edge.id,
        source: edge.from,
        target: edge.to,
        label: edge.label,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 1.5 },
        labelStyle: { fontSize: 10, fill: "#4b5563" },
      })),
    [map]
  );

  if (layoutError) {
    return (
      <Typography variant="body2" color="error">
        Falha no layout ELK: {layoutError}
      </Typography>
    );
  }
  if (!positions) {
    return <Skeleton variant="rounded" height={420} />;
  }

  return (
    <Box sx={{ height: 480, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        nodesDraggable
        nodesConnectable={false}
      >
        <Background gap={24} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </Box>
  );
}
