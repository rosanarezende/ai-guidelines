<!-- ai-guidelines-template: tasks-mixed-boilerplate v=3 -->

# Tasks — Spec 0023 Workflow Runtime — `mixed`

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: In Progress (Stage 2) — PR3-runtime-state-index materializando a primeira implementação real da promessa central; enforcement estrutural permanece na pauta seguinte

> **Progress file vivo.** Atualizar a cada degrau concluído. Quando uma decisão mudar, refletir em `plan.md` § "Decisões revisitadas" e ajustar tasks impactadas. Não retroceder status sem registro.

> **Variante `mixed`.** Esta spec mistura sub-blocos `(deterministic)` (estrutura de runtime, infraestrutura, bridge CLI) e `(evidence-driven)` (lifecycle metodológico, enforcement). Cada sub-bloco identifica seu tipo abaixo.

> **`tasks.md` é boundary canônico de autorização de execução, NÃO checklist operacional fino** (cf. `[DEC-0023-D01]`). Sua presença + Gate 3 humano sinaliza que rollout/decomposição foi aceito.
>
> **O que `tasks.md` É:**
>
> - boundary de rollout autorizado;
> - decomposição aprovada como contrato operacional;
> - sinal canônico ("rollout aceito → execução autorizada");
> - artifact de Gate 3 humano (Planning approval).
>
> **O que `tasks.md` NÃO É:**
>
> - microgerenciamento operacional;
> - rastreamento fino de execução diária;
> - checklist de produtividade;
> - approval maze;
> - governance overhead.
>
> DoD operacional fino (granularidade por arquivo, por linha, por commit) vive em `plan.md § ✅ Critérios de Aceite Detalhados`. **Não duplicar aqui.** Este boundary protege o projeto contra derivar para checklist bureaucracy.

> **Particularidade — PR1 e PR2-lifecycle são pre-model declarados.** PR1 colapsou discovery+decision+execution (cf. `[DEC-0023-D04]`); PR2-lifecycle é bootstrap necessário (introduz o modelo). **PR3-runtime-state-index** expande o escopo com o índice operacional público mínimo em `main`, mas ainda antes de enforcement automático. A partir de **PR4-enforcement-runtime / PR5-DX-thinking / PR6-DX-execution**, este arquivo é boundary obrigatório (cf. ADR 0020 + ADR 0021).

---

## Fase 0 — Setup + Stage 1 (Research → Decision-Brief → Gates humanos)

### Sub-bloco [0.Setup] — Bootstrap e instanciação

- [x] **0.1** Bootstrap: contexto repo + governance-foundation lidos.
- [x] **0.2** Tipo de spec confirmado: `mixed` no header de `spec.md`.
- [x] **0.3** Slug semântico definido: `workflow-runtime`; número `0023` alocado na criação da branch.
- [x] **0.4** Branch `feat/spec-0023-workflow-runtime` criada (ex `feat/spec-0023-governance-workflow-discovery-model` renomeada após pivot).
- [x] **0.5** `spec.md` instanciado com `Tipo de spec: mixed` + `Decision Brief: ./decision-brief.md`.
- [x] **0.6** Validação Humana inicial: owner aprovou pivot 2026-05-19.
- [x] **0.7** `plan.md` instanciado em `.governance/specs/0023-workflow-runtime/plan.md` (cf. `[DEC-0023-B05]`).
- [x] **0.8** `tasks.md` (este arquivo) instanciado a partir de `tasks-mixed-boilerplate.md` em 2026-05-19 (após reescrita por feedback do owner).
- [x] **0.9** `decision-brief.md` instanciado com pontos `[DEC-0023-A01..E05]`.
- [x] **0.10** `roadmap/backlog.md` atualização: pendente (verificar antes do PR final).
- [x] **0.11** `NEXT.md` instanciado em `.governance/specs/0023-workflow-runtime/NEXT.md`.
- [x] **0.12** PR Draft #18 (`feat/spec-0023-workflow-runtime` → `main`) aberto com `pull_request_template.md` preenchido e declaração explícita de pre-model.

### Sub-bloco [0.Research] — Stage 1: produzir researches

> Para 0023, Stage 1 aconteceu na trilha legacy + sessões de design 2026-05-19.

- [x] **0.R.1** Perguntas de research listadas no `research.md` legacy (P1–P10) e cruzadas com pontos `[DEC-0023-*]`.
- [x] **0.R.2** Research produzido em `.specify/specs/0023-governance-workflow-discovery-model/research.md` + anexos. Trilha legacy preservada (cf. `[DEC-0023-D04]`).
- [x] **0.R.3** Critério validado: cada hipótese H1–H4 alimentou pontos `[DEC-0023-*]`.
- [x] **0.R.4** Débitos: atualizações periódicas em `NEXT.md` à medida que blocos B/D/E emergiam.
- [x] **0.R.[COMMIT]** Stage A discovery commits na branch legacy (até `ca2104f`).

### Sub-bloco [0.Brief] — Stage 1: popular `decision-brief.md` com opções

- [x] **0.B.1** Bloco A (pivot), Bloco B (escopo PR2), Bloco C (saúde técnica), Bloco D (lifecycle), Bloco E (enforcement) — todos com perguntas + contexto + opções + recomendação + decisão registrada.
- [x] **0.B.2** Cross-refs entre pontos: B05 referencia trilha do PR1 colapso; D01–D05 referenciam evidência empírica; E01 referencia 3 violações do agente.
- [x] **0.B.3** Tabela "Resumo de status" mantida sincronizada com todos os pontos.
- [x] **0.B.4** Débitos: `NEXT.md` atualizado a cada bloco.
- [x] **0.B.[COMMIT]** Commits `ca2104f` (Stage A), `15692f9` (Bloco B + plan.md), commits pendentes do PR2-lifecycle (Blocos D + E + ADR 0020 + ADR 0021).

### Sub-bloco [0.Gate] — Gate humano (decision-brief → Resolved)

- [x] **0.G.1** Owner revisou todos os pontos com opções preenchidas.
- [x] **0.G.2** Cada ponto fechado com escolha + justificativa + data + owner.
- [x] **0.G.3** Sem pontos `Pendente`/`Partial`.
- [x] **0.G.4** Status agregado `Resolved` no header e na tabela. Blocos "✅ Gate fechado" assinados para A/B/D/E.
- [x] **0.G.5** `plan.md` v2 derivado das decisões cravadas (sub-blocos A–H cobertos).
- [x] **0.G.6** `tasks.md` v2 (este arquivo) atualizado para refletir Stage 2 operacional.
- [x] **0.G.7** Débitos: `NEXT.md` mantido.
- [x] **0.G.[COMMIT]** Commits `15692f9` + pendentes do PR2-lifecycle marcam progressos do gate.

---

## Fase 1 — Implementação A (Stage 2)

> Os sub-blocos `(deterministic)` são consequência direta de design técnico. Os `(evidence-driven)` dependem de pontos `[DEC-0023-*]` cravados.

### Sub-bloco [1.A] — Domínio Workflow + Infra YAML `(deterministic)` — PR1 (pre-model, merged-local)

> Origem: [`plan.md § Componentes [A][B]`](./plan.md). Entregue como pre-model (cf. `[DEC-0023-D04]`).

- [x] **1.A.1** `src/domain/workflow/WorkflowState.ts` — VO 4-chave + type guards + factory default.
- [x] **1.A.2** `src/domain/workflow/SpecLocation.ts` — VO (slug, absolutePath, source).
- [x] **1.A.3** `src/infrastructure/yaml/workflowStateSerializer.ts` — parse + stringify com schema lock (rejeita acreção).
- [x] **1.A.N** Pipeline `yarn check && yarn test:nova-cli` verde após sub-bloco.
- [x] **1.A.4** Débitos: nenhum.
- [x] **1.A.[COMMIT]** `ca8c408 feat(workflow): WorkflowState VO + serializer YAML mínimo`.

### Sub-bloco [1.B] — Aplicação Workflow `(deterministic)` — PR1 (pre-model, merged-local)

> Origem: [`plan.md § Componente [B]`](./plan.md).

- [x] **1.B.1** `src/app/ports/WorkflowFileSystem.ts` — porta lean (read/write/exists/list/branch).
- [x] **1.B.2** `src/app/workflow/DetectActiveSpec.ts` — double-lookup `.governance/` → `.specify/` (cf. `[DEC-0023-A02]`).
- [x] **1.B.3** `src/app/workflow/ReadWorkflowState.ts` — parser injetado (boundary lock).
- [x] **1.B.4** `src/app/workflow/AssembleBriefing.ts` — extração regex best-effort.
- [x] **1.B.N** Pipeline verde.
- [x] **1.B.5** Débitos: extraction frágil registrada em `NEXT.md` (cf. `[DEC-0023-B02]`).
- [x] **1.B.[COMMIT]** `fbc4f75 feat(workflow): DetectActiveSpec + ReadWorkflowState + AssembleBriefing`.

### Sub-bloco [1.C] — CLI Composition Root + Bridge legado `(deterministic)` — PR1 (pre-model, merged-local)

> Origem: [`plan.md § Componentes [C][E]`](./plan.md).

- [x] **1.C.1** `src/cli/workflow.ts` — REPL com classifyInput, buildMenu, buildContextBundle.
- [x] **1.C.2** Bridge em `cli/cli/args.mjs` (SUPPORTED_MODES) + `cli/app/engine.mjs` (delegate dinâmico).
- [x] **1.C.3** `printHelp()` mínimo (atualização completa pendente para PR6-DX-execution sub-bloco [1.H]).
- [x] **1.C.N** Pipeline verde.
- [x] **1.C.4** Débitos: `NoopClipboard` por default (real entra em PR6-DX-execution sub-bloco [1.H]).
- [x] **1.C.[COMMIT]** `0774348 feat(workflow): REPL workflow + atalho continue + bridge no entrypoint`.

### Sub-bloco [1.D] — Lifecycle metodológico + CI mínimo + governance artifacts `(evidence-driven)` — PR2-lifecycle (bootstrap, em construção)

> Origem: [`plan.md § Componentes [G][H]`](./plan.md) + [`[DEC-0023-D01..D05]`](./decision-brief.md) + [`[DEC-0023-E01..E05]`](./decision-brief.md). **Bootstrap declarado** — não aplicável a si mesmo.

- [x] **1.D.1** Bloco D (D01..D05) cravado em `decision-brief.md`.
- [x] **1.D.2** ADR 0020 publicado + README index atualizado.
- [x] **1.D.3** Bloco E (E01..E05) cravado em `decision-brief.md` (sessão 2026-05-19, terceira metade).
- [x] **1.D.4** ADR 0021 publicado + README index atualizado.
- [x] **1.D.5** `src/cli/governance-pr-check.ts` + tests BDD pt-BR (CI mínimo de integridade estrutural; cf. `[DEC-0023-D03]`).
- [x] **1.D.6** `.github/workflows/governance-pr-check.yml` — workflow rodando em execution PRs.
- [x] **1.D.7** `tasks.md` (este arquivo) reescrito conforme `tasks-mixed-boilerplate.md`.
- [x] **1.D.N** Pipeline `yarn format && yarn check && yarn test:nova-cli && yarn test` verde (validado antes de pausa para review humano).
- [x] **1.D.8** Débitos: itens deferidos (L3 hooks, drift detection, runtime stateful complexo) registrados em `NEXT.md` com critério.
- [ ] **1.D.[REVIEW]** **[MANDATÓRIO]** Owner revisa artifacts do PR2-lifecycle (Bloco D + ADR 0020 + Bloco E + ADR 0021 + tasks.md reescrito + governance-pr-check + workflow YAML + NEXT.md + plan.md + state.yml + CHANGELOG entry) ANTES de commit.

  **Contrato operacional explícito de approval (cf. ADR 0021):**
  - **Review humano ≠ autorização implícita de continuação.** Owner ler os artifacts e discutir não equivale a aprovar commit.
  - **Nenhum commit/push ocorre sem autorização textual explícita do owner.** Exemplos válidos de autorização: "aprovo commit", "pode commitar", "vá em frente com o push", "autorizado".
  - **Continuidade conversacional não equivale a aprovação de gate.** A conversa pode seguir refinamentos sem que isso destrave operação.
  - **Esta linha é o handoff operacional explícito** entre review (Gate humano) e execução (commit). Pulá-la recria o pattern de "execução emergindo implícita do fluxo" que ADR 0021 craveia como insuficiente.

- [ ] **1.D.[COMMIT]** Commits atômicos sugeridos (após aprovação humana):
  - `docs(spec-0023): Bloco D — lifecycle metodológico + ADR 0020`
  - `feat(governance-ci): governance-pr-check + GitHub workflow`
  - `docs(spec-0023): Bloco E — enforcement estrutural + ADR 0021`
  - `chore(spec-0023): tasks.md reescrito conforme boilerplate mixed + state/NEXT/plan atualizados + CHANGELOG preview`

### Sub-bloco [1.E] — Runtime public state index (`active-specs.yml` + publish-state) `(evidence-driven)` — PR3-runtime-state-index (atual; docs/contrato agora, CLI em seguida)

> Origem: [`plan.md § Componente [J]`](./plan.md) + [`[DEC-0023-G01..G04]`](./decision-brief.md). Este é o primeiro recorte que ataca diretamente a promessa central da 0023: descoberta de spec ativa em `main` sem prompt humano denso.

> **Nota transitional (2026-05-21):** este sub-bloco ainda herda granularidade fine-grained do `tasks-mixed-boilerplate v=3`, anterior ao enforcement estrito de `[DEC-0023-D01]` (que craveia `tasks.md` como boundary de autorização, não checklist fino). Retrofit do boilerplate canônico é débito explícito ([`roadmap/backlog.md`](../roadmap/backlog.md)) — **deliberadamente não absorvido** neste PR para evitar expansão recursiva. **A inconsistência foi preservada deliberadamente para evitar retrofits silenciosos divergentes do boilerplate canônico** — corrigir apenas aqui criaria drift sub-bloco vs template, exatamente o anti-pattern que retrofit centralizado deve resolver. Transitional, deferred pending boilerplate refactor.

- [x] **1.E.1** `decision-brief.md` Bloco G fechado com 4 decisões: separação tripla de gêneros, índice único em `.governance/runtime/active-specs.yml`, sync manual inicial, vocabulário canônico stage/status + projection rule (`[DEC-0023-G04]`).
- [x] **1.E.2** `.governance/runtime/active-specs.yml` criado com schema mínimo e exemplo dogfoodado da própria 0023.
- [x] **1.E.3** `state.yml` interno da 0023 alinhado ao estágio real da spec para não contradizer o índice público.
- [x] **1.E.4** Implementar leitura do índice público em `workflow` (descoberta primeiro; `continue` resolve `branch`/`spec_path` antes de ler artifacts densos). Entregue em Passo 3 (REPL integra `ListActiveSpecs` + `renderActiveSpecsIndex`) + Passo 4 (`continue <slug|id>` resolve cross-spec via índice, sem auto-checkout, match tri-form em id|slug|id-slug).
- [x] **1.E.5** Implementar `yarn workflow publish-state` manual (sem hook/CI nesta primeira iteração). Entregue em Passo 5 (`PublishState` use case + CLI wrapper + cabling cirúrgico em `cli/cli/args.mjs` + `cli/app/engine.mjs`; round-trip de validação antes de escrever).
- [x] **1.E.N** Pipeline verde validado em todos os passos: `yarn build` + `yarn jest` (523 passing) + `yarn test:unit` (292 passing) + `yarn format:check` limpo. Drift guard mínimo satisfeito pela convergência dos Passos 1+2+5 (auditoria Passo 6); integration test end-to-end com filesystem + git reais (Passo 7) revelou e fechou bugs operacionais (HEAD unborn + match tri-form do marker `*`).
- [x] **1.E.[REVIEW]** Owner aprovou cada passo via "aprovo" / "pode seguir" textual explícito; PR #23 permanece em DRAFT até conversão manual pelo owner.
- [x] **1.E.[COMMIT]** Sequência de commits incrementais por passo:
  - `5a2067c feat(spec-0023): schema validator do índice público active-specs.yml`
  - `c512898 feat(spec-0023): ListActiveSpecs use case + soft drift guard`
  - `c8c63ae feat(spec-0023): integra leitura do índice público no REPL workflow (lookup-only)` (Passo 3)
  - `3d128ed feat(spec-0023): continue <slug|id> resolve via índice público (lookup, sem auto-checkout)` (Passo 4)
  - `8b7a494 feat(spec-0023): publish-state manual — state.yml → active-specs.yml (sem inferência)` (Passo 5)
  - `7fe63e8 feat(spec-0023): integration tests E2E + correção tri-form de marca corrente` (Passo 7)
  - Passo 8 (atual): sync de artifacts vivos.

### Sub-bloco [1.F] — Enforcement Runtime (`executionAuthorized` derivado + workflow refuse) `(evidence-driven)` — PR4-enforcement-runtime (concluído)

> Origem: [`plan.md § Componente novo a adicionar`](./plan.md) + [`[DEC-0023-E03]`](./decision-brief.md). **NOVO** — entra como PR próprio, separado de DX, para isolar testabilidade e dogfooding do mecanismo de enforcement.

- [x] **1.F.1** Domínio: estender `src/domain/workflow/WorkflowState.ts` com computação derivada `executionAuthorized` (não como campo persistido — como função pura sobre estado).
- [x] **1.F.2** Use case: `src/app/workflow/CheckExecutionAuthorized.ts` com regras canônicas (`tasks.md exists && gate.status == closed && governance chain íntegra`).
- [x] **1.F.3** `src/cli/workflow.ts` `runContinue` recusa narrativamente quando `executionAuthorized == false`, listando condições não satisfeitas.
- [x] **1.F.4** Fast-track strictness em `governance-pr-check`: validar label `fast-track` + presença de rationale no body (regex obrigatório); falhar se label sem rationale.
- [x] **1.F.5** BDD pt-BR para cada use case + integration test.
- [x] **1.F.N** Pipeline verde + integration test exercitando lock/unlock real.
- [x] **1.F.6** Débitos: nenhum esperado.
- [x] **1.F.[REVIEW]** **[MANDATÓRIO]** Owner aprova PR4 antes de commit/push.
- [x] **1.F.[COMMIT]** `feat(workflow): executionAuthorized derivado + runtime refuse narrativo (PR4 enforcement)`.

### Sub-bloco [1.G] — DX Thinking (refinement) `(deterministic)` — PR5-DX-thinking (próximo PR; aguarda PR4)

> Origem: [`plan.md § Componente [F]`](./plan.md) + Bloco B já cravado. Pode ser trivialmente pequeno — está OK.

- [ ] **1.G.1** Reler Bloco B do `decision-brief.md`; verificar se decomposição de DX em sub-bloco [1.H] continua válida sob enforcement de PR4.
- [ ] **1.G.2** Se necessário, abrir Bloco F no decision-brief com ajustes pontuais (não-obrigatório).
- [ ] **1.G.N** Pipeline verde (mudanças mínimas; apenas tasks.md / plan.md / state.yml).
- [ ] **1.G.[REVIEW]** **[MANDATÓRIO]** Gate 3 (planning approval) sobre o sub-bloco [1.H] — primeiro Gate 3 estrito da história da spec.
- [ ] **1.G.[COMMIT]** `docs(spec-0023): planning gate 3 fechado — PR6-DX-execution autorizada`.

### Sub-bloco [1.H] — DX Execution (clipboard + warning + integration + examples + help + docs + README + CHANGELOG) `(deterministic)` — PR6-DX-execution (próximo PR; aguarda PR5)

> Origem: [`plan.md § Componente [F]`](./plan.md) + [`[DEC-0023-B01..B04]`](./decision-brief.md). **Primeira execução sob enforcement estrutural completo** (`executionAuthorized` derivado deve estar `true` antes deste sub-bloco iniciar).

- [ ] **1.H.1** `src/infrastructure/io/NodeClipboard.ts` + tests — detecta wl-copy/xclip/pbcopy; fallback gracioso. Wire em `cli/workflow.ts`. Cf. `[DEC-0023-B01]`.
- [ ] **1.H.2** `AssembleBriefing` warning para extraction vazia (linha "(convenção do template não detectada; veja docs/guides/workflow-quickstart.md)"). Cf. `[DEC-0023-B02]`.
- [ ] **1.H.3** Integration test `tests/integration/workflow-dispatch.test.mjs` — exercita `node cli/ai-guidelines-cli.mjs continue` em diretório temp com `git init` + spec fake.
- [ ] **1.H.4** `examples/minimal-spec/` (≤ 4 arquivos: spec.md, NEXT.md, state.yml, README.md). `examples` em `package.json#files`. Cf. `[DEC-0023-B03]`.
- [ ] **1.H.5** `cli/cli/args.mjs` `printHelp()` reescrito com exemplos por subcomando + nota de convenção de branch.
- [ ] **1.H.6** `docs/guides/workflow-quickstart.md` (dogfoodado com outputs reais da 0023). **Escopo expandido pós-PR4 (pull-forward):** cobrir enforcement L2 — comportamento de `workflow continue` quando bloqueado, exemplo de mensagem narrativa de dupla/única violação, códigos de saída (0/1). Cross-ref `[DEC-0023-E03]` + ADR 0021.
- [ ] **1.H.7** `docs/guides/workflow-with-ai-agents.md` (originalmente: 2 padrões — humano cola bundle; agente IA chama `continue` via Bash). **Escopo expandido pós-PR4 (pull-forward):** incluir como 3º padrão o **modelo tri-party** validado no PR #24 (Implementador IA + Revisor IA paralelo + Owner gate), incluindo a direção de evolução para voz crítica calibrada. Cross-ref `NEXT.md § DX e Narrativa Operacional § Validação empírica do modelo tri-party`.
- [ ] **1.H.8** `README.md` ganha seção "Workflow Runtime (preview)" + repositioning leve. **Escopo expandido pós-PR4 (pull-forward):** cobrir comportamento de enforcement L2 no overview (decisão estrutural, sem flag de bypass por design). Cf. `[DEC-0023-B04]`.
- [ ] **1.H.9** `CHANGELOG.md` entry v1.1.0-preview.0 (já incluso parcialmente no PR2-lifecycle; refinar se necessário).
- [ ] **1.H.10** Avaliar promoção do **modelo tri-party** (Implementador IA + Revisor IA + Owner gate) para ADR próprio. **Pré-requisito:** validação em ≥ 2 specs adicionais OU adoção espontânea por contribuidor externo. **Escopo obrigatório do ADR (se promovido):** incluir padrão de voz crítica calibrada do implementador (1 round de questionamento por sub-bloco antes de executar, com anti-padrões vetados — cf. `NEXT.md § DX e Narrativa Operacional § Validação empírica do modelo tri-party § Lacuna observada`), não apenas obediência mecânica. Sem pré-requisitos atingidos, item permanece deferido.
- [ ] **1.H.N** Pipeline verde + coverage por arquivo respeitado.
- [ ] **1.H.[REVIEW]** **[MANDATÓRIO]** Aprovação humana para merge ponta-a-ponta (PR1 + PR2-lifecycle + PR3 + PR4 + PR5 + PR6).
- [ ] **1.H.[COMMIT]** Commits atômicos por sub-task acima (8 commits incrementais).

---

## Fase de Review (Gate de Homologação)

- [ ] **3.1** `spec.md` header: status → `In Review`.
- [ ] **3.2** Pipeline canônico: `yarn ci` verde (= `install --immutable` + `validate` + `test:smoke`). _Pressupõe [PR #21](https://github.com/rosanarezende/ai-guidelines/pull/21) (scripts reorganization) mergeado em main e absorvido no rebase desta branch sobre main pós-merge de #19; até lá, validar com `yarn check:repo` da cadeia legada._
- [ ] **3.3** Critérios de aceite de `spec.md` confirmados ponto-a-ponto.
- [ ] **3.4** `decision-brief.md` Blocos A/B/C/D/E todos `Resolved` e refletidos em `plan.md`.
- [ ] **3.5** Validar em ambiente real: rodar `ai-guidelines workflow` e `continue` em `examples/minimal-spec/` (consumer dogfooding).
- [ ] **3.6** PRs (1, 2-lifecycle, 3-runtime-state-index, 4, 5, 6) atualizados com descrições finais.
- [ ] **3.7** **[MANDATÓRIO]** Gate de Review Humano — homologação técnica formal de cada PR da stack.
- [ ] **3.8** Correções demandadas em loops de review até aprovação.

---

## Fase de Encerramento Pré-Merge

- [ ] **4.1** `NEXT.md`: migrar débitos relevantes para `.governance/specs/roadmap/backlog.md` (canônico per ADR 0019) e deletar.
- [ ] **4.2** Research migration: `research.md` legacy (em `.specify/specs/0023-governance-workflow-discovery-model/`) permanece como trilha histórica (cf. `[DEC-0023-D04]`); link em `.specify/specs/research-index.md`.
- [ ] **4.3** `decision-brief.md` permanece em `.governance/specs/0023-workflow-runtime/` como artefato histórico.
- [ ] **4.4** `spec.md` header: status → `Done (PR #X-Y — YYYY-MM-DD)`.
- [ ] **4.5** `roadmap/historico.md`: 0023 movida para "Specs concluídas".
- [ ] **4.6** `CHANGELOG.md`: entry `1.1.0-preview.0` formalizada como release (data + version bump).
- [ ] **4.7** **[MANDATÓRIO]** Confirmar uma-sessão-uma-spec.
- [ ] **4.8** `[COMMIT]` `chore(spec-0023): encerramento pré-merge — research migrado, NEXT removido, status final`.
- [ ] **4.9** **[MANDATÓRIO]** Aprovação humana explícita para merge da stack completa. **Não fazer merge autonomamente.**

---

## Convenção de fast-track (cf. ADR 0021 + `[DEC-0023-D05]` + `[DEC-0023-E05]`)

Para `patch`/`fix`/`incident` pequeno que justifique fast-track sem este boundary completo:

1. **Label PR `fast-track` obrigatória.**
2. **Rationale curto obrigatório** no body do PR (regex: `\[fast-track: .+\]` ou seção `## Fast-track Rationale`).
3. **Entry em `state.yml`** (se houver) com `fast-track: true` + `fast-track-reason: <texto>` + `fast-track-date: YYYY-MM-DD`.
4. **CI `governance-pr-check`** valida que label + rationale ambos estão presentes (não apenas label).
5. **Auditoria contínua**: se ≥ 3 fast-tracks em janela curta, owner re-examina critério.

Fast-track **não se aplica** a esta 0023 — DX/lifecycle/enforcement não são pequenos nem urgentes.

---

## Gates explícitos (mapping para `[DEC-0023-D01]` + `[DEC-0023-E03]`)

| Gate                   | Quando fecha                                           | Quem assina                                   | Onde fica registrado                                                                                                |
| :--------------------- | :----------------------------------------------------- | :-------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| **Gate 1** (Discovery) | Quando research convergir hipóteses + perguntas claras | Owner em comentário no PR1                    | Comentário em PR + status `decision-brief` movido para "Pendente → opções populadas"                                |
| **Gate 2** (Decision)  | Quando `decision-brief.md` Resolved em todos os pontos | Owner em "Decisão do Gate Humano" de cada DEC | `decision-brief.md` § "✅ Gate fechado" + Resumo de Status                                                          |
| **Gate 3** (Planning)  | Quando `tasks.md` decomposição autorizada              | Owner em commit dedicado                      | `tasks.md` § "Gate 3 — Planning approval" (anterior) → agora distribuído por sub-bloco [1.F.REVIEW] e [1.E.REVIEW]. |
| **Gate de Review**     | Pós-execução, antes do merge                           | Owner + reviewers                             | PRs convertidos de Draft para Ready                                                                                 |
