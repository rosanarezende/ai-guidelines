/**
 * Catálogo de cenários do simulador — modelo AUTORAL, legível por humanos.
 *
 * Procedência (correção SSOT da owner):
 *  - o arquivo gerado `flow-scenarios.generated.ts` é PROJEÇÃO do runtime, não a
 *    fonte de verdade. Um cenário só é `real` quando TUDO que ele mostra vem de um
 *    transcript capturado por execução controlada da CLI (`source: "transcript:<id>"`).
 *  - se qualquer passo for autoral, o cenário inteiro é `simulado` (modelo alvo) ou
 *    `gap` (comportamento ainda ausente). Nunca `real`.
 *  - saída `transcript:<id>` NÃO carrega `lines`: o renderizador resolve as linhas a
 *    partir de `AI_GUIDELINES_FLOW_SCENARIOS`. `lines` só existe em `simulado`/`gap`.
 */

export type ScenarioProvenance = "real" | "simulado" | "gap";
export type ScenarioAudience = "iniciante" | "avancado";
export type EffectStatus = "available" | "blocked" | "forbidden";

/** Saída de um passo: ou um ponteiro para transcript real, ou linhas autorais. */
export type StepOutput =
  | { readonly source: string } // "transcript:<id>" — sem lines (resolve do gerado)
  | { readonly source: "simulado" | "gap"; readonly lines: readonly string[] };

export interface ScenarioStep {
  readonly id: string;
  /** O que a CLI percebe / pergunta neste passo. */
  readonly prompt: string;
  /** Opções oferecidas (quando o passo é uma escolha). */
  readonly options?: readonly string[];
  readonly outputs: readonly StepOutput[];
  /** Painel "por que isso apareceu" (governance-explainer). */
  readonly why: string;
}

export interface ScenarioEffect {
  readonly label: string;
  readonly status: EffectStatus;
  readonly detail?: string;
}

export interface CatalogScenario {
  readonly id: string;
  readonly name: string;
  readonly audience: ScenarioAudience;
  readonly provenance: ScenarioProvenance;
  /** Ids de transcript comprovados (obrigatório quando há base real em `simulado`). */
  readonly realAnchors: readonly string[];
  /** Caminho principal público — sempre `npx ai-guidelines`. */
  readonly entryCommand: string;
  readonly context: string;
  readonly steps: readonly ScenarioStep[];
  readonly effects: readonly ScenarioEffect[];
  readonly blocks: readonly string[];
  /** Atalhos diretos equivalentes (secundários). */
  readonly shortcuts: readonly string[];
  /** Gaps conhecidos da CLI real (vazio só em `real` puro). */
  readonly gaps: readonly string[];
}

export function isTranscriptSource(source: string): boolean {
  return source.startsWith("transcript:");
}

export function transcriptId(source: string): string {
  return source.slice("transcript:".length);
}
