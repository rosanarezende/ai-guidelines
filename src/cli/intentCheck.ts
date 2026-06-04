import { CommandRegistry } from "./registry/CommandRegistry.js";
import { buildRegistry } from "./registry/buildRegistry.js";
import { Intent } from "./registry/Intent.js";
import { INTENT_CATALOG, NON_NAVIGABLE_COMMANDS } from "./registry/intentCatalog.js";

export interface IntentCheckResult {
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Valida a fronteira Intent↔Registry (padrão `KnowledgeRef`):
 *  (1) **Integridade referencial (erro):** toda `action.command` resolve no
 *      Registry — pega rename/remoção de comando.
 *  (2) **Cobertura (warning):** comando registrado destinado à navegação humana
 *      sem nenhuma Intent. `nonNavigable` exclui shell/internos (sem ruído).
 *
 * Pura: recebe catálogo + registry; não toca filesystem. SSOTs separadas —
 * Registry = execução; catálogo = navegação; ligadas só pela FK validada aqui.
 */
export function checkIntents(
  catalog: readonly Intent[],
  registry: CommandRegistry,
  nonNavigable: readonly string[] = []
): IntentCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const referenced = new Set<string>();
  for (const intent of catalog) {
    for (const action of intent.actions) {
      referenced.add(action.command);
      if (!registry.resolve(action.command)) {
        errors.push(
          `Intent "${intent.id}": ação referencia comando inexistente "${action.command}".`
        );
      }
    }
  }

  const excluded = new Set(nonNavigable);
  for (const name of registry.commandNames()) {
    if (!referenced.has(name) && !excluded.has(name)) {
      warnings.push(
        `Comando "${name}" não aparece em nenhuma Intent. ` +
          `Adicione uma Intent (navegação humana) ou inclua em NON_NAVIGABLE_COMMANDS.`
      );
    }
  }

  return { errors, warnings };
}

/** Composition root do `intent:check` (catálogo + registry reais). */
export function main(_repoRoot?: string): number {
  const result = checkIntents(INTENT_CATALOG, buildRegistry(), NON_NAVIGABLE_COMMANDS);
  for (const w of result.warnings) process.stderr.write(`⚠️  intent:check — ${w}\n`);
  for (const e of result.errors) process.stderr.write(`❌ intent:check — ${e}\n`);
  if (result.errors.length > 0) return 1;
  const suffix = result.warnings.length > 0 ? ` (${result.warnings.length} warning(s))` : "";
  process.stdout.write(
    `✅ intent:check — ${INTENT_CATALOG.length} intent(s); integridade referencial Intent→Registry ok${suffix}.\n`
  );
  return 0;
}
