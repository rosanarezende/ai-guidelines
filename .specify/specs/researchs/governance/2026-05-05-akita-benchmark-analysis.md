# Research — Benchmark Externo: Akita LLM Coding Benchmark

> **Fonte:** [github.com/akitaonrails/llm-coding-benchmark](https://github.com/akitaonrails/llm-coding-benchmark)
> **Autor:** Fabio Akita (@akitaonrails)
> **Data de leitura:** 2026-05-05
> **Relevância para Spec 0018:** Alta — fornece evidência empírica cruzada para as regras GR-0001, GR-0004, GR-0005, OPT-0301

---

## Descrição do Benchmark

Benchmark autônomo que testa LLMs gerando uma aplicação Rails completa (RubyLLM + Hotwire + Docker + testes). 30+ modelos testados via opencode, Claude Code e Codex CLI, com auditoria humana detalhada usando rubric padronizada de 8 dimensões (0-100):

1. Deliverable completeness (0-25)
2. RubyLLM integration correctness (0-20)
3. **Test quality** (0-15)
4. **Error handling** (0-10) ← diretamente relevante para GR-0004
5. Persistence/multi-turn state (0-10)
6. Hotwire/Turbo/Stimulus (0-10)
7. Architecture (0-5)
8. **Production readiness** (0-5) ← diretamente relevante para GR-0001 (secrets)

## Rankings (Top Tier A: 80-100)

| Modelo                | Score | Custo/run | Tier |
| :-------------------- | :---- | :-------- | :--- |
| Claude Opus 4.7       | 94    | ~$1.10    | A    |
| GPT 5.4 xHigh (Codex) | 94    | ~$16      | A    |
| GPT 5.5 xHigh (Codex) | 93    | ~$10      | A    |
| Kimi K2.6             | 84    | ~$0.30    | A    |
| Gemini 3.1 Pro        | 82    | —         | A    |
| Claude Opus 4.6       | 80    | —         | A    |

---

## Findings Relevantes para Nossas Regras

### Para GR-0001 (Secure secret handling)

**Rubric dimension 8 (Production readiness):** "No XSS (especially `sanitize: false` on LLM output), no leaked secrets, no committed `.env`, CSRF not disabled globally."

**Rubric dimension 1:** "No secrets in source files, .env, Dockerfile, compose, logs, or README" — item explícito no prompt de benchmark.

**Insight:** Modelos Tier A (Opus, GPT 5.4+, Kimi K2.6, Gemini 3.1 Pro) **todos** passaram na dimensão de produção/secrets. O benchmark confirma que modelos "everyday tier" naturalmente protegem secrets quando o prompt é explícito — alinhado com nosso EVAL-01 (Claude PASS baseline).

### Para GR-0004 (Fail-fast error handling)

**Rubric dimension 4 (Error handling, 0-10):** "Rescue blocks around LLM calls, missing API key preflight, user-visible degraded UI. No rescue = LLM hiccup = 500 page."

**Findings críticos:**

- **Claude Opus 4.6:** "Missing rescue around LLM calls" — score 80, nota mais baixa no Tier A
- **Modelos Tier C/D:** Consistentemente falharam em error handling
- **Pattern recorrente:** "Hallucinated APIs + tests that mock the hallucination" — testes passam, runtime crasha. **Exatamente** o anti-pattern que GR-0004 tenta prevenir.

**Insight:** Error handling é um **diferenciador real** entre tiers. Modelos Tier B/C frequentemente usam catch vazio ou ignoram erros. Isso valida que GR-0004 tem valor prático como instrução — não é apenas "senso comum" para todos os modelos.

### Para GR-0005 (Explicit async/concurrency)

Não há dimensão direta de concorrência no rubric (foco é Rails, que é primariamente síncrono). Mas o finding sobre `Promise.all`/parallelismo não é testável neste benchmark Rails.

**Insight parcial:** O pattern de "fire-and-forget" é observado indiretamente: modelos que não tratam erros em chamadas LLM assíncronas (Turbo Streams + Stimulus) produzem UX degradada.

### Para OPT-0301 (Quality Gates)

**Rubric dimension 3 (Test quality, 0-15):** "Do tests EXERCISE the LLM path? Do they mock the HALLUCINATED API (tests pass green against a bug)?"

**Finding devastador:** "Kimi K2.5 wrote 37 tests; none mock RubyLLM. Gemini 3.1 Pro wrote 11 tests with a correctly-signatured FakeChat — Gemini scored higher on test quality with fewer tests."

**Insight:** Quantidade de testes ≠ qualidade. Modelos que geram testes que mockam APIs alucinadas produzem **falsa sensação de segurança** (testes verdes + runtime quebrado). Isso reforça a regra OPT-0301 sobre mutation testing e sensores de bugs típicos de IA.

---

## Meta-Findings: Implicações para o Framework ai-guidelines

### 1. O harness importa mais que o modelo

> "The same Opus 4.7 model produced Tier A code (correct RubyLLM API) in opencode and Tier 2/3 code (hallucinated chat.complete) in Claude Code. Same model, different harness, different correctness."

**Implicação:** As regras injetadas via `AGENTS.md` (nosso "harness") podem ter **impacto maior** do que a escolha do modelo. Isso é a validação mais forte possível do valor do framework ai-guidelines.

### 2. Distillation não transfere API knowledge

> "A Qwen 3.5 27B distilled from Claude 4.6 Opus reasoning traces produced code that looks Claude-shaped but still hallucinated the RubyLLM API. API correctness is binary recall, not a reasoning skill."

**Implicação:** Regras que codificam API knowledge (ex: "use `process.env` para secrets, não hardcode") **não podem ser aprendidas por proxy** — precisam ser instruídas explicitamente. Reforça o valor da governança.

### 3. Multi-agent não resolve bugs de baseline

> "Multi-agent subagent patterns don't fire on cohesive tasks — even when forced. [...] produced equivalent-quality output at higher cost and longer wall time."

**Implicação:** Investir em regras individuais de qualidade (como as nossas GR-\*) é mais efetivo do que depender de orquestração multi-agente para corrigir bugs.

---

## Conclusão: Impacto no Eval da Spec 0018

O benchmark do Akita **suplementa significativamente** o nosso eval amostral:

1. **Confirma a hipótese do EVAL-01:** Modelos Tier A naturalmente protegem secrets (baseline já compliant).
2. **Valida o valor do GR-0004:** Error handling é diferenciador real entre tiers — não é "senso comum" universal.
3. **Reforça OPT-0301:** A contagem de testes é misleading; qualidade e cobertura real importam.
4. **Evidência mais forte: o harness importa.** Se o contexto (AGENTS.md) muda o comportamento como o harness (opencode vs Claude Code) mudou, nossas regras têm impacto real.

### Proposta para o eval

Dado que o Akita benchmark cobre 30+ modelos com 8 dimensões auditadas manualmente, proponho:

- **Reduzir** nosso eval amostral para **N=1 por provedor** (9 execuções totais em vez de 27)
- **Agregar** os findings do Akita como evidência externa no `eval-results.md`
- **Referenciar** o benchmark como `[EXT-AKITA-2026]` nas regras que ele suporta
- **Manter** o eval manual como validação do nosso subset específico (security/error/concurrency com prompts ad-hoc), não como benchmark competitivo

---

## Referências Externas Complementares

### [EXT-AIJAIL-2026] ai-jail — Sandbox para Agentes IA

> **Fonte:** [github.com/akitaonrails/ai-jail](https://github.com/akitaonrails/ai-jail) (371⭐)
> **Relevância:** Complemento operacional para GR-0001

Wrapper de sandbox multi-OS (Linux: bwrap + Landlock + seccomp, macOS: sandbox-exec) para agentes como Claude Code, Codex CLI e Gemini CLI.

**Insights acionáveis:**

1. **`--mask .env`** — mascara arquivos de secrets dentro do sandbox. O agente **nem vê** os secrets. Complemento perfeito para GR-0001: a regra diz "não hardcode", o ai-jail garante "não acesse".

2. **Env vars herdadas por padrão** — mesmo com sandbox, `process.env` é acessível. GR-0001 foca corretamente em **não expor no frontend**, não em "não ter acesso" (que seria o papel do sandbox).

3. **Config per-repo (`.ai-jail`)** — padrão de config-per-project validado por outro ecossistema. Análogo ao nosso `node.config.json`.

4. **Lockdown mode** — conceito de modos (permissivo vs estrito). Análogo à distinção regras "soft" vs "hard" que já usamos (heurísticas vs críticas).

**Ação proposta:** Documentar `ai-jail --mask .env` como tooling recomendado na descrição da regra GR-0001, na seção `sources` ou `rationale`. Candidato a future spec sobre "Secure Agent Execution".

### [EXT-PACT-2026] pact-lang — Linguagem AI-Native

> **Fonte:** [github.com/akitaonrails/pact-lang](https://github.com/akitaonrails/pact-lang) (44⭐)
> **Relevância:** Validação conceitual da direção do framework

Linguagem experimental S-expression onde toda função carrega metadata rica:

- **Provenance** (`:provenance {req: "SPEC-2024-0042"}`) → equivalente computacional da nossa rastreabilidade `[BR-*]` no BDD
- **Effect tracking** (`:effects [db-read http-respond]`) → GR-0005 tenta impor textualmente o que Pact impõe como constraint de linguagem
- **Totality** (`:total true`) → mesma intenção do GR-0004: sem caminhos silenciosos
- **Latency budgets** (`:latency-budget 50ms`) → metadata first-class vs. regra textual

**Insight:** Pact é prova de conceito de que os mesmos princípios das nossas regras podem ser codificados como constraints de linguagem. Não muda nossas regras atuais, mas **valida a direção** e sugere um horizonte futuro onde governança é verificável pelo compilador.

---

## Referências Canônicas

| ID                  | Fonte                | Escopo                           | Regras impactadas          |
| :------------------ | :------------------- | :------------------------------- | :------------------------- |
| `[EXT-AKITA-2026]`  | llm-coding-benchmark | Benchmark empírico 30+ modelos   | GR-0001, GR-0004, OPT-0301 |
| `[EXT-AIJAIL-2026]` | ai-jail              | Sandbox operacional para agentes | GR-0001                    |
| `[EXT-PACT-2026]`   | pact-lang            | Validação conceitual AI-native   | GR-0004, GR-0005           |
