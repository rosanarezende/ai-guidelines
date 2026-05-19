/**
 * Port: serialização do `LivingDocsArtifact` para string.
 *
 * Mantém o boundary `app → infra` via interface: a Application **não**
 * importa `infrastructure/yaml/` direto; injeta esta função por construção.
 * Implementação concreta (YAML via `yaml@2`) vive em
 * `src/infrastructure/yaml/livingDocsSerializer.ts`.
 *
 * Aplica ADR 0013: determinismo é contrato — a implementação concreta
 * deve produzir saída byte-a-byte estável.
 */
import type { LivingDocsArtifact } from "../../domain/living-docs/LivingDocsArtifact.js";

export type LivingDocsSerializer = (artifact: LivingDocsArtifact) => string;
