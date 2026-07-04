import { useOnboarding } from "../../_state/OnboardingContext";
import { AssistantStep } from "../../_steps/AssistantStep";
import { IntegrationsStep } from "../../_steps/IntegrationsStep";
import { PeopleStep } from "../../_steps/PeopleStep";
import { ProfileDiagnosisStep } from "../../_steps/ProfileDiagnosisStep";
import { ReviewStep } from "../../_steps/ReviewStep";
import { SourcesStep } from "../../_steps/SourcesStep";

export function OnboardingStepContent() {
  const { step } = useOnboarding();

  if (step === 1) return <ProfileDiagnosisStep />;
  if (step === 2) return <PeopleStep />;
  if (step === 3) return <SourcesStep />;
  if (step === 4) return <AssistantStep />;
  if (step === 5) return <IntegrationsStep />;
  if (step === 6) return <ReviewStep />;
  return null;
}
