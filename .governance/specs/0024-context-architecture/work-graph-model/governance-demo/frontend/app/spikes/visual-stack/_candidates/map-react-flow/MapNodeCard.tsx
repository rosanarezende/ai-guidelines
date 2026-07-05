"use client";

// MapNodeCard — nó RICO do mapa de governança em React Flow: copy de produto,
// estado de confiança, risco, evidência, próximo passo e CTA. É a prova de que
// o mapa fala com stakeholder, não com console técnico.
import { Box, Button, Chip, Typography } from "@mui/material";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import Link from "next/link";
import { Flex } from "@/app/_ui/shared";
import type { GovernanceMapNode } from "../../_model/view-models";
import { MAP_NODE_WIDTH } from "./elk-layout";

export type MapFlowNode = Node<{ vm: GovernanceMapNode }, "governance">;

export const KIND_COLORS: Record<GovernanceMapNode["kind"], string> = {
  decision: "#6d28d9",
  objective: "#14532d",
  target: "#1f4b99",
  intent: "#0f766e",
  "repo-work": "#374151",
  contract: "#9a5b00",
  outcome: "#166534",
  dashboard: "#1e3a8a",
};

const CONFIDENCE_COLOR: Record<string, "success" | "warning" | "error" | "default"> = {
  verified: "success",
  pending: "warning",
  "no-evidence": "default",
  "self-declared": "warning",
  "break-glass": "error",
  stale: "error",
};

export function MapNodeCard({ data }: NodeProps<MapFlowNode>) {
  const vm = data.vm;
  return (
    <Box
      sx={{
        width: MAP_NODE_WIDTH,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: vm.risk === "high" ? "error.main" : "divider",
        borderLeft: `4px solid ${KIND_COLORS[vm.kind]}`,
        borderRadius: 2,
        p: 1.25,
        display: "grid",
        gap: 0.5,
        boxShadow: vm.risk === "high" ? 3 : 0,
      }}
    >
      <Handle type="target" position={Position.Left} />
      <Flex align="center" gap={0.5} wrap>
        <Typography variant="caption" sx={{ color: KIND_COLORS[vm.kind], fontWeight: 700 }}>
          {vm.kind}
        </Typography>
        <Chip
          size="small"
          color={CONFIDENCE_COLOR[vm.confidence] ?? "default"}
          variant="outlined"
          label={vm.confidence}
          sx={{ height: 18, fontSize: 10 }}
        />
        {vm.risk !== "low" ? (
          <Chip
            size="small"
            color={vm.risk === "high" ? "error" : "warning"}
            label={`risco ${vm.risk}`}
            sx={{ height: 18, fontSize: 10 }}
          />
        ) : null}
      </Flex>
      <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
        {vm.title}
      </Typography>
      {vm.subtitle ? (
        <Typography variant="caption" color="text.secondary">
          {vm.subtitle}
        </Typography>
      ) : null}
      {vm.evidence ? (
        <Typography variant="caption" sx={{ color: "success.dark" }}>
          Evidência: {vm.evidence}
        </Typography>
      ) : null}
      {vm.nextStep ? (
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          Próximo passo: {vm.nextStep}
        </Typography>
      ) : null}
      {vm.cta ? (
        <Button
          component={Link}
          href={vm.cta.href}
          size="small"
          variant="outlined"
          sx={{ justifySelf: "start", py: 0, fontSize: 11 }}
        >
          {vm.cta.label}
        </Button>
      ) : null}
      <Handle type="source" position={Position.Right} />
    </Box>
  );
}
