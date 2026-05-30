<!-- ai-guidelines-template: tasks-evidence-driven-boilerplate v=5 -->

# Tasks — Spec [Número] [Título Curto] — `evidence-driven`

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: Draft <!-- Draft | In Progress (Stage 1) | In Progress (Stage 2) | In Review | Done (PR #X — YYYY-MM-DD) -->

> **Progress file vivo.** Atualizar a cada degrau concluído. Quando uma decisão mudar, refletir em `plan.md` na seção 📐 "Decisões revisitadas" e ajustar tasks impactadas. Não retroceder status sem registro.

> **Variante `evidence-driven`.** Use este boilerplate quando o **Tipo de spec** declarado no header da `spec.md` é `evidence-driven` — i.e., o design depende de evidência técnica/pesquisa **ainda não coletada** (cf. `.core/process/governance-foundation.md` § "Tipos de spec"). A diferença canônica em relação ao boilerplate genérico é a expansão da **Fase 0** com Stage 1 (Research → Decision-Brief → Gate humano), executada **antes** da Implementação A. Stage 2 (Fases 1–4) só inicia após o gate humano resolver todos os pontos `[DEC-NNNN-*]` do `decision-brief.md`.
>
> Se a spec não cabe em `evidence-driven` puro, considere:
>
> - [`tasks-deterministic-boilerplate.md`](./tasks-deterministic-boilerplate.md) — design determinístico, sem Stage 1.
> - [`tasks-mixed-boilerplate.md`](./tasks-mixed-boilerplate.md) — Stage 1 condicional para sub-blocos identificados como evidence-driven.
