/**
 * Contrato do registry de comandos da CLI (Spec 0024, `pr-cli-cutover`).
 *
 * Objetivo do cutover (cf. ADR 0025 + critério de aceite do #35): registrar um
 * comando novo (`graph`, `why`, …) deve custar **uma entrada no registry** —
 * sem editar a cadeia `if/else` de `engine.mjs` nem o parser monolítico
 * `args.mjs`. Cada comando declara o próprio `parse` (tipado) e o próprio `run`.
 *
 * Boundary determinístico preservado (ADR 0018): nenhum LLM no runtime. O
 * comando reúne/estrutura e devolve um `exitCode`; a infraestrutura concreta é
 * resolvida pelo próprio comando a partir do `repoRoot` (ports injetáveis em
 * teste), seguindo o padrão já estabelecido em `src/cli/*`.
 */

export interface Logger {
  info(message: string): void;
  error(message: string): void;
}

/**
 * Contexto comum injetado em todo comando no `dispatch`. Mínimo por design —
 * `repoRoot` + `logger`. Ports específicos (filesystem, clipboard, prompts,
 * stack) continuam resolvidos por cada comando a partir do `repoRoot`,
 * preservando o padrão de injeção-para-teste já usado em `src/cli`.
 */
export interface CommandContext {
  readonly repoRoot: string;
  readonly logger: Logger;
}

/** Resultado de um comando — `exitCode` 0 = sucesso (espelha o contrato POSIX). */
export interface CommandResult {
  readonly exitCode: number;
}

/**
 * Um comando da CLI. `parse` transforma o argv (já **sem** o nome do comando)
 * nas options tipadas; `run` executa sobre essas options + contexto.
 *
 * `TOptions` é o tipo das options daquele comando — o registry permanece
 * heterogêneo (cada comando carrega o próprio `TOptions`), mas cada comando é
 * internamente tipado de ponta a ponta (`parse` → `run`).
 */
export interface Command<TOptions = void> {
  readonly name: string;
  readonly aliases?: readonly string[];
  parse(argv: readonly string[]): TOptions;
  run(options: TOptions, context: CommandContext): Promise<CommandResult>;
}
