"use client";

import { Alert, Box, Button, Chip, MenuItem, TextField, Typography } from "@mui/material";
import { useState } from "react";
import AppShell from "@/app/_ui/shell/AppShell";
import { Flex } from "@/app/_ui/shared";

type TargetOption = { id: string; objectiveTitle: string; metricId: string };
type InitiativeSummary = {
  id: string;
  problem: string;
  bet: string;
  question: string;
  status: "triage";
};

export default function IntakeView({
  workspace,
  accountId,
}: {
  workspace: {
    id: string;
    name: string;
    demo: boolean;
    hasGovernanceHost: boolean;
    targets: TargetOption[];
    initiatives: InitiativeSummary[];
  };
  accountId: string;
}) {
  const [open, setOpen] = useState(false);
  const [problem, setProblem] = useState("");
  const [bet, setBet] = useState("");
  const [question, setQuestion] = useState("");
  const [linkedTargetId, setLinkedTargetId] = useState(workspace.targets[0]?.id || "");
  const [initiatives, setInitiatives] = useState(workspace.initiatives);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submitInitiative() {
    setStatus("saving");
    setMessage("");
    const response = await fetch("/api/local/intake/initiatives", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        problem,
        bet,
        question,
        ...(linkedTargetId ? { linkedTargetId } : {}),
      }),
    });
    const payload = (await response.json()) as {
      ok: boolean;
      error?: string;
      intake?: { initiatives: InitiativeSummary[] };
    };
    if (!response.ok || !payload.ok) {
      setStatus("error");
      setMessage(payload.error || `HTTP ${response.status}`);
      return;
    }
    setInitiatives(payload.intake?.initiatives || initiatives);
    setStatus("saved");
    setMessage("Iniciativa registrada para triagem. Nenhuma solução técnica foi assumida.");
  }

  return (
    <AppShell
      chip={workspace.demo ? "demo" : "workspace"}
      subtitle="Governança · intake"
      headerAction={<Chip size="small" color="info" label={workspace.name} />}
      hasGovernanceHost={workspace.hasGovernanceHost}
      cacheScope={{ accountId, workspaceId: workspace.id, session: "local" }}
    >
      <Box sx={{ display: "grid", gap: 2 }}>
        <Typography variant="h1">Iniciativas</Typography>
        <Typography color="text.secondary">
          Registre uma aposta de trabalho sem escolher arquitetura, repo ou breakdown técnico antes
          da hora. A triagem vem depois e deixa a decisão rastreável.
        </Typography>
        <Alert severity="info">
          Intake captura problema, aposta e dúvidas. Isso pode se ligar a um target do ciclo, mas
          ainda não cria execução nem resultado.
        </Alert>

        <Box sx={{ display: "grid", gap: 1.5, maxWidth: 820 }}>
          <Button
            data-testid="initiative-register"
            variant="contained"
            onClick={() => setOpen(true)}
            sx={{ justifySelf: "start" }}
          >
            Registrar iniciativa
          </Button>

          {open ? (
            <Box
              component="form"
              onSubmit={(event) => {
                event.preventDefault();
                void submitInitiative();
              }}
              sx={{ display: "grid", gap: 1.5 }}
            >
              <TextField
                label="Problema observado"
                value={problem}
                onChange={(event) => setProblem(event.target.value)}
                slotProps={{ htmlInput: { "data-testid": "initiative-problem" } }}
                helperText="Exemplo: Usuários não concluem a etapa inicial"
              />
              <TextField
                label="Aposta"
                value={bet}
                onChange={(event) => setBet(event.target.value)}
                slotProps={{ htmlInput: { "data-testid": "initiative-bet" } }}
                helperText="O que vale explorar, sem escolher a solução final"
              />
              <TextField
                label="Dúvida para triagem"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                slotProps={{ htmlInput: { "data-testid": "initiative-question" } }}
                helperText="O que ainda precisa ser descoberto antes de ativar trabalho"
              />
              <TextField
                select
                label="Target relacionado"
                value={linkedTargetId}
                onChange={(event) => setLinkedTargetId(event.target.value)}
                helperText="Opcional; ajuda Results e triagem a manter contexto"
              >
                <MenuItem value="">Sem target por enquanto</MenuItem>
                {workspace.targets.map((target) => (
                  <MenuItem key={target.id} value={target.id}>
                    {target.objectiveTitle} · {target.metricId}
                  </MenuItem>
                ))}
              </TextField>
              <Flex gap={1} wrap>
                <Button
                  data-testid="initiative-submit"
                  disabled={status === "saving"}
                  type="submit"
                  variant="contained"
                >
                  Enviar para triagem
                </Button>
                <Button href="/triage" variant="outlined">
                  Abrir triagem
                </Button>
              </Flex>
            </Box>
          ) : null}

          {status === "saved" ? (
            <Alert data-testid="proposal-status" severity="success">
              {message}
            </Alert>
          ) : status === "error" ? (
            <Alert severity="error">{message}</Alert>
          ) : null}

          <Box sx={{ display: "grid", gap: 1 }}>
            <Typography variant="h2">Fila de intake</Typography>
            {initiatives.length ? (
              initiatives.map((initiative) => (
                <Box
                  key={initiative.id}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    p: 2,
                  }}
                >
                  <Flex gap={1} wrap align="center">
                    <Chip size="small" color="warning" label="triagem" />
                    <Typography sx={{ fontWeight: 700 }}>{initiative.bet}</Typography>
                  </Flex>
                  <Typography color="text.secondary">{initiative.problem}</Typography>
                  <Typography variant="body2">{initiative.question}</Typography>
                </Box>
              ))
            ) : (
              <Typography color="text.secondary">
                Nenhuma iniciativa registrada neste workspace.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </AppShell>
  );
}
