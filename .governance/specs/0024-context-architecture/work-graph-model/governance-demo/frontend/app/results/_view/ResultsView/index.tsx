"use client";

import { Alert, Box, Button, Chip, CircularProgress, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { workspaceQueryKeys } from "@/app/_domain/queryKeys";
import { Flex, ResponsiveGrid, StatCard } from "@/app/_ui/shared";
import AppShell from "@/app/_ui/shell/AppShell";
import type { ResultsDashboardResponse } from "../../_model/view-models";
import copy from "./_locales/pt-br.json";
import { ResultsCharts } from "./ResultsCharts";
import { TargetEvidenceList } from "./TargetEvidenceList";

type WorkspaceSummary = {
  id: string;
  name: string;
  demo: boolean;
  onboardingStatus: string;
};

export default function ResultsView({ workspace }: { workspace: WorkspaceSummary }) {
  const queryKey = workspaceQueryKeys.resultsDashboard(workspace.id);
  const query = useQuery({
    queryKey,
    queryFn: fetchResultsDashboard,
  });

  return (
    <AppShell
      chip={workspace.demo ? "demo" : "workspace"}
      subtitle="Governança · resultados"
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

        <Alert data-testid="contextual-integration-observability" severity="info">
          Integração sugerida: observability/analytics/feature-flags podem reduzir evidência manual
          de outcomes. Sem elas, o rollup continua derivado do host e marca confiança
          explicitamente.
        </Alert>

        <Flex gap={1} wrap>
          <Chip size="small" label={`${copy.queryKey}: ${queryKey.join(" / ")}`} />
          {query.data?.ok && query.data.dashboard ? (
            <>
              <Chip size="small" color="success" label={copy.derived} />
              <Chip
                size="small"
                variant="outlined"
                label={`${copy.sourceRevision}: ${query.data.dashboard.sourceRevision}`}
              />
            </>
          ) : null}
        </Flex>

        {query.isLoading ? <LoadingState /> : null}
        {query.isError ? <ErrorState /> : null}
        {query.data?.ok ? <DashboardState response={query.data} /> : null}
        {query.data && !query.data.ok ? <Alert severity="error">{query.data.error}</Alert> : null}
      </Box>
    </AppShell>
  );
}

function DashboardState({
  response,
}: {
  response: Extract<ResultsDashboardResponse, { ok: true }>;
}) {
  const [showSelfAttestedWarning, setShowSelfAttestedWarning] = useState(false);
  if (!response.dashboard) {
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
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <ResponsiveGrid min={220} gap={1.5}>
        {response.dashboard.scorecards.map((scorecard) => (
          <StatCard
            key={scorecard.id}
            label={scorecard.label}
            value={scorecard.value}
            detail={scorecard.detail}
            tone={scorecard.confidence === "verified" ? "success" : "warning"}
          />
        ))}
      </ResponsiveGrid>
      <Flex data-testid="results-confidence-legend" gap={0.75} wrap>
        <Chip size="small" color="success" label="valid" />
        <Chip size="small" color="warning" label={copy.trust["self-declared"]} />
        <Chip size="small" label={copy.trust["no-evidence"]} />
        <Chip size="small" label={copy.trust.stale} />
        <Button
          data-testid="results-filter-self-attested"
          size="small"
          variant="outlined"
          onClick={() => setShowSelfAttestedWarning(true)}
        >
          Mostrar auto-declarados
        </Button>
      </Flex>
      {showSelfAttestedWarning ? (
        <Alert data-testid="results-warning-panel" severity="warning">
          Resultados auto-declarados/self-attested ficam visíveis, mas não contam como evidência
          independente enquanto o resolver não provar fonte e atestador.
        </Alert>
      ) : null}
      <Box>
        <Typography variant="h2" sx={{ mb: 1 }}>
          {copy.overview}
        </Typography>
        <ResultsCharts dashboard={response.dashboard} />
      </Box>
      <TargetEvidenceList dashboard={response.dashboard} />
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

function ErrorState() {
  return <Alert severity="error">{copy.error}</Alert>;
}

async function fetchResultsDashboard(): Promise<ResultsDashboardResponse> {
  const response = await fetch("/api/results/dashboard", { cache: "no-store" });
  const payload = (await response.json()) as ResultsDashboardResponse;
  if (!response.ok && payload.ok) throw new Error(`HTTP ${response.status}`);
  return payload;
}
