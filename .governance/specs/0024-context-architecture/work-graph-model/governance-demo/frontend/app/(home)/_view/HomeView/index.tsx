"use client";

// HomeView.tsx — Home da organização DEMO acme-*: deriva tudo do snapshot
// governado da sim. O gate de fluxo (signup/organização/onboarding) roda no
// servidor, em app/(home)/page.tsx; aqui só se renderiza.
import { Box, Button, Chip, Paper } from "@mui/material";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { GovernanceSnapshot } from "@demo/contracts";
import { SectionCard } from "@/app/_ui/shared";
import {
  AttentionList,
  ConsoleFooter,
  NextStepCard,
  SetupChecklist,
  TrustLegend,
} from "@/app/_ui/adoption";
import { deriveAdoption, profileChipLabel } from "@/app/_domain/adoption/model";
import AppShell from "@/app/_ui/shell/AppShell";
import { AssistantPrompt } from "./AssistantPrompt";
import { HomeHeader } from "./HomeHeader";
import { OnboardingPartialCard } from "./OnboardingPartialCard";
import { ShortcutGrid } from "./ShortcutGrid";
import { SnapshotBadges } from "./SnapshotBadges";
import { format } from "./format";
import copy from "./_locales/pt-br.json";

export default function HomeView({
  snapshot,
  workspaceName,
  onboardingStatus,
}: {
  snapshot: GovernanceSnapshot;
  workspaceName: string;
  onboardingStatus: "partial" | "finished";
}) {
  const adoption = useMemo(() => deriveAdoption(snapshot), [snapshot]);
  const [assistantDismissed, setAssistantDismissed] = useState(false);

  const profile = snapshot.profileDeclaration.profile;
  const pendingCount = adoption.attention.length;

  return (
    <AppShell
      chip={profileChipLabel(profile)}
      headerAction={<Chip size="small" color="info" label={`${workspaceName} · demo`} />}
    >
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
