"use client";

// TextualFallback — fallback textual/lista obrigatório para acessibilidade:
// o mesmo view-model do mapa/grafo renderizado como lista navegável, sem canvas.
import { Box, Chip, Typography } from "@mui/material";
import { Flex } from "@/app/_ui/shared";
import type {
  GovernanceGraphEdge,
  GovernanceGraphNode,
  GovernanceMapViewModel,
} from "../../_model/view-models";

export function MapTextualFallback({ map }: { map: GovernanceMapViewModel }) {
  return (
    <Box component="ol" sx={{ m: 0, pl: 3, display: "grid", gap: 1 }}>
      {map.nodes.map((node) => {
        const outgoing = map.edges.filter((edge) => edge.from === node.id);
        return (
          <Box component="li" key={node.id}>
            <Flex align="center" gap={1} wrap>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                [{node.kind}] {node.title}
              </Typography>
              <Chip size="small" variant="outlined" label={node.confidence} />
              {node.risk !== "low" ? (
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  label={`risco: ${node.risk}`}
                />
              ) : null}
            </Flex>
            {node.nextStep ? (
              <Typography variant="caption" color="text.secondary">
                Próximo passo: {node.nextStep}
              </Typography>
            ) : null}
            {outgoing.length > 0 ? (
              <Typography variant="caption" color="text.secondary" component="div">
                Conecta a: {outgoing.map((edge) => `${edge.label ?? "→"} ${edge.to}`).join("; ")}
              </Typography>
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}

export function GraphTextualFallback({
  nodes,
  edges,
  limit = 60,
}: {
  nodes: GovernanceGraphNode[];
  edges: GovernanceGraphEdge[];
  limit?: number;
}) {
  const shown = nodes.slice(0, limit);
  return (
    <Box sx={{ display: "grid", gap: 0.5, maxHeight: 320, overflow: "auto" }}>
      {shown.map((node) => {
        const degree = edges.filter(
          (edge) => edge.source === node.id || edge.target === node.id
        ).length;
        return (
          <Typography key={node.id} variant="caption">
            <strong>{node.label}</strong> · {node.type} · {node.team || "sem time"} ·{" "}
            {node.confidence} · {degree} conexão(ões)
          </Typography>
        );
      })}
      {nodes.length > shown.length ? (
        <Typography variant="caption" color="text.secondary">
          … e mais {nodes.length - shown.length} nós (lista truncada no fallback).
        </Typography>
      ) : null}
    </Box>
  );
}
