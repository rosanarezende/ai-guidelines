import * as path from "node:path";
import { analyzeBudget } from "../../../app/services/TokenBudget.js";
import { compileAdapterRulesByName } from "../../../app/services/RulesRuntimeCompiler.js";
import { loadConsumerConfig } from "../../../app/use-cases/loadConsumerConfig.js";
import { ProvisionWorkspace } from "../../../app/use-cases/ProvisionWorkspace.js";
import { JsonRulesCatalogSource } from "../../../infrastructure/json/JsonRulesCatalogSource.js";
import { NodeProcessRunner } from "../../../infrastructure/process/NodeProcessRunner.js";
import { NodeProvisioningFileSystem } from "../../../infrastructure/filesystem/NodeProvisioningFileSystem.js";
import { NodeProvisioningSnapshotSource } from "../../../infrastructure/filesystem/NodeProvisioningSnapshotSource.js";
import { deriveAdaptersFromProviders } from "../../../domain/provisioning/ProviderCatalog.js";
import type { PointersConfig } from "../../../domain/provisioning/ProvisioningPlan.js";
import { BootstrapWizard, BootstrapWizardSnapshot } from "./wizard.js";
import { BootstrapDelivery, buildBootstrapDeliveryRegistry } from "./registry.js";
import {
  BootstrapDeliveryRuntime,
  CheckBudgetResult,
  CollectProvisioningSnapshotInput,
  CreateProvisionWorkspaceInput,
  ResolveProvisioningConfigInput,
} from "./runtime.js";

export class NodeBootstrapDeliveryRuntime implements BootstrapDeliveryRuntime {
  private readonly rulesCatalogSource: JsonRulesCatalogSource;
  private readonly snapshotSource: NodeProvisioningSnapshotSource;

  constructor(repoRoot: string) {
    this.rulesCatalogSource = new JsonRulesCatalogSource(
      path.join(repoRoot, ".core", "rules", "_meta", "rules.json")
    );
    this.snapshotSource = new NodeProvisioningSnapshotSource(repoRoot);
  }

  async resolveConfig(input: ResolveProvisioningConfigInput): Promise<PointersConfig> {
    return loadConsumerConfig(
      new NodeProvisioningFileSystem(input.targetDir),
      input.options,
      input.targetDir
    );
  }

  async collectSnapshot(input: CollectProvisioningSnapshotInput) {
    return this.snapshotSource.collect(input);
  }

  async compileAdapterRules(config: PointersConfig): Promise<Readonly<Record<string, string>>> {
    return compileAdapterRulesByName(this.rulesCatalogSource.load(), {
      includeAdapters: deriveAdaptersFromProviders(config.providers),
      optInFeatures: config.features,
      lang: config.lang,
    });
  }

  createProvisionWorkspace(input: CreateProvisionWorkspaceInput): ProvisionWorkspace {
    return new ProvisionWorkspace(
      new NodeProvisioningFileSystem(input.targetDir),
      input.dryRun,
      new NodeProcessRunner()
    );
  }

  async runCheckBudget(): Promise<CheckBudgetResult> {
    return { report: analyzeBudget(this.rulesCatalogSource.load()), exitCode: 0 };
  }
}

export function createBootstrapDelivery(
  repoRoot: string,
  wizardSnapshot: BootstrapWizardSnapshot | null = null
): BootstrapDelivery {
  const runtime = new NodeBootstrapDeliveryRuntime(repoRoot);
  const registry = buildBootstrapDeliveryRegistry(runtime);
  return new BootstrapDelivery(registry, new BootstrapWizard(registry, wizardSnapshot));
}
