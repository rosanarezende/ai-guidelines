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
| **2**  | `ollama-generate`                  | o modelo LOCAL lê e ranqueia **+ explica**            | Ollama + GPU         | ranking com racional, soberania             |
| **3a** | `openai`/`anthropic` _(planejado)_ | API hosted                                            | nuvem                | enterprise, escala/SLA — **gasta tokens**   |
| **3b** | `agent` (`CliDelegateMatcher`)     | delega a um agente já instalado (Claude Code/Gemini…) | login do agente      | **usa o PLANO, sem tokens extras** (⚠️ ToS) |

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

### tier 3b — hosted via PLANO/login (SEM API tokens)

Delega a uma **CLI de agente que você já paga** (sem API key/tokens) em modo headless. Rode no stress:
`node _bench/cli-bench.ts [claude|codex|agy]`.

| provedor                   | comando headless                              | estado                                                                      |
| -------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| **Claude** (plano Claude)  | `claude -p '<prompt>'`                        | ✅ out-of-the-box (JSON limpo)                                              |
| **OpenAI** (plano ChatGPT) | `codex exec --skip-git-repo-check '<prompt>'` | ✅ funciona (ecoa o prompt → o parser pega o último `{…}`)                  |
| **Gemini** (login Google)  | `agy --dangerously-skip-permissions -p '…'`   | ⏳ a CLI não retornou output headless aqui (quirk); ⚠️ a flag desliga gates |

Como **matcher de verdade** (não só bench): um `kind: agent` no `matcher.yml` (planejado) com o `command`. O
`CliDelegateMatcher` roda a CLI num `cwd` **neutro** (o agente não mexe no repo) e parseia o JSON da resposta.

> ⚠️ **ToS:** usar uma assinatura de coding-agent pra workload de app é **gray-area** — ok pra dev/pessoal; conferir os
> termos pra produção. Pra a tarefa do matcher, o **local (tier 1/2)** evita isso de vez (e o `--dangerously-skip-permissions`
> do `agy` **desliga os gates de aprovação** — autorize conscientemente).

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

> ⚠️ **Ressalva — NÃO generalizar.** Este é um caso **pequeno e limpo**: poucos repos, capabilities **1-1 bem
> descritas + tags certas** → o léxico acerta fácil (ainda mais com o boost de tag). Ele **não testa** o cenário de
> **org/repo GIGANTE** — dezenas de repos, capabilities **ambíguas/sobrepostas**, **sinônimos/paráfrase**, **texto
> livre sem tags**, multilíngue — onde o léxico tende a **degradar** e embedding/LLM (local **ou hosted**:
> Claude/OpenAI/…) devem **abrir vantagem**. A conclusão acima vale **só pra este caso**; o **stress test** (escala +
> texto-livre) está **medido abaixo** ↓ (os modelos **hosted** seguem pendentes).

## Stress scenario (escala + texto-livre + distractors) — `node _bench/stress-bench.ts`

12 repos fictícios + 8 needs em **paráfrase** (overlap de token ~0 com o repo certo), **texto-livre (SEM tags)**, com
**distractors** e 1 **cross-lingual** (PT need × capability EN). Isolado do `login_1`; ground-truth conhecido.

| matcher                       | acertos | latência | leitura                                                              |
| ----------------------------- | ------- | -------- | -------------------------------------------------------------------- |
| `lexical` (t0)                | **2/8** | 0.0s     | **colapsa** — sem tags + paráfrase, cai pro repo de + tokens         |
| embed `nomic-embed-text` (t1) | **1/8** | 7s       | colapsa **porque o `nomic` é inglês** — em PT não separa (≠ falha)   |
| embed `bge-m3` [multi] (t1)   | **4/8** | 34s      | multilíngue **DOBRA** o nomic em PT (1→4), mas ainda longe — + lento |
| gen `gemma3:12b` (t2)         | **8/8** | 489s     | **acerta tudo** (cross-lingual + distractors); entende PT, mas LENTO |

**Leitura (o oposto do caso limpo):** no difícil, **o barato COLAPSA e o LLM ganha** — a hipótese da owner. Dois
alertas: (1) embed multilíngue **ajuda mas não basta** — o `bge-m3` dobrou o `nomic` em PT (1→**4/8**), mas segue muito abaixo do LLM (8/8): embeddings sozinho não dá conta da paráfrase difícil; (2) o
`gemma3:12b` acerta 8/8 mas a **489s** → abre a pergunta dos **modelos hosted** (mesma acurácia, mais rápido?).
Reforça o **gerador de capabilities**: capabilities bem-escritas fariam os tiers baratos recuperarem (garbage-in → só
o LLM sobrevive).

### Agent-delegate (tier 3b: via PLANO/login, SEM tokens) — `node _bench/cli-bench.ts [claude|codex|agy]`

Delega a um agente JÁ INSTALADO em modo headless (usa o plano/login — sem API tokens; ⚠️ ToS). No MESMO stress:

| matcher (3b)          | acertos | latência | nota                                                                                                              |
| --------------------- | ------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `claude -p` (Claude)  | **8/8** | 77s      | JSON limpo                                                                                                        |
| `codex exec` (OpenAI) | **8/8** | 56s      | precisa `--skip-git-repo-check`; ecoa o prompt (pega o último {…})                                                |
| `agy -p` (Gemini)     | ⏳      | —        | **trava headless mesmo com `--dangerously-skip-permissions`** (autorizado) — sem output; quirk da CLI Antigravity |

**Leitura:** no difícil, os hosted-via-plano (Claude **8/8 77s** · OpenAI **8/8 56s**) dão a MESMA acurácia do
`gemma3:12b` local (8/8) **~6–8× mais rápido** e **SEM tokens** (plano). O trade-off real: **local** = soberania mas
lento na 3060; **hosted-via-plano** = rápido + sem custo de token, ao preço de **mandar o texto pra fora** (⚠️ + ToS).

### tier 3a (API hosted) no stress — `node _bench/api-bench.ts`

API direta (key free do AI Studio; gasta cota). No MESMO stress:

| modelo                         | acertos | latência | nota                                                     |
| ------------------------------ | ------- | -------- | -------------------------------------------------------- |
| `gemini-2.5-flash-lite` (free) | **6/8** | **15s**  | pequeno/rápido — bom, mas < os grandes (8/8); o + rápido |
| `gemini-flash-latest` (free)   | —       | —        | 503 (overload transitório do Google)                     |
| `gemini-2.5-pro`               | —       | —        | **free=0** (pro exige billing pago)                      |

**Leitura:** um LLM hosted **pequeno e FREE** (flash-lite) já dá **6/8** — bem acima dos embeddings (1–4/8), mas abaixo
dos LLMs grandes (Claude/OpenAI/`gemma3:12b` = 8/8). E é o **mais rápido** (15s). Trade-off **tamanho × acurácia**
dentro do próprio hosted. ⚠️ o free tier do Gemini é **por modelo**: `flash-lite`/`latest` têm cota; `2.0-flash` e
`pro` = free 0 → exigem billing. (Key via header, gitignored; ver tier 3a no "Como rodar".)

## Determinismo

Léxico = determinístico (poderia ir versionado). Embedding/LLM = **overlay runtime** (advisory, **não-versionado**) —
coerente com a **D3** (roteamento é view derivada no read-model do host, não fonte).
