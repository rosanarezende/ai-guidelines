# Tasks — Spec 0016 Adapters Opt-in (Trackers)

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)

---

## Fase 0 — Setup e Research

- [x] Criação da branch `feat/spec-0016-adapters-opt-in`.
- [x] Inicialização do boilerplates SDD (`spec.md`, `plan.md`, `tasks.md`).

---

## Fase 1 — Execução

### Sub-bloco A: Infraestrutura do CLI

- [ ] Modificar `cli/core/cli-input.mjs` para adicionar opções de seleção para `tracker-github`, `tracker-jira` e `tracker-linear`.
- [ ] Implementar os scripts base das features opt-in no CLI (`cli/features/opt-in/tracker-*.mjs`).
- [ ] Criar os arquivos de testes unitários para as novas features em `cli/features/opt-in/tracker-*.test.mjs`.

### Sub-bloco B: Conteúdo Markdown (Regras)

- [ ] Redigir a regra `.core/rules/opt-in/tracker-github.md` com guidelines específicas do GitHub Projects.
- [ ] Redigir a regra `.core/rules/opt-in/tracker-jira.md` com guidelines específicas do Jira.
- [ ] Redigir a regra `.core/rules/opt-in/tracker-linear.md` com guidelines específicas do Linear.

---

## Fase 2 — Validação cruzada e PR

- [ ] Confirmar que rodar `adopt --dry-run` não quebra a governança atual de consumidores que não optaram pelas features.
- [ ] Validar injeção das features quando selecionadas via CLI flags ou wizard.
- [ ] `yarn format ; yarn check ; yarn test` final verde (100% de testes passando).
- [ ] PR submetida a review com matriz SDD preenchida.

---

## Fase 3 — Encerramento

- [ ] Após merge: deletar `NEXT.md` (se criado), migrando débitos para o backlog global.
- [ ] Atualizar índice em `.specify/specs/research-index.md` se tiver pesquisa nova.
- [ ] Marcar spec 0016 como "Done" no cabeçalho.
- [ ] Mover spec de "Em execução" para Histórico no backlog.
