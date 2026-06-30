# Deliberação (RASCUNHO) — o grafo VERTICAL de roteamento (intent → repos, por conhecimento) — em q/r/d

- Data: 2026-06-29 · Spec 0024 · Natureza: **research/deliberação, não-autoridade** (insumo de DEC).
- É a **Parte 2 / a 🔴🔥** do tracker. Usa o `capabilities`/`provides` criados na [deliberação do shape do manifesto](2026-06-29-manifest-shape-deliberation.md).
- Em divergência vencem `state.yml`/`tasks.md`/`decision-brief.md`/gates/Git. Prior art **pública** nas referências.

> **GATE 1 (owner, 2026-06-29):** **Q1/Q3/Q4 DECIDIDAS** · **Q2 em ITERAÇÃO** (a owner pediu aprofundar: `capabilities`
> `{ texto, tags }` + adapter LLM **local** → embasado em [`2026-06-29-capability-matching-and-llm-research.md`](2026-06-29-capability-matching-and-llm-research.md);
> a Q2 refinada **volta ao gate**) · **Q5 NOVA** (parqueada). No método q/r/d: a `question` é **iterativa** (as opções
> amadurecem na pesquisa) · as `researches` **embasam** · a `decision` **só nasce no gate humano**.

---

## O problema (em 1 parágrafo)

A intent tem `explores: [{subject}]` + `contracts`. Hoje um **humano** decide (1) **ONDE rodar cada exploration**
e (2) **COMO quebrar a intent** em works — de memória ("o time de suporte sabe disso"). O grafo **HORIZONTAL**
(`coordinates-with`) já deriva repo↔repo. Falta o **VERTICAL**: cruzar o **NEED** (o subject do explore-point / o
contrato) × o **CONHECIMENTO publicado** (`capabilities`/`provides` dos manifestos) pra **SUGERIR** o repo — sem
depender da memória humana. É a camada de **CONHECIMENTO** encontrando a de **GOVERNANÇA**.

---

## Questions (a pergunta + as opções amadurecidas)

### Q1 — o que o vertical LIGA? (escopo da aresta)

| opção    | liga                                                             | prós                                                                       | contras                                |
| -------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------- |
| **A**    | só **explore-point → repo** (rotear a exploration)               | foco no "onde investigar"; menor                                           | não ajuda o **breakdown**              |
| **B** ⭐ | **explore-point→repo E contrato→repo** (exploration + breakdown) | a **mesma máquina** (need × oferta) cobre os **2 usos** que o tracker pede | um pouco mais de superfície            |
| **C**    | **intent → repo** (genérico, "a intent toca quais repos")        | simples                                                                    | grosso demais (não diz **o quê** onde) |

**Proposta ao gate:** **B** — o subject de um explore-point casa com `capabilities` ("quem **sabe**?"); um
contrato casa com `provides` ("quem **entrega**?"). Os dois são o mesmo match (need × oferta), então cobrir ambos
custa quase nada e entrega o "onde investigar" **e** o "quem faz o breakdown".

### Q2 — como CASAR need × conhecimento? (o matcher) — _o crux_

O subject é texto livre (ex. _"suporte proativo é viável? detectar N falhas de login…"_); as `capabilities` também
(ex. _"emissão de eventos de falha de login"_). Como pontuar a afinidade?

| opção    | como casa                                                                 | prós                                                                                                                            | contras                                                         |
| -------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **A**    | **léxico** (overlap de tokens, lowercase, tira stopwords)                 | determinístico · zero infra · **explicável** (mostra os termos que casaram) · versionável                                       | frágil a sinônimo/idioma                                        |
| **B**    | **embeddings** (similaridade vetorial subject × capability)               | robusto a sinônimo; semântico de verdade                                                                                        | precisa modelo/infra · **não-determinístico** · não-versionável |
| **C**    | **tags controladas** (vocabulário fechado)                                | preciso                                                                                                                         | exige curadoria + **muda o shape** do manifesto                 |
| **D** ⭐ | **matcher PLUGÁVEL** (porta): default **léxico** + adapter embeddings/LLM | **espelha a porta `Repository`** (solo→enterprise) · como é **advisory**, o léxico já serve de dica · a empresa pluga semântica | uma porta a mais                                                |

**Proposta ao gate:** **D** com **default léxico determinístico**; embeddings/LLM como **adapter opcional**. Duas
razões fortes: (1) é o **mesmo princípio** do backend plugável (atende do dev-solo à grande empresa); (2) como a
saída é **só sugestão** (Q4), um match léxico já é uma dica útil — não precisa de IA pra ser valioso. As
`capabilities` seguem `string[]` **texto livre** (só revisitar o shape se o matcher pedir).

_Ex. (sim):_ e2 = _"suporte proativo… falhas de login"_ → tokens `{suporte, proativo, falhas, login}` × caps do
`acme-mfe-support` `{"…suporte…", "…falha de login…"}` → overlap **alto** → sugere **e2 → support**; × caps do
`acme-design-system` `{form, validação, design-tokens}` → overlap **~0**. (ver Validação ↓.)

### Q3 — onde a SAÍDA mora + é versionada?

| opção    | a saída é                                                                                                                                     | prós                                                                                                                                   | contras                                                               |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **A** ⭐ | **derivação no read-model do HOST** (`acme-governance/.cache/db.json` + dashboard), recomputada no build; **não** é fonte/contrato versionado | é uma **VIEW advisory** (recomputável) · não polui a fonte · o caso LLM fica **runtime-only** sem quebrar o determinismo do versionado | —                                                                     |
| **B**    | artefato **versionado** (tipo `context.json`)                                                                                                 | auditável                                                                                                                              | versionar **sugestão** = ruído; e o caso LLM **não** é determinístico |

**Proposta ao gate:** **A** — roteamento é **VIEW derivada no agregado do host** (cache), não fonte versionada.
O léxico é estável (poderia até versionar), mas tratá-lo como **view** mantém a porta aberta pro matcher LLM
(overlay runtime) **sem** ferir a regra "o versionado é determinístico".

### Q4 — a sugestão é ADVISORY ou influencia o gate? (autoridade)

| opção    | autoridade                                                                                           | prós                                                                                                         | contras                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **A** ⭐ | **advisory puro** — só sugere; o breakdown/`derives-from` continua **humano**; nunca alimenta o gate | honra **"a intent não delibera"** (o gate deriva do breakdown REAL, não da sugestão) · sem falso-automatismo | o humano ainda decide (mas **é** o ponto)                                                                     |
| **B**    | **auto-atribui** (cria works/assign pelo match)                                                      | menos trabalho manual                                                                                        | perigoso: sugestão ≠ verdade; uma `capability` stale rotearia **errado** + **colide** com o gate-do-breakdown |

**Proposta ao gate:** **A** — advisory-only, **nunca** alimenta o gate. O roteamento é um **holofote** ("comece a
investigar aqui"), não um despachante. O `derives-from` (proveniência) continua sendo a decisão humana que o gate
deriva.

### Q5 — (emergiu no gate, a partir da Q3) um "GATE DE EVOLUÇÃO": consultas periódicas → proposals/insights?

**Ideia da owner:** consultar o grafo de conhecimento **regularmente** pra **SURFACE** sinais de governança
automaticamente — ex.: 2 repos coordenam muito num contrato → propor uma **lib compartilhada**; uma tag que ninguém
provê mas intents pedem → **gap** → `proposal`; contrato `beta` muito consumido → propor **estabilizar**. É o grafo
virando **fonte de `proposal`/insight** (conecta com a ferramenta `proposal` + o experiment "proativo" parqueado).

**Status:** 🅿️ **PARQUEADA** — "ainda preciso entender isso melhor" (owner). **Precisa da própria deliberação**;
não se desenha aqui. _(embasamento inicial: a seção "thread adiante" da [research de matching](2026-06-29-capability-matching-and-llm-research.md).)_

---

## Researches (só REFERÊNCIAS — num q/r/d real, cada uma seria um `research.md`)

- **R1** (Q1/Q2 — rotear trabalho por conhecimento/ownership): [Backstage Software Templates/Scaffolder](https://backstage.io/docs/features/software-templates/) · [GitHub — auto-request de reviewers por CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositories-settings-and-features/customizing-your-repository/about-code-owners) (roteamento determinístico por dono — análogo "lexical/estrutural").
- **R2** (Q2 — léxico × denso, o trade-off exato): retrieval **BM25/lexical vs dense embeddings** ([BM25](https://en.wikipedia.org/wiki/Okapi_BM25)); o léxico é a baseline explicável, o denso pega sinônimo.
- **R3** (Q2/Q3 — casar "need" com "quem sabe" via descrição): **roteamento de tool por descrição no [MCP](https://modelcontextprotocol.io/)** (um agente escolhe a ferramenta/server pela _description_ — exatamente "subject × capability") · **GraphRAG** (grafo + recuperação semântica).
- **R4** (Q2/Q3 — a porta plugável): a própria **porta `Repository`** deste framework (file→sqlite→neo4j→mongo sem mudar o domínio) = o molde pra uma **porta `Matcher`** (léxico→embeddings→LLM).

---

## Decisions (gate 1 — owner, 2026-06-29)

- **D1 (Q1) ✅ DECIDIDA — B:** o vertical sugere **explore-point → repo** (onde investigar) **e** **contrato → repo**
  (quem entrega/breakdown). Mesma máquina (need × oferta).
- **D2 (Q2) ✅ DECIDIDA (gate 2) — D refinado:** matcher **plugável** com **default léxico** + `capabilities` vira
  **`{ text, tags? }`** (híbrido A+C → habilita o **grafo** repo×tag) + **adapter LLM LOCAL em sequência (v2)**.
  Embasado em [`2026-06-29-capability-matching-and-llm-research.md`](2026-06-29-capability-matching-and-llm-research.md).
  **v1 (léxico+tags) FEITO e dogfood VERDE** ↓; **v2 (LLM local)** é o próximo passo.
- **D3 (Q3) ✅ DECIDIDA — A:** roteamento é **view derivada no read-model do host** (não versionada). _(brotou a **Q5**:
  consultas periódicas → proposals/insights — parqueada.)_
- **D4 (Q4) ✅ DECIDIDA — A:** **advisory-only** — nunca alimenta o gate; o breakdown/`derives-from` segue humano.

---

## Validação proposta (dogfood — como vamos saber se presta)

Rodar o matcher no **intent `login_1` existente** e conferir se ele **REPRODUZ as escolhas humanas** já na sim:

- **e1** (_"validação de formulário…"_) → deve sugerir **acme-design-system** (onde `form-validation_1` de fato caiu).
- **e2** (_"suporte proativo…"_) → deve sugerir **acme-mfe-support** (onde `proactive-support_1` caiu).
- contrato **`form-component`** → deve sugerir **acme-design-system** (que o `provides`; onde o `form-component_1` caiu).

Se o **léxico** reproduz as escolhas humanas na sim, ele **basta** pro advisory (e a porta fica pronta pra quem
quiser plugar embeddings/LLM depois). Esse é o critério de aceite do v1.

---

## Aplicado

**v1 (léxico) FEITO** (commits `dccce9fc` shape + `39039ffc` routing):

- `capabilities → { text, tags? }` no domínio + adapters + 3 manifestos + template + scaffold.
- `domain/routing.ts`: porta `Matcher` + `LexicalMatcher` (tokens + prefixo PT + boost de tag) + `deriveRouting`
  (explore-point→capabilities · contrato→provides) + `deriveTagGraph` (repo×tag). `build` fia `routing`+`tagGraph`
  no `db.json` do host.
- **dogfood `routing-check.ts` VERDE**: o léxico REPRODUZIU as escolhas humanas (e1→DS · e2→support 6>identity 4 ·
  form-component→DS · failure-event→identity). Advisory: não toca o gate.

**✅ v2 (LLM LOCAL) FEITO** (commits `da5a17bf` foundation + `98b57b88` tier 2/bench) — rodou no Ollama da owner (RTX
3060): porta async + `OllamaEmbedMatcher` (tier 1) + `OllamaGenerateMatcher` (tier 2) + `matcher.yml` (raiz do host) +
`routing-bench.ts` + build resiliente (LLM fora → léxico). **Medido:** léxico/embed(`nomic`) **4/4** (0.0s / 0.6s warm);
generativo + lento e **não** + exato (o `qwen3:4b` regrediu p/ 3/4) → **embeddings é o workhorse** (ver `../_org-simulation-v2/MATCHER.md`).

**Pendente:** a **viz** (cards de roteamento + grafo repo×tag na tela) → vai pra a **rodada do `_viewer`** (o app vai
ser bem mexido; os dados já estão no `db.json`, evita view dupla).
