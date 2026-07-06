import { Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Flex } from "@/app/_ui/shared";
import { useOnboarding } from "../../_state/OnboardingContext";
import copy from "./_locales/pt-br.json";

export function OnboardingActions() {
  const { step, canContinueProfileStep, continueStep, setStep } = useOnboarding();
  if (step < 1 || step > 5) return null;
  return (
    <Flex
      justify="space-between"
      align="center"
      sx={{ pt: 2, borderTop: "1px solid", borderColor: "divider" }}
    >
      <Button
        color="inherit"
        startIcon={<ArrowBackIcon />}
        disabled={step === 1}
        onClick={() => setStep(step - 1)}
      >
        {copy.actions.back}
      </Button>
      <Button
        data-testid={step === 1 ? "onboarding-save-profile" : undefined}
        variant="contained"
        endIcon={<ArrowForwardIcon />}
        disabled={step === 1 && !canContinueProfileStep}
        onClick={() => void continueStep()}
      >
        {copy.actions.next}
      </Button>
    </Flex>
  );
}
