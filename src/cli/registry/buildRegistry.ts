import { CommandRegistry } from "./CommandRegistry.js";
import { ContinueCommand } from "./commands/ContinueCommand.js";
import { InsightCommand } from "./commands/InsightCommand.js";
import { TriageCommand } from "./commands/TriageCommand.js";
import { ReleasePrepCommand } from "./commands/ReleasePrepCommand.js";
import { WorkflowCommand } from "./commands/WorkflowCommand.js";
import { ListActiveSpecsCommand } from "./commands/ListActiveSpecsCommand.js";

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
  registry.register(new InsightCommand());
  registry.register(new TriageCommand()); // name "triage" + alias transitório "review"
  registry.register(new ReleasePrepCommand());
  registry.register(new WorkflowCommand());
  registry.register(new ListActiveSpecsCommand()); // read-only; migra "list-active-specs" (#35 etapa 2)
  return registry;
}
