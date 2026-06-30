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

## Escada de viabilidade (RTX 3060 12GB) — medido via `node _lib/routing-bench.ts`

| matcher                     | reproduz o dogfood | latência\* | nota                                       |
| --------------------------- | ------------------ | ---------- | ------------------------------------------ |
| **`lexical`** (tier 0)      | ✅ 4/4             | **0.0s**   | zero infra, determinístico — **o default** |
| **`nomic-embed-text`** (t1) | ✅ 4/4             | **0.6s**   | semântico, local — **o sweet spot**        |
| `qwen3:1.7b` (t2 simples)   | ✅ 4/4             | 42s        | o pequeno surpreende; lento                |
| `qwen3:4b` (t2 médio)       | ⚠️ 3/4 (errou e2)  | 113s       | **maior ≠ melhor** + o mais lento          |
| `gemma3:12b` (t2 alto)      | ✅ 4/4             | 86s        | acerta, mas caro pra a tarefa              |

\* latência da rodada completa (3 explore-points); inclui **cold-start** (carregar o modelo na VRAM). O `embed` já
aparece **warm** (0.6s) — a 1ª chamada fria foi ~38s.

**Conclusão (medida):** pra a tarefa estreita de **ranquear**, o **léxico e o embed (`nomic`) ganham** — exatos e
baratíssimos. O **generativo é mais lento e _não_ mais exato** aqui (o `qwen3:4b` até **regrediu** pra 3/4). Confirma
a research: **embeddings é o workhorse**; o generativo (tier 2) só compensa quando o **"porquê" em linguagem natural**
importa, não pro ranking puro. Critério: reproduzir e1→DS · e2→support · contratos via provides.

## Determinismo

Léxico = determinístico (poderia ir versionado). Embedding/LLM = **overlay runtime** (advisory, **não-versionado**) —
coerente com a **D3** (roteamento é view derivada no read-model do host, não fonte).
