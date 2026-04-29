# Tasks — Spec 0017: Process Refinement & CLI Refactor

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Status: Draft

> **Progress file vivo.** Atualizar a cada degrau concluído. Quando uma decisão
> mudar, refletir em `plan.md` na seção "Decisões revisitadas" e ajustar tasks
> impactadas.

---

## Fase 0 — Setup e research

- [x] **0.1** Branch `feat/spec-0017-process-cli-refactor` criada a partir de `main`.
- [x] **0.2** `spec.md` + `plan.md` + `tasks.md` criados a partir dos templates.
- [x] **0.3** `roadmap/backlog.md` atualizado: spec 0017 movida para "Em execução";
      candidatas `process-refinement` e `cli-refactor` removidas de "Now" (absorvidas).
- [x] **0.4** Pesquisa: Melhores práticas para concorrência em projetos OSS (visibilidade + justificativa). Resultado em `research/concurrency-best-practices.md`.
- [x] **0.5** Pesquisa de Compliance Multi-Modelo (2026):
  - [x] **0.5.1** Criação do boilerplate de pesquisa em `research/agents-vs-rules-compliance.md`.
  - [ ] **0.5.2** Consolidação via Deep Research (veredito em `analise-arquitetural...md`).
  - [ ] **0.5.3** Decisão arquitetural tomada: Padrão "Monolithic Compile" em execução.

---

## Fase 1 — Execução

### Sub-bloco [A] — Process & Governance Refinement

- [x] **A.1** Fix link quebrado em `.specify/specs/research-index.md`
      (remoção da entrada `governance-coherence-audit.md` deletado no commit `6c16e85`).
- [x] **A.2** Documentar política de Research Lifecycle em `docs/process/spec-foundation.md`
      (nova seção: quando linkar no index, o que deletar, o que é arquivo local vs central).
- [x] **A.3** Atualizar `tasks-boilerplate.md` Fase 3, item 3.2: reescrever para
      refletir política de "link no research-index, não mover arquivo".
- [x] **A.4** Aplicar política ao estado atual do repositório: revisar entradas de
      `research-index.md` e alinhar com os arquivos que existem em
      `.specify/specs/0008-governance-coherence/research/` e `researchs/`.
- [ ] **A.5** Implementar **Monolithic Runtime Compiler** no boot: - [ ] Script/lógica para fusão de `AGENTS.md` + `global-rules.md` + `backlog.md`. - [ ] Atualizar `.ai-guidelines/AGENTS.md` (template CLI) e o raiz.
- [ ] **A.6** Documentar concorrência de specs em `docs/process/spec-foundation.md`
      (nova seção focada em Visibilidade, Shared Context e Justificativa).
- [ ] **A.7** Reformatar `roadmap/backlog.md`: padronizar entradas como `**slug** (label)` (removendo números de specs legadas), incluir campo `Shared Context` para specs ativas e usar `<details>`.
- [ ] **A.8** Adicionar seção "Justificativa de Concorrência" no template `.specify/templates/spec-boilerplate.md`.
- [ ] **A.9** Pesquisar/implementar configuração de `concurrencyPolicy` em `.ai-guidelines/config.json`.
- [x] **A.8** Adicionar step em `tasks-boilerplate.md` e `spec-foundation.md` para exigir validação humana da spec antes do `plan.md` e `tasks.md`.
- [ ] **A.9** `yarn check && yarn test` verde após A.

### Sub-bloco [B] — CLI & Docs Structure

- [ ] **B.1** Pesquisa/validação: testar `imports` field do `package.json` (Node.js
      Subpath Imports) com Yarn Berry e Node 24 CI. Documentar resultado em
      `plan.md` seção "Decisões revisitadas" se houver incompatibilidade.
- [ ] **B.2** Configurar `imports` field em `package.json` com aliases `#core/*`,
      `#features/*`, `#formatters/*`.
- [ ] **B.3** Atualizar todos os imports relativos em `cli/features/` e `cli/core/`
      para usar aliases. Confirmar: nenhum import tem mais de 2 níveis de `../`.
- [ ] **B.4** Avaliar reorganização de `cli/core/` (baseado em resultado de A +
      pesquisa de responsabilidades). Executar reorganização se decisão for mover.
- [ ] **B.5** Auditar o propósito dos arquivos em `docs/`, avaliar consolidação em `.core/rules/` e reorganizar o restante em estrutura sidebar-ready (aguarda A.2 definir
      o que permanece em `docs/process/`). Atualizar refs em `README.md` e
      `AGENTS.md`.
- [ ] **B.6** `yarn check && yarn test` verde após B.

---

## Fase 2 — Validação cruzada e PR

- [ ] **2.1** Smoke test: `node cli/ai-guidelines-cli.mjs adopt --target /tmp/consumer
--dry-run` — output sem erros.
- [ ] **2.2** Critérios de aceite de `spec.md` e DoD de `plan.md` confirmados.
- [ ] **2.3** `CHANGELOG.md` atualizado com entrada para a versão.
- [ ] **2.4** PR Draft via `gh pr create --draft` com template preenchido.
- [ ] **2.5** Aguardar revisão humana antes de converter para Ready.

---

## Fase 3 — Encerramento (após merge)

> **[MANDATÓRIO]** Antes de abrir spec nova, completar este checklist.

- [ ] **3.1** `NEXT.md` (se existir): migrar débitos relevantes para
      `roadmap/backlog.md` e **deletar** o arquivo.
- [ ] **3.2** `research/`: cada arquivo significativo deve ser renomeado para incluir a data (`YYYY-MM-DD-nome.md`) e movido para a pasta de domínio em `.specify/specs/researchs/<domínio>/`. Linká-los no `.specify/specs/research-index.md`.
- [ ] **3.3** `spec.md` header: status → `Done`.
- [ ] **3.4** `roadmap/historico.md`: spec movida para "Specs concluídas"
      com data; entrada removida da seção "Em execução" em `roadmap/backlog.md`.
- [ ] **3.5** Confirmar que nenhuma spec subsequente foi aberta antes deste
      encerramento (regra: feche a anterior antes de abrir a próxima).
