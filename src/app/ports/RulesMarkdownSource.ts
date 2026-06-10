import { Rule } from "../../domain/rules/Rule.js";

export interface ParsedRulesResult {
  readonly rules: ReadonlyArray<Rule>;
  readonly errors: readonly string[];
}

/**
 * Port: fonte de regras autoradas em Markdown (`.core/rules/**`).
 *
 * Mantém o builder TypeScript desacoplado do filesystem. A implementação
 * concreta vive em infrastructure.
 */
export interface RulesMarkdownSource {
  load(): Promise<ParsedRulesResult>;
}
