---
title: Spec-driven tools e assistentes IA — tratamento de rules e decisões pré-design
spec: 0018-rules-content-deepening
bloco: B
sub-bloco: B.0
date: 2026-04-30
status: Stage 1 — research output (sem decisões cravadas)
informa:
  - "[DEC-0018-B01] Taxonomia das categorias de regras"
  - "[DEC-0018-B02] Colocação por categoria"
  - "[DEC-0018-B06] Fronteira com Spec 0011"
  - "[DEC-0018-B07] Fronteira com Spec 0009"
sources:
  - https://github.com/github/spec-kit
  - https://github.com/github/spec-kit/blob/main/spec-driven.md
  - https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/
  - https://developer.microsoft.com/blog/spec-driven-development-spec-kit
  - https://github.com/bmad-code-org/BMAD-METHOD
  - https://docs.bmad-method.org/reference/workflow-map/
  - https://docs.bmad-method.org/explanation/named-agents/
  - https://deepwiki.com/bmad-code-org/BMAD-METHOD/4.1-bmm-overview-and-philosophy
  - https://github.com/Fission-AI/OpenSpec
  - https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md
  - https://openspec.dev/
  - https://docs.continue.dev/customize/deep-dives/rules
  - https://docs.continue.dev/customize/rules
  - https://docs.continue.dev/reference
  - https://aider.chat/docs/usage/conventions.html
  - https://github.com/Aider-AI/conventions
  - https://aider.chat/docs/config/aider_conf.html
  - https://github.com/PatrickJS/awesome-cursorrules
  - https://dotcursorrules.com/
  - https://thepromptshelf.dev/blog/cursor-rules-examples-templates-2026/
  - https://docs.cline.bot/customization/cline-rules
  - https://cline.bot/blog/clinerules-version-controlled-shareable-and-ai-editable-instructions
  - https://deepwiki.com/cline/cline/7.1-cline-rules
---

# Spec-driven tools e assistentes IA — tratamento de rules e decisões pré-design

> Stage 1 — output de pesquisa. Este documento não cravam decisões; apenas mapeia
> opções e padrões para alimentar `[DEC-0018-B01]`, `[DEC-0018-B02]`,
> `[DEC-0018-B06]` e `[DEC-0018-B07]`.

---

## 1. Sumário executivo

A pesquisa cobriu sete fontes (Spec Kit, BMAD-METHOD, OpenSpec, Continue.dev,
Aider, Cursor, Cline) buscando como cada uma trata (a) regras editoriais para o
agente IA e (b) decisões pré-design / pré-implementação. O panorama é
heterogêneo: frameworks **spec-driven** (Spec Kit, BMAD, OpenSpec) tratam
**workflow + gate humano** como problema central; assistentes **rule-based**
(Continue, Aider, Cursor, Cline) tratam **escopo e composição de regras** como
problema central. Quase nenhum projeto faz ambos com igual profundidade — e é
exatamente nessa interseção que o `ai-guidelines` se posiciona.

### Achados-chave

1. **Constituição é padrão emergente.** Spec Kit (`memory/constitution.md`),
   BMAD (`project-context.md` descrito como "constitution for your project") e
   `ai-guidelines` (`global-rules.md`) convergem em um arquivo único e
   imutável-por-default que captura princípios não-negociáveis. OpenSpec não
   possui equivalente formal.
2. **Gate humano explícito é raro e valorizado.** Apenas BMAD formaliza um
   artefato de gate (`bmad-check-implementation-readiness` com decisão
   PASS/CONCERNS/FAIL). Spec Kit fala em "Phase -1: Pre-Implementation Gates"
   conceitualmente, mas sem template estruturado dedicado. OpenSpec usa
   "dependencies as enablers, not gates" — i.e., gate implícito por
   ordenação de artefatos. Os assistentes rule-based **não têm gate humano**.
3. **Distinção spec-de-pesquisa × spec-de-implementação não é universal.**
   OpenSpec tem o pareamento mais próximo (proposal + delta-spec + design),
   permitindo "research-first custom schemas". Spec Kit separa
   `spec → plan → tasks` mas trata os três como obrigatórios sequenciais.
   BMAD distingue analysis (opcional) → planning → solutioning → implementation.
4. **Frontmatter YAML é o vocabulário universal de "scoped rules".** Continue,
   Cline e Cursor (`.mdc`) convergiram em frontmatter com pelo menos
   `globs`/`paths` + `description` + flag de ativação. Aider e Spec Kit
   permanecem em prosa Markdown sem frontmatter formal.
5. **Convenção de ID não é prática estabelecida.** Nenhuma das ferramentas
   pesquisadas usa IDs estáveis tipo `[BR-CLI-SYNC-01]` para rastrear regras.
   Cline e Continue usam **prefixos numéricos** (`01-general.md`) apenas para
   ordenar carga, não como identificador semântico. Cursor usa convenção de
   pasta `technology-focus-cursorrules-prompt-file` (semântica, mas não ID).
6. **Separação universal × per-IA é distintiva do `ai-guidelines`.**
   AGENTS.md surgiu como standard cross-tool (Cline já lê `.cursorrules`,
   `.windsurfrules` e `AGENTS.md`), mas nenhuma ferramenta divide rules em
   `global-rules.md` (universal) + `claude.md`/`codex.md`/`gemini.md`
   (adapters). Esse é um grau de modularidade específico do framework.
7. **"Decision-brief" como artefato é virtualmente inédito.** Nenhuma das
   sete fontes formaliza um documento curto, humano-revisável, que **trava**
   decisões pré-design antes da escrita do plan/tasks. BMAD chega mais perto
   com seu gate ready-check, mas o foco é validação de prontidão, não
   captura estruturada de decisões com IDs `[DEC-XXXX-Bnn]`.

---

## 2. Spec Kit (GitHub)

### Fluxo

Três comandos slash sequenciais:

1. `/speckit.specify` — gera PRD estruturado a partir de descrição em linguagem
   natural; cria branch + diretório.
2. `/speckit.plan` — converte requisitos em plano técnico de implementação
   (data models, contratos de API, research).
3. `/speckit.tasks` — deriva lista executável de tarefas, marcando
   paralelizáveis.

### Constituição

Arquivo único `memory/constitution.md` — descrito como "architectural DNA … set
of immutable governing principles". Contém **nove artigos** organizados em três
categorias implícitas:

- **Estruturais** (Artigos I-II): library-first, CLI-first.
- **Qualidade** (Artigos III, VII-IX): test-first, simplicidade,
  anti-abstraction, integration testing.
- **Processo** (implícito): amendment procedures, complexity tracking,
  constitutional compliance.

A constituição é injetada na geração do plan, "ensuring technical decisions stay
aligned with organizational standards".

### Templates

Templates funcionam como "sophisticated prompts" que constrangem output do LLM.
Resolvidos em runtime top-down, com overrides em
`.specify/templates/overrides/`. Presets podem reestruturar templates para:

- exigir traceability regulatória,
- adaptar metodologia (Agile, Kanban, JTBD, DDD),
- adicionar gates de security review,
- forçar test-first ordering,
- localizar para outros idiomas.

### Gates humanos entre estágios

Conceitualmente Spec Kit fala em **"Phase -1: Pre-Implementation Gates"**
incluindo simplicity, anti-abstraction e integration-first validation. Templates
incluem **completeness checklists** e **clarity markers** (`[NEEDS
CLARIFICATION]`). Porém **não há um artefato dedicado de gate** análogo ao
`decision-brief.md` — o gate é distribuído via checklists embutidas nos
próprios `spec.md`/`plan.md`.

### Regras editoriais

Não há sistema dedicado de "rules para o agente IA" separadas da constituição.
Toda governança vai para `constitution.md`. Não há distinção formal entre
"regra para o agente" vs "regra para o código produzido" — a constituição
mistura as duas.

### Distinção spec-pesquisa × spec-implementação

**Não existe formalmente.** A `spec.md` é o PRD voltado a usuário (acceptance
criteria, requisitos), e `plan.md` é o documento técnico. Pesquisa não tem
artefato dedicado — pode ir como sub-arquivo do plan.

### Fronteiras entre specs

Não documenta primitiva de spec-to-spec dependency. Cada feature é uma branch
independente com sua própria estrutura `.specify/specs/<feature>/`.

---

## 3. BMAD-METHOD

### Fluxo (4 fases)

1. **Analysis** (opcional) — brainstorming, research, product briefs.
2. **Planning** — requirements + UX specs.
3. **Solutioning** — arquitetura + breakdown em epics/stories.
4. **Implementation** — código + reviews + retrospects.

Existe **Quick Flow** que pula 1-3 para trabalho bem-compreendido.

### Agentes

**12+ agentes especializados** (PM, Architect, Developer, UX, etc.), cada um
com role específico. Trabalho é "human-in-the-loop collaboration where agents
facilitate structured thinking. Every workflow step requires user input or
validation before proceeding".

### Gates humanos

**O gate mais explícito de toda a pesquisa.** O artefato
`bmad-check-implementation-readiness` produz uma decisão **PASS / CONCERNS /
FAIL** que trava entrada na Fase 4 (Implementation). Outros gates implícitos
existem por dependência de artefatos: cada fase produz documentos que viram
input da próxima.

### Halt conditions

Workflows declaram **mandatory rules, halt conditions, and validation gates**
explicitamente. Halt conditions aparecem como
`<action if="condition">HALT: "message"</action>` ou blocos `<halt-condition>`
em step files. Filosofia explícita: "catch AI-induced issues before they reach
production".

### Regras (project-context.md)

Regras centralizadas em **`project-context.md`** descrito como "constitution
for your project" que "guides implementation decisions across all workflows".
Captura tech stack, conventions e preferences em **um arquivo único**.

Separação implícita:

- **Strategic rules** → `project-context.md` (consumido por agentes).
- **Code implementation** → produzido pelos agentes em runtime.

Não há distinção formal "regra para o agente" vs "regra para o código".

### Distinção spec-pesquisa × spec-implementação

**Sim, parcialmente.** Fase Analysis (opcional) é a research phase explícita
e separada da Planning. Mas analysis é opcional e o output não é um "spec"
formal — são briefs.

### Fronteiras entre specs

Não documenta primitiva canônica. Specs são gerenciadas como artefatos por
fase, não como entidades inter-relacionadas.

---

## 4. OpenSpec (Fission-AI)

### Fluxo

Quando o usuário descreve uma mudança, OpenSpec gera:

1. **Proposal** — captura **intent**, **scope** e **approach** em alto nível
   ("why" e "what").
2. **Specs** — descrevem comportamento atual do sistema (source of truth).
3. **Delta specs** — capturam o que **está mudando** (ADDED / MODIFIED /
   REMOVED) relativo às specs existentes.
4. **Tasks** — checklist de implementação.

### Filosofia

"Review e refine the plan before any code is written, catching misalignment
early." Suporta 21 ferramentas IA (Claude Code, Cursor, Windsurf, Continue,
Gemini CLI, GitHub Copilot, Amazon Q, Cline, RooCode...).

### Gates humanos

**Não há gate formal explícito.** A documentação afirma:

> "Dependencies are enablers, not gates."

I.e., dependências entre artefatos criam **oportunidades naturais de review**
sem fases rígidas. O review humano é antes da geração do código, mas o ponto
exato fica a critério do consumidor.

### Formato de regra (RFC 2119)

Specs usam **palavras-chave RFC 2119** para força do requisito:

- **MUST / SHALL** — requisito absoluto.
- **SHOULD** — recomendado, exceções existem.
- **MAY** — opcional.

Requisitos usam cenários **Given / When / Then** estruturados, o que torna
testáveis.

### Distinção spec-pesquisa × spec-implementação

**Mais próxima entre as ferramentas pesquisadas.**

> "If implementation can change without changing externally visible behavior,
> it likely does not belong in the spec."

Specs capturam comportamento observável; **design documents** capturam
abordagem técnica. Schemas customizados como `research-first` permitem
sequenciar artefatos de forma diferente.

### Fronteiras entre specs

**Solução sofisticada via delta specs.** Múltiplas mudanças paralelas podem
tocar o mesmo arquivo de spec sem conflito desde que mirem requirements
diferentes (referenciados por nome em ADDED/MODIFIED/REMOVED). No archive,
deltas merge limpamente na spec principal.

### Regras editoriais

Não há sistema de "rules para o agente IA" separadas. A governança vive
inteiramente na estrutura de specs e proposals.

---

## 5. Continue.dev

### Formato de regra

Suporta **Markdown (.md)** e **YAML** — Markdown é o recomendado. Frontmatter
YAML estrutura metadados:

```yaml
---
name: Rule Display Name
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: false
description: Optional description for agents
regex: "TODO"
---
```

### Campos do frontmatter

| Campo         | Obrigatório   | Função                                                     |
| :------------ | :------------ | :--------------------------------------------------------- |
| `name`        | Sim (em YAML) | Display title                                              |
| `globs`       | Não           | Padrões de arquivo que disparam inclusão                   |
| `regex`       | Não           | Padrões de conteúdo para inclusão condicional              |
| `description` | Não           | Ajuda agente decidir relevância quando `alwaysApply:false` |
| `alwaysApply` | Não           | Controla comportamento de inclusão                         |

### Comportamento de `alwaysApply`

- `true` → sempre incluído.
- `false` → incluído apenas se globs match E o agente decidir relevante.
- `undefined` (default) → incluído se não há globs OU se globs match.

### Localização e ordem de carga

1. Hub assistant rules (se configurado).
2. Hub rules referenciadas (via `uses:` em `config.yaml`).
3. Local workspace rules (`.continue/rules/`).
4. Global rules (`~/.continue/rules/`).

**Convenção de ordenação**: prefixo numérico (`01-general.md`,
`02-frontend.md`).

### Composição

Múltiplas regras compõem em uma única system message juntando com newlines em
ordem de toolbar, incluindo a base chat system message.

### Escopo / taxonomia

Continue não impõe taxonomia hierárquica — são apenas arquivos `.md` em
diretórios. A "taxonomia" emerge dos nomes e do uso de `globs`.

### Convenção de ID

Não há. Prefixos numéricos servem para ordenar, não para identificar.

### Distinção agente × código

Não formalizada. Toda regra vira system prompt.

### Modos suportados

Rules instruem o modelo em **Agent mode, Chat e Edit**. No Agent mode, é
possível pedir "Create a rule for this" — agente cria via tool
`create_rule_block`.

---

## 6. Aider (CONVENTIONS.md)

### Formato

Markdown simples — **sem frontmatter formal**. Lista preferences como bullet
points: library choices, type hint requirements, code style.

### Lifecycle / loading

Dois métodos:

1. **Per-session** — `/read CONVENTIONS.md` ou `aider --read CONVENTIONS.md`
   no startup. Marca arquivo como read-only e habilita prompt caching.
2. **Persistent** — configurar em `.aider.conf.yml`:

```yaml
read: CONVENTIONS.md
# ou
read: [CONVENTIONS.md, anotherfile.txt]
```

### Escopo

**Não há scoping language-específico.** Convenções aplicam a toda geração de
código na sessão. Mecanismo é language-agnostic.

### Convenção de ID

Inexistente. É um único arquivo (ou poucos arquivos referenciados).

### Distinção agente × código

**Não explícita.** Na prática, conventions guiam escolhas do agente
(seleção de biblioteca, type hints), funcionando como **agent instructions**
que produzem código conforme padrões declarados.

### Comunidade

Repositório dedicado [`Aider-AI/conventions`](https://github.com/Aider-AI/conventions)
para conventions pré-construídas (organizadas por linguagem/stack).

### Discussão recente

Issue [#4363](https://github.com/aider-ai/aider/issues/4363) propõe recomendar
**AGENTS.md** como standard alternativo ao `CONVENTIONS.md` — sinal de
convergência cross-tool.

---

## 7. Cursor (.cursorrules / .cursor/rules/)

### Evolução de formatos

- **2023**: `.cursorrules` (single Markdown file).
- **2024**: `.cursor/` folder com `index.mdc`.
- **2025**: multi-file `.cursor/rules/*.mdc`.
- **2026**: context-aware rules com integração MCP.

### Formato legacy

Arquivo Markdown único na raiz. Lido automaticamente em todo chat/edit.
Limitação: **sem scoping** por tipo de arquivo, fica unwieldy em projetos
grandes.

### Formato moderno (.mdc)

Cada arquivo tem extensão `.mdc` em `.cursor/rules/`. Frontmatter YAML:

```yaml
---
description: Short label
globs: "**/*.tsx"
---
```

Estrutura típica:

```
project-root/
└── .cursor/
    └── rules/
        ├── general.mdc
        ├── react-components.mdc
        ├── api-routes.mdc
        └── testing.mdc
```

### Taxonomia

`awesome-cursorrules` organiza por **technology focus**:
`technology-focus-cursorrules-prompt-file` (ex.:
`nextjs-react-tailwind-cursorrules-prompt-file`).

**11 categorias primárias**:

1. Frontend Frameworks & Libraries (35+ rules).
2. Backend & Full-Stack (40+ rules).
3. Mobile Development (7).
4. CSS & Styling (7).
5. State Management (3).
6. Database & API (2).
7. Testing (15+).
8. Hosting & Deployments (1).
9. Build Tools & Development (13+).
10. Language-Specific (30+).
11. Other & Documentation (15+).

### Convenção de ID

Não há ID interno. Identificação é via **nome de pasta** (semântica, não ID
estável).

### Distinção agente × código

**Não explicitada.** Posicionamento da comunidade enfatiza "AI behavior
customization" — i.e., regra para o agente — mas conteúdo prático mistura
livremente preferências de geração de código.

### Categorias de regra observadas

- **Project-specific context** — arquitetura, libs, deps.
- **Code style consistency** — formatting, naming.
- **Team alignment** — práticas compartilhadas.
- **Framework-specific patterns** — React, Vue, Django, FastAPI.

---

## 8. Cline (.clinerules)

### Formato e localização

- **Workspace rules**: `.clinerules/` no projeto. Processa todos `.md` e `.txt`.
- **Global rules**: `Documents/Cline/Rules` (Windows) ou
  `~/Documents/Cline/Rules` (macOS/Linux).

### Compatibilidade cross-tool

Cline lê **também**:

- `.cursorrules` (Cursor).
- `.windsurfrules` (Windsurf).
- `AGENTS.md` (standard cross-tool).

Esse é um sinal forte de que **AGENTS.md está se firmando como standard**
inter-IA.

### Frontmatter (conditional rules)

```yaml
---
paths:
  - "src/components/**"
  - "*.test.ts"
---
```

`paths` aceita globs (`*`, `**`, `?`, `[abc]`, `{a,b}`). Sem frontmatter, regra
ativa universalmente.

### Filosofia

> "Rules como código." Rules são arquivos versionáveis, não text box hidden.

### AI-editable rules

Cline pode **ler, escrever e editar** as próprias rules. Workflow:

> "Se Cline não está seguindo um guideline perfeitamente, peça para refinar a
> rule e ele edita o arquivo para você."

Isso é único entre as ferramentas.

### Toggle UI

Cada regra é toggleable individualmente em painel UI — controle dois níveis
(manual + path-conditional).

### Convenção de ID

Não há. Prefixos numéricos (`01-coding.md`) servem para ordenar.

### Precedência

Workspace rules > global rules em conflitos.

---

## 9. Tabela comparativa

| Ferramenta                | Universal × per-IA                            | Gate humano formal                                                 | Formato de regra                                | Convenção de ID                          | Fronteira spec-a-spec     |
| :------------------------ | :-------------------------------------------- | :----------------------------------------------------------------- | :---------------------------------------------- | :--------------------------------------- | :------------------------ |
| **Spec Kit**              | Constituição única                            | Phase -1 (conceitual, sem artefato dedicado)                       | Prosa Markdown, 9 artigos                       | Articles I–IX                            | Não documentada           |
| **BMAD**                  | `project-context.md` único                    | **Sim** — `bmad-check-implementation-readiness` PASS/CONCERNS/FAIL | Step files com `<halt-condition>`               | Não há                                   | Por artefatos sequenciais |
| **OpenSpec**              | Sem distinção                                 | Implícito (deps as enablers)                                       | RFC 2119 + Given/When/Then                      | Nomes de requirements                    | **Sim** — delta specs     |
| **Continue**              | Apenas universal (workspace + global)         | Não                                                                | Markdown + frontmatter (`globs`, `alwaysApply`) | Prefixo numérico ordena                  | N/A                       |
| **Aider**                 | Apenas universal                              | Não                                                                | Markdown puro (sem frontmatter)                 | Não há                                   | N/A                       |
| **Cursor**                | Apenas universal (com globs)                  | Não                                                                | `.mdc` + frontmatter (`globs`, `description`)   | Pasta = identificador                    | N/A                       |
| **Cline**                 | Workspace × global                            | Não                                                                | `.md`/`.txt` + frontmatter (`paths`)            | Prefixo numérico ordena                  | N/A                       |
| **ai-guidelines** (atual) | **global × per-IA × opt-in × infrastructure** | `decision-brief.md` (proposto Spec 0018)                           | `.md` + tags `<FEATURE_*>` no monolith          | `[BR-*]` em testes / `[DEC-*]` em briefs | Cross-spec referenciado   |

---

## 10. Padrões emergentes

### 10.1 Convergências fortes

- **Markdown + frontmatter YAML** é o vocabulário comum (Continue, Cline,
  Cursor `.mdc`). Aider e Spec Kit ainda em prosa pura.
- **Globs como mecanismo de scope** dominam (Continue `globs`, Cline `paths`,
  Cursor `globs`). Nenhuma ferramenta usa scope semântico-categórico tipo
  "se o agente está em modo planning".
- **AGENTS.md** está se firmando como standard cross-tool — Cline já lê;
  Aider tem issue propondo. Continue tem issue [#6716] pedindo suporte
  a "Agent Rules Standard via Root AGENTS.md".
- **Workflow em 3-4 fases** é convergência: spec → plan → tasks (Spec Kit) /
  proposal → spec → delta → tasks (OpenSpec) / analysis → planning →
  solutioning → implementation (BMAD).
- **"Constitution" / "core principles" file único e imutável** (Spec Kit
  `constitution.md`, BMAD `project-context.md`, ai-guidelines
  `global-rules.md`).

### 10.2 Divergências relevantes

- **Gate humano formal**: só BMAD tem artefato dedicado (PASS/CONCERNS/FAIL).
  Os demais distribuem gates em checklists embutidas ou os deixam implícitos.
- **Distinção spec-pesquisa × spec-implementação**: só OpenSpec dá ferramenta
  formal (delta specs + RFC 2119) e linguagem ("se pode mudar sem mudar
  comportamento, não pertence à spec").
- **Per-IA adapters**: nenhuma ferramenta pesquisada divide rules por
  provider IA. Esta é uma característica distintiva do `ai-guidelines`.
- **AI-editable rules**: só Cline.
- **Toggle UI individual**: só Cline.

### 10.3 Lacunas universais

- **Nenhuma ferramenta formaliza um "decision-brief"** como artefato curto,
  humano-revisável, que **trava** decisões antes do plan/tasks. BMAD chega
  mais perto, mas o foco é validação de prontidão, não captura de decisões
  com IDs estáveis.
- **Nenhuma ferramenta usa IDs estáveis** (`[BR-*]`, `[DEC-*]`) para
  rastreabilidade entre rules ↔ testes ↔ specs. Prefixos numéricos servem
  apenas para ordenação.
- **Nenhuma distingue formalmente "regra para o agente IA" de "regra para o
  código produzido"** — todas misturam livremente.

---

## 11. Implicações para os blocos de decisão

### `[DEC-0018-B01]` — Taxonomia das categorias de regras

**Opções estruturadas observadas:**

- **Opção A — Eixo único (estilo Spec Kit/BMAD):** uma categoria principal
  ("constitution") + sub-tópicos por artigo. Simples, mas não escala para
  per-IA + opt-in + infrastructure.
- **Opção B — Eixo dual universal × scope (estilo Continue/Cursor):**
  global rules + scoped rules via globs/paths. Não captura per-IA nem
  agente-vs-código.
- **Opção C — Eixo trial categorial (`ai-guidelines` atual):** universal
  (`global-rules`), per-provider (`claude/codex/gemini.md`), opt-in editorial
  (TDD/BDD/quality-gates), opt-in infrastructure (prettier/husky/CI). Mais
  rico que qualquer ferramenta pesquisada.
- **Opção D — Categoria adicional "decisão pré-design":** específica do
  framework, sem precedente. Equivale ao decision-brief.
- **Opção E — Categoria adicional "agente-vs-código":** distinção que
  nenhuma ferramenta formaliza, mas que pode ser explicitada (ex.:
  meta-instruções para a IA × instruções sobre o código a produzir).

### `[DEC-0018-B02]` — Colocação por categoria

**Opções estruturadas observadas:**

- **Opção A — Tudo no monolith** (estilo `project-context.md` BMAD): único
  ponto de verdade. Limitação: não há scoping nativo.
- **Opção B — Diretório com prefixos numéricos** (estilo Continue/Cline):
  `.continue/rules/01-*.md`. Bom para ordenação, fraco para taxonomia.
- **Opção C — Diretório com frontmatter scope** (estilo Cursor `.mdc`):
  `.core/rules/*.md` com `globs`/`description`. Permite scope automático.
- **Opção D — Pastas por taxonomia** (estilo `awesome-cursorrules`):
  `.core/rules/{universal,providers,opt-in/editorial,opt-in/infrastructure}/`.
  Modelo já em uso no `ai-guidelines`.
- **Opção E — Decision-briefs em `.specify/specs/<spec>/`:** colocação
  vinculada à spec que origina, não às rules globais. Decisões cravadas
  podem migrar para regras estáveis após archive.

### `[DEC-0018-B06]` — Fronteira com Spec 0011

Spec 0011 trata de governança/distribuição de rules. A pesquisa sugere:

- **OpenSpec delta specs** oferecem modelo de "mudanças à rule baseline"
  que poderia inspirar Spec 0011 — i.e., como uma spec **modifica** rules
  vs **cria** rules novas.
- **Cline AI-editable rules** sugerem que rules podem ter lifecycle ativo
  (não só write-once). Spec 0011 pode considerar primitiva de evolução de
  rules.
- **Constituição imutável (Spec Kit)** sugere o oposto: certas rules são
  imutáveis-por-default; mudanças exigem amendment procedure.
- **Fronteira sugerida**: Spec 0018 define **conteúdo e taxonomia**; Spec
  0011 define **governança da mudança** (quem pode editar, como propagar,
  amendment vs delta).

### `[DEC-0018-B07]` — Fronteira com Spec 0009

Spec 0009 trata de visibilidade pública / npm orgs. A pesquisa não tocou
diretamente esse tema, mas:

- **OpenSpec, Spec Kit, BMAD são todos OSS** e distribuem via npm/pip ou
  download direto. Constituições/rules são **versionadas no repositório do
  consumidor**, não em pacote separado.
- `ai-guidelines` é distintivo por **distribuir o baseline `.core/`** via
  CLI (`init`/`adopt`) e por considerar publicação `@ai-guidelines/core`.
- **Fronteira sugerida**: Spec 0018 define **o que é regra canônica**; Spec
  0009 define **como o canônico é empacotado e publicado**. Não há overlap
  semântico, mas há acoplamento de versionamento (mudança em 0018 deve
  bumpar pacote 0009).

---

## 12. Limitações

- **Acessibilidade variável:** documentação detalhada de cada ferramenta
  varia muito. OpenSpec e Spec Kit têm docs públicas razoáveis; BMAD foi
  acessível via DeepWiki (terceiro). Detalhes de implementação (ex.: schema
  exato de halt-condition em BMAD) podem estar incompletos.
- **Convenções comunitárias × oficiais:** `.cursorrules` taxonomy
  (`technology-focus-cursorrules-prompt-file`) é convenção do
  `awesome-cursorrules`, não da Cursor oficial. Mesma ressalva para Aider
  conventions repo.
- **Velocidade de mudança:** Cursor migrou três vezes de formato
  (`.cursorrules` → `.cursor/index.mdc` → `.cursor/rules/*.mdc`) em três
  anos. Continue migrou de YAML para Markdown. Padrões podem mudar.
- **Não foi acessada documentação completa de presets do Spec Kit** —
  apenas referência conceitual; o conteúdo exato dos `templates/overrides/`
  não foi inspecionado.
- **AGENTS.md como standard cross-tool** é tendência observada mas ainda
  não há especificação formal pública unificada — cada ferramenta
  implementa sua leitura.
- **Esta research não cobre**: Windsurf, Roo Code, Sourcegraph Cody,
  Codeium, Tabnine, Amazon Q. Esses podem ter abordagens distintas.
- **Não foi feita análise de código-fonte** (somente docs e artigos).
  Comportamento real pode divergir de docs em casos pontuais.
- **Stage 1 = research output sem decisões.** Toda escolha entre opções
  acima deve ser cravada via decision-brief humano-revisado.

---

## Apêndice — URLs consultadas

Ver bloco `sources:` no frontmatter. Todas as URLs foram acessadas em
2026-04-30 via WebSearch + WebFetch. Conteúdo extraído sob fair use para fins
de research interna do projeto `ai-guidelines`.
