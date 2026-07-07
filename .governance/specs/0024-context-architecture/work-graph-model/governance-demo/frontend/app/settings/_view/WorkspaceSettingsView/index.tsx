"use client";

// WorkspaceSettingsView — configurações de organização NÃO-demo.
// Não renderiza dados da acme: contexto é da organização atual.
import { Box, Button, Chip, Typography } from "@mui/material";
import { Flex, SectionCard } from "@/app/_ui/shared";
import AppShell from "@/app/_ui/shell/AppShell";
import {
  governanceHostDirName,
  workspaceSlugId,
  type GovernanceHostKind,
  type Workspace,
} from "@demo/domain";
import { profileOption } from "@/app/_domain/adoption/model";
import GovernanceHostSection from "./GovernanceHostSection";
import MembersSection from "@/app/_features/workspace-authority/MembersSection";
import membersCopy from "@/app/_features/workspace-authority/MembersSection/_locales/pt-br.json";
import RolesSection from "@/app/_features/workspace-authority/RolesSection";
import rolesCopy from "@/app/_features/workspace-authority/RolesSection/_locales/pt-br.json";
import AssistantWorkspaceSection from "./AssistantWorkspaceSection";
import SwitchSection from "./SwitchSection";
import WorkSourcesManager from "@/app/sources/_components/WorkSourcesManager";
import sourcesCopy from "@/app/sources/_components/WorkSourcesManager/_locales/pt-br.json";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

export default function WorkspaceSettingsView({ workspace }: { workspace: Workspace }) {
  const slug = workspaceSlugId(workspace.name, []);
  const profile = workspace.profileDeclaration
    ? profileOption(workspace.profileDeclaration.profile)
    : null;
  const suggestions = {
    "dedicated-repo": governanceHostDirName("dedicated-repo", slug),
    "local-folder": governanceHostDirName("local-folder", slug),
    "existing-repo-folder": "",
  } as Record<GovernanceHostKind, string>;
  return (
    <AppShell chip={workspace.name} hasGovernanceHost={Boolean(workspace.governanceHost)}>
      <Box sx={{ maxWidth: 720, mx: "auto", display: "grid", gap: 2.5 }}>
        <Box sx={{ display: "grid", gap: 0.75 }}>
          <Typography sx={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.4px" }}>
            <span data-testid="settings-workspace-name">
              {m["workspaceSettings.title"].replace("{name}", workspace.name)}
            </span>
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

        <SectionCard title={m["workspaceSettings.profile.title"]}>
          <Box sx={{ display: "grid", gap: 1 }}>
            {profile ? (
              <>
                <Typography data-testid="settings-governance-profile" variant="body2">
                  <strong>{profile.label}</strong> · {profile.shortLabel}
                </Typography>
                <Typography data-testid="settings-sensitive-policy" variant="body2">
                  {m["workspaceSettings.profile.policy"]}:{" "}
                  {workspace.profileDeclaration?.sensitiveAccumulationPolicy}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {workspace.profileDeclaration?.reason}
                </Typography>
              </>
            ) : (
              <Typography data-testid="settings-governance-profile" variant="body2">
                {m["workspaceSettings.profile.missing"]}
              </Typography>
            )}
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
          <Box data-testid="settings-source-list">
            <WorkSourcesManager embedded />
          </Box>
        </SectionCard>

        <SectionCard title={m["workspaceSettings.assistant.title"]}>
          <AssistantWorkspaceSection />
        </SectionCard>

        <SectionCard title={m["workspaceSettings.integrations.title"]}>
          <Box sx={{ display: "grid", gap: 1 }}>
            <Typography data-testid="settings-integration-summary" variant="body2">
              {m["workspaceSettings.integrations.summary"]
                .replace("{count}", String(workspace.integrations.length))
                .replace(
                  "{ids}",
                  workspace.integrations.map((integration) => integration.id).join(", ") ||
                    "nenhuma"
                )}
            </Typography>
            <Button
              data-testid="settings-open-integrations-hub"
              href="/integrations"
              variant="outlined"
              size="small"
              sx={{ justifySelf: "start" }}
            >
              {m["workspaceSettings.integrations.cta"]}
            </Button>
          </Box>
        </SectionCard>

        <SwitchSection />
      </Box>
    </AppShell>
  );
}
