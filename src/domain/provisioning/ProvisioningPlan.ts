/**
 * Plano PURO de provisionamento: a sequência declarativa de efeitos que
 * init/adopt/update produzem, computada ANTES de qualquer IO.
 *
 * Migração Spec 0024 · CO-3.5. Espelha a separação já adotada em
 * `domain/workspace/MigrationPlan` (plano puro) + `app/use-cases/AdoptWorkspace`
 * (aplicação via port). O use case {@link ../../app/use-cases/ProvisionWorkspace}
 * consome estes efeitos e os aplica no filesystem do consumidor.
 *
 * **Escopo deste arquivo (CO-3.5 · Passo 1b):** o grupo de efeitos `pointers`
 * (config.json + provider entrypoints + prune) — o núcleo compartilhado por
 * init/adopt/update/providers e a totalidade do ex-comando `providers`
 * (absorvido em `update --providers`). Os grupos restantes de applyPointers
 * (merge do bloco `<AI_GUIDELINES>` em AGENTS.md e o mirror de templates,
 * ambos dependentes do runtime compilado em `dist/`) e os efeitos exclusivos de
 * init/adopt (gitattributes, features opt-in, install) entram no Passo 2 com
 * seus adapters de infraestrutura.
 */
import path from "node:path";
import { ManagedBlockSyntax, inferSyntaxFromPath } from "./ManagedBlock.js";
import { mergePrettierIgnoreContent } from "./MergePolicies.js";
import {
  detectNewDevDeps,
  mergeHuskyPackageJson,
  mergePrettierPackageJson,
  PackageJsonObject,
  serializePackageJson,
} from "./PackageJson.js";
import { FormatterContextSnapshot } from "./FormatterContext.js";
import { getAllManagedRelativePaths, getProviderEntrypoints } from "./ProviderEntrypoints.js";
import { mergeHookContent } from "./MergePolicies.js";
import {
  PackageManagerSnapshot,
  resolveCiRunner,
  resolveInstallCommand,
  resolveInstallHint,
  resolveLocalInstallCommand,
  resolveYarnBerryReleasePath,
} from "./PackageManager.js";
import {
  buildFinalProvisioningGuidance,
  FinalGuidanceOptions,
  FinalGuidanceSnapshot,
} from "./Guidance.js";
import { CollaborationProfile, renderReviewPolicyBaseline } from "./ReviewPolicyBaseline.js";

export type ProvisioningOperation = "init" | "adopt" | "update";

export type ProvisioningEffect =
  | { readonly kind: "write-config"; readonly relPath: string; readonly content: string }
  | {
      readonly kind: "agents-runtime-bootstrap";
      readonly relPath: "AGENTS.md";
      readonly runtimeStub: string;
    }
  | { readonly kind: "sync-templates"; readonly message: "sync templates -> target" }
  | {
      readonly kind: "mirror-template";
      readonly relPath: string;
      readonly sourceRelPath: string;
      readonly content: string;
      readonly origin: TemplateMirrorOrigin;
    }
  | { readonly kind: "prune-template"; readonly relPath: string }
  | {
      readonly kind: "managed-entrypoint";
      readonly relPath: string;
      readonly inner: string;
      readonly syntax: ManagedBlockSyntax;
      readonly force: boolean;
      /** `.mdc` (Cursor) exige frontmatter YAML no topo na primeira criação. */
      readonly cursorFrontmatter: boolean;
    }
  | { readonly kind: "prune-managed"; readonly relPath: string }
  | { readonly kind: "merge-gitattributes"; readonly relPath: string; readonly baseline: string }
  | {
      readonly kind: "write-package-json";
      readonly relPath: "package.json";
      readonly content: string;
      readonly reason: string;
    }
  | {
      readonly kind: "write-prettierignore";
      readonly relPath: ".prettierignore";
      readonly content: string;
    }
  | {
      readonly kind: "write-husky-hook";
      readonly relPath: `.husky/${string}`;
      readonly hookName: string;
      readonly content: string;
    }
  | { readonly kind: "mark-executable"; readonly relPath: string }
  | {
      readonly kind: "write-ci-workflow";
      readonly relPath: ".github/workflows/ai-guidelines-ci.yml";
      readonly content: string;
    }
  | {
      readonly kind: "write-review-policy";
      readonly relPath: ".governance/review-policy.yml";
      readonly profile: CollaborationProfile;
      readonly baseline: string;
    }
  | {
      readonly kind: "install-dependencies";
      readonly dependencies: readonly string[];
      readonly command: string;
      readonly manualCommand: string;
      readonly blockedReason: string | null;
    }
  | {
      readonly kind: "assert-init-safe";
      readonly conflicts: readonly string[];
      readonly force: boolean;
    }
  | { readonly kind: "guidance"; readonly message: string };

export interface PointersConfig {
  readonly sdd_dir: string;
  readonly providers: readonly string[];
  readonly features: readonly string[];
  readonly lang: string;
}

export interface PlanPointersOptions {
  readonly force: boolean;
  readonly prune: boolean;
}

export type TemplateMirrorOrigin = "mirror" | "engine";

export interface TemplateMirrorFile {
  /** Caminho relativo dentro de `.specify/templates`. */
  readonly relativePath: string;
  /** Conteúdo final já materializado (mirror ou engine) pela infraestrutura. */
  readonly content: string;
  readonly origin: TemplateMirrorOrigin;
}

export interface TemplateMirrorSnapshot {
  readonly sourceExists: boolean;
  readonly sourceFiles: readonly TemplateMirrorFile[];
  /** Caminhos relativos dentro de `<sdd_dir>/templates`, usados somente para prune. */
  readonly targetRelativePaths: readonly string[];
}

export interface PlanTemplateMirrorOptions {
  readonly prune: boolean;
}

export interface PrettierSnapshot {
  readonly packageJson: PackageJsonObject | null;
  readonly prettierIgnoreContent: string | null;
  readonly prettierIgnoreBaseline: string;
  readonly formatterContext: FormatterContextSnapshot;
}

export interface PlanPrettierOptions {
  readonly enabled: boolean;
  readonly force: boolean;
  readonly forcePrettier: boolean;
}

export interface HuskyHookSnapshot {
  readonly name: "pre-commit" | "pre-push";
  readonly content: string | null;
}

export interface HuskySnapshot {
  readonly packageJson: PackageJsonObject | null;
  readonly packageManager: PackageManagerSnapshot;
  readonly hooks: readonly HuskyHookSnapshot[];
}

export interface PlanHuskyOptions {
  readonly enabled: boolean;
  readonly force: boolean;
}

export const CONSUMER_HUSKY_HOOK_COMMANDS: Readonly<
  Record<HuskyHookSnapshot["name"], "format" | "check">
> = {
  "pre-commit": "format",
  "pre-push": "check",
};

export interface CiSnapshot {
  readonly packageManager: PackageManagerSnapshot;
  readonly workflowTemplate: string;
  readonly workflowContent: string | null;
}

export interface PlanCiOptions {
  readonly enabled: boolean;
  readonly force: boolean;
}

export interface InstallSnapshot {
  readonly packageManager: PackageManagerSnapshot;
  readonly yarnBerryReleaseExists: boolean;
}

export interface PlanInstallOptions {
  readonly enabled: boolean;
  readonly dependencyNames: readonly string[];
}

export interface RuntimeBootstrapSnapshot {
  readonly runtimeStub: string;
}

export interface InitGuardSnapshot {
  readonly conflicts: readonly string[];
}

export interface ProvisioningOperationSnapshot {
  readonly initGuard: InitGuardSnapshot;
  readonly runtime: RuntimeBootstrapSnapshot;
  readonly templates: TemplateMirrorSnapshot;
  readonly prettier: PrettierSnapshot;
  readonly husky: HuskySnapshot;
  readonly ci: CiSnapshot;
  readonly install: InstallSnapshot;
  readonly guidance: FinalGuidanceSnapshot;
}

export interface ProvisioningOperationContext {
  readonly targetDir: string;
  readonly projectName: string;
  readonly config: PointersConfig;
  readonly adapterRulesByName: Readonly<Record<string, string>>;
}

export interface PlanProvisioningOperationOptions {
  readonly operation: ProvisioningOperation;
  readonly force: boolean;
  readonly forcePrettier: boolean;
  readonly prune: boolean;
  readonly install: boolean;
  readonly providersRequested: boolean;
  readonly collaborationProfile?: CollaborationProfile;
}

export type { FinalGuidanceOptions, FinalGuidanceSnapshot } from "./Guidance.js";

/** Caminho relativo do `config.json` dentro do consumidor. */
export function configRelPath(sddDir: string): string {
  return path.posix.join(sddDir, "config.json");
}

/** Serialização canônica do `config.json` (espelha `stringifyJson` do legado). */
export function serializeConfig(config: PointersConfig): string {
  return `${JSON.stringify(
    {
      sdd_dir: config.sdd_dir,
      providers: config.providers,
      features: config.features,
      lang: config.lang,
    },
    null,
    2
  )}\n`;
}

/**
 * Computa os efeitos `pointers`: escreve `config.json`, gera os provider
 * entrypoints selecionados (bloco gerenciado) e, sob `--prune`, remove os
 * entrypoints de providers desmarcados. PURO e determinístico — `adapterRulesByName`
 * (regras compiladas por adapter) é input vindo da infraestrutura.
 */
export function planPointers(
  config: PointersConfig,
  adapterRulesByName: Readonly<Record<string, string>>,
  options: PlanPointersOptions
): ProvisioningEffect[] {
  const effects: ProvisioningEffect[] = [
    {
      kind: "write-config",
      relPath: configRelPath(config.sdd_dir),
      content: serializeConfig(config),
    },
  ];

  const selected = config.providers.flatMap((provider) =>
    getProviderEntrypoints(provider, config.sdd_dir, adapterRulesByName)
  );

  for (const entry of selected) {
    effects.push({
      kind: "managed-entrypoint",
      relPath: entry.relPath,
      inner: entry.content,
      syntax: inferSyntaxFromPath(entry.relPath),
      force: options.force,
      cursorFrontmatter: entry.relPath.endsWith(".mdc"),
    });
  }

  if (options.prune) {
    const selectedPaths = new Set(selected.map((entry) => entry.relPath));
    for (const relPath of getAllManagedRelativePaths(config.sdd_dir)) {
      if (!selectedPaths.has(relPath)) {
        effects.push({ kind: "prune-managed", relPath });
      }
    }
  }

  return effects;
}

export function planAgentsRuntimeBootstrap(runtimeStub: string): ProvisioningEffect {
  return { kind: "agents-runtime-bootstrap", relPath: "AGENTS.md", runtimeStub };
}

export function templateTargetRelPath(sddDir: string, relativePath: string): string {
  return path.posix.join(sddDir, "templates", relativePath);
}

/**
 * Computa o mirror de templates do consumidor. A infraestrutura fornece o
 * snapshot materializado (`sourceFiles`) e os arquivos atuais do alvo usados
 * para prune; o plano apenas declara os efeitos.
 */
export function planTemplateMirror(
  sddDir: string,
  snapshot: TemplateMirrorSnapshot,
  options: PlanTemplateMirrorOptions
): ProvisioningEffect[] {
  if (!snapshot.sourceExists) {
    return [];
  }

  const effects: ProvisioningEffect[] = [
    { kind: "sync-templates", message: "sync templates -> target" },
  ];
  const sourceRelativeSet = new Set<string>();

  for (const source of snapshot.sourceFiles) {
    sourceRelativeSet.add(source.relativePath);
    effects.push({
      kind: "mirror-template",
      relPath: templateTargetRelPath(sddDir, source.relativePath),
      sourceRelPath: source.relativePath,
      content: source.content,
      origin: source.origin,
    });
  }

  if (options.prune) {
    for (const targetRelativePath of snapshot.targetRelativePaths) {
      if (!sourceRelativeSet.has(targetRelativePath)) {
        effects.push({
          kind: "prune-template",
          relPath: templateTargetRelPath(sddDir, targetRelativePath),
        });
      }
    }
  }

  return effects;
}

/**
 * Efeito de sincronização do `.gitattributes`: `baseline` (conteúdo do template,
 * lido pela infraestrutura) entra como input; a fusão não-destrutiva acontece na
 * aplicação, via {@link ./MergePolicies.mergeGitattributesContent}.
 */
export function planGitattributes(baseline: string): ProvisioningEffect {
  return { kind: "merge-gitattributes", relPath: ".gitattributes", baseline };
}

export function planPrettier(
  snapshot: PrettierSnapshot,
  options: PlanPrettierOptions
): ProvisioningEffect[] {
  if (!options.enabled) {
    return guidanceEffects(["skip prettier (feature desativada)"]);
  }

  const forcePrettier = options.force || options.forcePrettier;
  const rivalLabel = snapshot.formatterContext.rival?.label ?? "Desconhecido";
  if (snapshot.formatterContext.shouldSkipPrettier && !forcePrettier) {
    return guidanceEffects([`skip prettier (formatter rival detectado: ${rivalLabel})`]);
  }

  const effects: ProvisioningEffect[] = [];
  if (snapshot.formatterContext.shouldSkipPrettier && forcePrettier) {
    effects.push({
      kind: "guidance",
      message: `override prettier (formatter rival detectado: ${rivalLabel}; sobrescrita explícita ativa)`,
    });
  }

  if (!snapshot.packageJson) {
    effects.push({ kind: "guidance", message: "skip prettier (package.json não encontrado)" });
    return effects;
  }

  const mergedPackageJson = mergePrettierPackageJson(snapshot.packageJson);
  const newDeps = detectNewDevDeps(snapshot.packageJson, mergedPackageJson);
  if (newDeps.length > 0) {
    effects.push({
      kind: "guidance",
      message: `novas dependências detectadas: ${newDeps.join(", ")}`,
    });
  }

  const currentPackageJson = serializePackageJson(snapshot.packageJson);
  const nextPackageJson = serializePackageJson(mergedPackageJson);
  if (nextPackageJson !== currentPackageJson) {
    effects.push({
      kind: "write-package-json",
      relPath: "package.json",
      content: nextPackageJson,
      reason: "prettier scripts & deps",
    });
  }

  const nextIgnore = mergePrettierIgnoreContent(
    snapshot.prettierIgnoreContent,
    snapshot.prettierIgnoreBaseline
  );
  if (nextIgnore !== snapshot.prettierIgnoreContent) {
    effects.push({
      kind: "write-prettierignore",
      relPath: ".prettierignore",
      content: nextIgnore,
    });
  }

  return effects;
}

export function planHusky(
  snapshot: HuskySnapshot,
  options: PlanHuskyOptions
): ProvisioningEffect[] {
  if (!options.enabled) {
    return guidanceEffects(["skip husky (feature desativada)"]);
  }

  if (!snapshot.packageJson) {
    return guidanceEffects(["skip husky (package.json ausente)"]);
  }

  const effects: ProvisioningEffect[] = [];
  const mergedPackageJson = mergeHuskyPackageJson(snapshot.packageJson);
  const currentPackageJson = serializePackageJson(snapshot.packageJson);
  const nextPackageJson = serializePackageJson(mergedPackageJson);
  if (nextPackageJson !== currentPackageJson) {
    effects.push({
      kind: "write-package-json",
      relPath: "package.json",
      content: nextPackageJson,
      reason: "husky prepare script",
    });
  }

  for (const hook of snapshot.hooks) {
    const desiredCommand = `${snapshot.packageManager.runner} ${
      CONSUMER_HUSKY_HOOK_COMMANDS[hook.name]
    }`;
    const mergedHook = mergeHookContent(hook.content, desiredCommand, options.force, hook.name);
    if (mergedHook !== hook.content) {
      const relPath = `.husky/${hook.name}` as const;
      effects.push({
        kind: "write-husky-hook",
        relPath,
        hookName: hook.name,
        content: mergedHook,
      });
      effects.push({ kind: "mark-executable", relPath });
    }
  }

  return effects;
}

export function planCi(snapshot: CiSnapshot, options: PlanCiOptions): ProvisioningEffect[] {
  if (!options.enabled) {
    return guidanceEffects(["skip ci (feature desativada)"]);
  }

  const workflow = renderCiWorkflow(snapshot.workflowTemplate, snapshot.packageManager);
  const relPath = ".github/workflows/ai-guidelines-ci.yml";

  if (snapshot.workflowContent === workflow) {
    return [];
  }

  if (snapshot.workflowContent !== null && !options.force) {
    return guidanceEffects([
      `skip ${relPath} (desatualizado; use --force ou Wizard para atualizar)`,
    ]);
  }

  return [{ kind: "write-ci-workflow", relPath, content: workflow }];
}

export function renderCiWorkflow(template: string, packageManager: PackageManagerSnapshot): string {
  const replacements: Readonly<Record<string, string>> = {
    "{{ci_workflow_name}}": "AI Governance Check",
    "{{node_version}}": "24",
    "{{corepack_step}}":
      packageManager.id === "npm"
        ? ""
        : "\n      - name: Enable Corepack\n        run: corepack enable\n",
    "{{install_command}}": resolveInstallCommand(packageManager),
    "{{check_command}}": `${resolveCiRunner(packageManager)} check`,
  };

  let rendered = template;
  for (const [key, value] of Object.entries(replacements)) {
    rendered = rendered.replaceAll(key, value);
  }
  return rendered;
}

export function planInstall(
  snapshot: InstallSnapshot,
  options: PlanInstallOptions
): ProvisioningEffect[] {
  const dependencies = [...new Set(options.dependencyNames)];
  if (dependencies.length === 0) {
    return [];
  }

  const releasePath = resolveYarnBerryReleasePath(snapshot.packageManager);
  const blockedReason =
    snapshot.packageManager.id === "yarn-berry" && !snapshot.yarnBerryReleaseExists
      ? `Arquivo de release do yarn não encontrado em ${releasePath}. Execute: corepack enable && yarn install`
      : null;
  const manualCommand = resolveInstallHint(
    snapshot.packageManager,
    snapshot.yarnBerryReleaseExists
  );

  if (!options.enabled) {
    return guidanceEffects([
      `Atenção: novas dependências adicionadas (${dependencies.join(
        ", "
      )}). Execute: ${manualCommand}`,
    ]);
  }

  return [
    {
      kind: "install-dependencies",
      dependencies,
      command: resolveLocalInstallCommand(snapshot.packageManager),
      manualCommand,
      blockedReason,
    },
  ];
}

export function planReviewPolicy(profile: CollaborationProfile): ProvisioningEffect {
  return {
    kind: "write-review-policy",
    relPath: ".governance/review-policy.yml",
    profile,
    baseline: renderReviewPolicyBaseline(profile),
  };
}

export function planFinalGuidance(
  snapshot: FinalGuidanceSnapshot,
  options: FinalGuidanceOptions
): ProvisioningEffect[] {
  return guidanceEffects(buildFinalProvisioningGuidance(snapshot, options));
}

export function planProvisioningOperation(
  context: ProvisioningOperationContext,
  snapshot: ProvisioningOperationSnapshot,
  options: PlanProvisioningOperationOptions
): ProvisioningEffect[] {
  const effects: ProvisioningEffect[] = [];

  if (options.operation === "init") {
    effects.push(planInitGuard(snapshot.initGuard.conflicts, options.force));
  }

  effects.push(
    ...planFinalGuidance(snapshot.guidance, {
      operation: options.operation,
      force: options.force,
      providersRequested: options.providersRequested,
    })
  );

  effects.push(
    ...planCoreProvisioning(context.config, context.adapterRulesByName, snapshot, {
      force: options.force,
      prune: options.prune,
    })
  );

  if (options.collaborationProfile) {
    effects.push(planReviewPolicy(options.collaborationProfile));
  }

  if (options.operation !== "update") {
    effects.push(
      ...planAdoptInitInfrastructure(context.config, snapshot, {
        force: options.force,
        forcePrettier: options.forcePrettier,
        install: options.install,
      })
    );
  }

  return effects;
}

/**
 * Efeito conflict guard de init: a lista `conflicts` (paths guardados que já
 * existem, detectada pela infraestrutura a partir de {@link ./InitGuard.INIT_GUARDED_PATHS})
 * + `force` entram como input; a asserção roda na aplicação, antes das escritas.
 */
export function planInitGuard(conflicts: readonly string[], force: boolean): ProvisioningEffect {
  return { kind: "assert-init-safe", conflicts, force };
}

/** Converte linhas de guidance em efeitos `guidance` (repassados ao log na aplicação). */
export function guidanceEffects(messages: readonly string[]): ProvisioningEffect[] {
  return messages.map((message) => ({ kind: "guidance", message }));
}

function planCoreProvisioning(
  config: PointersConfig,
  adapterRulesByName: Readonly<Record<string, string>>,
  snapshot: ProvisioningOperationSnapshot,
  options: PlanPointersOptions
): ProvisioningEffect[] {
  const pointerEffects = planPointers(config, adapterRulesByName, options);
  const [configEffect, ...providerEffects] = pointerEffects;
  return [
    configEffect,
    ...planTemplateMirror(config.sdd_dir, snapshot.templates, { prune: options.prune }),
    ...providerEffects,
    planAgentsRuntimeBootstrap(snapshot.runtime.runtimeStub),
  ];
}

function planAdoptInitInfrastructure(
  config: PointersConfig,
  snapshot: ProvisioningOperationSnapshot,
  options: Pick<PlanProvisioningOperationOptions, "force" | "forcePrettier" | "install">
): ProvisioningEffect[] {
  const prettierOptions: PlanPrettierOptions = {
    enabled: config.features.includes("prettier"),
    force: options.force,
    forcePrettier: options.forcePrettier,
  };
  const huskyOptions: PlanHuskyOptions = {
    enabled: config.features.includes("husky"),
    force: options.force,
  };
  const huskySnapshot: HuskySnapshot = {
    ...snapshot.husky,
    packageJson: shouldApplyPrettierBaseline(snapshot.prettier, prettierOptions)
      ? mergePrettierPackageJson(snapshot.prettier.packageJson)
      : snapshot.husky.packageJson,
  };

  const effects: ProvisioningEffect[] = [
    planGitattributes(snapshot.guidance.gitattributes.baseline),
    ...planPrettier(snapshot.prettier, prettierOptions),
    ...planHusky(huskySnapshot, huskyOptions),
    ...planCi(snapshot.ci, {
      enabled: config.features.includes("ci"),
      force: options.force,
    }),
  ];

  effects.push(
    ...planInstall(snapshot.install, {
      enabled: options.install,
      dependencyNames: collectInstallDependencyNames(snapshot, {
        prettier: prettierOptions,
        husky: huskyOptions,
      }),
    })
  );

  return effects;
}

function collectInstallDependencyNames(
  snapshot: ProvisioningOperationSnapshot,
  options: { readonly prettier: PlanPrettierOptions; readonly husky: PlanHuskyOptions }
): string[] {
  const dependencies: string[] = [];

  if (shouldApplyPrettierBaseline(snapshot.prettier, options.prettier)) {
    dependencies.push(
      ...detectNewDevDeps(
        snapshot.prettier.packageJson,
        mergePrettierPackageJson(snapshot.prettier.packageJson)
      )
    );
  }

  if (options.husky.enabled && snapshot.husky.packageJson) {
    dependencies.push(
      ...detectNewDevDeps(
        snapshot.husky.packageJson,
        mergeHuskyPackageJson(snapshot.husky.packageJson)
      )
    );
  }

  return [...new Set(dependencies)];
}

function shouldApplyPrettierBaseline(
  snapshot: PrettierSnapshot,
  options: PlanPrettierOptions
): snapshot is PrettierSnapshot & { readonly packageJson: PackageJsonObject } {
  if (!options.enabled || !snapshot.packageJson) {
    return false;
  }

  const forcePrettier = options.force || options.forcePrettier;
  return !snapshot.formatterContext.shouldSkipPrettier || forcePrettier;
}
