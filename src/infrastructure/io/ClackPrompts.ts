import type { Option } from "@clack/prompts";

import {
  ConfirmOptions,
  InputOptions,
  MultiSelectOptions,
  PromptCancelledError,
  Prompts,
  SelectOptions,
  SpinnerOptions,
} from "../../app/ports/Prompts.js";

type ClackModule = typeof import("@clack/prompts");

/**
 * Adapter visual único para prompts humanos do runtime.
 *
 * Toda regra de fluxo vive acima desta camada (`GovernedFlow`, commands e use
 * cases). Este adapter apenas coleta escolhas e renderiza affordances do Clack.
 */
export class ClackPrompts implements Prompts {
  async select<T = string>(options: SelectOptions<T>): Promise<T> {
    const clack = await loadClack();
    const value = await clack.select<T>({
      message: options.message,
      options: toClackOptions(options.choices),
    });
    return unwrap(value);
  }

  async multiselect<T = string>(options: MultiSelectOptions<T>): Promise<readonly T[]> {
    const clack = await loadClack();
    const value = await clack.multiselect<T>({
      message: options.message,
      options: toClackOptions(options.choices),
      initialValues: options.defaultValues ? [...options.defaultValues] : undefined,
      required: options.required ?? false,
    });
    return unwrap(value);
  }

  async input(options: InputOptions): Promise<string> {
    const clack = await loadClack();
    const value = await clack.text({
      message: options.message,
      defaultValue: options.default,
      initialValue: options.default,
    });
    return unwrap(value);
  }

  async confirm(options: ConfirmOptions): Promise<boolean> {
    const clack = await loadClack();
    const value = await clack.confirm({
      message: options.message,
      initialValue: options.default ?? false,
    });
    return unwrap(value);
  }

  async intro(message: string): Promise<void> {
    const clack = await loadClack();
    clack.intro(message);
  }

  async outro(message: string): Promise<void> {
    const clack = await loadClack();
    clack.outro(message);
  }

  async note(message: string, title?: string): Promise<void> {
    const clack = await loadClack();
    clack.note(message, title);
  }

  async cancel(message: string): Promise<void> {
    const clack = await loadClack();
    clack.cancel(message);
  }

  async spinner<T = void>(options: SpinnerOptions<T>): Promise<T> {
    const clack = await loadClack();
    const spin = clack.spinner();
    spin.start(options.start);
    try {
      const result = await options.task();
      spin.stop(options.stop);
      return result;
    } catch (error) {
      spin.error(options.error ?? (error instanceof Error ? error.message : String(error)));
      throw error;
    }
  }
}

let clackModulePromise: Promise<ClackModule> | undefined;

function loadClack(): Promise<ClackModule> {
  clackModulePromise ??= import("@clack/prompts");
  return clackModulePromise;
}

async function unwrap<T>(value: T | symbol): Promise<T> {
  const clack = await loadClack();
  if (clack.isCancel(value)) {
    throw new PromptCancelledError();
  }
  return value;
}

function toClackOptions<T>(
  choices: SelectOptions<T>["choices"] | MultiSelectOptions<T>["choices"]
): Option<T>[] {
  return choices.map((choice) => {
    const option: {
      value: T;
      label: string;
      hint?: string;
      disabled?: boolean;
    } = {
      value: choice.value,
      label: choice.name,
    };
    if (choice.hint !== undefined) option.hint = choice.hint;
    if (choice.disabled !== undefined) option.disabled = choice.disabled;
    return option as Option<T>;
  });
}
