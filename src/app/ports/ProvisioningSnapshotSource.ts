import type {
  CiSnapshot,
  InstallSnapshot,
  PrettierSnapshot,
  HuskySnapshot,
  TemplateMirrorSnapshot,
  RuntimeBootstrapSnapshot,
  InitGuardSnapshot,
} from "../../domain/provisioning/ProvisioningPlan.js";
import type { FinalGuidanceSnapshot } from "../../domain/provisioning/Guidance.js";

export interface ProvisioningSnapshotInput {
  readonly targetDir: string;
  readonly sddDir: string;
  readonly packageManager?: string;
  readonly requiredTemplateRelativePaths?: readonly string[];
}

export interface ProvisioningSnapshot {
  readonly initGuard: InitGuardSnapshot;
  readonly runtime: RuntimeBootstrapSnapshot;
  readonly templates: TemplateMirrorSnapshot;
  readonly prettier: PrettierSnapshot;
  readonly husky: HuskySnapshot;
  readonly ci: CiSnapshot;
  readonly install: InstallSnapshot;
  readonly guidance: FinalGuidanceSnapshot;
}

export interface ProvisioningSnapshotSource {
  collect(input: ProvisioningSnapshotInput): Promise<ProvisioningSnapshot>;
}
