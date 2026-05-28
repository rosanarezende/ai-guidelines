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

## Modos de aterrissagem da stack (`unit` / `sequential`)

> **Extensão cravada em `[DEC-0023-O03]`** (descoberta de dogfooding no fechamento da Spec 0023, 2026-05-27). A formulação original do "🔀 merge atômico" especificava **uma única mecânica** — merge sequencial de cada PR. O dogfooding (abertura do Integration PR #27) revelou que "atômico / ponta-a-ponta" admite **dois modos de aterrissagem** com consequências distintas de rollback, histórico e auditoria, e que o default natural induzido pela linguagem "one-shot / single" do ADR 0020 é o modo **`unit`**.

A **aterrissagem** (como a stack vai para `main`) é política com **default + override explícito**, **ortogonal** à estratégia de merge do host (`squash` / `merge-commit` / `rebase`, que o framework parametriza, nunca impõe):

- **`unit` (default).** A stack aterrissa como **uma unidade lógica**. O **veículo canônico** é o **PR terminal de implementação** — o nó terminal do topo-sort da stack. Exige stack **linear**; por essa linearidade o terminal carrega o diff acumulado **por construção** (não "o PR que contém tudo"). Resultado: **um SHA canônico** representa a spec em `main`; rollback é um comando.
- **`sequential` (override explícito).** Cada PR de implementação aterrissa individualmente, bottom-up (a mecânica original). **Não é inferior** — é a escolha certa quando (a) os PRs são reversíveis isoladamente, (b) a stack é rebase-friendly, (c) as dependências entre fatias são fracas, (d) deploy parcial é aceitável (deploy train, iniciativas independentes empilhadas por conveniência). O runtime **expõe o tradeoff operacional**; não desencoraja.

**Integration PR não é veículo de aterrissagem** (em ambos os modos, na semântica atual): permanece o artefato de homologação descrito acima. Em `unit`, sua **narrativa** (o que a spec entrega) vira a **mensagem do commit canônico** do veículo — o Integration PR tem valor operacional real sem ser mergeado. _(Wording descritivo da política corrente, não proibição ontológica: um repo poderia, por decisão própria, eleger o Integration PR como veículo para preservar approvals/checks/merge-queue — não é o default deste framework.)_

**`landed-via reconciliation`.** Os PRs da stack que **não são o veículo** (implementação não-terminais + Integration PR) são **reconciliados** ao estado `Closed` com a anotação **`landed-via: #<veículo> @ <SHA>`**. **Não são rejeitados** — seus commits estão em `main` via o veículo. Estado terminal **auditável**, distinto de "closed-as-abandoned"; o comentário liga cada PR ao SHA canônico.

**Determinismo (ADR 0018 preservado).** O modo é **escolha humana explícita** (wizard/flag), **nunca** auto-detectado do tipo da stack. `unit` **recusa** stack não-linear, orientando reconciliação de bases ou `sequential`. O `plan` imprime — antes de qualquer side-effect — modo escolhido, veículo, PRs reconciliados, SHA canônico resultante e **receita de rollback** do modo. Detalhe operacional completo em `[DEC-0023-O03]`.

## Por que este ADR existe

A confusão entre `Ready` e `Mergeable` **emergiu empiricamente** durante operação real da stack da Spec 0023 — não foi hipótese teórica. Múltiplas sessões de review (Codex, Claude, Antigravity, owner) trataram PRs convertidos para `Ready` como se já estivessem autorizados para merge, mesmo a stack tendo outros PRs upstream/downstream pendentes. A label `MERGEABLE` do GitHub reforça a ambiguidade porque só sinaliza ausência de conflito contra a branch base do PR — não diz nada sobre a stack inteira.

O ADR consolida o aprendizado para impedir recorrência cross-spec.

## Linguagem rejeitada (anti-distorção)

- ~~"Ready significa mergeable"~~
- ~~"GitHub MERGEABLE label autoriza merge"~~
- ~~"Draft = bloqueado"~~
- ~~"Stack inteira Ready = autorização implícita de merge"~~
- ~~"Conversão Draft→Ready é o gate final"~~
- ~~"Merge atômico = sempre sequencial (N merges)"~~ (admite `unit`/`sequential` — ver Modos de aterrissagem)
- ~~"Integration PR é o veículo de aterrissagem por default"~~ (por default é homologação; o veículo é o PR terminal de implementação)
- ~~"`unit` e `sequential` produzem o mesmo resultado em `main`"~~ (1 SHA canônico vs N commits)

## Sinais de violação (para PR review)

- PR `Ready` com stack incompleta (outros PRs Draft ou ausentes) + sem autorização textual do owner para merge → revisor deve clarificar antes de merge
- Template/body de PR sugerindo que `Ready` = mergeable → contradição com este ADR
- Automação tratando `MERGEABLE` label do GitHub como gate de merge final → bypass do gate humano
- Bot ou agente IA convertendo PR para `Ready` sem autorização explícita do owner → viola `[CORE-10]`

## Operational CLI commands para transactional governance ops

> **Extensão cravada em `[DEC-0023-L01]`** (Bloco L do decision-brief 0023; Frente C+D do hardening do PR #25, 2026-05-24). Estende o modelo de 3 estados com o **princípio de execução** correspondente: como humano autoriza a transição entre estados sem digitar sequências de `git`/`gh` na hora.

Operações governance-first com side-effects irreversíveis (merge atômico de stack, publicação npm, abertura de Integration PR) **devem viver atrás de CLI helpers transacionais** — não como sequência manual de `git`/`gh` digitada na hora, nem como automação stateful que decide pelo humano.

### Princípio

Um **CLI helper transacional** é **deterministic + human-gated + composable**:

1. **Detecta estado** factual a partir de artifacts vivos (`active-specs.yml`, `tasks.md`, `package.json`, `CHANGELOG.md`, etc.). Nunca infere intenção.
2. **Mostra plan completo** antes de qualquer side-effect — comandos exatos que serão executados, na ordem que serão executados.
3. **Aguarda confirmação humana** (prompt `y/n`) antes de iniciar.
4. **Executa atomicamente** dentro do possível; em falha mid-way, mostra estado parcial + permite retomada (`--continue-from <step>` ou similar).
5. **Suporta `--dry-run`** mostrando o plan sem executar, para auditoria/teste.

### Distinção de tiers por surface

| Tier                           | Surface                            | Side-effects                                                           | Exemplos                                                          |
| ------------------------------ | ---------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Tier 1 — Lookup**            | Wizard options de leitura/contexto | Nenhum (read-only) ou trivial (clipboard copy)                         | Briefing da spec ativa, listar índice público, diagnosticar drift |
| **Tier 2 — Coordination**      | Wizard options de governance ops   | Side-effects governance-first cross-spec (com confirmação obrigatória) | Publicar estado, abrir Integration PR, executar merge atômico     |
| **Tier 3 — Repo-specific ops** | Standalone `yarn guidelines <cmd>` | Side-effects repo-side (npm publish, tag push)                         | `release-prep`                                                    |

**Boundary cravado:**

- Tier 1 (lookup) e Tier 2 (transactional governance) **compartilham wizard surface** — operações cross-spec do framework
- Tier 3 (repo-specific) vive **standalone** para não poluir consumer repos que não usam aquela operação (ex.: consumer sem npm publish não precisa ver `release-prep` no wizard)

### Anti-patterns reafirmados mesmo em Tier 2/3

Mesmo com side-effects, as restrições de `[DEC-0023-B06]` continuam válidas:

- **Sem auto-detecção** de "próxima ação recomendada" — opções aparecem declarativamente, não em ordem de "prioridade"
- **Sem ranking/ordering** dinâmico do menu — ordem fixa cravada por DEC
- **Sem inferência de intenção** — humano escolhe explicitamente; sistema mostra plan + confirma
- **Sem auto-execução pós-merge** — bumping de versão, tagging, publicação são decisões humanas distintas, cada uma com seu próprio gate

## Operacionalização

Este ADR é materializado em dois artefatos cravados no PR #25 da Spec 0023:

**1. PR Template** (`.github/pull_request_template.md`, cravado em `[DEC-0023-J01]`):

- Seção "Status do ciclo de vida" no topo, com 3 estados distintos via `<kbd>`
- Frase explícita: _"Ready ≠ Mergeable. Stacks governance-first (ADR 0020) integram em sequência atômica ponta-a-ponta."_
- Seção "Merge authorization" textual curta (não checklist) — força owner a registrar autorização ou marcar como pendente
- Tipo opcional `Integration` para PRs de homologação/convergência de stack, explicitamente sem comportamento novo

**2. Operational CLI commands** (cravado em `[DEC-0023-L01]`, materializado em commits separados):

- **Wizard tier 2** (`yarn guidelines workflow`, opções 4 e 5):
  - `4. 🔗 Abrir Integration PR da spec ativa` — cria PR de Integration com body auto-detectado de `<spec>/integration-pr.md`
  - `5. 🔀 Executar merge atômico da stack` — aterrissa conforme o **modo** (ver "Modos de aterrissagem da stack"): `unit` (default) reescreve a base do PR terminal para `main`, mergeia e aplica `landed-via reconciliation` ao resto; `sequential` mergeia cada PR bottom-up. Sempre mostra plan + receita de rollback + confirmação humana
- **Standalone tier 3** (`yarn guidelines release-prep`):
  - Lê versão alvo de `CHANGELOG.md` `[Unreleased]`, mostra plan completo, aguarda confirmação, executa bump + tag + push → dispara `.github/workflows/release.yml`

## Não-objetivos

- Não substitui `[CORE-09]` / `[CORE-10]` / `[CORE-16]` — complementa, articulando o modelo de 3 estados que essas regras tangenciam.
- Não revoga o uso de `Draft` do GitHub — **restaura** o significado natural ("WIP", não "bloqueado").
- Não cria novo gate operacional — formaliza distinção que já existia implicitamente em ADR 0020.
- Não obriga toda stack a ter Integration PR. O padrão é opt-in quando a convergência/homologação final precisa ficar auditável em PR próprio.
- Não substitui `[DEC-0023-B06]` / `[DEC-0023-B07]` (wizard lookup-only e gate de "nova opção exige DEC") — **refina interpretação**: anti-patterns vetados em B06 eram **inferência** e **ranking**, não side-effects de opções escolhidas explicitamente pelo humano. Tier 2 do wizard preserva o gate (futuras opções 9+ exigem DEC própria).
- Não substitui `[DEC-0023-G03]` (publish-state manual-first) — **refina interpretação**: G03 protege contra **automação stateful que decide pelo humano**, não contra CLI helpers transacionais com plan + confirmation. CLI helpers que reduzem friction enxergada em advance (sem esperar critério de ≥ 2 casos observados) honram G03 desde que mantenham gate humano explícito.
- Não automatiza release pós-merge — `release-prep` exige invocação explícita pelo humano; merge da stack não dispara publish.
- Não responde **onde** a SSOT de CORE-09/10 vive (questão coberta por `[DEC-0023-F05]`, Deferred com critério estrutural vinculado à abertura da candidata `handoff-as-first-class`). F05 trata de **WHERE**; este ADR trata de **WHAT** os estados significam + **HOW** transições são executadas.

## Critério de revisão futura

Reabrir este ADR se:

- ≥ 2 specs externas adotarem stacks governance-first e ainda assim recorrer a confusão Ready/Mergeable → indica que o modelo de 3 estados precisa de operacionalização adicional (automação? CI lint? template ainda mais explícito?)
- Surgir proposta de automação que trate `MERGEABLE` label como gate final → reabrir como DEC anti-distorção dedicada antes de aprovar
- A candidata `handoff-as-first-class` (F05) materializar com SSOT de CORE-09/10 em forma que conflite com este modelo → reconciliar
