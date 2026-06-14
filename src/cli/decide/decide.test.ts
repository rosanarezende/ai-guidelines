import { parseDecideArgs, runDecide } from "./decide.js";
import { DecisionRegistry } from "./registry.js";
import { CloseDispositionsDefinition } from "./closeDispositions.js";
import {
  DecisionApplyContext,
  DecisionApplyResult,
  DecisionAvailability,
  DecisionPlan,
  HumanDecisionBrief,
  HumanDecisionChoice,
  HumanDecisionDefinition,
} from "./model.js";
import { DecisionSnapshot } from "./snapshot.js";
import { Prompts, SelectOptions } from "../../app/ports/Prompts.js";
import { makeDecisionSnapshot } from "../../test-utils/decisionFixtures.js";

// ── Doubles ──────────────────────────────────────────────────────────────────

class SpyDefinition implements HumanDecisionDefinition {
  readonly id = "spy";
  readonly title = "Decisão espiã";
  applied: Array<{ plan: DecisionPlan; ctx: DecisionApplyContext }> = [];
  briefTechnicalCalls: boolean[] = [];
  constructor(private readonly availability: DecisionAvailability["status"] = "available") {}
  detect(): DecisionAvailability {
    return {
      status: this.availability,
      reasons: this.availability === "available" ? [] : ["bloqueado de mentira"],
    };
  }
  buildBrief(_s: DecisionSnapshot, opts: { technical: boolean }): HumanDecisionBrief {
    this.briefTechnicalCalls.push(opts.technical);
    return {
      id: this.id,
      type: this.id,
      status: this.availability,
      title: this.title,
      summary: "Resumo humano da decisão",
      whyNow: "porque sim",
      sections: Array.from({ length: 8 }, (_x, i) => ({
        key: `k${i}`,
        heading: `H${i}`,
        body: ["b"],
      })),
      consequences: ["c"],
      notAuthorized: ["n"],
      choices: this.choices(),
      technicalDetails: [{ label: "fingerprint", value: "abc" }],
      sources: [{ label: "fonte", ref: "x" }],
      blockedReasons: this.availability === "available" ? [] : ["bloqueado de mentira"],
    };
  }
  choices(): readonly HumanDecisionChoice[] {
    return [
      { id: "go", label: "Aplicar", mutating: true, available: this.availability === "available" },
      { id: "cancel", label: "Cancelar", mutating: false, available: true },
    ];
  }
  plan(snapshot: DecisionSnapshot, choiceId: string): DecisionPlan {
    const mutating = choiceId === "go";
    return {
      type: this.id,
      choiceId,
      mutating,
      changes: mutating ? [{ path: "file.yml", description: "muda" }] : [],
      preserved: ["selo"],
      commitMessage: mutating ? "docs: efeito" : null,
      seal: snapshot.seal,
      gitHead: snapshot.gitHead,
      preconditions: [],
      nextHuman: mutating ? ["próximo passo"] : [],
      note: mutating ? [] : ["nada feito"],
      payload: mutating ? { marker: snapshot.seal } : null,
    };
  }
  async apply(plan: DecisionPlan, ctx: DecisionApplyContext): Promise<DecisionApplyResult> {
    this.applied.push({ plan, ctx });
    return { ok: true, committed: "abc1234", pushed: true, messages: ["aplicado"] };
  }
}

class FakePrompts implements Prompts {
  log: string[] = [];
  /** `value`s apresentados em cada `select` (ordem das telas). */
  presented: string[][] = [];
  constructor(
    private readonly selects: unknown[] = [],
    private readonly confirms: boolean[] = [],
    private readonly inputs: string[] = []
  ) {}
  select<T = string>(opts: SelectOptions<T>): Promise<T> {
    this.log.push(`select:${opts.message}`);
    this.presented.push(opts.choices.map((c) => String(c.value)));
    return Promise.resolve(this.selects.shift() as T);
  }
  input(opts: { message: string }): Promise<string> {
    this.log.push(`input:${opts.message}`);
    return Promise.resolve((this.inputs.shift() as string) ?? "");
  }
  confirm(opts: { message: string }): Promise<boolean> {
    this.log.push(`confirm:${opts.message}`);
    return Promise.resolve(this.confirms.shift() ?? false);
  }
}

function logger() {
  const lines: string[] = [];
  return {
    lines,
    logger: { info: (m: string) => lines.push(m), error: (m: string) => lines.push(m) },
  };
}

function regWith(def: HumanDecisionDefinition): DecisionRegistry {
  return new DecisionRegistry().register(def);
}

const OWNER_CFG = (_r: string, key: string) =>
  key === "user.email" ? "rosanarezende.com@gmail.com" : "Rosana";

// ── parseArgs ────────────────────────────────────────────────────────────────

describe("parseDecideArgs [decide]", () => {
  it("parseia flags e formas --x=val", () => {
    const a = parseDecideArgs([
      "--type",
      "close-dispositions",
      "--decision=accept-all",
      "--authorization",
      "explicit-human-decision",
      "--confirm",
      "--technical",
    ]);
    expect(a).toMatchObject({
      type: "close-dispositions",
      decision: "accept-all",
      authorization: "explicit-human-decision",
      confirm: true,
      technical: true,
    });
  });
  it("--brief-only default sem escrita", () => {
    expect(parseDecideArgs(["--brief-only"]).briefOnly).toBe(true);
    expect(parseDecideArgs([]).briefOnly).toBe(false);
  });
});

// ── brief-only ───────────────────────────────────────────────────────────────

describe("runDecide · brief-only [decide]", () => {
  const collect = () => makeDecisionSnapshot();
  it("[3] tipo desconhecido lista disponíveis e falha", async () => {
    const { lines, logger: lg } = logger();
    const code = await runDecide("/x", parseDecideArgs(["--brief-only", "--type", "nope"]), {
      logger: lg,
      registry: regWith(new SpyDefinition()),
      collect,
    });
    expect(code).toBe(2);
    expect(lines.join(" ")).toMatch(/desconhecida.*spy/);
  });
  it("brief-only não escreve e exibe a lista + briefing", async () => {
    const spy = new SpyDefinition();
    const { lines, logger: lg } = logger();
    const code = await runDecide("/x", parseDecideArgs(["--brief-only"]), {
      logger: lg,
      registry: regWith(spy),
      collect,
    });
    expect(code).toBe(0);
    expect(spy.applied).toHaveLength(0);
    expect(lines.join("\n")).toMatch(/Decisões humanas pendentes/);
    expect(lines.join("\n")).toMatch(/Resumo humano/);
  });
});

// ── modo direto + autorização ────────────────────────────────────────────────

describe("runDecide · modo direto e autorização [decide]", () => {
  const collect = () => makeDecisionSnapshot();
  it("[54] autorização inválida falha", async () => {
    const { logger: lg } = logger();
    const code = await runDecide(
      "/x",
      parseDecideArgs([
        "--type",
        "spy",
        "--decision",
        "go",
        "--authorization",
        "errada",
        "--confirm",
      ]),
      { logger: lg, registry: regWith(new SpyDefinition()), collect }
    );
    expect(code).toBe(2);
  });
  it("[55] --confirm sem autorização falha (nada aplicado)", async () => {
    const spy = new SpyDefinition();
    const { logger: lg } = logger();
    const code = await runDecide(
      "/x",
      parseDecideArgs(["--type", "spy", "--decision", "go", "--confirm"]),
      { logger: lg, registry: regWith(spy), collect, gitConfig: OWNER_CFG }
    );
    expect(code).toBe(1);
    expect(spy.applied).toHaveLength(0);
  });
  it("autorização sem --confirm não aplica", async () => {
    const spy = new SpyDefinition();
    const { logger: lg } = logger();
    const code = await runDecide(
      "/x",
      parseDecideArgs([
        "--type",
        "spy",
        "--decision",
        "go",
        "--authorization",
        "explicit-human-decision",
      ]),
      { logger: lg, registry: regWith(spy), collect, gitConfig: OWNER_CFG }
    );
    expect(code).toBe(1);
    expect(spy.applied).toHaveLength(0);
  });
  it("direto completo aplica o plano (autorização NÃO cria elegibilidade, mas aqui está disponível)", async () => {
    const spy = new SpyDefinition();
    const { logger: lg } = logger();
    const code = await runDecide(
      "/x",
      parseDecideArgs([
        "--type",
        "spy",
        "--decision",
        "go",
        "--authorization",
        "explicit-human-decision",
        "--confirm",
      ]),
      { logger: lg, registry: regWith(spy), collect, gitConfig: OWNER_CFG }
    );
    expect(code).toBe(0);
    expect(spy.applied).toHaveLength(1);
    expect(spy.applied[0].plan.choiceId).toBe("go");
  });
  it("decisão indisponível não pode ser forçada", async () => {
    const spy = new SpyDefinition("blocked");
    const { logger: lg } = logger();
    const code = await runDecide(
      "/x",
      parseDecideArgs([
        "--type",
        "spy",
        "--decision",
        "go",
        "--authorization",
        "explicit-human-decision",
        "--confirm",
      ]),
      { logger: lg, registry: regWith(spy), collect, gitConfig: OWNER_CFG }
    );
    expect(code).toBe(1);
    expect(spy.applied).toHaveLength(0);
  });
  it("[61] actor não autorizado (não-owner) bloqueia o efeito real", async () => {
    const { logger: lg } = logger();
    const code = await runDecide(
      "/x",
      parseDecideArgs([
        "--type",
        "close-dispositions",
        "--decision",
        "accept-all",
        "--authorization",
        "explicit-human-decision",
        "--confirm",
      ]),
      {
        logger: lg,
        registry: new DecisionRegistry().register(new CloseDispositionsDefinition()),
        collect: () => makeDecisionSnapshot(),
        gitConfig: (_r, k) => (k === "user.email" ? "estranho@example.com" : "Estranho"),
      }
    );
    expect(code).toBe(1);
  });
});

// ── wizard interativo ────────────────────────────────────────────────────────

describe("runDecide · wizard interativo [decide]", () => {
  const collect = () => makeDecisionSnapshot();
  it("[46][47][49][51] lista → briefing → prévia → confirma → aplica o plano exato", async () => {
    const spy = new SpyDefinition();
    const prompts = new FakePrompts(["spy", "go"], [true]);
    const { lines, logger: lg } = logger();
    const code = await runDecide("/x", parseDecideArgs([]), {
      logger: lg,
      prompts,
      registry: regWith(spy),
      collect,
      isTTY: true,
      gitConfig: OWNER_CFG,
    });
    expect(code).toBe(0);
    // briefing antes da escolha; prévia antes do confirm.
    const out = lines.join("\n");
    expect(out).toMatch(/Resumo humano/);
    expect(out).toMatch(/Alterações propostas/);
    expect(prompts.log.some((l) => l.startsWith("confirm:"))).toBe(true);
    expect(spy.applied).toHaveLength(1);
    expect(spy.applied[0].plan.choiceId).toBe("go");
  });

  it("[48] detalhes técnicos só aparecem sob escolha explícita", async () => {
    const spy = new SpyDefinition();
    const prompts = new FakePrompts(["spy", "__technical__", "cancel"], []);
    const { logger: lg } = logger();
    await runDecide("/x", parseDecideArgs([]), {
      logger: lg,
      prompts,
      registry: regWith(spy),
      collect,
      isTTY: true,
    });
    // 1º render sem technical; 2º render (após escolher) com technical.
    expect(spy.briefTechnicalCalls).toEqual([false, true]);
  });

  it("[50] cancelar no menu/escolha/confirmação gera zero escrita", async () => {
    for (const scripted of [
      new FakePrompts(["__quit__"], []),
      new FakePrompts(["spy", "cancel"], []),
      new FakePrompts(["spy", "go"], [false]),
    ]) {
      const spy = new SpyDefinition();
      const { logger: lg } = logger();
      await runDecide("/x", parseDecideArgs([]), {
        logger: lg,
        prompts: scripted,
        registry: regWith(spy),
        collect,
        isTTY: true,
        gitConfig: OWNER_CFG,
      });
      expect(spy.applied).toHaveLength(0);
    }
  });

  it("[73] a tela de escolha não injeta um segundo cancelamento (regressão: duas opções de cancelar)", async () => {
    // Bug de dogfood (CO-3.2): o wizard mostrava DUAS opções sem efeito —
    // a `cancel` do contrato governado ("Cancelar (não escreve nada)") E um
    // "Cancelar" injetado pelo próprio wizard (`__cancel__`). A tela de escolha
    // deve renderizar EXATAMENTE as escolhas do briefing (+ o toggle técnico),
    // genérico para todo tipo de decisão — sem segundo cancelamento injetado.
    const spy = new SpyDefinition();
    const prompts = new FakePrompts(["spy", "cancel"], []);
    const { logger: lg } = logger();
    await runDecide("/x", parseDecideArgs([]), {
      logger: lg,
      prompts,
      registry: regWith(spy),
      collect,
      isTTY: true,
      gitConfig: OWNER_CFG,
    });
    // presented[0] = tela 1 (lista); presented[1] = tela de escolha da decisão.
    const decisionScreen = prompts.presented[1];
    // Exatamente as escolhas governadas (go, cancel) + o toggle técnico; nada mais.
    expect(decisionScreen).toEqual(["go", "cancel", "__technical__"]);
    // Nenhum cancelamento injetado pelo wizard.
    expect(decisionScreen).not.toContain("__cancel__");
    // Exatamente UMA escolha de cancelamento sem efeito.
    expect(decisionScreen.filter((v) => v === "cancel")).toHaveLength(1);
    expect(spy.applied).toHaveLength(0);
  });

  it("[52] snapshot alterado antes da confirmação aborta", async () => {
    const spy = new SpyDefinition();
    let n = 0;
    const collectChanging = () => makeDecisionSnapshot({ seal: `seal-${n++}` });
    const prompts = new FakePrompts(["spy", "go"], [true]);
    const { lines, logger: lg } = logger();
    const code = await runDecide("/x", parseDecideArgs([]), {
      logger: lg,
      prompts,
      registry: regWith(spy),
      collect: collectChanging,
      isTTY: true,
      gitConfig: OWNER_CFG,
    });
    expect(code).toBe(1);
    expect(spy.applied).toHaveLength(0);
    expect(lines.join(" ")).toMatch(/estado mudou/i);
  });

  it("sem TTY nem prompts: degrada para leitura (sem escrita)", async () => {
    const spy = new SpyDefinition();
    const { lines, logger: lg } = logger();
    const code = await runDecide("/x", parseDecideArgs([]), {
      logger: lg,
      registry: regWith(spy),
      collect,
      isTTY: false,
    });
    expect(code).toBe(0);
    expect(spy.applied).toHaveLength(0);
    expect(lines.join("\n")).toMatch(/não interativo/i);
  });
});

// ── direto e wizard produzem o MESMO plano ───────────────────────────────────

describe("runDecide · convergência direto×wizard [decide]", () => {
  it("[72] o plano aplicado pelo wizard == plano do modo direto (mesma definição/snapshot)", async () => {
    const snap = makeDecisionSnapshot();
    const directSpy = new SpyDefinition();
    const wizardSpy = new SpyDefinition();
    await runDecide(
      "/x",
      parseDecideArgs([
        "--type",
        "spy",
        "--decision",
        "go",
        "--authorization",
        "explicit-human-decision",
        "--confirm",
      ]),
      {
        logger: logger().logger,
        registry: regWith(directSpy),
        collect: () => snap,
        gitConfig: OWNER_CFG,
      }
    );
    await runDecide("/x", parseDecideArgs([]), {
      logger: logger().logger,
      prompts: new FakePrompts(["spy", "go"], [true]),
      registry: regWith(wizardSpy),
      collect: () => snap,
      isTTY: true,
      gitConfig: OWNER_CFG,
    });
    expect(directSpy.applied[0].plan).toEqual(wizardSpy.applied[0].plan);
  });
});
