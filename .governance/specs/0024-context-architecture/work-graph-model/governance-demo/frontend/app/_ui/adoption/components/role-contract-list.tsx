"use client";

import { Box, Chip, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import type { Authority } from "@demo/contracts";
import { Flex } from "@/app/_ui/shared";
import {
  ROLE_CONTRACT,
  type ProfileId,
  type RoleAssignments,
  type RoleKey,
} from "@/app/_domain/adoption/model";
import { StatusPill } from "./status";
import copy from "./role-contract-list/_locales/pt-br.json";

export function RoleContractList({
  assignments,
  authorities,
  onChange,
}: {
  assignments: RoleAssignments;
  authorities: Authority[];
  profile: ProfileId;
  onChange?: (role: RoleKey, value: string) => void;
}) {
  const authorityIds = new Set(authorities.map((authority) => authority.id));
  const holders = new Map<string, RoleKey[]>();
  for (const item of ROLE_CONTRACT) {
    const person = assignments[item.key];
    holders.set(person, [...(holders.get(person) || []), item.key]);
  }
  return (
    <Box sx={{ display: "grid" }}>
      {ROLE_CONTRACT.map((item) => {
        const person = assignments[item.key];
        const collapsed = (holders.get(person) || []).length > 1;
        const unresolved = !authorityIds.has(person);
        return (
          <Box
            key={item.key}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
              gap: 1.5,
              alignItems: "center",
              py: 1.25,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Flex align="center" gap={1} wrap>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {item.role}
                </Typography>
                {item.sensitive ? (
                  <Chip size="small" variant="outlined" label={copy.sensitiveRole} />
                ) : null}
                {collapsed && item.sensitive ? (
                  <StatusPill state="self-attested" label={copy.collapsed} />
                ) : null}
                {unresolved ? <StatusPill state="pending" label={copy.unresolved} /> : null}
                <StatusPill state="pending" label={copy.acceptancePending} />
              </Flex>
              <Typography variant="caption" color="text.secondary">
                {item.desc}
              </Typography>
            </Box>
            {onChange ? (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>{item.role}</InputLabel>
                <Select
                  label={item.role}
                  value={person}
                  onChange={(event: SelectChangeEvent) => onChange(item.key, event.target.value)}
                >
                  {authorities.map((authority) => (
                    <MenuItem key={authority.id} value={authority.id}>
                      {authority.id}
                    </MenuItem>
                  ))}
                  {!authorityIds.has(person) ? (
                    <MenuItem value={person}>
                      {copy.needsResolution.replace("{person}", person)}
                    </MenuItem>
                  ) : null}
                </Select>
              </FormControl>
            ) : (
              <Chip size="small" label={person} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
