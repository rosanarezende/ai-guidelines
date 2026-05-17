# Auditoria pré-3.D — Schema da Recipe e Topologia da Composição Atômica

> **Spec:** [`./spec.md`](./spec.md)
> **Plan:** [`./plan.md`](./plan.md)
> **Tasks:** [`./tasks.md`](./tasks.md) (sub-bloco `[3.D]`, item 3.D.1 PENDENTE — bloqueio para 3.D.2 .. 3.D.5)
> **Data:** 2026-05-11
> **Owner da auditoria:** @rosanarezende (revisão humana) + Claude Opus 4.7 (execução)
> **Status:** Concluída — proposta de schema apresentada para decisão; nenhum código tocado.

---

## 🎯 Motivação

O sub-bloco `[3.D]` do PR3 entrega o `TemplateEngine` — composição atômica de artefatos a partir de `Recipe` + `Partial`. A decisão arquitetural está cravada (`[DEC-0021-D01]` = Opção C — composição atômica), os ADRs 0001..0005 já definem princípios perenes, e o research [`2026-05-11-living-docs-and-template-composition-practices.md`](../researchs/governance/2026-05-11-living-docs-and-template-composition-practices.md) §1.7 + §2.5 valida o padrão "recipes-and-partials".

Mas **uma decisão de design fina ainda não foi tomada**: a forma exata do schema da `Recipe`. Esse schema é o **contrato simultâneo** de:

1. **Composição** (3.D) — como o engine resolve slots, carrega partials, monta o output.
2. **Validação** (3.E, sub-bloco seguinte) — quais invariantes o artefato gerado precisa cumprir.

O ADR 0014 §3 cravou que **Recipe é o contrato de validação — não objeto auxiliar**. Não há `RecipeSchema` separado de `ValidationSchema`. A mesma recipe que **monta** declara o que é **aceito**. Errar a forma do schema aqui contamina 3.D, 3.E e 3.F (retirada do mirror legado depende de equivalência).

Esta auditoria responde 4 perguntas:

1. **Forma do schema YAML** — slots inline vs invariants externo; granularidade dos campos por slot; como expressar cardinalidade, partials válidos, headings obrigatórios e proibições.
2. **Topologia física** — onde recipes moram (raiz vs aninhado por kind), onde partials moram, naming convention.
3. **Granularidade de partials** — quão atômicos (sub-bloco completo vs item-by-item) sem cair em "partial soup" (risco §5 do research).
4. **Variantes do mesmo artifactKind** — `tasks-evidence-driven` vs `tasks-mixed` vs `tasks-deterministic`: 3 recipes irmãs, 1 recipe parametrizada, ou recipe pai + extensões?

O objetivo é evitar:

- **Schema rígido demais** — toda variação obriga criar recipe inteira; recipes inflam.
- **Schema condicional** — reintroduz a complexidade que `[DEC-0021-D01]` rejeitou explicitamente na Opção B (Handlebars/Mustache).
- **Boundary vazado** — YAML parser invadindo `domain/`; lógica de mocking de filesystem na infra; merge em camada errada (mesmo erro evitado em 3.C.4-prep).
- **Drift recipe ↔ validator** — o anti-padrão histórico que o ADR 0014 §3 nomeia explicitamente.

---

## 📚 Insumos canônicos (lidos e cruzados)

### Decisões cravadas

- **`[DEC-0021-D01]`** (decision-brief): composição atômica com partials em `.governance/templates/partials/`, orquestrada pela `TemplateEngine` com tipagem definida no registry.
- **Arquiteto líder (esta sessão)**: 3 cravações inquebráveis:
  1. Recipes em `.core/governance/recipes/`, partials em `.core/governance/templates/partials/`.
  2. Recipes em YAML (auditabilidade + consistência).
  3. Schema obrigatório contém bloco `invariants` (slots obrigatórios, cardinalidade, proibições) — consumido por 3.E sem duplicação.

### ADRs aplicáveis

- **ADR 0010** (taxonomia MECE de pilares) — Recipe NÃO é WorkItem; é instrumento de composição. Mas o `artifactKind` (spec/plan/tasks/decision-brief/next/...) compõe a família de artefatos que materializam o ciclo de vida dos pilares. **Implicação:** o conjunto de `artifactKind` válidos numa recipe é fechado, com critério de extensão análogo ao de pilares (ADR-de-extensão).
- **ADR 0011** (enums fechados + mensagem determinística) — `artifactKind` e `workflowType` são enums fechados. Mensagens de erro nomeiam o conjunto válido. Nada de "default silencioso". **Implicação direta no schema:** `artifactKind`, `workflowType`, `language`, `canonicalOrder` são literal unions no TS.
- **ADR 0012** (bypass auditável) — não se aplica diretamente ao schema da Recipe, mas se aplica ao `MarkdownStructuralValidation` (3.E): se um artefato gerado viola uma invariante temporariamente, a diretiva canônica `// structural-check:allow-drift until=... ref=... reason=...` é o caminho legítimo. Não inventar mecanismo paralelo.
- **ADR 0013** (AST como SSOT) — análoga: a recipe é a SSOT estática da composição. Mesma recipe + mesmos partials → mesmo output byte-a-byte (determinismo, §1.4 do research). Sem "geração condicional baseada em estado de run". **Implicação direta:** sem condicionais em runtime (`when: env.X`), sem injeção de variáveis externas via env var.
- **ADR 0014** (validação semântica vs estética) — **a ADR-âncora deste sub-bloco**. Princípio: Recipe é o contrato de validação. Schema declara slots + invariants no mesmo arquivo; 3.E lê o bloco `invariants` desta recipe. Sem schema externo.

### Research de fundo

- **`2026-05-11-living-docs-and-template-composition-practices.md`**:
  - §1.7 — "Composição atômica > redundância copiada" — partial = unidade reusável e completa; recipe = ordem canônica de slots; sem condicionais aninhadas dentro de partial.
  - §2.5 — Padrão "recipes-and-partials" validado por Pandoc Partials, Assemble, Marc, Markdown Styles. Não usar Marc (peso), mas registrar como sub-débito **filtros opcionais por slot** se a dor aparecer.
  - §5 risco #5 — **Partial soup**: limitar partials inicialmente a tipos de spec já existentes; `PartialsContract.test.ts` (3.D.5) checa que cada partial declarada está em uso por ≥1 recipe.
  - §5 risco #6 — **Mirror removido cedo demais (3.F)**: equivalência mínima validada via snapshot regression antes de retirar.

### Estado do mirror legado (já mapeado em fase de pesquisa anterior)

11 boilerplates em `.specify/templates/` (espelhados em `.ai-guidelines/templates/`):

| Boilerplate                            | Slots canônicos identificados                                                                                                |
| :------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| `spec-boilerplate.md`                  | header → Objetivo → Escopo → Critérios de Aceite → Pesquisa? → Decisão de Fusão? → Dependências → Post-mortem? → Referências |
| `plan-boilerplate.md`                  | header → Stage1/Stage2? → Design → DoD → Testes → Arquivos modificados → Riscos → Decisões revisitadas → Anexo?              |
| `tasks-evidence-driven-boilerplate.md` | header → Fase 0 (Setup+Research+Brief+Gate) → Fase 1 (Impl A) → Fase Extra? → Review → Encerramento                          |
| `tasks-deterministic-boilerplate.md`   | header → Fase 0 (só Setup) → Fase 1 → Fase Extra? → Review → Encerramento                                                    |
| `tasks-mixed-boilerplate.md`           | header → Fase 0 (Setup+Research+Brief+Gate, parcial) → Fase 1 (tags por sub-bloco) → Fase Extra? → Review → Encerramento     |
| `decision-brief-boilerplate.md`        | header → Bloco A → Bloco B → Bloco C → ... → Resumo de status → Gate fechado?                                                |
| `next-boilerplate.md`                  | header → Débitos por Fase → Insights                                                                                         |
| `research-index-boilerplate.md`        | header → Índice por domínio                                                                                                  |
| `project-config-boilerplate.md`        | (config — não é doc humano-primeiro)                                                                                         |
| `roadmap-boilerplate.md`               | header → Em execução → Candidatas → Histórico                                                                                |

**Observação crítica:** as 3 variantes de `tasks-*` compartilham **~70%** dos slots terminais. Stage1/Research/Brief/Gate é o discriminador principal. O ADR 0014 §3 ("Recipe é o contrato") favorece recipes irmãs com partials compartilhados — não 1 recipe parametrizada (que reintroduziria condicionais).

---

## 🛠️ Opções de design avaliadas

Quatro caminhos para o schema da Recipe. Tabela comparativa em 7 eixos; detalhe vem a seguir.

| Opção                                                 | Slots inline?                                                | Invariants                                                                        | Variantes (3× tasks)   | Honra ADR 0011 | Honra ADR 0013                     | Honra ADR 0014 §3                        | Cont. condicional? |
| :---------------------------------------------------- | :----------------------------------------------------------- | :-------------------------------------------------------------------------------- | :--------------------- | :------------- | :--------------------------------- | :--------------------------------------- | :----------------- |
| **(A)** Slots planos + invariants externo top-level   | Não (só `id` + `partials`)                                   | Bloco separado com `requiredSlots`/`forbidden` referenciando ids                  | 3 recipes irmãs        | OK             | OK                                 | **Frágil** (2 listas → drift)            | Não                |
| **(B)** Slots ricos inline + invariants global mínimo | Sim (cada slot carrega `required`, `min`, `max`, `partials`) | Bloco top-level só p/ `forbiddenHeadings` e `canonicalOrder`                      | 3 recipes irmãs        | OK             | OK                                 | **OK forte** (zero drift por construção) | Não                |
| **(C)** Schema rígido com listas                      | Não                                                          | `slots[]`, `requiredSlots[]`, `forbiddenSections[]` — sem campo opcional por slot | 3 recipes irmãs        | OK             | OK                                 | Frágil (perde min/max)                   | Não                |
| **(D)** Inline + condicionais expressas               | Sim + `when:`                                                | Inline                                                                            | 1 recipe parametrizada | OK             | **VIOLA** (when reintroduz lógica) | OK                                       | **Sim** ❌         |

### (A) Slots planos + invariants externo

**Mecânica.** Bloco `slots:` é lista de `{ id, partials[] }`. Bloco separado `invariants:` declara `requiredSlots[]`, `optionalSlots[]`, `cardinality { slotId: {min,max} }`, `forbiddenHeadings[]`, `canonicalOrder`.

```yaml
schemaVersion: v0
artifactKind: tasks
workflowType: evidence-driven
language: pt-BR

slots:
  - id: header
    partials: [tasks/header-tasks.md]
  - id: fase-0-setup
    partials: [tasks/fase-0-setup.md]
  - id: fase-0-research
    partials: [tasks/fase-0-research.md]
  # ...

invariants:
  requiredSlots:
    [
      header,
      fase-0-setup,
      fase-0-research,
      fase-0-brief,
      fase-0-gate,
      fase-1-implementacao,
      fase-review,
      fase-encerramento,
    ]
  optionalSlots: [fase-extra]
  cardinality:
    fase-1-implementacao: { min: 1, max: 1 }
    fase-extra: { min: 0, max: 1 }
  forbiddenHeadings: []
  canonicalOrder: same-as-slots-array
```

**Pró.**

- Separação visual clara entre "do que é feito" e "o que é exigido".
- Mais leve para autor humano em recipes muito grandes.

**Contra.**

- **2 fontes de verdade sobre cada slot** (lista em `slots:` + entrada em `requiredSlots`/`cardinality`). Renomear um slot exige editar 2+ lugares.
- Adicionar slot novo sem listá-lo em `requiredSlots`/`optionalSlots` é estado válido para o YAML — mas ambíguo. 3.E precisa decidir "default = optional" ou "default = required"; qualquer escolha é arbitrária.
- ADR 0014 §3 cita literalmente o anti-padrão "recipe + validator desincronizados" — esta opção **convida** a esse drift por construção, mesmo dentro do mesmo arquivo.
- Mensagem de erro fica indireta: "slot X faltando" exige consultar `requiredSlots[]` em outro bloco para entender por quê.

**Veredito.** ❌ Aceitável mas frágil. A separação cosmética não compensa o risco de drift entre as duas listas.

### (B) Slots ricos inline + invariants global mínimo (recomendada)

**Mecânica.** Cada slot carrega declaração completa do que ele é: `id`, `required` (bool), `minOccurrences` (int, default 1 se required), `maxOccurrences` (int, default 1), `partials[]` (lista de partials válidos para este slot — quando há 1 só, lista de 1). Bloco top-level `invariants:` cobre **apenas** o que é genuinamente global ao artefato (proibições, ordem canônica).

```yaml
schemaVersion: v0
artifactKind: tasks
workflowType: evidence-driven
language: pt-BR

slots:
  - id: header
    required: true
    minOccurrences: 1
    maxOccurrences: 1
    partials: [tasks/header-tasks.md]

  - id: fase-0-setup
    required: true
    minOccurrences: 1
    maxOccurrences: 1
    partials: [tasks/fase-0-setup.md]

  - id: fase-0-research
    required: true
    partials: [tasks/fase-0-research.md]

  - id: fase-0-brief
    required: true
    partials: [tasks/fase-0-brief.md]

  - id: fase-0-gate
    required: true
    partials: [tasks/fase-0-gate.md]

  - id: fase-1-implementacao
    required: true
    minOccurrences: 1
    maxOccurrences: 1
    partials: [tasks/fase-1-implementacao.md]

  - id: fase-extra
    required: false
    minOccurrences: 0
    maxOccurrences: 1
    partials: [tasks/fase-extra-condicional.md]

  - id: fase-review
    required: true
    partials: [tasks/fase-review.md]

  - id: fase-encerramento
    required: true
    partials: [tasks/fase-encerramento-pre-merge.md]

invariants:
  canonicalOrder: slots # ordem de montagem = ordem dos ids em slots[]
  forbiddenHeadings: [] # nenhum heading proibido em evidence-driven
  # contrapartida — tasks-deterministic.recipe.yml:
  # forbiddenHeadings:
  #   - "🛰️ Stage 1 / Stage 2"
  #   - "Sub-bloco [0.Research]"
  #   - "Sub-bloco [0.Brief]"
  #   - "Sub-bloco [0.Gate]"
```

**Pró.**

- **Auto-coerência por construção.** Cada slot declara seu próprio contrato; renomear um slot edita um único objeto. Drift recipe ↔ validator é impossível porque a declaração é a mesma.
- **Mensagem de erro é direta.** Quando 3.E falha em `STRUCT_MISSING_HEADING` para `fase-0-research`, basta apontar para `slots[2]` da recipe — sem cruzar listas.
- **TypeScript reflete a forma 1:1.** `RecipeSlot` é objeto com campos próprios; `assertValidRecipe` valida tipo + presença de campos obrigatórios + coerência (`minOccurrences ≤ maxOccurrences`, `partials.length ≥ 1`).
- **Honra ADR 0014 §3 forte.** Não há dois lugares para o mesmo fato.
- **Reusa partials.** Mesmo `tasks/fase-1-implementacao.md` aparece em todas as 3 variantes de `tasks-*`. Edição em 1 lugar propaga.

**Contra.**

- Cada slot ocupa ~5 linhas em vez de 2 — recipes ficam maiores. Aceitável: legibilidade pesa mais que terseness.
- `forbiddenHeadings` no top-level é a única assimetria (não é por-slot porque "headings proibidos no artefato inteiro" é semântica global do `artifactKind`, não de um slot). Documentação clara mitiga.
- Cardinalidade default precisa ser declarada em comentário no schema (`required: true → minOccurrences default 1, maxOccurrences default 1`).

**Veredito.** ✅ **Recomendada.** Honra todos os ADRs, elimina drift por construção, mensagem de erro direta, TypeScript 1:1.

### (C) Schema rígido com listas

**Mecânica.** Slots minimalistas (só `id`); presença em `requiredSlots[]` é único modo de declarar obrigatoriedade. Sem `min`/`max` por slot. Sem `partials[]` por slot — partials viram lookup global por convenção (`{slot-id}.md` em `partials/{artifactKind}/`).

**Por que rejeitada.**

- Perde expressividade essencial: alguns slots têm múltiplos partials válidos (ex.: header pode variar por status); 3.E não consegue validar "este partial é válido para este slot".
- Cardinalidade fixa 1:1 quebra `tasks-evidence-driven` (que tem `fase-1-implementacao` repetível por sub-bloco lógico).
- Lookup por convenção é frágil: renomear arquivo de partial sem renomear `slot.id` quebra silenciosamente.

**Veredito.** ❌ Rejeitada. Simplicidade não compensa perda de expressividade.

### (D) Inline + condicionais expressas (`when:`)

**Mecânica.** Cada slot pode ter `when: <expressão>` que decide se entra na composição. Uma recipe única para `tasks` parametrizada por `workflowType`:

```yaml
schemaVersion: v0
artifactKind: tasks
language: pt-BR

slots:
  - id: header
    required: true
    partials: [tasks/header-tasks.md]

  - id: fase-0-research
    required: true
    when: "workflowType in ('evidence-driven', 'mixed')"
    partials: [tasks/fase-0-research.md]
  # ...
```

**Por que rejeitada.**

- **Viola ADR 0013 §6** ("AST como SSOT, sem condicionais em runtime"). `when:` é exatamente o caminho condicional que SSOT estática rejeita — o output deixa de ser função pura da árvore (recipe + partials) e passa a depender de variável de entrada (`workflowType` selecionado).
- **`[DEC-0021-D01]` Opção B rejeitada** descreve literalmente este caminho: "Templates com Lógica Interna — Um único arquivo com condicionais pesadas". A owner rejeitou explicitamente.
- **Mensagem de erro vira condicional.** "Slot X faltando" precisa explicar "...quando workflowType=evidence-driven, este slot é obrigatório". Composição condicional + mensagem condicional = consumidor confuso.
- **3.E (validação estrutural) também vira condicional.** Cada invariante precisa ser avaliada sob condições — explosão combinatória.
- **Reuso real é via partials, não via condicional.** O `fase-1-implementacao.md` é o mesmo partial em todas as 3 variantes — basta listar 3 recipes que apontam para o mesmo partial.

**Veredito.** ❌ Rejeitada. Reintroduz a complexidade que `[DEC-0021-D01]` cravou contra.

---

## 📐 Recomendação consolidada

**Adotar Opção (B): slots ricos inline + invariants global mínimo.**

Três recipes irmãs para `tasks` compartilhando partials atômicas:

- `.core/governance/recipes/tasks-evidence-driven.recipe.yml`
- `.core/governance/recipes/tasks-deterministic.recipe.yml`
- `.core/governance/recipes/tasks-mixed.recipe.yml`

Cada recipe declara `artifactKind: tasks` e `workflowType: <variante>`. 3.E lê o `workflowType` para resolver mensagens e contexto, mas **não para condicionar slots** — a condicionalidade já está resolvida pela escolha da recipe.

Demais artifactKinds começam com **1 recipe cada**:

- `.core/governance/recipes/spec.recipe.yml`
- `.core/governance/recipes/plan.recipe.yml`
- `.core/governance/recipes/decision-brief.recipe.yml`
- `.core/governance/recipes/next.recipe.yml` _(opcional para 3.D inicial)_
- `.core/governance/recipes/research-index.recipe.yml` _(opcional para 3.D inicial)_

Variantes de `spec` por status (Draft / In Review / Pivoted com Post-mortem etc.) usam **slots opcionais** (`required: false`), não recipes irmãs — o artefato evolui em-lugar conforme o autor preenche, não é regerado.

### Topologia física cravada

```
.core/governance/
├── recipes/                                  # Recipes (decisões de composição)
│   ├── tasks-evidence-driven.recipe.yml
│   ├── tasks-deterministic.recipe.yml
│   ├── tasks-mixed.recipe.yml
│   ├── spec.recipe.yml
│   ├── plan.recipe.yml
│   └── decision-brief.recipe.yml
└── templates/
    └── partials/                             # Markdown atômico
        ├── common/
        │   ├── doc-header.md
        │   └── footer-references.md
        ├── spec/
        │   ├── objetivo.md
        │   ├── escopo.md
        │   ├── criterios-de-aceite.md
        │   ├── pesquisa-de-contexto.md
        │   ├── decisao-de-fusao.md
        │   ├── dependencias-impactos.md
        │   └── post-mortem.md
        ├── plan/
        │   ├── stage-1-stage-2.md
        │   ├── design-arquitetura.md
        │   ├── dod-detalhado.md
        │   ├── estrategia-testes.md
        │   ├── arquivos-modificados.md
        │   ├── riscos-tecnicos.md
        │   ├── decisoes-revisitadas.md
        │   └── anexo-pre-research.md
        └── tasks/
            ├── header-tasks.md
            ├── fase-0-setup.md
            ├── fase-0-research.md
            ├── fase-0-brief.md
            ├── fase-0-gate.md
            ├── fase-1-implementacao.md
            ├── fase-extra-condicional.md
            ├── fase-review.md
            └── fase-encerramento-pre-merge.md
```

**Notas:**

- Recipes **fora** de `templates/` por desenho — recipe é decisão de governança (lar `.core/governance/`), partial é payload Markdown (lar `.core/governance/templates/`).
- `partials/common/` reservado para fragmentos atemporais compartilhados cross-artifactKind. Não usar agora se nenhum partial é genuinamente compartilhado; abrir quando a dor aparecer.
- Extensão `.recipe.yml` (não `.yml` puro) sinaliza intent — protege contra confusão com `registry.yml`/`living-docs.yml`.
- Nomes em **kebab-case** para arquivos (consistente com convenção §6 da ARCHITECTURE-REFERENCE).

### Schema completo da Recipe (versão de domínio)

```ts
// src/domain/templates/Recipe.ts
import { GovernanceError } from "../shared/errors.js";

export const TEMPLATE_SCHEMA_VERSIONS = ["v0"] as const;
export type TemplateSchemaVersion = (typeof TEMPLATE_SCHEMA_VERSIONS)[number];

export const ARTIFACT_KINDS = [
  "spec",
  "plan",
  "tasks",
  "decision-brief",
  "next",
  "research-index",
  "roadmap",
] as const;
export type ArtifactKind = (typeof ARTIFACT_KINDS)[number];

export const WORKFLOW_TYPES = ["evidence-driven", "deterministic", "mixed", "n/a"] as const;
export type WorkflowType = (typeof WORKFLOW_TYPES)[number];

export const LANGUAGES = ["pt-BR", "en-US"] as const;
export type Language = (typeof LANGUAGES)[number];

export const CANONICAL_ORDERS = ["slots"] as const;
// "slots" = ordem de montagem segue ordem do array de slots da recipe.
// Único valor v0; futuras estratégias (ex.: "alphabetical") entram via ADR de extensão.
export type CanonicalOrder = (typeof CANONICAL_ORDERS)[number];

/** Caminho relativo a `.core/governance/templates/partials/`. */
export type PartialRef = string;

export interface RecipeSlot {
  readonly id: string; // kebab-case, único na recipe
  readonly required: boolean; // true → minOccurrences default 1
  readonly minOccurrences?: number; // default: required ? 1 : 0
  readonly maxOccurrences?: number; // default: 1 (slot único); use Infinity ou número > 1 para repetível
  readonly partials: readonly PartialRef[]; // ≥ 1 partial válido para este slot
}

export interface RecipeInvariants {
  readonly canonicalOrder: CanonicalOrder;
  readonly forbiddenHeadings: readonly string[]; // headings (texto exato) proibidos no artefato gerado
}

export interface Recipe {
  readonly schemaVersion: TemplateSchemaVersion;
  readonly artifactKind: ArtifactKind;
  readonly workflowType: WorkflowType;
  readonly language: Language;
  readonly slots: readonly RecipeSlot[];
  readonly invariants: RecipeInvariants;
}

export function assertValidRecipe(recipe: unknown): asserts recipe is Recipe {
  // Validações:
  // - shape mínimo (campos presentes)
  // - schemaVersion ∈ TEMPLATE_SCHEMA_VERSIONS
  // - artifactKind ∈ ARTIFACT_KINDS
  // - workflowType ∈ WORKFLOW_TYPES
  // - language ∈ LANGUAGES
  // - slots: array não-vazio
  // - slot.id único na recipe (RECIPE_DUPLICATE_SLOT_ID)
  // - slot.partials: array não-vazio (RECIPE_SLOT_NO_PARTIAL)
  // - minOccurrences ≤ maxOccurrences (RECIPE_INVALID_CARDINALITY)
  // - required=false ↔ minOccurrences === 0 (RECIPE_REQUIRED_INCONSISTENT)
  // - invariants.canonicalOrder ∈ CANONICAL_ORDERS
  // - invariants.forbiddenHeadings: array (pode ser vazio)
  // Mensagens nomeiam o conjunto válido (ADR 0011).
}
```

### Family de erros estáveis (LIVING*DOCS*\* style, ADR 0011)

| Código                            | Quando                                                                            |
| :-------------------------------- | :-------------------------------------------------------------------------------- |
| `RECIPE_MISSING_FIELD`            | Campo obrigatório ausente no YAML parseado                                        |
| `RECIPE_INVALID_SCHEMA_VERSION`   | `schemaVersion` fora de `TEMPLATE_SCHEMA_VERSIONS`                                |
| `RECIPE_INVALID_ARTIFACT_KIND`    | `artifactKind` fora de `ARTIFACT_KINDS`                                           |
| `RECIPE_INVALID_WORKFLOW_TYPE`    | `workflowType` fora de `WORKFLOW_TYPES`                                           |
| `RECIPE_INVALID_LANGUAGE`         | `language` fora de `LANGUAGES`                                                    |
| `RECIPE_EMPTY_SLOTS`              | `slots[]` vazio                                                                   |
| `RECIPE_DUPLICATE_SLOT_ID`        | Dois slots com mesmo `id` (cite os dois)                                          |
| `RECIPE_SLOT_NO_PARTIAL`          | Slot com `partials: []`                                                           |
| `RECIPE_INVALID_CARDINALITY`      | `minOccurrences > maxOccurrences`                                                 |
| `RECIPE_REQUIRED_INCONSISTENT`    | `required: true` com `minOccurrences: 0`, ou `required: false` com `min: > 0`     |
| `RECIPE_INVALID_CANONICAL_ORDER`  | `invariants.canonicalOrder` fora de `CANONICAL_ORDERS`                            |
| `RECIPE_PARTIAL_NOT_FOUND`        | Partial referenciado por `partials[]` não existe em disco (validação no use case) |
| `RECIPE_PARTIAL_INVALID_MARKDOWN` | Partial não é Markdown válido (3.D.2 — definido abaixo)                           |

3.E (próximo sub-bloco) adicionará: `STRUCT_MISSING_HEADING`, `STRUCT_OUT_OF_ORDER`, `STRUCT_FORBIDDEN_SECTION`, `STRUCT_RECIPE_SELF_INCONSISTENT`. Esses códigos **operam sobre o output gerado**, lendo o bloco `invariants` da Recipe que gerou.

### Contrato de Partial (3.D.2)

Cada arquivo `.md` em `partials/**/` precisa cumprir:

1. **Markdown sintaticamente válido.** Parseável sem erro por um parser CommonMark/GFM padrão. (3.D.5 valida via `markdown-it` ou parser equivalente; sem dependência nova além das já presentes.)
2. **Não-fragmento.** Começa com `#` heading **ou** com bloco autocontido (lista, parágrafo, blockquote completo). Não pode terminar no meio de uma estrutura aberta (lista sem fechamento, bloco de código sem fim).
3. **Self-contained.** Referências internas (ex.: `[texto](#anchor)`) podem apontar para anchors dentro do partial **ou** ser ponteiros externos (`./decision-brief.md`); não dependem de IDs gerados por outros partials.
4. **Determinístico.** Sem placeholders processados em runtime (`{{var}}`, `<%= expr %>`). Mudança de valor → nova versão do partial (ou substituição direta no autor antes do commit).
5. **Sem timestamps embutidos.** Mesma regra que ADR 0013 §6 aplicou a Living Docs: artefato determinístico = sem `generatedAt`/`createdAt`/`updatedAt` no conteúdo.

**Validação concreta:** o teste `PartialsContract.test.ts` (3.D.5) varre `partials/**/*.md` e:

- Falha com `RECIPE_PARTIAL_INVALID_MARKDOWN` se parsing falha.
- Falha com `RECIPE_PARTIAL_NOT_REFERENCED` se algum `.md` em `partials/` não é apontado por ≥1 recipe (mitiga **partial soup**, risco #5 do research).

### Determinismo (3.D.3) — contrato

`AssembleArtifact(recipe, partials) → output` é função pura:

1. Resolve `recipe.slots[]` na ordem declarada (`invariants.canonicalOrder === "slots"`).
2. Para cada slot, lê o partial canônico (primeiro de `slot.partials[]` por enquanto — múltiplos partials por slot são feature de 3.E quando variação por status entrar).
3. Concatena com separador deterministico (`\n\n` entre blocos; sem padding extra).
4. Output é byte-a-byte estável: hash do output para mesma (recipe, partials) coincide em duas máquinas.

**Teste canônico:** `DeterministicAssembly.test.ts` gera o artefato 2× para a mesma recipe + mesmos partials; afirma igualdade byte-a-byte.

### Topologia DDD da implementação (3.D.4)

```
src/
├── domain/templates/
│   ├── Recipe.ts                             # Tipos puros + assertValidRecipe
│   ├── Partial.ts                            # Tipo + assertValidPartialMarkdown (parsing puro)
│   └── ComposedArtifact.ts                   # Output tipado (string + metadata mínima)
├── app/
│   ├── ports/
│   │   └── RecipeStore.ts                    # Port: loadRecipe(name), listPartials(), loadPartial(path)
│   └── use-cases/
│       ├── AssembleArtifact.ts               # Use case: assembleArtifact(recipeName) → ComposedArtifact
│       └── AssembleArtifact.test.ts
└── infrastructure/
    └── yaml/
        ├── templateRecipeSchema.ts           # Parser YAML → Recipe (yaml@2)
        └── NodeRecipeStore.ts                # Adapter concreto (fs + parser)
```

**Boundary preservado:**

- `yaml@2` só importável sob `src/infrastructure/yaml/` (invariante já enforçada).
- Domain recebe **POJO já parseado**; `assertValidRecipe` valida shape.
- IO de filesystem (lendo `.recipe.yml` e `.md`) só na `NodeRecipeStore`.

---

## ❓ Pontos abertos para decisão da owner

> **Status (2026-05-12): TODAS RESOLVIDAS.** Ver [`✅ Decisão cravada`](#-decisão-cravada-2026-05-12) ao fim do documento. As recomendações abaixo foram confirmadas integralmente; o texto original permanece como rastreio histórico.

Cinco perguntas finas onde a decisão é editorial, não técnica. Recomendação acompanha cada uma — owner pode confirmar ou divergir.

### Q1. `schemaVersion: v0` agora ou só quando houver consumidor externo?

**Recomendação:** `v0` cravado desde o início. Não há custo extra (1 campo no schema, 1 entrada em `TEMPLATE_SCHEMA_VERSIONS`), e segue precedente do `LIVING_DOCS_SCHEMA_VERSION`. Bump para v1 exige ADR de extensão (mesmo padrão).

### Q2. Múltiplos partials por slot agora (3.D) ou só em 3.E?

**Recomendação:** **estrutura no schema agora** (campo `partials: PartialRef[]`); **resolução agora é sempre o primeiro elemento** (`partials[0]`). 3.E adiciona lógica de seleção quando variação por status/condição entrar. Custo: zero — o campo já é lista. Ganho: zero refactor depois.

### Q3. `forbiddenHeadings` é texto exato ou regex/glob?

**Recomendação:** **texto exato** (literal match após trim). Glob/regex reintroduzem complexidade. Se um `artifactKind` precisar de pattern (ex.: "qualquer heading começando com `Stage`"), adicionar campo `forbiddenHeadingPatterns: string[]` em 3.E sob ADR de extensão. Recomendação editorial: comece estrito.

### Q4. Como expressar "fase repetível por sub-bloco lógico" (`fase-1-implementacao`)?

**Opções:**

- **(a)** `maxOccurrences: Infinity` no slot — partial é instanciado N vezes em tempo de geração; a autor humano edita as N instâncias no arquivo gerado.
- **(b)** Partial **já contém** template repetível dentro de si (3 sub-blocos exemplo); autor edita o arquivo gerado replicando.

**Recomendação:** **(b)** para 3.D. É mais simples, sem `maxOccurrences: Infinity` no domain inicial. O artefato gerado nasce com 2-3 sub-blocos de exemplo dentro do partial `fase-1-implementacao.md`; autor adapta. Se a dor aparecer (ex.: gerar com N exato como parâmetro), introduzir (a) sob ADR.

### Q5. CLI command para gerar artefato — entra agora (3.D.4) ou só em PR4?

**Recomendação:** **só o use case + testes** em 3.D.4. O command CLI fica para PR4 (que já carrega o cutover real do mirror legado). Use case é testável isoladamente; command é casca. Evita escopo creep no PR3.

---

## 🚨 Anti-objetivos (explícitos)

Para o sub-bloco `[3.D]`, **NÃO** fazer:

1. **Não implementar 3.E.** O `MarkdownStructuralValidation` lê o bloco `invariants` desta recipe — esse trabalho é o próximo sub-bloco.
2. **Não tocar no mirror legado (3.F).** Recipes nascem em paralelo aos boilerplates atuais; equivalência mínima é tarefa de 3.F.
3. **Não introduzir mecânica de filtro/transform em partial.** O padrão "filtros opcionais por slot" do Marc (research §2.5) fica como sub-débito apenas se a dor aparecer.
4. **Não bumpar `schemaVersion` em direção a v1.** v0 estabiliza nesta entrega; mudança de shape exige ADR de extensão.
5. **Não criar command CLI (`yarn templates:assemble`).** Use case + testes apenas (Q5).
6. **Não escrever partials para os 11 boilerplates de uma vez.** O escopo de 3.D é entregar **3 recipes reais** (spec, plan, tasks-evidence-driven) com os partials correspondentes — suficiente para provar o modelo. Demais entram em 3.F durante a equivalência.
7. **Não duplicar conteúdo entre partial e recipe.** O partial é o Markdown bruto; a recipe é a metadata. Conteúdo de Markdown nunca aparece dentro do YAML.
8. **Não introduzir dependência nova.** `yaml@2` já presente; `markdown-it` ou parser CommonMark equivalente entra apenas se nenhuma alternativa nativa servir (sob aprovação explícita da owner — anti-objetivo declarado em `spec.md`).

---

## 📊 Mapeamento direto aos itens de `tasks.md` [3.D]

| Item                   | Entrega após esta auditoria                                                                                                  |
| :--------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **3.D.1**              | `src/domain/templates/Recipe.ts` com schema (B) + `assertValidRecipe` + family de erros `RECIPE_*` (ADR 0011).               |
| **3.D.2**              | `src/domain/templates/Partial.ts` com `assertValidPartialMarkdown` (5 contratos acima).                                      |
| **3.D.3**              | Determinismo materializado em `AssembleArtifact.ts` (passo §"Determinismo (3.D.3)").                                         |
| **3.D.4**              | `src/app/use-cases/AssembleArtifact.ts` + port `RecipeStore` + adapter `NodeRecipeStore`. Sem CLI command.                   |
| **3.D.5**              | `RecipeResolution.test.ts`, `PartialsContract.test.ts`, `DeterministicAssembly.test.ts`.                                     |
| **3.D.N**              | `yarn test:nova-cli` verde.                                                                                                  |
| **3.D.[DEBT-REVIEW]**  | NEXT.md: registrar débito sobre os 8 boilerplates **não** cobertos por recipes nesta sessão.                                 |
| **3.D.[ARCHITECTURE]** | `ARCHITECTURE.md` §6 + `ARCHITECTURE-REFERENCE.md` §1.3/§5: TemplateEngine sai de §1.4 para §1.3.                            |
| **3.D.[COMMIT]**       | Cadeia de ~5 commits atômicos (Recipe tipos / Partial contract / Assemble use case / Recipes+partials reais / housekeeping). |

---

## 🎬 Próximos passos imediatos

1. ~~Owner valida esta auditoria.~~ **Validada em 2026-05-12** — ver `✅ Decisão cravada` abaixo.
2. Sub-bloco `[3.D]` inicia TDD pelo schema do domain (3.D.1) — teste vermelho sobre `assertValidRecipe`.
3. ~~Caso a owner divirja em Q1..Q5, ajustar este documento (sem reabrir Opções A/B/C/D) e seguir.~~ — todas Q1..Q5 confirmadas conforme recomendação.

---

## ✅ Decisão cravada (2026-05-12)

A owner cravou as decisões abaixo após leitura desta auditoria. Convergência independente foi observada no review do **PR #13** (Living Docs + drift guard), que recomendou a mesma Opção (B) com idênticas respostas para Q1–Q5 — sinal externo de robustez da recomendação.

### Opção selecionada: (B) — Slots ricos inline + invariants global mínimo

Motivação compactada:

- **Auto-coerência por construção** — o schema da Recipe é, simultaneamente, o contrato de validação estrutural consumido por `[3.E]`. Sem duplicação rule↔validator (ADR 0014 §3).
- **Zero drift** entre o que a recipe declara e o que o validator exige: ambos lêem o mesmo TypeScript exportado pelo domain.
- **Mensagens de erro diretas** — slot ausente → nome do slot + arquivo do partial esperado, sem indirecionamento via tabela auxiliar.
- **Mapeamento 1:1 ao TypeScript** — `RecipeSlot`/`RecipeInvariants` viram interfaces puras; YAML é só transporte.

Opções (A), (C), (D) rejeitadas pelas razões já documentadas nas seções respectivas — não reabrir.

### Respostas Q1–Q5 cravadas

| Pergunta                                                         | Decisão                                                     | Justificativa curta                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Q1** — `schemaVersion: v0` agora ou só com consumidor externo? | **`v0` agora.**                                             | Mesma política de `LivingDocsArtifact.schemaVersion` (ADR 0011 §6 + frozen set); custo zero, paga em opcionalidade de extensão.                                                                                                                                          |
| **Q2** — Múltiplos partials por slot em 3.D ou só em 3.E?        | **Lista no schema em v0; resolver sempre o primeiro item.** | Conforme estrutura definida em [Schema completo da Recipe](#schema-completo-da-recipe-versão-de-domínio). Cardinalidade plural já tipada (`partials: readonly PartialRef[]`), comportamento de seleção fica documentado como "first-wins" até `[3.E]` demandar override. |
| **Q3** — `forbiddenHeadings` texto exato ou regex/glob?          | **Texto literal (case-sensitive).**                         | Regex em domain é tentação de validar estética — exatamente o que ADR 0014 §4 rejeita. Lint estético separado fica como camada opcional.                                                                                                                                 |
| **Q4** — Como expressar "fase repetível por sub-bloco lógico"?   | **No conteúdo do partial; sem `Infinity` no schema v0.**    | Schema fica fechado por valores finitos (`minOccurrences`/`maxOccurrences` numéricos). Sintaxe de marcação livre dentro do partial cobre o caso real. Revisitar só se aparecer regra de governance que precise contar fases.                                             |
| **Q5** — CLI command para gerar artefato em 3.D.4 ou PR4?        | **Sem CLI agora.**                                          | Primeiro use case + testes; CLI vira camada de carrier em PR4. Anti-escopo creep.                                                                                                                                                                                        |

### Convergência com revisor do PR #13

O reviewer chegou à mesma Opção (B) e às mesmas respostas Q1–Q5 sem ter lido este audit. Coincidências relevantes:

- "Q1 `schemaVersion: v0` desde o início" → bate com Q1 cravada.
- "Q2 `partials` como lista no slot, mas em v0 resolver sempre o primeiro item" → bate com Q2 cravada.
- "Q3 `forbiddenHeadings` por match literal (texto exato) no v0" → bate com Q3 cravada.
- "Q4 repetição inicialmente resolvida no conteúdo do partial (sem `Infinity` no schema v0)" → bate com Q4 cravada.
- "Q5 sem CLI de templates agora: primeiro use case + testes (evitar escopo creep)" → bate com Q5 cravada.

Convergência independente reforça a aposta — não há divergência conhecida a reconciliar.

### Próximos passos (cravados pela decisão)

1. **`[3.D.1]` — Domain `Recipe.ts`:** types + enums + `assertValidRecipe` + erros estáveis (família `RECIPE_*`). TDD red→green.
2. **`[3.D.2]` — Contrato de Partial:** verificação de Markdown válido + ausência de placeholders não-resolvidos. TDD red→green.
3. **`[3.D.3+3.D.4]` — Use case `AssembleArtifact` + port `RecipeStore`:** boundary preservado (yaml@2 só em `src/infrastructure/yaml/`; domain recebe POJO). Determinismo byte-a-byte exercitado.
4. **`[3.D-housekeeping]` — `ARCHITECTURE-REFERENCE.md`:** mover §1.4 (TemplateEngine) para §1.3 (implementado); atualizar §5 glossário se necessário.

Anti-objetivos do bloco (válidos durante toda a execução): não tocar 3.E (só schema na recipe); não tocar mirror legado (3.F); ≤200 LOC por commit; sem novas dependências.

---

## 🔗 Referências canônicas usadas

- ADR 0010 — Work Items como Taxonomia MECE ([`.core/governance/adrs/0001-taxonomy-mece-pillars.md`](../../../.core/governance/adrs/0001-taxonomy-mece-pillars.md))
- ADR 0011 — Outcomes como Enums Fechados ([`.core/governance/adrs/0002-coverage-state-enum.md`](../../../.core/governance/adrs/0002-coverage-state-enum.md))
- ADR 0012 — Bypass Auditável ([`.core/governance/adrs/0003-drift-guard-bypass.md`](../../../.core/governance/adrs/0003-drift-guard-bypass.md))
- ADR 0013 — Análise Estática AST como SSOT ([`.core/governance/adrs/0004-ast-only-extraction.md`](../../../.core/governance/adrs/0004-ast-only-extraction.md))
- ADR 0014 — Validação Semântica vs Estética ([`.core/governance/adrs/0005-structural-validation.md`](../../../.core/governance/adrs/0005-structural-validation.md))
- Decision Brief 0021 § Bloco D ([`./decision-brief.md`](./decision-brief.md))
- ARCHITECTURE-REFERENCE §1.3, §1.4, §5 ([`.core/governance/ARCHITECTURE-REFERENCE.md`](../../../.core/governance/ARCHITECTURE-REFERENCE.md))
- ARCHITECTURE §6 ([`.core/governance/ARCHITECTURE.md`](../../../.core/governance/ARCHITECTURE.md))
- Research: Living Docs and Template Composition Practices §1.7, §2.5, §5 ([`../researchs/governance/2026-05-11-living-docs-and-template-composition-practices.md`](../researchs/governance/2026-05-11-living-docs-and-template-composition-practices.md))
- Auditoria precedente (formato) ([`./audit-2026-05-11-pre-3c4-living-docs-aggregation.md`](./audit-2026-05-11-pre-3c4-living-docs-aggregation.md))
- governance-foundation §"Tipos de spec" ([`.core/process/governance-foundation.md`](../../../.core/process/governance-foundation.md))
