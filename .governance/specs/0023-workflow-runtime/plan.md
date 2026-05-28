<!-- ai-guidelines-template: plan-boilerplate v=1 -->

# Plan — Spec 0023 Workflow Runtime

> Spec: [`./spec.md`](./spec.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: Active

> **Vive durante a execução.** Diferente do `spec.md` (imutável após Stage B), este arquivo é atualizado conforme entendimento técnico evolui. Decisões revisitadas registram a anterior em nota, não apagam histórico.
>
> **Disciplina explícita (cf. `[DEC-0023-B05]`)**: este `plan.md` é pequeno, operacional, incremental. Sem ceremony, sem planejamento excessivo. Critério de revisão: se passar de ~150 linhas sem deduplicação com `spec.md`, reavaliar a forma.

---

## 🛰️ Stage 1 / Stage 2

A 0023 atravessou Stage A (Discovery) na branch legacy + sessão de design 2026-05-19; o gate Stage A → Stage B fechou com 4 decisões cravadas no `decision-brief.md` Bloco A. O Bloco B craveia o escopo original do PR2 (DX/docs). O experimento empírico de troca de máquina em 2026-05-21 abriu o **Bloco G**: sem índice operacional público em `main`, `yarn workflow` não consegue cumprir a promessa central de continuidade cross-agent/cross-machine. Toda subseção de "Design e Arquitetura" abaixo deriva de uma decisão `[DEC-0023-*]` específica — rota não derivada do brief é acreção pré-research e deve ser rejeitada.

---

## 🏗️ Design e Arquitetura

### Princípio guia

Runtime como **lente contextual** sobre estado existente, não como engine. AI permanece como **canal** (ADR 0018) — o runtime gera contexto da spec pronto para colar em agentes IA externos, não chama LLM. Toda decisão arquitetural passa pelo teste duplo: (a) "reduz carga cognitiva operacional?" e (b) "evita engine genérica/state machine/abstração prematura?". Ambas precisam passar.

### Componentes

#### [A] Domínio de Workflow — `src/domain/workflow/`

**Estado atual (pós-PR1):** `WorkflowState` (VO 4-chave com type guards), `SpecLocation` (VO), `WorkflowStage`/`GateStatus` (enums).

**Decisão:** Schema fechado por `[DEC-0023-A04]`. Novas chaves no `state.yml` exigem decisão própria; nenhuma acreção silenciosa.

**Mudanças em arquivos:**

- `src/domain/workflow/WorkflowState.ts` — pode receber type guards adicionais conforme novas operações.
- Novas entidades de domínio entram só com `[DEC-0023-*]` próprio.

#### [B] Aplicação de Workflow — `src/app/workflow/` + `src/app/ports/WorkflowFileSystem.ts`

**Estado atual:** `DetectActiveSpec` (double-lookup), `ReadWorkflowState` (parser injetado, boundary lock respeitado), `AssembleBriefing` (extração regex best-effort).

**Decisão:** Porta `WorkflowFileSystem` mantida lean (read/write/exists/list/branch). `AssembleBriefing` permanece com extração simples — `[DEC-0023-B02]` craveia: documentar convenção + warning quando extraction devolve vazio, sem heurística semântica. Parser injetado é o pattern obrigatório para serializers de infra (cf. boundary lock — app não importa infra direto).

#### [C] CLI Composition Root — `src/cli/workflow.ts`

**Estado atual:** REPL com classifyInput (numerado/nomeado/free-text), buildMenu (contextual a partir do state.gate), buildContextBundle (output copy-paste). Reader/clipboard/fs como portas injetáveis (testabilidade).

**Decisão:** `Clipboard` real entra no PR2 (`[DEC-0023-B01]`) — `NoopClipboard` é substituído por `NodeClipboard` com detecção xclip/wl-copy/pbcopy. Help CLI ganha exemplos por subcomando. **Nenhum LLM** — `[DEC-0023-A03]` é restrição cravada.

#### [D] Infraestrutura — `src/infrastructure/{filesystem,yaml}/`

**Estado atual:** `NodeWorkflowFileSystem` (paths sandboxed contra rootDir; git rev-parse para branch), `workflowStateSerializer` (parse/stringify com schema lock).

**Decisão:** `NodeClipboard` entra em `infrastructure/io/` (ou `infrastructure/clipboard/`) — diretório a confirmar no PR2 conforme convenção observada. Integration test de dispatch entra como `tests/integration/workflow-dispatch.test.mjs` (alinha com `tests/integration/cli.integration.test.mjs` existente).

#### [E] Bridge CLI legado — `cli/cli/args.mjs` + `cli/app/engine.mjs`

**Estado atual:** `workflow`/`continue` em SUPPORTED_MODES; dispatch dinâmico para `dist/cli/workflow.js` no `main()` antes de `execute()`. Fail-fast se dist/ ausente.

**Decisão:** Nenhuma lógica nova de domínio em `cli/`. `printHelp()` ganha exemplos no PR2; nenhuma outra mudança estrutural no entrypoint legado durante a 0023.

#### [F] Documentação e exemplos

**Estado atual:** Spec/decision-brief/plan/state.yml/NEXT/tasks.md em `.governance/specs/0023-workflow-runtime/`. ADRs 0019 e 0020 publicados. Nenhum guia de uso, nenhum exemplo no consumidor.

**Decisão (PR5-DX-execution):** `docs/guides/workflow-quickstart.md` + `docs/guides/workflow-with-ai-agents.md` + `examples/minimal-spec/` (cf. `[DEC-0023-B03]`). `README.md` ganha seção "Workflow Runtime" + repositioning leve (cf. `[DEC-0023-B04]` — preview tag explícito). `examples/` entra em `package.json#files`.

#### [G] CI mínimo de integridade estrutural (governance-pr-check)

**Estado atual (pós-PR2-lifecycle):** `src/cli/governance-pr-check.ts` + tests BDD pt-BR; `.github/workflows/governance-pr-check.yml` rodando em execution PRs (branch terminando em `-execution`).

**Decisão:** Escopo restrito a 4 validações estruturais (cf. `[DEC-0023-D03]`): marcador "Depends on #N (governance)" presente; governance PR existe; governance PR aberto/mergeado; governance PR contém tasks.md no diff. Fast-track via label `fast-track` bypassa. Sem drift semântico. Expansão deste check exige decisão própria.

#### [H] Artifacts de governance (lifecycle metodológico)

**Estado atual (pós-PR2-lifecycle):** Blocos D + E no decision-brief com 10 decisões cravadas; ADRs 0020 + 0021 publicados; `tasks.md` instanciado conforme `tasks-mixed-boilerplate.md` como boundary canônico das execuções subsequentes.

**Decisão:** PR2-lifecycle é bootstrap declarado (`[DEC-0023-D04]` análogo) — não aplicável a si mesmo. **PR4-enforcement-runtime + PR5-DX-thinking + PR6-DX-execution** são as iterações que aplicam o modelo estritamente; `PR3-runtime-state-index` introduz o índice público mínimo antes do enforcement automático.

#### [I] Enforcement Runtime — `executionAuthorized` derivado + workflow refuse

**Estado atual:** Apenas declaração arquitetural (Bloco E + ADR 0021). Implementação pendente.

**Decisão (PR4-enforcement-runtime, PR próprio):** Cf. `[DEC-0023-E03]`:

- `executionAuthorized` é **função derivada** computada como `tasks.md exists && gate.status == closed && governance chain íntegra`. **Não há campo declarativo** no `state.yml`.
- `workflow continue` recusa narrativamente quando `executionAuthorized == false`, listando condições não satisfeitas.
- Fast-track strictness em `governance-pr-check`: valida label + rationale (não apenas label).
- L2 é fonte local de verdade — runtime recusa execução mesmo offline / fora de CI.

PR isolado de DX/docs para validar enforcement separadamente.

#### [J] Runtime public state index — `.governance/runtime/active-specs.yml`

**Estado atual:** inexistente em `main`; a spec ativa só é descoberta por branch remota + `git show`, o que falhou no experimento de dogfooding 2026-05-21.

**Decisão (PR3-runtime-state-index):** Cf. `[DEC-0023-G01..G04]`:

- Introduzir `.governance/runtime/active-specs.yml` como **índice operacional público mínimo**, com um arquivo único versionado.
- **Source of truth** permanece no `state.yml` interno da spec + artifacts normativos da branch ativa.
- O índice público aceita apenas campos operacionais mínimos (`id`, `slug`, `branch`, `stage`, `status`, `spec_path`, `updated_at` + opcionais curtos). Campos normativos (`next[]`, critérios, `[DEC-*]`, rationale, checklist, debts, texto longo) são proibidos.
- `workflow` lê esse índice primeiro para descoberta/listagem; `continue` usa `branch`/`spec_path` para navegar; o briefing denso continua vindo da branch da spec.
- Primeira iteração com `yarn workflow publish-state` **manual**. Hook/CI/PRs incrementais de state só entram após o contrato mínimo provar valor no dogfood real.

---

## 🛠️ Rollout por PR

| PR                                                    | Escopo                                                                                                                                                                                                                                                                                                       | Saída                                                                                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **PR1** (pre-model, draft #18)                        | Pivot formal + state.yml + double-lookup + REPL workflow/continue + bridge entrypoint + ADR 0019 + dogfooding (cf. `[DEC-0023-A01..A04, B01..B05, C01]`). **Pre-model declarado** (`[DEC-0023-D04]`) — modelo de stacked PRs ainda não aplicado.                                                             | 6 commits em `feat/spec-0023-workflow-runtime`. PR draft aberto em GitHub.                                              |
| **PR2-lifecycle** (bootstrap)                         | Lifecycle metodológico cravado (Bloco D + ADR 0020) + Enforcement estrutural cravado (Bloco E + ADR 0021) + CI mínimo `governance-pr-check` + GitHub workflow + tasks.md reescrito conforme boilerplate mixed. **Bootstrap declarado** — introduz o modelo, não aplica a si mesmo. Stacked sobre PR1.        | Commits em `feat/spec-0023-lifecycle`. Push + abertura de PR draft aguardam autorização explícita do owner (`CORE-07`). |
| **PR3-runtime-state-index** (escopo expandido, atual) | Bloco G + contrato mínimo de `.governance/runtime/active-specs.yml` + dogfood da própria 0023 + groundwork para `workflow publish-state`. **Primeira implementação real da promessa central da 0023**: descoberta de spec ativa em `main` sem prompt humano denso. Stacked sobre PR2-followup-scripts (#22). | Branch atual `feat/spec-0023-runtime-active-state`; draft PR a abrir antes de tocar código da CLI.                      |
| **PR4-enforcement-runtime** (primeiro modelo estrito) | `executionAuthorized` derivado + `workflow continue` refuse narrativo + fast-track strictness em `governance-pr-check` (label + rationale). PR próprio (cf. `[DEC-0023-E03]`) para validar enforcement isolado. Stacked sobre PR3-runtime-state-index.                                                       | TBD após PR3 aprovado.                                                                                                  |
| **PR5-DX-thinking** (modelo estrito)                  | Reler Bloco B + verificar se decomposição em [1.H] do tasks.md permanece válida sob enforcement de PR4. Possivelmente trivialmente pequeno. **Gate 3 (Planning approval) explícito** antes de PR6. Stacked sobre PR4.                                                                                        | TBD após PR4 aprovado.                                                                                                  |
| **PR6-DX-execution** (modelo estrito)                 | Execução do sub-bloco [1.H] do tasks.md: clipboard real, AssembleBriefing warning, integration test, examples, CLI help, docs/guides, README, CHANGELOG. Stacked sobre PR5. **Primeira execução real sob enforcement estrutural completo.**                                                                  | TBD após PR5 aprovado.                                                                                                  |
| **PR7+** (futuro)                                     | Bootstrap (`workflow init` / `upgrade-state`) — critério de exit do release preview. Decisão própria em bloco futuro do decision-brief.                                                                                                                                                                      | TBD.                                                                                                                    |
| **PR8+** (futuro)                                     | Avaliação empírica externa: 2 specs atravessam o lifecycle completo. Critério de exit do preview → release estável.                                                                                                                                                                                          | TBD.                                                                                                                    |

PRs futuros são **candidatos**, não promessa. Cada um valida sua entrada contra "reduz carga cognitiva?" antes de abrir.

---

## ✅ Critérios de Aceite Detalhados (DoD operacional)

### PR1 (completed)

- [x] `ai-guidelines continue` na branch desta spec retorna briefing coerente.
- [x] `state.yml` validado por schema; chaves extras rejeitadas.
- [x] Double-lookup `.governance/specs/` → `.specify/specs/` funciona.
- [x] Boundary lock `app/** ↛ infrastructure/**` respeitado (parser injetado).
- [x] BDD pt-BR colocado para cada use case novo.
- [x] ADR 0019 publicado + indexado em README dos ADRs.
- [x] Pipeline `yarn format ; yarn check ; yarn test:nova-cli ; yarn test` verde.
- [x] Pivot da 0023 materializado em `.governance/specs/0023-workflow-runtime/` com gate Stage A → Stage B fechado.

### PR2 (histórico — DX/docs original, superseded parcialmente por Bloco G)

#### Componente [C] / [D] — Clipboard e dispatch

- [ ] `NodeClipboard` detecta xclip/wl-copy/pbcopy nessa ordem; fallback gracioso quando nenhum disponível; mensagem clara.
- [ ] Integration test executa `node cli/ai-guidelines-cli.mjs continue` em diretório temporário com `.governance/specs/fake-spec/` e valida output determinístico.

#### Componente [B] — Warning de extraction vazia

- [ ] `AssembleBriefing` emite warning textual no briefing quando `extractSpecHeaders` retorna `title=null` E `openHypotheses=[]` E `blockers=[]` E `state.next=[]` — sinaliza "convenção do template não detectada; veja docs/guides/workflow-quickstart.md".

#### Componente [F] — Docs e exemplos

- [ ] `examples/minimal-spec/` com ≤ 4 arquivos (spec.md curto, NEXT.md, state.yml, README.md explicando como rodar `workflow` ali).
- [ ] `examples/` adicionado a `package.json#files`.
- [ ] `docs/guides/workflow-quickstart.md` com outputs **reais** dogfoodados da 0023.
- [ ] `docs/guides/workflow-with-ai-agents.md` com pelo menos 2 padrões: (1) humano cola o contexto da spec no agente IA externo; (2) agente IA chama `continue` por baixo dos panos.
- [ ] README principal ganha seção "Workflow Runtime" + nota "preview — UX may evolve".

#### Componente [E] — CLI help

- [ ] `printHelp()` atualizado com pelo menos 1 exemplo por subcomando relevante.
- [ ] `ai-guidelines workflow --help` e `ai-guidelines continue --help` retornam help focado se factível (ou pelo menos remetem ao guide).

#### Globais (PR2)

- [ ] `CHANGELOG.md` ganha entry para v1.1.0-preview.0: "workflow runtime — preview, UX may evolve".
- [ ] Pipeline `yarn format ; yarn validate` verde. _Pressupõe [PR #21](https://github.com/rosanarezende/ai-guidelines/pull/21) (scripts reorganization) mergeado em main; antes disso, cadeia legada equivalente._
- [ ] Diff em consumidor real: não aplicável (mudanças são em mantenedor + adições no `files` que apenas incluem `examples/`).

### PR3 (ativo — runtime public state index)

- [x] `decision-brief.md` Bloco G fechado com decisão sobre 3 gêneros, índice público mínimo e sync manual inicial.
- [x] `.governance/runtime/active-specs.yml` criado com schema mínimo e dogfood da própria 0023.
- [ ] `workflow` passa a conseguir listar specs ativas a partir do índice público em `main`.
- [ ] `continue <slug|id>` resolve a spec via índice público antes de consultar a branch densa.
- [ ] `publish-state` explicita a projeção do `state.yml` interno para o índice público, sem hook/CI automáticos nesta primeira iteração.
- [ ] Drift guard mínimo: paths referenciados no índice existem; campos proibidos não aparecem.
- [ ] Repetir experimento de troca de máquina/sessão com sucesso sem prompt humano denso.

---

## ⚠️ Riscos arquiteturais ativos

- **Extraction frágil em specs fora do template canônico.** Mitigação: warning explícito (PR2) + convenção documentada nos guides. Reabrir como `[DEC-0023-B02-revisited]` se ≥ 2 specs externas reportarem briefing thin.
- **Branch name dependency.** `feat|fix|docs|chore|refactor/spec-NNNN-{slug}`. Documentado como convenção necessária; sem fallback heurístico em PR2. Reabrir se feedback externo reportar friction.
- **`NodeWorkflowFileSystem` coverage ainda baixa.** Integration test do dispatch (PR2) cobre o caminho crítico end-to-end. Coverage por arquivo só sobe com fixtures hermeticas — vira candidato para PR3+.
- **state.yml em spec existente continua manual.** Bootstrap é PR3 (`[DEC-0023-B01]`). Risco: durante a janela PR2-merged → PR3-merged, quem instalar via npm precisa criar `state.yml` à mão (ou rodar `workflow` mesmo sem ele — defaulted briefing funciona, só fica thin).
- **Índice público pode divergir da branch real da spec.** Mitigação inicial: `publish-state` explícito + `last_sync_commit` opcional; automação só após primeiro caso real.

---

## 📌 Decisões revisitadas

_(Vazio. Registrar aqui se algum `[DEC-0023-*]` precisar revisão pós-Resolved — com nota da decisão anterior, nunca apagar histórico.)_
