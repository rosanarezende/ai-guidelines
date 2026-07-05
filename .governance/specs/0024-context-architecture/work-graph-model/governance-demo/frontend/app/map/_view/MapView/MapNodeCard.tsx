"use client";

import { Box, Button, Chip, Tooltip, Typography } from "@mui/material";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import Link from "next/link";
import { Flex } from "@/app/_ui/shared";
import type { GovernanceMapNode } from "../../_model/view-models";
import { MAP_NODE_WIDTH } from "./elk-layout";

export type MapFlowNode = Node<
  { vm: GovernanceMapNode; dimmed: boolean; selected: boolean },
  "governance"
>;

const KIND_COLORS: Record<GovernanceMapNode["kind"], string> = {
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
  const { vm, dimmed, selected } = data;
  return (
    <Tooltip title={<NodeTooltipContent vm={vm} />} placement="top" arrow>
      <Box
        sx={{
          width: MAP_NODE_WIDTH,
          bgcolor: "background.paper",
          border: selected ? "2px solid" : "1px solid",
          borderColor: selected ? "secondary.main" : vm.risk === "high" ? "error.main" : "divider",
          borderLeft: `4px solid ${KIND_COLORS[vm.kind]}`,
          borderRadius: 2,
          p: 1.25,
          display: "grid",
          gap: 0.5,
          boxShadow: selected ? 4 : vm.risk === "high" ? 3 : 0,
          opacity: dimmed ? 0.25 : 1,
          transition: "opacity 120ms ease",
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
          <Button component={Link} href={vm.cta.href} size="small" variant="outlined">
            {vm.cta.label}
          </Button>
        ) : null}
        <Handle type="source" position={Position.Right} />
      </Box>
    </Tooltip>
  );
}

function NodeTooltipContent({ vm }: { vm: GovernanceMapNode }) {
  return (
    <Box sx={{ display: "grid", gap: 0.5, maxWidth: 300 }}>
      <Typography variant="caption" sx={{ fontWeight: 700 }}>
        {vm.title}
      </Typography>
      {vm.subtitle ? <Typography variant="caption">{vm.subtitle}</Typography> : null}
      <Typography variant="caption">
        confiança: {vm.confidence} · risco: {vm.risk}
      </Typography>
      {vm.riskNote ? <Typography variant="caption">motivo: {vm.riskNote}</Typography> : null}
      {vm.evidence ? <Typography variant="caption">evidência: {vm.evidence}</Typography> : null}
      {vm.nextStep ? <Typography variant="caption">próximo passo: {vm.nextStep}</Typography> : null}
    </Box>
  );
}
