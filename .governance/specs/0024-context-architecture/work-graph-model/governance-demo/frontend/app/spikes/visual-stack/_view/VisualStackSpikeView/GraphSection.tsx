"use client";

// GraphSection — spike 4: grafo técnico/console. Mesmo view-model (read-model
// real ou fixture grande) nos três candidatos; vizinhança, caminho, impacto de
// contrato e deps de intent calculados no view-model (graph-ops), nunca na lib.
import {
  Alert,
  Chip,
  FormControlLabel,
  Paper,
  Skeleton,
  Switch,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Flex, SectionCard } from "@/app/_ui/shared";
import { CandidatePanel } from "../../_candidates/shared/CandidatePanel";
import { GraphTextualFallback } from "../../_candidates/shared/TextualFallback";
import { GraphECharts } from "../../_candidates/graph-echarts/GraphECharts";
import { GraphReagraph } from "../../_candidates/graph-reagraph/GraphReagraph";

// Sigma v3 referencia WebGL2RenderingContext na avaliação do módulo — não
// sobrevive a SSR (achado do spike): entra via dynamic(ssr:false).
const GraphSigma = dynamic(
  () => import("../../_candidates/graph-sigma/GraphSigma").then((module) => module.GraphSigma),
  { ssr: false, loading: () => <Skeleton variant="rounded" height={440} /> }
);
import {
  applyGraphFilter,
  contractImpactSlice,
  intentDepsSlice,
  neighborhood,
  shortestPath,
} from "../../_model/graph-ops";
import { buildSyntheticGraph } from "../../_model/synthetic-fixture";
import type { GovernanceGraphViewModel, GraphFilterState } from "../../_model/view-models";
import { EMPTY_GRAPH_FILTER } from "../../_model/view-models";
import { GraphSectionControls, type GraphMode } from "./GraphSectionControls";
import { FindingsFooter } from "./FindingsFooter";
import { findingById } from "./findings";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

type DatasetKey = "real" | "syn1k" | "syn3k";

export function GraphSection({ realGraph }: { realGraph: GovernanceGraphViewModel }) {
  const [dataset, setDataset] = useState<DatasetKey>("real");
  const [candidate, setCandidate] = useState(0);
  const [filter, setFilter] = useState<GraphFilterState>(EMPTY_GRAPH_FILTER);
  const [mode, setMode] = useState<GraphMode>("explore");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pathFrom, setPathFrom] = useState<string | null>(null);
  const [textual, setTextual] = useState(false);

  const graph = useMemo(() => {
    if (dataset === "syn1k") return buildSyntheticGraph(1000);
    if (dataset === "syn3k") return buildSyntheticGraph(3000);
    return realGraph;
  }, [dataset, realGraph]);

  const filtered = useMemo(() => applyGraphFilter(graph, filter), [graph, filter]);

  const operation = useMemo(() => {
    if (mode === "neighborhood" && selectedId) {
      const slice = neighborhood(filtered, selectedId, 2);
      return {
        ids: new Set(slice.nodes.map((node) => node.id)),
        note: m["spikes.graph.op.neighborhood"],
      };
    }
    if (mode === "path" && pathFrom && selectedId && pathFrom !== selectedId) {
      const slice = shortestPath(filtered, pathFrom, selectedId);
      if (!slice) return { ids: new Set<string>(), note: m["spikes.graph.op.nopath"] };
      return { ids: new Set(slice.nodes.map((node) => node.id)), note: m["spikes.graph.op.path"] };
    }
    if (mode === "contract-impact" && selectedId) {
      const slice = contractImpactSlice(filtered, selectedId);
      return {
        ids: new Set(slice.nodes.map((node) => node.id)),
        note: m["spikes.graph.op.impact"],
      };
    }
    if (mode === "intent-deps" && selectedId) {
      const slice = intentDepsSlice(filtered, selectedId);
      return { ids: new Set(slice.nodes.map((node) => node.id)), note: m["spikes.graph.op.deps"] };
    }
    return { ids: new Set<string>(), note: "" };
  }, [mode, selectedId, pathFrom, filtered]);

  const selectedNode = filtered.nodes.find((node) => node.id === selectedId) ?? null;

  const onSelect = (id: string | null) => {
    if (mode === "path") setPathFrom(selectedId);
    setSelectedId(id);
  };

  const candidateProps = {
    nodes: filtered.nodes,
    edges: filtered.edges,
    selectedId,
    highlight: operation.ids as ReadonlySet<string>,
    onSelect,
  };

  return (
    <SectionCard title={m["spikes.graph.title"]} subtitle={m["spikes.graph.subtitle"]}>
      <Flex direction="column" gap={1.5}>
        <Flex align="center" gap={2} wrap>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={dataset}
            onChange={(_event, value: DatasetKey | null) => {
              if (!value) return;
              setDataset(value);
              setSelectedId(null);
              setPathFrom(null);
              setFilter(EMPTY_GRAPH_FILTER);
            }}
          >
            <ToggleButton value="real">{m["spikes.dataset.real"]}</ToggleButton>
            <ToggleButton value="syn1k">{m["spikes.dataset.syn1k"]}</ToggleButton>
            <ToggleButton value="syn3k">{m["spikes.dataset.syn3k"]}</ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary">
            {filtered.nodes.length}/{graph.nodes.length} nós · {filtered.edges.length} arestas ·
            revisão {graph.sourceRevision}
          </Typography>
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
        </Flex>

        <GraphSectionControls
          graph={graph}
          filter={filter}
          onFilter={setFilter}
          mode={mode}
          onMode={(next) => {
            setMode(next);
            setPathFrom(null);
          }}
        />

        {mode !== "explore" ? (
          <Alert severity="info" variant="outlined">
            {mode === "path" ? m["spikes.graph.pathhint"] : m["spikes.graph.selecthint"]}{" "}
            {operation.note}
          </Alert>
        ) : null}

        {selectedNode ? (
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Flex align="center" gap={1} wrap>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {selectedNode.label}
              </Typography>
              <Chip size="small" variant="outlined" label={selectedNode.type} />
              <Chip
                size="small"
                variant="outlined"
                label={`confiança: ${selectedNode.confidence}`}
              />
              {selectedNode.team ? (
                <Chip size="small" variant="outlined" label={`time: ${selectedNode.team}`} />
              ) : null}
              {selectedNode.owner ? (
                <Chip size="small" variant="outlined" label={`resp.: ${selectedNode.owner}`} />
              ) : null}
              <Typography variant="caption" color="text.secondary">
                fonte: {selectedNode.source || "—"}
              </Typography>
            </Flex>
          </Paper>
        ) : null}

        <Tabs value={candidate} onChange={(_e, value: number) => setCandidate(value)}>
          <Tab label="Sigma.js + Graphology" />
          <Tab label="Reagraph" />
          <Tab label="ECharts graph" />
        </Tabs>

        {textual ? (
          <GraphTextualFallback nodes={filtered.nodes} edges={filtered.edges} />
        ) : candidate === 0 ? (
          <CandidatePanel
            meta={findingById("graph-sigma")}
            footer={<FindingsFooter finding={findingById("graph-sigma")} />}
          >
            <GraphSigma {...candidateProps} />
          </CandidatePanel>
        ) : candidate === 1 ? (
          <CandidatePanel
            meta={findingById("graph-reagraph")}
            footer={<FindingsFooter finding={findingById("graph-reagraph")} />}
          >
            <GraphReagraph {...candidateProps} />
          </CandidatePanel>
        ) : (
          <CandidatePanel
            meta={findingById("graph-echarts")}
            footer={<FindingsFooter finding={findingById("graph-echarts")} />}
          >
            <GraphECharts {...candidateProps} />
          </CandidatePanel>
        )}
      </Flex>
    </SectionCard>
  );
}
