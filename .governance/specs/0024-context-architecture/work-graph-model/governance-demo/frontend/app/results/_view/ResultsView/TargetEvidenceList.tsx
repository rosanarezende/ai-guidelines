"use client";

import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import { Flex } from "@/app/_ui/shared";
import type { ResultsDashboardViewModel, ResultConfidenceState } from "../../_model/view-models";
import copy from "./_locales/pt-br.json";
import { RESULT_CONFIDENCE_COLORS } from "./resultCharts";

export function TargetEvidenceList({ dashboard }: { dashboard: ResultsDashboardViewModel }) {
  const firstWeakTargetId = dashboard.targetCards.find((target) => isWeakEvidenceTarget(target))
    ?.targetId;
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h2">{copy.targets}</Typography>
        <Box sx={{ display: "grid", gap: 1.25, mt: 1.5 }}>
          {dashboard.targetCards.map((target) => {
            const sources = dashboard.series.find(
              (entry) => entry.targetId === target.targetId
            )?.sources;
            const hasWeakEvidence = isWeakEvidenceTarget(target);
            const isPrimaryWeakTarget = target.targetId === firstWeakTargetId;
            return (
              <Box
                key={target.targetId}
                data-testid={isPrimaryWeakTarget ? "outcome-without-evidence" : undefined}
                sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1.25 }}
              >
                <Flex align="flex-start" justify="space-between" gap={1.5} wrap>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body1" sx={{ fontWeight: 750 }}>
                      {target.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {target.period} · esperado {target.expected} · atual {target.actual}
                    </Typography>
                  </Box>
                  <Box data-testid={isPrimaryWeakTarget ? "outcome-confidence" : undefined}>
                    <ConfidencePill state={target.confidence} />
                  </Box>
                </Flex>
                <Flex gap={1} wrap sx={{ mt: 1 }}>
                  <Chip size="small" label={`${target.outcomeCount} outcome(s)`} />
                  <Chip
                    data-testid={isPrimaryWeakTarget ? "rollup-primary-status" : undefined}
                    size="small"
                    color={hasWeakEvidence ? "warning" : "success"}
                    label={
                      hasWeakEvidence
                        ? "sem evidencia minima para rollup primario forte"
                        : "rollup primario valido"
                    }
                  />
                  {target.invalidCount > 0 ? (
                    <Chip
                      size="small"
                      color="warning"
                      label={`${target.invalidCount} inválido(s)`}
                    />
                  ) : null}
                  {(sources ?? []).slice(0, 2).map((source) => (
                    <Chip
                      key={source.outcomeId}
                      size="small"
                      variant="outlined"
                      label={`${source.outcomeId}: ${source.value}`}
                    />
                  ))}
                </Flex>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

function isWeakEvidenceTarget(
  target: ResultsDashboardViewModel["targetCards"][number]
): boolean {
  return (
    target.confidence === "no-evidence" ||
    target.confidence === "self-declared" ||
    target.invalidCount > 0
  );
}

function ConfidencePill({ state }: { state: ResultConfidenceState }) {
  return (
    <Chip
      size="small"
      label={copy.trust[state]}
      sx={{
        bgcolor: RESULT_CONFIDENCE_COLORS[state],
        color: "white",
        fontWeight: 700,
      }}
    />
  );
}
