import { Box, Button, Chip, Paper, Typography } from "@mui/material";
import Link from "next/link";
import { Flex } from "@/app/ui/shared";
import copy from "./locales/pt-br.json";

export function OnboardingPartialCard() {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.25, display: "grid", gap: 1.25, borderColor: "#d9e8dd", bgcolor: "#f8fbf8" }}
    >
      <Flex justify="space-between" align="center" gap={2} wrap>
        <Box>
          <Chip size="small" color="warning" label={copy.onboarding.partialLabel} />
          <Typography variant="h2" sx={{ mt: 1 }}>
            {copy.onboarding.partialTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
            {copy.onboarding.partialBody}
          </Typography>
        </Box>
        <Flex gap={1} wrap>
          <Button component={Link} href="/onboarding" variant="contained">
            {copy.onboarding.continue}
          </Button>
          <Button component={Link} href="/settings" variant="outlined">
            {copy.onboarding.settings}
          </Button>
        </Flex>
      </Flex>
    </Paper>
  );
}
