"use client";

// dashboard-shared.tsx — pedaços comuns do spike de dashboards para manter a
// comparação justa: mesma agregação de confiança por ciclo e mesma lista de
// fontes no drill-down (objective → target → outcome → fonte).
import { Box, Chip, Typography } from "@mui/material";
import { Flex } from "@/app/_ui/shared";
import type {
  ConfidenceState,
  DashboardDrillSource,
  DashboardMetricSeries,
} from "../../_model/view-models";
import { CONFIDENCE_STATES } from "../../_model/view-models";

export type ConfidenceStack = {
  cycles: string[];
  byConfidence: Array<{ confidence: ConfidenceState; counts: number[] }>;
};

// Empilhado por ciclo: quantos pontos de medição existem em cada estado de
// confiança — o "comparativo por ciclo" que dashboards precisam mostrar.
export function confidenceStackPerCycle(series: DashboardMetricSeries[]): ConfidenceStack {
  const cycles = [...new Set(series.flatMap((entry) => entry.points.map((p) => p.cycle)))].sort();
  const byConfidence = CONFIDENCE_STATES.map((confidence) => ({
    confidence,
    counts: cycles.map(
      (cycle) =>
        series
          .flatMap((entry) => entry.points)
          .filter((point) => point.cycle === cycle && point.confidence === confidence).length
    ),
  })).filter((row) => row.counts.some((count) => count > 0));
  return { cycles, byConfidence };
}

export const CONFIDENCE_COLORS: Record<ConfidenceState, string> = {
  verified: "#14532d",
  pending: "#9a5b00",
  "no-evidence": "#6b7280",
  "self-declared": "#b45309",
  "break-glass": "#9f1239",
  stale: "#7f1d1d",
};

export function SourcesList({
  title,
  sources,
}: {
  title: string;
  sources: DashboardDrillSource[];
}) {
  if (sources.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        Selecione um ponto/target para ver os outcomes e as fontes que sustentam o número.
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "grid", gap: 0.75 }}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {sources.map((source) => (
        <Flex key={source.outcomeId} align="center" gap={1} wrap>
          <Chip
            size="small"
            color={source.valid ? "success" : "warning"}
            variant="outlined"
            label={source.valid ? "válido" : "inválido"}
          />
          <Typography variant="caption">
            <strong>{source.outcomeId}</strong> · {source.value} · {source.window}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            fonte: {source.source}
          </Typography>
        </Flex>
      ))}
      <Typography variant="caption" color="text.secondary">
        Dashboards mostram resultados derivados; a ação governada sempre relê a fonte autoritativa.
      </Typography>
    </Box>
  );
}
