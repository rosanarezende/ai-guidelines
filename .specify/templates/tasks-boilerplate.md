# Tasks — Spec [Número] [Título Curto]

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Status: Draft <!-- Draft | Active | Done -->

> **Progress file vivo.** Atualizar a cada degrau concluído. Quando uma decisão
> mudar, refletir em `plan.md` na seção "Decisões revisitadas" e ajustar tasks
> impactadas.

---

## Fase 0 — Setup e research

- [ ] **0.1** Branch `feat/spec-XXXX-<slug>` criada a partir de `main`.
- [ ] **0.2** `spec.md` + `plan.md` + `tasks.md` criados a partir dos
      templates em `.specify/templates/`.
- [ ] **0.3** `roadmap/backlog.md` atualizado: spec nova movida para "Em
      execução"; candidatas absorvidas migradas para `roadmap/historico.md`
      com ponteiro à spec absorvedora.
- [ ] **0.4** Pesquisa inicial em `research/` quando aplicável (mapeamento,
      auditoria, transcrições, benchmarks).
- [ ] **0.5** Síntese consolidada em `research/synthesis.md` (se a pesquisa
      tiver mais de 2 fontes).

---

## Fase 1 — Execução

Decompor por componente/sub-bloco do `plan.md`. Cada task deve ser observável
("o que muda no repo após esta task").

### Sub-bloco [A] — [nome]

- [ ] **A.1** Descrição da task (1-3 linhas, com path concreto).
- [ ] **A.2** Próxima task.
- [ ] **A.N** `yarn check && yarn test` verde após A.

### Sub-bloco [B] — [nome]

(...)

---

## Fase 2 — Validação cruzada e PR

- [ ] **2.1** Diff em consumidor real (ex.:
      `node cli/ai-guidelines-cli.mjs adopt --target ../<consumidor> --dry-run`)
      revisado.
- [ ] **2.2** Critérios de aceite de `spec.md` (alto nível) e DoD de `plan.md`
      (detalhado) confirmados.
- [ ] **2.3** `CHANGELOG.md` atualizado com entrada para a versão.
- [ ] **2.4** PR Draft via `gh pr create --draft` com matriz
      `.github/pull_request_template.md` preenchida; descrição aponta à spec.
- [ ] **2.5** Aguardar revisão humana antes de converter para Ready.

---

## Fase 3 — Encerramento (após merge)

> **[MANDATÓRIO]** Antes de abrir spec nova, completar este checklist.

- [ ] **3.1** `NEXT.md` (se existir): migrar débitos relevantes para
      `roadmap/backlog.md` e **deletar** o arquivo.
- [ ] **3.2** `research/`: cada arquivo significativo entra com link e resumo
      em `.specify/specs/research-index.md`.
- [ ] **3.3** `spec.md` header: status → `Done`.
- [ ] **3.4** `roadmap/historico.md`: spec movida para "Specs concluídas"
      com data; entrada removida da seção "Em execução" em
      `roadmap/backlog.md`.
- [ ] **3.5** Confirmar que nenhuma spec subsequente foi aberta antes deste
      encerramento (regra: feche a anterior antes de abrir a próxima).
