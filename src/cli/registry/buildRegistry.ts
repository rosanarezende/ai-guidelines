import { CommandRegistry } from "./CommandRegistry.js";
import { ContinueCommand } from "./commands/ContinueCommand.js";
import { InsightCommand } from "./commands/InsightCommand.js";
import { TriageCommand } from "./commands/TriageCommand.js";
import { ReviewCommand } from "./commands/ReviewCommand.js";
import { ReleasePrepCommand } from "./commands/ReleasePrepCommand.js";
import { WorkflowCommand } from "./commands/WorkflowCommand.js";
import { ListActiveSpecsCommand } from "./commands/ListActiveSpecsCommand.js";
import { DiagnoseDriftCommand } from "./commands/DiagnoseDriftCommand.js";
import { VisualPromptCommand } from "./commands/VisualPromptCommand.js";
import { HandoffCommand } from "./commands/HandoffCommand.js";
import { WorkCommand } from "./commands/WorkCommand.js";
import { DecideCommand } from "./commands/DecideCommand.js";
import { BOOTSTRAP_COMMANDS, BootstrapCommand } from "./commands/BootstrapCommand.js";
import { CockpitCommand } from "./commands/CockpitCommand.js";
import { ValidateCommand } from "./commands/ValidateCommand.js";
import { PeerReviewCommand } from "./commands/PeerReviewCommand.js";

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
  registry.register(new CockpitCommand());
  registry.register(new ValidateCommand());
  registry.register(new ContinueCommand());
  registry.register(new InsightCommand());
  registry.register(new TriageCommand()); // name "triage" (o verbo "review" migrou p/ ReviewCommand)
  registry.register(new ReviewCommand()); // name "review": briefing por lane; numérico/vazio delega ao triage
  registry.register(new PeerReviewCommand()); // review entre pares: PR de colega sem misturar com a spec atual
  registry.register(new ReleasePrepCommand());
  registry.register(new WorkflowCommand());
  registry.register(new ListActiveSpecsCommand()); // read-only; migra "list-active-specs" (#35 etapa 2)
  registry.register(new DiagnoseDriftCommand()); // read-only; migra "diagnose-drift" (#35 etapa 2)
  registry.register(new VisualPromptCommand()); // interativo (prompt/parse); migra "visual-prompt" (#35 etapa 3)
  registry.register(new HandoffCommand()); // read-only; ADR 0022 bootstrap situado
  registry.register(new WorkCommand()); // read-only; briefing governado de trabalho (CO-4 dogfood)
  registry.register(new DecideCommand()); // decisões reservadas ao humano (CO-3; close-dispositions + human-gate)
  return registry;
}
