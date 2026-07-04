"use client";

import { Box, Button, Typography } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useMemo, useState } from "react";
import type { GovernanceSnapshot } from "@/lib/types";
import { Flex } from "@/app/_ui/shared";
import {
  DEFAULT_ASSIGNMENTS,
  assistantSystems,
  deriveAdoption,
  profileChipLabel,
  profileOption,
  providerIsLocal,
  roleWarnings,
  type ProfileId,
  type RoleAssignments,
} from "@/app/_domain/adoption/model";
import AppShell from "@/app/_ui/shell/AppShell";
import { SECTIONS, priorityWeight } from "../../_model";
import { AdvancedSection } from "../../_sections/AdvancedSection";
import { AssistantSection } from "../../_sections/AssistantSection";
import { IntegrationsSection } from "../../_sections/IntegrationsSection";
import { OrganizationSection } from "../../_sections/OrganizationSection";
import { RolesSection } from "../../_sections/RolesSection";
import { SourcesSection } from "../../_sections/SourcesSection";
import copy from "./_locales/pt-br.json";

export default function SettingsView({ snapshot }: { snapshot: GovernanceSnapshot }) {
  const adoption = useMemo(() => deriveAdoption(snapshot), [snapshot]);
  const declaredProfile = (
    ["full", "compact", "trio", "solo"].includes(snapshot.profileDeclaration.profile)
      ? snapshot.profileDeclaration.profile
      : "full"
  ) as ProfileId;
  const option = profileOption(declaredProfile);
  const [assignments, setAssignments] = useState<RoleAssignments>(DEFAULT_ASSIGNMENTS);
  const [provider, setProvider] = useState("ollama");
  const [assistantUrl, setAssistantUrl] = useState("http://127.0.0.1:11434");
  const [assistantModel, setAssistantModel] = useState("llama3.2");
  const [classificationPolicy, setClassificationPolicy] = useState("local-only");
  const [category, setCategory] = useState("ai-assistance");

  const authorityIds = useMemo(
    () => new Set(snapshot.authorities.map((authority) => authority.id)),
    [snapshot.authorities]
  );
  const warnings = roleWarnings(assignments, declaredProfile, authorityIds);
  const systems = assistantSystems(snapshot);
  const categories = [
    ...new Set(snapshot.integrationCatalog.integrations.map((item) => item.category)),
  ].sort();
  const integrations = snapshot.integrationCatalog.integrations
    .filter((item) => item.category === category)
    .sort(
      (a, b) => priorityWeight(a.priority) - priorityWeight(b.priority) || a.id.localeCompare(b.id)
    );

  function updateProvider(event: SelectChangeEvent) {
    const nextProvider = event.target.value;
    setProvider(nextProvider);
    if (providerIsLocal(nextProvider)) {
      setClassificationPolicy("local-only");
      if (nextProvider === "ollama") setAssistantUrl("http://127.0.0.1:11434");
    } else {
      setClassificationPolicy("policy-gated");
    }
  }

  return (
    <AppShell chip={profileChipLabel(declaredProfile)}>
      <Box
        sx={{
          display: "grid",
          gap: 4,
          alignItems: "start",
          gridTemplateColumns: { xs: "1fr", md: "220px 1fr" },
        }}
      >
        <Box
          component="nav"
          sx={{
            position: { md: "sticky" },
            top: 24,
            display: { xs: "none", md: "grid" },
            gap: 0.25,
          }}
        >
          {SECTIONS.map((section) => (
            <Button
              key={section.id}
              component="a"
              href={`#${section.id}`}
              size="small"
              color="inherit"
              sx={{ justifyContent: "flex-start", fontWeight: 600 }}
            >
              {section.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: "grid", gap: 2.5 }}>
          <Typography sx={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.4px" }}>
            {copy.title}
          </Typography>
          <OrganizationSection snapshot={snapshot} option={option} />
          <RolesSection
            assignments={assignments}
            authorities={snapshot.authorities}
            profile={declaredProfile}
            warnings={warnings}
            onChange={(role, value) => setAssignments((current) => ({ ...current, [role]: value }))}
          />
          <SourcesSection adoption={adoption} />
          <AssistantSection
            provider={provider}
            assistantUrl={assistantUrl}
            assistantModel={assistantModel}
            classificationPolicy={classificationPolicy}
            systems={systems}
            profile={declaredProfile}
            onProviderChange={updateProvider}
            onUrlChange={setAssistantUrl}
            onModelChange={setAssistantModel}
            onClassificationPolicyChange={setClassificationPolicy}
          />
          <IntegrationsSection
            categories={categories}
            category={category}
            integrations={integrations}
            onCategoryChange={setCategory}
          />
          <AdvancedSection snapshot={snapshot} />
          <Flex sx={{ display: { xs: "flex", md: "none" } }} gap={1} wrap>
            {SECTIONS.map((section) => (
              <Button key={section.id} component="a" href={`#${section.id}`} size="small">
                {section.label}
              </Button>
            ))}
          </Flex>
        </Box>
      </Box>
    </AppShell>
  );
}
