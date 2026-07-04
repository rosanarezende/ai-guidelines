"use client";

import { Box, Chip, Paper, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import LockIcon from "@mui/icons-material/Lock";
import { Flex } from "@/app/_ui/shared";
import { STEP_LABELS } from "../../_model/diagnosis";
import { useOnboarding } from "../../_state/OnboardingContext";
import copy from "./_locales/pt-br.json";

export function OnboardingStepper() {
  const { step } = useOnboarding();
  return (
    <Box sx={{ position: { md: "sticky" }, top: 86, alignSelf: "start" }}>
      {STEP_LABELS.map((label, index) => {
        const number = index + 1;
        const current = number === step;
        const done = number < step;
        return (
          <Flex key={label} gap={1.25} align="center" sx={{ py: 1 }}>
            <Chip
              size="small"
              label={done ? <CheckIcon sx={{ fontSize: 15 }} /> : number}
              color={current || done ? "primary" : "default"}
              variant={current || done ? "filled" : "outlined"}
              sx={{ width: 28, height: 28 }}
            />
            <Typography
              variant="body2"
              sx={{
                fontWeight: current ? 800 : done ? 700 : 500,
                color: current ? "text.primary" : done ? "text.primary" : "text.secondary",
              }}
            >
              {label}
            </Typography>
          </Flex>
        );
      })}
      <Paper
        variant="outlined"
        sx={{ mt: 2, p: 1.5, borderStyle: "dashed", display: "flex", gap: 1.25 }}
      >
        <LockIcon sx={{ fontSize: 17, color: "text.secondary", mt: 0.25 }} />
        <Typography variant="caption" color="text.secondary">
          {copy.stepper.privacyNotice}
        </Typography>
      </Paper>
    </Box>
  );
}
