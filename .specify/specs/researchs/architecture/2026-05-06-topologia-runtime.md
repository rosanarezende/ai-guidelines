# Research: Topologia e Agrupamento do Runtime (AGENTS.md)

**Data:** 2026-05-06
**Domínio:** Arquitetura do Runtime e Engenharia de Prompt
**Relacionado a:** `[DEC-0019-B02]`

## 1. O Problema

Atualmente, as regras do `ai-guidelines` (`CORE-01` a `CORE-14`, e `GR-*`) são compiladas em uma lista sequencial plana dentro do `AGENTS.md`. A taxonomia no código (`rules.json`) não se reflete estruturalmente no Markdown final.
Isso gera perda de aderência do LLM (Context Rot local), pois:

1. Regras que tratam do mesmo fluxo (ex: Git, PRs, Commits) estão dispersas. O agente perde as orientações guia ao consultar o ciclo.
2. Regras que definem o ecossistema local (templates, `tasks.md`, `spec.md`) também estão misturadas com princípios gerais de código.

## 2. Evidência do Usuário (Insight)

- **Git Workflow disperso**: `CORE-04`, `CORE-06`, `CORE-08`, `CORE-07`, `CORE-09`, `CORE-10`, `CORE-14` e `GR-0203` tratam todos de ramificação, commits atômicos, harness lock, PRs e aprovação. Devem estar juntos num mesmo bloco "Git & PR".
- **Sistema de Templates (SDD)**: `CORE-02`, `CORE-11`, `CORE-13`, `GR-0101`, `GR-0202` formam o esqueleto do ciclo RPI e a localização do roadmap. Devem estar agrupados para que o agente entenda "como a especificação funciona neste repo".

## 3. Benchmarks de LLM Prompting

As melhores práticas de system prompting para modelos avançados (Claude 3.5+, GPT-4) recomendam agrupar instruções por **domínio semântico** usando cabeçalhos markdown fortes (`###`). Quando um modelo precisa resolver um problema de Git, ele atende melhor a um cluster de regras contíguas sob um cabeçalho `### Git & Version Control` do que a regras espalhadas.
Ver também o princípio de _Information Architecture_ em documentações: _Cohesion over chronological/numerical order_.

## 4. O que isso significa para o Compilador

O `compiler.mjs` precisará abandonar a compilação baseada na ordem de parsing/IDs (CORE-01, CORE-02...) e agrupar as regras pelo atributo `tags` ou introduzir um atributo de agrupamento (`group` ou `zone`) no `rules.json`.
Zonas sugeridas para o novo formato do `AGENTS.md`:

1. **Core Directives** (A regra de ouro, idioma, permissões críticas).
2. **Lifecycle & Spec System** (Como usar os templates, o `tasks.md`, o roadmap).
3. **Git & PR Workflow** (Commits atômicos, harness lock, PR drafts).
4. **Engineering Principles** (Regras puras de código: tipagem forte, pure functions).
5. **Opt-in Methodologies** (BDD, TDD, Quality Gates - já separados na zona centro).

Isso atende ao `[DEC-0019-B02]`.
