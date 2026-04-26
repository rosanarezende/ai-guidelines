# Pesquisa Técnica — `.specify\specs\0004-ai-dev-foundations-public-ready\reserarch-prompts`

## Executive Summary

A pasta `reserarch-prompts` (spec 0004) define um **programa estruturado de pesquisa em 6 trilhas** para fundamentar decisões de produto, engenharia e governança OSS do framework `ai-guidelines`, antes de qualquer implementação pesada. O escopo não é genérico: cada prompt já define fontes, formato de saída, critérios de citação e recomendações consolidadas para alimentar as vagas B/C/D do plano da spec.

Como arquitetura de trabalho, os prompts combinam três eixos: **benchmark externo** (OSS e AI-first), **extração de padrões internos** (repositórios da mantenedora) e **governança de memória técnica** (índice persistente de research), com vínculo explícito ao ciclo RPI e aos gates humanos da spec.

O principal achado é que esta pasta já funciona como um “design doc operacional” da Vaga A: ela antecipa critérios de qualidade, reduz ambiguidade de execução e cria rastreabilidade para decisões futuras (licença, templates AI-first, cobertura, e research index) sem misturar implementação prematura.

## Architecture/System Overview

```text
Spec 0004 (problema e metas)
        |
        v
reserarch-prompts/ (A.4-A.9)
  |        |         |
  |        |         +--> Benchmark de padrões de índice de pesquisa
  |        +------------> Benchmark OSS + AI-first (mercado 2025-2026)
  +---------------------> Extração de padrões de repos irmãos
        |
        v
research/*.md (artefatos com citações)
        |
        v
research/synthesis.md (A.10)
        |
        v
Decisões implementáveis nas vagas B/C/D + gate humano A.11
```

Esse fluxo é coerente com a regra de “Research antes de Implementação” declarada no plano da spec e com o protocolo RPI exigido globalmente.

## Componentes da pasta `reserarch-prompts`

### 1) Trilhas de extração interna (repos irmãos)

Os prompts **A.4** e **A.5** pedem varredura em arquivos de convenção de agentes (`AGENTS.md`, `CLAUDE.md`, `BEFORE_CODING.md`, `PROJECT.md`) e documentação contextual (`docs/`, `docs/ai-context/`). Em ambos, o objetivo não é copiar conteúdos, mas classificar o que é reutilizável, o que é específico e quais gaps existem no `ai-guidelines`.

### 2) Trilha de benchmark de repositório externo orientado por referência

O prompt **A.6 (`multica`)** exige análise de um repo externo com foco em higiene OSS, narrativa pública, padrões AI-first e testes, explicitando que a recomendação deve ser **aplicável ao contexto do `ai-guidelines`**. A estrutura pedida é de assessment de maturidade pública (LICENSE/CONTRIBUTING/CoC/SECURITY), não só leitura superficial de README.

### 3) Trilha de benchmark de mercado (OSS public-ready)

O prompt **A.7** consolida decisões normativas de repositório público: escolha de licença (MIT/Apache-2.0/BSL/Elastic-2.0), padrões de `CONTRIBUTING.md`, CoC (Contributor Covenant), `SECURITY.md`, templates de issue/PR, curadoria público vs. privado e estratégia bilíngue PT-BR/EN.

Ele também já lista repositórios de referência para comparação (como [anthropics/claude-code](https://github.com/anthropics/claude-code), [cline/cline](https://github.com/cline/cline), [aider-ai/aider](https://github.com/Aider-AI/aider), [continuedev/continue](https://github.com/continuedev/continue) e [github/spec-kit](https://github.com/github/spec-kit)).

### 4) Trilha de benchmark de AI-first development tooling

O prompt **A.8** expande o benchmark para padrões emergentes de 2025-2026: adoção de `AGENTS.md`, estruturas de `CLAUDE.md`, persistência de memória/contexto (Memory Bank, Cursor rules, Continue, Aider, auto-memory), catálogos de skills e práticas de eficiência de contexto.

Essa trilha dialoga diretamente com a Vaga C do plano (templates, `docs/ai-context/`, skills catalogadas e mecanismos legíveis por IA/humano).

### 5) Trilha de benchmark para índice de pesquisa persistente

O prompt **A.9** é o mais estratégico para continuidade entre specs: ele enquadra explicitamente o problema de “research legada inerte” e pede comparação com ADRs, RFCs e índices de conhecimento para recomendar um formato **auto-maintainable, queryable e unobtrusive**.

As referências-alvo incluem [Rust RFCs](https://github.com/rust-lang/rfcs), [Python PEPs](https://github.com/python/peps), [Kubernetes Enhancements](https://github.com/kubernetes/enhancements), além de padrões ADR (log4brains/adr-tools/MADR) como baseline de indexação e status.

## Integração com a spec 0004 (rastreamento de entrega)

A spec formaliza as mesmas lacunas que os prompts atacam: falta de fundação de testes/cobertura, dispersão de padrões AI-first e ausência de índice consultável de research histórica.

O `tasks.md` codifica isso de forma sequencial (A.4 a A.10 pendentes), e o `plan.md` define que B/C/D **não iniciam** sem base de research e síntese transversal. Em termos de engenharia de processo, essa modelagem evita decisões ad hoc e acopla pesquisa a critérios de “done” objetivos.

## Qualidade metodológica dos prompts

### Pontos fortes

1. **Escopo e output prescritivos**: cada prompt define seções obrigatórias, tamanho-alvo e tipo de citação (arquivo:linha ou URL), o que reduz variação de qualidade entre execuções.
2. **Orientação para decisão**: todos terminam em “recomendação consolidada para spec 0004”, não apenas inventário descritivo.
3. **Acoplamento com roadmap real**: os temas pesquisados mapeiam diretamente para entregáveis concretos das vagas B/C/D (testes, templates, hygiene, index).

### Riscos operacionais observados

1. **Carga de pesquisa elevada**: os alvos de tamanho (1200–1700 palavras por arquivo) em 6 trilhas podem aumentar custo e latência da Vaga A se não houver controle por síntese incremental.
2. **Dependência de benchmark externo**: parte relevante das trilhas depende de disponibilidade/qualidade de fontes externas, o que pode introduzir variação de profundidade entre tópicos.
3. **Erro ortográfico no path**: a pasta está nomeada como `reserarch-prompts`; embora funcional, isso aumenta risco de inconsistência de automação e busca futura.

## Recomendações concretas (com base no que já está definido)

1. **Manter a arquitetura de 6 trilhas + síntese**, pois já cobre descoberta interna, calibração externa e memória institucional de longo prazo.
2. **Tratar A.9 como pilar de plataforma**, não item documental secundário: ele é o mecanismo que evita re-trabalho em specs futuras.
3. **Criar critérios mínimos transversais de evidência** para as 6 trilhas (ex.: mínimo de fontes por seção, seção explícita “o que não copiar”), reforçando comparabilidade entre relatórios.
4. **Padronizar nomenclatura** (`research-prompts`) em próximo ciclo de manutenção para reduzir fricção de tooling (sem bloquear a execução atual).

## Key Repositories Summary

| Repositório                                                                   | Papel na pesquisa                                       | Onde aparece                     |
| ----------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------- |
| [rosanarezende/ai-guidelines](https://github.com/rosanarezende/ai-guidelines) | Repositório-alvo da spec 0004                           | `spec.md`, `plan.md`, `tasks.md` |
| [multica-ai/multica](https://github.com/multica-ai/multica)                   | Benchmark externo de estrutura/padrões                  | Prompt A.6                       |
| [anthropics/claude-code](https://github.com/anthropics/claude-code)           | Referência de padrões modernos de contribuição/AI-first | Prompt A.7                       |
| [cline/cline](https://github.com/cline/cline)                                 | Referência de AI tooling e práticas públicas            | Prompt A.7                       |
| [aider-ai/aider](https://github.com/Aider-AI/aider)                           | Referência de AI coding workflow                        | Prompt A.7/A.8                   |
| [continuedev/continue](https://github.com/continuedev/continue)               | Referência de regras/contexto para agentes              | Prompt A.7/A.8                   |
| [github/spec-kit](https://github.com/github/spec-kit)                         | Referência spec-driven pública                          | Prompt A.7                       |
| [rust-lang/rfcs](https://github.com/rust-lang/rfcs)                           | Modelo de arquivo/índice de decisões propostas          | Prompt A.9                       |
| [python/peps](https://github.com/python/peps)                                 | Modelo de indexação e status de propostas               | Prompt A.9                       |
| [kubernetes/enhancements](https://github.com/kubernetes/enhancements)         | Modelo KEP para governança evolutiva                    | Prompt A.9                       |

## Confidence Assessment

**Alta confiança (evidência direta):**

- Estrutura, objetivos, formato de saída e foco temático de A.4–A.9 estão explícitos nos próprios prompts.
- O encadeamento Research -> síntese -> implementação com gate humano está explícito em `plan.md` e `tasks.md`.
- As lacunas que motivam a spec (testes, AI-first patterns, research index, hygiene OSS) estão explicitamente registradas em `spec.md`.

**Confiança moderada (inferência razoável):**

- A interpretação de que `reserarch-prompts` funciona como “design doc operacional” é inferida da combinação de escopo prescritivo + critérios de saída + acoplamento com vagas subsequentes.
- O risco de custo/latência da Vaga A é inferido pelo volume total de entregáveis e targets de extensão textual.

**Baixa confiança / pendências externas:**

- Qualquer julgamento de “benchmark de mercado” definitivo depende da execução efetiva das pesquisas externas previstas em A.6–A.9; este relatório analisa o **programa de pesquisa**, não os resultados empíricos desses benchmarks.
