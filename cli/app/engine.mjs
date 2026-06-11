import path from "node:path";
import { existsSync } from "node:fs";
import { printHelp, resolveExecutionInput, isSupportedMode } from "#cli/args";
import { fileExists, readTextIfExists } from "#fs/file-system";
import { collectExistingPaths, ensureTargetDir, readPackageJson } from "#fs/io";
import {
  detectFormatterContext,
  detectMonorepoContext,
  detectNewDevDeps,
  detectPackageManager,
} from "#formatters/package-context";
import { applyPointers } from "#features/core/pointers";
import { applyGitattributes } from "#features/core/gitattributes";
import { runBudgetReport } from "#features/core/budget-report";
// Opt-in — Infraestrutura (modificam package.json, hooks, CI)
import { applyPrettier } from "#features/opt-in/infrastructure/prettier";
import { applyHusky } from "#features/opt-in/infrastructure/husky";
import { applyCi } from "#features/opt-in/infrastructure/ci";
import { assertSafeInitTarget } from "#governance/agents-merge";
import { buildFormatterRivalGuidance, buildMonorepoGuidance } from "#app/guidance";
import { getInstallHint, promptUser, runInstall } from "#app/install";

function buildOverwriteGuidance(mode, force) {
  if (mode === "update") {
    return [
      force
        ? "modo --force ativo: o conteúdo legado preservado abaixo de blocos managed em arquivos preexistentes pode ser descartado"
        : "modo update headless: bloco managed dos provider entrypoints é atualizado no lugar; conteúdo do consumidor fora do bloco fica intocado",
    ];
  }

  if (mode === "providers") {
    return [
      force
        ? "modo --force ativo: os provider entrypoints nativos dos providers selecionados podem ser sobrescritos"
        : "modo conservador: arquivos nativos de provider existentes so sao sobrescritos com --force",
    ];
  }

  if (force) {
    if (mode === "init") {
      return [
        "modo --force ativo: o init pode sobrescrever arquivos de baseline suportados quando já existirem",
      ];
    }

    return [
      "modo --force ativo: o adopt pode atualizar AGENTS.md, hooks Husky e ai-guidelines-ci.yml gerados pelo framework",
    ];
  }

  if (mode === "adopt") {
    return [
      "modo conservador: sem --force, o adopt adiciona ou mescla baseline sem sobrescrever arquivos existentes",
    ];
  }

  return [
    "modo conservador: sem --force, o init aborta quando encontrar conflitos de arquivos já existentes",
  ];
}

function shouldWarnAboutEolMismatch(mode, gitattributesUpdated, hasGitRepo) {
  return mode === "adopt" && process.platform === "win32" && gitattributesUpdated && hasGitRepo;
}

function buildEolMismatchGuidance() {
  return [
    "atenção EOL: .gitattributes foi atualizado em ambiente Windows; pode surgir stat-dirty sem diff visível",
    "sugestão EOL: se isso ocorrer, rode git add --renormalize . e depois git status",
  ];
}

async function resolveInteractiveFeatureOverrides(options, formatterContext, actions) {
  const features = options.features ?? [];
  const prettierBlocked =
    features.includes("prettier") &&
    formatterContext.shouldSkipPrettier &&
    !options.force &&
    !options["force-prettier"];

  if (!prettierBlocked) {
    return options;
  }

  if (!process.stdin.isTTY) {
    actions.push(
      `skip prettier (formatter rival detectado: ${formatterContext.rival?.label || "Desconhecido"}; use --force-prettier ou --force para sobrescrever)`
    );
    return options;
  }

  console.log(
    `\nA feature prettier foi selecionada, mas detectamos um formatador rival (${formatterContext.rival?.label || "Desconhecido"}).`
  );
  const confirmed = await promptUser(
    "Deseja sobrescrever essa incompatibilidade e injetar o baseline Prettier mesmo assim? [s/N] ",
    false
  );

  if (!confirmed) {
    actions.push(
      `prettier não será aplicado por incompatibilidade com ${formatterContext.rival?.label || "formatador rival"}`
    );
    return options;
  }

  actions.push(
    `override prettier confirmado pelo usuário apesar de formatter rival detectado (${formatterContext.rival?.label || "Desconhecido"})`
  );
  return {
    ...options,
    "force-prettier": true,
  };
}

export async function execute(mode, rawOptions) {
  const executionInput = await resolveExecutionInput(mode, rawOptions);
  const effectiveMode = executionInput.mode;
  const effectiveRawOptions = executionInput.options;
  const targetDir = path.resolve(effectiveRawOptions.target ?? process.cwd());
  const projectName = effectiveRawOptions.name ?? path.basename(targetDir);

  if (!isSupportedMode(effectiveMode)) {
    throw new Error(
      `Comando não suportado: ${effectiveMode}. Use --help para ver os comandos disponíveis (init, adopt, providers, update, check-budget).`
    );
  }

  if (effectiveMode === "check-budget") {
    await runBudgetReport();
    return;
  }

  const options = {
    ...effectiveRawOptions,
    mode: effectiveMode,
    target: targetDir,
    name: projectName,
    force: Boolean(effectiveRawOptions.force),
    "dry-run": Boolean(effectiveRawOptions["dry-run"]),
  };

  await ensureTargetDir(targetDir, options["dry-run"]);

  if (effectiveMode === "providers" || effectiveMode === "update") {
    const actions = [];

    for (const guidanceLine of buildOverwriteGuidance(effectiveMode, options.force)) {
      actions.push(guidanceLine);
    }

    await applyPointers(targetDir, options, actions);

    if (executionInput.usedWizard) {
      console.log("Wizard: parâmetros ausentes preenchidos com entrada guiada.");
    }

    console.log(`Modo: ${effectiveMode}`);
    console.log(`Target: ${targetDir}`);

    if (actions.length === 0) {
      console.log("Nenhuma mudança necessária.");
    } else {
      console.log("Ações:");
      for (const action of actions) {
        console.log(`- ${action}`);
      }
    }

    return;
  }

  const { packageJson } = await readPackageJson(targetDir, console.warn);
  const formatterContext = await detectFormatterContext(targetDir, packageJson);
  const monorepoContext = await detectMonorepoContext(targetDir, packageJson);
  const packageManager = await detectPackageManager(
    targetDir,
    options["package-manager"],
    packageJson
  );
  const actions = [];

  for (const guidanceLine of buildOverwriteGuidance(effectiveMode, options.force)) {
    actions.push(guidanceLine);
  }

  for (const guidanceLine of buildMonorepoGuidance(monorepoContext)) {
    actions.push(guidanceLine);
  }

  for (const guidanceLine of buildFormatterRivalGuidance(formatterContext, packageManager)) {
    actions.push(guidanceLine);
  }

  if (effectiveMode === "adopt" && formatterContext.rival && formatterContext.hasPrettier) {
    actions.push(
      `formatter rival detectado (${formatterContext.rival.label}); baseline prettier preservado porque já existe no repositório`
    );
  }

  const resolvedOptions = await resolveInteractiveFeatureOverrides(
    options,
    formatterContext,
    actions
  );
  resolvedOptions.formatterContext = formatterContext;

  if (effectiveMode === "init") {
    const conflicts = await collectExistingPaths(targetDir, [
      "AGENTS.md",
      ".gitattributes",
      ".prettierignore",
      ".husky",
      "package.json",
      path.join(".github", "workflows", "ai-guidelines-ci.yml"),
    ]);
    assertSafeInitTarget(conflicts, resolvedOptions.force);
  }

  const context = {
    packageManager,
    formatterContext,
    monorepoContext,
  };

  // 1. Pointers (CORE - Mandatório)
  await applyPointers(targetDir, resolvedOptions, actions);

  // 2. Gitattributes (Core/Persistence)
  const gitattributesResult = await applyGitattributes(targetDir, resolvedOptions, actions);

  if (
    shouldWarnAboutEolMismatch(
      effectiveMode,
      Boolean(gitattributesResult?.didWrite),
      await fileExists(path.join(targetDir, ".git"))
    )
  ) {
    for (const eolGuidance of buildEolMismatchGuidance()) {
      actions.push(eolGuidance);
    }
  }

  // 3. Features Opt-in de infraestrutura. Regras editoriais são compiladas
  // diretamente no bloco <AI_GUIDELINES> do AGENTS.md por applyPointers.
  try {
    await applyPrettier(targetDir, resolvedOptions, context, actions);
    await applyHusky(targetDir, resolvedOptions, context, actions);
    await applyCi(targetDir, resolvedOptions, context, actions);
  } catch (e) {
    actions.push(`[warn] falha ao processar features: ${e.message}`);
  }

  const updatedPkgText = await readTextIfExists(path.join(targetDir, "package.json"));
  let updatedPkg = packageJson;
  try {
    updatedPkg = updatedPkgText ? JSON.parse(updatedPkgText) : packageJson;
  } catch {
    // Manter original se o novo estiver corrompido
  }

  const newDeps =
    effectiveMode === "adopt" && updatedPkg ? detectNewDevDeps(packageJson, updatedPkg) : [];

  if (newDeps.length > 0 && resolvedOptions["dry-run"]) {
    actions.push(`[dry-run] install ${newDeps.join(", ")} (novas dependências detectadas)`);
  }

  if (executionInput.usedWizard) {
    console.log("Wizard: parâmetros ausentes preenchidos com entrada guiada.");
  }

  console.log(`Modo: ${effectiveMode}`);
  console.log(`Target: ${targetDir}`);
  console.log(`Package manager: ${packageManager.label}`);

  if (actions.length === 0) {
    console.log("Nenhuma mudança necessária.");
  } else {
    console.log("Ações:");
    for (const action of actions) {
      console.log(`- ${action}`);
    }
  }

  if (newDeps.length > 0 && !resolvedOptions["dry-run"]) {
    const installHint = await getInstallHint(targetDir, packageManager);

    if (resolvedOptions.install) {
      console.log(`\nInstalando dependências (${newDeps.join(", ")})...`);
      await runInstall(targetDir, packageManager);
      console.log("Dependências instaladas.");
    } else if (process.stdin.isTTY) {
      const confirmed = await promptUser(
        `\nNovas dependências adicionadas (${newDeps.join(", ")}). Instalar agora? [S/n] `
      );
      if (confirmed) {
        await runInstall(targetDir, packageManager);
        console.log("Dependências instaladas.");
      } else {
        console.log(`Execute manualmente: ${installHint}`);
      }
    } else {
      console.log(
        `\nAtenção: novas dependências adicionadas (${newDeps.join(", ")}). Execute: ${installHint}`
      );
    }
  }
}

/**
 * Composition root do registry de comandos (src/cli/registry). Carrega o
 * registry compilado de dist/. Desde `checkpoint-bootstrap-registry`, todos os
 * verbos públicos roteiam por ele; `engine.mjs` não mantém fallback por comando.
 */
async function loadRegistry() {
  const entryUrl = new URL("../../dist/cli/registry/buildRegistry.js", import.meta.url);
  // dist/ ainda não construído (ex.: pré-build) → null. O chamador falha cedo
  // para qualquer verbo nomeado; não há fallback de comando fora do registry.
  // Qualquer OUTRO erro (build quebrado, throw no register) NÃO é mascarado.
  if (!existsSync(entryUrl)) return null;
  const mod = await import(entryUrl.href);
  return mod.buildRegistry();
}

const registryLogger = {
  info: (msg) => process.stdout.write(`${msg}\n`),
  error: (msg) => process.stderr.write(`${msg}\n`),
};

/**
 * Help da CLI = projeção DERIVADA do registry via `renderHelp`. Sem registry
 * (pré-build), printHelp cai no aviso de build. Mata a 2ª fonte de help em
 * `args.mjs` (auditoria #35, #2).
 */
async function showHelp() {
  const registry = await loadRegistry();
  printHelp(registry ? registry.renderHelp() : "");
}

export async function main(
  argv = process.argv.slice(2),
  { loadRegistry: load = loadRegistry } = {}
) {
  try {
    const commandName = argv[0];

    // Registry único: cada comando declara parse/run. `engine.mjs` só carrega o
    // registry compilado e despacha; não mantém lista de verbos nem fallback de
    // parsing. Os comandos de bootstrap ainda delegam internamente à execução
    // legada, mas o roteamento central já está fechado no registry.
    if (commandName && commandName !== "--help" && commandName !== "-h") {
      const registry = await load();
      if (registry) {
        const result = await registry.dispatch(argv, {
          repoRoot: process.cwd(),
          logger: registryLogger,
        });
        if (result.exitCode !== 0) process.exitCode = result.exitCode;
        return;
      }

      // dist/ ausente → NENHUM verbo nomeado roteia (registry único, sem fallback
      // de comando). Falha cedo e explícito para QUALQUER comando — inclusive os
      // de bootstrap, que também passam pelo registry. Sem ramo por verbo aqui.
      throw new Error(
        `Comando "${commandName}" requer o registry compilado, mas dist/ não existe. ` +
          "Rode `npm run build` (ou `npm run validate`) antes de usar a CLI."
      );
    }

    if (commandName === "--help" || commandName === "-h") {
      await showHelp();
      return;
    }

    if (!commandName && !process.stdin.isTTY) {
      await showHelp();
      return;
    }

    await execute(undefined, {});
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    process.exitCode = 1;
  }
}
