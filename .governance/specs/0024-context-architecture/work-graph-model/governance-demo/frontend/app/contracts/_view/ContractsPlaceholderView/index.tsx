"use client";

import { Alert, Box, Chip, Typography } from "@mui/material";
import AppShell from "@/app/_ui/shell/AppShell";

export default function ContractsPlaceholderView({
  workspace,
  accountId,
}: {
  workspace: { id: string; name: string; demo: boolean; hasGovernanceHost: boolean };
  accountId: string;
}) {
  return (
    <AppShell
      chip={workspace.demo ? "demo" : "workspace"}
      subtitle="Governança · contratos"
      headerAction={<Chip size="small" color="info" label={workspace.name} />}
      hasGovernanceHost={workspace.hasGovernanceHost}
      cacheScope={{ accountId, workspaceId: workspace.id, session: "local" }}
    >
      <Box sx={{ display: "grid", gap: 2 }}>
        <Typography variant="h1">Contratos</Typography>
        <Typography color="text.secondary">
          O detalhe governado de owners, consumers, revisions e compatibility-window será uma tela
          própria. Por enquanto, impacto e caminho de contrato já aparecem no mapa derivado.
        </Typography>
        <Alert severity="info">
          Estado atual: nenhum adapter ou read-model autoriza alterar contrato; qualquer ação futura
          precisará reler sourceRevision e passar por autoridade governada.
        </Alert>
      </Box>
    </AppShell>
  );
}
