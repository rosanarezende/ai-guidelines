import { Box, Typography } from "@mui/material";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Flex, ResponsiveGrid } from "@/app/_ui/shared";
import type { DiagnosisChoice } from "../_model/diagnosis";
import { OptionCard } from "./OptionCard";

export function DiagnosisQuestion({
  title,
  helper,
  value,
  options,
  containerTestId,
  optionTestIds,
  onChange,
}: {
  title: string;
  helper: string;
  value?: string;
  options: DiagnosisChoice[];
  containerTestId?: string;
  optionTestIds?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <Box data-testid={containerTestId} sx={{ display: "grid", gap: 1.25 }}>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      </Box>
      <ResponsiveGrid min={190} gap={1}>
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <OptionCard key={option.id} selected={selected} onClick={() => onChange(option.id)}>
              <Box data-testid={optionTestIds?.[option.id]} sx={{ display: "grid", gap: 0.75 }}>
                <Flex align="center" justify="space-between" gap={1}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {option.label}
                  </Typography>
                  {selected ? (
                    <RadioButtonCheckedIcon color="primary" fontSize="small" />
                  ) : (
                    <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "#c2c9c2" }} />
                  )}
                </Flex>
                <Typography variant="caption" color="text.secondary">
                  {option.description}
                </Typography>
              </Box>
            </OptionCard>
          );
        })}
      </ResponsiveGrid>
    </Box>
  );
}
