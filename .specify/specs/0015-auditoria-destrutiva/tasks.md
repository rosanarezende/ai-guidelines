# Tasks — Spec 0015 Auditoria Destrutiva

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Status: Done

---

## Fase 0 — Setup e research

- [x] **0.1** Branch `feat/spec-0015-destructive-audit` criada a partir de `feat/spec-0008-A-B-F`.
- [x] **0.2** `spec.md` + `plan.md` + `tasks.md` criados.
- [x] **0.3** `roadmap/backlog.md` atualizado: registrar Spec 0015 como "Em execução".
- [x] **0.4** Mapeamento final de links que podem quebrar.

---

## Fase 1 — Execução

### Sub-bloco [A] — Limpeza Destrutiva

- [x] **A.1** Deletar `.core/docs/cinematic-ui-boilerplates.md`.
- [x] **A.2** Deletar `.core/docs/mcp/` (incluindo `registry.md`).
- [x] **A.3** Deletar `.core/docs/skills/` (incluindo `README.md`).
- [x] **A.4** Deletar `.core/docs/process/ai-review-ritual.md`.
- [x] **A.5** Deletar `.core/docs/process/project-init.md`.
- [x] **A.6** Mover `.core/docs/projects.md.example` para `.specify/templates/project-config-boilerplate.md`.
- [x] **A.7** Processar `.core/docs/advanced-ai-patterns.md`.
- [x] **A.9** Deletar `design/`.
- [x] **A.8** `yarn check && yarn test` verde.

### Sub-bloco [B] — Reparo de Referências e Roadmap

- [x] **B.1** Buscar referências aos arquivos deletados e limpar.
- [x] **B.2** Atualizar `roadmap/backlog.md` e `roadmap/historico.md` conforme novas regras de `spec-foundation.md`.

---

## Fase 2 — Validação e PR

- [x] **2.1** `yarn format ; yarn check ; yarn test` verde.
- [x] **2.2** PR Draft criado (#22).
