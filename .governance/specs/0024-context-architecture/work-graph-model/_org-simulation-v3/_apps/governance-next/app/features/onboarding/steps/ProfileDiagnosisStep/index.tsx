import { Alert, Box, Button } from "@mui/material";
import type { ProfileId, ProfileOption } from "@/app/features/adoption/model";
import {
  CONFLICT_CHOICES,
  RESPONSIBILITY_CHOICES,
  SIZE_CHOICES,
  type ConflictChoice,
  type ConflictPolicy,
  type DiagnosisAnswers,
  type OrgSizeChoice,
  type ResponsibilityChoice,
} from "../../diagnosis";
import { DiagnosisQuestion, StepHeading } from "../../components";
import { ManualProfileOptions } from "./ManualProfileOptions";
import { RecommendationCard } from "./RecommendationCard";
import copy from "./locales/pt-br.json";

export function ProfileDiagnosisStep({
  diagnosis,
  profile,
  recommendedProfileId,
  recommendedProfile,
  selectedProfile,
  effectiveProfile,
  shouldAskResponsibility,
  shouldAskConflict,
  hasRecommendation,
  manualProfileSelected,
  manualProfileOpen,
  conflictPolicy,
  shouldShowConflictPolicy,
  shouldShowManualOverrideNotice,
  updateDiagnosis,
  setProfile,
  setManualProfileOpen,
  setManualProfileSelected,
}: {
  diagnosis: DiagnosisAnswers;
  profile: ProfileId;
  recommendedProfileId: ProfileId;
  recommendedProfile: ProfileOption;
  selectedProfile: ProfileOption;
  effectiveProfile: ProfileOption;
  shouldAskResponsibility: boolean;
  shouldAskConflict: boolean;
  hasRecommendation: boolean;
  manualProfileSelected: boolean;
  manualProfileOpen: boolean;
  conflictPolicy: ConflictPolicy | null;
  shouldShowConflictPolicy: boolean;
  shouldShowManualOverrideNotice: boolean;
  updateDiagnosis: (patch: Partial<DiagnosisAnswers>) => void;
  setProfile: (profile: ProfileId) => void;
  setManualProfileOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  setManualProfileSelected: (value: boolean) => void;
}) {
  return (
    <>
      <StepHeading step={1} title={copy.heading.title} lead={copy.heading.lead} />
      <Box sx={{ display: "grid", gap: 2.5 }}>
        <DiagnosisQuestion
          title={copy.questions.size.title}
          helper={copy.questions.size.helper}
          value={diagnosis.size}
          options={SIZE_CHOICES}
          onChange={(value) => updateDiagnosis({ size: value as OrgSizeChoice })}
        />
        {shouldAskResponsibility ? (
          <DiagnosisQuestion
            title={copy.questions.responsibility.title}
            helper={copy.questions.responsibility.helper}
            value={diagnosis.responsibility}
            options={RESPONSIBILITY_CHOICES}
            onChange={(value) => updateDiagnosis({ responsibility: value as ResponsibilityChoice })}
          />
        ) : null}
        {shouldAskConflict ? (
          <DiagnosisQuestion
            title={copy.questions.conflict.title}
            helper={copy.questions.conflict.helper}
            value={diagnosis.conflict}
            options={CONFLICT_CHOICES}
            onChange={(value) => updateDiagnosis({ conflict: value as ConflictChoice })}
          />
        ) : null}
      </Box>

      {hasRecommendation || manualProfileSelected ? (
        <RecommendationCard
          profile={profile}
          recommendedProfileId={recommendedProfileId}
          recommendedProfile={recommendedProfile}
          selectedProfile={selectedProfile}
          effectiveProfile={effectiveProfile}
          manualProfileSelected={manualProfileSelected}
          manualProfileOpen={manualProfileOpen}
          conflictPolicy={conflictPolicy}
          shouldShowConflictPolicy={shouldShowConflictPolicy}
          shouldShowManualOverrideNotice={shouldShowManualOverrideNotice}
          setProfile={setProfile}
          setManualProfileOpen={setManualProfileOpen}
          setManualProfileSelected={setManualProfileSelected}
        />
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

      {manualProfileOpen ? (
        <ManualProfileOptions
          profile={profile}
          onSelect={(option) => {
            setProfile(option);
            setManualProfileOpen(true);
            setManualProfileSelected(true);
          }}
        />
      ) : null}
    </>
  );
}
