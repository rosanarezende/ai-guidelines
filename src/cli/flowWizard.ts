import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { ClipboardWriter } from "../app/ports/ClipboardWriter.js";
import { isPromptCancelled, Prompts } from "../app/ports/Prompts.js";
import {
  ReviewPolicy,
  activeReviewPolicyProfile,
  parseReviewPolicy,
} from "../infrastructure/yaml/reviewPolicyReader.js";
import {
  DEFAULT_PROVIDERS,
  Provider,
  getSupportedProviders,
} from "../domain/provisioning/ProviderCatalog.js";
import {
  CollaborationProfile,
  COLLABORATION_PROFILES,
} from "../domain/provisioning/ReviewPolicyBaseline.js";
import { detectFormatterContext } from "../domain/provisioning/FormatterContext.js";
import type { PackageJsonObject } from "../domain/provisioning/PackageJson.js";
import { NodeClipboard, clipboardInstallHint } from "../infrastructure/io/NodeClipboard.js";
import { CockpitModel, collectCockpitModel, renderCockpit } from "./cockpit.js";
import { FLOW_COPY, copyLines, featureCopy, formatCopy, providerCopy } from "./copy/flowCopy.js";
import type { HumanObjectSummary, HumanSummary } from "./flow/GovernedFlow.js";
import {
  LoadActiveSpecsIndex,
  loadActiveSpecsIndex,
} from "./registry/commands/loadActiveSpecsIndex.js";
import type { ResolvedActiveSpec } from "../app/workflow/ListActiveSpecs.js";
import { CommandRegistry } from "./registry/CommandRegistry.js";
import { CommandContext, Logger } from "./registry/Command.js";

const PROVISIONING_OPERATIONS = ["init", "adopt", "update"] as const;
const INFRASTRUCTURE_UPDATE_FEATURES = ["prettier", "husky", "ci"] as const;
const EDITORIAL_UPDATE_FEATURES = ["quality-gates", "tdd", "bdd"] as const;

type ProvisioningOperation = (typeof PROVISIONING_OPERATIONS)[number];

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
type PeerReviewMode = "worktree" | "checkout";

const COMMON_COPY = FLOW_COPY.common;
const WIZARD_COPY = FLOW_COPY.wizard;
const PROVISIONING_COPY = FLOW_COPY.provisioning;
type AdvancedMenuChoice = "drift" | "visual-prompt" | "publication" | "final-ops" | "__back__";
type SpecWorkMenuChoice =
  | "choose-spec"
  | "active-specs"
  | "continue-other"
  | "new-spec"
  | "__back__";
type SpecSelectionChoice = string | "__manual__" | "__back__";

interface ProvisioningContextSummary {
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

interface ContextGuidance {
  readonly repository: readonly string[];
  readonly collaboration: readonly string[];
  readonly specs: readonly string[];
  readonly dailyWork: readonly string[];
  readonly safety: readonly string[];
}

export type FlowMenuValue =
  | "cockpit"
  | "next"
  | "alternative"
  | "validate"
  | "decisions"
  | "blockers"
  | "work"
  | "review"
  | "peer-review"
  | "spec-work"
  | "provisioning"
  | "advanced"
  | "quit";

export interface FlowWizardOptions {
  readonly prompts: Prompts;
  readonly registry: CommandRegistry;
  readonly clipboard?: ClipboardWriter;
  readonly collectModel?: (repoRoot: string) => CockpitModel;
  readonly loadActiveSpecsIndex?: LoadActiveSpecsIndex;
}

export function buildFlowMenu(
  model: CockpitModel,
  provisioning?: ProvisioningContextSummary
): ReadonlyArray<{
  readonly name: string;
  readonly value: FlowMenuValue;
  readonly hint?: string;
  readonly disabled?: boolean;
}> {
  const recommended = model.flow?.recommended;
  const alternatives = alternativesFor(model);
  const recommendValidation = shouldRecommendValidation(model);
  const choices: Array<{
    readonly name: string;
    readonly value: FlowMenuValue;
    readonly hint?: string;
    readonly disabled?: boolean;
  }> = [];

  choices.push({ name: WIZARD_COPY.menu.fullSummary, value: "cockpit" });

  if (recommended) {
    choices.push({
      name: `${WIZARD_COPY.menu.recommendedPrefix}: ${recommendedActionLabel(model, recommended.title)}`,
      value: "next",
      hint: WIZARD_COPY.menu.recommendedHint,
    });
  } else if (recommendValidation) {
    choices.push({
      name: `${WIZARD_COPY.menu.recommendedPrefix}: ${recommendedActionLabel(
        model,
        WIZARD_COPY.fallbackValidationAction
      )}`,
      value: "validate",
      hint: WIZARD_COPY.menu.recommendedValidationHint,
    });
  }

  if (alternatives.length === 1) {
    const [alternative] = alternatives;
    choices.push({
      name: `${WIZARD_COPY.menu.singleAlternativePrefix}: ${humanActionTitle(
        alternative.id,
        alternative.title
      )}`,
      value: "alternative",
      hint: WIZARD_COPY.menu.singleAlternativeHint,
    });
  } else if (alternatives.length > 1) {
    choices.push({
      name: WIZARD_COPY.menu.multipleAlternatives,
      value: "alternative",
      hint: `${alternatives.length} ${WIZARD_COPY.menu.multipleAlternativesHint}`,
    });
  }

  if (!recommendValidation) {
    choices.push({ name: WIZARD_COPY.menu.validate, value: "validate" });
  }
  choices.push(
    {
      name: WIZARD_COPY.menu.decisions,
      value: "decisions",
      hint: WIZARD_COPY.menu.decisionsHint,
    },
    {
      name: WIZARD_COPY.menu.work,
      value: "work",
      hint: WIZARD_COPY.menu.workHint,
    },
    {
      name: WIZARD_COPY.menu.review,
      value: "review",
      hint: WIZARD_COPY.menu.reviewHint,
    },
    {
      name: WIZARD_COPY.menu.peerReview,
      value: "peer-review",
      hint: WIZARD_COPY.menu.peerReviewHint,
    },
    {
      name: WIZARD_COPY.menu.specWork,
      value: "spec-work",
      hint: WIZARD_COPY.menu.specWorkHint,
    },
    {
      name: provisioningMainLabel(provisioning),
      value: "provisioning",
      hint: provisioningMainHint(provisioning),
    },
    {
      name: WIZARD_COPY.menu.advanced,
      value: "advanced",
      hint: WIZARD_COPY.menu.advancedHint,
    },
    { name: COMMON_COPY.quit, value: "quit" }
  );

  return choices;
}

function humanActionTitle(id: string, fallback: string): string {
  return WIZARD_COPY.actionTitles[id as keyof typeof WIZARD_COPY.actionTitles] ?? fallback;
}

function recommendedActionLabel(model: CockpitModel, fallback: string): string {
  return model.flow?.humanSummary?.nextAction ?? fallback;
}

function shouldRecommendValidation(model: CockpitModel): boolean {
  return !model.flow?.recommended && model.work.brief.workingTreeState !== "clean";
}

function availableDecisions(model: CockpitModel): readonly CockpitModel["decisions"][number][] {
  return (
    model.flow?.available ??
    model.decisions.filter((decision) => decision.availability.status === "available")
  );
}

function alternativesFor(model: CockpitModel): readonly CockpitModel["decisions"][number][] {
  const recommended = model.flow?.recommended;
  const available = availableDecisions(model);
  return available.filter((action) => action.id !== recommended?.id);
}

function wrapText(value: string, indent: string, width = 74): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > width && current) {
      lines.push(`${indent}${current}`);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(`${indent}${current}`);
  return lines;
}

function wrapBullet(value: string, width = 70): string[] {
  const wrapped = wrapText(value, "", width);
  return wrapped.map((line, index) => `${index === 0 ? "  - " : "    "}${line}`);
}

function pushWrapped(lines: string[], label: string, value: string | null, indent = "  "): void {
  if (!value) return;
  lines.push(`${indent}${label}`);
  lines.push(...wrapText(value, `${indent}  `, 66));
}

function renderObjectBlock(
  lines: string[],
  title: string,
  object: HumanObjectSummary | null
): void {
  if (!object) return;
  lines.push(title);
  lines.push(`  ${object.label}`);
  lines.push("");
  pushWrapped(lines, WIZARD_COPY.summary.objective, object.objective);
  pushWrapped(lines, WIZARD_COPY.summary.output, object.output);
  lines.push("");
}

export function renderFlowSummary(
  model: CockpitModel,
  provisioning?: ProvisioningContextSummary,
  specWork?: SpecWorkSnapshot
): string {
  if (model.flow?.humanSummary) {
    return [
      renderWizardHumanSummary(model.flow.humanSummary, model),
      renderContextGuidance(buildContextGuidance(model, provisioning, specWork)),
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  const facts = model.work.snapshot.collected.facts;
  const pr = facts.pullRequest;
  const active = model.work.brief.object.subCheckpoint;
  const fallback = [
    `branch: ${facts.git.branch ?? "?"}`,
    `HEAD: ${facts.git.head ?? "?"}`,
    `modo: ${model.work.brief.mode}`,
    active
      ? `sub-checkpoint: ${active.id} — ${active.title}`
      : `sub-checkpoint: ${COMMON_COPY.none}`,
    pr
      ? `PR #${pr.number}: ${pr.isDraft ? "Draft" : "Ready"} · CI ${pr.checks.pass} ok / ${pr.checks.fail} falha(s) / ${pr.checks.pending} pendente(s)`
      : `PR: ${COMMON_COPY.notObserved}`,
    `próxima ação: ${model.flow?.recommended?.title ?? model.work.brief.nextAction.description}`,
  ].join("\n");
  return [fallback, renderContextGuidance(buildContextGuidance(model, provisioning, specWork))]
    .filter(Boolean)
    .join("\n\n");
}

function renderWizardHumanSummary(summary: HumanSummary, model: CockpitModel): string {
  const lines: string[] = [];
  const recommended = model.flow?.recommended ?? null;
  const alternatives = (model.flow?.available ?? []).filter(
    (action) => action.id !== recommended?.id
  );
  lines.push(WIZARD_COPY.summary.state);
  for (const item of summary.state) {
    lines.push(...wrapText(item, "  ", 74));
  }
  lines.push("");

  renderObjectBlock(lines, WIZARD_COPY.summary.now, summary.currentObject);
  renderObjectBlock(lines, WIZARD_COPY.summary.next, summary.nextObject);

  if (summary.ready.length > 0) {
    lines.push(WIZARD_COPY.summary.ready);
    for (const item of summary.ready) lines.push(...wrapBullet(item));
    lines.push("");
  }

  if (summary.missing.length > 0) {
    lines.push(WIZARD_COPY.summary.missing);
    for (const item of summary.missing) lines.push(...wrapBullet(item));
    lines.push("");
  }

  lines.push(WIZARD_COPY.summary.recommended);
  lines.push(...wrapText(summary.nextAction, "  ", 70));
  if (summary.command) {
    lines.push(`  ${WIZARD_COPY.summary.understandBeforeApply}`);
    lines.push(`  ${summary.command}`);
  }

  if (alternatives.length > 0) {
    lines.push("");
    lines.push(WIZARD_COPY.summary.alternatives);
    for (const action of alternatives) {
      lines.push(...wrapBullet(humanActionTitle(action.id, action.title)));
      if (action.command) {
        lines.push(...wrapText(action.command, "      ", 64));
      }
    }
  }

  return lines.join("\n").trimEnd();
}

function renderContextGuidance(guidance: ContextGuidance): string {
  const sections: Array<[string, readonly string[]]> = [
    [WIZARD_COPY.context.repository, guidance.repository],
    [WIZARD_COPY.context.collaboration, guidance.collaboration],
    [WIZARD_COPY.context.specs, guidance.specs],
    [WIZARD_COPY.context.dailyWork, guidance.dailyWork],
    [WIZARD_COPY.context.safety, guidance.safety],
  ];
  const lines = [WIZARD_COPY.context.title];
  for (const [title, items] of sections) {
    if (items.length === 0) continue;
    lines.push(title);
    for (const item of items) lines.push(...wrapBullet(item, 76));
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function buildContextGuidance(
  model: CockpitModel,
  provisioning?: ProvisioningContextSummary,
  specWork?: SpecWorkSnapshot
): ContextGuidance {
  return {
    repository: repositoryContextLines(provisioning),
    collaboration: collaborationContextLines(provisioning),
    specs: specContextLines(specWork),
    dailyWork: dailyWorkContextLines(model),
    safety: safetyContextLines(model),
  };
}

function repositoryContextLines(summary?: ProvisioningContextSummary): readonly string[] {
  if (!summary) return [];
  const lines: string[] = [];
  switch (summary.workspaceShape) {
    case "empty":
      lines.push(WIZARD_COPY.context.repoEmpty);
      break;
    case "loose-files":
      lines.push(WIZARD_COPY.context.repoLooseFiles);
      break;
    case "package-repo":
      lines.push(WIZARD_COPY.context.repoExisting);
      break;
    case "governed-repo":
      lines.push(WIZARD_COPY.context.repoGoverned);
      break;
  }
  lines.push(`${WIZARD_COPY.context.pathNormal}: ${provisioningLabel(summary.operation)}.`);
  if (summary.formatterRivalLabel) {
    lines.push(
      formatCopy(WIZARD_COPY.context.formatterRival, { formatter: summary.formatterRivalLabel })
    );
  } else if (summary.hasPrettier) {
    lines.push(WIZARD_COPY.context.prettierPresent);
  }
  return lines;
}

function collaborationContextLines(summary?: ProvisioningContextSummary): readonly string[] {
  if (!summary) return [];
  if (summary.reviewPolicy) {
    return [
      formatCopy(WIZARD_COPY.context.collaborationProfile, {
        profile: summary.reviewPolicy.activeProfile,
      }),
      formatCopy(WIZARD_COPY.context.collaborationReviews, {
        implementation: String(summary.reviewPolicy.implementationApprovals),
        integration: String(summary.reviewPolicy.integrationApprovals),
      }),
      WIZARD_COPY.context.collaborationChangeGuard,
    ];
  }
  if (summary.operation === "update") return [WIZARD_COPY.context.collaborationMissingPolicy];
  return [WIZARD_COPY.context.collaborationPrompted];
}

function specContextLines(snapshot?: SpecWorkSnapshot): readonly string[] {
  if (!snapshot) return [];
  if (!snapshot.indexAvailable) {
    return [WIZARD_COPY.context.specIndexMissing, ...snapshot.warnings];
  }
  if (snapshot.entries.length === 0) {
    return [WIZARD_COPY.context.specNone];
  }
  const current = currentSpecForBranch(snapshot);
  const countLine =
    snapshot.entries.length === 1
      ? WIZARD_COPY.context.specSingle
      : formatCopy(WIZARD_COPY.context.specMultiple, { count: String(snapshot.entries.length) });
  const lines = [countLine];
  if (current) {
    lines.push(
      formatCopy(WIZARD_COPY.context.specCurrentBranch, {
        id: current.entry.id,
        title: current.entry.title ?? current.entry.slug,
      })
    );
  } else {
    lines.push(WIZARD_COPY.context.specBranchMismatch);
  }
  if (snapshot.warnings.length > 0) lines.push(...snapshot.warnings);
  return lines;
}

function dailyWorkContextLines(model: CockpitModel): readonly string[] {
  const facts = model.work.snapshot.collected.facts;
  const brief = model.work.brief;
  const lifecycle = facts.lifecycle;
  const pr = facts.pullRequest;
  const lines: string[] = [];
  if (brief.workingTreeState === "clean") lines.push(WIZARD_COPY.context.treeClean);
  else lines.push(WIZARD_COPY.context.treeDirty);

  if (pr) {
    lines.push(
      formatCopy(pr.isDraft ? WIZARD_COPY.context.prDraft : WIZARD_COPY.context.prReady, {
        number: String(pr.number),
      })
    );
    if (pr.checks.fail > 0) {
      lines.push(formatCopy(WIZARD_COPY.context.ciFailing, { count: String(pr.checks.fail) }));
    } else if (pr.checks.pending > 0) {
      lines.push(formatCopy(WIZARD_COPY.context.ciPending, { count: String(pr.checks.pending) }));
    } else {
      lines.push(WIZARD_COPY.context.ciGreen);
    }
  } else {
    lines.push(WIZARD_COPY.context.remoteNotObserved);
  }

  if (lifecycle) {
    if (lifecycle.openFindings > 0) {
      lines.push(
        formatCopy(WIZARD_COPY.context.findingsOpen, {
          open: String(lifecycle.openFindings),
          blocking: String(lifecycle.openBlocking),
        })
      );
    } else {
      lines.push(WIZARD_COPY.context.findingsClosed);
    }
    lines.push(
      formatCopy(WIZARD_COPY.context.resolutionsCount, {
        count: String(lifecycle.resolutions),
      })
    );
    const staleOrBlocking = lifecycle.reviewStatuses.filter(
      (status) => status.blocking || status.state === "stale" || status.state === "missing"
    );
    if (staleOrBlocking.length > 0) {
      lines.push(
        formatCopy(WIZARD_COPY.context.reviewsAttention, {
          count: String(staleOrBlocking.length),
        })
      );
    }
  }

  const recommended = model.flow?.recommended;
  if (
    recommended?.id === "mark-readiness" ||
    model.flow?.available.some((action) => action.id === "mark-readiness")
  ) {
    lines.push(WIZARD_COPY.context.readinessAvailable);
  }
  if (recommended?.id === "finish-subcheckpoint") lines.push(WIZARD_COPY.context.finishAvailable);
  if (model.flow?.blocked.some((action) => action.id === "advance-subcheckpoint")) {
    lines.push(WIZARD_COPY.context.advanceBlocked);
  }
  return lines;
}

function safetyContextLines(model: CockpitModel): readonly string[] {
  const facts = model.work.snapshot.collected.facts;
  const sources = facts.sources ?? [];
  const degraded = sources.filter((source) => source.status !== "fresh");
  const lines: string[] = [];
  if (degraded.length > 0 || !facts.pullRequest) {
    lines.push(WIZARD_COPY.context.degradedMode);
  }
  lines.push(WIZARD_COPY.context.humanGateGuard);
  lines.push(WIZARD_COPY.context.readyGuard);
  lines.push(WIZARD_COPY.context.mergeGuard);
  lines.push(WIZARD_COPY.context.peerReviewAvailable);
  lines.push(WIZARD_COPY.context.updateAvailable);
  return lines;
}

export function renderBlockedActions(model: CockpitModel): string {
  const blocked = model.flow?.blocked ?? [];
  if (blocked.length === 0) return WIZARD_COPY.results.blockedEmpty;
  return blocked
    .map((action) => {
      const reasons = action.availability.reasons.map((reason) => `  - ${reason}`).join("\n");
      return `${action.title}\n${reasons || `  - ${WIZARD_COPY.results.blockedFallbackReason}`}`;
    })
    .join("\n\n");
}

export async function runFlowWizard(
  repoRoot: string,
  logger: Logger,
  options: FlowWizardOptions
): Promise<number> {
  const { prompts, registry } = options;
  const clipboard = options.clipboard ?? new NodeClipboard();
  const model = (options.collectModel ?? collectCockpitModel)(repoRoot);
  const context: CommandContext = { repoRoot, logger, prompts };
  const provisioning = detectProvisioningContext(repoRoot);
  const loadIndex = options.loadActiveSpecsIndex ?? loadActiveSpecsIndex;
  const specWork = collectSpecWorkSnapshot(repoRoot, model, loadIndex);

  try {
    await prompts.intro?.(WIZARD_COPY.intro);
    const summary = renderFlowSummary(model, provisioning, specWork);
    if (prompts.box) await prompts.box(summary, WIZARD_COPY.stateTitle);
    else await prompts.note?.(summary, WIZARD_COPY.stateTitle);

    const choice = await prompts.select<FlowMenuValue>({
      message: WIZARD_COPY.mainQuestion,
      choices: buildFlowMenu(model, provisioning),
    });

    switch (choice) {
      case "cockpit":
        logger.info(renderCockpit(model).trimEnd());
        await prompts.outro?.(WIZARD_COPY.results.summaryRendered);
        return 0;
      case "next":
        if (!model.flow?.recommended) {
          await prompts.note?.(renderBlockedActions(model), WIZARD_COPY.results.noAction);
          await prompts.outro?.(WIZARD_COPY.results.noMutation);
          return 0;
        }
        return runRecommendedAction(model, registry, context, prompts);
      case "alternative":
        return runAlternativeAction(model, registry, context, prompts, clipboard);
      case "validate":
        return runValidationSection(registry, context, prompts);
      case "decisions":
        return registry.dispatch(["decide", "--brief-only"], context).then((r) => r.exitCode);
      case "blockers":
        await prompts.note?.(renderBlockedActions(model), WIZARD_COPY.menu.decisions);
        await prompts.outro?.(WIZARD_COPY.results.blockedRendered);
        return 0;
      case "work":
        return runHandoffSection(model, registry, context, prompts, clipboard);
      case "review":
        return runReviewSection(registry, context, prompts, clipboard);
      case "peer-review":
        return runPeerReviewSection(registry, context, prompts);
      case "spec-work":
        return runSpecWorkSection(repoRoot, model, registry, context, prompts, {
          loadIndex,
        });
      case "provisioning":
        return runProvisioningSection(repoRoot, registry, context, prompts, provisioning);
      case "advanced":
        return runAdvancedSection(registry, context, prompts);
      case "quit":
        await prompts.outro?.(COMMON_COPY.noChanges);
        return 0;
    }
  } catch (error) {
    if (isPromptCancelled(error)) {
      await prompts.cancel?.(error.message);
      await prompts.outro?.(COMMON_COPY.noChanges);
      return 0;
    }
    throw error;
  }
}

async function runRecommendedAction(
  model: CockpitModel,
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts
): Promise<number> {
  const recommended = model.flow?.recommended;
  if (!recommended) {
    await prompts.note?.(renderBlockedActions(model), "Sem ação disponível");
    return 0;
  }
  const lines = [
    WIZARD_COPY.recommendedAction.heading,
    "",
    humanActionTitle(recommended.id, recommended.title),
    "",
    WIZARD_COPY.recommendedAction.understand,
    recommended.command,
    "",
    WIZARD_COPY.recommendedAction.effects,
    ...recommended.effect.map((effect) => `- ${effect}`),
  ];
  if (recommended.mutatingCommand) {
    lines.push("", WIZARD_COPY.recommendedAction.mutatingCommand, recommended.mutatingCommand);
  }
  await prompts.note?.(lines.join("\n"), WIZARD_COPY.recommendedAction.title);
  const proceed = await prompts.confirm({
    message: WIZARD_COPY.recommendedAction.confirm,
    default: false,
  });
  if (!proceed) {
    await prompts.outro?.(WIZARD_COPY.recommendedAction.cancelled);
    return 0;
  }
  return (await registry.dispatch(["decide"], context)).exitCode;
}

async function runAlternativeAction(
  model: CockpitModel,
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts,
  clipboard: ClipboardWriter
): Promise<number> {
  const alternatives = alternativesFor(model);
  const alternative =
    alternatives.length <= 1
      ? alternatives[0]
      : await prompts.select<CockpitModel["decisions"][number]>({
          message: WIZARD_COPY.summary.alternatives,
          choices: alternatives.map((action) => ({
            name: humanActionTitle(action.id, action.title),
            value: action,
            hint: action.command,
          })),
        });
  if (!alternative) return 0;
  if (alternative.id === "review-insight-candidates") {
    return (await registry.dispatch(["insight", "list"], context)).exitCode;
  }
  if (alternative.id === "request-advisory-review") {
    return runReviewSection(registry, context, prompts, clipboard);
  }
  return (await registry.dispatch(["decide", "--type", alternative.id, "--brief-only"], context))
    .exitCode;
}

class BufferedLogger implements Logger {
  readonly lines: string[] = [];
  info(message: string): void {
    this.lines.push(message);
  }
  error(message: string): void {
    this.lines.push(message);
  }
}

async function captureCommandOutput(
  registry: CommandRegistry,
  context: CommandContext,
  args: readonly string[]
): Promise<{ readonly exitCode: number; readonly output: string }> {
  const logger = new BufferedLogger();
  const result = await registry.dispatch(args, { ...context, logger });
  return { exitCode: result.exitCode, output: logger.lines.join("\n").trimEnd() };
}

async function copyOrPrint(
  title: string,
  text: string,
  context: CommandContext,
  prompts: Prompts,
  clipboard: ClipboardWriter
): Promise<void> {
  const copied = await clipboard.copy(text);
  if (copied) {
    await prompts.status?.("success", formatCopy(WIZARD_COPY.clipboard.copied, { title }));
    return;
  }
  const hint = clipboardInstallHint();
  await prompts.status?.("warn", formatCopy(WIZARD_COPY.clipboard.manual, { title }));
  if (hint) context.logger.info(hint);
  context.logger.info(formatCopy(WIZARD_COPY.clipboard.begin, { title: title.toUpperCase() }));
  context.logger.info(text);
  context.logger.info(formatCopy(WIZARD_COPY.clipboard.end, { title: title.toUpperCase() }));
}

function specIdentifier(model: CockpitModel): string | null {
  const label = model.work.snapshot.collected.facts.spec.label;
  return label.split("-")[0] || null;
}

async function runHandoffSection(
  model: CockpitModel,
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts,
  clipboard: ClipboardWriter
): Promise<number> {
  await prompts.note?.(copyLines(WIZARD_COPY.handoff.intro), WIZARD_COPY.handoff.title);
  const spec = specIdentifierFromContext(context, model);
  const handoff = await captureCommandOutput(registry, context, ["handoff", spec]);
  const work = await captureCommandOutput(registry, context, ["work"]);
  const text = [
    WIZARD_COPY.handoff.documentTitle,
    "",
    WIZARD_COPY.handoff.handoffHeading,
    handoff.output,
    "",
    WIZARD_COPY.handoff.workHeading,
    work.output,
  ].join("\n");
  await copyOrPrint(WIZARD_COPY.handoff.title, text, context, prompts, clipboard);
  return handoff.exitCode || work.exitCode;
}

function specIdentifierFromContext(_context: CommandContext, model: CockpitModel): string {
  return specIdentifier(model) ?? "0024";
}

async function runValidationSection(
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts
): Promise<number> {
  const selected = await prompts.select<string>({
    message: WIZARD_COPY.validation.question,
    choices: [
      {
        name: WIZARD_COPY.validation.changed,
        value: "changed",
        hint: WIZARD_COPY.validation.changedHint,
      },
      {
        name: WIZARD_COPY.validation.changedFix,
        value: "changed-fix",
        hint: WIZARD_COPY.validation.changedFixHint,
      },
      {
        name: WIZARD_COPY.validation.fullHelp,
        value: "full-help",
        hint: WIZARD_COPY.validation.fullHelpHint,
      },
      { name: COMMON_COPY.back, value: "__back__" },
    ],
  });
  if (selected === "__back__") return 0;
  if (selected === "full-help") {
    await prompts.note?.(
      copyLines(WIZARD_COPY.validation.fullNote),
      WIZARD_COPY.validation.fullTitle
    );
    return 0;
  }
  const args =
    selected === "changed-fix" ? ["validate", "changed", "--fix"] : ["validate", "changed"];
  if (selected === "changed-fix") {
    const confirmed = await prompts.confirm({
      message: WIZARD_COPY.validation.confirmFix,
      default: false,
    });
    if (!confirmed) {
      await prompts.outro?.(WIZARD_COPY.validation.fixCancelled);
      return 0;
    }
  }
  if (prompts.taskList) {
    let exitCode = 0;
    await prompts.taskList([
      {
        title:
          selected === "changed-fix"
            ? WIZARD_COPY.validation.taskFix
            : WIZARD_COPY.validation.taskChanged,
        task: async (message) => {
          const log = prompts.taskLog?.({
            title: WIZARD_COPY.validation.taskLogTitle,
            limit: 8,
            retainLog: true,
          });
          const group = log?.group(
            selected === "changed-fix" ? "validate changed --fix" : "validate changed"
          );
          message(WIZARD_COPY.validation.taskMessage);
          group?.message(WIZARD_COPY.validation.step1);
          group?.message(WIZARD_COPY.validation.step2);
          group?.message(WIZARD_COPY.validation.step3);
          group?.message(WIZARD_COPY.validation.step4);
          const result = await registry.dispatch(args, context);
          exitCode = result.exitCode;
          if (exitCode !== 0) {
            group?.error(`Validação retornou exit code ${exitCode}.`);
            log?.error(WIZARD_COPY.validation.failed, { showLog: true });
            throw new Error(`Validação retornou exit code ${exitCode}.`);
          }
          group?.success(WIZARD_COPY.validation.passed);
          log?.success(WIZARD_COPY.validation.completed, { showLog: true });
          return WIZARD_COPY.validation.completed;
        },
      },
    ]);
    return exitCode;
  }
  return (await registry.dispatch(args, context)).exitCode;
}

async function runReviewSection(
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts,
  clipboard: ClipboardWriter
): Promise<number> {
  await prompts.note?.(copyLines(WIZARD_COPY.review.intro), WIZARD_COPY.review.title);
  const choice = await prompts.select<string>({
    message: WIZARD_COPY.review.question,
    choices: [
      {
        name: WIZARD_COPY.review.types,
        value: "types",
        hint: WIZARD_COPY.review.typesHint,
      },
      {
        name: WIZARD_COPY.review.policy,
        value: "policy",
        hint: WIZARD_COPY.review.policyHint,
      },
      { name: COMMON_COPY.back, value: "__back__" },
    ],
  });
  if (choice === "__back__") return 0;
  const args = ["review", choice] as const;
  const captured = await captureCommandOutput(registry, context, args);
  await copyOrPrint(
    choice === "types" ? WIZARD_COPY.review.title : WIZARD_COPY.review.policyTitle,
    captured.output,
    context,
    prompts,
    clipboard
  );
  return captured.exitCode;
}

async function runPeerReviewSection(
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts
): Promise<number> {
  await prompts.note?.(copyLines(WIZARD_COPY.peerReview.intro), WIZARD_COPY.peerReview.title);
  const rawPr = (await prompts.input({ message: WIZARD_COPY.peerReview.prQuestion })).trim();
  if (!/^\d+$/.test(rawPr)) {
    await prompts.outro?.(WIZARD_COPY.peerReview.invalidPr);
    return 0;
  }

  const brief = await captureCommandOutput(registry, context, [
    "peer-review",
    rawPr,
    "--brief-only",
  ]);
  await prompts.note?.(brief.output, WIZARD_COPY.peerReview.briefTitle);
  if (brief.exitCode !== 0) return brief.exitCode;

  const mode = await prompts.select<PeerReviewMode>({
    message: WIZARD_COPY.peerReview.modeQuestion,
    choices: [
      {
        name: WIZARD_COPY.peerReview.worktree,
        value: "worktree",
        hint: WIZARD_COPY.peerReview.worktreeHint,
      },
      {
        name: WIZARD_COPY.peerReview.checkout,
        value: "checkout",
        hint: WIZARD_COPY.peerReview.checkoutHint,
      },
    ],
  });
  const command = `npx ai-guidelines peer-review ${rawPr} --mode ${mode} --confirm`;
  await prompts.note?.(
    [WIZARD_COPY.peerReview.previewIntro, command].join("\n"),
    WIZARD_COPY.peerReview.previewTitle
  );
  const confirmed = await prompts.confirm({
    message: WIZARD_COPY.peerReview.confirm,
    default: false,
  });
  if (!confirmed) {
    await prompts.outro?.(WIZARD_COPY.peerReview.cancelled);
    return 0;
  }
  return (await registry.dispatch(["peer-review", rawPr, "--mode", mode, "--confirm"], context))
    .exitCode;
}

async function runSpecWorkSection(
  repoRoot: string,
  model: CockpitModel,
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts,
  options: { readonly loadIndex: LoadActiveSpecsIndex }
): Promise<number> {
  const snapshot = collectSpecWorkSnapshot(repoRoot, model, options.loadIndex);
  await prompts.note?.(renderSpecWorkOverview(snapshot), WIZARD_COPY.specWork.title);
  const selected = await prompts.select<SpecWorkMenuChoice>({
    message: WIZARD_COPY.specWork.question,
    choices: [
      {
        name: WIZARD_COPY.specWork.chooseSpec,
        value: "choose-spec",
        hint:
          snapshot.entries.length > 0
            ? WIZARD_COPY.specWork.chooseSpecHint
            : WIZARD_COPY.specWork.chooseSpecUnavailableHint,
        disabled: snapshot.entries.length === 0,
      },
      {
        name: WIZARD_COPY.specWork.activeSpecs,
        value: "active-specs",
        hint: WIZARD_COPY.specWork.activeSpecsHint,
      },
      {
        name: WIZARD_COPY.specWork.continueOther,
        value: "continue-other",
        hint: WIZARD_COPY.specWork.continueOtherHint,
      },
      {
        name: WIZARD_COPY.specWork.newSpec,
        value: "new-spec",
        hint: WIZARD_COPY.specWork.newSpecHint,
      },
      { name: COMMON_COPY.back, value: "__back__" },
    ],
  });

  if (selected === "__back__") return 0;
  if (selected === "choose-spec") {
    return runSpecSelection(snapshot, registry, context, prompts);
  }
  if (selected === "active-specs") return (await registry.dispatch(["specs"], context)).exitCode;
  if (selected === "continue-other") {
    const identifier = (await prompts.input({ message: WIZARD_COPY.specWork.specQuestion })).trim();
    if (!identifier) {
      await prompts.outro?.(COMMON_COPY.nothingExecuted);
      return 0;
    }
    const found = findSpecByIdentifier(snapshot.entries, identifier);
    if (found) {
      return continueSelectedSpec(snapshot, found, registry, context, prompts);
    }
    return (await registry.dispatch(["continue", identifier], context)).exitCode;
  }

  await prompts.note?.(copyLines(WIZARD_COPY.specWork.newSpecNote), WIZARD_COPY.specWork.newSpec);
  return 0;
}

interface SpecWorkSnapshot {
  readonly currentBranch: string | null;
  readonly indexAvailable: boolean;
  readonly entries: readonly ResolvedActiveSpec[];
  readonly warnings: readonly string[];
}

function collectSpecWorkSnapshot(
  repoRoot: string,
  model: CockpitModel,
  loadIndex: LoadActiveSpecsIndex
): SpecWorkSnapshot {
  const facts = model.work.snapshot.collected.facts;
  const result = loadIndex(repoRoot);
  return {
    currentBranch: facts.git.branch ?? null,
    indexAvailable: result.indexAvailable,
    entries: result.entries,
    warnings: result.warnings,
  };
}

function renderSpecWorkOverview(snapshot: SpecWorkSnapshot): string {
  const current = currentSpecForBranch(snapshot);
  const lines = [
    ...WIZARD_COPY.specWork.intro,
    "",
    WIZARD_COPY.specWork.currentBranchLabel,
    `- ${snapshot.currentBranch ?? WIZARD_COPY.specWork.unknownBranch}`,
    "",
  ];

  if (!snapshot.indexAvailable) {
    lines.push(
      WIZARD_COPY.specWork.indexMissingTitle,
      ...snapshot.warnings.map((warning) => `- ${warning}`),
      "",
      WIZARD_COPY.specWork.indexMissingAction
    );
    return lines.join("\n");
  }

  lines.push(
    WIZARD_COPY.specWork.indexSummaryTitle,
    `- ${formatCopy(WIZARD_COPY.specWork.indexSummary, {
      count: String(snapshot.entries.length),
    })}`
  );
  if (current) {
    lines.push(
      `- ${formatCopy(WIZARD_COPY.specWork.currentSpec, {
        id: current.entry.id,
        slug: current.entry.slug,
      })}`
    );
  } else {
    lines.push(`- ${WIZARD_COPY.specWork.noCurrentSpec}`);
  }
  if (snapshot.warnings.length > 0) {
    lines.push("", WIZARD_COPY.specWork.warningsTitle);
    for (const warning of snapshot.warnings) lines.push(`- ${warning}`);
  }
  return lines.join("\n");
}

async function runSpecSelection(
  snapshot: SpecWorkSnapshot,
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts
): Promise<number> {
  const selected = await prompts.select<SpecSelectionChoice>({
    message: WIZARD_COPY.specWork.selectQuestion,
    choices: [
      ...snapshot.entries.map((resolved) => specSelectionChoice(snapshot, resolved)),
      {
        name: WIZARD_COPY.specWork.manualIdentifier,
        value: "__manual__" as const,
        hint: WIZARD_COPY.specWork.manualIdentifierHint,
      },
      { name: COMMON_COPY.back, value: "__back__" as const },
    ],
  });

  if (selected === "__back__") return 0;
  if (selected === "__manual__") {
    const identifier = (await prompts.input({ message: WIZARD_COPY.specWork.specQuestion })).trim();
    if (!identifier) {
      await prompts.outro?.(COMMON_COPY.nothingExecuted);
      return 0;
    }
    const found = findSpecByIdentifier(snapshot.entries, identifier);
    return found
      ? continueSelectedSpec(snapshot, found, registry, context, prompts)
      : (await registry.dispatch(["continue", identifier], context)).exitCode;
  }

  const found = findSpecByIdentifier(snapshot.entries, selected);
  if (!found) {
    await prompts.note?.(
      formatCopy(WIZARD_COPY.specWork.specNotFound, { identifier: selected }),
      WIZARD_COPY.specWork.title
    );
    return 0;
  }
  return continueSelectedSpec(snapshot, found, registry, context, prompts);
}

function specSelectionChoice(
  snapshot: SpecWorkSnapshot,
  resolved: ResolvedActiveSpec
): {
  readonly name: string;
  readonly value: string;
  readonly hint: string;
} {
  const isCurrent = resolved.entry.branch === snapshot.currentBranch;
  const status = `${resolved.entry.stage}/${resolved.entry.status}`;
  const local = resolved.specPathExists
    ? WIZARD_COPY.specWork.localPathOk
    : WIZARD_COPY.specWork.localPathMissing;
  return {
    name: `${resolved.entry.id} — ${resolved.entry.title ?? resolved.entry.slug}${
      isCurrent ? ` (${WIZARD_COPY.specWork.currentBranchMarker})` : ""
    }`,
    value: resolved.entry.id,
    hint: `${status} · ${resolved.entry.branch} · ${local}`,
  };
}

async function continueSelectedSpec(
  snapshot: SpecWorkSnapshot,
  resolved: ResolvedActiveSpec,
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts
): Promise<number> {
  await prompts.note?.(
    renderSelectedSpecDetails(snapshot, resolved),
    WIZARD_COPY.specWork.selectedTitle
  );

  if (!resolved.specPathExists) {
    await prompts.outro?.(WIZARD_COPY.specWork.checkoutFirst);
    return 0;
  }
  if (snapshot.currentBranch !== resolved.entry.branch) {
    await prompts.outro?.(WIZARD_COPY.specWork.checkoutFirst);
    return 0;
  }

  return (await registry.dispatch(["continue", resolved.entry.id], context)).exitCode;
}

function renderSelectedSpecDetails(
  snapshot: SpecWorkSnapshot,
  resolved: ResolvedActiveSpec
): string {
  const sameBranch = snapshot.currentBranch === resolved.entry.branch;
  const lines = [
    `${resolved.entry.id} — ${resolved.entry.title ?? resolved.entry.slug}`,
    "",
    `${WIZARD_COPY.specWork.branchExpected}: ${resolved.entry.branch}`,
    `${WIZARD_COPY.specWork.branchCurrent}: ${
      snapshot.currentBranch ?? WIZARD_COPY.specWork.unknownBranch
    }`,
    `${WIZARD_COPY.specWork.stageStatus}: ${resolved.entry.stage}/${resolved.entry.status}`,
    `${WIZARD_COPY.specWork.pathLocal}: ${
      resolved.specPathExists
        ? WIZARD_COPY.specWork.localPathOk
        : WIZARD_COPY.specWork.localPathMissing
    }`,
    "",
  ];

  if (!resolved.specPathExists) {
    lines.push(
      WIZARD_COPY.specWork.pathMissingExplanation,
      `git fetch origin && git checkout ${resolved.entry.branch}`
    );
  } else if (!sameBranch) {
    lines.push(
      WIZARD_COPY.specWork.branchMismatchExplanation,
      `git fetch origin && git checkout ${resolved.entry.branch}`
    );
  } else {
    lines.push(
      WIZARD_COPY.specWork.readyToContinue,
      `npx ai-guidelines continue ${resolved.entry.id}`
    );
  }

  return lines.join("\n");
}

function currentSpecForBranch(snapshot: SpecWorkSnapshot): ResolvedActiveSpec | null {
  if (!snapshot.currentBranch) return null;
  return (
    snapshot.entries.find((resolved) => resolved.entry.branch === snapshot.currentBranch) ?? null
  );
}

function findSpecByIdentifier(
  entries: readonly ResolvedActiveSpec[],
  identifier: string
): ResolvedActiveSpec | null {
  const normalized = identifier.trim().toLowerCase();
  return (
    entries.find((resolved) => {
      const entry = resolved.entry;
      return (
        entry.id.toLowerCase() === normalized ||
        entry.slug.toLowerCase() === normalized ||
        entry.branch.toLowerCase() === normalized ||
        entry.specPath.toLowerCase().endsWith(`/${normalized}`)
      );
    }) ?? null
  );
}

async function runAdvancedSection(
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts
): Promise<number> {
  const selected = await prompts.select<AdvancedMenuChoice>({
    message: WIZARD_COPY.advanced.title,
    choices: [
      {
        name: WIZARD_COPY.advanced.drift,
        value: "drift",
        hint: WIZARD_COPY.advanced.driftHint,
      },
      {
        name: WIZARD_COPY.advanced.visualPrompt,
        value: "visual-prompt",
      },
      {
        name: WIZARD_COPY.advanced.publication,
        value: "publication",
        hint: WIZARD_COPY.advanced.publicationHint,
      },
      {
        name: WIZARD_COPY.advanced.finalOps,
        value: "final-ops",
        hint: WIZARD_COPY.advanced.finalOpsHint,
      },
      { name: COMMON_COPY.back, value: "__back__" },
    ],
  });

  if (selected === "__back__") return 0;
  if (selected === "drift") return (await registry.dispatch(["drift"], context)).exitCode;
  if (selected === "visual-prompt") {
    return (await registry.dispatch(["visual-prompt"], context)).exitCode;
  }
  if (selected === "publication") {
    await prompts.note?.(
      copyLines(WIZARD_COPY.advanced.publicationNote),
      WIZARD_COPY.advanced.publicationTitle
    );
    return 0;
  }
  await prompts.note?.(
    copyLines(WIZARD_COPY.advanced.finalOpsNote),
    WIZARD_COPY.advanced.finalOpsTitle
  );
  return 0;
}

async function runProvisioningSection(
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

function detectProvisioningContext(repoRoot: string): ProvisioningContextSummary {
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

function provisioningLabel(operation: ProvisioningOperation): string {
  return PROVISIONING_COPY.operationLabels[operation];
}

function provisioningMainLabel(summary?: ProvisioningContextSummary): string {
  if (!summary) return "Configurar/adotar/atualizar repositório";
  return provisioningActionLabel(summary.operation);
}

function provisioningMainHint(summary?: ProvisioningContextSummary): string | undefined {
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
