import { Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Flex } from "@/app/ui/shared";
import copy from "./locales/pt-br.json";

export function OnboardingActions({
  step,
  canContinueProfileStep,
  onBack,
  onNext,
}: {
  step: number;
  canContinueProfileStep: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  if (step < 1 || step > 5) return null;
  return (
    <Flex
      justify="space-between"
      align="center"
      sx={{ pt: 2, borderTop: "1px solid", borderColor: "divider" }}
    >
      <Button color="inherit" startIcon={<ArrowBackIcon />} disabled={step === 1} onClick={onBack}>
        {copy.actions.back}
      </Button>
      <Button
        variant="contained"
        endIcon={<ArrowForwardIcon />}
        disabled={step === 1 && !canContinueProfileStep}
        onClick={onNext}
      >
        {copy.actions.next}
      </Button>
    </Flex>
  );
}
