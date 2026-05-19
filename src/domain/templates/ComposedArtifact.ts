/**
 * Artefato composto — output do TemplateEngine.
 *
 * Resultado determinístico da composição de uma Recipe com seus Partials.
 * Contém o Markdown final concatenado + metadata mínima para rastreio.
 *
 * Domain puro — sem IO, sem serialização.
 *
 * Aplica ADR 0013 (.core/governance/adrs/0013-ast-only-extraction.md):
 * mesma recipe + mesmos partials → mesmo output byte-a-byte.
 */
import type { ArtifactKind, WorkflowType, Language } from "./Recipe.js";

export interface ComposedArtifact {
  /** Conteúdo Markdown final, pronto para escrita em disco. */
  readonly content: string;
  /** Metadata de rastreio — qual recipe gerou este artefato. */
  readonly metadata: ComposedArtifactMetadata;
}

export interface ComposedArtifactMetadata {
  readonly artifactKind: ArtifactKind;
  readonly workflowType: WorkflowType;
  readonly language: Language;
  /** Ids dos slots na ordem em que foram compostos. */
  readonly composedSlots: readonly string[];
}
