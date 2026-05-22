/**
 * Porta para prompts interativos da CLI.
 *
 * Implementação default em `src/infrastructure/io/InquirerPrompts.ts`
 * (delega para `@inquirer/prompts`). Tests injetam fakes que devolvem
 * respostas predefinidas — padrão DDD análogo a `ClipboardWriter` e
 * `WorkflowFileSystem`.
 *
 * **Convenção:** os métodos retornam a resposta do humano (string ou
 * o `value` de uma `Choice`). Inquirer levanta exceção se o usuário
 * aborta (Ctrl+C), o que callers devem capturar quando precisarem de
 * exit gracioso.
 *
 * Cross-ref: `cli/cli/args.mjs` (wizard legacy de init/adopt) já usa
 * `@inquirer/prompts` direto. Esta porta padroniza o uso para o
 * runtime novo (`src/cli/workflow.ts`) e qualquer prompt futuro do
 * framework — convenção registrada em `.governance/specs/0023-workflow
 * -runtime/NEXT.md` § "Convenção operacional — inquirer em todo input
 * humano".
 */
export interface PromptChoice<T = string> {
  readonly name: string;
  readonly value: T;
}

export interface SelectOptions<T = string> {
  readonly message: string;
  readonly choices: ReadonlyArray<PromptChoice<T>>;
}

export interface InputOptions {
  readonly message: string;
  readonly default?: string;
}

export interface Prompts {
  select<T = string>(options: SelectOptions<T>): Promise<T>;
  input(options: InputOptions): Promise<string>;
}
