import { Alert, Box, Button, Chip, TextField, Typography } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Flex } from "@/app/ui/shared";
import {
  assistantCloudNote,
  type AssistantChoice,
  type ProfileId,
} from "@/app/features/adoption/model";
import { OptionCard, StepHeading } from "../../components";
import copy from "./locales/pt-br.json";

export function AssistantStep({
  assistant,
  profile,
  systems,
  onSelect,
}: {
  assistant: AssistantChoice;
  profile: ProfileId;
  systems: string[];
  onSelect: (assistant: AssistantChoice) => void;
}) {
  return (
    <>
      <StepHeading step={4} title={copy.heading.title} lead={copy.heading.lead} />
      <Box sx={{ display: "grid", gap: 1.5 }}>
        <OptionCard selected={assistant === "local"} onClick={() => onSelect("local")}>
          <Box sx={{ display: "grid", gap: 1 }}>
            <Flex align="center" gap={1.25} wrap>
              {assistant === "local" ? (
                <RadioButtonCheckedIcon color="primary" fontSize="small" />
              ) : (
                <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "#c2c9c2" }} />
              )}
              <Typography sx={{ fontWeight: 700 }}>{copy.local.title}</Typography>
              <Chip
                size="small"
                icon={<LockIcon sx={{ fontSize: 13 }} />}
                label={copy.local.badge}
                sx={{ bgcolor: "#e7f2ea", color: "#1a5632" }}
              />
            </Flex>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              {copy.local.body}
            </Typography>
            {assistant === "local" ? (
              <Flex gap={1.25} wrap sx={{ ml: 4 }}>
                <TextField
                  size="small"
                  label={copy.local.endpointLabel}
                  value="http://127.0.0.1:11434"
                  slotProps={{ input: { readOnly: true } }}
                />
                <TextField
                  size="small"
                  label={copy.local.modelLabel}
                  value="llama3.2"
                  slotProps={{ input: { readOnly: true } }}
                />
                <Button size="small" variant="outlined" disabled>
                  {copy.local.testCta}
                </Button>
              </Flex>
            ) : null}
          </Box>
        </OptionCard>
        <OptionCard selected={assistant === "cloud"} onClick={() => onSelect("cloud")}>
          <Box sx={{ display: "grid", gap: 1 }}>
            <Flex align="center" gap={1.25} wrap>
              {assistant === "cloud" ? (
                <RadioButtonCheckedIcon color="primary" fontSize="small" />
              ) : (
                <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "#c2c9c2" }} />
              )}
              <Typography sx={{ fontWeight: 700 }}>{copy.cloud.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {systems.filter((system) => system !== "ollama").join(", ") ||
                  copy.cloud.fallbackProviders}
              </Typography>
            </Flex>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              {copy.cloud.body}
            </Typography>
            {assistant === "cloud" ? (
              <Alert severity="warning" sx={{ ml: 4 }}>
                {assistantCloudNote(profile)}
              </Alert>
            ) : null}
          </Box>
        </OptionCard>
        <OptionCard selected={assistant === "none"} onClick={() => onSelect("none")}>
          <Box sx={{ display: "grid", gap: 1 }}>
            <Flex align="center" gap={1.25}>
              {assistant === "none" ? (
                <RadioButtonCheckedIcon color="primary" fontSize="small" />
              ) : (
                <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "#c2c9c2" }} />
              )}
              <Typography sx={{ fontWeight: 700 }}>{copy.none.title}</Typography>
            </Flex>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              {copy.none.body}
            </Typography>
          </Box>
        </OptionCard>
      </Box>
    </>
  );
}
