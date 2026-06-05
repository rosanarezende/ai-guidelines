<!-- ai-guidelines: review-boundary v=1 -->

# Review — Spec NNNN — `<slug>` — readiness para Integration PR

> Boundary de prontidão do Integration PR. **R1–R7 `[x]` → o Integration PR pode ser aberto.**
> O Integration PR foca em **convergência topológica e conflitos de merge**, não em descobrir pendências.
> **R8 (merge authorization) fecha após a homologação do Integration PR** e é o gate do merge-stack.
> Modelo de 3 boundaries (tasks/review/release-log): cf. `[DEC-0023-M01]`.
>
> Gates determinísticos do runtime (sem IA, sem inferência):
>
> - opção 🔗 (Abrir Integration PR) bloqueia se **R1–R7** não estiverem `[x]`.
> - opção 🔀 (merge-stack) bloqueia se **R1–R8** não estiverem todos `[x]`.
>
> Quando bloqueado, o runtime lista as linhas abertas deste arquivo + um bloco
> **"contexto pronto para colar na sua IA externa"** (spec id/slug, stage/gate, branch).

## Gates de prontidão (pré-integration)

- [ ] **R1** — CI canônico verde na branch da stack (suíte completa + smoke relevante). Evidência: link da run (nomeie o(s) workflow(s) canônico(s) do seu repo).
- [ ] **R2** — Runtime/feature smoke (manual). Evidência: logs curtos.
  - o runtime/feature foi exercitado manualmente e o comportamento confere;
  - opção 🔗 bloqueia com `review.md` aberto (R1–R7);
  - opção 🔀 bloqueia sem merge authorization (R8).
- [ ] **R3** — NEXT migrado para `roadmap/backlog.md` **antes do merge**; a **deleção** do `NEXT.md` acontece no encerramento (commit pós-merge) (`release-log.md`), não aqui. Evidência: commit que migra.
- [ ] **R4** — Publicação visual + public-facing. Os **prompts finais** já estão garantidos por-PR (gate de `Ready`, `governance-pr-check`); R4 é a **obrigação de publicação das imagens renderizadas**: gere as imagens canônicas (#1 Visão pretendida, #3 Valor entregue whole-spec, #4 Convergência) a partir dos prompts e **promova para `<spec>/assets/`** + atualize README/CHANGELOG. **Degradável** — se um gerador estiver indisponível, marque `[x]` com **deferral declarado** ("imagens diferidas: gerador X indisponível; prompts preservados nos PRs para render posterior") + a decisão de public-facing. _A imagem nunca bloqueia o Ready; aqui é publicação, retentável._ Evidência: links em `assets/` ou o deferral declarado.
- [ ] **R5** — Critérios de aceite do `spec.md` confirmados ponto-a-ponto; decisões do `decision-brief.md` (se houver) `Resolved` e refletidas no `plan.md`; `tasks.md` (execution) 100% `[x]`; wording de fechamento do `spec.md` pronto para virar `Done` após merge. **R5 não exige executar o fechamento** — exige que o texto/paths estejam prontos e revisados; a execução acontece no encerramento (commit pós-merge).
- [ ] **R6** — PR bodies coerentes ponta-a-ponta: cada body descreve corretamente sua entrega e o estado **já convergido** (R3–R5), sem drift factual. **Verifique quais precisam de fato:** em geral só o **PR terminal** (último da stack) consolida o estado final e concentra as atualizações; os PRs anteriores são **registro histórico** da própria entrega — não os reescreva só para uniformizar naming ou plano (drift-fixing histórico apaga a trilha de evolução). Atualize apenas quem tiver **drift factual** (ex.: referência a um PR inexistente, versão/números desatualizados, capacidade entregue não citada). Evidência: 1 linha por PR (atualizado, ou "coerente — sem ação").
- [ ] **R7** — Stack reviewed/ready + aprovação humana: todos os PRs da stack (exceto o Integration PR) em **Ready for review (GitHub)** + **aprovação humana explícita** — ≥1 review aprovado **ou** comentário textual do owner aprovando (exceção owner-only aceita e registrada). **Sign-off holístico, após R1–R6.** Evidência: link + status por PR.

## Merge authorization (ato humano — gate do merge-stack)

- [ ] **R8** — Merge authorization explícita (owner): autorização textual registrada ("autorizo merge" + data).

---

## Resultado

- **R1–R7 `[x]`** → Integration PR pode ser aberto.
- **R1–R8 `[x]`** → stack pode ser mergeada (merge-stack libera).
