"use client";

// ConsoleUnavailable — organização sem host de governança não tem console:
// o app diz isso em vez de mostrar o grafo da demo como se fosse do usuário.
import { Alert, Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import { Flex } from "@/app/_ui/shared";
import AppShell from "@/app/_ui/shell/AppShell";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

export default function ConsoleUnavailable({
  workspaceName,
  governanceHost,
}: {
  workspaceName: string;
  governanceHost: { pathOrUrl: string; sourceRevision?: string; warnings: string[] } | null;
}) {
  const hasHost = Boolean(governanceHost);
  return (
    <AppShell chip={workspaceName} hasGovernanceHost={hasHost}>
      <Box
        data-testid="console-unavailable"
        sx={{ maxWidth: 640, mx: "auto", display: "grid", gap: 2 }}
      >
        <Typography sx={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.4px" }}>
          {m["consoleUnavailable.title"].replace("{name}", workspaceName)}
        </Typography>
        <Alert severity={hasHost ? "success" : "info"}>
          {hasHost
            ? m["consoleUnavailable.host.body"].replace("{path}", governanceHost?.pathOrUrl || "")
            : m["consoleUnavailable.body"]}
        </Alert>
        {governanceHost?.sourceRevision ? (
          <Alert data-testid="console-source-revision" severity="info">
            {m["consoleUnavailable.host.revision"].replace(
              "{revision}",
              governanceHost.sourceRevision
            )}
          </Alert>
        ) : null}
        {governanceHost?.warnings.length ? (
          <Alert severity="warning">{governanceHost.warnings.join(" · ")}</Alert>
        ) : null}
        <Typography variant="body2" color="text.secondary">
          {hasHost ? m["consoleUnavailable.host.next"] : m["consoleUnavailable.next"]}
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
