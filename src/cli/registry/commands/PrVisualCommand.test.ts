import { PrVisualCommand } from "./PrVisualCommand.js";
import { Command, CommandContext, Logger } from "../Command.js";
import { PullRequestData, StackOps } from "../../../app/ports/StackOps.js";
import { VISUAL_PROMPT_BLOCK_BEGIN } from "./visualPromptPrBlock.js";

function capturingLogger(): { logger: Logger; infos: string[]; errors: string[] } {
  const infos: string[] = [];
  const errors: string[] = [];
  return { logger: { info: (m) => infos.push(m), error: (m) => errors.push(m) }, infos, errors };
}

function context(logger: Logger): CommandContext {
  return { repoRoot: "/repo", logger };
}

function pr(over: Partial<PullRequestData> = {}): PullRequestData {
  return {
    number: 35,
    title: "PR",
    body: "Resumo do PR.",
    state: "OPEN",
    isDraft: true,
    headRefName: "feat/x",
    baseRefName: "main",
    labels: [],
    url: "https://github.com/o/r/pull/35",
    mergeCommitSha: null,
    ...over,
  };
}

/** Stack fake: serve getPullRequest e captura setPullRequestBody. */
function fakeStack(prData: PullRequestData | null): {
  stack: Pick<StackOps, "getPullRequest" | "setPullRequestBody">;
  setCalls: { number: number; body: string }[];
} {
  const setCalls: { number: number; body: string }[] = [];
  return {
    setCalls,
    stack: {
      getPullRequest: () => prData,
      setPullRequestBody: (number, body) => {
        setCalls.push({ number, body });
      },
    },
  };
}

function deps(over: Partial<PrVisualCommand["deps"]> = {}, prData: PullRequestData | null = pr()) {
  const fk = fakeStack(prData);
  return {
    setCalls: fk.setCalls,
    deps: {
      makeFs: () => ({}) as never,
      stack: fk.stack as StackOps,
      collect: () => "EVID-PR",
      render: (_fs: unknown, slug: string, vars: { context: string; localContext?: string }) =>
        `RENDER[${slug}] ctx=${vars.context} local=${vars.localContext ?? ""}`,
      ...over,
    },
  };
}

describe("PrVisualCommand (`pr-visual`) — embute o prompt visual do value-delivered no body do PR", () => {
  describe("parse", () => {
    it("DADO --pr N QUANDO parse ENTÃO devolve {pr:N, dryRun:false}", () => {
      const { deps: d } = deps();
      expect(new PrVisualCommand(d).parse(["--pr", "35"])).toEqual({ pr: 35, dryRun: false });
    });

    it("DADO --pr=N --dry-run QUANDO parse ENTÃO devolve dryRun:true", () => {
      const { deps: d } = deps();
      expect(new PrVisualCommand(d).parse(["--pr=35", "--dry-run"])).toEqual({
        pr: 35,
        dryRun: true,
      });
    });

    it("DADO sem --pr QUANDO parse ENTÃO erro narrativo", () => {
      const { deps: d } = deps();
      expect(() => new PrVisualCommand(d).parse([])).toThrow(/--pr/);
    });

    it("DADO --pr inválido QUANDO parse ENTÃO erro narrativo", () => {
      const { deps: d } = deps();
      expect(() => new PrVisualCommand(d).parse(["--pr", "x"])).toThrow(/PR inválido|inteiro/i);
    });
  });

  describe("run", () => {
    it("DADO PR sem bloco QUANDO run ENTÃO grava body com o bloco + prompt do value-delivered; exitCode 0", async () => {
      const { deps: d, setCalls } = deps({}, pr({ body: "Resumo." }));
      const { logger } = capturingLogger();

      const out = await new PrVisualCommand(d).run({ pr: 35, dryRun: false }, context(logger));

      expect(out.exitCode).toBe(0);
      expect(setCalls).toHaveLength(1);
      expect(setCalls[0].number).toBe(35);
      expect(setCalls[0].body).toContain(VISUAL_PROMPT_BLOCK_BEGIN);
      expect(setCalls[0].body).toContain("RENDER[value-delivered] ctx=PR #35 local=EVID-PR");
      expect(setCalls[0].body).toContain("Resumo.");
    });

    it("DADO --dry-run QUANDO run ENTÃO NÃO grava (mostra o bloco) e exitCode 0", async () => {
      const { deps: d, setCalls } = deps();
      const { logger, infos } = capturingLogger();

      const out = await new PrVisualCommand(d).run({ pr: 35, dryRun: true }, context(logger));

      expect(out.exitCode).toBe(0);
      expect(setCalls).toHaveLength(0);
      expect(infos.join("\n")).toContain("RENDER[value-delivered]");
    });

    it("DADO PR inexistente QUANDO run ENTÃO erro e exitCode 1 (não grava)", async () => {
      const { deps: d, setCalls } = deps({}, null);
      const { logger, errors } = capturingLogger();

      const out = await new PrVisualCommand(d).run({ pr: 999, dryRun: false }, context(logger));

      expect(out.exitCode).toBe(1);
      expect(setCalls).toHaveLength(0);
      expect(errors.join("\n")).toMatch(/PR #?999|não encontrado/i);
    });

    it("DADO body que JÁ contém o bloco idêntico QUANDO run ENTÃO é no-op idempotente (não regrava)", async () => {
      // 1ª execução monta o body; 2ª execução sobre o mesmo body não deve regravar.
      const first = deps({}, pr({ body: "Resumo." }));
      const { logger: l1 } = capturingLogger();
      await new PrVisualCommand(first.deps).run({ pr: 35, dryRun: false }, context(l1));
      const bodyComBloco = first.setCalls[0].body;

      const second = deps({}, pr({ body: bodyComBloco }));
      const { logger: l2, infos } = capturingLogger();
      const out = await new PrVisualCommand(second.deps).run(
        { pr: 35, dryRun: false },
        context(l2)
      );

      expect(out.exitCode).toBe(0);
      expect(second.setCalls).toHaveLength(0); // nada a regravar
      expect(infos.join("\n")).toMatch(/sem mudança|já.*atualizad/i);
    });

    it("DADO render null QUANDO run ENTÃO erro e exitCode 1", async () => {
      const { deps: d, setCalls } = deps({ render: () => null });
      const { logger, errors } = capturingLogger();

      const out = await new PrVisualCommand(d).run({ pr: 35, dryRun: false }, context(logger));

      expect(out.exitCode).toBe(1);
      expect(setCalls).toHaveLength(0);
      expect(errors.join("\n")).toMatch(/template|não encontrado/i);
    });
  });

  it("é comando de automação: parse-only (sem prompt) — não navegado por humano", () => {
    const { deps: d } = deps();
    const cmd: Command<{ pr: number; dryRun: boolean }> = new PrVisualCommand(d);
    expect(cmd.name).toBe("pr-visual");
    expect(cmd.prompt).toBeUndefined();
  });
});
