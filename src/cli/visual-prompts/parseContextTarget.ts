import { ContextTarget } from "./ContextTarget.js";

/**
 * Parser determinístico baseado em regex simples para classificar o input do usuário.
 *
 * Exemplos:
 * - "PR #25", "pr 25", "PR 25" -> { kind: "pr", number: 25 }
 * - "spec 0023", "spec-0023", "0023" -> { kind: "spec", identifier: "0023" }
 * - Qualquer outro texto -> { kind: "unknown" }
 */
export function parseContextTarget(input: string): ContextTarget {
  const trimmed = input.trim();

  // Verifica PR (e.g. "PR #25", "pr 25", "PR25", "pr #25")
  const prMatch = trimmed.match(/^pr\s*#?\s*(\d+)$/i);
  if (prMatch) {
    const num = parseInt(prMatch[1], 10);
    if (!isNaN(num)) {
      return { kind: "pr", number: num };
    }
  }

  // Verifica Spec (e.g. "spec 0023", "spec-0023", "spec0023", ou apenas o número de 4 dígitos "0023")
  const specMatch = trimmed.match(/^(?:spec\s*[-#]?\s*|(?=\d{4}$))(\d{4})(?:-.*)?$/i);
  if (specMatch) {
    return { kind: "spec", identifier: specMatch[1] };
  }

  return { kind: "unknown" };
}
