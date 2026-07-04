"use client";

// ConsoleUnavailable — organização sem host de governança não tem console:
// o app diz isso em vez de mostrar o grafo da demo como se fosse do usuário.
import { Alert, Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import { Flex } from "@/app/_ui/shared";
import AppShell from "@/app/_ui/shell/AppShell";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

export default function ConsoleUnavailable({ workspaceName }: { workspaceName: string }) {
  return (
    <AppShell chip={workspaceName}>
      <Box sx={{ maxWidth: 640, mx: "auto", display: "grid", gap: 2 }}>
        <Typography sx={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.4px" }}>
          {m["consoleUnavailable.title"].replace("{name}", workspaceName)}
        </Typography>
        <Alert severity="info">{m["consoleUnavailable.body"]}</Alert>
        <Typography variant="body2" color="text.secondary">
          {m["consoleUnavailable.next"]}
        </Typography>
        <Flex gap={1.5} wrap>
          <Button component={Link} href="/onboarding" variant="contained" size="small">
            {m["consoleUnavailable.cta.onboarding"]}
          </Button>
          <Button component={Link} href="/organizations" size="small" color="inherit">
            {m["consoleUnavailable.cta.demo"]}
          </Button>
        </Flex>
      </Box>
    </AppShell>
  );
}
