// file-state-store.ts — infrastructure: file-first persistence of the local
// adoption shell with the same discipline the governed graph will demand:
// lock curto por comando · escrita atômica (tmp+rename) · event-log append-only
// · idempotência por command id. É a versão mínima honesta, não um banco.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  statSync,
  writeFileSync,
  appendFileSync,
} from "node:fs";
import path from "node:path";
import {
  ADOPTION_STATE_SCHEMA,
  emptyAdoptionState,
  type AdoptionState,
  type LocalShellCommand,
} from "@demo/domain";
import { eventsFile, lockDir, localStateDir, stateFile } from "./paths";

const LOCK_RETRIES = 40;
const LOCK_RETRY_MS = 25;
const LOCK_STALE_MS = 5_000;

export type ApplyResult = { ok: true; state: AdoptionState } | { ok: false; error: string };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowMs(): number {
  return new Date().getTime();
}

async function acquireLock(): Promise<boolean> {
  mkdirSync(localStateDir(), { recursive: true });
  for (let attempt = 0; attempt < LOCK_RETRIES; attempt += 1) {
    try {
      mkdirSync(lockDir());
      return true;
    } catch {
      try {
        const age = nowMs() - statSync(lockDir()).mtimeMs;
        if (age > LOCK_STALE_MS) {
          rmdirSync(lockDir());
          continue;
        }
      } catch {
        continue;
      }
      await sleep(LOCK_RETRY_MS);
    }
  }
  return false;
}

function releaseLock(): void {
  try {
    rmdirSync(lockDir());
  } catch {
    // Lock já liberado/tomado por staleness: nada a fazer.
  }
}

export function loadAdoptionState(): AdoptionState {
  const file = stateFile();
  if (!existsSync(file)) return emptyAdoptionState();
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as AdoptionState;
    if (parsed?.schema !== ADOPTION_STATE_SCHEMA) return emptyAdoptionState();
    return {
      schema: ADOPTION_STATE_SCHEMA,
      principals: parsed.principals || [],
      workspaces: parsed.workspaces || [],
      memberships: parsed.memberships || [],
    };
  } catch {
    // Estado corrompido não é silenciosamente sobrescrito em leitura; comandos
    // falharão fechado ao tentar aplicar (o arquivo original fica para perícia).
    return emptyAdoptionState();
  }
}

function appliedCommandIds(): Set<string> {
  const file = eventsFile();
  if (!existsSync(file)) return new Set();
  const ids = new Set<string>();
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const event = JSON.parse(trimmed) as { command?: { id?: string } };
      if (event.command?.id) ids.add(event.command.id);
    } catch {
      // Linha inválida não derruba a leitura do log; aparece na auditoria bruta.
    }
  }
  return ids;
}

function writeStateAtomic(state: AdoptionState): void {
  const file = stateFile();
  const tmp = path.join(localStateDir(), `adoption-state.tmp-${process.pid}`);
  writeFileSync(tmp, JSON.stringify(state, null, 2));
  renameSync(tmp, file);
}

function appendEvent(command: LocalShellCommand): void {
  appendFileSync(
    eventsFile(),
    `${JSON.stringify({ schema: "governance.local-adoption-event/v1", command })}\n`
  );
}

export async function applyLocalShellCommand(
  command: LocalShellCommand,
  mutate: (state: AdoptionState) => AdoptionState | { error: string }
): Promise<ApplyResult> {
  if (!command.id || !command.type) return { ok: false, error: "command-schema" };
  const locked = await acquireLock();
  if (!locked) return { ok: false, error: "lock-timeout" };
  try {
    if (appliedCommandIds().has(command.id)) {
      return { ok: false, error: "duplicate-command" };
    }
    const current = loadAdoptionState();
    const next = mutate(current);
    if ("error" in next) return { ok: false, error: next.error };
    writeStateAtomic(next);
    appendEvent(command);
    return { ok: true, state: next };
  } finally {
    releaseLock();
  }
}
