import type { EChartsOption } from "echarts";
import { ECHARTS_MUI_PALETTE } from "@/app/_ui/charts";
import type {
  ResultConfidenceState,
  ResultMetricSeries,
  ResultsDashboardViewModel,
} from "../../_model/view-models";

export const RESULT_CONFIDENCE_COLORS: Record<ResultConfidenceState, string> = {
  verified: "#14532d",
  pending: "#9a5b00",
  "no-evidence": "#6b7280",
  "self-declared": "#b45309",
  "break-glass": "#9f1239",
  stale: "#7f1d1d",
};

export function targetActualOption(dashboard: ResultsDashboardViewModel): EChartsOption {
  return {
    color: ECHARTS_MUI_PALETTE,
    tooltip: { trigger: "axis" },
    legend: { top: 0 },
    grid: { left: 44, right: 20, bottom: 44, top: 44 },
    xAxis: { type: "category", data: dashboard.series.map((entry) => entry.metricId) },
    yAxis: { type: "value" },
    series: [
      {
        name: "actual",
        type: "bar",
        data: dashboard.series.map((entry) => lastNumber(entry, "actual")),
      },
      {
        name: "target",
        type: "line",
        data: dashboard.series.map((entry) => lastNumber(entry, "expected")),
      },
    ],
  };
}

export function confidenceOption(dashboard: ResultsDashboardViewModel): EChartsOption {
  const stack = confidenceStackPerCycle(dashboard.series);
  return {
    color: stack.byConfidence.map((row) => RESULT_CONFIDENCE_COLORS[row.confidence]),
    tooltip: { trigger: "axis" },
    legend: { top: 0 },
    grid: { left: 32, right: 16, bottom: 36, top: 44 },
    xAxis: { type: "category", data: stack.cycles },
    yAxis: { type: "value" },
    series: stack.byConfidence.map((row) => ({
      name: row.confidence,
      type: "bar",
      stack: "confidence",
      data: row.counts,
    })),
  };
}

export function outcomesOption(dashboard: ResultsDashboardViewModel): EChartsOption {
  const grouped = outcomesPerCycle(dashboard.series);
  return {
    color: ["#14532d", "#b45309"],
    tooltip: { trigger: "axis" },
    legend: { top: 0 },
    grid: { left: 32, right: 16, bottom: 36, top: 44 },
    xAxis: { type: "category", data: grouped.cycles },
    yAxis: { type: "value" },
    series: [
      { name: "válidos", type: "bar", data: grouped.valid },
      { name: "inválidos", type: "bar", data: grouped.invalid },
    ],
  };
}

export function attainmentOption(dashboard: ResultsDashboardViewModel): EChartsOption {
  const attainment = attainmentByObjective(dashboard.series);
  return {
    color: ["#2563eb"],
    tooltip: { trigger: "axis", valueFormatter: (value) => `${value}%` },
    grid: { left: 120, right: 20, bottom: 28, top: 24 },
    xAxis: { type: "value", max: 140 },
    yAxis: { type: "category", data: attainment.labels },
    series: [{ type: "bar", data: attainment.values, label: { show: true, formatter: "{c}%" } }],
  };
}

function lastNumber(entry: ResultMetricSeries, key: "actual" | "expected"): number | null {
  const values = entry.points.map((point) => point[key]).filter((value) => value !== null);
  return values.at(-1) ?? null;
}

function confidenceStackPerCycle(series: ResultMetricSeries[]) {
  const cycles = [...new Set(series.flatMap((entry) => entry.points.map((p) => p.cycle)))].sort();
  const states = Object.keys(RESULT_CONFIDENCE_COLORS) as ResultConfidenceState[];
  const byConfidence = states
    .map((confidence) => ({
      confidence,
      counts: cycles.map(
        (cycle) =>
          series
            .flatMap((entry) => entry.points)
            .filter((point) => point.cycle === cycle && point.confidence === confidence).length
      ),
    }))
    .filter((row) => row.counts.some((count) => count > 0));
  return { cycles, byConfidence };
}

function outcomesPerCycle(series: ResultMetricSeries[]) {
  const cycles = [...new Set(series.flatMap((entry) => entry.points.map((p) => p.cycle)))].sort();
  const valid = cycles.map(() => 0);
  const invalid = cycles.map(() => 0);
  for (const entry of series) {
    entry.points.forEach((point, index) => {
      const cycleIndex = cycles.indexOf(point.cycle);
      const source = entry.sources[index];
      if (cycleIndex < 0) return;
      if (source?.valid) valid[cycleIndex] += 1;
      else invalid[cycleIndex] += 1;
    });
  }
  return { cycles, valid, invalid };
}

function attainmentByObjective(series: ResultMetricSeries[]) {
  const byObjective = new Map<string, number[]>();
  for (const entry of series) {
    for (const point of entry.points) {
      if (point.expected === null || point.expected === 0 || point.actual === null) continue;
      const bucket = byObjective.get(entry.objectiveId) ?? [];
      bucket.push((point.actual / point.expected) * 100);
      byObjective.set(entry.objectiveId, bucket);
    }
  }
  const labels = [...byObjective.keys()].sort();
  return {
    labels,
    values: labels.map((label) => {
      const values = byObjective.get(label) ?? [];
      const sum = values.reduce((acc, value) => acc + value, 0);
      return Number((sum / values.length).toFixed(1));
    }),
  };
}
