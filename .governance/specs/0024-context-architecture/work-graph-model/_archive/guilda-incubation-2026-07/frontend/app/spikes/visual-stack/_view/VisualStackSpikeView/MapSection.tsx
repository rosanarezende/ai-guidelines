"use client";

// MapSection — spike 1 (rodada 2): mapa de governança com busca, filtros,
// foco de vizinhança, painel de detalhe, legenda e tooltips. React Flow+ELK é
// o candidato principal; ECharts vira visualização relacional OPCIONAL.
import {
  Alert,
  Box,
  FormControlLabel,
  MenuItem,
  Select,
  Switch,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { Flex, SectionCard } from "@/app/_ui/shared";
import { CandidatePanel } from "../../_candidates/shared/CandidatePanel";
import { MapTextualFallback } from "../../_candidates/shared/TextualFallback";
import { GovernanceMapReactFlow } from "../../_candidates/map-react-flow/GovernanceMapReactFlow";
import { GovernanceMapECharts } from "../../_candidates/map-echarts/GovernanceMapECharts";
import { applyMapFilter, mapNeighborhood } from "../../_model/map-ops";
import type { GovernanceMapViewModel, MapFilterState } from "../../_model/view-models";
import { EMPTY_MAP_FILTER } from "../../_model/view-models";
import { MapDetailPanel } from "./MapDetailPanel";
import { MapLegend, MapSectionControls } from "./MapSectionControls";
import { FindingsFooter } from "./FindingsFooter";
import { findingById } from "./findings";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

export function MapSection({ maps }: { maps: GovernanceMapViewModel[] }) {
  const [scopeId, setScopeId] = useState(maps[0]?.scopeId ?? "");
  const [candidate, setCandidate] = useState(0);
  const [textual, setTextual] = useState(false);
  const [focusEnabled, setFocusEnabled] = useState(true);
  const [filter, setFilter] = useState<MapFilterState>(EMPTY_MAP_FILTER);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fullMap = maps.find((entry) => entry.scopeId === scopeId) ?? maps[0];
  const map = useMemo(
    () => (fullMap ? applyMapFilter(fullMap, filter) : fullMap),
    [fullMap, filter]
  );

  const selectedNode = map?.nodes.find((node) => node.id === selectedId) ?? null;
  const highlight = useMemo<ReadonlySet<string>>(() => {
    if (!map || !focusEnabled || !selectedId || !selectedNode) return new Set<string>();
    return mapNeighborhood(map, selectedId, 2);
  }, [map, focusEnabled, selectedId, selectedNode]);

  if (!fullMap || !map) return null;

  const candidateProps = {
    map,
    selectedId,
    highlight,
    onSelect: setSelectedId,
  };

  return (
    <SectionCard title={m["spikes.map.title"]} subtitle={m["spikes.map.subtitle"]}>
      <Flex direction="column" gap={1.5}>
        <Flex align="center" gap={2} wrap>
          <Flex align="center" gap={1}>
            <Typography variant="caption" color="text.secondary">
              {m["spikes.map.scope"]}
            </Typography>
            <Select
              size="small"
              value={fullMap.scopeId}
              onChange={(event) => {
                setScopeId(event.target.value);
                setSelectedId(null);
                setFilter(EMPTY_MAP_FILTER);
              }}
            >
              {maps.map((entry) => (
                <MenuItem key={entry.scopeId} value={entry.scopeId}>
                  {entry.scopeTitle}
                </MenuItem>
              ))}
            </Select>
          </Flex>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={focusEnabled}
                onChange={(event) => setFocusEnabled(event.target.checked)}
              />
            }
            label={<Typography variant="caption">{m["spikes.map.focus"]}</Typography>}
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={textual}
                onChange={(event) => setTextual(event.target.checked)}
              />
            }
            label={<Typography variant="caption">{m["spikes.fallback.toggle"]}</Typography>}
          />
          <Typography variant="caption" color="text.secondary">
            {map.nodes.length}/{fullMap.nodes.length} nós · revisão {map.sourceRevision}
          </Typography>
        </Flex>

        <MapSectionControls
          map={fullMap}
          filter={filter}
          onFilter={(next) => {
            setFilter(next);
            setSelectedId(null);
          }}
          onPick={(node) => setSelectedId(node?.id ?? null)}
        />
        <MapLegend />

        <Tabs value={candidate} onChange={(_e, value: number) => setCandidate(value)}>
          <Tab label="React Flow + ELK (mapa guiado)" />
          <Tab label="ECharts (visualização relacional — opcional)" />
        </Tabs>

        {candidate === 1 ? (
          <Alert severity="info" variant="outlined">
            {m["spikes.map.relational"]}
          </Alert>
        ) : null}

        <Flex align="flex-start" gap={1.5}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {candidate === 0 ? (
              <CandidatePanel
                meta={findingById("map-react-flow")}
                footer={<FindingsFooter finding={findingById("map-react-flow")} />}
              >
                {textual ? (
                  <MapTextualFallback map={map} />
                ) : (
                  <GovernanceMapReactFlow {...candidateProps} />
                )}
              </CandidatePanel>
            ) : (
              <CandidatePanel
                meta={findingById("map-echarts")}
                footer={<FindingsFooter finding={findingById("map-echarts")} />}
              >
                {textual ? (
                  <MapTextualFallback map={map} />
                ) : (
                  <GovernanceMapECharts {...candidateProps} />
                )}
              </CandidatePanel>
            )}
          </Box>
          {selectedNode ? (
            <MapDetailPanel map={map} node={selectedNode} onClose={() => setSelectedId(null)} />
          ) : null}
        </Flex>
      </Flex>
    </SectionCard>
  );
}
