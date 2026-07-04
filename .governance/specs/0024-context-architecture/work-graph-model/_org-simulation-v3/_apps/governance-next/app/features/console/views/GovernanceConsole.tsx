"use client";

import {
  Box,
  Container,
  CssBaseline,
  ThemeProvider,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import type { GovernanceSnapshot } from "@/lib/types";
import { theme } from "@/app/ui/theme";
import CommandWorkspace from "../commands/CommandWorkspace";
import AuditConsole from "./AuditConsole";
import { ConsoleHealthAlerts } from "./ConsoleHealthAlerts";
import { ConsoleHeader } from "./ConsoleHeader";
import { ConsoleProfilePanel } from "./ConsoleProfilePanel";
import { ConsoleStats } from "./ConsoleStats";
import { ConsoleTabs } from "./ConsoleTabs";
import CompanyDashboard from "./CompanyDashboard";
import ExecutionWorkspace from "./ExecutionWorkspace";
import OpsWorkspace from "./OpsWorkspace";
import OwnerWorkspace from "./OwnerWorkspace";
import { activeView, consoleViews, type ViewId } from "./consoleNavigation";

function firstPeriod(snapshot: GovernanceSnapshot): string {
  return [...new Set(snapshot.targets.map((target) => target.period))].sort()[0] || "todos";
}

function AppSkeleton() {
  return (
    <div className="app-shell-loading">
      <div>Carregando governance app...</div>
    </div>
  );
}

export default function GovernanceConsole({
  initialSnapshot,
  initialView,
}: {
  initialSnapshot: GovernanceSnapshot;
  initialView?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [view, setView] = useState<ViewId>(() =>
    consoleViews.some((item) => item.id === initialView) ? (initialView as ViewId) : "company"
  );
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
        <ConsoleHeader selected={selected} busy={busy} onReload={reload} />

        <Container maxWidth="xl" sx={{ py: 2.5 }}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <ConsoleTabs view={view} onChange={setView} />
            <ConsoleStats snapshot={snapshot} blockingErrors={blockingErrors} warnings={warnings} />
            <ConsoleHealthAlerts
              loadError={loadError}
              blockingErrors={blockingErrors}
              warnings={warnings}
            />

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
            <Box sx={{ display: view === "audit" ? "block" : "none" }}>
              <AuditConsole snapshot={snapshot} />
            </Box>
            <Box sx={{ display: view === "commands" ? "block" : "none" }}>
              <CommandWorkspace snapshot={snapshot} onReload={reload} />
            </Box>

            <ConsoleProfilePanel snapshot={snapshot} />
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
