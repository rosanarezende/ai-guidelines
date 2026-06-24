---
artifact-kind: research
subject: "modelagem como indexação (não prosa) — grafo de governança derivado, auto-consultável por intenção de trabalho"
date: 2026-06-24
---

# Research — modelagem como indexação: o grafo de governança auto-consultável por intenção

> **Natureza:** `research` (authority: none). **Não-autoridade**, não decide, não implementa.
> Captura a provocação arquitetura/produto da owner (2026-06-24) e a estende. **Linhagem:**
> `[DEC-0024-G08]`/`G23` (grafo derived-only) + **H4** (camada de consulta) da auditoria de
> perguntas. Em divergência vencem `state.yml`, `tasks.md`, `decision-brief.md`,
> `reviews/`+`gates/`, Git/GitHub. Lifecycle: **research → DEC → execução** (etapa
> `internal-architecture-refactor-ddd-bdd`).

## 1. Problema observado (FATO da owner)

Mesmo com regras, ADRs, DECs, `AGENTS.md`, catálogo, `script-contracts` e research, os agentes
**continuam precisando ser lembrados manualmente das mesmas coisas** → **drift**. Exemplos reais
desta sessão: (a) numa investigação o agente não encontrou `.governance/specs/research-index.md`
e a owner precisou apontar; (b) a owner precisou reforçar o contrato de scripts.

**Diagnóstico:** o sintoma é da **modelagem dirigida a prosa**. O contexto aplicável _existe_,
mas está espalhado em texto que a máquina precisa **re-parsear** e o humano **re-suprir** a cada
sessão. A prosa é barata de escrever e cara de consultar.

## 2. A tese (a inversão)

> **Modelar deixa de ser dirigido a prosa e passa a ser indexação que gera contexto.** O artefato
> é otimizado para a **consulta (o fim)**, não para a **facilidade de escrever agora (o começo)**.
> Aceita-se mais disciplina de autoria (preencher arestas) para ganhar **recuperação
> determinística por intenção de trabalho**. _Não mais fácil desenvolver agora; mais fácil
> consultar no final._

A troca, explícita:

| Eixo                                       | Hoje (prosa)                     | Alvo (indexação)                                  |
| ------------------------------------------ | -------------------------------- | ------------------------------------------------- |
| conectivo (o que embasa/supersede/enforça) | frase no corpo                   | **campo tipado** (aresta como dado)               |
| recuperar contexto                         | humano re-lê e re-supre          | **derivado por intenção**, determinístico         |
| custo                                      | barato escrever / caro consultar | mais disciplina ao escrever / **consulta grátis** |
| modo de falha                              | drift / lembrete manual          | round-trip verificável (check)                    |

## 3. Princípios de "modelagem como indexação"

1. **Todo artefato é um nó** com id + **arestas tipadas** — não prosa solta.
2. **Prosa é o corpo, não a estrutura.** A narrativa humana permanece; o **tecido conectivo**
   (o que embasa, supersede, enforça, se aplica) vira **metadado derivável**.
3. **Custo na autoria, ganho na consulta** (a troca da §2) — princípio de design explícito.
4. **Derived-only, SSOT única.** Arestas vivem como dado **no** artefato (frontmatter); o grafo é
   **projeção recomputada** das fontes. Sem 2º store. (Doutrina literal do `KnowledgeGraph`:
   _"sem estado próprio — recomputa-se das fontes"_.)
5. **Intenção é o teste de aceite.** "Modelou certo?" = _"o agente recupera o contexto de uma
   intenção deterministicamente?"_ — não _"a prosa está bonita?"_.
6. **Relações = conjunto fechado tipado** (como `artifact-kind` / os 7 pilares), enforçado por check.
7. **Citação = ref verificável** (`file#anchor`), não alusão. (Já é o padrão das `constraints`.)

## 4. O que JÁ existe (FATO — a tese não é utopia)

~70% das peças existem, como **índices separados, não conectados**:

| O que a meta pede                      | Existe?     | Mecanismo real (FATO)                                                                                 | Gap                                                       |
| -------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| regras/guardrails/ADRs/DECs aplicáveis | parcial     | `rules.json` (42, scoped) + `constraints.yml` (guardrails→bindings) + `decision-brief` (prosa) + ADRs | DEC/ADR não são nós; "aplicável a esta intenção" inexiste |
| quais são **SSOT**                     | ✅          | `authority_order` (artifact-taxonomy.yml, 7 níveis) + GOVERNANCE-CATALOG                              | —                                                         |
| quais são **projeções**                | ✅          | `script-contracts` (package.json/docs) + authority nível 6                                            | —                                                         |
| quais **superseded**                   | prosa       | `decision-brief` ("Supersedida por G19")                                                              | não é aresta consultável                                  |
| quais **checks** rodar                 | ✅ (dado)   | `constraints.yml` **bindings** (surface + mode advisory/required) + cadeia `validate`                 | não indexado por intenção                                 |
| quais **fronteiras**                   | parcial     | `work-policy.yml` (briefing `work`) + guardrails `GG-*`                                               | não unificado por intenção                                |
| **links/linhas** que sustentam         | ✅ (regras) | `constraints` `sourceRef` (`file#anchor`) + rules `sources`                                           | DECs **sem** `grounded-by`                                |

E os **dois motores** que já provam o padrão (mas incompletos):

- **`intentCatalog.ts`** — _"catálogo curado de Intents, SSOT da navegação humana"_ + `intent:check`
  de integridade. Mapeia intenção → **comandos**, **não** intenção → contexto-de-governança. (O
  scaffold "por intenção" **existe**.)
- **`KnowledgeGraph`** — motor de **grafo tipado derivado**, puro, travessia bidirecional, cresce
  monotonicamente. **Só do domínio Knowledge** (não cobre regra/DEC/ADR/autoridade).

> **Síntese:** o índice recuperável por intenção é o `intentCatalog` estendido (comando → contexto)
> lendo um **grafo tipado** que estende o `KnowledgeGraph` para nós de governança. É **G08/G23 +
> H4** convergindo. Já decidido como direção; faltam as **conexões**.

## 5. O sistema repensado (alvo)

- **Nós:** intent-brief, decision-brief, learning-record, gate, review, research, DEC, ADR, rule,
  guardrail, constraint, authority-source, check, intention.
- **Arestas tipadas (conjunto fechado, como dado em frontmatter):** `grounded-by`,
  `supersedes`/`superseded-by`, `enforces`/`enforced-by`, `applies-to-intention`, `projects-from`,
  `breaks-into`, `verdicts`, `approves`, `promotes-to`.
- **Motor:** estender o padrão do `KnowledgeGraph` para além do domínio Knowledge (mesmo engine:
  projeção pura, travessia bidirecional, crescimento monotônico).
- **Entrada:** o `intentCatalog` evolui de intenção→comando para intenção→**contexto** (traverse →
  bundle: regras/SSOT/projeções/superseded/checks/fronteiras/citações).
- **Garantia:** **coherence check** (zero arestas penduradas, zero autoridade-stale citada como
  ativa, snapshot regenera com hash batendo).
- **Tudo derived-only** (sem banco agora; snapshot regenerável).

## 6. As 9 perguntas (respostas condensadas)

1. **Já planejado?** Sim — `[DEC-0024-G08]`/`G23` (grafo derived-only) + H4 (camada de consulta);
   peças em `KnowledgeGraph`, `constraints`, `rules`, `authority_order`, `intentCatalog`, `work`.
2. **O que existe?** Tabela da §4.
3. **O que falta?** Unificar os índices num grafo tipado; query por intenção; materializar arestas
   faltantes (`grounded-by`, `superseded-by`, `applies-to-intention`); determinismo + citação.
4. **Critério de aceite da 0024?** Sim, **escopado** à etapa `internal-refactor`: grafo derivável
   (nós+arestas como dado) + **1 consulta por intenção** ponta-a-ponta + coherence check. **Não** a
   query-layer inteira (explode a spec).
5. **MVI?** Uma intenção (`"alterar scripts/checks"`) devolve o bundle, **derivado** de
   `script-contracts`+`constraints`+`authority_order`, **sem store novo**, com check.
6. **Evitar embeddings/2ª SSOT?** Zero vetor; recuperação **determinística** sobre dado tipado;
   bundle **computado, não armazenado**; cache = snapshot regenerável + drift-check. Honra G07/GG-0005.
7. **Relação com snapshot/banco?** `grafo → snapshot (derivado) → query → [banco: futuro, opcional,
derived-only, drift-checked]`. A query é consumidora; o banco é a última milha.
8. **Check de coerência?** Espelho de `research-index:check`/`intent:check`: zero dangling, zero
   autoridade-stale, snapshot faz round-trip determinístico das fontes.
9. **NÃO agora:** banco/Neo4j; embeddings/semântica; LLM no runtime (ADR 0018); parsing NL da
   intenção (intenção = conjunto curado **fechado**); unificação big-bang; rewrite dos índices
   (unifica-se **por derivação**, não por rewrite).

## 7. Escopo e sequência

- **Critério de aceite (escopado):** na etapa `internal-architecture-refactor-ddd-bdd` —
  grafo derivável + 1 consulta por intenção + coherence check. Não promover a critério da spec
  inteira (risco de scope-explosion).
- **1ª aresta concreta (ponte com o já-em-curso):** `grounded-by` em DECs (a de-para DEC↔research
  da §8.3 da research do intent-brief) — barata, derived-only, já dá valor.
- **NÃO agora:** ver §6.9.

## 8. Próximo artefato

Insumo para uma **DEC fundacional** na linhagem G08/G23 que adote **"modelagem como indexação"**
como princípio + o **conjunto fechado de arestas tipadas**, e crave o critério de aceite escopado
na etapa `internal-refactor`. Esta research **não decide** — precede a DEC.

## Âncoras

- **Mecanismos:** [`KnowledgeGraph`](../../../../src/app/projections/KnowledgeGraph.ts) ·
  [`Constraint`](../../../../src/domain/constraints/Constraint.ts) ·
  [`intentCatalog`](../../../../src/cli/registry/intentCatalog.ts) ·
  [`sources-taxonomy`](../../../../.core/rules/_meta/sources-taxonomy.md) ·
  `authority_order` (`.core/governance/artifact-taxonomy.yml`) ·
  [`workBrief`](../../../../src/cli/workBrief.ts).
- **Linhagem:** `research/2026-06-23-governance-model-question-audit.md` ·
  `research/2026-06-23-governance-graph-incremental-delivery-and-query-layer-direction.md` ·
  `research/2026-06-24-intent-brief-work-initiation-artifact.md` (§8.3 de-para DEC↔research).
- **Decisões:** `[DEC-0024-G08]` · `[DEC-0024-G23]` · `[DEC-0024-G07]` · `GG-0005` · ADR 0018.
