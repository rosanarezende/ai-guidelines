/**
 * Entrada do artefato de Living Documentation.
 *
 * Cada entrada representa uma regra de negócio (`[BR-CLI-*]`) declarada no
 * código de testes, projetada estaticamente para consumidores a jusante
 * (humanos, IAs, dashboards futuros). Pertence ao domínio: validação pura,
 * sem IO. Extração AST (que produz instâncias deste tipo) entra em PR3.B.
 *
 * Princípios canônicos aplicados:
 *  - ADR 0002 (.core/governance/adrs/0002-coverage-state-enum.md):
 *    `coverageState` é enum fechado; mensagens nomeiam o conjunto válido.
 *  - ADR 0003 (.core/governance/adrs/0003-drift-guard-bypass.md):
 *    bypass declarativo só convive com `coverageState === "deprecated"`.
 */
import { GovernanceError } from "../shared/errors.js";

export const LIVING_DOCS_COVERAGE_STATES = ["covered", "pending", "deprecated"] as const;
export type CoverageState = (typeof LIVING_DOCS_COVERAGE_STATES)[number];

/** Localização do call site no source — file path + line range inclusivo. */
export interface LivingDocsSource {
  readonly file: string;
  readonly lineStart: number;
  readonly lineEnd: number;
}

/** Bloco de bypass auditável (ADR 0003), presente apenas em entries deprecated. */
export interface LivingDocsBypass {
  readonly until: string; // ISO-8601 YYYY-MM-DD
  readonly ref: string;
  readonly reason: string;
}

export interface LivingDocsEntry {
  readonly ruleId: string;
  readonly title: string;
  readonly boundedContext: string;
  readonly domain: string;
  readonly source: LivingDocsSource;
  readonly tags: readonly string[];
  readonly coverageState: CoverageState;
  readonly bypass?: LivingDocsBypass;
}

const REQUIRED_FIELDS = [
  "ruleId",
  "title",
  "boundedContext",
  "domain",
  "source",
  "tags",
  "coverageState",
] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const BYPASS_REASON_MIN_LENGTH = 8;

const COVERAGE_STATES_LIST = LIVING_DOCS_COVERAGE_STATES.join(", ");

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertRequiredFields(input: Record<string, unknown>): void {
  for (const field of REQUIRED_FIELDS) {
    if (!(field in input) || input[field] === undefined) {
      throw new GovernanceError(
        "LIVING_DOCS_MISSING_FIELD",
        `Living Docs entry: campo obrigatório '${field}' ausente.`
      );
    }
  }
}

function assertValidSource(value: unknown): asserts value is LivingDocsSource {
  if (!isPlainObject(value)) {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_SOURCE",
      "Living Docs entry: 'source' deve ser objeto { file, lineStart, lineEnd }."
    );
  }
  const { file, lineStart, lineEnd } = value as Record<string, unknown>;
  if (typeof file !== "string" || file.length === 0) {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_SOURCE",
      "Living Docs entry: 'source.file' deve ser string não-vazia."
    );
  }
  if (typeof lineStart !== "number" || typeof lineEnd !== "number") {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_SOURCE",
      "Living Docs entry: 'source.lineStart' e 'source.lineEnd' devem ser números."
    );
  }
  if (lineStart < 1 || lineEnd < 1) {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_SOURCE",
      "Living Docs entry: 'source.lineStart' e 'source.lineEnd' devem ser ≥ 1."
    );
  }
  if (lineStart > lineEnd) {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_SOURCE",
      `Living Docs entry: 'source.lineStart' (${lineStart}) maior que 'source.lineEnd' (${lineEnd}).`
    );
  }
}

function assertValidCoverageState(value: unknown): asserts value is CoverageState {
  if (
    typeof value !== "string" ||
    !(LIVING_DOCS_COVERAGE_STATES as readonly string[]).includes(value)
  ) {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_COVERAGE_STATE",
      `Living Docs entry: 'coverageState' deve ser um de [${COVERAGE_STATES_LIST}]; recebido '${String(value)}'.`
    );
  }
}

function assertValidTags(value: unknown): asserts value is readonly string[] {
  if (!Array.isArray(value)) {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_TAGS",
      "Living Docs entry: 'tags' deve ser array de strings."
    );
  }
  for (const tag of value) {
    if (typeof tag !== "string") {
      throw new GovernanceError(
        "LIVING_DOCS_INVALID_TAGS",
        "Living Docs entry: cada elemento de 'tags' deve ser string."
      );
    }
  }
}

function assertValidBypass(value: unknown): asserts value is LivingDocsBypass {
  if (!isPlainObject(value)) {
    throw new GovernanceError(
      "LIVING_DOCS_BYPASS_MALFORMED",
      "Living Docs entry: 'bypass' deve ser objeto { until, ref, reason }."
    );
  }
  const { until, ref, reason } = value as Record<string, unknown>;
  if (typeof until !== "string" || !ISO_DATE.test(until)) {
    throw new GovernanceError(
      "LIVING_DOCS_BYPASS_MALFORMED",
      "Living Docs bypass: 'until' deve ser data ISO-8601 (YYYY-MM-DD)."
    );
  }
  if (typeof ref !== "string" || ref.length === 0) {
    throw new GovernanceError(
      "LIVING_DOCS_BYPASS_MALFORMED",
      "Living Docs bypass: 'ref' deve ser string não-vazia (ex.: DEC-XXXX-YY, INC-YYYYMMDD-N)."
    );
  }
  if (typeof reason !== "string" || reason.trim().length < BYPASS_REASON_MIN_LENGTH) {
    throw new GovernanceError(
      "LIVING_DOCS_BYPASS_MALFORMED",
      `Living Docs bypass: 'reason' deve ter no mínimo ${BYPASS_REASON_MIN_LENGTH} caracteres significativos.`
    );
  }
}

export function assertValidEntry(input: unknown): asserts input is LivingDocsEntry {
  if (!isPlainObject(input)) {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_ENTRIES",
      "Living Docs entry: entrada deve ser objeto."
    );
  }
  assertRequiredFields(input);

  const { ruleId, title, boundedContext, domain, source, tags, coverageState, bypass } =
    input as Record<string, unknown>;

  if (typeof ruleId !== "string" || ruleId.length === 0) {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_RULE_ID",
      "Living Docs entry: 'ruleId' deve ser string não-vazia."
    );
  }
  if (typeof title !== "string" || title.length === 0) {
    throw new GovernanceError(
      "LIVING_DOCS_MISSING_FIELD",
      "Living Docs entry: 'title' deve ser string não-vazia."
    );
  }
  if (typeof boundedContext !== "string" || boundedContext.length === 0) {
    throw new GovernanceError(
      "LIVING_DOCS_MISSING_FIELD",
      "Living Docs entry: 'boundedContext' deve ser string não-vazia."
    );
  }
  if (typeof domain !== "string" || domain.length === 0) {
    throw new GovernanceError(
      "LIVING_DOCS_MISSING_FIELD",
      "Living Docs entry: 'domain' deve ser string não-vazia."
    );
  }

  assertValidSource(source);
  assertValidTags(tags);
  assertValidCoverageState(coverageState);

  if (bypass !== undefined) {
    if (coverageState !== "deprecated") {
      throw new GovernanceError(
        "LIVING_DOCS_BYPASS_REQUIRES_DEPRECATED",
        `Living Docs entry: bloco 'bypass' só é permitido com coverageState='deprecated' (recebido '${String(coverageState)}').`
      );
    }
    assertValidBypass(bypass);
  }
}
