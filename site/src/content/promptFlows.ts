import { AI_GUIDELINES_FLOW_PROMPTS } from "@generated/flow-prompts.generated";

import { scenarioById, type FlowScenario } from "./flowData";

/**
 * Superfície tipada da MÁQUINA DE PROMPTS real (projeção gerada por
 * `npm run site:prompts:sync`). O simulador consome SÓ daqui — nunca inventa
 * prompt: mensagens, opções e ramificações vêm da captura do wizard real
 * (`command.prompt`), e o resultado liga a um transcript de dry-run REAL.
 */

export type PromptStepKind = "note" | "input" | "select" | "multiselect" | "confirm";

export interface PromptChoice {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
  readonly disabled?: boolean;
}

export interface PromptGroup {
  readonly group: string;
  readonly choices: readonly PromptChoice[];
}

export interface PromptGate {
  readonly stepId: string;
  readonly equals: boolean;
}

export interface PromptValueGate {
  readonly stepId: string;
  readonly includes: string;
}

export interface PromptStep {
  readonly kind: PromptStepKind;
  readonly id: string;
  readonly message: string;
  readonly title?: string;
  readonly lines?: readonly string[];
  readonly choices?: readonly PromptChoice[];
  readonly groups?: readonly PromptGroup[];
  readonly defaultValues?: readonly string[];
  readonly required?: boolean;
  readonly defaultText?: string;
  readonly defaultBool?: boolean;
  readonly suggested?: string | readonly string[] | boolean;
  readonly gatedBy?: PromptGate;
  readonly requiresSelection?: PromptValueGate;
}

export interface PromptFlow {
  readonly id: string;
  readonly operation: "init" | "adopt" | "update" | "root";
  readonly context: string;
  readonly command: string;
  readonly detection: {
    readonly title: string;
    readonly evidence: readonly string[];
    readonly formatterRival?: string;
  };
  readonly transcriptId: string;
  readonly steps: readonly PromptStep[];
}

export const promptFlows: readonly PromptFlow[] =
  AI_GUIDELINES_FLOW_PROMPTS.scenarios as readonly PromptFlow[];

/** Ordem de apresentação no /cli — do mais simples ao mais governado. */
export const PROMPT_FLOW_IDS: readonly string[] = ["empty", "existing", "conflict", "governed"];

export function promptFlowById(id: string): PromptFlow | undefined {
  return promptFlows.find((flow) => flow.id === id);
}

/** Saída do cenário: o transcript de dry-run REAL ligado pelo `transcriptId`. */
export function flowOutcome(flow: PromptFlow): FlowScenario | undefined {
  return scenarioById(flow.transcriptId);
}

/** Passos ativos dado o conjunto de respostas (resolve a ramificação `gatedBy`). */
export function isStepActive(
  step: PromptStep,
  answers: Readonly<Record<string, unknown>>
): boolean {
  if (step.gatedBy && answers[step.gatedBy.stepId] !== step.gatedBy.equals) {
    return false;
  }
  if (step.requiresSelection) {
    const answer = answers[step.requiresSelection.stepId];
    return Array.isArray(answer) && answer.includes(step.requiresSelection.includes);
  }
  return true;
}
