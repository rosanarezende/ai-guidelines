# Pesquisa: Matriz de Compliance AGENTS.md vs global-rules.md (2026)

> **Status:** Concluído (via Deep Research consolidado em 2026-04-29)
> **Data da Pesquisa:** 2026-04-29
> **Fonte Primária:** [`analise-arquitetural-de-governanca-para-agentes-autonomos.md`](./analise-arquitetural-de-governanca-para-agentes-autonomos.md)

---

## 1. Contexto e Veredito

A investigação profunda confirmou a hipótese da Spec 0017: a fragmentação de regras em múltiplos arquivos injetados separadamente causa degradação de compliance devido ao **"Fixed-tier Bottleneck"** e à diluição da atenção em janelas de contexto massivas.

### Veredito Arquitetural

**A modularidade deve ser humana, a execução deve ser monolítica.**
A separação física dos arquivos no repositório é vital para manutenção, mas o tempo de execução (runtime) do agente exige uma **compilação determinística** em um único artefato injetado na camada de maior privilégio (Developer/System Message).

---

## 2. Benchmarking de Referência (Síntese 2026)

### Descobertas Críticas:

- **ISE (Instructional Segment Embedding):** Modelos modernos usam sinalização vetorial para priorizar instruções de sistema. Arquiteturas modulares diluem esse sinal.
- **ManyIH-Bench:** Modelos perdem drasticamente a obediência quando as camadas de privilégio (tiers) aumentam além de uma estrutura plana unificada.
- **Lost in the Middle:** Em contextos de 1M+ tokens, o centro da janela de contexto é uma "zona de degradação" para regras críticas.

---

## 3. Matriz de Compliance Consolidada

| Família do Modelo | Nome do Modelo | Comportamento de Hierarquia                        | Recomendação de Runtime               |
| :---------------- | :------------- | :------------------------------------------------- | :------------------------------------ |
| **Google**        | Gemini 3 Pro   | Excelente atenção, mas foco excessivo em contexto. | Injeção Frontal Monolítica (Upfront). |
| **Anthropic**     | Claude 4 Opus  | Melhor resolução de privilégios (System > User).   | Unificação em System Prompt único.    |
| **OpenAI**        | GPT 4.4        | Rigidez via Developer Message.                     | Fusão mandatária em Developer Role.   |

---

## 4. Recomendações para o CLI (Spec 0017)

1.  **Manter `AGENTS.md` e `global-rules.md` separados** para organização do repositório.
2.  **Implementar Step de Compilação no Boot:** O agente deve, ao iniciar, ler ambos os arquivos e o `backlog.md`, fundindo-os em um contexto único estruturado.
3.  **Hierarquia de Posição:**
    - Topo: Prime Directives e Restrições Negativas (Primazia).
    - Centro: Princípios de Engenharia (TDD, SDD).
    - Base: Tarefa imediata e contexto de trabalho (Recência).

---

## 5. Próximos Passos

- Implementar o padrão "Monolithic Compile" na Fase 1 da Spec 0017.
- Atualizar templates de `AGENTS.md` para refletir este novo padrão de boot unificado.
