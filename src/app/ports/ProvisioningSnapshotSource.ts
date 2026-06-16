import type { TemplateMirrorSnapshot } from "../../domain/provisioning/ProvisioningPlan.js";

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
}

export interface ProvisioningSnapshotSource {
  collect(input: ProvisioningSnapshotInput): Promise<ProvisioningSnapshot>;
}
