import {
  applyManagedBlock,
  buildManagedBlock,
  inferSyntaxFromPath,
  MANAGED_BLOCK_VERSION,
  parseManagedFile,
} from "./ManagedBlock.js";

describe("domain/provisioning/ManagedBlock (paridade com cli/features/core/managed-block)", () => {
  describe("inferSyntaxFromPath", () => {
    it("DADO arquivo .md QUANDO infere ENTÃO markdown", () => {
      expect(inferSyntaxFromPath("AGENTS.md")).toBe("markdown");
    });
    it("DADO arquivo ignore-style QUANDO infere ENTÃO hash", () => {
      expect(inferSyntaxFromPath(".claudeignore")).toBe("hash");
      expect(inferSyntaxFromPath("nested/.gptignore")).toBe("hash");
    });
    it("DADO .windsurfrules QUANDO infere ENTÃO markdown (texto livre)", () => {
      expect(inferSyntaxFromPath(".windsurfrules")).toBe("markdown");
    });
  });

  describe("buildManagedBlock", () => {
    it("DADO conteúdo markdown ENTÃO envolve em HTML comments com versão", () => {
      const block = buildManagedBlock("REGRAS", "markdown", 1);
      expect(block).toBe(
        "<!-- ai-guidelines:managed-start v=1 -->\nREGRAS\n<!-- ai-guidelines:managed-end -->"
      );
    });
    it("DADO conteúdo hash ENTÃO envolve em comentários #", () => {
      const block = buildManagedBlock("dist/", "hash", 1);
      expect(block).toBe("# ai-guidelines:managed-start v=1\ndist/\n# ai-guidelines:managed-end");
    });
    it("DADO newlines extras ENTÃO normaliza as bordas", () => {
      const block = buildManagedBlock("\n\nREGRAS\n\n", "markdown", 1);
      expect(block).toContain("\nREGRAS\n");
    });
  });

  describe("parseManagedFile", () => {
    it("DADO arquivo sem marcadores ENTÃO hasManagedBlock=false", () => {
      expect(parseManagedFile("conteúdo livre", "markdown")).toEqual({ hasManagedBlock: false });
    });
    it("DADO arquivo gerenciado ENTÃO extrai before/block/after/version", () => {
      const content =
        "antes\n<!-- ai-guidelines:managed-start v=1 -->\nX\n<!-- ai-guidelines:managed-end -->\ndepois";
      const parsed = parseManagedFile(content, "markdown");
      expect(parsed.hasManagedBlock).toBe(true);
      if (parsed.hasManagedBlock) {
        expect(parsed.version).toBe(1);
        expect(parsed.before).toBe("antes\n");
        expect(parsed.after).toBe("\ndepois");
      }
    });
  });

  describe("applyManagedBlock", () => {
    it("DADO arquivo inexistente ENTÃO state=created", () => {
      const r = applyManagedBlock(null, "X", { syntax: "markdown" });
      expect(r.state).toBe("created");
      expect(r.content).toContain("X");
    });
    it("DADO arquivo gerenciado idêntico ENTÃO state=unchanged + content=null", () => {
      const first = applyManagedBlock(null, "X").content as string;
      const again = applyManagedBlock(first, "X");
      expect(again.state).toBe("unchanged");
      expect(again.content).toBeNull();
    });
    it("DADO bloco antigo ENTÃO state=block-updated preservando before/after", () => {
      const base = "antes\n" + (applyManagedBlock(null, "OLD").content as string) + "depois\n";
      const r = applyManagedBlock(base, "NEW");
      expect(r.state).toBe("block-updated");
      expect(r.content).toContain("antes");
      expect(r.content).toContain("depois");
      expect(r.content).toContain("NEW");
    });
    it("DADO arquivo legado sem marcadores ENTÃO state=legacy-prepended + nota humana + legado preservado", () => {
      const r = applyManagedBlock("conteúdo legado do humano\n", "X", { syntax: "markdown" });
      expect(r.state).toBe("legacy-prepended");
      expect(r.content).toContain("Atenção, mantenedor humano");
      expect(r.content).toContain("conteúdo legado do humano");
    });
    it("DADO arquivo legado em hash ENTÃO a nota humana usa prefixo #", () => {
      const r = applyManagedBlock("0 antigo\n", "dist/", { syntax: "hash" });
      expect(r.state).toBe("legacy-prepended");
      expect(r.content).toContain("# 👤 Atenção, mantenedor humano");
    });
    it("DADO force=true sobre legado ENTÃO state=legacy-overwritten descartando o legado", () => {
      const r = applyManagedBlock("conteúdo legado\n", "X", { force: true });
      expect(r.state).toBe("legacy-overwritten");
      expect(r.content).not.toContain("conteúdo legado");
    });
    it("DADO arquivo só com whitespace ENTÃO state=created", () => {
      const r = applyManagedBlock("   \n\n", "X");
      expect(r.state).toBe("created");
    });
    it("DADO versão custom ENTÃO o marcador reflete a versão", () => {
      const r = applyManagedBlock(null, "X", { version: 7 });
      expect(r.content).toContain("v=7");
    });
    it("DADO versão antiga no arquivo ENTÃO retorna previousVersion", () => {
      const old = applyManagedBlock(null, "X", { version: 1 }).content as string;
      const r = applyManagedBlock(old, "Y", { version: 2 });
      expect(r.state).toBe("block-updated");
      expect(r.previousVersion).toBe(1);
    });
    it("MANAGED_BLOCK_VERSION é a versão default", () => {
      expect(applyManagedBlock(null, "X").content).toContain(`v=${MANAGED_BLOCK_VERSION}`);
    });
  });
});
