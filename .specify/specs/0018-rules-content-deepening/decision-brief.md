# Decision Brief — Spec 0018 Rules Content Deepening

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Tasks: [`./tasks.md`](./tasks.md)
> Status: **Open** <!-- Open | Partial | Resolved -->
> Última atualização: 2026-04-30

> **Apresenta opções com tradeoffs antes do gate humano e registra decisões
> validadas após o gate.** Este artefato é o gate canônico entre Stage 1
> (research) e Stage 2 (design + implementação) para specs de conteúdo.
> Não substitui ADRs (decisões arquiteturais cross-spec); é spec-level.
>
> **Convenção:** cada ponto tem ID `[DEC-NNNN-XYZ]` (NNNN = número da spec;
> XYZ = sub-bloco + sequência). Pontos novos podem ser adicionados durante
> Stage 1 quando research expor questões não previstas; opções de pontos
> podem evoluir até a marcação `Resolved`. Após `Resolved`, mudanças vão
> para `plan.md` "Decisões revisitadas".
>
> **Esta brief é a primeira instância (hand-rolled).** O Bloco A desta spec
> formaliza `decision-brief-boilerplate.md` informado pelo dogfood deste
> arquivo — ver `[DEC-0018-A05]`.

---

## Bloco A — Política framework + boilerplates

### [DEC-0018-A01] Updates por boilerplate

**Pergunta:** que mudanças aplicar em cada um dos 7 boilerplates existentes em `.specify/templates/`?

**Contexto (research):**

- A preencher após `research/2026-04-30-boilerplates-audit.md`.

**Opções:**

| Boilerplate                     | Manter                      | Revisar | Adicionar | Remover |
| :------------------------------ | :-------------------------- | :------ | :-------- | :------ |
| `spec-boilerplate.md`           | _(populate after research)_ |         |           |         |
| `plan-boilerplate.md`           | _(populate)_                |         |           |         |
| `tasks-boilerplate.md`          | _(populate)_                |         |           |         |
| `next-boilerplate.md`           | _(populate)_                |         |           |         |
| `research-index-boilerplate.md` | _(populate)_                |         |           |         |
| `roadmap-boilerplate.md`        | _(populate)_                |         |           |         |
| `project-config-boilerplate.md` | _(populate)_                |         |           |         |

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha consolidada: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-A02] Estrutura do campo "Tipo de spec"

**Pergunta:** como classificar specs em `spec-boilerplate.md`? Quais valores válidos, default, e como o checklist em `tasks-boilerplate.md` deve diferenciar?

**Contexto (research):**

- A preencher após auditoria + benchmark de specs executadas.

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-A03] Localização e formato da política content × infra em `spec-foundation.md`

**Pergunta:** onde inserir a seção sobre tipos de spec e workflow em dois passes? Como descrever sem inflar o documento?

**Contexto (research):**

- A preencher após auditoria do `spec-foundation.md` × boilerplates.

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-A04] Texto da linha em `global-rules.md`

**Pergunta:** que texto curto referencia a política sem duplicar `spec-foundation.md`? Em qual subseção entra (Workflow com IA, ou nova)?

**Contexto (research):**

- A preencher após `[DEC-0018-A03]` (a redação depende de onde a política completa vai morar).

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-A05] Formato do `decision-brief-boilerplate.md`

**Pergunta:** que estrutura, campos e transições de status fazem o boilerplate funcionar para specs futuras? Que melhorias o dogfood desta brief sugere?

**Contexto (research):**

- A preencher a partir do uso real desta brief durante Fases 1–3.

**Opções:** _(populate ao longo do dogfood)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-A06] Localização física da seção "Tipos de spec" + workflow em dois passes

**Pergunta:** onde fisicamente vive a seção que descreve a política conteúdo × infraestrutura e o workflow em dois passes? Decisão tática de curto prazo. **A decisão arquitetural ampla** (catálogo de informação essencial do framework, classificação por gêneros documentais, eventual reorganização física entre `docs/`, `adrs/`, `.specify/`, raiz) **fica para a candidata `governance-information-architecture` no backlog**, com pré-requisito "0018 mergeada".

**Contexto (research):**

- Discussão pass 3 da revisão da spec 0018 (2026-04-30): owner identificou que `docs/process/spec-foundation.md` é constituição operacional viva, misturada em `docs/` com documentos descritivos; ausência de catálogo de informação essencial; gêneros documentais sem classificação explícita.
- A candidata `governance-information-architecture` foi adicionada a `roadmap/backlog.md` (topo de "Now") justamente para tratar este problema arquitetural amplo.

**Opções:**

| Opção | Onde                                                                                                        | Pró                                                                               | Contra                                                                                |
| :---- | :---------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| A     | Acrescentar nova seção ao próprio `docs/process/spec-foundation.md` (status quo)                            | Mínimo churn; entrega 0018 sem expandir escopo; não antecipa decisão arquitetural | Acumula dívida; `spec-foundation.md` cresce; reforça mistura de gêneros               |
| B     | Novo arquivo `docs/process/spec-types.md` cross-ref'd pelo `spec-foundation.md`                             | Modular; menor inflação por arquivo                                               | Cria dependência cruzada antes da decisão maior; provável move depois                 |
| C     | ADR atômica nova (ex: `adrs/0009-spec-types-content-vs-infra.md`) + ponteiro mínimo em `spec-foundation.md` | Imobiliza a decisão; alinha com o gênero ADR                                      | Política operacional viva em ADR (gênero não-canônico); split entre runbook e decisão |
| D     | Aguardar `governance-information-architecture` para definir antes de aplicar a política                     | Coerente arquiteturalmente                                                        | Bloqueia 0018 indefinidamente — incompatível com priorização                          |

**Recomendação inicial (a confirmar pós-gate):** **A** — entregar a 0018 no `spec-foundation.md` atual e tratar o reposicionamento como migração executada pela `governance-information-architecture` quando ela rodar. Opções B/C antecipam decisão arquitetural sem evidência; D viola priorização.

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

## Bloco B — Content overhaul (rules)

### [DEC-0018-B01] Taxonomia das categorias de regras

**Pergunta:** quantas categorias separar e quais? Hipótese inicial: (a) meta-regras do agente, (b) princípios universais de engenharia, (c) heurísticas de domínio — mas pode emergir outra estrutura da research.

**Contexto (research):**

- A preencher após `research/2026-04-30-benchmark-rules-content.md` e `spec-driven-tools-rules.md`.

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-B02] Colocação por categoria

**Pergunta:** cada categoria definida em `[DEC-0018-B01]` vai para qual arquivo (`global-rules.md` × `claude.md`/`codex.md`/`gemini.md` × `opt-in/*.md` × novos arquivos)?

**Contexto (research):**

- Depende de `[DEC-0018-B01]`.
- Informado por `benchmark-rules-content.md` e medição de tokens em `tokens-baseline-budget.md`.

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-B03] Orçamento de tokens

**Pergunta:** qual teto de tokens por arquivo e agregado para o `<AI_GUIDELINES>` compilado? Qual baseline e qual margem de crescimento aceitável?

**Contexto (research):**

- A preencher após `research/2026-04-30-tokens-baseline-budget.md`.

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-B04] Formato do catálogo de regras

**Pergunta:** que campos cada regra carrega (nome, trigger, anti-padrão, exemplo positivo, exemplo negativo, fonte)? Que convenção de ID (`[RULE-*]` paralelo a `[BR-*]` da CLI? Outra?)? Hierarquia entre arquivos (uma regra em um único arquivo? Adapter ≠ universal?).

**Contexto (research):**

- A preencher após `benchmark-rules-content.md` e `spec-driven-tools-rules.md`.

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-B05] Metodologia do eval mínimo

**Pergunta:** quantos prompts canônicos? Quais provedores (≥2)? Que métrica (kill rate? outra?)? Que threshold de corte (regras com kill rate baixo são repostadas ou cortadas)? Como tratar não-determinismo do LLM?

**Contexto (research):**

- A preencher após `empirical-bugs-ai-code.md` e `external-bug-taxonomies.md`.

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-B06] Fronteira com Spec 0011 (regra-hierarquia)

**Pergunta:** se a categoria (c) heurísticas de domínio (ou equivalente decidido em B01) crescer, em que ponto a hierarquia por subdiretório (Spec 0011) se torna necessária? Que débito declarar em `NEXT.md`?

**Contexto (research):**

- Backlog: `regra-hierarquia` em "Now"; pré-requisito declarado é a 0018 concluída.
- Informado por `tokens-baseline-budget.md` e `[DEC-0018-B02]`.

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-B07] Fronteira com Spec 0009 (harness-engineering)

**Pergunta:** o eval mínimo desta spec é seed para 0009. Que parte fica aqui (eval manual, registrado em research) e que parte fica para 0009 (harness automatizado, agente validador, integração com `/ultra-review`)?

**Contexto (research):**

- Backlog: `harness-engineering` em "Next"; cross-ref Spec 0008-E.
- Informado por `[DEC-0018-B05]`.

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-B08] Política de reconciliação do conteúdo b9efb83

**Pergunta:** para cada regra do conteúdo de `global-rules.md` e `quality-gates.md` mergeado em b9efb83, que critério aplicar (manter | revisar | reverter)? Critério é "passou no eval"? "Tem fonte"? Combinação?

**Contexto (research):**

- Anexo do `plan.md` resume o conteúdo de b9efb83.
- Informado por todas as 5 sínteses de B.0.

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

## Resumo de status

| ID               | Bloco | Status   |
| :--------------- | :---- | :------- |
| `[DEC-0018-A01]` | A     | Pendente |
| `[DEC-0018-A02]` | A     | Pendente |
| `[DEC-0018-A03]` | A     | Pendente |
| `[DEC-0018-A04]` | A     | Pendente |
| `[DEC-0018-A05]` | A     | Pendente |
| `[DEC-0018-A06]` | A     | Pendente |
| `[DEC-0018-B01]` | B     | Pendente |
| `[DEC-0018-B02]` | B     | Pendente |
| `[DEC-0018-B03]` | B     | Pendente |
| `[DEC-0018-B04]` | B     | Pendente |
| `[DEC-0018-B05]` | B     | Pendente |
| `[DEC-0018-B06]` | B     | Pendente |
| `[DEC-0018-B07]` | B     | Pendente |
| `[DEC-0018-B08]` | B     | Pendente |

**Status agregado:** `Open` (transita para `Partial` quando ≥1 ponto for `Resolved`; transita para `Resolved` quando todos forem `Resolved`).
