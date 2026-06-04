import { CommandRegistry } from "./CommandRegistry.js";
import { ContinueCommand } from "./commands/ContinueCommand.js";

/**
 * Ponto ÚNICO de registro dos comandos da CLI (Spec 0024, pr-cli-cutover).
 *
 * Critério de aceite do #35: adicionar um verbo novo (`graph`, `why`, …) deve
 * custar **uma linha aqui** (`registry.register(new XCommand())`) — sem tocar o
 * dispatch central (`engine.mjs`) nem o parser monolítico (`args.mjs`). Quando
 * isso for verdade, o cutover entregou valor arquitetural, não só moveu código.
 */
export function buildRegistry(): CommandRegistry {
  const registry = new CommandRegistry();
  registry.register(new ContinueCommand());
  return registry;
}
