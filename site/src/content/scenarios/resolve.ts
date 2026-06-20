import { scenarioById } from "@content/flowData";
import type { TerminalKind } from "@features/terminal/TerminalFrame/TerminalFrame";

import { isTranscriptSource, transcriptId, type CatalogScenario, type StepOutput } from "./types";

export type OutputOrigin = "real" | "simulado" | "gap";

export interface ResolvedOutput {
  readonly origin: OutputOrigin;
  readonly transcriptId?: string;
  readonly command?: string;
  readonly exitCode?: number | null;
  readonly lines: readonly string[];
}

/**
 * Resolve as linhas de uma saída de passo.
 *  - `transcript:<id>` → linhas vêm do gerado (sem duplicação no catálogo);
 *  - `simulado`/`gap`   → linhas autorais do próprio catálogo.
 */
export function resolveOutput(output: StepOutput): ResolvedOutput {
  if (isTranscriptSource(output.source)) {
    const id = transcriptId(output.source);
    const scenario = scenarioById(id);
    return {
      origin: "real",
      transcriptId: id,
      command: scenario?.command,
      exitCode: scenario?.exitCode ?? null,
      lines: scenario?.lines ?? [`(transcript ausente no gerado: ${id})`],
    };
  }
  const authored = output as { source: "simulado" | "gap"; lines: readonly string[] };
  return { origin: authored.source, lines: authored.lines };
}

const PROVENANCE_TERMINAL_KIND: Record<CatalogScenario["provenance"], TerminalKind> = {
  real: "real",
  simulado: "guided",
  gap: "illustrative",
};

const ORIGIN_TERMINAL_KIND: Record<OutputOrigin, TerminalKind> = {
  real: "real",
  simulado: "guided",
  gap: "illustrative",
};

export function terminalKindForProvenance(provenance: CatalogScenario["provenance"]): TerminalKind {
  return PROVENANCE_TERMINAL_KIND[provenance];
}

export function terminalKindForOrigin(origin: OutputOrigin): TerminalKind {
  return ORIGIN_TERMINAL_KIND[origin];
}

export const PROVENANCE_LABEL: Record<CatalogScenario["provenance"], string> = {
  real: "Real — captura da CLI",
  simulado: "Simulado — modelo alvo",
  gap: "Gap — em evolução",
};

export const ORIGIN_LABEL: Record<OutputOrigin, string> = {
  real: "Real",
  simulado: "Modelo alvo",
  gap: "Em evolução",
};

export type LineTone = "normal" | "active" | "muted" | "warn" | "success";

/** Classifica o tom visual de uma linha de terminal (real ou autoral). */
export function lineTone(line: string): LineTone {
  if (/^\$ /.test(line)) return "active";
  if (/^# /.test(line)) return "muted";
  if (/\[bloque|\[bloquead|proibid|atenção|conflito|warn|skip|stale|suja|indispon/i.test(line)) {
    return "warn";
  }
  if (/\[dry-run\]|\[permitido\]|\bsync\b|\bok\b|verde|preserv/i.test(line)) return "success";
  if (/\[modelo alvo\]|\[em evolução\]|\[importante\]/i.test(line)) return "active";
  return "normal";
}
