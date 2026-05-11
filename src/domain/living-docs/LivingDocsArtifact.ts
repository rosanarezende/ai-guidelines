/**
 * Artefato canônico de Living Documentation.
 *
 * Coleção de entries (`LivingDocsEntry`) com versionamento de schema e
 * canonicalização determinística. Pertence ao domínio: validação e
 * normalização puras. Serialização YAML literal vive em infrastructure
 * quando o store ganhar IO (PR3.B+).
 *
 * Princípios canônicos aplicados:
 *  - ADR 0002 (.core/governance/adrs/0002-coverage-state-enum.md):
 *    `schemaVersion` é enum fechado; mudar a cardinalidade exige ADR de
 *    extensão e incremento.
 *  - ADR 0004 (.core/governance/adrs/0004-ast-only-extraction.md):
 *    determinismo é contrato — `canonicalizeArtifact` produz forma estável
 *    byte-a-byte; sem timestamps no artefato.
 */
import { GovernanceError } from "../shared/errors.js";
import { assertValidEntry, LivingDocsEntry } from "./LivingDocsEntry.js";

/** Versão corrente do schema. Bump exige ADR de extensão (ADR 0002 §6). */
export const LIVING_DOCS_SCHEMA_VERSION = "v0" as const;

/**
 * Conjunto fechado de schemaVersions aceitas hoje. Frozen para impedir
 * mutação em runtime — adicionar valor é mudança de contrato que exige PR
 * dedicado + ADR de extensão.
 */
export const LIVING_DOCS_SUPPORTED_SCHEMA_VERSIONS: readonly string[] = Object.freeze([
  LIVING_DOCS_SCHEMA_VERSION,
]);

export interface LivingDocsArtifact {
  readonly schemaVersion: typeof LIVING_DOCS_SCHEMA_VERSION;
  readonly entries: readonly LivingDocsEntry[];
}

const SUPPORTED_LIST = LIVING_DOCS_SUPPORTED_SCHEMA_VERSIONS.join(", ");

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function assertValidArtifact(input: unknown): asserts input is LivingDocsArtifact {
  if (!isPlainObject(input)) {
    throw new GovernanceError(
      "LIVING_DOCS_MISSING_FIELD",
      "Living Docs artifact: entrada deve ser objeto com { schemaVersion, entries }."
    );
  }
  const { schemaVersion, entries } = input as Record<string, unknown>;

  if (schemaVersion === undefined) {
    throw new GovernanceError(
      "LIVING_DOCS_MISSING_FIELD",
      "Living Docs artifact: campo obrigatório 'schemaVersion' ausente."
    );
  }
  if (
    typeof schemaVersion !== "string" ||
    !LIVING_DOCS_SUPPORTED_SCHEMA_VERSIONS.includes(schemaVersion)
  ) {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_SCHEMA_VERSION",
      `Living Docs artifact: 'schemaVersion' deve ser um de [${SUPPORTED_LIST}]; recebido '${String(schemaVersion)}'.`
    );
  }

  if (!Array.isArray(entries)) {
    throw new GovernanceError(
      "LIVING_DOCS_INVALID_ENTRIES",
      "Living Docs artifact: 'entries' deve ser array."
    );
  }

  const seen = new Set<string>();
  for (const entry of entries) {
    assertValidEntry(entry);
    if (seen.has(entry.ruleId)) {
      throw new GovernanceError(
        "LIVING_DOCS_DUPLICATE_RULE_ID",
        `Living Docs artifact: ruleId duplicado '${entry.ruleId}'.`
      );
    }
    seen.add(entry.ruleId);
  }
}

/**
 * Canonicaliza o artefato para forma determinística:
 *  - entries ordenadas alfabeticamente por ruleId (lexicographic puro, sem
 *    locale-sensitive sort — estabilidade > intuição);
 *  - tags de cada entry deduplicadas e ordenadas alfabeticamente;
 *  - estrutura do artefato preservada sem campos temporais.
 *
 * Idempotente: `canonicalize(canonicalize(x))` produz JSON idêntico a
 * `canonicalize(x)`. Garante o contrato byte-a-byte do drift guard (ADR
 * 0003 + ADR 0004).
 */
export function canonicalizeArtifact(input: LivingDocsArtifact): LivingDocsArtifact {
  const sortedEntries = [...input.entries]
    .map((entry) => canonicalizeEntry(entry))
    .sort((a, b) => (a.ruleId < b.ruleId ? -1 : a.ruleId > b.ruleId ? 1 : 0));

  return {
    schemaVersion: input.schemaVersion,
    entries: sortedEntries,
  };
}

function canonicalizeEntry(entry: LivingDocsEntry): LivingDocsEntry {
  const uniqueSortedTags = Array.from(new Set(entry.tags)).sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0
  );

  // Preserva apenas os campos canônicos — qualquer campo extra que tenha
  // vazado para o objeto fica fora da projeção determinística.
  const canonical: LivingDocsEntry = {
    ruleId: entry.ruleId,
    title: entry.title,
    boundedContext: entry.boundedContext,
    domain: entry.domain,
    source: {
      file: entry.source.file,
      lineStart: entry.source.lineStart,
      lineEnd: entry.source.lineEnd,
    },
    tags: uniqueSortedTags,
    coverageState: entry.coverageState,
    ...(entry.bypass !== undefined
      ? {
          bypass: {
            until: entry.bypass.until,
            ref: entry.bypass.ref,
            reason: entry.bypass.reason,
          },
        }
      : {}),
  };
  return canonical;
}
