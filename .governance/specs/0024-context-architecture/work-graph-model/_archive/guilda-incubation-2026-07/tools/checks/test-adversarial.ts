// test-adversarial.ts — fixtures ADVERSARIAIS (barra do red-team): cada quebra plantada DEVE
// ser pega pelo validador; exit 1 se alguma passar. As 6 quebras da revisão F5 moram aqui p/ sempre.
// Uso: node tools/checks/test-adversarial.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadOrg, validateOrg } from "../repo-first/org.ts";
import { loadPublishedRepoContracts, validateRepoContracts } from "../repo-first/repo-contracts.ts";
import { loadPublishedContexts, validateRepoContexts } from "../repo-first/repo-contexts.ts";
import { loadPublishedRepoWorks, validateRepoWorks } from "../repo-first/repo-works.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const demoRoot = path.join(here, "..", "..");
const base = loadOrg();
const clone = () => structuredClone(base);
const intent = (o, id) => o.intents.find((i) => i.id === id);
const work = (o, iid, wid) => intent(o, iid).works.find((w) => w.id === wid);
// outcome VÁLIDO de referência (bloco J): emitido pelo CTA, atestado por fonte independente
const validOutcome = (over = {}) => ({
  id: "out-teste",
  "emitted-by": "intent-cta-upgrade",
  source: "acme-analytics/conversion@rev42",
  window: { start: "2027-01-01", end: "2027-03-31" },
  metric: "conversion-rate",
  value: "+2 %",
  aggregation: "avg",
  "attested-by": "acme-analytics",
  revision: "warehouse@rev42",
  "contract-revisions": [],
  "contributes-to": "tgt-billing-conv",
  envelope: {
    actor: "ana-dev",
    authority: "pm-growth",
    "issued-at": "2027-04-02",
    "idempotency-key": "out-teste-1",
    nonce: "nonce-out-teste-1",
  },
  ...over,
});
const validCollapsedOutcome = (over = {}) => ({
  id: "out-self-attested-logado",
  "emitted-by": "fix-checkout-timeout",
  source: "acme-obs-stack/incident-count@obs-rev19",
  window: { start: "2027-04-01", end: "2027-04-30" },
  metric: "incident-count",
  value: "-1 incidentes/mês",
  aggregation: "sum",
  "attested-by": "acme-obs-stack",
  revision: "obs@rev19",
  "contract-revisions": [],
  "contributes-to": "tgt-sre-incidents",
  envelope: {
    actor: "ana-dev",
    authority: "lead-sre",
    "issued-at": "2027-04-10",
    "idempotency-key": "out-self-1",
    nonce: "nonce-out-self-1",
  },
  ...over,
});

const CASES = [
  { id: "baseline sem erros (warns são permitidos)", expect: null, mutate: () => clone() },
  {
    id: "F5·1 typo em chave (delivery-aftr) — schema fechado",
    expect: "schema-unknown-key",
    mutate: () => {
      const o = clone();
      const w = work(o, "intent-cta-upgrade", "ui-cta");
      w["delivery-aftr"] = w["delivery-after"];
      delete w["delivery-after"];
      return o;
    },
  },
  {
    id: "campo obrigatório ausente (intent sem title)",
    expect: "schema-required",
    mutate: () => {
      const o = clone();
      delete o.intents[0].title;
      return o;
    },
  },
  {
    id: "F5·2 review externo FALSO (externo: qualquer-coisa) — autoridade exata",
    expect: "review-derivation",
    mutate: () => {
      const o = clone();
      work(o, "intent-cta-upgrade", "baseline-eventos").review = "externo: qualquer-coisa";
      return o;
    },
  },
  {
    id: "F5·3 kind inventado no standalone — enum fechado",
    expect: "schema-enum",
    mutate: () => {
      const o = clone();
      o.standalone[0].kind = "made-up-kind";
      return o;
    },
  },
  {
    id: "F5·4 outcome incompleto (sem revision) — schema",
    expect: "schema-required",
    mutate: () => {
      const o = clone();
      o.outcomes.push({
        id: "out-quebrado",
        "emitted-by": "intent-cta-upgrade",
        source: "acme-analytics/conversion@rev1",
        window: { start: "2027-01-01", end: "2027-03-31" },
        metric: "conversion-rate",
        value: "+2 %",
        aggregation: "avg",
        "attested-by": "acme-analytics",
        "contract-revisions": [],
        "contributes-to": "tgt-billing-conv",
        envelope: {
          actor: "alguém",
          authority: "pm-growth",
          "issued-at": "2027-04-02",
          "idempotency-key": "k1",
          nonce: "nonce-k1",
        },
      } as any);
      return o;
    },
  },
  {
    id: "regra de ouro (validate-first sem hipótese)",
    expect: "golden-rule",
    mutate: () => {
      const o = clone();
      delete intent(o, "intent-cta-upgrade").hypothesis;
      return o;
    },
  },
  {
    id: "sinal × contrato (muda contrato com signal none)",
    expect: "signal-contract",
    mutate: () => {
      const o = clone();
      intent(o, "intent-cta-upgrade")["contracts-changed"] = ["acme-user-context"];
      return o;
    },
  },
  {
    id: "ciclo de dependências entre peças",
    expect: "deps-cycle",
    mutate: () => {
      const o = clone();
      work(o, "intent-checkout-stack", "porta-fluxo")["blocked-by"] = ["monitor-canary"];
      return o;
    },
  },
  {
    id: "meta no objetivo errado (primary-target-coherence)",
    expect: "primary-target-coherence",
    mutate: () => {
      const o = clone();
      intent(o, "intent-cta-upgrade")["primary-target"] = "tgt-sre-p99";
      return o;
    },
  },
  {
    id: "módulo inexistente no monolito",
    expect: "refs",
    mutate: () => {
      const o = clone();
      work(o, "intent-cta-upgrade", "contas-legadas").module = "mod-nao-existe";
      return o;
    },
  },
  // ── bloco J: o resolver de outcomes ──
  {
    id: "J·0 outcome VÁLIDO passa (positivo)",
    expect: null,
    mutate: () => {
      const o = clone();
      o.outcomes.push(validOutcome());
      return o;
    },
  },
  {
    id: "J·0b outcome self-attested COM colapso logado passa (warning visível)",
    expect: null,
    mutate: () => {
      const o = clone();
      o.outcomes.push(validCollapsedOutcome());
      return o;
    },
  },
  {
    id: "J·1 agregação ≠ metric-definition",
    expect: "aggregation-mismatch",
    mutate: () => {
      const o = clone();
      o.outcomes.push(validOutcome({ aggregation: "sum" }));
      return o;
    },
  },
  {
    id: "J·2 attester do PRÓPRIO time medido (self-attested não soma)",
    expect: "self-attested",
    mutate: () => {
      const o = clone();
      o.outcomes.push(validOutcome({ "attested-by": "acme-mfe-billing" }));
      return o;
    },
  },
  {
    id: "J·3 intent muda contrato e o outcome não cita a revision (BLOCKED)",
    expect: "blocked-contract",
    mutate: () => {
      const o = clone();
      o.outcomes.push(
        validOutcome({
          id: "out-checkout",
          "emitted-by": "intent-checkout-stack",
          metric: "cost-to-serve",
          value: "-3 R$/pedido",
          "attested-by": "acme-data-pipeline",
          "contributes-to": "tgt-checkout-stack",
          "contract-revisions": [],
        })
      );
      return o;
    },
  },
  {
    id: "J·4 janela invertida",
    expect: "window-invalid",
    mutate: () => {
      const o = clone();
      o.outcomes.push(validOutcome({ window: { start: "2027-06-01", end: "2027-01-01" } }));
      return o;
    },
  },
  {
    id: "J·5 target FROZEN não recebe actual",
    expect: "target-frozen",
    mutate: () => {
      const o = clone();
      o.targets.find((t) => t.id === "tgt-billing-conv").status = "closed";
      o.outcomes.push(validOutcome());
      return o;
    },
  },
  {
    id: "J·6 outcome somando fora do primary-target da intent",
    expect: "rollup-coherence",
    mutate: () => {
      const o = clone();
      o.outcomes.push(validOutcome({ "contributes-to": "tgt-onboarding-act" }));
      return o;
    },
  },
  {
    id: "J·7 envelope sem actor (actual-publish é mutação perigosa)",
    expect: "envelope",
    mutate: () => {
      const o = clone();
      o.outcomes.push(
        validOutcome({
          envelope: {
            authority: "pm-growth",
            "issued-at": "2027-04-02",
            "idempotency-key": "k9",
            nonce: "nonce-k9",
          },
        })
      );
      return o;
    },
  },
  // ── bloco K: registry de autoridades + envelope resolvido ──
  {
    id: "F5·5/K·1 approver do perfil é TIME de dentro do escopo",
    expect: "profile-approver",
    mutate: () => {
      const o = clone();
      o.org["profile-declaration"]["approved-by"] = "time-sre";
      return o;
    },
  },
  {
    id: "K·2 approver do perfil é ROLE interna (head-platform)",
    expect: "profile-approver",
    mutate: () => {
      const o = clone();
      o.org["profile-declaration"]["approved-by"] = "head-platform";
      return o;
    },
  },
  {
    id: "K·3 definer de target não resolve no registry",
    expect: "refs-authority",
    mutate: () => {
      const o = clone();
      o.targets[0].definer = "fulano-qualquer";
      return o;
    },
  },
  {
    id: "K·4 envelope.authority não resolve no registry",
    expect: "refs-authority",
    mutate: () => {
      const o = clone();
      o.outcomes.push(
        validOutcome({
          envelope: {
            actor: "ana-dev",
            authority: "autoridade-fantasma",
            "issued-at": "2027-04-02",
            "idempotency-key": "k4",
            nonce: "nonce-k4",
          },
        })
      );
      return o;
    },
  },
  {
    id: "K·5 chave desconhecida DENTRO do envelope",
    expect: "schema-unknown-key",
    mutate: () => {
      const o = clone();
      o.outcomes.push(
        validOutcome({
          envelope: {
            actor: "ana-dev",
            authority: "pm-growth",
            "issued-at": "2027-04-02",
            "idempotency-key": "k5",
            nonce: "nonce-k5",
            "campo-esquisito": true,
          },
        })
      );
      return o;
    },
  },
  {
    id: "K·6 lead de time fantasma",
    expect: "refs-authority",
    mutate: () => {
      const o = clone();
      o.teams[0].lead = "lead-fantasma";
      return o;
    },
  },
  {
    id: "K·7 target self-attested SEM colapso logado falha",
    expect: "self-attested-target",
    mutate: () => {
      const o = clone();
      delete o.targets.find((t) => t.id === "tgt-data-cost")["attestation-collapse"];
      return o;
    },
  },
  {
    id: "K·8 colapso de target aprovado por role interna falha",
    expect: "attestation-collapse",
    mutate: () => {
      const o = clone();
      o.targets.find((t) => t.id === "tgt-sre-p99")["attestation-collapse"]["approved-by"] =
        "head-platform";
      return o;
    },
  },
  // ── bloco L: coordenação de contrato + dependências cross-intent ──
  {
    id: "L·1 duas intents mudam contrato SEM revision-proposal falha",
    expect: "contract-contention",
    mutate: () => {
      const o = clone();
      delete o.contracts.find((c) => c.id === "acme-user-context")["revision-proposals"];
      return o;
    },
  },
  {
    id: "L·2 decision pendente na contention falha",
    expect: "contract-contention",
    mutate: () => {
      const o = clone();
      o.contracts.find((c) => c.id === "acme-user-context")["revision-proposals"][0].decision =
        "pending";
      return o;
    },
  },
  {
    id: "L·3 approval fora do owner do contrato falha",
    expect: "contract-owner-approval",
    mutate: () => {
      const o = clone();
      o.contracts.find((c) => c.id === "acme-user-context")["revision-proposals"][0][
        "owner-approval"
      ] = "lead-checkout";
      return o;
    },
  },
  {
    id: "L·4 dependency cross-intent fantasma falha",
    expect: "deps-cross-intent",
    mutate: () => {
      const o = clone();
      intent(o, "intent-consent-center")["depends-on"] = ["intent-fantasma"];
      return o;
    },
  },
  {
    id: "L·5 ciclo cross-intent falha",
    expect: "deps-cycle",
    mutate: () => {
      const o = clone();
      intent(o, "intent-checkout-stack")["depends-on"] = ["intent-consent-center"];
      return o;
    },
  },
  // ── bloco M: derivação/drift + follow-ups + matcher stub ──
  {
    id: "M·1 approach-drift é detectado sem bloquear",
    expect: "approach-drift",
    mutate: () => {
      const o = clone();
      const it = intent(o, "intent-help-selfservice");
      it.hypothesis = "self-service reduz ticket sem piorar satisfação";
      it["decision-rule"] = "ganha se ticket-cost cai sem churn subir";
      return o;
    },
  },
  {
    id: "M·2 signal-drift é detectado sem bloquear",
    expect: "signal-drift",
    mutate: () => {
      const o = clone();
      intent(o, "intent-p99-hardening").signal = "none";
      return o;
    },
  },
  {
    id: "M·3 follow-up de incidente para proposal fantasma falha",
    expect: "refs",
    mutate: () => {
      const o = clone();
      o.incidents
        .find((s) => s.id === "incidente-checkout")
        ["follow-ups"].find((f) => f.kind === "proposal").ref = "proposal:fantasma";
      return o;
    },
  },
  {
    id: "S·1 standalone repo-local no repo errado falha",
    expect: "standalone-location",
    mutate: () => {
      const o = clone();
      o.standalone.find((s) => s.id === "bug-frete")._repo = "acme-web-host";
      return o;
    },
  },
  {
    id: "S·2 proposal de incidente sem vínculo reverso falha",
    expect: "follow-up-ref",
    mutate: () => {
      const o = clone();
      o.proposals.find((p) => p.id === "prop-checkout-hardening")["raised-by"] =
        "standalone:fix-checkout-timeout";
      return o;
    },
  },
  {
    id: "M·4 matcher seguido em sugestão unknown falha",
    expect: "matcher-routing",
    mutate: () => {
      const o = clone();
      const routing = o.standalone.find((s) => s.id === "bug-frete").routing;
      routing.suggestions[0].unknown = true;
      return o;
    },
  },
  {
    id: "M·5 matcher sem evidence independente falha",
    expect: "matcher-evidence",
    mutate: () => {
      const o = clone();
      const routing = o.standalone.find((s) => s.id === "bug-frete").routing;
      routing.suggestions[0].evidence = [];
      return o;
    },
  },
  // ── substrato repo-first: repos.yml nao pode divergir dos manifestos/contextos publicados ──
  {
    id: "R·1 cap central sem tag publicada pelo repo falha",
    expect: "repo-context-caps",
    mutate: () => {
      const o = clone();
      o.repos.find((r) => r.id === "acme-checkout").caps.push("cap-fantasma");
      return o;
    },
  },
  {
    id: "R·2 contrato central com owner-repo que nao publica o contrato falha",
    expect: "repo-context-contract",
    mutate: () => {
      const o = clone();
      o.contracts.find((c) => c.id === "acme-user-context")["owner-repo"] = "acme-checkout";
      return o;
    },
  },
  {
    id: "R·3 consumer central que nao consome no manifesto falha",
    expect: "repo-context-contract",
    mutate: () => {
      const o = clone();
      o.contracts.find((c) => c.id === "acme-design-tokens").consumers.push("acme-help-center");
      return o;
    },
  },
  {
    id: "RW·1 peça central mudou mas ack repo-local ficou stale",
    expect: "repo-work-stale",
    mutate: () => {
      const o = clone();
      work(o, "intent-cta-upgrade", "ui-cta").desc =
        "UI do CTA atrás da flag — agora também mostra comparação de planos";
      return o;
    },
  },
  {
    id: "RW·2 peça movida para outro repo sem ack do novo dono",
    expect: "repo-work-stale",
    mutate: () => {
      const o = clone();
      work(o, "intent-help-selfservice", "chatbot-deflexao").repo = "acme-analytics";
      return o;
    },
  },
  {
    id: "RW·3 outcome antes de todas as peças estarem done falha",
    expect: "outcome-work-open",
    validate: async () => {
      const claims = loadPublishedRepoWorks().map((claim) =>
        claim.id === "intent-cta-upgrade::ui-cta" ? { ...claim, status: "active" } : claim
      );
      return validateRepoWorks(base, { publishedClaims: claims });
    },
  },
  {
    id: "RW·4 repo-work done sem evidence falha",
    expect: "repo-work-lifecycle",
    validate: async () => {
      const claims = loadPublishedRepoWorks().map((claim) => {
        if (claim.id !== "intent-cta-upgrade::ui-cta") return claim;
        const copy = structuredClone(claim);
        delete copy.evidence;
        return copy;
      });
      return validateRepoWorks(base, { publishedClaims: claims });
    },
  },
  {
    id: "RW·5 repo-work blocked sem motivo rastreável falha",
    expect: "repo-work-lifecycle",
    validate: async () => {
      const claims = loadPublishedRepoWorks().map((claim) => {
        if (claim.id !== "intent-cta-upgrade::api-elegibilidade") return claim;
        const copy = structuredClone(claim);
        copy.status = "blocked";
        delete copy["blocked-by"];
        delete copy.reason;
        return copy;
      });
      return validateRepoWorks(base, { publishedClaims: claims });
    },
  },
  {
    id: "RW·6 repo-work dropped ainda alimentando outcome falha",
    expect: "outcome-work-dropped",
    validate: async () => {
      const claims = loadPublishedRepoWorks().map((claim) =>
        claim.id === "intent-cta-upgrade::api-elegibilidade"
          ? { ...claim, status: "dropped", decision: "accept-verdict", fate: "throwaway" }
          : claim
      );
      return validateRepoWorks(base, { publishedClaims: claims });
    },
  },
  {
    id: "R·4 código mudou mas context.json publicado ficou stale",
    expect: "repo-context-stale",
    validate: async () => {
      const expected = loadPublishedContexts().map((ctx) =>
        ctx.repo === "acme-checkout"
          ? { ...ctx, code: { ...ctx.code, sourceHash: "source-mutado" }, contentHash: "mutado" }
          : ctx
      );
      return validateRepoContexts(base, { expectedContexts: expected });
    },
  },
  {
    id: "RC·1 contrato central muda revision sem registry local fresco",
    expect: "repo-contract-stale",
    mutate: () => {
      const o = clone();
      o.contracts.find((c) => c.id === "acme-design-tokens").revision = "v3";
      return o;
    },
  },
  {
    id: "RC·2 owner-repo central muda sem contrato publicado no novo owner",
    expect: "repo-contract-stale",
    mutate: () => {
      const o = clone();
      o.contracts.find((c) => c.id === "acme-events-schema")["owner-repo"] = "acme-data-pipeline";
      return o;
    },
  },
  {
    id: "RC·3 contrato local muda sem registry central acompanhar",
    expect: "repo-contract-stale",
    validate: async () => {
      const published = loadPublishedRepoContracts().map((contract) =>
        contract.id === "acme-user-context" ? { ...contract, revision: "v999" } : contract
      );
      return validateRepoContracts(base, { publishedContracts: published });
    },
  },
  {
    id: "D·1 confused deputy local tenta ler repo restricted de outro owner",
    expect: "query-acl",
    mutate: () => {
      const o = clone();
      o.policy["access-requests"].push({
        id: "req-billing-read-identity-context",
        actor: "lead-billing",
        action: "read-context",
        repo: "acme-identity",
        decision: "allow",
        via: "host-local-query",
        reason: "debug lateral de consentimento",
      });
      return o;
    },
  },
  {
    id: "D·2 matcher externo bloqueado sem fallback rastreável falha",
    expect: "matcher-fallback",
    mutate: () => {
      const o = clone();
      const routing = o.standalone.find((s) => s.id === "bug-frete").routing;
      routing.matcher = "external-llm-matcher";
      routing.egress = { classification: "restricted", allowed: false, provider: "api-externa" };
      delete routing.fallback;
      return o;
    },
  },
  {
    id: "D·3 segredo colado em YAML sem quarantine falha",
    expect: "secret-quarantine",
    mutate: () => {
      const o = clone();
      intent(o, "intent-cta-upgrade").hypothesis =
        "um CTA contextual aumenta conversão; token temporário sk-acmeLeak12345";
      return o;
    },
  },
  {
    id: "D·4 oráculo sem independência falha",
    expect: "oracle-independence",
    mutate: () => {
      const o = clone();
      o.policy["oracle-independence"]["expected-by"] = "codex";
      return o;
    },
  },
  {
    id: "D·5 authority revogada usada por envelope falha",
    expect: "authority-revoked",
    mutate: () => {
      const o = clone();
      o.outcomes.push(
        validOutcome({
          id: "out-revogado",
          envelope: {
            actor: "ana-dev",
            authority: "lead-support",
            "issued-at": "2027-02-02",
            "idempotency-key": "out-revogado",
            nonce: "nonce-out-revogado",
          },
        })
      );
      return o;
    },
  },
  {
    id: "D·6 replay de idempotency/nonce falha",
    expect: "envelope-replay",
    mutate: () => {
      const o = clone();
      const first = validOutcome({ id: "out-replay-1" });
      const second = validOutcome({ id: "out-replay-2" });
      first.envelope["idempotency-key"] = "replay-key";
      first.envelope.nonce = "replay-nonce";
      second.envelope["idempotency-key"] = "replay-key";
      second.envelope.nonce = "replay-nonce";
      o.outcomes.push(first, second);
      return o;
    },
  },
];

async function validateAll(o) {
  return [
    ...validateOrg(o),
    ...(await validateRepoContexts(o)),
    ...validateRepoWorks(o),
    ...validateRepoContracts(o),
  ];
}

export async function run(cases) {
  let fails = 0;
  for (const c of cases) {
    const issues = c.validate ? await c.validate() : await validateAll(c.mutate());
    const errs = issues.filter((i) => i.level === "error");
    if (c.expect === null) {
      const ok = errs.length === 0;
      console.log(`${ok ? "✓" : "✗"} ${c.id} — ${errs.length} erro(s)`);
      if (!ok) {
        fails++;
        errs.slice(0, 6).forEach((e) => console.log("    ", e.rule, "·", e.node, "—", e.msg));
      }
    } else {
      const ok = issues.some((i) => i.rule === c.expect);
      console.log(
        `${ok ? "✓" : "✗"} ${c.id} → "${c.expect}"${ok ? " pego" : " — PASSOU SEM PEGAR!"}`
      );
      if (!ok) fails++;
    }
  }
  return fails;
}

function checkActiveAppSurface() {
  const issues = [];
  for (const name of ["_apps", "owner", "company", "vendor", "graph.js"]) {
    const target = path.join(demoRoot, name);
    if (fs.existsSync(target)) {
      issues.push({
        rule: "legacy-static-app-active",
        file: name,
        msg: "protótipo estático legado deve ficar em ../_archive/org-simulation-v3-static-apps-v1",
      });
    }
  }
  return issues;
}

const fails = await run(CASES);
const surfaceIssues = checkActiveAppSurface();
for (const i of surfaceIssues) console.log(`✗ [${i.rule}] ${i.file} — ${i.msg}`);
if (surfaceIssues.length === 0)
  console.log("✓ N·app-surface — protótipos estáticos arquivados; frontend/ é a superfície ativa");
console.log(
  fails === 0 && surfaceIssues.length === 0
    ? `✓ ${CASES.length} fixtures — todas as quebras pegas`
    : `✗ ${fails + surfaceIssues.length} fixture/check(s) falharam`
);
process.exit(fails || surfaceIssues.length ? 1 : 0);
