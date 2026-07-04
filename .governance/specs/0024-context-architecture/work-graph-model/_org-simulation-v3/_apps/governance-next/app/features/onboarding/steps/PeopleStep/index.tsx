import { Alert, Box } from "@mui/material";
import type { GovernanceSnapshot } from "@/lib/types";
import { RoleContractList } from "@/app/features/adoption/components";
import {
  ROLE_ACCEPTANCE_NOTICE,
  roleWarnings,
  type ProfileId,
  type RoleAssignments,
  type RoleKey,
} from "@/app/features/adoption/model";
import { StepHeading } from "../../components";
import copy from "./locales/pt-br.json";

export function PeopleStep({
  assignments,
  authorities,
  profile,
  onChange,
}: {
  assignments: RoleAssignments;
  authorities: GovernanceSnapshot["authorities"];
  profile: ProfileId;
  onChange: (role: RoleKey, value: string) => void;
}) {
  const authorityIds = new Set(authorities.map((authority) => authority.id));
  const warnings = roleWarnings(assignments, profile, authorityIds);
  return (
    <>
      <StepHeading step={2} title={copy.heading.title} lead={copy.heading.lead} />
      <RoleContractList
        assignments={assignments}
        authorities={authorities}
        profile={profile}
        onChange={onChange}
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
