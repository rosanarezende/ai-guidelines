"use client";

import { Alert, Box, Button, Chip, Typography } from "@mui/material";
import Link from "next/link";
import type { GovernanceHostKind } from "@demo/contracts";
import { useState } from "react";
import AppShell from "@/app/_ui/shell/AppShell";
import { Flex, SectionCard } from "@/app/_ui/shared";
import WorkSourcesManager from "../../_components/WorkSourcesManager";
import copy from "./_locales/pt-br.json";

type WorkspaceSummary = {
  id: string;
  name: string;
  demo: boolean;
  onboardingStatus: string;
  governanceHost: { kind: GovernanceHostKind; pathOrUrl: string; status?: string } | null;
  sandboxDeclared: boolean;
};

const HOST_OPTIONS: GovernanceHostKind[] = [
  "local-folder",
  "dedicated-repo",
  "existing-repo-folder",
];

function suggestedPath(kind: GovernanceHostKind, workspaceName: string): string {
  const slug = workspaceName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return kind === "existing-repo-folder" ? ".governance-host" : `${slug || "workspace"}-governance`;
}

export default function SourcesView({ workspace }: { workspace: WorkspaceSummary }) {
  const [fitResult, setFitResult] = useState<string | null>(null);
  const [sandboxDeclared, setSandboxDeclared] = useState(workspace.sandboxDeclared);
  const [busyHostAction, setBusyHostAction] = useState(false);

  async function runFitCheck(kind: GovernanceHostKind) {
    setBusyHostAction(true);
    setFitResult(null);
    try {
      const response = await fetch("/api/local/governance-host", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "fit-check",
          kind,
          pathOrUrl: suggestedPath(kind, workspace.name),
        }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        fitCheck?: { ok: boolean; warnings: string[] };
      };
      if (!data.ok) {
        setFitResult(`bloqueio: ${data.error || "fit-check falhou"}`);
        return;
      }
      const warningText = data.fitCheck?.warnings?.length
        ? `warning: ${data.fitCheck.warnings.join(" · ")}`
        : "ok: caminho pode ser usado como host";
      setFitResult(warningText);
    } finally {
      setBusyHostAction(false);
    }
  }

  async function declareSandbox() {
    setBusyHostAction(true);
    try {
      const response = await fetch("/api/local/governance-host", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "sandbox" }),
      });
      const data = (await response.json()) as { ok: boolean };
      if (data.ok) setSandboxDeclared(true);
    } finally {
      setBusyHostAction(false);
    }
  }

  return (
    <AppShell
      chip={workspace.demo ? "demo" : "workspace"}
      subtitle={copy.subtitle}
      headerAction={<Chip size="small" color="info" label={workspace.name} />}
      maxWidth="lg"
      hasGovernanceHost={Boolean(workspace.governanceHost)}
    >
      <Box sx={{ display: "grid", gap: 3 }}>
        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography variant="h1">{copy.title}</Typography>
          <Typography variant="body1" color="text.secondary">
            {copy.lead}
          </Typography>
        </Box>

        <SectionCard title={copy.hostRelationTitle}>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Alert severity={workspace.governanceHost ? "success" : "warning"}>
              <Typography variant="subtitle2">
                {workspace.governanceHost ? copy.hostConfiguredTitle : copy.hostMissingTitle}
              </Typography>
              <Typography variant="body2">
                {workspace.governanceHost
                  ? copy.hostConfiguredBody.replace("{path}", workspace.governanceHost.pathOrUrl)
                  : workspace.sandboxDeclared
                    ? copy.hostSandboxBody
                    : copy.hostMissingBody}
              </Typography>
            </Alert>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "grid", gap: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
                  {copy.hostColumnTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {copy.hostColumnBody}
                </Typography>
              </Box>
              <Box sx={{ display: "grid", gap: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
                  {copy.sourceColumnTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {copy.sourceColumnBody}
                </Typography>
              </Box>
            </Box>
            {!workspace.governanceHost ? (
              <Box data-testid="host-required-before-sources" sx={{ display: "grid", gap: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
                  {copy.hostGateTitle}
                </Typography>
                <Flex gap={1} wrap>
                  {HOST_OPTIONS.map((kind) => (
                    <Button
                      key={kind}
                      data-testid={`host-option-${kind}`}
                      disabled={busyHostAction}
                      size="small"
                      variant="outlined"
                      onClick={() => void runFitCheck(kind)}
                    >
                      {copy.hostOptions[kind]}
                    </Button>
                  ))}
                </Flex>
                {fitResult ? (
                  <Alert data-testid="host-fit-check-result" severity="info">
                    {fitResult}
                  </Alert>
                ) : null}
                <Flex gap={1} wrap>
                  <Button component={Link} href="/settings" variant="contained" size="small">
                    {copy.hostCta}
                  </Button>
                  <Button
                    data-testid="host-use-sandbox"
                    color="warning"
                    disabled={busyHostAction || sandboxDeclared}
                    size="small"
                    variant="outlined"
                    onClick={() => void declareSandbox()}
                  >
                    {copy.hostSandboxCta}
                  </Button>
                </Flex>
                {sandboxDeclared ? (
                  <Alert data-testid="sandbox-not-real-governance" severity="warning">
                    {copy.hostSandboxBody}
                  </Alert>
                ) : null}
              </Box>
            ) : null}
          </Box>
        </SectionCard>

        <Flex gap={1} wrap>
          {copy.badges.map((badge) => (
            <Chip key={badge} size="small" variant="outlined" label={badge} />
          ))}
        </Flex>

        <SectionCard title={copy.whatChangesTitle}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 1.5,
            }}
          >
            {copy.whatChanges.map((item) => (
              <Box key={item.title} sx={{ display: "grid", gap: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.body}
                </Typography>
              </Box>
            ))}
          </Box>
        </SectionCard>

        <WorkSourcesManager />
      </Box>
    </AppShell>
  );
}
