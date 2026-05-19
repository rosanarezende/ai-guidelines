---

## Fase de Encerramento Pré-Merge

> **[MANDATÓRIO]** Esta fase ocorre **na branch do PR, antes do merge**. Nenhuma tarefa pós-merge — o pacote deve estar **100% auto-suficiente** no momento do merge. O merge só ocorre após este checklist completo.
>
> **Princípio de PR auto-suficiente:** ao mergear, o agente que vier depois não precisa abrir hotfix nem commit complementar para fechar a spec. Tudo o que a release precisa — status `Done`, histórico, changelog publicado, version bump, índices atualizados, research migrado — já está nesse mesmo PR.

- [ ] **4.1** `NEXT.md` (se existir): migrar débitos relevantes para `roadmap/backlog.md` (atualizando candidatas existentes ou abrindo novas) e **deletar** o arquivo.
- [ ] **4.2** Migração de research: cada arquivo significativo renomeado para `YYYY-MM-DD-nome.md` (se ainda não estiver) e movido para a pasta de domínio correta em `.specify/specs/researchs/<domínio>/`. Adicionar link + resumo em `.specify/specs/research-index.md`. Política completa em `.core/process/governance-foundation.md`.
- [ ] **4.3** `decision-brief.md` **permanece** no diretório da spec (`.specify/specs/NNNN-<slug>/`) como artefato histórico — **não migra**.
- [ ] **4.4** `spec.md` header: status → `Done (PR #X — YYYY-MM-DD)`.
- [ ] **4.5** `roadmap/historico.md`: spec movida para "Specs concluídas" com data; entrada removida de "Em execução" em `roadmap/backlog.md`.
- [ ] **4.6** `CHANGELOG.md`: se a spec mudou comportamento publicado, criar **release publicada** (`## [X.Y.Z] — YYYY-MM-DD`) — não deixar em `[Unreleased]`. Bumpar `version` em `package.json` na mesma operação. Refatorações internas e specs puramente documentais dispensam release.
- [ ] **4.7** **[MANDATÓRIO]** Confirmar que **a sessão atual** não abriu outra spec antes deste encerramento (cf. `.core/process/governance-foundation.md` § "Checklist de fechamento" — _uma sessão, uma spec ativa_, e research da Spec 0017 [`2026-04-29-concurrency-best-practices.md`](../specs/researchs/governance/2026-04-29-concurrency-best-practices.md)). Specs em paralelo conduzidas por outros contribuidores ou outras sessões **são permitidas** em repos OSS — a regra é por sessão de trabalho, não por repositório.
- [ ] **4.8** **[COMMIT]** `chore(spec-NNNN): encerramento pré-merge — research migrado, NEXT removido, status final`.
- [ ] **4.9** **[MANDATÓRIO]** Aprovação humana explícita para merge. **Não fazer merge autonomamente.**
