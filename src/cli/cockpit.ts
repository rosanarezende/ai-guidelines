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
    id === "finish-subcheckpoint"
      ? "finish"
      : id === "mark-readiness"
        ? "mark-ready"
        : id === "advance-subcheckpoint"
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
    "finish-subcheckpoint",
    "mark-readiness",
    "advance-subcheckpoint",
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
    lines.push("- (nenhum comando executável projetado)");
    return;
  }
  for (const command of commands) {
    lines.push(`- ${command.label}: \`${command.command}\``);
  }
}

export function renderHumanSummary(summary: HumanSummary): string {
  const lines: string[] = [];
  lines.push("## Resumo simples");
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
  lines.push(`# Resumo do fluxo — ${facts.spec.label}`);
  lines.push("");
  if (model.flow?.humanSummary) {
    lines.push(renderHumanSummary(model.flow.humanSummary));
    lines.push("");
  }
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
    lines.push(
      `  - entender antes de aplicar: \`${recommended.command ?? commandForDecision(recommended.id, false)}\``
    );
    lines.push(
      `  - aplicar: \`${recommended.mutatingCommand ?? commandForDecision(recommended.id, true)}\``
    );
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
      const role = recommended?.id === item.id ? "Recomendada" : "Alternativa";
      lines.push(
        `- ${role} — ${item.title}: \`${item.command ?? commandForDecision(item.id, false)}\``
      );
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
      lines.push(`  - inspeção: \`${item.command ?? commandForDecision(item.id, false)}\``);
    }
  }
  lines.push("");
  lines.push("## Ações proibidas");
  const forbidden = new Set(
    [
      ...brief.forbiddenActions,
      ...brief.nextAction.stillForbidden,
      "Executar Human Gate sem decisão humana explícita",
      "Converter PR para Ready fora do fluxo governado",
      "Fazer merge",
    ].map(formatForbiddenAction)
  );
  for (const item of forbidden) lines.push(`- ${item}`);
  lines.push("");
  lines.push("## Comandos úteis");
  lines.push("- handoff: `npm run flow -- handoff 0024`");
  lines.push("- trabalho: `npm run flow -- work --authorization explicit-work-request`");
  lines.push("- decisões: `npm run flow -- decide --brief-only`");
  lines.push("- validação intermediária: `npm run flow -- validate changed`");
  lines.push("- validação completa para decisão: `npm run validate`");
  return `${lines.join("\n")}\n`;
}

function formatForbiddenAction(action: string): string {
  const labels: Record<string, string> = {
    "modify-functional-files": "Alterar arquivos funcionais enquanto o estado estiver divergente",
    "create-resolutions": "Criar resolutions fora do fluxo autorizado",
    "update-pr-body": "Atualizar o corpo do PR fora do fluxo autorizado",
    "run-review": "Executar revisão sem pedido explícito",
    ready: "Converter o PR para Ready",
    "human-gate": "Executar o Human Gate",
    merge: "Fazer merge",
    "edit-review": "Editar artefato de review publicado",
    "close-dispositions": "Fechar dispositions fora da decisão governada",
    "start-next-subcheckpoint": "Iniciar o próximo ponto fora da decisão governada",
  };
  return labels[action] ?? action;
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
      `❌ cockpit — estado irrecuperável: ${error instanceof Error ? error.message : String(error)}`
    );
    return 1;
  }
}
