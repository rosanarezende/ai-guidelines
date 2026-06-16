import {
  configRelPath,
  guidanceEffects,
  planAgentsRuntimeBootstrap,
  planGitattributes,
  planInitGuard,
  planPointers,
  planTemplateMirror,
  PointersConfig,
  serializeConfig,
  templateTargetRelPath,
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

describe("domain/provisioning/ProvisioningPlan — efeitos estruturais (2b-1)", () => {
  it("planGitattributes carrega o baseline como input", () => {
    expect(planGitattributes("* text=auto eol=lf\n")).toEqual({
      kind: "merge-gitattributes",
      relPath: ".gitattributes",
      baseline: "* text=auto eol=lf\n",
    });
  });

  it("planInitGuard carrega conflitos + force", () => {
    expect(planInitGuard(["AGENTS.md"], false)).toEqual({
      kind: "assert-init-safe",
      conflicts: ["AGENTS.md"],
      force: false,
    });
  });

  it("guidanceEffects mapeia linhas para efeitos guidance preservando ordem", () => {
    expect(guidanceEffects(["a", "b"])).toEqual([
      { kind: "guidance", message: "a" },
      { kind: "guidance", message: "b" },
    ]);
  });
});

describe("domain/provisioning/ProvisioningPlan — AGENTS/runtime + template mirror (2b-2)", () => {
  it("planAgentsRuntimeBootstrap declara o efeito explícito de AGENTS.md", () => {
    expect(planAgentsRuntimeBootstrap("## Runtime Bootstrap")).toEqual({
      kind: "agents-runtime-bootstrap",
      relPath: "AGENTS.md",
      runtimeStub: "## Runtime Bootstrap",
    });
  });

  it("planTemplateMirror declara sync, writes mirror/engine e prune a partir do snapshot", () => {
    const effects = planTemplateMirror(
      ".ai-guidelines",
      {
        sourceExists: true,
        sourceFiles: [
          { relativePath: "spec-boilerplate.md", content: "# Spec\n", origin: "mirror" },
          { relativePath: "tasks-boilerplate.md", content: "# Tasks\n", origin: "engine" },
        ],
        targetRelativePaths: ["spec-boilerplate.md", "stale.md"],
      },
      { prune: true }
    );

    expect(effects).toEqual([
      { kind: "sync-templates", message: "sync templates -> target" },
      {
        kind: "mirror-template",
        relPath: templateTargetRelPath(".ai-guidelines", "spec-boilerplate.md"),
        sourceRelPath: "spec-boilerplate.md",
        content: "# Spec\n",
        origin: "mirror",
      },
      {
        kind: "mirror-template",
        relPath: templateTargetRelPath(".ai-guidelines", "tasks-boilerplate.md"),
        sourceRelPath: "tasks-boilerplate.md",
        content: "# Tasks\n",
        origin: "engine",
      },
      {
        kind: "prune-template",
        relPath: templateTargetRelPath(".ai-guidelines", "stale.md"),
      },
    ]);
  });

  it("planTemplateMirror não emite efeitos quando a origem de templates não existe", () => {
    expect(
      planTemplateMirror(
        ".ai-guidelines",
        { sourceExists: false, sourceFiles: [], targetRelativePaths: ["stale.md"] },
        { prune: true }
      )
    ).toEqual([]);
  });
});
