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
  PlanPointersOptions,
  PointersConfig,
  ProvisioningEffect,
  planPointers,
} from "../../domain/provisioning/ProvisioningPlan.js";
import { ProvisioningFileSystem } from "../ports/ProvisioningFileSystem.js";

export interface ProvisionWorkspaceInput {
  readonly config: PointersConfig;
  /** Regras compiladas por adapter (produzidas pela infraestrutura). */
  readonly adapterRulesByName: Readonly<Record<string, string>>;
  readonly force: boolean;
  readonly prune: boolean;
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
    private readonly dryRun: boolean
  ) {}

  async execute(input: ProvisionWorkspaceInput): Promise<ProvisionResult> {
    const options: PlanPointersOptions = { force: input.force, prune: input.prune };
    const effects = planPointers(input.config, input.adapterRulesByName, options);
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
        case "managed-entrypoint":
          await this.applyManagedEntrypoint(effect, actions);
          break;
        case "prune-managed":
          await this.applyPrune(effect.relPath, actions);
          break;
        case "merge-gitattributes":
          await this.applyMergeGitattributes(effect.relPath, effect.baseline, actions);
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
}
