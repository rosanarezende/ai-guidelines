import { Box, Button, Chip, MenuItem, TextField, Typography } from "@mui/material";
import type { WorkspaceRoleId } from "@demo/contracts";
import { Flex, ResponsiveGrid } from "@/app/_ui/shared";
import { roleLabels } from "./authorityGuideModel";
import copy from "./_locales/pt-br.json";

export function ResponsibilityFollowup({
  busy,
  inviteEmail,
  inviteName,
  inviteRole,
  openRoles,
  roleCatalog,
  onInvite,
  setInviteEmail,
  setInviteName,
  setInviteRole,
}: {
  busy: boolean;
  inviteEmail: string;
  inviteName: string;
  inviteRole: WorkspaceRoleId;
  openRoles: WorkspaceRoleId[];
  roleCatalog: WorkspaceRoleId[];
  onInvite: () => void;
  setInviteEmail: (value: string) => void;
  setInviteName: (value: string) => void;
  setInviteRole: (value: WorkspaceRoleId) => void;
}) {
  const selectableRoles = openRoles.length ? openRoles : roleCatalog;
  const selectedInviteRole = selectableRoles.includes(inviteRole)
    ? inviteRole
    : (selectableRoles[0] ?? "");
  return (
    <ResponsiveGrid min={280} gap={1.5}>
      <Box data-testid="open-responsibilities-list" sx={{ display: "grid", gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {copy.openTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {copy.openLead}
        </Typography>
        <Flex gap={0.75} wrap>
          {openRoles.length ? (
            openRoles.map((roleId) => (
              <Chip key={roleId} size="small" variant="outlined" label={roleLabels[roleId]} />
            ))
          ) : (
            <Chip size="small" color="success" label={copy.noOpenRoles} />
          )}
        </Flex>
      </Box>

      <Box sx={{ display: "grid", gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {copy.inviteTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {copy.inviteLead}
        </Typography>
        <TextField
          size="small"
          label={copy.inviteName}
          value={inviteName}
          onChange={(event) => setInviteName(event.target.value)}
          slotProps={{ htmlInput: { "data-testid": "guided-invite-name" } }}
        />
        <TextField
          size="small"
          label={copy.inviteEmail}
          value={inviteEmail}
          onChange={(event) => setInviteEmail(event.target.value)}
        />
        <TextField
          select
          size="small"
          label={copy.inviteRole}
          value={selectedInviteRole}
          onChange={(event) => setInviteRole(event.target.value as WorkspaceRoleId)}
        >
          {selectableRoles.map((roleId) => (
            <MenuItem key={roleId} value={roleId}>
              {roleLabels[roleId]}
            </MenuItem>
          ))}
        </TextField>
        <Button
          data-testid="guided-invite-submit"
          variant="outlined"
          disabled={busy || inviteName.trim().length < 2}
          onClick={onInvite}
        >
          {copy.inviteCta}
        </Button>
      </Box>
    </ResponsiveGrid>
  );
}
