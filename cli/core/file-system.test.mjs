import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  readTextIfExists,
  writeFileIfChanged,
  ensureDir,
  copyDirIfChanged,
} from "#core/file-system";

describe("file-system (wrapper)", () => {
  const tmpDir = path.join(os.tmpdir(), `ai-guidelines-fs-test-${Date.now()}`);

  it("DADO arquivo inexistente QUANDO readTextIfExists ENTÃO retorna null", async () => {
    const content = await readTextIfExists(path.join(tmpDir, "non-existent.txt"));
    assert.equal(content, null);
  });

  it("DADO arquivo QUANDO writeFileIfChanged ENTÃO escreve apenas se novo", async () => {
    await fs.mkdir(tmpDir, { recursive: true });
    const filePath = path.join(tmpDir, "test.txt");

    const first = await writeFileIfChanged(filePath, "hello", false, []);
    assert.equal(first, true);

    const second = await writeFileIfChanged(filePath, "hello", false, []);
    assert.equal(second, false);

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("DADO subdiretório QUANDO ensureDir ENTÃO cria recursivamente", async () => {
    const deepDir = path.join(tmpDir, "a", "b", "c");
    await ensureDir(deepDir, false, []);
    const stats = await fs.stat(deepDir);
    assert.ok(stats.isDirectory());
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("DADO diretorio com subpasta QUANDO copyDirIfChanged ENTÃO ignora pastas e copia arquivos", async () => {
    const src = path.join(tmpDir, "src");
    const dest = path.join(tmpDir, "dest");
    await fs.mkdir(path.join(src, "subdir"), { recursive: true });
    await fs.writeFile(path.join(src, "subdir", "file.txt"), "content");

    const actions = [];
    await copyDirIfChanged(src, dest, false, actions);

    const content = await fs.readFile(path.join(dest, "subdir", "file.txt"), "utf8");
    assert.equal(content, "content");
    assert.ok(actions.length > 0);

    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("DADO origem inexistente QUANDO copyDirIfChanged ENTÃO retorna silenciosamente", async () => {
    const actions = [];
    await copyDirIfChanged(path.join(tmpDir, "ghost"), path.join(tmpDir, "dest"), false, actions);
    assert.equal(actions.length, 0);
  });
});
