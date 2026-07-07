"use client";

import { Alert, Box, Chip, Typography } from "@mui/material";
import AppShell from "@/app/_ui/shell/AppShell";

export default function TriagePlaceholderView({
  workspace,
  accountId,
}: {
  workspace: { id: string; name: string; demo: boolean; hasGovernanceHost: boolean };
  accountId: string;
}) {
  return (
    <AppShell
      chip={workspace.demo ? "demo" : "workspace"}
      subtitle="Governança · triagem"
      headerAction={<Chip size="small" color="info" label={workspace.name} />}
      hasGovernanceHost={workspace.hasGovernanceHost}
      cacheScope={{ accountId, workspaceId: workspace.id, session: "local" }}
    >
      <Box sx={{ display: "grid", gap: 2 }}>
        <Typography variant="h1">Triagem</Typography>
        <Typography color="text.secondary">
          A triagem governada completa ainda será implementada. Esta tela já delimita sugestões de
          integração para matcher, catálogo e CODEOWNERS.
        </Typography>
        <Alert data-testid="contextual-integration-triage" severity="info">
          Integrações sugeridas: matcher local, catálogo de capacidades e CODEOWNERS para reduzir
          roteamento manual.
        </Alert>
      </Box>
    </AppShell>
  );
}
