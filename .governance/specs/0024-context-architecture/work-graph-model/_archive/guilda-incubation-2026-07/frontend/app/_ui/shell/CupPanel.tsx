"use client";

import { Alert, Box, Button, Checkbox, Chip, FormControlLabel, Typography } from "@mui/material";
import { useState } from "react";
import { t } from "@/lib/i18n";

export function CupPanel({ pathname }: { pathname: string }) {
  const [draftOpen, setDraftOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [egressBlocked, setEgressBlocked] = useState(false);
  const specialist = pathname.startsWith("/onboarding")
    ? "especialista em setup/onboarding"
    : pathname.startsWith("/sources")
      ? "especialista em fontes de trabalho"
      : pathname.startsWith("/integrations")
        ? "especialista em integrações e egress"
        : pathname.startsWith("/settings")
          ? "especialista em políticas e papéis"
          : pathname.startsWith("/results")
            ? "especialista em resultados"
            : pathname.startsWith("/map")
              ? "especialista em mapa de governança"
              : "especialista contextual";

  return (
    <Box
      data-testid="cup-panel"
      sx={{ width: { xs: 320, sm: 420 }, p: 3, display: "grid", gap: 2 }}
    >
      <Box>
        <Typography variant="h6" gutterBottom>
          {t("app.cup.title")}
        </Typography>
        <Typography color="text.secondary">{t("app.cup.body")}</Typography>
      </Box>
      <Chip
        data-testid="cup-specialist"
        size="small"
        label={specialist}
        sx={{ justifySelf: "start" }}
      />
      <Chip
        data-testid="cup-provider-status"
        size="small"
        label="C0 · sem provider externo · determinístico local"
        sx={{ justifySelf: "start" }}
      />
      <Alert data-testid="cup-context-boundary" severity="info">
        Contexto entregue por rota e papel. Conteúdo restrito é redacted por policy antes de
        qualquer provider.
      </Alert>
      {pathname.startsWith("/integrations") || pathname.startsWith("/settings") ? (
        <Alert severity="warning">
          <Typography data-testid="cup-policy-reference" variant="body2">
            POLICY-HANDBOOK · egress: integração cloud exige aprovação de security e registro de
            dados acessados.
          </Typography>
          <Typography data-testid="cup-next-step" variant="caption">
            Próximo passo: pedir aprovação do security-owner antes de ativar provider externo.
          </Typography>
        </Alert>
      ) : null}
      {pathname.startsWith("/sources") ? (
        <Box sx={{ display: "grid", gap: 1 }}>
          <Button
            data-testid="cup-draft-add-source"
            variant="outlined"
            onClick={() => setDraftOpen(true)}
          >
            Preparar fonte como dry-run
          </Button>
          {draftOpen ? (
            <>
              <Alert data-testid="cup-draft-command" severity="info">
                dry-run preparado com baseRevision atual. Nada será executado sem confirmação
                humana.
              </Alert>
              <FormControlLabel
                control={
                  <Checkbox
                    data-testid="cup-human-confirmation"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                  />
                }
                label="Confirmo que quero executar depois de revisar"
              />
              <Button data-testid="cup-execute-command" disabled={!confirmed} variant="contained">
                Executar comando
              </Button>
            </>
          ) : null}
        </Box>
      ) : null}
      <Button
        data-testid="cup-provider-cloud"
        size="small"
        variant="outlined"
        onClick={() => setEgressBlocked(true)}
      >
        Testar provider cloud
      </Button>
      {egressBlocked ? (
        <Alert data-testid="cup-egress-blocked" severity="warning">
          Egress bloqueado: provider cloud precisa de aprovação explícita.
        </Alert>
      ) : null}
    </Box>
  );
}
