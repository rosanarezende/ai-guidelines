import { SpecLocation } from "../../domain/workflow/SpecLocation.js";
import { WorkflowFileSystem } from "../ports/WorkflowFileSystem.js";

/**
 * Gate determinístico de "Integration readiness" (L2 — local, closing hardening).
 *
 * Lê o `review.md` da spec por regex e aplica regras explícitas sobre os gates
 * de prontidão já declarados nele — **sem IA, sem inferência de fluxo** (cf.
 * memory `feedback-lookup-not-coordination`). É a contraparte de
 * `CheckExecutionAuthorized` (PR4) para os comandos transacionais do wizard
 * (cf. `[DEC-0023-L01]` + `[DEC-0023-M01]`):
 *
 * - `integration-pr` (opção 4) bloqueia a abertura do #26 enquanto a homologação
 *   (gates `R1`–`R7` de `review.md`, incl. `R7` public-facing check) não fecha.
 * - `merge-stack` (opção 5) bloqueia o merge atômico enquanto `review.md` não
 *   estiver 100% fechado, incluindo `R8` (merge authorization).
 *
 * Não inventa gates: consome os IDs `R*` declarados no `review.md`. Se o arquivo
 * não existir, ou um ID exigido faltar, trata como bloqueio fail-safe.
 */
export type ReadinessKind = "integration-pr" | "merge-stack";

/** IDs de gate exigidos por tipo de readiness, lidos do `review.md`. Cravados. */
export const READINESS_GATES: Record<ReadinessKind, ReadonlyArray<string>> = {
  "integration-pr": ["R1", "R2", "R3", "R4", "R5", "R6", "R7"],
  "merge-stack": ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"],
};

/** Item de checklist (`- [ ] **id** ...`) de um boundary markdown. */
export interface ChecklistGate {
  /** ID canônico, e.g. `R1`, `3.3`, `1.H.[REVIEW]`. */
  readonly id: string;
  /** `true` apenas quando o marcador é `[x]`; `[ ]` e `[/]` contam como aberto. */
  readonly checked: boolean;
  /** Marcador bruto normalizado: ` `, `x` ou `/`. */
  readonly marker: string;
  /** Linha completa (trimmed) — usada no diagnóstico narrativo. */
  readonly line: string;
}

const CHECKLIST_LINE = /^\s*-\s*\[([ xX/])\]\s+\*\*(.+?)\*\*/;

/**
 * Parser puro de checklist markdown: captura cada item na forma
 * `- [ ] **<id>** ...`. Linhas que não casam o padrão são ignoradas.
 * Genérico — serve `review.md`, `tasks.md` e `release-log.md`.
 */
export function parseChecklistGates(md: string): ReadonlyArray<ChecklistGate> {
  const gates: ChecklistGate[] = [];
  for (const raw of md.split("\n")) {
    const m = CHECKLIST_LINE.exec(raw);
    if (!m) continue;
    const marker = m[1].toLowerCase();
    gates.push({
      id: m[2].trim(),
      checked: marker === "x",
      marker,
      line: raw.trim(),
    });
  }
  return gates;
}

export interface IntegrationReadinessResult {
  readonly ready: boolean;
  readonly kind: ReadinessKind;
  /** Caminho do `review.md` consultado. */
  readonly checkedPath: string;
  /** `review.md` não encontrado no filesystem. */
  readonly missingFile: boolean;
  /** IDs exigidos que estão abertos (`[ ]`/`[/]`), com o texto da linha. */
  readonly openGates: ReadonlyArray<ChecklistGate>;
  /** IDs exigidos que sequer existem no `review.md` (bloqueio fail-safe). */
  readonly missingGateIds: ReadonlyArray<string>;
  readonly requiredGateIds: ReadonlyArray<string>;
}

function reviewPath(location: SpecLocation): string {
  const prefix = location.source === "governance" ? ".governance/specs" : ".specify/specs";
  return `${prefix}/${location.slug}/review.md`;
}

export class CheckIntegrationReadiness {
  constructor(private readonly fs: WorkflowFileSystem) {}

  run(location: SpecLocation, kind: ReadinessKind): IntegrationReadinessResult {
    const checkedPath = reviewPath(location);
    const requiredGateIds = READINESS_GATES[kind];

    if (!this.fs.fileExists(checkedPath)) {
      return {
        ready: false,
        kind,
        checkedPath,
        missingFile: true,
        openGates: [],
        missingGateIds: [...requiredGateIds],
        requiredGateIds,
      };
    }

    const gates = parseChecklistGates(this.fs.readTextFile(checkedPath));
    const byId = new Map(gates.map((g) => [g.id, g]));

    const openGates: ChecklistGate[] = [];
    const missingGateIds: string[] = [];
    for (const id of requiredGateIds) {
      const gate = byId.get(id);
      if (gate === undefined) {
        missingGateIds.push(id);
      } else if (!gate.checked) {
        openGates.push(gate);
      }
    }

    return {
      ready: openGates.length === 0 && missingGateIds.length === 0,
      kind,
      checkedPath,
      missingFile: false,
      openGates,
      missingGateIds,
      requiredGateIds,
    };
  }
}
