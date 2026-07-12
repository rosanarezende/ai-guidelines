"use client";

import { Box, Typography } from "@mui/material";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import { useEffect, useRef } from "react";

export const ECHARTS_MUI_PALETTE = [
  "#166534",
  "#2563eb",
  "#b45309",
  "#9f1239",
  "#64748b",
  "#7c3aed",
];

export function EChartsPanel({
  option,
  height = 320,
  ariaLabel,
  dataTestId,
}: {
  option: EChartsOption;
  height?: number;
  ariaLabel: string;
  dataTestId?: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const chart = echarts.init(hostRef.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(hostRef.current);
    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return (
    <Box>
      <Box
        data-testid={dataTestId}
        ref={hostRef}
        role="img"
        aria-label={ariaLabel}
        sx={{
          minHeight: height,
          width: "100%",
          borderRadius: 1,
          overflow: "hidden",
        }}
      />
      <Typography variant="caption" color="text.secondary">
        Visual derivado do read-model; ações governadas sempre relêem o SSOT file-first.
      </Typography>
    </Box>
  );
}
