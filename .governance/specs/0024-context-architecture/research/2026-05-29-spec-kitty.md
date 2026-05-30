# Research (Fonte B) — Spec Kitty × G00 (unidade primária)

> **Data:** 2026-05-29
> **Spec:** [`../spec.md`](../spec.md)
> **DECs alimentados:** `[DEC-0024-G00]` (raiz), `G01`, `G03`, `G05`.
> **Fonte:** **B — research externa.** Fonte: <https://github.com/Priivacy-ai/spec-kitty> (README/docs, via WebFetch 2026-05-29).
> **Status:** DRAFT. Análise nível-README (1 sistema). Mandato: **tentar refutar** o candidato líder da Fonte A (lifecycle + eixos ortogonais) e observar **consumidor** como eixo vs atributo.

---

## O que o Spec Kitty modela

| Mandato                            | Achado                                                                                                                                                               | Citação/Evidência                                                                                                                                                  |
| :--------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unidade primária**               | **Entidade única canônica: "Mission"** (contêiner + fronteira de governança); contém `tasks` como work packages.                                                     | `spec → plan → tasks → next → review → accept → merge`; artefatos sob `kitty-specs/`.                                                                              |
| **Identidade vs Estado**           | **Separados, mas como propriedades de UMA entidade.** Identidade = `slug` persistente; Estado = lanes de lifecycle (`planned/in_progress/for_review/approved/done`). | "missions have identity (`slug`)" + "lifecycle lanes such as planned, in_progress, for_review, approved, done".                                                    |
| **Lifecycle vs spec-centric**      | **Lifecycle-centric sobre fundação documental.** O workflow É uma state machine que **opera sobre** documentos repo-native.                                          | "spec → plan → tasks → next → review → accept → merge"; "keeps the important context in your repository".                                                          |
| **Consumidor / audiência**         | **Presente, mas como _surface parity_ — não eixo fundacional.** Humano (review/accept), agente (slash commands), dashboard (mesma mission state).                    | `docs/host-surface-parity.md` "parity across CLI, slash-command, and hosted surfaces". README **não** detalha projeção semântica por consumidor.                   |
| **Decision session / gate humano** | **Explícito e distinto** de research e de implementação.                                                                                                             | `/spec-kitty.review` + `/spec-kitty.accept` + `/spec-kitty.merge` separados de `/specify`+`/plan` (research) e `/tasks`+`/next` (impl). + retrospectiva pós-merge. |
| **SoT vs projeção**                | **Repo é SoT; surfaces hospedadas são projeções.**                                                                                                                   | `docs/trail-model.md` "runtime governance in the repo"; "Hosted surfaces… opt-in"; retrospectivas em `retrospective.yaml`.                                         |

---

## Bearing no G00 — refuta ou sustenta?

**Tentativa de refutação dos eixos ortogonais → resultado: SUSTENTA, com refinamento importante.**

1. **Refuta a forma FORTE da hipótese** ("não há unidade primária; só eixos"). Spec Kitty **tem** uma unidade primária única — a **Mission** (= work-item). Logo, a leitura "não existe átomo, só eixos" é enfraquecida.
2. **Sustenta a forma REFINADA** (a que a Fonte A de fato propôs): a Mission é **um work-item** que carrega **identidade (`slug`) e estado (lane) como propriedades ortogonais separadas**, operando sob um **lifecycle como spinha**, com **artefatos repo-native como substância**. Mapeamento direto:
   - `Mission` ↔ work-item (a unidade)
   - `slug` ↔ identidade (eixo pilar, em ai-guidelines)
   - lanes ↔ estado (eixo lifecycle)
   - `kitty-specs/` ↔ substância/contexto
3. **Convergência com a Fonte A:** lifecycle como spinha operacional + identidade≠estado separados + repo como SoT + gate humano distinto. **3 dos 4 achados centrais da Fonte A batem.**

**Reformulação que isto força na hipótese:** trocar "eixos ortogonais SEM unidade" por **"unidade primária = work-item, descrito por propriedades ortogonais (identidade, estado, substância)"**. Spec Kitty é evidência de que **a unidade existe** e os eixos são **propriedades dela**, não rivais dela.

## Bearing no "consumidor" (4º eixo?)

Spec Kitty trata múltiplos consumidores (humano/agente/dashboard) via **`host-surface-parity`** — i.e., como **superfícies a manter em paridade**, não como eixo ontológico. **Sinal preliminar: consumidor = atributo de projeção (G05), não 4º eixo fundacional.** (1 sistema; confirmar com Hermes/Cursor/Open Code/Anthropic.)

## Bearing no "decision session"

Spec Kitty **tem análogo explícito** (review/accept/merge + retrospectiva) distinto de research e impl. → A "decision session" **não é exclusiva do ai-guidelines** como fase de lifecycle. _Nuance:_ o gate do Spec Kitty é de **aceitação de trabalho pronto**; o gate da 0024 (decision-brief) é de **decisão de design antes de implementar**. Ambos são gates humanos governados, em pontos diferentes do lifecycle. Reforça lifecycle-as-spine; **não** reforça "decision session" como unidade primária — é uma **fase**.

---

## Limitações

- Nível-README apenas; não inspecionei o data model real (schema de mission/task) nem o código.
- 1 sistema. Critério de saída exige ≥ 2 convergindo. Próximos: Hermes (skill loop / memory tiers), Open Code (provider-agnostic), Cursor (harness/session), Anthropic Dreaming (curated memory).
- Risco de confirmação: Spec Kitty é spec-driven (família próxima do ai-guidelines) → pode convergir por semelhança de origem, não por pressão universal. **Hermes/Cursor (origens diferentes) são teste mais duro.**

---

## Síntese pós-spec-kitty (leitor tardio, 2026-05-29) — ascensão para "entidade de governança"

O spec-kitty empurrou a hipótese **uma camada acima** dos eixos ortogonais. A descoberta não é "há uma unidade" — é "**há uma entidade de governança**". A `Mission` não é só um objeto: é fronteira de **responsabilidade + decisão + promoção + lifecycle + contexto**.

**Teste da subtração** (por que a entidade é mais fundamental que seus atributos):

- Remova specs / handoffs / dashboards / decision-sessions → a Mission (work-item) **continua existindo** → esses são projeções/atributos, não a raiz.
- Mude completamente a taxonomia dos 7 pilares → o work-item **continua existindo** → **pilar é atributo (identidade), não a raiz**.

**Sujeito vs predicados** — a tabela de cobertura da Fonte A tinha uma coluna faltando:

| dimensão                | responde                          |
| :---------------------- | :-------------------------------- |
| pilar                   | _o que é_ (identidade)            |
| lifecycle               | _onde está_ (estado)              |
| contexto                | _o que carrega_ (substância)      |
| **work-item governado** | **quem está evoluindo (SUJEITO)** |

pilar/lifecycle/contexto/projeções são **predicados**; o **work-item governado é o sujeito**.

**Reformulação de G00:** de _"qual é a unidade primária?"_ para **_"qual é a entidade primária de governança?"_**. Candidato líder atual (Fonte A + spec-kitty): **work-item governado**, possuindo identidade (pilar) · estado (lifecycle) · substância (contexto) · projeções (handoff/dashboard/briefing/review) como **atributos derivados**. Explica por que a 0024 absorveu handoff + boilerplates + taxonomia + promotion pipeline + decision session **sem virar 5 sistemas** — todos orbitam a mesma entidade central.

**lifecycle rebaixado:** de "melhor candidato único" (Fonte A) para **predicado (estado) da entidade**. **Não fechar G00 como lifecycle-centric.**

**Auto-alerta de elegância (de novo):** "work-item governado" é abstrato o bastante para absorver qualquer coisa — mesmo risco da elegância anterior. **Teste duro (Hermes/Cursor):** existe **UMA** entidade governada que atravessa todas as transições, ou **múltiplas** entidades de primeira classe sem sujeito único (ex.: Hermes com skills + tasks + memory tiers separados)? Se não houver sujeito único, "work-item governado" enfraquece.
