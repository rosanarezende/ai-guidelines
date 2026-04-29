# Tasks — Spec 0017: Process Refinement & CLI Refactor

> Spec: [./spec.md](./spec.md)
> Plan: [./plan.md](./plan.md)

> **Instrução para a IA Executora**: Atualize os checkboxes com `[x]` estritamente após a conclusão e aprovação nos testes locais. Cada tarefa do Bloco A e Bloco B deve ser um commit atômico e testável.

---

## Fase 0 — Setup e Research (Concluída)

- [x] **0.1** Branch `feat/spec-0017-process-cli-refactor` criada a partir de `main`.
- [x] **0.2** `spec.md` + `plan.md` + `tasks.md` criados a partir dos templates.
- [x] **0.3** `roadmap/backlog.md` atualizado com a fusão das specs.
- [x] **0.4** Pesquisa de concorrência OSS concluída (`research/concurrency-best-practices.md`).
- [x] **0.5** Pesquisa de Compliance Multi-Modelo (2026) concluída:
  - [x] **0.5.1** Boilerplate de pesquisa criado.
  - [x] **0.5.2** Consolidação via Deep Research (Veredito: Compilação Monolítica é essencial contra ManyIH).
  - [x] **0.5.3** Decisão arquitetural de Topologia e Tags XML transposta para os documentos de planejamento.

---

## Fase 1 — Desenvolvimento

### Bloco A — Process & Sanitization

- [ ] **A.1 (Lifecycle)**: Revisar a pasta `.specify/specs/researchs/`. Renomear os arquivos importantes (ex: a pesquisa da tarefa 0.5) com o padrão `YYYY-MM-DD-nome.md`. Mover para pastas temáticas e atualizar `.specify/specs/research-index.md`.
- [ ] **A.2 (Sanitização)**: Inspecionar o diretório `docs/`. Identificar documentos de regras técnicas e movê-los para `.core/rules/global-rules.md` ou transformá-los em módulos em `.core/rules/opt-in/`. Deletar documentação obsoleta.
- [ ] **A.3 (Bootstrap)**: Atualizar `.core/templates/AGENTS-core.md.tmpl`. Inserir diretiva explícita no passo inicial para forçar o agente a ler `.specify/specs/roadmap/backlog.md` antes de executar ações de código.

### Bloco B — CLI Architecture & Monolithic Compiler

- [ ] **B.1 (Imports POC)**: Adicionar o campo `"imports"` no `package.json` para `#core/*`, `#features/*`, `#formatters/*`. Modificar 1 arquivo simples (ex: `cli/formatters/package-context.mjs`) para usar o alias e rodar `yarn test` para validar suporte no Yarn Berry.
- [ ] **B.2 (Imports Massivo)**: Realizar um _Search & Replace_ seguro em toda a árvore `cli/features/` e `cli/core/` trocando caminhos relativos de subida (ex: `../../../core/...`) pelos novos aliases.
- [ ] **B.3 (Separação do Core)**: Refatorar `cli/core/engine.mjs` extraindo funções puras de leitura/escrita de arquivos para um novo `cli/core/io.mjs` e isolando o orquestrador.
- [ ] **B.4 (Motor de Compilação - Topologia)**: Refatorar a lógica de mesclagem (atualmente em `content-merge.mjs` ou equivalente). Implementar os três buffers:
  - Lógica para escrever `AGENTS-core` + Regras na zona "Topo".
  - Lógica para escrever `AGENTS-pointer` na zona "Base".
- [ ] **B.5 (Motor de Compilação - XML Tags)**: Adicionar lógica ao motor no loop dos módulos opt-in (zona "Centro"). Antes de anexar o conteúdo de arquivos como `tdd-pt.md` ou `quality-gates.md`, fazer o parser do nome da feature, criar tags relacionais (ex: `<FEATURE_TDD>`) e envolver o markdown lido, adicionando quebras de linha seguras.
- [ ] **B.6 (Garantia de Qualidade)**: Rodar `yarn check && yarn test` e atualizar quaisquer testes unitários de `content-merge` e `engine` que tenham quebrado por conta do novo output com tags XML.

---

## Fase 2 — Validação Cruzada e PR

- [ ] **2.1** Executar Smoke Test: rodar o comando da CLI localmente `node cli/ai-guidelines-cli.mjs adopt --target /tmp/consumer --dry-run`. Inspecionar o arquivo gerado para verificar se o Sanduíche de Contexto (Topo/Centro/Base) e as Tags XML foram construídos corretamente.
- [ ] **2.2** Testes de Integração: Atualizar o arquivo de testes de integração da CLI para suportar a nova estrutura monolítica.
- [ ] **2.3** Atualizar o `CHANGELOG.md` com a nova arquitetura do compilador em tempo de execução.
- [ ] **2.4** Gerar PR Draft via GitHub CLI com o template devidamente preenchido.

---

## Fase 3 — Encerramento (Após Merge)

> **[MANDATÓRIO]** Antes de abrir spec nova, completar este checklist.

- [ ] **3.1** `NEXT.md` (se existir): migrar débitos relevantes para `roadmap/backlog.md` e **deletar** o arquivo `NEXT.md`.
- [ ] **3.2** Marcar a Spec 0017 como `Done` no header do `spec.md` e no board correspondente em `roadmap/backlog.md`.
