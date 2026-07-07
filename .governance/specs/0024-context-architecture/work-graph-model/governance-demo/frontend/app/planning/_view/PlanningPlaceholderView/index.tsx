"use client";

import { Alert, Box, Chip, Typography } from "@mui/material";
import AppShell from "@/app/_ui/shell/AppShell";

export default function PlanningPlaceholderView({
  workspace,
  accountId,
}: {
  workspace: { id: string; name: string; demo: boolean; hasGovernanceHost: boolean };
  accountId: string;
}) {
  return (
    <AppShell
      chip={workspace.demo ? "demo" : "workspace"}
      subtitle="Governança · ciclo"
      headerAction={<Chip size="small" color="info" label={workspace.name} />}
      hasGovernanceHost={workspace.hasGovernanceHost}
      cacheScope={{ accountId, workspaceId: workspace.id, session: "local" }}
    >
      <Box sx={{ display: "grid", gap: 2 }}>
        <Typography variant="h1">Planejamento de ciclo</Typography>
        <Typography color="text.secondary">
          A criação governada de ciclos, objetivos, métricas e targets ainda será implementada. Esta
          rota existe para manter Results e o mapa ligados ao fluxo de produto sem cair no console.
        </Typography>
        <Alert severity="info">
          Estado atual: leitura e dashboards derivados já funcionam quando o host publica targets e
          outcomes; mutações de planning continuam bloqueadas até existir comando governado.
        </Alert>
      </Box>
    </AppShell>
  );
}
