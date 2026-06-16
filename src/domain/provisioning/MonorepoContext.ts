import type { PackageJsonObject } from "./PackageJson.js";

export type MonorepoFlavor = "npm-yarn-bun" | "pnpm";

export interface MonorepoContextSnapshot {
  readonly detected: boolean;
  readonly flavor: MonorepoFlavor | null;
  readonly source: string | null;
}

export interface MonorepoContextInput {
  readonly packageJson: PackageJsonObject | null;
  readonly hasPnpmWorkspace: boolean;
}

export function detectMonorepoContext(input: MonorepoContextInput): MonorepoContextSnapshot {
  const workspacesField = input.packageJson?.workspaces;
  const hasNpmYarnWorkspaces =
    Array.isArray(workspacesField) ||
    (Boolean(workspacesField) &&
      typeof workspacesField === "object" &&
      Array.isArray((workspacesField as { readonly packages?: unknown }).packages));

  if (hasNpmYarnWorkspaces) {
    return { detected: true, flavor: "npm-yarn-bun", source: "package.json#workspaces" };
  }

  if (input.hasPnpmWorkspace) {
    return { detected: true, flavor: "pnpm", source: "pnpm-workspace.yaml" };
  }

  return { detected: false, flavor: null, source: null };
}
