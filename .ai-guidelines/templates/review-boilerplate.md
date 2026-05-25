<!-- ai-guidelines: review-boundary v=1 -->

# Review — Spec NNNN — `<slug>` — readiness para Integration PR

> Boundary de prontidão do Integration PR. **R1–R6 `[x]` → o Integration PR pode ser aberto.**
> O Integration PR foca em **convergência topológica e conflitos de merge**, não em descobrir pendências.
> **R7 (merge authorization) fecha após a homologação do Integration PR** e é o gate do merge-stack.
> Modelo de 3 boundaries (tasks/review/closure): cf. `[DEC-0023-M01]`.
>
> Gates determinísticos do runtime (sem IA, sem inferência):
>
> - opção 🔗 (Abrir Integration PR) bloqueia se **R1–R6** não estiverem `[x]`.
> - opção 🔀 (merge-stack) bloqueia se **R1–R7** não estiverem todos `[x]`.
>
> Quando bloqueado, o runtime lista as linhas abertas deste arquivo + um bloco
> **"contexto pronto para colar na sua IA externa"** (spec id/slug, stage/gate, branch).

## Gates de prontidão (pré-integration)

- [ ] **R1** — Stack reviewed/ready: todos os PRs da stack (exceto o Integration PR) em Ready for review com Gate de Review humano. Evidência: link + status por PR.
- [ ] **R2** — CI canônico verde na branch da stack (suíte completa + smoke relevante). Evidência: resumo/link da run.
- [ ] **R3** — Runtime/feature smoke (manual): exercitado manualmente e o comportamento confere. Evidência: logs curtos.
- [ ] **R4** — PR bodies coerentes ponta-a-ponta: descrições finais atualizadas, sem drift. Evidência: 1 linha por PR.
- [ ] **R5** — NEXT migrado para `roadmap/backlog.md`; `NEXT.md` fica vazio/deletável no encerramento. Evidência: commit que migra.
- [ ] **R6** — Critérios de aceite do `spec.md` confirmados ponto-a-ponto; decisões do `decision-brief.md` (se houver) `Resolved` e refletidas no `plan.md`; `tasks.md` (execution) 100% `[x]`; wording de fechamento do `spec.md` pronto para virar `Done` após merge.

## Merge authorization (ato humano — gate do merge-stack)

- [ ] **R7** — Merge authorization explícita (owner): autorização textual registrada ("autorizo merge" + data).

---

## Resultado

- **R1–R6 `[x]`** → Integration PR pode ser aberto.
- **R1–R7 `[x]`** → stack pode ser mergeada (merge-stack libera).
