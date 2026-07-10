"use client";

import { Alert, Box, Button, Chip, TextField, Typography } from "@mui/material";
import { useState } from "react";
import AppShell from "@/app/_ui/shell/AppShell";
import { Flex } from "@/app/_ui/shared";

export default function PlanningPlaceholderView({
  workspace,
  accountId,
}: {
  workspace: { id: string; name: string; demo: boolean; hasGovernanceHost: boolean };
  accountId: string;
}) {
  const [open, setOpen] = useState(false);
  const [objectiveTitle, setObjectiveTitle] = useState("");
  const [metricId, setMetricId] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function saveTarget() {
    setStatus("saving");
    setMessage("");
    const response = await fetch("/api/local/planning/targets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        objectiveTitle,
        metricId,
        targetValue,
        cycle: "2026-Q3",
      }),
    });
    const payload = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !payload.ok) {
      setStatus("error");
      setMessage(payload.error || `HTTP ${response.status}`);
      return;
    }
    setStatus("saved");
    setMessage("Target planejado. Ele aparece em Resultados como sem actual até existir outcome.");
  }

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
          Comece por um objetivo mensurável do ciclo. Nesta primeira fatia, o app registra um target
          planejado no shell local e deixa claro em Resultados que ainda não existe medição.
        </Typography>
        <Alert severity="info">
          O alvo planejado não conta como resultado. Ele só cria a referência que depois receberá
          evidência, outcome e auditoria.
        </Alert>
        <Box sx={{ display: "grid", gap: 1.5, maxWidth: 720 }}>
          <Button
            data-testid="planning-cycle-create"
            variant="contained"
            onClick={() => setOpen(true)}
            sx={{ justifySelf: "start" }}
          >
            Criar objetivo do ciclo
          </Button>

          {open ? (
            <Box
              component="form"
              onSubmit={(event) => {
                event.preventDefault();
                void saveTarget();
              }}
              sx={{ display: "grid", gap: 1.5 }}
            >
              <TextField
                label="Objetivo"
                value={objectiveTitle}
                onChange={(event) => setObjectiveTitle(event.target.value)}
                slotProps={{ htmlInput: { "data-testid": "objective-title" } }}
                helperText="Exemplo: Aumentar ativação"
              />
              <TextField
                label="Métrica"
                value={metricId}
                onChange={(event) => setMetricId(event.target.value)}
                slotProps={{ htmlInput: { "data-testid": "metric-definition" } }}
                helperText="Use um identificador estável, como activation-rate"
              />
              <TextField
                label="Target"
                type="number"
                value={targetValue}
                onChange={(event) => setTargetValue(event.target.value)}
                slotProps={{ htmlInput: { "data-testid": "target-value" } }}
                helperText="Valor desejado para o ciclo 2026-Q3"
              />
              <Flex gap={1} wrap>
                <Button
                  data-testid="planning-save"
                  disabled={status === "saving"}
                  type="submit"
                  variant="contained"
                >
                  Salvar target
                </Button>
                <Button href="/results" variant="outlined">
                  Ver resultados
                </Button>
              </Flex>
            </Box>
          ) : null}
          {status === "saved" ? (
            <Alert severity="success">{message}</Alert>
          ) : status === "error" ? (
            <Alert severity="error">{message}</Alert>
          ) : null}
        </Box>
      </Box>
    </AppShell>
  );
}
