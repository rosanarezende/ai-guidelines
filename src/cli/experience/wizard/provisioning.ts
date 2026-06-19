import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { Prompts } from "../../../app/ports/Prompts.js";
import { detectFormatterContext } from "../../../domain/provisioning/FormatterContext.js";
import type { PackageJsonObject } from "../../../domain/provisioning/PackageJson.js";
import {
  DEFAULT_PROVIDERS,
  Provider,
  getSupportedProviders,
} from "../../../domain/provisioning/ProviderCatalog.js";
import {
  CollaborationProfile,
  COLLABORATION_PROFILES,
} from "../../../domain/provisioning/ReviewPolicyBaseline.js";
import {
  ReviewPolicy,
  activeReviewPolicyProfile,
  parseReviewPolicy,
} from "../../../infrastructure/yaml/reviewPolicyReader.js";
import {
  FLOW_COPY,
  copyLines,
  featureCopy,
  formatCopy,
  providerCopy,
} from "../../copy/flowCopy.js";
import { CommandContext } from "../../registry/Command.js";
import { CommandRegistry } from "../../registry/CommandRegistry.js";

const COMMON_COPY = FLOW_COPY.common;
const PROVISIONING_COPY = FLOW_COPY.provisioning;

export const PROVISIONING_OPERATIONS = ["init", "adopt", "update"] as const;
const INFRASTRUCTURE_UPDATE_FEATURES = ["prettier", "husky", "ci"] as const;
const EDITORIAL_UPDATE_FEATURES = ["quality-gates", "tdd", "bdd"] as const;

export type ProvisioningOperation = (typeof PROVISIONING_OPERATIONS)[number];

type ProvisioningMenuChoice =
  | ProvisioningOperation
  | "guided-update"
  | "details"
  | "policy"
  | "__back__";
type GovernedRepoUpdateChoice =
  | "runtime"
  | "providers"
  | "features"
  | "collaboration"
  | "policy"
  | "details"
  | "__back__";

export interface ProvisioningContextSummary {
  readonly operation: ProvisioningOperation;
  readonly workspaceShape: "empty" | "loose-files" | "package-repo" | "governed-repo";
  readonly stateTitle: string;
  readonly evidence: readonly string[];
  readonly guidance: string;
  readonly advancedReason: string;
  readonly formatterRivalLabel?: string;
  readonly hasPrettier?: boolean;
  readonly reviewPolicy?: ReviewPolicySummary;
}

interface ReviewPolicySummary {
  readonly path: string;
  readonly activeProfile: string;
  readonly implementationApprovals: number;
  readonly integrationApprovals: number;
  readonly codeOwnerReview: boolean;
  readonly lastPushApproval: boolean;
  readonly acceptedFindingsRequireResolution: boolean;
  readonly acceptedFindingsRequireVerificationEvent: boolean;
  readonly requirementsSummary: readonly string[];
}

export async function runProvisioningSection(
  repoRoot: string,
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts,
  detected: ProvisioningContextSummary = detectProvisioningContext(repoRoot)
): Promise<number> {
  const available = PROVISIONING_OPERATIONS.filter(
    (operation) => registry.resolve(operation) !== undefined
  );
  const recommended = available.includes(detected.operation) ? detected.operation : available[0];
  if (!recommended) {
    await prompts.note?.(
      PROVISIONING_COPY.section.emptyRegistry,
      PROVISIONING_COPY.section.emptyRegistryTitle
    );
    return 0;
  }

  await prompts.note?.(renderProvisioningContext(detected), provisioningMainLabel(detected));
  const selected = await prompts.select<ProvisioningMenuChoice>({
    message: PROVISIONING_COPY.section.question,
    choices:
      detected.operation === "update"
        ? governedRepoChoices(detected)
        : [
            {
              name: provisioningActionLabel(recommended),
              value: recommended,
              hint: PROVISIONING_COPY.section.recommendedHint,
            },
            { name: PROVISIONING_COPY.section.details, value: "details" },
            { name: COMMON_COPY.back, value: "__back__" },
          ],
  });
  if (selected === "__back__") return 0;
  if (selected === "details") {
    await prompts.note?.(
      renderProvisioningDetails(detected),
      PROVISIONING_COPY.section.detailsTitle
    );
    return 0;
  }
  if (selected === "policy") {
    await prompts.note?.(
      renderReviewPolicyDetails(detected),
      PROVISIONING_COPY.section.policyTitle
    );
    return 0;
  }
  if (selected === "guided-update") {
    return runGovernedRepoUpdate(registry, context, prompts, detected);
  }
  return runProvisioningCommand(selected, registry, context, prompts);
}

function governedRepoChoices(summary: ProvisioningContextSummary): ReadonlyArray<{
  readonly name: string;
  readonly value: ProvisioningMenuChoice;
  readonly hint?: string;
}> {
  return [
    {
      name: PROVISIONING_COPY.governedUpdate.choices.guidedUpdate,
      value: "guided-update",
      hint: PROVISIONING_COPY.governedUpdate.choices.guidedUpdateHint,
    },
    {
      name: PROVISIONING_COPY.governedUpdate.choices.policy,
      value: "policy",
      hint: summary.reviewPolicy
        ? `perfil atual: ${summary.reviewPolicy.activeProfile}`
        : PROVISIONING_COPY.governedUpdate.choices.policyHintFallback,
    },
    { name: PROVISIONING_COPY.section.details, value: "details" },
    { name: COMMON_COPY.back, value: "__back__" },
  ];
}

async function runGovernedRepoUpdate(
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts,
  detected: ProvisioningContextSummary
): Promise<number> {
  await prompts.note?.(
    copyLines(PROVISIONING_COPY.governedUpdate.intro),
    PROVISIONING_COPY.governedUpdate.introTitle
  );

  const selected = await prompts.select<GovernedRepoUpdateChoice>({
    message: PROVISIONING_COPY.governedUpdate.question,
    choices: [
      {
        name: PROVISIONING_COPY.governedUpdate.choices.runtime,
        value: "runtime",
        hint: PROVISIONING_COPY.governedUpdate.choices.runtimeHint,
      },
      {
        name: PROVISIONING_COPY.governedUpdate.choices.providers,
        value: "providers",
        hint: PROVISIONING_COPY.governedUpdate.choices.providersHint,
      },
      {
        name: PROVISIONING_COPY.governedUpdate.choices.features,
        value: "features",
        hint: PROVISIONING_COPY.governedUpdate.choices.featuresHint,
      },
      {
        name: PROVISIONING_COPY.governedUpdate.choices.collaboration,
        value: "collaboration",
        hint: detected.reviewPolicy
          ? `perfil atual: ${detected.reviewPolicy.activeProfile}`
          : PROVISIONING_COPY.governedUpdate.choices.collaborationHint,
      },
      {
        name: PROVISIONING_COPY.governedUpdate.choices.policy,
        value: "policy",
        hint: detected.reviewPolicy
          ? `perfil atual: ${detected.reviewPolicy.activeProfile}`
          : PROVISIONING_COPY.governedUpdate.choices.policyHint,
      },
      {
        name: PROVISIONING_COPY.governedUpdate.choices.details,
        value: "details",
      },
      { name: COMMON_COPY.back, value: "__back__" },
    ],
  });

  if (selected === "__back__") return 0;
  if (selected === "details") {
    await prompts.note?.(
      renderGovernedUpdateDetails(detected),
      PROVISIONING_COPY.governedUpdate.detailsTitle
    );
    return 0;
  }
  if (selected === "policy") {
    await prompts.note?.(
      renderReviewPolicyDetails(detected),
      PROVISIONING_COPY.section.policyTitle
    );
    return 0;
  }
  if (selected === "providers") {
    return runProvidersUpdate(registry, context, prompts);
  }
  if (selected === "features") {
    return runFeaturesUpdate(registry, context, prompts);
  }
  if (selected === "collaboration") {
    return runCollaborationProfileUpdate(registry, context, prompts);
  }
  return runProvisioningCommand("update", registry, context, prompts);
}

async function runProvidersUpdate(
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts
): Promise<number> {
  const providers = await promptProviderSelection(prompts);
  const normalized = providers.join(",");
  if (!normalized) {
    await prompts.outro?.(PROVISIONING_COPY.governedUpdate.providerEmpty);
    return 0;
  }
  await prompts.note?.(
    [
      ...PROVISIONING_COPY.governedUpdate.providerNote,
      `npx ai-guidelines update --providers ${normalized}`,
    ].join("\n"),
    PROVISIONING_COPY.governedUpdate.providerTitle
  );
  return (await registry.dispatch(["update", "--providers", normalized], context)).exitCode;
}

async function runCollaborationProfileUpdate(
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts
): Promise<number> {
  await prompts.note?.(
    copyLines(PROVISIONING_COPY.governedUpdate.policyChangeIntro),
    PROVISIONING_COPY.governedUpdate.policyChangeTitle
  );
  const profile = await promptCollaborationProfile(prompts);
  await prompts.note?.(
    [
      PROVISIONING_COPY.governedUpdate.policyChangeNote,
      "",
      PROVISIONING_COPY.governedUpdate.policyChangeSelected,
      `- ${collaborationProfileLabel(profile)}`,
      "",
      PROVISIONING_COPY.governedUpdate.commandLabel,
      `npx ai-guidelines update --collaboration-profile ${profile}`,
    ].join("\n"),
    PROVISIONING_COPY.governedUpdate.policyChangeTitle
  );
  const confirmed = await prompts.confirm({
    message: PROVISIONING_COPY.governedUpdate.policyChangeConfirm,
    default: false,
  });
  if (!confirmed) {
    await prompts.outro?.(PROVISIONING_COPY.governedUpdate.policyChangeCancelled);
    return 0;
  }
  return (await registry.dispatch(["update", "--collaboration-profile", profile], context))
    .exitCode;
}

async function promptProviderSelection(prompts: Prompts): Promise<readonly Provider[]> {
  const supported = getSupportedProviders();
  const groups = {
    [PROVISIONING_COPY.providerGroups.primary]: providerChoices(
      supported.filter((provider) => ["claude", "gemini", "openai", "copilot"].includes(provider))
    ),
    [PROVISIONING_COPY.providerGroups.local]: providerChoices(
      supported.filter((provider) => ["cursor", "windsurf", "aider"].includes(provider))
    ),
  };
  if (prompts.groupMultiselect) {
    return prompts.groupMultiselect({
      message: PROVISIONING_COPY.providerQuestion,
      groups,
      defaultValues: DEFAULT_PROVIDERS,
      required: true,
      maxItems: 7,
      groupSpacing: 1,
    });
  }
  if (prompts.multiselect) {
    return prompts.multiselect({
      message: PROVISIONING_COPY.providerQuestion,
      choices: [
        ...groups[PROVISIONING_COPY.providerGroups.primary],
        ...groups[PROVISIONING_COPY.providerGroups.local],
      ],
      defaultValues: DEFAULT_PROVIDERS,
      required: true,
    });
  }
  const value = await prompts.input({
    message: PROVISIONING_COPY.providerQuestion,
    default: DEFAULT_PROVIDERS.join(","),
  });
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is Provider => (supported as readonly string[]).includes(item));
}

async function promptCollaborationProfile(prompts: Prompts): Promise<CollaborationProfile> {
  return prompts.select<CollaborationProfile>({
    message: PROVISIONING_COPY.flow.prompts.collaborationProfile,
    choices: COLLABORATION_PROFILES.map((profile) => ({
      name: collaborationProfileLabel(profile),
      value: profile,
      hint: collaborationProfileHint(profile),
    })),
  });
}

async function runFeaturesUpdate(
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts
): Promise<number> {
  const infrastructureGroup = PROVISIONING_COPY.featureGroups.updateInfrastructure;
  const editorialGroup = PROVISIONING_COPY.featureGroups.updateEditorial;
  const choices = {
    [infrastructureGroup]: INFRASTRUCTURE_UPDATE_FEATURES.map((feature) => ({
      name: featureLabel(feature),
      value: feature,
      hint: featureHint(feature),
    })),
    [editorialGroup]: EDITORIAL_UPDATE_FEATURES.map((feature) => ({
      name: featureLabel(feature),
      value: feature,
      hint: featureHint(feature),
    })),
  };
  const selected = prompts.groupMultiselect
    ? await prompts.groupMultiselect({
        message: PROVISIONING_COPY.featureUpdateQuestion,
        groups: choices,
        required: true,
        groupSpacing: 1,
      })
    : await prompts.multiselect?.({
        message: PROVISIONING_COPY.featureUpdateQuestion,
        choices: [...choices[infrastructureGroup], ...choices[editorialGroup]],
        required: true,
      });

  const features = [...(selected ?? [])].map(String);
  if (features.length === 0) {
    await prompts.outro?.(PROVISIONING_COPY.governedUpdate.featuresEmpty);
    return 0;
  }
  const value = features.join(",");
  await prompts.note?.(
    [
      PROVISIONING_COPY.governedUpdate.featuresNoteHeading,
      "",
      PROVISIONING_COPY.governedUpdate.featuresSelected,
      ...features.map((feature) => `- ${featureLabel(feature)}`),
      "",
      PROVISIONING_COPY.governedUpdate.commandLabel,
      `npx ai-guidelines update --features ${value}`,
    ].join("\n"),
    PROVISIONING_COPY.governedUpdate.featuresTitle
  );
  return (await registry.dispatch(["update", "--features", value], context)).exitCode;
}

async function runProvisioningCommand(
  operation: ProvisioningOperation,
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts
): Promise<number> {
  await prompts.status?.(
    "step",
    `Abrindo ${operation}; preview e confirmação ficam no comando governado.`
  );
  return (await registry.dispatch([operation], context)).exitCode;
}

function topLevelEntries(repoRoot: string): readonly string[] {
  try {
    return readdirSync(repoRoot, { withFileTypes: true })
      .filter((entry) => entry.name !== ".git" && entry.name !== "node_modules")
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

function readPackageJson(repoRoot: string): PackageJsonObject | null {
  try {
    return JSON.parse(
      readFileSync(path.join(repoRoot, "package.json"), "utf-8")
    ) as PackageJsonObject;
  } catch {
    return null;
  }
}

export function detectProvisioningContext(repoRoot: string): ProvisioningContextSummary {
  const entries = topLevelEntries(repoRoot);
  const hasConfig = existsSync(path.join(repoRoot, ".ai-guidelines", "config.json"));
  const hasAiGuidelines = existsSync(path.join(repoRoot, ".ai-guidelines"));
  const hasGovernance = existsSync(path.join(repoRoot, ".governance"));
  const hasSpecify = existsSync(path.join(repoRoot, ".specify"));
  const hasPackageJson = existsSync(path.join(repoRoot, "package.json"));
  const formatter = detectFormatterContext({
    existingFiles: entries,
    packageJson: readPackageJson(repoRoot),
  });

  if (hasConfig || hasGovernance || hasAiGuidelines || hasSpecify) {
    const evidence = [
      hasConfig ? PROVISIONING_COPY.detected.evidence.config : null,
      hasGovernance ? PROVISIONING_COPY.detected.evidence.governance : null,
      hasAiGuidelines && !hasConfig ? PROVISIONING_COPY.detected.evidence.aiGuidelines : null,
      hasSpecify ? PROVISIONING_COPY.detected.evidence.specify : null,
    ].filter((item): item is string => item !== null);
    return {
      operation: "update",
      workspaceShape: "governed-repo",
      stateTitle: PROVISIONING_COPY.detected.governedTitle,
      evidence,
      guidance: PROVISIONING_COPY.detected.governedGuidance,
      advancedReason: PROVISIONING_COPY.detected.governedAdvancedReason,
      ...(formatter.rival ? { formatterRivalLabel: formatter.rival.label } : {}),
      hasPrettier: formatter.hasPrettier,
      reviewPolicy: readReviewPolicySummary(repoRoot),
    };
  }

  if (hasPackageJson) {
    return {
      operation: "adopt",
      workspaceShape: "package-repo",
      stateTitle: PROVISIONING_COPY.detected.existingTitle,
      evidence: [
        PROVISIONING_COPY.detected.evidence.packageJson,
        PROVISIONING_COPY.detected.evidence.noGovernedDirs,
      ],
      guidance: PROVISIONING_COPY.detected.existingGuidance,
      advancedReason: PROVISIONING_COPY.detected.existingAdvancedReason,
      ...(formatter.rival ? { formatterRivalLabel: formatter.rival.label } : {}),
      hasPrettier: formatter.hasPrettier,
    };
  }

  return {
    operation: "init",
    workspaceShape: entries.length === 0 ? "empty" : "loose-files",
    stateTitle: PROVISIONING_COPY.detected.newTitle,
    evidence: [
      entries.length === 0
        ? PROVISIONING_COPY.detected.evidence.emptyDirectory
        : PROVISIONING_COPY.detected.evidence.looseFiles,
      PROVISIONING_COPY.detected.evidence.noPackageJson,
      PROVISIONING_COPY.detected.evidence.noGovernedRuntime,
    ],
    guidance: PROVISIONING_COPY.detected.newGuidance,
    advancedReason: PROVISIONING_COPY.detected.newAdvancedReason,
    ...(formatter.rival ? { formatterRivalLabel: formatter.rival.label } : {}),
    hasPrettier: formatter.hasPrettier,
  };
}

function renderProvisioningContext(summary: ProvisioningContextSummary): string {
  const lines = [
    summary.stateTitle,
    "",
    PROVISIONING_COPY.section.detectedLabel,
    ...summary.evidence.map((item) => `- ${item}`),
    "",
    PROVISIONING_COPY.section.displayedOption,
    `- ${provisioningLabel(summary.operation)}`,
    "",
    summary.guidance,
  ];
  if (summary.operation === "update") {
    lines.push(
      "",
      PROVISIONING_COPY.section.alsoAvailable,
      PROVISIONING_COPY.section.updatePracticesLine,
      PROVISIONING_COPY.section.policyLine
    );
    if (summary.reviewPolicy) {
      lines.push(
        formatCopy(PROVISIONING_COPY.section.profileLine, {
          profile: summary.reviewPolicy.activeProfile,
        })
      );
    }
  }
  return lines.join("\n");
}

function renderProvisioningDetails(summary: ProvisioningContextSummary): string {
  return [
    "init",
    "- Use quando o diretório ainda não tem projeto/governança.",
    "",
    "adopt",
    "- Use quando o repositório já existe, mas ainda não foi adotado pelo ai-guidelines.",
    "",
    "update",
    "- Use quando o ai-guidelines já está instalado e você quer atualizar templates, runtime, providers, práticas ou política governada.",
    "",
    `Para este repo: ${summary.operation}.`,
    summary.guidance,
  ].join("\n");
}

function renderGovernedUpdateDetails(summary: ProvisioningContextSummary): string {
  return [...PROVISIONING_COPY.governedUpdate.details, "", renderReviewPolicyDetails(summary)].join(
    "\n"
  );
}

function renderReviewPolicyDetails(summary: ProvisioningContextSummary): string {
  const policy = summary.reviewPolicy;
  if (!policy) {
    return copyLines(PROVISIONING_COPY.policy.missing);
  }
  return [
    `${PROVISIONING_COPY.policy.source}: ${policy.path}`,
    `${PROVISIONING_COPY.policy.profile}: ${policy.activeProfile}`,
    "",
    PROVISIONING_COPY.policy.impact,
    `- ${PROVISIONING_COPY.policy.implementationApprovals}: ${policy.implementationApprovals}`,
    `- ${PROVISIONING_COPY.policy.integrationApprovals}: ${policy.integrationApprovals}`,
    `- ${PROVISIONING_COPY.policy.codeOwner}: ${policy.codeOwnerReview ? COMMON_COPY.yes : COMMON_COPY.no}`,
    `- ${PROVISIONING_COPY.policy.lastPush}: ${policy.lastPushApproval ? COMMON_COPY.yes : COMMON_COPY.no}`,
    `- ${PROVISIONING_COPY.policy.requiresResolution}: ${
      policy.acceptedFindingsRequireResolution ? COMMON_COPY.yes : COMMON_COPY.no
    }`,
    `- ${PROVISIONING_COPY.policy.requiresVerification}: ${
      policy.acceptedFindingsRequireVerificationEvent ? COMMON_COPY.yes : COMMON_COPY.no
    }`,
    "",
    PROVISIONING_COPY.policy.semanticReviews,
    ...policy.requirementsSummary.map((item) => `- ${item}`),
  ].join("\n");
}

function provisioningActionLabel(operation: ProvisioningOperation): string {
  return PROVISIONING_COPY.operationActionLabels[operation];
}

export function provisioningLabel(operation: ProvisioningOperation): string {
  return PROVISIONING_COPY.operationLabels[operation];
}

export function provisioningMainLabel(summary?: ProvisioningContextSummary): string {
  if (!summary) return "Configurar/adotar/atualizar repositório";
  return provisioningActionLabel(summary.operation);
}

export function provisioningMainHint(summary?: ProvisioningContextSummary): string | undefined {
  if (!summary) return undefined;
  return PROVISIONING_COPY.mainHints[summary.operation];
}

function readReviewPolicySummary(repoRoot: string): ReviewPolicySummary | undefined {
  const policyRelPath = ".governance/review-policy.yml";
  const policyPath = path.join(repoRoot, policyRelPath);
  if (!existsSync(policyPath)) return undefined;
  try {
    const policy = parseReviewPolicy(readFileSync(policyPath, "utf-8"));
    const profile = activeReviewPolicyProfile(policy);
    return {
      path: policyRelPath,
      activeProfile: policy.activeProfile,
      implementationApprovals: profile.implementationPr.requiredNativeApprovals,
      integrationApprovals: profile.integrationPr.requiredNativeApprovals,
      codeOwnerReview: profile.github.requireCodeOwnerReview,
      lastPushApproval: profile.github.requireLastPushApproval,
      acceptedFindingsRequireResolution: profile.acceptedFindings.requireResolution,
      acceptedFindingsRequireVerificationEvent:
        profile.acceptedFindings.requireVerificationEventForFixed,
      requirementsSummary: reviewRequirementsSummary(policy),
    };
  } catch {
    return undefined;
  }
}

function reviewRequirementsSummary(policy: ReviewPolicy): readonly string[] {
  const defaults = policy.requirements?.defaults ?? {};
  const entries = Object.entries(defaults).map(([type, level]) => `${type}: ${level}`);
  if (entries.length === 0) return [PROVISIONING_COPY.policy.noneRequired];
  return entries;
}

function featureLabel(feature: string): string {
  return featureCopy(feature).label;
}

function featureHint(feature: string): string {
  return featureCopy(feature).hint;
}

function providerChoices(providers: readonly Provider[]) {
  return providers.map((value) => ({
    name: providerCopy(value).label,
    value,
    hint: providerCopy(value).hint,
  }));
}

function collaborationProfileLabel(profile: CollaborationProfile): string {
  return PROVISIONING_COPY.collaborationProfiles[profile].label;
}

function collaborationProfileHint(profile: CollaborationProfile): string {
  return PROVISIONING_COPY.collaborationProfiles[profile].hint;
}
