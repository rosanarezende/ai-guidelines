# Análise de Compliance: Monólito de Runtime vs Fragmentação Extrema de Features

## 1. O Problema da Fragmentação Multi-Módulo (A Explosão Combinatória)

O framework `ai-guidelines` utiliza uma arquitetura elegante para humanos, com uma pasta `.core` que injeta dinamicamente múltiplos arquivos Markdown no repositório alvo (`.ai-guidelines/rules/`). O ecossistema atual pode incluir simultaneamente:

- O ponteiro e core workflow (`AGENTS.md`)
- Regras universais de engenharia (`global-rules.md`)
- Restrições específicas de IA (`gemini.md`, `claude.md`, etc.)
- Módulos Editoriais Opt-in (`tdd.md`, `bdd.md`, `quality-gates.md`)

Embora excelente para modularidade de código, a pesquisa indica que submeter um Modelo de Linguagem de Fronteira (LLM) a essa quantidade de arquivos separados ativa o colapso "Many-Tier Instruction Hierarchy (ManyIH)". Em testes agentivos que abrangem múltiplas camadas e arquivos, a aderência normativa do modelo degrada "monotonicamente" conforme a contagem de instruções aumenta, caindo de 99% (em duas camadas) para cerca de 40%.

## 2. Impacto da Densidade de Instrução (Instruction Density) e Ambiguidade

Distribuir as regras entre o core, regras do provedor (ex: `claude.md`) e módulos _opt-in_ amplifica as anomalias estruturais documentadas pelo framework _Arbiter_.

- **Perda de Prioridade Semântica:** Se o `quality-gates.md` e o `tdd.md` são carregados separadamente do `AGENTS.md`, o LLM não tem uma âncora programática para saber quem "manda" no caso de um conflito de precedência. O modelo resolverá o conflito "silenciosamente através de qualquer heurística que seu treinamento forneça", muitas vezes ignorando completamente o TDD no meio de tarefas longas.
- **Saturação de Atenção:** O benchmark _IFScale_ prova que acima de certas densidades, os modelos de fronteira colapsam para 68% de precisão agregada. Ao espalhar a arquitetura em muitos metadados (múltiplos inícios e fins de arquivos), diluímos o foco (attention sinks) e impedimos o modelo de entender o axioma fundamental.

## 3. Matriz de Vetorização de Compliance (Famílias 2026)

| Família                   | Comportamento com Múltiplos Arquivos `.core` e `opt-ins`                                                                                                               | Estratégia Exigida pelo Runtime Compiler                                                                                                                                                        |
| :------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Claude 4 (Opus/Haiku)** | Requer altíssima coesão estrutural. Em processos TDD governados e fragmentados, as versões enxutas (Haiku) atingem só 30% de compliance na primeira iteração.          | Fusão unificada das _rules_ + _opt-ins_ no **System Prompt**. Uso exaustivo de linguagem relacional demarcada (tags XML) para aproveitar o desconto do _Prompt Caching_ (até 90%).              |
| **Gemini 3 (Pro/Flash)**  | Apesar de processar 2M de tokens, sofre de _truncamento agressivo_ em sessões longas, resultando em amnésia das regras iniciais se elas estiverem em módulos isolados. | Injeção de todos os artefatos `global` e `opt-in` de forma inequivocamente estruturada e **frontal (upfront)** num bloco maciço para evitar falhas de recuperação no longo prazo.               |
| **GPT 4.4 / 4.4-mini**    | Modelos nativamente orientados pela **Hierarquia de Instruções (ISE)** priorizando a "Developer Message".                                                              | Enviar _opt-ins_ como anexos de "Usuário" destrói a logprob de obediência. O compilador deve colocar TUDO (incluindo `tdd.md` e `quality-gates.md`) estritamente dentro da _Developer Message_. |

## 4. Veredito: O "Monolithic Runtime Compiler" é Mandatório

A presença da pasta `.core` rica em features exige a evolução da CLI (`cli/core/content-merge.mjs` e `engine.mjs`). A modularização no repositório (para humanos) deve ser traduzida via _scripting determinístico_ em um "Documento Mandatário Monolítico Unificado" em _runtime_. Sem isso, a promessa de TDD e Quality Gates autônomos será estatisticamente ignorada pela IA.
