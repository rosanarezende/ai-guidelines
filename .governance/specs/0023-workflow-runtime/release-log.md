<!-- ai-guidelines: release-log v=1 -->

# Release log — Spec 0023 Workflow Runtime (pós-merge, condicional)

> **Registro operacional da release.** O encerramento da spec (spec→Done, NEXT.md deletado, historico atualizado) acontece na branch antes do merge — não aqui. Este arquivo registra a operação de publish (npm, GitHub Release) que a CI executa após o merge.
>
> **Não é gate.** Merge authorization vive em `review.md` R8+R9.
> Cf. `[DEC-0023-M01]` (modelo de boundaries) + `[DEC-0023-N01]`.

## T0 — Release / merge (registro)

> Informações vêm do Integration PR (#27). Pode ser preenchido por
> `yarn guidelines release-prep` (evolução: auto-populate a partir do #27).

- Data / Owner: 2026-05-27 / Rosana Rezende
- Stack mergeada: #18 → #19 → #22 → #23 → #24 → #25 → #26 (bootstrap alignment) + Integration #27
- Versão publicada: `1.1.0`
- dist-tag / Tag git / GitHub release / run `release.yml`: _(preencher após CI — SHA, tag, link da run)_
- Resultado: _(confirmar após CI — ✅ sucesso / ⚠️ incidente / ❌ falha)_

## T1 — Ajustes públicos (excepcional)

> README/imagens do entregável já foram decididos/feitos em `review.md` **R4**. Esta
> seção só existe se algo escapou ou é genuinamente pós-release: GitHub topics,
> descrição do repo, landing.

- Data / Mudanças aplicadas / Observações:

## T2 — Pós-release

- Bugs encontrados? Rollback necessário?
- Ações tomadas:
- Lições registradas (link para backlog/ADR se aplicável):
