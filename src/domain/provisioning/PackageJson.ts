export type PackageJsonObject = Record<string, unknown>;

function asObject(value: unknown): PackageJsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as PackageJsonObject) }
    : {};
}

export function serializePackageJson(packageJson: PackageJsonObject): string {
  return `${JSON.stringify(packageJson, null, 2)}\n`;
}

export function hasDependency(
  packageJson: PackageJsonObject | null,
  dependencyName: string
): boolean {
  if (!packageJson) {
    return false;
  }

  const dependencies = asObject(packageJson.dependencies);
  const devDependencies = asObject(packageJson.devDependencies);
  return Boolean(dependencies[dependencyName] || devDependencies[dependencyName]);
}

export function hasScriptToken(packageJson: PackageJsonObject | null, tokenRegex: RegExp): boolean {
  if (!packageJson) {
    return false;
  }

  const scripts = asObject(packageJson.scripts);
  return Object.values(scripts).some(
    (script) => typeof script === "string" && tokenRegex.test(script)
  );
}

export function mergePrettierPackageJson(
  existingPackageJson: PackageJsonObject
): PackageJsonObject {
  const packageJson: PackageJsonObject = { ...existingPackageJson };
  const scripts = asObject(packageJson.scripts);
  const devDependencies = asObject(packageJson.devDependencies);

  if (!scripts.format) {
    scripts.format = "prettier --write .";
  }
  if (!devDependencies.prettier) {
    devDependencies.prettier = "^3.0.0";
  }

  packageJson.scripts = scripts;
  packageJson.devDependencies = devDependencies;
  return packageJson;
}

export function detectNewDevDeps(
  existingPackageJson: PackageJsonObject,
  mergedPackageJson: PackageJsonObject
): string[] {
  const before = new Set(Object.keys(asObject(existingPackageJson.devDependencies)));
  return Object.keys(asObject(mergedPackageJson.devDependencies)).filter((dep) => !before.has(dep));
}
