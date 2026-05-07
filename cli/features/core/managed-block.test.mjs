import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MANAGED_BLOCK_VERSION,
  applyManagedBlock,
  buildManagedBlock,
  inferSyntaxFromPath,
  parseManagedFile,
} from "./managed-block.mjs";

describe("features/core/managed-block", () => {
  describe("inferSyntaxFromPath", () => {
    it("DADO arquivo .md QUANDO infere ENTÃO retorna markdown", () => {
      assert.equal(inferSyntaxFromPath("CLAUDE.md"), "markdown");
      assert.equal(inferSyntaxFromPath(".cursor/rules/ai-guidelines.mdc"), "markdown");
    });

    it("DADO arquivo de ignore-style QUANDO infere ENTÃO retorna hash", () => {
      assert.equal(inferSyntaxFromPath(".claudeignore"), "hash");
      assert.equal(inferSyntaxFromPath(".aiexclude"), "hash");
      assert.equal(inferSyntaxFromPath(".gptignore"), "hash");
      assert.equal(inferSyntaxFromPath(".aiderignore"), "hash");
    });

    it("DADO arquivo .windsurfrules QUANDO infere ENTÃO trata como markdown (texto livre)", () => {
      assert.equal(inferSyntaxFromPath(".windsurfrules"), "markdown");
    });
  });

  describe("buildManagedBlock", () => {
    it("DADO conteúdo QUANDO markdown ENTÃO envolve em HTML comments com versão", () => {
      const block = buildManagedBlock("HARD REDIRECT", "markdown");
      assert.ok(
        block.startsWith(`<!-- ai-guidelines:managed-start v=${MANAGED_BLOCK_VERSION} -->`)
      );
      assert.ok(block.endsWith("<!-- ai-guidelines:managed-end -->"));
      assert.ok(block.includes("HARD REDIRECT"));
    });

    it("DADO conteúdo QUANDO hash ENTÃO envolve em comentários #", () => {
      const block = buildManagedBlock("node_modules\n.git", "hash");
      assert.ok(block.startsWith(`# ai-guidelines:managed-start v=${MANAGED_BLOCK_VERSION}`));
      assert.ok(block.includes("node_modules"));
      assert.ok(block.endsWith("# ai-guidelines:managed-end"));
    });

    it("DADO conteúdo com newlines extras QUANDO build ENTÃO normaliza bordas", () => {
      const block = buildManagedBlock("\n\nhello\n\n", "markdown");
      assert.ok(!block.includes("\n\n\n"));
    });
  });

  describe("parseManagedFile", () => {
    it("DADO arquivo sem marcadores QUANDO parse ENTÃO retorna hasManagedBlock=false", () => {
      const result = parseManagedFile("# Some content\n\nNothing managed.", "markdown");
      assert.equal(result.hasManagedBlock, false);
    });

    it("DADO arquivo gerenciado QUANDO parse ENTÃO extrai before/block/after", () => {
      const file = [
        "# Header do consumidor",
        "",
        "<!-- ai-guidelines:managed-start v=1 -->",
        "INNER",
        "<!-- ai-guidelines:managed-end -->",
        "",
        "Custom suffix.",
        "",
      ].join("\n");

      const result = parseManagedFile(file, "markdown");
      assert.equal(result.hasManagedBlock, true);
      assert.equal(result.version, 1);
      assert.match(result.before, /Header do consumidor/);
      assert.match(result.block, /INNER/);
      assert.match(result.after, /Custom suffix/);
    });

    it("DADO marcadores hash QUANDO parse ENTÃO extrai bloco gitignore-style", () => {
      const file = [
        "# usuário tinha isso",
        "user-only",
        "# ai-guidelines:managed-start v=1",
        "node_modules",
        "# ai-guidelines:managed-end",
        "",
      ].join("\n");

      const result = parseManagedFile(file, "hash");
      assert.equal(result.hasManagedBlock, true);
      assert.equal(result.version, 1);
      assert.match(result.before, /user-only/);
      assert.match(result.block, /node_modules/);
    });
  });

  describe("applyManagedBlock", () => {
    it("DADO arquivo inexistente QUANDO apply ENTÃO state=created", () => {
      const result = applyManagedBlock(null, "INNER", { syntax: "markdown" });
      assert.equal(result.state, "created");
      assert.match(result.content, /<!-- ai-guidelines:managed-start v=1 -->/);
      assert.match(result.content, /INNER/);
      assert.ok(result.content.endsWith("\n"));
    });

    it("DADO arquivo gerenciado idêntico QUANDO apply ENTÃO state=unchanged", () => {
      const initial = applyManagedBlock(null, "X", { syntax: "markdown" }).content;
      const reapply = applyManagedBlock(initial, "X", { syntax: "markdown" });
      assert.equal(reapply.state, "unchanged");
      assert.equal(reapply.content, null);
    });

    it("DADO arquivo gerenciado com bloco antigo QUANDO apply ENTÃO state=block-updated, before/after preservados", () => {
      const file = [
        "# Header preservado",
        "",
        "<!-- ai-guidelines:managed-start v=1 -->",
        "OLD",
        "<!-- ai-guidelines:managed-end -->",
        "",
        "Footer preservado",
        "",
      ].join("\n");

      const result = applyManagedBlock(file, "NEW", { syntax: "markdown" });
      assert.equal(result.state, "block-updated");
      assert.match(result.content, /Header preservado/);
      assert.match(result.content, /Footer preservado/);
      assert.match(result.content, /NEW/);
      assert.ok(!result.content.includes("OLD"));
    });

    it("DADO arquivo legado sem marcadores QUANDO apply ENTÃO state=legacy-prepended, comentário humano injetado, conteúdo legado preservado abaixo", () => {
      const legacy = "# Project Setup\n\nStuff that was here before ai-guidelines.\n";
      const result = applyManagedBlock(legacy, "REDIRECT", { syntax: "markdown" });
      assert.equal(result.state, "legacy-prepended");
      assert.match(result.content, /<!-- ai-guidelines:managed-start v=1 -->/);
      assert.match(result.content, /REDIRECT/);
      assert.match(result.content, /<!-- ai-guidelines:managed-end -->/);
      assert.match(result.content, /👤 Atenção, mantenedor humano/);
      assert.match(result.content, /Stuff that was here before ai-guidelines/);
      // Bloco gerenciado vem ANTES do legado
      const managedIdx = result.content.indexOf("REDIRECT");
      const legacyIdx = result.content.indexOf("Stuff that was here");
      assert.ok(managedIdx < legacyIdx, "managed block deve vir antes do conteúdo legado");
    });

    it("DADO arquivo legado em hash QUANDO apply ENTÃO comentário humano usa # prefix", () => {
      const legacy = "user-pattern\nanother-pattern\n";
      const result = applyManagedBlock(legacy, "node_modules\n.git", { syntax: "hash" });
      assert.equal(result.state, "legacy-prepended");
      assert.match(result.content, /^# ai-guidelines:managed-start v=1$/m);
      assert.match(result.content, /^# 👤 Atenção, mantenedor humano/m);
      assert.match(result.content, /user-pattern/);
    });

    it("DADO arquivo legado QUANDO apply com force=true ENTÃO state=legacy-overwritten, conteúdo legado descartado", () => {
      const legacy = "# Legacy stuff\nDelete me.\n";
      const result = applyManagedBlock(legacy, "FRESH", { syntax: "markdown", force: true });
      assert.equal(result.state, "legacy-overwritten");
      assert.match(result.content, /FRESH/);
      assert.ok(!result.content.includes("Delete me"));
    });

    it("DADO arquivo vazio (whitespace) QUANDO apply ENTÃO state=created", () => {
      const result = applyManagedBlock("\n\n  \n", "INNER", { syntax: "markdown" });
      assert.equal(result.state, "created");
      assert.match(result.content, /INNER/);
    });

    it("DADO duas aplicações sucessivas QUANDO apply ENTÃO operação é idempotente", () => {
      const first = applyManagedBlock(null, "INNER", { syntax: "markdown" });
      const second = applyManagedBlock(first.content, "INNER", { syntax: "markdown" });
      assert.equal(second.state, "unchanged");

      // E rerodar com diff conteúdo? Substitui apenas o bloco.
      const third = applyManagedBlock(first.content, "OTHER", { syntax: "markdown" });
      assert.equal(third.state, "block-updated");
      const fourth = applyManagedBlock(third.content, "OTHER", { syntax: "markdown" });
      assert.equal(fourth.state, "unchanged");
    });

    it("DADO arquivo legado com bloco prepended QUANDO rerodar ENTÃO atualiza apenas o bloco e preserva legado", () => {
      const legacy = "# Custom\nOriginal content.\n";
      const first = applyManagedBlock(legacy, "V1", { syntax: "markdown" });
      assert.equal(first.state, "legacy-prepended");

      const second = applyManagedBlock(first.content, "V2", { syntax: "markdown" });
      assert.equal(second.state, "block-updated");
      assert.match(second.content, /V2/);
      assert.ok(!second.content.includes("V1"));
      assert.match(second.content, /Original content/);
      assert.match(second.content, /👤 Atenção, mantenedor humano/);
    });

    it("DADO versão futura QUANDO apply ENTÃO marcador reflete versão custom", () => {
      const result = applyManagedBlock(null, "X", { syntax: "markdown", version: 99 });
      assert.match(result.content, /managed-start v=99/);
    });

    it("DADO arquivo com versão antiga QUANDO apply ENTÃO retorna previousVersion", () => {
      const oldFile = [
        "<!-- ai-guidelines:managed-start v=1 -->",
        "OLD",
        "<!-- ai-guidelines:managed-end -->",
        "",
      ].join("\n");

      const result = applyManagedBlock(oldFile, "NEW", { syntax: "markdown", version: 2 });
      assert.equal(result.state, "block-updated");
      assert.equal(result.previousVersion, 1);
      assert.match(result.content, /managed-start v=2/);
    });
  });
});
