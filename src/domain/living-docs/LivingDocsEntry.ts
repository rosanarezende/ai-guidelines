/**
 * Entrada do artefato de Living Documentation.
 *
 * Cada entrada representa uma regra de negócio (`[BR-CLI-*]`) declarada no
 * código de testes, projetada estaticamente para consumidores a jusante
 * (humanos, IAs, dashboards futuros). Pertence ao domínio: validação pura,
 * sem IO.
 *
 * **Modelo 1 rule → N evidências (sub-bloco 3.C.4-prep, 2026-05-11).**
 * Uma entry carrega `evidence: LivingDocsSource[]` (cardinalidade ≥ 1) —
 * cada item descreve um `it`/`test` que cobre a rule. O `coverageState` no
 * topo é fusão determinística dos `evidence[i].coverageState`; o bloco
 * `bypass` no topo só aparece quando todos `evidence[*].bypass` convergem.
 * A regra de fusão vive em `LivingDocsArtifact.canonicalizeArtifact` —
 * este módulo valida apenas estrutura.
 *
 * Princípios canônicos aplicados:
 *  - ADR 0002 (.core/governance/adrs/0002-coverage-state-enum.md):
 *    `coverageState` é enum fechado; mensagens nomeiam o conjunto válido.
 *  - ADR 0003 (.core/governance/adrs/0003-drift-guard-bypass.md):
 *    bypass declarativo só convive com `coverageState === "deprecated"` —
 *    invariante aplicada tanto no topo quanto em cada item de `evidence`.
 */
import { GovernanceError } from "../shared/errors.js";

export const LIVING_DOCS_COVERAGE_STATES = ["covered", "pending", "deprecated"] as const;
export type CoverageState = (typeof LIVING_DOCS_COVERAGE_STATES)[number];

/**
 * Uma evidência de cobertura — um call site de `it`/`test`/`.skip` ligado
 * a uma `ruleId`. Pertence ao agregado da entry; cardinalidade ≥ 1 por entry.
 */
export interface LivingDocsSource {
  readonly file: string;
  readonly lineStart: number;
  readonly lineEnd: number;
  readonly testName: string;
  readonly coverageState: CoverageState;
  readonly bypass?: LivingDocsBypass;
}

/** Bloco de bypass auditável (ADR 0003), presente apenas em evidence/entries deprecated. */
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
  readonly evidence: readonly LivingDocsSource[];
  readonly tags: readonly string[];
  readonly coverageState: CoverageState;
  readonly bypass?: LivingDocsBypass;
}

const REQUIRED_FIELDS = [
  "ruleId",
  "title",
  "boundedContext",
  "domain",
  "evidence",
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

/**
 * Valida um item individual de `evidence[]`. Cada `LivingDocsSource` carrega
 * file + line range + testName + coverageState próprio (+ bypass opcional).
 * `bypass` no item só convive com `coverageState === "deprecated"`.
 */
export function assertValidSource(input: unknown): asserts input is LivingDocsSource {
  if (!isPlainObject(input)) {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_SOURCE",
      "Living Docs evidence item: deve ser objeto { file, lineStart, lineEnd, testName, coverageState, bypass? }."
    );
  }
  const { file, lineStart, lineEnd, testName, coverageState, bypass } = input as Record<
    string,
    unknown
  >;
  if (typeof file !== "string" || file.length === 0) {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_SOURCE",
      "Living Docs evidence item: 'file' deve ser string não-vazia."
    );
  }
  if (typeof lineStart !== "number" || typeof lineEnd !== "number") {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_SOURCE",
      "Living Docs evidence item: 'lineStart' e 'lineEnd' devem ser números."
    );
  }
  if (lineStart < 1 || lineEnd < 1) {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_SOURCE",
      "Living Docs evidence item: 'lineStart' e 'lineEnd' devem ser ≥ 1."
    );
  }
  if (lineStart > lineEnd) {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_SOURCE",
      `Living Docs evidence item: 'lineStart' (${lineStart}) maior que 'lineEnd' (${lineEnd}).`
    );
  }
  if (typeof testName !== "string" || testName.length === 0) {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_SOURCE",
      "Living Docs evidence item: 'testName' deve ser string não-vazia."
    );
  }
  assertValidCoverageState(coverageState);
  if (bypass !== undefined) {
    if (coverageState !== "deprecated") {
      throw new GovernanceError(
        "LIVING_DOCS_BYPASS_REQUIRES_DEPRECATED",
        `Living Docs evidence item: bloco 'bypass' só é permitido com coverageState='deprecated' (recebido '${String(coverageState)}').`
      );
    }
    assertValidBypass(bypass);
  }
}

function assertValidEvidence(value: unknown): asserts value is readonly LivingDocsSource[] {
  if (!Array.isArray(value)) {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_EVIDENCE",
      "Living Docs entry: 'evidence' deve ser array de itens { file, lineStart, lineEnd, testName, coverageState, bypass? }."
    );
  }
  if (value.length === 0) {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_EVIDENCE",
      "Living Docs entry: 'evidence' deve ter cardinalidade ≥ 1 — toda rule precisa de ao menos um call site."
    );
  }
  for (const item of value) {
    assertValidSource(item);
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

export function assertValidEntry(input: unknown): asserts input is LivingDocsEntry {
  if (!isPlainObject(input)) {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_ENTRIES",
      "Living Docs entry: entrada deve ser objeto."
    );
  }
  assertRequiredFields(input);

  const { ruleId, title, boundedContext, domain, evidence, tags, coverageState, bypass } =
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

  assertValidEvidence(evidence);
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
