import { CommandRegistry } from "./CommandRegistry.js";
import type { RegistryCommandDescriptor } from "../../app/constraints/RegistryCommandDescriptor.js";

export type { RegistryCommandDescriptor } from "../../app/constraints/RegistryCommandDescriptor.js";

/**
 * Descriptor read-only de um comando do registry — projeção PURA para
 * introspecção (CO-3), sem executar o comando. É o gancho mínimo que o resolver
 * `registry-command:<cmd>/<sub>` precisa: nomes canônicos + subcomandos
 * declarados. Não duplica um segundo catálogo manual — deriva do `CommandRegistry`
 * real (SSOT do dispatch).
 */
/** `CommandRegistry` → descriptors canônicos ordenados (determinístico). */
export function describeRegistryCommands(
  registry: CommandRegistry
): readonly RegistryCommandDescriptor[] {
  return registry.commands().map((command) => ({
    name: command.name,
    subcommands: command.subcommands ?? [],
  }));
}
