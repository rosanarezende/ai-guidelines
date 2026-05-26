<!-- ai-guidelines: release-log v=1 -->

# Release log — Spec 0023 Workflow Runtime (pós-merge, condicional)

> **Existe só quando há operação pós-merge** — tipicamente uma **release npm** e/ou
> ajuste de superfície pública. Spec puramente interna pode **não ter** este arquivo:
> o encerramento genérico (spec→Done, `historico.md`, `NEXT.md` removido) é o **commit
> de encerramento** pós-merge, com prontidão gateada em [`review.md`](./review.md) R5/R7.
>
> **Não é gate.** É registro operacional. Merge authorization vive em `review.md` R8.
> Cf. `[DEC-0023-M01]` (modelo de boundaries) + `[DEC-0023-N01]`.

## T0 — Release / merge (registro)

> Informações vêm do Integration PR (#27). Pode ser preenchido por
> `yarn guidelines release-prep` (evolução: auto-populate a partir do #27).

- Data / Owner:
- Stack mergeada: #18 → #19 → #22 → #23 → #24 → #25 → #26 (bootstrap alignment) (+ Integration #27)
- Versão publicada: `1.1.0`
- dist-tag / Tag git / GitHub release / run `release.yml`:
- Resultado: ✅ sucesso / ⚠️ incidente / ❌ falha

## T1 — Ajustes públicos (excepcional)

> README/imagens do entregável já foram decididos/feitos em `review.md` **R4**. Esta
> seção só existe se algo escapou ou é genuinamente pós-release: GitHub topics,
> descrição do repo, landing.

- Data / Mudanças aplicadas / Observações:

## T2 — Pós-release

- Bugs encontrados? Rollback necessário?
- Ações tomadas:
- Lições registradas (link para backlog/ADR se aplicável):
