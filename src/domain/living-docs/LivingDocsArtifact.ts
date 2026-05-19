/**
 * Artefato canônico de Living Documentation.
 *
 * Coleção de entries (`LivingDocsEntry`) com versionamento de schema e
 * canonicalização determinística. Pertence ao domínio: validação e
 * normalização puras. Serialização YAML literal vive em infrastructure
 * quando o store ganhar IO (PR3.B+).
 *
 * Princípios canônicos aplicados:
 *  - ADR 0011 (.core/governance/adrs/0011-coverage-state-enum.md):
 *    `schemaVersion` é enum fechado; mudar a cardinalidade exige ADR de
 *    extensão e incremento.
 *  - ADR 0013 (.core/governance/adrs/0013-ast-only-extraction.md):
 *    determinismo é contrato — `canonicalizeArtifact` produz forma estável
 *    byte-a-byte; sem timestamps no artefato.
 */
import { GovernanceError } from "../shared/errors.js";
import {
  assertValidEntry,
  CoverageState,
  LivingDocsBypass,
  LivingDocsEntry,
  LivingDocsSource,
} from "./LivingDocsEntry.js";

/** Versão corrente do schema. Bump exige ADR de extensão (ADR 0011 §6). */
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
 *  - entries cruas com mesmo `ruleId` são **agregadas** numa única entry,
 *    com `evidence[]` unificado (1 rule → N evidências);
 *  - `coverageState` no topo é fusão determinística dos evidence[i]
 *    (ver `mergeCoverageState`);
 *  - bloco `bypass` no topo só aparece quando todos `evidence[*].bypass`
 *    convergem em `(until, ref, reason)`; divergência é erro fatal;
 *  - entries ordenadas alfabeticamente por ruleId (lexicographic puro, sem
 *    locale-sensitive sort — estabilidade > intuição);
 *  - tags da entry agregada são união dos tags das entries cruas,
 *    deduplicadas e ordenadas alfabeticamente;
 *  - evidence ordenada por (file, lineStart, lineEnd, testName).
 *
 * Invariantes adicionais (introduzidas em [3.C.4-prep], 2026-05-11):
 *  - `LIVING_DOCS_RULE_CROSS_FILE`: uma rule não pode aparecer em mais de
 *    um arquivo `.test.ts`.
 *  - `LIVING_DOCS_INCONSISTENT_DEPRECATION`: evidence mista
 *    `deprecated` ⊕ `covered`/`pending` é rejeitada.
 *  - `LIVING_DOCS_BYPASS_DIVERGENT`: bypass declarado em parte das
 *    evidências deprecated, ou diretivas que não coincidem.
 *
 * Idempotente: `canonicalize(canonicalize(x))` produz JSON idêntico a
 * `canonicalize(x)`. Garante o contrato byte-a-byte do drift guard (ADR
 * 0003 + ADR 0013).
 */
export function canonicalizeArtifact(input: LivingDocsArtifact): LivingDocsArtifact {
  const groups = new Map<string, LivingDocsEntry[]>();
  for (const entry of input.entries) {
    const list = groups.get(entry.ruleId);
    if (list === undefined) {
      groups.set(entry.ruleId, [entry]);
    } else {
      list.push(entry);
    }
  }

  const aggregated: LivingDocsEntry[] = [];
  for (const [ruleId, rawEntries] of groups) {
    aggregated.push(mergeRawEntries(ruleId, rawEntries));
  }

  const sortedEntries = aggregated
    .map((entry) => canonicalizeEntry(entry))
    .sort((a, b) => (a.ruleId < b.ruleId ? -1 : a.ruleId > b.ruleId ? 1 : 0));

  return {
    schemaVersion: input.schemaVersion,
    entries: sortedEntries,
  };
}

/**
 * Funde N entries cruas com mesmo `ruleId` numa única entry agregada.
 *
 * Regras:
 *  - Evidence: união dos `evidence[]` de cada entry crua, com dedup por
 *    `(file, lineStart, lineEnd, testName)` para preservar idempotência.
 *  - Tags: união simples (canonicalizeEntry deduplica/ordena depois).
 *  - title/boundedContext/domain: vêm da entry crua com menor `(file,
 *    lineStart)` — escolha estável e determinística.
 *  - coverageState: fusão por `mergeCoverageState`.
 *  - bypass: convergência verificada por `mergeBypass`.
 *  - cross-file: rejeitado com `LIVING_DOCS_RULE_CROSS_FILE`.
 */
function mergeRawEntries(ruleId: string, rawEntries: readonly LivingDocsEntry[]): LivingDocsEntry {
  const allEvidence = dedupEvidence(rawEntries.flatMap((entry) => [...entry.evidence]));
  assertSingleFile(ruleId, allEvidence);

  const allTags = rawEntries.flatMap((entry) => [...entry.tags]);

  const primary = pickPrimaryEntry(rawEntries);

  const coverageState = mergeCoverageState(ruleId, allEvidence);
  const bypass = coverageState === "deprecated" ? mergeBypass(ruleId, allEvidence) : undefined;

  return {
    ruleId,
    title: primary.title,
    boundedContext: primary.boundedContext,
    domain: primary.domain,
    evidence: allEvidence,
    tags: allTags,
    coverageState,
    ...(bypass !== undefined ? { bypass } : {}),
  };
}

function dedupEvidence(evidence: readonly LivingDocsSource[]): LivingDocsSource[] {
  const seen = new Map<string, LivingDocsSource>();
  for (const ev of evidence) {
    const key = `${ev.file}|${ev.lineStart}|${ev.lineEnd}|${ev.testName}`;
    if (!seen.has(key)) seen.set(key, ev);
  }
  return [...seen.values()];
}

function assertSingleFile(ruleId: string, evidence: readonly LivingDocsSource[]): void {
  const files = new Set(evidence.map((ev) => ev.file));
  if (files.size > 1) {
    const list = [...files].sort().join(", ");
    throw new GovernanceError(
      "LIVING_DOCS_RULE_CROSS_FILE",
      `Living Docs: ruleId '${ruleId}' aparece em múltiplos arquivos [${list}]. Uma rule só pode viver em um arquivo .test.ts.`
    );
  }
}

function pickPrimaryEntry(rawEntries: readonly LivingDocsEntry[]): LivingDocsEntry {
  // Entry crua com menor (file, lineStart) — estável e determinística.
  // Cross-file já foi rejeitado a montante, então todos terão mesmo file
  // (file no comparador é defesa para chamada isolada). Em vez de assumir
  // `evidence[0]` mínimo (frágil para extractor futuro), escaneamos o
  // mínimo dentro de cada rawEntry.evidence — invariante vive no domain.
  return [...rawEntries].sort((a, b) => {
    const ma = minEvidence(a.evidence);
    const mb = minEvidence(b.evidence);
    if (ma.file !== mb.file) return ma.file < mb.file ? -1 : 1;
    return ma.lineStart - mb.lineStart;
  })[0];
}

function minEvidence(evidence: readonly LivingDocsSource[]): LivingDocsSource {
  return evidence.reduce((acc, ev) => {
    if (ev.file !== acc.file) return ev.file < acc.file ? ev : acc;
    return ev.lineStart < acc.lineStart ? ev : acc;
  });
}

function mergeCoverageState(ruleId: string, evidence: readonly LivingDocsSource[]): CoverageState {
  const states = evidence.map((ev) => ev.coverageState);
  const hasCovered = states.includes("covered");
  const hasPending = states.includes("pending");
  const hasDeprecated = states.includes("deprecated");

  if (hasDeprecated && (hasCovered || hasPending)) {
    throw new GovernanceError(
      "LIVING_DOCS_INCONSISTENT_DEPRECATION",
      `Living Docs: ruleId '${ruleId}' tem evidências mistas — algumas marcadas como 'deprecated' e outras como 'covered'/'pending'. Marque todas as evidências como deprecated (com bypass declarado) ou nenhuma.`
    );
  }
  if (hasDeprecated) return "deprecated";
  if (hasCovered) return "covered";
  return "pending";
}

function mergeBypass(
  ruleId: string,
  evidence: readonly LivingDocsSource[]
): LivingDocsBypass | undefined {
  const withBypass = evidence.filter(
    (ev): ev is LivingDocsSource & { bypass: LivingDocsBypass } => ev.bypass !== undefined
  );
  if (withBypass.length === 0) return undefined;
  if (withBypass.length !== evidence.length) {
    throw new GovernanceError(
      "LIVING_DOCS_BYPASS_DIVERGENT",
      `Living Docs: ruleId '${ruleId}' tem bypass declarado em ${withBypass.length} de ${evidence.length} evidências deprecated. Bypass deve estar presente em todas as evidências deprecated ou em nenhuma.`
    );
  }
  const ref = withBypass[0].bypass;
  for (const ev of withBypass) {
    if (
      ev.bypass.until !== ref.until ||
      ev.bypass.ref !== ref.ref ||
      ev.bypass.reason !== ref.reason
    ) {
      const summary = withBypass
        .map((e) => `(until=${e.bypass.until}, ref=${e.bypass.ref})`)
        .join(", ");
      throw new GovernanceError(
        "LIVING_DOCS_BYPASS_DIVERGENT",
        `Living Docs: ruleId '${ruleId}' tem bypass divergente entre evidências [${summary}]. Todas as diretivas devem coincidir em (until, ref, reason).`
      );
    }
  }
  return { until: ref.until, ref: ref.ref, reason: ref.reason };
}

function canonicalizeEntry(entry: LivingDocsEntry): LivingDocsEntry {
  const uniqueSortedTags = Array.from(new Set(entry.tags)).sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0
  );

  // Preserva apenas os campos canônicos — qualquer campo extra que tenha
  // vazado para o objeto fica fora da projeção determinística. Itens de
  // `evidence` são ordenados por (file, lineStart) para estabilidade
  // byte-a-byte do artefato a jusante.
  const canonical: LivingDocsEntry = {
    ruleId: entry.ruleId,
    title: entry.title,
    boundedContext: entry.boundedContext,
    domain: entry.domain,
    evidence: orderEvidence(entry.evidence).map(canonicalizeSource),
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

function orderEvidence(evidence: readonly LivingDocsSource[]): readonly LivingDocsSource[] {
  return [...evidence].sort((a, b) => {
    if (a.file !== b.file) return a.file < b.file ? -1 : 1;
    if (a.lineStart !== b.lineStart) return a.lineStart - b.lineStart;
    if (a.lineEnd !== b.lineEnd) return a.lineEnd - b.lineEnd;
    return a.testName < b.testName ? -1 : a.testName > b.testName ? 1 : 0;
  });
}

function canonicalizeSource(source: LivingDocsSource): LivingDocsSource {
  return {
    file: source.file,
    lineStart: source.lineStart,
    lineEnd: source.lineEnd,
    testName: source.testName,
    coverageState: source.coverageState,
    ...(source.bypass !== undefined
      ? {
          bypass: {
            until: source.bypass.until,
            ref: source.bypass.ref,
            reason: source.bypass.reason,
          },
        }
      : {}),
  };
}
