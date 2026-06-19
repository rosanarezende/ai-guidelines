import { spawn, type StdioOptions } from "node:child_process";

type ConsumerJourneyLevel = "all" | "pack" | "yalc" | "verdaccio";

type ProcessResult = {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
};

type RunProcessOptions = {
  readonly cwd: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly stdio?: StdioOptions;
};

type ConsumerJourneyDeps = {
  readonly runProcess?: (
    command: string,
    args: readonly string[],
    options: RunProcessOptions
  ) => Promise<ProcessResult>;
  readonly commandAvailable?: (command: string, cwd: string) => Promise<boolean>;
};

type Logger = {
  readonly log: (message: string) => void;
  readonly error?: (message: string) => void;
};

type ConsumerJourneyOptions = {
  readonly repoRoot: string;
  readonly logger?: Logger;
  readonly deps?: ConsumerJourneyDeps;
};

type ResolvedConsumerJourneyOptions = {
  readonly repoRoot: string;
  readonly logger: Logger;
  readonly deps: {
    readonly runProcess: (
      command: string,
      args: readonly string[],
      options: RunProcessOptions
    ) => Promise<ProcessResult>;
    readonly commandAvailable: (command: string, cwd: string) => Promise<boolean>;
  };
};

const PACK_TEST_ARGS = [
  "--experimental-default-config-file",
  "--test",
  "tests/smoke/*.test.mjs",
  "tests/consumer-journey/*.test.mjs",
] as const;

function executableFor(command: string): string {
  if (process.platform !== "win32") {
    return command;
  }

  if (command.endsWith(".cmd") || command.endsWith(".exe")) {
    return command;
  }

  return `${command}.cmd`;
}

async function defaultRunProcess(
  command: string,
  args: readonly string[],
  options: RunProcessOptions
): Promise<ProcessResult> {
  return await new Promise((resolve, reject) => {
    const child = spawn(executableFor(command), [...args], {
      cwd: options.cwd,
      env: options.env,
      shell: false,
      stdio: options.stdio ?? "pipe",
    });

    let stdout = "";
    let stderr = "";

    if (child.stdout) {
      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8");
      });
    }

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function defaultCommandAvailable(command: string, cwd: string): Promise<boolean> {
  try {
    const result = await defaultRunProcess(command, ["--version"], {
      cwd,
      stdio: "pipe",
    });
    return result.code === 0;
  } catch {
    return false;
  }
}

function writeLines(logger: Logger, lines: readonly string[]): void {
  for (const line of lines) {
    logger.log(line);
  }
}

export function renderConsumerJourneyUsage(): string {
  return [
    "Uso: node dist/cli/bin.js consumer-journey <level> [--strict]",
    "",
    "Levels:",
    "  pack       executa npm pack + consumidores temporarios via smoke tests",
    "  yalc       mostra/verifica a trilha local rapida com yalc",
    "  verdaccio  mostra/verifica a trilha de registry local com Verdaccio",
    "  all        executa pack e imprime as trilhas opcionais yalc/Verdaccio",
    "",
    "Flags:",
    "  --strict   falha se yalc/Verdaccio nao estiverem instalados localmente",
  ].join("\n");
}

export function renderYalcPlan(packageName = "ai-guidelines"): readonly string[] {
  return [
    "Nivel 2 - yalc (loop local rapido, opcional)",
    "",
    "Quando usar:",
    "- validar a experiencia em outro repositorio local sem publicar no npm.",
    "- repetir ajustes rapidamente durante desenvolvimento.",
    "",
    "Fluxo sugerido:",
    "1. No repo ai-guidelines:",
    "   npm run build:all",
    "   npx yalc publish --private",
    "2. No repo consumidor temporario:",
    `   npx yalc add ${packageName}`,
    "   npx ai-guidelines",
    "3. A cada novo ajuste:",
    "   npx yalc publish --private",
    `   npx yalc update ${packageName}`,
    "4. Ao terminar:",
    `   npx yalc remove ${packageName}`,
  ];
}

export function renderVerdaccioPlan(packageName = "ai-guidelines"): readonly string[] {
  return [
    "Nivel 3 - Verdaccio (registry local pre-publicacao, opcional)",
    "",
    "Quando usar:",
    "- simular instalacao via registry antes de publicar no npm real.",
    "- validar pacote, metadados, dist, binario e consumidores com mais fidelidade.",
    "",
    "Fluxo sugerido:",
    "1. Em um terminal dedicado:",
    "   npx verdaccio --listen 127.0.0.1:4873",
    "2. No repo ai-guidelines:",
    "   npm run build:all",
    "   npm adduser --registry http://127.0.0.1:4873",
    "   npm publish --registry http://127.0.0.1:4873 --tag canary",
    "3. No repo consumidor temporario:",
    `   npm install ${packageName} --registry http://127.0.0.1:4873`,
    "   npx ai-guidelines",
    "4. Para repetir a validacao:",
    "   publique uma nova versao local ou limpe o storage do Verdaccio.",
  ];
}

async function runPackLevel(options: ResolvedConsumerJourneyOptions): Promise<number> {
  options.logger.log("Nivel 1 - npm pack + consumidores temporarios");
  options.logger.log("Executando os smoke tests de pacote instalado...");

  const result = await options.deps.runProcess(process.execPath, PACK_TEST_ARGS, {
    cwd: options.repoRoot,
    env: { ...process.env, HUSKY: "0" },
    stdio: "inherit",
  });

  if (result.code === 0) {
    options.logger.log("Nivel 1 aprovado: tarball e consumidores temporarios validaram.");
  } else {
    options.logger.error?.("Nivel 1 falhou: revise a saida dos smoke tests.");
  }

  return result.code;
}

async function runOptionalToolLevel(
  level: "yalc" | "verdaccio",
  strict: boolean,
  options: ResolvedConsumerJourneyOptions
): Promise<number> {
  const command = level;
  const available = await options.deps.commandAvailable(command, options.repoRoot);
  const plan = level === "yalc" ? renderYalcPlan() : renderVerdaccioPlan();

  writeLines(options.logger, plan);
  options.logger.log("");

  if (available) {
    options.logger.log(`${command} encontrado no ambiente local.`);
    return 0;
  }

  const message =
    `${command} nao esta instalado neste ambiente. ` +
    "A trilha ficou preparada como opcional; instale a ferramenta para executar localmente.";

  if (strict) {
    options.logger.error?.(message);
    return 1;
  }

  options.logger.log(message);
  return 0;
}

function parseLevel(args: readonly string[]): ConsumerJourneyLevel | undefined {
  const level = args.find((arg) => !arg.startsWith("--")) ?? "all";

  if (level === "all" || level === "pack" || level === "yalc" || level === "verdaccio") {
    return level;
  }

  return undefined;
}

export async function runConsumerJourney(
  args: readonly string[],
  rawOptions: ConsumerJourneyOptions
): Promise<number> {
  const logger = rawOptions.logger ?? console;
  const options: ResolvedConsumerJourneyOptions = {
    repoRoot: rawOptions.repoRoot,
    logger,
    deps: {
      runProcess: rawOptions.deps?.runProcess ?? defaultRunProcess,
      commandAvailable: rawOptions.deps?.commandAvailable ?? defaultCommandAvailable,
    },
  };

  const strict = args.includes("--strict") || args.includes("--require-tool");
  const help = args.includes("--help") || args.includes("-h");
  const level = parseLevel(args);

  if (help) {
    options.logger.log(renderConsumerJourneyUsage());
    return 0;
  }

  if (!level) {
    options.logger.error?.(renderConsumerJourneyUsage());
    return 2;
  }

  if (level === "pack") {
    return await runPackLevel(options);
  }

  if (level === "yalc" || level === "verdaccio") {
    return await runOptionalToolLevel(level, strict, options);
  }

  const packCode = await runPackLevel(options);
  if (packCode !== 0) {
    return packCode;
  }

  options.logger.log("");
  await runOptionalToolLevel("yalc", false, options);
  options.logger.log("");
  await runOptionalToolLevel("verdaccio", false, options);

  return 0;
}
