"use client";

// EChartsPanel — wrapper fino próprio sobre echarts.init (sem echarts-for-react):
// monta no cliente (SSR-safe), aplica tema alinhado ao MUI e repassa eventos de
// clique. O domínio nunca entra aqui; só recebe option pronto do candidato.
import { Box } from "@mui/material";
import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";

export const ECHARTS_MUI_PALETTE = [
  "#14532d",
  "#1f4b99",
  "#9a5b00",
  "#9f1239",
  "#0f766e",
  "#6d28d9",
];

export function EChartsPanel({
  option,
  height = 360,
  onNodeClick,
}: {
  option: EChartsOption;
  height?: number;
  onNodeClick?: (payload: { id?: string; name?: string; seriesName?: string }) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chart = echarts.init(container);
    chartRef.current = chart;
    // resize síncrono durante o render dispara warning do ECharts; adia p/ rAF
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        if (chartRef.current) chartRef.current.resize();
      });
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.setOption(
      {
        color: ECHARTS_MUI_PALETTE,
        textStyle: { fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" },
        ...option,
      },
      { notMerge: true }
    );
  }, [option]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !onNodeClick) return;
    const handler = (params: unknown) => {
      const event = params as {
        data?: { id?: string; name?: string } | number | null;
        name?: string;
        seriesName?: string;
      };
      const data = typeof event.data === "object" && event.data !== null ? event.data : {};
      onNodeClick({
        id: data.id,
        name: data.name ?? event.name,
        seriesName: event.seriesName,
      });
    };
    chart.on("click", handler);
    return () => {
      chart.off("click", handler);
    };
  }, [onNodeClick]);

  return <Box ref={containerRef} sx={{ width: "100%", height }} />;
}
