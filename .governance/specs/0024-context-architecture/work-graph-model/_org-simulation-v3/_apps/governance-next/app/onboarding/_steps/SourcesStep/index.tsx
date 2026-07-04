import { Alert, Box, Chip, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Flex, ResponsiveGrid } from "@/app/_ui/shared";
import {
  NO_SOURCE_DOWNGRADE,
  SOURCE_KINDS,
} from "@/app/_domain/adoption/model";
import { OptionCard, StepHeading } from "../../_components";
import { useOnboarding } from "../../_state/OnboardingContext";
import copy from "./_locales/pt-br.json";

export function SourcesStep() {
  const { adoption, selectedSourceCount, sourceKinds, toggleSource } = useOnboarding();
  return (
    <>
      <StepHeading step={3} title={copy.heading.title} lead={copy.heading.lead} />
      <ResponsiveGrid min={280} gap={1.5}>
        {SOURCE_KINDS.map((kind) => {
          const selected = !kind.disabled && sourceKinds[kind.id];
          return (
            <OptionCard
              key={kind.id}
              selected={selected}
              disabled={kind.disabled}
              onClick={kind.disabled ? undefined : () => toggleSource(kind.id)}
            >
              <Flex gap={1.5} align="flex-start">
                {selected ? (
                  <CheckCircleIcon color="primary" fontSize="small" sx={{ mt: 0.25 }} />
                ) : (
                  <RadioButtonUncheckedIcon fontSize="small" sx={{ mt: 0.25, color: "#c2c9c2" }} />
                )}
                <Box>
                  <Flex align="center" gap={1} wrap>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {kind.name}
                    </Typography>
                    {kind.tag ? <Chip size="small" variant="outlined" label={kind.tag} /> : null}
                  </Flex>
                  <Typography variant="caption" color="text.secondary">
                    {kind.desc}
                  </Typography>
                </Box>
              </Flex>
            </OptionCard>
          );
        })}
      </ResponsiveGrid>
      {selectedSourceCount > 0 ? (
        <Alert severity="success">
          {copy.success
            .replace("{count}", String(selectedSourceCount))
            .replace("{connected}", String(adoption.sourcesConnected))
            .replace("{total}", String(adoption.sources.length))}
        </Alert>
      ) : (
        <Alert severity="warning">
          {NO_SOURCE_DOWNGRADE} {copy.warningSuffix}
        </Alert>
      )}
    </>
  );
}
