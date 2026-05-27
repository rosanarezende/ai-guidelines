# ADR 0020 — Governance precede e protege execução

**Status**: Aceita
**Origem histórica**: Spec 0023 sub-bloco DEC-0023-D01..D05 (2026-05-19, sessão de design Bloco D).
**Relaciona-se com**: [`ADR 0018 — Governance-First, AI-as-Channel`](./0018-governance-first-ai-as-channel.md) (operacionaliza o princípio governance-first no lifecycle de PRs); [`ADR 0019 — .governance/specs/ como root primária no mantenedor`](./0019-governance-specs-root-in-maintainer.md) (estabelece a topologia que este ADR governa).

---

## Contexto

A Spec 0021 cravou governance-first como princípio. A Spec 0023 PR1 entregou o runtime operacional. Mas o **lifecycle metodológico** sobre o qual o runtime opera permanecia implícito: PRs colapsavam discovery, decision, planning e execution num único movimento; tasks emergiam junto com código; rollout era decidido dentro da implementação.

O efeito observado em duas iterações consecutivas (PR1 e PR2 da própria 0023):

- **Decisões estruturais surgindo implícitas durante implementação.** Threshold "≥ 4 PRs" para criar `plan.md`, escolha entre `state.yml` inline vs serializado, granularidade de tasks — todas emergiram dentro de commits de código sem registro próprio.
- **Approval de direção desbloqueando execução automaticamente.** Aprovar decision-brief implicitamente autorizava qualquer decomposição operacional que viesse depois.
- **Reviewers externos forçados a participar de framing.** Quando thinking e execution coexistem num PR, o review precisa cobrir ambos simultaneamente — o que afasta reviewers que só queriam validar a execução.

Esses sintomas têm a mesma causa raiz: **governance acompanhando execução** em vez de precedê-la. O framework declara governance-first mas operacionalmente trata governance como overhead que cabe junto com o código.

## Princípio

**Governança não acompanha execução. Governança precede execução e a protege contra drift.**

Operacionalmente:

1. **Lifecycle de 4 fases distintas** com gates explícitos entre cada:
   - **Discovery** (problema, hipóteses) → Gate 1 humano
   - **Decision** (direção, tradeoffs) → Gate 2 humano
   - **Planning** (decomposição, sequenciamento) → Gate 3 humano
   - **Execution** (implementação)

2. **`tasks.md` é boundary canônico de execução**, não checklist operacional. Sua presença + aprovação humana em Gate 3 é o sinal de que rollout foi aceito e implementação está autorizada. Sem `tasks.md` aprovado, qualquer commit de código é **acréscimo metodológico não-autorizado** — independentemente de quão clara pareça a direção.

3. **PRs refletem o boundary**: thinking PR (`feat/spec-NNNN-{slug}`) contém apenas artifacts de governance (spec/decision-brief/plan/tasks/state.yml/research); execution PR (`feat/spec-NNNN-{slug}-execution`) contém apenas código + docs derivados. **PRs são stacked** — execution PR tem thinking PR como base branch.

4. **Merge final é ponta a ponta**. Thinking PR isolado não representa software pronto; representa contrato pendente de execução. A unidade de release é a stack inteira, mergeada como unidade. **Nota (cf. `[DEC-0023-O03]`):** "ponta a ponta" admite **dois modos de aterrissagem** — `unit` (default; 1 SHA canônico, veículo = PR terminal de implementação, demais via `landed-via reconciliation`) e `sequential` (override; cada PR aterrissa bottom-up). A "sequência" aqui descreve **ordem de dependência**, não obriga N merges. Semântica canônica em [`ADR 0024 § Modos de aterrissagem da stack`](./0024-draft-ready-mergeable-distinct-states.md).

5. **CI protege a integridade estrutural** do contrato (mínimo): valida que execution PR referencia explicitamente o thinking PR, que o thinking PR existe e está aberto/aprovado, e que o thinking PR contém `tasks.md` no diff. Drift semântico (mapeamento arquivos↔tasks, análise de cobertura, inferência de intent) é **deliberadamente diferido** — risco real de virar workflow engine.

6. **Fast-track é exceção declarada, nunca implícita.** Para `patch`/`fix`/`incident` pequeno, o autor pode declarar fast-track via label PR + commit message + `state.yml`; reviewer humano absorve responsabilidade no lugar do contrato. Para `spec`/`proposal`/`spike` relevantes, o lifecycle completo é obrigatório.

## Opções avaliadas

| #   | Opção                                                                                  | Trade-off                                                                                                                                                    |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **3 fases** (discovery → decision → execution); decisão aprovada desbloqueia execução. | Mais simples; mas colapsa planning em decision; permite execução sem decomposição aprovada (status quo da 0023 pré-PR2-lifecycle).                           |
| 2   | **4 fases com gates explícitos**; `tasks.md` como boundary canônico.                   | Separa categorias distintas (direção ≠ decomposição); boundary observável e falsificável; um gate adicional. **Escolhido.**                                  |
| 3   | **PR único por iniciativa** com gates como comentários no PR.                          | Operacionalmente leve; mas mistura thinking e execution no mesmo review; reviewers externos forçados a acompanhar framing.                                   |
| 4   | **Stacked PRs** (thinking PR + execution PR acoplados); merge ponta a ponta.           | Conceitualmente limpo; reviewers externos veem contrato + execução juntos; custo: stacking pain manual (rebase em cadeia). **Escolhido em conjunto com #2.** |
| 5   | **CI com drift detection completo** (mapping arquivos↔tasks, inferência de cobertura). | Máxima proteção; mas projeto significativo de tooling; risco de virar workflow engine. **Deliberadamente diferido** como evolução futura.                    |
| 6   | **Aplicação universal** (todo trabalho atravessa as 4 fases).                          | Zero ambiguidade; mas recria AP3 (spec como container universal); overhead desproporcional em iniciativas pequenas.                                          |
| 7   | **Aplicação seletiva com fast-track declarado** para patches/fixes/incidents pequenos. | Preserva intent; reduz overhead; exceção rastreável. **Escolhido.**                                                                                          |

## Consequências

- **Imediatas:**
  - PR2-lifecycle introduz o modelo via bootstrap declarado (não pode aplicar o modelo à própria introdução).
  - `tasks.md` torna-se artifact canônico em `.governance/specs/{slug}/tasks.md`.
  - Convenção de branch para execution PR: `feat/spec-NNNN-{slug}-execution`.
  - CI script `governance-pr-check` vive em `src/cli/` (não em `cli/scripts/`) — é comportamento oficial do runtime governance-first.
  - PR de execution declara dependência via `Depends on #N (governance)` no body.

- **De médio prazo:**
  - Boilerplates de `.specify/templates/` ganham nota explicando o lifecycle (sem reescrita imediata).
  - Drift detection profundo (parte C) entra como spec própria quando ≥ 2 ciclos de stacked PRs revelarem qual divergência é frequente.
  - Fast-track convention refinada após observação empírica de ≥ 3 fast-tracks reais.

- **Não-consequências (importantes):**
  - **Não** implica workflow engine. CI mínimo é linkagem estrutural; expansão de escopo requer decisão própria.
  - **Não** quebra fluxo de PR para repos consumidores do framework — governance se aplica internamente; consumers escolhem adotar.
  - **Não** elimina julgamento humano no review. CI valida estrutura; semântica continua humana.
  - **Não** força stacked PRs para patches/fixes/incidents pequenos — fast-track existe.

## Critério de revisão

Esta ADR deve ser revisada se:

- **Stacked PR rebase pain inviabiliza o modelo** em ≥ 2 ciclos consecutivos. Reabrir D02 com opção (a) tooling externo (Graphite/spr) ou (b) cair para padrão A (RFC-em-git).
- **CI mínimo falha em detectar** divergência relevante em ≥ 2 casos. Reabrir D03 considerando expansão controlada do check.
- **Fast-track vira válvula de escape** (≥ 3 fast-tracks revelando padrão de abuso). Reabrir D05 com critério objetivo de "pequeno".
- **Boundary `tasks.md` é contornado sistematicamente** (PRs com código sem tasks.md aprovado passando o review). Reabrir D01 considerando enforcement mais agressivo.

Sem nenhum desses gatilhos, esta ADR permanece estável.
