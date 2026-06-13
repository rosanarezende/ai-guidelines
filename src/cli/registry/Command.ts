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

import { Prompts } from "../../app/ports/Prompts.js";

export interface Logger {
  info(message: string): void;
  error(message: string): void;
}

/**
 * Contexto comum injetado em todo comando no `dispatch`. Mínimo por design —
 * `repoRoot` + `logger`. Ports específicos (filesystem, clipboard, stack)
 * continuam resolvidos por cada comando a partir do `repoRoot`, preservando o
 * padrão de injeção-para-teste já usado em `src/cli`.
 */
export interface CommandContext {
  readonly repoRoot: string;
  readonly logger: Logger;
  /**
   * Porta de prompts interativos — presente apenas na superfície HUMANA (wizard),
   * que coleta options via `Command.prompt`. A CLI direta (parse→run) não a injeta.
   * Opcional/aditivo: comandos parse-only ignoram; comandos com `prompt` a exigem.
   */
  readonly prompts?: Prompts;
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
  /**
   * Resumo de UMA linha — fonte única do help, que é projeção derivada do registry
   * (não 2ª fonte em `args.mjs`). Obrigatório: um comando novo não entra sem se
   * descrever (fecha o achado #2 da auditoria do #35 — help acoplado à extensibilidade).
   */
  readonly description: string;
  /** Exemplos de invocação (sem o prefixo `npm run guidelines --`), opcionais — para o help. */
  readonly usage?: readonly string[];
  /**
   * Subcomandos declarados (descriptor-only, read-only). Permite **introspecção
   * sem executar** — ex.: o resolver de superfície `registry-command:<cmd>/<sub>`
   * (CO-3) precisa saber que `workflow` aceita `publish-state` sem rodar o
   * comando. Comandos sem subcomandos omitem o campo.
   */
  readonly subcommands?: readonly string[];
  parse(argv: readonly string[]): TOptions;
  /**
   * Produtor INTERATIVO de options — dual opcional de `parse` (que produz a
   * partir do argv). A superfície humana (wizard) chama `prompt(ctx)→run(...)`;
   * a CLI direta chama `parse(argv)→run(...)`. Um único `run` (execução
   * compartilhada), dois produtores de input.
   *
   * Aditivo/opcional: comandos read-only/scriptáveis seguem só com `parse`. Quem
   * implementa `prompt` coleta o input humano via `context.prompts` (que portanto
   * deve estar presente) — confirmação de side-effect, escolha de modo, contexto.
   */
  prompt?(context: CommandContext): Promise<TOptions>;
  run(options: TOptions, context: CommandContext): Promise<CommandResult>;
}
