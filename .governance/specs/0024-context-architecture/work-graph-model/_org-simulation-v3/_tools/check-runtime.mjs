// check-runtime.mjs — prova que a runtime DDD v3 existe fora dos scripts de CLI.
// Uso: node _tools/check-runtime.mjs
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { parse } from "yaml";
import { buildGraphReadModel, openFileGovernanceRuntime } from "../_lib/index.mjs";
import { GOVERNANCE_ROOT, REPOS_ROOT } from "../_lib/paths.mjs";
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

const tmp = mkdtempSync(path.join(os.tmpdir(), "acme-runtime-"));
try {
  const governanceRoot = path.join(tmp, "acme-governance");
  const reposRoot = path.join(tmp, "repos");
  cpSync(GOVERNANCE_ROOT, governanceRoot, { recursive: true });
  cpSync(REPOS_ROOT, reposRoot, { recursive: true });
  const writeRuntime = openFileGovernanceRuntime({ governanceRoot, reposRoot });
  const revision = () => writeRuntime.currentRevision();
  const envelope = (id, issuedAt = "2027-04-04", authority = "pm-growth") => ({
    actor: "tool:check-runtime",
    authority,
    "base-revision": revision(),
    "idempotency-key": id,
    "issued-at": issuedAt,
    nonce: `nonce-${id}`,
  });
  const proposalCommand = {
    id: "cmd-check-runtime-proposal",
    type: "proposal.create",
    envelope: envelope("cmd-check-runtime-proposal"),
    payload: {
      proposal: {
        id: "prop-check-runtime",
        title: "proposal criada pelo check-runtime",
        "raised-by": "incident:incidente-checkout",
        "authorized-by": "obj-revenue",
        target: "tgt-billing-conv",
        status: "proposed",
        note: "prova command execute em cópia temporária",
      },
    },
  };
  const executed = writeRuntime.executeGovernedCommand(proposalCommand);
  if (!executed.ok)
    fail(`comando executável rejeitado: ${executed.issues.map((i) => i.rule).join(", ")}`);
  const proposals = parse(
    readFileSync(path.join(governanceRoot, "intake", "proposals.yml"), "utf8")
  ).proposals;
  if (!proposals.some((proposal) => proposal.id === "prop-check-runtime")) {
    fail("proposal.create não gravou proposals.yml na cópia temporária");
  }
  const eventLog = readFileSync(path.join(governanceRoot, "events", "events.jsonl"), "utf8");
  if (!eventLog.includes("cmd-check-runtime-proposal")) {
    fail("proposal.create não registrou event-log append-only");
  }

  const triageCommand = {
    id: "cmd-check-runtime-triage",
    type: "triage.save",
    envelope: envelope("cmd-check-runtime-triage", "2027-04-04", "lead-billing"),
    payload: {
      triage: {
        proposal: "prop-check-runtime",
        "recorded-by": "lead-billing",
        summary: "triage em cópia temporária prova authoring pré-gate",
        items: [
          {
            id: "duvida-api",
            question: "o endpoint de billing existente cobre a proposta?",
            disposition: "explore",
            owner: "lead-billing",
            timebox: "2d",
          },
          {
            id: "repo-provavel",
            question: "qual repo recebe o primeiro corte?",
            disposition: "answer-direct",
            answer: "acme-api-billing concentra elegibilidade e assinatura",
          },
        ],
        "matcher-run": {
          matcher: "local-capability-matcher",
          query: "billing upgrade eligibility",
          suggestions: [
            {
              repo: "acme-api-billing",
              score: 0.9,
              unknown: false,
              evidence: ["cap:elegibilidade", "owner:time-billing"],
            },
          ],
        },
      },
    },
  };
  const triageMismatch = writeRuntime.executeGovernedCommand({
    ...triageCommand,
    id: "cmd-check-runtime-triage-mismatch",
    envelope: envelope("cmd-check-runtime-triage-mismatch", "2027-04-04", "pm-growth"),
  });
  if (
    triageMismatch.ok ||
    !triageMismatch.issues.some((issue) => issue.rule === "triage-authority")
  ) {
    fail("triage.save com recorded-by divergente da authority não falhou fechado");
  }
  const triage = writeRuntime.executeGovernedCommand(triageCommand);
  if (!triage.ok) fail(`triage.save rejeitado: ${triage.issues.map((i) => i.rule).join(", ")}`);
  const triageDoc = parse(
    readFileSync(path.join(governanceRoot, "intake", "triage", "prop-check-runtime.yml"), "utf8")
  );
  if (triageDoc.proposal !== "prop-check-runtime" || triageDoc.items.length !== 2) {
    fail("triage.save não escreveu triage canônica");
  }

  const stale = writeRuntime.executeGovernedCommand({
    ...proposalCommand,
    id: "cmd-check-runtime-stale",
    envelope: {
      ...proposalCommand.envelope,
      "idempotency-key": "cmd-check-runtime-stale",
      nonce: "nonce-cmd-check-runtime-stale",
      "base-revision": "stale-revision",
    },
    payload: {
      proposal: {
        ...proposalCommand.payload.proposal,
        id: "prop-check-runtime-stale",
      },
    },
  });
  if (stale.ok || !stale.issues.some((issue) => issue.rule === "command-stale")) {
    fail("execute não falhou fechado com base-revision stale");
  }

  const ownerMismatch = writeRuntime.executeGovernedCommand({
    id: "cmd-check-runtime-repo-work-owner-mismatch",
    type: "repo-work.ack",
    envelope: envelope("cmd-check-runtime-repo-work-owner-mismatch", "2027-04-04"),
    payload: {
      ack: {
        intent: "intent-checkout-stack",
        work: "spike-carrinho",
        status: "active",
        owner: "lead-checkout",
        "started-at": "2027-04-04",
        "base-revision": "acme-checkout@ctx-local",
      },
    },
  });
  if (
    ownerMismatch.ok ||
    !ownerMismatch.issues.some((issue) => issue.rule === "repo-work-authority")
  ) {
    fail("repo-work.ack com owner diferente da authority não falhou fechado");
  }

  const repoWorkAckCommand = {
    id: "cmd-check-runtime-repo-work-ack",
    type: "repo-work.ack",
    envelope: {
      ...envelope("cmd-check-runtime-repo-work-ack", "2027-04-04"),
      authority: "lead-checkout",
    },
    payload: {
      ack: {
        intent: "intent-checkout-stack",
        work: "spike-carrinho",
        status: "active",
        owner: "lead-checkout",
        "started-at": "2027-04-04",
        "base-revision": "acme-checkout@ctx-local",
      },
    },
  };
  const repoWorkAck = writeRuntime.executeGovernedCommand(repoWorkAckCommand);
  if (!repoWorkAck.ok)
    fail(`repo-work.ack rejeitado: ${repoWorkAck.issues.map((i) => i.rule).join(", ")}`);
  const repoWorkDoc = parse(
    readFileSync(
      path.join(
        reposRoot,
        "acme-checkout",
        ".governance",
        "works",
        "intent-checkout-stack--spike-carrinho.yml"
      ),
      "utf8"
    )
  );
  if (repoWorkDoc.status !== "active" || repoWorkDoc.owner !== "lead-checkout") {
    fail("repo-work.ack não escreveu lifecycle repo-local");
  }

  const contractMismatch = writeRuntime.executeGovernedCommand({
    id: "cmd-check-runtime-contract-mismatch",
    type: "contract.propose-revision",
    envelope: envelope("cmd-check-runtime-contract-mismatch", "2027-04-04"),
    payload: {
      contract: "acme-user-context",
      proposal: {
        id: "acme-user-context-v5-mismatch",
        revision: "v5",
        breaking: true,
        intents: ["intent-checkout-stack", "intent-consent-center"],
        consumers: ["acme-mfe-billing", "acme-mfe-onboarding", "acme-checkout"],
        "owner-approval": "head-platform",
        decision: "sequenced-windows",
        "compatibility-window": "v4+v5 durante rollout coordenado",
      },
    },
  });
  if (
    contractMismatch.ok ||
    !contractMismatch.issues.some((issue) => issue.rule === "contract-owner-approval")
  ) {
    fail("contract.propose-revision com authority divergente não falhou fechado");
  }

  const contractCommand = {
    id: "cmd-check-runtime-contract-proposal",
    type: "contract.propose-revision",
    envelope: {
      ...envelope("cmd-check-runtime-contract-proposal", "2027-04-04"),
      authority: "head-platform",
    },
    payload: {
      contract: "acme-user-context",
      proposal: {
        id: "acme-user-context-v5-check-runtime",
        revision: "v5",
        breaking: true,
        intents: ["intent-checkout-stack", "intent-consent-center"],
        consumers: ["acme-mfe-billing", "acme-mfe-onboarding", "acme-checkout"],
        "owner-approval": "head-platform",
        decision: "sequenced-windows",
        "compatibility-window": "v4+v5 durante rollout coordenado",
      },
    },
  };
  const contractProposal = writeRuntime.executeGovernedCommand(contractCommand);
  if (!contractProposal.ok)
    fail(
      `contract.propose-revision rejeitado: ${contractProposal.issues
        .map((i) => i.rule)
        .join(", ")}`
    );
  const contractsDoc = parse(
    readFileSync(path.join(governanceRoot, "contracts", "contracts.yml"), "utf8")
  );
  const userContext = contractsDoc.contracts.find(
    (contract) => contract.id === "acme-user-context"
  );
  if (
    !userContext["revision-proposals"].some(
      (proposal) => proposal.id === "acme-user-context-v5-check-runtime"
    )
  ) {
    fail("contract.propose-revision não atualizou contracts.yml");
  }
  const localContract = parse(
    readFileSync(
      path.join(
        reposRoot,
        "acme-web-host",
        ".governance",
        "registry",
        "contracts",
        "acme-user-context.yml"
      ),
      "utf8"
    )
  );
  if (
    !localContract.revisionProposals.some(
      (proposal) => proposal.id === "acme-user-context-v5-check-runtime"
    )
  ) {
    fail("contract.propose-revision não atualizou registry local do owner repo");
  }

  const activationWithoutGate = writeRuntime.executeGovernedCommand({
    id: "cmd-check-runtime-activation-sem-gate",
    type: "intent.activate",
    envelope: envelope("cmd-check-runtime-activation-sem-gate"),
    payload: {
      proposal: "prop-check-runtime",
      intent: {
        id: "intent-check-runtime-sem-gate",
        title: "intent sem gate deve falhar",
        team: "time-billing",
        "authorized-by": "obj-revenue",
        "primary-target": "tgt-billing-conv",
        approach: "direct",
        signal: "none",
        works: [
          {
            id: "work-sem-gate",
            repo: "acme-api-billing",
            purpose: "create",
            desc: "não deve ser escrito sem gate append-only",
            review: "interno",
          },
        ],
        next: [{ when: "done", then: "não deveria ativar", gate: "accept-verdict" }],
      },
    },
  });
  if (
    activationWithoutGate.ok ||
    !activationWithoutGate.issues.some((issue) => issue.rule === "gate-required")
  ) {
    fail("intent.activate sem gate prévio não falhou fechado");
  }

  const gateCommand = {
    id: "cmd-check-runtime-gate",
    type: "gate.decide",
    envelope: envelope("cmd-check-runtime-gate", "2027-04-05"),
    payload: {
      gate: {
        proposal: "prop-check-runtime",
        decision: "activate",
        reason: "target e origem resolvem; check-runtime prova gate append-only antes da intent",
      },
    },
  };
  const gate = writeRuntime.executeGovernedCommand(gateCommand);
  if (!gate.ok) fail(`gate.decide rejeitado: ${gate.issues.map((i) => i.rule).join(", ")}`);
  const afterGateProposals = parse(
    readFileSync(path.join(governanceRoot, "intake", "proposals.yml"), "utf8")
  ).proposals;
  if (
    afterGateProposals.find((proposal) => proposal.id === "prop-check-runtime")?.status !== "active"
  ) {
    fail("gate.decide não marcou proposal como active");
  }

  const intentCommand = {
    id: "cmd-check-runtime-intent",
    type: "intent.activate",
    envelope: envelope("cmd-check-runtime-intent", "2027-04-06"),
    payload: {
      proposal: "prop-check-runtime",
      intent: {
        id: "intent-check-runtime-hardening",
        title: "hardening operacional ativado pelo check-runtime",
        team: "time-billing",
        "authorized-by": "obj-revenue",
        "primary-target": "tgt-billing-conv",
        approach: "direct",
        signal: "none",
        works: [
          {
            id: "work-check-runtime-api",
            repo: "acme-api-billing",
            purpose: "create",
            desc: "peça mínima válida para provar escrita de intent governada",
            review: "interno",
          },
        ],
        next: [
          {
            when: "peça done",
            then: "publicar outcome ou descartar sem outcome",
            gate: "accept-verdict",
          },
        ],
      },
    },
  };
  const intent = writeRuntime.executeGovernedCommand(intentCommand);
  if (!intent.ok) fail(`intent.activate rejeitado: ${intent.issues.map((i) => i.rule).join(", ")}`);
  const writtenIntent = parse(
    readFileSync(path.join(governanceRoot, "intents", "intent-check-runtime-hardening.yml"), "utf8")
  );
  if (writtenIntent.id !== "intent-check-runtime-hardening") {
    fail("intent.activate não escreveu intent canônica na cópia temporária");
  }
  const afterIntentProposals = parse(
    readFileSync(path.join(governanceRoot, "intake", "proposals.yml"), "utf8")
  ).proposals;
  if (
    afterIntentProposals.find((proposal) => proposal.id === "prop-check-runtime")?.status !==
    "closed"
  ) {
    fail("intent.activate não fechou proposal de origem");
  }

  const breakdownCommand = {
    id: "cmd-check-runtime-breakdown",
    type: "breakdown.apply",
    envelope: envelope("cmd-check-runtime-breakdown", "2027-04-07"),
    payload: {
      breakdown: {
        intent: "intent-check-runtime-hardening",
        works: [
          {
            id: "work-check-runtime-api",
            repo: "acme-api-billing",
            purpose: "create",
            desc: "peça atualizada por breakdown.apply",
            review: "interno",
          },
          {
            id: "work-check-runtime-analytics",
            repo: "acme-analytics",
            purpose: "create",
            desc: "instrumenta medição sem virar outcome por texto",
            review: "externo: time-data",
            "delivery-after": ["work-check-runtime-api"],
          },
        ],
      },
    },
  };
  const breakdown = writeRuntime.executeGovernedCommand(breakdownCommand);
  if (!breakdown.ok)
    fail(`breakdown.apply rejeitado: ${breakdown.issues.map((i) => i.rule).join(", ")}`);
  const updatedIntent = parse(
    readFileSync(path.join(governanceRoot, "intents", "intent-check-runtime-hardening.yml"), "utf8")
  );
  if (!updatedIntent.works.some((work) => work.id === "work-check-runtime-analytics")) {
    fail("breakdown.apply não substituiu works da intent");
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log(
  `✓ runtime v3 — file adapter + domínio + read-model (${graph.nodes.length} nós · ${graph.edges.length} arestas · ${issues.length} issue(s))`
);
