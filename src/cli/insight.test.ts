import { Clock } from "../app/ports/Clock.js";
import { WorkflowFileSystem } from "../app/ports/WorkflowFileSystem.js";
import { Logger, main } from "./insight.js";

/** Fake fs in-memory: satisfaz DetectActiveSpec + IO do FileInsightStore. */
class FakeFs implements WorkflowFileSystem {
  readonly files = new Map<string, string>();
  constructor(public branch: string | null = "feat/spec-0024-context-architecture") {}
  fileExists(p: string): boolean {
    return this.files.has(p);
  }
  directoryExists(p: string): boolean {
    return p === ".governance/specs";
  }
  readTextFile(p: string): string {
    const value = this.files.get(p);
    if (value === undefined) throw new Error(`no file: ${p}`);
    return value;
  }
  writeTextFile(p: string, contents: string): void {
    this.files.set(p, contents);
  }
  listDirectory(p: string): ReadonlyArray<string> {
    return p === ".governance/specs" ? ["0024-context-architecture"] : [];
  }
  currentBranch(): string | null {
    return this.branch;
  }
  resolveAbsolute(p: string): string {
    return `/abs/${p}`;
  }
}

class StubClock implements Clock {
  constructor(public now: string) {}
  nowIso(): string {
    return this.now;
  }
}

function makeLogger() {
  const out: string[] = [];
  const err: string[] = [];
  const logger: Logger = { info: (m) => out.push(m), error: (m) => err.push(m) };
  return { logger, out, err };
}

const LEDGER = ".governance/runtime/insights.yml";

describe("ai-guidelines insight (CLI, ponta-a-ponta)", () => {
  it("add captura, persiste o ledger e confirma com o id", async () => {
    const fs = new FakeFs();
    const { logger, out } = makeLogger();
    const code = await main(["insight", "add", "drift SSOT→projeção é recorrente"], {
      repoRoot: "/repo",
      fs,
      clock: new StubClock("2026-06-03T10:00:00.000Z"),
      logger,
    });
    expect(code).toBe(0);
    expect(out.join("\n")).toMatch(/Capturada PIT-0001 \(spec 0024\)/);
    expect(fs.files.get(LEDGER)).toContain("PIT-0001");
  });

  it("saw registra recorrência cross-stamp e a persiste", async () => {
    const fs = new FakeFs();
    const clock = new StubClock("2026-06-03T10:00:00.000Z");
    await main(["insight", "add", "percepção que vai recorrer"], {
      repoRoot: "/r",
      fs,
      clock,
      logger: makeLogger().logger,
    });

    clock.now = "2026-06-20T09:00:00.000Z";
    const { logger, out } = makeLogger();
    const code = await main(["insight", "saw", "PIT-0001", "--note", "voltou"], {
      repoRoot: "/r",
      fs,
      clock,
      logger,
    });
    expect(code).toBe(0);
    expect(out.join("\n")).toMatch(/visto 2×/);
  });

  it("list mostra as percepções vivas com recorrência", async () => {
    const fs = new FakeFs();
    const clock = new StubClock("2026-06-03T10:00:00.000Z");
    await main(["insight", "add", "primeira percepção viva"], {
      repoRoot: "/r",
      fs,
      clock,
      logger: makeLogger().logger,
    });
    const { logger, out } = makeLogger();
    const code = await main(["insight", "list"], { repoRoot: "/r", fs, clock, logger });
    expect(code).toBe(0);
    expect(out.join("\n")).toMatch(/Percepções vivas \(1\)/);
    expect(out.join("\n")).toContain("PIT-0001");
  });

  it("add sem texto retorna exit 2 (uso)", async () => {
    const { logger } = makeLogger();
    const code = await main(["insight", "add"], { repoRoot: "/r", fs: new FakeFs(), logger });
    expect(code).toBe(2);
  });

  it("subcomando desconhecido retorna exit 2", async () => {
    const { logger, err } = makeLogger();
    const code = await main(["insight", "bogus"], { repoRoot: "/r", fs: new FakeFs(), logger });
    expect(code).toBe(2);
    expect(err.join("\n")).toMatch(/Subcomando desconhecido/);
  });

  it("erro de domínio (id inexistente) vira exit 1 com code", async () => {
    const { logger, err } = makeLogger();
    const code = await main(["insight", "saw", "PIT-9999"], {
      repoRoot: "/r",
      fs: new FakeFs(),
      clock: new StubClock("2026-06-03T10:00:00.000Z"),
      logger,
    });
    expect(code).toBe(1);
    expect(err.join("\n")).toMatch(/\[INSIGHT_NOT_FOUND\]/);
  });
});
