import { input as inquirerInput, select as inquirerSelect } from "@inquirer/prompts";

import { InputOptions, Prompts, SelectOptions } from "../../app/ports/Prompts.js";

/**
 * Implementação default da porta `Prompts` usando `@inquirer/prompts`.
 *
 * Reaproveita a dependência já paga pelo wizard de `init`/`adopt`
 * (`cli/cli/args.mjs`) e padroniza UX entre wizards do framework:
 * navegação por setas, highlight de seleção, validação inline,
 * detecção automática de TTY/non-TTY.
 *
 * Inquirer cuida internamente de TTY vs non-TTY — non-TTY puro recebe
 * o default. Tests injetam `FakePrompts` em vez de manipular streams.
 */
export class InquirerPrompts implements Prompts {
  select<T = string>(options: SelectOptions<T>): Promise<T> {
    return inquirerSelect<T>({
      message: options.message,
      choices: options.choices.map((c) => ({ name: c.name, value: c.value })),
    });
  }

  input(options: InputOptions): Promise<string> {
    return inquirerInput({
      message: options.message,
      default: options.default,
    });
  }
}
