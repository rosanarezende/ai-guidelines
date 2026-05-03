---
title: Auditoria research-backed dos boilerplates SDD
spec: 0018-rules-content-deepening
bloco: A
sub-bloco: A.0
date: 2026-04-30
status: Stage 1 — research output (sem decisões cravadas)
inputs:
  - .specify/templates/spec-boilerplate.md
  - .specify/templates/plan-boilerplate.md
  - .specify/templates/tasks-boilerplate.md
  - .specify/templates/next-boilerplate.md
  - .specify/templates/research-index-boilerplate.md
  - .specify/templates/roadmap-boilerplate.md
  - .specify/templates/project-config-boilerplate.md
  - .core/process/spec-foundation.md
  - .specify/specs/0008-governance-coherence/{spec,plan,tasks}.md
  - .specify/specs/0015-auditoria-destrutiva/{spec,plan,tasks}.md
  - .specify/specs/0016-adapters-opt-in/{spec,plan,tasks}.md
  - .specify/specs/0017-process-cli-refactor/{spec,plan,tasks}.md
  - .specify/specs/0018-rules-content-deepening/{spec,plan,tasks,decision-brief}.md
informa:
  - "[DEC-0018-A01]" Updates por boilerplate
  - "[DEC-0018-A02]" Estrutura do campo "Tipo de spec"
  - "[DEC-0018-A03]" Localização e formato da política content × infra
  - "[DEC-0018-A04]" Texto da linha em global-rules.md
  - "[DEC-0018-A05]" Formato do decision-brief-boilerplate.md
  - "[DEC-0018-A06]" Localização física da seção "Tipos de spec"
---

# Auditoria research-backed dos boilerplates SDD

> **Output Stage 1 do Sub-bloco A.0 da Spec 0018.** Documento de
> evidência: apresenta inventário, drift, lacunas, ruído e matriz de
> opções. **Não decide** os updates — apenas estrutura as opções para
> alimentar `[DEC-0018-A01]…[DEC-0018-A06]` no `decision-brief.md`.

---

## 1. Sumário executivo

A auditoria cruzou os 7 boilerplates de `.specify/templates/` com (a) a
política canônica em `.core/process/spec-foundation.md` e (b) o
preenchimento real das 5 specs disponíveis (0008, 0015, 0016, 0017 e a
própria 0018-rev1). Três tipos de problema apareceram:

1. **Drift estrutural específico** — campos de boilerplate que specs
   reais ignoraram, e seções ad-hoc que apareceram repetidas vezes sem
   estarem nos templates. O caso mais saliente: **"Decisão de Fusão"** em
   0008 e 0017 (spec-foundation cita-a, mas não há campo formal no
   `spec-boilerplate.md`).
2. **Drift bidirecional vs `spec-foundation.md`** — política tem itens
   que nenhum boilerplate reflete (ex.: "categorias de regras universal
   vs opt-in", "uma spec ativa por vez", "Princípios da Escrita") e
   boilerplates introduzem campos que a política não justifica (ex.:
   "Riscos macro" no spec-boilerplate, "tracker" no roadmap-boilerplate,
   "Itens descartados deliberadamente" no next-boilerplate).
3. **Heterogeneidade de gênero não tratada** — 4 boilerplates são
   **per-spec** (`spec`, `plan`, `tasks`, `next`); 3 são **one-time por
   repositório** (`research-index`, `roadmap`, `project-config`). O
   tasks.md de cada spec mistura inadvertidamente políticas de ambos
   (Fase 3 manda atualizar `roadmap/historico.md` etc.). Sem essa
   distinção, o boilerplate fica ambíguo.

A spec 0018 introduz um **8º artefato** (`decision-brief.md`) sem
boilerplate ainda — o dogfood desta primeira instância informa
`[DEC-0018-A05]`.

---

## 2. A.0.1 — Inventário dos 7 boilerplates

### 2.1 Boilerplates per-spec (4)

| Boilerplate            | Propósito declarado                                                          | Campos canônicos                                                                                                                                                                                                                                                                                                                                                          |
| :--------------------- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `spec-boilerplate.md`  | Captura "porquê e contrato"; imutável após `In Review`                       | Header (Status `Draft \| In Review \| Active \| Paused \| Pivoted \| Cancelled \| Done`, Author, Date, Owner, Plan); 🎯 Objetivo (1-3 §); 📦 Escopo (Dentro/Fora); ✅ Critérios de Aceite alto-nível; 🔬 Pesquisa de contexto (opcional, aponta a `research/synthesis.md`); 🛠️ Dependências e impactos (Pré-requisitos, Specs afetadas, Riscos macro); 📚 Referências     |
| `plan-boilerplate.md`  | "Como" técnico vivo; atualiza durante execução                               | Header (Status `Draft \| Active \| Done`); 🏗️ Design e Arquitetura (Princípio guia 2-4 ℓ + Componentes/Sub-blocos com `Estado atual` + `Decisão` + `Mudanças em arquivos`); ✅ DoD operacional por componente + globais; 🧪 Estratégia de Testes (Unit/BDD, Integração, Manual); 🛠️ Arquivos modificados (esperado); ⚠️ Riscos técnicos (tabela); 📐 Decisões revisitadas |
| `tasks-boilerplate.md` | Progresso operacional; checklist `[ ]`/`[x]` vivo                            | Header; **Fase 0** (7 itens: branch, spec, **[MANDATÓRIO] validação humana**, plan/tasks, roadmap/backlog, research, synthesis); **Fase 1** (sub-blocos por componente); **Fase 2** (Validação cruzada e PR — 5 itens); **Fase 3** (Encerramento, **[MANDATÓRIO]** — 5 itens: NEXT, research migration, status Done, roadmap migration, "feche antes de abrir nova")      |
| `next-boilerplate.md`  | Backlog de débitos adiados; **deletado no encerramento** (Fase 3.1 do tasks) | Header (advertência "deletar no encerramento"); 🏛️ Insights e Débitos Adiados (Problema/Insight/Ação por item); ✂️ Itens descartados deliberadamente; rodapé sobre lifecycle                                                                                                                                                                                              |

### 2.2 Boilerplates one-time por repositório (3)

| Boilerplate                     | Propósito declarado                                                                                           | Campos canônicos                                                                                                                                                                                                           |
| :------------------------------ | :------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `research-index-boilerplate.md` | Formato canônico de `.specify/specs/research-index.md` — RAG orgânico do repo                                 | Estrutura por categoria (emojis sugeridos: 🏛️ 🏗️ 🛸 🔬 📐); regras de uso (categoria nova ≥ 2 estudos; ≤ 6 categorias); formato de entrada `[título](path) _(descrição ≤80c)_`                                             |
| `roadmap-boilerplate.md`        | Formato canônico dos 2 arquivos `roadmap/historico.md` + `roadmap/backlog.md` (decisão Spec 0008 sub-bloco B) | `historico.md`: Specs concluídas + Specs absorvidas (imutável). `backlog.md`: Em execução / Now / Next / Later / Bloqueadores cross-spec / Itens oportunistas; campo opcional `tracker`; "repo-first, integração-friendly" |
| `project-config-boilerplate.md` | **NÃO versionado**; copia para `~/.{ai}/projects.md` para fornecer contexto local de projetos à IA            | Projetos Ativos (placeholders); Referências Úteis; Exemplo preenchido                                                                                                                                                      |

**Observação editorial não-óbvia:** os 3 boilerplates one-time têm
políticas e regras de uso embutidas que **se sobrepõem** ao que
`spec-foundation.md` deveria conter (e parcialmente contém). Isso é uma
forma de drift: o `roadmap-boilerplate.md`, por exemplo, canoniza a
"Política repo-first, integração-friendly" e o campo `tracker` —
políticas que **não aparecem** em `spec-foundation.md`.

---

## 3. A.0.2 — Drift estrutural (boilerplate × specs reais)

### 3.1 Tabela síntese

| Spec     | Status real registrado              | Campos não-boilerplate adicionados                                                                                                                                                              | Campos boilerplate omitidos                                                                                                                                                                                                                  | Volume "Decisões revisitadas"              |
| :------- | :---------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------- |
| **0008** | `Done (PR #1 merged - 2026-04-28)`  | spec.md: 🧠 **Decisão de Fusão** (critério + análise + conclusão); subseções extras em "Dependências e impactos" ("Decisão de visibilidade pública")                                            | _(nenhum significativo — usou todos)_                                                                                                                                                                                                        | **~30 entradas** inline com data (inflado) |
| **0015** | `Done (PR #22 merged - 2026-04-28)` | spec.md: nenhum                                                                                                                                                                                 | spec.md: 🔬 Pesquisa de contexto (correto, sem research significativa). tasks.md: Fase 2 truncada (sem 2.3/2.4/2.5); Fase 3 ausente                                                                                                          | Nenhuma — plan curto                       |
| **0016** | `Pivoted` (raw)                     | spec.md: 🛑 **Post-mortem / Motivo do Pivot**                                                                                                                                                   | spec.md: 🔬 Pesquisa de contexto. tasks.md: provável Fase 2/3 truncadas (status Pivoted)                                                                                                                                                     | Nenhuma — plan curto                       |
| **0017** | `DONE` (raw, caps inconsistente)    | spec.md: nomenclatura **divergente** (`📐 Escopo técnico`, `🚫 Out of scope`, `⚠️ Riscos e invariantes`). plan.md: `## ⚠️ Riscos e Portões de Qualidade (Quality Gates)` (mistura terminologia) | spec.md: ✅ Critérios de Aceite (alto nível) **ausente**; 📚 Referências ausente; 🔬 Pesquisa de contexto não declarada (havia research). tasks.md: Fase 3 truncada (apenas 3.1 e 3.2; sem migrar research, sem "feche antes de abrir nova") | Inline misturado nas seções                |
| **0018** | `Draft (revised 2026-04-30)`        | spec.md: ponteiro **Decision Brief** no header. plan.md: 📎 **Anexo — Conteúdo candidato pré-research**, "Stage 1 + Stage 2 placeholder", "Princípio guia" expandido                            | _(nenhum — usa todos)_                                                                                                                                                                                                                       | 2 entradas estruturadas                    |

### 3.2 Padrões emergentes (frequência ≥ 2 specs)

| Padrão emergente                                                              | Specs onde aparece                  | Comentário                                                                                                                                  |
| :---------------------------------------------------------------------------- | :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **Decisão de Fusão** (critério + análise + conclusão)                         | 0008, 0017                          | `spec-foundation.md` cita ("decisão de fusão (se aplicável — com critério)"). Sem campo no boilerplate.                                     |
| **Status composto** (`Done (PR #X merged - YYYY-MM-DD)`, `Draft (revised …)`) | 0008, 0015, 0017, 0018              | Convenção emergente; boilerplate só aceita valores nus.                                                                                     |
| **"Decisões revisitadas" como log inflável**                                  | 0008 (~30), 0017 (inline misturado) | Sem cap; sem formato padronizado. Spec 0018 começou a estruturar.                                                                           |
| **Cross-refs explícitos com specs irmãs como subseção**                       | 0008, 0018                          | Boilerplate só reserva "Specs afetadas" em "Dependências e impactos" e "Specs relacionadas" em "Referências". Nada formal sobre fronteiras. |
| **Pesquisa de contexto omitida no spec.md** (mesmo havendo research)          | 0017                                | 0017 fez 2 researches (concurrency, compliance) e não declarou em `spec.md`. Drift.                                                         |
| **Fase 3 truncada** (encerramento incompleto)                                 | 0015, 0016, 0017                    | Apenas 0008 e 0018 (em curso) seguiram a Fase 3 do boilerplate.                                                                             |
| **Anexo / Conteúdo candidato pré-research**                                   | 0018                                | Útil quando há rascunho mergeado a reconciliar. Único caso por enquanto.                                                                    |
| **Post-mortem / Motivo do Pivot**                                             | 0016                                | Boilerplate aceita status `Pivoted` mas não orienta como documentar.                                                                        |

---

## 4. A.0.3 — Cross-check com `.core/process/spec-foundation.md`

### 4.1 Política presente em `spec-foundation.md` mas ausente nos boilerplates

| Política                                                                                                               | Localização (spec-foundation)                              | Onde deveria refletir                                                                  |
| :--------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| **Decisão de fusão (se aplicável — com critério)**                                                                     | Hierarquia § "spec.md — imutável após In Review" bullet 3  | Campo opcional dedicado em `spec-boilerplate.md`                                       |
| **Categorias de regras universal vs opt-in de stack**                                                                  | Seção "Categorias de regras"                               | Nenhum boilerplate reflete; relevante para tasks de promoção de regras                 |
| **Princípios da Escrita** (Agnosticismo / BR ID / Contratos)                                                           | Seção "Princípios da Escrita"                              | Nenhum boilerplate referencia                                                          |
| **SDD Guardrails** (Validação Humana Obrigatória, "Não comece a codar sem plan.md aprovado", "Uma spec ativa por vez") | Seção "SDD Guardrails"                                     | tasks-boilerplate referencia parcialmente (`[MANDATÓRIO]` em 0.3 e 3.5)                |
| **Política de research lifecycle** (rename `YYYY-MM-DD-`, mover para `.specify/specs/researchs/<domínio>/`, indexar)   | Seção "research/" + "Checklist de fechamento"              | tasks-boilerplate Fase 3.2 é menos detalhado que a política                            |
| **Critério para spec-foundation vs plano leve** (> 1 sessão, > 1 arquivo, sobreviver a troca de IA)                    | Seção "Quando usar spec-foundation"                        | Nenhum boilerplate reflete (esperado — é gate antes de instanciar)                     |
| **Numeração de specs** (slug semântico → número só na branch)                                                          | Seção "Numeração de specs"                                 | tasks-boilerplate Fase 0.1 menciona `feat/spec-XXXX-<slug>` mas não explica o critério |
| **Bootstrap obrigatório do agente (ler `roadmap/backlog.md` no início de cada sessão)**                                | Implícito via CLAUDE.md raiz e Spec 0017 A.3 (AGENTS-core) | tasks-boilerplate Fase 0 não inclui                                                    |

### 4.2 Boilerplates introduzem campos não justificados em `spec-foundation.md`

| Campo / política                                                       | Boilerplate                                        | Justificativa em `spec-foundation.md`                                                                                                                     |
| :--------------------------------------------------------------------- | :------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Riscos macro" como subseção formal                                    | `spec-boilerplate.md`                              | Política só fala em "Dependências macro entre specs" — não em "riscos macro" formalmente                                                                  |
| "Decisões revisitadas" como log estruturado                            | `plan-boilerplate.md`                              | Política diz "Decisões revisitadas — registro cumulativo de mudanças de rota (data, o que mudou, por quê)" — só citação solta, sem padrão de cap, formato |
| "Itens descartados deliberadamente"                                    | `next-boilerplate.md`                              | Não referenciado em `spec-foundation.md`                                                                                                                  |
| Campo opcional `tracker` + "repo-first, integração-friendly"           | `roadmap-boilerplate.md`                           | Não em `spec-foundation.md` (canonizado apenas no boilerplate)                                                                                            |
| Categorias de research-index com emojis (🏛️ 🏗️ 🛸 🔬 📐)               | `research-index-boilerplate.md`                    | Não em `spec-foundation.md`                                                                                                                               |
| Política de NEXT.md "criar quando há débitos; deletar no encerramento" | `next-boilerplate.md` + `tasks-boilerplate.md` 3.1 | Em `spec-foundation.md` (Hierarquia § NEXT.md) — coerente, mas **trigger de criação** não está em nenhum tasks (apenas trigger de deleção)                |

### 4.3 Gap canônico: tipo de spec (conteúdo × infra)

Nenhum dos dois (boilerplate ou `spec-foundation.md`) classifica specs
por tipo de entrega. O argumento desta spec 0018 (rev1, frase de objetivo)
e o histórico real (0017 sendo claramente "infra"; 0018 claramente
"conteúdo"; 0008 mista) tornam isso uma lacuna substantiva — alimenta
`[DEC-0018-A02]` e `[DEC-0018-A06]`.

---

## 5. A.0.4 — Lacunas trazidas pela prática

> Cada item abaixo é **opção candidata** para um ou mais pontos
> `[DEC-*]`. **Nenhuma decisão final tomada aqui** — apenas estrutura.

| #   | Lacuna observada                                                                    | Frequência (specs)                     | Boilerplate(s) afetado(s)                     | Ponto `[DEC-*]` que alimenta                   |
| :-- | :---------------------------------------------------------------------------------- | :------------------------------------- | :-------------------------------------------- | :--------------------------------------------- |
| L1  | "Decisão de Fusão" como campo formal opcional                                       | 0008, 0017                             | `spec-boilerplate.md`                         | `[DEC-0018-A01]` linha spec                    |
| L2  | "Decisões revisitadas" — formato + cap + política de migração no encerramento       | 0008 (inflou), 0017, 0018              | `plan-boilerplate.md`                         | `[DEC-0018-A01]` linha plan                    |
| L3  | "Tipo de spec" como campo (`conteúdo` \| `infraestrutura` \| `mista`)               | _(nova)_                               | `spec-boilerplate.md`                         | `[DEC-0018-A01]`, `[DEC-0018-A02]`             |
| L4  | "Cross-refs com specs irmãs" (spec, fronteira, motivo) como subseção dedicada       | 0008, 0018                             | `spec-boilerplate.md`                         | `[DEC-0018-A01]` linha spec                    |
| L5  | "Conteúdo candidato pré-research" (Anexo) opcional em plan                          | 0018                                   | `plan-boilerplate.md`                         | `[DEC-0018-A01]` linha plan                    |
| L6  | "Post-mortem / Motivo do Pivot" opcional quando status `Pivoted \| Cancelled`       | 0016                                   | `spec-boilerplate.md`                         | `[DEC-0018-A01]` linha spec                    |
| L7  | "Status composto" como convenção formal (`Done (PR #X — YYYY-MM-DD)`)               | 0008, 0015, 0017, 0018                 | spec/plan/tasks                               | `[DEC-0018-A01]` (header de cada)              |
| L8  | "Decision Brief" como ponteiro no header de spec.md (specs de conteúdo)             | 0018                                   | `spec-boilerplate.md`                         | `[DEC-0018-A01]`, `[DEC-0018-A05]`             |
| L9  | "Stage 1 / Stage 2 placeholder" estrutural (specs de conteúdo)                      | 0018                                   | `plan-boilerplate.md`, `tasks-boilerplate.md` | `[DEC-0018-A02]`, `[DEC-0018-A06]`             |
| L10 | "Validação Humana" em mais gates além de Fase 0.3 e Fase 3.5                        | 0018 (introduziu 0.9 e Fase 3 do gate) | `tasks-boilerplate.md`                        | `[DEC-0018-A01]`, `[DEC-0018-A02]`             |
| L11 | "Migração de research" no encerramento — sincronizar tasks.md ↔ spec-foundation     | 0008, 0015, 0017                       | `tasks-boilerplate.md` Fase 3.2               | `[DEC-0018-A01]` linha tasks, `[DEC-0018-A03]` |
| L12 | "Bootstrap obrigatório (ler backlog.md)" como Fase 0 explícita                      | _(do CLAUDE.md raiz e 0017 A.3)_       | `tasks-boilerplate.md` Fase 0                 | `[DEC-0018-A01]` linha tasks                   |
| L13 | Critério de numeração explicado dentro do tasks-boilerplate Fase 0.1                | _(política em spec-foundation)_        | `tasks-boilerplate.md`                        | `[DEC-0018-A01]` linha tasks                   |
| L14 | "Princípios da Escrita" referenciados no spec-boilerplate                           | _(política em spec-foundation)_        | `spec-boilerplate.md`                         | `[DEC-0018-A01]` linha spec                    |
| L15 | "Categorias universal vs opt-in" referenciadas em tasks quando há promoção de regra | 0008                                   | `tasks-boilerplate.md` Fase 1                 | `[DEC-0018-A01]` linha tasks                   |
| L16 | "Decision Brief" como 8º artefato per-spec — boilerplate dedicado                   | 0018 (hand-rolled)                     | _(novo)_ `decision-brief-boilerplate.md`      | `[DEC-0018-A05]`                               |

---

## 6. A.0.5 — Ruído removível (campos/seções nunca preenchidos)

| #   | Campo / seção                                                         | Boilerplate                    | Status real                                                                                                                 | Recomendação (a confirmar pós-gate)                                                         |
| :-- | :-------------------------------------------------------------------- | :----------------------------- | :-------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------ |
| R1  | Prescrição literal de `research/synthesis.md` como nome de arquivo    | `spec-boilerplate.md` linha 56 | 0008 usou `synthesis.md`; 0015/0016 omitiram (sem research); 0017 nomeou diferente; 0018 substituiu por `decision-brief.md` | **Revisar**: campo neutro "Pesquisa de contexto" sem prescrever nome `synthesis.md`         |
| R2  | "✂️ Itens descartados deliberadamente"                                | `next-boilerplate.md`          | Nenhuma das 5 specs usou                                                                                                    | **Revisar**: downgrade para opcional ou cortar                                              |
| R3  | "0.6 Pesquisa inicial em research/" + "0.7 Síntese consolidada"       | `tasks-boilerplate.md` Fase 0  | 0015 não tinha research; 0016 mínima; 0017 fez (mas omitiu em spec); 0008/0018 fizeram                                      | **Revisar**: condicional ao "Tipo de spec" — obrigatório para conteúdo, opcional para infra |
| R4  | "2.3 CHANGELOG.md atualizado" como mandatório                         | `tasks-boilerplate.md` Fase 2  | 0015 não fez (escopo destrutivo interno); 0008/0017 fizeram                                                                 | **Revisar**: explicitar quando obrigatório (mudança de comportamento publicada)             |
| R5  | "2.4 PR Draft via gh pr create --draft" + "2.5 revisão humana"        | `tasks-boilerplate.md` Fase 2  | 0015 simplificou (apenas 2.1 + 2.2); 0016 nem chegou na Fase 2                                                              | **Manter**, mas ajustar redação para tolerar Pivoted/Cancelled                              |
| R6  | "3.5 Confirmar nenhuma spec subsequente aberta antes do encerramento" | `tasks-boilerplate.md` Fase 3  | Apenas 0008 e 0018 verificáveis; 0015/0016/0017 truncaram Fase 3                                                            | **Manter** — política coerente com `spec-foundation.md` "uma spec ativa por vez"            |
| R7  | "Princípio guia" 2-4 linhas estritas no plan                          | `plan-boilerplate.md`          | 0008 com tabela ASCII (~10 ℓ); 0015/0016 com 1 ℓ; 0017 com 1 §; 0018 com 5 §                                                | **Manter** sem cap rígido — variação é legítima por escopo                                  |

---

## 7. A.0.6 — Dogfood do `decision-brief.md` (informa `[DEC-0018-A05]`)

### 7.1 O que funcionou (manter no boilerplate)

| #   | Aspecto                                                                                           | Por quê funcionou                                                                            |
| :-- | :------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------- |
| D1  | Convenção `[DEC-NNNN-XYZ]` (NNNN = spec; XYZ = sub-bloco + sequência)                             | Paralela aos `[BR-*]` da CLI; permite cross-ref bidirecional brief ↔ plan ↔ tasks ↔ research |
| D2  | Status agregado (`Open` \| `Partial` \| `Resolved`) + status por ponto (`Pendente` \| `Resolved`) | Permite paralelismo entre pontos; gate explícito                                             |
| D3  | Bloco "Decisão" (escolha + justificativa + data + owner) por ponto                                | Estrutura de ADR aplicada granularmente — cada decisão é auditável                           |
| D4  | Tabela "Resumo de status" no final                                                                | Scan rápido sem rolar o documento                                                            |
| D5  | Distinção "Contexto (research)" + "Opções" + "Decisão"                                            | Separa input (factual) da decisão (volitiva)                                                 |
| D6  | "Recomendação inicial (a confirmar pós-gate)" — visto apenas em `[DEC-0018-A06]`                  | Ajuda owner a navegar opções sem retravar decisão                                            |
| D7  | "Última atualização" no header                                                                    | Data fresca evita brief virar fóssil                                                         |

### 7.2 O que precisa ajuste para o boilerplate

| #   | Lacuna no dogfood                                                                                                         | Opção candidata                                                                                                           |
| :-- | :------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------ |
| D8  | "Recomendação inicial" não está padronizada — só A06 tem; outros pontos não                                               | Definir se mandatória ou opcional. Se opcional, gatilho ("quando opção dominante existe"); se mandatória, formato curto   |
| D9  | Tradeoffs em tabela (Pró/Contra) — só A06 fez                                                                             | Padronizar formato de "Opções" (tabela vs lista) no boilerplate                                                           |
| D10 | "Resumo de status" duplica info dos headers individuais                                                                   | Tornar gerado por script ou cortar uma das duas representações                                                            |
| D11 | Falta legenda no topo listando todos os valores possíveis de status (`Open`, `Partial`, `Resolved`, `Pendente`)           | Adicionar legenda canônica no boilerplate                                                                                 |
| D12 | "Pontos novos podem ser adicionados durante Stage 1" mencionado no header, mas sem rotina canonizada (quando, quem, como) | Documentar regra explícita: novo ponto exige nota de origem (research que o expôs); IDs sequenciais sem reaproveitar gaps |
| D13 | "Owner por decisão" — útil para specs colaborativas, redundante quando há owner único da spec                             | Tornar opcional, default = owner da spec                                                                                  |
| D14 | Falta link cruzado entre `[DEC-*]` e o(s) arquivo(s) `research/` que populam "Contexto (research)"                        | Convenção: bullet em "Contexto (research)" linka diretamente para o arquivo research                                      |
| D15 | "Decisão pré-research vazando" como anti-pattern não tem check no brief — apenas no `plan.md` Riscos                      | Adicionar nota no boilerplate: opções devem citar research; opção sem research é red flag e exige nota de exceção         |
| D16 | Gate explícito (transição `Open → Partial → Resolved`) não tem checkbox/lista de "Gate fechado"                           | Adicionar bloco final "Gate" com data + nome do owner + checkbox por ponto resolvido                                      |
| D17 | Boilerplate não orienta o que muda em `spec.md` / `plan.md` / `tasks.md` após o gate (transição Stage 1 → Stage 2)        | Documentar checklist pós-gate (ex.: "atualizar plan.md v2", "reescrever tasks.md Fase 4+", "atualizar status do brief")   |
| D18 | "Decision Brief" header de spec.md não está canonizado (foi adicionado ad-hoc em 0018-rev1)                               | Adicionar campo opcional `Decision Brief: [./decision-brief.md]` no spec-boilerplate.md (gatilho: spec de conteúdo)       |

---

## 8. A.0.7 — Matriz canônica boilerplate × manter | revisar | adicionar | remover

> **Não decide nada.** Cada célula apresenta a evidência e o ponto
> `[DEC-*]` que a opção alimenta. Decisões finais ocorrem no
> `decision-brief.md` pós-gate.

### 8.1 `spec-boilerplate.md`

| Eixo      | Item                                                                                                                                 | Justificativa / evidência                                                                           | Alimenta              |
| :-------- | :----------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- | :-------------------- |
| Manter    | Header (Status, Author, Date, Owner, Plan)                                                                                           | Usado consistentemente por todas as 5 specs                                                         | `[DEC-0018-A01]`      |
| Manter    | 🎯 Objetivo, 📦 Escopo, ✅ Critérios de Aceite alto-nível, 📚 Referências                                                            | Usado consistentemente; problema apenas em 0017 (omitiu Critérios alto-nível e Referências)         | `[DEC-0018-A01]`      |
| Manter    | 🛠️ Dependências e impactos                                                                                                           | Usado consistentemente, com pequenas variações                                                      | `[DEC-0018-A01]`      |
| Revisar   | Header `Status` enum (`Draft \| In Review \| Active \| Paused \| Pivoted \| Cancelled \| Done`) com convenção de **status composto** | Specs reais usaram `Done (PR #X merged - YYYY-MM-DD)`, `Draft (revised YYYY-MM-DD)`. Sem convenção. | `[DEC-0018-A01]` (L7) |
| Revisar   | 🔬 Pesquisa de contexto: prescrição literal de `research/synthesis.md`                                                               | 0008 sim; 0015/0016 omitiram; 0017 nomeou diferente; 0018 substituiu por brief                      | `[DEC-0018-A01]` (R1) |
| Revisar   | "Riscos macro" — não justificado em `spec-foundation.md`                                                                             | Drift bidirecional § 4.2                                                                            | `[DEC-0018-A01]`      |
| Adicionar | Campo **Tipo de spec** (`conteúdo` \| `infraestrutura` \| `mista`) no header                                                         | Lacuna L3; sustenta `[DEC-0018-A02]`                                                                | `[DEC-0018-A02]`      |
| Adicionar | Campo opcional **Decision Brief** no header (gatilho: tipo `conteúdo` ou `mista`)                                                    | Lacuna L8; D18                                                                                      | `[DEC-0018-A05]`      |
| Adicionar | Subseção opcional 🧠 **Decisão de Fusão** (critério + análise + conclusão)                                                           | Lacuna L1; visto em 0008 e 0017; citado em `spec-foundation.md`                                     | `[DEC-0018-A01]`      |
| Adicionar | Subseção opcional 🛑 **Post-mortem / Motivo do Pivot** (gatilho: status `Pivoted` ou `Cancelled`)                                    | Lacuna L6; visto em 0016                                                                            | `[DEC-0018-A01]`      |
| Adicionar | Subseção opcional **Cross-refs com specs irmãs** (spec, fronteira, motivo) — em "Dependências"                                       | Lacuna L4; visto em 0008 e 0018                                                                     | `[DEC-0018-A01]`      |
| Adicionar | Referência cruzada para "Princípios da Escrita" de `spec-foundation.md`                                                              | Lacuna L14                                                                                          | `[DEC-0018-A01]`      |
| Remover   | _(nenhum item totalmente removível identificado)_                                                                                    | —                                                                                                   | —                     |

### 8.2 `plan-boilerplate.md`

| Eixo      | Item                                                                                                    | Justificativa / evidência                                 | Alimenta                           |
| :-------- | :------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------- | :--------------------------------- |
| Manter    | 🏗️ Design e Arquitetura (Princípio guia + Componentes/Sub-blocos com Estado atual / Decisão / Mudanças) | Usado consistentemente; útil                              | `[DEC-0018-A01]`                   |
| Manter    | ✅ DoD operacional, 🧪 Estratégia de Testes, 🛠️ Arquivos modificados, ⚠️ Riscos técnicos                | Usado consistentemente                                    | `[DEC-0018-A01]`                   |
| Revisar   | 📐 **Decisões revisitadas**: formato + cap + política de migração no encerramento                       | Lacuna L2; 0008 inflou para ~30 entradas; sem padrão      | `[DEC-0018-A01]`                   |
| Revisar   | "Princípio guia" 2-4 linhas estritas                                                                    | R7 — variação real de 1 ℓ a 5 §; cap rígido não funcionou | `[DEC-0018-A01]`                   |
| Adicionar | Bloco **Stage 1 / Stage 2 placeholder** (gatilho: tipo `conteúdo`)                                      | Lacuna L9; visto em 0018-rev1                             | `[DEC-0018-A02]`, `[DEC-0018-A06]` |
| Adicionar | Subseção opcional 📎 **Anexo — Conteúdo candidato pré-research**                                        | Lacuna L5; visto em 0018-rev1 (b9efb83)                   | `[DEC-0018-A01]`                   |
| Remover   | _(nenhum item totalmente removível)_                                                                    | —                                                         | —                                  |

### 8.3 `tasks-boilerplate.md`

| Eixo      | Item                                                                                                       | Justificativa / evidência                                                | Alimenta                           |
| :-------- | :--------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------- | :--------------------------------- |
| Manter    | Estrutura Fase 0 → 1 → 2 → 3                                                                               | Usado por todas as specs; espelha lifecycle de `spec-foundation.md`      | `[DEC-0018-A01]`                   |
| Manter    | **[MANDATÓRIO]** em 0.3 (validação humana inicial) e 3.5 (uma spec ativa)                                  | Política espelha `SDD Guardrails` de `spec-foundation.md`                | `[DEC-0018-A01]`                   |
| Revisar   | Fase 0.6 "Pesquisa inicial" + 0.7 "Síntese consolidada" prescritivos                                       | R3 — 0015 não tinha research; condicional ao tipo de spec                | `[DEC-0018-A01]`, `[DEC-0018-A02]` |
| Revisar   | Fase 2.3 "CHANGELOG.md" como mandatório                                                                    | R4 — 0015 não fez; gatilho deve ser "mudança de comportamento publicada" | `[DEC-0018-A01]`                   |
| Revisar   | Fase 3.2 "research migration" — menos detalhado que `spec-foundation.md`                                   | Lacuna L11; sincronizar com política completa (renomeia + move + indexa) | `[DEC-0018-A01]`, `[DEC-0018-A03]` |
| Adicionar | Fase 0 explícita "0.X Bootstrap: ler `roadmap/backlog.md`"                                                 | Lacuna L12; canonizado em CLAUDE.md raiz e Spec 0017 A.3 (AGENTS-core)   | `[DEC-0018-A01]`                   |
| Adicionar | Fase 0 explícita sobre **critério de numeração** (slug → número apenas na branch)                          | Lacuna L13; política em `spec-foundation.md`                             | `[DEC-0018-A01]`                   |
| Adicionar | Bloco **Fase 1.5 / Gate humano** (gatilho: tipo `conteúdo`) — espelha o padrão de 0018                     | Lacuna L9; visto em 0018-rev1 (Fase 3 do tasks atual = Gate)             | `[DEC-0018-A02]`, `[DEC-0018-A06]` |
| Adicionar | "Validação Humana" em mais gates (entre Stage 1 e Stage 2) — gatilho: tipo `conteúdo`                      | Lacuna L10                                                               | `[DEC-0018-A01]`, `[DEC-0018-A02]` |
| Adicionar | Quando há promoção de regra: classificar como **universal vs opt-in** (referência ao `spec-foundation.md`) | Lacuna L15; visto em 0008                                                | `[DEC-0018-A01]`                   |
| Remover   | _(nenhum item totalmente removível)_                                                                       | —                                                                        | —                                  |

### 8.4 `next-boilerplate.md`

| Eixo      | Item                                                                           | Justificativa / evidência                                                                 | Alimenta         |
| :-------- | :----------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- | :--------------- |
| Manter    | Header advertindo "deletar no encerramento (Fase 3.1 do tasks.md)"             | Lifecycle canônico em `spec-foundation.md`                                                | `[DEC-0018-A01]` |
| Manter    | 🏛️ Insights e Débitos Adiados (Problema/Insight/Ação por item)                 | Forma usada em todas as specs que tiveram NEXT.md                                         | `[DEC-0018-A01]` |
| Revisar   | ✂️ "Itens descartados deliberadamente"                                         | R2 — nenhuma das 5 specs usou; downgrade ou corte                                         | `[DEC-0018-A01]` |
| Adicionar | Trigger explícito de **criação** (não apenas deleção) — quando criar o NEXT.md | `spec-foundation.md` cita "criar quando há débitos"; tasks-boilerplate só fala de deleção | `[DEC-0018-A01]` |
| Remover   | _(considerar)_ "Itens descartados deliberadamente" se mantida nunca-usada      | R2                                                                                        | `[DEC-0018-A01]` |

### 8.5 `research-index-boilerplate.md`

| Eixo      | Item                                                                                  | Justificativa / evidência                         | Alimenta         |
| :-------- | :------------------------------------------------------------------------------------ | :------------------------------------------------ | :--------------- |
| Manter    | Estrutura de categorias com emojis sugeridos                                          | Padrão estável do repo; sem evidência de problema | `[DEC-0018-A01]` |
| Manter    | Regras de uso (≥ 2 estudos por categoria; ≤ 6 categorias)                             | Heurística razoável                               | `[DEC-0018-A01]` |
| Revisar   | Sincronizar política de research lifecycle com `spec-foundation.md` (renomeia + move) | Drift bidirecional § 4.2                          | `[DEC-0018-A03]` |
| Adicionar | _(nenhum item óbvio)_                                                                 | —                                                 | —                |
| Remover   | _(nenhum)_                                                                            | —                                                 | —                |

### 8.6 `roadmap-boilerplate.md`

| Eixo      | Item                                                                            | Justificativa / evidência                                                    | Alimenta                           |
| :-------- | :------------------------------------------------------------------------------ | :--------------------------------------------------------------------------- | :--------------------------------- |
| Manter    | Split `historico.md` (passado, imutável) + `backlog.md` (presente/futuro, vivo) | Decisão Spec 0008 sub-bloco B — estável                                      | `[DEC-0018-A01]`                   |
| Manter    | Princípio "repo-first, integração-friendly" + campo opcional `tracker`          | Útil; se aceito, **promover** para `spec-foundation.md` (drift atual: § 4.2) | `[DEC-0018-A01]`, `[DEC-0018-A03]` |
| Revisar   | Localização da política "repo-first" (boilerplate vs `spec-foundation.md`)      | Drift bidirecional § 4.2                                                     | `[DEC-0018-A03]`                   |
| Adicionar | _(nenhum item óbvio)_                                                           | —                                                                            | —                                  |
| Remover   | _(nenhum)_                                                                      | —                                                                            | —                                  |

### 8.7 `project-config-boilerplate.md`

| Eixo      | Item                                             | Justificativa / evidência                    | Alimenta         |
| :-------- | :----------------------------------------------- | :------------------------------------------- | :--------------- |
| Manter    | NÃO versionado; copia para `~/.{ai}/projects.md` | Política coerente; sem evidência de problema | `[DEC-0018-A01]` |
| Manter    | Lista de IAs alvo (Gemini, Claude, Codex)        | Coerente com adapters do framework           | `[DEC-0018-A01]` |
| Revisar   | _(nenhum item óbvio)_                            | —                                            | —                |
| Adicionar | _(nenhum item óbvio)_                            | —                                            | —                |
| Remover   | _(nenhum)_                                       | —                                            | —                |

### 8.8 8º artefato — `decision-brief-boilerplate.md` (novo)

| Eixo      | Item                                                                                                 | Justificativa / evidência                 | Alimenta         |
| :-------- | :--------------------------------------------------------------------------------------------------- | :---------------------------------------- | :--------------- |
| Adicionar | Header (Status agregado, Última atualização, ponteiros para spec/plan/tasks)                         | D7; visto em 0018-rev1                    | `[DEC-0018-A05]` |
| Adicionar | Convenção `[DEC-NNNN-XYZ]`                                                                           | D1                                        | `[DEC-0018-A05]` |
| Adicionar | Bloco por ponto: Pergunta + Contexto (research) + Opções + Recomendação inicial (opcional) + Decisão | D3, D5, D6                                | `[DEC-0018-A05]` |
| Adicionar | Tabela de Resumo de status no final                                                                  | D4 (avaliar duplicação com headers — D10) | `[DEC-0018-A05]` |
| Adicionar | Legenda canônica de status (Open \| Partial \| Resolved \| Pendente)                                 | D11                                       | `[DEC-0018-A05]` |
| Adicionar | Rotina de "Pontos novos" (quando, quem, IDs sequenciais)                                             | D12                                       | `[DEC-0018-A05]` |
| Adicionar | Convenção de link entre `[DEC-*]` e arquivo(s) `research/` em "Contexto (research)"                  | D14                                       | `[DEC-0018-A05]` |
| Adicionar | Bloco final "Gate" (data, owner, checkbox por ponto)                                                 | D16                                       | `[DEC-0018-A05]` |
| Adicionar | Checklist pós-gate (atualizar plan v2, tasks v2, status do brief)                                    | D17                                       | `[DEC-0018-A05]` |
| Adicionar | Nota anti-pattern "decisão pré-research" (opção sem research é red flag, exige nota)                 | D15                                       | `[DEC-0018-A05]` |

---

## 9. Síntese para o `decision-brief.md`

Esta auditoria sustenta as opções a popular nos pontos do Bloco A:

- `[DEC-0018-A01]` — uma linha por boilerplate na tabela "Updates por
  boilerplate" recebe os bullets concretos das seções 8.1–8.7 + criação
  do 8º (8.8).
- `[DEC-0018-A02]` — campo "Tipo de spec" em `spec-boilerplate.md`:
  valores candidatos `conteúdo \| infraestrutura \| mista`; default a
  decidir; checklist diferenciado em `tasks-boilerplate.md` (Fase 0.6/0.7
  e Fase 1.5/Gate condicionais).
- `[DEC-0018-A03]` — política conteúdo × infra em `spec-foundation.md`:
  opções de localização (nova seção dedicada × estender "Hierarquia de
  documentos"); + sincronização do drift bidirecional § 4.2 (research
  lifecycle, repo-first/tracker).
- `[DEC-0018-A04]` — texto na linha do `global-rules.md`: deve apontar
  para `spec-foundation.md` (não duplicar); curto (1-2 ℓ).
- `[DEC-0018-A05]` — formato do `decision-brief-boilerplate.md`:
  campos consolidados em § 8.8; resolver os tradeoffs D8/D9/D10/D13.
- `[DEC-0018-A06]` — localização física da seção "Tipos de spec" +
  workflow em dois passes em `spec-foundation.md`: opções A/B/C/D já
  estão pré-populadas no `decision-brief.md` (recomendação inicial = A,
  reposicionamento fica para a candidata
  `governance-information-architecture` no backlog).

A próxima fase (A.1) consome esta matriz para popular os pontos do
Bloco A em `decision-brief.md` com **opções e tradeoffs estruturados**,
sem cravar decisão.

---

_Fim da auditoria research-backed (Sub-bloco A.0)._
