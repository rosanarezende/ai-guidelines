"use client";

// AppShell.tsx — casca das telas humanas (Home/Onboarding/Configurações).
import {
  Alert,
  AppBar,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  CssBaseline,
  Drawer,
  FormControlLabel,
  IconButton,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { logoutLocal } from "@/app/_domain/adoption/shellClient";
import { authClient } from "@/app/_domain/auth/auth-client";
import { applySensitiveQueryCacheEvent } from "@/app/_domain/cache/sensitive-query-cache";
import { t } from "@/lib/i18n";
import GlobalNavigation from "./GlobalNavigation";
import { theme } from "../theme";

function ShellSkeleton() {
  return (
    <div className="app-shell-loading">
      <div>{t("home.loading.title")}</div>
    </div>
  );
}

export default function AppShell({
  children,
  chip,
  subtitle = t("app.brand.product"),
  headerAction,
  maxWidth = "lg",
  navigationMode = "workspace",
  hasGovernanceHost = false,
  cacheScope,
}: {
  children: ReactNode;
  chip?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  maxWidth?: "md" | "lg" | "xl";
  navigationMode?: "public" | "workspace";
  hasGovernanceHost?: boolean;
  cacheScope?: { accountId: string; workspaceId?: string; session: "local" | "portal" | "anonymous" };
}) {
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cupOpen, setCupOpen] = useState(false);
  const [cacheEvent, setCacheEvent] = useState<"workspace-switch" | "logout" | null>(null);
  const queryClient = useQueryClient();
  const pathname = usePathname();
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return <ShellSkeleton />;

  async function logout() {
    setCacheEvent("logout");
    await authClient.signOut().catch(() => null);
    await logoutLocal();
    await applySensitiveQueryCacheEvent(queryClient, { type: "logout" });
    window.setTimeout(() => {
      window.location.href = "/login";
    }, 1200);
  }

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
          <Toolbar sx={{ gap: 1.5, alignItems: "center" }}>
            {navigationMode === "workspace" ? (
              <IconButton
                aria-label={t("app.nav.openMenu")}
                onClick={() => setDrawerOpen(true)}
                sx={{ display: { xs: "inline-flex", md: "none" } }}
              >
                <MenuIcon />
              </IconButton>
            ) : null}
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              a
            </Box>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, minWidth: 0 }}>
              <Typography
                component={Link}
                href="/"
                sx={{ fontWeight: 700, color: "text.primary", textDecoration: "none" }}
              >
                {t("app.brand.name")}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {subtitle}
              </Typography>
            </Box>
            {chip ? <Chip size="small" variant="outlined" label={chip} /> : null}
            <Box sx={{ flex: 1 }} />
            {headerAction}
            <Button
              size="small"
              color="inherit"
              startIcon={<SearchIcon fontSize="small" />}
              disabled
              sx={{ display: { xs: "none", lg: "inline-flex" } }}
            >
              {t("app.nav.search")}
            </Button>
            <Button
              size="small"
              color="inherit"
              startIcon={<ChatOutlinedIcon fontSize="small" />}
              onClick={() => setCupOpen(true)}
            >
              <span data-testid="cup-launcher">
                <span data-testid="cup-open-button">{t("app.nav.cup")}</span>
              </span>
            </Button>
            <Button component={Link} href="/organizations" size="small" color="inherit">
              {t("app.nav.organizations")}
            </Button>
            <Button
              data-testid="logout-button"
              size="small"
              color="inherit"
              startIcon={<LogoutIcon fontSize="small" />}
              onClick={() => void logout()}
            >
              {t("app.nav.logout")}
            </Button>
          </Toolbar>
        </AppBar>
        <Box sx={{ display: "flex" }}>
          {navigationMode === "workspace" ? (
            <>
              <Box
                component="aside"
                sx={{
                  display: { xs: "none", md: "block" },
                  width: 280,
                  borderRight: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  minHeight: "calc(100vh - 65px)",
                  position: "sticky",
                  top: 65,
                  alignSelf: "flex-start",
                }}
              >
                <GlobalNavigation hasGovernanceHost={hasGovernanceHost} />
              </Box>
              <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <GlobalNavigation hasGovernanceHost={hasGovernanceHost} />
              </Drawer>
            </>
          ) : null}
          <Container maxWidth={maxWidth} sx={{ py: 4 }}>
            {cacheScope ? (
              <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                <Chip
                  data-testid="query-cache-scope"
                  size="small"
                  variant="outlined"
                  label={`session:${cacheScope.session} · account:${cacheScope.accountId} · workspace:${cacheScope.workspaceId ?? "none"}`}
                />
                {cacheEvent === "logout" ? (
                  <Chip
                    data-testid="tanstack-cache-cleared"
                    size="small"
                    color="success"
                    label="TanStack cache sensível limpo"
                  />
                ) : null}
              </Box>
            ) : null}
            {children}
          </Container>
        </Box>
        <Drawer anchor="right" open={cupOpen} onClose={() => setCupOpen(false)}>
          <CupPanel pathname={pathname} />
        </Drawer>
      </Box>
    </ThemeProvider>
  );
}

function CupPanel({ pathname }: { pathname: string }) {
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
    <Box data-testid="cup-panel" sx={{ width: { xs: 320, sm: 420 }, p: 3, display: "grid", gap: 2 }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          {t("app.cup.title")}
        </Typography>
        <Typography color="text.secondary">{t("app.cup.body")}</Typography>
      </Box>
      <Chip data-testid="cup-specialist" size="small" label={specialist} sx={{ justifySelf: "start" }} />
      <Chip
        data-testid="cup-provider-status"
        size="small"
        label="C0 · sem provider externo · determinístico local"
        sx={{ justifySelf: "start" }}
      />
      <Alert data-testid="cup-context-boundary" severity="info">
        Contexto entregue por rota e papel. Conteúdo restrito é redacted por policy antes de qualquer provider.
      </Alert>
      {(pathname.startsWith("/integrations") || pathname.startsWith("/settings")) ? (
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
                dry-run preparado com baseRevision atual. Nada será executado sem confirmação humana.
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
