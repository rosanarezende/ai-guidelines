// Guard de determinismo do site:assets:check (fecha B3).
//
// Contrato: o check de assets NÃO pode depender de comparar bytes de WebP
// re-renderizado (frágil a versões de sharp/libvips). Deve gatear por HASH da
// fonte PNG + parâmetros do encoder, registrados em um manifesto. Estas
// asserções são estáticas/read-only (não mutam arquivos versionados) e o
// `check` real é exercido em modo somente-leitura.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const scriptPath = path.join(repoRoot, "site", "scripts", "optimize-assets.mjs");
const manifestPath = path.join(repoRoot, "site", "src", "assets", "generated", "manifest.json");

describe("site:assets:check é determinístico por manifesto (B3)", () => {
  const source = readFileSync(scriptPath, "utf-8");

  it("não compara bytes de WebP re-renderizado", () => {
    assert.equal(
      source.includes("Buffer.compare"),
      false,
      "optimize-assets não deve usar Buffer.compare (byte-a-byte frágil)"
    );
  });

  it("gateia por hash da fonte + manifesto", () => {
    assert.ok(source.includes("createHash"), "deve hashear a fonte PNG");
    assert.ok(source.includes("manifest"), "deve usar um manifesto");
  });

  it("o manifesto registra encoder + hash por imagem", () => {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    assert.ok(typeof manifest.encoder?.quality === "number");
    assert.ok(Array.isArray(manifest.images) && manifest.images.length > 0);
    for (const image of manifest.images) {
      assert.match(image.sourceSha256, /^[0-9a-f]{64}$/);
    }
  });

  it("check passa no estado versionado (somente leitura)", () => {
    const result = spawnSync(process.execPath, [scriptPath, "check"], {
      cwd: repoRoot,
      encoding: "utf-8",
    });
    assert.equal(result.status, 0, `check falhou:\n${result.stdout}\n${result.stderr}`);
  });
});
