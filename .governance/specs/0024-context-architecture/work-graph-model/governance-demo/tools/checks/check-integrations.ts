// check-integrations.ts — smoke dos integration adapters + API handlers.
// Prova mecanismo real em 4 eixos: sucesso, falha honesta, egress bloqueado e
// evidência stale/adulterada. Usa um servidor loopback efêmero para o contrato
// do assistente (nenhuma chamada externa).
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  buildApiContractDocument,
  CiLocalAdapter,
  CodeQualityAdapter,
  CodeSecurityAdapter,
  CODE_QUALITY_REPORT_FILE,
  CODE_QUALITY_REPORT_SCHEMA,
  CODE_SECURITY_REPORT_FILE,
  CODE_SECURITY_REPORT_SCHEMA,
  GitLocalAdapter,
  handleCommandDryRun,
  handleContractImpact,
  handleGraphConflicts,
  handleGraphOverview,
  handleIntentDependencies,
  ObservabilityAdapter,
  OllamaAssistantProvider,
  reportBodyHash,
} from "../../backend/src/index.ts";
import type { AddressInfo } from "node:net";

let failures = 0;
function check(label, condition, detail = "") {
  if (condition) {
    console.log(`✓ ${label}`);
  } else {
    failures += 1;
    console.error(`✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

const firstEvidenceDetail = (result) => result.evidence?.[0]?.detail ?? {};
const handlerBody = (result) => result.body;

// ── git-local: evidência real do git da máquina ─────────────────────────────
const git = new GitLocalAdapter();
const gitOk = await git.collect("acme-checkout-api");
check(
  "git-local coleta revision/status real de acme-checkout-api",
  gitOk.status === "ok" && firstEvidenceDetail(gitOk).lastCommit?.hash,
  JSON.stringify(gitOk)
);
const gitFail = await git.collect("acme-repo-inexistente");
check("git-local falha honesto em repo desconhecido", gitFail.status === "failed");

// ── ci-local: executa o comando de evidência definido pelo repo ─────────────
const ci = new CiLocalAdapter();
const ciOk = await ci.collect("acme-core-api");
check(
  "ci-local executa test.mjs de acme-core-api com exit 0",
  ciOk.status === "ok" && firstEvidenceDetail(ciOk).exitCode === 0,
  JSON.stringify(firstEvidenceDetail(ciOk))
);
const ciNotConfigured = await ci.collect("acme-web-host");
check(
  "ci-local reporta not-configured quando o repo não define test.mjs",
  ciNotConfigured.status === "not-configured"
);

// ── code-quality: relatório hash-verificado + egress fail-closed ────────────
const quality = new CodeQualityAdapter({ env: {} });
const qualityOk = await quality.collect("acme-core-api");
check(
  "code-quality lê relatório verificado de acme-core-api",
  qualityOk.status === "ok" && qualityOk.evidence[0]?.contentHash,
  JSON.stringify(qualityOk)
);
const qualityEgress = new CodeQualityAdapter({
  env: { SONARQUBE_URL: "https://sonar.example.com" },
});
const egressBlocked = await qualityEgress.collect("acme-core-api");
check(
  "code-quality bloqueia SonarQube externo sem allowlist (egress fail-closed)",
  egressBlocked.status === "egress-blocked"
);

// relatório ADULTERADO precisa falhar fechado (stale/tamper)
const tamperRoot = mkdtempSync(path.join(tmpdir(), "governance-tamper-"));
try {
  const tamperRepo = path.join(tamperRoot, "acme-core-api");
  mkdirSync(path.join(tamperRepo, "reports"), { recursive: true });
  const body = { analyzer: "x", issues: [], measures: {} };
  writeFileSync(
    path.join(tamperRepo, CODE_QUALITY_REPORT_FILE),
    JSON.stringify({
      schema: CODE_QUALITY_REPORT_SCHEMA,
      source: "acme-core-api",
      generatedAt: "2027-01-01T00:00:00Z",
      body: { ...body, issues: [{ rule: "x", severity: "minor", file: "a", message: "m" }] },
      contentHash: reportBodyHash(body), // hash do corpo ANTIGO => adulterado
    })
  );
  const tampered = await new CodeQualityAdapter({ reposRoot: tamperRoot, env: {} }).collect(
    "acme-core-api"
  );
  check(
    "code-quality rejeita relatório adulterado/stale (fail-closed)",
    tampered.status === "unavailable" && /contentHash/.test(tampered.error || "")
  );
} finally {
  rmSync(tamperRoot, { recursive: true, force: true });
}

// ── code-security: OSV/deps.dev materializado como evidência local ─────────
const security = new CodeSecurityAdapter();
const securityOk = await security.collect("acme-core-api");
check(
  "code-security lê relatório OSV/deps.dev verificado de acme-core-api",
  securityOk.status === "ok" && securityOk.evidence[0]?.contentHash,
  JSON.stringify(securityOk)
);
const securityMissing = await security.collect("acme-web-host");
check(
  "code-security reporta not-configured sem relatório OSV/deps.dev",
  securityMissing.status === "not-configured"
);

const tamperSecurityRoot = mkdtempSync(path.join(tmpdir(), "governance-security-tamper-"));
try {
  const tamperRepo = path.join(tamperSecurityRoot, "acme-core-api");
  mkdirSync(path.join(tamperRepo, "reports"), { recursive: true });
  const body = {
    scanner: "osv-scanner",
    lockfile: "package-lock.json",
    scannedPackages: 1,
    vulnerabilities: [],
  };
  writeFileSync(
    path.join(tamperRepo, CODE_SECURITY_REPORT_FILE),
    JSON.stringify({
      schema: CODE_SECURITY_REPORT_SCHEMA,
      source: "acme-core-api",
      generatedAt: "2027-01-01T00:00:00Z",
      body: {
        ...body,
        vulnerabilities: [
          {
            id: "GHSA-example",
            packageName: "left-pad",
            installedVersion: "1.0.0",
            source: "osv.dev",
            severity: "critical",
          },
        ],
      },
      contentHash: reportBodyHash(body), // hash do corpo ANTIGO => adulterado
    })
  );
  const tampered = await new CodeSecurityAdapter({
    reposRoot: tamperSecurityRoot,
  }).collect("acme-core-api");
  check(
    "code-security rejeita relatório adulterado/stale (fail-closed)",
    tampered.status === "unavailable" && /contentHash/.test(tampered.error || "")
  );
} finally {
  rmSync(tamperSecurityRoot, { recursive: true, force: true });
}

// ── observability: fixture verificável, sem telemetria fingida ──────────────
const obs = new ObservabilityAdapter();
const obsOk = await obs.test();
check(
  "observability lê métricas operacionais verificadas do acme-obs-stack",
  obsOk.status === "ok" && firstEvidenceDetail(obsOk).mode === "fixture",
  JSON.stringify(obsOk)
);
const obsRepo = await obs.collect("acme-checkout-api");
check(
  "observability projeta métricas por repo (acme-checkout-api)",
  obsRepo.status === "ok" && firstEvidenceDetail(obsRepo).metrics?.length === 2
);
const obsMissing = await new ObservabilityAdapter({
  reportFile: path.join(tmpdir(), "nao-existe", "operational-metrics.json"),
}).test();
check("observability reporta not-configured sem relatório", obsMissing.status === "not-configured");

// ── assistant-ollama: contrato provado contra servidor loopback efêmero ─────
const received = [];
const fake = createServer((request, response) => {
  if (request.url === "/api/tags") {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ models: [{ name: "acme-local-model" }] }));
    return;
  }
  if (request.url === "/api/generate") {
    let raw = "";
    request.on("data", (chunk) => (raw += chunk));
    request.on("end", () => {
      received.push(JSON.parse(raw));
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ response: "conselho local" }));
    });
    return;
  }
  response.statusCode = 404;
  response.end();
});
await new Promise<void>((resolve) => fake.listen(0, "127.0.0.1", () => resolve()));
const address = fake.address() as AddressInfo | string | null;
if (!address || typeof address === "string") {
  throw new Error("assistant fake server did not expose a tcp port");
}
const port = address.port;
const local = new OllamaAssistantProvider({ endpoint: `http://127.0.0.1:${port}` });
const health = await local.health();
check(
  "assistant-ollama health ok em loopback com lista de modelos",
  health.status === "ok" && health.models.includes("acme-local-model")
);
const advice = await local.advise({
  prompt: "avalie este trecho com token sk-aaaaaaaaaaaaaaaa colado por engano",
});
check(
  "assistant-ollama advisory local aplica redação antes de enviar",
  advice.status === "ok" && advice.redactions >= 1 && !JSON.stringify(received).includes("sk-aaaa"),
  JSON.stringify({ advice, received })
);
fake.close();
const cloud = new OllamaAssistantProvider({ endpoint: "https://assistant.example.com" });
const cloudAdvice = await cloud.advise({ prompt: "qualquer" });
check(
  "assistant-ollama bloqueia endpoint não-local (egress fail-closed)",
  cloudAdvice.status === "egress-blocked" && cloudAdvice.policy.allowed === false
);
const down = new OllamaAssistantProvider({ endpoint: "http://127.0.0.1:1", timeoutMs: 300 });
check(
  "assistant-ollama reporta unreachable quando o runtime local está fora",
  (await down.health()).status === "unreachable"
);

// ── API handlers: graph queries + contrato + fail-closed de comando ─────────
const overview = await handleGraphOverview({});
const overviewBody = handlerBody(overview);
check(
  "API /api/graph retorna grafo derivado com sourceRevision",
  overview.status === 200 && overviewBody.nodes.length > 0 && overviewBody.sourceRevision
);
const impact = await handleContractImpact({ ref: "acme-user-context" });
const impactBody = handlerBody(impact);
check(
  "API contract-impact resolve consumers/intents/outcomes de acme-user-context",
  impact.status === 200 && impactBody.consumers.length > 0 && impactBody.outcomesCiting.length > 0,
  JSON.stringify(impactBody ?? {})
);
const deps = await handleIntentDependencies({ ref: "intent-checkout-stack" });
const depsBody = handlerBody(deps);
check(
  "API intent-deps resolve peças/repos de intent-checkout-stack",
  deps.status === 200 && depsBody.works.length > 0 && depsBody.repos.length > 0
);
const conflicts = await handleGraphConflicts();
const conflictsBody = handlerBody(conflicts);
check(
  "API conflicts expõe colapsos de atestação modelados",
  conflicts.status === 200 &&
    conflictsBody.conflicts.some((conflict) => conflict.kind === "attestation-collapse")
);
const malformed = await handleCommandDryRun({ id: "x" });
check("API command dry-run rejeita request fora do schema (400)", malformed.status === 400);
const stale = await handleCommandDryRun({
  id: "cmd-smoke-stale",
  type: "proposal.create",
  envelope: {
    actor: "smoke",
    authority: "sponsor-acme",
    "base-revision": "rev-antiga",
    "idempotency-key": "smoke-key",
    "issued-at": "2027-01-01T00:00:00Z",
    nonce: "smoke-nonce",
  },
  payload: {
    proposal: {
      id: "prop-smoke",
      title: "x",
      "raised-by": "intent:x",
      "authorized-by": "x",
      status: "proposed",
    },
  },
});
check(
  "API command dry-run falha fechado em base-revision stale (422)",
  stale.status === 422 && handlerBody(stale).issues.some((issue) => issue.rule === "command-stale")
);
const contract = buildApiContractDocument();
check(
  "contrato da API cobre as rotas de graph/commands/integrations/assistant",
  [
    "/api/graph",
    "/api/commands/execute",
    "/api/integrations/{id}/test",
    "/api/integrations/assistant/advisory",
  ].every((route) => contract.routes.some((entry) => entry.path === route))
);

if (failures) {
  console.error(`✗ check-integrations: ${failures} falha(s)`);
  process.exit(1);
}
console.log(
  "✓ integrations smoke — sucesso · falha honesta · egress bloqueado · evidência adulterada"
);
