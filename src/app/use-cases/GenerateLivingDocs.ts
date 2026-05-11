/**
 * Use case: gera o `LivingDocsArtifact` canonicalizado a partir dos
 * arquivos de teste do projeto.
 *
 * Orquestra:
 *  1. `RuleExtractor.extract(files)` → entries cruas (potencialmente
 *     fora de ordem, com bypass directives já resolvidas).
 *  2. `canonicalizeArtifact` → projeta forma determinística (ordem alfa
 *     por ruleId, tags dedup+ordenadas, sem timestamps — ADR 0004).
 *  3. `assertValidArtifact` → schema guard final (rede de segurança).
 *
 * Persistência (escrita do YAML em `.governance/living-docs.yml`) NÃO
 * é responsabilidade deste use case — fica no script CLI (composition
 * root) consumindo o `serializeLivingDocs` da infra.
 *
 * Camada: `app/`. Conhece domain + ports; não toca infra direto.
 */
import {
  assertValidArtifact,
  canonicalizeArtifact,
  LIVING_DOCS_SCHEMA_VERSION,
  LivingDocsArtifact,
} from "../../domain/living-docs/LivingDocsArtifact.js";
import type { RuleExtractor } from "../ports/RuleExtractor.js";

export interface GenerateLivingDocsDeps {
  readonly extractor: RuleExtractor;
}

export interface GenerateLivingDocsInput {
  readonly files: readonly string[];
}

export class GenerateLivingDocs {
  constructor(private readonly deps: GenerateLivingDocsDeps) {}

  execute(input: GenerateLivingDocsInput): LivingDocsArtifact {
    const entries = this.deps.extractor.extract(input.files);
    const artifact = canonicalizeArtifact({
      schemaVersion: LIVING_DOCS_SCHEMA_VERSION,
      entries,
    });
    assertValidArtifact(artifact);
    return artifact;
  }
}
