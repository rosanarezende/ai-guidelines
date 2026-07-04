import { Box, Card, CardActionArea, Paper, Typography } from "@mui/material";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import type { ReactNode } from "react";
import { Flex, ResponsiveGrid } from "@/app/ui/shared";
import type { DiagnosisChoice } from "../diagnosis";
import copy from "./locales/pt-br.json";

export function WelcomeCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, display: "flex", gap: 1.75, alignItems: "flex-start" }}>
      <Box sx={{ color: "primary.main", mt: 0.25 }}>{icon}</Box>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {text}
        </Typography>
      </Box>
    </Paper>
  );
}

export function DiagnosisQuestion({
  title,
  helper,
  value,
  options,
  onChange,
}: {
  title: string;
  helper: string;
  value?: string;
  options: DiagnosisChoice[];
  onChange: (value: string) => void;
}) {
  return (
    <Box sx={{ display: "grid", gap: 1.25 }}>
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
              <Box sx={{ display: "grid", gap: 0.75 }}>
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

export function ProfileDetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <Box sx={{ display: "grid", gap: 0.75 }}>
      <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary" }}>
        {title}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.25, display: "grid", gap: 0.65 }}>
        {items.map((item) => (
          <Typography
            key={item}
            component="li"
            variant="body2"
            color="text.secondary"
            sx={{ pl: 0.25 }}
          >
            {item}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

export function StepHeading({ step, title, lead }: { step: number; title: string; lead: string }) {
  return (
    <Box sx={{ display: "grid", gap: 0.75 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
        {copy.stepHeading.prefix} {step} {copy.stepHeading.of} 6
      </Typography>
      <Typography sx={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.3px" }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
        {lead}
      </Typography>
    </Box>
  );
}

export function OptionCard({
  selected,
  onClick,
  children,
  disabled = false,
}: {
  selected: boolean;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        opacity: disabled ? 0.6 : 1,
        borderColor: selected ? "primary.main" : "divider",
        borderWidth: selected ? 2 : 1,
        bgcolor: selected ? "#f4f9f5" : "background.paper",
      }}
    >
      <CardActionArea
        disabled={disabled || !onClick}
        onClick={onClick}
        sx={{ height: "100%", p: 2 }}
      >
        {children}
      </CardActionArea>
    </Card>
  );
}
