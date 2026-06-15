import {
  configRelPath,
  planPointers,
  PointersConfig,
  serializeConfig,
} from "./ProvisioningPlan.js";

const baseConfig: PointersConfig = {
  sdd_dir: ".ai-guidelines",
  providers: ["claude"],
  features: ["tdd"],
  lang: "pt",
};

describe("domain/provisioning/ProvisioningPlan.planPointers (paridade com applyPointers·syncProviderEntrypoints)", () => {
  it("serializeConfig produz JSON canônico com newline final", () => {
    expect(serializeConfig(baseConfig)).toBe(
      `${JSON.stringify(
        { sdd_dir: ".ai-guidelines", providers: ["claude"], features: ["tdd"], lang: "pt" },
        null,
        2
      )}\n`
    );
  });

  it("DADO um provider ENTÃO o plano abre com write-config e segue com os entrypoints gerenciados", () => {
    const effects = planPointers(
      baseConfig,
      { claude: "RULES-CLAUDE" },
      {
        force: false,
        prune: false,
      }
    );

    expect(effects[0]).toEqual({
      kind: "write-config",
      relPath: configRelPath(".ai-guidelines"),
      content: serializeConfig(baseConfig),
    });

    const claudeMd = effects.find(
      (e) => e.kind === "managed-entrypoint" && e.relPath === "CLAUDE.md"
    );
    expect(claudeMd).toBeDefined();
    if (claudeMd && claudeMd.kind === "managed-entrypoint") {
      expect(claudeMd.syntax).toBe("markdown");
      expect(claudeMd.cursorFrontmatter).toBe(false);
      expect(claudeMd.inner).toContain("# SYSTEM DIRECTIVE: HARD REDIRECT");
      expect(claudeMd.inner).toContain("Claude Code");
      // regra de adapter compilada é injetada no inner
      expect(claudeMd.inner).toContain("RULES-CLAUDE");
    }

    const claudeIgnore = effects.find(
      (e) => e.kind === "managed-entrypoint" && e.relPath === ".claudeignore"
    );
    expect(claudeIgnore).toBeDefined();
    if (claudeIgnore && claudeIgnore.kind === "managed-entrypoint") {
      expect(claudeIgnore.syntax).toBe("hash");
      expect(claudeIgnore.inner).toContain(".ai-guidelines/templates");
    }
  });

  it("DADO force=true ENTÃO todos os efeitos managed-entrypoint carregam force", () => {
    const effects = planPointers(baseConfig, {}, { force: true, prune: false });
    const managed = effects.filter((e) => e.kind === "managed-entrypoint");
    expect(managed.length).toBeGreaterThan(0);
    expect(managed.every((e) => e.kind === "managed-entrypoint" && e.force)).toBe(true);
  });

  it("DADO prune=true ENTÃO emite prune-managed para entrypoints de providers desmarcados", () => {
    const effects = planPointers(baseConfig, {}, { force: false, prune: true });
    const prunes = effects
      .filter((e) => e.kind === "prune-managed")
      .map((e) => (e.kind === "prune-managed" ? e.relPath : ""));

    // gemini/openai/etc. desmarcados → seus entrypoints entram no prune
    expect(prunes).toContain("GEMINI.md");
    expect(prunes).toContain(".gptignore");
    // o provider selecionado (claude) NÃO é podado
    expect(prunes).not.toContain("CLAUDE.md");
  });

  it("DADO .mdc (cursor) ENTÃO marca cursorFrontmatter=true", () => {
    const effects = planPointers(
      { ...baseConfig, providers: ["cursor"] },
      {},
      { force: false, prune: false }
    );
    const mdc = effects.find(
      (e) => e.kind === "managed-entrypoint" && e.relPath.endsWith("ai-guidelines.mdc")
    );
    expect(mdc).toBeDefined();
    expect(mdc && mdc.kind === "managed-entrypoint" && mdc.cursorFrontmatter).toBe(true);
  });
});
