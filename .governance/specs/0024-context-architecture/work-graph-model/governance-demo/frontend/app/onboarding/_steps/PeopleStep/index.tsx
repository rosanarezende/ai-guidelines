import { Alert, Box, Divider, Typography } from "@mui/material";
import { RoleContractList } from "@/app/_ui/adoption";
import { ROLE_ACCEPTANCE_NOTICE, roleWarnings } from "@/app/_domain/adoption/model";
import MembersSection from "@/app/_features/workspace-authority/MembersSection";
import RolesSection from "@/app/_features/workspace-authority/RolesSection";
import { StepHeading } from "../../_components";
import { useOnboarding } from "../../_state/OnboardingContext";
import copy from "./_locales/pt-br.json";

export function PeopleStep() {
  const { assignments, changeAssignment, profile, snapshot, org } = useOnboarding();
  const authorities = snapshot?.authorities ?? [];
  const authorityIds = new Set(authorities.map((authority) => authority.id));
  const warnings = roleWarnings(assignments, profile, authorityIds);
  if (!org.isDemo) {
    return (
      <>
        <StepHeading step={2} title={copy.heading.title} lead={copy.heading.lead} />
        <Alert severity="info">{copy.realOrgIntro}</Alert>
        <Box data-testid="onboarding-people-manager" sx={{ display: "grid", gap: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {copy.peopleTitle}
          </Typography>
          <MembersSection />
        </Box>
        <Divider />
        <Box data-testid="onboarding-role-manager" sx={{ display: "grid", gap: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            {copy.rolesTitle}
          </Typography>
          <RolesSection />
        </Box>
        <Alert severity="info">{ROLE_ACCEPTANCE_NOTICE}</Alert>
      </>
    );
  }
  return (
    <>
      <StepHeading step={2} title={copy.heading.title} lead={copy.heading.lead} />
      <RoleContractList
        assignments={assignments}
        authorities={authorities}
        profile={profile}
        onChange={changeAssignment}
      />
      <Alert severity="info">{ROLE_ACCEPTANCE_NOTICE}</Alert>
      <Box sx={{ display: "grid", gap: 1 }}>
        {warnings.map((warning) => (
          <Alert key={warning} severity={warning.startsWith("Separação") ? "success" : "warning"}>
            {warning}
          </Alert>
        ))}
      </Box>
    </>
  );
}
