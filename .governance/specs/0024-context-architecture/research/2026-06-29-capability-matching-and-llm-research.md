# Research — casamento de `capabilities` (texto + tags + grafo) e o adapter de Matcher por LLM (incl. modelos LOCAIS)

- Data: 2026-06-29 · Spec 0024 · Natureza: **research, não-autoridade** (embasa a **Q2** da [deliberação do roteamento vertical](2026-06-29-vertical-routing-deliberation.md)).
- **Investiga** (decisão da owner no gate): (A) o **shape de `capabilities`** (texto livre vs `{texto, tags}` — o híbrido A+C) e (B) a **porta `Matcher`** com um **adapter de IA local**.
- Método: **análise + benchmark** de prior art **pública**. Anonimizado (`acme-*`).

---

## Parte A — `capabilities`: de `string[]` para `{ text, tags? }[]` (o híbrido A+C) + o ângulo GRAFO

**Contexto.** Hoje `capabilities: string[]` (texto livre). O matcher léxico tokeniza o texto. O texto é ótimo pra
humano e pra LLM, **mas** frágil pra match exato (sinônimo/idioma: "auth" × "autenticação" × "login").

**Proposta.** `capabilities: { text: string; tags?: string[] }[]` — **texto livre** (legível, p/ léxico/LLM) **+
tags controladas** (precisas, p/ match exato **e** grafo).

_Ex. (sim), o support:_

```yaml
capabilities:
  - text: "suporte proativo por eventos de falha de login"
    tags: [support, observability, auth-events]
  - text: "atendimento sob demanda (help on demand)"
    tags: [support, ui]
```

**Por que tags valem a pena (3 achados):**

1. **Exatidão** — uma tag `auth` é inequívoca; resolve o sinônimo/idioma que o léxico erra. O matcher dá **boost**
   quando a tag casa (e ainda usa o `text` pro resto).
2. **GRAFO de conhecimento** (o que a owner quer "trabalhar grafos") — as **tags viram NÓS**: um grafo **bipartite
   repo × tag** (`repo —[tem]→ tag ←[tem]— repo`). "Quem sabe de `auth`?" = os **vizinhos** do nó-tag `auth`. De
   brinde: **clusters** de capability e **gaps** ("nenhum repo tagueia `accessibility`, mas 2 intents pedem").
3. **Consistência** entre repos — vocabulário compartilhado (uma _folksonomy_ que emerge, depois talvez uma
   _taxonomy_ controlada).

**Prior art (pública):** [GitHub repository topics](https://docs.github.com/en/repositories/classifying-your-repository-with-topics) (tags semi-livres) · [Backstage — tags + `spec.type`](https://backstage.io/docs/features/software-catalog/descriptor-format/) · Stack Overflow **tags** (folksonomy → taxonomy emergente) · **knowledge graphs** (entidade × tag/tópico) · skill/competency graphs (quem-sabe-o-quê).

**Custo / contras.** (1) **curadoria** (alguém cuida do vocabulário; risco de _tag sprawl_). (2) estende o **check
de freshness** (uma tag órfã/duplicada? — um **registry de tags** + check, futuro). (3) **reabre o shape de
`capabilities`** (sub-decisão da [deliberação do manifesto](2026-06-29-manifest-shape-deliberation.md), D2) — mas
é **aditivo e retrocompatível** (tags **opcionais**; o léxico segue usando o `text`).

**Mitigação (caminho de adoção):** começar **folksonomy** (tags livres, sem registry) → deixar o vocabulário
**emergir** → só depois (se valer) um **registry de tags** controlado + check. Igual ao espírito "do solo à
empresa": o solo só escreve tags; a empresa governa o vocabulário.

> **Recomendação A:** `capabilities → { text, tags? }[]`. O matcher usa **os dois** (tag exact-match dá boost; o
> `text` alimenta léxico/LLM). As **tags habilitam o grafo de conhecimento** (uma nova derivação `repo×tag` + um
> card no dashboard). Tags **opcionais** (retrocompatível com o baseline léxico).

---

## Parte B — a porta `Matcher` + adapter de IA, com **MODELOS LOCAIS** (a virada de chave)

**A porta.** `interface Matcher { rank(need: string, candidates: Capability[]): { repo, score, why }[] }` — neutra,
igual à `Repository`. Adapters:

| adapter        | como pontua                                              | infra           | determinístico? | versionável? |
| -------------- | -------------------------------------------------------- | --------------- | --------------- | ------------ |
| **Lexical** ⭐ | overlap de tokens do `text` + **boost** por tag exata    | nenhuma         | ✅              | ✅ (view)    |
| **Embedding**  | cosine de vetores (`need` × cada capability)             | modelo (local!) | ~ (por modelo)  | ❌ (overlay) |
| **Llm**        | o modelo lê need + capabilities → ranqueia + **explica** | modelo (local!) | ❌              | ❌ (overlay) |

**Modelos LOCAIS = a virada de chave (e por que faz MUITO sentido aqui).** [Ollama](https://ollama.com/) /
[llama.cpp](https://github.com/ggml-org/llama.cpp) / LM Studio expõem uma **API OpenAI-compatível em `localhost`** —
tanto **embeddings** (ex. `nomic-embed-text`) quanto **generativo** (llama/qwen/…). Pra um framework de
**GOVERNANÇA**, isso é decisivo:

1. **Soberania de dados** — os dados de governança (intents, capabilities, código) **nunca saem da máquina**.
   Crítico pra empresa (e exatamente o tipo de coisa que trava a adoção de IA-as-a-service).
2. **Custo zero de API** · **offline** · **sem lock-in**.
3. **Alinha com a espinha do framework:** `file`/`sqlite` = zero infra **local**; **LLM local = IA zero-infra-de-
   nuvem**. É a mesma filosofia "roda no laptop do dev solo" estendida à IA.

**O melhor dos dois (hybrid search).** Não é léxico **ou** IA — é **fusão**: combinar os rankings de léxico+tags e
de embeddings via **RRF** (reciprocal rank fusion, padrão de busca). O léxico/tags garante o piso explicável; o
denso pega o sinônimo. _(prior art: hybrid search lexical+dense; [RRF](https://learn.microsoft.com/en-us/azure/search/hybrid-search-ranking).)_

**Config (como se declara o matcher).** Espelha o `backend.yml`: um `matcher.yml` (ou campo) — ausente = `lexical`
(zero infra); pra plugar local, aponta `kind: ollama`, `endpoint: http://localhost:11434`, `model: …`.

**Determinismo × a D3 (view).** Lexical/tags é **determinístico** → pode ir no read-model (versionável se quiser).
Embedding/LLM é **não-determinístico** → **overlay runtime** (advisory, não-versionado). Coerente com a D3.

**Prior art (pública):** [Ollama](https://ollama.com/) (API local OpenAI-compat) · [sentence-transformers](https://www.sbert.net/) · RRF/hybrid search · roteamento de tool por _description_ no [MCP](https://modelcontextprotocol.io/) (o análogo direto de "subject × capability") · GraphRAG (grafo + recuperação).

> **Recomendação B:** porta `Matcher` com **(1) Lexical+tags como default** (v1, zero infra, dogfood) **+ (2) um
> adapter LLM/embedding apontando pra modelo LOCAL** (estilo Ollama) como **2º adapter** — provando que a porta
> cobre IA, igual o caminho `file→sqlite→neo4j→mongo` provou a porta `Repository`. Hybrid (RRF) como evolução.

---

## Thread adiante (Q3, parqueado) — o "gate de evolução": consultas → proposals/insights

Ideia da owner (Q3): **consultar o grafo regularmente** pra **SURFACE proposals/insights** automaticamente. Casos:

- 2 repos coordenam muito num mesmo contrato → **propor uma lib compartilhada** (uma `proposal`).
- uma tag que **nenhum repo provê** mas **intents pedem** → **gap** → `proposal` de "criar essa capability".
- um contrato `beta` muito consumido → **propor estabilizar**.

Conecta com a ferramenta **`proposal`** (intake) + o **experiment "proativo"** parqueado. É o grafo de conhecimento
virando **fonte de sinais de governança**. **Precisa da própria deliberação** ("ainda preciso entender melhor" —
owner) → registrado como **Q5** da deliberação do roteamento. **Não** desenhado aqui.

---

## Conclusão — a **Q2 refinada** (volta ao gate)

A Q2 deixa de ser "léxico vs IA" e passa a ser **três peças que se encaixam**:

1. **`capabilities → { text, tags? }[]`** (híbrido A+C; habilita o **grafo** repo×tag). _(reabre o shape — aditivo.)_
2. **porta `Matcher`**: **Lexical+tags default** (determinístico, o v1 do dogfood) **+ adapter LLM LOCAL** (a virada
   de chave; overlay runtime). Hybrid/RRF como evolução.
3. (parqueado) **Q5 — gate de evolução** (consultas → proposals/insights), deliberação à parte.

**Próximo passo (se ratificado):** implementar o **v1** — `capabilities {text,tags}` no domínio + `deriveRouting`
(Lexical+tags) + o **dogfood** (reproduzir e1→DS, e2→support, form-component→DS) → **depois** o adapter LLM local.
