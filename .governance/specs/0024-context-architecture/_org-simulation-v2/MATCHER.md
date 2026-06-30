# Matcher do roteamento — do léxico (solo) ao LLM local (e ao plano hosted)

O **roteamento vertical** sugere, pra cada explore-point / contrato de uma intent, **qual repo** investigar/entregar —
cruzando o `need` × o `capabilities`/`provides` dos manifestos. É **advisory** (nunca alimenta o gate — Q4 da
[deliberação](../research/2026-06-29-vertical-routing-deliberation.md)).

Quem faz o "cruzar" é o **`Matcher`** — uma **porta plugável** (igual a `Repository` é file/sqlite/neo4j/mongo). O
default é **léxico, zero-infra**; dá pra plugar um **LLM LOCAL** (Ollama) sem mudar mais nada. Config no **host**:
`acme-governance/matcher.yml` (raiz do host).

## O espectro (do mais simples ao mais complexo)

| tier   | `kind`                             | o que é                                               | infra                | pra quem                                    |
| ------ | ---------------------------------- | ----------------------------------------------------- | -------------------- | ------------------------------------------- |
| **0**  | `lexical`                          | overlap de tokens + tags (determinístico, explicável) | **nenhuma**          | solo · CI · offline — **o default**         |
| **1**  | `ollama-embed`                     | embeddings num modelo LOCAL → cosine                  | Ollama nativo (+GPU) | solo+ com semântica, **dados na máquina**   |
| **2**  | `ollama-generate` _(planejado)_    | o modelo LOCAL lê e ranqueia **+ explica**            | Ollama + GPU         | ranking com racional, soberania             |
| **3a** | `openai`/`anthropic` _(planejado)_ | API hosted                                            | nuvem                | enterprise, escala/SLA — **gasta tokens**   |
| **3b** | `agent` _(planejado)_              | delega a um agente já instalado (Claude Code/Gemini…) | login do agente      | **usa o PLANO, sem tokens extras** (⚠️ ToS) |

> **tokens × plano (3a × 3b):** as APIs hosted (OpenAI/Anthropic) cobram **por token** (API key) — a assinatura de
> consumidor (ChatGPT Plus, Claude Pro) **não** é uma API. Pra usar o **plano** sem tokens extras, o tier `3b` delega
> a um **agente já instalado** (Claude Code via assinatura Claude · Gemini/Antigravity via login Google · Copilot) em
> modo headless. ⚠️ gray-area de ToS — ok pra dev/pessoal; conferir pra produção. Pra a tarefa estreita do matcher, o
> **local (tier 1/2) costuma ser a melhor resposta** (grátis, privado, determinístico-o-suficiente).

## Como rodar

### tier 0 (default) — nada

Sem `matcher.yml`, o matcher é **léxico**, zero infra. `node _lib/build.ts` loga `matcher: lexical (zero infra)`.

### tier 1 — LLM LOCAL (Ollama)

1. **Ollama no ar** (nativo, usa a GPU direto): no Windows já roda como serviço; senão `ollama serve`.
2. **puxe os modelos** — de `acme-governance/`: `npm run models:pull` (lista em `_lib/pull-models.ts`). Ou manual:
   ```bash
   ollama pull nomic-embed-text          # o tier 1 (embedding, ~270MB)
   ollama pull qwen3:1.7b qwen3:4b gemma3:12b   # a escada generativa (tier 2)
   ```
3. **ative** copiando o exemplo:
   ```bash
   cp acme-governance/matcher.yml.example acme-governance/matcher.yml
   ```
   ```yaml
   kind: ollama-embed
   endpoint: http://localhost:11434
   model: nomic-embed-text
   ```
4. `node _lib/build.ts` → loga `matcher: ollama-embed (nomic-embed-text) @ …`. `node _lib/routing-check.ts` roda o
   **dogfood** com o LLM (compara com o léxico).

> **Docker (opcional, paridade):** o Ollama pode rodar em container **no HOST** (`acme-governance`, não num work-repo —
> o matcher é host-level), mas exige o nvidia-container-toolkit pro GPU passthrough. **Nativo é mais simples.**

## Escada de viabilidade (RTX 3060 12GB) — _a preencher rodando_

| nível         | modelo             | reproduz o dogfood? | latência | VRAM | nota                          |
| ------------- | ------------------ | ------------------- | -------- | ---- | ----------------------------- |
| **embedding** | `nomic-embed-text` | ⏳                  | —        | —    | tier 1 (a ferramenta do rank) |
| **simples**   | `qwen3:1.7b`       | ⏳                  | —        | —    | vê o piso                     |
| **médio**     | `qwen3:4b`         | ⏳                  | —        | —    | sweet spot provável           |
| **alto**      | `gemma3:12b`       | ⏳                  | —        | —    | justo mas roda                |

Critério: **reproduz as escolhas humanas** do dogfood (e1→DS · e2→support · contratos via provides) **e** onde a
semântica pega sinônimo/conjugação que o léxico erra.

## Determinismo

Léxico = determinístico (poderia ir versionado). Embedding/LLM = **overlay runtime** (advisory, **não-versionado**) —
coerente com a **D3** (roteamento é view derivada no read-model do host, não fonte).
