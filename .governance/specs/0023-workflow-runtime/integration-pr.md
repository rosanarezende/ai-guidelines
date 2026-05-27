<!--
  ARQUIVO DE AUTORIA — body source do Integration PR (Spec 0023).
  Consumido por `yarn guidelines workflow` → 🔗 (OpenIntegrationPR, DEC-0023-L01):
  o conteúdo abaixo vira o body do PR literalmente. Comentários como este NÃO
  aparecem no PR renderizado — são instruções para quem edita o arquivo.

  Convenções (DEC-0023-L01):
   - filename sem número de PR (só conhecido após `gh pr create`);
   - título é auto-gerado pelo wizard: "[🔗] [Integration] [Spec NNNN] Homologação final da stack";
   - mantenha "Owner authorization: pendente" até autorização textual de merge.
-->

# Spec 0023 — Workflow Runtime · Integração da stack

> Este é o **artefato de homologação** da stack (ADR 0024) — consolida a evidência de que a spec está coerente ponta-a-ponta. **Não é veículo de aterrissagem**: no merge atômico, quem entra em `main` é o PR terminal de implementação; este PR é encerrado via `landed-via reconciliation`.

## O que a Spec 0023 entrega

- **Workflow runtime no repositório** — operar o ciclo de uma spec (navegar, retomar, publicar estado, homologar, mergear) sem sair do git, com gates determinísticos e **zero LLM no runtime** (ADR 0018).
- **Descoberta de spec ativa em `main`** — índice público versionado, sem dashboard externo nem prompt humano denso.
- **Enforcement de execução** — o runtime recusa execução quando a spec não está autorizada (gate derivado, não campo manual).
- **Lifecycle de 3 boundaries** — `tasks.md` (execução) · `review.md` (prontidão de integração) · `release-log.md` (pós-merge).
- **Operações transacionais de stack, human-gated** — abrir Integration PR, merge atômico (modos `unit`/`sequential`), triagem de review.

> **Visual (opcional):** para gerar uma imagem explicativa do valor entregue, rode `yarn guidelines workflow` → opção 🎨 (Gerar prompt visual) e cole o prompt resultante na sua ferramenta de imagem. Prompts versionados em [`.governance/visual-prompts/`](../../../.governance/visual-prompts/).

## PRs integrados por esta stack

No **merge atômico (modo `unit`, default)** o PR terminal de implementação é o **veículo**; os demais — e este Integration PR — são **encerrados via `landed-via reconciliation`** (não rejeitados; seus commits entram em `main` via o veículo). Cf. ADR 0024 § Modos de aterrissagem.

| PR    | Entrega                                                                        |
| :---- | :----------------------------------------------------------------------------- |
| `#18` | Bootstrap + workflow runtime                                                   |
| `#19` | Lifecycle metodológico (ADR 0020/0021)                                         |
| `#22` | Followup `.governance` (backlog + CORE-02)                                     |
| `#23` | Runtime state index (`active-specs.yml` + `publish-state`)                     |
| `#24` | Enforcement runtime (`executionAuthorized` derivado)                           |
| `#25` | DX (wizard, clipboard, integração) + 3-boundary + comando `review`             |
| `#26` | Bootstrap alignment (scaffolding `.governance/` + sanitização + landing modes) |

## Validação (CI — não exige revisão manual de teste)

Os gates são **determinísticos e rodam no CI**; nada aqui pede que um humano revise testes à mão:

```bash
yarn ci   # install --immutable + validate (format + build + testes + living-docs) + smoke multi-OS
```

Equivale aos workflows **Repo Validation** + **Smoke Tests (multi-OS)** + **Governance PR Check**. Verde = stack íntegra.

## Rollback

- **Modo `unit` (default):** `git revert <SHA-canônico>` — **1 comando** desfaz a spec inteira (o merge do veículo é 1 commit em `main`). Com `merge-commit`: `git revert -m 1 <SHA>`.
- **Modo `sequential`:** reverter os N commits na ordem inversa; atenção à interdependência entre fatias — para spec coesa, prefira rollback total.

O `plan` do merge-stack imprime a receita exata + o SHA canônico após o merge.

## Status do ciclo de vida

> `Draft` ≠ `Ready` ≠ `Mergeable` (ADR 0024). Este PR pode estar `Ready` sem estar autorizado.

- [ ] **Draft** — trabalho em andamento
- [ ] **Ready for review** — homologação concluída; aguarda revisão humana
- [ ] **Authorized to merge** — owner autorizou o merge atômico da stack

## Merge authorization

**Owner authorization**: pendente

> O merge atômico só ocorre após autorização textual explícita do owner ("autorizo merge atômico" + data) — gate `review.md` R8. Este Integration PR não autoriza merge sozinho.

## Cross-refs

- **Spec**: `.governance/specs/0023-workflow-runtime/`
- **ADRs**: 0018, 0020, 0021, 0024
- **DECs**: J01, K01, L01, M01, N01, O01, O02, O03

## Disclosure de IA

Preparação do modelo assistida por IA (operação multi-agente sob supervisão humana); decisão final e autorização de merge permanecem com Rosana Rezende.
