# CO-10.1 — inventario real + modelo canonico inicial

> Spec 0024 · `checkpoint-co-flow-convergence` · PR #43 (Draft, modo unit).
> Este arquivo registra o inventario vivo e falsificavel do fluxo governado.
> Nao executa Ready, Human Gate, merge, abertura de CO-5 nem avanco para CO-10.2.

## Retomada factual

Snapshot verificado em 2026-06-16:

- branch: `feat/spec-0024-co-flow-convergence`;
- HEAD local/remoto: `7f3b7b9`;
- PR: #43, open, Draft, base `feat/spec-0024-co-enforcement`;
- cursor: `co-flow-convergence` · `checkpoint-co-flow-convergence`;
- sub-checkpoint ativo: `CO-10.1 — inventario real + modelo canonico`;
- CI remoto: 11 checks verdes, 0 falhas, 0 pendentes;
- `guidelines work --authorization explicit-work-request`: modo `IMPLEMENT_CHECKPOINT`;
- reviews aplicaveis: `architectural_review`, `technical_audit` e `security_review` opcionais, ausentes, nao bloqueantes.

## Dogfood inicial — transicao pos-Human Gate do PR #42

A abertura do PR #43 e a ativacao de `co-flow-convergence` sao o primeiro caso
concreto deste no: a transicao de lifecycle ainda dependeu de uma pessoa/agente
orquestrando passos que deveriam estar modelados como fluxo governado.

Fatos observados:

1. Apos o Human Gate aprovado de `co-enforcement` (PR #42), `work` projetou o
   proximo movimento como transicao de no, mas nao havia comando canonico para
   abrir o proximo no planejado.
2. A transicao exigiu sequencia manual:
   - criar branch `feat/spec-0024-co-flow-convergence`;
   - atualizar `state.yml`;
   - atualizar `tasks.md`;
   - atualizar `.governance/runtime/specs/active.yml`;
   - abrir PR Draft;
   - corrigir o titulo para o token canonico `10️⃣`;
   - materializar sub-checkpoints para `work` sair de estado bloqueado e apontar
     `CO-10.1`.
3. O sistema exigiu `github_pr: 43` em `state.yml` antes de o PR existir. O numero
   foi inferido manualmente para manter a topologia coerente com o PR a ser aberto.
4. `handoff` e `work` so ficaram uteis para implementacao apos a materializacao
   manual do objeto em `tasks.md`.
5. Evidencia Git:
   - `071f59e docs(spec-0024): open co-flow-convergence node`;
   - `7f3b7b9 docs(spec-0024): materialize co-flow-convergence subcheckpoints`.

Interpretacao governada: esta nao e uma falha isolada de documentacao. E a
classe "dois caminhos tentando explicar o mesmo estado" aparecendo na fronteira
entre gate aprovado, topologia, branch, PR real, cursor de spec, sub-checkpoints e
briefing de trabalho.

Falsificacao esperada para CO-10.3/CO-10.4: uma transicao futura de no deve ser
executavel por comando governado unico ou por sequencia canonica declarada que
derive branch, PR body, titulo, cursor, projection update e objeto de trabalho sem
inferencias manuais de numero de PR nem edicao direta de projecao.

## Inventario real das fontes vivas

| Superficie viva                   | Fonte/SSOT atual                                                                                  | Projecoes/consumidores                                                         | Validacoes vivas                                                      | Drift observado                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Topologia de nos                  | `state.yml § topology`                                                                            | `handoff`, `work`, `decide`, PR title/base/head, `governance-pr-check`         | `state-yml:check`, `governance-pr-check`, `validate`                  | transicao para PR #43 exigiu edicao manual e `github_pr` antes do PR existir              |
| Cursor ativo                      | `state.yml § topology.cursor`                                                                     | `handoff`, `work`, `decide`, `.governance/runtime/specs/active.yml`            | `active-specs:check`, `handoff:check`                                 | projection update foi manual na abertura do PR #43                                        |
| Sub-checkpoint ativo              | marcadores em `tasks.md`                                                                          | `handoff`, `work`, `decide advance-subcheckpoint`, `decide human-gate`         | parsers/testes de sub-checkpoint, `active-specs:check` para readiness | `work` so ficou implementavel depois de materializacao manual dos sub-checkpoints         |
| Readiness de sub-checkpoint       | code-span `readiness: ready-for-transition` no `[/]` ativo                                        | `work`, `decide`, `handoff`                                                    | invariantes de readiness no validate                                  | readiness ja foi inferida por findings antigos antes da correcao de CO-3.5                |
| Reviews e eventos                 | `.governance/specs/<spec>/reviews/**`                                                             | `review:check`, `review policy`, `handoff`, `work`, `decide`, `pr-ready:check` | `review:seal`, `review:publish`, `review:check`                       | commits de publicacao de review ja invalidaram freshness antes da correcao funcional-head |
| Findings/resolutions/dispositions | review/resolution artifacts                                                                       | `work`, `decide close-dispositions`, `review:check`                            | `review:check` + fingerprints                                         | findings antigos ja influenciaram readiness indevidamente                                 |
| Human Gate                        | `.governance/specs/<spec>/gates/c-*.yml`                                                          | `handoff`, `work`, `decide human-gate`, topologia narrativa                    | `gate-decidability:check`, `review:check`                             | apos gate aprovado ainda nao existe comando para abrir o proximo no                       |
| PR Draft/Ready                    | GitHub PR (`isDraft`, state, head/base)                                                           | `handoff`, `work`, `decide`, `pr-ready:check`, `governance-pr-check`           | `gh pr view`, `gh pr checks`, `pr-ready:check`                        | PR body ja ficou stale em relacao a Draft/Ready durante PR #42                            |
| CI/checks                         | GitHub check-runs normalizados                                                                    | `handoff`, `decide`, `pr-ready:check`                                          | `gh pr checks`, workflows, `validate`                                 | contagens diferentes ja apareceram quando coletores divergiam                             |
| PR body/title                     | GitHub PR body + Template v3 + perfil de PR                                                       | reviewers, `governance-pr-check`, `pr-ready:check`                             | `governance-pr-check`, `pr-ready:check`                               | titulo do #43 precisou correcao manual para token canonico                                |
| Comandos runtime                  | `CommandRegistry` em `src/cli/registry/buildRegistry.ts`                                          | `--help`, dispatch, wizard bootstrap                                           | `CommandRegistry.test`, smoke/help, runtime guards                    | antes de CO-3.5 havia registry novo delegando para `/cli`                                 |
| Decisoes humanas                  | `DecisionRegistry` em `src/cli/decide/registry.ts` + `.core/governance/human-decision-policy.yml` | `decide`, `work.nextAction`                                                    | testes de `decide`/`work`/advance/human-gate                          | nao ha decisao registrada para "abrir proximo no"                                         |
| Contrato de trabalho              | `.core/governance/work-policy.yml` + snapshot situado                                             | `guidelines work`                                                              | testes de `workBrief`, `validate`                                     | formato de relatorio/autoridade ja dependia de mega-prompt antes do `work`                |
| Scripts/hooks/workflows           | `.core/governance/script-contracts.yml`                                                           | `package.json`, docs, hooks, workflows, templates                              | `script-contracts:check`, hooks                                       | divergencia de scripts foi resolvida por SSOT no CO-2.2                                   |
| Recibo de carga                   | `.git/ai-guidelines/handoff-load.json` (efemero)                                                  | `handoff:check`, advisories em comandos mutantes                               | `handoff:check`, testes de receipt                                    | fluxo ja reescreveu o recibo que deveria validar                                          |
| Consumidores init/adopt/update    | `src/domain/provisioning` + `src/app/use-cases` + `src/cli/delivery/bootstrap`                    | `init`, `adopt`, `update --providers`                                          | smoke/tarball/consumidores                                            | `providers` legado removido; precisa permanecer fora do registry                          |
| Integracao final                  | `state.yml` no terminal `integration-final` + review/release artifacts futuros                    | Integration PR, review R1-R9, merge unico                                      | validacoes de integracao futuras                                      | ainda nao ha jornada ponta a ponta falsificada neste no                                   |

## Modelo canonico inicial de estados

Estados de lifecycle, ainda como modelo inicial a confrontar em CO-10.2:

| Estado                      | Fato de entrada                                                    | Autoridade                          | Proximo estado esperado                           | Acoes proibidas enquanto neste estado                |
| --------------------------- | ------------------------------------------------------------------ | ----------------------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| `S0 nova-sessao`            | agente sem carga situada fresca                                    | repo/Git como verdade factual       | `S1 handoff-carregado`                            | implementar, Ready, Gate, merge                      |
| `S1 handoff-carregado`      | `handoff` emitido com selo e recibo                                | comando `guidelines handoff`        | `S2 trabalho-escopado`                            | mutar artefatos so com handoff narrativo             |
| `S2 trabalho-escopado`      | `work` projeta modo, objeto, permissoes e stop criteria            | `work-policy.yml` + snapshot        | `S3 implementacao` ou estado bloqueado            | trabalhar fora do objeto/mode                        |
| `S3 implementacao`          | explicit-work-request ativo para objeto atual                      | owner autoriza implementacao        | `S4 validacao-local`                              | review/gate/Ready/merge/proximo checkpoint           |
| `S4 validacao-local`        | diff, format/build/test/validate verdes                            | scripts governados                  | `S5 publicacao-commit`                            | push sem validacao relevante                         |
| `S5 publicacao-commit`      | commit atomico no escopo                                           | owner autorizou commit/push no modo | `S6 review-ou-readiness`                          | force-push, `--no-verify`, mixed scope               |
| `S6 review-ou-readiness`    | objeto implementado; reviews conforme policy                       | review policy + tasks readiness     | `S7 disposition-ou-advance`                       | findings abertos ignorados                           |
| `S7 disposition-ou-advance` | findings resolvidos/dispositions ou readiness ativa                | owner via `decide`                  | `S8 proximo-subcheckpoint` ou `S9 ready-precheck` | advance automatico sem decisao humana                |
| `S8 proximo-subcheckpoint`  | `advance-subcheckpoint` aplicado                                   | owner via `decide`                  | volta a `S2` no novo sub-checkpoint               | iniciar proximo sem marcador canonico                |
| `S9 ready-precheck`         | sub-checkpoints concluidos/terminal ready, PR body final, CI verde | scripts + GitHub                    | `S10 ready-github`                                | Human Gate antes de Ready                            |
| `S10 ready-github`          | PR nao Draft e `pr-ready:check` verde                              | owner converte PR para Ready        | `S11 human-gate`                                  | registrar gate sem decisao                           |
| `S11 human-gate`            | `decide human-gate` disponivel                                     | Rosana                              | `S12 pos-gate-transicao`                          | merge, abrir proximo automaticamente                 |
| `S12 pos-gate-transicao`    | gate artifact approved publicado                                   | owner autorizou transicao de no     | `S13 proximo-no-draft`                            | implementar novo no antes de abrir cursor/PR correto |
| `S13 proximo-no-draft`      | branch/PR/cursor do proximo no alinhados                           | topologia + GitHub                  | `S2 trabalho-escopado`                            | CO-5/next node sem autorizacao                       |
| `S14 integracao-final`      | ultimo no de execucao gated; integration-final ativo               | policy da spec                      | `S15 merge-final`                                 | merge parcial de no intermediario                    |
| `S15 merge-final`           | Integration PR aprovado conforme R1-R9/R8                          | owner                               | spec encerrada                                    | merge sem gate terminal                              |

## Transicoes canonicas iniciais

| ID    | Transicao                           | Fato de entrada                                           | Autoridade                               | Comando atual                                                      | Efeito permitido                        | Artefato alterado                                | Validacao                             | Proximo estado | Acoes proibidas                     |
| ----- | ----------------------------------- | --------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------ | --------------------------------------- | ------------------------------------------------ | ------------------------------------- | -------------- | ----------------------------------- |
| `T01` | nova sessao -> handoff              | branch/repo existem                                       | qualquer operador                        | `npm run guidelines -- handoff 0024`                               | emitir briefing e recibo efemero        | `.git/ai-guidelines/handoff-load.json`           | `handoff:check`                       | `S1`           | mutar repo                          |
| `T02` | handoff -> work                     | selo fresh ou degradacao explicita                        | owner autoriza trabalho quando aplicavel | `npm run guidelines -- work --authorization explicit-work-request` | projetar modo/escopo                    | nenhum versionado                                | `work` exit 0                         | `S2`           | extrapolar escopo                   |
| `T03` | work -> implementacao               | objeto ativo e permissao                                  | owner                                    | n/a (trabalho do agente)                                           | editar arquivos do objeto               | arquivos do escopo                               | diff/testes                           | `S3`           | review/gate/Ready                   |
| `T04` | implementacao -> validacao          | mudancas prontas                                          | contrato de scripts                      | `git diff --check`; `npm run format`; `npm run validate`           | formatar/validar                        | possivel format                                  | comandos verdes                       | `S4`           | commit se validate falha            |
| `T05` | validacao -> commit/push            | tree validada                                             | explicit-work-request                    | `git add <arquivos>`; `git commit`; `git push`                     | publicar commit atomico                 | Git                                              | hooks + CI                            | `S5`           | `--no-verify`, force-push           |
| `T06` | implementacao -> review             | pedido explicito de review                                | owner                                    | `guidelines review <tipo> --authorization explicit-review-request` | criar/selar/publicar artefato de review | `reviews/**`                                     | `review:check`                        | `S6`           | review fora do tipo                 |
| `T07` | finding -> resolution               | finding aberto                                            | explicit-work-request                    | trabalho + resolution artifact                                     | corrigir escopo e registrar resolucao   | codigo/docs + `reviews/*resolutions.yml`         | `review:check`                        | `S6`           | disposition pelo implementador      |
| `T08` | resolution -> disposition           | verificacao aprovada                                      | Rosana via `decide`                      | `guidelines decide --type close-dispositions`                      | fechar/dismiss/accept finding           | review/resolution artifact                       | `review:check`                        | `S7`           | autoaprovar finding                 |
| `T09` | sub-checkpoint pronto -> advance    | `readiness: ready-for-transition` no `[/]`, proximo `[ ]` | Rosana via `decide`                      | `guidelines decide --type advance-subcheckpoint`                   | `[/] -> [x]` e `[ ] -> [/]`             | `tasks.md`                                       | `work` aponta novo objeto             | `S8`           | implementar proximo automaticamente |
| `T10` | ultimo sub-checkpoint -> Ready prep | terminal ready e nenhum proximo `[ ]`                     | owner/scripts                            | `pr-ready:check -- --pr <n>`                                       | validar precondicoes Ready              | nenhum                                           | pr-ready verde                        | `S9`           | advance-subcheckpoint indevido      |
| `T11` | Draft -> Ready                      | precondicoes Ready verdes                                 | Rosana                                   | `gh pr ready <n>`                                                  | mudar estado GitHub                     | GitHub PR                                        | `gh pr view`, `pr-ready:check`        | `S10`          | Human Gate antes de Ready           |
| `T12` | Ready -> Human Gate                 | PR Ready, CI verde, reviews/gates coerentes               | Rosana via `decide`                      | `guidelines decide --type human-gate`                              | registrar gate artifact                 | `gates/c-*.yml`                                  | `review:check`, `decide --brief-only` | `S11`          | merge/transicao automatica          |
| `T13` | Human Gate -> proximo no            | gate approved, no nao terminal                            | Rosana autoriza transicao                | hoje inexistente como comando canonico                             | abrir branch/PR/cursor                  | `state.yml`, `tasks.md`, `active.yml`, GitHub PR | handoff/work/CI                       | `S13`          | editar projection como SSOT         |
| `T14` | ultimo no -> integration-final      | no terminal de execucao gated                             | owner                                    | a definir                                                          | abrir Integration PR                    | state/review/release artifacts                   | R1-R9                                 | `S14`          | merge direto                        |
| `T15` | integration-final -> merge          | Integration PR aprovado                                   | Rosana                                   | merge GitHub                                                       | merge unico em `main`                   | GitHub/Git                                       | post-merge checks                     | `S15`          | merge parcial                       |

## Matriz conceito -> SSOT -> projecoes -> consumidores -> validacoes

| Conceito              | SSOT atual                                             | Projecoes                                        | Consumidores                            | Validacoes                                                     |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------ | --------------------------------------- | -------------------------------------------------------------- |
| no ativo              | `state.yml § topology.cursor.pr` + `topology.active[]` | `active.yml`, handoff, PR title/body             | `work`, `decide`, `governance-pr-check` | `state-yml:check`, `active-specs:check`, `governance-pr-check` |
| no planejado seguinte | `state.yml § topology.planned[]` por `sequence`        | handoff narrative, `decide human-gate` next_node | owner/agente no fechamento              | `state-yml:check`; lacuna: sem comando de transicao            |
| sub-checkpoint        | `tasks.md` marcadores `[ ]/[/]/[x]`                    | handoff, work, decide                            | agente implementador, owner             | parser/tests, validate                                         |
| readiness             | code-span em `tasks.md` no `[/]`                       | work.nextAction, decide availability, handoff    | owner/agente                            | readiness invariants                                           |
| findings              | review artifacts                                       | review:check, work, decide                       | implementador/reviewer/owner            | review:seal/check                                              |
| resolutions           | `reviews/*resolutions.yml`                             | review:check, decide                             | owner/reviewer                          | fingerprints + ref validation                                  |
| dispositions          | review/resolution artifact                             | review:check, decide                             | Human Gate/Ready                        | review:check                                                   |
| receipt               | `.git/ai-guidelines/handoff-load.json`                 | handoff:check/advisory                           | agente/humano                           | handoff:check                                                  |
| PR Draft/Ready        | GitHub PR                                              | handoff/work/decide/pr-ready                     | owner/reviewer                          | pr-ready:check, gh pr view                                     |
| Human Gate            | `gates/c-*.yml`                                        | handoff/work/decide                              | owner/proximo no                        | gate-decidability, review:check                                |
| comandos              | `CommandRegistry`                                      | help/dispatch/wizard                             | humanos/agentes/scripts                 | registry tests, smoke                                          |
| scripts               | `script-contracts.yml`                                 | package/docs/hooks/workflows/templates           | humanos/hooks/CI                        | script-contracts:sync/check                                    |
| CI                    | GitHub Actions/check-runs                              | handoff/decide/pr-ready                          | Ready/Gate                              | gh checks, workflows                                           |
| integracao final      | `state.yml` terminal + future review/release artifacts | Integration PR                                   | owner                                   | R1-R9 futuros                                                  |

Regra de CO-10.1: qualquer conceito com duas SSOTs ou com SSOT mais comando
projetando criterios proprios vira gap a confrontar em CO-10.2.

## Gaps observados ja materializados

| ID        | Gap                                                                                    | Evidencia                                                        | Risco                                                          | Falsificacao esperada                                                                           |
| --------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `CFG-001` | Nao ha comando canonico para abrir o proximo no apos Human Gate                        | abertura do #43 exigiu branch + edicoes manuais + PR create      | transicao pode divergir de topologia/PR/projecao               | comando/fluxo unico gera branch, PR body/title, cursor e objeto sem inferencia manual           |
| `CFG-002` | `state.yml` exige `github_pr` real antes de o PR existir                               | PR #43 precisou ser inferido antes do create                     | impossibilidade operacional ou corrida com numero de PR        | modelo separa planned/opening/open com placeholder valido ou cria PR antes de fixar `github_pr` |
| `CFG-003` | `active.yml` foi atualizado manualmente embora seja projecao                           | transicao #43 editou `.governance/runtime/specs/active.yml`      | projecao pode virar pseudo-SSOT                                | transicao chama produtor canonico ou validate falha se projecao foi editada sem fonte           |
| `CFG-004` | `work` depende do objeto ja materializado em `tasks.md`                                | `7f3b7b9` foi necessario para sair do bloqueio e apontar CO-10.1 | checkpoint ativo sem tarefa implementavel                      | scaffold de sub-checkpoints deriva do no ou bloqueio nomeia comando de scaffold                 |
| `CFG-005` | Token canonico do titulo do PR foi corrigido depois de abrir                           | `governance-pr-check` reprovou ate ajuste do token `10️⃣`         | feedback tardio; PR nasce invalido                             | gerador/preflight de PR title/body antes de `gh pr create`                                      |
| `CFG-006` | `decide` cobre close/advance/gate, mas nao transicao de no                             | `DecisionRegistry` tem 3 decisoes; `T13` nao tem definicao       | pos-Gate volta a orquestracao manual                           | nova decisao/fluxo governado para transicao de no ou regra explicita fora de `decide`           |
| `CFG-007` | Freshness/Ready/Gate ja tiveram heuristicas paralelas                                  | bugs corrigidos em PR #42 (`pr-ready`, functional-head review)   | regressao por duplicar criterio em novo fluxo                  | snapshot comum entre handoff/work/decide/pr-ready/review                                        |
| `CFG-008` | Modo offline/degradado nao esta modelado por transicao                                 | handoff degrada remote; Ready/Gate dependem GitHub               | briefing pode parecer executavel sem fonte remota              | tabela de estados deve declarar quais transicoes aceitam degraded e quais bloqueiam             |
| `CFG-009` | Consumidores init/adopt/update estao validados, mas ainda fora da jornada de lifecycle | smoke/tarball cobrem CLI; nao conectam a nova maquina de estados | CO-5/CO-6 podem automatizar eventos sem cobrir consumidor real | jornadas 7/8 de CO-10.4 ligam bootstrap de consumidor ao mesmo modelo de estados                |

## Jornadas a manter como casos de falsificacao

1. Sessao nova -> `handoff` -> `work` -> implementacao autorizada.
2. Finding -> fix -> verification -> disposition.
3. Sub-checkpoint sem findings -> readiness -> advance.
4. Sub-checkpoint com findings -> bloqueio -> correcao -> revalidacao.
5. Ultimo sub-checkpoint -> prepare close/Ready/Human Gate, sem advance indevido.
6. PR Draft -> Ready -> Human Gate.
7. Consumidor novo -> `init`.
8. Consumidor existente -> `adopt`/`update`.
9. Branch/CI/receipt stale.
10. Retomada apos interrupcao.
11. Modo offline/degradado.

## Comandos usados como evidencia inicial

```bash
git status --short --branch
git rev-parse --short HEAD
git rev-list --left-right --count HEAD...origin/feat/spec-0024-co-flow-convergence
gh pr view --json number,state,isDraft,baseRefName,headRefName,headRefOid,url
gh pr checks 43
npm run guidelines -- handoff 0024
npm run guidelines -- work --authorization explicit-work-request
npm run guidelines -- decide --brief-only
npm run guidelines -- decide --type advance-subcheckpoint --brief-only
npm run guidelines -- decide --type human-gate --brief-only
npm run guidelines -- review policy
```

Resultado sintetico: o repo esta coerente para implementar CO-10.1; `advance` e
Human Gate seguem bloqueados corretamente; PR #43 segue Draft; `co-capture` e CO-5
nao foram iniciados.

## Fronteira desta fatia

- Nao corrige ainda `CFG-*`; isso pertence a CO-10.2/CO-10.3.
- Nao marca `CO-10.1` com readiness.
- Nao executa `decide` mutante.
- Nao converte PR #43 para Ready.
- Nao executa Human Gate.
- Nao abre CO-5.
