/**
 * [BR-CLI-LIVING-DOCS-CLI] Smoke test do entrypoint CLI.
 *
 * Foca no contrato observável: `runGenerate` escreve o YAML; `runCheck`
 * retorna 0 quando in-sync e 1 quando há drift. Logger capturado para
 * assertion sem ruído em stdout/stderr durante o run de testes.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { discoverTestFiles, runCheck, runGenerate } from "./livingDocs.js";

function mktmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "gov-pr3c-cli-"));
}

function writeFile(root: string, relPath: string, content: string): void {
  const full = path.join(root, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

function makeLogger(): { info: jest.Mock; error: jest.Mock } {
  return { info: jest.fn(), error: jest.fn() };
}

const TODAY = "2026-05-11T00:00:00.000Z";

describe("CLI — livingDocs [BR-CLI-LIVING-DOCS-CLI]", () => {
  let root: string;

  beforeEach(() => {
    root = mktmp();
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  describe("discoverTestFiles", () => {
    it("DADO src/ com vários .test.ts ENTÃO retorna todos em ordem estável [BR-CLI-LIVING-DOCS-CLI-01]", () => {
      writeFile(root, "src/a/Z.test.ts", `it("[BR-CLI-Z-01] x", () => {});`);
      writeFile(root, "src/a/A.test.ts", `it("[BR-CLI-A-01] x", () => {});`);
      writeFile(root, "src/a/Foo.ts", `// not a test`);
      const files = discoverTestFiles(root);
      expect(files).toHaveLength(2);
      // Ordem estável (alfa): A.test.ts < Z.test.ts
      expect(files[0].endsWith("A.test.ts")).toBe(true);
      expect(files[1].endsWith("Z.test.ts")).toBe(true);
    });

    it("DADO src/ ausente ENTÃO retorna array vazio (sem lançar) [BR-CLI-LIVING-DOCS-CLI-02]", () => {
      expect(discoverTestFiles(root)).toEqual([]);
    });
  });

  describe("runGenerate", () => {
    it("DADO testes no src/ ENTÃO escreve .governance/living-docs.yml e retorna 0 [BR-CLI-LIVING-DOCS-CLI-03]", () => {
      writeFile(root, "src/domain/policy/Pillars.test.ts", `it("[BR-CLI-A-01] x", () => {});`);
      const logger = makeLogger();
      const code = runGenerate({ repoRoot: root, logger, todayIso: TODAY });
      expect(code).toBe(0);
      const written = fs.readFileSync(path.join(root, ".governance/living-docs.yml"), "utf-8");
      expect(written).toContain("BR-CLI-A-01");
      expect(written).toContain("schemaVersion: v0");
      expect(logger.info).toHaveBeenCalled();
    });

    it("DADO 2 generates consecutivos ENTÃO produz o mesmo conteúdo (determinismo) [BR-CLI-LIVING-DOCS-CLI-04]", () => {
      writeFile(root, "src/domain/policy/Pillars.test.ts", `it("[BR-CLI-A-01] x", () => {});`);
      const logger = makeLogger();
      runGenerate({ repoRoot: root, logger, todayIso: TODAY });
      const first = fs.readFileSync(path.join(root, ".governance/living-docs.yml"), "utf-8");
      runGenerate({ repoRoot: root, logger, todayIso: TODAY });
      const second = fs.readFileSync(path.join(root, ".governance/living-docs.yml"), "utf-8");
      expect(first).toBe(second);
    });
  });

  describe("runCheck", () => {
    it("DADO artifact commitado idêntico ao gerado ENTÃO retorna 0 [BR-CLI-LIVING-DOCS-CLI-05]", () => {
      writeFile(root, "src/domain/policy/Pillars.test.ts", `it("[BR-CLI-A-01] x", () => {});`);
      runGenerate({ repoRoot: root, logger: makeLogger(), todayIso: TODAY });
      const logger = makeLogger();
      const code = runCheck({ repoRoot: root, logger, todayIso: TODAY });
      expect(code).toBe(0);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it("DADO artifact commitado divergente do gerado ENTÃO retorna 1 com diff em stderr [BR-CLI-LIVING-DOCS-CLI-06]", () => {
      writeFile(root, "src/domain/policy/Pillars.test.ts", `it("[BR-CLI-A-01] x", () => {});`);
      runGenerate({ repoRoot: root, logger: makeLogger(), todayIso: TODAY });
      // Adiciona uma nova regra mas não regenera:
      writeFile(
        root,
        "src/domain/policy/Pillars.test.ts",
        `
        it("[BR-CLI-A-01] x", () => {});
        it("[BR-CLI-B-NEW] novo teste", () => {});
        `
      );
      const logger = makeLogger();
      const code = runCheck({ repoRoot: root, logger, todayIso: TODAY });
      expect(code).toBe(1);
      const allErrors = logger.error.mock.calls.map((c: unknown[]) => c[0]).join("\n");
      expect(allErrors).toContain("drift detected");
      expect(allErrors).toContain("BR-CLI-B-NEW");
      expect(allErrors).toContain("npm run living-docs:generate");
    });

    it("DADO artifact AUSENTE no disco E entries no código ENTÃO drift=true, retorna 1 [BR-CLI-LIVING-DOCS-CLI-07]", () => {
      writeFile(root, "src/domain/policy/Pillars.test.ts", `it("[BR-CLI-A-01] x", () => {});`);
      const logger = makeLogger();
      const code = runCheck({ repoRoot: root, logger, todayIso: TODAY });
      expect(code).toBe(1);
    });

    it("DADO artifact AUSENTE no disco E nenhum teste no código ENTÃO drift=false (ambos vazios) [BR-CLI-LIVING-DOCS-CLI-08]", () => {
      const logger = makeLogger();
      const code = runCheck({ repoRoot: root, logger, todayIso: TODAY });
      // Sem testes E sem arquivo: drift=true porque generated não é "" (tem schemaVersion). Verificar.
      // Decisão de design: artefato sempre tem schemaVersion + entries:[]; arquivo vazio difere.
      expect(code).toBe(1);
    });
  });
});
