"use client";

// DashboardSection — spike 2: dashboards. Scorecards/targets do read-model
// REAL; séries densas por ciclo vêm da fixture (o real da acme é simbólico).
import { Box, Chip, Paper, Tab, Tabs, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { Flex, ResponsiveGrid, SectionCard } from "@/app/_ui/shared";
import { CandidatePanel } from "../../_candidates/shared/CandidatePanel";
import { DashboardECharts } from "../../_candidates/dashboard-echarts/DashboardECharts";
import { DashboardMuiXCharts } from "../../_candidates/dashboard-mui-x/DashboardMuiXCharts";
import type { GovernanceDashboardViewModel } from "../../_model/view-models";
import { buildSyntheticSeries } from "../../_model/synthetic-fixture";
import { FindingsFooter } from "./FindingsFooter";
import { findingById } from "./findings";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

const CONFIDENCE_CHIP: Record<string, "success" | "warning" | "error" | "default"> = {
  verified: "success",
  pending: "warning",
  "no-evidence": "default",
  "self-declared": "warning",
  "break-glass": "error",
  stale: "error",
};

export function DashboardSection({ dashboard }: { dashboard: GovernanceDashboardViewModel }) {
  const [candidate, setCandidate] = useState(0);
  const series = useMemo(
    () => [...dashboard.series, ...buildSyntheticSeries()],
    [dashboard.series]
  );

  return (
    <SectionCard title={m["spikes.dashboard.title"]} subtitle={m["spikes.dashboard.subtitle"]}>
      <ResponsiveGrid min={220} gap={1.5}>
        {dashboard.scorecards.map((card) => (
          <Paper key={card.id} variant="outlined" sx={{ p: 1.5, display: "grid", gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {card.label}
            </Typography>
            <Typography variant="h2">{card.value}</Typography>
            <Flex align="center" gap={0.5} wrap>
              <Chip
                size="small"
                variant="outlined"
                color={CONFIDENCE_CHIP[card.confidence] ?? "default"}
                label={card.confidence}
              />
              {card.hint ? (
                <Typography variant="caption" color="text.secondary">
                  {card.hint}
                </Typography>
              ) : null}
            </Flex>
          </Paper>
        ))}
      </ResponsiveGrid>

      <Box sx={{ mt: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          {m["spikes.dashboard.datanote"]} · revisão {dashboard.sourceRevision}
        </Typography>
      </Box>

      <Tabs
        value={candidate}
        onChange={(_e, value: number) => setCandidate(value)}
        sx={{ my: 1.5 }}
      >
        <Tab label="MUI X Charts" />
        <Tab label="Apache ECharts" />
      </Tabs>

      {candidate === 0 ? (
        <CandidatePanel
          meta={findingById("dashboard-mui-x")}
          footer={<FindingsFooter finding={findingById("dashboard-mui-x")} />}
        >
          <DashboardMuiXCharts series={series} />
        </CandidatePanel>
      ) : (
        <CandidatePanel
          meta={findingById("dashboard-echarts")}
          footer={<FindingsFooter finding={findingById("dashboard-echarts")} />}
        >
          <DashboardECharts series={series} />
        </CandidatePanel>
      )}
    </SectionCard>
  );
}
