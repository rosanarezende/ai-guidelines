import { Alert, Box, Button, Chip, Paper, Typography } from "@mui/material";
import { Flex, ResponsiveGrid } from "@/app/_ui/shared";
import type { ProfileId, ProfileOption } from "@/app/_domain/adoption/model";
import type { ConflictPolicy } from "../../_model/diagnosis";
import { ProfileDetailList } from "../../_components";
import { useOnboarding } from "../../_state/OnboardingContext";
import copy from "./_locales/pt-br.json";

export function RecommendationCard() {
  const {
    conflictPolicy,
    effectiveProfile,
    manualProfileOpen,
    manualProfileSelected,
    profile,
    recommendedProfile,
    recommendedProfileId,
    selectedProfile,
    setManualProfileOpen,
    shouldShowConflictPolicy,
    shouldShowManualOverrideNotice,
    useRecommendedProfile,
  } = useOnboarding();

  return (
    <Paper
      data-testid="profile-recommendation-card"
      variant="outlined"
      sx={{ p: 2.25, display: "grid", gap: 1.75, bgcolor: "#f8fbf8", borderColor: "#d9e8dd" }}
    >
      <Flex align="center" justify="space-between" gap={1.5} wrap>
        <Box>
          <Flex align="center" gap={1} wrap>
            <Chip
              size="small"
              color={manualProfileSelected ? "default" : "success"}
              label={
                manualProfileSelected
                  ? copy.recommendation.manualLabel
                  : copy.recommendation.recommendedLabel
              }
            />
            <Typography sx={{ fontSize: 18, fontWeight: 800 }}>{effectiveProfile.label}</Typography>
          </Flex>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {deriveRecommendationSubtitle({
              manualProfileSelected,
              profile,
              recommendedProfileId,
              recommendedProfile,
              effectiveProfile,
            })}
          </Typography>
        </Box>
        <Flex gap={1} wrap>
          {manualProfileSelected && profile !== recommendedProfileId ? (
            <Button size="small" variant="outlined" onClick={useRecommendedProfile}>
              {copy.recommendation.useRecommendation}
            </Button>
          ) : null}
          <Button
            size="small"
            color="inherit"
            onClick={() => setManualProfileOpen((current) => !current)}
          >
            {manualProfileOpen ? copy.recommendation.hideOptions : copy.recommendation.showOptions}
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

      <Alert data-testid="profile-policy-impact" severity={effectiveProfile.enforcement.severity}>
        <strong>{effectiveProfile.enforcement.verb}:</strong> {effectiveProfile.enforcement.text}
      </Alert>
    </Paper>
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

function deriveRecommendationSubtitle({
  manualProfileSelected,
  profile,
  recommendedProfileId,
  recommendedProfile,
  effectiveProfile,
}: {
  manualProfileSelected: boolean;
  profile: ProfileId;
  recommendedProfileId: ProfileId;
  recommendedProfile: ProfileOption;
  effectiveProfile: ProfileOption;
}) {
  if (manualProfileSelected && profile !== recommendedProfileId) {
    return copy.recommendation.recommendedByAnswers.replace("{profile}", recommendedProfile.label);
  }
  if (manualProfileSelected) return copy.recommendation.manualWithoutAnswers;
  return effectiveProfile.bestWhen;
}
