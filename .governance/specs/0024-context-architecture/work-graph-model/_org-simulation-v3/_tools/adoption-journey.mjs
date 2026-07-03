// adoption-journey.mjs — dogfood ponta-a-ponta da adoção em uma empresa com repos existentes.
// A jornada e write-safe: build-graph pode regenerar projection, mas os checks seguintes
// exigem que scaffold/context/capability-review estejam frescos.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");

const steps = [
  {
    name: "1. scaffold minimo existe",
    command: "node",
    args: ["_tools/adopt-existing-repos.mjs", "--check"],
  },
  {
    name: "2. codigo MVP dos repos coopera",
    command: "node",
    args: ["_tools/check-code-fixtures.mjs"],
  },
  {
    name: "2b. repos criticos provam comportamento local",
    command: "node",
    args: ["_tools/check-local-repo-tests.mjs"],
  },
  {
    name: "2c. runtime DDD v3 carrega adapter file + dominio + read-model",
    command: "node",
    args: ["_tools/check-runtime.mjs"],
  },
  {
    name: "3. contextos publicados estao frescos",
    command: "node",
    args: ["_tools/check-repo-contexts.mjs"],
  },
  {
    name: "4. peças repo-local reconhecem o breakdown central",
    command: "node",
    args: ["_tools/check-repo-works.mjs"],
  },
  {
    name: "5. contratos repo-local reconhecem o registry central",
    command: "node",
    args: ["_tools/check-repo-contracts.mjs"],
  },
  {
    name: "6. pacotes AI-assisted de capability estao frescos",
    command: "node",
    args: ["_tools/prepare-capability-review.mjs", "--check"],
  },
  {
    name: "7. validador da org passa",
    command: "node",
    args: ["_tools/validate.mjs"],
  },
  {
    name: "8. red-team corpus continua fechado",
    command: "node",
    args: ["_tools/test-adversarial.mjs"],
  },
  {
    name: "9. host agrega grafo publicado",
    command: "node",
    args: ["_tools/build-graph.mjs"],
  },
  {
    name: "10. exemplos file/sqlite/neo4j/mongo estao frescos",
    command: "node",
    args: ["_tools/export-backend-examples.mjs", "--check"],
  },
  {
    name: "11. file + neo4j read-model passam smoke operacional",
    command: "node",
    args: ["_tools/check-backend-examples.mjs"],
  },
  {
    name: "12. neo4j loader executa plano em dry-run",
    command: "node",
    args: ["_tools/load-neo4j-example.mjs", "--dry-run"],
  },
  {
    name: "13. app Next/MUI carrega runtime e builda",
    command: "node",
    args: ["_tools/check-governance-app.mjs"],
  },
];

for (const step of steps) {
  console.log(`\n▶ ${step.name}`);
  const result = spawnSync(step.command, step.args, { cwd: root, stdio: "inherit", shell: false });
  if (result.status !== 0) {
    console.error(`\n✗ adoption journey falhou em: ${step.name}`);
    process.exit(result.status || 1);
  }
}

console.log("\n✓ adoption journey completa");
