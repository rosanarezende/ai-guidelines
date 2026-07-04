import { Alert, Box } from "@mui/material";
import { RoleContractList } from "@/app/_ui/adoption";
import {
  ROLE_ACCEPTANCE_NOTICE,
  roleWarnings,
} from "@/app/_domain/adoption/model";
import { StepHeading } from "../../_components";
import { useOnboarding } from "../../_state/OnboardingContext";
import copy from "./_locales/pt-br.json";

export function PeopleStep() {
  const { assignments, changeAssignment, profile, snapshot } = useOnboarding();
  const { authorities } = snapshot;
  const authorityIds = new Set(authorities.map((authority) => authority.id));
  const warnings = roleWarnings(assignments, profile, authorityIds);
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
