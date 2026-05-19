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

A 0023 atravessou Stage A (Discovery) na branch legacy + sessão de design 2026-05-19; o gate Stage A → Stage B fechou com 4 decisões cravadas no `decision-brief.md` Bloco A. O Bloco B craveia o escopo do PR2 (DX/docs). Toda subseção de "Design e Arquitetura" abaixo deriva de uma decisão `[DEC-0023-*]` específica — rota não derivada do brief é acreção pré-research e deve ser rejeitada.

---

## 🏗️ Design e Arquitetura

### Princípio guia

Runtime como **lente contextual** sobre estado existente, não como engine. AI permanece como **canal** (ADR 0018) — o runtime gera context bundles consumidos por agentes IA externos, não chama LLM. Toda decisão arquitetural passa pelo teste duplo: (a) "reduz carga cognitiva operacional?" e (b) "evita engine genérica/state machine/abstração prematura?". Ambas precisam passar.

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

**Estado atual:** Spec/decision-brief/plan/state.yml/NEXT em `.governance/specs/0023-workflow-runtime/`. ADR 0019 publicado. Nenhum guia de uso, nenhum exemplo no consumidor.

**Decisão (PR2):** `docs/guides/workflow-quickstart.md` + `docs/guides/workflow-with-ai-agents.md` + `examples/minimal-spec/` (cf. `[DEC-0023-B03]`). `README.md` ganha seção "Workflow Runtime" + repositioning leve (cf. `[DEC-0023-B04]` — preview tag explícito). `examples/` entra em `package.json#files`.

---

## 🛠️ Rollout por PR

| PR               | Escopo                                                                                                                                                                                                                                                                                           | Saída                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **PR1** (merged) | Pivot formal + state.yml + double-lookup + REPL workflow/continue + bridge entrypoint + ADR 0019 + dogfooding (cf. `[DEC-0023-A01..A04, C01]`)                                                                                                                                                   | 5 commits em `feat/spec-0023-workflow-runtime` (9dedce5, 2c35999, ca8c408, fbc4f75, 0774348). 431 jest + 296 mjs tests passando. |
| **PR2** (ativo)  | DX/docs/onboarding sem novas abstrações (cf. `[DEC-0023-B01..B05]`): clipboard real, help CLI humano com exemplos, README operacional, quickstart end-to-end, guia com Claude Code/Cursor, `examples/minimal-spec/`, integration test do dispatch, CHANGELOG entry, warning de extraction vazia. | Tasklist do PR2 criada após gate Bloco B fechado.                                                                                |
| **PR3** (futuro) | Bootstrap: `workflow init` ou `workflow upgrade-state`. Cria/migra `state.yml` em spec existente. Critério de exit do release preview. Decisão própria em decision-brief Bloco C ou novo bloco.                                                                                                  | TBD.                                                                                                                             |
| **PR4** (futuro) | Avaliação empírica: 2 specs externas atravessam discovery → decision usando o runtime; evidência de redução de carga cognitiva (tempo de retomada, leituras evitadas, prompts manuais reduzidos). Critério de exit do preview → release estável.                                                 | TBD.                                                                                                                             |

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

### PR2 (ativo — tasks a abrir)

#### Componente [C] / [D] — Clipboard e dispatch

- [ ] `NodeClipboard` detecta xclip/wl-copy/pbcopy nessa ordem; fallback gracioso quando nenhum disponível; mensagem clara.
- [ ] Integration test executa `node cli/ai-guidelines-cli.mjs continue` em diretório temporário com `.governance/specs/fake-spec/` e valida output determinístico.

#### Componente [B] — Warning de extraction vazia

- [ ] `AssembleBriefing` emite warning textual no briefing quando `extractSpecHeaders` retorna `title=null` E `openHypotheses=[]` E `blockers=[]` E `state.next=[]` — sinaliza "convenção do template não detectada; veja docs/guides/workflow-quickstart.md".

#### Componente [F] — Docs e exemplos

- [ ] `examples/minimal-spec/` com ≤ 4 arquivos (spec.md curto, NEXT.md, state.yml, README.md explicando como rodar `workflow` ali).
- [ ] `examples/` adicionado a `package.json#files`.
- [ ] `docs/guides/workflow-quickstart.md` com outputs **reais** dogfoodados da 0023.
- [ ] `docs/guides/workflow-with-ai-agents.md` com pelo menos 2 padrões: (1) humano cola bundle no agente IA; (2) agente IA chama `continue` por baixo dos panos.
- [ ] README principal ganha seção "Workflow Runtime" + nota "preview — UX may evolve".

#### Componente [E] — CLI help

- [ ] `printHelp()` atualizado com pelo menos 1 exemplo por subcomando relevante.
- [ ] `ai-guidelines workflow --help` e `ai-guidelines continue --help` retornam help focado se factível (ou pelo menos remetem ao guide).

#### Globais (PR2)

- [ ] `CHANGELOG.md` ganha entry para v1.1.0-preview.0: "workflow runtime — preview, UX may evolve".
- [ ] Pipeline `yarn format ; yarn check ; yarn test:nova-cli ; yarn test` verde.
- [ ] Diff em consumidor real: não aplicável (mudanças são em mantenedor + adições no `files` que apenas incluem `examples/`).

---

## ⚠️ Riscos arquiteturais ativos

- **Extraction frágil em specs fora do template canônico.** Mitigação: warning explícito (PR2) + convenção documentada nos guides. Reabrir como `[DEC-0023-B02-revisited]` se ≥ 2 specs externas reportarem briefing thin.
- **Branch name dependency.** `feat|fix|docs|chore|refactor/spec-NNNN-{slug}`. Documentado como convenção necessária; sem fallback heurístico em PR2. Reabrir se feedback externo reportar friction.
- **`NodeWorkflowFileSystem` coverage ainda baixa.** Integration test do dispatch (PR2) cobre o caminho crítico end-to-end. Coverage por arquivo só sobe com fixtures hermeticas — vira candidato para PR3+.
- **state.yml em spec existente continua manual.** Bootstrap é PR3 (`[DEC-0023-B01]`). Risco: durante a janela PR2-merged → PR3-merged, quem instalar via npm precisa criar `state.yml` à mão (ou rodar `workflow` mesmo sem ele — defaulted briefing funciona, só fica thin).

---

## 📌 Decisões revisitadas

_(Vazio. Registrar aqui se algum `[DEC-0023-*]` precisar revisão pós-Resolved — com nota da decisão anterior, nunca apagar histórico.)_
