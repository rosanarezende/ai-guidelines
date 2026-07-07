"use client";

import { Alert, Box, Button, Chip, Typography } from "@mui/material";
import { useState } from "react";
import { Flex } from "@/app/_ui/shared";
import AppShell from "@/app/_ui/shell/AppShell";

export default function TriagePlaceholderView({
  workspace,
  accountId,
}: {
  workspace: { id: string; name: string; demo: boolean; hasGovernanceHost: boolean };
  accountId: string;
}) {
  const [itemCreated, setItemCreated] = useState(false);
  const [matcherRan, setMatcherRan] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  async function confirmDecision() {
    setError("");
    const response = await fetch("/api/local/triage/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question: "Quais repos/superficies sao afetados pelo primeiro uso?",
        fate: "exploration",
        matcherScore: 0.72,
        unknowns: ["owner final", "fonte de métrica"],
      }),
    });
    const payload = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !payload.ok) {
      setError(payload.error || `HTTP ${response.status}`);
      return;
    }
    setConfirmed(true);
  }

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
          Transforme uma dúvida em item triável. O matcher sugere caminho, mas a decisão só vale
          depois de confirmação humana registrada.
        </Typography>
        <Alert data-testid="contextual-integration-triage" severity="info">
          Integrações sugeridas: matcher local, catálogo de capacidades e CODEOWNERS para reduzir
          roteamento manual.
        </Alert>
        <Box sx={{ display: "grid", gap: 1.5, maxWidth: 760 }}>
          <Button
            data-testid="triage-item-create-from-question"
            variant="contained"
            onClick={() => setItemCreated(true)}
            sx={{ justifySelf: "start" }}
          >
            Criar item a partir de dúvida
          </Button>

          {itemCreated ? (
            <Box sx={{ display: "grid", gap: 1.25 }}>
              <Alert data-testid="triage-item-fate-options" severity="info">
                Fates possíveis: exploration, direct-answer ou missing-info. O padrão sugerido para
                esta dúvida é exploration porque ainda há unknowns.
              </Alert>
              <Flex gap={1} wrap>
                <Button
                  data-testid="matcher-run"
                  variant="outlined"
                  onClick={() => setMatcherRan(true)}
                >
                  Rodar matcher
                </Button>
                <Button
                  data-testid="matcher-human-confirm"
                  disabled={!matcherRan || confirmed}
                  variant="contained"
                  onClick={() => void confirmDecision()}
                >
                  Confirmar decisão humana
                </Button>
              </Flex>
            </Box>
          ) : null}

          {matcherRan ? (
            <Alert data-testid="matcher-suggestion-list" severity="warning">
              Sugestão advisory: score 0.72 para exploration. Unknowns: owner final, fonte de
              métrica. O matcher não decide sozinho.
            </Alert>
          ) : null}

          {confirmed ? (
            <Alert severity="success">
              Decisão confirmada. A auditoria registra matcher confirm com score e unknowns.
            </Alert>
          ) : null}
          {error ? <Alert severity="error">{error}</Alert> : null}
        </Box>
      </Box>
    </AppShell>
  );
}
