import { ClipboardWriter } from "../app/ports/ClipboardWriter.js";
import { isPromptCancelled, Prompts } from "../app/ports/Prompts.js";
import { NodeClipboard, clipboardInstallHint } from "../infrastructure/io/NodeClipboard.js";
import { CockpitModel, collectCockpitModel, renderCockpit } from "./cockpit.js";
import { FLOW_COPY, copyLines, formatCopy } from "./copy/flowCopy.js";
import type { HumanObjectSummary, HumanSummary } from "./flow/GovernedFlow.js";
import {
  LoadActiveSpecsIndex,
  loadActiveSpecsIndex,
} from "./registry/commands/loadActiveSpecsIndex.js";
import { CommandRegistry } from "./registry/CommandRegistry.js";
import { CommandContext, Logger } from "./registry/Command.js";
import {
  detectProvisioningContext,
  provisioningLabel,
  provisioningMainHint,
  provisioningMainLabel,
  runProvisioningSection,
  type ProvisioningContextSummary,
} from "./experience/wizard/provisioning.js";
import {
  collectSpecWorkSnapshot,
  currentSpecForBranch,
  runSpecWorkSection,
  type SpecWorkSnapshot,
} from "./experience/wizard/specWork.js";

type PeerReviewMode = "worktree" | "checkout";

const COMMON_COPY = FLOW_COPY.common;
const WIZARD_COPY = FLOW_COPY.wizard;
type AdvancedMenuChoice = "drift" | "visual-prompt" | "publication" | "final-ops" | "__back__";

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

type FlowMenuChoice = {
  readonly name: string;
  readonly value: FlowMenuValue;
  readonly hint?: string;
  readonly disabled?: boolean;
};

export function buildFlowMenu(
  model: CockpitModel,
  provisioning?: ProvisioningContextSummary,
  specWork?: SpecWorkSnapshot
): ReadonlyArray<FlowMenuChoice> {
  if (provisioning && provisioning.workspaceShape !== "governed-repo") {
    return buildProvisioningFirstMenu(provisioning);
  }

  const focusState = resolveSummaryFocusState(specWork);
  if (focusState !== "focused") {
    return buildFocusRecoveryMenu(model, provisioning, focusState);
  }

  return buildFocusedFlowMenu(model, provisioning);
}

function buildProvisioningFirstMenu(
  provisioning: ProvisioningContextSummary
): ReadonlyArray<FlowMenuChoice> {
  return [
    {
      name: provisioningMainLabel(provisioning),
      value: "provisioning",
      hint: provisioningMainHint(provisioning),
    },
    { name: COMMON_COPY.quit, value: "quit" },
  ];
}

function buildFocusRecoveryMenu(
  model: CockpitModel,
  provisioning: ProvisioningContextSummary | undefined,
  focusState: Exclude<SummaryFocusState, "focused">
): ReadonlyArray<FlowMenuChoice> {
  const choices: FlowMenuChoice[] = [];

  if (shouldRecommendValidation(model)) {
    choices.push({
      name: `${WIZARD_COPY.menu.recommendedPrefix}: ${recommendedActionLabel(
        model,
        WIZARD_COPY.fallbackValidationAction
      )}`,
      value: "validate",
      hint: WIZARD_COPY.menu.recommendedValidationHint,
    });
  }

  switch (focusState) {
    case "branch-missing":
    case "branch-unmapped":
    case "index-degraded":
      choices.push({
        name: WIZARD_COPY.menu.chooseSpec,
        value: "spec-work",
        hint:
          focusState === "index-degraded"
            ? WIZARD_COPY.menu.chooseSpecDegradedHint
            : WIZARD_COPY.menu.chooseSpecHint,
      });
      break;
    case "no-active-specs":
      choices.push({
        name: WIZARD_COPY.menu.startSpec,
        value: "spec-work",
        hint: WIZARD_COPY.menu.startSpecHint,
      });
      break;
  }

  if (provisioning?.workspaceShape === "governed-repo") {
    choices.push({
      name: provisioningMainLabel(provisioning),
      value: "provisioning",
      hint: provisioningMainHint(provisioning),
    });
  }

  if (focusState === "index-degraded") {
    choices.push({
      name: WIZARD_COPY.menu.advanced,
      value: "advanced",
      hint: WIZARD_COPY.menu.advancedHint,
    });
  }

  choices.push({ name: COMMON_COPY.quit, value: "quit" });
  return choices;
}

function buildFocusedFlowMenu(
  model: CockpitModel,
  provisioning?: ProvisioningContextSummary
): ReadonlyArray<FlowMenuChoice> {
  const recommended = model.flow?.recommended;
  const alternatives = alternativesFor(model);
  const recommendValidation = shouldRecommendValidation(model);
  const choices: FlowMenuChoice[] = [];

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
  return available.filter(
    (action) => action.id !== recommended?.id && isHumanValueAlternative(action.id)
  );
}

function isHumanValueAlternative(id: string): boolean {
  return id === "request-advisory-review" || id === "review-insight-candidates";
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
  if ((object.decisions?.length ?? 0) > 0) {
    lines.push("");
    lines.push(`  ${WIZARD_COPY.summary.decisions}:`);
    for (const decision of object.decisions ?? []) {
      const summary = decision.summary ? ` — ${decision.summary}` : "";
      lines.push(...wrapText(`- ${decision.id}${summary}`, "    ", 70));
    }
  }
  lines.push("");
}

function renderRoadmapBlock(lines: string[], summary: HumanSummary): void {
  lines.push(WIZARD_COPY.summary.next);
  const nextObjects = summary.nextObjects ?? [];
  const objects =
    nextObjects.length > 0 ? nextObjects : summary.nextObject ? [summary.nextObject] : [];
  if (objects.length === 0) {
    lines.push(`  ${COMMON_COPY.none}`);
    lines.push("");
    return;
  }
  for (const object of objects) {
    lines.push(`  - ${object.label}`);
  }
  lines.push("");
}

export function renderFlowSummary(
  model: CockpitModel,
  provisioning?: ProvisioningContextSummary,
  specWork?: SpecWorkSnapshot
): string {
  if (model.flow?.humanSummary) {
    return renderWizardHumanSummary(model.flow.humanSummary, model, specWork);
  }

  const facts = model.work.snapshot.collected.facts;
  const pr = facts.pullRequest;
  const active = model.work.brief.object.step;
  const fallback = [
    `branch: ${facts.git.branch ?? "?"}`,
    `HEAD: ${facts.git.head ?? "?"}`,
    `modo: ${model.work.brief.mode}`,
    active ? `etapa: ${active.id} — ${active.title}` : `etapa: ${COMMON_COPY.none}`,
    pr
      ? `PR #${pr.number}: ${pr.isDraft ? "Draft" : "Ready"} · CI ${pr.checks.pass} ok / ${pr.checks.fail} falha(s) / ${pr.checks.pending} pendente(s)`
      : `PR: ${COMMON_COPY.notObserved}`,
    `próxima ação: ${model.flow?.recommended?.title ?? model.work.brief.nextAction.description}`,
  ].join("\n");
  return [fallback, renderContextGuidance(buildContextGuidance(model, provisioning, specWork))]
    .filter(Boolean)
    .join("\n\n");
}

function renderWizardHumanSummary(
  summary: HumanSummary,
  model: CockpitModel,
  specWork?: SpecWorkSnapshot
): string {
  const focusState = resolveSummaryFocusState(specWork);
  if (focusState !== "focused") {
    return renderUnfocusedWizardSummary(model, specWork, focusState);
  }

  const lines: string[] = [];
  const recommended = model.flow?.recommended ?? null;
  const alternatives = (model.flow?.available ?? []).filter(
    (action) => action.id !== recommended?.id && isHumanValueAlternative(action.id)
  );
  lines.push(WIZARD_COPY.summary.state);
  for (const item of specStateLines(model, specWork)) {
    lines.push(...wrapText(item, "  ", 74));
  }
  for (const item of summary.state) {
    lines.push(...wrapText(item, "  ", 74));
  }
  lines.push("");

  renderPublicSpecIndexBlock(lines, specWork);
  renderObjectBlock(lines, WIZARD_COPY.summary.now, summary.currentObject);
  renderRoadmapBlock(lines, summary);

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

  if (alternatives.length > 0) {
    lines.push("");
    lines.push(WIZARD_COPY.summary.alternatives);
    for (const action of alternatives) {
      lines.push(...wrapBullet(humanActionTitle(action.id, action.title)));
    }
  }

  return lines.join("\n").trimEnd();
}

type SummaryFocusState =
  | "focused"
  | "branch-missing"
  | "branch-unmapped"
  | "no-active-specs"
  | "index-degraded";

function resolveSummaryFocusState(snapshot?: SpecWorkSnapshot): SummaryFocusState {
  if (!snapshot) return "focused";
  if (!snapshot.indexAvailable) return "index-degraded";
  if (snapshot.entries.length === 0) return "no-active-specs";
  if (!snapshot.currentBranch) return "branch-missing";
  return currentSpecForBranch(snapshot) ? "focused" : "branch-unmapped";
}

function renderUnfocusedWizardSummary(
  model: CockpitModel,
  snapshot: SpecWorkSnapshot | undefined,
  focusState: Exclude<SummaryFocusState, "focused">
): string {
  const lines: string[] = [WIZARD_COPY.summary.state];
  for (const item of specStateLines(model, snapshot)) {
    lines.push(...wrapText(item, "  ", 74));
  }
  lines.push("");

  renderPublicSpecIndexBlock(lines, snapshot);

  lines.push(WIZARD_COPY.summary.recommended);
  lines.push(...wrapText(unfocusedNextAction(snapshot, focusState), "  ", 70));

  const alternatives = unfocusedAlternatives(focusState);
  if (alternatives.length > 0) {
    lines.push("");
    lines.push(WIZARD_COPY.summary.alternatives);
    for (const alternative of alternatives) lines.push(...wrapBullet(alternative));
  }

  return lines.join("\n").trimEnd();
}

function unfocusedNextAction(
  snapshot: SpecWorkSnapshot | undefined,
  focusState: Exclude<SummaryFocusState, "focused">
): string {
  switch (focusState) {
    case "branch-missing":
      return WIZARD_COPY.summary.branchMissingNextAction;
    case "branch-unmapped":
      return WIZARD_COPY.summary.branchUnmappedNextAction;
    case "no-active-specs":
      return isMainBranch(snapshot?.currentBranch)
        ? WIZARD_COPY.summary.noActiveSpecsOnMainNextAction
        : WIZARD_COPY.summary.noActiveSpecsNextAction;
    case "index-degraded":
      return WIZARD_COPY.summary.indexDegradedNextAction;
  }
}

function unfocusedAlternatives(
  focusState: Exclude<SummaryFocusState, "focused">
): readonly string[] {
  switch (focusState) {
    case "branch-missing":
    case "branch-unmapped":
      return [
        WIZARD_COPY.summary.alternativeOpenSpecs,
        WIZARD_COPY.summary.alternativeChooseSpec,
        WIZARD_COPY.summary.alternativeStartSpec,
      ];
    case "no-active-specs":
      return [WIZARD_COPY.summary.alternativeStartSpec, WIZARD_COPY.summary.alternativeUpdateRepo];
    case "index-degraded":
      return [WIZARD_COPY.summary.alternativeChooseSpec, WIZARD_COPY.summary.alternativeStartSpec];
  }
}

function isMainBranch(branch: string | null | undefined): boolean {
  return branch === "main" || branch === "master" || branch === "trunk";
}

function specStateLines(model: CockpitModel, snapshot?: SpecWorkSnapshot): readonly string[] {
  const lines: string[] = [];
  const current = snapshot ? currentSpecForBranch(snapshot) : null;
  if (current) {
    lines.push(
      formatCopy(WIZARD_COPY.summary.currentSpecState, {
        id: current.entry.id,
        slug: current.entry.slug,
      })
    );
  } else if (snapshot && snapshot.indexAvailable && snapshot.entries.length === 0) {
    lines.push(WIZARD_COPY.summary.specNoneState);
  } else if (snapshot) {
    lines.push(WIZARD_COPY.summary.specUnknownState);
  }

  const branch = snapshot?.currentBranch ?? model.work.snapshot.collected.facts.git.branch ?? null;
  lines.push(
    branch
      ? formatCopy(WIZARD_COPY.summary.currentBranch, { branch })
      : WIZARD_COPY.summary.unknownBranch
  );
  return lines;
}

function renderPublicSpecIndexBlock(lines: string[], snapshot?: SpecWorkSnapshot): void {
  if (!snapshot || !shouldRenderPublicSpecIndex(snapshot)) return;

  lines.push(WIZARD_COPY.summary.publicIndex);
  if (!snapshot.indexAvailable) {
    lines.push(...wrapBullet(WIZARD_COPY.summary.indexUnavailable));
    for (const warning of snapshot.warnings) lines.push(...wrapBullet(warning));
    lines.push("");
    return;
  }

  if (snapshot.entries.length === 0) {
    lines.push(...wrapBullet(WIZARD_COPY.summary.indexNone));
    for (const warning of snapshot.warnings) lines.push(...wrapBullet(warning));
    lines.push("");
    return;
  }

  lines.push(
    ...wrapBullet(
      snapshot.entries.length === 1
        ? WIZARD_COPY.summary.indexSingle
        : formatCopy(WIZARD_COPY.summary.indexMultiple, {
            count: String(snapshot.entries.length),
          })
    )
  );

  const current = currentSpecForBranch(snapshot);
  if (current) {
    lines.push(
      ...wrapBullet(
        formatCopy(WIZARD_COPY.summary.indexCurrentBranch, {
          id: current.entry.id,
          slug: current.entry.slug,
        })
      )
    );
  } else {
    lines.push(...wrapBullet(WIZARD_COPY.summary.indexBranchMismatch));
  }
  for (const warning of snapshot.warnings) lines.push(...wrapBullet(warning));
  lines.push("");
}

function shouldRenderPublicSpecIndex(snapshot: SpecWorkSnapshot): boolean {
  if (!snapshot.indexAvailable) return true;
  if (snapshot.entries.length === 0) return false;
  if (snapshot.entries.length > 1) return true;
  return !currentSpecForBranch(snapshot);
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
  if (recommended?.id === "finish-step") lines.push(WIZARD_COPY.context.finishAvailable);
  if (model.flow?.blocked.some((action) => action.id === "advance-step")) {
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
      choices: buildFlowMenu(model, provisioning, specWork),
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
