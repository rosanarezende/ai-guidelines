# Research (Fonte B) — Hermes Agent × G00 (teste duro)

> **Data:** 2026-05-29
> **Spec:** [`../spec.md`](../spec.md)
> **DECs alimentados:** `[DEC-0024-G00]` (raiz), `G01`, `G03`, `G05`.
> **Fonte:** **B — research externa.** <https://hermes-agent.nousresearch.com/docs/> (WebFetch 2026-05-29); repo <https://github.com/NousResearch/hermes-agent>; docs comunitárias <https://github.com/mudrii/hermes-agent-docs>.
> **Status:** DRAFT. **Teste duro** (origem memory/skill-centric, distinta do spec-driven). Mandato: tentar **refutar** "work-item governado" / eixos ortogonais + qual entidade atravessa todas as transições + consumidor como eixo.

---

## O que o Hermes modela

| Mandato                         | Achado                                                                                                                                                                                                                                                 |
| :------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Entidade que atravessa tudo** | **NÃO há entidade única.** Múltiplos primitivos coequais: **skill, memory (3 tiers), user model, task/message, session, subagent**. Skills e memory são "distinct, coequal primitives **rather than subordinate to a single task/work-item concept**". |
| **Identidade vs estado**        | **Parcialmente colapsados.** Skills têm identidade, mas sem separação explícita tipo/estado; tiers de memória são atributos de um sistema de memória.                                                                                                  |
| **Spinha**                      | **Loop de aprendizado** (`experiência → skill → auto-melhoria → persistência`) — NÃO tasks nem work-items. Loop-centric.                                                                                                                               |
| **Memory tiers**                | 3 tiers (session / persistent FTS5 / skill) como **entidades distintas** que realimentam o loop.                                                                                                                                                       |
| **Consumidor**                  | **Não endereçado.** Tratamento uniforme de mensagens em 20+ plataformas; sem projeção por papel.                                                                                                                                                       |
| **Gate humano**                 | **Sim** — "Command approval, authorization, container isolation" (checkpoint distinto da execução autônoma).                                                                                                                                           |
| **SoT vs derivado**             | Não claramente especificado.                                                                                                                                                                                                                           |

---

## Bearing no G00 — REFUTA a forma universal, mas ESCLARECE

**Refutação real (era o objetivo do teste duro):** Hermes **não tem** uma entidade-sujeito única que atravessa tudo. É **multi-entidade, loop-centric**. Logo, a afirmação "**sempre** existe um work-item governado que é o sujeito" está **falsificada** — não é universal.

**Mas a refutação esclarece, em vez de destruir.** O contraste Spec Kitty × Hermes revela uma **dependência de classe**:

|                                      | Entidade primária                           | Spinha    | Promoção                                      |
| :----------------------------------- | :------------------------------------------ | :-------- | :-------------------------------------------- |
| **Spec Kitty** (spec-driven)         | **work-item único** (Mission)               | lifecycle | humano-curada                                 |
| **ai-guidelines** (governance-first) | **work-item governado** (hipótese)          | lifecycle | humano-curada (ADR 0018)                      |
| **Hermes** (autonomous-learning)     | **múltiplos primitivos** (skill+memory+...) | loop      | **autônoma** (skill auto-creation em runtime) |

**A divisão correlaciona com governança, não é arbitrária:**

- Sistemas **governance-first / humano-curados / repo-as-SoT** (Spec Kitty, ai-guidelines) → convergem para **uma entidade governada** (work-item) + lifecycle.
- Sistemas **autonomous-learning** (Hermes) → **múltiplos primitivos coequais** + loop autônomo.

A diferença é exatamente **ADR 0018** (sem LLM no runtime; promoção humano-curada). **Hermes é o modelo que o ai-guidelines deliberadamente rejeita.** Logo Hermes **não refuta** "work-item governado **para a classe do ai-guidelines**" — ele mostra que a alternativa (multi-entidade sem sujeito) é o que se obtém quando se **abre mão** da curadoria humana. Isso **afia a identidade** do ai-guidelines em vez de enfraquecê-la.

## O que CONVERGE entre dois sistemas de origens opostas

1. **Lifecycle/loop como spinha operacional** — Spec Kitty (state machine) e Hermes (learning loop) **ambos** organizam-se por um ciclo. **Convergência forte e universal:** lifecycle é a spinha, independentemente de haver ou não entidade única. (Confirma o rebaixamento de lifecycle a **predicado organizador**, não entidade — mas predicado **universal**.)
2. **Gate humano governado** existe em ambos (review/accept; command approval). Reforça governança como dimensão real.
3. **Consumidor NÃO é eixo** — ausente/atributo em ambos (2 sistemas agora). Hipótese do 4º eixo **mais fraca ainda**.

## O que DIVERGE

- **Entidade única (Spec Kitty) vs multi-entidade (Hermes)** — e a divergência é **explicada por governança vs autonomia**, não é ruído. Esse é o achado mais valioso do teste duro.

---

## Implicação para G00 (preliminar, 2 sistemas)

- "**Work-item governado**" **não é universal** — é o modelo da **classe governance-first**, à qual o ai-guidelines pertence (Spec Kitty confirma a classe).
- A pergunta G00, para o ai-guidelines, tem resposta candidata robusta: **work-item governado** (entidade-sujeito) com identidade/estado/contexto/projeções como atributos — **porque** o ai-guidelines escolheu governança humano-curada (ADR 0018). Trocar essa escolha levaria ao modelo Hermes (multi-entidade).
- **lifecycle = predicado universal** (spinha em ambos); **entidade única = predicado de classe** (governance-first).

> **Freio (leitor tardio, 2026-05-29) — avanço ≠ prova.** Hermes demonstrou _autônomo ⇒ multi-entidade_; **não** demonstrou _governance-first ⇒ mono-entidade_. Spec Kitty é mono-entidade, mas foi **desenhado** assim (n=1). O ai-guidelines pode muito bem ser **multi-entidade governada** (work-item **+** ADR **+** promotion/decision-record como entidade de governança própria). G00 segue **aberto** entre mono-entidade / multi-entidade / entidade+relação. Cf. mandato expandido em [`2026-05-29-g00-internal-audit.md`](./2026-05-29-g00-internal-audit.md).

## Limitações

- Nível-doc oficial; não inspecionei código/schema.
- 2 sistemas. Faltam Cursor (harness/session), Open Code (provider-agnostic), Anthropic Dreaming. **Teste seguinte:** Cursor/Open Code caem na classe "work-item único" ou "multi-entidade"? Se um sistema **governance-leve** ainda assim tiver work-item único, fortalece; se for multi-entidade, reforça a correlação governança↔entidade-única.
