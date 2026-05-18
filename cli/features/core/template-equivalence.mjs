/**
 * Normalizer + comparator compartilhado entre mirror legado e TemplateEngine.
 *
 * Implementa a Política de Equivalência (Spec 0021, PR4 / 4.C):
 *   E1 — Canonical EOL = LF: CRLF (`\r\n`) e CR (`\r`) → `\n`.
 *   E2 — Newline final obrigatória: garante exatamente um `\n` no fim.
 *   E3 — Trailing whitespace: remove espaços/tabs no fim de cada linha.
 *
 * Não toca slot ordering (E4) nem separador entre slots (E5) — esses
 * são responsabilidade da engine/recipe, não deste módulo.
 *
 * Idempotente: `normalize(normalize(x)) === normalize(x)`.
 *
 * Único ponto de comparação entre engine output e boilerplate legado.
 */

export function normalize(content) {
  if (typeof content !== "string") {
    throw new TypeError(`normalize: expected string, got ${typeof content}`);
  }

  let result = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  result = result
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n");

  result = result.replace(/\n+$/, "") + "\n";

  return result;
}

export function assertByteEquivalent(actual, expected, context) {
  const normalizedActual = normalize(actual);
  const normalizedExpected = normalize(expected);

  if (normalizedActual === normalizedExpected) {
    return;
  }

  const actualLines = normalizedActual.split("\n");
  const expectedLines = normalizedExpected.split("\n");
  const maxLen = Math.max(actualLines.length, expectedLines.length);

  const diffs = [];
  for (let i = 0; i < maxLen; i++) {
    const a = actualLines[i];
    const e = expectedLines[i];
    if (a !== e) {
      diffs.push(
        `  line ${i + 1}:\n    expected: ${JSON.stringify(e ?? "<EOF>")}\n    actual:   ${JSON.stringify(a ?? "<EOF>")}`
      );
      if (diffs.length >= 5) {
        diffs.push(`  ... (truncated; ${maxLen - i - 1} more lines)`);
        break;
      }
    }
  }

  const error = new Error(
    `Byte-equivalence failed for '${context}':\n${diffs.join("\n")}\n` +
      `actual length: ${normalizedActual.length} bytes; expected length: ${normalizedExpected.length} bytes.`
  );
  error.code = "TEMPLATE_EQUIVALENCE_MISMATCH";
  error.context = context;
  throw error;
}
