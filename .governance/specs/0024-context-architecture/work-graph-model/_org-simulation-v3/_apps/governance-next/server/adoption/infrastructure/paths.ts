// paths.ts — infrastructure: where the LOCAL adoption shell persists state.
//
// This is file-first user/workspace state of the app instance (local-principal,
// organizations, memberships, onboarding status). It is NOT the governed org
// graph: acme-governance/ and repos/*/.governance continue to be the SSOT of
// governance, mutated only by governed commands.
import path from "node:path";

export function localStateDir(): string {
  const override = process.env.GOVERNANCE_LOCAL_STATE_DIR;
  if (override && override.trim()) return path.resolve(override);
  return path.join(process.cwd(), ".local-state");
}

export function stateFile(): string {
  return path.join(localStateDir(), "adoption-state.json");
}

export function eventsFile(): string {
  return path.join(localStateDir(), "events.jsonl");
}

export function lockDir(): string {
  return path.join(localStateDir(), ".lock");
}
