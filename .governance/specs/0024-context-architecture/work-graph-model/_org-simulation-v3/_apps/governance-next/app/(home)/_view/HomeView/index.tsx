"use client";

// HomeView.tsx — Home de Adoção/Governança: a primeira tela, orientada a tarefa humana.
// Tudo que aparece aqui deriva do snapshot; o que ainda não tem mecanismo diz isso na copy.
import { Box, Button, Paper, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { GovernanceSnapshot } from "@/lib/types";
import { SectionCard } from "@/app/_ui/shared";
import {
  AttentionList,
  ConsoleFooter,
  NextStepCard,
  SetupChecklist,
  TrustLegend,
} from "@/app/_ui/adoption";
import { deriveAdoption, profileChipLabel } from "@/app/_domain/adoption/model";
import {
  readOnboardingStatus,
  type OnboardingStatus,
} from "@/app/_domain/adoption/onboardingStorage";
import AppShell from "@/app/_ui/shell/AppShell";
import { AssistantPrompt } from "./AssistantPrompt";
import { HomeHeader } from "./HomeHeader";
import { OnboardingPartialCard } from "./OnboardingPartialCard";
import { ShortcutGrid } from "./ShortcutGrid";
import { SnapshotBadges } from "./SnapshotBadges";
import { format } from "./format";
import copy from "./_locales/pt-br.json";

export default function HomeView({ snapshot }: { snapshot: GovernanceSnapshot }) {
  const router = useRouter();
  const adoption = useMemo(() => deriveAdoption(snapshot), [snapshot]);
  const [assistantDismissed, setAssistantDismissed] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | "checking" | null>(
    "checking"
  );

  const profile = snapshot.profileDeclaration.profile;
  const pendingCount = adoption.attention.length;

  useEffect(() => {
    const status = readOnboardingStatus();
    if (!status) {
      setOnboardingStatus(null);
      router.replace("/onboarding");
      return;
    }
    setOnboardingStatus(status);
  }, [router]);

  if (onboardingStatus === "checking" || onboardingStatus === null) {
    return (
      <AppShell chip={profileChipLabel(profile)}>
        <Paper variant="outlined" sx={{ p: 3, maxWidth: 560 }}>
          <Typography variant="h2">{copy.loading.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {copy.loading.body}
          </Typography>
        </Paper>
      </AppShell>
    );
  }

  return (
    <AppShell chip={profileChipLabel(profile)}>
      <Box sx={{ display: "grid", gap: 3 }}>
        <HomeHeader adoption={adoption} profile={profile} />

        {onboardingStatus === "partial" ? <OnboardingPartialCard /> : null}

        <ShortcutGrid profile={profile} pendingCount={pendingCount} />

        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            alignItems: "start",
            gridTemplateColumns: { xs: "1fr", md: "1.55fr 1fr" },
          }}
        >
          <Box id="pendencias" sx={{ display: "grid", gap: 2 }}>
            <SectionCard
              title={copy.attention.title}
              subtitle={copy.attention.subtitle}
              action={
                <Button component={Link} href="/console?view=audit" size="small">
                  {copy.attention.action}
                </Button>
              }
            >
              <Box sx={{ display: "grid", gap: 1.5 }}>
                <AttentionList
                  items={adoption.attention}
                  footer={format(copy.attention.footer, {
                    count: String(adoption.healthyCount),
                  })}
                />
                <TrustLegend />
              </Box>
            </SectionCard>
          </Box>

          <Box sx={{ display: "grid", gap: 2 }}>
            <NextStepCard nextStep={adoption.nextStep} />

            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <SetupChecklist
                checklist={adoption.checklist}
                doneCount={adoption.doneCount}
                totalCount={adoption.totalCount}
                setupPct={adoption.setupPct}
              />
            </Paper>

            {!assistantDismissed ? (
              <AssistantPrompt onDismiss={() => setAssistantDismissed(true)} />
            ) : null}

            <SnapshotBadges snapshot={snapshot} />
          </Box>
        </Box>

        <ConsoleFooter />
      </Box>
    </AppShell>
  );
}
