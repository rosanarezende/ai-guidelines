"use client";

// DashboardMuiXCharts — candidato MUI X Charts: linha/área (target vs actual),
// barras empilhadas de confiança por ciclo, gauge de atingimento e drill-down
// série → ponto → outcomes/fontes via onMarkClick.
import { Box, MenuItem, Select, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { Gauge } from "@mui/x-charts/Gauge";
import { LineChart } from "@mui/x-charts/LineChart";
import { useMemo, useState } from "react";
import { Flex } from "@/app/_ui/shared";
import type { DashboardMetricSeries } from "../../_model/view-models";
import {
  attainmentByObjective,
  CONFIDENCE_COLORS,
  confidenceStackPerCycle,
  outcomesPerCycle,
  SourcesList,
} from "../shared/dashboard-shared";

export function DashboardMuiXCharts({ series }: { series: DashboardMetricSeries[] }) {
  const denseDefault = series.find((entry) =>
    entry.points.some((point) => point.expected !== null)
  );
  const [selectedId, setSelectedId] = useState(denseDefault?.id ?? series[0]?.id ?? "");
  const [drillCycle, setDrillCycle] = useState<string | null>(null);
  const selected = series.find((entry) => entry.id === selectedId) ?? series[0];
  const stack = useMemo(() => confidenceStackPerCycle(series), [series]);
  const perCycle = useMemo(() => outcomesPerCycle(series), [series]);
  const breakdown = useMemo(() => attainmentByObjective(series), [series]);

  if (!selected) {
    return <Typography variant="body2">Sem séries no view-model.</Typography>;
  }

  const cycles = selected.points.map((point) => point.cycle);
  const lastPoint = selected.points[selected.points.length - 1];
  const attainment =
    lastPoint && lastPoint.expected ? ((lastPoint.actual ?? 0) / lastPoint.expected) * 100 : 0;
  const drillSources = drillCycle
    ? selected.sources.filter((source) => source.window.includes(drillCycle))
    : [];

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Flex align="center" gap={1} wrap>
        <Typography variant="caption" color="text.secondary">
          Série (target):
        </Typography>
        <Select
          size="small"
          value={selected.id}
          onChange={(event) => {
            setSelectedId(event.target.value);
            setDrillCycle(null);
          }}
        >
          {series.map((entry) => (
            <MenuItem key={entry.id} value={entry.id}>
              {entry.title}
            </MenuItem>
          ))}
        </Select>
      </Flex>

      <Flex gap={2} wrap align="flex-start">
        <Box sx={{ flex: "1 1 420px", minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            Target vs actual por ciclo (clique num ponto para abrir as fontes)
          </Typography>
          <LineChart
            height={260}
            xAxis={[{ scaleType: "point", data: cycles }]}
            series={[
              {
                id: "expected",
                label: "esperado",
                data: selected.points.map((point) => point.expected),
                color: "#1f4b99",
              },
              {
                id: "actual",
                label: "actual (derivado)",
                data: selected.points.map((point) => point.actual),
                area: true,
                color: "#14532d",
              },
            ]}
            onMarkClick={(_event, mark) => {
              const cycle = cycles[mark.dataIndex ?? -1];
              if (cycle) setDrillCycle(cycle);
            }}
          />
        </Box>
        <Box sx={{ width: 200 }}>
          <Typography variant="caption" color="text.secondary">
            Atingimento (último ciclo)
          </Typography>
          <Gauge
            height={200}
            value={Math.max(0, Math.min(150, Math.round(attainment)))}
            valueMax={150}
            text={({ value }) => `${value}%`}
          />
        </Box>
      </Flex>

      <Box>
        <Typography variant="caption" color="text.secondary">
          Medições por estado de confiança (empilhado por ciclo, todas as séries)
        </Typography>
        <BarChart
          height={240}
          xAxis={[{ scaleType: "band", data: stack.cycles }]}
          series={stack.byConfidence.map((row) => ({
            id: row.confidence,
            label: row.confidence,
            data: row.counts,
            stack: "confidence",
            color: CONFIDENCE_COLORS[row.confidence],
          }))}
        />
      </Box>

      <Flex gap={2} wrap align="flex-start">
        <Box sx={{ flex: "1 1 360px", minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            Outcomes por ciclo (válido × inválido)
          </Typography>
          <BarChart
            height={220}
            xAxis={[{ scaleType: "band", data: perCycle.cycles }]}
            series={[
              {
                id: "valid",
                label: "válido",
                data: perCycle.valid,
                stack: "outcomes",
                color: "#14532d",
              },
              {
                id: "invalid",
                label: "inválido",
                data: perCycle.invalid,
                stack: "outcomes",
                color: "#9f1239",
              },
            ]}
          />
        </Box>
        <Box sx={{ flex: "1 1 360px", minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            Atingimento médio por objetivo (%)
          </Typography>
          <BarChart
            height={220}
            xAxis={[{ scaleType: "band", data: breakdown.labels }]}
            series={[
              {
                id: "attainment",
                label: "atingimento %",
                data: breakdown.values,
                color: "#1f4b99",
              },
            ]}
          />
        </Box>
      </Flex>

      <SourcesList
        title={`Fontes do ciclo ${drillCycle ?? ""} — ${selected.title}`}
        sources={drillSources}
      />
    </Box>
  );
}
