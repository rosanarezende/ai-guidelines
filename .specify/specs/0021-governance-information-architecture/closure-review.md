# Closure Review — Spec 0021 Governance Information Architecture

> Documento de fechamento da Spec 0021. **NÃO é parte do template SDD vigente** — nasce de uma necessidade descoberta durante a sessão de design 2026-05-18, que revelou que o lifecycle metodológico atual (spec → decision-brief → plan → tasks) não comporta o tipo de revisão crítica que uma foundation/convergence spec exige no seu encerramento. Esta revisão é, ela mesma, uma evidência empírica para a Spec 0023 (Governance Workflow & Discovery Model) sobre o que falta no lifecycle vigente.

> **Disciplina aplicada:** este documento NÃO tenta resolver a 0022, NÃO antecipa a 0023, NÃO redefine o novo lifecycle, NÃO redesenha boilerplates, NÃO absorve runtime redesign. Funciona como análise de convergência, boundary review e debt transfer assessment dos LIMITES corretos da 0021.

---

## 1. Propósito desta revisão

A Spec 0021 começou em 2026-05-08 com escopo de **arquitetura de informação** (4 frentes: repo-first híbrido, placement documental, re-arquitetura DDD da CLI, Living Documentation com drift guard). Ao longo de seis meses de execução em Harness Lock de 5 PRs (PR1–PR4 já mergeados, PR4 em PR aberto #14 atual), o escopo expandiu duas vezes:

- **Expansão 1** (2026-05-09, gate humano de Stage 1): incorporou re-arquitetura DDD da CLI e Living Documentation como entregas próprias.
- **Expansão 2** (2026-05-17, amendment retroativo em 4.E): repositioning **governance-first → AI-as-channel**, formalizando que o produto deixou de ser "uma CLI AI-first focada em specs" e virou um sistema de governança onde IA é canal e specs são uma capability entre várias.

Essas expansões transformaram a 0021 em **spec de fundação** — ela não entrega uma feature, ela estabelece o paradigma sobre o qual o framework opera daqui pra frente. Mas isso cria um risco: quando a spec de fundação encerra, ela pode acumular itens "empurrados com a barriga" porque o próprio paradigma ainda está se consolidando, e o lifecycle vigente não tem ritual de fechamento que distinga "completou seu escopo" de "deixou tarefas para depois".

Esta closure-review existe para **interromper esse risco**. Ela mapeia:

- o que a 0021 efetivamente consolidou;
- o que ela estabilizou em estado de "bridge intencional";
- o que ela deliberadamente NÃO resolveu (e por quê);
- quais problemas ela revelou que **não deveria** resolver (legítimo: sair do escopo);
- quais débitos foram corretamente transferidos para `roadmap/backlog.md` (canônico) vs quais ainda estão como "spec futura sem dono" (risco);
- quais novos espaços arquiteturais a 0021 desbloqueou para specs sucessoras;
- quais itens do `tasks.md` ainda em `[ ]` são razoáveis fechar como homologação operacional vs quais já não pertencem mais ao escopo da 0021.

---

## 2. O que a 0021 consolidou (resolvido)

### 2.1 Frente A — Repo-first híbrido + `.governance/` canônico

**Entregue:**

- Modelo canônico de estado estruturado no repositório (`.governance/` como root unificado do consumidor; `.specify/` como bridge legada explícita).
- Taxonomia de 7 pilares aprovada no gate (`spec`, `spike`, `fix`, `patch`, `incident`, `proposal`, `experiment`).
- `GovernanceWorkspace` com adapter real (`NodeWorkspaceProvisioner`) — sub-bloco 2.A.
- Reservas canônicas para `intake/`, `handoff/`, `telemetry/` em `RESERVED_GOVERNANCE_DIRS` + `ReservedDirsContract.test.ts` como drift guard estrutural — sub-bloco 2.D.

**Evidência:**

- `ARCHITECTURE.md` §C invariante 12 + §H (contrato `.governance/`).
- `src/domain/workspace/`, `src/infrastructure/workspace/`.
- `audit-2026-05-10-pre-2d-sanitization.md`.

**Limite correto:** a 0021 entregou o **contrato** e a **provisão física** do `.governance/`. **Não entregou** a totalidade de use cases que **operam** sobre o `.governance/` — isso continua parcialmente em `cli/` mjs (ver 2.5).

---

### 2.2 Frente B — Placement documental + fronteira ADR/foundation

**Entregue:**

- Renomeação `spec-foundation.md` → `governance-foundation.md` (sub-bloco 4.B.1) — reflete paradigma governance-driven.
- 5 ADRs fundacionais consolidadas em `.core/governance/adrs/` (sub-bloco 3.0.B): taxonomia MECE (0001), outcomes enum (0002), bypass auditável (0003), AST como SSOT (0004), validação semântica vs estética (0005).
- Auditoria das ADRs legadas em `/adrs/` com critério editorial "ADR é princípio perene" — sub-bloco 4.B.4.
- ADRs 0017–0018 produzidos durante 4.B.2: fluxo decision-brief ↔ ADR ↔ policy + repositioning governance-first/AI-as-channel.
- `GOVERNANCE-CATALOG.md` como carrier híbrido da política de arquitetura de informação — sub-bloco 4.A.

**Evidência:**

- `.core/governance/adrs/` (8 ADRs ativas, fronteira clara).
- `.core/governance/GOVERNANCE-CATALOG.md` (§5 paths reservados, §6 deltas declarados).
- `.core/process/governance-foundation.md` § "Decisões" (fluxo decision-brief ↔ ADR ↔ policy).

**Limite correto:** a 0021 entregou a **estrutura editorial** (onde ADRs moram, qual é o critério, qual é a fronteira com a constituição operacional). **Não entregou** auditoria de naming na zona `.core/rules/top/` (fronteira `agents-core.md` vs `global-rules.md`) — esse débito foi corretamente migrado para `roadmap/backlog.md` no sub-bloco 4.C.[SANITIZE-NEXT].

---

### 2.3 Frente C — Living Documentation + drift guard

**Entregue:**

- Schema v0 de Living Documentation (`src/domain/living-docs/`) — sub-bloco 3.A.
- AST extractor com TypeScript Compiler API (`src/infrastructure/ast/TypeScriptRuleExtractor.ts`) — sub-bloco 3.B.
- Drift guard fatal na CI: `yarn living-docs:check` no job `ai-guidelines-check` — sub-bloco 3.C.
- 5 erros estáveis honrando ADR 0002 §4: `LIVING_DOCS_INVALID_EVIDENCE`, `LIVING_DOCS_INCONSISTENT_DEPRECATION`, `LIVING_DOCS_BYPASS_DIVERGENT`, `LIVING_DOCS_RULE_CROSS_FILE`, `LIVING_DOCS_AMBIGUOUS_RULE_ID`.
- Parser de bypass directive (`BypassDirective.ts`) — generic, serve para qualquer guard futuro.
- 157 entries em `.governance/living-docs.yml` versionadas, idempotência byte-a-byte confirmada (MD5).

**Evidência:**

- `src/domain/living-docs/`, `src/app/use-cases/GenerateLivingDocs.ts`, `src/app/use-cases/CheckLivingDocs.ts`.
- `.governance/living-docs.yml` (baseline canônico).
- `.github/workflows/ai-guidelines-ci.yml` (step "Validate Living Documentation drift guard").
- `audit-2026-05-11-pre-3c4-living-docs-aggregation.md`.

**Limite correto:** entregou a **fundação técnica** da Living Documentation (extração + check + drift guard). **Não entregou** integração da Living Documentation com **políticas de evolução** (ex.: PR-aware drift policy, gates por tipo de mudança) — isso é trabalho de specs futuras.

---

### 2.4 Frente D — TemplateEngine + composição modular

**Entregue:**

- `AssembleArtifact` use case + `NodeRecipeStore` adapter — sub-bloco 3.D.
- 1 recipe canônica completa (`tasks-evidence-driven`) com partials atômicos.
- Equivalência mirror ↔ engine cravada por contract test (`LegacyMirrorContract.test.ts`) — sub-bloco 4.C.0.
- Engine ativada no consumer-side via `tryRenderViaEngine` em `cli/features/core/recipes.mjs` — sub-bloco 4.C.0.
- `dist/` distribuído no tarball npm + `prepack` automático + fail-fast em `engine-unavailable` — sub-bloco 4.C.[ENGINE-DIST].

**Evidência:**

- `src/app/use-cases/AssembleArtifact.ts`, `src/domain/templates/`, `src/infrastructure/yaml/NodeRecipeStore.ts`.
- `.core/governance/recipes/tasks-evidence-driven.recipe.yml`.
- `mirror-equivalence-map.md` (tabela final com status pós-cutover, E1–E7, R4).
- `cli/features/core/recipes.mjs` (wrapper que ativa engine + fail-fast).

**Limite correto:** entregou a **engine** e **ativou para um caso** (recipe `tasks-evidence-driven`). **Não entregou** recipes completas para `spec`, `plan`, `decision-brief`, etc. — esses templates continuam vivendo em `.specify/templates/` como mirror estático. A migração completa é trabalho futuro (parte do que a Spec 0022 discutiu antes de ser reformulada).

---

### 2.5 Frente E — Re-arquitetura DDD da CLI (parcial)

**Entregue:**

- 10 use cases DDD em `src/app/use-cases/`: `AdoptWorkspace`, `AssembleArtifact`, `CheckLivingDocs`, `DiscoverWorkspace`, `GenerateLivingDocs`, `PromoteWorkItem`, `RegisterWorkItem`, `StructuralValidation`, `WorkspaceMigrationIdempotency`, `WorkspaceRollback`.
- Modelo de domínio em `src/domain/` (work-item, workspace, rules, templates, living-docs).
- Adapters reais em `src/infrastructure/`.
- Boundary lock por regex + AST (transição planejada).
- `src/cli/livingDocs.ts` como primeiro composition root em TypeScript.

**Limite correto — explícito:** a frente "re-arquitetar a CLI" foi entregue **estruturalmente** (os domínios, use cases e adapters existem em `src/`) mas **não foi plugada operacionalmente** — o comando publicado (`npx ai-guidelines <init|adopt|update|providers|check-budget>`) continua sendo servido por `cli/ai-guidelines-cli.mjs` que roteia para `cli/app/engine.mjs` (mjs legado). Apenas o `TemplateEngine` foi plugado no caminho do consumer (via `tryRenderViaEngine`).

**Esta é a divergência central descoberta na sessão 2026-05-18:** a hipótese da owner era que a 0021 entregaria o cutover **completo** mjs→TS. O estado real é que a 0021 entregou a **fundação DDD** mas deixou o cutover do runtime como débito. Isso não foi documentado explicitamente como limite no `spec.md` durante a execução — viveu implícito no `roadmap/backlog.md` ("Cutover completo da CLI mjs para `src/` DDD: ... trabalho de specs futuras dedicadas") sem nunca virar candidata explícita.

**Esta closure-review torna o limite explícito:** **a 0021 NÃO entrega a substituição operacional de `cli/` por `src/cli/`.** Esse cutover é objeto da Spec 0022 (agora reformulada como discovery-first sob o lifecycle ainda a ser definido pela Spec 0023).

---

### 2.6 Frente F — Repositioning governance-first (amendment 2026-05-17)

**Entregue:**

- ADR 0018 — Governance-first, AI-as-Channel.
- `README.md` reescrito com tagline governance-first.
- Reescrita textual do `AGENTS.md` (fora do bloco `<AI_GUIDELINES>` compilado).
- AI adapters reclassificados como **opt-in** (igual Prettier/Husky/CI).
- Critério editorial: specs futuras que dependam de framing AI-first precisam justificar contra ADR 0018.

**Evidência:**

- `.core/governance/adrs/0018-governance-first-ai-as-channel.md`.
- `README.md` (lidera com governance).
- `AGENTS.md` § primeira seção.
- `decision-brief.md` [DEC-0021-B06] + [DEC-0021-B07].

**Limite correto:** entregou o **repositioning narrativo e classificatório**. **Não entregou** as consequências profundas desse repositioning na própria arquitetura — especificamente, não respondeu "se specs não são mais o centro absoluto, qual é o lifecycle metodológico real do framework?". Esse é o ponto que originou a sessão 2026-05-18 e a futura Spec 0023.

---

## 3. O que a 0021 estabilizou (estado de bridge intencional)

A 0021 deixou três estados de coexistência **explícitos e contratados**, não acidentais:

### 3.1 `cli/` mjs (runtime ativo) + `src/` TS (DDD construído mas parcialmente não-plugado)

**Por quê:** o cutover operacional não cabia na 0021 sem inflar o escopo além do razoável. A 0021 entregou a **fundação DDD** e deixou o **cutover operacional** como spec dedicada (0022).

**Contrato:** o `bin` do `package.json` continua apontando para `cli/ai-guidelines-cli.mjs`. O `TemplateEngine` é o **único** ponto onde `src/` está efetivamente plugado no caminho do consumer (via `tryRenderViaEngine`). Tudo mais em `cli/` é runtime ativo.

**Risco:** se a Spec 0022 (cutover) demorar muito a fechar, o débito de coexistência aumenta proporcionalmente. Mitigação atual: 0022 já aberta como PR draft #16 (mesmo com framing inicial errado, agora em revisão).

---

### 3.2 `.specify/templates/` (mirror estático) + `recipes/` (engine ativa para 1 recipe)

**Por quê:** apenas a recipe `tasks-evidence-driven` foi migrada completamente. As outras (`spec`, `plan`, `decision-brief`, `next`, `roadmap`, etc.) continuam como mirror estático em `.specify/templates/`. A 0021 entregou a engine e provou em 1 caso; migrar todos os recipes era trabalho de spec dedicada.

**Contrato:** `tryRenderViaEngine` em `cli/features/core/recipes.mjs` decide caminho por caminho: se há recipe mapeada, usa engine; senão, mirror. Fail-fast em `engine-unavailable` garante que o caminho não pode falhar silenciosamente quando recipe está mapeada.

**Risco:** o sistema fica em "engine para tasks-evidence-driven, mirror para o resto" indefinidamente se nenhuma spec puxar a migração das recipes restantes. Não há cronograma. **Esta closure-review eleva esse débito explicitamente** (ver §6.3 abaixo).

---

### 3.3 `.ai-guidelines/` (bridge consumer-side) + `.governance/` (root canônico)

**Por quê:** consumidores existentes (mesmo que sejam zero hoje) podem ter `.ai-guidelines/` em uso. O cutover real para `.governance/` exige plugar `AdoptWorkspace` no comando `adopt` real (não está plugado — vive em `src/app/use-cases/AdoptWorkspace.ts` aguardando composition root).

**Contrato:** `ARCHITECTURE.md` §C invariante 12 declara `.ai-guidelines/` como **bridge legada explícita** (não-disruptiva, silenciosa-por-design); o cutover é objeto de spec dedicada (também 0022).

**Risco:** o mesmo da 3.1 — depende do cutover real fechar.

---

## 4. O que a 0021 deliberadamente NÃO resolveu

### 4.1 Cutover operacional `cli/` → `src/cli/`

Já analisado em §2.5 e §3.1. **Limite correto, agora explícito.** Objeto da Spec 0022.

### 4.2 Auditoria de naming na zona `.core/rules/top/`

Débito identificado em sub-bloco 3.0.5: a fronteira `agents-core.md` (CORE-_) vs `global-rules.md` (GR-_) faz sentido em escopo mas o naming confunde. **Migrado para `roadmap/backlog.md`** durante 4.C.[SANITIZE-NEXT]. **Limite correto.**

### 4.3 Rebranding textual completo do produto

"a CLI" → "o `ai-guidelines`", `yarn guidelines` → `yarn ai-guidelines`, scripts `guidelines:*` → `ai-guidelines:*`, mensagens de `printHelp`. **Migrado para backlog** durante a sessão 2026-05-18 como entrada nova (não veio do tasks.md original). **Limite correto** — é polish de superfície, não fundação.

### 4.4 Rename do pacote npm `ai-guidelines`

ADR 0018 documenta a decisão de manter o nome via reclaim semântico. Rename eventual exige spec dedicada disparada por sinal de mercado. **Migrado para backlog.** **Limite correto.**

### 4.5 Reposicionamento de superfícies externas

GitHub topics, descrição do repo, landing page, badges. **Migrado para backlog** como release follow-up. **Limite correto** — não bloqueia o paradigma.

### 4.6 Migration framework v0→v1 do Living Documentation

Sub-bloco 3.A.2: anti-objetivo respeitado. Schema v0 é frozen set; migração v1 só quando v1 existir. **Limite correto.**

### 4.7 RegistryService coverage completa

Débito 2.B.4: `update`/`remove`/`load`/`save` via service só são cobertos indiretamente via `GovernanceRegistryStore`. Aceito como débito ergonômico em 2.C-sanitize. Permanece. **Limite correto.**

---

## 5. Problemas que a 0021 REVELOU mas não deveria resolver

Esta seção é a mais delicada. A sessão 2026-05-18 revelou três problemas que **emergiram durante a 0021** mas cuja resolução **NÃO pertence** à 0021. Tentar absorvê-los inflaria a spec para "a spec que contém o projeto inteiro" (problema que a sessão explicitamente quis evitar).

### 5.1 O lifecycle metodológico atual é inadequado para discovery

**Como emergiu:** durante o sanitize do `NEXT.md` em 4.C.[SANITIZE-NEXT], ficou claro que vários itens viraram "meta-débito" (foram movidos de fase em fase sem virar spec própria). A pergunta natural foi: "por que isso aconteceu?". A resposta apontou para o lifecycle vigente (spec → decision-brief → plan → tasks) ser inadequado para:

- discovery arquitetural,
- workflows não-spec (patches, experiments, governance reviews, migrations),
- separação entre Stage A (Discovery) e Stage D (Planning).

**Por que NÃO pertence à 0021:** a 0021 é foundation/convergence spec de **arquitetura de informação**, não de **lifecycle metodológico**. Tentar resolver o lifecycle aqui retroativamente quebraria o princípio de imutabilidade do `spec.md` e duplicaria a Spec 0023 prematuramente.

**Onde resolve:** **Spec 0023 — Governance Workflow & Discovery Model** (a abrir).

---

### 5.2 Os boilerplates atuais embutem epistemologia AI-first/spec-centric

**Como emergiu:** quando se discutiu o que `research.md` deveria ser, percebeu-se que os boilerplates atuais (`spec-boilerplate`, `decision-brief-boilerplate`, `plan-boilerplate`, `tasks-boilerplate`, `next-boilerplate`) não são "só templates" — eles carregam:

- AI-first framing (mesmo após o repositioning ADR 0018),
- spec-centricity (toda iniciativa nasce de uma "spec"),
- workflow linear único (mesmo Stage 1 da brief assume um único caminho),
- pouco rigor investigativo (não há artifact dedicado a research profunda).

**Por que NÃO pertence à 0021:** redesenhar boilerplates exige primeiro definir o lifecycle novo (Spec 0023). Tentar mexer nos boilerplates aqui seria sintomático, não causal.

**Onde resolve:** **Spec 0023** (boilerplates são consequência do lifecycle, não ponto de partida).

---

### 5.3 Não há taxonomia de workflows além de "spec"

**Como emergiu:** durante a sessão 2026-05-18, identificou-se que o framework hoje trata **tudo** como spec (patches, experiments, spikes, governance reviews, migrations, hotfixes, operational analysis, policy evolution). Isso é spec-centricity acidental — herdada da fase AI-first/SDD.

**Por que NÃO pertence à 0021:** taxonomia de workflows é trabalho de descoberta + design metodológico. A 0021 entregou taxonomia de **artefatos** (7 pilares: spec, spike, fix, patch, incident, proposal, experiment) — mas isso é **taxonomia de objetos**, não **taxonomia de workflows com lifecycles próprios**.

**Onde resolve:** **Spec 0023**, especificamente no `research.md` (capability mapping + bounded contexts reais).

---

## 6. Análise de débito transferido

### 6.1 Itens corretamente transferidos para `roadmap/backlog.md`

Durante o sub-bloco 4.C.[SANITIZE-NEXT] (commit `9bd5aa0`), 6 itens foram migrados do `NEXT.md` da 0021 para `roadmap/backlog.md`:

1. **GOVERNANCE-CATALOG como regra runtime do `<AI_GUIDELINES>`** — decisão para spec futura.
2. **Auditoria naming `.core/rules/top/`** — débito pós-merge.
3. **Rename pacote npm `ai-guidelines`** — backlog estratégico.
4. **Reposicionamento externo** — release follow-up.
5. **Cutover completo CLI mjs → `src/` DDD** — **agora absorvido pela Spec 0022** (reformulada como discovery-first).
6. **Harness Lock como contrato executável no boilerplate** — **agora parcialmente absorvido pela Spec 0023** (parte do lifecycle metodológico).

**Status: corretos.** Cada um tem destino claro (spec futura, backlog estratégico ou já absorvido por candidata aberta).

---

### 6.2 Itens "empurrados com a barriga" descobertos pela sessão 2026-05-18

A sessão revelou que **o cutover real `cli/` → `src/` DDD** (item #5 acima) estava sendo empurrado há vários sub-blocos sem dono explícito. A migração para backlog em 4.C.[SANITIZE-NEXT] foi correta, mas a **promoção para Spec 0022** só aconteceu durante a sessão de hoje (não no fluxo normal da 0021).

**Lição registrada:** o NEXT.md infla quando débitos grandes são tratados como "spec futura" sem virar candidata. Esse insight nasceu como entrada própria no `NEXT.md` da 0021 (commit `1e1ae35`) e é insumo direto para a Spec 0023.

**Outros itens potencialmente "empurrados com a barriga" identificados nesta closure-review:**

- **Migração completa dos recipes restantes** (3.2): a 0021 entregou engine + 1 recipe; os outros recipes não têm spec dedicada nem candidata explícita no backlog. **Recomendação: criar entrada no `roadmap/backlog.md` antes do merge da 0021** (ver §10 abaixo).
- **`AdoptWorkspace` plugado no comando real**: o use case existe em `src/` mas não está plugado. Isso será resolvido pela Spec 0022, mas vale registrar explicitamente que **a 0021 não fechou esse loop** apesar de ter construído as duas pontas.

---

### 6.3 Itens que agora claramente exigem specs próprias

Lista consolidada (alguns já têm spec ou candidata; outros ainda não):

| Item                                                     | Estado atual                                     | Destino canônico                                              |
| :------------------------------------------------------- | :----------------------------------------------- | :------------------------------------------------------------ |
| Cutover operacional `cli/` → `src/cli/` (DDD/TDD/BDD)    | Spec 0022 aberta (PR #16, em revisão de framing) | **Spec 0022**                                                 |
| Lifecycle metodológico / discovery-first / `research.md` | Sessão 2026-05-18; candidata identificada        | **Spec 0023** (a abrir)                                       |
| Rebranding textual completo do produto                   | Backlog (entrada nova 2026-05-18)                | Spec dedicada (slug futuro)                                   |
| Migração completa dos recipes (`spec`, `plan`, etc.)     | Não-promovida; vive implícita no backlog         | **Sugestão: criar entrada no backlog antes do merge da 0021** |
| Auditoria naming `.core/rules/top/`                      | Backlog                                          | Spec dedicada                                                 |
| `next-md-hygiene-rituals` (meta-spec sobre NEXT.md)      | Insight registrado                               | Possivelmente absorvido pela Spec 0023                        |
| `stakeholder-intake-pipeline`                            | Já no "Now" do backlog                           | Spec futura dedicada                                          |
| `framework-observability-dashboard`                      | Já no "Now" do backlog                           | Spec futura dedicada                                          |
| `handoff-contracts-formalization`                        | Já no backlog                                    | Spec futura dedicada                                          |

---

## 7. Mudanças de direção descobertas durante a 0021

A 0021 mudou de direção duas vezes ao longo dos 6 meses de execução. Esta closure-review registra ambas como aprendizado:

### 7.1 Gate de Stage 1 (2026-05-09): expansão para 4 frentes

O gate humano expandiu o escopo de "arquitetura de informação isolada" para "transição Spec-Driven → Governance-Driven" com 4 frentes. **Foi a decisão certa** — sem essa expansão, a fundação ficaria incompleta.

### 7.2 Amendment 4.E (2026-05-17): repositioning governance-first

Durante a execução do PR4, percebeu-se que o framework deixou de ser AI-first/SDD-centric e virou governance-driven com AI como canal. Isso virou ADR 0018 + reescrita do README e AGENTS.md. **Foi a decisão certa** — sem isso, o produto continuaria narrando-se como "uma CLI AI-first" quando já não era.

### 7.3 Descoberta tácita (2026-05-18): specs não são mais o centro absoluto

A sessão de hoje revelou implicitamente que **o repositioning governance-first ainda não foi totalmente assimilado pelo lifecycle metodológico**. Specs continuam sendo o único caminho oficial de evolução. Patches, experiments, governance reviews, migrations ainda viram "spec" por falta de alternativa formalizada.

**Esta descoberta NÃO é resolvida pela 0021** — é insumo para a Spec 0023. Mas a 0021 deixa a fundação que torna a 0023 possível (repositioning, taxonomia de pilares, governance workspace).

---

## 8. Novos espaços arquiteturais desbloqueados

A 0021, ao consolidar a fundação, **desbloqueou** os seguintes espaços para specs sucessoras (cada um precisa de spec própria, sem absorção retroativa):

1. **Cutover operacional do runtime** → Spec 0022 (aberta, em revisão de framing).
2. **Lifecycle metodológico / discovery-first** → Spec 0023 (a abrir).
3. **Pipeline de intake estruturado (PRD/RFC)** → candidata no backlog (`stakeholder-intake-pipeline`).
4. **Contratos de handoff formalizados** → candidata no backlog (`handoff-contracts-formalization`).
5. **Telemetria + dashboard do framework** → candidata no backlog (`framework-observability-dashboard`).
6. **Migração completa dos recipes** → débito a promover para candidata (ver §6.2).
7. **Rebranding textual completo do produto** → débito no backlog.
8. **Auditoria de naming `.core/rules/top/`** → débito no backlog.
9. **Rename pacote npm `ai-guidelines`** → débito estratégico no backlog.
10. **Reposicionamento externo (GitHub topics, etc.)** → release follow-up no backlog.

---

## 9. Análise dos itens ainda em `[ ]` no `tasks.md`

Dos 41 itens em `[ ]` no `tasks.md`, três grupos:

### 9.1 Gaps de marcação histórica (PRs já mergeados)

Linhas 303–305, 329, 343, 358, 394, 436, 918–921, 947. São itens de PR-MGMT e [COMMIT] dos PRs 2 e 4 que **já foram executados** mas o checkbox nunca foi marcado. **Ação recomendada:** marcar como `[x]` no commit de fechamento da 0021 (correção meramente cosmética).

### 9.2 Sub-bloco 4.D — Homologação final (escopo legítimo da 0021)

Linhas 1060–1067:

- **4.D.1** Smoke headless + `.governance/` — **razoável fechar** rodando smoke real cross-OS local (já validado parcialmente em sessões anteriores).
- **4.D.2** Validar `registry.yml` como SSOT — **parcialmente razoável**: a 0021 entregou a fundação técnica (registry funciona), mas o `registry.yml` ainda não tem use case orquestrador real plugado (débito 2.B.5). Recomendação: validar **fundação técnica** (registry round-trip + atomicidade), **não** integração end-to-end com comando CLI real (essa é a Spec 0022).
- **4.D.3** Validar living docs + drift guard — **razoável fechar**: já está rodando verde em CI (`yarn living-docs:check` no `ai-guidelines-check`).
- **4.D.4** Validar TemplateEngine — **razoável fechar**: equivalência mirror↔engine já cravada em 4.C.3; recipe `tasks-evidence-driven` produzindo artefatos válidos.
- **4.D.N** Pipeline verde — **razoável fechar**: CI 8/8 já confirmado em commits anteriores desta sessão (`9bd5aa0`).
- **4.D.[DEBT-REVIEW]** Revisão final pré-merge do `NEXT.md` — **razoável fechar**: já antecipado em 4.C.[SANITIZE-NEXT]; revisão final é leve.
- **4.D.[ARCHITECTURE]** Snapshot final do roadmap em `ARCHITECTURE.md` §F marcando PR1–PR4 ✅ — **razoável fechar**.
- **4.D.[COMMIT]** Closure commit final — **mecânico**.

**Recomendação geral para 4.D:** fechar como **homologação operacional**, NÃO como absorção de runtime redesign. A `closure-review.md` (este documento) cobre boa parte do esforço de 4.D.[DEBT-REVIEW] + 4.D.[ARCHITECTURE].

### 9.3 Itens R._ e F._ — Encerramento pós-aprovação humana

Linhas 1073–1112. São gates de aprovação humana e tarefas pós-aprovação (migração de research, deleção do NEXT.md, atualização do CHANGELOG, etc.). **Não executar até gate humano final.**

### 9.4 Item parcial `[~] 4.A.2`

Linha 935: "Garantir consistência com a topologia real do repo". Único débito interno cross-bloco ainda parcial. **Pode ser fechado** dentro do sub-bloco 4.D.[ARCHITECTURE] (que faz a auditoria final).

---

## 10. Recomendação de fechamento

A 0021 está **operacionalmente pronta para fechar** sob a seguinte disciplina:

### 10.1 Fechar como foundation/convergence spec, não como runtime rewrite spec

O `spec.md` da 0021 tem o princípio de imutabilidade. **Não devo modificar o `spec.md`.** Em vez disso, **esta closure-review é o documento que registra os limites finais** — vive na pasta da spec como artefato de fechamento.

### 10.2 Itens 4.D fechados como homologação operacional

Executar os 8 itens do sub-bloco 4.D sob a interpretação descrita em §9.2 — **validação da fundação técnica**, NÃO integração end-to-end com cutover real (que é Spec 0022).

### 10.3 Pré-merge: criar entrada no backlog para "migração completa dos recipes"

Antes de marcar a 0021 como `Ready`, **adicionar entrada explícita no `roadmap/backlog.md`** sobre a migração dos recipes restantes (atualmente implícita). Isso fecha o último item "empurrado com a barriga" identificado nesta closure-review.

### 10.4 Não criar a Spec 0023 antes do fechamento da 0021

A Spec 0023 (lifecycle metodológico) é o próximo passo natural, mas **não deve ser criada antes da 0021 fechar**. Razão: a 0023 é discovery-first sob lifecycle ainda não-formalizado; criá-la com a 0021 ainda em PR aberto cria ambiguidade sobre qual spec consolida o quê. A ordem correta:

1. Fechar 0021 (foundation).
2. Pausar 0022 com framing corrigido (Stage A discovery aguardando lifecycle).
3. Abrir 0023 (lifecycle metodológico) com auto-aplicação.
4. Spec 0023 fecha; sua saída habilita 0022 renascer com lifecycle correto.

### 10.5 Atualizar entradas no `NEXT.md` da 0021 com referências cruzadas finais

Antes do `Ready`:

- O insight "Como lidar quando o `NEXT.md` infla demais" ganha ref cruzada à Spec 0023 (que vai absorvê-lo).
- O débito ativo `4.A.2` é fechado em 4.D.[ARCHITECTURE].

---

## 11. Resumo executivo

A Spec 0021 entregou uma **fundação de governança** ampla e coerente, em 4 frentes (repo-first híbrido, placement documental, Living Documentation, TemplateEngine), com amendment de repositioning (governance-first). Os **limites corretos** são:

- entregou **fundação DDD** em `src/`, **não** cutover operacional do runtime.
- entregou **engine de templates** + 1 recipe completa, **não** migração de todos os recipes.
- entregou **repositioning narrativo**, **não** lifecycle metodológico revisto.

A sessão 2026-05-18 revelou que a 0021 desbloqueia **dois espaços arquiteturais críticos** que merecem specs próprias: **0022 (cutover operacional)** e **0023 (lifecycle metodológico)**. Esta closure-review torna esses limites explícitos e impede que sejam absorvidos retroativamente pela 0021.

A 0021 pode fechar com integridade histórica se:

1. Sub-bloco 4.D é executado como homologação operacional (validação da fundação técnica).
2. Esta closure-review entra como artefato final na pasta da spec.
3. Entrada nova no `roadmap/backlog.md` sobre "migração completa dos recipes restantes".
4. Spec 0022 (PR #16) recebe correção de framing (separado).
5. Spec 0023 (lifecycle) **não é criada** antes da 0021 fechar.

**Próximo passo concreto:** owner revisa esta closure-review; se aprovada, eu executo 4.D.1 a 4.D.[COMMIT] como homologação operacional, registro entrada no backlog (recipes restantes), e a 0021 vai para `Ready`.

---

## 12. Pós-execução 4.D (2026-05-19)

Após aprovação da owner para executar o sub-bloco 4.D estritamente como homologação operacional (sem redesign, sem reframing, sem absorção de novo escopo), a execução foi realizada com os seguintes resultados:

**Validações executadas:**

- **4.D.1 Smoke headless**: `yarn test:smoke` → 4/4 pass local (tarball + install + init/adopt/update via tarball real). CI smoke matriz cross-OS (ubuntu/macos/windows × node 22/24): todos verdes no head atual.
- **4.D.2 Registry como SSOT**: `yarn test:nova-cli --testPathPatterns='Registry'` → 41 pass + 4 skipped (skipped são débitos conscientes documentados nas auditorias; não bloqueiam). `GovernanceRegistryStore.ts` com 90.47% line / 100% function coverage. **Limite respeitado:** validada apenas a fundação técnica (round-trip + atomicidade); integração end-to-end com comando CLI real **não** foi executada (continua como Spec 0022).
- **4.D.3 Living docs + drift guard**: `yarn living-docs:check` → `✅ .governance/living-docs.yml in sync (235 entries)`. Drift guard fatal ativo em CI no job `ai-guidelines-check`. Idempotência byte-a-byte preservada.
- **4.D.4 TemplateEngine**: `LegacyMirrorContract.test.ts` + `AssembleArtifact.test.ts` → 12/12 pass. `recipes.test.mjs` (cli/) → 11/11 pass. Recipe `tasks-evidence-driven` produz artefato válido com equivalência E1–E7 + R4.
- **4.D.N Pipeline verde**: `yarn test:coverage` → 296/296 pass local. CI head atual: guardrails ✅ + 6 smoke ✅ + ai-guidelines-check ✅ (8/8 success).

**Ações de fechamento aplicadas:**

- **4.D.[DEBT-REVIEW]**: revisão final pré-merge do `NEXT.md`. Único débito ativo da Fase 4 (`4.A.2`) fechado em 4.D.[ARCHITECTURE]. Adicionadas duas entradas explícitas ao `roadmap/backlog.md`: (a) "migração completa dos recipes restantes" (elevada de débito implícito identificado por esta closure-review §6.2); (b) "mecanismo de fechamento disciplinado para foundation/convergence specs" (proposta meta-spec). **Nenhum problema estrutural profundo foi descoberto durante a homologação que justificasse absorção retroativa pela 0021** — disciplina preservada.
- **4.D.[ARCHITECTURE]**: `ARCHITECTURE.md` §6 (Roadmap) atualizado. PR0–PR4 todas marcadas ✅. Estado pós-merge declarado: `.governance/` canônico, `.ai-guidelines/` bridge legada, engine ativada para `tasks-evidence-driven` (demais recipes seguem mirror — spec dedicada futura), Living Documentation com 235+ entries, ADRs consolidadas, `closure-review.md` como trilha de fechamento. Limite explícito sobre cutover operacional (Spec 0022) registrado no aviso pós-tabela.
- **Gaps de marcação histórica fechados**: 8 itens `[ ]` em sub-blocos de PR2 e PR4 (PR-MGMT, commits) já executados mas nunca marcados foram corrigidos com nota retroativa. Item `[~] 2.A.8` (bridge reader não-implementado) reclassificado como débito transferido.

**Estado final do `tasks.md`:**

- 286 itens `[x]` (concluídos).
- 2 itens `[~]` (parciais): `2.A.8` (débito transferido — bridge reader sem consumidor real) e `4.[PR-MGMT.REVIEW-GATE]` (aguarda gate humano).
- 20 itens `[ ]` restantes — **todos** dependem de aprovação humana: `[READY-FOR-REVIEW]`, `[MANDATÓRIO]`, `[MERGE]`, R.1–R.8 (revisão pós-aprovação), F.1–F.9 (encerramento pós-aprovação).

**Disciplina mantida:**

A execução do 4.D **não absorveu** nenhum dos seguintes itens, conforme alinhamento explícito da owner:

- Não foi feita investigação filosófica/taxonômica sobre os 7 pilares.
- Não foi reaberta discussão sobre MECE, lifecycle, orchestration ou redesign conceitual.
- Não foi iniciada a Spec 0023.
- O 4.D **não virou** discovery work.
- O escopo **não foi expandido**.
- Nenhuma nova abstração foi introduzida.
- Nenhum reframing metodológico foi feito.

A 0021 está, neste momento, **operacionalmente pronta para o gate humano final**. Os itens R.\* e F.\* aguardam aprovação explícita da owner para serem executados.

---

> _Documento criado em 2026-05-18 durante a sessão de design entre Rosana Rezende e Claude Code; pós-execução 4.D adicionada em 2026-05-19 após alinhamento explícito de "fechar disciplinadamente, sem reinventar". Não substitui o `spec.md` (imutável); complementa o fechamento como artefato de boundary review. Precedente para a Spec 0023, que deve formalizar quando uma "closure-review" é um artifact canônico do lifecycle._
