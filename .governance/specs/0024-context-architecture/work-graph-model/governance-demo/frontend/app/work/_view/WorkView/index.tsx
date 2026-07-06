"use client";

import { Alert, Box, Chip, CircularProgress, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { workspaceQueryKeys } from "@/app/_domain/queryKeys";
import { Flex } from "@/app/_ui/shared";
import AppShell from "@/app/_ui/shell/AppShell";
import type { WorkItemsResponse } from "../../_model/view-models";
import copy from "./_locales/pt-br.json";
import { WorkTable } from "./WorkTable";

type WorkspaceSummary = {
  id: string;
  name: string;
  demo: boolean;
  onboardingStatus: string;
};

export default function WorkView({ workspace }: { workspace: WorkspaceSummary }) {
  const queryKey = workspaceQueryKeys.workItems(workspace.id);
  const query = useQuery({ queryKey, queryFn: fetchWorkItems });

  return (
    <AppShell
      chip={workspace.demo ? "demo" : "workspace"}
      subtitle="Governança · trabalho"
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
          {query.data?.ok && query.data.work ? (
            <>
              <Chip size="small" color="success" label={copy.derived} />
              <Chip
                size="small"
                variant="outlined"
                label={`${copy.sourceRevision}: ${query.data.work.sourceRevision}`}
              />
            </>
          ) : null}
        </Flex>
        {query.isLoading ? <LoadingState /> : null}
        {query.isError ? <Alert severity="error">{copy.error}</Alert> : null}
        {query.data?.ok ? <WorkState response={query.data} /> : null}
        {query.data && !query.data.ok ? <Alert severity="error">{query.data.error}</Alert> : null}
      </Box>
    </AppShell>
  );
}

function WorkState({ response }: { response: Extract<WorkItemsResponse, { ok: true }> }) {
  if (!response.work) {
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
  return <WorkTable rows={response.work.rows} />;
}

function LoadingState() {
  return (
    <Flex align="center" gap={1}>
      <CircularProgress size={18} />
      <Typography variant="body2">{copy.loading}</Typography>
    </Flex>
  );
}

async function fetchWorkItems(): Promise<WorkItemsResponse> {
  const response = await fetch("/api/work/items", { cache: "no-store" });
  const payload = (await response.json()) as WorkItemsResponse;
  if (!response.ok && payload.ok) throw new Error(`HTTP ${response.status}`);
  return payload;
}
