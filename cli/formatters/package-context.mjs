import path from "node:path";
import { fileExists, readTextIfExists } from "#core/file-system";

const DEFAULT_YARN_BERRY_VERSION = "4.1.1";

export function sanitizePackageName(projectName) {
  return (
    projectName
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "ai-first-project"
  );
}

export function parseVersion(rawValue) {
  if (!rawValue) {
    return null;
  }

  const [, version] = rawValue.split("@", 2);
  return version ?? null;
}

export function normalizePackageManager(rawValue) {
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
    const version = parseVersion(rawValue);

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

export async function detectPackageManager(targetDir, explicitValue, packageJson) {
  const explicit = explicitValue ?? packageJson?.packageManager ?? null;

  if (explicit) {
    return normalizePackageManager(explicit);
  }

  if (await fileExists(path.join(targetDir, "pnpm-lock.yaml"))) {
    return normalizePackageManager("pnpm");
  }

  if (await fileExists(path.join(targetDir, "package-lock.json"))) {
    return normalizePackageManager("npm");
  }

  if (await fileExists(path.join(targetDir, "yarn.lock"))) {
    const lockContent = await readTextIfExists(path.join(targetDir, "yarn.lock"));
    const isClassic = lockContent?.includes("# yarn lockfile v1");
    if (isClassic) {
      return normalizePackageManager("yarn@1.22.22");
    }

    // Se não é clássico e não tem campo packageManager, mas tem .yarnrc.yml, é Berry
    if (await fileExists(path.join(targetDir, ".yarnrc.yml"))) {
      return normalizePackageManager("yarn@4.1.1");
    }

    return normalizePackageManager(packageJson?.packageManager ?? "yarn");
  }

  return normalizePackageManager("npm");
}

export function hasDependency(packageJson, dependencyName) {
  return Boolean(
    packageJson?.dependencies?.[dependencyName] || packageJson?.devDependencies?.[dependencyName]
  );
}

export function hasScriptToken(packageJson, tokenRegex) {
  const scripts = packageJson?.scripts ?? {};
  return Object.values(scripts).some(
    (script) => typeof script === "string" && tokenRegex.test(script)
  );
}

export async function detectFormatterContext(targetDir, packageJson) {
  const formatters = [
    {
      id: "biome",
      label: "Biome",
      files: ["biome.json", "biome.jsonc"],
      deps: ["@biomejs/biome", "biome"],
      scriptRegex: /\bbiome\b/i,
    },
    {
      id: "dprint",
      label: "dprint",
      files: ["dprint.json", "dprint.jsonc", ".dprint.json"],
      deps: ["dprint"],
      scriptRegex: /\bdprint\b/i,
    },
    {
      id: "rome",
      label: "Rome",
      files: ["rome.json", ".romerc", ".romerc.json", ".romerc.js"],
      deps: ["rome"],
      scriptRegex: /\brome\b/i,
    },
    {
      id: "standard",
      label: "Standard.js",
      files: [".standardrc", ".standard.json"],
      deps: ["standard"],
      scriptRegex: /\bstandard\b/i,
    },
  ];

  let rival = null;
  for (const formatter of formatters) {
    let detected = false;

    for (const configFile of formatter.files) {
      if (await fileExists(path.join(targetDir, configFile))) {
        detected = true;
        break;
      }
    }

    if (!detected && formatter.deps.some((dep) => hasDependency(packageJson, dep))) {
      detected = true;
    }

    if (!detected && hasScriptToken(packageJson, formatter.scriptRegex)) {
      detected = true;
    }

    if (detected) {
      rival = formatter;
      break;
    }
  }

  const prettierConfigFiles = [
    ".prettierrc",
    ".prettierrc.json",
    ".prettierrc.yml",
    ".prettierrc.yaml",
    ".prettierrc.js",
    "prettier.config.js",
    "prettier.config.cjs",
    "prettier.config.mjs",
    ".prettierignore",
  ];

  let hasPrettierConfig = false;
  for (const configFile of prettierConfigFiles) {
    if (await fileExists(path.join(targetDir, configFile))) {
      hasPrettierConfig = true;
      break;
    }
  }

  const hasPrettier =
    hasDependency(packageJson, "prettier") ||
    hasPrettierConfig ||
    hasScriptToken(packageJson, /\bprettier\b/i);

  return {
    rival,
    hasPrettier,
    shouldSkipPrettier: Boolean(rival && !hasPrettier),
  };
}

export function packageHasPrettierSignals(packageJson) {
  return hasDependency(packageJson, "prettier") || hasScriptToken(packageJson, /\bprettier\b/i);
}

export async function detectMonorepoContext(targetDir, packageJson) {
  const workspacesField = packageJson?.workspaces;
  const hasNpmYarnWorkspaces =
    Array.isArray(workspacesField) ||
    (workspacesField &&
      typeof workspacesField === "object" &&
      Array.isArray(workspacesField.packages));

  if (hasNpmYarnWorkspaces) {
    return { detected: true, flavor: "npm-yarn-bun", source: "package.json#workspaces" };
  }

  if (await fileExists(path.join(targetDir, "pnpm-workspace.yaml"))) {
    return { detected: true, flavor: "pnpm", source: "pnpm-workspace.yaml" };
  }

  return { detected: false, flavor: null, source: null };
}

export function resolveCommandNames(packageJson) {
  const scripts = packageJson?.scripts ?? {};

  const formatCommand = scripts.format ? "format" : null;
  let checkCommand = null;

  if (scripts.check) {
    checkCommand = "check";
  } else if (scripts["format:check"]) {
    checkCommand = "format:check";
  }

  return { formatCommand, checkCommand };
}

export function createBaselinePackageJson(projectName, packageManager) {
  const packageJson = {
    name: sanitizePackageName(projectName),
    version: "0.1.0",
    private: true,
  };

  if (packageManager.packageManagerField) {
    packageJson.packageManager = packageManager.packageManagerField;
  }

  return packageJson;
}

export function mergePackageJson(existingPkg, mode, options = {}) {
  const { features = [], packageManager } = options;
  const newPkg = { ...existingPkg };

  if (!newPkg.scripts) newPkg.scripts = {};
  if (!newPkg.devDependencies) newPkg.devDependencies = {};

  if (features.includes("prettier")) {
    if (!newPkg.scripts.format) {
      newPkg.scripts.format = "prettier --write .";
    }
    if (!newPkg.devDependencies.prettier) {
      newPkg.devDependencies.prettier = "^3.0.0";
    }
  }

  if (features.includes("husky")) {
    if (!newPkg.scripts.prepare) {
      newPkg.scripts.prepare = "husky";
    }
    if (!newPkg.devDependencies.husky) {
      newPkg.devDependencies.husky = "^9.0.0";
    }
  }

  if (packageManager?.packageManagerField && !newPkg.packageManager) {
    newPkg.packageManager = packageManager.packageManagerField;
  }

  return { packageJson: newPkg };
}

export function resolveInstallCommand(packageManager) {
  switch (packageManager.id) {
    case "npm":
      return "npm ci";
    case "pnpm":
      return "pnpm install --frozen-lockfile";
    case "yarn-classic":
      return "yarn install --frozen-lockfile";
    case "yarn-berry":
      return "yarn install --immutable";
    default:
      throw new Error(`Package manager não suportado: ${packageManager.id}`);
  }
}

export function resolveCiRunner(packageManager) {
  switch (packageManager.id) {
    case "npm":
      return "npm run";
    case "pnpm":
      return "pnpm";
    case "yarn-classic":
    case "yarn-berry":
      return "yarn";
    default:
      throw new Error(`Package manager não suportado: ${packageManager.id}`);
  }
}

export function resolveAddDevDependencyCommand(packageManager, dependencyName) {
  switch (packageManager.id) {
    case "npm":
      return `npm install --save-dev ${dependencyName}`;
    case "pnpm":
      return `pnpm add --save-dev ${dependencyName}`;
    case "yarn-classic":
    case "yarn-berry":
      return `yarn add --dev ${dependencyName}`;
    default:
      throw new Error(`Package manager não suportado: ${packageManager.id}`);
  }
}

export function resolveLocalInstallCommand(packageManager) {
  switch (packageManager.id) {
    case "npm":
      return { cmd: "npm", args: ["install"] };
    case "pnpm":
      return { cmd: "pnpm", args: ["install"] };
    case "yarn-classic":
      return { cmd: "yarn", args: ["install"] };
    case "yarn-berry": {
      const version = parseVersion(packageManager.packageManagerField);
      return { cmd: "node", args: [`.yarn/releases/yarn-${version}.cjs`, "install"] };
    }
    default:
      throw new Error(`Package manager não suportado: ${packageManager.id}`);
  }
}

export function detectNewDevDeps(existingPackageJson, mergedPackageJson) {
  const before = new Set(Object.keys(existingPackageJson?.devDependencies ?? {}));
  return Object.keys(mergedPackageJson?.devDependencies ?? {}).filter((dep) => !before.has(dep));
}
