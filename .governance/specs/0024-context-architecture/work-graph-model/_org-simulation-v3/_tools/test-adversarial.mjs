// test-adversarial.mjs — fixtures ADVERSARIAIS (barra do red-team): cada quebra plantada DEVE
// ser pega pelo validador; exit 1 se alguma passar. As 6 quebras da revisão F5 moram aqui p/ sempre.
// Uso: node _tools/test-adversarial.mjs
import { loadOrg, validateOrg } from "./org.mjs";

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
  envelope: { actor: "ana-dev", authority: "pm-growth", "idempotency-key": "out-teste-1" },
  ...over,
});
const validCollapsedOutcome = (over = {}) => ({
  id: "out-self-attested-logado",
  "emitted-by": "dep-bump-host",
  source: "acme-data-pipeline/cost@rev77",
  window: { start: "2027-01-01", end: "2027-03-31" },
  metric: "cost-to-serve",
  value: "-1 R$/pedido",
  aggregation: "avg",
  "attested-by": "acme-data-pipeline",
  revision: "warehouse@rev77",
  "contract-revisions": [],
  "contributes-to": "tgt-data-cost",
  envelope: { actor: "ana-dev", authority: "head-platform", "idempotency-key": "out-self-1" },
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
        envelope: { actor: "alguém", authority: "pm-growth", "idempotency-key": "k1" },
      });
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
        validOutcome({ envelope: { authority: "pm-growth", "idempotency-key": "k9" } })
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
          envelope: { actor: "ana-dev", authority: "autoridade-fantasma", "idempotency-key": "k4" },
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
            "idempotency-key": "k5",
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
];

export function run(cases) {
  let fails = 0;
  for (const c of cases) {
    const issues = validateOrg(c.mutate());
    const errs = issues.filter((i) => i.level === "error");
    if (c.expect === null) {
      const ok = errs.length === 0;
      console.log(`${ok ? "✓" : "✗"} ${c.id} — ${errs.length} erro(s)`);
      if (!ok) {
        fails++;
        errs.slice(0, 6).forEach((e) => console.log("    ", e.rule, "·", e.node, "—", e.msg));
      }
    } else {
      const ok = errs.some((i) => i.rule === c.expect);
      console.log(
        `${ok ? "✓" : "✗"} ${c.id} → "${c.expect}"${ok ? " pego" : " — PASSOU SEM PEGAR!"}`
      );
      if (!ok) fails++;
    }
  }
  return fails;
}

const fails = run(CASES);
console.log(
  fails === 0
    ? `✓ ${CASES.length} fixtures — todas as quebras pegas`
    : `✗ ${fails} fixture(s) falharam`
);
process.exit(fails ? 1 : 0);
