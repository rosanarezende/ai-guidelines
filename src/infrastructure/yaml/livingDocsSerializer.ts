/**
 * Serializador YAML determinístico do `LivingDocsArtifact`.
 *
 * Aplica ADR 0002 (schema fechado com mensagens estáveis) e ADR 0004
 * (determinismo byte-a-byte; sem campos temporais). A canonicalização
 * (ordem alfa por ruleId, tags dedup+ordenadas) é responsabilidade do
 * domain (`canonicalizeArtifact`) — este módulo só serializa.
 *
 * Boundary: `yaml@2` só importável sob `src/infrastructure/yaml/`.
 */
import { parse, stringify } from "yaml";
import {
  assertValidArtifact,
  canonicalizeArtifact,
  LivingDocsArtifact,
} from "../../domain/living-docs/LivingDocsArtifact.js";

const STRINGIFY_OPTIONS = {
  lineWidth: 0,
  minContentWidth: 0,
  defaultStringType: "PLAIN" as const,
  defaultKeyType: "PLAIN" as const,
  sortMapEntries: false, // ordem das chaves já controlada pelo canonical projector
};

/**
 * Serializa artifact para YAML determinístico. Canonicaliza antes de
 * stringify para garantir ordem alfa por ruleId e tags dedup+sorted.
 *
 * Ordem canônica de campos por entry: ruleId, title, boundedContext,
 * domain, source, tags, coverageState, bypass (opcional). Reflete a
 * estrutura do tipo `LivingDocsEntry` e produz YAML legível.
 */
export function serializeLivingDocs(artifact: LivingDocsArtifact): string {
  const canonical = canonicalizeArtifact(artifact);
  return stringify(toPlainObject(canonical), STRINGIFY_OPTIONS);
}

/**
 * Lê YAML e produz `LivingDocsArtifact` validado. Repropaga erros do
 * schema guard do domain (códigos estáveis `LIVING_DOCS_*`).
 */
export function parseLivingDocs(yamlText: string): LivingDocsArtifact {
  const raw = parse(yamlText);
  assertValidArtifact(raw);
  return raw;
}

/**
 * Projeção para objeto plano com ordem canônica de chaves. O `yaml@2`
 * preserva a ordem de inserção do objeto JS; controlar essa ordem aqui
 * garante saída byte-a-byte estável.
 *
 * Ordem canônica do entry: ruleId → title → boundedContext → domain →
 * evidence → tags → coverageState → bypass (opcional). Cada item de
 * `evidence` segue: file → lineStart → lineEnd → testName → coverageState
 * → bypass (opcional).
 */
function toPlainObject(artifact: LivingDocsArtifact): Record<string, unknown> {
  return {
    schemaVersion: artifact.schemaVersion,
    entries: artifact.entries.map((entry) => {
      const plain: Record<string, unknown> = {
        ruleId: entry.ruleId,
        title: entry.title,
        boundedContext: entry.boundedContext,
        domain: entry.domain,
        evidence: entry.evidence.map((source) => {
          const ev: Record<string, unknown> = {
            file: source.file,
            lineStart: source.lineStart,
            lineEnd: source.lineEnd,
            testName: source.testName,
            coverageState: source.coverageState,
          };
          if (source.bypass !== undefined) {
            ev.bypass = {
              until: source.bypass.until,
              ref: source.bypass.ref,
              reason: source.bypass.reason,
            };
          }
          return ev;
        }),
        tags: [...entry.tags],
        coverageState: entry.coverageState,
      };
      if (entry.bypass !== undefined) {
        plain.bypass = {
          until: entry.bypass.until,
          ref: entry.bypass.ref,
          reason: entry.bypass.reason,
        };
      }
      return plain;
    }),
  };
}
