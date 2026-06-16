import type {
  CiSnapshot,
  InstallSnapshot,
  PrettierSnapshot,
  HuskySnapshot,
  TemplateMirrorSnapshot,
} from "../../domain/provisioning/ProvisioningPlan.js";

export interface ProvisioningSnapshotInput {
  readonly targetDir: string;
  readonly sddDir: string;
  readonly requiredTemplateRelativePaths?: readonly string[];
}

export interface RuntimeBootstrapSnapshot {
  readonly runtimeStub: string;
}

export interface ProvisioningSnapshot {
  readonly runtime: RuntimeBootstrapSnapshot;
  readonly templates: TemplateMirrorSnapshot;
  readonly prettier: PrettierSnapshot;
  readonly husky: HuskySnapshot;
  readonly ci: CiSnapshot;
  readonly install: InstallSnapshot;
}

export interface ProvisioningSnapshotSource {
  collect(input: ProvisioningSnapshotInput): Promise<ProvisioningSnapshot>;
}
