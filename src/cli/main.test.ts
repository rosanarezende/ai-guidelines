import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { run } from "./main.js";
import { Prompts } from "../app/ports/Prompts.js";
import { Command, CommandResult } from "./registry/Command.js";
import { CommandRegistry } from "./registry/CommandRegistry.js";

class ScriptedPrompts implements Prompts {
  readonly notes: string[] = [];
  readonly statuses: string[] = [];

  constructor(private readonly selected: string) {}

  async select<T>(): Promise<T> {
    return this.selected as T;
  }

  async input(): Promise<string> {
    return "";
  }

  async confirm(): Promise<boolean> {
    return false;
  }

  note(message: string): void {
    this.notes.push(message);
  }

  status(kind: string, message: string): void {
    this.statuses.push(`${kind}:${message}`);
  }
}

function makeLogger(): {
  readonly logger: {
    readonly info: (message: string) => void;
    readonly error: (message: string) => void;
  };
  readonly infos: string[];
  readonly errors: string[];
} {
  const infos: string[] = [];
  const errors: string[] = [];
  return {
    infos,
    errors,
    logger: {
      info: (message) => infos.push(message),
      error: (message) => errors.push(message),
    },
  };
}

function spyCommand(name: string): Command<void> & { readonly calls: readonly string[][] } {
  const calls: string[][] = [];
  return {
    name,
    description: `spy ${name}`,
    usage: [name],
    calls,
    parse(argv: readonly string[]): void {
      calls.push([...argv]);
    },
    async run(): Promise<CommandResult> {
      return { exitCode: 0 };
    },
  };
}

function registryWith(...commands: Command<unknown>[]): CommandRegistry {
  const registry = new CommandRegistry();
  for (const command of commands) registry.register(command);
  return registry;
}

async function withTempCwd<T>(setup: (repoRoot: string) => void, fn: () => Promise<T>): Promise<T> {
  const previous = process.cwd();
  const repoRoot = mkdtempSync(path.join(tmpdir(), "ai-guidelines-main-"));
  try {
    setup(repoRoot);
    process.chdir(repoRoot);
    return await fn();
  } finally {
    process.chdir(previous);
    rmSync(repoRoot, { recursive: true, force: true });
  }
}

describe("ai-guidelines help público", () => {
  it("DADO --help QUANDO renderiza ENTÃO apresenta npx ai-guidelines como entrada principal", async () => {
    const infos: string[] = [];
    const errors: string[] = [];

    const exitCode = await run(["--help"], {
      logger: {
        info: (message) => infos.push(message),
        error: (message) => errors.push(message),
      },
      isTTY: false,
    });

    const out = infos.join("\n");
    expect(exitCode).toBe(0);
    expect(errors).toEqual([]);
    expect(out).toContain("npx ai-guidelines");
    expect(out).toContain("Guia interativo:         npx ai-guidelines");
    expect(out).toContain("Ex.: npx ai-guidelines init");
    expect(out).not.toContain("npm run flow -- <comando>");
    expect(out).not.toContain("Ex.: npm run flow --");
  });

  it("DADO pasta vazia QUANDO roda sem comando em non-TTY ENTÃO orienta init sem cair no cockpit", async () => {
    await withTempCwd(
      () => undefined,
      async () => {
        const { logger, infos, errors } = makeLogger();

        const exitCode = await run([], {
          logger,
          isTTY: false,
          runCockpit: () => {
            throw new Error("cockpit não deve rodar em pasta vazia");
          },
        });

        const out = infos.join("\n");
        expect(exitCode).toBe(0);
        expect(errors).toEqual([]);
        expect(out).toContain("Este parece ser um diretório novo.");
        expect(out).toContain("Iniciar ai-guidelines neste repositório");
        expect(out).toContain("npx ai-guidelines init --dry-run");
        expect(out).not.toContain("cockpit — estado irrecuperável");
      }
    );
  });

  it("DADO repo com package.json QUANDO roda sem comando em non-TTY ENTÃO orienta adopt", async () => {
    await withTempCwd(
      (repoRoot) => {
        writeFileSync(path.join(repoRoot, "package.json"), '{"name":"consumer"}\n');
      },
      async () => {
        const { logger, infos, errors } = makeLogger();

        const exitCode = await run([], {
          logger,
          isTTY: false,
          runCockpit: () => {
            throw new Error("cockpit não deve rodar em repo existente sem governança");
          },
        });

        const out = infos.join("\n");
        expect(exitCode).toBe(0);
        expect(errors).toEqual([]);
        expect(out).toContain("Este parece ser um repositório existente ainda não governado.");
        expect(out).toContain("Adotar ai-guidelines neste repositório");
        expect(out).toContain("npx ai-guidelines adopt --dry-run");
      }
    );
  });

  it("DADO repo governado sem lifecycle QUANDO roda sem comando em non-TTY ENTÃO orienta update", async () => {
    await withTempCwd(
      (repoRoot) => {
        mkdirSync(path.join(repoRoot, ".governance"), { recursive: true });
      },
      async () => {
        const { logger, infos, errors } = makeLogger();

        const exitCode = await run([], {
          logger,
          isTTY: false,
          runCockpit: () => {
            throw new Error("cockpit não deve rodar em consumidor governado sem lifecycle");
          },
        });

        const out = infos.join("\n");
        expect(exitCode).toBe(0);
        expect(errors).toEqual([]);
        expect(out).toContain("Este repositório já usa ai-guidelines.");
        expect(out).toContain(
          "Atualizar runtime, templates, providers, práticas ou política governada"
        );
        expect(out).toContain("npx ai-guidelines update --dry-run");
      }
    );
  });

  it("DADO repo governado com lifecycle QUANDO roda sem comando em non-TTY ENTÃO mantém cockpit situado", async () => {
    await withTempCwd(
      (repoRoot) => {
        mkdirSync(path.join(repoRoot, ".governance", "specs"), { recursive: true });
      },
      async () => {
        const { logger } = makeLogger();
        const calls: string[] = [];

        const exitCode = await run([], {
          logger,
          isTTY: false,
          runCockpit: () => {
            calls.push("cockpit");
            return 0;
          },
        });

        expect(exitCode).toBe(0);
        expect(calls).toEqual(["cockpit"]);
      }
    );
  });

  it("DADO pasta vazia em TTY QUANDO roda sem comando ENTÃO abre fluxo guiado de init", async () => {
    await withTempCwd(
      () => undefined,
      async () => {
        const { logger } = makeLogger();
        const prompts = new ScriptedPrompts("init");
        const init = spyCommand("init");

        const exitCode = await run([], {
          logger,
          prompts,
          registry: registryWith(init),
          isTTY: true,
          runFlowWizard: async () => {
            throw new Error("wizard governado não deve rodar antes do provisioning inicial");
          },
        });

        expect(exitCode).toBe(0);
        expect(init.calls).toEqual([[]]);
        expect(prompts.notes.join("\n")).toContain("Este parece ser um diretório novo.");
        expect(prompts.statuses.join("\n")).toContain("Abrindo init");
      }
    );
  });
});
