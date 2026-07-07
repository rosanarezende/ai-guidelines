import { Box, Chip, Paper, Typography } from "@mui/material";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { Flex, ResponsiveGrid } from "@/app/_ui/shared";
import { StepHeading } from "../../_components";
import { useOnboarding } from "../../_state/OnboardingContext";
import copy from "./_locales/pt-br.json";

export function IntegrationsStep() {
  const { catalogHighlights } = useOnboarding();
  return (
    <>
      <StepHeading step={5} title={copy.heading.title} lead={copy.heading.lead} />
      <ResponsiveGrid min={230} gap={1.5}>
        {catalogHighlights.map((item) => (
          <Paper
            key={item.id}
            data-testid={item.id === "git-provider" ? "integration-status-release-1" : undefined}
            variant="outlined"
            sx={{ p: 2, display: "grid", gap: 1, alignContent: "start" }}
          >
            <Flex justify="space-between" align="center" gap={1}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {item.id}
              </Typography>
              <Chip
                size="small"
                label={copy.status[item.id as keyof typeof copy.status] || copy.status.default}
                color={item.id === "assistant-runtime-local-cloud" ? "success" : "default"}
                variant="outlined"
              />
            </Flex>
            <Typography variant="caption" color="text.secondary">
              {item["value-add"]}
            </Typography>
            <Flex wrap gap={0.5}>
              {item.systems.slice(0, 3).map((system) => (
                <Chip key={system} size="small" variant="outlined" label={system} />
              ))}
            </Flex>
          </Paper>
        ))}
      </ResponsiveGrid>
      <Flex gap={1} align="flex-start">
        <VerifiedUserIcon fontSize="small" sx={{ color: "text.secondary", mt: 0.25 }} />
        <Typography
          data-testid="integration-manual-alternative"
          variant="caption"
          color="text.secondary"
        >
          {copy.authorityNotice}
        </Typography>
      </Flex>
    </>
  );
}
