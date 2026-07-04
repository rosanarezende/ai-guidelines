import { AppBar, Box, Button, LinearProgress, Toolbar, Tooltip, Typography } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import RefreshIcon from "@mui/icons-material/Refresh";
import Link from "next/link";
import type { ConsoleView } from "./consoleNavigation";

export function ConsoleHeader({
  selected,
  busy,
  onReload,
}: {
  selected: ConsoleView;
  busy: boolean;
  onReload: () => void;
}) {
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: "1px solid", borderColor: "divider" }}
    >
      <Toolbar sx={{ gap: 2, alignItems: "center" }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h1" component="div">
            acme governance · console técnico
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Área avançada (grafo, comandos, resolver, event-log) · audiencia: {selected.audience}
          </Typography>
        </Box>
        <Button component={Link} href="/" size="small" color="inherit" startIcon={<HomeIcon />}>
          Home
        </Button>
        <Button component={Link} href="/settings" size="small" color="inherit">
          Configurações
        </Button>
        <Tooltip title="Recarrega a projecao derivada do file-first">
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              disabled={busy}
              onClick={onReload}
            >
              Recarregar
            </Button>
          </span>
        </Tooltip>
      </Toolbar>
      {busy ? <LinearProgress /> : null}
    </AppBar>
  );
}
