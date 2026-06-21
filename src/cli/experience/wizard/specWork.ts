import { Prompts } from "../../../app/ports/Prompts.js";
import type { ResolvedActiveSpec } from "../../../app/workflow/ListActiveSpecs.js";
import { CockpitModel } from "../../cockpit.js";
import { FLOW_COPY, copyLines, formatCopy } from "../../copy/flowCopy.js";
import { CommandContext } from "../../registry/Command.js";
import { CommandRegistry } from "../../registry/CommandRegistry.js";
import { LoadActiveSpecsIndex } from "../../registry/commands/loadActiveSpecsIndex.js";

const COMMON_COPY = FLOW_COPY.common;
const WIZARD_COPY = FLOW_COPY.wizard;

type SpecWorkMenuChoice =
  | "choose-spec"
  | "active-specs"
  | "continue-other"
  | "new-spec"
  | "__back__";
type SpecSelectionChoice = string | "__manual__" | "__back__";

export async function runSpecWorkSection(
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

export interface SpecWorkSnapshot {
  readonly currentBranch: string | null;
  readonly indexAvailable: boolean;
  readonly entries: readonly ResolvedActiveSpec[];
  readonly warnings: readonly string[];
}

export function collectSpecWorkSnapshot(
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

export function currentSpecForBranch(snapshot: SpecWorkSnapshot): ResolvedActiveSpec | null {
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
