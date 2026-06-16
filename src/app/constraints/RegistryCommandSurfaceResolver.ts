import { GovernanceError } from "../../domain/shared/errors.js";
import { formatSurfaceRef, SurfaceRef } from "../../domain/constraints/SurfaceRef.js";
import { RegistryCommandDescriptor } from "../../cli/registry/describeCommands.js";
import { ResolvedSurface, SurfaceResolver } from "./SurfaceResolver.js";

export const REGISTRY_COMMAND_SOURCE = "CommandRegistry";

/**
 * Resolve `registry-command:<comando>[/<subcomando>]` pelo `CommandRegistry`
 * real (via descriptors introspectados, sem executar o comando). Reconhece, no
 * mínimo, `registry-command:workflow/publish-state` — que NÃO existe em
 * `script-contracts.yml` (por isso o resolver de registry é necessário, não
 * fingido).
 *
 * **Classe observável = `event`**: uma invocação de comando é uma fronteira de
 * evento, nunca um estado contínuo. Logo `surface_class: state` para um
 * registry-command é factualmente incompatível (detectado em `compileConstraints`).
 */
export class RegistryCommandSurfaceResolver implements SurfaceResolver {
  readonly namespace = "registry-command" as const;
  private readonly byName: Map<string, RegistryCommandDescriptor>;

  constructor(commands: readonly RegistryCommandDescriptor[]) {
    this.byName = new Map(commands.map((c) => [c.name, c]));
  }

  resolve(ref: SurfaceRef): ResolvedSurface {
    const parts = ref.name.split("/");
    if (parts.length > 2 || parts.some((p) => p.trim().length === 0)) {
      throw new GovernanceError(
        "SURFACE_MALFORMED",
        `registry-command malformado: "${ref.name}" — esperado "<comando>" ou "<comando>/<subcomando>".`
      );
    }
    const [command, subcommand] = parts;
    const descriptor = this.byName.get(command);
    if (!descriptor) {
      throw new GovernanceError(
        "SURFACE_NOT_FOUND",
        `registry-command inexistente: comando "${command}" não está no CommandRegistry.`
      );
    }
    if (subcommand !== undefined && !descriptor.subcommands.includes(subcommand)) {
      throw new GovernanceError(
        "SURFACE_NOT_FOUND",
        `registry-command inexistente: "${command}" não declara o subcomando "${subcommand}" ` +
          `(declarados: ${descriptor.subcommands.length ? descriptor.subcommands.join(", ") : "nenhum"}).`
      );
    }
    return {
      ref: formatSurfaceRef(ref),
      namespace: ref.namespace,
      name: ref.name,
      observableClass: "event",
      source: REGISTRY_COMMAND_SOURCE,
      metadata: {
        command,
        ...(subcommand !== undefined ? { subcommand } : {}),
      },
    };
  }
}
