import type { WorkSourceKind } from "@demo/backend/domain";
import type { SourceScenarioId } from "./sourceFlow";

export type SourcesCopy = {
  title: string;
  lead: string;
  scopeTitle: string;
  scopeBody: string;
  scopeItems: string[];
  listTitle: string;
  empty: string;
  addTitle: string;
  addLead: string;
  kindLabel: string;
  labelLabel: string;
  pathLabel: string;
  pathRequired: string;
  pathOptional: string;
  pathScopeWarning: string;
  labelHelp: string;
  manualPathTitle: string;
  manualPathBody: string;
  manualPathOpen: string;
  manualPathClose: string;
  urlTitle: string;
  urlBody: string;
  urlLabel: string;
  urlHelp: string;
  browserPickTitle: string;
  browserPickCta: string;
  browserPickHelp: string;
  browserPickUnsupported: string;
  browserSnapshotReady: string;
  browserSnapshotCta: string;
  githubTitle: string;
  githubBody: string;
  githubCta: string;
  addCta: string;
  addAndScanCta: string;
  scan: string;
  scanning: string;
  status: string;
  trust: string;
  scanHash: string;
  scanFiles: string;
  gitHead: string;
  gitDirtyFiles: string;
  cloudSync: string;
  lastScan: string;
  errorsTitle: string;
  limitationsTitle: string;
  successAdded: string;
  successScanned: string;
  error: string;
  kinds: Record<string, string>;
  statusLabels: Record<string, string>;
  trustLabels: Record<string, string>;
  flow: {
    localTitle: string;
    localBody: string;
    cloudTitle: string;
    cloudBody: string;
    localQuestion: string;
    cloudQuestion: string;
  };
  scenarios: Record<
    SourceScenarioId,
    {
      title: string;
      body: string;
      guidance: string;
      proof: string;
      declaredHelp: string;
    }
  >;
  kindHelp: Record<
    string,
    {
      title: string;
      body: string;
      pathHint: string;
      proof: string;
    }
  >;
};

export type AddSourceInput = {
  kind: WorkSourceKind;
  label: string;
  pathOrUrl?: string;
  scanAfterCreate: boolean;
  browserScan?: {
    fileCount: number;
    contentHash: string;
  };
};
