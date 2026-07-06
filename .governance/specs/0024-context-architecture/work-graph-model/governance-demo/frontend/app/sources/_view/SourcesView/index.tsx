"use client";

import { Alert, Box, Button, Chip, Typography } from "@mui/material";
import Link from "next/link";
import type { GovernanceHostKind } from "@demo/contracts";
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

export default function SourcesView({ workspace }: { workspace: WorkspaceSummary }) {
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
              <Button
                component={Link}
                href="/settings"
                variant="outlined"
                size="small"
                sx={{ justifySelf: "start" }}
              >
                {copy.hostCta}
              </Button>
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
