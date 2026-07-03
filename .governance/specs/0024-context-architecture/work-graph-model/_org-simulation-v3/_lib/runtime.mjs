// runtime.mjs — composicao da runtime v3: porta file + dominio puro.
import { FileGovernanceRepository } from "./adapters/file/FileGovernanceRepository.mjs";
import { dryRunGovernedCommand, validateGovernedCommand } from "./domain/commands.mjs";
import { deriveIntent, validateOrg } from "./domain/org-domain.mjs";

function eventId(command, revision) {
  return `evt-${command.id}-${revision}`;
}

export function openFileGovernanceRuntime(options = {}) {
  const repository = new FileGovernanceRepository(options);
  return {
    repository,
    loadOrg: () => repository.loadOrg(),
    currentRevision: () => repository.currentRevision(),
    validateOrg,
    deriveIntent,
    validateGovernedCommand: (command, options = {}) =>
      validateGovernedCommand(command, repository.loadOrg(), options),
    dryRunGovernedCommand: (command, options = {}) =>
      dryRunGovernedCommand(command, repository.loadOrg(), options),
    executeGovernedCommand: (command, options = {}) => {
      const currentRevision = repository.currentRevision();
      const history = repository.loadCommandHistory();
      const dryRun = dryRunGovernedCommand(command, repository.loadOrg(), {
        ...options,
        currentRevision,
        history,
      });
      if (!dryRun.ok) return dryRun;
      const write = repository.applyCommand(command);
      const newRevision = repository.currentRevision();
      const receipt = {
        ...dryRun.receipt,
        write,
        previousRevision: currentRevision,
        newRevision,
      };
      repository.appendEvent({
        schema: "acme.event-log/v1",
        id: eventId(command, newRevision),
        command,
        receipt,
      });
      return { ok: true, issues: dryRun.issues, receipt };
    },
  };
}
