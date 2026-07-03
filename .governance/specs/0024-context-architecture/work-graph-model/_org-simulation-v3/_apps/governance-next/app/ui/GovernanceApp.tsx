"use client";

import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  CssBaseline,
  LinearProgress,
  Paper,
  Tab,
  Tabs,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import HubIcon from "@mui/icons-material/Hub";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import TroubleshootIcon from "@mui/icons-material/Troubleshoot";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import type { GovernanceSnapshot } from "@/lib/types";
import { Flex, IssueList, ResponsiveGrid, StatCard } from "./components";
import { theme } from "./theme";
import CommandWorkspace from "./commands/CommandWorkspace";
import AuditConsole from "./views/AuditConsole";
import CompanyDashboard from "./views/CompanyDashboard";
import ExecutionWorkspace from "./views/ExecutionWorkspace";
import IntegrationSettings from "./views/IntegrationSettings";
import OpsWorkspace from "./views/OpsWorkspace";
import OwnerWorkspace from "./views/OwnerWorkspace";

type ViewId = "company" | "owner" | "execution" | "ops" | "settings" | "audit" | "commands";

const views: Array<{
  id: ViewId;
  label: string;
  audience: string;
  icon: ReactElement;
}> = [
  {
    id: "company",
    label: "Planejamento",
    audience: "stakeholder",
    icon: <AssessmentIcon fontSize="small" />,
  },
  {
    id: "owner",
    label: "Intents",
    audience: "owner",
    icon: <FactCheckIcon fontSize="small" />,
  },
  {
    id: "execution",
    label: "Execucao",
    audience: "tech lead",
    icon: <HubIcon fontSize="small" />,
  },
  {
    id: "ops",
    label: "Operacao",
    audience: "SRE/operacao",
    icon: <TroubleshootIcon fontSize="small" />,
  },
  {
    id: "settings",
    label: "Configuracoes",
    audience: "admin de adocao",
    icon: <SettingsSuggestIcon fontSize="small" />,
  },
  {
    id: "audit",
    label: "Auditoria",
    audience: "auditor",
    icon: <AccountTreeIcon fontSize="small" />,
  },
  {
    id: "commands",
    label: "Comandos",
    audience: "admin",
    icon: <AdminPanelSettingsIcon fontSize="small" />,
  },
];

function firstPeriod(snapshot: GovernanceSnapshot): string {
  return [...new Set(snapshot.targets.map((target) => target.period))].sort()[0] || "todos";
}

function activeView(viewId: ViewId) {
  return views.find((view) => view.id === viewId) || views[0];
}

function AppSkeleton() {
  return (
    <div className="app-shell-loading">
      <div>Carregando governance app...</div>
    </div>
  );
}

export default function GovernanceApp({
  initialSnapshot,
}: {
  initialSnapshot: GovernanceSnapshot;
}) {
  const [mounted, setMounted] = useState(false);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [view, setView] = useState<ViewId>("company");
  const [period, setPeriod] = useState(() => firstPeriod(initialSnapshot));
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selected = useMemo(() => activeView(view), [view]);
  const blockingErrors = snapshot.issues.filter((issue) => issue.level === "error");
  const warnings = snapshot.issues.filter((issue) => issue.level === "warn");

  async function reload() {
    setBusy(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/snapshot", { cache: "no-store" });
      if (!response.ok) throw new Error(`snapshot HTTP ${response.status}`);
      const nextSnapshot = (await response.json()) as GovernanceSnapshot;
      setSnapshot(nextSnapshot);
      if (period !== "todos" && !nextSnapshot.targets.some((target) => target.period === period)) {
        setPeriod(firstPeriod(nextSnapshot));
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  if (!mounted) return <AppSkeleton />;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Toolbar sx={{ gap: 2, alignItems: "center" }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="h1" component="div">
                acme governance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                App operacional v2 · TypeScript strict · audiencia: {selected.audience}
              </Typography>
            </Box>
            <Tooltip title="Recarrega a projecao derivada do file-first">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  disabled={busy}
                  onClick={reload}
                >
                  Recarregar
                </Button>
              </span>
            </Tooltip>
          </Toolbar>
          {busy ? <LinearProgress /> : null}
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 2.5 }}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 1 }}>
              <Tabs
                value={view}
                onChange={(_, nextView: ViewId) => setView(nextView)}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="perfis de navegacao da governanca"
              >
                {views.map((item) => (
                  <Tab
                    key={item.id}
                    value={item.id}
                    icon={item.icon}
                    iconPosition="start"
                    label={item.label}
                  />
                ))}
              </Tabs>
            </Paper>

            <ResponsiveGrid min={220}>
              <StatCard label="Revision" value={snapshot.revision} />
              <StatCard
                label="Graph"
                value={`${snapshot.counts.graphNodes}/${snapshot.counts.graphEdges}`}
                detail="nos / arestas"
              />
              <StatCard label="Intents" value={snapshot.counts.intents} />
              <StatCard
                label="Resolver"
                value={`${blockingErrors.length}/${warnings.length}`}
                detail="erros / avisos"
                tone={blockingErrors.length ? "error" : warnings.length ? "warning" : "success"}
              />
            </ResponsiveGrid>

            {loadError ? <Alert severity="error">Falha ao recarregar: {loadError}</Alert> : null}
            {blockingErrors.length ? (
              <Alert severity="error">
                Existem erros bloqueantes. Esta UI nao esconde problemas de resolver.
              </Alert>
            ) : warnings.length ? (
              <Alert severity="warning">
                Avisos ativos: {warnings.length}. Eles ficam visiveis e nao viram verde implicito.
              </Alert>
            ) : (
              <Alert severity="success">Resolver sem erros e sem avisos neste snapshot.</Alert>
            )}

            <Box sx={{ display: view === "company" ? "block" : "none" }}>
              <CompanyDashboard snapshot={snapshot} period={period} onPeriodChange={setPeriod} />
            </Box>
            <Box sx={{ display: view === "owner" ? "block" : "none" }}>
              <OwnerWorkspace snapshot={snapshot} />
            </Box>
            <Box sx={{ display: view === "execution" ? "block" : "none" }}>
              <ExecutionWorkspace snapshot={snapshot} />
            </Box>
            <Box sx={{ display: view === "ops" ? "block" : "none" }}>
              <OpsWorkspace snapshot={snapshot} />
            </Box>
            <Box sx={{ display: view === "settings" ? "block" : "none" }}>
              <IntegrationSettings snapshot={snapshot} />
            </Box>
            <Box sx={{ display: view === "audit" ? "block" : "none" }}>
              <AuditConsole snapshot={snapshot} />
            </Box>
            <Box sx={{ display: view === "commands" ? "block" : "none" }}>
              <CommandWorkspace snapshot={snapshot} onReload={reload} />
            </Box>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Flex direction="column" gap={1}>
                <Flex wrap gap={1}>
                  <Chip size="small" label={`profile ${snapshot.profileDeclaration.profile}`} />
                  <Chip size="small" label={`scope ${snapshot.profileDeclaration.scope}`} />
                  <Chip
                    size="small"
                    label={`approved-by ${snapshot.profileDeclaration["approved-by"] || "nao resolvido"}`}
                  />
                </Flex>
                <IssueList issues={snapshot.issues} limit={3} />
              </Flex>
            </Paper>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
