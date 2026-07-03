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
      return repository.withCommandLock(
        command,
        () => {
          repository.assertNoPendingTransactions();
          const currentRevision = repository.currentRevision();
          const history = repository.loadCommandHistory();
          const dryRun = dryRunGovernedCommand(command, repository.loadOrg(), {
            ...options,
            currentRevision,
            history,
          });
          if (!dryRun.ok) return dryRun;

          const transaction = repository.beginTransaction(command, currentRevision);
          try {
            const write = repository.applyCommand(command);
            const newRevision = repository.currentRevision();
            repository.markTransactionApplied(transaction, write, newRevision);
            if (options.simulateCrashAfterApply) {
              throw new Error("simulated crash after apply before event-log append");
            }
            const receipt = {
              ...dryRun.receipt,
              write,
              previousRevision: currentRevision,
              newRevision,
            };
            const event = {
              schema: "acme.event-log/v1",
              id: eventId(command, newRevision),
              command,
              receipt,
            };
            repository.commitTransaction(transaction, event);
            return { ok: true, issues: dryRun.issues, receipt };
          } catch (error) {
            const revisionAfterError = repository.currentRevision();
            if (revisionAfterError === currentRevision) {
              repository.abortTransaction(transaction);
            } else {
              repository.markTransactionFailed(transaction, error, revisionAfterError);
            }
            throw error;
          }
        },
        options
      );
    },
  };
}
