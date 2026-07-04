// adoption-journey.ts — dogfood ponta-a-ponta da adoção em uma empresa com repos existentes.
// A jornada e write-safe: exercita scaffold/context/capability-review, runtime, exemplos de
// backend derivados e app Next/MUI ativo sem depender dos protótipos estáticos arquivados.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..", "..");

const steps = [
  {
    name: "1. scaffold minimo existe",
    command: "node",
    args: ["tools/repo-first/adopt-existing-repos.ts", "--check"],
  },
  {
    name: "2. codigo MVP dos repos coopera",
    command: "node",
    args: ["tools/checks/check-code-fixtures.ts"],
  },
  {
    name: "2b. repos criticos provam comportamento local",
    command: "node",
    args: ["tools/checks/check-local-repo-tests.ts"],
  },
  {
    name: "2c. runtime DDD v3 carrega adapter file + dominio + read-model",
    command: "node",
    args: ["tools/checks/check-runtime.ts"],
  },
  {
    name: "3. contextos publicados estao frescos",
    command: "node",
    args: ["tools/repo-first/check-repo-contexts.ts"],
  },
  {
    name: "4. peças repo-local reconhecem o breakdown central",
    command: "node",
    args: ["tools/repo-first/check-repo-works.ts"],
  },
  {
    name: "5. contratos repo-local reconhecem o registry central",
    command: "node",
    args: ["tools/repo-first/check-repo-contracts.ts"],
  },
  {
    name: "6. pacotes AI-assisted de capability estao frescos",
    command: "node",
    args: ["tools/repo-first/prepare-capability-review.ts", "--check"],
  },
  {
    name: "7. validador da org passa",
    command: "node",
    args: ["tools/checks/validate.ts"],
  },
  {
    name: "8. red-team corpus continua fechado",
    command: "node",
    args: ["tools/checks/test-adversarial.ts"],
  },
  {
    name: "9. exemplos file/sqlite/neo4j/mongo estao frescos",
    command: "node",
    args: ["tools/read-models/export-backend-examples.ts", "--check"],
  },
  {
    name: "10. file + neo4j read-model passam smoke operacional",
    command: "node",
    args: ["tools/read-models/check-backend-examples.ts"],
  },
  {
    name: "11. neo4j loader executa plano em dry-run",
    command: "node",
    args: ["tools/read-models/load-neo4j-example.ts", "--dry-run"],
  },
  {
    name: "12. integration adapters + API handlers passam smoke",
    command: "node",
    args: ["tools/checks/check-integrations.ts"],
  },
  {
    name: "13. app Next/MUI carrega runtime e builda",
    command: "node",
    args: ["tools/checks/check-governance-app.ts"],
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
