// Guard de determinismo do site:assets:check (fecha B3).
//
// Contrato: o check de assets NÃO pode depender de comparar bytes de WebP
// re-renderizado (frágil a versões de sharp/libvips). Deve gatear por HASH da
// fonte PNG + parâmetros do encoder, registrados em um manifesto. Estas
// asserções são estáticas/read-only (não mutam arquivos versionados) e o
// `check` real é exercido em modo somente-leitura.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const scriptPath = path.join(repoRoot, "site", "scripts", "optimize-assets.mjs");
const manifestPath = path.join(repoRoot, "site", "src", "assets", "generated", "manifest.json");
const fixturePngPath = path.join(repoRoot, "docs", "assets", "ai-guidelines-flow.png");

function createAssetFixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "ai-guidelines-assets-"));
  const sourceDir = path.join(root, "docs", "assets");
  const outputDir = path.join(root, "site", "src", "assets", "generated");
  mkdirSync(sourceDir, { recursive: true });
  mkdirSync(outputDir, { recursive: true });

  return {
    root,
    sourceDir,
    outputDir,
    env: {
      ...process.env,
      AI_GUIDELINES_REPO_ROOT: root,
      AI_GUIDELINES_SITE_ROOT: path.join(root, "site"),
      AI_GUIDELINES_ASSET_SOURCE_DIR: sourceDir,
      AI_GUIDELINES_ASSET_OUTPUT_DIR: outputDir,
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}

function runAssetsScript(args, env = process.env) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    env,
    encoding: "utf-8",
  });
}

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
    const result = runAssetsScript(["check"]);
    assert.equal(result.status, 0, `check falhou:\n${result.stdout}\n${result.stderr}`);
  });

  it("rejeita modo desconhecido com uso acionavel", () => {
    const result = runAssetsScript(["publish"]);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Uso: node site\/scripts\/optimize-assets\.mjs <sync\|check>/);
  });

  it("falha claramente quando nao ha PNG fonte", () => {
    const fixture = createAssetFixture();
    try {
      const result = runAssetsScript(["check"], fixture.env);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /Nenhum PNG encontrado/);
    } finally {
      fixture.cleanup();
    }
  });

  it("sincroniza fixture temporaria, remove WebP orfao e cria manifesto", () => {
    const fixture = createAssetFixture();
    try {
      writeFileSync(path.join(fixture.sourceDir, "hero.png"), readFileSync(fixturePngPath));
      writeFileSync(path.join(fixture.outputDir, "orphan.webp"), Buffer.from("stale"));

      const sync = runAssetsScript(["sync"], fixture.env);
      assert.equal(sync.status, 0, `sync falhou:\n${sync.stdout}\n${sync.stderr}`);
      assert.match(sync.stdout, /site:assets:sync concluido/);

      const manifest = JSON.parse(
        readFileSync(path.join(fixture.outputDir, "manifest.json"), "utf-8")
      );
      assert.equal(manifest.images[0].source, "hero.png");
      assert.match(manifest.images[0].sourceSha256, /^[0-9a-f]{64}$/);
      assert.throws(() => readFileSync(path.join(fixture.outputDir, "orphan.webp")));

      const check = runAssetsScript(["check"], fixture.env);
      assert.equal(check.status, 0, `check falhou:\n${check.stdout}\n${check.stderr}`);
    } finally {
      fixture.cleanup();
    }
  });

  it("check falha quando o manifesto temporario esta ausente", () => {
    const fixture = createAssetFixture();
    try {
      writeFileSync(path.join(fixture.sourceDir, "hero.png"), readFileSync(fixturePngPath));

      const result = runAssetsScript(["check"], fixture.env);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /manifest\.json não existe/);
      assert.match(result.stderr, /Rode: npm run site:assets:sync/);
    } finally {
      fixture.cleanup();
    }
  });
});
