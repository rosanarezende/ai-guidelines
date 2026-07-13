/**
 * Projecao read-only minima de um comando registrado.
 *
 * O contrato pertence a aplicacao: resolvers consomem descritores sem conhecer
 * o composition root da CLI que os produz.
 */
export interface RegistryCommandDescriptor {
  readonly name: string;
  readonly subcommands: readonly string[];
}
