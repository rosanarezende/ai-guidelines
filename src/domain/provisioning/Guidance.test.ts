import {
  buildFinalProvisioningGuidance,
  buildFormatterRivalGuidance,
  buildMonorepoGuidance,
  buildOverwriteGuidance,
  buildPrettierAlreadyPresentGuidance,
  buildProvidersAbsorbedGuidance,
  shouldWarnAboutEolMismatch,
  willUpdateGitattributes,
  FinalGuidanceSnapshot,
} from "./Guidance.js";

const baseSnapshot: FinalGuidanceSnapshot = {
  formatterContext: { rival: null, hasPrettier: false, shouldSkipPrettier: false },
  monorepoContext: { detected: false, flavor: null, source: null },
  gitattributes: { content: "* text=auto eol=lf\n", baseline: "* text=auto eol=lf\n" },
  platform: "linux",
  hasGitRepo: false,
};

describe("domain/provisioning/Guidance (paridade com buildOverwriteGuidance)", () => {
  it("update: headless vs --force", () => {
    expect(buildOverwriteGuidance("update", false)[0]).toMatch(/update headless/);
    expect(buildOverwriteGuidance("update", true)[0]).toMatch(/--force ativo/);
  });

  it("providers: conservador vs --force", () => {
    expect(buildOverwriteGuidance("providers", false)[0]).toMatch(/conservador/);
    expect(buildOverwriteGuidance("providers", true)[0]).toMatch(/provider entrypoints nativos/);
  });

  it("init: conservador (aborta) vs --force (sobrescreve)", () => {
    expect(buildOverwriteGuidance("init", false)[0]).toMatch(/o init aborta/);
    expect(buildOverwriteGuidance("init", true)[0]).toMatch(/o init pode sobrescrever/);
  });

  it("adopt: conservador (mescla) vs --force (atualiza)", () => {
    expect(buildOverwriteGuidance("adopt", false)[0]).toMatch(/o adopt adiciona ou mescla/);
    expect(buildOverwriteGuidance("adopt", true)[0]).toMatch(/o adopt pode atualizar/);
  });
});

describe("domain/provisioning/Guidance — final guidance (2b-4b)", () => {
  it("gera guidance de formatter rival em paridade com cli/app/guidance.mjs", () => {
    expect(
      buildFormatterRivalGuidance({
        rival: { id: "biome", label: "Biome" },
        hasPrettier: false,
        shouldSkipPrettier: true,
      })
    ).toEqual([
      "atenção: formatador rival detectado (Biome)",
      "sugestão: considere usar apenas um formatador para evitar conflitos de estilo",
    ]);
  });

  it("gera guidance adicional quando adopt encontra rival com Prettier já existente", () => {
    const formatterContext = {
      rival: { id: "biome", label: "Biome" },
      hasPrettier: true,
      shouldSkipPrettier: false,
    };

    expect(buildPrettierAlreadyPresentGuidance("adopt", formatterContext)).toEqual([
      "formatter rival detectado (Biome); baseline prettier preservado porque já existe no repositório",
    ]);
    expect(buildPrettierAlreadyPresentGuidance("init", formatterContext)).toEqual([]);
  });

  it("gera guidance de monorepo por snapshot detectado", () => {
    expect(
      buildMonorepoGuidance({
        detected: true,
        flavor: "pnpm",
        source: "pnpm-workspace.yaml",
      })
    ).toEqual([
      "atenção: estrutura de monorepo detectada (pnpm)",
      "sugestão: aplique a governança em cada pacote individual se necessário",
    ]);
  });

  it("detecta update de .gitattributes para guidance EOL Windows", () => {
    const snapshot: FinalGuidanceSnapshot = {
      ...baseSnapshot,
      gitattributes: { content: "*.bin binary\n", baseline: "* text=auto eol=lf\n" },
      platform: "win32",
      hasGitRepo: true,
    };

    expect(willUpdateGitattributes(snapshot.gitattributes)).toBe(true);
    expect(shouldWarnAboutEolMismatch("adopt", snapshot)).toBe(true);
    expect(shouldWarnAboutEolMismatch("init", snapshot)).toBe(false);
  });

  it("gera guidance explícita para providers absorvido por update --providers", () => {
    expect(buildProvidersAbsorbedGuidance("update", true)).toEqual([
      "modo update --providers: provider entrypoints são atualizados pelo update; o comando providers legado foi absorvido pelo modelo novo",
    ]);
    expect(buildProvidersAbsorbedGuidance("adopt", true)).toEqual([]);
  });

  it("consolida init/adopt/update a partir de snapshots sem IO", () => {
    expect(
      buildFinalProvisioningGuidance(baseSnapshot, {
        operation: "init",
        force: false,
        providersRequested: false,
      })
    ).toEqual([
      "modo conservador: sem --force, o init aborta quando encontrar conflitos de arquivos já existentes",
    ]);

    expect(
      buildFinalProvisioningGuidance(
        {
          ...baseSnapshot,
          monorepoContext: {
            detected: true,
            flavor: "npm-yarn-bun",
            source: "package.json#workspaces",
          },
          formatterContext: {
            rival: { id: "biome", label: "Biome" },
            hasPrettier: true,
            shouldSkipPrettier: false,
          },
        },
        { operation: "adopt", force: true, providersRequested: false }
      )
    ).toContain(
      "formatter rival detectado (Biome); baseline prettier preservado porque já existe no repositório"
    );

    expect(
      buildFinalProvisioningGuidance(baseSnapshot, {
        operation: "update",
        force: false,
        providersRequested: true,
      })
    ).toEqual([
      "modo update headless: bloco managed dos provider entrypoints é atualizado no lugar; conteúdo do consumidor fora do bloco fica intocado",
      "modo update --providers: provider entrypoints são atualizados pelo update; o comando providers legado foi absorvido pelo modelo novo",
    ]);
  });
});
