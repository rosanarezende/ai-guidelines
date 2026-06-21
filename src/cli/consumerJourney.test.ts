import {
  renderConsumerJourneyUsage,
  renderVerdaccioPlan,
  renderYalcPlan,
  runConsumerJourney,
} from "./consumerJourney.js";

function makeLogger(): {
  logger: { log: (message: string) => void; error: (message: string) => void };
  messages: string[];
} {
  const messages: string[] = [];
  return {
    messages,
    logger: {
      log: (message: string) => messages.push(message),
      error: (message: string) => messages.push(`ERR:${message}`),
    },
  };
}

describe("consumer journey harness", () => {
  it("documenta os tres niveis de validacao de consumidor", () => {
    const usage = renderConsumerJourneyUsage();

    expect(usage).toContain("pack");
    expect(usage).toContain("yalc");
    expect(usage).toContain("verdaccio");
  });

  it("o nivel pack executa os smoke tests de pacote instalado", async () => {
    const { logger, messages } = makeLogger();
    const calls: Array<{ command: string; args: readonly string[] }> = [];

    const exitCode = await runConsumerJourney(["pack"], {
      repoRoot: "C:/repo",
      logger,
      deps: {
        runProcess: async (command, args) => {
          calls.push({ command, args });
          return { code: 0, stdout: "", stderr: "" };
        },
        commandAvailable: async () => false,
      },
    });

    expect(exitCode).toBe(0);
    expect(calls).toHaveLength(1);
    expect(calls[0].args).toEqual(expect.arrayContaining(["--test", "tests/smoke/*.test.mjs"]));
    expect(messages.join("\n")).toContain("Nivel 1 aprovado");
  });

  it("yalc fica preparado como trilha opcional quando a ferramenta nao esta instalada", async () => {
    const { logger, messages } = makeLogger();

    const exitCode = await runConsumerJourney(["yalc"], {
      repoRoot: "C:/repo",
      logger,
      deps: {
        runProcess: async () => ({ code: 0, stdout: "", stderr: "" }),
        commandAvailable: async () => false,
      },
    });

    const output = messages.join("\n");

    expect(exitCode).toBe(0);
    expect(output).toContain("Nivel 2 - yalc");
    expect(output).toContain("npx yalc publish --private");
    expect(output).toContain("nao esta instalado");
  });

  it("yalc em modo strict falha quando a ferramenta nao esta instalada", async () => {
    const { logger, messages } = makeLogger();

    const exitCode = await runConsumerJourney(["yalc", "--strict"], {
      repoRoot: "C:/repo",
      logger,
      deps: {
        runProcess: async () => ({ code: 0, stdout: "", stderr: "" }),
        commandAvailable: async () => false,
      },
    });

    expect(exitCode).toBe(1);
    expect(messages.join("\n")).toContain("ERR:yalc nao esta instalado");
  });

  it("verdaccio documenta a simulacao por registry local", () => {
    const plan = renderVerdaccioPlan().join("\n");

    expect(plan).toContain("Nivel 3 - Verdaccio");
    expect(plan).toContain("npx verdaccio --listen 127.0.0.1:4873");
    expect(plan).toContain("npm publish --registry http://127.0.0.1:4873");
    expect(plan).toContain("npx ai-guidelines");
  });

  it("yalc documenta o loop rapido sem publicar no npm", () => {
    const plan = renderYalcPlan().join("\n");

    expect(plan).toContain("npx yalc add ai-guidelines");
    expect(plan).toContain("npx yalc update ai-guidelines");
    expect(plan).toContain("npx ai-guidelines");
  });
});
