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

## Findings das revisoes governadas do CO-10.1

Esta secao e o inventario executavel dos findings abertos na rodada de revisao
do planejamento. Ela nao fecha `disposition` e nao substitui revalidacao
independente; ela define a correcao esperada e a evidencia que CO-10.2/CO-10.4
devem falsificar.

| Lane                   | ID   | Severidade | Bloqueante | Claim resumida                                                                                | Evidencia no review                                                                 | Correcao esperada                                                                                          |
| ---------------------- | ---- | ---------- | ---------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `technical_audit`      | `F1` | high       | sim        | O modelo comeca em nova sessao/handoff e nao cobre nascimento da spec ate merge final.        | `c-co-flow-convergence-technical_audit.yml`; location `inventory.md#L80-L171`.      | Adicionar estados/transicoes para nascimento da spec, primeiro Draft PR, linha da stack e merge final.     |
| `technical_audit`      | `F2` | medium     | nao        | CFG-001..CFG-009 nao tinham protocolo reproduzivel por gap.                                   | `c-co-flow-convergence-technical_audit.yml`; location `inventory.md#L145-L187`.     | Para cada CFG, declarar reproducao, impacto, SSOT, superficie, correcao proposta, teste e falsificacao.    |
| `architectural_review` | `F1` | high       | sim        | A maquina lista superficies, mas nao define bounded context nem agregados/VOs/policies/ports. | `c-co-flow-convergence-architectural_review.yml`; location `inventory.md#L80-L143`. | Cristalizar o bounded context `GovernedLifecycleFlow` com entidades, VOs, services, policies e adapters.   |
| `architectural_review` | `F2` | medium     | nao        | CO-10.2/10.3/10.4 nao declaram entradas, saidas e criterios de aceitacao por fase.            | `c-co-flow-convergence-architectural_review.yml`; location `tasks.md#L110-L113`.    | Especificar contratos de fase para confronto, correcao e dogfood sem antecipar implementacao.              |
| `security_review`      | `F1` | high       | sim        | Ready/Gate/pos-Gate nao modelam estados negativos de Draft, CI, stale, offline/degraded.      | `c-co-flow-convergence-security_review.yml`; location `inventory.md#L103-L143`.     | Adicionar estados negativos fail-closed e autorizacoes proibidas por stale/offline/CI/Draft/Gate aprovado. |
| `security_review`      | `F2` | medium     | nao        | Spoofing de PR body/title/topology/github_pr aparece como drift, mas sem matriz de ameaca.    | `c-co-flow-convergence-security_review.yml`; location `inventory.md#L62-L72`.       | Mapear ameacas, fonte canonica, validacao fail-closed e superficie afetada para spoofing e drift.          |

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

## Bounded context proposto — `GovernedLifecycleFlow`

O bounded context desta fatia e o fluxo governado ponta a ponta. Ele nao e um
novo SSOT paralelo: ele modela transicoes permitidas entre fontes canonicas ja
existentes e declara quando uma projecao pode ou nao mutar artefatos.

| Elemento DDD                  | Papel no fluxo                                                                                      | Fronteira contra segunda SSOT                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Entidade `SpecLifecycle`      | Identidade da spec, nascimento, estado de execucao, encerramento e merge final.                     | Estado persistente continua em `state.yml`; a entidade so agrega leitura e invariantes.           |
| Entidade `StackNode`          | No planejado/ativo/concluido da topologia, com `sequence`, base/head e PR real quando existente.    | `state.yml § topology` segue SSOT; PR GitHub e projecao validam, nao substituem.                  |
| Entidade `SubCheckpoint`      | Objeto implementavel dentro do no ativo, com marcador `[ ]/[/]/[x]` e readiness.                    | `tasks.md` segue fonte dos marcadores; services apenas interpretam e propõem mutacoes governadas. |
| Entidade `ReviewLane`         | Lane de review, findings, resolutions, events e disposition.                                        | `reviews/**` segue SSOT; `work` e `decide` consomem consolidado comum.                            |
| Entidade `PullRequestState`   | Estado GitHub: Draft/Ready, head/base, checks e titulo/body.                                        | GitHub e fonte externa factual; cache/snapshot precisa expirar e bloquear se stale.               |
| Value Object `Authority`      | Quem pode executar transicao: agente, owner, reviewer, CI, GitHub ou script governado.              | Mutacoes sem autoridade viram erro antes de alterar artefato.                                     |
| Value Object `FlowSnapshot`   | Snapshot imutavel usado por `handoff`, `work`, `decide`, `pr-ready` e checks.                       | Uma derivacao comum impede heuristicas locais divergentes.                                        |
| Value Object `TransitionKey`  | Nome canonico da transicao (`handoff`, `work`, `advance`, `ready`, `gate`, `open-next-node`, etc.). | Registry/decide/help/wizard/scripts devem referenciar as mesmas keys.                             |
| Policy `TransitionPolicy`     | Dado estado + autoridade + snapshot, decide se a transicao e disponivel, bloqueada ou degradada.    | Politica pura; comandos nao reimplementam criterio.                                               |
| Policy `FreshnessPolicy`      | Define stale/current para receipt, CI, PR state, reviews e functional HEAD.                         | Uma unica policy deve alimentar `handoff`, `work`, `decide`, `pr-ready:check` e `review:check`.   |
| Domain Service `FlowPlanner`  | Deriva efeito permitido, artefato alterado, validacao e proximo estado.                             | Produz plano; adapters aplicam, sem regra de negocio.                                             |
| Port `GitHubSnapshotPort`     | Lê PR/checks/reviews nativos quando online.                                                         | Offline/degraded deve ser explicito no snapshot e bloquear transicoes humanas sensiveis.          |
| Port `GitMutationPort`        | Cria branch/commit/tag/push quando uma transicao governada permitir.                                | Nunca usado por `decide --brief-only`; mutacao exige confirmacao/autorizacao.                     |
| Adapter `GhCliAdapter`        | Implementacao concreta via `gh`.                                                                    | Pode falhar/degradar; nao decide se o fluxo esta liberado.                                        |
| Adapter `GovernanceFsAdapter` | Le/escreve `state.yml`, `tasks.md`, `reviews/**`, `gates/**`, `active.yml` quando autorizado.       | Projecoes nao podem ser escritas como se fossem fonte.                                            |

Contratos de mantenibilidade:

- `src/domain/lifecycle` (ou nome equivalente decidido em CO-10.2) deve conter
  modelo puro, VOs e policies.
- `src/app/lifecycle` deve conter use cases como `DeriveFlowSnapshot`,
  `PlanLifecycleTransition` e `OpenNextStackNode`, usando ports.
- `src/cli` deve apenas parsear/renderizar/chamar use cases.
- `src/infrastructure` deve implementar GitHub/Git/filesystem/process adapters.
- `work`, `decide`, `handoff`, `pr-ready:check`, `review:check` e registry/help
  nao podem manter criterios independentes para a mesma transicao.

## Modelo canonico inicial de estados

Estados de lifecycle, ainda como modelo inicial a confrontar em CO-10.2:

| Estado                      | Fato de entrada                                                    | Autoridade                          | Proximo estado esperado                           | Acoes proibidas enquanto neste estado                |
| --------------------------- | ------------------------------------------------------------------ | ----------------------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| `S-3 spec-nao-nascida`      | demanda humana ainda sem spec governada                            | Rosana                              | `S-2 spec-scaffold`                               | branch/PR/checkpoint sem spec                        |
| `S-2 spec-scaffold`         | `spec.md`/`plan.md`/`tasks.md`/`state.yml` iniciais criados        | comando de scaffold ou owner        | `S-1 primeiro-draft-pr`                           | implementar sem PR Draft                             |
| `S-1 primeiro-draft-pr`     | primeiro PR Draft/linha da stack aberto                            | GitHub + owner                      | `S0 nova-sessao`                                  | Ready/Gate/merge sem implementacao                   |
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
| `N1 draft-bloqueado`        | PR ainda Draft quando transicao exige Ready                        | GitHub factual                      | volta ao estado anterior apos Ready humano        | Human Gate, gate artifact, merge                     |
| `N2 ci-nao-verde`           | check required pending/failing/stale                               | GitHub checks                       | volta apos CI verde                               | Ready/Gate/merge/transicao de no                     |
| `N3 receipt-stale`          | recibo de handoff diverge de fontes usadas                         | handoff receipt                     | `S1 handoff-carregado` apos reload                | mutacao governada sensivel                           |
| `N4 review-stale`           | review required/current diverge do functional HEAD                 | `review:check` + FreshnessPolicy    | revalidacao independente                          | Ready/Gate/disposition automatica                    |
| `N5 pr-state-stale`         | snapshot GitHub indisponivel ou divergente                         | GitHubSnapshotPort                  | reload online ou degraded bloqueado               | Ready/Gate/merge/open-next-node                      |
| `N6 offline-degraded`       | comando rodado com remote ausente                                  | usuario + snapshot degradado        | somente acoes read-only ou locais explicitamente  | Ready/Gate/merge/PR create/branch publish            |
| `N7 gate-ja-aprovado`       | gate artifact approved ja existe para o checkpoint                 | `gates/c-*.yml`                     | transicao de no ou bloqueio terminal              | novo gate, reescrita de gate, merge isolado          |
| `N8 merge-indevido`         | tentativa de merge fora do terminal `integration-final`            | topology policy                     | erro fail-closed                                  | qualquer merge em main                               |

## Transicoes canonicas iniciais

| ID    | Transicao                           | Fato de entrada                                           | Autoridade                               | Comando atual                                                      | Efeito permitido                        | Artefato alterado                                | Validacao                             | Proximo estado | Acoes proibidas                     |
| ----- | ----------------------------------- | --------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------ | --------------------------------------- | ------------------------------------------------ | ------------------------------------- | -------------- | ----------------------------------- |
| `T-3` | demanda -> nascimento da spec       | problema validado pela owner                              | Rosana                                   | scaffold futuro ou sequencia canonica declarada                    | criar estrutura inicial da spec         | `spec.md`, `plan.md`, `tasks.md`, `state.yml`    | state/schema + PR template            | `S-2`          | PR sem spec                         |
| `T-2` | spec -> primeiro Draft PR           | spec scaffoldada e branch correta                         | owner/agente autorizado                  | `gh pr create --draft` + gerador de body/titulo                    | criar primeiro contêiner GitHub         | GitHub PR + branch                               | governance-pr-check                   | `S-1`          | implementar sem PR container        |
| `T-1` | primeiro PR -> sessao operacional   | PR Draft aberto e cursor inicial coerente                 | topology + GitHub                        | `handoff`                                                          | iniciar fluxo situado                   | recibo efemero                                   | `handoff:check`                       | `S0`           | Ready/Gate/merge                    |
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

### Estados negativos e comportamento fail-closed

| Estado negativo       | Entrada reproduzivel                                            | Autoridade que bloqueia | Mensagem/efeito esperado                                                        | Teste/invariante esperado                                   |
| --------------------- | --------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `N1 draft-bloqueado`  | `gh pr view` retorna `isDraft: true` quando Gate/Ready e pedido | GitHub PR state         | `decide human-gate` e Ready precheck bloqueiam por Draft                        | PR Draft nunca projeta Human Gate disponivel                |
| `N2 ci-nao-verde`     | check-run required pending/failing/stale                        | GitHub checks snapshot  | `pr-ready:check` e `decide` nomeiam check pendente/falho                        | contagem de checks vem do snapshot comum                    |
| `N3 receipt-stale`    | `handoff-load.json` diverge de git/reviews/state/tasks          | FreshnessPolicy         | comando mutante emite advisory ou bloqueio conforme criticidade                 | fonte validada nao pode reescrever o proprio recibo         |
| `N4 review-stale`     | functional HEAD posterior ao subject_ref, exceto review-only    | ReviewFreshnessPolicy   | review required/current vira stale; publication-only segue current              | commit funcional invalida; commit review-only nao invalida  |
| `N5 pr-state-stale`   | GitHub indisponivel ou head/base divergente                     | GitHubSnapshotPort      | Ready/Gate/open-next-node bloqueiam; handoff pode degradar explicitamente       | offline nao libera decisao humana sensivel                  |
| `N6 offline-degraded` | `--no-remote` ou falha de rede                                  | TransitionPolicy        | apenas leitura/local permitida; PR create, Ready, Gate e merge indisponiveis    | modo offline nunca cria gate/Ready/merge                    |
| `N7 gate-ja-aprovado` | gate artifact approved ja existe                                | GatePolicy              | novo gate proibido; proximo movimento vira transicao de no ou bloqueio terminal | gate aprovado e append-only, sem overwrite                  |
| `N8 merge-indevido`   | tentativa de merge antes de `integration-final`                 | TopologyPolicy          | erro fail-closed; modo unit preservado                                          | nenhum no intermediario pode mergear isoladamente em `main` |

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

## Matriz de ameacas e spoofing

| Ameaca                            | Fonte canonica afetada            | Vetor de spoof/drift                                 | Validacao fail-closed esperada                                      | Superficie afetada                |
| --------------------------------- | --------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------- |
| PR body diz Ready/Draft errado    | GitHub PR state                   | texto do body diverge de `isDraft`/policy            | `pr-ready:check` usa GitHub factual; body stale vira erro orientado | Ready/Human Gate briefing         |
| Titulo PR com token/seq incorreto | `state.yml § topology.sequence`   | token visual ou seq manual contradiz topologia       | `governance-pr-check` reprova antes de Ready/Gate                   | PR create/update                  |
| `github_pr` preexistente inferido | GitHub PR real + `state.yml`      | numero antecipado errado ou PR criado fora da branch | transicao futura separa planned/opening/open ou valida PR real      | open-next-node                    |
| `active.yml` editado como SSOT    | `state.yml § cursor`              | projecao manual diverge da fonte                     | `active-specs:check` falha e comando de transicao regenera          | handoff/work                      |
| Review stale apresentado current  | review subject + functional HEAD  | commit funcional posterior ao review                 | FreshnessPolicy comum; review-only delta explicitamente permitido   | review:check/work/decide/pr-ready |
| CI stale contado como verde       | GitHub checks                     | cache antigo ou contagens por coletores diferentes   | snapshot comum com head_sha; pending/fail bloqueia                  | pr-ready/decide/handoff           |
| Receipt stale tratado como fresh  | `.git/ai-guidelines/handoff-load` | comando mutante reescreve recibo antes de validar    | fonte validada nunca se autoprojeta durante validacao               | handoff:check/comandos mutantes   |
| Gate reexecutado                  | `gates/c-*.yml`                   | novo artifact substitui decisao humana anterior      | append-only/fail-closed; gate existente bloqueia novo gate          | decide human-gate                 |
| Merge de no intermediario         | topology modo `unit`              | GitHub merge em PR stacked nao-terminal              | policy e PR briefing bloqueiam; merge terminal so em integration    | PR #43 e demais nós nao-terminais |

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

## Protocolos reproduziveis por gap

| Gap     | Reproducao                                                                                                  | Impacto                                            | SSOT envolvida                          | Superficie/comando afetado                     | Correcao proposta                                                                         | Teste/invariante esperado                                                   | Etapa responsavel | Criterio de falsificacao                                                                 |
| ------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| CFG-001 | Apos gate approved de um no nao-terminal, rode `work`; nao existe comando canonico para abrir o proximo no. | Transicao pos-Gate depende de orquestracao manual. | `state.yml § topology`, GitHub PR       | `work`, `decide`, `gh pr create`               | Modelar `open-next-node` como transicao governada ou sequencia canonica declarada.        | `decide/work` oferecem a mesma proxima transicao quando gate approved.      | CO-10.2/CO-10.3   | Dado gate approved, comando/fluxo cria branch/PR/cursor sem editar projeção manualmente. |
| CFG-002 | Tente preparar `state.yml` para um PR ainda inexistente; `github_pr` precisa de numero real.                | Corrida operacional e inferencia manual de PR.     | GitHub PR real, `state.yml`             | `state-yml:check`, PR create                   | Separar estados `planned`, `opening`, `open` ou criar PR antes de fixar `github_pr`.      | Check aceita planned sem PR e exige PR real em open/concluded.              | CO-10.2/CO-10.3   | Numero inferido errado deve falhar antes de `handoff/work` tratarem como ativo.          |
| CFG-003 | Edite `active.yml` para acompanhar cursor; valide que projection pode divergir da fonte.                    | Projecao vira pseudo-SSOT.                         | `state.yml § cursor`                    | `active-specs:check`, `workflow publish-state` | Transicao deve regenerar `active.yml` a partir da fonte ou bloquear drift.                | Projecao editada manualmente sem fonte correspondente falha.                | CO-10.2/CO-10.3   | `active.yml` divergente nunca torna `work` executavel por si so.                         |
| CFG-004 | Abra no ativo sem sub-checkpoints em `tasks.md`; rode `work`.                                               | No ativo fica sem objeto implementavel.            | `tasks.md`, topology checkpoint         | `work`, `handoff`                              | Scaffold de sub-checkpoints vira efeito da transicao ou bloqueio nomeia comando.          | `work` deve apontar tarefa ativa ou comando canonico de materializacao.     | CO-10.2/CO-10.3   | No ativo sem objeto nao pode projetar implementacao ambigua.                             |
| CFG-005 | Abra PR com titulo fora do token canonico; `governance-pr-check` falha depois do create.                    | PR nasce invalido e requer correcao manual.        | `state.yml.sequence`, PR title          | `governance-pr-check`, `gh pr create`          | Gerar/prevalidar titulo/body antes de criar PR.                                           | PR body/title generator cobre seq/token/base/head antes do create.          | CO-10.3           | Titulo com seq/token incorreto falha em preflight local.                                 |
| CFG-006 | Rode `guidelines decide --brief-only`; registry tem close/advance/gate, nao transicao de no.                | Pos-Gate sai do modelo de decisoes.                | `human-decision-policy.yml`, topology   | `DecisionRegistry`, `work.nextAction`          | Adicionar decisao/fluxo governado para transicao de no ou regra explicita fora de decide. | Se `work` recomenda transicao, `decide` deve oferece-la ou nomear bloqueio. | CO-10.2/CO-10.3   | Estado nao pode exigir acao manual nao modelada pelo runtime.                            |
| CFG-007 | Compare `handoff`, `work`, `decide`, `pr-ready` e `review:check` em estado stale.                           | Heuristicas paralelas liberam/bloqueiam errado.    | FlowSnapshot/FreshnessPolicy futura     | todos os briefings/checks                      | Snapshot comum e policies puras para readiness/freshness.                                 | Mesmo snapshot gera mesma disponibilidade em todos consumidores.            | CO-10.2/CO-10.3   | Divergencia work-disponivel/decide-bloqueado falha teste.                                |
| CFG-008 | Rode handoff/work com `--no-remote` ou rede indisponivel e tente Ready/Gate.                                | Offline pode parecer executavel indevidamente.     | GitHub snapshot + receipt               | `handoff`, `work`, `decide`, `pr-ready`        | Modelar `offline-degraded` e bloquear transicoes sensiveis.                               | Ready/Gate/merge/open-next-node indisponiveis sem snapshot remoto fresh.    | CO-10.2/CO-10.3   | Modo offline nunca produz Human Gate disponivel.                                         |
| CFG-009 | Valide tarball/consumidor separado; lifecycle nao referencia essas jornadas.                                | CO-5/CO-6 podem esquecer consumidor real.          | provisioning model + lifecycle journeys | smoke/tarball/init/adopt/update                | Ligar jornadas consumidor novo/existente ao mesmo plano de testes do flow.                | Acceptance tests de consumer init/adopt/update aparecem na jornada CO-10.4. | CO-10.4           | Dogfood de fluxo sem consumidor real e incompleto.                                       |

## Jornadas a manter como casos de falsificacao

| Jornada | Teste de aceitacao                                                             | Teste unitario/integracao                            | Estado inicial                                   | Acao                                                             | Resultado esperado                                           | Falha impedida                                 |
| ------- | ------------------------------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------- |
| 1       | Spec nova nasce com scaffold + primeiro Draft PR + handoff util.               | parser/topology scaffold + `governance-pr-check`     | `S-3 spec-nao-nascida`                           | scaffold + `gh pr create --draft` + `handoff`                    | `S1 handoff-carregado`, PR Draft coerente                    | spec sem PR ou PR sem spec                     |
| 2       | Sessao nova -> `handoff` -> `work` -> implementacao autorizada.                | `handoffWorkParity.test` + `workBrief`               | branch limpa, PR Draft, cursor ativo             | `handoff`, `work --authorization explicit-work-request`          | modo correto, escopo e proibicoes projetados                 | agente trabalha fora do objeto                 |
| 3       | Finding -> fix -> resolution -> verification -> disposition.                   | `review:check` + resolution/event tests              | finding open                                     | commit funcional + resolution + revalidacao + decide disposition | disposition so fecha apos autoridade correta                 | autoaprovacao do implementador                 |
| 4       | Sub-checkpoint sem findings -> readiness -> advance.                           | `advanceConsistency.test`                            | `[ / ]` com readiness e proximo `[ ]`            | `decide advance-subcheckpoint`                                   | marcador atual fecha e proximo abre                          | `work` recomenda transicao que `decide` oculta |
| 5       | Sub-checkpoint com findings -> bloqueio -> correcao -> revalidacao.            | `workBrief` resolve_findings + `review:check`        | findings high/critical open                      | `work`                                                           | modo `RESOLVE_FINDINGS`                                      | readiness apesar de finding bloqueante         |
| 6       | Ultimo sub-checkpoint -> prepare close/Ready/Human Gate, sem advance indevido. | readiness terminal tests                             | ultimo `[/]` com readiness, nenhum proximo `[ ]` | `work`, `decide --brief-only`                                    | prepare close/gate; sem advance-subcheckpoint                | readiness terminal aciona advance inexistente  |
| 7       | PR Draft -> Ready -> Human Gate.                                               | `pr-ready:check` + `humanGate`                       | PR Draft, CI verde, readiness terminal           | `pr-ready:check`, `gh pr ready`, `decide human-gate`             | Gate disponivel so depois de Ready factual                   | Gate em PR Draft                               |
| 8       | Human Gate approved -> abrir proximo no governado.                             | future `openNextNode` integration                    | gate approved, no nao-terminal                   | `open-next-node` futuro ou sequencia canonica                    | branch/PR/cursor/subcheckpoint criados sem inferencia manual | CFG-001/002/003/004                            |
| 9       | Consumidor novo -> `init`.                                                     | smoke tarball `init-empty`                           | diretorio vazio                                  | `npx ai-guidelines init --dry-run`                               | plano/escritas esperadas sem `/cli`                          | regressao do runtime legado                    |
| 10      | Consumidor existente -> `adopt`/`update`.                                      | smoke tarball `init-existing`/`update-managed-block` | package existente                                | `adopt --dry-run`, `update --providers --dry-run`                | preservacao/merge/update corretos                            | providers legado ou escrita indevida           |
| 11      | Branch/CI/receipt stale.                                                       | freshness/work/decide/pr-ready tests                 | receipt/checks/PR state stale                    | `work`, `decide`, `pr-ready:check`                               | bloqueio factual nomeado                                     | falso verde por cache/heuristica local         |
| 12      | Retomada apos interrupcao.                                                     | handoff receipt + snapshot tests                     | sessao sem contexto                              | `handoff`, `handoff:check`, `work`                               | mesmo objeto e stop criteria derivados                       | retomada por transcript/memoria stale          |
| 13      | Modo offline/degradado.                                                        | no-remote snapshot tests                             | rede indisponivel                                | `handoff --no-remote`, `work --no-remote`, `decide`              | leitura degradada; mutacoes sensiveis bloqueadas             | Ready/Gate/merge/open-next-node offline        |

## Contratos dos proximos sub-checkpoints

| Sub-checkpoint | Entradas obrigatorias                                                                                                                          | Saidas obrigatorias                                                                                 | Criterios de aceitacao                                                                                                             | Acoes proibidas antes de concluir  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `CO-10.2`      | Este inventario, reviews/resolutions, `state.yml`, `tasks.md`, `work`, `decide`, `handoff`, `pr-ready`, `review:check`, registry/help/scripts. | Mapa modelo × codigo com divergencias classificadas (`equivalente`, `intencional`, `bug`, `risco`). | Cada transicao T*/N*/CFG deve apontar para codigo existente, lacuna real ou decisao explicita; sem correcao estrutural antecipada. | corrigir gaps amplos sem confronto |
| `CO-10.3`      | Mapa de CO-10.2, protocolos CFG, matriz de ameacas e contratos DDD.                                                                            | Correcoes no runtime/checks/docs que removem heuristicas paralelas e segunda SSOT.                  | `handoff`, `work`, `decide`, `pr-ready`, `review:check` e registry/help convergem sobre snapshot/policies comuns.                  | dogfood final sem fixes verdes     |
| `CO-10.4`      | Runtime corrigido, jornadas TDD, consumidores tarball, PR Draft/Ready/Gate simulaveis.                                                         | Dogfood ponta a ponta com evidencias por jornada e consumidores novo/existente.                     | Todas as jornadas 1-13 têm comando, estado inicial, resultado esperado e falha impedida executados ou justificados.                | readiness sem dogfood real         |
| `CO-10.5`      | Dogfood, falsificacoes e riscos residuais.                                                                                                     | Checks/testes finais, dossie de falsificacao e preparacao para Human Gate.                          | Invariantes verdes; riscos residuais nomeados; PR body final alinhado; sem CO-5 iniciado.                                          | Ready/Human Gate automatico        |

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

Resultado sintetico inicial: o repo estava coerente para implementar CO-10.1;
`advance` e Human Gate seguiam bloqueados corretamente; PR #43 seguia Draft;
`co-capture` e CO-5 nao foram iniciados.

## Dogfood adicional — cockpit situado + readiness governada de CO-10.1

O dogfood pos-revalidacao mostrou um novo gap antes de avancar para CO-10.2:
apos fechar as dispositions das 6 findings, `work` voltou para
`IMPLEMENT_CHECKPOINT` porque CO-10.1 seguia sem readiness; a proxima acao real
seria editar `tasks.md` manualmente. Isso repetiria a classe de problema que
este no existe para eliminar.

Correcao modelada nesta fatia:

1. `npm run guidelines` sem subcomando passou a renderizar cockpit situado
   read-only, derivado de `work` + `decide` + snapshot remoto de PR/CI.
2. `mark-readiness` foi adicionado como decisao humana governada em
   `human-decision-policy.yml` e `DecisionRegistry`.
3. O comando mutante canonico e:
   `npm run guidelines -- decide --type mark-readiness --decision mark-ready --authorization explicit-human-decision --confirm`.
4. A mutacao permitida e exclusivamente adicionar
   `` `readiness: ready-for-transition` `` no sub-checkpoint `[/]` ativo em
   `tasks.md`.
5. O comando bloqueia findings abertos, CI pendente/falho, working tree suja,
   branch behind, PR head remoto que nao cobre o HEAD local, gate ja aprovado,
   ausencia/multiplicidade de `[/]` e readiness em `[ ]`/`[x]`.

Evidencia executada no estado real do PR #43:

```bash
npm run guidelines
npm run guidelines -- decide --type mark-readiness --brief-only
npm run guidelines -- decide --type mark-readiness --decision mark-ready --authorization explicit-human-decision --confirm
```

Antes:

- `CO-10.1` ativo `[/]`, sem readiness;
- `CO-10.2` pendente `[ ]`;
- reviews revalidadas: 0 open / 6 closed;
- PR #43 Draft, CI remoto verde;
- cockpit recomendou `mark-readiness`;
- `advance-subcheckpoint` permaneceu bloqueado por falta de readiness.

Depois:

- commit `ef4edb0` (`docs(spec-0024): declara readiness de CO-10.1`) criado
  pelo proprio fluxo governado;
- `tasks.md` foi o unico artefato alterado pelo fluxo de readiness;
- `CO-10.1` continua `[/]`, agora com
  `` `readiness: ready-for-transition` ``;
- `CO-10.2` continua `[ ]`;
- nenhum `advance-subcheckpoint`, Ready, Human Gate, gate artifact, merge ou
  CO-5 foi executado.

## Fronteira desta fatia

- Nao corrige ainda `CFG-*`; isso pertence a CO-10.2/CO-10.3.
- A readiness de `CO-10.1` foi marcada somente pelo fluxo governado
  `mark-readiness`, nao por edicao manual.
- Nao executa `advance-subcheckpoint`.
- Nao converte PR #43 para Ready.
- Nao executa Human Gate.
- Nao abre CO-5.

## Dogfood CO-10.2 — convergencia real da proxima acao

O confronto modelo x codigo confirmou que ainda havia heuristicas locais:

- `mark-readiness` mantinha um bloco proprio de blockers;
- `human-gate` mantinha outro bloco proprio de blockers;
- `pr-ready:check` avaliava precondicoes em funcao propria;
- `cockpit` escolhia a recomendacao por prioridade local;
- `work` projetava `advance-subcheckpoint` bloqueado por falta de readiness,
  mesmo quando a acao correta era declarar readiness.

Correcao aplicada em CO-10.2:

1. Criado `GovernedFlow` como derivacao comum de acoes governadas.
2. `mark-readiness`, `human-gate`, `advance-subcheckpoint`, `pr-ready`, `cockpit`
   e `work` passaram a consumir a mesma disponibilidade derivada quando o
   criterio se aplica.
3. A divergencia eliminada foi:
   - antes: `work` apontava o avanco bloqueado como proxima inspecao;
   - depois: `work` e `cockpit` projetam `mark-readiness` quando readiness e a
     acao disponivel, e `decide` confirma a mesma disponibilidade.
4. `advance-subcheckpoint` continua bloqueado ate a readiness existir.
5. Human Gate, Ready e merge continuam proibidos/bloqueados enquanto faltarem
   criterios.

Falsificacao adicionada:

- `GovernedFlow.test.ts` prova que cockpit/work/decide concordam sobre
  readiness;
- prova que `work` e `decide` concordam que advance sem readiness e bloqueado;
- prova que findings abertos, CI pendente, tree suja e smoke suspenso bloqueiam
  os atos correspondentes;
- prova que sub-checkpoint terminal com readiness nao tenta
  `advance-subcheckpoint` indevido.
