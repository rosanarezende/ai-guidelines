// db.ts — persistência lowdb da mock API (.data/db.json, gitignored).
// Guarda estado + event-log com os MESMOS schemas do shell real; o reducer
// puro do domínio garante semântica idêntica ao backend file-first.
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import {
  emptyAdoptionState,
  type AdoptionState,
  type LocalShellCommand,
} from "../../backend/src/domain/index.ts";

export type MockDbShape = {
  schema: "governance.mock-api-db/v1";
  seed: string;
  state: AdoptionState;
  events: Array<{ schema: "governance.local-adoption-event/v1"; command: LocalShellCommand }>;
};

const here = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(here, "..", ".data");
export const DB_FILE = path.join(DATA_DIR, "db.json");
let writeQueue: Promise<void> = Promise.resolve();

export function emptyDb(seed = "blank"): MockDbShape {
  return {
    schema: "governance.mock-api-db/v1",
    seed,
    state: emptyAdoptionState(),
    events: [],
  };
}

export async function openDb(): Promise<Low<MockDbShape>> {
  mkdirSync(DATA_DIR, { recursive: true });
  const db = new Low<MockDbShape>(new JSONFile<MockDbShape>(DB_FILE), emptyDb());
  await db.read();
  if (!db.data || db.data.schema !== "governance.mock-api-db/v1") {
    // estado corrompido/estranho falha VISÍVEL: reset explícito é exigido
    throw new Error(
      `mock-api: ${DB_FILE} inválido/corrompido — rode "npm --workspace acme-governance-mock-api run reset"`
    );
  }
  return db;
}

export async function writeDb<T>(mutate: (db: Low<MockDbShape>) => Promise<T> | T): Promise<T> {
  const result = writeQueue.then(async () => {
    const db = await openDb();
    const value = await mutate(db);
    await db.write();
    return value;
  });

  writeQueue = result.then(
    () => undefined,
    () => undefined
  );

  return result;
}
