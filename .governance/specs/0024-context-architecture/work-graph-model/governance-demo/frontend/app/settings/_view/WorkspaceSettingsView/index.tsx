"use client";

// WorkspaceSettingsView — configurações de organização NÃO-demo.
// Não renderiza dados da acme: contexto é da organização atual.
import { Box, Chip, Typography } from "@mui/material";
import { Flex, SectionCard } from "@/app/_ui/shared";
import AppShell from "@/app/_ui/shell/AppShell";
import {
  governanceHostDirName,
  workspaceSlugId,
  type GovernanceHostKind,
  type Workspace,
} from "@demo/backend/domain";
import GovernanceHostSection from "./GovernanceHostSection";
import MembersSection from "./MembersSection";
import membersCopy from "./MembersSection/_locales/pt-br.json";
import RolesSection from "./RolesSection";
import rolesCopy from "./RolesSection/_locales/pt-br.json";
import SwitchSection from "./SwitchSection";
import WorkSourcesSection from "./WorkSourcesSection";
import sourcesCopy from "./WorkSourcesSection/_locales/pt-br.json";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

export default function WorkspaceSettingsView({ workspace }: { workspace: Workspace }) {
  const slug = workspaceSlugId(workspace.name, []);
  const suggestions = {
    "dedicated-repo": governanceHostDirName("dedicated-repo", slug),
    "local-folder": governanceHostDirName("local-folder", slug),
    "existing-repo-folder": "",
  } as Record<GovernanceHostKind, string>;
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
          <GovernanceHostSection
            initial={{
              governanceHost: workspace.governanceHost
                ? {
                    kind: workspace.governanceHost.kind,
                    pathOrUrl: workspace.governanceHost.pathOrUrl,
                    ...(workspace.governanceHost.fitCheck
                      ? { fitCheck: workspace.governanceHost.fitCheck }
                      : {}),
                  }
                : null,
              sandboxDeclared: Boolean(workspace.sandboxDeclared),
              suggestions,
            }}
          />
        </SectionCard>

        <SectionCard title={membersCopy.title}>
          <MembersSection />
        </SectionCard>

        <SectionCard title={rolesCopy.title}>
          <RolesSection />
        </SectionCard>

        <SectionCard title={sourcesCopy.title}>
          <WorkSourcesSection />
        </SectionCard>

        <SwitchSection />
      </Box>
    </AppShell>
  );
}
