<!-- ai-guidelines-template: plan-boilerplate v=1 -->

# Plan — Spec 0024 Context Architecture

> Spec: [`./spec.md`](./spec.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Tasks: [`./tasks.md`](./tasks.md)
> Status: Draft

> **Vive durante a execução.** Diferente da `spec.md` (imutável após In Review),
> este arquivo é atualizado conforme o entendimento técnico evolui.

> ## 📖 Glossário operacional (SSOT — Checkpoint 2.1, 2026-05-31)
>
> Vocabulário canônico da 0024, para eliminar a ambiguidade entre _unidade de implementação_ e _Pull Request real_ (drift que a 0023 já havia diagnosticado — cf. `review.md` R6: _"drift 'PR6' não existe"_). Os três eixos são independentes:
>
> - **PR / `#N`** — exclusivamente um **Pull Request real do GitHub** (ex.: `#32`, `#33`).
> - **Checkpoint N** — uma **unidade de implementação** da spec (ex.: Checkpoint 3). Substitui o antigo e ambíguo "PR-N". A enumeração `Checkpoint 1…12` é a trilha de absorção.
> - **Gate** — o **ritual de validação** que fecha um checkpoint, em três etapas nomeadas: **Technical Audit Gate** (Codex) → **Architectural Review Gate** (ChatGPT) → **Human Gate** (owner). O Human Gate de um checkpoint = autorização de merge do PR correspondente.
>
> **Proveniência** (comentários nos PRs): `ref: #<PR> @ <sha>` · `checkpoint: <N>` · `role: <implementation|technical_audit|architectural_review|human_gate>`. **Template canônico do comentário de checkpoint:** [`.core/process/checkpoint-comment-template.md`](../../../.core/process/checkpoint-comment-template.md).

> ## 🔁 Nota de fase — ABSORÇÃO OPERACIONAL (2026-05-31, Checkpoint 2)
>
> **Stage 1 (research → decision-brief → gate) encerrou.** As decisões estão `Resolved` (`[DEC-0024-G00]`/`G02`/`G06`); o gate de research está **fechado**; `state.yml` = `implementation`/`closed`. A 0024 está em **absorção operacional**: fazer o sistema refletir decisões já tomadas, removendo divergências decisão↔código **uma a uma**.
>
> O Checkpoint 2 **dobrou a sequência de absorção para dentro deste arquivo** (§ "Sequência de Checkpoints"), aposentando a dependência do plano local efêmero (`~/.claude/plans/`). **A partir daqui, o plano executável canônico da 0024 é este `plan.md`.** O backlog de divergências é o **relatório de auditoria do Codex** (referência decisão↔código).
>
> As seções research-first abaixo foram **colapsadas para sumário histórico** (Stage 1 — encerrado). A pesquisa estrutural ainda aberta vive em [`research/findings.md`](./research/findings.md) e **não bloqueia** a absorção.

---

## 🛰️ Stage 1 — ENCERRADO (sumário histórico)

> **Stage 1 (Research → opções → Gate).** Coletou evidência via análise comparativa de sistemas externos (Hermes, Cursor, opencode, Spec Kitty, Multica) + auditoria interna; consolidou findings convergidos em [`research/findings.md`](./research/findings.md); cravou as decisões no [`decision-brief.md`](./decision-brief.md) (reestruturado **por estado** em 2026-05-31). **Termina no gate humano** — fechado em 2026-05-31.
>
> **Resultado cravado (gate):** `[DEC-0024-G00]` identidade (a unidade primária é a transformação `contexto humano → governança executável`) · `[DEC-0024-G02]` taxonomia `deterministic/mixed/evidence-driven` **removida** (→ bloco + propriedade `exige-julgamento`, marcador `(julgamento)`/`(determinístico)`) · `[DEC-0024-G06]` contrato da cadeia `research → … → implementação`. Todas `Resolved`.
>
> **Pesquisa estrutural ainda aberta** (ex-`G01` estrutura/gramática, ex-`G03` promotion pipeline, ex-`G04` casa única de boilerplate, ex-`G05` projeções, + eixos de pressão A/B/D/E/F): migrou para `research/findings.md` como **findings abertos**. Não é ponto de gate; só retorna ao brief como `[DEC] Pendente` ao convergir + exigir julgamento. **Aceitar `G00` não as resolve** (instrução explícita do gate).

> **Correção de framing (2026-05-31).** O texto pré-absorção dizia "esta spec é research-first; a implementação vira spec separada (0025)". **Isso foi superado:** a implementação é entregue **dentro da 0024** (decisão da owner, 2026-05-29), agora como **absorção operacional** das decisões cravadas — não como pesquisa nem como spec futura.

---

## 🧱 Sequência de Checkpoints — CONGELADA (plano executável canônico)

> **SSOT do plano de absorção.** Cada checkpoint: **atômico, mergeável, reversível**, fechado por um **Gate** completo (`implementation → Technical Audit Gate (Codex) → Architectural Review Gate (ChatGPT) → Human Gate (owner)`). **1 checkpoint por vez**, parar no Gate quando o commit estiver pronto. Backlog = relatório de auditoria do Codex (códigos `A#/B#/C#/D#/P#` abaixo referenciam esse relatório).

| Checkpoint | Objetivo                                                                                                                                                                                                                                                                                                                                                                     | Deps             | PR real                       | Status                                       |
| :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------- | :---------------------------- | :------------------------------------------- |
| **1**      | `active-specs.yml` lista a 0024 (Codex A3) — publica a spec no índice público via `workflow publish-state`                                                                                                                                                                                                                                                                   | —                | **#32**                       | ✅ feito + gated (`87865ca`)                 |
| **2**      | reframe `tasks/plan/NEXT/spec` → absorção (Codex A2/P1/P2); `spec.md` via nota datada sem apagar histórico; **dobrar esta sequência no `plan.md`**                                                                                                                                                                                                                           | —                | **#32**                       | 🔄 implementado (`8b0eec6`) — Gate pendente  |
| **2.1**    | correção de vocabulário (PR-N → Checkpoint N; ritual → Gate) + alinhamento à 0023 (separação implementação/revisão/integração) — fecha o escopo do **#32**                                                                                                                                                                                                                   | Checkpoint 2     | **#32** _(encerra após este)_ | 🔄 **EM EXECUÇÃO**                           |
| **3**      | **GG-0003 Consistency Projection Check** — estritamente mecânico: `state.yml` é fonte de verdade + lista FIXA de marcadores literais contraditórios (`"Stage 1 ativo"`, `"gate aberto"`, brief `Pendente`…). **Sem parsing semântico.**                                                                                                                                      | Checkpoint 2     | PR próprio _(off `main`)_     | pendente                                     |
| **4A**     | **Workflow Provenance · storage** — `.governance/runtime/provenance.yml` (append-only, runtime-scoped). Campos: `spec`(obrig.)/`actor`/`role`/`at`/`ref`, `model?` opcional. **`role` = string LIVRE**. **Espinha** `implementation`+`human_gate` = sempre DERIVADA (git/active-specs), não persistida, nunca bloqueia. **Opcionais** persistidos (audit/review/security/…). | Checkpoint 1/2   | PR próprio _(off `main`)_     | pendente _(protótipo em stash — referência)_ |
| **4B**     | **Workflow Provenance · projeção** no `workflow continue`: impl (derivada) + `Auditorias/revisões registradas:` (lista de tamanho variável) + gate (derivado) + `Revisão independente: PENDENTE/OK`. Mostra **fatos/pendências**, NUNCA prescrição (DEC-0023-B06 lookup-not-coordination). **Provenance = projeção, NÃO compliance/bloqueio/lifecycle.**                     | Checkpoint 4A    | PR próprio _(off `main`)_     | pendente                                     |
| **5**      | **AGENTS sync** — `agents:build` (recompila bloco `<AI_GUIDELINES>` de `rules.json`) + `agents:check` (gate no `validate`). Destrava Checkpoint 7.                                                                                                                                                                                                                           | —                | PR próprio _(off `main`)_     | pendente                                     |
| **6**      | **GG-0002 mecanismo** — `banned-concept-check` + registro `banned-by-dec.yml` (sem termo live ainda) + fixture. **Antes** da remoção (instala o guard sem janela de regressão).                                                                                                                                                                                              | —                | PR próprio _(off `main`)_     | pendente                                     |
| **7**      | **CRÍTICO (Codex A1/P0)** — remover taxonomia `evidence-driven/deterministic/mixed` de `GR-0101`→`AGENTS.md`, `governance-foundation §"Tipos de spec"→"Propriedades de bloco"`, `spec-boilerplate` ×2; **registrar o ban no mesmo commit** (sem janela de regressão).                                                                                                        | Checkpoint 5 + 6 | PR próprio _(off `main`)_     | pendente                                     |
| **8**      | corrigir path morto na msg do `gate-decidability-check` (→ `governance-foundation § Guardrails`) (Codex B1)                                                                                                                                                                                                                                                                  | — (flex)         | PR próprio _(off `main`)_     | pendente                                     |
| **9**      | desacoplar existência do `decision-brief` de `evidence-driven/mixed` (Codex B3)                                                                                                                                                                                                                                                                                              | Checkpoint 7     | PR próprio _(off `main`)_     | pendente                                     |
| **10**     | tasks boilerplate **único**; aposentar 3 variantes; renomear recipe/partials `tasks-evidence-driven`→genérico (Codex C2/C3)                                                                                                                                                                                                                                                  | Checkpoint 7     | PR próprio _(off `main`)_     | pendente                                     |
| **11A**    | drift-guard do legado `.specify/templates` (estanca a hemorragia) (Codex C1)                                                                                                                                                                                                                                                                                                 | Checkpoint 10    | PR próprio _(off `main`)_     | pendente                                     |
| **11B**    | trocar fonte ativa → root canônico (⚠️ **micro-decisão da owner:** `.core/templates` vs `.ai-guidelines/templates`)                                                                                                                                                                                                                                                          | Checkpoint 11A   | PR próprio _(off `main`)_     | pendente                                     |
| **11C**    | remover legado `.specify/templates` após 11B estável                                                                                                                                                                                                                                                                                                                         | Checkpoint 11B   | PR próprio _(off `main`)_     | pendente                                     |
| **12**     | limpar docs arquiteturais de `workflowType` (ARCHITECTURE.md, ADR 0014 nota histórica) (Codex B2/D1)                                                                                                                                                                                                                                                                         | —                | PR próprio _(off `main`)_     | pendente                                     |

**Ordem de valor:** Checkpoint 1 ✅ → 2 → **2.1 (encerra #32)** → (3 consistência + 4A/4B proveniência: barreiras novas **antes** da migração) → 5 + 6 → **7 (o crítico, protegido)** → 9/10 → 11A/B/C → 8/12 (flex).

> ⚠️ **Protótipo do Checkpoint 4A em `git stash`** (sessão 2026-05-31): interrompido por **ordem de execução** (não rejeição). Material de **referência** apenas. Quando a sequência chegar ao Checkpoint 4A, inspecionar e decidir o que reaproveitar. **Não** misturar antes da hora nem antecipar Provenance.

---

## 🗺️ Topologia operacional (alinhada à 0023)

> A 0024 **aterrissa incrementalmente** (modo `sequential`, ADR 0024 — "a escolha certa quando os PRs são reversíveis isoladamente, dependências fracas, deploy parcial aceitável"), honrando ADR 0020 (**governança precede execução**). Separa as três fronteiras que a 0023 cravou (`[DEC-0023-M01]`): **implementação** (PRs + `tasks.md` execution-only) · **revisão** (Gates por checkpoint + `review.md` na integração) · **integração** (Integration PR terminal + `release-log.md`).

- **PR #32 = PR de governança/bootstrap da 0024.** Escopo **finito**: Checkpoint 1 + Checkpoint 2 + Checkpoint 2.1. Fecha o Gate de encerramento (cobrindo Checkpoint 2 + 2.1; Checkpoint 1 já gated historicamente) e **mergeia em `main`** (a governança aterrissa primeiro). **Não recebe Checkpoint 3+.**
- **Checkpoint 3 em diante = Pull Requests reais independentes**, cada um branchado de `main` atualizado (`feat/0024-cpNN-<slug>`), aberto como **Draft** (CORE-09). Título: `[🛠️] [Spec 0024] Checkpoint 3 — …`. As dependências reais viram **ordem de merge sequencial** (Checkpoint 7 só após 5+6 em `main`; cadeia 11A→B→C em ordem). Rollback = `git revert` do merge daquele checkpoint.
- **Cada PR carrega o estado:** marca seu item `[x]` em `tasks.md` e atualiza `state.yml.next` para o próximo checkpoint (o estado anda junto com a entrega — sem drift SSOT→projeção).
- **Gate por checkpoint = fronteira de revisão do PR:** `implementation` (Draft) → `Technical Audit Gate` (Codex) → `Architectural Review Gate` (ChatGPT, → Ready) → `Human Gate` (owner, → autoriza merge). Registrado como proveniência **no próprio PR**.
- **Integration PR (`[🔗] [Integration]`) nasce no fim:** após o último checkpoint mergeado e `review.md` (R1–R7) fechado. Homologa a 0024 ponta-a-ponta; como tudo já aterrissou (sequential), é homologação pura (não veículo) e **carrega o commit de encerramento** (spec→`Done`, `state.yml`→`done`, `NEXT.md` deletado, `release-log.md` T0). R8 (Human Gate de encerramento) → merge.

---

## 🏗️ Princípios de absorção (lente para cada checkpoint)

> O "como" de cada checkpoint deriva das decisões cravadas. Estes princípios — extraídos do uso real da stack na 0024 — governam as escolhas de design ao longo da sequência:

- **Toda aresta SSOT→projeção precisa de um gate de sync, ou diverge em silêncio.** Drift silencioso SSOT→projeção é o padrão recorrente nº 1 (apareceu 4×: `state.yml`↔`active-specs`, `rules.json`↔`AGENTS.md`, `state.yml`↔`tasks/plan/NEXT/brief`, código↔`ARCHITECTURE.md`). Checkpoint 3 (consistência) e Checkpoint 5 (AGENTS sync) são instâncias.
- **Enforcement previne a classe, não só o sintoma.** O guard entra **antes/junto** da correção, sem janela de regressão (Checkpoint 6 antes de Checkpoint 7).
- **Validação mecânica vs semântica por guardrail.** Todo guardrail declara seu subconjunto 🤖 (check falha) e 👁 (julgamento humano), como GG-0001. Checks de absorção são **estritamente mecânicos** (lista fixa de marcadores literais; sem parsing semântico — Checkpoint 3).
- **Projeção, não governança.** Proveniência (Checkpoint 4A/4B) é **projeção** (fatos/pendências num olhar), nunca compliance/bloqueio/lifecycle. A espinha (impl+gate) é **derivada**, não persistida.
- **Anti-taxonomia em todos os níveis.** Ao remover uma taxonomia fechada, não recriá-la um nível acima; preferir **propriedade livre + papéis reconhecidos (hints de projeção)** a enum fechado (`role` livre na proveniência; `exige-julgamento` por bloco em G02). _Aplicado também a este vocabulário: "Checkpoint" reusa linguagem natural, não introduz sigla nova._
- **Clean-clone/smoke gateia distribuição.** `test:smoke` deve gatear checkpoints que afetam o que o consumidor recebe (notadamente Checkpoint 11A/B/C).

---

## ✅ Critérios de Aceite Detalhados (DoD operacional)

### Por checkpoint

- [ ] Atômico, mergeável, reversível — uma divergência decisão↔código por checkpoint (ou um bloco coeso).
- [ ] Fecha o **Gate** completo (Technical Audit → Architectural Review → Human) **antes** de mergear. Correção local pequena não espera; mudança estrutural sim.
- [ ] `yarn format ; yarn validate` verde (build:rules + suíte + living-docs + state-yml + gate-decidability).
- [ ] Checkpoint que instala/altera guardrail carrega **check + fixture** no mesmo commit; checkpoint que afeta distribuição roda `test:smoke`.
- [ ] Do Checkpoint 3 em diante: **PR real próprio** (Draft → Ready → Human Gate → merge), com proveniência no PR (`ref: #N @ sha` · `checkpoint: N` · `role`).
- [ ] Sem reabrir decisão `Resolved` (G00/G02/G06) nem re-modelar arquitetura congelada.

### Globais (toda a spec)

- [ ] Pipeline `yarn format ; yarn validate` verde.
- [ ] Não-objetivos cravados em `spec.md` continuam respeitados (auditoria final).
- [ ] **Fronteira modelo ≠ migração:** absorção entrega enforcement + artefato de referência; migração ampla do ecossistema (Grupo B) permanece nas candidatas re-escopadas.
- [ ] `review.md` (R1–R7) + Integration PR + `release-log.md` instanciados no encerramento; spec→`Done` só após o último checkpoint.

---

## 🧪 Estratégia de Testes

> A fase de absorção **produz código** (checks, guardrails, projeções). Cada checkpoint estrutural carrega seus próprios testes:

- **Checks/guardrails** (Checkpoint 3 GG-0003, Checkpoint 6 GG-0002, Checkpoint 8): fixture determinística (caso que falha + caso que passa); integração no chain `yarn validate`.
- **Proveniência** (Checkpoint 4A storage, 4B projeção): testes de serialização append-only + derivação da espinha (impl/gate) sem persistência; projeção mostra fatos/pendências, nunca prescrição.
- **AGENTS sync** (Checkpoint 5): `agents:check` falha quando `<AI_GUIDELINES>` diverge de `rules.json`.
- **Migração `.specify`** (Checkpoint 11A/B/C): `test:smoke`/clean-clone valida o que o consumidor recebe.
- **Regressão da remoção** (Checkpoint 7): o ban (`banned-concept-check`, Checkpoint 6) falha se a taxonomia reaparecer.

---

## 🛠️ Arquivos modificados (esperado)

### Stage 1 (encerrado — registro)

- `spec.md` (instanciação + nota de fase) · `decision-brief.md` (DECs → `Resolved`, por estado) · `research/*.md` + `research/findings.md` · `state.yml` (→ `implementation`/`closed`) · `roadmap/backlog.md` · `.gitignore` (`temp/`).

### Absorção (por checkpoint; cf. tabela § "Sequência de Checkpoints")

- **#32 (Checkpoint 1/2/2.1):** `spec.md`, `plan.md`, `tasks.md`, `NEXT.md`, `state.yml` (governança/docs — encerra).
- **Checkpoint 3+ (PRs próprios off `main`):** runtime/checks (`cli/governance/*`), boilerplates (`.core/templates/*`, recipes/partials), doutrina (`.core/process/governance-foundation.md`), `AGENTS.md`, `.governance/runtime/provenance.yml`, docs arquiteturais — escopados por checkpoint.

---

## ⚠️ Riscos técnicos (concretos)

| Risco                                                                         | Mitigação                                                                                                                     |
| :---------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| Voltar a re-modelar em vez de remover divergências (risco dominante da fase). | Critério cravado: _"já foi validado empiricamente na 0024?" → absorver/enforçar/executar._ Não re-pesquisar o `Resolved`.     |
| Encadear vários checkpoints estruturais sem Gate.                             | 1 checkpoint atômico por vez; parar no Gate quando o commit estiver pronto (Technical Audit → Architectural Review → Human).  |
| Reusar "PR" para unidade de implementação (drift de vocabulário).             | Glossário canônico no topo; `PR/#N` = GitHub, `Checkpoint N` = unidade, `Gate` = ritual. A 0023 já tinha nomeado (review R6). |
| Remover taxonomia abrindo janela de regressão.                                | Checkpoint 6 (guard `banned-concept-check`) **antes/junto** da remoção (Checkpoint 7); ban ativado no mesmo commit.           |
| Proveniência virar compliance/bloqueio/lifecycle.                             | Projeção, não governança; espinha derivada; `role` livre; nunca bloqueia (DEC-0023-B06 lookup-not-coordination).              |
| Migração `.specify` quebra o que o consumidor recebe.                         | Drift-guard (Checkpoint 11A) estanca antes do cutover; `test:smoke`/clean-clone gateia 11B/C.                                 |
| Plano voltar a depender de estado local efêmero.                              | Sequência embutida neste `plan.md` (SSOT no repo); `~/.claude/plans/` aposentado como dependência.                            |

---

## 📐 Decisões revisitadas

- **2026-05-31 — framing research-first → absorção operacional (Checkpoint 2).** O plano dizia "research-first; implementação vira 0025". Revertido: implementação entregue **dentro da 0024**, agora como absorção das decisões cravadas. Stage 1 encerrado no gate; placeholder Stage 2 substituído pela sequência de checkpoints acima.
- **2026-05-31 — dependência de plano local → SSOT no repo (Checkpoint 2).** A sequência executável vivia em `~/.claude/plans/` (efêmero). Dobrada neste `plan.md`.
- **2026-05-31 — vocabulário "PR-N" → "Checkpoint N" + topologia sequential (Checkpoint 2.1).** "PR-N" conflitava com Pull Request real do GitHub (a 0023 já diagnosticara: `review.md` R6). Cravado o glossário (PR/#N · Checkpoint · Gate) e a topologia: **#32 = PR de governança finito (Checkpoint 1/2/2.1), encerra; Checkpoint 3+ = PRs reais independentes off `main` (sequential); Integration PR terminal no encerramento.** Alinha a 0024 à separação implementação/revisão/integração da 0023 (`[DEC-0023-M01]`, ADR 0020/0024).

---

## 📎 Anexo — Conteúdo candidato pré-research

_(Não-aplicável — esta spec nasceu pós-Spec 0023 sem rascunho herdado a reconciliar.)_
