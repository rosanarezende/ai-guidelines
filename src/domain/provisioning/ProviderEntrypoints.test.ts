import {
  buildCommonContextIgnores,
  buildHardRedirect,
  describeManagedAction,
  getAllManagedRelativePaths,
  getProviderEntrypoints,
} from "./ProviderEntrypoints.js";

describe("domain/provisioning/ProviderEntrypoints (paridade com cli/features/core/provider-entrypoints)", () => {
  it("DADO claude ENTÃO gera CLAUDE.md (markdown) + .claudeignore (context ignores)", () => {
    const entries = getProviderEntrypoints("claude", ".ai-guidelines", { claude: "RULES" });
    expect(entries.map((e) => e.relPath)).toEqual(["CLAUDE.md", ".claudeignore"]);

    const md = entries[0].content;
    expect(md).toContain("# SYSTEM DIRECTIVE: HARD REDIRECT");
    expect(md).toContain("Claude Code integration");
    expect(md).toContain("Consumer-local ai-guidelines assets live under `.ai-guidelines/`");
    // adapter rules injetadas após o separador
    expect(md).toContain("\n\n---\n\nRULES");

    expect(entries[1].content).toBe(buildCommonContextIgnores(".ai-guidelines"));
  });

  it("DADO provider sem adapter rules ENTÃO inner é só o hard redirect", () => {
    const [claudeMd] = getProviderEntrypoints("claude", ".ai-guidelines", {});
    expect(claudeMd.content).toBe(buildHardRedirect("Claude Code", ".ai-guidelines"));
  });

  it("DADO cursor ENTÃO entrypoint .mdc em .cursor/rules", () => {
    const entries = getProviderEntrypoints("cursor", ".ai-guidelines", {});
    expect(entries).toHaveLength(1);
    expect(entries[0].relPath.replace(/\\/g, "/")).toBe(".cursor/rules/ai-guidelines.mdc");
  });

  it("DADO provider desconhecido ENTÃO retorna lista vazia", () => {
    expect(getProviderEntrypoints("naoexiste", ".ai-guidelines", {})).toEqual([]);
  });

  it("buildCommonContextIgnores embute o sddDir nos templates", () => {
    expect(buildCommonContextIgnores(".custom")).toContain(".custom/templates");
    expect(buildCommonContextIgnores(".custom")).toContain("node_modules");
  });

  it("getAllManagedRelativePaths cobre todos os providers suportados", () => {
    const all = getAllManagedRelativePaths(".ai-guidelines");
    expect(all).toContain("CLAUDE.md");
    expect(all).toContain("GEMINI.md");
    expect(all).toContain(".gptignore");
    expect(all).toContain(".windsurfrules");
  });

  it("describeManagedAction espelha o log de ações por estado", () => {
    expect(describeManagedAction("created", "CLAUDE.md", false)).toBe("write CLAUDE.md");
    expect(describeManagedAction("created", "CLAUDE.md", true)).toBe("[dry-run] write CLAUDE.md");
    expect(describeManagedAction("block-updated", "CLAUDE.md", false)).toBe(
      "update managed block in CLAUDE.md"
    );
    expect(describeManagedAction("legacy-prepended", "X.md", false)).toBe(
      "prepend managed block to existing X.md (legacy content preserved)"
    );
    expect(describeManagedAction("legacy-overwritten", "X.md", false)).toBe(
      "overwrite X.md (--force, legacy content discarded)"
    );
    expect(describeManagedAction("unchanged", "X.md", false)).toBeNull();
  });
});
