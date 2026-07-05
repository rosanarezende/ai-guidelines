"use client";

// ServerStateSpike — TanStack Query sobre a API local:
// - chave de cache = [workspace, rota, filtros]; a resposta carrega
//   sourceRevision e o painel torna o "derivado/stale" VISÍVEL;
// - mutation (dry-run governado) invalida as queries de leitura;
// - dry-run com base-revision antiga prova o fail-closed do runtime.
// O cache NUNCA vira SSOT: toda ação governada relê a fonte no backend.
import { Alert, Box, Button, Chip, MenuItem, Select, Typography } from "@mui/material";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Flex } from "@/app/_ui/shared";
import { JsonBlock } from "@/app/_ui/shared/JsonBlock";

const WORKSPACE = "sandbox-demo-acme";

type GraphOverviewResponse = {
  sourceRevision: string;
  projectedAt: string;
  derived: boolean;
  nodes: Array<{ id: string }>;
  edges: Array<{ id: string }>;
  nodeTypes: string[];
};

async function fetchGraphOverview(type: string): Promise<GraphOverviewResponse> {
  const query = type ? `?type=${encodeURIComponent(type)}` : "";
  const response = await fetch(`/api/graph${query}`);
  if (!response.ok) throw new Error(`GET /api/graph -> ${response.status}`);
  return (await response.json()) as GraphOverviewResponse;
}

function ServerStatePanel({ initialRevision }: { initialRevision: string }) {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("");
  const [lastDryRun, setLastDryRun] = useState<unknown>(null);
  const dryRunCounter = useRef(0);

  const overview = useQuery({
    queryKey: [WORKSPACE, "graph-overview", typeFilter],
    queryFn: () => fetchGraphOverview(typeFilter),
    staleTime: 30_000,
  });

  const revision = overview.data?.sourceRevision ?? initialRevision;
  const revisionDiverged = overview.data ? overview.data.sourceRevision !== initialRevision : false;

  const dryRun = useMutation({
    mutationFn: async (baseRevision: string) => {
      dryRunCounter.current += 1;
      const body = {
        id: `spike-dry-run-${dryRunCounter.current}`,
        type: "proposal.create",
        envelope: {
          actor: "spike-visual-stack",
          authority: "pm-growth",
          "base-revision": baseRevision,
          "idempotency-key": `spike-dry-run-${dryRunCounter.current}-${baseRevision}`,
          "issued-at": new Date().toISOString(),
          nonce: `spike-nonce-${dryRunCounter.current}`,
        },
        payload: {
          proposal: {
            id: `spike-proposal-${dryRunCounter.current}`,
            title: "Proposta do spike (somente dry-run; nada é gravado)",
            "raised-by": "incident:incidente-checkout",
            "authorized-by": "obj-efficiency",
            target: "tgt-sre-incidents",
            status: "proposed",
          },
        },
      };
      const response = await fetch("/api/commands/dry-run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      return { status: response.status, body: (await response.json()) as unknown };
    },
    onSettled: async (result) => {
      setLastDryRun(result);
      // invalidação pós-mutation: leituras derivadas são refeitas no servidor
      await queryClient.invalidateQueries({ queryKey: [WORKSPACE, "graph-overview"] });
    },
  });

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Flex align="center" gap={1} wrap>
        <Chip size="small" variant="outlined" label={`workspace: ${WORKSPACE}`} />
        <Chip size="small" variant="outlined" label={`sourceRevision: ${revision}`} />
        <Chip size="small" color="default" variant="outlined" label="derivado — não é SSOT" />
        <Chip
          size="small"
          color={overview.isStale ? "warning" : "success"}
          label={overview.isStale ? "cache stale (staleTime 30s)" : "cache fresh"}
        />
        {overview.isFetching ? <Chip size="small" label="refazendo leitura…" /> : null}
      </Flex>

      {revisionDiverged ? (
        <Alert severity="warning">
          O read-model mudou desde o carregamento da página ({initialRevision} →{" "}
          {overview.data?.sourceRevision}). Ações governadas precisam reler a fonte.
        </Alert>
      ) : null}

      <Flex align="center" gap={1} wrap>
        <Typography variant="caption" color="text.secondary">
          Filtro por tipo (cada filtro é uma chave de cache própria):
        </Typography>
        <Select
          size="small"
          displayEmpty
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <MenuItem value="">todos os tipos</MenuItem>
          {(overview.data?.nodeTypes ?? []).map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
        <Typography variant="caption">
          {overview.data
            ? `${overview.data.nodes.length} nós · ${overview.data.edges.length} arestas`
            : overview.isError
              ? `erro: ${String(overview.error)}`
              : "carregando…"}
        </Typography>
      </Flex>

      <Flex align="center" gap={1} wrap>
        <Button size="small" variant="outlined" onClick={() => overview.refetch()}>
          refetch manual
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => queryClient.invalidateQueries({ queryKey: [WORKSPACE, "graph-overview"] })}
        >
          invalidar cache do workspace
        </Button>
        <Button
          size="small"
          variant="contained"
          disabled={dryRun.isPending}
          onClick={() => dryRun.mutate(revision)}
        >
          dry-run com revisão atual
        </Button>
        <Button
          size="small"
          color="warning"
          variant="contained"
          disabled={dryRun.isPending}
          onClick={() => dryRun.mutate("revisao-antiga-forjada")}
        >
          dry-run com revisão stale (deve falhar fechado)
        </Button>
      </Flex>

      {lastDryRun !== null ? (
        <Box>
          <Typography variant="caption" color="text.secondary">
            Resultado do último dry-run (o runtime releu a fonte autoritativa; nada foi gravado):
          </Typography>
          <JsonBlock value={lastDryRun} />
        </Box>
      ) : null}
    </Box>
  );
}

export function ServerStateSpike({ initialRevision }: { initialRevision: string }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
      })
  );
  return (
    <QueryClientProvider client={client}>
      <ServerStatePanel initialRevision={initialRevision} />
    </QueryClientProvider>
  );
}
