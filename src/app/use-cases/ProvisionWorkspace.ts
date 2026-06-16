/**
 * Use case: provisiona o workspace do consumidor (init/adopt/update) — computa o
 * plano PURO de efeitos e o aplica via {@link ../ports/ProvisioningFileSystem}.
 *
 * Espelha {@link ./AdoptWorkspace}: o domínio decide (plano puro), o use case
 * aplica (port). Migração Spec 0024 · CO-3.5 (colapso integral do runtime CLI).
 *
 * **Escopo Passo 1b:** aplica o grupo `pointers` (config.json + provider
 * entrypoints + prune) — o núcleo compartilhado por init/adopt/update e a
 * totalidade do ex-`providers` (absorvido em `update --providers`). Os demais
 * grupos de efeitos (AGENTS.md runtime, mirror de templates, gitattributes,
 * features opt-in, install) entram pelo mesmo `applyEffects` no Passo 2.
 *
 * Aditivo: NÃO está conectado ao caminho ativo (BootstrapCommand segue no
 * runtime legado `/cli` até o flip do Passo 4).
 */
import path from "node:path";
import {
  CURSOR_FRONTMATTER,
  describeManagedAction,
} from "../../domain/provisioning/ProviderEntrypoints.js";
import { applyManagedBlock } from "../../domain/provisioning/ManagedBlock.js";
import { mergeGitattributesContent } from "../../domain/provisioning/MergePolicies.js";
import { assertInitSafe } from "../../domain/provisioning/InitGuard.js";
import {
  describeTemplateTransition,
  parseTemplateMetadata,
} from "../../domain/provisioning/TemplateMetadata.js";
import {
  PlanPointersOptions,
  PointersConfig,
  ProvisioningEffect,
  ProvisioningOperation,
  ProvisioningOperationSnapshot,
  PlanProvisioningOperationOptions,
  planPointers,
  planProvisioningOperation,
} from "../../domain/provisioning/ProvisioningPlan.js";
import { mergeAgentsContent } from "../services/AgentsRuntimeBootstrap.js";
import { ProvisioningFileSystem } from "../ports/ProvisioningFileSystem.js";
import { ProcessRunner } from "../ports/ProcessRunner.js";

export interface ProvisionWorkspaceInput {
  readonly config: PointersConfig;
  /** Regras compiladas por adapter (produzidas pela infraestrutura). */
  readonly adapterRulesByName: Readonly<Record<string, string>>;
  readonly force: boolean;
  readonly prune: boolean;
}

export interface ProvisionWorkspaceOperationInput {
  readonly operation: ProvisioningOperation;
  readonly targetDir: string;
  readonly projectName: string;
  readonly config: PointersConfig;
  /** Regras compiladas por adapter (produzidas pela infraestrutura). */
  readonly adapterRulesByName: Readonly<Record<string, string>>;
  readonly snapshot: ProvisioningOperationSnapshot;
  readonly force: boolean;
  readonly forcePrettier: boolean;
  readonly prune: boolean;
  readonly install: boolean;
  readonly providersRequested: boolean;
}

export interface ProvisionResult {
  /** Log de ações na ordem de aplicação (paridade com o `actions[]` do legado). */
  readonly actions: readonly string[];
  /** True quando o plano era inteiramente no-op (idempotência). */
  readonly idempotentNoop: boolean;
}

export class ProvisionWorkspace {
  constructor(
    private readonly fs: ProvisioningFileSystem,
    private readonly dryRun: boolean,
    private readonly processRunner: ProcessRunner | null = null
  ) {}

  async execute(input: ProvisionWorkspaceInput): Promise<ProvisionResult> {
    const options: PlanPointersOptions = { force: input.force, prune: input.prune };
    const effects = planPointers(input.config, input.adapterRulesByName, options);
    return this.applyEffects(effects);
  }

  async executeOperation(input: ProvisionWorkspaceOperationInput): Promise<ProvisionResult> {
    const options: PlanProvisioningOperationOptions = {
      operation: input.operation,
      force: input.force,
      forcePrettier: input.forcePrettier,
      prune: input.prune,
      install: input.install,
      providersRequested: input.providersRequested,
    };
    const effects = planProvisioningOperation(
      {
        targetDir: input.targetDir,
        projectName: input.projectName,
        config: input.config,
        adapterRulesByName: input.adapterRulesByName,
      },
      input.snapshot,
      options
    );
    return this.applyEffects(effects);
  }

  /** Aplica uma lista de efeitos já computada (puro → IO). */
  async applyEffects(effects: readonly ProvisioningEffect[]): Promise<ProvisionResult> {
    const actions: string[] = [];

    for (const effect of effects) {
      switch (effect.kind) {
        case "write-config":
          await this.applyWriteConfig(effect.relPath, effect.content, actions);
          break;
        case "agents-runtime-bootstrap":
          await this.applyAgentsRuntimeBootstrap(effect.relPath, effect.runtimeStub, actions);
          break;
        case "sync-templates":
          actions.push(effect.message);
          break;
        case "mirror-template":
          await this.applyMirrorTemplate(effect, actions);
          break;
        case "prune-template":
          await this.applyPrune(effect.relPath, actions);
          break;
        case "managed-entrypoint":
          await this.applyManagedEntrypoint(effect, actions);
          break;
        case "prune-managed":
          await this.applyPrune(effect.relPath, actions);
          break;
        case "merge-gitattributes":
          await this.applyMergeGitattributes(effect.relPath, effect.baseline, actions);
          break;
        case "write-package-json":
          await this.applyWriteText(effect.relPath, effect.content, effect.reason, actions);
          break;
        case "write-prettierignore":
          await this.applyWriteText(effect.relPath, effect.content, "prettier baseline", actions);
          break;
        case "write-husky-hook":
          await this.applyWriteText(
            effect.relPath,
            effect.content,
            `husky ${effect.hookName}`,
            actions
          );
          break;
        case "mark-executable":
          await this.applyMarkExecutable(effect.relPath, actions);
          break;
        case "write-ci-workflow":
          await this.applyWriteText(effect.relPath, effect.content, "CI baseline", actions);
          break;
        case "install-dependencies":
          await this.applyInstall(effect, actions);
          break;
        case "assert-init-safe":
          // Guard de pré-condição: a DECISÃO é pura (domínio); o use case só a
          // invoca. Lança antes de qualquer escrita quando há conflito sem force.
          assertInitSafe(effect.conflicts, effect.force);
          break;
        case "guidance":
          actions.push(effect.message);
          break;
      }
    }

    return { actions, idempotentNoop: actions.length === 0 };
  }

  private async applyWriteConfig(
    relPath: string,
    content: string,
    actions: string[]
  ): Promise<void> {
    const current = await this.fs.readText(relPath);
    if (current === content) {
      return;
    }
    actions.push(`${this.dryRun ? "[dry-run] " : ""}write ${relPath}`);
    if (!this.dryRun) {
      await this.fs.ensureDir(path.dirname(relPath));
      await this.fs.writeText(relPath, content);
    }
  }

  private async applyAgentsRuntimeBootstrap(
    relPath: "AGENTS.md",
    runtimeStub: string,
    actions: string[]
  ): Promise<void> {
    const current = await this.fs.readText(relPath);
    const next = mergeAgentsContent(current ?? "", runtimeStub);
    if (next === current) {
      return;
    }

    actions.push(
      `${this.dryRun ? "[dry-run] " : ""}write ${relPath} (ai-guidelines runtime updated)`
    );
    if (!this.dryRun) {
      await this.fs.ensureDir(path.dirname(relPath));
      await this.fs.writeText(relPath, next);
    }
  }

  private async applyMirrorTemplate(
    effect: Extract<ProvisioningEffect, { kind: "mirror-template" }>,
    actions: string[]
  ): Promise<void> {
    const current = await this.fs.readText(effect.relPath);
    if (current === effect.content) {
      return;
    }

    const transition = describeTemplateTransition(
      parseTemplateMetadata(effect.content),
      parseTemplateMetadata(current)
    );
    const originTag = effect.origin === "engine" ? " [engine]" : "";
    const suffix = transition ? ` (${transition})` : "";
    actions.push(`${this.dryRun ? "[dry-run] " : ""}write ${effect.relPath}${originTag}${suffix}`);

    if (!this.dryRun) {
      await this.fs.ensureDir(path.dirname(effect.relPath));
      await this.fs.writeText(effect.relPath, effect.content);
    }
  }

  private async applyManagedEntrypoint(
    effect: Extract<ProvisioningEffect, { kind: "managed-entrypoint" }>,
    actions: string[]
  ): Promise<void> {
    const current = await this.fs.readText(effect.relPath);
    const result = applyManagedBlock(current, effect.inner, {
      syntax: effect.syntax,
      force: effect.force,
    });

    if (!result.content) {
      return;
    }

    const finalContent =
      effect.cursorFrontmatter && result.state === "created"
        ? `${CURSOR_FRONTMATTER}\n\n${result.content}`
        : result.content;

    const action = describeManagedAction(result.state, effect.relPath, this.dryRun);
    if (action) {
      actions.push(action);
    }

    if (!this.dryRun) {
      await this.fs.ensureDir(path.dirname(effect.relPath));
      await this.fs.writeText(effect.relPath, finalContent);
    }
  }

  private async applyPrune(relPath: string, actions: string[]): Promise<void> {
    if (!(await this.fs.exists(relPath))) {
      return;
    }
    actions.push(`${this.dryRun ? "[dry-run] " : ""}prune ${relPath}`);
    if (!this.dryRun) {
      await this.fs.remove(relPath);
    }
  }

  private async applyMergeGitattributes(
    relPath: string,
    baseline: string,
    actions: string[]
  ): Promise<void> {
    const current = await this.fs.readText(relPath);
    const merged = mergeGitattributesContent(current, baseline);
    if (merged === current) {
      return;
    }
    actions.push(
      `${this.dryRun ? "[dry-run] " : ""}write ${path.basename(relPath)} (baseline sync)`
    );
    if (!this.dryRun) {
      await this.fs.ensureDir(path.dirname(relPath));
      await this.fs.writeText(relPath, merged);
    }
  }

  private async applyWriteText(
    relPath: string,
    content: string,
    reason: string,
    actions: string[]
  ): Promise<void> {
    const current = await this.fs.readText(relPath);
    if (current === content) {
      return;
    }
    actions.push(`${this.dryRun ? "[dry-run] " : ""}write ${relPath} (${reason})`);
    if (!this.dryRun) {
      await this.fs.ensureDir(path.dirname(relPath));
      await this.fs.writeText(relPath, content);
    }
  }

  private async applyMarkExecutable(relPath: string, actions: string[]): Promise<void> {
    actions.push(`${this.dryRun ? "[dry-run] " : ""}mark executable ${relPath}`);
    if (this.dryRun) {
      return;
    }
    if (!this.processRunner) {
      throw new Error(`ProcessRunner ausente para marcar ${relPath} como executável.`);
    }
    await this.processRunner.markExecutable(this.fs.resolvePath(relPath));
  }

  private async applyInstall(
    effect: Extract<ProvisioningEffect, { kind: "install-dependencies" }>,
    actions: string[]
  ): Promise<void> {
    actions.push(
      `${this.dryRun ? "[dry-run] " : ""}install ${effect.dependencies.join(
        ", "
      )} (novas dependências detectadas)`
    );
    if (this.dryRun) {
      return;
    }
    if (effect.blockedReason) {
      throw new Error(effect.blockedReason);
    }
    if (!this.processRunner) {
      throw new Error(`ProcessRunner ausente para executar install: ${effect.command}`);
    }

    const cwd = this.fs.resolvePath(".");
    try {
      await this.processRunner.runInstall({ cwd, command: effect.command });
    } catch (error) {
      throw new Error(
        `Falha ao executar install (${effect.command}) em ${cwd}: ${(error as Error).message}`
      );
    }
  }
}
