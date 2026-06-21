/**
 * Modelo da camada de reparo de governança (Spec 0024, CO-10.8.1).
 *
 * O diagnóstico (GovernanceDoctor / comando `drift`) detecta e explica drift em
 * linguagem humana, mas NÃO escreve. Esta camada acrescenta o passo seguinte:
 * transformar um drift conhecido em um PLANO de reparo com preview e aplicação
 * gated por confirmação.
 *
 * Autoridade (item de governança cravado no kickoff de CO-10.8.1):
 *   - `auto`           — reparo determinístico, sem escolha real (não usado ainda).
 *   - `confirm`        — determinístico, mas escreve: exige preview + confirmação.
 *   - `human-decision` — há escolha semântica; a pessoa decide, o framework não.
 *   - `blocked`        — toca topologia / Ready / Human Gate / merge: NÃO se repara
 *                        automaticamente aqui.
 *
 * Invariante de produto: o `apply` escreve SOMENTE os arquivos cujo conteúdo de
 * fato muda (`before !== after`). Isso dá um contrato positivo e verificável —
 * "a execução altera somente o permitido" — sem depender de teste negativo.
 */
import { WorkflowFileSystem } from "../../app/ports/WorkflowFileSystem.js";

export type RepairAuthority = "auto" | "confirm" | "human-decision" | "blocked";

export interface RepairFileChange {
  /** Caminho relativo ao workspace root. */
  readonly path: string;
  /** Conteúdo atual (string vazia se o arquivo ainda não existe). */
  readonly before: string;
  /** Conteúdo proposto pelo plano. */
  readonly after: string;
}

export interface RepairAction {
  readonly id: string;
  readonly authority: RepairAuthority;
  /** Frase humana (de locale) do que a ação faz. */
  readonly summary: string;
  readonly changes: readonly RepairFileChange[];
}

export interface RepairPlan {
  /** Id do issue do GovernanceDoctor que originou o plano. */
  readonly issueId: string;
  /** Padrão de drift (ex.: "branch-stale"). */
  readonly pattern: string;
  readonly authority: RepairAuthority;
  /** Título humano (de locale). */
  readonly title: string;
  readonly whatHappened: string;
  readonly whyItMatters: string;
  readonly actions: readonly RepairAction[];
}

export interface RepairApplyResult {
  /** Caminhos efetivamente escritos (apenas os que mudaram). */
  readonly written: readonly string[];
}

/**
 * Arquivos que o plano realmente altera — união dos changes cujo conteúdo muda.
 * Mudança nula (`before === after`) NÃO entra: o preview mostra só o que muda.
 */
export function affectedFiles(plan: RepairPlan): readonly string[] {
  const set = new Set<string>();
  for (const action of plan.actions) {
    for (const change of action.changes) {
      if (change.before !== change.after) set.add(change.path);
    }
  }
  return [...set];
}

/**
 * Aplica o plano escrevendo SOMENTE os arquivos cujo conteúdo muda. Um change
 * inerte (`before === after`) é ignorado — garante o contrato estrutural de que
 * a execução não toca o que não precisa mudar.
 */
export function applyRepairPlan(plan: RepairPlan, fs: WorkflowFileSystem): RepairApplyResult {
  const written: string[] = [];
  for (const action of plan.actions) {
    for (const change of action.changes) {
      if (change.before === change.after) continue;
      fs.writeTextFile(change.path, change.after);
      written.push(change.path);
    }
  }
  return { written };
}
