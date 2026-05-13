/**
 * Port: extrator de regras `[BR-CLI-*]` declaradas em testes.
 *
 * Aplica ADR 0004 (.core/governance/adrs/0004-ast-only-extraction.md):
 * artefato derivado de código é função pura do AST. A implementação
 * concreta vive em infrastructure (TypeScript Compiler API); este port
 * preserva o boundary domain/app → infrastructure.
 *
 * O extractor recebe paths absolutos de arquivos de teste e retorna
 * entries validadas (instâncias de `LivingDocsEntry`). Determinismo é
 * contrato: mesma entrada → mesma saída (assegurado pelo AST + ordem
 * canônica final em `canonicalizeArtifact`).
 */
import type { LivingDocsEntry } from "../../domain/living-docs/LivingDocsEntry.js";

export interface RuleExtractor {
  /**
   * Lê os arquivos `.test.ts` listados, encontra `[BR-CLI-*]` em
   * call sites de `it`/`test` (incluindo `.skip`) e produz entries.
   *
   * Arquivos que não terminam em `.test.ts` são ignorados (false-positive
   * guard estrutural). Arquivos inexistentes geram erro determinístico
   * com código estável `LIVING_DOCS_EXTRACTOR_FILE_NOT_FOUND`.
   */
  extract(files: readonly string[]): readonly LivingDocsEntry[];
}
