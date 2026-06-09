import { GovernanceError } from "../shared/errors.js";
import { WorkItemId } from "../shared/types.js";
import { formatRef, isWellFormedRef, KnowledgeRef, parseRef } from "./KnowledgeRef.js";

/**
 * Value Object: referência a um alvo **governado** constrangível por uma
 * {@link Falsification} (CO-2).
 *
 * Separado de {@link KnowledgeRef} DE PROPÓSITO: `KnowledgeRef` é PURO ao
 * pipeline de maturação (`insight|decision|rule|guardrail|doctrine`). Um alvo
 * constrangível pode também ser um `WorkItem` (espaço `work`) — que **não** é
 * estágio do pipeline (ADR 0010). A união discriminada por `space` evita poluir
 * o kernel e fica extensível a futuros espaços governados, sem `DecisionSurface`
 * persistida (INV-4 / ADR 0026): o alvo é sempre uma ref existente/derivável.
 */
export type GovernedRef =
  | { readonly space: "knowledge"; readonly ref: KnowledgeRef }
  | { readonly space: "work"; readonly id: WorkItemId };

export const GOVERNED_SPACES = ["knowledge", "work"] as const;

/** Forma bem-formada (não existência — integridade referencial é advisory). */
export function isWellFormedGovernedRef(g: GovernedRef): boolean {
  switch (g.space) {
    case "knowledge":
      return isWellFormedRef(g.ref);
    case "work":
      return typeof g.id === "string" && g.id.trim().length > 0;
    default:
      return false;
  }
}

/** `GovernedRef` → `"knowledge:decision:DEC-0024-G07"` | `"work:spec-0024"`. */
export function formatGovernedRef(g: GovernedRef): string {
  return g.space === "knowledge" ? `knowledge:${formatRef(g.ref)}` : `work:${g.id}`;
}

/** `"knowledge:decision:DEC-0024-G07"` | `"work:spec-0024"` → `GovernedRef` (validado). */
export function parseGovernedRef(value: string): GovernedRef {
  const sep = value.indexOf(":");
  if (sep <= 0) {
    throw new GovernanceError(
      "GOVERNED_REF_MALFORMED",
      `Ref governado malformado: "${value}" — esperado "<space>:<...>" (space: knowledge|work).`
    );
  }
  const space = value.slice(0, sep);
  const rest = value.slice(sep + 1);
  if (space === "knowledge") {
    return { space: "knowledge", ref: parseRef(rest) };
  }
  if (space === "work") {
    const id = rest.trim();
    if (id.length === 0) {
      throw new GovernanceError(
        "GOVERNED_REF_MALFORMED",
        `Ref governado malformado: "${value}" — id de work vazio.`
      );
    }
    return { space: "work", id };
  }
  throw new GovernanceError(
    "GOVERNED_REF_MALFORMED",
    `Espaço governado desconhecido em "${value}" (válidos: ${GOVERNED_SPACES.join("|")}).`
  );
}
