"use client";

// WorkspaceSettingsView — configurações de organização NÃO-demo.
// Não renderiza dados da acme: contexto é da organização atual.
import { Alert, Box, Button, Chip, Typography } from "@mui/material";
import Link from "next/link";
import { Flex, SectionCard } from "@/app/_ui/shared";
import AppShell from "@/app/_ui/shell/AppShell";
import { workspaceHasGovernanceHost, type Workspace } from "../../../../../../_lib/domain";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

export default function WorkspaceSettingsView({ workspace }: { workspace: Workspace }) {
  const hasHost = workspaceHasGovernanceHost(workspace);
  return (
    <AppShell chip={workspace.name}>
      <Box sx={{ maxWidth: 720, mx: "auto", display: "grid", gap: 2.5 }}>
        <Box sx={{ display: "grid", gap: 0.75 }}>
          <Typography sx={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.4px" }}>
            {m["workspaceSettings.title"].replace("{name}", workspace.name)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {m["workspaceSettings.lead"]}
          </Typography>
        </Box>

        <SectionCard title={m["workspaceSettings.identity.title"]}>
          <Box sx={{ display: "grid", gap: 1 }}>
            <Flex wrap gap={1}>
              <Chip
                size="small"
                variant="outlined"
                label={`${m["workspaceSettings.identity.kind"]}: ${workspace.kind}`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`${m["workspaceSettings.identity.onboarding"]}: ${workspace.onboardingStatus}`}
              />
            </Flex>
            <Typography variant="caption" color="text.secondary">
              {m["workspaceSettings.identity.rename.note"]}
            </Typography>
          </Box>
        </SectionCard>

        <SectionCard title={m["workspaceSettings.governance.title"]}>
          {hasHost ? (
            <Chip size="small" color="success" label={workspace.governanceHost?.pathOrUrl} />
          ) : (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <Alert severity="warning">{m["workspaceSettings.governance.missing"]}</Alert>
              <Box>
                <Button component={Link} href="/onboarding" size="small" variant="outlined">
                  {m["workspaceSettings.governance.cta"]}
                </Button>
              </Box>
            </Box>
          )}
        </SectionCard>

        <SectionCard title={m["workspaceSettings.switch.title"]}>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {m["workspaceSettings.switch.desc"]}
            </Typography>
            <Box>
              <Button component={Link} href="/organizations" size="small" variant="outlined">
                {m["workspaceSettings.switch.cta"]}
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {m["workspaceSettings.demo.note"]}
            </Typography>
          </Box>
        </SectionCard>
      </Box>
    </AppShell>
  );
}
