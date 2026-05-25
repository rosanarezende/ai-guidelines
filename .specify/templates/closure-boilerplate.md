<!-- ai-guidelines: closure-log v=1 -->

# Closure log — Spec NNNN — `<slug>` (pós-merge)

> Registra operações pós-merge: **o que foi feito, por quem, quando, e o que aconteceu**.
> **Não é gate** para abrir o Integration PR — é registro operacional.
> Merge authorization vive em `review.md` R8, não aqui. Modelo: cf. `[DEC-0023-M01]`.

## Linha do tempo

### T0 — Merge concluído

- Data:
- Owner:
- Stack mergeada:
- Observações:

### T1 — Release (se aplicável)

- Data / Owner:
- Versão publicada / dist-tag / tag git:
- Resultado: ✅ sucesso / ⚠️ incidente / ❌ falha

### T2 — Ajustes públicos (README / docs / imagens)

- Data:
- Mudanças aplicadas:

### T3 — Pós-release

- Bugs encontrados? Rollback necessário?
- Lições registradas (link para backlog/ADR se aplicável):

## Checklist final

- [ ] `CHANGELOG.md` consolidado (`Unreleased` → release publicada) + version bump em `package.json`, se a spec mudou comportamento publicado.
- [ ] `spec.md` header → `Done (PR #X — YYYY-MM-DD)`.
- [ ] Research migrado/links ok; `decision-brief.md` (se houver) permanece como artefato histórico.
- [ ] `roadmap/historico.md` atualizado; entrada removida de "Em execução" em `roadmap/backlog.md`.
- [ ] `NEXT.md` removido (após R5 confirmar a migração para o backlog).
- [ ] Uma-sessão-uma-spec confirmada.
