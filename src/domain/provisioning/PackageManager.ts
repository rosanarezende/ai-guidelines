import { PackageJsonObject } from "./PackageJson.js";

export type PackageManagerId = "npm" | "pnpm" | "yarn-classic" | "yarn-berry";

export interface PackageManagerSnapshot {
  readonly id: PackageManagerId;
  readonly label: string;
  readonly runner: string;
  readonly packageManagerField: string | null;
}

export interface PackageManagerDetectionSnapshot {
  readonly explicitValue?: string | null;
  readonly packageJson: PackageJsonObject | null;
  readonly hasPnpmLock: boolean;
  readonly hasPackageLock: boolean;
  readonly yarnLockContent: string | null;
  readonly hasYarnRc: boolean;
}

const DEFAULT_YARN_BERRY_VERSION = "4.1.1";

export function parsePackageManagerVersion(rawValue: string | null | undefined): string | null {
  if (!rawValue) {
    return null;
  }

  const [, version] = rawValue.split("@", 2);
  return version ?? null;
}

export function normalizePackageManager(rawValue: string): PackageManagerSnapshot {
  const normalized = rawValue.trim().toLowerCase();

  if (normalized.startsWith("npm")) {
    return {
      id: "npm",
      label: normalized,
      runner: "npm run",
      packageManagerField: rawValue.includes("@") ? rawValue : null,
    };
  }

  if (normalized.startsWith("pnpm")) {
    return {
      id: "pnpm",
      label: normalized,
      runner: "pnpm",
      packageManagerField: rawValue.includes("@") ? rawValue : null,
    };
  }

  if (normalized.startsWith("yarn")) {
    const version = parsePackageManagerVersion(rawValue);

    if (version && version.startsWith("1.")) {
      return {
        id: "yarn-classic",
        label: rawValue,
        runner: "yarn",
        packageManagerField: rawValue,
      };
    }

    const resolvedVersion = version ?? DEFAULT_YARN_BERRY_VERSION;
    return {
      id: "yarn-berry",
      label: `yarn@${resolvedVersion}`,
      runner: `node .yarn/releases/yarn-${resolvedVersion}.cjs`,
      packageManagerField: `yarn@${resolvedVersion}`,
    };
  }

  throw new Error(`Package manager não suportado: ${rawValue}`);
}

export function detectPackageManager(
  snapshot: PackageManagerDetectionSnapshot
): PackageManagerSnapshot {
  const packageManagerField =
    typeof snapshot.packageJson?.packageManager === "string"
      ? snapshot.packageJson.packageManager
      : null;
  const explicit = snapshot.explicitValue ?? packageManagerField;

  if (explicit) {
    return normalizePackageManager(explicit);
  }

  if (snapshot.hasPnpmLock) {
    return normalizePackageManager("pnpm");
  }

  if (snapshot.hasPackageLock) {
    return normalizePackageManager("npm");
  }

  if (snapshot.yarnLockContent !== null) {
    if (snapshot.yarnLockContent.includes("# yarn lockfile v1")) {
      return normalizePackageManager("yarn@1.22.22");
    }

    if (snapshot.hasYarnRc) {
      return normalizePackageManager("yarn@4.1.1");
    }

    return normalizePackageManager(packageManagerField ?? "yarn");
  }

  return normalizePackageManager("npm");
}

export function resolveInstallCommand(packageManager: PackageManagerSnapshot): string {
  switch (packageManager.id) {
    case "npm":
      return "npm ci";
    case "pnpm":
      return "pnpm install --frozen-lockfile";
    case "yarn-classic":
      return "yarn install --frozen-lockfile";
    case "yarn-berry":
      return "yarn install --immutable";
  }
}

export function resolveCiRunner(packageManager: PackageManagerSnapshot): string {
  switch (packageManager.id) {
    case "npm":
      return "npm run";
    case "pnpm":
      return "pnpm";
    case "yarn-classic":
    case "yarn-berry":
      return "yarn";
  }
}
