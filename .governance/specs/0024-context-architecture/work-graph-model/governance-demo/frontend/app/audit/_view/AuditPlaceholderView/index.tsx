"use client";

import { Alert, Box, Chip, Typography } from "@mui/material";
import AppShell from "@/app/_ui/shell/AppShell";

export default function AuditPlaceholderView({
  workspace,
  accountId,
}: {
  workspace: { id: string; name: string; demo: boolean; hasGovernanceHost: boolean };
  accountId: string;
}) {
  return (
    <AppShell
      chip={workspace.demo ? "demo" : "workspace"}
      subtitle="Governança · auditoria"
      headerAction={<Chip size="small" color="info" label={workspace.name} />}
      hasGovernanceHost={workspace.hasGovernanceHost}
      cacheScope={{ accountId, workspaceId: workspace.id, session: "local" }}
    >
      <Box sx={{ display: "grid", gap: 2 }}>
        <Typography variant="h1">Auditoria</Typography>
        <Typography color="text.secondary">
          A trilha humana de decisões, break-glass e eventos ainda será promovida para uma tela
          operacional. O contrato de segurança segue no backend e no event-log do host.
        </Typography>
        <Alert severity="info">
          Estado atual: o app não inventa auditoria visual. Quando esta tela for ativada, ela deve
          mostrar actor, authority, base/source revision e idempotency.
        </Alert>
      </Box>
    </AppShell>
  );
}
