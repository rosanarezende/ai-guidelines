<!-- ai-guidelines: review-boundary v=1 -->

# Review — Spec 0023 Workflow Runtime — readiness para Integration PR

> Boundary de prontidão do PR de integração (#26).
> **R1–R6 [x] → o #26 pode ser aberto.** O #26 foca em **convergência topológica
> e conflitos de merge**, não em descobrir pendências.
> **R7 (merge authorization) fecha após a homologação do #26** e é o gate do merge-stack.
>
> Gates determinísticos do runtime (sem IA, sem inferência):
>
> - opção 🔗 (Abrir Integration PR) bloqueia se **R1–R6** não estiverem `[x]`.
> - opção 🔀 (merge-stack) bloqueia se **R1–R7** não estiverem todos `[x]`.
>
> Migrado da antiga "Fase de Review" do [`tasks.md`](./tasks.md) (que agora é
> execution-only). Cf. `[DEC-0023-M01]`.

## Gates de prontidão (pré-integration)

- [ ] **R1** — Stack reviewed/ready: PRs #18, #19, #22, #23, #24, #25 em **Ready for review (GitHub)** + **aprovação humana explícita** — ≥1 review aprovado **ou** comentário textual do owner aprovando (exceção owner-only aceita e registrada). Evidência: link + status por PR. _(ex-3.7/3.8)_
- [x] **R2** — CI canônico verde: `yarn ci` verde na branch da stack (= `install --immutable` + `validate` + `test:smoke`); equivale aos workflows **Repo Validation** + **Smoke Tests (multi-OS)** + **Governance PR Check** no GitHub Actions. Evidência: link da run desses workflows. _(ex-3.2)_ **Verde local 2026-05-25:** `yarn ci` exit 0 — 645 testes + smoke verdes, living-docs sync, Prettier limpo. (Run do GitHub Actions a anexar quando o último push subir.)
- [ ] **R3** — Runtime smoke (manual, TTY). Evidência: logs curtos do terminal. _(ex-3.5)_
  - wizard abre e renderiza briefing da 0023;
  - opção 🔗 bloqueia com `review.md` aberto (R1–R6);
  - opção 🔀 bloqueia sem merge authorization (R7);
  - `release-prep --dry-run` coerente com o CHANGELOG (versão alvo + dist-tag).
- [ ] **R4** — PR bodies coerentes ponta-a-ponta: descrições finais coerentes (especialmente #25); drift "PR6" não existe; Bloco L refletido. Evidência: 1 linha por PR. _(ex-3.6)_
- [ ] **R5** — NEXT migrado para backlog: débitos e vigilâncias relevantes migrados para `.governance/specs/roadmap/backlog.md` **antes do merge**; a **deleção** do `NEXT.md` acontece no closure (`closure.md`), não aqui. Evidência: commit que migra. _(ex-4.1)_
- [x] **R6** — Critérios de aceite + spec pronta para Done: critérios de aceite do `spec.md` confirmados ponto-a-ponto; Blocos A–L do `decision-brief.md` `Resolved` (F05 `Deferred` com critério) e refletidos em `plan.md`; `tasks.md` (execution) 100% `[x]`; wording de fechamento do `spec.md` pronto para virar `Done` após merge. **R6 não exige executar o fechamento** — exige que o texto/paths estejam prontos e revisados; a execução (status `Done`, etc.) acontece no closure. Evidência: links/trechos. _(ex-3.3/3.4 + wording de 4.4)_ **Confirmado 2026-05-25:** 11 critérios do `spec.md` ticados ponto-a-ponto; A–L `Resolved` na tabela do decision-brief; `tasks.md` 100% `[x]`; `spec.md` em `In Review (Stage D)` pronto para `Done` no closure.

## Merge authorization (ato humano — gate do merge-stack)

- [ ] **R7** — Merge authorization explícita (owner): autorização textual explícita registrada ("autorizo merge atômico" + data). Centraliza o gate humano que vivia em `1.H.[REVIEW]`/`4.9` do `tasks.md`. _(ex-1.H.[REVIEW]/4.9)_

---

## Resultado

- **R1–R6 `[x]`** → Integration PR (#26) pode ser aberto.
- **R1–R7 `[x]`** → stack pode ser mergeada (merge-stack libera).
