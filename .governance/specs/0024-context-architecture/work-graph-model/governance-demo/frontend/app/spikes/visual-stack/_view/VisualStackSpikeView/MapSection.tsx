"use client";

// MapSection — spike 1: mapas de governança. Mesmo GovernanceMapViewModel
// nos dois candidatos + fallback textual obrigatório.
import { FormControlLabel, MenuItem, Select, Switch, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";
import { Flex, SectionCard } from "@/app/_ui/shared";
import { CandidatePanel } from "../../_candidates/shared/CandidatePanel";
import { MapTextualFallback } from "../../_candidates/shared/TextualFallback";
import { GovernanceMapReactFlow } from "../../_candidates/map-react-flow/GovernanceMapReactFlow";
import { GovernanceMapECharts } from "../../_candidates/map-echarts/GovernanceMapECharts";
import type { GovernanceMapViewModel } from "../../_model/view-models";
import { FindingsFooter } from "./FindingsFooter";
import { findingById } from "./findings";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

export function MapSection({ maps }: { maps: GovernanceMapViewModel[] }) {
  const [scopeId, setScopeId] = useState(maps[0]?.scopeId ?? "");
  const [candidate, setCandidate] = useState(0);
  const [textual, setTextual] = useState(false);
  const map = maps.find((entry) => entry.scopeId === scopeId) ?? maps[0];

  if (!map) return null;

  return (
    <SectionCard title={m["spikes.map.title"]} subtitle={m["spikes.map.subtitle"]}>
      <Flex align="center" gap={2} wrap sx={{ mb: 1.5 }}>
        <Flex align="center" gap={1}>
          <Typography variant="caption" color="text.secondary">
            {m["spikes.map.scope"]}
          </Typography>
          <Select size="small" value={map.scopeId} onChange={(e) => setScopeId(e.target.value)}>
            {maps.map((entry) => (
              <MenuItem key={entry.scopeId} value={entry.scopeId}>
                {entry.scopeTitle}
              </MenuItem>
            ))}
          </Select>
        </Flex>
        <FormControlLabel
          control={
            <Switch size="small" checked={textual} onChange={(e) => setTextual(e.target.checked)} />
          }
          label={<Typography variant="caption">{m["spikes.fallback.toggle"]}</Typography>}
        />
        <Typography variant="caption" color="text.secondary">
          {map.nodes.length} nós · revisão {map.sourceRevision}
        </Typography>
      </Flex>

      <Tabs
        value={candidate}
        onChange={(_e, value: number) => setCandidate(value)}
        sx={{ mb: 1.5 }}
      >
        <Tab label="React Flow + ELK" />
        <Tab label="ECharts graph" />
      </Tabs>

      {candidate === 0 ? (
        <CandidatePanel
          meta={findingById("map-react-flow")}
          footer={<FindingsFooter finding={findingById("map-react-flow")} />}
        >
          {textual ? <MapTextualFallback map={map} /> : <GovernanceMapReactFlow map={map} />}
        </CandidatePanel>
      ) : (
        <CandidatePanel
          meta={findingById("map-echarts")}
          footer={<FindingsFooter finding={findingById("map-echarts")} />}
        >
          {textual ? <MapTextualFallback map={map} /> : <GovernanceMapECharts map={map} />}
        </CandidatePanel>
      )}
    </SectionCard>
  );
}
