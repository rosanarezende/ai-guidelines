<!-- ai-guidelines-template: plan-boilerplate v=1 -->

# Plan — Spec 0024 Context Architecture

> Spec: [`./spec.md`](./spec.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Tasks: [`./tasks.md`](./tasks.md)
> Status: Draft

> **Vive durante a execução.** Diferente da `spec.md` (imutável após In Review),
> este arquivo é atualizado conforme o entendimento técnico evolui.

> ## 🔁 Nota de fase — ABSORÇÃO OPERACIONAL (2026-05-31, PR-2)
>
> **Stage 1 (research → decision-brief → gate) encerrou.** As decisões estão `Resolved` (`[DEC-0024-G00]`/`G02`/`G06`); o gate está **fechado**; `state.yml` = `implementation`/`closed`. A 0024 está em **absorção operacional**: fazer o sistema refletir decisões já tomadas, removendo divergências decisão↔código **uma a uma**.
>
> Este PR-2 **dobra a sequência de PRs de absorção para dentro deste arquivo** (§ "Sequência de PRs"), aposentando a dependência do plano local efêmero (`~/.claude/plans/`, que não sobrevive a troca de máquina/agente). **A partir daqui, o plano executável canônico da 0024 é este `plan.md`.** O backlog de divergências é o **relatório de auditoria do Codex** (referência decisão↔código).
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

## 🧱 Sequência de PRs — CONGELADA (plano executável canônico)

> **SSOT do plano de absorção.** Cada PR: **atômico, mergeável, reversível**, com checkpoint `Claude implementa → Codex audita (técnica) → ChatGPT revisa (arquitetural) → owner decide`. **1 PR por vez**, parar no checkpoint quando o commit estiver pronto. Backlog = relatório de auditoria do Codex (códigos `A#/B#/C#/D#/P#` abaixo referenciam esse relatório).

| PR         | Objetivo                                                                                                                                                                                                                                                                                                                                                                                               | Deps        | Status                                       |
| :--------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------- | :------------------------------------------- |
| **PR-1**   | `active-specs.yml` lista a 0024 (Codex A3) — publica a spec no índice público via `workflow publish-state`                                                                                                                                                                                                                                                                                             | —           | ✅ feito + gated (`87865ca`)                 |
| **PR-2**   | reframe `tasks/plan/NEXT/spec` → absorção (Codex A2/P1/P2); `spec.md` via nota datada sem apagar histórico; **dobrar esta sequência no `plan.md`**                                                                                                                                                                                                                                                     | —           | 🔄 **EM EXECUÇÃO**                           |
| **PR-3**   | **GG-0003 Consistency Projection Check** — estritamente mecânico: `state.yml` é fonte de verdade + lista FIXA de marcadores literais contraditórios (`"Stage 1 ativo"`, `"gate aberto"`, brief `Pendente`…). **Sem parsing semântico.**                                                                                                                                                                | PR-2        | pendente                                     |
| **PR-4A**  | **Workflow Provenance · storage** — `.governance/runtime/provenance.yml` (append-only, runtime-scoped). Campos: `spec`(obrig.)/`actor`/`role`/`at`/`ref`, `model?` opcional. **`role` = string LIVRE** (novos papéis sem schema). **Espinha** `implementation`+`human_gate` = sempre DERIVADA (git/active-specs), não persistida, nunca bloqueia. **Opcionais** persistidos (audit/review/security/…). | PR-1/2      | pendente _(protótipo em stash — referência)_ |
| **PR-4B**  | **Workflow Provenance · projeção** no `workflow continue`: impl (derivada) + `Auditorias/revisões registradas:` (lista de tamanho variável) + gate (derivado) + `Revisão independente: PENDENTE/OK`. Mostra **fatos/pendências**, NUNCA prescrição (DEC-0023-B06 lookup-not-coordination). **Provenance = projeção, NÃO compliance/bloqueio/lifecycle.**                                               | PR-4A       | pendente                                     |
| **PR-5**   | **AGENTS sync** — `agents:build` (recompila bloco `<AI_GUIDELINES>` de `rules.json`) + `agents:check` (gate no `validate`). Destrava PR-7.                                                                                                                                                                                                                                                             | —           | pendente                                     |
| **PR-6**   | **GG-0002 mecanismo** — `banned-concept-check` + registro `banned-by-dec.yml` (sem termo live ainda) + fixture. **Antes** da remoção (instala o guard sem janela de regressão).                                                                                                                                                                                                                        | —           | pendente                                     |
| **PR-7**   | **CRÍTICO (Codex A1/P0)** — remover taxonomia `evidence-driven/deterministic/mixed` de `GR-0101`→`AGENTS.md`, `governance-foundation §"Tipos de spec"→"Propriedades de bloco"`, `spec-boilerplate` ×2; **registrar o ban no mesmo commit** (sem janela de regressão).                                                                                                                                  | PR-5 + PR-6 | pendente                                     |
| **PR-8**   | corrigir path morto na msg do `gate-decidability-check` (→ `governance-foundation § Guardrails`) (Codex B1)                                                                                                                                                                                                                                                                                            | — (flex)    | pendente                                     |
| **PR-9**   | desacoplar existência do `decision-brief` de `evidence-driven/mixed` (Codex B3)                                                                                                                                                                                                                                                                                                                        | PR-7        | pendente                                     |
| **PR-10**  | tasks boilerplate **único**; aposentar 3 variantes; renomear recipe/partials `tasks-evidence-driven`→genérico (Codex C2/C3)                                                                                                                                                                                                                                                                            | PR-7        | pendente                                     |
| **PR-11A** | drift-guard do legado `.specify/templates` (estanca a hemorragia) (Codex C1)                                                                                                                                                                                                                                                                                                                           | PR-10       | pendente                                     |
| **PR-11B** | trocar fonte ativa → root canônico (⚠️ **micro-decisão da owner:** `.core/templates` vs `.ai-guidelines/templates`)                                                                                                                                                                                                                                                                                    | PR-11A      | pendente                                     |
| **PR-11C** | remover legado `.specify/templates` após 11B estável                                                                                                                                                                                                                                                                                                                                                   | PR-11B      | pendente                                     |
| **PR-12**  | limpar docs arquiteturais de `workflowType` (ARCHITECTURE.md, ADR 0014 nota histórica) (Codex B2/D1)                                                                                                                                                                                                                                                                                                   | —           | pendente                                     |

**Ordem de valor:** PR-1 ✅ → **PR-2** → (PR-3 consistência + PR-4A/B proveniência: barreiras novas **antes** da migração) → PR-5 + PR-6 → **PR-7 (o crítico, protegido)** → PR-9/10 → PR-11A/B/C → PR-8/PR-12 (flex).

> ⚠️ **Protótipo do PR-4A em `git stash`** (sessão 2026-05-31): interrompido por **ordem de execução** (não rejeição). Material de **referência** apenas. Quando a sequência chegar ao PR-4A, inspecionar e decidir o que reaproveitar. **Não** misturar ao PR-2 nem antecipar Provenance.

---

## 🏗️ Princípios de absorção (lente para cada PR)

> O "como" de cada PR deriva das decisões cravadas. Estes princípios — extraídos do uso real da stack na 0024 — governam as escolhas de design ao longo da sequência:

- **Toda aresta SSOT→projeção precisa de um gate de sync, ou diverge em silêncio.** Drift silencioso SSOT→projeção é o padrão recorrente nº 1 (apareceu 4×: `state.yml`↔`active-specs`, `rules.json`↔`AGENTS.md`, `state.yml`↔`tasks/plan/NEXT/brief`, código↔`ARCHITECTURE.md`). PR-3 (consistência) e PR-5 (AGENTS sync) são instâncias.
- **Enforcement previne a classe, não só o sintoma.** O guard entra **antes/junto** da correção, sem janela de regressão (PR-6 antes de PR-7).
- **Validação mecânica vs semântica por guardrail.** Todo guardrail declara seu subconjunto 🤖 (check falha) e 👁 (julgamento humano), como GG-0001. Checks de absorção são **estritamente mecânicos** (lista fixa de marcadores literais; sem parsing semântico — PR-3).
- **Projeção, não governança.** Proveniência (PR-4A/B) é **projeção** (fatos/pendências num olhar), nunca compliance/bloqueio/lifecycle. A espinha (impl+gate) é **derivada**, não persistida.
- **Anti-taxonomia em todos os níveis.** Ao remover uma taxonomia fechada, não recriá-la um nível acima; preferir **propriedade livre + papéis reconhecidos (hints de projeção)** a enum fechado (`role` livre na proveniência; `exige-julgamento` por bloco em G02).
- **Clean-clone/smoke gateia distribuição.** `test:smoke` deve gatear PRs que afetam o que o consumidor recebe (notadamente PR-11A/B/C).

---

## ✅ Critérios de Aceite Detalhados (DoD operacional)

### Por PR de absorção

- [ ] Atômico, mergeável, reversível — uma divergência decisão↔código por PR (ou um bloco coeso).
- [ ] Mudança estrutural (runtime/regra/projeção/doutrina/migração) ⟹ passa pelo checkpoint Codex→ChatGPT→owner **antes** de avançar. Correção local pequena não espera.
- [ ] `yarn format ; yarn validate` verde (build:rules + suíte + living-docs + state-yml + gate-decidability).
- [ ] PR que instala/altera guardrail carrega **check + fixture** no mesmo commit; PR que afeta distribuição roda `test:smoke`.
- [ ] Sem reabrir decisão `Resolved` (G00/G02/G06) nem re-modelar arquitetura congelada.

### Globais (toda a spec)

- [ ] Pipeline `yarn format ; yarn validate` verde.
- [ ] Não-objetivos cravados em `spec.md` continuam respeitados (auditoria final).
- [ ] **Fronteira modelo ≠ migração:** absorção entrega enforcement + artefato de referência; migração ampla do ecossistema (Grupo B) permanece nas candidatas re-escopadas.
- [ ] PR Draft revisado e aprovado por humano antes de Ready.

---

## 🧪 Estratégia de Testes

> A fase de absorção **produz código** (checks, guardrails, projeções) — diferente do framing research-first anterior. Cada PR estrutural carrega seus próprios testes:

- **Checks/guardrails** (PR-3 GG-0003, PR-6 GG-0002, PR-8): fixture determinística (caso que falha + caso que passa); integração no chain `yarn validate`.
- **Proveniência** (PR-4A storage, PR-4B projeção): testes de serialização append-only + derivação da espinha (impl/gate) sem persistência; projeção mostra fatos/pendências, nunca prescrição.
- **AGENTS sync** (PR-5): `agents:check` falha quando `<AI_GUIDELINES>` diverge de `rules.json`.
- **Migração `.specify`** (PR-11A/B/C): `test:smoke`/clean-clone valida o que o consumidor recebe.
- **Regressão da remoção** (PR-7): o ban (`banned-concept-check`, PR-6) falha se a taxonomia reaparecer.

---

## 🛠️ Arquivos modificados (esperado)

### Stage 1 (encerrado — registro)

- `spec.md` (instanciação + nota de fase) · `decision-brief.md` (DECs → `Resolved`, reestruturado por estado) · `research/*.md` + `research/findings.md` · `state.yml` (→ `implementation`/`closed`) · `roadmap/backlog.md` · `.gitignore` (`temp/`).

### Absorção (em curso — por PR; cf. tabela § "Sequência de PRs")

- **PR-2 (este):** `spec.md`, `plan.md`, `tasks.md`, `NEXT.md`.
- **PR-3+:** runtime/checks (`cli/governance/*`), boilerplates (`.core/templates/*`, recipes/partials), doutrina (`.core/process/governance-foundation.md`), `AGENTS.md`, `.governance/runtime/provenance.yml`, docs arquiteturais — escopados por PR.

---

## ⚠️ Riscos técnicos (concretos)

| Risco                                                                         | Mitigação                                                                                                                 |
| :---------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| Voltar a re-modelar em vez de remover divergências (risco dominante da fase). | Critério cravado: _"já foi validado empiricamente na 0024?" → absorver/enforçar/executar._ Não re-pesquisar o `Resolved`. |
| Encadear vários PRs estruturais sem checkpoint.                               | 1 PR atômico por vez; parar no checkpoint quando o commit estiver pronto (Codex→ChatGPT→owner).                           |
| Remover taxonomia abrindo janela de regressão.                                | PR-6 (guard `banned-concept-check`) **antes/junto** da remoção (PR-7); ban ativado no mesmo commit.                       |
| Proveniência virar compliance/bloqueio/lifecycle.                             | Projeção, não governança; espinha derivada; `role` livre; nunca bloqueia (DEC-0023-B06 lookup-not-coordination).          |
| Migração `.specify` quebra o que o consumidor recebe.                         | Drift-guard (PR-11A) estanca antes do cutover; `test:smoke`/clean-clone gateia PR-11B/C.                                  |
| Plano voltar a depender de estado local efêmero.                              | Sequência embutida neste `plan.md` (SSOT no repo); `~/.claude/plans/` aposentado como dependência.                        |

---

## 📐 Decisões revisitadas

- **2026-05-31 — framing research-first → absorção operacional.** O plano dizia "research-first; implementação vira 0025". Revertido: implementação entregue **dentro da 0024**, agora como absorção das decisões cravadas. Stage 1 encerrado no gate; placeholder Stage 2 substituído pela sequência de PRs acima.
- **2026-05-31 — dependência de plano local → SSOT no repo.** A sequência executável vivia em `~/.claude/plans/` (efêmero). Dobrada neste `plan.md` (PR-2).

---

## 📎 Anexo — Conteúdo candidato pré-research

_(Não-aplicável — esta spec nasceu pós-Spec 0023 sem rascunho herdado a reconciliar.)_
