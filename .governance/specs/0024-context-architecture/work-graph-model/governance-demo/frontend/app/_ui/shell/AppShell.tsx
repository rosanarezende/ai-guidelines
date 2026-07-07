"use client";

// AppShell.tsx — casca das telas humanas (Home/Onboarding/Configurações).
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  CssBaseline,
  Drawer,
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
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { logoutLocal } from "@/app/_domain/adoption/shellClient";
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
}: {
  children: ReactNode;
  chip?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  maxWidth?: "md" | "lg" | "xl";
  navigationMode?: "public" | "workspace";
  hasGovernanceHost?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cupOpen, setCupOpen] = useState(false);
  const queryClient = useQueryClient();
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return <ShellSkeleton />;

  async function logout() {
    await logoutLocal();
    await applySensitiveQueryCacheEvent(queryClient, { type: "logout" });
    window.location.href = "/signup";
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
              data-testid="cup-launcher"
              size="small"
              color="inherit"
              startIcon={<ChatOutlinedIcon fontSize="small" />}
              onClick={() => setCupOpen(true)}
            >
              {t("app.nav.cup")}
            </Button>
            <Button component={Link} href="/organizations" size="small" color="inherit">
              {t("app.nav.organizations")}
            </Button>
            <Button
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
            {children}
          </Container>
        </Box>
        <Drawer anchor="right" open={cupOpen} onClose={() => setCupOpen(false)}>
          <Box data-testid="cup-panel" sx={{ width: { xs: 320, sm: 380 }, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t("app.cup.title")}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {t("app.cup.body")}
            </Typography>
            <Chip size="small" label={t("app.cup.state")} />
          </Box>
        </Drawer>
      </Box>
    </ThemeProvider>
  );
}
