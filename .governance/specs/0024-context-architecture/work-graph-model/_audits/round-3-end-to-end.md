# Auditoria rodada 3 — o fluxo novo, ponta a ponta

- Data: 2026-06-30 · agente revisor externo · **apoio, não-autoridade**. Fatos verificados contra o repo (HEAD `cc60e112`, ahead 23, PR #45 CLEAN, `state.yml` implementation, `model.ts` ainda 5 WorkKind, `deriveGovernance` usa accepted/rejected).
- **Incorporado:** a **Lente 8** (envelope de governança) + as correções: `explore-resolution` × gate · gate append-only · contrato-nó · GlobalRef/tombstone · loop-budget · classificação/egress · stale-invalidation · move idempotente.

## Prompt

```
Rodada 3 — do FLUXO NOVO INTEIRO, ponta a ponta. Va ALEM DO OBVIO: problemas de INTEGRACAO e casos
de borda nao percebidos. LEIA: tracker.md v2 (8 lentes), a deliberacao da taxonomia, registro/
triagem/gate, o fluxo, features.md, model.ts + _app. NOTA: taxonomia v2 decidida nos docs, migracao
do codigo P0-pendente. Audite a SOLIDEZ end-to-end. Estresse (edge cases/falha/contradicao/escala):
(1) transicoes & reversibilidade (descartar->re-registrar? reverter gate? reabrir exploration?
editar register apos triagem?); (2) concorrencia file-first (duas pessoas no mesmo triage.yml; move
na ativacao correndo com exploration em voo; staleness do read-model); (3) identidade & refs no move
candidates->intents->archived (colisao? refs penduradas? tombstone?); (4) breakdown (quem? 1
explore-point->N works? contrato compartilhado?); (5) familias x dimensoes na pratica; (6) matcher
(stale/zero-match/over-trust); (7) instrumentos que geram trabalho (loops infinitos?); (8) os DOIS
gates; (9) cross-repo/cross-iniciativa; (10) o que falta no DIA 1 fora do features.md. SAIDA: tabela
+ top riscos NAO-OBVIOS + veredito end-to-end + "a UNICA maior coisa que nao estamos vendo".
```

## Resposta (verbatim, condensado)

**Veredito curto.** O fluxo v2 é conceitualmente sólido, mas ainda frágil como **sistema operacional multiusuário/multirrepo**. O problema novo não é a taxonomia: é que as **transições críticas ainda não têm "contrato transacional"** suficiente. Registro, triagem, gate, ativação, publicação de `context.json` e breakdown precisam carregar **revisão-base, ator, autoridade, idempotência, invalidação e envelope de confiança**. Sem isso, o grafo quebra por corrida, stale state e referência ambígua **antes** de quebrar por ontologia.

**Gaps não-óbvios (essência).**

- **Candidata arquivada após discard** × Linear Triage (accept/duplicate/decline/snooze): re-registrar vira nó solto → `duplicate-of`/`revived-from`/`supersedes-register`/`reopen-request` + resolução terminal tipada.
- **Editar register após triagem** × GitHub stale approvals: triage/matcher/contracts ficam stale → `register-digest`/`base-revision`; mudança invalida ou re-triagem.
- **Gate promovido/descartado** × Jira Reopened/Resolved: reverter gate hoje = edição destrutiva → **gate append-only** (`gate-decision` + `gate-reversal`), nunca overwrite.
- **File-first write/move** × branch protection/merge queue: last-write-wins; ativação corre contra exploration em voo → `revision`/`etag`/`command-id`, lock curto, **idempotência** em promote/discard.
- **`id` slug+random16** × Backstage tripla kind/namespace/name: colisão/reuso/refs ambíguas → **`GlobalRef`** `family:namespace/id#anchor@revision` + random maior + tombstone.
- **`context.json` publicado** × Backstage uid/etag: agrega snapshot sem prova de schema/commit/frescor/origem → envelope `schemaVersion/generatedAt/sourceCommit/producer/ttl/hash`.
- **Matcher advisory** × Linear Triage Intelligence: humano aceita sugestão velha/errada sem rastro → persistir sugestão versionada + `accepted/overridden-by` + rationale.
- **Dois gates** × OST: `deriveGovernance` chama exploration "accepted/rejected" (2º gate automático) → renomear `explore-resolution` (`unanswered/answered/pursued/not-pursued`); `gate` só humano.
- **Breakdown** × Azure Boards links: 1↔N works sem política; contrato compartilhado frouxo → `breakdown-plan` (owner/base-evidence/slicing/dependency/contract-owner approval).
- **Contrato = string** × Backstage relations: não aguenta versão/owner/consumers/breaking-change → **nó versionado**.
- **Incident→ações** × Google SRE: postmortem sem ações rastreáveis → `postmortem-action` obrigatório (owner/priority/due/verification/escalation).
- **Experiment/flag cleanup** × LaunchDarkly: inconclusivos repetem; flags órfãs → loop budget (`max-runs`/`decision-deadline`/`cleanup`).
- **Capacidade** × Kanban: fila cresce sem dono/limite → WIP/aging/policy/pull criteria.
- **Release/rollback** × DORA/SRE canary: works fecham no merge → nó `release/change-plan` (deploy window/canary/rollback/monitors/deployment→incident).

**Top riscos não-óbvios.** (1) stale approval silencioso; (2) segundo gate fantasma; (3) move-na-ativação sem transação de domínio; (4) identidade fraca p/ escala; (5) contrato como string; (6) exploration/experiment loops sem freio; (7) matcher sem accountability no gate; (8) **segurança e privacidade quase invisíveis** — register/triage carregam dado de cliente/estratégia/incidente/anexos, o matcher pode mandar texto pra API; `features.md` não modela classificação/permissão/redaction/egress.

**Veredito end-to-end.** Como modelo conceitual, o v2 é defensável (separa intake, triagem, evidência, decisão humana, intent ativada, execução). Como sistema vivo, ainda não aguenta o primeiro ambiente com **duas squads editando, capabilities stale, uma candidata duplicada, e um rollout cross-repo com incidente no meio**.

**A única maior coisa que ainda não estão vendo:** **não existe um envelope universal de governança para mutações e publicações.** Todo nó/evento/snapshot deveria carregar `actor` · `authority` · `baseRevision` · `commandId` · `idempotencyKey` · `schemaVersion` · `sourceCommit` · `classification` · `visibility/access` · `freshness/ttl` · `invalidates`. Não é implementação "enterprise"; é o **contrato que torna file-first confiável**.
