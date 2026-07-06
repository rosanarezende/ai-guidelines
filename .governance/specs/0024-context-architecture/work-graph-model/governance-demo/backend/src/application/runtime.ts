// runtime.ts — composição da runtime v3: porta file + domínio puro.
import { FileGovernanceRepository } from "../adapters/file/FileGovernanceRepository.ts";
import type { FileGovernanceRepositoryOptions } from "../adapters/file/FileGovernanceRepository.ts";
import {
  dryRunGovernedCommand,
  validateGovernedCommand,
  type CommandValidationOptions,
  type DryRunResult,
} from "@demo/domain/server";
import type { GovernanceIssue, GovernedCommand, OrgSnapshot } from "@demo/domain/server";
import { deriveIntent, validateOrg } from "@demo/domain/server";
import type { GovernanceEvent } from "../ports/GovernanceRepository.ts";

function eventId(command: GovernedCommand, revision: string): string {
  return `evt-${command.id}-${revision}`;
}

export type ExecuteOptions = CommandValidationOptions & {
  lockTtlMs?: number;
  simulateCrashAfterApply?: boolean;
};

export type GovernanceRuntime = {
  repository: FileGovernanceRepository;
  loadOrg: () => OrgSnapshot;
  currentRevision: () => string;
  validateOrg: typeof validateOrg;
  deriveIntent: typeof deriveIntent;
  validateGovernedCommand: (
    command: GovernedCommand,
    options?: CommandValidationOptions
  ) => GovernanceIssue[];
  dryRunGovernedCommand: (
    command: GovernedCommand,
    options?: CommandValidationOptions
  ) => DryRunResult;
  executeGovernedCommand: (command: GovernedCommand, options?: ExecuteOptions) => DryRunResult;
};

export function openFileGovernanceRuntime(
  options: FileGovernanceRepositoryOptions = {}
): GovernanceRuntime {
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
            const event: GovernanceEvent = {
              schema: "acme.event-log/v1",
              id: eventId(command, newRevision),
              command,
              receipt,
            };
            repository.commitTransaction(transaction, event);
            return { ok: true, issues: dryRun.issues, receipt } as DryRunResult;
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
