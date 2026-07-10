// GovernanceRepository.ts — porta autoritativa da runtime v3.
// O adapter file é a implementação de referência; qualquer backend write-capable
// futuro (sqlite/neo4j/mongo) precisa honrar exatamente este contrato.
import type { GovernedCommand, GovernanceIssue, OrgSnapshot } from "@demo/domain/server";

export type CommandLockOptions = {
  lockTtlMs?: number;
};

export type WriteReceipt = {
  path: string | null;
  id: string;
  registryPath?: string;
};

export type TransactionHandle = {
  id: string;
  file: string;
};

export type GovernanceEvent = {
  schema: string;
  id: string;
  command: GovernedCommand;
  receipt: Record<string, unknown>;
};

// Event-log append-only: história de comandos é insumo de idempotência/replay.
export interface EventLog {
  loadCommandHistory(): GovernedCommand[];
  appendEvent(event: GovernanceEvent): void;
}

export interface GovernanceRepository extends EventLog {
  loadOrg(): OrgSnapshot;
  currentRevision(): string;
  listRuntimeIssues(): GovernanceIssue[];
  withCommandLock<T>(command: GovernedCommand, fn: () => T, options?: CommandLockOptions): T;
  assertNoPendingTransactions(): void;
  beginTransaction(command: GovernedCommand, previousRevision: string): TransactionHandle;
  markTransactionApplied(
    transaction: TransactionHandle,
    write: WriteReceipt,
    newRevision: string
  ): void;
  markTransactionFailed(
    transaction: TransactionHandle,
    error: unknown,
    revisionAfterError: string
  ): void;
  abortTransaction(transaction: TransactionHandle): void;
  commitTransaction(transaction: TransactionHandle, event: GovernanceEvent): void;
  applyCommand(command: GovernedCommand): WriteReceipt;
}
