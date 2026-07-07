"use client";

// OnboardingView.tsx — orquestra a tela; estado e ações vivem em _state.
// Nada aqui persiste governança. A declaração real ainda depende de comandos governados.
import { Alert, Box, Button, Chip, Paper, Typography } from "@mui/material";
import Link from "next/link";
import { useState } from "react";
import type { GovernanceSnapshot } from "@demo/contracts";
import { decideWorkspaceRole } from "@/app/_domain/adoption/shellClient";
import { profileChipLabel } from "@/app/_domain/adoption/model";
import AppShell from "@/app/_ui/shell/AppShell";
import { Flex } from "@/app/_ui/shared";
import {
  OnboardingProvider,
  useOnboarding,
  type OnboardingOrg,
} from "../../_state/OnboardingContext";
import { WelcomeStep } from "../../_steps/WelcomeStep";
import { OnboardingActions } from "./OnboardingActions";
import { OnboardingStepper } from "./OnboardingStepper";
import { OnboardingStepContent } from "./OnboardingStepContent";
import copy from "./_locales/pt-br.json";

export default function OnboardingView({
  snapshot,
  org,
}: {
  snapshot: GovernanceSnapshot | null;
  org: OnboardingOrg;
}) {
  return (
    <OnboardingProvider snapshot={snapshot} org={org}>
      <OnboardingScreen />
    </OnboardingProvider>
  );
}

function OnboardingScreen() {
  const { snapshot, org, step } = useOnboarding();
  const chip =
    snapshot && org.isDemo
      ? `${profileChipLabel(snapshot.profileDeclaration.profile)} · demo`
      : org.profileSaved
        ? `${profileChipLabel(org.initialProfile)} · ${org.workspaceName}`
        : org.workspaceName;
  return (
    <AppShell
      subtitle={copy.shell.subtitle}
      chip={chip}
      cacheScope={{ accountId: org.principalId, workspaceId: org.workspaceId, session: "local" }}
      headerAction={
        <Button component={Link} href="/" size="small" color="inherit">
          {copy.shell.saveForLater}
        </Button>
      }
    >
      {org.entryContext.kind === "member-join" ? (
        <MemberJoinOnboarding />
      ) : step === 0 ? (
        <WelcomeStep />
      ) : (
        <OnboardingFlow />
      )}
    </AppShell>
  );
}

function MemberJoinOnboarding() {
  const { org } = useOnboarding();
  const [status, setStatus] = useState<"pending" | "accepted" | "declined">("pending");
  const [error, setError] = useState<string | null>(null);

  async function decide(action: "accept" | "reject") {
    const first = org.entryContext.proposedRoles[0];
    if (!first) return;
    const result = await decideWorkspaceRole(first.id, { action });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStatus(action === "accept" ? "accepted" : "declined");
  }

  return (
    <Box
      data-testid="onboarding-track-member-join"
      sx={{ maxWidth: 760, mx: "auto", display: "grid", gap: 2.5 }}
    >
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary" }}>
          Entrada por convite
        </Typography>
        <Typography variant="h1">Você está entrando como participante</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Esta tela só mostra o que depende de você: revisar o convite e aceitar ou recusar os
          papéis propostos. Diagnóstico, host e fontes ficam com quem administra o workspace.
        </Typography>
      </Box>
      <Alert data-testid="member-join-invite-summary" severity="info">
        Workspace: {org.workspaceName}. Login identifica você, mas autoridade só nasce depois do
        aceite de papel governado.
      </Alert>
      <Paper variant="outlined" sx={{ p: 2, display: "grid", gap: 1.25 }}>
        <Typography variant="h2">Papéis propostos</Typography>
        <Box data-testid="member-join-proposed-roles" sx={{ display: "grid", gap: 1 }}>
          {org.entryContext.proposedRoles.map((role) => (
            <Flex key={role.id} gap={1} align="center" wrap>
              <Chip size="small" color="warning" label="proposed" />
              <Typography>{role.roleId}</Typography>
            </Flex>
          ))}
        </Box>
        <Flex gap={1} wrap>
          <Button
            data-testid="member-join-accept-role"
            variant="contained"
            disabled={status !== "pending"}
            onClick={() => void decide("accept")}
          >
            Aceitar papel
          </Button>
          <Button
            data-testid="member-join-decline-role"
            variant="outlined"
            color="warning"
            disabled={status !== "pending"}
            onClick={() => void decide("reject")}
          >
            Recusar
          </Button>
        </Flex>
        <Chip
          data-testid="member-join-role-status"
          size="small"
          color={status === "accepted" ? "success" : status === "declined" ? "default" : "warning"}
          label={`status: ${status}`}
          sx={{ justifySelf: "start" }}
        />
        {error ? <Alert severity="error">{error}</Alert> : null}
      </Paper>
    </Box>
  );
}

function OnboardingFlow() {
  return (
    <Box
      data-testid="onboarding-track-workspace-setup"
      sx={{
        display: "grid",
        gap: 3.5,
        alignItems: "start",
        gridTemplateColumns: { xs: "1fr", md: "264px 1fr" },
      }}
    >
      <OnboardingStepper />
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, display: "grid", gap: 2.5 }}>
        <OnboardingStepContent />
        <OnboardingActions />
      </Paper>
    </Box>
  );
}
