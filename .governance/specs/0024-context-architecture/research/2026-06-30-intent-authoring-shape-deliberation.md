# Deliberação — a forma de AUTORIA da intent (enquadramento rico · pessoas · explore-points · contratos via matcher) — q/r/d

- Data: 2026-06-30 · Spec 0024 · Natureza: **research/deliberação, não-autoridade** (insumo de DEC).
- Em divergência vencem `state.yml`/`tasks.md`/`decision-brief.md`/gates/Git. Prior art **pública** nas referências.
- ⚠️ A inspiração veio de docs internos de uma ex-empregadora (confidencial): **só a ESTRUTURA abstrata** é reusada, anonimizada; nenhum nome/cliente/número/URL é versionado.

> **GATE (owner, 2026-06-30):** a owner navegou a app `_app` e apontou que a forma da intent estava pobre demais p/ autoria real. As decisões abaixo (D1–D6) foram **aprovadas** ("vamos tentar dessa forma nova"); a owner **vai iterar** depois ("descobrir se foi suficiente"). Logo: 1ª versão, sujeita a refino.

---

## O problema (em 1 parágrafo)

A forma atual da intent — `title` + `owner` + `explores:[{subject}]` + `contracts` digitados à mão — é **pobre demais para a autoria de verdade**. Ao usar a app, a owner apontou: (a) o `_num` do id deveria ser **random** (não `_1`) p/ não colidir; (b) a intent precisa de **enquadramento rico** (problema, conexão com negócio, referências/anexos, detalhes); (c) o status deveria **nascer `draft`** e ativar num 2º passo; (d) "dona" **confunde** quem cadastrou × quem é accountable × cargos relacionados; (e) explore-points precisam de **título + detalhes** (é deles que as explorations abrem); (f) **contratos não se digitam** — o **matcher** (léxico ou IA) deveria **sugerir** as conexões após o cadastro.

## Inspiração (anonimizada) + a lição de modelo

A fonte foram **briefs de EXPERIMENTO de produto**, cuja estrutura abstrata é: problema de **negócio** + problema do **cliente** (what/who/why) · **conexão com negócio** (driver estratégico / métrica impactada) · evidências · benchmarks · **alinhamento com stakeholders** · hipótese · objetivos de aprendizado · solution design · instrumentação · checklist de validação · resultado · próximos passos.

**Lição (separa intent × work):** essa riqueza pesada (hipótese · métricas · instrumentação · resultado) é majoritariamente do **work `experiment`** — no modelo, os artefatos `experiment-brief`/`experiment-outcome`, **já decididos**. A **intent** herda apenas o **ENQUADRAMENTO**: problema, conexão com negócio, referências, pessoas, detalhes. Assim a intent fica rica **sem** virar um work (mantém **intent ≠ work**, Lente 1/4). _Prior art pública: Jira epic/initiative · Shape Up "pitch" · Amazon PR/FAQ · Opportunity Solution Tree._

## Decisões (aprovadas pelo gate; 1ª versão)

- **D1 — pessoas (resolve o "dona ficou estranho"):** três papéis distintos — **`registered-by`** (quem CADASTROU; autoria/registro) · **`owner`** (a DONA **accountable**, que responde pela iniciativa — espelha o `owner=B` do [shape do manifesto](2026-06-29-manifest-shape-deliberation.md)) · **`stakeholders: [{role, who}]`** (cargos/pessoas relacionadas — como os _alinhamentos com stakeholders_ da inspiração).
- **D2 — ciclo de vida:** a intent **nasce `draft`** → ação **"ativar"** → `active` (alinha com os works, que nascem `draft`; o status vira `draft | active | paused | done | dropped`).
- **D3 — explore-point rico:** `{id, title, details}` (era `{id, subject}`). O **matcher passa a casar por `title` + `details`** (need mais rico → sugestão melhor). É deles que as **explorations** abrem.
- **D4 — id:** o `_num` é **random** (~16-bit), coerente com o já-decidido "\_num = chave estável que sobrevive a rename". O slug vem do título e é editável.
- **D5 — contratos via matcher (não-autorados na form):** a pessoa **não digita** contratos. Após o cadastro, o app roda o **matcher** (léxico/IA) sobre os explore-points/problema → **sugere repos + conexões/contratos** → o humano **confirma** o que anexar (advisory + gate humano = a **Q4** do [roteamento vertical](2026-06-29-vertical-routing-deliberation.md)). _1ª versão: a **sugestão** aparece no detalhe da intent; o "anexar confirmado" itera depois._
- **D6 — anexos:** começa só com **links** (o `references` já decidido cobre ~90% — na inspiração, todo "anexo" era link); **upload binário** fica p/ depois.

## A forma nova (template + domínio + arquivos)

```yaml
node: intent
sealed: false
id: <slug>_<rand> # rand ~16-bit (chave estável)
title:
status: draft # draft | active | paused | done | dropped (nasce draft)
created-at:
updated-at:
# ── pessoas ──
registered-by: # quem CADASTROU
owner: # a DONA accountable
stakeholders:
  - { role, who }
# ── enquadramento ──
problem:
  business: # o problema de NEGÓCIO
  customer: # o problema do CLIENTE
business-connection:
  driver: # driver estratégico
  metric: # métrica/indicador impactado
details: | # prosa livre
references:
  - { type, label, url, note }
# ── investigação (abre explorations) ──
explores:
  - { id: <rand>, title, details }
# ── contratos: NÃO digitados — sugeridos pelo matcher (D5), confirmados = anexados ──
contracts:
  - { name, awaits }
```

_(Mantidos no arquivo, preservados na escrita: `objective`, `target-repos`, `closed-at`. `breaks-into` segue DERIVADO.)_

## Resíduo / a iterar

A owner vai testar a forma nova e dizer "se foi suficiente". Candidatos a 2ª volta: o passo de **confirmar/anexar** as conexões sugeridas (D5 completo); **upload de anexos** (D6); o **problema do cliente** em what/who/why (como na inspiração) se a granularidade ajudar; e se o `experiment` (work) deve herdar o resto da estrutura (hipótese/métricas/instrumentação) num `experiment-brief` enriquecido.
