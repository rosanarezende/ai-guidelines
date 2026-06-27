// Banco DERIVADO (Lente 5) — lê as REGISTRIES (YAML) e COMPUTA a projeção.
// Não guarda estado derivado: recomputa do grafo. Rode de novo após mudar uma registry → vê a comunicação.
//   node _derive.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const YAML = createRequire(import.meta.url)("yaml");

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => YAML.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
// frontmatter de um .md (o verdict é CONTEÚDO → mora no exploration-answer, não no registry):
const readFront = (p) => {
  const t = fs.readFileSync(path.join(ROOT, p), "utf8");
  const m = t.match(/^---\n([\s\S]*?)\n---/);
  return m ? YAML.parse(m[1]) : {};
};

// 1) carrega as registries: a intent + todas as `*/registry/exploration.yml` dos repos
const intent = read("acme-governance/intents/intent-0001/intent.yml");
const explorations = [];
for (const repo of fs.readdirSync(ROOT)) {
  const reg = path.join(ROOT, repo, "registry", "exploration.yml");
  if (fs.existsSync(reg))
    for (const e of read(`${repo}/registry/exploration.yml`).entries || [])
      explorations.push({ repo, ...e });
}

// 2) índice: o que cada exploration RESPONDE (a aresta `answers`)
const answersOf = {}; // "intent-0001#q1" -> exploration
for (const e of explorations) if (e.answers) answersOf[e.answers] = e;

// 3) DERIVA
const id = intent.id;
const resolved = new Set();
console.log(`\n========== BANCO DERIVADO — ${id}: ${intent.title} ==========\n`);
console.log("open-questions (status DERIVADO do `answers` das explorations):");
for (const q of intent["open-questions"] || []) {
  // match por SUFIXO: `answers` usa o endereço qualificado (acme-governance/intent-0001#q1) — identidade cross-repo
  const e = explorations.find(
    (x) => x.answers === `${id}#${q.id}` || x.answers?.endsWith(`/${id}#${q.id}`)
  );
  const isResolved = e && e.status === "done";
  if (isResolved) resolved.add(q.id);
  const derivedBy = e ? `${e.repo}/${e.id}` : null;
  // o verdict é DERIVADO: o registry referencia o answer via `closed-by`; o banco segue e lê o conteúdo
  const verdict =
    isResolved && e["closed-by"]
      ? (readFront(`${e.repo}/${e["closed-by"]}`).verdict ?? null)
      : null;
  console.log(
    `  ${q.id}: ${isResolved ? "RESOLVED" : "open"}   ← ${derivedBy ? `${derivedBy} (${e.status}, fate: ${e.fate ?? "—"})` : "nenhuma exploration responde"}`
  );
  if (verdict) console.log(`       ↳ verdict (DERIVADO do answer via closed-by): "${verdict}"`);
  // CHECK A+ anti-drift: o `answered-by` GERADO na intent bate com o derivado?
  if (q["answered-by"] && q["answered-by"] !== derivedBy)
    console.log(
      `     ⚠️ DRIFT: intent diz answered-by=${q["answered-by"]} mas o grafo deriva ${derivedBy}`
    );
}

// PROJEÇÃO sobre as registries de WORK (não só a intent): o banco deriva o verdict de QUALQUER registry via closed-by
console.log(
  "\nexploration-registries (projeção — verdict DERIVADO do answer, NÃO guardado no registry):"
);
for (const e of explorations) {
  const v =
    e.status === "done" && e["closed-by"]
      ? (readFront(`${e.repo}/${e["closed-by"]}`).verdict ?? null)
      : null;
  console.log(`  ${e.repo}/${e.id}: ${e.status}${e.fate ? ` · fate ${e.fate}` : ""}`);
  if (v) console.log(`       ↳ verdict (DERIVADO): "${v}"`);
}

console.log("\ncontracts (UMA lista; known/pending DERIVADO — sem `awaits` = known no t0):");
const knownContracts = [];
for (const c of intent.contracts || []) {
  const known = !c.awaits || resolved.has(c.awaits);
  if (known) knownContracts.push(c.name);
  console.log(
    `  ${c.name}: ${known ? "KNOWN ✅" : "pending"}   ${c.awaits ? `(awaits ${c.awaits})` : "(t0)"}`
  );
}

console.log(
  "\n→ COMUNICAÇÃO: ao fechar uma exploration, o banco RE-DERIVA — a question resolve e o contrato destrava,"
);
console.log(
  `  sem ninguém editar a intent. Contratos liberados agora: ${knownContracts.length ? knownContracts.join(", ") : "(nenhum — a exploration ainda está aberta)"}\n`
);
