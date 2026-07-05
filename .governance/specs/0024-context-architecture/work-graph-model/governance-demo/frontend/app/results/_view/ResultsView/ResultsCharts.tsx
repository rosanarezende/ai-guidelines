"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";
import { EChartsPanel } from "@/app/_ui/charts";
import type { ResultsDashboardViewModel } from "../../_model/view-models";
import copy from "./_locales/pt-br.json";
import {
  attainmentOption,
  confidenceOption,
  outcomesOption,
  targetActualOption,
} from "./resultCharts";

export function ResultsCharts({ dashboard }: { dashboard: ResultsDashboardViewModel }) {
  const charts = [
    {
      title: copy.charts.targetActual,
      option: targetActualOption(dashboard),
      height: 300,
    },
    {
      title: copy.charts.confidence,
      option: confidenceOption(dashboard),
      height: 300,
    },
    {
      title: copy.charts.outcomes,
      option: outcomesOption(dashboard),
      height: 280,
    },
    {
      title: copy.charts.attainment,
      option: attainmentOption(dashboard),
      height: 280,
    },
  ];

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
      {charts.map((chart) => (
        <Card key={chart.title} variant="outlined">
          <CardContent>
            <Typography variant="h3" sx={{ mb: 1 }}>
              {chart.title}
            </Typography>
            <EChartsPanel
              option={chart.option}
              height={chart.height}
              ariaLabel={`Gráfico de resultados: ${chart.title}`}
            />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
