import {
  detectPackageManager,
  normalizePackageManager,
  resolveCiRunner,
  resolveInstallCommand,
} from "./PackageManager.js";

describe("domain/provisioning/PackageManager (paridade com package-context legado)", () => {
  it("normaliza runners suportados", () => {
    expect(normalizePackageManager("npm")).toMatchObject({ id: "npm", runner: "npm run" });
    expect(normalizePackageManager("pnpm")).toMatchObject({ id: "pnpm", runner: "pnpm" });
    expect(normalizePackageManager("yarn@1.22.22")).toMatchObject({
      id: "yarn-classic",
      runner: "yarn",
    });
    expect(normalizePackageManager("yarn@4.1.1")).toMatchObject({
      id: "yarn-berry",
      runner: "node .yarn/releases/yarn-4.1.1.cjs",
    });
  });

  it("detecta package manager por campo packageManager e lockfiles", () => {
    expect(
      detectPackageManager({
        packageJson: { packageManager: "yarn@1.22.22" },
        hasPackageLock: true,
        hasPnpmLock: false,
        yarnLockContent: null,
        hasYarnRc: false,
      }).id
    ).toBe("yarn-classic");

    expect(
      detectPackageManager({
        packageJson: {},
        hasPackageLock: false,
        hasPnpmLock: true,
        yarnLockContent: null,
        hasYarnRc: false,
      }).id
    ).toBe("pnpm");
  });

  it("resolve comandos de install e check para CI", () => {
    const npm = normalizePackageManager("npm");
    expect(resolveInstallCommand(npm)).toBe("npm ci");
    expect(resolveCiRunner(npm)).toBe("npm run");

    const yarnBerry = normalizePackageManager("yarn@4.1.1");
    expect(resolveInstallCommand(yarnBerry)).toBe("yarn install --immutable");
    expect(resolveCiRunner(yarnBerry)).toBe("yarn");
  });
});
