import { OnboardingStep } from "../../acme-design-system/src/index.mjs";
import { conversionEvent } from "../../acme-analytics/src/index.mjs";
import { updateConsent } from "../../acme-identity/src/index.mjs";

const steps = [
  { title: "Connect your account", body: "Confirm workspace and billing owner." },
  { title: "Invite the team", body: "Add teammates before the first campaign." },
  { title: "Review analytics consent", body: "Enable measurement for activation experiments." },
];

export function renderOnboardingTour({ step = 1 }) {
  const selected = steps[step - 1] ?? steps[0];
  return OnboardingStep({ ...selected, step, total: steps.length });
}

export function completeOnboardingStep({ sessionId, step }) {
  if (step === 3) updateConsent(sessionId, { analytics: true });
  conversionEvent({ name: "onboarding_step_seen", accountId: "acct-growth", value: step });
  return { step, completed: true };
}
