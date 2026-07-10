"use client";

// DashboardECharts — candidato Apache ECharts para dashboards: linha+área,
// barras empilhadas de confiança por ciclo, gauge e drill-down por clique.
import { Box, MenuItem, Select, Typography } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import { Flex } from "@/app/_ui/shared";
import type { DashboardMetricSeries } from "../../_model/view-models";
import {
  attainmentByObjective,
  CONFIDENCE_COLORS,
  confidenceStackPerCycle,
  outcomesPerCycle,
  SourcesList,
} from "../shared/dashboard-shared";
import { EChartsPanel } from "../shared/EChartsPanel";

export function DashboardECharts({ series }: { series: DashboardMetricSeries[] }) {
  const denseDefault = series.find((entry) =>
    entry.points.some((point) => point.expected !== null)
  );
  const [selectedId, setSelectedId] = useState(denseDefault?.id ?? series[0]?.id ?? "");
  const [drillCycle, setDrillCycle] = useState<string | null>(null);
  const selected = series.find((entry) => entry.id === selectedId) ?? series[0];
  const stack = useMemo(() => confidenceStackPerCycle(series), [series]);
  const perCycle = useMemo(() => outcomesPerCycle(series), [series]);
  const breakdown = useMemo(() => attainmentByObjective(series), [series]);

  const perCycleOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { bottom: 0 },
      grid: { left: 40, right: 16, top: 24, bottom: 48 },
      xAxis: { type: "category", data: perCycle.cycles },
      yAxis: { type: "value" },
      series: [
        { name: "válido", type: "bar", stack: "outcomes", data: perCycle.valid, color: "#14532d" },
        {
          name: "inválido",
          type: "bar",
          stack: "outcomes",
          data: perCycle.invalid,
          color: "#9f1239",
        },
      ],
    }),
    [perCycle]
  );

  const breakdownOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: "axis" },
      grid: { left: 40, right: 16, top: 24, bottom: 48 },
      xAxis: { type: "category", data: breakdown.labels, axisLabel: { fontSize: 10 } },
      yAxis: { type: "value", name: "%" },
      series: [{ name: "atingimento %", type: "bar", data: breakdown.values, color: "#1f4b99" }],
    }),
    [breakdown]
  );

  const cycles = useMemo(() => selected?.points.map((point) => point.cycle) ?? [], [selected]);

  const lineOption = useMemo<EChartsOption>(() => {
    if (!selected) return {};
    return {
      tooltip: { trigger: "axis" },
      legend: { bottom: 0 },
      grid: { left: 48, right: 16, top: 24, bottom: 48 },
      xAxis: { type: "category", data: cycles },
      yAxis: { type: "value", name: selected.unit },
      series: [
        {
          name: "esperado",
          type: "line",
          data: selected.points.map((point) => point.expected),
          lineStyle: { type: "dashed" },
          color: "#1f4b99",
        },
        {
          name: "actual (derivado)",
          type: "line",
          areaStyle: { opacity: 0.18 },
          data: selected.points.map((point) => point.actual),
          color: "#14532d",
        },
      ],
    };
  }, [selected, cycles]);

  const stackOption = useMemo<EChartsOption>(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { bottom: 0, type: "scroll" },
      grid: { left: 40, right: 16, top: 24, bottom: 48 },
      xAxis: { type: "category", data: stack.cycles },
      yAxis: { type: "value" },
      series: stack.byConfidence.map((row) => ({
        name: row.confidence,
        type: "bar" as const,
        stack: "confidence",
        data: row.counts,
        color: CONFIDENCE_COLORS[row.confidence],
      })),
    }),
    [stack]
  );

  const gaugeOption = useMemo<EChartsOption>(() => {
    const lastPoint = selected?.points[selected.points.length - 1];
    const attainment =
      lastPoint && lastPoint.expected ? ((lastPoint.actual ?? 0) / lastPoint.expected) * 100 : 0;
    return {
      series: [
        {
          type: "gauge",
          min: 0,
          max: 150,
          progress: { show: true },
          detail: { formatter: "{value}%", fontSize: 16 },
          data: [{ value: Math.round(attainment), name: "atingimento" }],
        },
      ],
    };
  }, [selected]);

  const onLineClick = useCallback(
    (payload: { name?: string }) => {
      if (payload.name) setDrillCycle(payload.name);
    },
    [setDrillCycle]
  );

  if (!selected) {
    return <Typography variant="body2">Sem séries no view-model.</Typography>;
  }

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
          <EChartsPanel option={lineOption} height={260} onNodeClick={onLineClick} />
        </Box>
        <Box sx={{ width: 220 }}>
          <Typography variant="caption" color="text.secondary">
            Atingimento (último ciclo)
          </Typography>
          <EChartsPanel option={gaugeOption} height={220} />
        </Box>
      </Flex>

      <Box>
        <Typography variant="caption" color="text.secondary">
          Medições por estado de confiança (empilhado por ciclo, todas as séries)
        </Typography>
        <EChartsPanel option={stackOption} height={240} />
      </Box>

      <Flex gap={2} wrap align="flex-start">
        <Box sx={{ flex: "1 1 360px", minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            Outcomes por ciclo (válido × inválido)
          </Typography>
          <EChartsPanel option={perCycleOption} height={220} />
        </Box>
        <Box sx={{ flex: "1 1 360px", minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            Atingimento médio por objetivo (%)
          </Typography>
          <EChartsPanel option={breakdownOption} height={220} />
        </Box>
      </Flex>

      <SourcesList
        title={`Fontes do ciclo ${drillCycle ?? ""} — ${selected.title}`}
        sources={drillSources}
      />
    </Box>
  );
}
