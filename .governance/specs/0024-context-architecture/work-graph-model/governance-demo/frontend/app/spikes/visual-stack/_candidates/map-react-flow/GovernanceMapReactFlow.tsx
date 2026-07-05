"use client";

// GovernanceMapReactFlow — candidato principal do mapa de governança:
// React Flow (@xyflow/react) + ELK (elkjs) com nós ricos, layout automático,
// seleção com foco de vizinhança (dimming) e tooltips por nó.
import "@xyflow/react/dist/style.css";
import { Box, Skeleton, Typography } from "@mui/material";
import { Background, Controls, MarkerType, ReactFlow, type Edge } from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import type { GovernanceMapViewModel } from "../../_model/view-models";
import { layoutGovernanceMap, type LayoutedPosition } from "./elk-layout";
import { MapNodeCard, type MapFlowNode } from "./MapNodeCard";

const nodeTypes = { governance: MapNodeCard };

export function GovernanceMapReactFlow({
  map,
  selectedId,
  highlight,
  onSelect,
}: {
  map: GovernanceMapViewModel;
  selectedId: string | null;
  highlight: ReadonlySet<string>;
  onSelect: (id: string | null) => void;
}) {
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

  const focusActive = highlight.size > 0;

  const nodes = useMemo<MapFlowNode[]>(() => {
    if (!positions) return [];
    return map.nodes.map((vm) => ({
      id: vm.id,
      type: "governance" as const,
      position: positions.get(vm.id) ?? { x: 0, y: 0 },
      data: {
        vm,
        dimmed: focusActive && !highlight.has(vm.id),
        selected: vm.id === selectedId,
      },
    }));
  }, [map, positions, focusActive, highlight, selectedId]);

  const edges = useMemo<Edge[]>(
    () =>
      map.edges.map((edge) => {
        const inFocus = !focusActive || (highlight.has(edge.from) && highlight.has(edge.to));
        return {
          id: edge.id,
          source: edge.from,
          target: edge.to,
          label: edge.label,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: {
            strokeWidth: inFocus ? 1.5 : 1,
            opacity: inFocus ? 1 : 0.15,
          },
          labelStyle: { fontSize: 10, fill: "#4b5563", opacity: inFocus ? 1 : 0.2 },
        };
      }),
    [map, focusActive, highlight]
  );

  if (layoutError) {
    return (
      <Typography variant="body2" color="error">
        Falha no layout ELK: {layoutError}
      </Typography>
    );
  }
  if (!positions) {
    return <Skeleton variant="rounded" height={480} />;
  }

  return (
    <Box sx={{ height: 520, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        nodesDraggable
        nodesConnectable={false}
        onNodeClick={(_event, node) => onSelect(node.id)}
        onPaneClick={() => onSelect(null)}
      >
        <Background gap={24} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </Box>
  );
}
