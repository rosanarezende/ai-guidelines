import { Box, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { PROFILE_OPTIONS, type ProfileId } from "@/app/features/adoption/model";
import { Flex, ResponsiveGrid } from "@/app/ui/shared";
import { OptionCard } from "../../components";
import copy from "./locales/pt-br.json";

export function ManualProfileOptions({
  profile,
  onSelect,
}: {
  profile: ProfileId;
  onSelect: (profile: ProfileId) => void;
}) {
  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 800 }}>
        {copy.manualOptions.title}
      </Typography>
      <ResponsiveGrid min={220} gap={1.5}>
        {PROFILE_OPTIONS.map((option) => {
          const selected = option.id === profile;
          return (
            <OptionCard key={option.id} selected={selected} onClick={() => onSelect(option.id)}>
              <Box sx={{ display: "grid", gap: 1, alignContent: "start" }}>
                <Flex justify="space-between" align="center" gap={1}>
                  <Typography sx={{ fontWeight: 800 }}>{option.label}</Typography>
                  {selected ? (
                    <CheckCircleIcon color="primary" fontSize="small" />
                  ) : (
                    <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "#c2c9c2" }} />
                  )}
                </Flex>
                <Typography variant="caption" sx={{ color: "text.primary" }}>
                  {option.bestWhen}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1 }}
                >
                  {option.tradeoff}
                </Typography>
              </Box>
            </OptionCard>
          );
        })}
      </ResponsiveGrid>
    </Box>
  );
}
