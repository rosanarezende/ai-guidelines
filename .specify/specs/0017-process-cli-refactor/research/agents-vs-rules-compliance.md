# Pesquisa: Matriz de Compliance AGENTS.md vs global-rules.md (2026)

> **Status:** Em Andamento (Boilerplate)
> **Data da Pesquisa:** 2026-04-29
> **Objetivo:** Avaliar a eficácia da separação entre o contexto específico do projeto (`AGENTS.md`) e os princípios universais de engenharia (`global-rules.md`) em diferentes arquiteturas de LLM (Gemini 3, Claude 4, GPT 4.4).

---

## 1. Contexto e Racional

À medida que as janelas de contexto se expandem (1M+ tokens), a gestão da "Hierarquia de Instruções" torna-se crítica. Precisamos determinar se os modelos mantêm um compliance mais alto quando as instruções são categorizadas por responsabilidade ou se uma estrutura achatada (flattened) é mais resiliente.

### Hipótese de Hierarquia de Instrução

- **System Instructions (Global Rules):** Devem definir o "Como" (filosofia, quality gates, estética).
- **User Context (AGENTS.md):** Deve definir o "O Quê" (tarefa específica, arquitetura do projeto, stack ativa).

---

## 2. Benchmarking de Referência (Pesquisa Externa)

_(Espaço para documentar dados de benchmarks da indústria como IHEval, HieraSuite e relatórios de SOTA de 2026 antes de iniciar os testes práticos.)_

---

## 3. Protocolo de Validação (Testes Práticos)

### Cenários de Teste

1. **Cenário A (Coerência):** Ambos os arquivos são carregados. O modelo sintetiza corretamente o workflow do `AGENTS.md` com o estilo de código do `global-rules.md`?
2. **Cenário B (Conflito):** Uma regra específica em `global-rules.md` (ex: "Sempre use CamelCase") é contradita pelo `AGENTS.md` (ex: "Use snake_case para este módulo"). Qual prevalece?
3. **Cenário C (Ruído/Agulha):** Uma regra crítica é colocada nas marcas de 10%, 50% e 90% de uma janela de contexto de 200k+ tokens.

---

## 4. Matriz de Compliance (Resultados Esperados)

| Família do Modelo  | Nome do Modelo | Compliance de Hierarquia (A) | Resolução de Conflito (B) | Atenção ao Contexto (C) |
| :----------------- | :------------- | :--------------------------- | :------------------------ | :---------------------- |
| **Google**         | Gemini 3 Pro   | _TBD_                        | _TBD_                     | _TBD_                   |
| **Google**         | Gemini 3 Flash | _TBD_                        | _TBD_                     | _TBD_                   |
| **Anthropic**      | Claude 4 Opus  | _TBD_                        | _TBD_                     | _TBD_                   |
| **Anthropic**      | Claude 4 Haiku | _TBD_                        | _TBD_                     | _TBD_                   |
| **OpenAI (Codex)** | GPT 4.4        | _TBD_                        | _TBD_                     | _TBD_                   |
| **OpenAI (Codex)** | GPT 4.4-mini   | _TBD_                        | _TBD_                     | _TBD_                   |

---

## 5. Achados Empíricos

### 5.1 Análise Gemini 3

_(Reservado para anotações passo a passo)_

### 5.2 Análise Claude 4

_(Reservado para anotações passo a passo)_

### 5.3 Análise GPT 4.4 (Codex)

_(Reservado para anotações passo a passo)_

---

## 6. Conclusões e Recomendações para o CLI

_(Espaço para recomendações finais após validação completa.)_
