# Spec 0018 — Rules Content Deepening

> Status: Draft
> Author: Rosana Rezende (via AI)
> Date: 2026-04-30
> Owner: Rosana Rezende
> Plan: [`./plan.md`](./plan.md)

> **Princípio de imutabilidade:** após status `In Review`, este arquivo só
> muda por consenso explícito. Decisões em aberto vão para `plan.md` (vivo).

---

## 🎯 Objetivo

As últimas specs focaram pesadamente na infraestrutura de injeção de contexto (Arquitetura de Ponteiros, Monolithic Compiler). Isso resultou em um motor de entrega de altíssima performance, mas o _conteúdo_ das regras injetadas, especialmente em `.core/rules/global-rules.md`, permaneceu procedural e genérico. Faltam diretrizes normativas de engenharia que orientem a IA sobre _como_ escrever código de excelência estrutural e prevenir falhas silenciosas.

O objetivo desta spec é realizar um "Content Overhaul". Vamos transformar o `global-rules.md` e o checklist de `quality-gates.md` em artefatos ricos, com padrões de engenharia concretos (Async, State Management, Erros) e exemplos acionáveis para sensores automáticos de "bugs de IA", elevando o padrão do código gerado antes de partirmos para novas frentes de arquitetura.

---

## 📦 Escopo

### Dentro do escopo

- **Auditoria e Expansão do `global-rules.md`:** Converter regras procedurais em diretivas normativas de engenharia de software (focando em concorrência, estado, erros e segurança local).
- **Refinamento de `quality-gates.md`:** Transformar os tópicos abstratos (ex: "Race Conditions", "N+1") em diretrizes com instruções claras de detecção para o agente IA.
- **Integração de Princípios de ADRs:** Garantir que o conteúdo normativo reflita o histórico de decisões de arquitetura do projeto.

### Fora do escopo (vira spinoff ou fica em outra spec)

- **Mudanças no motor de compilação CLI:** A infraestrutura construída na Spec 0017 não será alterada.
- **Spec 0012 (Segurança Supply Chain):** Criação de regras sobre OAuth e ferramentas externas será tratada em spec dedicada.
- **Spec 0011 (Hierarquia de Regras):** A fragmentação por subdiretórios (ex: `api/AGENTS.md`) será tratada em spec posterior, após o conteúdo base ser enriquecido.

---

## ✅ Critérios de Aceite (alto nível)

- [ ] O `global-rules.md` expandido contém diretrizes normativas claras para domínios comuns de engenharia, não apenas instruções de comportamento do agente.
- [ ] O `quality-gates.md` apresenta instruções detalhadas para que a IA atue como um sensor efetivo de "bugs de IA".
- [ ] Nenhum teste unitário ou de integração existente foi quebrado pela atualização dos artefatos.
- [ ] O CLI compila o `AGENTS.md` corretamente com o novo conteúdo expandido.
- [ ] PR Draft revisado e aprovado por humano antes de Ready.

---

## 🔬 Pesquisa de contexto

- Não há pesquisa exploratória nova planejada; a base é a análise de gaps (procedural vs normativo) identificada durante o planejamento e o conhecimento prévio sobre bugs típicos gerados por IA.

---

## 🛠️ Dependências e impactos (alto nível)

- **Pré-requisitos**: Spec 0017 (Process Refinement & CLI Refactor) concluída.
- **Specs afetadas**: Estabelece o "conteúdo base" que será posteriormente fragmentado pela futura Spec 0011.
- **Riscos macro**:
  - _Inflação de Tokens:_ Regras muito extensas podem aumentar o custo e o tempo de resposta em ferramentas como Claude/Gemini. O desafio é ser denso em valor, mas conciso em formato.

---

## 📚 Referências

- Specs relacionadas: 0017 (Infraestrutura), 0008 (Baseline inicial).
