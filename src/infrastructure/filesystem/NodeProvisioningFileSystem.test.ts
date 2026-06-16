import * as os from "node:os";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { NodeProvisioningFileSystem } from "./NodeProvisioningFileSystem.js";

describe("infrastructure/NodeProvisioningFileSystem (filesystem temporário real)", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "prov-fs-"));
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("DADO relPath QUANDO write/read ENTÃO resolve contra o targetDir", async () => {
    const sut = new NodeProvisioningFileSystem(dir);
    expect(await sut.readText(".ai-guidelines/config.json")).toBeNull();

    await sut.ensureDir(".ai-guidelines");
    await sut.writeText(".ai-guidelines/config.json", '{"lang":"pt"}');

    expect(await sut.readText(".ai-guidelines/config.json")).toBe('{"lang":"pt"}');
    const onDisk = await fs.readFile(path.join(dir, ".ai-guidelines", "config.json"), "utf8");
    expect(onDisk).toBe('{"lang":"pt"}');
  });

  it("exists reflete presença de arquivo e diretório", async () => {
    const sut = new NodeProvisioningFileSystem(dir);
    expect(await sut.exists("CLAUDE.md")).toBe(false);
    await sut.writeText("CLAUDE.md", "x");
    expect(await sut.exists("CLAUDE.md")).toBe(true);
    await sut.ensureDir(".cursor/rules");
    expect(await sut.exists(".cursor/rules")).toBe(true);
  });

  it("ensureDir é recursivo e idempotente", async () => {
    const sut = new NodeProvisioningFileSystem(dir);
    await sut.ensureDir(".cursor/rules");
    await sut.ensureDir(".cursor/rules");
    await sut.writeText(".cursor/rules/ai-guidelines.mdc", "y");
    expect(await sut.readText(".cursor/rules/ai-guidelines.mdc")).toBe("y");
  });

  it("remove apaga e é idempotente (no-op se ausente)", async () => {
    const sut = new NodeProvisioningFileSystem(dir);
    await sut.writeText("GEMINI.md", "stale");
    await sut.remove("GEMINI.md");
    expect(await sut.exists("GEMINI.md")).toBe(false);
    await expect(sut.remove("GEMINI.md")).resolves.toBeUndefined();
  });

  it("resolvePath expõe path absoluto sob targetDir", () => {
    const sut = new NodeProvisioningFileSystem(dir);
    expect(sut.resolvePath(".husky/pre-commit")).toBe(path.resolve(dir, ".husky/pre-commit"));
  });
});
