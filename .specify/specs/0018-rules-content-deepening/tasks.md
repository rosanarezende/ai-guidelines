# Tasks — Spec 0018 Rules Content Deepening

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Status: Draft

---

## Fase 0 — Setup e research

- [x] **0.1** Branch `feat/spec-0018-rules-content-deepening` criada a partir de `main`.
- [x] **0.2** `spec.md` instanciado.
- [x] **0.3** **[MANDATÓRIO]** Validação Humana: Aprovação do problema e escopo (já obtida via chat).
- [x] **0.4** `plan.md` e `tasks.md` criados.
- [x] **0.5** `roadmap/backlog.md` atualizado: spec 0018 em "Em execução", próximas specs priorizadas na fila "Now".

---

## Fase 1 — Execução

### Sub-bloco [A] — Refinamento do global-rules.md

- [x] **A.1** Adicionar diretrizes normativas sobre tipagem, concorrência, estado e erros no `global-rules.md`.
- [x] **A.2** Revisar para garantir concisão.

### Sub-bloco [B] — Aprimoramento do quality-gates.md

- [x] **B.1** Expandir a seção "Bugs Típicos de IA" com heurísticas de auditoria (N+1, Race Conditions, Memory Leaks).

### Sub-bloco [C] — Validação e Testes

- [ ] **C.1** Rodar `yarn check && yarn test`.
- [ ] **C.2** Se testes falharem (ex: snapshots baseados em conteúdo antigo), ajustar testes.

---

## Fase 2 — Validação cruzada e PR

- [ ] **2.1** Gerar output de teste do CLI e revisar o "Sanduíche de Contexto".
- [ ] **2.2** Atualizar `CHANGELOG.md`.
- [ ] **2.3** Criar PR Draft.
- [ ] **2.4** Obter aprovação final antes do Merge.
