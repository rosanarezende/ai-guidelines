"use client";

// AppShell.tsx — casca das telas humanas (Home/Onboarding/Configurações).
// O console técnico mantém a própria casca em GovernanceApp.
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  CssBaseline,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import TerminalIcon from "@mui/icons-material/Terminal";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { t } from "@/lib/i18n";
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
}: {
  children: ReactNode;
  chip?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  maxWidth?: "md" | "lg" | "xl";
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return <ShellSkeleton />;

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
            <Button component={Link} href="/configuracoes" size="small" color="inherit">
              {t("app.nav.settings")}
            </Button>
            <Button
              component={Link}
              href="/console"
              size="small"
              color="inherit"
              startIcon={<TerminalIcon fontSize="small" />}
            >
              {t("app.nav.console")}
            </Button>
          </Toolbar>
        </AppBar>
        <Container maxWidth={maxWidth} sx={{ py: 4 }}>
          {children}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
