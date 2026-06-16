import { RegistryCommandDescriptor } from "../../cli/registry/describeCommands.js";
import { GovernanceError } from "../../domain/shared/errors.js";
import { NpmScriptContract, NpmScriptSurfaceResolver } from "./NpmScriptSurfaceResolver.js";
import { RegistryCommandSurfaceResolver } from "./RegistryCommandSurfaceResolver.js";
import { SurfaceResolverRegistry } from "./SurfaceResolver.js";

const SCRIPTS: NpmScriptContract[] = [
  { name: "gate-decidability:check", command: "node a", category: "governance", mutates: false },
  { name: "script-contracts:check", command: "node b", category: "governance", mutates: false },
  { name: "review:publish", command: "node c", category: "governance", mutates: true },
];

const COMMANDS: RegistryCommandDescriptor[] = [
  { name: "workflow", subcommands: ["publish-state"] },
  { name: "handoff", subcommands: [] },
];

function fullResolver(): SurfaceResolverRegistry {
  return new SurfaceResolverRegistry([
    new NpmScriptSurfaceResolver(SCRIPTS),
    new RegistryCommandSurfaceResolver(COMMANDS),
  ]);
}

function code(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    return e instanceof GovernanceError ? e.code : `NON_GOV:${String(e)}`;
  }
  throw new Error("esperava lançar, mas resolveu");
}

describe("Surface resolvers [BR-CO-ENFORCEMENT-RESOLVE]", () => {
  it("[19] npm-script existente resolve (mutates/source/metadata derivados)", () => {
    const r = fullResolver().resolve("npm-script:review:publish");
    expect(r).toMatchObject({
      namespace: "npm-script",
      name: "review:publish",
      mutates: true,
      source: ".core/governance/script-contracts.yml",
    });
    expect(r.observableClass).toBeUndefined(); // npm-script: classe não derivável (limitação declarada)
  });

  it("[20] npm-script inexistente falha", () => {
    expect(code(() => fullResolver().resolve("npm-script:nao-existe"))).toBe("SURFACE_NOT_FOUND");
  });

  it("[21] registry-command existente resolve com classe observável event", () => {
    const r = fullResolver().resolve("registry-command:workflow/publish-state");
    expect(r).toMatchObject({
      namespace: "registry-command",
      name: "workflow/publish-state",
      observableClass: "event",
      source: "CommandRegistry",
    });
  });

  it("[22] registry-command inexistente (comando e subcomando) falha", () => {
    expect(code(() => fullResolver().resolve("registry-command:naoexiste/x"))).toBe(
      "SURFACE_NOT_FOUND"
    );
    expect(code(() => fullResolver().resolve("registry-command:workflow/naoexiste"))).toBe(
      "SURFACE_NOT_FOUND"
    );
  });

  it("[23] workflow/publish-state resolve pelo registry (não por script-contracts)", () => {
    const r = fullResolver().resolve("registry-command:workflow/publish-state");
    expect(r.source).toBe("CommandRegistry");
    expect(r.metadata).toEqual({ command: "workflow", subcommand: "publish-state" });
  });

  it("[24] dispatcher só com npm-script falha em workflow/publish-state", () => {
    const onlyNpm = new SurfaceResolverRegistry([new NpmScriptSurfaceResolver(SCRIPTS)]);
    expect(code(() => onlyNpm.resolve("registry-command:workflow/publish-state"))).toBe(
      "SURFACE_RESOLVER_ABSENT"
    );
  });

  it("[25] namespace ausente falha", () => {
    expect(code(() => fullResolver().resolve("gate-decidability-check"))).toBe(
      "SURFACE_NAMESPACE_MISSING"
    );
  });

  it("[26] namespace não-suportado falha", () => {
    expect(code(() => fullResolver().resolve("hook:pre-push"))).toBe(
      "SURFACE_NAMESPACE_UNSUPPORTED"
    );
  });
});
