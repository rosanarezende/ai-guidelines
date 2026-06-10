import { CommandRegistry } from "./CommandRegistry.js";
import { ContinueCommand } from "./commands/ContinueCommand.js";
import { InsightCommand } from "./commands/InsightCommand.js";
import { TriageCommand } from "./commands/TriageCommand.js";
import { ReleasePrepCommand } from "./commands/ReleasePrepCommand.js";
import { WorkflowCommand } from "./commands/WorkflowCommand.js";
import { ListActiveSpecsCommand } from "./commands/ListActiveSpecsCommand.js";
import { DiagnoseDriftCommand } from "./commands/DiagnoseDriftCommand.js";
import { VisualPromptCommand } from "./commands/VisualPromptCommand.js";
import { HandoffCommand } from "./commands/HandoffCommand.js";
import { BOOTSTRAP_COMMANDS, BootstrapCommand } from "./commands/BootstrapCommand.js";

/**
 * Ponto ÚNICO de registro dos comandos da CLI (Spec 0024, pr-cli-cutover).
 *
 * Critério de aceite: adicionar um verbo novo (`graph`, `why`, …) deve
 * custar **uma linha aqui** (`registry.register(new XCommand())`) — sem tocar o
 * dispatch central (`engine.mjs`) nem um parser monolítico (`args.mjs`).
 */
export function buildRegistry(): CommandRegistry {
  const registry = new CommandRegistry();
  for (const definition of BOOTSTRAP_COMMANDS) {
    registry.register(new BootstrapCommand(definition));
  }
  registry.register(new ContinueCommand());
  registry.register(new InsightCommand());
  registry.register(new TriageCommand()); // name "triage" + alias transitório "review"
  registry.register(new ReleasePrepCommand());
  registry.register(new WorkflowCommand());
  registry.register(new ListActiveSpecsCommand()); // read-only; migra "list-active-specs" (#35 etapa 2)
  registry.register(new DiagnoseDriftCommand()); // read-only; migra "diagnose-drift" (#35 etapa 2)
  registry.register(new VisualPromptCommand()); // interativo (prompt/parse); migra "visual-prompt" (#35 etapa 3)
  registry.register(new HandoffCommand()); // read-only; ADR 0022 bootstrap situado
  return registry;
}
