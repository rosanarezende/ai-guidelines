"use client";

// OnboardingView.tsx — orquestra a tela; estado e ações vivem em _state.
// Nada aqui persiste governança. A declaração real ainda depende de comandos governados.
import { Box, Button, Paper } from "@mui/material";
import Link from "next/link";
import type { GovernanceSnapshot } from "@/lib/types";
import { profileChipLabel } from "@/app/_domain/adoption/model";
import AppShell from "@/app/_ui/shell/AppShell";
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
  return (
    <AppShell
      subtitle={copy.shell.subtitle}
      chip={
        snapshot && org.isDemo
          ? `${profileChipLabel(snapshot.profileDeclaration.profile)} · demo`
          : org.workspaceName
      }
      headerAction={
        <Button component={Link} href="/" size="small" color="inherit">
          {copy.shell.saveForLater}
        </Button>
      }
    >
      {step === 0 ? <WelcomeStep /> : <OnboardingFlow />}
    </AppShell>
  );
}

function OnboardingFlow() {
  return (
    <Box
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
