import {
  configRelPath,
  guidanceEffects,
  planAgentsRuntimeBootstrap,
  planCi,
  planGitattributes,
  planHusky,
  planInitGuard,
  planPrettier,
  planPointers,
  planTemplateMirror,
  renderCiWorkflow,
  CiSnapshot,
  PointersConfig,
  PrettierSnapshot,
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

const prettierSnapshot: PrettierSnapshot = {
  packageJson: { name: "consumer" },
  prettierIgnoreContent: null,
  prettierIgnoreBaseline: "dist/\nnode_modules/\n",
  formatterContext: { rival: null, hasPrettier: false, shouldSkipPrettier: false },
};

describe("domain/provisioning/ProvisioningPlan — Prettier (2b-3a)", () => {
  it("planPrettier gera guidance + package.json + .prettierignore", () => {
    expect(
      planPrettier(prettierSnapshot, { enabled: true, force: false, forcePrettier: false })
    ).toEqual([
      { kind: "guidance", message: "novas dependências detectadas: prettier" },
      {
        kind: "write-package-json",
        relPath: "package.json",
        content: `${JSON.stringify(
          {
            name: "consumer",
            scripts: { format: "prettier --write ." },
            devDependencies: { prettier: "^3.0.0" },
          },
          null,
          2
        )}\n`,
        reason: "prettier scripts & deps",
      },
      {
        kind: "write-prettierignore",
        relPath: ".prettierignore",
        content: "dist/\nnode_modules/\n",
      },
    ]);
  });

  it("planPrettier pula quando a feature está desativada", () => {
    expect(
      planPrettier(prettierSnapshot, { enabled: false, force: false, forcePrettier: false })
    ).toEqual([{ kind: "guidance", message: "skip prettier (feature desativada)" }]);
  });

  it("planPrettier pula formatter rival sem force e não emite escrita", () => {
    expect(
      planPrettier(
        {
          ...prettierSnapshot,
          formatterContext: {
            rival: { id: "biome", label: "Biome" },
            hasPrettier: false,
            shouldSkipPrettier: true,
          },
        },
        { enabled: true, force: false, forcePrettier: false }
      )
    ).toEqual([{ kind: "guidance", message: "skip prettier (formatter rival detectado: Biome)" }]);
  });

  it("planPrettier respeita force-prettier contra formatter rival", () => {
    const effects = planPrettier(
      {
        ...prettierSnapshot,
        formatterContext: {
          rival: { id: "biome", label: "Biome" },
          hasPrettier: false,
          shouldSkipPrettier: true,
        },
      },
      { enabled: true, force: false, forcePrettier: true }
    );

    expect(effects[0]).toEqual({
      kind: "guidance",
      message: "override prettier (formatter rival detectado: Biome; sobrescrita explícita ativa)",
    });
    expect(effects.some((effect) => effect.kind === "write-package-json")).toBe(true);
  });

  it("planPrettier é idempotente quando package e ignore já estão sincronizados", () => {
    expect(
      planPrettier(
        {
          ...prettierSnapshot,
          packageJson: {
            name: "consumer",
            scripts: { format: "prettier --write ." },
            devDependencies: { prettier: "^3.0.0" },
          },
          prettierIgnoreContent: "dist/\nnode_modules/\n",
        },
        { enabled: true, force: false, forcePrettier: false }
      )
    ).toEqual([]);
  });

  it("planPrettier preserva package.json ausente como skip acionável", () => {
    expect(
      planPrettier(
        { ...prettierSnapshot, packageJson: null },
        { enabled: true, force: false, forcePrettier: false }
      )
    ).toEqual([{ kind: "guidance", message: "skip prettier (package.json não encontrado)" }]);
  });
});

describe("domain/provisioning/ProvisioningPlan — Husky (2b-3b)", () => {
  it("planHusky gera package.json, hooks e markExecutable", () => {
    expect(
      planHusky(
        {
          packageJson: { name: "consumer" },
          packageManager: {
            id: "npm",
            label: "npm",
            runner: "npm run",
            packageManagerField: null,
          },
          hooks: [
            { name: "pre-commit", content: null },
            { name: "pre-push", content: null },
          ],
        },
        { enabled: true, force: false }
      )
    ).toEqual([
      {
        kind: "write-package-json",
        relPath: "package.json",
        content: `${JSON.stringify(
          {
            name: "consumer",
            scripts: { prepare: "husky" },
            devDependencies: { husky: "^9.0.0" },
          },
          null,
          2
        )}\n`,
        reason: "husky prepare script",
      },
      {
        kind: "write-husky-hook",
        relPath: ".husky/pre-commit",
        hookName: "pre-commit",
        content: "npm run format\n",
      },
      { kind: "mark-executable", relPath: ".husky/pre-commit" },
      {
        kind: "write-husky-hook",
        relPath: ".husky/pre-push",
        hookName: "pre-push",
        content: "npm run check\n",
      },
      { kind: "mark-executable", relPath: ".husky/pre-push" },
    ]);
  });

  it("planHusky preserva hook existente suportado", () => {
    const effects = planHusky(
      {
        packageJson: { scripts: { prepare: "husky" }, devDependencies: { husky: "^9.0.0" } },
        packageManager: {
          id: "yarn-classic",
          label: "yarn@1.22.22",
          runner: "yarn",
          packageManagerField: "yarn@1.22.22",
        },
        hooks: [
          { name: "pre-commit", content: "echo ok\n" },
          { name: "pre-push", content: "yarn check\n" },
        ],
      },
      { enabled: true, force: false }
    );

    expect(effects).toEqual([
      {
        kind: "write-husky-hook",
        relPath: ".husky/pre-commit",
        hookName: "pre-commit",
        content: "echo ok\nyarn format\n",
      },
      { kind: "mark-executable", relPath: ".husky/pre-commit" },
    ]);
  });

  it("planHusky rejeita hook com formato não suportado sem force", () => {
    expect(() =>
      planHusky(
        {
          packageJson: { name: "consumer" },
          packageManager: {
            id: "npm",
            label: "npm",
            runner: "npm run",
            packageManagerField: null,
          },
          hooks: [
            { name: "pre-commit", content: '#!/bin/sh\nif [ -n "$CI" ]; then\nfi\n' },
            { name: "pre-push", content: null },
          ],
        },
        { enabled: true, force: false }
      )
    ).toThrow(/shape não suportado/);
  });

  it("planHusky é idempotente quando package e hooks já estão sincronizados", () => {
    expect(
      planHusky(
        {
          packageJson: { scripts: { prepare: "husky" }, devDependencies: { husky: "^9.0.0" } },
          packageManager: {
            id: "npm",
            label: "npm",
            runner: "npm run",
            packageManagerField: null,
          },
          hooks: [
            { name: "pre-commit", content: "npm run format\n" },
            { name: "pre-push", content: "npm run check\n" },
          ],
        },
        { enabled: true, force: false }
      )
    ).toEqual([]);
  });

  it("planHusky pula quando feature desativada ou package.json ausente", () => {
    const snapshot = {
      packageJson: null,
      packageManager: {
        id: "npm" as const,
        label: "npm",
        runner: "npm run",
        packageManagerField: null,
      },
      hooks: [
        { name: "pre-commit" as const, content: null },
        { name: "pre-push" as const, content: null },
      ],
    };

    expect(planHusky(snapshot, { enabled: false, force: false })).toEqual([
      { kind: "guidance", message: "skip husky (feature desativada)" },
    ]);
    expect(planHusky(snapshot, { enabled: true, force: false })).toEqual([
      { kind: "guidance", message: "skip husky (package.json ausente)" },
    ]);
  });
});

const ciTemplate = [
  "name: {{ci_workflow_name}}",
  "",
  "jobs:",
  "  ai-guidelines-check:",
  "    steps:",
  "      - name: Setup Node.js",
  "        with:",
  '          node-version: "{{node_version}}"',
  "{{corepack_step}}",
  "      - name: Install dependencies",
  "        run: {{install_command}}",
  "      - name: Validate AI-first baseline",
  "        run: {{check_command}}",
  "",
].join("\n");

const ciSnapshot: CiSnapshot = {
  packageManager: {
    id: "npm",
    label: "npm",
    runner: "npm run",
    packageManagerField: null,
  },
  workflowTemplate: ciTemplate,
  workflowContent: null,
};

describe("domain/provisioning/ProvisioningPlan — CI (2b-3c)", () => {
  it("planCi gera workflow no path canônico quando ausente", () => {
    const effects = planCi(ciSnapshot, { enabled: true, force: false });

    expect(effects).toEqual([
      {
        kind: "write-ci-workflow",
        relPath: ".github/workflows/ai-guidelines-ci.yml",
        content: renderCiWorkflow(ciTemplate, ciSnapshot.packageManager),
      },
    ]);
    expect(effects[0]?.kind === "write-ci-workflow" ? effects[0].content : "").toContain("npm ci");
    expect(effects[0]?.kind === "write-ci-workflow" ? effects[0].content : "").toContain(
      "npm run check"
    );
  });

  it("planCi preserva workflow existente diferente sem force", () => {
    expect(
      planCi({ ...ciSnapshot, workflowContent: "custom\n" }, { enabled: true, force: false })
    ).toEqual([
      {
        kind: "guidance",
        message:
          "skip .github/workflows/ai-guidelines-ci.yml (desatualizado; use --force ou Wizard para atualizar)",
      },
    ]);
  });

  it("planCi sobrescreve workflow existente quando force está ativo", () => {
    expect(
      planCi({ ...ciSnapshot, workflowContent: "custom\n" }, { enabled: true, force: true })
    ).toEqual([
      {
        kind: "write-ci-workflow",
        relPath: ".github/workflows/ai-guidelines-ci.yml",
        content: renderCiWorkflow(ciTemplate, ciSnapshot.packageManager),
      },
    ]);
  });

  it("planCi é idempotente quando workflow já está sincronizado", () => {
    const content = renderCiWorkflow(ciTemplate, ciSnapshot.packageManager);
    expect(
      planCi({ ...ciSnapshot, workflowContent: content }, { enabled: true, force: false })
    ).toEqual([]);
  });

  it("planCi pula quando feature está desativada", () => {
    expect(planCi(ciSnapshot, { enabled: false, force: false })).toEqual([
      { kind: "guidance", message: "skip ci (feature desativada)" },
    ]);
  });

  it("renderCiWorkflow mantém paridade dos placeholders legados por package manager", () => {
    expect(renderCiWorkflow(ciTemplate, ciSnapshot.packageManager)).toContain("run: npm run check");
    expect(
      renderCiWorkflow(ciTemplate, {
        id: "yarn-berry",
        label: "yarn@4.1.1",
        runner: "node .yarn/releases/yarn-4.1.1.cjs",
        packageManagerField: "yarn@4.1.1",
      })
    ).toContain("run: yarn check");
  });
});
