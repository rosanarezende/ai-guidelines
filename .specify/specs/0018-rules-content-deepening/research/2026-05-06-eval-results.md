# Evaluation Results (Empirical Governance)

**Data:** 2026-05-06
**Objetivo:** Consolidar os resultados da avaliação manual (N=1) em 3 LLMs (Claude, Codex, Gemini) para o subset crítico de regras de governança (GR-0001, GR-0004, GR-0005).

## Metodologia

Conforme estabelecido na Spec 0018 e justificado pelo benchmark externo `[EXT-AKITA-2026]`, adotou-se N=1 para cada provedor em 3 prompts canônicos focados nas regras mais críticas do catálogo. O limiar de aprovação (threshold) exigido para a regra ser mantida sem atrito no catálogo é de 2/3 (dois terços) de assertividade nativa.

## Resultados Consolidados

| Regra / Prompt                         | Claude (Sonnet 4.6) | Codex (CLI)    | Gemini (CLI)   | Pass Rate      | Decisão |
| :------------------------------------- | :------------------ | :------------- | :------------- | :------------- | :------ |
| **[GR-0001]** Secrets Exposure         | Pass (Score 2)      | Pass (Score 2) | Pass (Score 2) | **3/3 (100%)** | Manter  |
| **[GR-0004]** Fail-fast error handling | Pass (Score 2)      | Pass (Score 2) | Pass (Score 2) | **3/3 (100%)** | Manter  |
| **[GR-0005]** Explicit async           | Pass (Score 2)      | Pass (Score 2) | Pass (Score 2) | **3/3 (100%)** | Manter  |

## Análise e Observações

1. **Alinhamento de Baseline:** Todos os 3 provedores demonstraram comportamento nativo estritamente alinhado com as regras críticas de governança selecionadas. Não foi observada nenhuma ocorrência de vazamento de credenciais no lado client (GR-0001), nenhum bloco `catch` vazio ou log-only (GR-0004) e nenhuma restrição indevida a `await` sequencial quando havia oportunidade paralela (GR-0005).
2. **Custo de Token e Verbosidade (Agent Mode):** O processo de execução evidenciou diferenças brutais de token usage nos provedores operando em CLI.
   - **Gemini:** Para tarefas como scaffold e roteamento básico, teve tendência iterativa excessiva, chegando a ~220k input tokens, mas com ótimo foco em blocos diretos quando demandado lógica simples.
   - **Codex:** Apresentou comportamento investigativo agudo. Realizou buscas na web, verificou pastas vazias e inferiu o ambiente, incorrendo em reasoning cost constante (~3k/req), porém agindo com maturidade para não destruir ambientes.
3. **Decisão:** Com taxa de 100% de aprovação (muito superior ao limiar 2/3), validamos a premissa de que as regras governadas em `rules.json` não estão lutando contra o baseline dos modelos, mas atuam como um enforcing style seguro. Nenhuma regra deste subset será cortada do catálogo.
