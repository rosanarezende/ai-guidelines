import { Command, CommandContext, CommandResult } from "../Command.js";
import { parseFlags } from "../parseFlags.js";
import { pathToFileURL } from "node:url";
import path from "node:path";

type RawOptions = Record<string, string | boolean | string[] | undefined>;
export type LegacyExecuteFn = (mode: string, rawOptions: RawOptions) => Promise<void>;

const BOOLEAN_FLAGS = new Set([
  "force",
  "force-prettier",
  "dry-run",
  "install",
  "prune",
  "yes",
  "y",
  "skip-bdd",
  "skip-ci",
  "skip-husky",
  "skip-prettier",
  "skip-quality-gates",
  "skip-tdd",
]);

const OPTION_FLAGS = [
  "target",
  "name",
  "package-manager",
  "providers",
  "lang",
  "features",
] as const;

const SUPPORTED_BOOTSTRAP_COMMANDS = [
  "init",
  "adopt",
  "providers",
  "update",
  "check-budget",
] as const;
export type BootstrapCommandName = (typeof SUPPORTED_BOOTSTRAP_COMMANDS)[number];

export interface BootstrapCommandOptions {
  readonly rawOptions: RawOptions;
}

export interface BootstrapCommandDefinition {
  readonly name: BootstrapCommandName;
  readonly description: string;
  readonly usage: readonly string[];
}

async function loadLegacyExecute(): Promise<LegacyExecuteFn> {
  const legacyPath = path.resolve(process.cwd(), "cli/app/engine.mjs");
  const mod = (await import(pathToFileURL(legacyPath).href)) as {
    readonly execute: LegacyExecuteFn;
  };
  return mod.execute;
}

function normalizeBooleanValue(key: string, value: string | true): boolean | string {
  if (!BOOLEAN_FLAGS.has(key) && !key.startsWith("skip-")) return value;
  if (value === true) return true;

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y", "sim", "s"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "nao", "não"].includes(normalized)) return false;
  return value;
}

/**
 * Adapter dos comandos de bootstrap/distribuição ao CommandRegistry.
 *
 * O roteamento e parsing deixam de viver no fallback central de `engine.mjs`.
 * A execução interna ainda reaproveita o provisionamento existente; a fronteira
 * pública da CLI, entretanto, já passa pelo CommandRegistry.
 */
export class BootstrapCommand implements Command<BootstrapCommandOptions> {
  readonly name: BootstrapCommandName;
  readonly description: string;
  readonly usage: readonly string[];

  constructor(
    definition: BootstrapCommandDefinition,
    private readonly executeFn: () => Promise<LegacyExecuteFn> = loadLegacyExecute
  ) {
    this.name = definition.name;
    this.description = definition.description;
    this.usage = definition.usage;
  }

  parse(argv: readonly string[]): BootstrapCommandOptions {
    const { positionals, flags } = parseFlags(argv, {
      booleans: [...BOOLEAN_FLAGS],
    });
    if (positionals.length > 0) {
      throw new Error(`Argumento inesperado: ${positionals[0]}`);
    }

    const rawOptions: RawOptions = {};
    for (const key of OPTION_FLAGS) {
      const value = flags.get(key);
      if (value !== undefined && value !== true) {
        rawOptions[key] = value;
      }
    }
    for (const [key, value] of flags.entries()) {
      if (BOOLEAN_FLAGS.has(key) || key.startsWith("skip-")) {
        rawOptions[key] = normalizeBooleanValue(key, value);
      }
    }
    return { rawOptions };
  }

  async run(options: BootstrapCommandOptions, _context: CommandContext): Promise<CommandResult> {
    const execute = await this.executeFn();
    await execute(this.name, options.rawOptions);
    return { exitCode: 0 };
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
    name: "providers",
    description: "Adiciona ou atualiza arquivos nativos de provider.",
    usage: ["providers --target . --providers claude,openai"],
  },
  {
    name: "update",
    description:
      "Re-aplica provider entrypoints, templates e runtime a partir do config existente.",
    usage: ["update --target ."],
  },
  {
    name: "check-budget",
    description: "Imprime o relatório de orçamento de tokens.",
    usage: ["check-budget"],
  },
];
