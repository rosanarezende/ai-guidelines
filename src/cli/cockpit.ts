/**
 * Cockpit situado do comando raiz (`npm run guidelines`).
 *
 * Read-only: carrega o snapshot governado, projeta o briefing de trabalho e as
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

export interface Logger {
  info(message: string): void;
  error(message: string): void;
}

export interface CockpitDecisionItem {
  readonly id: string;
  readonly title: string;
  readonly availability: DecisionAvailability;
}

export interface CockpitModel {
  readonly work: CollectedWorkBrief;
  readonly decisions: readonly CockpitDecisionItem[];
}

function commandForDecision(id: string, mutating: boolean): string {
  if (!mutating) return `npm run guidelines -- decide --type ${id} --brief-only`;
  const decision =
    id === "mark-readiness"
      ? "mark-ready"
      : id === "advance-subcheckpoint"
        ? "advance"
        : id === "close-dispositions"
          ? "accept-all"
          : id === "human-gate"
            ? "approve"
            : "<choice>";
  return `npm run guidelines -- decide --type ${id} --decision ${decision} --authorization explicit-human-decision --confirm`;
}

function recommendedDecision(model: CockpitModel): CockpitDecisionItem | null {
  const byId = new Map(model.decisions.map((d) => [d.id, d]));
  const preferred = ["close-dispositions", "mark-readiness", "advance-subcheckpoint", "human-gate"];
  for (const id of preferred) {
    const item = byId.get(id);
    if (item?.availability.status === "available") return item;
  }
  return null;
}

function renderCommandList(lines: string[], commands: readonly WorkNextActionCommand[]): void {
  if (commands.length === 0) {
    lines.push("- (nenhum comando executável projetado)");
    return;
  }
  for (const command of commands) {
    lines.push(`- ${command.label}: \`${command.command}\``);
  }
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
  lines.push(`# Cockpit situado — ${facts.spec.label}`);
  lines.push("");
  lines.push("## Estado atual");
  lines.push(`- branch: ${facts.git.branch ?? "?"} · HEAD: ${facts.git.head ?? "?"}`);
  lines.push(`- checkpoint: ${brief.checkpoint ?? "(sem cursor)"} · modo: ${brief.mode}`);
  if (brief.object.subCheckpoint) {
    const sub = brief.object.subCheckpoint;
    lines.push(`- sub-checkpoint ativo: ${sub.id} — ${sub.title} (tasks.md linha ${sub.line})`);
  } else if (brief.object.transition) {
    const transition = brief.object.transition;
    if (transition.conclude) {
      lines.push(`- transição pendente: ${transition.conclude.id} → ${transition.activate.id}`);
    } else {
      lines.push(`- ativação pendente: ${transition.activate.id}`);
    }
  }
  if (facts.lifecycle) {
    lines.push(
      `- reviews/findings: ${facts.lifecycle.openFindings} open / ${facts.lifecycle.closedFindings} closed · resolutions: ${facts.lifecycle.resolutions}`
    );
  }
  lines.push(
    pr
      ? `- PR #${pr.number}: ${pr.state}${pr.isDraft ? " · Draft" : " · Ready"} · CI ${pr.checks.pass} ok / ${pr.checks.fail} falha(s) / ${pr.checks.pending} pendente(s)`
      : "- PR: não observado"
  );
  lines.push(`- working tree: ${brief.workingTreeState}`);
  lines.push("");
  lines.push("## Próxima ação recomendada");
  if (recommended) {
    lines.push(`- ${recommended.title}`);
    if (recommended.availability.hint) lines.push(`  - ${recommended.availability.hint}`);
    lines.push(`  - briefing: \`${commandForDecision(recommended.id, false)}\``);
    lines.push(`  - aplicar: \`${commandForDecision(recommended.id, true)}\``);
  } else {
    lines.push(`- ${brief.nextAction.description}`);
    for (const basis of brief.nextAction.basis) lines.push(`  - ${basis}`);
    if (brief.nextAction.commands.length > 0) {
      lines.push("- comandos:");
      renderCommandList(lines, brief.nextAction.commands);
    }
  }
  lines.push("");
  lines.push("## Ações disponíveis");
  if (available.length === 0) {
    lines.push("- (nenhuma decisão mutante disponível agora)");
  } else {
    for (const item of available) {
      lines.push(`- ${item.title}: \`${commandForDecision(item.id, false)}\``);
    }
  }
  lines.push("");
  lines.push("## Ações bloqueadas");
  if (blocked.length === 0) {
    lines.push("- (nenhuma)");
  } else {
    for (const item of blocked) {
      lines.push(`- ${item.title}`);
      for (const reason of item.availability.reasons) lines.push(`  - ${reason}`);
      lines.push(`  - inspeção: \`${commandForDecision(item.id, false)}\``);
    }
  }
  lines.push("");
  lines.push("## Ações proibidas");
  const forbidden = new Set([
    ...brief.forbiddenActions,
    ...brief.nextAction.stillForbidden,
    "Executar Human Gate sem decisão humana explícita",
    "Converter PR para Ready fora do fluxo governado",
    "Fazer merge",
  ]);
  for (const item of forbidden) lines.push(`- ${item}`);
  lines.push("");
  lines.push("## Comandos úteis");
  lines.push("- handoff: `npm run guidelines -- handoff 0024`");
  lines.push("- trabalho: `npm run guidelines -- work --authorization explicit-work-request`");
  lines.push("- decisões: `npm run guidelines -- decide --brief-only`");
  lines.push("- validação local: `npm run validate`");
  return `${lines.join("\n")}\n`;
}

export interface RunCockpitOptions extends DecisionSnapshotOptions {
  readonly registry?: DecisionRegistry;
}

export function buildCockpitModel(
  work: CollectedWorkBrief,
  decisionSnapshot: DecisionSnapshot,
  registry: DecisionRegistry = buildDecisionRegistry()
): CockpitModel {
  return {
    work,
    decisions: registry
      .definitions()
      .map((definition) => ({
        id: definition.id,
        title: definition.title,
        availability: definition.detect(decisionSnapshot),
      }))
      .filter((item) => item.availability.status !== "not-applicable"),
  };
}

export function runCockpit(
  repoRoot: string,
  logger: Logger,
  options: RunCockpitOptions = {}
): number {
  try {
    const situatedOptions: RunCockpitOptions = {
      ...options,
      remote: options.remote === undefined ? ghRemotePrCollector : options.remote,
    };
    const work = collectWorkBrief(repoRoot, situatedOptions);
    const decisionSnapshot = collectDecisionSnapshot(repoRoot, situatedOptions);
    logger.info(
      renderCockpit(buildCockpitModel(work, decisionSnapshot, options.registry)).trimEnd()
    );
    return 0;
  } catch (error) {
    logger.error(
      `❌ cockpit — estado irrecuperável: ${error instanceof Error ? error.message : String(error)}`
    );
    return 1;
  }
}
