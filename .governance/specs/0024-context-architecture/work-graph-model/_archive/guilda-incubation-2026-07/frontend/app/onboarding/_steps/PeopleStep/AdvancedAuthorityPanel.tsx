import { Box, Button, Typography } from "@mui/material";
import MembersSection from "@/app/_features/workspace-authority/MembersSection";
import RolesSection from "@/app/_features/workspace-authority/RolesSection";
import copy from "./_locales/pt-br.json";

export function AdvancedAuthorityPanel({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Button
        data-testid="onboarding-advanced-authority"
        variant="text"
        color="inherit"
        onClick={onToggle}
        sx={{ justifySelf: "start", textTransform: "none" }}
      >
        {open ? copy.hideAdvanced : copy.showAdvanced}
      </Button>
      {open ? (
        <Box sx={{ display: "grid", gap: 2 }}>
          <Box data-testid="onboarding-people-manager" sx={{ display: "grid", gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {copy.peopleTitle}
            </Typography>
            <MembersSection />
          </Box>
          <Box data-testid="onboarding-role-manager" sx={{ display: "grid", gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>
              {copy.rolesTitle}
            </Typography>
            <RolesSection />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
