"use client";

import { Alert, Box, Chip, CircularProgress, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { workspaceQueryKeys } from "@/app/_domain/queryKeys";
import { Flex } from "@/app/_ui/shared";
import AppShell from "@/app/_ui/shell/AppShell";
import { applyMapFilter, mapNeighborhood } from "../../_model/map-ops";
import type { GovernanceMapsResponse, MapFilterState } from "../../_model/view-models";
import copy from "./_locales/pt-br.json";
import { GovernanceMapCanvas } from "./GovernanceMapCanvas";
import { MapControls, ScopeSelect } from "./MapControls";
import { MapDetailPanel } from "./MapDetailPanel";

const EMPTY_FILTER: MapFilterState = {
  kind: "",
  confidence: "",
  risk: "",
  onlyContract: false,
  text: "",
};

type WorkspaceSummary = {
  id: string;
  name: string;
  demo: boolean;
  onboardingStatus: string;
};

export default function MapView({ workspace }: { workspace: WorkspaceSummary }) {
  const queryKey = workspaceQueryKeys.governanceMap(workspace.id);
  const query = useQuery({ queryKey, queryFn: fetchGovernanceMaps });

  return (
    <AppShell
      chip={workspace.demo ? "demo" : "workspace"}
      subtitle="Governança · mapa"
      headerAction={<Chip size="small" color="info" label={workspace.name} />}
      maxWidth="xl"
    >
      <Box sx={{ display: "grid", gap: 3 }}>
        <Box>
          <Typography variant="h1">{copy.title}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {copy.subtitle}
          </Typography>
        </Box>
        <Flex gap={1} wrap>
          <Chip size="small" label={`${copy.queryKey}: ${queryKey.join(" / ")}`} />
          {query.data?.ok && query.data.maps?.[0] ? (
            <>
              <Chip size="small" color="success" label={copy.derived} />
              <Chip
                size="small"
                variant="outlined"
                label={`${copy.sourceRevision}: ${query.data.maps[0].sourceRevision}`}
              />
            </>
          ) : null}
        </Flex>
        {query.isLoading ? <LoadingState /> : null}
        {query.isError ? <Alert severity="error">{copy.error}</Alert> : null}
        {query.data?.ok ? <MapState response={query.data} /> : null}
        {query.data && !query.data.ok ? <Alert severity="error">{query.data.error}</Alert> : null}
      </Box>
    </AppShell>
  );
}

function MapState({ response }: { response: Extract<GovernanceMapsResponse, { ok: true }> }) {
  const [scopeId, setScopeId] = useState(response.maps?.[0]?.scopeId ?? "");
  const [filter, setFilter] = useState<MapFilterState>(EMPTY_FILTER);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const map = response.maps?.find((item) => item.scopeId === scopeId) ?? response.maps?.[0] ?? null;
  const filteredMap = useMemo(() => (map ? applyMapFilter(map, filter) : null), [map, filter]);
  const selectedNode = filteredMap?.nodes.find((node) => node.id === selectedId) ?? null;
  const highlight = useMemo(
    () =>
      filteredMap && selectedId ? mapNeighborhood(filteredMap, selectedId, 2) : new Set<string>(),
    [filteredMap, selectedId]
  );

  if (!response.maps || response.maps.length === 0 || !filteredMap) {
    return (
      <Alert severity="info">
        <Typography variant="subtitle2">{copy.emptyTitle}</Typography>
        <Typography variant="body2">{copy.emptyBody}</Typography>
        {response.unavailableReason ? (
          <Typography variant="caption">motivo: {response.unavailableReason}</Typography>
        ) : null}
      </Alert>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Flex gap={1.5} align="center" justify="space-between" wrap>
        <ScopeSelect maps={response.maps} scopeId={filteredMap.scopeId} setScopeId={setScopeId} />
        <Chip
          size="small"
          variant="outlined"
          label={copy.nodeCount
            .replace("{nodes}", String(filteredMap.nodes.length))
            .replace("{edges}", String(filteredMap.edges.length))}
        />
      </Flex>
      <MapControls
        filter={filter}
        setFilter={(value) => {
          setFilter(value);
          setSelectedId(null);
        }}
      />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 320px" }, gap: 2 }}>
        <GovernanceMapCanvas
          map={filteredMap}
          selectedId={selectedId}
          highlight={highlight}
          onSelect={setSelectedId}
        />
        <MapDetailPanel node={selectedNode} />
      </Box>
    </Box>
  );
}

function LoadingState() {
  return (
    <Flex align="center" gap={1}>
      <CircularProgress size={18} />
      <Typography variant="body2">{copy.loading}</Typography>
    </Flex>
  );
}

async function fetchGovernanceMaps(): Promise<GovernanceMapsResponse> {
  const response = await fetch("/api/map/governance", { cache: "no-store" });
  const payload = (await response.json()) as GovernanceMapsResponse;
  if (!response.ok && payload.ok) throw new Error(`HTTP ${response.status}`);
  return payload;
}
