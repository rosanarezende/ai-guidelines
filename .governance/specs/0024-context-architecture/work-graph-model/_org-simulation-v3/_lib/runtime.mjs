// runtime.mjs — composicao da runtime v3: porta file + dominio puro.
import { FileGovernanceRepository } from "./adapters/file/FileGovernanceRepository.mjs";
import { dryRunGovernedCommand, validateGovernedCommand } from "./domain/commands.mjs";
import { deriveIntent, validateOrg } from "./domain/org-domain.mjs";

export function openFileGovernanceRuntime(options = {}) {
  const repository = new FileGovernanceRepository(options);
  return {
    repository,
    loadOrg: () => repository.loadOrg(),
    validateOrg,
    deriveIntent,
    validateGovernedCommand: (command, options = {}) =>
      validateGovernedCommand(command, repository.loadOrg(), options),
    dryRunGovernedCommand: (command, options = {}) =>
      dryRunGovernedCommand(command, repository.loadOrg(), options),
  };
}
