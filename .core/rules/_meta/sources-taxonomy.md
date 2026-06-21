# Taxonomia de Fontes (`sources`) — Schema de Regras

> **Contexto:** O campo `sources` no schema YAML das regras (`rules.json`) aceita referências de diferentes naturezas. Este documento define as categorias via convenção de prefixo.

---

## Categorias de Fontes

| Prefixo         | Categoria            | O que representa                                                                                                              | Exemplo            |
| :-------------- | :------------------- | :---------------------------------------------------------------------------------------------------------------------------- | :----------------- |
| `CWE-*`         | **Normativo**        | Vulnerabilidade catalogada (MITRE CWE)                                                                                        | `CWE-703`          |
| `OWASP-*`       | **Normativo**        | Risco catalogado (OWASP Top 10)                                                                                               | `OWASP-A2`         |
| `EXT-*`         | **Empírico**         | Benchmark, estudo ou ferramenta externa                                                                                       | `EXT-AKITA-2026`   |
| `DOGFOOD-*`     | **Empírico-interno** | Aprendizado recorrente observado no dogfooding do próprio framework (guardrails `GG-*`); o sufixo cita a spec/ponto de origem | `DOGFOOD-0024-G02` |
| _(sem prefixo)_ | **Acadêmico/Livre**  | Papers, artigos, conferências                                                                                                 | `CONCUR 2025`      |

> **`DOGFOOD-*` (guardrails).** Um guardrail (`GG-*`) é uma regra cuja origem é **observação recorrente no uso do próprio framework** — não um normativo externo nem um benchmark. Critério para a fonte valer: o aprendizado **apareceu em ≥ 1 spec/ponto citável** (o sufixo registra quais — ex.: `DOGFOOD-0024-G00`) **e** está ligado a um check que pode falhar (senão é só texto). É o análogo interno de `EXT-*`: empírico, mas de dogfooding.
>
> **Guardrails são INTERNOS** (experimento da Spec 0024): vivem na constituição (`.core/process/governance-foundation.md` § "Guardrails dogfoodados") + checks em `src/cli/` — **não** entram em `rules.json` nem são projetados a consumidores. Promoção a consumer-facing é decisão futura. Por isso `DOGFOOD-*` ainda não rotula nenhuma regra do catálogo.

---

## Campo `validated_by_benchmark`

**Tipo:** `boolean` (opcional, default `false`)

**Significado:** A regra foi empiricamente validada por pelo menos um benchmark externo que testou o comportamento de modelos LLM contra o princípio descrito na regra.

**Quando marcar `true`:**

- Existe pelo menos uma fonte `EXT-*` em `sources` que é um benchmark empírico (não apenas tooling recomendado)
- O benchmark testou diretamente o princípio da regra (não por associação)

**Exemplo:**

```yaml
# GR-0004: Fail-fast error handling
sources: ["CWE-703", "EXT-AKITA-2026"]
validated_by_benchmark: true
# ↑ O benchmark Akita mede diretamente "error handling" como dimensão de auditoria
```

**Contra-exemplo:**

```yaml
# GR-0002: Strict typing
sources: ["CWE-704"]
# ↑ Sem validated_by_benchmark: nenhum benchmark externo testou typing diretamente
```

---

## Registro de Referências Externas (`EXT-*`)

| ID                   | Fonte                        | Tipo                                          | URL                                                                                              | Regras impactadas                   |
| :------------------- | :--------------------------- | :-------------------------------------------- | :----------------------------------------------------------------------------------------------- | :---------------------------------- |
| `EXT-AKITA-2026`     | llm-coding-benchmark (Akita) | Benchmark empírico (30+ modelos, 8 dimensões) | [github](https://github.com/akitaonrails/llm-coding-benchmark)                                   | GR-0001, GR-0004, GR-0005, OPT-0301 |
| `EXT-AIJAIL-2026`    | ai-jail (Akita)              | Tooling complementar (sandbox para agentes)   | [github](https://github.com/akitaonrails/ai-jail)                                                | GR-0001                             |
| `EXT-SONAR-LLM-2026` | Sonar LLM Leaderboard 2026   | Benchmark empírico (qualidade + segurança)    | [sonarsource](https://www.sonarsource.com/the-coding-personalities-of-leading-llms/leaderboard/) | GR-0006                             |

---

## Estado atual das regras validadas

| Regra        | `sources`                                                 | `validated_by_benchmark` | Justificativa                                                                                   |
| :----------- | :-------------------------------------------------------- | :----------------------- | :---------------------------------------------------------------------------------------------- |
| **GR-0001**  | OWASP-A2, CWE-522, EXT-AKITA-2026, EXT-AIJAIL-2026        | `true`                   | Benchmark Akita: Tier A protege secrets naturalmente. ai-jail: tooling operacional complementar |
| **GR-0004**  | CWE-703, EXT-AKITA-2026                                   | `true`                   | Benchmark Akita: error handling é o principal diferenciador entre tiers                         |
| **GR-0005**  | CWE-362, EXT-AKITA-2026                                   | `true`                   | Benchmark Akita + eval próprio: modelos usam Promise.all naturalmente                           |
| **GR-0006**  | CWE-1357, OWASP-CICD-A06, EXT-SONAR-LLM-2026              | `true`                   | Sonar LLM 2026: 19,7% de alucinação de pacotes; paper USENIX confirma repetibilidade            |
| **OPT-0301** | CWE-362, CWE-401, CONCUR 2025, paper 2025, EXT-AKITA-2026 | `true`                   | Benchmark Akita: qualidade de testes (mocks, coverage) é métrica auditada                       |
| **GR-0002**  | CWE-704                                                   | —                        | Nenhum benchmark testou typing diretamente                                                      |
| **GR-0003**  | _(vazio)_                                                 | —                        | Heurística declarada, sem fonte normativa ou empírica                                           |
