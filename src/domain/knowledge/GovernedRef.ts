import { GovernanceError } from "../shared/errors.js";
import { WorkItemId } from "../shared/types.js";
import { formatRef, isWellFormedRef, KnowledgeRef, parseRef } from "./KnowledgeRef.js";

/**
 * Value Object: referência a um alvo **governado** constrangível por uma
 * {@link Falsification} (CO-2) ou por uma `Constraint` (CO-3).
 *
 * Separado de {@link KnowledgeRef} DE PROPÓSITO: `KnowledgeRef` é PURO ao
 * pipeline de maturação (`insight|decision|rule|guardrail|doctrine`). Um alvo
 * constrangível pode também ser um `WorkItem` (espaço `work`) — que **não** é
 * estágio do pipeline (ADR 0010) — ou uma **superfície de enforcement** (espaço
 * `surface`, CO-3): o ponto operacional namespaced (`npm-script:…`,
 * `registry-command:…`) onde um binding incide. A união discriminada por `space`
 * evita poluir o kernel e fica extensível a futuros espaços governados, sem
 * entidade persistida (INV-4 / ADR 0026): o alvo é sempre uma ref
 * existente/derivável — a `SurfaceRef` é resolvida a partir de fontes vivas
 * (`script-contracts.yml`, `CommandRegistry`), nunca reificada como nó.
 */
export type GovernedRef =
  | { readonly space: "knowledge"; readonly ref: KnowledgeRef }
  | { readonly space: "work"; readonly id: WorkItemId }
  | { readonly space: "surface"; readonly id: string };

export const GOVERNED_SPACES = ["knowledge", "work", "surface"] as const;

/**
 * Forma bem-formada de um id de superfície (não existência): `<namespace>:<name>`
 * com ambos não-vazios. O allow-list de namespaces e a RESOLUÇÃO vivem na camada
 * de constraints (`SurfaceRef`/resolvers) — aqui validamos só a FORMA, como no
 * resto do `GovernedRef`.
 */
function isWellFormedSurfaceId(id: string): boolean {
  if (typeof id !== "string") return false;
  const sep = id.indexOf(":");
  return sep > 0 && id.slice(sep + 1).trim().length > 0;
}

/** Forma bem-formada (não existência — integridade referencial é advisory). */
export function isWellFormedGovernedRef(g: GovernedRef): boolean {
  switch (g.space) {
    case "knowledge":
      return isWellFormedRef(g.ref);
    case "work":
      return typeof g.id === "string" && g.id.trim().length > 0;
    case "surface":
      return isWellFormedSurfaceId(g.id);
    default:
      return false;
  }
}

/**
 * `GovernedRef` → `"knowledge:decision:DEC-0024-G07"` | `"work:spec-0024"` |
 * `"surface:npm-script:review:publish"`.
 */
export function formatGovernedRef(g: GovernedRef): string {
  switch (g.space) {
    case "knowledge":
      return `knowledge:${formatRef(g.ref)}`;
    case "work":
      return `work:${g.id}`;
    case "surface":
      return `surface:${g.id}`;
  }
}

/** `"<space>:<...>"` → `GovernedRef` (validado). Split no PRIMEIRO `:` (o id de
 * surface preserva os `:` internos do namespace, ex.: `npm-script:review:publish`). */
export function parseGovernedRef(value: string): GovernedRef {
  const sep = value.indexOf(":");
  if (sep <= 0) {
    throw new GovernanceError(
      "GOVERNED_REF_MALFORMED",
      `Ref governado malformado: "${value}" — esperado "<space>:<...>" (space: ${GOVERNED_SPACES.join("|")}).`
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
  if (space === "surface") {
    if (!isWellFormedSurfaceId(rest)) {
      throw new GovernanceError(
        "GOVERNED_REF_MALFORMED",
        `Ref governado malformado: "${value}" — id de surface deve ser "<namespace>:<name>" não-vazio.`
      );
    }
    return { space: "surface", id: rest };
  }
  throw new GovernanceError(
    "GOVERNED_REF_MALFORMED",
    `Espaço governado desconhecido em "${value}" (válidos: ${GOVERNED_SPACES.join("|")}).`
  );
}
