import type {
  PointersConfig,
  ProvisioningOperationSnapshot,
} from "../../../domain/provisioning/ProvisioningPlan.js";
import type {
  ProvisionResult,
  ProvisionWorkspaceOperationInput,
} from "../../../app/use-cases/ProvisionWorkspace.js";
import type { ResolveConfigOptions } from "../../../domain/provisioning/ConsumerConfig.js";
import type { BudgetReport } from "../../../app/services/TokenBudget.js";

export interface ProvisionWorkspaceExecutor {
  executeOperation(input: ProvisionWorkspaceOperationInput): Promise<ProvisionResult>;
}

export interface ResolveProvisioningConfigInput {
  readonly targetDir: string;
  readonly options: ResolveConfigOptions;
}

export interface CollectProvisioningSnapshotInput {
  readonly targetDir: string;
  readonly sddDir: string;
  readonly packageManager?: string;
}

export interface CreateProvisionWorkspaceInput {
  readonly targetDir: string;
  readonly dryRun: boolean;
}

export interface BootstrapProvisioningRuntime {
  resolveConfig(input: ResolveProvisioningConfigInput): Promise<PointersConfig>;
  collectSnapshot(input: CollectProvisioningSnapshotInput): Promise<ProvisioningOperationSnapshot>;
  compileAdapterRules(config: PointersConfig): Promise<Readonly<Record<string, string>>>;
  createProvisionWorkspace(input: CreateProvisionWorkspaceInput): ProvisionWorkspaceExecutor;
}

export interface CheckBudgetResult {
  readonly report: BudgetReport;
  readonly exitCode: number;
}

export interface BootstrapDeliveryRuntime extends BootstrapProvisioningRuntime {
  runCheckBudget(): Promise<CheckBudgetResult>;
}
