// load-neo4j-example.ts — loader executável do read-model Neo4j gerado.
// Dry-run é o padrão. Apply exige hash explícito + credenciais HTTP.
//
// Uso:
//   node tools/read-models/load-neo4j-example.ts --dry-run
//   NEO4J_HTTP_URL=http://localhost:7474 NEO4J_USER=neo4j NEO4J_PASSWORD=... \
//     node tools/read-models/load-neo4j-example.ts --apply --source-hash <hash>
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadBackendExampleModel,
  runBackendExampleSmoke,
  splitCypherStatements,
} from "../../backend/src/index.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const outRoot = path.join(here, "..", "..", "backend", "examples", "read-models");
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const dryRun = args.includes("--dry-run") || !apply;

function argValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

function readText(relativePath) {
  return readFileSync(path.join(outRoot, relativePath), "utf8");
}

function loadStatements() {
  const schema = splitCypherStatements(readText(path.join("neo4j", "schema.cypher")));
  const graph = splitCypherStatements(readText(path.join("neo4j", "graph.cypher")));
  return { schema, graph, all: [...schema, ...graph] };
}

async function executeNeo4jStatements({ url, user, password, database, statements }) {
  const endpoint = `${url.replace(/\/+$/, "")}/db/${encodeURIComponent(database)}/tx/commit`;
  const authorization = Buffer.from(`${user}:${password}`).toString("base64");
  const chunkSize = 50;
  let applied = 0;

  for (let offset = 0; offset < statements.length; offset += chunkSize) {
    const chunk = statements.slice(offset, offset + chunkSize);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ statements: chunk.map((statement) => ({ statement })) }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`Neo4j HTTP ${response.status}: ${JSON.stringify(body)}`);
    }
    if (Array.isArray(body.errors) && body.errors.length) {
      throw new Error(`Neo4j errors: ${JSON.stringify(body.errors)}`);
    }
    applied += chunk.length;
  }

  return applied;
}

if (apply && args.includes("--dry-run")) {
  console.error("✗ escolha apenas um modo: --dry-run ou --apply");
  process.exit(1);
}

const smoke = runBackendExampleSmoke(outRoot);
if (!smoke.ok) {
  console.error("✗ Neo4j loader bloqueado: backend smoke falhou");
  for (const failure of smoke.failures) console.error(`  - [${failure.code}] ${failure.msg}`);
  process.exit(1);
}

const model = loadBackendExampleModel(outRoot);
const statements = loadStatements();

if (dryRun) {
  console.log(
    "✓ neo4j loader dry-run — " +
      `${statements.schema.length} schema + ${statements.graph.length} graph statement(s), ` +
      `${model.metadata.counts.nodes} nós, ${model.metadata.counts.edges} arestas, hash ${model.metadata.contentHash}`
  );
  console.log(
    `  apply seguro: node tools/read-models/load-neo4j-example.ts --apply --source-hash ${model.metadata.contentHash}`
  );
  process.exit(0);
}

const expectedHash = argValue("--source-hash");
if (!expectedHash || expectedHash !== model.metadata.contentHash) {
  console.error(
    `✗ --source-hash obrigatório e deve bater com o snapshot atual (${model.metadata.contentHash})`
  );
  process.exit(1);
}

const url = process.env.NEO4J_HTTP_URL;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;
const database = process.env.NEO4J_DATABASE || "neo4j";

if (!url || !user || !password) {
  console.error("✗ NEO4J_HTTP_URL, NEO4J_USER e NEO4J_PASSWORD são obrigatórios para --apply");
  process.exit(1);
}

const applied = await executeNeo4jStatements({
  url,
  user,
  password,
  database,
  statements: statements.all,
});

console.log(
  `✓ neo4j loader apply — ${applied} statement(s) aplicados em ${database} com source-hash ${expectedHash}`
);
