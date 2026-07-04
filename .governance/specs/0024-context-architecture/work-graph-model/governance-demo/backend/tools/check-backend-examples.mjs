// check-backend-examples.mjs — smoke operacional dos exemplos file + Neo4j.
// Uso:
//   node backend/tools/check-backend-examples.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runBackendExampleSmoke } from "../index.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const outRoot = path.join(here, "..", "..", "examples", "read-models");

const report = runBackendExampleSmoke(outRoot);

if (!report.ok) {
  console.error("✗ backend operational smoke falhou:");
  for (const failure of report.failures) {
    console.error(`  - [${failure.code}] ${failure.msg}`);
  }
  process.exit(1);
}

console.log(
  "✓ read-model operational smoke — " +
    `file ${report.counts.nodes} nós/${report.counts.edges} arestas · ` +
    `event-log ${report.counts.eventLogEvents} evento(s) · ` +
    `neo4j ${report.counts.neo4jSchemaStatements} schema + ${report.counts.neo4jGraphStatements} graph + ${report.counts.neo4jQueryStatements} query statement(s) · ` +
    `hash ${report.contentHash}`
);
