"use client";

import { useMemo, useState } from "react";
import { Alert, Box, Button, Chip, Typography } from "@mui/material";
import type { GovernanceSnapshot } from "@demo/contracts";
import AppShell from "@/app/_ui/shell/AppShell";
import { EntityCard, Flex, ResponsiveGrid, SectionCard } from "@/app/_ui/shared";

export default function ContractsPlaceholderView({
  workspace,
  accountId,
  snapshot,
}: {
  workspace: { id: string; name: string; demo: boolean; hasGovernanceHost: boolean };
  accountId: string;
  snapshot: GovernanceSnapshot | null;
}) {
  const [selectedId, setSelectedId] = useState("acme-user-context");
  const selected =
    snapshot?.contracts.find((contract) => contract.id === selectedId) ?? snapshot?.contracts[0] ?? null;
  const linkedIntents = useMemo(() => {
    if (!snapshot || !selected) return [];
    return snapshot.portfolio.intents.filter(
      (intent) =>
        (intent["contracts-changed"] ?? []).includes(selected.id) ||
        (intent["contracts-consumed"] ?? []).includes(selected.id)
    );
  }, [snapshot, selected]);
  const compatibilityWindow =
    selected?.["compatibility-window"] ??
    selected?.["revision-proposals"]?.find((proposal) => proposal["compatibility-window"])?.[
      "compatibility-window"
    ] ??
    "sem janela aberta";

  return (
    <AppShell
      chip={workspace.demo ? "demo" : "workspace"}
      subtitle="Governança · contratos"
      headerAction={<Chip size="small" color="info" label={workspace.name} />}
      hasGovernanceHost={workspace.hasGovernanceHost}
      cacheScope={{ accountId, workspaceId: workspace.id, session: "local" }}
      maxWidth="xl"
    >
      <Box sx={{ display: "grid", gap: 2 }}>
        <Typography variant="h1">Contratos</Typography>
        <Typography color="text.secondary">
          Visão read-only dos contratos publicados pelo governance host. Alterar contrato continua
          exigindo comando governado, authority e sourceRevision fresco.
        </Typography>
        <Alert severity="info">
          Estado atual: nenhum adapter ou read-model autoriza alterar contrato; esta tela só lê a
          projeção derivada.
        </Alert>
        {!snapshot ? (
          <Alert severity="warning">
            Este workspace ainda não tem governance host ligado ao read-model. Conecte o host para
            listar contratos.
          </Alert>
        ) : (
          <Box sx={{ display: "grid", gap: 2 }}>
            <Flex data-testid="contract-list" gap={1} wrap>
              <Chip size="small" color="success" label={`revision ${snapshot.revision}`} />
              <Chip size="small" label="owner · consumer · revision" />
              {snapshot.contracts.map((contract) => (
                <Button
                  key={contract.id}
                  data-testid={
                    contract.id === "acme-user-context"
                      ? "contract-acme-user-context"
                      : `contract-${contract.id}`
                  }
                  size="small"
                  variant={selected?.id === contract.id ? "contained" : "outlined"}
                  onClick={() => setSelectedId(contract.id)}
                >
                  {contract.id}
                </Button>
              ))}
            </Flex>

            {selected ? (
              <ResponsiveGrid min={320} gap={2}>
                <EntityCard title={selected.id} subtitle={`revision ${selected.revision}`}>
                  <Box sx={{ display: "grid", gap: 1 }}>
                    <Typography variant="body2">owner: {selected["owner-repo"]}</Typography>
                    <Typography variant="body2">
                      consumer(s): {selected.consumers.join(", ")}
                    </Typography>
                    <Typography
                      data-testid="contract-compatibility-window"
                      variant="body2"
                      color="text.secondary"
                    >
                      compatibility-window: {compatibilityWindow}
                    </Typography>
                  </Box>
                </EntityCard>
                <SectionCard title="Contention e decisão">
                  <Box data-testid="contract-contention-panel" sx={{ display: "grid", gap: 1 }}>
                    {(selected["revision-proposals"] ?? []).map((proposal) => (
                      <Box key={proposal.id}>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          decision: {proposal.decision}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          intent(s): {proposal.intents.join(", ")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          consumers: {proposal.consumers.join(", ")}
                        </Typography>
                      </Box>
                    ))}
                    {linkedIntents.map((intent) => (
                      <Chip
                        key={intent.id}
                        size="small"
                        variant="outlined"
                        label={`intent: ${intent.id}`}
                      />
                    ))}
                  </Box>
                </SectionCard>
              </ResponsiveGrid>
            ) : null}
          </Box>
        )}
      </Box>
    </AppShell>
  );
}
