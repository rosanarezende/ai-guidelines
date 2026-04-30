import path from "node:path";
import { parseArgs, printHelp, resolveExecutionInput, isSupportedMode } from "#core/cli-input";
import { fileExists, readTextIfExists } from "#core/file-system";
import { collectExistingPaths, ensureTargetDir, readPackageJson } from "#core/io";
import {
  detectFormatterContext,
  detectMonorepoContext,
  detectNewDevDeps,
  detectPackageManager,
} from "#formatters/package-context";
import { applyPointers } from "#features/core/pointers";
import { applyGitattributes } from "#features/core/gitattributes";
// Opt-in — Infraestrutura (modificam package.json, hooks, CI)
import { applyPrettier } from "#features/opt-in/infrastructure/prettier";
import { applyHusky } from "#features/opt-in/infrastructure/husky";
import { applyCi } from "#features/opt-in/infrastructure/ci";
import { assertSafeInitTarget } from "#governance/agents-merge";
import { buildFormatterRivalGuidance, buildMonorepoGuidance } from "#core/guidance-helpers";
import { getInstallHint, promptUser, runInstall } from "#core/install-runtime";

function buildOverwriteGuidance(mode, force) {
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

export async function execute(mode, rawOptions) {
  const executionInput = await resolveExecutionInput(mode, rawOptions);
  const effectiveMode = executionInput.mode;
  const effectiveRawOptions = executionInput.options;
  const targetDir = path.resolve(effectiveRawOptions.target ?? process.cwd());
  const projectName = effectiveRawOptions.name ?? path.basename(targetDir);

  if (!isSupportedMode(effectiveMode)) {
    throw new Error(
      `Comando não suportado: ${effectiveMode}. Use --help para ver os comandos disponíveis (init, adopt).`
    );
  }

  const options = {
    ...effectiveRawOptions,
    target: targetDir,
    name: projectName,
    force: Boolean(effectiveRawOptions.force),
    "dry-run": Boolean(effectiveRawOptions["dry-run"]),
  };

  await ensureTargetDir(targetDir, options["dry-run"]);

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

  options.formatterContext = formatterContext;

  if (effectiveMode === "init") {
    const conflicts = await collectExistingPaths(targetDir, [
      "AGENTS.md",
      ".gitattributes",
      ".prettierignore",
      ".husky",
      "package.json",
      path.join(".github", "workflows", "ai-guidelines-ci.yml"),
    ]);
    assertSafeInitTarget(conflicts, options.force);
  }

  const context = {
    packageManager,
    formatterContext,
    monorepoContext,
  };

  // 1. Pointers (CORE - Mandatório)
  await applyPointers(targetDir, options, actions);

  // 2. Gitattributes (Core/Persistence)
  const gitattributesResult = await applyGitattributes(targetDir, options, actions);

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
    await applyPrettier(targetDir, options, context, actions);
    await applyHusky(targetDir, options, context, actions);
    await applyCi(targetDir, options, context, actions);
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

  if (newDeps.length > 0 && options["dry-run"]) {
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

  if (newDeps.length > 0 && !options["dry-run"]) {
    const installHint = await getInstallHint(targetDir, packageManager);

    if (options.install) {
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

export async function main(argv = process.argv.slice(2)) {
  try {
    const { command, options } = parseArgs(argv);

    if (command === "--help" || command === "-h") {
      printHelp();
      return;
    }

    if (!command && !process.stdin.isTTY) {
      printHelp();
      return;
    }

    await execute(command, options);
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    process.exitCode = 1;
  }
}
