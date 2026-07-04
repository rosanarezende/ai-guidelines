import { Box, Chip, Paper, Typography } from "@mui/material";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { Flex, ResponsiveGrid } from "@/app/ui/shared";
import type { IntegrationItem } from "@/lib/types";
import { StepHeading } from "../../components";
import copy from "./locales/pt-br.json";

export function IntegrationsStep({ integrations }: { integrations: IntegrationItem[] }) {
  return (
    <>
      <StepHeading step={5} title={copy.heading.title} lead={copy.heading.lead} />
      <ResponsiveGrid min={230} gap={1.5}>
        {integrations.map((item) => (
          <Paper
            key={item.id}
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
        <Typography variant="caption" color="text.secondary">
          {copy.authorityNotice}
        </Typography>
      </Flex>
    </>
  );
}
