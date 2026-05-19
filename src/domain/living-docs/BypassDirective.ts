/**
 * Parser puro da diretiva de bypass auditável (ADR 0012).
 *
 * Sintaxe canônica:
 *   `<guard-id>:allow-drift until=YYYY-MM-DD ref=ID reason="texto curto"`
 *
 * Aplicação inicial: Living Documentation drift guard (guard-id =
 * `living-docs`). O mesmo parser serve a qualquer guard futuro que adote a
 * sintaxe (boundary-lock, schema-check, etc.) — ADR 0012 §1.
 *
 * Função pura: recebe o texto do comentário + `todayIso` injetado para
 * validação de expiração. Sem IO, sem leitura de relógio.
 */
import { GovernanceError } from "../shared/errors.js";
import type { LivingDocsBypass } from "./LivingDocsEntry.js";

const DIRECTIVE_PATTERN = /(^|\s)(?<guardId>[a-z][a-z0-9-]*):allow-drift\b/;
const UNTIL_PATTERN = /\buntil=(\d{4}-\d{2}-\d{2})\b/;
const UNTIL_PRESENT_PATTERN = /\buntil=/;
const REF_PATTERN = /\bref=([A-Za-z0-9_-]+)/;
const REASON_PATTERN = /\breason="([^"]*)"/;
const BYPASS_REASON_MIN_LENGTH = 8;

export interface ParsedBypassDirective {
  readonly guardId: string;
  readonly bypass: LivingDocsBypass;
}

export interface ParseBypassOptions {
  /** ISO-8601 do "agora", injetado para determinismo de teste. */
  readonly todayIso: string;
  /**
   * Quando definido, restringe parsing a diretivas com este `guard-id`.
   * Outros guards retornam `null` (não-aplica) — útil para o RuleExtractor
   * filtrar só as diretivas relevantes ao seu domínio.
   */
  readonly expectedGuardId?: string;
}

/**
 * Detecta presença da diretiva sem validar campos. Retorna o `guard-id` e o
 * texto bruto, ou `null` se não houver match.
 */
export function findBypassDirective(
  text: string
): { readonly guardId: string; readonly raw: string } | null {
  const match = DIRECTIVE_PATTERN.exec(text);
  if (match === null || match.groups === undefined) return null;
  return { guardId: match.groups.guardId, raw: text };
}

/**
 * Reconhece e valida a diretiva no texto. Retorna `null` se a diretiva não
 * está presente OU se seu `guard-id` difere do `expectedGuardId` (quando
 * informado). Lança `GovernanceError` com código estável quando a diretiva
 * casa o padrão mas tem algum campo malformado ou está expirada.
 */
export function parseBypassDirective(
  text: string,
  options: ParseBypassOptions
): ParsedBypassDirective | null {
  const directive = findBypassDirective(text);
  if (directive === null) return null;
  if (options.expectedGuardId !== undefined && directive.guardId !== options.expectedGuardId) {
    return null;
  }

  // until: presença obrigatória e formato ISO-8601 (YYYY-MM-DD).
  const untilMatch = UNTIL_PATTERN.exec(text);
  if (untilMatch === null) {
    // distingue "ausente" de "presente mas malformado" para mensagem útil
    if (UNTIL_PRESENT_PATTERN.test(text)) {
      throw new GovernanceError(
        "LIVING_DOCS_BYPASS_MALFORMED",
        "Bypass directive: 'until' deve ser data ISO-8601 (YYYY-MM-DD)."
      );
    }
    throw new GovernanceError(
      "LIVING_DOCS_BYPASS_MALFORMED",
      "Bypass directive: campo obrigatório 'until=YYYY-MM-DD' ausente."
    );
  }

  // ref: presença obrigatória.
  const refMatch = REF_PATTERN.exec(text);
  if (refMatch === null) {
    throw new GovernanceError(
      "LIVING_DOCS_BYPASS_MALFORMED",
      "Bypass directive: campo obrigatório 'ref=<ID>' ausente (ex.: DEC-XXXX-YY, INC-YYYYMMDD-N)."
    );
  }

  // reason: presença obrigatória + mínimo de 8 caracteres significativos.
  const reasonMatch = REASON_PATTERN.exec(text);
  if (reasonMatch === null) {
    throw new GovernanceError(
      "LIVING_DOCS_BYPASS_MALFORMED",
      `Bypass directive: campo obrigatório 'reason="..."' ausente.`
    );
  }
  const reason = reasonMatch[1];
  if (reason.trim().length < BYPASS_REASON_MIN_LENGTH) {
    throw new GovernanceError(
      "LIVING_DOCS_BYPASS_MALFORMED",
      `Bypass directive: 'reason' deve ter no mínimo ${BYPASS_REASON_MIN_LENGTH} caracteres significativos.`
    );
  }

  const until = untilMatch[1];
  const ref = refMatch[1];
  const todayDate = options.todayIso.slice(0, 10);
  if (until <= todayDate) {
    throw new GovernanceError(
      "LIVING_DOCS_BYPASS_EXPIRED",
      `Bypass directive: bypass for '${ref}' expired on ${until} (today=${todayDate}).`
    );
  }

  return {
    guardId: directive.guardId,
    bypass: { until, ref, reason },
  };
}
