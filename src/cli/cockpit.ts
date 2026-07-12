/**
 * Resumo situado do comando raiz (`npm run flow`).
 *
 * Read-only: carrega o snapshot governado, projeta a orientação de trabalho e as
 * decisões humanas aplicáveis. Não executa mutações nem depende de memória de
 * agente.
 */
import {
  collectWorkBrief,
  CollectedWorkBrief,
  WorkBrief,
  WorkNextActionCommand,
} from "./workBrief.js";
import {
  collectDecisionSnapshot,
  DecisionSnapshot,
  DecisionSnapshotOptions,
} from "./decide/snapshot.js";
import { ghRemotePrCollector } from "./handoff.js";
import { DecisionRegistry, buildDecisionRegistry } from "./decide/registry.js";
import { DecisionAvailability } from "./decide/model.js";
import {
  deriveGovernedFlow,
  GovernedFlow,
  GovernedFlowAction,
  HumanSummary,
} from "./flow/GovernedFlow.js";
import { FLOW_COPY, formatCopy } from "./copy/flowCopy.js";

const COCKPIT_COPY = FLOW_COPY.cockpit;

export interface Logger {
  info(message: string): void;
  error(message: string): void;
}

export interface CockpitDecisionItem {
  readonly id: string;
  readonly title: string;
  readonly availability: DecisionAvailability;
  readonly command?: string;
  readonly mutatingCommand?: string;
}

export interface CockpitModel {
  readonly work: CollectedWorkBrief;
  readonly decisions: readonly CockpitDecisionItem[];
  readonly flow?: GovernedFlow;
}

function commandForDecision(id: string, mutating: boolean): string {
  if (!mutating) return `npm run flow -- decide --type ${id} --brief-only`;
  const decision =
    id === "finish-step"
      ? "finish"
      : id === "mark-readiness"
        ? "mark-ready"
        : id === "advance-step"
          ? "advance"
          : id === "close-dispositions"
            ? "accept-all"
            : id === "human-gate"
              ? "approve"
              : "<choice>";
  return `npm run flow -- decide --type ${id} --decision ${decision} --authorization explicit-human-decision --confirm`;
}

function recommendedDecision(model: CockpitModel): CockpitDecisionItem | null {
  if (model.flow?.recommended) return model.flow.recommended;
  const byId = new Map(model.decisions.map((d) => [d.id, d]));
  const preferred = [
    "close-dispositions",
    "finish-step",
    "mark-readiness",
    "advance-step",
    "human-gate",
  ];
  for (const id of preferred) {
    const item = byId.get(id);
    if (item?.availability.status === "available") return item;
  }
  return null;
}

function renderCommandList(lines: string[], commands: readonly WorkNextActionCommand[]): void {
  if (commands.length === 0) {
    lines.push(`- ${COCKPIT_COPY.noExecutableCommand}`);
    return;
  }
  for (const command of commands) {
    lines.push(`- ${command.label}: \`${command.command}\``);
  }
}

export function renderHumanSummary(summary: HumanSummary): string {
  const lines: string[] = [];
  lines.push(`## ${COCKPIT_COPY.simpleSummary}`);
  for (const item of summary.state) lines.push(`- ${item}`);
  if (summary.currentObject || summary.nextObject) {
    lines.push("- Escopo em linguagem simples:");
    if (summary.currentObject) {
      lines.push(`  - Agora: ${summary.currentObject.label}`);
      lines.push(`    - Objetivo: ${summary.currentObject.objective}`);
      if (summary.currentObject.output) {
        lines.push(`    - Entrega esperada: ${summary.currentObject.output}`);
      }
    }
    if (summary.nextObject) {
      lines.push(`  - Depois: ${summary.nextObject.label}`);
      lines.push(`    - Objetivo: ${summary.nextObject.objective}`);
      if (summary.nextObject.output) {
        lines.push(`    - Entrega esperada: ${summary.nextObject.output}`);
      }
    }
  }
  lines.push(`- Próximo passo: ${summary.nextAction}`);
  if (summary.command) lines.push(`- Para entender antes de aplicar: \`${summary.command}\``);
  if (summary.ready.length > 0) {
    lines.push("- Já está ok:");
    for (const item of summary.ready) lines.push(`  - ${item}`);
  }
  if (summary.missing.length > 0) {
    lines.push("- Ainda falta:");
    for (const item of summary.missing) lines.push(`  - ${item}`);
  }
  return lines.join("\n");
}

export function renderCockpit(model: CockpitModel): string {
  const { work } = model;
  const facts = work.snapshot.collected.facts;
  const brief: WorkBrief = work.brief;
  const pr = facts.pullRequest;
  const recommended = recommendedDecision(model);
  const available = model.decisions.filter((d) => d.availability.status === "available");
  const blocked = model.decisions.filter((d) => d.availability.status === "blocked");

  const lines: string[] = [];
  lines.push(`# ${COCKPIT_COPY.title} — ${facts.spec.label}`);
  lines.push("");
  if (model.flow?.humanSummary) {
    lines.push(renderHumanSummary(model.flow.humanSummary));
    lines.push("");
  }
  lines.push(`## ${COCKPIT_COPY.currentState}`);
  lines.push(
    `- ${COCKPIT_COPY.branch}: ${facts.git.branch ?? "?"} · ${COCKPIT_COPY.head}: ${
      facts.git.head ?? "?"
    }`
  );
  lines.push(
    `- ${COCKPIT_COPY.checkpoint}: ${brief.checkpoint ?? "(sem cursor)"} · ${COCKPIT_COPY.mode}: ${brief.mode}`
  );
  if (brief.object.step) {
    const sub = brief.object.step;
    lines.push(
      `- ${COCKPIT_COPY.activeStep}: ${sub.id} — ${sub.title} (tasks.md linha ${sub.line})`
    );
  } else if (brief.object.transition) {
    const transition = brief.object.transition;
    if (transition.conclude) {
      lines.push(
        `- ${COCKPIT_COPY.pendingTransition}: ${transition.conclude.id} → ${transition.activate.id}`
      );
    } else {
      lines.push(`- ${COCKPIT_COPY.pendingActivation}: ${transition.activate.id}`);
    }
  }
  if (facts.lifecycle) {
    lines.push(
      `- ${COCKPIT_COPY.reviewsFindings}: ${facts.lifecycle.openFindings} ${COCKPIT_COPY.open} / ${facts.lifecycle.closedFindings} ${COCKPIT_COPY.closed} · ${COCKPIT_COPY.resolutions}: ${facts.lifecycle.resolutions}`
    );
  }
  lines.push(
    pr
      ? `- ${COCKPIT_COPY.pr} #${pr.number}: ${pr.state}${
          pr.isDraft ? ` · ${COCKPIT_COPY.draft}` : ` · ${COCKPIT_COPY.ready}`
        } · ${COCKPIT_COPY.ci} ${pr.checks.pass} ${COCKPIT_COPY.ok} / ${pr.checks.fail} ${
          COCKPIT_COPY.failures
        } / ${pr.checks.pending} ${COCKPIT_COPY.pending}`
      : `- ${COCKPIT_COPY.pr}: ${COCKPIT_COPY.notObserved}`
  );
  lines.push(`- ${COCKPIT_COPY.workingTree}: ${brief.workingTreeState}`);
  lines.push("");
  lines.push(`## ${COCKPIT_COPY.recommended}`);
  if (recommended) {
    lines.push(`- ${recommended.title}`);
    if (recommended.availability.hint) lines.push(`  - ${recommended.availability.hint}`);
    lines.push(
      `  - ${COCKPIT_COPY.understandBeforeApply}: \`${
        recommended.command ?? commandForDecision(recommended.id, false)
      }\``
    );
    lines.push(
      `  - ${COCKPIT_COPY.apply}: \`${
        recommended.mutatingCommand ?? commandForDecision(recommended.id, true)
      }\``
    );
  } else {
    lines.push(`- ${brief.nextAction.description}`);
    for (const basis of brief.nextAction.basis) lines.push(`  - ${basis}`);
    if (brief.nextAction.commands.length > 0) {
      lines.push(`- ${COCKPIT_COPY.commands}:`);
      renderCommandList(lines, brief.nextAction.commands);
    }
  }
  lines.push("");
  lines.push(`## ${COCKPIT_COPY.available}`);
  if (available.length === 0) {
    lines.push(`- ${COCKPIT_COPY.noAvailableDecision}`);
  } else {
    for (const item of available) {
      const role =
        recommended?.id === item.id ? COCKPIT_COPY.recommendedRole : COCKPIT_COPY.alternativeRole;
      lines.push(
        `- ${role} — ${item.title}: \`${item.command ?? commandForDecision(item.id, false)}\``
      );
    }
  }
  lines.push("");
  lines.push(`## ${COCKPIT_COPY.blocked}`);
  if (blocked.length === 0) {
    lines.push(`- ${COCKPIT_COPY.noBlockedDecision}`);
  } else {
    for (const item of blocked) {
      lines.push(`- ${item.title}`);
      for (const reason of item.availability.reasons) lines.push(`  - ${reason}`);
      lines.push(
        `  - ${COCKPIT_COPY.inspection}: \`${item.command ?? commandForDecision(item.id, false)}\``
      );
    }
  }
  lines.push("");
  lines.push(`## ${COCKPIT_COPY.forbidden}`);
  const forbidden = new Set(
    [
      ...brief.forbiddenActions,
      ...brief.nextAction.stillForbidden,
      ...COCKPIT_COPY.extraForbidden,
    ].map(formatForbiddenAction)
  );
  for (const item of forbidden) lines.push(`- ${item}`);
  lines.push("");
  lines.push(`## ${COCKPIT_COPY.usefulCommands}`);
  lines.push(`- ${COCKPIT_COPY.useful.handoff}: \`npm run flow -- handoff 0024\``);
  lines.push(
    `- ${COCKPIT_COPY.useful.work}: \`npm run flow -- work --authorization explicit-work-request\``
  );
  lines.push(`- ${COCKPIT_COPY.useful.decisions}: \`npm run flow -- decide --brief-only\``);
  lines.push(`- ${COCKPIT_COPY.useful.changedValidation}: \`npm run flow -- validate changed\``);
  lines.push(`- ${COCKPIT_COPY.useful.fullValidation}: \`npm run validate\``);
  return `${lines.join("\n")}\n`;
}

function formatForbiddenAction(action: string): string {
  return (
    COCKPIT_COPY.forbiddenLabels[action as keyof typeof COCKPIT_COPY.forbiddenLabels] ?? action
  );
}

export interface RunCockpitOptions extends DecisionSnapshotOptions {
  readonly registry?: DecisionRegistry;
}

export function buildCockpitModel(
  work: CollectedWorkBrief,
  decisionSnapshot: DecisionSnapshot,
  registry: DecisionRegistry = buildDecisionRegistry()
): CockpitModel {
  void registry;
  const flow = deriveGovernedFlow(decisionSnapshot);
  return {
    work,
    flow,
    decisions: flow.actions
      .map((definition: GovernedFlowAction) => ({
        id: definition.id,
        title: definition.title,
        availability: definition.availability,
        command: definition.command,
        mutatingCommand: definition.mutatingCommand,
      }))
      .filter((item) => item.availability.status !== "not-applicable"),
  };
}

export function collectCockpitModel(
  repoRoot: string,
  options: RunCockpitOptions = {}
): CockpitModel {
  const situatedOptions: RunCockpitOptions = {
    ...options,
    remote: options.remote === undefined ? ghRemotePrCollector : options.remote,
  };
  const work = collectWorkBrief(repoRoot, situatedOptions);
  const decisionSnapshot = collectDecisionSnapshot(repoRoot, situatedOptions);
  return buildCockpitModel(work, decisionSnapshot, options.registry);
}

export function runCockpit(
  repoRoot: string,
  logger: Logger,
  options: RunCockpitOptions = {}
): number {
  try {
    logger.info(renderCockpit(collectCockpitModel(repoRoot, options)).trimEnd());
    return 0;
  } catch (error) {
    logger.error(
      formatCopy(COCKPIT_COPY.error, {
        message: error instanceof Error ? error.message : String(error),
      })
    );
    return 1;
  }
}
