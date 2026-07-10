"use client";

import { Box, Typography } from "@mui/material";
import { Flex } from "@/app/_ui/shared";
import {
  CONFIDENCE_STATES,
  TRUST_LEGEND,
  type ConfidenceState,
} from "@/app/_domain/adoption/model";
import copy from "./status/_locales/pt-br.json";

export function StatusPill({ state, label }: { state: ConfidenceState; label?: string }) {
  const meta = CONFIDENCE_STATES[state];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.25,
        py: 0.25,
        borderRadius: 999,
        bgcolor: meta.bg,
        color: meta.fg,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <Box
        component="span"
        sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: meta.dot, flexShrink: 0 }}
      />
      {label || meta.label}
    </Box>
  );
}

export function TrustLegend() {
  return (
    <Flex wrap gap={0.75} align="center">
      <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
        {copy.trustLegendPrefix}
      </Typography>
      {TRUST_LEGEND.map((item) => (
        <StatusPill key={item.state} state={item.state} label={item.label} />
      ))}
    </Flex>
  );
}
