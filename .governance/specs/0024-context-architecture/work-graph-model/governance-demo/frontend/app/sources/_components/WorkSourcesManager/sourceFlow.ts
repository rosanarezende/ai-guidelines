import type { WorkSourceKind } from "@demo/backend/domain";

export type SourceLocation = "local" | "cloud";

export type SourceScenarioId =
  | "local-git"
  | "local-folder"
  | "local-empty"
  | "cloud-sync"
  | "monorepo-module"
  | "github"
  | "external-link"
  | "manual-evidence";

export type SourceEntryMode = "browser-or-path" | "declared" | "url" | "integration";

export type SourceScenario = {
  id: SourceScenarioId;
  location: SourceLocation;
  kind: WorkSourceKind;
  mode: SourceEntryMode;
};

export const SOURCE_SCENARIOS: SourceScenario[] = [
  { id: "local-git", location: "local", kind: "git-repo", mode: "browser-or-path" },
  { id: "local-folder", location: "local", kind: "local-folder", mode: "browser-or-path" },
  { id: "local-empty", location: "local", kind: "local-folder", mode: "declared" },
  {
    id: "cloud-sync",
    location: "local",
    kind: "cloud-synced-folder",
    mode: "browser-or-path",
  },
  {
    id: "monorepo-module",
    location: "local",
    kind: "monorepo-module",
    mode: "browser-or-path",
  },
  { id: "github", location: "cloud", kind: "github", mode: "integration" },
  { id: "external-link", location: "cloud", kind: "external-link", mode: "url" },
  { id: "manual-evidence", location: "cloud", kind: "manual-upload", mode: "declared" },
];

export function scenariosFor(location: SourceLocation): SourceScenario[] {
  return SOURCE_SCENARIOS.filter((scenario) => scenario.location === location);
}

export function defaultScenario(location: SourceLocation): SourceScenario {
  return scenariosFor(location)[0] || SOURCE_SCENARIOS[0];
}

export function sourceScenario(id: SourceScenarioId): SourceScenario {
  return SOURCE_SCENARIOS.find((scenario) => scenario.id === id) || SOURCE_SCENARIOS[0];
}
