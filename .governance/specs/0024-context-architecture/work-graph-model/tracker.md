# Tracker v2 — o modelo do trabalho como grafo tipado (9 lentes, do amplo ao genérico)

> **SSOT vivo desta frente.** Síntese **refinada** do que aprendemos na v1 ([`tracker-v1.md`](tracker-v1.md)) — sem o histórico de "era isso → virou isso". As 9 lentes vão do **mais amplo** (propósito) ao **mais genérico** (primitivos: dimensões · arestas · camadas físicas · o envelope transacional · as fronteiras de confiança).
>
> **▶ ESTADO ATUAL (2026-07-03):** o modelo vive em [`model.yml`](model.yml) (**SSOT v2 limpo aplicado**). O enum antigo `strategy` foi absorvido: `intent.approach = validate-first|direct` + `signal = none|touches-contract|operational-target`; `execution-unit` usa os nomes finais (`delivery-slice`, `graduation`, `release-rollout`, `discovery`). As antigas open questions Q-strategy/Q-collapse/Q-discover-level/Q-names estão fechadas no próprio SSOT. A org simulada v3 é a frente ativa de dogfood físico: 13 repos acme com código MVP, sidecars `.governance`, `context.json`, repo-work lifecycle, repo-contract registries com interface, trust-policy, outcomes/verdicts, app Next/MUI, runtime file-first e fixtures adversariais; o host valida stale/missing/open/replay por resolver fail-closed. Integrações externas agora têm catálogo versionado em [`integration-catalog.yml`](integration-catalog.yml): são opcionais e entram como evidence providers/importers/projections, nunca como SSOT paralelo. **Este tracker é EMBASAMENTO** (o porquê e as lentes), não autoridade. O `_map/` é GERADO do `model.yml` (`generate.mjs` · `--check` semântico · coverage manifest). Próxima fase: revisão/walkthrough pós-F7 e uso de Claude Code/Fable 5 para auditar a sim robusta antes da próxima fatia.
> **Regras:** recência vence · conferir o já-decidido antes de desenhar · uma pergunta por vez · linguagem simples · docs externos **inspiram, não definem** (nem se versionam/citam) · **modelar todos os fluxos** (a implementação se faseia em [`features.md`](features.md), o modelo não).
> Org fictícia ANONIMIZADA (`acme-*`). 🟢 = decidido · 🔶 = a estressar. Não-autoridade; em divergência vencem `state.yml`/gates/Git.

---

## Caminho para a validação ponta-a-ponta

> Registrado em 2026-07-01; **ordem decidida pela owner**. A barra (da sim adversarial): **resolver + fail-closed + evidência independente, provado num fluxo real**. O modelo ([`model.yml`](model.yml) v2) está fechado e revisado (P1–P11); estas são as frentes que faltam para o selo, na ordem de execução:

1. ✅ **Fechar o desenho do modelo principal** — Q-strategy/Q-collapse/Q-discover-level/Q-names fechadas no `model.yml`: approach/signal aplicado, collapse-rule final, `discovery` adicionada, nomes finais aplicados.
2. ✅ **Dogfood físico repo-first** — v3 materializa repos existentes com código MVP + sidecars; host agrega projeções publicadas e valida `context.json`, `repo-work` e `repo-contract`.
3. ✅ **Publicar outcomes reais** — `intent-cta-upgrade` fecha `outcomes.yml` até o dashboard: source/revision/window/attester/envelope/contract-revisions resolvidos.
4. ✅ **Lifecycle repo-local** — peças reconhecidas pelos repos transicionam `acknowledged → active → done|blocked|dropped`; outcome não soma se a peça necessária não fechou.
5. ✅ **Aprofundar fidelidade dos repos** — repos críticos têm testes locais, schemas/eventos/contratos concretos e drift código↔governança falsificável.
6. ✅ **Catálogo de integrações opcionais** — adapters externos mapeados como evidence providers/importers/projections; o framework funciona sem eles.
7. ⬜ **Re-validação independente (Claude Code/Fable 5 + owner)** — re-percorrer as jornadas big/mid/trio/solo/ciclo anual com o SSOT limpo e a v3 física.
8. ⬜ **Selo do PR #45** — reconciliar PR body/tasks/state da spec + Ready/Human Gate quando a owner decidir.

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

## Lente 9 · Fronteiras de confiança & política (autenticidade × integridade — o que a L8 não resolve)

> A auditoria rodada 4 ([`_audits/`](_audits/)) achou que a L8 garante **integridade** (o dado é consistente/fresco), mas **tudo é AUTOCERTIFICADO** — `classification`/`authority`/`actor`/`hash` o próprio ator preenche. O envelope prova **quem declarou**, não que é **verdadeiro/autorizado/independente** → "auditoria de mentiras bem-formadas". Falta representar **onde termina a confiança** e como o sistema reage quando um ator autorizado **mente**.

- **Trust boundary = entidade de 1ª classe:** onde a confiança termina · quem atravessa · com qual **prova** · o que acontece na travessia (o matcher/agente/backend/API são **fronteiras**).
- **Política NORMATIVA governada (≠ ontologia):** segurança precisa de controle **versionado**, não de "inspira-não-define". Artefatos: `threat-model.yml` · `egress-policy.yml` · `agent-delegation-policy.yml` · `policy-catalog.yml` · `red-team-corpus/`.
- **Egress por taint/classificação derivada:** um nó que usa contexto restrito herda **teto de egress**; o matcher externo só recebe **fatias aprovadas por política** (resolve o vazamento por **inferência** — capabilities internas reconstruindo o segredo).
- **Input hostil (prompt injection no plano de governança):** `register`/`triage`/capability entram **crus** no matcher/agente → o matcher é **não-confiável**; nunca vira ação sem **validação estrutural**. `red-team-corpus/` (register malicioso, capability envenenada).
- **Delegação formal (agente como ator):** `actor=agent` exige vínculo verificável — **principal humano → workload-id do agente → escopo → TTL → policy-id → max-mutations → confirmação-humana** p/ gate/egress/escalation.
- **Verificação × autocertificação:** trusted-producers · provenance (estilo SLSA/transparência) · verificar **policy** antes de aceitar `context.json` (assinatura sem policy ≠ confiança). Provenance prova **origem, não verdade** → **invariantes conteúdo×código×contrato** antes de aceitar (a sim: E1). **Capability** ganha `evidence`/`owner-attested-by`/`observed-from`/`last-verified` (IA só abre PR, não atualiza o SSOT). **🟢 Rebaixamento (sim, B1):** a **verdade** de capability é inenforcável → é **advisory + drift** (`observed-from`); mas há **dente barato e real** — capability sem `owner-attested-by` **independente** / `evidence` / `observed-from` fresco → **excluída ou `unknown`** (não usada com peso igual). Não perseguir "prova de verdade" (seria o teatro).
- **Anti-gaming (invariantes + quotas):** `expedite` tem orçamento por time · `incident` exige evento/severidade/telemetria · downgrade de `classification` exige **approver separado**.
- **Supply-chain dos backends/matchers:** allowlist · secrets fora do YAML · least-privilege no DB · TLS/pin fora da sim · CLI-delegate em **sandbox** (sem rede/home/tokens). _(hoje a sim tem `simsim123`/CORS `*`/`/match` client-config — ok pra sim, **não** pra "robusta".)_

**🟢 As 3 leis do red-team (simulação adversarial 2026-07-01 · [deliberação](deliberation/2026-07-01-adversarial-simulation-red-team-deliberation.md)):**

- **Lei do fallback/break-glass:** todo controle que **bloqueia** precisa de um caminho **seguro, útil e rastreável** — senão não impede o risco, empurra pro **bypass invisível** (egress bloqueado → resumo colado fora do fluxo) ou causa **dano operacional** (rollback legítimo travado). Bloqueio sem saída rastreável é **pior** que advisory.
- **Lei da independência:** não se enforça a **verdade** de quem declara; enforça-se a **independência** de quem verifica — no **fluxo** (`requester ≠ approver ≠ owner-attester`, o SoD) **e** no **meta** (o `policy-catalog`/`red-team-corpus`/expected-outcomes precisam de autoria/aprovação **independente** dos atores que governam — o "ataque ao oráculo").
- **Lei da dependência verificável:** nenhuma **ação derivada** é aceita sem declarar/validar as **revisões** de dados · política · schema · projeção que a sustentam; se qualquer base muda → **stale**/revalidar (generaliza `base-revision` p/ `policy-revision`/`source-revision`/`schema-version`).

**⚠️ "Governance theater" — o veredito da sim (rounds 1+2):** a régua era enforcement REAL × cerimônia. Achado: o modelo **não** está over-engineered, está **SUB-MECANIZADO** (a L9 é majoritariamente declarativa). **Barra:** só "pega" com **resolver/invariante + fail-closed + evidência independente** — "controle nomeado" sem mecanismo é cerimônia. **Nada a podar**; a régua de 7 eixos é instrumento de avaliação, não ontologia persistida; só os **números** (quota de `expedite`, scoring, regras finas de break-glass) vão pro **policy-pack**.

---

## Ponteiros

- **v1 (histórico completo, com as idas-e-vindas):** [`tracker-v1.md`](tracker-v1.md) — 5 lentes, todas as 🟢 decisões originais.
- **Deliberações (q/r/d):** [`deliberation/`](deliberation/) — taxonomia · registro-triagem-gate · intent-não-delibera · manifest-shape · projeções-publicadas · roteamento-vertical.
- **Fluxo & researches:** [`research/2026-06-30-initiative-to-works-flow.md`](research/2026-06-30-initiative-to-works-flow.md) + [`research/`](research/).
- **Features a implementar (roadmap):** [`features.md`](features.md).
- **Auditorias adversariais (evidência):** [`_audits/`](_audits/) — 4 rodadas (benchmark · taxonomia · ponta-a-ponta · fronteiras de confiança).
- **Simulação ativa:** [`_org-simulation-v3/`](_org-simulation-v3/) — dogfood físico repo-first + base runtime `_lib` + exemplos de backends derivados + smoke/loader file+Neo4j. Layout aplicado: host central em `_org-simulation-v3/acme-governance/`; repos adotados em `_org-simulation-v3/repos/<repo>/`; standalone repo-local em `repos/<repo>/.governance/works/*.yml`; incidentes centrais em `acme-governance/incidents/`; exemplos em `_org-simulation-v3/_examples/backends/{file,neo4j,sqlite,mongo}`.
- **Requisitos do app ponta-a-ponta:** [`app-requirements.md`](app-requirements.md) — contrato de produto/arquitetura para portar backend/frontend v3 sem perder os aprendizados da v2.
- **Templates:** ativos da sim em [`_org-simulation-v3/_templates/`](_org-simulation-v3/_templates/); o caminho [`_templates/`](_templates/) é ponte histórica e os templates v2 foram arquivados em [`_archive/templates-v2/`](_archive/templates-v2/).

## 🔶 Abertos & próxima fase

> _As **4 auditorias** ([`_audits/`](_audits/)): r1→`source`/incidente · r2→famílias · r3→**L8** · r4→**L9**. A **simulação ADVERSARIAL** (red-team doc-first · [deliberação](deliberation/2026-07-01-adversarial-simulation-red-team-deliberation.md)) rodou (**rounds 1+2**, Codex atacante) e **encerrou**: veredito = **sub-mecanizado, não over-engineered** → 3 leis novas + ~11 dentes P0. A v3 agora tem uma primeira leva física desses dentes: outcome real, lifecycle repo-local, drift, contrato local e trust-policy._

1. **▶ Revalidação pós-F7:** pedir revisão adversarial ao Claude Code/Fable 5 sobre o diff desde `a970415b`, sem implementar.
2. **▶ Walkthrough da owner:** percorrer a cadeia `objective → target → intent → repo-work done → outcome → actual` nos apps.
3. **▶ Segunda prova de generalização:** publicar outcome de uma intent com contrato ou target operacional para detectar especialização acidental no `intent-cta-upgrade`.
4. **▶ Caminho standalone/reativo:** publicar outcome operacional sem intent para validar o bucket operacional e o colapso solo.
5. **▶ Decisões append-only remanescentes:** converter warnings legítimos em decisões governadas quando a owner aceitar colapso/exceção.
