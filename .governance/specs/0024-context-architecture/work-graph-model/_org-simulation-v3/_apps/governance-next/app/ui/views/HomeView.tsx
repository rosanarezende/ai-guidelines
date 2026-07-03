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
import { Flex, ResponsiveGrid, SectionCard } from "../components";
import {
  AttentionList,
  ConsoleFooter,
  NextStepCard,
  SetupChecklist,
  ShortcutCard,
  TrustLegend,
} from "../adoption/components";
import { deriveAdoption, profileChipLabel, profileOption } from "../adoption/model";
import { readOnboardingStatus, type OnboardingStatus } from "../adoption/onboardingStorage";
import AppShell from "../shell/AppShell";

const ROLE_NOTICES: Record<string, string | null> = {
  full: null,
  compact:
    "Perfil compact: acúmulos de papel são detectados e revisados em cadência — aparecem no placar, não somem.",
  trio: "Onde a mesma pessoa define e confirma, o app registra o selo Auto-declarado — visível para todos e para auditoria futura.",
  solo: "Você ocupa todos os papéis. O app não bloqueia — registra. Uma auditoria futura vê exatamente o que aconteceu.",
};

export default function HomeView({ snapshot }: { snapshot: GovernanceSnapshot }) {
  const router = useRouter();
  const adoption = useMemo(() => deriveAdoption(snapshot), [snapshot]);
  const [assistantDismissed, setAssistantDismissed] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | "checking" | null>(
    "checking"
  );

  const profile = snapshot.profileDeclaration.profile;
  const roleNotice = ROLE_NOTICES[profile] ?? null;
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
          <Typography variant="h2">Verificando configuração local</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Se este navegador ainda não concluiu o onboarding, você será levado para a configuração
            inicial.
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
            O que você quer governar hoje?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
            Ciclo {cycle} em andamento. {adoption.doneCount} de {adoption.totalCount} passos de
            adoção configurados — {pendingCount} item(ns) esperam por alguém.
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
                <Chip size="small" color="warning" label="Onboarding em andamento" />
                <Typography variant="h2" sx={{ mt: 1 }}>
                  Termine a configuração inicial
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
                  Você já começou neste navegador. Enquanto não concluir, a Home continua útil, mas
                  perfil, papéis, fontes de trabalho e assistente ainda podem estar só parcialmente
                  configurados.
                </Typography>
              </Box>
              <Flex gap={1} wrap>
                <Button component={Link} href="/onboarding" variant="contained">
                  Continuar onboarding
                </Button>
                <Button component={Link} href="/configuracoes" variant="outlined">
                  Abrir configurações
                </Button>
              </Flex>
            </Flex>
          </Paper>
        ) : null}

        <ResponsiveGrid min={232} gap={1.75}>
          <ShortcutCard
            href="/configuracoes"
            icon={<CorporateFareIcon fontSize="small" />}
            title="Configurar organização"
            sub={`Papéis, aprovações e perfil da sua org (${profileOption(profile).label})`}
          />
          <ShortcutCard
            href="/onboarding"
            icon={<LinkIcon fontSize="small" />}
            title="Conectar fontes de trabalho"
            sub="Git, pastas, serviços ou módulos — de onde vem o trabalho"
          />
          <ShortcutCard
            href="/console?view=company"
            icon={<FlagIcon fontSize="small" />}
            title="Planejar ciclo"
            sub="Objetivos e metas do período"
          />
          <ShortcutCard
            href="/console?view=commands"
            icon={<LightbulbIcon fontSize="small" />}
            title="Registrar iniciativa"
            sub="Uma aposta ou ideia que vira trabalho"
          />
          <ShortcutCard
            href="/console?view=owner"
            icon={<MonitorHeartIcon fontSize="small" />}
            title="Acompanhar resultados"
            sub="O que as metas dizem hoje"
          />
          <ShortcutCard
            href="#pendencias"
            icon={<PendingActionsIcon fontSize="small" />}
            title="Resolver pendências"
            sub="Itens que esperam por alguém"
            badge={pendingCount || undefined}
          />
          <ShortcutCard
            href="/console?view=audit"
            icon={<HistoryIcon fontSize="small" />}
            title="Auditar decisões"
            sub="Quem decidiu o quê, e quando"
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
              title="Precisa de atenção"
              subtitle="Derivado do resolver e do estado atual — nada aqui é preenchido à mão."
              action={
                <Button component={Link} href="/console?view=audit" size="small">
                  Ver todas as pendências
                </Button>
              }
            >
              <Box sx={{ display: "grid", gap: 1.5 }}>
                <AttentionList
                  items={adoption.attention}
                  footer={`Outros ${adoption.healthyCount} itens estão válidos neste snapshot e não precisam de você.`}
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
                    Assistente{" "}
                    <Typography component="span" variant="body2" color="text.secondary">
                      (opcional)
                    </Typography>
                  </Typography>
                </Flex>
                <Typography variant="body2" color="text.secondary">
                  Explica termos e sugere próximos passos em linguagem simples. Rode local com
                  Ollama — nada sai da sua máquina — ou conecte um provedor de nuvem com aprovação e
                  egress explícitos conforme o perfil.
                </Typography>
                <Flex gap={1}>
                  <Button
                    component={Link}
                    href="/configuracoes#assistente"
                    size="small"
                    variant="outlined"
                  >
                    Configurar
                  </Button>
                  <Button size="small" color="inherit" onClick={() => setAssistantDismissed(true)}>
                    Agora não
                  </Button>
                </Flex>
              </Paper>
            ) : null}

            <Flex wrap gap={1}>
              <Chip size="small" variant="outlined" label={`revision ${snapshot.revision}`} />
              <Chip
                size="small"
                variant="outlined"
                label={`${snapshot.counts.errors} erro(s) · ${snapshot.counts.warnings} aviso(s)`}
              />
            </Flex>
          </Box>
        </Box>

        <ConsoleFooter />
      </Box>
    </AppShell>
  );
}
