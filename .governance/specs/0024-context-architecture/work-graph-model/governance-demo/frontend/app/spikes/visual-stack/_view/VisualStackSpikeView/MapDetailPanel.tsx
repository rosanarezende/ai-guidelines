"use client";

// MapDetailPanel — painel lateral de detalhe do nó selecionado no mapa:
// todos os campos do view-model + conexões, em linguagem de produto.
import { Button, Chip, Divider, Paper, Typography } from "@mui/material";
import Link from "next/link";
import { Flex } from "@/app/_ui/shared";
import { CONFIDENCE_COLOR } from "../../_candidates/map-react-flow/MapNodeCard";
import type { GovernanceMapNode, GovernanceMapViewModel } from "../../_model/view-models";

export function MapDetailPanel({
  map,
  node,
  onClose,
}: {
  map: GovernanceMapViewModel;
  node: GovernanceMapNode;
  onClose: () => void;
}) {
  const outgoing = map.edges.filter((edge) => edge.from === node.id);
  const incoming = map.edges.filter((edge) => edge.to === node.id);
  const titleOf = (id: string) => map.nodes.find((entry) => entry.id === id)?.title ?? id;

  return (
    <Paper variant="outlined" sx={{ p: 2, width: 300, flexShrink: 0, display: "grid", gap: 1 }}>
      <Flex align="center" justify="space-between" gap={1}>
        <Chip size="small" variant="outlined" label={node.kind} />
        <Button size="small" onClick={onClose}>
          fechar
        </Button>
      </Flex>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {node.title}
      </Typography>
      {node.subtitle ? (
        <Typography variant="caption" color="text.secondary">
          {node.subtitle}
        </Typography>
      ) : null}
      <Flex align="center" gap={0.5} wrap>
        <Chip
          size="small"
          color={CONFIDENCE_COLOR[node.confidence] ?? "default"}
          variant="outlined"
          label={`confiança: ${node.confidence}`}
        />
        <Chip
          size="small"
          color={node.risk === "high" ? "error" : node.risk === "attention" ? "warning" : "success"}
          variant="outlined"
          label={`risco: ${node.risk}`}
        />
        {node.touchesContract ? (
          <Chip size="small" variant="outlined" label="toca contrato" />
        ) : null}
      </Flex>
      {node.team || node.owner ? (
        <Typography variant="caption" color="text.secondary">
          {node.team ? `time: ${node.team}` : ""}
          {node.team && node.owner ? " · " : ""}
          {node.owner ? `responsável: ${node.owner}` : ""}
        </Typography>
      ) : null}
      {node.riskNote ? (
        <Typography variant="caption" sx={{ color: "warning.dark" }}>
          Motivo do risco: {node.riskNote}
        </Typography>
      ) : null}
      {node.evidence ? (
        <Typography variant="caption" sx={{ color: "success.dark" }}>
          Evidência: {node.evidence}
        </Typography>
      ) : null}
      {node.nextStep ? (
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          Próximo passo: {node.nextStep}
        </Typography>
      ) : null}
      <Divider />
      {incoming.length > 0 ? (
        <div>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            Vem de:
          </Typography>
          {incoming.map((edge) => (
            <Typography key={edge.id} variant="caption" component="div" color="text.secondary">
              {titleOf(edge.from)} {edge.label ? `(${edge.label})` : ""}
            </Typography>
          ))}
        </div>
      ) : null}
      {outgoing.length > 0 ? (
        <div>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            Leva a:
          </Typography>
          {outgoing.map((edge) => (
            <Typography key={edge.id} variant="caption" component="div" color="text.secondary">
              {titleOf(edge.to)} {edge.label ? `(${edge.label})` : ""}
            </Typography>
          ))}
        </div>
      ) : null}
      {node.cta ? (
        <Button component={Link} href={node.cta.href} size="small" variant="contained">
          {node.cta.label}
        </Button>
      ) : null}
    </Paper>
  );
}
