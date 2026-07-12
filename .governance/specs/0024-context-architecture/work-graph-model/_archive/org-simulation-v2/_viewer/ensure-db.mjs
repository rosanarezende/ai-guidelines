// Garante que db.json tem TODAS as coleções do seed (adiciona as faltantes).
// NUNCA sobrescreve dados existentes — preserva o que você já cadastrou/decidiu.
import fs from "node:fs";

const seed = JSON.parse(fs.readFileSync("db.seed.json", "utf8"));
const exists = fs.existsSync("db.json");
const db = exists ? JSON.parse(fs.readFileSync("db.json", "utf8")) : {};

let changed = !exists;
for (const key of Object.keys(seed)) {
  if (!(key in db)) {
    db[key] = seed[key]; // coleção nova (ex.: proposals) → semeia só ela
    changed = true;
  }
}

if (changed) {
  fs.writeFileSync("db.json", JSON.stringify(db, null, 2) + "\n");
  console.log(`[ensure-db] db.json pronto — coleções: ${Object.keys(db).join(", ")}`);
}
