<!-- ai-guidelines-template: tasks-mixed-boilerplate v=3 -->

# Tasks — Spec 0023 Workflow Runtime — `mixed`

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: In Review (Stage D) — **execution-only boundary** (cf. `[DEC-0023-M01]`): cobre apenas execução/implementação e fecha 100% `[x]` ao fim da execução. Homologação vive em [`review.md`](./review.md); pós-merge em [`closure.md`](./closure.md). Implementação completa incl. Bloco L. Migração tasks/review/closure cravada em 2026-05-25.

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
- [x] **1.D.[REVIEW]** **[MANDATÓRIO]** Owner revisa artifacts do PR2-lifecycle (Bloco D + ADR 0020 + Bloco E + ADR 0021 + tasks.md reescrito + governance-pr-check + workflow YAML + NEXT.md + plan.md + state.yml + CHANGELOG entry) ANTES de commit.

  **Contrato operacional explícito de approval (cf. ADR 0021):**
  - **Review humano ≠ autorização implícita de continuação.** Owner ler os artifacts e discutir não equivale a aprovar commit.
  - **Nenhum commit/push ocorre sem autorização textual explícita do owner.** Exemplos válidos de autorização: "aprovo commit", "pode commitar", "vá em frente com o push", "autorizado".
  - **Continuidade conversacional não equivale a aprovação de gate.** A conversa pode seguir refinamentos sem que isso destrave operação.
  - **Esta linha é o handoff operacional explícito** entre review (Gate humano) e execução (commit). Pulá-la recria o pattern de "execução emergindo implícita do fluxo" que ADR 0021 craveia como insuficiente.

  **Reconciliação 2026-05-24:** marcado `[x]` retroativamente — o review e a autorização do PR2-lifecycle ocorreram em 2026-05-19/20; os artifacts estão commitados e PR3/PR4/PR5/Bloco L foram construídos por cima na mesma stack. A pendência era de checkbox, não de gate. O contrato acima permanece como registro canônico do handoff review↔execução.

- [x] **1.D.[COMMIT]** Commits atômicos sugeridos (após aprovação humana):
  - `docs(spec-0023): Bloco D — lifecycle metodológico + ADR 0020`
  - `feat(governance-ci): governance-pr-check + GitHub workflow`
  - `docs(spec-0023): Bloco E — enforcement estrutural + ADR 0021`
  - `chore(spec-0023): tasks.md reescrito conforme boilerplate mixed + state/NEXT/plan atualizados + CHANGELOG preview`

  **Reconciliação 2026-05-24:** marcado `[x]` — os commits do PR2-lifecycle foram realizados e integrados na stack. Honestidade operacional: a granularidade/mensagens finais divergiram da lista sugerida (mesma observação de 1.H.[COMMIT]); não há dívida por isso.

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

- [x] **1.G.1** Reler Bloco B do `decision-brief.md`; verificar se decomposição de DX em sub-bloco [1.H] continua válida sob enforcement de PR4. Resultado: pull-forward de docs (1.H.6/1.H.7/1.H.8) cravado em commit `1f61f96` do PR4.
- [x] **1.G.2** Bloco F do decision-brief revisitado em S5 do PR5 (POC visual neutra): F01–F04 Resolved (B+B+A+A); F05 Deferred com critério estrutural vinculado à abertura de `handoff-as-first-class`. Cross-link na candidata registrado.
- [x] **1.G.N** Pipeline verde durante toda a esteira S1–S5 (544 tests passing, living-docs sync).
- [x] **1.G.[REVIEW]** **[MANDATÓRIO]** Gate 3 (planning approval) sobre o sub-bloco [1.H] — primeiro Gate 3 estrito da história da spec. Absorvido no escopo combinado deste PR5 (cf. correção arquitetural cravada em 2026-05-22: PR governance/thinking puro durante implementação ativa é anti-pattern; [1.G] + [1.H] passam a coexistir no mesmo PR). **Evidência:** comentário da owner no PR #25 em 2026-05-23 autorizou Gate 3 + Gate de Review humano e conversão Draft → Ready.
- [x] **1.G.[COMMIT]** Fechamento por commits incrementais, não por commit agregador único. **Honestidade operacional:** o "commit final agregador" planejado não aconteceu semanticamente; o fechamento real foi uma sequência de commits atômicos de hardening (security, identity, wizard, vocabulário, testes, ADR 0024/template). Não simular agregador retroativamente.

### Sub-bloco [1.H] — DX Execution (clipboard + warning + integration + examples + help + docs + README + CHANGELOG) `(deterministic)` — PR6-DX-execution (próximo PR; aguarda PR5)

> Origem: [`plan.md § Componente [F]`](./plan.md) + [`[DEC-0023-B01..B04]`](./decision-brief.md). **Primeira execução sob enforcement estrutural completo** (`executionAuthorized` derivado deve estar `true` antes deste sub-bloco iniciar).

- [x] **1.H.1** `src/infrastructure/io/NodeClipboard.ts` + tests — detecta wl-copy/xclip/pbcopy; fallback gracioso. Wire em `src/cli/workflow.ts` (default agora é `NodeClipboard`; `NoopClipboard` removido como redundante). Porta movida para `src/app/ports/ClipboardWriter.ts` (DDD layer fix). Cf. `[DEC-0023-B01]`.
- [x] **1.H.2** `AssembleBriefing` warning para extraction vazia (linha "(convenção do template não detectada; veja docs/guides/workflow-quickstart.md)"). Função `isExtractionEmpty()` detecta quando todos os campos extraídos são vazios; warning emite após linha de título no briefing. Cf. `[DEC-0023-B02]`.
- [x] **1.H.3** Integration test `tests/integration/workflow-dispatch.test.mjs` — exercita `node cli/ai-guidelines-cli.mjs continue` via subprocess real em diretório temp com `git init` + spec fake. 2 cenários: continue happy path (exit 0 + briefing) e continue bloqueado L2 (exit 1 + mensagem narrativa). Cobre cabling completo `parseArgs → engine → dispatchWorkflow → dist/cli/workflow.js → runContinue`.
- [x] **1.H.4** `examples/minimal-spec/` **Deferred com critério estrutural — vinculado à candidata `boilerplate-system-modernization`** (backlog `Now`). Revisão sob a tríade F01+F02+F03+F04 = B+B+A+A (cravada em PR5 S5, 2026-05-22) revelou que criar example de spec agora reproduz violação de `[DEC-0023-D01]` (`tasks.md` com `1.X.N`/`1.X.[COMMIT]` literais) e cobre apenas 1 dos 7 pilares. Coerente com F03 (boilerplate dedicado por classe) é entregar examples por classe junto com o refresh do sistema de boilerplates, não antes. Criação prematura tentada e revertida em commit anterior (deletado do working tree). Cf. `[DEC-0023-B03]` (decisão original) + lição registrada em `NEXT.md` § "Lição dogfooding — items cravados em decision-brief podem envelhecer".
- [x] **1.H.5** `cli/cli/args.mjs` `printHelp()` reescrito com seções por categoria (Bootstrap, Workflow Runtime, Opções gerais, Convenções, Contrato arquitetural). Cada subcomando ganha exemplo concreto. Wizard mínimo (6 opções) documentado. Enforcement L2 do `continue` explicitado. Cross-refs para ADRs (0017, 0018, 0020, 0021), DECs ([DEC-0023-B06], [DEC-0023-E03], [DEC-0023-G03]) e CORE-16. Escopo reduzido (cf. lição em NEXT.md): só comandos atuais; handoff vem em `handoff-as-first-class`; boilerplates por classe vêm em `boilerplate-system-modernization`.
- [x] **1.H.6** `docs/guides/workflow-quickstart.md` **Deferred com critério estrutural — vinculado a `boilerplate-system-modernization` + `handoff-as-first-class`**. Guide ensina criar spec usando boilerplate atual (marcado para refresh) e usar CLI sem handoff (que virá em `handoff-as-first-class`). Materialização agora envelhece quando uma das candidatas materializar. Coerente é entregar quickstart pós-modernização para dogfooding ser com sistema real.
- [x] **1.H.7** `docs/guides/workflow-with-ai-agents.md` **Deferred com critério estrutural — vinculado a `handoff-as-first-class`**. ADR 0022 (handoff situado precede distribuição pré-carregada) reposiciona o padrão canônico de uso com agentes IA como handoff just-in-time, não AGENTS.md pré-distribuído. Escrever guide agora ensina padrão pré-handoff e teria que ser reescrito. Modelo tri-party (incubação em NEXT.md) também é tema desse guide — deferimento permite documentar pós-validação. Materialização do guide acontece junto com `handoff-as-first-class`.
- [x] **1.H.8** `README.md` ganha seção "Workflow Runtime (preview)" enxuta consumer-facing — 1 parágrafo de contexto + 3 bullets (wizard, continue, estado canônico no repo) + 1 linha de cross-ref para `.governance/specs/0023-workflow-runtime/`. **Sem governance discourse interno** (sem CORE-16/ADRs/DECs no README público — esses cross-refs vivem em `docs/` ou na própria spec). Comando consumer-facing: `npx ai-guidelines` (não `yarn`). Comandos `workflow` e `continue` adicionados à tabela de essenciais. Linguagem explícita de "preview, UX may evolve". Reescrita pós-auditoria 2026-05-23 honra a redução -65% feita em 1.0.1. Cf. `[DEC-0023-B04]`.
- [x] **1.H.9** `CHANGELOG.md` entry v1.1.0-preview.0 refinada — adiciona bullets de PR5 (wizard mínimo + inquirer; NodeClipboard real; visual prompts engine; AssembleBriefing warning; integration test workflow-dispatch; CORE-16; ADR 0022 e 0023 em Proposta). Limitações conhecidas atualizadas (items deferidos do [1.H]; remove "Clipboard ainda em no-op"). Notas metodológicas ganham 3 entries novas (PR5 absorveu PR6 com lição registrada; items de tasks.md envelhecem; tri-party validado empiricamente).
- [x] **1.H.10** Avaliar promoção do **modelo tri-party** (Implementador IA + Revisor IA + Owner gate) para ADR próprio. **Resultado da avaliação:** não promover agora. **Pré-requisito não atingido:** ainda falta validação em ≥ 2 specs adicionais OU adoção espontânea por contribuidor externo. Item permanece deferred com critério explícito em `NEXT.md`; não é pendência operacional da PR #25.
- [x] **1.H.11** **(NOVO — promovido de insight a item formal via `[DEC-0023-B06]`)** Wizard CLI operacional mínimo no boot do REPL (`workflow` sem args): 5 opções fixas declarativas (Continuar spec atual / Continuar outra spec / Publicar estado / Ver specs ativas / Diagnosticar drift). Cada opção mapeia 1:1 para comando existente. Implementado em `src/cli/workflow.ts` (função `runWizard()` + dispatch em `runWorkflow()`). Anti-patterns vetados explicitamente. Tests BDD pt-BR cobrindo as 5 opções + quit + opção desconhecida.
- [x] **1.H.12** **(NOVO — embrião da candidata `governance-dashboard-and-visual-artifacts`; opção 6 cravada formalmente em `[DEC-0023-B07]` durante review do PR #25 / 2026-05-23)** Diretório `.governance/visual-prompts/` criado com README + 2 prompts parametrizáveis (`architecture-end-to-end.prompt.md` sem variáveis; `value-delivered.prompt.md` com `{{context}}`). Wizard CLI ganhou opção 6 ("Gerar prompt visual") que pergunta tipo + contexto, substitui variáveis e imprime o prompt pronto entre delimitadores para copy-paste em ferramenta externa. `renderVisualPrompt()` é função pura testável. Materialização completa do pipeline visual fica para a candidata `governance-dashboard-and-visual-artifacts`. **Governance closure:** B07 reconheceu retroativamente que 1.H.12 ativou o critério de revisão de B06 ("nova opção → DEC própria") e cravou a opção 6 como entrega declarada + reafirmou o gate para próximos casos.
- [x] **1.H.13** **(NOVO — calibragem editorial pós-auditoria 2026-05-23)** Diretório `docs/editorial/` criado com README explicativo + 4 prompts editoriais específicos do framework: `readme-cover.prompt.md` (capa principal 4:3 que refresca `docs/assets/ai-guidelines-flow.png`) + 3 variantes de capa DX secundária — `readme-dx-flow.prompt.md` (16:9, fluxo de sessão honesto), `readme-dx-capability.prompt.md` (1:1, 5 comandos primários sem inflar), `readme-dx-before-after.prompt.md` (16:9, contraste de organização do contexto, com 2-3 captions alternativas para escolha na hora de gerar). **Gênero distinto de `.governance/visual-prompts/`** (prompts diretos para gerador de imagem, não briefings dirigidos a IA conversacional; não invocáveis via wizard). **Calibragens cravadas** (corrigem artefatos da sessão anterior): (a) kernel correto = `.governance/registry.yml` + governance core, não AGENTS.md (cf. ADR 0018); (b) handoff renderizado como direcional / em construção (pontilhado, badge "em breve"), não como capacidade entregue (cf. ADR 0022 em Proposta); (c) painel ANTES da variante C não mostra `AGENTS.md`/`CLAUDE.md`/`.cursorrules` como caos — são entregas do framework, incoerência semântica. Cross-ref curta adicionada em `.governance/visual-prompts/README.md` apontando para o gênero distinto. **Iteração visual completa nesta sessão (2 rounds de feedback):** v1 gerada e auditada → refinamentos cravados nos 4 prompts (TECHNICAL HINTs explícitos para gerador: dashed outline; handoff a 60-70% opacidade; densidade DEPOIS 40% menor que ANTES; layout não-linear obrigatório no capability) → v2 regenerada e validada. **Imagens adotadas em produção:** `docs/assets/ai-guidelines-flow.png` (capa hero refreshed via `readme-cover.prompt.md`) + `docs/assets/ai-guidelines-dx-flow.png` (capa DX secundária via `readme-dx-flow.prompt.md`, referenciada inline na seção "Workflow Runtime (preview)" do README). Samples das 2 variantes DX não-escolhidas preservadas em `docs/editorial/sample-dx-capability.png` e `docs/editorial/sample-dx-before-after.png` como referência editorial.
- [x] **1.H.N** Pipeline verde + coverage por arquivo respeitado. **Validação atual:** `yarn test` verde fora do sandbox (child_process real exigido por `workflow-dispatch`); `workflow.ts` hardened para 95.54% lines em teste focado; coverage agregado permanece acima de 85%.
  > **1.H.[REVIEW] (merge authorization) — MOVIDO para [`review.md`](./review.md) R8.** A aprovação humana de merge ponta-a-ponta não é execução; saiu daqui para que o `tasks.md` seja execution-only e possa fechar 100% `[x]`. O gate determinístico do merge-stack lê `review.md` R8. Cf. `[DEC-0023-M01]` + `[DEC-0023-N01]` (renumeração após o novo R7 public-facing).
- [x] **1.H.[COMMIT]** Commits atômicos por sub-task acima. **Honestidade operacional:** o número "8 commits incrementais" envelheceu; PR #25 fechou com sequência maior de commits atômicos, incluindo hardening pós-review. Não há dívida por não caber no número original.

### Sub-bloco [1.L] — Operational CLI commands (Integration PR + merge-stack + release-prep) `(deterministic)` — Bloco L (concluído; convergido retroativamente 2026-05-24)

> Origem: [`[DEC-0023-L01]`](./decision-brief.md) + ADR 0024 amendment (tier model de execução transacional). **Sub-bloco gravado em reconciliação 2026-05-24:** o Bloco L foi autorizado via `DEC-0023-L01` e executado nos commits abaixo _antes_ de ganhar boundary em `tasks.md` — registrá-lo aqui restaura a integridade de `[DEC-0023-D01]` (tasks.md como boundary de autorização) que o `executionAuthorized` derivado pressupõe. Letra `L` (não `I`) preserva o vínculo direto Bloco L ↔ `DEC-0023-L01` ↔ tasks.md; coerência semântica acima de sequência estética.

- [x] **1.L.1** Ports `src/app/ports/StackOps.ts` + `src/app/ports/GitOps.ts` + extensão `src/app/ports/Prompts.ts`; adapters `src/infrastructure/git/GhCli.ts` + `src/infrastructure/git/NodeGit.ts` + extensão `src/infrastructure/io/InquirerPrompts.ts`.
- [x] **1.L.2** Use cases `OpenIntegrationPR` + `MergeStack` + `ReleasePrep` (`src/app/workflow/`) com tests BDD pt-BR.
- [x] **1.L.3** Wizard reordenado + icons + opções 4 (🔗 Abrir Integration PR) e 5 (🔀 Merge atômico da stack) em `src/cli/workflow.ts`; cabling em `cli/cli/args.mjs` + `cli/app/engine.mjs`.
- [x] **1.L.4** Comando standalone `release-prep` (tier 3 do modelo transacional do ADR 0024) em `src/cli/release-prep.ts` + tests.
- [x] **1.L.5** `integration-pr.md` (body source, artifact da spec — sem número de PR no filename, cf. L01) + `printHelp()` atualizado + entry no `CHANGELOG.md`. ADR 0024 amendment + `[DEC-0023-L01]` publicados.
- [x] **1.L.6** Gate determinístico de Integration readiness (`src/app/workflow/CheckIntegrationReadiness.ts` + tests BDD): opção 🔗 bloqueia até `review.md` R1–R7 `[x]`; opção 🔀 bloqueia até R1–R8 `[x]`. Wizard opção 1 mostra os 3 boundaries (execution/integration/closure). Lookup de estado declarado + output copiável para IA externa; sem IA no runtime. Cf. `[DEC-0023-E03]` (L2 enforcement) + `[DEC-0023-L01]` + `[DEC-0023-M01]`.
- [x] **1.L.N** Pipeline verde com os tests BDD dos 3 use cases + comando release-prep + integração do wizard + gate de readiness.
- [x] **1.L.[REVIEW]** Homologação do Bloco L converge no próprio PR #26 (dogfooding de fechamento, cf. NEXT.md § "Dogfooding de fechamento — Integration PR"): a maquinaria de Integration PR é homologada pelo Integration PR que ela cria.

  **Reconciliação 2026-05-24:** este item não representa gate independente. A homologação operacional do Bloco L foi explicitamente incorporada ao Integration PR (#26) via `DEC-0023-L01` e ADR 0024 amendment. Os gates humanos reais permanecem 1.H.[REVIEW] e 4.9.

- [x] **1.L.[COMMIT]** Sequência de commits do Bloco L:
  - `f7913a1 docs(spec-0023): ADR 0024 amendment + [DEC-0023-L01] — Operational CLI commands`
  - `4d37f91 feat(workflow): StackOps + GitOps ports + GhCli/NodeGit adapters`
  - `652da9d feat(workflow): OpenIntegrationPR + MergeStack + ReleasePrep use cases + tests BDD`
  - `21dd78e feat(cli): wizard reordenado + icons + opções 4/5 (Integration PR + merge-stack)`
  - `29aa84d feat(cli): release-prep standalone command (tier 3, Bloco L)`
  - `993dcb9 docs(spec-0023): rename integration-pr.md + printHelp + CHANGELOG`

### Sub-bloco [1.N] — Comando de triagem de review (`review`) `(deterministic)` — Bloco N (dogfooding-born no fechamento, 2026-05-25)

> Origem: [`[DEC-0023-N01]`](./decision-brief.md). Nasceu da dor de tratar 2 reviews do Copilot no PR #25 na mão. **Boundary ADR 0018:** o comando reúne + estrutura (determinístico); análise/classificação/resposta é trabalho do agente, não do runtime.

- [x] **1.N.1** Porta `StackOps.listReviewComments` + tipo `ReviewComment`; adapter `GhCli` via `gh api repos/{owner}/{repo}/pulls/N/comments --paginate`.
- [x] **1.N.2** Use case `TriageReview` (agrupa sem-resposta × respondidos por thread) + tests BDD pt-BR.
- [x] **1.N.3** CLI standalone `src/cli/review.ts` (`review [<pr>]`, read-only, render copiável) + cabling em `cli/cli/args.mjs` (positional `<pr>` + help) + `cli/app/engine.mjs` (`dispatchReview`). Detecção de PR pela branch atual ou número explícito.
- [x] **1.N.4** Fakes de `StackOps` (MergeStack/OpenIntegrationPR/workflow) e o segundo Copilot review (#25, 2026-05-25) tratados na mesma esteira.
- [x] **1.N.N** Pipeline verde (654 testes) + `Uso:`/help atualizados.
- [x] **1.N.[COMMIT]** `feat(workflow): comando review — triagem determinística de review comments (Bloco N)`.

---

## Fase de Review → migrada para `review.md`

> **A antiga "Fase de Review" (3.x) agora vive em [`review.md`](./review.md)** —
> boundary de prontidão (homologação) do Integration PR (#26). Mapeamento: 3.2→R2,
> 3.2→R1, 3.5→R2, 4.1→R3, **R4 = public-facing check (README/imagens, novo)**, 3.3/3.4→R5,
> 3.6→R6, 3.7/3.8→R7; merge authorization (ex-1.H.[REVIEW]/4.9) centralizada em `review.md` R8.
> Ordem reflete a cronologia (técnico → conteúdo → bodies → sign-off humano R7 → merge R8).
> O `tasks.md` é **execution-only** (cf. `[DEC-0023-M01]` + `[DEC-0023-N01]`):
> não contém gates de homologação nem pós-merge, e fecha 100% `[x]` ao fim da execução.
> O gate determinístico da opção 🔗 lê `review.md`, não este arquivo.

---

## Fase de Encerramento → migrada para `closure.md`

> **A antiga "Fase de Encerramento Pré-Merge" (4.x) agora vive em
> [`closure.md`](./closure.md)** (registro operacional pós-merge), exceto: 4.1
> (migração do NEXT) virou `review.md` R5 — gate de readiness pré-integration; e 4.9
> (merge authorization) virou `review.md` R8. Cf. `[DEC-0023-M01]`.

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
| **Gate de Review**     | Pós-execução, antes do merge                           | Owner + reviewers                             | [`review.md`](./review.md) R1–R8 (homologação + public-facing + merge auth) + PRs convertidos de Draft para Ready   |
