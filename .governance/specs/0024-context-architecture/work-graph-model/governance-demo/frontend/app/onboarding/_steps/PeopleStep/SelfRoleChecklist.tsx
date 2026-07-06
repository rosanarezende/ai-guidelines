import { Box, Button, Checkbox, FormControlLabel, Typography } from "@mui/material";
import type { WorkspaceRoleId } from "@demo/contracts";
import { Flex, ResponsiveGrid } from "@/app/_ui/shared";
import { roleLabels } from "./authorityGuideModel";
import copy from "./_locales/pt-br.json";

export function SelfRoleChecklist({
  busy,
  currentPersonId,
  effective,
  modeSuggestedCount,
  roleCatalog,
  selectedRoles,
  onAssume,
  onToggleRole,
}: {
  busy: boolean;
  currentPersonId?: string;
  effective: Set<WorkspaceRoleId>;
  modeSuggestedCount: number;
  roleCatalog: WorkspaceRoleId[];
  selectedRoles: WorkspaceRoleId[];
  onAssume: () => void;
  onToggleRole: (roleId: WorkspaceRoleId) => void;
}) {
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 800 }}>
        {copy.assumeTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {copy.assumeLead}
      </Typography>
      <ResponsiveGrid min={230} gap={0.5}>
        {roleCatalog.map((roleId) => (
          <FormControlLabel
            key={roleId}
            data-testid={`self-role-${roleId}`}
            control={
              <Checkbox
                checked={selectedRoles.includes(roleId)}
                onChange={() => onToggleRole(roleId)}
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {roleLabels[roleId]}
                </Typography>
                {effective.has(roleId) ? (
                  <Typography variant="caption" color="success.main">
                    {copy.alreadyEffective}
                  </Typography>
                ) : null}
              </Box>
            }
            sx={{
              alignItems: "flex-start",
              border: "1px solid",
              borderColor: selectedRoles.includes(roleId) ? "success.light" : "divider",
              borderRadius: 1,
              m: 0,
              px: 1,
              py: 0.75,
            }}
          />
        ))}
      </ResponsiveGrid>
      <Flex gap={1} wrap align="center">
        <Button
          data-testid="assume-selected-roles"
          variant="contained"
          disabled={busy || !currentPersonId || selectedRoles.length === 0}
          onClick={onAssume}
        >
          {copy.assumeCta}
        </Button>
        <Typography variant="caption" color="text.secondary">
          {modeSuggestedCount} {copy.rolesSuggested}
        </Typography>
      </Flex>
    </Box>
  );
}
