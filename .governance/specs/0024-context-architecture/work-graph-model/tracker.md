# Tracker v2 — o modelo do trabalho como grafo tipado (8 lentes, do amplo ao genérico)

> **SSOT vivo desta frente.** Síntese **refinada** do que aprendemos na v1 ([`tracker-v1.md`](tracker-v1.md)) — sem o histórico de "era isso → virou isso". As 8 lentes vão do **mais amplo** (propósito) ao **mais genérico** (primitivos: dimensões · arestas · camadas físicas · o envelope transacional).
> **Regras:** recência vence · conferir o já-decidido antes de desenhar · uma pergunta por vez · linguagem simples · docs externos **inspiram, não definem** (nem se versionam/citam) · **modelar todos os fluxos** (a implementação se faseia em [`features.md`](features.md), o modelo não).
> Org fictícia ANONIMIZADA (`acme-*`). 🟢 = decidido · 🔶 = a estressar. Não-autoridade; em divergência vencem `state.yml`/gates/Git.

---

## Lente 1 · Propósito & princípios (o mais amplo)

**O quê:** modelar **o trabalho de uma org de software como um GRAFO TIPADO** — iniciativas, trabalhos, instrumentos e suas ligações — de forma que o sistema (e a IA) saibam **o que existe, onde investigar e quem entrega**, sem depender da memória humana.

**Princípios (🟢):**

- **File-first · banco DERIVADO · backend PLUGÁVEL.** A governança vive em **arquivos** `.governance/` (YAML) — a fonte da verdade. O "banco" é uma **projeção derivada** (read-model); o backend é plugável do **solo ao enterprise** (arquivos → SQLite → Neo4j → Mongo), sem re-modelar. Provado nos 4 paradigmas.
- **O host AGREGA projeções PUBLICADAS, não bancos vivos.** Cada repo publica seu `context.json` (com o SEU backend); o host agrega sem abrir banco nenhum.
- **Advisory, não decide.** O matcher (roteamento) e as derivações **sugerem**; o **humano confirma** (o gate). A automação nunca fecha o gate.
- **Modelar TODOS os fluxos.** Framework de governança prevê tudo (capacidade, SLA, release/rollback, SLO, incident, …). O que se **faseia** é a construção.
- **Anotar uma vez; o reverso é derivado.** O dado mora no NÓ; a aresta se anota de um lado só.
- **Intent ≠ work · a intent NÃO delibera.** O objetivo durável (intent) não faz q/r/d; ele tem um **gate de ativação**. O raciocínio q/r/d é dos works/explorations.
- **Classificação & saída de dado (🟢 novo).** Todo nó carrega `classification` (public/internal/confidential/restricted) + `visibility/access`; a escolha do matcher **léxico-local × API externa** se **amarra à classificação** — dado sensível **não sai da máquina**. Redaction e permissão são do MODELO, não extras.
- **Integridade transacional (🟢 novo — Lente 8).** Toda mutação e publicação carrega um **envelope** (actor/authority/base-revision/idempotency/schema/…); o file-first só é confiável multiusuário/multirrepo com ele — o grafo quebra por corrida/stale/ref antes de quebrar por tipo.

## Lente 2 · O fluxo da iniciativa (registro → … → breakdown)

A pipeline ponta-a-ponta, com **3 papéis** (negócio · engenharia · dono):

```
NEGÓCIO ── registrar ─► [registrada] ── (detalhe: ver/editar) ── iniciar triagem ─►
ENG     ── [triagem] ── itens (dúvidas de negócio OU levantadas pela eng) · dispõe cada (exploration/responde-direto/falta-info)
                        · SIMULA o matcher (léxico/LLM local/API) · valida contratos ─►
        ── [investigação] ── explorations disparadas rodam nos work-repos → verdicts (viabilidade é TESTADA) ─►
HUMANO  ── [GATE] ── promover│descartar ─►
        promover → consolida (register+triage) em intents/<id>/intent.yml + move candidata p/ archived/ (ciclo fechado)
        descartar → só arquiva
        └─► [intent ATIVADA] ── breakdown (ato do dono) ─► WORKS + instrumentos (Lente 3)
```

- **Registro (negócio):** título + **descrição** (o par mais importante) · enquadramento (problema de negócio/cliente · driver/métrica) · pessoas (`registered-by` · `owner` accountable · `stakeholders`) · referências · **dúvidas** de negócio. Contratos/explore-points **não** entram aqui. id gerado no submit (não editável).
- **Triagem (eng):** cada dúvida vira um **item** com identidade própria; dispõe (`exploration`/`answered`/`needs-info`); o **matcher advisory** sugere repos; valida **contratos** (dos `provides` reais). `needs-info` volta pro negócio com `assignee` + `blocked-since` (tempo bloqueado = derivado, medível).
- **Investigação:** as explorations rodam nos repos, publicam verdict; a **viabilidade** pode reprovar a iniciativa.
- **Gate:** decisão HUMANA (não deliberação), **append-only** — `gate-decision` + (se reverter) `gate-reversal` + nova decisão; **nunca overwrite**. `promoted` | `discarded` (inviável × repriorização, pelo rationale). Registra se **seguiu ou contrariou** o matcher (+ rationale).
- **Dois "gates" separados (🟢 novo):** o **gate de ATIVAÇÃO** (humano, register→intent) ≠ a **`explore-resolution`** (DERIVADA: `unanswered`/`answered`/`pursued`/`not-pursued`). A derivada **informa**, não fecha — só o humano ativa. _(corrige o "segundo gate": o `deriveGovernance` para de usar `accepted/rejected`.)_
- **Stale-invalidation (🟢 novo):** triage/gate salvam o `base-revision` (digest) do register; se o register muda depois, a triagem/gate ficam **stale** → invalida ou exige re-triagem.
- **Ativação:** consolida + move como **operação idempotente com recuperação** (falha no meio → retoma sem intent-órfã); refs por **`GlobalRef` estável** (Lente 7); `git mv` preserva histórico.
- **Breakdown:** o **dono** materializa os works (draft) pós-ativação, contra os contratos `known` (ver Lente 3/5).

_(Detalhe: [`research/2026-06-30-initiative-to-works-flow.md`](research/2026-06-30-initiative-to-works-flow.md) · deliberações de [registro/triagem/gate](deliberation/2026-06-30-intent-authoring-shape-deliberation.md).)_

## Lente 3 · As famílias (a taxonomia — supersede os "5 tipos")

Cada nó pertence a uma **família por natureza da saída**. O teste: _"entrega valor de PRODUTO?"_

| família         | produz                                     | membros                                                                          |
| --------------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| **CAPACIDADE**  | valor de produto (cria/mantém capacidade)  | **`delivery`** (cria capacidade) · **`maintenance`** (preserva/restaura/adapta)  |
| **APRENDIZADO** | conhecimento (reduz incerteza; executável) | **`exploration`** (investiga sem shippar) · **`experiment`** (aprende shippando) |
| **RESPOSTA**    | contenção reativa                          | **`incident`** (declarar→mitigar→resolver→postmortem)                            |
| **INTAKE**      | captura + triagem                          | **`proposal`** (ideias) · **`register`** (iniciativas)                           |
| **DELIBERAÇÃO** | o raciocínio (q→r→d, o ✦ coração)          | **`question`** · **`research`** · **`decision`**                                 |

**🟢 As mudanças-chave (deliberação [taxonomia](deliberation/2026-06-30-work-taxonomy-deliberation.md)):** `incident` saiu de "trabalho" → **RESPOSTA** (instrumento reativo; **não** sai de breakdown planejado; gera fix/maintenance/delivery/proposal). `experiment` saiu → **APRENDIZADO** (instrumento que shippa; output = won/lost/inconclusive; **won → delivery**). `fix`+`patch` colapsaram em **`maintenance`** (o "usuário vê" virou dimensão).

## Lente 4 · As dimensões ortogonais (o que corta as famílias)

O "tipo" não carrega reatividade/visibilidade/urgência — essas são **dimensões** (cada uma com **enforcement**: workflow/lint/dashboard; senão é tag decorativa):

- **`source`**: `planned` · `reactive` _(universal — vale p/ maintenance E p/ instrumentos: proposal proativo / incident reativo)_
- **`visibility`**: `user-visible` · `internal` · `operator-visible` · `security-visible`
- **`maintenance-mode`**: `corrective` · `adaptive` · `perfective` · `preventive` _(só maintenance — ISO/IEC 14764)_
- **`change-class`**: `standard` · `normal` · `emergency` _(ITIL)_
- **`service-class`**: `expedite` · `fixed-date` · `standard` · `intangible` _(Kanban)_
- **`planned-in`**: a intent (se houver; reativos podem ser standalone)

**🟢 Presets humanos (UX, não ontologia):** "fix" = `maintenance+corrective+user-visible` · "security patch" = `maintenance+corrective+security-visible` · "bump de dep" = `maintenance+adaptive+internal`. A pessoa escolhe um preset; o sistema preenche as dimensões.

**🟢 Densidade é por INSTÂNCIA** (pasta/registro próprio escala com o peso), não por família — só os campos exigidos (hipótese/métricas no experiment; severidade no incident) são por membro.

## Lente 5 · Os ciclos de vida

**Os 5 momentos** (comuns): **abrir** → **investigar/decidir** ✦ → **executar** → **entregar** → **acompanhar**. O ✦ (q/r/d) é 🟡 opcional (sem lint) mas é **onde está o valor**; pular abre mão do rastro de decisão.

**Lifecycles próprios (por família/membro) — 🟢/🔶:**

- **`delivery`**: brief → q/r/d próprio → merge → (🟡 verificar valor). `active` exige `assignee` + início.
- **`maintenance`** 🔶: brief leve → merge → verificar; o `maintenance-mode` guia (corrective/adaptive/perfective/preventive). Densidade por instância.
- **`exploration`**: timebox + **pergunta falsificável** + **stop-rule** + **loop-budget** (`max-runs`/`decision-deadline`) → `exploration-answer` + `fate` obrigatório (throwaway/promoted/parked). Gate de viabilidade **antes** do compromisso. 🔶 disparar de verdade no work-repo.
- **`experiment`** 🔶: `experiment-brief` sela hipótese+métricas → roda atrás de **flag** (exposição/guardrail/duração/decision-rule) → **`experiment-outcome`** (won/lost/inconclusive) + **cleanup obrigatório** (flag/variante morta) + **loop-budget** (inconclusivo não repete sem `decision-deadline`). won → `delivery`.
- **`incident`** 🔶: **declarar** (severidade) → **mitigar** (destrava merge/CI com prazo, blameless) → **resolver** → **postmortem** (garantido por alerta) com **`postmortem-action` obrigatório** (owner/priority/due/verification/escalation — não fecha sem ações rastreáveis) → gera fix/maintenance/proposal.
- **`proposal`**: intake humano a qualquer momento → triagem (disposição obrigatória: promove/descarta).

**🟢 "Bloqueado"/"pausado" = DERIVADOS** (de `blocked-by` + status dos bloqueadores), não guardados. Status próprio = `draft | active | done`.

## Lente 6 · O grafo (as ligações)

Conjunto fechado de arestas, cada uma com critério único (anota-se 1 lado; o reverso o banco deriva):

- **estrutura:** `breaks-into` (intent → suas partes).
- **proveniência:** `derives-from` ⟷ `results-in` (B se baseia na saída de A; ex.: `experiment` won `results-in` `delivery`) · `raises` (levanta um `proposal`).
- **dependência:** `blocked-by` ⟷ `blocks` (espera um trabalho) · `depends-on` (plataforma/versão) · `coordinates-with` → o **CONTRATO**, que agora é um **NÓ VERSIONADO** (🟢 novo: owner/provider/consumers/compatibility/lifecycle/change-windows), não uma string.
- **investigação:** `answers` (a exploration declara a dúvida que responde) · `supported-by` (a decisão se apoia na evidência) · **`explore-resolution`** (🟢 novo — DERIVADA: unanswered/answered/pursued/not-pursued; informa o gate, **não** fecha).
- **fecho:** `closed-by` (→ answer/outcome/postmortem).
- **histórico & identidade:** `supersedes` (decisão nova substitui a antiga; append-only) · **`duplicate-of`/`revived-from`/`supersedes-register`** (🟢 novo: candidata re-registrada/duplicada aponta pro canônico; descartada vira **tombstone**).
- **resposta (do incident):** `occurred-during` · `caused-by` · `related-to` (ligam o **`incident`** reativo a works/intents **sem** ser filho de breakdown).

## Lente 7 · Camadas físicas & governança (o mais genérico/concreto)

- **A candidata (pré-ativação):** `acme-governance/registers/candidates/<id>/{register.yml · triage.yml · gate.yml}`. Ao fechar o gate → `promoted` consolida em `intents/<id>/intent.yml` + move p/ `registers/archived/<id>/`; `discarded` só arquiva. **Ciclo fechado.**
- **A intent ativada:** `acme-governance/intents/<id>/intent.yml` (só o relevante, consolidado).
- **Por repo de trabalho:** `.governance/` (sidecar) com `manifest.yml` (a camada de **CONHECIMENTO**: role/owner/domain/provides/consumes/capabilities/architecture) · `registry/<kind>.yml` · `works/…` · `explorations/…` · `context.json` (projeção **publicada**, versionada; freshness no pre-commit) · `.cache/` (gitignored) · `backend.yml`.
- **O host** (`acme-governance`) auto-descobre os repos, deriva as arestas cross-repo (`provides×consumes` → `coordinates-with`) e agrega os `context.json`.
- **Identidade — `GlobalRef` (🟢 novo):** `family:namespace/id#anchor@revision` (não só `slug_random`); random maior; **tombstone** p/ descartados; o resolver desambigua candidate/intent/archived e detecta reuso/colisão.
- **`context.json` com ENVELOPE (🟢 novo):** `schema-version`/`generated-at`/`source-commit`/`producer`/`ttl`/`hash` — o host valida schema/frescor/origem ao agregar (não confia num snapshot cru).
- **Contrato = nó versionado (🟢 novo):** vive na governança (owner/provider/consumers/compatibility/lifecycle); os repos referenciam por `GlobalRef` — resolve N iniciativas / versão / breaking-change.
- **O matcher** (roteamento vertical, advisory): porta plugável — espectro **léxico (zero infra) → LLM local (Ollama embed/generate) → API/plano (Gemini/Claude/OpenAI)**. Simulável na triagem. Lição: no fácil o barato basta; no difícil o LLM ganha; a **qualidade da capability** é a alavanca. _(Detalhe: [`_org-simulation-v2/MATCHER.md`](_org-simulation-v2/MATCHER.md).)_
- **A app** (`_org-simulation-v2/_app`): file-first sobre a `_lib`; telas de registro · detalhe da candidata · triagem (com matcher simulável) · gate/ativação · intent. É **projeção**, não o modelo.

## Lente 8 · Integridade transacional & o envelope de governança (o primitivo que sustenta o file-first)

> A auditoria de ponta a ponta (rodada 3, [`_audits/`](_audits/)) achou o buraco sistêmico: o v2 é sólido como **conceito**, mas frágil como **sistema multiusuário/multirrepo** — quebra por corrida/stale/ref antes de por ontologia. O conserto é um **envelope universal** que TODA mutação e publicação carrega:

- **quem & autoridade:** `actor` · `authority` (o papel que autoriza a transição).
- **base & idempotência:** `base-revision` (o que foi confirmado) · `command-id`/`idempotency-key` (a mesma operação não duplica) · `revision`/`etag` (last-write-wins vira **detecção de conflito**).
- **schema & origem:** `schema-version` · `source-commit` · `producer` · `generated-at` · `ttl`/`freshness`.
- **segurança:** `classification` · `visibility/access` (+ redaction/**egress**: a escolha léxico-local × API se amarra à classificação).
- **invalidação:** `invalidates` — mudar o `register` invalida triage/gate stale; mudar a capability invalida a sugestão do matcher.

**Consequências no modelo (🟢):** gate **append-only** (decisão + reversal) · **move idempotente com recuperação** · **matcher accountability** (o gate registra se seguiu/contrariou a sugestão + rationale) · **concorrência** (lock curto por candidato / detecção de conflito por `revision`) · **loop-budget** nos instrumentos de aprendizado. _(Mecanismos de implementação: [`features.md`](features.md).)_

---

## Ponteiros

- **v1 (histórico completo, com as idas-e-vindas):** [`tracker-v1.md`](tracker-v1.md) — 5 lentes, todas as 🟢 decisões originais.
- **Deliberações (q/r/d):** [`deliberation/`](deliberation/) — taxonomia · registro-triagem-gate · intent-não-delibera · manifest-shape · projeções-publicadas · roteamento-vertical.
- **Fluxo & researches:** [`research/2026-06-30-initiative-to-works-flow.md`](research/2026-06-30-initiative-to-works-flow.md) + [`research/`](research/).
- **Features a implementar (roadmap):** [`features.md`](features.md).
- **Simulação & templates:** [`_org-simulation-v2/`](_org-simulation-v2/) · [`_templates/`](_templates/).

## 🔶 Abertos (a validar/estressar — depois: simular robusto)

> _As 3 auditorias adversariais estão em [`_audits/`](_audits/); a rodada 3 (ponta-a-ponta) virou a **Lente 8** + as correções (explore-resolution, gate append-only, contrato-nó, GlobalRef, loop-budget, classificação). Rodada 4 (régua mais alta) pendente._

1. **Enforcement** de cada dimensão + do envelope (lint/workflow/dashboard) — é o que separa "modelado" de "confiável" (→ `features.md`).
2. **O breakdown** (Lente 2/3): quais famílias saem do plano · granularidade (1 explore-point → 1 delivery? N→1?) · quem faz (dono × eng) · política de slicing + aprovação do contract-owner.
3. **Materializar** as arestas/primitivos novos (incident `occurred-during`/`caused-by` · `explore-resolution` · contrato-nó · `GlobalRef`/tombstone · envelope).
4. **A nova simulação robusta** sobre a taxonomia v2 + o envelope — **só depois** de validarmos as lentes aqui (e da rodada 4).
