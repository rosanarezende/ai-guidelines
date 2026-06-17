import type { Option } from "@clack/prompts";

import {
  ConfirmOptions,
  GroupedMultiSelectOptions,
  InputOptions,
  MultiSelectOptions,
  PromptStatusKind,
  PromptCancelledError,
  PromptTask,
  Prompts,
  SelectOptions,
  SpinnerOptions,
  TaskLog,
  TaskLogOptions,
} from "../../app/ports/Prompts.js";

type ClackModule = typeof import("@clack/prompts");
type LoadClack = () => Promise<ClackModule>;

/**
 * Adapter visual único para prompts humanos do runtime.
 *
 * Toda regra de fluxo vive acima desta camada (`GovernedFlow`, commands e use
 * cases). Este adapter apenas coleta escolhas e renderiza affordances do Clack.
 */
export class ClackPrompts implements Prompts {
  constructor(private readonly loadClack: LoadClack = defaultLoadClack) {}

  async select<T = string>(options: SelectOptions<T>): Promise<T> {
    const clack = await this.loadClack();
    const value = await clack.select<T>({
      message: options.message,
      options: toClackOptions(options.choices),
    });
    return unwrap(clack, value);
  }

  async multiselect<T = string>(options: MultiSelectOptions<T>): Promise<readonly T[]> {
    const clack = await this.loadClack();
    const value = await clack.multiselect<T>({
      message: options.message,
      options: toClackOptions(options.choices),
      initialValues: options.defaultValues ? [...options.defaultValues] : undefined,
      required: options.required ?? false,
    });
    return unwrap(clack, value);
  }

  async groupMultiselect<T = string>(options: GroupedMultiSelectOptions<T>): Promise<readonly T[]> {
    const clack = await this.loadClack();
    const value = await clack.groupMultiselect<T>({
      message: options.message,
      options: Object.fromEntries(
        Object.entries(options.groups).map(([group, choices]) => [group, toClackOptions(choices)])
      ),
      initialValues: options.defaultValues ? [...options.defaultValues] : undefined,
      required: options.required ?? false,
      maxItems: options.maxItems,
      groupSpacing: options.groupSpacing,
    });
    return unwrap(clack, value);
  }

  async input(options: InputOptions): Promise<string> {
    const clack = await this.loadClack();
    const value = await clack.text({
      message: options.message,
      defaultValue: options.default,
      initialValue: options.default,
    });
    return unwrap(clack, value);
  }

  async confirm(options: ConfirmOptions): Promise<boolean> {
    const clack = await this.loadClack();
    const value = await clack.confirm({
      message: options.message,
      initialValue: options.default ?? false,
    });
    return unwrap(clack, value);
  }

  async intro(message: string): Promise<void> {
    const clack = await this.loadClack();
    clack.intro(message);
  }

  async outro(message: string): Promise<void> {
    const clack = await this.loadClack();
    clack.outro(message);
  }

  async note(message: string, title?: string): Promise<void> {
    const clack = await this.loadClack();
    clack.note(message, title);
  }

  async cancel(message: string): Promise<void> {
    const clack = await this.loadClack();
    clack.cancel(message);
  }

  async spinner<T = void>(options: SpinnerOptions<T>): Promise<T> {
    const clack = await this.loadClack();
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

  async taskList(tasks: readonly PromptTask[]): Promise<void> {
    const clack = await this.loadClack();
    await clack.tasks(
      tasks.map((item) => ({
        title: item.title,
        task: item.task,
      }))
    );
  }

  taskLog(options: TaskLogOptions): TaskLog {
    const lazy = createLazyTaskLog(this.loadClack, options);
    return lazy;
  }

  async status(kind: PromptStatusKind, message: string): Promise<void> {
    const clack = await this.loadClack();
    const logger = clack.log[kind === "warn" ? "warning" : kind];
    logger(message);
  }
}

let clackModulePromise: Promise<ClackModule> | undefined;

function defaultLoadClack(): Promise<ClackModule> {
  clackModulePromise ??= import("@clack/prompts");
  return clackModulePromise;
}

function unwrap<T>(clack: ClackModule, value: T | symbol): T {
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

function createLazyTaskLog(loadClack: LoadClack, options: TaskLogOptions): TaskLog {
  let logPromise: Promise<ReturnType<ClackModule["taskLog"]>> | undefined;
  const load = async (): Promise<ReturnType<ClackModule["taskLog"]>> => {
    logPromise ??= loadClack().then((clack) =>
      clack.taskLog({
        title: options.title,
        limit: options.limit,
        retainLog: options.retainLog,
      })
    );
    return logPromise;
  };
  const fire = (fn: (log: ReturnType<ClackModule["taskLog"]>) => void): void => {
    void load().then(fn);
  };
  return {
    message(message: string): void {
      fire((log) => log.message(message));
    },
    group(name: string) {
      return {
        message(message: string): void {
          fire((log) => log.group(name).message(message));
        },
        success(message: string): void {
          fire((log) => log.group(name).success(message));
        },
        error(message: string): void {
          fire((log) => log.group(name).error(message));
        },
      };
    },
    success(message: string, opts?: { readonly showLog?: boolean }): void {
      fire((log) => log.success(message, opts));
    },
    error(message: string, opts?: { readonly showLog?: boolean }): void {
      fire((log) => log.error(message, opts));
    },
  };
}
