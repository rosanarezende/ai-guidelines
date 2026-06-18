/**
 * Porta para prompts interativos da CLI.
 *
 * Implementação default em `src/infrastructure/io/ClackPrompts.ts`
 * (delega para `@clack/prompts`). Tests injetam fakes que devolvem
 * respostas predefinidas — padrão DDD análogo a `ClipboardWriter` e
 * `WorkflowFileSystem`.
 *
 * **Convenção:** os métodos retornam a resposta do humano (string ou
 * o `value` de uma `Choice`). Cancelamentos visuais devem ser normalizados para
 * `PromptCancelledError`, o que callers devem capturar quando precisarem de
 * exit gracioso.
 *
 * Clack é a superfície humana única do runtime novo. A porta preserva testes
 * determinísticos e impede que regras de fluxo vazem para o adapter visual.
 */
export interface PromptChoice<T = string> {
  readonly name: string;
  readonly value: T;
  readonly hint?: string;
  readonly disabled?: boolean;
}

export class PromptCancelledError extends Error {
  constructor(message = "Operação cancelada pelo usuário.") {
    super(message);
    this.name = "PromptCancelledError";
  }
}

export function isPromptCancelled(error: unknown): error is PromptCancelledError {
  return error instanceof PromptCancelledError;
}

export interface SelectOptions<T = string> {
  readonly message: string;
  readonly choices: ReadonlyArray<PromptChoice<T>>;
}

export interface MultiSelectOptions<T = string> {
  readonly message: string;
  readonly choices: ReadonlyArray<PromptChoice<T>>;
  readonly defaultValues?: ReadonlyArray<T>;
  readonly required?: boolean;
}

export interface GroupedMultiSelectOptions<T = string> {
  readonly message: string;
  readonly groups: Readonly<Record<string, ReadonlyArray<PromptChoice<T>>>>;
  readonly defaultValues?: ReadonlyArray<T>;
  readonly required?: boolean;
  readonly maxItems?: number;
  readonly groupSpacing?: number;
}

export interface InputOptions {
  readonly message: string;
  readonly default?: string;
}

export interface ConfirmOptions {
  readonly message: string;
  /** Default value se humano apenas pressionar Enter. Default: `false` (segurança). */
  readonly default?: boolean;
}

export interface SpinnerOptions<T = void> {
  readonly start: string;
  readonly stop?: string;
  readonly error?: string;
  readonly task: () => T | Promise<T>;
}

export interface PromptTask {
  readonly title: string;
  readonly task: (
    message: (value: string) => void
  ) => string | Promise<string> | void | Promise<void>;
}

export interface TaskLogGroup {
  message(message: string): void;
  success(message: string): void;
  error(message: string): void;
}

export interface TaskLog {
  message(message: string): void;
  group(name: string): TaskLogGroup;
  success(message: string, options?: { readonly showLog?: boolean }): void;
  error(message: string, options?: { readonly showLog?: boolean }): void;
}

export interface TaskLogOptions {
  readonly title: string;
  readonly limit?: number;
  readonly retainLog?: boolean;
}

export type PromptStatusKind = "info" | "success" | "warn" | "error" | "step";

type PromptRenderResult = void | Promise<void>;

export interface Prompts {
  select<T = string>(options: SelectOptions<T>): Promise<T>;
  multiselect?<T = string>(options: MultiSelectOptions<T>): Promise<readonly T[]>;
  groupMultiselect?<T = string>(options: GroupedMultiSelectOptions<T>): Promise<readonly T[]>;
  input(options: InputOptions): Promise<string>;
  /**
   * Prompt y/n. Cravado em `[DEC-0023-L01]` (Bloco L) — necessário para os
   * wizard options 4/5 (Integration PR + merge-stack) e o standalone
   * `release-prep` confirmarem side-effects irreversíveis antes de executar.
   * Default é `false` (segurança): pressionar Enter sem digitar não autoriza.
   */
  confirm(options: ConfirmOptions): Promise<boolean>;
  intro?(message: string): PromptRenderResult;
  outro?(message: string): PromptRenderResult;
  note?(message: string, title?: string): PromptRenderResult;
  box?(message: string, title?: string): PromptRenderResult;
  cancel?(message: string): PromptRenderResult;
  spinner?<T = void>(options: SpinnerOptions<T>): Promise<T>;
  taskList?(tasks: readonly PromptTask[]): Promise<void>;
  taskLog?(options: TaskLogOptions): TaskLog;
  status?(kind: PromptStatusKind, message: string): PromptRenderResult;
}
