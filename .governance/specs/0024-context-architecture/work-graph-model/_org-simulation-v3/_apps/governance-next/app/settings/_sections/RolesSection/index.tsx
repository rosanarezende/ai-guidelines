"use client";

import { Alert, Box } from "@mui/material";
import type { Authority } from "@/lib/types";
import { SectionCard } from "@/app/_ui/shared";
import { RoleContractList } from "@/app/_ui/adoption";
import {
  ROLE_ACCEPTANCE_NOTICE,
  type ProfileId,
  type RoleAssignments,
  type RoleKey,
} from "@/app/_domain/adoption/model";
import copy from "./_locales/pt-br.json";

export function RolesSection({
  assignments,
  authorities,
  profile,
  warnings,
  onChange,
}: {
  assignments: RoleAssignments;
  authorities: Authority[];
  profile: ProfileId;
  warnings: string[];
  onChange: (role: RoleKey, value: string) => void;
}) {
  return (
    <Box id="papeis">
      <SectionCard title={copy.title} subtitle={copy.subtitle}>
        <Box sx={{ display: "grid", gap: 1.5 }}>
          <RoleContractList
            assignments={assignments}
            authorities={authorities}
            profile={profile}
            onChange={onChange}
          />
          <Alert severity="info">{ROLE_ACCEPTANCE_NOTICE}</Alert>
          {warnings.map((warning) => (
            <Alert
              key={warning}
              severity={warning.startsWith(copy.successPrefix) ? "success" : "warning"}
            >
              {warning}
            </Alert>
          ))}
        </Box>
      </SectionCard>
    </Box>
  );
}
