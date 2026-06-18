import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { ClipboardWriter } from "../app/ports/ClipboardWriter.js";
import { isPromptCancelled, Prompts } from "../app/ports/Prompts.js";
import {
  ReviewPolicy,
  activeReviewPolicyProfile,
  parseReviewPolicy,
} from "../infrastructure/yaml/reviewPolicyReader.js";
import { NodeClipboard, clipboardInstallHint } from "../infrastructure/io/NodeClipboard.js";
import { CockpitModel, collectCockpitModel, renderCockpit } from "./cockpit.js";
import type { HumanObjectSummary, HumanSummary } from "./flow/GovernedFlow.js";
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
  | "policy"
  | "details"
  | "__back__";
type AdvancedMenuChoice =
  | "continue-other"
  | "active-specs"
  | "drift"
  | "visual-prompt"
  | "publication"
  | "final-ops"
  | "__back__";

interface ProvisioningContextSummary {
  readonly operation: ProvisioningOperation;
  readonly stateTitle: string;
  readonly evidence: readonly string[];
  readonly guidance: string;
  readonly advancedReason: string;
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

export type FlowMenuValue =
  | "cockpit"
  | "next"
  | "alternative"
  | "validate"
  | "decisions"
  | "blockers"
  | "work"
  | "review"
  | "provisioning"
  | "advanced"
  | "quit";

export interface FlowWizardOptions {
  readonly prompts: Prompts;
  readonly registry: CommandRegistry;
  readonly clipboard?: ClipboardWriter;
  readonly collectModel?: (repoRoot: string) => CockpitModel;
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

  choices.push({ name: "Ver resumo completo antes de escolher", value: "cockpit" });

  if (recommended) {
    choices.push({
      name: `PRÓXIMA AÇÃO RECOMENDADA: ${recommendedActionLabel(model, recommended.title)}`,
      value: "next",
      hint: "opção principal para este estado",
    });
  } else if (recommendValidation) {
    choices.push({
      name: `PRÓXIMA AÇÃO RECOMENDADA: ${recommendedActionLabel(model, "Finalizar as mudanças locais e deixar a working tree limpa.")}`,
      value: "validate",
      hint: "opção principal agora",
    });
  }

  if (alternatives.length === 1) {
    const [alternative] = alternatives;
    choices.push({
      name: `ALTERNATIVA: ${humanActionTitle(alternative.id, alternative.title)}`,
      value: "alternative",
      hint: "mostra detalhes; não aplica nada",
    });
  } else if (alternatives.length > 1) {
    choices.push({
      name: "Analisar alternativas",
      value: "alternative",
      hint: `${alternatives.length} caminhos disponíveis sem aplicar nada automaticamente`,
    });
  }

  if (!recommendValidation) {
    choices.push({ name: "Validar minhas mudanças", value: "validate" });
  }
  choices.push(
    {
      name: "Ver ações disponíveis e bloqueadas",
      value: "decisions",
      hint: "mostra o que pode ser feito agora e por quê",
    },
    {
      name: "Ver orientação de trabalho / handoff",
      value: "work",
      hint: "copia contexto para colar na LLM de sua preferência",
    },
    {
      name: "Ver tipos de revisão disponíveis",
      value: "review",
      hint: "explica quais revisões existem e copia o catálogo",
    },
    {
      name: provisioningMainLabel(provisioning),
      value: "provisioning",
      hint: provisioningMainHint(provisioning),
    },
    {
      name: "Ferramentas técnicas e diagnósticos",
      value: "advanced",
      hint: "para quando você quer inspecionar ou diagnosticar algo específico",
    },
    { name: "Sair", value: "quit" }
  );

  return choices;
}

function humanActionTitle(id: string, fallback: string): string {
  if (id === "close-dispositions") return "fechar feedbacks já resolvidos";
  if (id === "finish-subcheckpoint") return "concluir este ponto e abrir o próximo";
  if (id === "mark-readiness") return "declarar que este ponto está pronto";
  if (id === "advance-subcheckpoint") return "abrir o próximo ponto de trabalho";
  if (id === "human-gate") return "preparar decisão humana do checkpoint";
  if (id === "open-next-node") return "abrir o próximo PR da stack";
  if (id === "pr-ready") return "verificar se o PR pode sair de Draft";
  if (id === "review-insight-candidates")
    return "Ver percepções recorrentes que precisam de decisão";
  return fallback;
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
  title: "AGORA" | "DEPOIS",
  object: HumanObjectSummary | null
): void {
  if (!object) return;
  lines.push(title);
  lines.push(`  ${object.label}`);
  lines.push("");
  pushWrapped(lines, "Objetivo:", object.objective);
  pushWrapped(lines, "Entrega:", object.output);
  lines.push("");
}

export function renderFlowSummary(model: CockpitModel): string {
  if (model.flow?.humanSummary) return renderWizardHumanSummary(model.flow.humanSummary, model);

  const facts = model.work.snapshot.collected.facts;
  const pr = facts.pullRequest;
  const active = model.work.brief.object.subCheckpoint;
  return [
    `branch: ${facts.git.branch ?? "?"}`,
    `HEAD: ${facts.git.head ?? "?"}`,
    `modo: ${model.work.brief.mode}`,
    active ? `sub-checkpoint: ${active.id} — ${active.title}` : "sub-checkpoint: (nenhum)",
    pr
      ? `PR #${pr.number}: ${pr.isDraft ? "Draft" : "Ready"} · CI ${pr.checks.pass} ok / ${pr.checks.fail} falha(s) / ${pr.checks.pending} pendente(s)`
      : "PR: não observado",
    `próxima ação: ${model.flow?.recommended?.title ?? model.work.brief.nextAction.description}`,
  ].join("\n");
}

function renderWizardHumanSummary(summary: HumanSummary, model: CockpitModel): string {
  const lines: string[] = [];
  const recommended = model.flow?.recommended ?? null;
  const alternatives = (model.flow?.available ?? []).filter(
    (action) => action.id !== recommended?.id
  );
  lines.push("ESTADO");
  for (const item of summary.state) {
    lines.push(...wrapText(item, "  ", 74));
  }
  lines.push("");

  renderObjectBlock(lines, "AGORA", summary.currentObject);
  renderObjectBlock(lines, "DEPOIS", summary.nextObject);

  if (summary.ready.length > 0) {
    lines.push("JÁ ESTÁ OK");
    for (const item of summary.ready) lines.push(...wrapBullet(item));
    lines.push("");
  }

  if (summary.missing.length > 0) {
    lines.push("AINDA FALTA");
    for (const item of summary.missing) lines.push(...wrapBullet(item));
    lines.push("");
  }

  lines.push("PRÓXIMA AÇÃO RECOMENDADA");
  lines.push(...wrapText(summary.nextAction, "  ", 70));
  if (summary.command) {
    lines.push("  Para entender antes de aplicar:");
    lines.push(`  ${summary.command}`);
  }

  if (alternatives.length > 0) {
    lines.push("");
    lines.push("ALTERNATIVAS");
    for (const action of alternatives) {
      lines.push(...wrapBullet(humanActionTitle(action.id, action.title)));
      if (action.command) {
        lines.push(...wrapText(action.command, "      ", 64));
      }
    }
  }

  return lines.join("\n").trimEnd();
}

export function renderBlockedActions(model: CockpitModel): string {
  const blocked = model.flow?.blocked ?? [];
  if (blocked.length === 0) return "Nenhuma ação bloqueada pelo modelo comum.";
  return blocked
    .map((action) => {
      const reasons = action.availability.reasons.map((reason) => `  - ${reason}`).join("\n");
      return `${action.title}\n${reasons || "  - sem motivo registrado"}`;
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

  try {
    await prompts.intro?.("ai-guidelines flow");
    const summary = renderFlowSummary(model);
    if (prompts.box) await prompts.box(summary, "Estado atual");
    else await prompts.note?.(summary, "Estado atual");

    const choice = await prompts.select<FlowMenuValue>({
      message: "O que você quer fazer agora?",
      choices: buildFlowMenu(model, provisioning),
    });

    switch (choice) {
      case "cockpit":
        logger.info(renderCockpit(model).trimEnd());
        await prompts.outro?.("Resumo completo renderizado.");
        return 0;
      case "next":
        if (!model.flow?.recommended) {
          await prompts.note?.(renderBlockedActions(model), "Sem ação disponível");
          await prompts.outro?.("Nenhuma mutação executada.");
          return 0;
        }
        return runRecommendedAction(model, registry, context, prompts);
      case "alternative":
        return runAlternativeAction(model, registry, context, prompts);
      case "validate":
        return runValidationSection(registry, context, prompts);
      case "decisions":
        return registry.dispatch(["decide", "--brief-only"], context).then((r) => r.exitCode);
      case "blockers":
        await prompts.note?.(renderBlockedActions(model), "O que impede o avanço");
        await prompts.outro?.("Bloqueios exibidos.");
        return 0;
      case "work":
        return runHandoffSection(model, registry, context, prompts, clipboard);
      case "review":
        return runReviewSection(registry, context, prompts, clipboard);
      case "provisioning":
        return runProvisioningSection(repoRoot, registry, context, prompts, provisioning);
      case "advanced":
        return runAdvancedSection(registry, context, prompts);
      case "quit":
        await prompts.outro?.("Saindo sem alterações.");
        return 0;
    }
  } catch (error) {
    if (isPromptCancelled(error)) {
      await prompts.cancel?.(error.message);
      await prompts.outro?.("Saindo sem alterações.");
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
    "## Próximo passo recomendado",
    "",
    humanActionTitle(recommended.id, recommended.title),
    "",
    "Para entender antes de aplicar:",
    recommended.command,
    "",
    "O que essa decisão pode mudar:",
    ...recommended.effect.map((effect) => `- ${effect}`),
  ];
  if (recommended.mutatingCommand) {
    lines.push(
      "",
      "Se houver confirmação humana, este é o comando que aplica:",
      recommended.mutatingCommand
    );
  }
  await prompts.note?.(lines.join("\n"), "Próximo passo");
  const proceed = await prompts.confirm({
    message: "Abrir a tela de decisão agora?",
    default: false,
  });
  if (!proceed) {
    await prompts.outro?.("Nenhuma decisão executada.");
    return 0;
  }
  return (await registry.dispatch(["decide"], context)).exitCode;
}

async function runAlternativeAction(
  model: CockpitModel,
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts
): Promise<number> {
  const alternatives = alternativesFor(model);
  const alternative =
    alternatives.length <= 1
      ? alternatives[0]
      : await prompts.select<CockpitModel["decisions"][number]>({
          message: "Alternativas disponíveis:",
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
    await prompts.status?.(
      "success",
      `${title} copiado para o clipboard. Cole na LLM de sua preferência para continuar.`
    );
    return;
  }
  const hint = clipboardInstallHint();
  await prompts.status?.(
    "warn",
    `${title} não pôde ser copiado automaticamente; mostrando o conteúdo para cópia manual.`
  );
  if (hint) context.logger.info(hint);
  context.logger.info(`--- ${title.toUpperCase()} ---`);
  context.logger.info(text);
  context.logger.info(`--- FIM ${title.toUpperCase()} ---`);
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
  await prompts.note?.(
    [
      "Vou preparar um pacote de contexto para colar na LLM de sua preferência.",
      "",
      "Ele inclui:",
      "- handoff situado da spec ativa;",
      "- orientação de trabalho projetada pelo fluxo atual.",
      "",
      "Nada será alterado no repositório.",
    ].join("\n"),
    "Orientação de trabalho / handoff"
  );
  const spec = specIdentifierFromContext(context, model);
  const handoff = await captureCommandOutput(registry, context, ["handoff", spec]);
  const work = await captureCommandOutput(registry, context, ["work"]);
  const text = [
    "# Orientação de trabalho / handoff",
    "",
    "## Handoff situado",
    handoff.output,
    "",
    "## Orientação de trabalho",
    work.output,
  ].join("\n");
  await copyOrPrint("Orientação de trabalho / handoff", text, context, prompts, clipboard);
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
    message: "Como você quer conferir suas mudanças?",
    choices: [
      {
        name: "Validar somente o diff atual",
        value: "changed",
        hint: "rápido; não reescreve arquivos",
      },
      {
        name: "Formatar arquivos alterados e validar o diff",
        value: "changed-fix",
        hint: "pode reescrever arquivos alterados",
      },
      {
        name: "Entender a validação completa",
        value: "full-help",
        hint: "antes de Ready/Human Gate",
      },
      { name: "Voltar", value: "__back__" },
    ],
  });
  if (selected === "__back__") return 0;
  if (selected === "full-help") {
    await prompts.note?.(
      [
        "Use `npm run validate` antes de Ready/Human Gate.",
        "",
        "Durante PR Draft, `npm run flow -- validate changed` cobre o ciclo rápido do diff.",
      ].join("\n"),
      "Validação completa"
    );
    return 0;
  }
  const args =
    selected === "changed-fix" ? ["validate", "changed", "--fix"] : ["validate", "changed"];
  if (selected === "changed-fix") {
    const confirmed = await prompts.confirm({
      message: "Formatar somente arquivos alterados antes de validar?",
      default: false,
    });
    if (!confirmed) {
      await prompts.outro?.("Validação com --fix cancelada.");
      return 0;
    }
  }
  if (prompts.taskList) {
    let exitCode = 0;
    await prompts.taskList([
      {
        title: selected === "changed-fix" ? "Formatar e validar o diff" : "Validar o diff",
        task: async (message) => {
          const log = prompts.taskLog?.({
            title: "Etapas da validação",
            limit: 8,
            retainLog: true,
          });
          const group = log?.group(
            selected === "changed-fix" ? "validate changed --fix" : "validate changed"
          );
          message("Conferindo o diff com o comando governado.");
          group?.message("1/4 Conferindo espaços, finais de linha e conflitos de patch.");
          group?.message("2/4 Conferindo formatação dos arquivos alterados.");
          group?.message("3/4 Rodando build/checks aplicáveis ao diff.");
          group?.message("4/4 Consolidando o resultado para você.");
          const result = await registry.dispatch(args, context);
          exitCode = result.exitCode;
          if (exitCode !== 0) {
            group?.error(`Validação retornou exit code ${exitCode}.`);
            log?.error("Validação intermediária falhou.", { showLog: true });
            throw new Error(`Validação retornou exit code ${exitCode}.`);
          }
          group?.success("Validação intermediária passou.");
          log?.success("Validação intermediária concluída.", { showLog: true });
          return "Validação intermediária concluída.";
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
  await prompts.note?.(
    [
      "Esta área ajuda a entender quais revisões existem e qual política vale para o PR.",
      "",
      "O catálogo pode ser copiado para o clipboard para você colar em uma LLM antes de pedir uma análise.",
      "",
      "Registrar uma revisão no repositório continua exigindo comando e autorização explícitos; esta tela só prepara contexto.",
    ].join("\n"),
    "Tipos de revisão disponíveis"
  );
  const choice = await prompts.select<string>({
    message: "Qual contexto você quer preparar?",
    choices: [
      {
        name: "Copiar/ver tipos de revisão possíveis",
        value: "types",
        hint: "catálogo para colar na LLM de sua preferência",
      },
      {
        name: "Ver regra de revisão aplicada neste PR",
        value: "policy",
        hint: "mostra quais revisões são obrigatórias ou opcionais",
      },
      { name: "Voltar", value: "__back__" },
    ],
  });
  if (choice === "__back__") return 0;
  const args = ["review", choice] as const;
  const captured = await captureCommandOutput(registry, context, args);
  await copyOrPrint(
    choice === "types" ? "Tipos de revisão disponíveis" : "Regra de revisão deste PR",
    captured.output,
    context,
    prompts,
    clipboard
  );
  return captured.exitCode;
}

async function runAdvancedSection(
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts
): Promise<number> {
  const selected = await prompts.select<AdvancedMenuChoice>({
    message: "Ferramentas técnicas e diagnósticos",
    choices: [
      {
        name: "Trocar para outra spec pelo ID ou nome",
        value: "continue-other",
        hint: "somente leitura; útil quando você muda de contexto",
      },
      {
        name: "Ver trabalhos governados ativos",
        value: "active-specs",
        hint: "mostra o índice público",
      },
      {
        name: "Conferir se a lista pública está coerente",
        value: "drift",
        hint: "diagnóstico de divergência",
      },
      {
        name: "Gerar prompt visual para outro gerador de imagem",
        value: "visual-prompt",
      },
      {
        name: "Entender quando publicar o estado",
        value: "publication",
        hint: "não publica nada sozinho",
      },
      {
        name: "Entender saída de Draft, decisão humana e merge final",
        value: "final-ops",
        hint: "essas ações continuam protegidas",
      },
      { name: "Voltar", value: "__back__" },
    ],
  });

  if (selected === "__back__") return 0;
  if (selected === "continue-other") {
    const identifier = (await prompts.input({ message: "Qual spec? Ex.: 0024" })).trim();
    if (!identifier) {
      await prompts.outro?.("Nada executado.");
      return 0;
    }
    return (await registry.dispatch(["continue", identifier], context)).exitCode;
  }
  if (selected === "active-specs") return (await registry.dispatch(["specs"], context)).exitCode;
  if (selected === "drift") return (await registry.dispatch(["drift"], context)).exitCode;
  if (selected === "visual-prompt") {
    return (await registry.dispatch(["visual-prompt"], context)).exitCode;
  }
  if (selected === "publication") {
    await prompts.note?.(
      [
        "Publicar estado atualiza a projeção pública de specs ativas.",
        "",
        "Use apenas quando o fluxo governado pedir isso.",
        "",
        "Comando direto:",
        "npm run flow -- workflow publish-state --status=<status> --updated-by=<@owner>",
      ].join("\n"),
      "Publicação de estado"
    );
    return 0;
  }
  await prompts.note?.(
    [
      "Ready, Human Gate e merge não são atalhos do menu.",
      "",
      "O fluxo correto é:",
      "1. terminar o sub-checkpoint ativo;",
      "2. validar;",
      "3. preparar Ready quando o modelo permitir;",
      "4. só então a owner decide Human Gate;",
      "5. merge final acontece no nó terminal da spec.",
    ].join("\n"),
    "Operações finais"
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
    await prompts.note?.("Nenhum comando de provisioning está registrado.", "Provisioning");
    return 0;
  }

  await prompts.note?.(renderProvisioningContext(detected), provisioningMainLabel(detected));
  const selected = await prompts.select<ProvisioningMenuChoice>({
    message: "O que faz sentido agora?",
    choices:
      detected.operation === "update"
        ? governedRepoChoices(detected)
        : [
            {
              name: provisioningActionLabel(recommended),
              value: recommended,
              hint: "recomendado pelo contexto detectado",
            },
            { name: "Entender o contexto detectado", value: "details" },
            { name: "Voltar", value: "__back__" },
          ],
  });
  if (selected === "__back__") return 0;
  if (selected === "details") {
    await prompts.note?.(renderProvisioningDetails(detected), "Como escolher init/adopt/update");
    return 0;
  }
  if (selected === "policy") {
    await prompts.note?.(renderReviewPolicyDetails(detected), "Política de colaboração e revisão");
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
      name: "Atualizar runtime, templates, providers ou práticas",
      value: "guided-update",
      hint: "manutenção guiada do repo governado",
    },
    {
      name: "Entender política de colaboração e revisões",
      value: "policy",
      hint: summary.reviewPolicy
        ? `perfil atual: ${summary.reviewPolicy.activeProfile}`
        : "usa .governance/review-policy.yml quando existir",
    },
    { name: "Entender o contexto detectado", value: "details" },
    { name: "Voltar", value: "__back__" },
  ];
}

async function runGovernedRepoUpdate(
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts,
  detected: ProvisioningContextSummary
): Promise<number> {
  await prompts.note?.(
    [
      "Este repositório já usa ai-guidelines.",
      "",
      "Aqui o update funciona como manutenção do repo governado:",
      "- runtime e templates;",
      "- providers;",
      "- práticas como Prettier, Husky, CI, Quality Gates, TDD e BDD;",
      "- leitura da política de colaboração/revisão existente.",
      "",
      "init/adopt não aparecem como caminho principal porque poderiam confundir um repo já governado.",
    ].join("\n"),
    "Atualizar este repositório"
  );

  const selected = await prompts.select<GovernedRepoUpdateChoice>({
    message: "O que você quer atualizar?",
    choices: [
      {
        name: "Runtime e templates do ai-guidelines",
        value: "runtime",
        hint: "atualiza arquivos gerenciados sem escolher novas práticas",
      },
      {
        name: "Providers",
        value: "providers",
        hint: "Claude, OpenAI, Gemini etc. via update --providers",
      },
      {
        name: "Práticas do repositório",
        value: "features",
        hint: "Prettier, Husky, CI, Quality Gates, TDD, BDD",
      },
      {
        name: "Política de colaboração e revisões",
        value: "policy",
        hint: detected.reviewPolicy
          ? `perfil atual: ${detected.reviewPolicy.activeProfile}`
          : "mostra a fonte governada quando existir",
      },
      {
        name: "Entender update antes de executar",
        value: "details",
      },
      { name: "Voltar", value: "__back__" },
    ],
  });

  if (selected === "__back__") return 0;
  if (selected === "details") {
    await prompts.note?.(renderGovernedUpdateDetails(detected), "Como o update funciona");
    return 0;
  }
  if (selected === "policy") {
    await prompts.note?.(renderReviewPolicyDetails(detected), "Política de colaboração e revisão");
    return 0;
  }
  if (selected === "providers") {
    return runProvidersUpdate(registry, context, prompts);
  }
  if (selected === "features") {
    return runFeaturesUpdate(registry, context, prompts);
  }
  return runProvisioningCommand("update", registry, context, prompts);
}

async function runProvidersUpdate(
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts
): Promise<number> {
  const providers = await prompts.input({
    message: "Quais providers? Separe por vírgula. Ex.: claude,openai",
    default: "claude",
  });
  const normalized = providers
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(",");
  if (!normalized) {
    await prompts.outro?.("Nenhum provider informado; nada executado.");
    return 0;
  }
  await prompts.note?.(
    [
      "Providers não são um comando separado.",
      "",
      "O caminho canônico é:",
      `npm run flow -- update --providers ${normalized}`,
    ].join("\n"),
    "Atualizar providers"
  );
  return (await registry.dispatch(["update", "--providers", normalized], context)).exitCode;
}

async function runFeaturesUpdate(
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts
): Promise<number> {
  const choices = {
    "Práticas de infraestrutura": INFRASTRUCTURE_UPDATE_FEATURES.map((feature) => ({
      name: featureLabel(feature),
      value: feature,
      hint: featureHint(feature),
    })),
    "Práticas editoriais": EDITORIAL_UPDATE_FEATURES.map((feature) => ({
      name: featureLabel(feature),
      value: feature,
      hint: featureHint(feature),
    })),
  };
  const selected = prompts.groupMultiselect
    ? await prompts.groupMultiselect({
        message: "Quais práticas você quer atualizar?",
        groups: choices,
        required: true,
        groupSpacing: 1,
      })
    : await prompts.multiselect?.({
        message: "Quais práticas você quer atualizar?",
        choices: [...choices["Práticas de infraestrutura"], ...choices["Práticas editoriais"]],
        required: true,
      });

  const features = [...(selected ?? [])].map(String);
  if (features.length === 0) {
    await prompts.outro?.("Nenhuma prática selecionada; nada executado.");
    return 0;
  }
  const value = features.join(",");
  await prompts.note?.(
    [
      "O update vai usar o plano governado já existente.",
      "",
      "Práticas selecionadas:",
      ...features.map((feature) => `- ${featureLabel(feature)}`),
      "",
      "Comando:",
      `npm run flow -- update --features ${value}`,
    ].join("\n"),
    "Atualizar práticas"
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

function detectProvisioningContext(repoRoot: string): ProvisioningContextSummary {
  const hasConfig = existsSync(path.join(repoRoot, ".ai-guidelines", "config.json"));
  const hasAiGuidelines = existsSync(path.join(repoRoot, ".ai-guidelines"));
  const hasGovernance = existsSync(path.join(repoRoot, ".governance"));
  const hasSpecify = existsSync(path.join(repoRoot, ".specify"));
  const hasPackageJson = existsSync(path.join(repoRoot, "package.json"));

  if (hasConfig || hasGovernance || hasAiGuidelines || hasSpecify) {
    const evidence = [
      hasConfig ? ".ai-guidelines/config.json existe." : null,
      hasGovernance ? ".governance/ existe." : null,
      hasAiGuidelines && !hasConfig ? ".ai-guidelines/ existe." : null,
      hasSpecify ? ".specify/ existe." : null,
    ].filter((item): item is string => item !== null);
    return {
      operation: "update",
      stateTitle: "Este repositório já usa ai-guidelines.",
      evidence,
      guidance:
        "O caminho normal é atualizar runtime, templates, providers, práticas e políticas já governadas.",
      advancedReason:
        "init reinicia bootstrap de projeto novo; adopt tenta adotar um repo existente. Em um repo já governado, essas opções podem confundir o estado em vez de avançar o fluxo.",
      reviewPolicy: readReviewPolicySummary(repoRoot),
    };
  }

  if (hasPackageJson) {
    return {
      operation: "adopt",
      stateTitle: "Este parece ser um repositório existente ainda não governado.",
      evidence: [
        "package.json existe.",
        "Não detectei .ai-guidelines/, .governance/ ou .specify/.",
      ],
      guidance: "O caminho normal é adotar o repo existente sem tratá-lo como projeto vazio.",
      advancedReason:
        "init é para diretório vazio; update é para repo já governado. Neste estado, adopt preserva o projeto existente e adiciona a governança.",
    };
  }

  return {
    operation: "init",
    stateTitle: "Este parece ser um diretório novo.",
    evidence: ["Não detectei package.json.", "Não detectei diretórios governados."],
    guidance: "O caminho normal é iniciar o baseline em um projeto novo.",
    advancedReason:
      "adopt pressupõe projeto existente; update pressupõe governança já instalada. Neste estado, init é o caminho direto.",
  };
}

function renderProvisioningContext(summary: ProvisioningContextSummary): string {
  const lines = [
    summary.stateTitle,
    "",
    "Detectado:",
    ...summary.evidence.map((item) => `- ${item}`),
    "",
    "Opção exibida neste estado:",
    `- ${provisioningLabel(summary.operation)}`,
    "",
    summary.guidance,
  ];
  if (summary.operation === "update") {
    lines.push(
      "",
      "Também disponível:",
      "- atualizar práticas como Prettier, Husky, CI, Quality Gates, TDD e BDD;",
      "- consultar política de colaboração e revisões sem criar nova fonte de verdade."
    );
    if (summary.reviewPolicy) {
      lines.push(`- perfil de colaboração atual: ${summary.reviewPolicy.activeProfile}.`);
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
  return [
    "O update é o painel de manutenção de um repo que já usa ai-guidelines.",
    "",
    "Ele cobre:",
    "- runtime e templates do framework;",
    "- providers via update --providers;",
    "- práticas opt-in via update --features;",
    "- leitura da política de colaboração/revisão atual.",
    "",
    "Ele não recria o projeto e não chama init/adopt como caminho principal.",
    "",
    renderReviewPolicyDetails(summary),
  ].join("\n");
}

function renderReviewPolicyDetails(summary: ProvisioningContextSummary): string {
  const policy = summary.reviewPolicy;
  if (!policy) {
    return [
      "Não encontrei .governance/review-policy.yml neste repo.",
      "",
      "Quando existir, essa política é a fonte governada para perfil de colaboração e regras de revisão.",
    ].join("\n");
  }
  return [
    `Fonte: ${policy.path}`,
    `Perfil de colaboração atual: ${policy.activeProfile}`,
    "",
    "Impacto do perfil atual:",
    `- approvals nativos em PR de implementação: ${policy.implementationApprovals}`,
    `- approvals nativos em PR de integração: ${policy.integrationApprovals}`,
    `- code owner review: ${policy.codeOwnerReview ? "sim" : "não"}`,
    `- aprovação do último push: ${policy.lastPushApproval ? "sim" : "não"}`,
    `- findings aceitos exigem resolution: ${policy.acceptedFindingsRequireResolution ? "sim" : "não"}`,
    `- findings fixed exigem evento de verificação: ${policy.acceptedFindingsRequireVerificationEvent ? "sim" : "não"}`,
    "",
    "Reviews semânticos continuam separados de perfil de colaboração:",
    ...policy.requirementsSummary.map((item) => `- ${item}`),
  ].join("\n");
}

function provisioningActionLabel(operation: ProvisioningOperation): string {
  if (operation === "init") return "Iniciar ai-guidelines neste repositório";
  if (operation === "adopt") return "Adotar ai-guidelines neste repositório";
  return "Atualizar este repositório";
}

function provisioningLabel(operation: ProvisioningOperation): string {
  if (operation === "init") return "Iniciar ai-guidelines neste repositório";
  if (operation === "adopt") return "Adotar ai-guidelines neste repositório";
  return "Atualizar runtime, templates, providers, práticas ou política governada";
}

function provisioningMainLabel(summary?: ProvisioningContextSummary): string {
  if (!summary) return "Configurar/adotar/atualizar repositório";
  return provisioningActionLabel(summary.operation);
}

function provisioningMainHint(summary?: ProvisioningContextSummary): string | undefined {
  if (!summary) return undefined;
  if (summary.operation === "update") {
    return "runtime, templates, providers, práticas e política";
  }
  if (summary.operation === "adopt") {
    return "repo existente ainda sem ai-guidelines";
  }
  return "diretório novo ainda sem projeto/governança";
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
  if (entries.length === 0) return ["nenhum requisito semântico obrigatório por padrão."];
  return entries;
}

function featureLabel(feature: string): string {
  if (feature === "prettier") return "Prettier";
  if (feature === "husky") return "Husky";
  if (feature === "ci") return "CI";
  if (feature === "quality-gates") return "Quality Gates";
  if (feature === "tdd") return "TDD";
  if (feature === "bdd") return "BDD";
  return feature;
}

function featureHint(feature: string): string {
  if (feature === "prettier") return "formatação consistente";
  if (feature === "husky") return "hooks locais";
  if (feature === "ci") return "workflow de validação";
  if (feature === "quality-gates") return "critérios de qualidade";
  if (feature === "tdd") return "prática editorial de TDD";
  if (feature === "bdd") return "prática editorial de BDD";
  return "";
}
