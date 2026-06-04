import { Command, CommandContext, CommandResult } from "./Command.js";

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

  /** Nomes canônicos registrados (sem aliases), ordenados — para help e erros. */
  commandNames(): readonly string[] {
    const canonical = new Set<string>();
    for (const command of this.byKey.values()) {
      canonical.add(command.name);
    }
    return [...canonical].sort();
  }

  /**
   * Roteia `argv` (o nome do comando em `argv[0]`) para o comando resolvido:
   * `command.run(command.parse(argv.slice(1)), context)`. Comando ausente ou
   * desconhecido → `exitCode 1` com mensagem narrativa (lista os disponíveis).
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
      context.logger.error(
        `Comando não suportado: "${name}". Disponíveis: ${this.commandNames().join(", ")}.`
      );
      return { exitCode: 1 };
    }

    const options = command.parse(rest);
    return command.run(options, context);
  }
}
