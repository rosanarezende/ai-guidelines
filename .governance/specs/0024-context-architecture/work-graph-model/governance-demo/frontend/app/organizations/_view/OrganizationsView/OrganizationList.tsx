"use client";

import { Box, Button, Chip, Paper, Typography } from "@mui/material";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import { Flex } from "@/app/_ui/shared";
import type { OnboardingStatus, WorkspaceKind } from "@demo/contracts";
import copy from "./_locales/pt-br.json";

const m = copy.messages;

export type OrganizationListItem = {
  id: string;
  name: string;
  kind: WorkspaceKind;
  onboardingStatus: OnboardingStatus;
  isDemo: boolean;
  isCurrent: boolean;
};

export function OrganizationList({
  organizations,
  busyId,
  onOpen,
}: {
  organizations: OrganizationListItem[];
  busyId: string | null;
  onOpen: (id: string) => void;
}) {
  if (!organizations.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        {m["organizations.list.empty"]}
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "grid", gap: 1.25 }}>
      {organizations.map((organization) => (
        <Paper key={organization.id} variant="outlined" sx={{ p: 2 }}>
          <Flex align="center" gap={1.5} wrap>
            <CorporateFareIcon color="primary" fontSize="small" />
            <Box sx={{ flex: 1, minWidth: 160 }}>
              <Flex align="center" gap={1} wrap>
                <Typography sx={{ fontWeight: 700 }}>{organization.name}</Typography>
                {organization.isDemo ? (
                  <Chip size="small" color="info" label={m["organizations.badge.demo"]} />
                ) : null}
                {organization.isCurrent ? (
                  <Chip size="small" variant="outlined" label={m["organizations.list.current"]} />
                ) : null}
              </Flex>
              <Typography variant="caption" color="text.secondary">
                {m[`organizations.kind.${organization.kind}` as keyof typeof m] ||
                  organization.kind}{" "}
                · {m[`organizations.status.${organization.onboardingStatus}` as keyof typeof m]}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              disabled={busyId !== null}
              onClick={() => onOpen(organization.id)}
            >
              {m["organizations.list.open"]}
            </Button>
          </Flex>
        </Paper>
      ))}
    </Box>
  );
}
