"use client";

import { useMemo, useState } from "react";
import { Alert, Box, Button, Chip, Typography } from "@mui/material";
import type { IntegrationBacklogEntry } from "@demo/domain";
import AppShell from "@/app/_ui/shell/AppShell";
import { EntityCard, Flex, ResponsiveGrid, SectionCard } from "@/app/_ui/shared";
import copy from "./_locales/pt-br.json";

type WorkspaceSummary = {
  id: string;
  name: string;
  demo: boolean;
  hasGovernanceHost: boolean;
};

const cardAliases: Record<string, string[]> = {
  "git-provider": ["integration-card-github-work-source", "integration-card-git-local"],
  "assistant-runtime-local-cloud": [
    "integration-card-cloud-assistant",
    "integration-card-assistant-runtime",
  ],
};

function primaryTestId(entry: IntegrationBacklogEntry): string {
  if (entry.id === "observability") return "integration-card-observability";
  return cardAliases[entry.id]?.[0] ?? `integration-card-${entry.id}`;
}

function statusLabel(entry: IntegrationBacklogEntry): string {
  if (entry.configured) return "configured";
  if (entry.status === "disponivel") return "disponível";
  if (entry.status === "release-1") return "release 1";
  if (entry.status === "adiado") return "adiado";
  return "em breve";
}

export default function IntegrationsHubView({
  workspace,
  accountId,
  entries,
  honestyNote,
}: {
  workspace: WorkspaceSummary;
  accountId: string;
  entries: IntegrationBacklogEntry[];
  honestyNote: string;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | "available">("all");
  const [selectedCloud, setSelectedCloud] = useState(false);
  const visibleEntries = useMemo(
    () =>
      entries.filter((entry) =>
        statusFilter === "available"
          ? entry.configured || entry.status === "disponivel" || entry.status === "release-1"
          : true
      ),
    [entries, statusFilter]
  );

  return (
    <AppShell
      chip={workspace.demo ? "demo" : "workspace"}
      subtitle={copy.subtitle}
      headerAction={<Chip size="small" color="info" label={workspace.name} />}
      hasGovernanceHost={workspace.hasGovernanceHost}
      cacheScope={{ accountId, workspaceId: workspace.id, session: "local" }}
      maxWidth="xl"
    >
      <Box sx={{ display: "grid", gap: 3 }}>
        <Box>
          <Typography variant="h1">{copy.title}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {copy.lead}
          </Typography>
        </Box>
        <Alert severity="info">{honestyNote}</Alert>
        <Flex gap={1} wrap>
          <Button
            data-testid="integration-filter-available"
            size="small"
            variant={statusFilter === "available" ? "contained" : "outlined"}
            onClick={() => setStatusFilter(statusFilter === "available" ? "all" : "available")}
          >
            {copy.filterAvailable}
          </Button>
          <Chip size="small" label={copy.noSecondSsot} />
        </Flex>

        <SectionCard title={copy.identityVsWorkTitle}>
          <Box sx={{ display: "grid", gap: 1 }}>
            <Typography data-testid="github-login-status" variant="body2">
              GitHub identity/login: autentica a pessoa, mas não concede authority governada.
            </Typography>
            <Typography data-testid="github-work-source-status" variant="body2">
              GitHub work-source: conecta repos/fontes de trabalho para evidência e revisão.
            </Typography>
            <Alert data-testid="github-authority-warning" severity="warning">
              Login externo nao concede authority. Papéis continuam derivados do governance host.
            </Alert>
          </Box>
        </SectionCard>

        {selectedCloud ? (
          <Alert data-testid="integration-activation-status" severity="warning">
            blocked/pending: provider cloud precisa de approval de security/egress.
            <Typography
              data-testid="integration-approval-required"
              variant="caption"
              sx={{ display: "block" }}
            >
              security-owner aprova dados acessados, retenção e forma de desativar.
            </Typography>
          </Alert>
        ) : null}

        <ResponsiveGrid min={280} gap={1.5}>
          {visibleEntries.map((entry) => (
            <EntityCard
              key={entry.id}
              title={entry.id}
              subtitle={`${entry.category} · ${statusLabel(entry)}`}
              data-testid={primaryTestId(entry)}
            >
              <Box sx={{ display: "grid", gap: 1 }}>
                <Flex gap={0.5} wrap>
                  <Chip size="small" color={entry.configured ? "success" : "default"} label={statusLabel(entry)} />
                  {entry.localAdapter ? <Chip size="small" label={`adapter local: ${entry.localAdapter}`} /> : null}
                  {entry.cloudRelease1 ? <Chip size="small" color="info" label="cloud release 1" /> : null}
                </Flex>
                <Typography variant="body2" color="text.secondary">
                  Sem esta integracao, o framework continua file-first; a evidência fica manual,
                  local ou rebaixada conforme a fonte disponível.
                </Typography>
                <Typography variant="body2">
                  Permissões: leitura explícita dos dados necessários; desativação deve manter
                  histórico e nunca apagar estado oficial.
                </Typography>
                <Typography
                  data-testid={
                    entry.id === "observability" ? "integration-write-authority" : undefined
                  }
                  variant="caption"
                  color="text.secondary"
                >
                  read-only por padrão; adapter não grava estado oficial sem contrato governado.
                </Typography>
                <Flex gap={0.5} wrap>
                  {(cardAliases[entry.id] ?? []).slice(1).map((testId) => (
                    <Chip key={testId} data-testid={testId} size="small" label={entry.id} />
                  ))}
                  {entry.systems.slice(0, 4).map((system) => (
                    <Chip key={system} size="small" variant="outlined" label={system} />
                  ))}
                </Flex>
                {entry.id === "assistant-runtime-local-cloud" ? (
                  <Button
                    data-testid="cloud-provider-request"
                    size="small"
                    variant="outlined"
                    onClick={() => setSelectedCloud(true)}
                  >
                    Solicitar provider cloud
                  </Button>
                ) : null}
                {entry.id === "assistant-runtime-local-cloud" ? (
                  <Button
                    data-testid="integration-request-activation"
                    size="small"
                    color="warning"
                    variant="outlined"
                    onClick={() => setSelectedCloud(true)}
                  >
                    Pedir ativação
                  </Button>
                ) : null}
              </Box>
            </EntityCard>
          ))}
        </ResponsiveGrid>
      </Box>
    </AppShell>
  );
}
