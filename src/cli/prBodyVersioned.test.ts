import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  PrBodyGateway,
  findSpecDirectory,
  mainCheck,
  mainPublish,
  mainPull,
  normalizePrBody,
  resolveVersionedPrBodyPath,
  runPrBodyCheck,
  runPrBodyPublish,
  runPrBodyPull,
} from "./prBodyVersioned.js";

class FakePrBodyGateway implements PrBodyGateway {
  readonly publishedBodies: string[] = [];

  constructor(private body: string) {}

  fetchBody(): string {
    return this.body;
  }

  publishBody(input: { readonly body: string }): void {
    this.body = input.body;
    this.publishedBodies.push(input.body);
  }
}

const silentLogger = {
  info: jest.fn(),
  error: jest.fn(),
};

function withRepo<T>(fn: (repoRoot: string) => T): T {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "pr-body-versioned-"));
  try {
    mkdirSync(path.join(repoRoot, ".governance", "specs", "0024-context-architecture"), {
      recursive: true,
    });
    return fn(repoRoot);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
}

function writeVersionedBody(repoRoot: string, body: string): string {
  const file = path.join(
    repoRoot,
    ".governance",
    "specs",
    "0024-context-architecture",
    "pr-bodies",
    "pr-45.md"
  );
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, body, "utf8");
  return file;
}

describe("CLI — pr-body versionado [BR-PR-BODY-VERSIONED]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("normaliza quebras de linha e newline final para comparar GitHub com repo", () => {
    expect(normalizePrBody("## Resumo\r\ntexto")).toBe("## Resumo\ntexto\n");
  });

  it("deriva o caminho do PR body pela spec e numero do PR", () =>
    withRepo((repoRoot) => {
      const specDir = findSpecDirectory({ repoRoot, specId: "0024" });
      const file = resolveVersionedPrBodyPath({ repoRoot, specId: "0024", prNumber: 45 });

      expect(specDir.endsWith(path.join(".governance", "specs", "0024-context-architecture"))).toBe(
        true
      );
      expect(file.endsWith(path.join("0024-context-architecture", "pr-bodies", "pr-45.md"))).toBe(
        true
      );
    }));

  it("confirma PR body sincronizado quando arquivo versionado e GitHub equivalem", () =>
    withRepo((repoRoot) => {
      writeVersionedBody(repoRoot, "## Resumo\ntexto\n");
      const gateway = new FakePrBodyGateway("## Resumo\r\ntexto");

      const exit = runPrBodyCheck({
        prNumber: 45,
        specId: "0024",
        repoRoot,
        gateway,
        logger: silentLogger,
      });

      expect(exit).toBe(0);
      expect(silentLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("PR #45 está sincronizado")
      );
    }));

  it("sinaliza divergencia quando GitHub e arquivo versionado diferem", () =>
    withRepo((repoRoot) => {
      writeVersionedBody(repoRoot, "## Resumo\nrepo\n");
      const gateway = new FakePrBodyGateway("## Resumo\ngithub\n");

      const exit = runPrBodyCheck({
        prNumber: 45,
        specId: "0024",
        repoRoot,
        gateway,
        logger: silentLogger,
      });

      expect(exit).toBe(1);
      expect(silentLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("diverge do body versionado")
      );
    }));

  it("publica o arquivo versionado e confirma por releitura", () =>
    withRepo((repoRoot) => {
      writeVersionedBody(repoRoot, "## Resumo\nrepo\n");
      const gateway = new FakePrBodyGateway("## Resumo\ngithub\n");

      const exit = runPrBodyPublish({
        prNumber: 45,
        specId: "0024",
        repoRoot,
        gateway,
        logger: silentLogger,
      });

      expect(exit).toBe(0);
      expect(gateway.publishedBodies).toEqual(["## Resumo\nrepo\n"]);
      expect(silentLogger.info).toHaveBeenCalledWith(expect.stringContaining("PR #45 publicado"));
    }));

  it("importa o body remoto somente com confirmação explícita", () =>
    withRepo((repoRoot) => {
      const file = writeVersionedBody(repoRoot, "## Resumo\nrepo\n");
      const gateway = new FakePrBodyGateway("## Resumo\ngithub\n");

      const dryRun = runPrBodyPull({
        prNumber: 45,
        specId: "0024",
        repoRoot,
        gateway,
        logger: silentLogger,
      });

      expect(dryRun).toBe(0);
      expect(readFileSync(file, "utf8")).toBe("## Resumo\nrepo\n");
      expect(silentLogger.info).toHaveBeenCalledWith(expect.stringContaining("Dry-run"));

      jest.clearAllMocks();
      const applied = runPrBodyPull({
        prNumber: 45,
        specId: "0024",
        repoRoot,
        gateway,
        logger: silentLogger,
        confirm: true,
      });

      expect(applied).toBe(0);
      expect(readFileSync(file, "utf8")).toBe("## Resumo\ngithub\n");
      expect(silentLogger.info).toHaveBeenCalledWith(expect.stringContaining("importado"));
    }));

  it("expõe comandos CLI para check, publish e pull", () =>
    withRepo((repoRoot) => {
      const file = writeVersionedBody(repoRoot, "## Resumo\nrepo\n");
      const gateway = new FakePrBodyGateway("## Resumo\nrepo\n");

      expect(
        mainCheck(["--pr", "45", "--file", file], { repoRoot, gateway, logger: silentLogger })
      ).toBe(0);
      expect(
        mainPublish(["--pr", "45", "--file", file], { repoRoot, gateway, logger: silentLogger })
      ).toBe(0);
      expect(
        mainPull(["--pr", "45", "--file", file, "--confirm"], {
          repoRoot,
          gateway,
          logger: silentLogger,
        })
      ).toBe(0);
    }));
});
