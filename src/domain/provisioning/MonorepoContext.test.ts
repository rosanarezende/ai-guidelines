import { detectMonorepoContext } from "./MonorepoContext.js";

describe("domain/provisioning/MonorepoContext (paridade com package-context legado)", () => {
  it("detecta workspaces npm/yarn/bun em package.json", () => {
    expect(
      detectMonorepoContext({
        packageJson: { name: "demo", workspaces: ["packages/*"] },
        hasPnpmWorkspace: false,
      })
    ).toEqual({
      detected: true,
      flavor: "npm-yarn-bun",
      source: "package.json#workspaces",
    });

    expect(
      detectMonorepoContext({
        packageJson: { name: "demo", workspaces: { packages: ["apps/*"] } },
        hasPnpmWorkspace: false,
      })
    ).toMatchObject({ detected: true, flavor: "npm-yarn-bun" });
  });

  it("detecta pnpm-workspace.yaml quando não há workspaces em package.json", () => {
    expect(
      detectMonorepoContext({
        packageJson: { name: "demo" },
        hasPnpmWorkspace: true,
      })
    ).toEqual({
      detected: true,
      flavor: "pnpm",
      source: "pnpm-workspace.yaml",
    });
  });

  it("retorna ausência de monorepo sem sinais", () => {
    expect(
      detectMonorepoContext({
        packageJson: { name: "demo" },
        hasPnpmWorkspace: false,
      })
    ).toEqual({ detected: false, flavor: null, source: null });
  });
});
