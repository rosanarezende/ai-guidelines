"use client";

import { Box, ButtonBase, Chip, Paper, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import LockIcon from "@mui/icons-material/Lock";
import { Flex } from "@/app/_ui/shared";
import { STEP_LABELS } from "../../_model/diagnosis";
import { useOnboarding } from "../../_state/OnboardingContext";
import copy from "./_locales/pt-br.json";

export function OnboardingStepper() {
  const { setStep, step } = useOnboarding();
  return (
    <Box sx={{ position: { md: "sticky" }, top: 86, alignSelf: "start" }}>
      {STEP_LABELS.map((label, index) => {
        const number = index + 1;
        const current = number === step;
        const done = number < step;
        const testId =
          number === 6
            ? "onboarding-review-step"
            : number === 5
              ? "onboarding-step-integrations"
              : number === 3
                ? "onboarding-step-sources"
                : `onboarding-step-${String(number).padStart(2, "0")}`;
        return (
          <ButtonBase
            key={label}
            data-testid={testId}
            onClick={() => setStep(number)}
            sx={{
              width: "100%",
              justifyContent: "flex-start",
              borderRadius: 1,
              px: 0.75,
              py: 0.25,
              textAlign: "left",
            }}
          >
            <Flex gap={1.25} align="center" sx={{ py: 1, width: "100%" }}>
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
          </ButtonBase>
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
