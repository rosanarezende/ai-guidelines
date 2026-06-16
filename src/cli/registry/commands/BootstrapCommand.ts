import { Command, CommandContext, CommandResult } from "../Command.js";
import { createBootstrapDelivery } from "../../delivery/bootstrap/composition.js";
import path from "node:path";

interface BootstrapDispatcher {
  dispatch(argv: readonly string[], context: CommandContext): Promise<CommandResult>;
}

type BootstrapDeliveryFactory = (repoRoot: string) => BootstrapDispatcher;

const BOOTSTRAP_PACKAGE_ROOT = path.resolve(__dirname, "../../../..");

// Tupla de tipo dos verbos de bootstrap ativos. `providers` saiu do runtime novo:
// a operação pública suportada é `update --providers <lista>`.
const SUPPORTED_BOOTSTRAP_COMMANDS = ["init", "adopt", "update", "check-budget"] as const;
export type BootstrapCommandName = (typeof SUPPORTED_BOOTSTRAP_COMMANDS)[number];

export interface BootstrapCommandOptions {
  readonly argv: readonly string[];
}

export interface BootstrapCommandDefinition {
  readonly name: BootstrapCommandName;
  readonly description: string;
  readonly usage: readonly string[];
}

/**
 * Adapter dos comandos de bootstrap/distribuição ao CommandRegistry.
 *
 * O registry ativo seleciona o verbo público. Parsing, prompt, help e execução
 * ficam no delivery novo (`src/cli/delivery/bootstrap`), evitando uma segunda
 * lista de flags ou delegação ao runtime legado.
 */
export class BootstrapCommand implements Command<BootstrapCommandOptions> {
  readonly name: BootstrapCommandName;
  readonly description: string;
  readonly usage: readonly string[];

  constructor(
    definition: BootstrapCommandDefinition,
    private readonly createDelivery: BootstrapDeliveryFactory = createBootstrapDelivery
  ) {
    this.name = definition.name;
    this.description = definition.description;
    this.usage = definition.usage;
  }

  parse(argv: readonly string[]): BootstrapCommandOptions {
    return { argv: [...argv] };
  }

  async run(options: BootstrapCommandOptions, context: CommandContext): Promise<CommandResult> {
    const delivery = this.createDelivery(BOOTSTRAP_PACKAGE_ROOT);
    return delivery.dispatch([this.name, ...options.argv], context);
  }
}

export const BOOTSTRAP_COMMANDS: readonly BootstrapCommandDefinition[] = [
  {
    name: "init",
    description: "Cria baseline AI-first em projeto novo.",
    usage: ["init --target ./meu-projeto --lang pt"],
  },
  {
    name: "adopt",
    description: "Aplica baseline AI-first em repositório existente.",
    usage: ["adopt --providers claude,copilot --force"],
  },
  {
    name: "update",
    description:
      "Re-aplica provider entrypoints, templates e runtime a partir do config existente.",
    usage: ["update --target .", "update --providers claude,openai"],
  },
  {
    name: "check-budget",
    description: "Imprime o relatório de orçamento de tokens.",
    usage: ["check-budget"],
  },
];
