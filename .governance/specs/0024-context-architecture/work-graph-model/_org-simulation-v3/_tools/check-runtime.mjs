// check-runtime.mjs — prova que a runtime DDD v3 existe fora dos scripts de CLI.
// Uso: node _tools/check-runtime.mjs
import { buildGraphReadModel, openFileGovernanceRuntime } from "../_lib/index.mjs";
import { loadPublishedRepoContracts } from "./repo-contracts.mjs";
import { loadPublishedContexts } from "./repo-contexts.mjs";
import { loadPublishedRepoWorks } from "./repo-works.mjs";

const fail = (msg) => {
  console.error(`✗ runtime v3 — ${msg}`);
  process.exit(1);
};

const runtime = openFileGovernanceRuntime();
const org = runtime.loadOrg();
const issues = runtime.validateOrg(org);
const errors = issues.filter((issue) => issue.level === "error");

if (!org?.org?.company) fail("org.yml não carregou company");
if ((org.intents || []).length < 1) fail("nenhuma intent carregada pelo adapter file");
if ((org.repos || []).length < 1) fail("nenhum repo carregado pelo adapter file");
if (errors.length) fail(`domínio retornou ${errors.length} erro(s) no snapshot base`);

const graph = buildGraphReadModel({
  org,
  issues,
  repoContexts: loadPublishedContexts(),
  repoWorks: loadPublishedRepoWorks(),
  repoContracts: loadPublishedRepoContracts(),
});

if (!graph.nodes.some((node) => node.type === "intent")) fail("read-model sem nós de intent");
if (!graph.nodes.some((node) => node.type === "repo-work-ack"))
  fail("read-model sem acknowledgements repo-local");
if (!graph.edges.some((edge) => edge.type === "acknowledges-work"))
  fail("read-model sem aresta repo-work ack -> breakdown central");

const baseOutcome = org.outcomes[0];
const validCommand = {
  id: "cmd-check-runtime-outcome",
  type: "outcome.publish",
  envelope: {
    actor: "ana-dev",
    authority: "pm-growth",
    "base-revision": "check-runtime@local",
    "idempotency-key": "cmd-check-runtime-outcome",
    "issued-at": "2027-04-03",
    nonce: "nonce-cmd-check-runtime-outcome",
  },
  payload: {
    outcome: {
      ...baseOutcome,
      id: "out-check-runtime",
      envelope: {
        ...baseOutcome.envelope,
        "idempotency-key": "out-check-runtime",
        nonce: "nonce-out-check-runtime",
      },
    },
  },
};
const accepted = runtime.dryRunGovernedCommand(validCommand);
if (!accepted.ok)
  fail(`comando válido rejeitado: ${accepted.issues.map((i) => i.rule).join(", ")}`);

const unknown = runtime.dryRunGovernedCommand({ ...validCommand, type: "made-up.command" });
if (unknown.ok || !unknown.issues.some((issue) => issue.rule === "command-type")) {
  fail("comando desconhecido não falhou fechado");
}

const noEnvelope = runtime.dryRunGovernedCommand({
  id: "cmd-sem-envelope",
  type: "outcome.publish",
});
if (noEnvelope.ok || !noEnvelope.issues.some((issue) => issue.rule === "command-envelope")) {
  fail("comando sem envelope não foi bloqueado");
}

console.log(
  `✓ runtime v3 — file adapter + domínio + read-model (${graph.nodes.length} nós · ${graph.edges.length} arestas · ${issues.length} issue(s))`
);
