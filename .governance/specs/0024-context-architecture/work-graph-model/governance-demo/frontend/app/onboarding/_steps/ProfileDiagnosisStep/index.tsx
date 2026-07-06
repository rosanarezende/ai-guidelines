import { Alert, Box, Button } from "@mui/material";
import {
  CONFLICT_CHOICES,
  RESPONSIBILITY_CHOICES,
  SIZE_CHOICES,
  type ConflictChoice,
  type OrgSizeChoice,
  type ResponsibilityChoice,
} from "../../_model/diagnosis";
import { DiagnosisQuestion, StepHeading } from "../../_components";
import { useOnboarding } from "../../_state/OnboardingContext";
import { ManualProfileOptions } from "./ManualProfileOptions";
import { RecommendationCard } from "./RecommendationCard";
import copy from "./_locales/pt-br.json";

export function ProfileDiagnosisStep() {
  const {
    diagnosis,
    hasRecommendation,
    manualProfileOpen,
    manualProfileSelected,
    shouldAskConflict,
    shouldAskResponsibility,
    setManualProfileOpen,
    updateDiagnosis,
  } = useOnboarding();

  return (
    <>
      <StepHeading step={1} title={copy.heading.title} lead={copy.heading.lead} />
      <Box sx={{ display: "grid", gap: 2.5 }}>
        <DiagnosisQuestion
          title={copy.questions.size.title}
          helper={copy.questions.size.helper}
          value={diagnosis.size}
          options={SIZE_CHOICES}
          optionTestIds={{
            one: "org-size-solo",
            small: "org-size-up-to-5",
            large: "org-size-more-than-20",
          }}
          onChange={(value) => updateDiagnosis({ size: value as OrgSizeChoice })}
        />
        {diagnosis.size === "one" ? (
          <Alert data-testid="solo-profile-explanation" severity="info">
            {copy.explanations.solo}
          </Alert>
        ) : null}
        {diagnosis.size === "large" ? (
          <Alert data-testid="sod-explanation" severity="info">
            {copy.explanations.sod}
          </Alert>
        ) : null}
        {shouldAskResponsibility ? (
          <DiagnosisQuestion
            containerTestId="role-separation-question"
            title={copy.questions.responsibility.title}
            helper={copy.questions.responsibility.helper}
            value={diagnosis.responsibility}
            options={RESPONSIBILITY_CHOICES}
            optionTestIds={{
              collapsed: "responsibility-collapsed",
            }}
            onChange={(value) => updateDiagnosis({ responsibility: value as ResponsibilityChoice })}
          />
        ) : null}
        {shouldAskConflict ? (
          <DiagnosisQuestion
            title={copy.questions.conflict.title}
            helper={copy.questions.conflict.helper}
            value={diagnosis.conflict}
            options={CONFLICT_CHOICES}
            optionTestIds={{
              warn: "sensitive-policy-review",
            }}
            onChange={(value) => updateDiagnosis({ conflict: value as ConflictChoice })}
          />
        ) : null}
        {diagnosis.size ? (
          <Button
            data-testid="change-profile-answers"
            color="inherit"
            size="small"
            sx={{ justifySelf: "start" }}
            onClick={() => setManualProfileOpen(false)}
          >
            {copy.questions.changeAnswers}
          </Button>
        ) : null}
      </Box>

      {hasRecommendation || manualProfileSelected ? (
        <RecommendationCard />
      ) : (
        <Alert
          severity="info"
          action={
            <Button size="small" color="inherit" onClick={() => setManualProfileOpen(true)}>
              {copy.recommendation.manualCta}
            </Button>
          }
        >
          {copy.recommendation.empty}
        </Alert>
      )}

      {manualProfileOpen ? <ManualProfileOptions /> : null}
    </>
  );
}
