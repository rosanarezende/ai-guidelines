import { existsSync } from "node:fs";
import path from "node:path";

import { isPromptCancelled, Prompts } from "../app/ports/Prompts.js";
import { CockpitModel, collectCockpitModel, renderCockpit } from "./cockpit.js";
import { CommandRegistry } from "./registry/CommandRegistry.js";
import { CommandContext, Logger } from "./registry/Command.js";

export type FlowMenuValue =
  | "cockpit"
  | "next"
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
  readonly collectModel?: (repoRoot: string) => CockpitModel;
}

export function buildFlowMenu(model: CockpitModel): ReadonlyArray<{
  readonly name: string;
  readonly value: FlowMenuValue;
  readonly hint?: string;
}> {
  const recommended = model.flow?.recommended;
  return [
    { name: "Ver cockpit completo", value: "cockpit" },
    {
      name: "Continuar próxima ação recomendada",
      value: "next",
      hint: recommended?.title ?? "sem ação mutante disponível agora",
    },
    { name: "Ver decisões disponíveis", value: "decisions" },
    { name: "Entender bloqueios atuais", value: "blockers" },
    { name: "Rodar briefing de trabalho", value: "work" },
    { name: "Preparar review governado", value: "review" },
    { name: "Configurar/adotar/atualizar repositório", value: "provisioning" },
    { name: "Operações avançadas", value: "advanced" },
    { name: "Sair", value: "quit" },
  ];
}

export function renderFlowSummary(model: CockpitModel): string {
  const facts = model.work.snapshot.collected.facts;
  const pr = facts.pullRequest;
  const active = model.work.brief.object.subCheckpoint;
  const lines = [
    `branch: ${facts.git.branch ?? "?"}`,
    `HEAD: ${facts.git.head ?? "?"}`,
    `modo: ${model.work.brief.mode}`,
    active ? `sub-checkpoint: ${active.id} — ${active.title}` : "sub-checkpoint: (nenhum)",
    pr
      ? `PR #${pr.number}: ${pr.isDraft ? "Draft" : "Ready"} · CI ${pr.checks.pass} ok / ${pr.checks.fail} falha(s) / ${pr.checks.pending} pendente(s)`
      : "PR: não observado",
    `próxima ação: ${model.flow?.recommended?.title ?? model.work.brief.nextAction.description}`,
  ];
  return lines.join("\n");
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
  const model = (options.collectModel ?? collectCockpitModel)(repoRoot);
  const context: CommandContext = { repoRoot, logger, prompts };

  try {
    await prompts.intro?.("ai-guidelines flow");
    await prompts.note?.(renderFlowSummary(model), "Estado atual");

    const choice = await prompts.select<FlowMenuValue>({
      message: "O que você quer fazer?",
      choices: buildFlowMenu(model),
    });

    switch (choice) {
      case "cockpit":
        logger.info(renderCockpit(model).trimEnd());
        await prompts.outro?.("Cockpit renderizado.");
        return 0;
      case "next":
        if (!model.flow?.recommended) {
          await prompts.note?.(renderBlockedActions(model), "Sem ação disponível");
          await prompts.outro?.("Nenhuma mutação executada.");
          return 0;
        }
        return registry.dispatch(["decide"], context).then((r) => r.exitCode);
      case "decisions":
        return registry.dispatch(["decide"], context).then((r) => r.exitCode);
      case "blockers":
        await prompts.note?.(renderBlockedActions(model), "Bloqueios atuais");
        await prompts.outro?.("Bloqueios exibidos.");
        return 0;
      case "work":
        return registry.dispatch(["work"], context).then((r) => r.exitCode);
      case "review":
        return runReviewSection(registry, context, prompts);
      case "provisioning":
        return runProvisioningSection(repoRoot, registry, context, prompts);
      case "advanced":
        return registry.dispatch(["workflow"], context).then((r) => r.exitCode);
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

async function runReviewSection(
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts
): Promise<number> {
  const choice = await prompts.select<string>({
    message: "Review governado",
    choices: [
      { name: "Ver catálogo de reviews", value: "types" },
      { name: "Ver policy efetiva", value: "policy" },
      { name: "Technical Audit", value: "technical-audit" },
      { name: "Architectural Review", value: "architectural-review" },
      { name: "Security Review", value: "security-review" },
      { name: "Voltar", value: "__back__" },
    ],
  });
  if (choice === "__back__") return 0;
  return (await registry.dispatch(["review", choice], context)).exitCode;
}

async function runProvisioningSection(
  repoRoot: string,
  registry: CommandRegistry,
  context: CommandContext,
  prompts: Prompts
): Promise<number> {
  const operations = ["init", "adopt", "update"] as const;
  const available = operations.filter((operation) => registry.resolve(operation) !== undefined);
  const suggested = suggestProvisioningOperation(repoRoot);
  const ordered = [
    ...available.filter((operation) => operation === suggested),
    ...available.filter((operation) => operation !== suggested),
  ];
  const selected = await prompts.select<string>({
    message: "Configurar/adotar/atualizar repositório",
    choices: [
      ...ordered.map((operation) => ({
        name: provisioningLabel(operation),
        value: operation,
        hint: operation === suggested ? "sugerido pelo contexto atual" : undefined,
      })),
      { name: "Voltar", value: "__back__" },
    ],
  });
  if (selected === "__back__") return 0;
  return (await registry.dispatch([selected], context)).exitCode;
}

function suggestProvisioningOperation(repoRoot: string): "init" | "adopt" | "update" {
  if (existsSync(path.join(repoRoot, ".ai-guidelines", "config.json"))) return "update";
  if (existsSync(path.join(repoRoot, "package.json"))) return "adopt";
  return "init";
}

function provisioningLabel(operation: "init" | "adopt" | "update"): string {
  if (operation === "init") return "init — iniciar projeto novo";
  if (operation === "adopt") return "adopt — adotar repositório existente";
  return "update — atualizar runtime/templates/providers";
}
