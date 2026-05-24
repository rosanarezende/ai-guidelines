# ADR 0024 — Draft, Ready e Mergeable são estados distintos em PRs governance-first

**Status**: Aceita
**Origem histórica**: Spec 0023 — PR #25 (hardening de fechamento, 2026-05-23/24). Confusão empírica observada durante review da stack `#18 → #19 → #22 → #23 → #24 → #25` em sessões com Codex, Claude e Antigravity. Cravado como `[DEC-0023-J01]` no decision-brief da 0023.
**Relaciona-se com**:

- [`ADR 0020 — Governance precede e protege execução`](./0020-governance-precede-execution.md) — fundamenta a regra de merge atômico ponta-a-ponta para stacks governance-first. Este ADR 0024 articula o modelo de 3 estados que torna esse merge atômico operacionalmente legível.
- [`CORE-09`](../../rules/top/agents-core.md#core-09-prs-abrem-como-draft-com-matriz-oficial) (PRs abrem como Draft) + [`CORE-10`](../../rules/top/agents-core.md#core-10-draft--ready-apenas-via-revalidação-humana) (Draft → Ready exige revalidação humana) + [`CORE-16`](../../rules/top/agents-core.md#core-16-sync-de-base--merge-atômico-ponta-a-ponta) (Sync de base ≠ merge atômico) — chegam perto mas nenhuma articula o modelo de 3 estados explicitamente. Este ADR consolida.

---

## Princípio canônico

Em fluxos governance-first com stacked PRs (per ADR 0020), os estados nativos `Draft` e `Ready` do GitHub denotam **pontos no ciclo de vida do PR**, **não** autorização de merge. Mergeability é estado terceiro distinto.

- **Draft** — trabalho em andamento. Significado natural do ecossistema. Não solicita review. **NÃO significa "bloqueado".**
- **Ready (for review)** — trabalho operacionalmente concluído; solicita revisão humana. **NÃO implica autorização de merge.**
- **Mergeable** — estado terceiro. Em stacks governance-first requer:
  1. Cada PR da stack em `Ready`
  2. Autorização explícita do owner para merge atômico ponta-a-ponta (per ADR 0020)
  3. Sem espera por validações pendentes (CI, review humano)

## Integration PR

Uma stack governance-first pode usar um **Integration PR** como PR agregador de homologação/convergência antes do merge final. Ele existe para validar que a stack inteira está coerente ponta-a-ponta, não para criar comportamento novo.

Semântica:

- **Integration PR** — homologa a convergência da stack aprovada. Consolida evidência de CI, smoke/manual test, status de lifecycle, PR bodies e pendências explícitas.
- **Não é "deploy PR"** — não representa publicação, release ou execução de deploy.
- **Não autoriza merge sozinho** — continua sujeito ao estado terceiro `Mergeable`: stack Ready + autorização explícita do owner + validações concluídas.
- **Não vira mega-PR criativo** — se surgir comportamento novo, ele volta para execution PR ou spec própria.

## Por que este ADR existe

A confusão entre `Ready` e `Mergeable` **emergiu empiricamente** durante operação real da stack da Spec 0023 — não foi hipótese teórica. Múltiplas sessões de review (Codex, Claude, Antigravity, owner) trataram PRs convertidos para `Ready` como se já estivessem autorizados para merge, mesmo a stack tendo outros PRs upstream/downstream pendentes. A label `MERGEABLE` do GitHub reforça a ambiguidade porque só sinaliza ausência de conflito contra a branch base do PR — não diz nada sobre a stack inteira.

O ADR consolida o aprendizado para impedir recorrência cross-spec.

## Linguagem rejeitada (anti-distorção)

- ~~"Ready significa mergeable"~~
- ~~"GitHub MERGEABLE label autoriza merge"~~
- ~~"Draft = bloqueado"~~
- ~~"Stack inteira Ready = autorização implícita de merge"~~
- ~~"Conversão Draft→Ready é o gate final"~~

## Sinais de violação (para PR review)

- PR `Ready` com stack incompleta (outros PRs Draft ou ausentes) + sem autorização textual do owner para merge → revisor deve clarificar antes de merge
- Template/body de PR sugerindo que `Ready` = mergeable → contradição com este ADR
- Automação tratando `MERGEABLE` label do GitHub como gate de merge final → bypass do gate humano
- Bot ou agente IA convertendo PR para `Ready` sem autorização explícita do owner → viola `[CORE-10]`

## Operacionalização

O `.github/pull_request_template.md` (redesign cravado em `[DEC-0023-J01]` Commit B) materializa este ADR com:

1. Seção "Status do ciclo de vida" no topo, com 3 checkboxes distintos: `Draft` / `Ready for review` / `Authorized to merge`
2. Frase explícita logo abaixo: _"Ready ≠ Mergeable. Stacks governance-first (ADR 0020) integram em sequência atômica ponta-a-ponta."_
3. Seção "Merge authorization" textual curta (não checklist) — força owner a registrar autorização ou marcar como pendente
4. Tipo opcional `Integration` para PRs de homologação/convergência de stack, explicitamente sem comportamento novo

## Não-objetivos

- Não substitui `[CORE-09]` / `[CORE-10]` / `[CORE-16]` — complementa, articulando o modelo de 3 estados que essas regras tangenciam.
- Não revoga o uso de `Draft` do GitHub — **restaura** o significado natural ("WIP", não "bloqueado").
- Não cria novo gate operacional — formaliza distinção que já existia implicitamente em ADR 0020.
- Não obriga toda stack a ter Integration PR. O padrão é opt-in quando a convergência/homologação final precisa ficar auditável em PR próprio.
- Não responde **onde** a SSOT de CORE-09/10 vive (questão coberta por `[DEC-0023-F05]`, Deferred com critério estrutural vinculado à abertura da candidata `handoff-as-first-class`). F05 trata de **WHERE**; este ADR trata de **WHAT** os estados significam.

## Critério de revisão futura

Reabrir este ADR se:

- ≥ 2 specs externas adotarem stacks governance-first e ainda assim recorrer a confusão Ready/Mergeable → indica que o modelo de 3 estados precisa de operacionalização adicional (automação? CI lint? template ainda mais explícito?)
- Surgir proposta de automação que trate `MERGEABLE` label como gate final → reabrir como DEC anti-distorção dedicada antes de aprovar
- A candidata `handoff-as-first-class` (F05) materializar com SSOT de CORE-09/10 em forma que conflite com este modelo → reconciliar
