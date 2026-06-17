import { Command, CommandContext, CommandResult } from "./Command.js";
import { renderCommandsHelp } from "./renderHelp.js";
import { isPromptCancelled } from "../../app/ports/Prompts.js";

/**
 * Registry de comandos da CLI — a espinha dorsal extensível que substitui a
 * cadeia `if (command === …)` de `engine.mjs` + o parsing monolítico de
 * `args.mjs` (Spec 0024, `pr-cli-cutover`).
 *
 * Determinístico e sem inferência (ADR 0018): resolve nome→comando por lookup
 * exato (nome ou alias), nunca por fuzzy/ranking. Adicionar um verbo novo =
 * `register(novoComando)`, sem tocar o núcleo.
 */
export class CommandRegistry {
  private readonly byKey = new Map<string, Command<unknown>>();

  /**
   * Registra um comando sob seu nome e seus aliases. Colisão de nome/alias é
   * erro de programação (anti-shadowing) — falha alto e cedo, não silenciosa.
   */
  register<TOptions>(command: Command<TOptions>): this {
    const keys = [command.name, ...(command.aliases ?? [])];
    for (const key of keys) {
      const existing = this.byKey.get(key);
      if (existing) {
        throw new Error(
          `Comando duplicado no registry: "${key}" já registrado por "${existing.name}" ` +
            `(tentando registrar "${command.name}").`
        );
      }
      this.byKey.set(key, command as Command<unknown>);
    }
    return this;
  }

  /** Resolve por nome ou alias (match exato). `undefined` se não houver. */
  resolve(name: string): Command<unknown> | undefined {
    return this.byKey.get(name);
  }

  /** Comandos canônicos (sem aliases), ordenados por nome — base do help e dos erros. */
  commands(): readonly Command<unknown>[] {
    const byName = new Map<string, Command<unknown>>();
    for (const command of this.byKey.values()) {
      byName.set(command.name, command);
    }
    return [...byName.values()].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  }

  /** Nomes canônicos registrados (sem aliases), ordenados — para help e erros. */
  commandNames(): readonly string[] {
    return this.commands().map((command) => command.name);
  }

  /**
   * Help dos comandos do registry — projeção derivada (renderer puro), não 2ª
   * fonte. É o registry, não o `args.mjs`, que passa a ser o SSOT do help dos
   * comandos migrados (auditoria do #35, achado #2).
   */
  renderHelp(): string {
    return renderCommandsHelp(this.commands());
  }

  /**
   * Roteia `argv` (o nome do comando em `argv[0]`) para o comando resolvido.
   * Comando ausente ou desconhecido → `exitCode 1` com mensagem narrativa.
   *
   * **Seleção do produtor de input** (um `run`, dois produtores): usa
   * `command.prompt(context)` SSE `context.prompts` existe E o comando define
   * `prompt` — caminho da superfície HUMANA (wizard). Caso contrário usa
   * `command.parse(rest)` — caminho da CLI direta (sem `prompts` no contexto).
   * Ambos produzem as mesmas options tipadas e fluem ao MESMO `run`. Em modo
   * `prompt`, os posicionais de `argv` são ignorados (o humano fornece o input).
   */
  async dispatch(argv: readonly string[], context: CommandContext): Promise<CommandResult> {
    const [name, ...rest] = argv;

    if (!name) {
      context.logger.error(
        `Nenhum comando informado. Disponíveis: ${this.commandNames().join(", ")}.`
      );
      return { exitCode: 1 };
    }

    const command = this.resolve(name);
    if (!command) {
      if (name === "providers") {
        context.logger.error(
          'Comando não suportado: "providers". Use: npm run flow -- update --providers <lista>.'
        );
        return { exitCode: 1 };
      }

      // Flag no lugar do verbo (ex.: `--target ./x`): a CLI é registry-first, o
      // verbo vem ANTES das opções. Mensagem orientada em vez de "não suportado"
      // genérico — sem reintroduzir wizard implícito a partir de flags soltas.
      context.logger.error(
        name.startsWith("-")
          ? `"${name}" é uma opção, não um comando. Informe um comando antes das opções ` +
              `(ex.: ${this.commandNames().join(", ")}). Use \`--help\` para ver todos.`
          : `Comando não suportado: "${name}". Disponíveis: ${this.commandNames().join(", ")}.`
      );
      return { exitCode: 1 };
    }

    // `--help`/`-h` em QUALQUER comando → help derivado do próprio comando
    // (description + usage do registry), nunca execução. Sem isto, comandos
    // com efeito (ex.: handoff grava recibo) rodavam ao pedir ajuda, e o
    // fallback de outros produzia erro enganoso (dogfood CO-4, rodada 9).
    if (rest.includes("--help") || rest.includes("-h")) {
      context.logger.info(renderCommandsHelp([command]));
      context.logger.info(`\n  Help geral: npm run flow -- --help`);
      return { exitCode: 0 };
    }

    try {
      const options =
        context.prompts && command.prompt ? await command.prompt(context) : command.parse(rest);
      return await command.run(options, context);
    } catch (err) {
      if (isPromptCancelled(err)) {
        context.logger.info(err.message);
        return { exitCode: 0 };
      }
      // Erro de input (parse) ou de execução (run) vira exitCode 1 com mensagem
      // narrativa — nunca stack trace cru ao usuário. Cada comando lança Error
      // com mensagem orientada (ex.: "PR inválido").
      context.logger.error(err instanceof Error ? err.message : String(err));
      return { exitCode: 1 };
    }
  }
}
