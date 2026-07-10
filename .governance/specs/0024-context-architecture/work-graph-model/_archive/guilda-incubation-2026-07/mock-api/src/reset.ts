// reset.ts — CLI: recarrega a seed no .data/db.json.
// Uso: npm --workspace acme-governance-mock-api run reset [-- <seed>]
import { writeFileSync, mkdirSync } from "node:fs";
import { DATA_DIR, DB_FILE, emptyDb } from "./db.ts";
import { buildSeed, seedNames } from "@demo/test-fixtures";

const seedName = process.argv[2] || "blank";
const state = buildSeed(seedName);
if (!state) {
  console.error(`✗ seed desconhecida: "${seedName}"`);
  console.error(`  disponíveis: ${seedNames().join(" · ")}`);
  process.exit(1);
}
mkdirSync(DATA_DIR, { recursive: true });
writeFileSync(DB_FILE, `${JSON.stringify({ ...emptyDb(seedName), state }, null, 2)}\n`);
console.log(`✓ mock-api resetada com a seed "${seedName}" (${DB_FILE})`);
