# Spec 0017 — Process Refinement & CLI Refactor (Monolithic Compiler)

> Status: Draft
> Author: Antigravity
> Date: 2026-04-28
> Owner: Rosana Rezende
> Plan: [`./plan.md`](./plan.md)

> **Princípio de imutabilidade:** após status `In Review`, este arquivo só muda por consenso explícito. Decisões em aberto vão para `plan.md` (vivo).
> **Fusão consolidada:** absorve as candidatas `process-refinement` e `cli-refactor` registradas em `roadmap/backlog.md`, com a adição crítica do "Monolithic Runtime Compiler" baseado na pesquisa de compliance de 2026.

---

## 🎯 Objetivo

O repositório `ai-guidelines` acumulou débitos estruturais críticos em três frentes distintas que precisam ser resolvidos sistemicamente:

1. **Compliance Algorítmico (O "Fixed-tier Bottleneck")**: Pesquisas de vanguarda (2026) revelaram que injetar múltiplos arquivos de regras fragmentados (`AGENTS.md`, `global-rules.md`, `tdd.md`) no contexto de um LLM de fronteira causa "Ambiguidade de Precedência". O modelo perde a hierarquia de obediência e ignora regras do meio do prompt ("Lost in the Middle"). A IA implementadora precisará transformar a injeção modular atual em um motor de **Compilação Monolítica em Runtime**, mantendo os arquivos separados no repositório (para humanos), mas fundindo-os num único artefato estruturado antes de enviar à API.
2. **Processo, Governança e Sanitização**: A política de lifecycle de pesquisas (`researchs/`) é vaga e gerou duplicatas. Adicionalmente, a pasta `docs/` possui conteúdos legados ou mal posicionados que precisam ser auditados; regras de negócio devem residir em `.core/rules/`, não em documentos soltos. O bootstrap dos agentes também precisa forçar a leitura do `backlog.md`.
3. **Arquitetura e Dependency Hell no CLI**: A CLI sofre de imports relativos profundos (ex: `../../../core/engine.mjs`) que fragilizam o código. A estrutura de `cli/core/` atualmente mistura I/O, Orquestração e Parsing.

---

## 📐 Escopo técnico

### A. Process, Governance & Sanitization

- **Lifecycle Rigoroso**: Formalizar o encerramento de specs. Arquivos em `research/` perdem a numeração temporária, ganham data ISO e vão para subpastas de domínio (`.specify/specs/researchs/<domínio>/`), com atualização obrigatória do `research-index.md`.
- **Auditoria de `docs/`**: Analisar todos os arquivos na pasta `docs/`. O que for regra de comportamento do agente migra para `.core/rules/`; o que for obsoleto será removido; o que for manual humano fica.
- **Workflow de Concorrência**: Criar um guia para gestão de branches simultâneas.
- **Agent Bootstrap**: Atualizar `.core/templates/AGENTS-core.md.tmpl` para exigir a leitura obrigatória do `backlog.md` logo na inicialização.

### B. CLI Architecture & Monolithic Compiler

- **Resolução de Dependências**: Implementar nativamente o campo `imports` no `package.json` para criar aliases (`#core/*`, `#features/*`, `#formatters/*`), eliminando de vez os caminhos relativos frágeis.
- **Isolamento do Core**: Refatorar o diretório `cli/core/` para separar explicitamente:
  - `orchestrator.mjs`: fluxo de execução da CLI.
  - `io.mjs`: operações puras de File System.
  - `content-merge.mjs` (que evoluirá para o `ast-compiler` descrito abaixo).
- **Engenharia de Posição Topológica (O "Sanduíche de Contexto")**: O `content-merge.mjs` deixará de ser um simples concatenador de strings. Ele deve montar o prompt final obedecendo estritamente as zonas de atenção do LLM:
  1. **Topo (Primazia)**: Injetar `AGENTS-core` + Regras do Provedor (`gemini.md` ou `claude.md`). Aqui ficam as "Prime Directives" (proibições absolutas).
  2. **Centro (Metodologia)**: Injetar os módulos _opt-in_ (`tdd`, `quality-gates`). **Requisito Crítico**: A CLI deve envelopar o conteúdo destes arquivos automaticamente em _Tags XML Relacionais_ (ex: `<FEATURE_TDD> ... </FEATURE_TDD>`) para evitar diluição semântica.
  3. **Base (Recência)**: Injetar o contexto imediato (`AGENTS-pointer`).

---

## 🚫 Out of scope

- Migração da base de código para TypeScript.
- Criação de novos módulos `opt-in` não existentes.
- Refatoração profunda do conteúdo semântico das regras (o foco é na arquitetura de injeção, agrupamento e envelopamento, não em reescrever o TDD).

---

## ⚠️ Riscos e invariantes

- **Invariante**: O comando `yarn check && yarn test` **deve** passar verde após cada commit.
- **Risco**: Aliases via `imports` do `package.json` podem conflitar com a resolução do Yarn Berry (PnP).
  - _Mitigação_: Testar uma POC isolada com 1 arquivo antes de aplicar refatoração massiva.
- **Risco**: A compilação monolítica gerar um artefato massivo que quebre a janela de contexto de modelos menores.
  - _Mitigação_: Garantir que o artefato é injetado como "System/Developer Message" para usufruir de descontos de _Prompt Caching_.

---

## 🛠️ Dependências

- **Specs pré-requisitos**: Spec 0008 (Governance Coherence) e Spec 0015 (Auditoria Destrutiva) concluídas.
- **Pesquisa Base**: `analise-arquitetural-de-governanca-para-agentes-autonomos-.md`.
