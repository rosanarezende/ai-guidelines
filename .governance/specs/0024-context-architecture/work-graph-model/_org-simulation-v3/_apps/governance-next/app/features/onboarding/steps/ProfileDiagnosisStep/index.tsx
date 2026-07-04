import { Alert, Box, Button, Chip, Paper, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Flex, ResponsiveGrid } from "@/app/ui/shared/components";
import { PROFILE_OPTIONS, type ProfileId, type ProfileOption } from "@/app/features/adoption/model";
import {
  CONFLICT_CHOICES,
  CONFLICT_POLICIES,
  RESPONSIBILITY_CHOICES,
  SIZE_CHOICES,
  type ConflictChoice,
  type ConflictPolicy,
  type DiagnosisAnswers,
  type OrgSizeChoice,
  type ResponsibilityChoice,
} from "../../diagnosis";
import { DiagnosisQuestion, OptionCard, ProfileDetailList, StepHeading } from "../../components";
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
        <Paper
          variant="outlined"
          sx={{ p: 2.25, display: "grid", gap: 1.75, bgcolor: "#f8fbf8", borderColor: "#d9e8dd" }}
        >
          <Flex align="center" justify="space-between" gap={1.5} wrap>
            <Box>
              <Flex align="center" gap={1} wrap>
                <Chip
                  size="small"
                  color={manualProfileSelected && !hasRecommendation ? "default" : "success"}
                  label={
                    manualProfileSelected && !hasRecommendation
                      ? copy.recommendation.manualLabel
                      : manualProfileSelected
                        ? copy.recommendation.manualLabel
                        : copy.recommendation.recommendedLabel
                  }
                />
                <Typography sx={{ fontSize: 18, fontWeight: 800 }}>
                  {effectiveProfile.label}
                </Typography>
              </Flex>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {manualProfileSelected && hasRecommendation && profile !== recommendedProfileId
                  ? copy.recommendation.recommendedByAnswers.replace(
                      "{profile}",
                      recommendedProfile.label
                    )
                  : manualProfileSelected && !hasRecommendation
                    ? copy.recommendation.manualWithoutAnswers
                    : effectiveProfile.bestWhen}
              </Typography>
            </Box>
            <Flex gap={1} wrap>
              {manualProfileSelected && hasRecommendation && profile !== recommendedProfileId ? (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setProfile(recommendedProfileId);
                    setManualProfileOpen(false);
                    setManualProfileSelected(false);
                  }}
                >
                  {copy.recommendation.useRecommendation}
                </Button>
              ) : null}
              <Button
                size="small"
                color="inherit"
                onClick={() => setManualProfileOpen((current) => !current)}
              >
                {manualProfileOpen
                  ? copy.recommendation.hideOptions
                  : copy.recommendation.showOptions}
              </Button>
            </Flex>
          </Flex>

          <Typography variant="body2" color="text.secondary">
            {effectiveProfile.description}
          </Typography>

          {shouldShowConflictPolicy && conflictPolicy ? (
            <ConflictPolicyCard conflictPolicy={conflictPolicy} />
          ) : null}

          {shouldShowManualOverrideNotice && conflictPolicy ? (
            <Alert severity="warning">
              <strong>{copy.recommendation.manualOverride.strong}</strong>{" "}
              {copy.recommendation.manualOverride.body
                .replace("{profile}", recommendedProfile.label)
                .replace("{rule}", selectedProfile.enforcement.text)}
            </Alert>
          ) : null}

          <ResponsiveGrid min={210} gap={1.5}>
            <ProfileDetailList
              title={copy.recommendation.columns.will}
              items={effectiveProfile.appWill}
            />
            <ProfileDetailList
              title={copy.recommendation.columns.willNot}
              items={effectiveProfile.appWillNot}
            />
            <ProfileDetailList
              title={copy.recommendation.columns.risks}
              items={effectiveProfile.visibleRisks}
            />
          </ResponsiveGrid>

          <Flex wrap gap={0.75} align="center">
            <Typography variant="caption" color="text.secondary">
              {copy.recommendation.changes}
            </Typography>
            {effectiveProfile.ceremony.map((item) => (
              <Chip
                key={item}
                size="small"
                label={item}
                sx={{ bgcolor: "#eaf1ec", color: "#1a5632" }}
              />
            ))}
          </Flex>

          <Alert severity={effectiveProfile.enforcement.severity}>
            <strong>{effectiveProfile.enforcement.verb}:</strong>{" "}
            {effectiveProfile.enforcement.text}
          </Alert>
        </Paper>
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

function ConflictPolicyCard({ conflictPolicy }: { conflictPolicy: ConflictPolicy }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.75,
        display: "grid",
        gap: 1,
        bgcolor:
          conflictPolicy.severity === "error"
            ? "#fff5f5"
            : conflictPolicy.severity === "warning"
              ? "#fff9ed"
              : "#eef8ff",
        borderColor:
          conflictPolicy.severity === "error"
            ? "#f3c7c7"
            : conflictPolicy.severity === "warning"
              ? "#edd8a8"
              : "#cce7f8",
      }}
    >
      <Flex align="center" gap={1} wrap>
        <Chip
          size="small"
          color={conflictPolicy.severity}
          variant="outlined"
          label={copy.policyCard.label}
        />
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {conflictPolicy.label}
        </Typography>
      </Flex>
      <Typography variant="body2" color="text.secondary">
        {conflictPolicy.summary}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {conflictPolicy.effect}
      </Typography>
    </Paper>
  );
}

function ManualProfileOptions({
  profile,
  onSelect,
}: {
  profile: ProfileId;
  onSelect: (profile: ProfileId) => void;
}) {
  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 800 }}>
        {copy.manualOptions.title}
      </Typography>
      <ResponsiveGrid min={220} gap={1.5}>
        {PROFILE_OPTIONS.map((option) => {
          const selected = option.id === profile;
          return (
            <OptionCard key={option.id} selected={selected} onClick={() => onSelect(option.id)}>
              <Box sx={{ display: "grid", gap: 1, alignContent: "start" }}>
                <Flex justify="space-between" align="center" gap={1}>
                  <Typography sx={{ fontWeight: 800 }}>{option.label}</Typography>
                  {selected ? (
                    <CheckCircleIcon color="primary" fontSize="small" />
                  ) : (
                    <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "#c2c9c2" }} />
                  )}
                </Flex>
                <Typography variant="caption" sx={{ color: "text.primary" }}>
                  {option.bestWhen}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1 }}
                >
                  {option.tradeoff}
                </Typography>
              </Box>
            </OptionCard>
          );
        })}
      </ResponsiveGrid>
    </Box>
  );
}
