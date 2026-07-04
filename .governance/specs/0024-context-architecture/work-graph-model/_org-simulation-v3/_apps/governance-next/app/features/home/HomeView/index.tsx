"use client";

// HomeView.tsx — Home de Adoção/Governança: a primeira tela, orientada a tarefa humana.
// Tudo que aparece aqui deriva do snapshot; o que ainda não tem mecanismo diz isso na copy.
import { Alert, Box, Button, Chip, Paper, Typography } from "@mui/material";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import FlagIcon from "@mui/icons-material/Flag";
import ForumIcon from "@mui/icons-material/Forum";
import HistoryIcon from "@mui/icons-material/History";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import LinkIcon from "@mui/icons-material/Link";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { GovernanceSnapshot } from "@/lib/types";
import { Flex, ResponsiveGrid, SectionCard } from "@/app/ui/shared/components";
import {
  AttentionList,
  ConsoleFooter,
  NextStepCard,
  SetupChecklist,
  ShortcutCard,
  TrustLegend,
} from "@/app/features/adoption/components";
import { deriveAdoption, profileChipLabel, profileOption } from "@/app/features/adoption/model";
import {
  readOnboardingStatus,
  type OnboardingStatus,
} from "@/app/features/adoption/onboardingStorage";
import AppShell from "@/app/ui/shell/AppShell";
import copy from "./locales/pt-br.json";

export default function HomeView({ snapshot }: { snapshot: GovernanceSnapshot }) {
  const router = useRouter();
  const adoption = useMemo(() => deriveAdoption(snapshot), [snapshot]);
  const [assistantDismissed, setAssistantDismissed] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | "checking" | null>(
    "checking"
  );

  const profile = snapshot.profileDeclaration.profile;
  const roleNotice = copy.roleNotices[profile as keyof typeof copy.roleNotices] ?? null;
  const cycle = adoption.periods[0] || "sem período";
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
        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography sx={{ fontSize: 29, fontWeight: 800, letterSpacing: "-0.5px" }}>
            {copy.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
            {format(copy.cycleSummary, {
              cycle,
              done: String(adoption.doneCount),
              total: String(adoption.totalCount),
              pending: String(pendingCount),
            })}
          </Typography>
        </Box>

        {roleNotice ? <Alert severity="info">{roleNotice}</Alert> : null}

        {onboardingStatus === "partial" ? (
          <Paper
            variant="outlined"
            sx={{ p: 2.25, display: "grid", gap: 1.25, borderColor: "#d9e8dd", bgcolor: "#f8fbf8" }}
          >
            <Flex justify="space-between" align="center" gap={2} wrap>
              <Box>
                <Chip size="small" color="warning" label={copy.onboarding.partialLabel} />
                <Typography variant="h2" sx={{ mt: 1 }}>
                  {copy.onboarding.partialTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
                  {copy.onboarding.partialBody}
                </Typography>
              </Box>
              <Flex gap={1} wrap>
                <Button component={Link} href="/onboarding" variant="contained">
                  {copy.onboarding.continue}
                </Button>
                <Button component={Link} href="/configuracoes" variant="outlined">
                  {copy.onboarding.settings}
                </Button>
              </Flex>
            </Flex>
          </Paper>
        ) : null}

        <ResponsiveGrid min={232} gap={1.75}>
          <ShortcutCard
            href="/configuracoes"
            icon={<CorporateFareIcon fontSize="small" />}
            title={copy.shortcuts.configureOrg.title}
            sub={format(copy.shortcuts.configureOrg.sub, { profile: profileOption(profile).label })}
          />
          <ShortcutCard
            href="/onboarding"
            icon={<LinkIcon fontSize="small" />}
            title={copy.shortcuts.connectSources.title}
            sub={copy.shortcuts.connectSources.sub}
          />
          <ShortcutCard
            href="/console?view=company"
            icon={<FlagIcon fontSize="small" />}
            title={copy.shortcuts.planCycle.title}
            sub={copy.shortcuts.planCycle.sub}
          />
          <ShortcutCard
            href="/console?view=commands"
            icon={<LightbulbIcon fontSize="small" />}
            title={copy.shortcuts.registerIntent.title}
            sub={copy.shortcuts.registerIntent.sub}
          />
          <ShortcutCard
            href="/console?view=owner"
            icon={<MonitorHeartIcon fontSize="small" />}
            title={copy.shortcuts.results.title}
            sub={copy.shortcuts.results.sub}
          />
          <ShortcutCard
            href="#pendencias"
            icon={<PendingActionsIcon fontSize="small" />}
            title={copy.shortcuts.pending.title}
            sub={copy.shortcuts.pending.sub}
            badge={pendingCount || undefined}
          />
          <ShortcutCard
            href="/console?view=audit"
            icon={<HistoryIcon fontSize="small" />}
            title={copy.shortcuts.audit.title}
            sub={copy.shortcuts.audit.sub}
          />
        </ResponsiveGrid>

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
              <Paper
                variant="outlined"
                sx={{ p: 2.5, borderStyle: "dashed", display: "grid", gap: 1 }}
              >
                <Flex align="center" gap={1}>
                  <ForumIcon fontSize="small" color="action" />
                  <Typography variant="h3">
                    {copy.assistant.title}{" "}
                    <Typography component="span" variant="body2" color="text.secondary">
                      {copy.assistant.optional}
                    </Typography>
                  </Typography>
                </Flex>
                <Typography variant="body2" color="text.secondary">
                  {copy.assistant.body}
                </Typography>
                <Flex gap={1}>
                  <Button
                    component={Link}
                    href="/configuracoes#assistente"
                    size="small"
                    variant="outlined"
                  >
                    {copy.assistant.configure}
                  </Button>
                  <Button size="small" color="inherit" onClick={() => setAssistantDismissed(true)}>
                    {copy.assistant.dismiss}
                  </Button>
                </Flex>
              </Paper>
            ) : null}

            <Flex wrap gap={1}>
              <Chip
                size="small"
                variant="outlined"
                label={format(copy.snapshot.revision, { revision: snapshot.revision })}
              />
              <Chip
                size="small"
                variant="outlined"
                label={format(copy.snapshot.issues, {
                  errors: String(snapshot.counts.errors),
                  warnings: String(snapshot.counts.warnings),
                })}
              />
            </Flex>
          </Box>
        </Box>

        <ConsoleFooter />
      </Box>
    </AppShell>
  );
}

function format(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template
  );
}
