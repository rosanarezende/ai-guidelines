---
artifact-kind: research
subject: "grafo de governança cross-repo — entender o fluxo entre repos irmãos (não só API), banco como agregação derivada"
date: 2026-06-24
---

# Research — grafo de governança cross-repo

> **Natureza:** `research` (authority: none). **Não-autoridade**, **fundacional/futuro** — **não é o
> #45 nem o G25 single-repo**. Captura a provocação da owner (2026-06-24) sobre trabalho que **toca
> vários repos**. **Linhagem:** `governed-work-flow-model.md` (§9.9) · `governance-self-index-by-intention.md`
> (tese do grafo) · auditoria de perguntas **D2/D4/D5/D7** (cross-repo) · `[DEC-0024-G08]`/`G23`
> (grafo derived-only). Lifecycle: **research → DEC fundacional → execução** (frente própria, futura).

## 1. O caso motivador (FATO da owner)

Um `delivery` pode **tocar vários repositórios**. Caso real: **dois repos irmãos de um produto** (um
app + seu repo editorial). Hoje eles **se comunicam por API** — mas a owner aponta que isso **não basta**:
os trabalhos precisam **entender o fluxo um do outro** para **evitar regras conflitantes**, especialmente
num mundo de **desenvolvimento assistido por IA**.

## 2. A distinção que o caso revela: API ≠ fluxo/governança

| Eixo            | O que coordena                                                            | Resolvido por  |
| --------------- | ------------------------------------------------------------------------- | -------------- |
| **Runtime**     | como os sistemas **conversam** (dados, contratos)                         | **API**        |
| **Design-time** | o que foi **decidido**, que **regras** valem, o que está **em andamento** | **— (lacuna)** |

API resolve o runtime. **Nada** hoje resolve a coordenação de design-time entre repos: o repo A não
"vê" as decisões/regras/fluxo do repo B → risco de **regras conflitantes**, duplicadas ou contraditórias.

## 3. O forcing-function de IA

Um humano pergunta ao colega _"isso conflita com o editorial?"_. Um **agente de IA não tem como** —
ele precisaria **reconciliar prosa espalhada em dois repos**, que é justamente o que ele não consegue.
Para o agente em A não violar o governo de B, ele precisa de uma **superfície cross-repo consultável**.
É a tese **"contexto por intenção"** (self-index) **estendida entre repos**.

## 4. Por que o banco volta a fazer sentido — e sem ferir a doutrina

Adiamos o banco porque **single-repo não precisa** (Markdown/YAML derivável basta). **Cross-repo
precisa**: o grafo de um repo é **local**; coordenar N repos exige uma **agregação** consultável.

**O banco entra como AGREGAÇÃO DERIVADA, não 2ª SSOT:**

- cada repo **continua SSOT do seu próprio governo** (Markdown/YAML; **o repo vence**);
- o banco cross-repo é a **união regenerável** dos grafos derivados de N repos;
- se banco e repo divergem, **o repo vence** e o banco **se reconstrói** (drift-check).

→ A virada é **principiada**, não oportunista: o banco entra **exatamente** no caso que o exige
(agregação + volume de query que o Markdown não atende), e **continua derivado** (honra `[DEC-0024-G07]`
projeção ≠ governança, e `GG-0005`).

## 5. O que destrava

- **Query cross-repo por intenção:** o agente em A pergunta _"que regras/decisões/fluxos de B minha
  mudança toca?"_ — antes de agir.
- **Check de coerência cross-repo:** torna **regras conflitantes visíveis** entre repos. **Não
  auto-resolve** — o conflito vira uma **DEC cross-repo** (decisão humana). O grafo expõe; o humano decide.

## 6. Pré-requisitos abertos (já mapeados na auditoria de perguntas)

- **D2 — identidade global de nó:** IDs únicos por repo para **ligar** nós entre repos (sem isso não há
  agregação).
- **D7 — isolamento de info sensível:** **nem todo repo expõe tudo** cross-repo; modelo de visibilidade.
- **D4 — quais queries justificam o banco:** catálogo de consultas cross-repo que JSON/Markdown não atende.
- **Autonomia de governo por repo:** a camada cross-repo **expõe e alerta**, **não dita** — um repo não
  impõe suas regras ao outro; o conflito é sinalizado para decisão humana, não silenciado nem forçado.

## 7. Escopo

**Fundacional e futuro.** **Não** é o `#45`, **não** é o G25 single-repo (que está quase fechado). É
uma **frente própria** (grafo de governança cross-repo + banco-agregação derivada), cujo **caso concreto**
(repos irmãos da owner) a torna real em vez de hipotética. Precede uma **DEC fundacional** própria.

## Âncoras

- **Linhagem:** `research/2026-06-24-governance-self-index-by-intention.md` (tese do grafo/índice por
  intenção) · `research/2026-06-24-governed-work-flow-model.md` (§9.9 cross-repo) ·
  `research/2026-06-23-governance-model-question-audit.md` (D2/D4/D5/D7) ·
  `research/2026-06-23-governance-graph-incremental-delivery-and-query-layer-direction.md`.
- **Decisões/contratos:** `[DEC-0024-G07]` (topology-as-data; projeção ≠ governança) ·
  `[DEC-0024-G08]`/`G23` (grafo derived-only, sem 2ª SSOT) · `GG-0005` (sem débito silencioso).
