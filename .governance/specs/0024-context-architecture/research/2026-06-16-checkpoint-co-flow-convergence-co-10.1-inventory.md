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

| Sub-checkpoint | Entradas obrigatorias                                                                                                                                                                    | Saidas obrigatorias                                                                                                                                                                               | Criterios de aceitacao                                                                                                                                                                                                                                | Acoes proibidas antes de concluir                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `CO-10.2`      | Este inventario, reviews/resolutions, `state.yml`, `tasks.md`, `work`, `decide`, `handoff`, `pr-ready`, `review:check`, registry/help/scripts, dogfood real do wizard/cockpit/readiness. | Mapa modelo × codigo com divergencias classificadas (`equivalente`, `intencional`, `bug`, `risco`) + convergencia coesa inicial das divergencias ja comprovadas na superficie humana/next-action. | Cada regra substituida deve apontar para heuristica local anterior, regra comum nova, consumidor migrado e teste de nao divergencia; `flow`, cockpit, wizard, `work`, `decide` e readiness nao podem calcular proxima acao por caminhos conflitantes. | iniciar CO-10.3 ou resolver CFG-\* remanescente sem classificacao |
| `CO-10.3`      | Mapa atualizado de CO-10.2, protocolos CFG, matriz de ameacas, contratos DDD e dogfood de `flow`.                                                                                        | Correcoes remanescentes no runtime/checks/docs que removem heuristicas paralelas e segunda SSOT.                                                                                                  | `handoff`, `work`, `decide`, `pr-ready`, `review:check`, registry/help e transicoes de no convergem sobre snapshot/policies comuns.                                                                                                                   | dogfood final sem fixes verdes                                    |
| `CO-10.4`      | Runtime corrigido, jornadas TDD, consumidores tarball, PR Draft/Ready/Gate simulaveis.                                                                                                   | Dogfood ponta a ponta com evidencias por jornada e consumidores novo/existente.                                                                                                                   | Todas as jornadas 1-13 têm comando, estado inicial, resultado esperado e falha impedida executados ou justificados.                                                                                                                                   | readiness sem dogfood real                                        |
| `CO-10.5`      | Dogfood, falsificacoes e riscos residuais.                                                                                                                                               | Checks/testes finais, dossie de falsificacao e preparacao para Human Gate.                                                                                                                        | Invariantes verdes; riscos residuais nomeados; PR body final alinhado; sem CO-5 iniciado.                                                                                                                                                             | Ready/Human Gate automatico                                       |

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

- Corrige somente o gap de readiness governada descoberto no dogfood imediato
  de CO-10.1; os `CFG-*` remanescentes pertencem a CO-10.2/CO-10.3.
- A readiness de `CO-10.1` foi marcada somente pelo fluxo governado
  `mark-readiness`, nao por edicao manual.
- Nao executa `advance-subcheckpoint`.
- Nao converte PR #43 para Ready.
- Nao executa Human Gate.
- Nao abre CO-5.

## Dogfood CO-10.2 — convergencia real da proxima acao

Decisao de escopo aplicada: por `[DEC-0024-G12]`, CO-10.2 nao para em uma
matriz documental quando o proprio confronto ja prova uma divergencia da
superficie humana/next-action. A regra local substituida deve ser removida no
mesmo ciclo e coberta por teste de nao divergencia. CO-10.3 permanece para os
gaps remanescentes que exigem classificacao/falsificacao adicional.

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

## Dogfood CO-10.2 — `flow` como wizard governado principal

Nova divergencia observada durante a propria implementacao do CO-10.2:

- o comando humano local ainda se chamava `npm run guidelines`;
- `npm run guidelines` sem subcomando renderizava cockpit textual, mas a
  expectativa humana era abrir um wizard didatico em TTY;
- o wizard antigo ainda tinha vinculo conceitual com Inquirer;
- docs e templates ativos ainda ensinavam `npm run guidelines`;
- a superficie publica `providers` ja havia sido removida, mas docs antigas
  ainda citavam `npx ai-guidelines providers`.

Correcao aplicada nesta fatia:

1. `npm run flow` virou a superficie humana local canonica.
2. `npm run flow` em TTY abre o wizard governado com Clack.
3. `npm run flow` em non-TTY renderiza o cockpit textual, sem tentar prompt.
4. `npm run flow -- cockpit` renderiza o cockpit diretamente pelo registry.
5. `npm run flow -- <comando>` continua roteando para o registry ativo.
6. `@inquirer/*` e `InquirerPrompts` foram removidos; `ClackPrompts` e o unico
   adapter interativo.
7. O wizard nao calcula readiness/Human Gate por conta propria: ele consome o
   modelo comum do cockpit/GovernedFlow e delega mutacoes ao registry.

## Dogfood CO-10.2 — guia visual raiz do fluxo

Nova necessidade observada durante a validacao humana do wizard:

- uma documentacao Markdown em `docs/` explicaria o fluxo, mas nao mostraria a
  experiencia operacional;
- no celular, diagramas Mermaid nao eram suficientes para visualizar o modelo;
- a documentacao do fluxo humano nao deveria ficar escondida em `docs/`, porque
  `npm run flow` e a entrada principal do mantenedor no repo.

Correcao aplicada nesta fatia inicial:

1. Criado `FLOW.html` na raiz como guia visual autocontido do fluxo governado.
2. O guia mostra TTY vs non-TTY, wizard Clack, cockpit textual, readiness,
   provisioning (`init`/`adopt`/`update`), acoes disponiveis/bloqueadas/proibidas
   e comandos canonicos.
3. `README.md`, `CONTRIBUTING.md` e `AGENTS.md` passaram a apontar para o guia.
4. `package.json#files` inclui `FLOW.html`, mantendo o link do README valido no
   pacote publicado.

Fronteira preservada:

- `FLOW.html` e explicativo; a fonte executavel continua sendo o snapshot
  governado + registry + derivacao comum do runtime.
- Nenhum Ready, Human Gate, merge, readiness ou advance-subcheckpoint foi
  executado por esta documentacao.

Dogfood posterior da experiencia humana:

- a primeira versao do `FLOW.html` ainda estava em ingles, apesar de a
  experiencia governada deste repo ser operada em portugues;
- a pagina explicava o wizard, mas nao simulava o que acontece quando a pessoa
  seleciona cada opcao do menu principal;
- isso deixava a modelagem visual incompleta para uso em celular e para revisao
  humana sem executar o terminal.

Correcao aplicada nesta fatia:

1. `FLOW.html` foi localizado para `pt-BR`.
2. O guia passou a ter um simulador/carrossel do wizard com cada opcao do menu
   principal.
3. Cada opcao mostra comando canonico, passos esperados e uma saida textual
   simulada.
4. `init`, `adopt` e `update` aparecem na secao de provisioning; `providers`
   nao aparece como comando nem como opcao de menu.
5. A fronteira arquitetural continua explicita: a pagina e demonstrativa, e a
   verdade executavel segue no snapshot governado + registry + derivacao comum.

Falsificacao adicionada:

- teste prova que o menu principal expoe cockpit/provisioning e nao lista
  `providers`;
- teste prova que `npm run flow` em TTY chama o wizard injetado;
- teste prova que `npm run flow` em non-TTY chama cockpit e nao prompt;
- teste prova que provisioning lista `init`/`adopt`/`update` sem `providers`;
- guard prova que `package.json#scripts` nao reintroduz `guidelines*`;
- guard prova que dependencias `@inquirer/*` nao voltam.

Resultado pretendido:

- humanos usam `npm run flow` como porta principal;
- `npx ai-guidelines` permanece como binario publico;
- `providers` permanece removido; o caminho canonico e
  `update --providers <lista>`;
- a UX interativa vira uma projecao do mesmo modelo de fluxo, nao uma nova
  fonte de verdade.

## Dogfood CO-10.3 — readiness nao nasce no mesmo commit de ativacao

Falha observada depois da transicao governada CO-10.2 -> CO-10.3:

- CO-10.3 foi ativado por `advance-subcheckpoint`;
- nenhum trabalho de CO-10.3 existia depois do commit de ativacao;
- ainda assim, `npm run flow -- work` projetou readiness como proxima acao
  disponivel, porque `mark-readiness` considerava apenas findings/reviews/CI/tree;
- isso repetia a classe central de `co-flow-convergence`: o estado parecia pronto
  por criterios globais do checkpoint, nao por evidencia do sub-checkpoint ativo.

Correcao aplicada na primeira fatia de CO-10.3:

1. A derivacao comum de readiness passou a consumir uma evidencia de entrega do
   sub-checkpoint ativo.
2. A evidencia localiza no Git o commit que ativou o sub-checkpoint atual em
   `tasks.md`.
3. Readiness fica bloqueada enquanto nao existir pelo menos um commit posterior
   a essa ativacao.
4. `work`, `decide`, cockpit e wizard consomem a mesma disponibilidade derivada.

Falsificacao adicionada:

- teste com repo Git temporario prova que sub-checkpoint recem-ativado fica sem
  evidencia de entrega;
- teste com commit posterior prova que a evidencia passa a existir;
- teste de `GovernedFlow` prova que `mark-readiness` fica bloqueado para
  CO-10.3 recem-ativado;
- dogfood real: `npm run flow -- decide --type mark-readiness --brief-only`
  agora bloqueia por "CO-10.3 acabou de ser ativado e ainda nao ha commit de
  entrega depois da ativacao".

Fronteira preservada:

- o bloqueio nao substitui os demais guardas de seguranca; ele soma uma
  precondicao factual de entrega;
- nenhum Ready, Human Gate, merge ou advance-subcheckpoint foi executado por
  esta correcao;
- depois que esta propria correcao for commitada, ela passa a ser o primeiro
  commit de entrega de CO-10.3.

## Dogfood CO-10.3 — pos-Gate tambem precisa ser decisao modelada

Falha observada no proprio historico do PR #43:

- apos o Human Gate aprovado do PR #42, `work` projetou corretamente que o
  proximo ato era concluir `co-enforcement` e abrir `co-flow-convergence`;
- mas `decide` ainda nao tinha um tipo de decisao correspondente;
- a abertura do PR #43 exigiu agente orquestrando manualmente branch, `state.yml`,
  `tasks.md`, `active.yml`, PR Draft, titulo canonico e materializacao dos
  sub-checkpoints;
- isso reproduzia `CFG-001` e `CFG-006`: `work` sabia narrar a proxima acao,
  mas o runtime nao oferecia uma superficie governada para inspeciona-la.

Correcao aplicada em CO-10.3:

1. `GovernedFlow` ganhou a acao canonica `open-next-node`.
2. `human-decision-policy.yml` ganhou o tipo `open-next-node` como transicao
   pos-Gate governada.
3. `DecisionRegistry` registra `OpenNextNodeDefinition`.
4. `work` passa a derivar a acao pos-Gate pela mesma disponibilidade usada por
   `decide`, em vez de emitir apenas uma frase sem comando canonico.
5. O briefing nomeia o no concluido, o proximo no planejado, a branch pretendida,
   os efeitos esperados e as acoes que continuam proibidas.

Limite identificado depois desta fatia:

- `open-next-node` ainda havia nascido como briefing/preflight nao-mutante;
- ele nao criava branch, nao criava PR, nao escrevia `state.yml`, nao regenerava
  `active.yml` e nao materializava `tasks.md`;
- portanto, a proxima transicao de no ainda poderia voltar a depender de
  orquestracao informal.

Correcao complementar aplicada em CO-10.3:

1. `open-next-node` passou a ter escolha mutante `open-node`.
2. A transicao agora e uma transacao governada:
   `snapshot -> briefing -> preview -> confirmacao -> branch remota -> PR Draft factual -> state.yml/active.yml/tasks.md -> commit exclusivo -> push normal`.
3. O numero do PR deixa de ser inferido: o efeito abre o PR Draft primeiro e
   usa o numero retornado pelo GitHub para atualizar `state.yml` e `tasks.md`.
4. A aplicacao valida working tree limpa antes do efeito e `mixed_diff: forbidden`
   antes do commit.
5. O efeito permitido e restrito a `state.yml`, `.governance/runtime/specs/active.yml`
   e `tasks.md`; `main`, merge, Ready, Human Gate e implementacao do proximo no
   permanecem fora do escopo.

Falsificacao adicionada:

- teste prova que, apos Human Gate aprovado, PR Ready, CI verde e proximo no
  planejado sem PR, `open-next-node` fica disponivel;
- teste prova bloqueios por PR Draft/CI pendente e por proximo no que ja declara
  PR;
- teste prova que o plano `open-node` e mutante e declara branch, PR factual,
  `state.yml`, `active.yml` e `tasks.md`;
- testes puros provam `state.yml` movendo o no ativo para `concluded`, o proximo
  no para `active` com PR factual, `active.yml` apontando para a nova branch e
  `tasks.md` materializando o proximo checkpoint;
- teste de aplicacao por fakes prova criacao de branch, publicacao de branch,
  criacao de PR Draft, escrita dos artefatos governados, commit exclusivo e push;
- testes negativos provam bloqueio por working tree suja e por mixed diff fora
  dos artefatos esperados;
- teste de `GovernedFlow` prova que o recomendado pos-Gate e `open-next-node`;
- teste de `work` prova que gate aprovado nao fica mais sem decisao governada.

Estado de seguranca:

- nenhum Human Gate, Ready, merge, advance-subcheckpoint ou abertura de novo PR
  real foi executado por esta correcao;
- `open-next-node` nao autoriza implementacao do proximo no;
- o comando fecha a divergencia work/decide/cockpit para leitura e execucao
  governada da transicao pos-Gate, mas continua exigindo confirmacao humana
  explicita para qualquer mutacao real.

## Dogfood CO-10.3 — resumo humano tambem deve ser projecao governada

Falha observada durante o acompanhamento pelo celular:

- o runtime ja sabia projetar o estado tecnico em `cockpit`, `work` e `decide`;
- mas a compreensao operacional ainda dependia do agente traduzir manualmente:
  "o que esta pronto", "o que falta", "qual comando olhar" e "o que nao fazer";
- essa traducao era util para a owner, mas se permanecesse apenas na memoria do
  agente viraria mais uma heuristica paralela ao fluxo governado.

Correcao aplicada em CO-10.3:

1. `GovernedFlow` passou a derivar `HumanSummary` junto das acoes
   disponiveis, bloqueadas, proibidas e recomendadas.
2. O resumo simples e produzido pela mesma fonte que decide a proxima acao; ele
   nao recalcula readiness, Human Gate, CI, findings ou proibicoes por conta
   propria.
3. `cockpit` renderiza o `HumanSummary` antes dos detalhes tecnicos.
4. O wizard Clack usa o mesmo `HumanSummary` como nota inicial do fluxo.

Falsificacao adicionada:

- teste de `GovernedFlow` prova que, quando `mark-readiness` e a proxima acao,
  o resumo humano mostra readiness como falta e lista CI/tree/findings como ok;
- teste de `cockpit` prova que o bloco `Resumo simples` aparece antes do estado
  tecnico;
- teste de wizard prova que a nota inicial vem do `HumanSummary` comum.

Estado de seguranca:

- o resumo simples e read-only;
- nenhuma readiness, advance-subcheckpoint, Ready, Human Gate, merge ou abertura
  de PR foi executada por esta correcao;
- o objetivo e reduzir dependencia de interpretacao do agente sem criar uma nova
  autoridade.

## Dogfood CO-10.4 — fim de sub-checkpoint nao deve exigir duas autorizacoes

Falha observada ao tentar encerrar os pontos internos de `co-flow-convergence`:

- o fluxo passou a ter readiness governada, mas o caso comum ainda exigia duas
  decisoes humanas separadas:
  1. `mark-readiness` para adicionar `readiness: ready-for-transition`;
  2. `advance-subcheckpoint` para marcar o atual `[x]` e abrir o proximo `[/]`;
- para a owner, isso parecia excesso de autorizacao para uma unica intencao:
  "terminei este ponto, pode abrir o proximo";
- se a traducao ficasse a cargo do agente, o proprio CO-10.4 criaria outra
  heuristica informal: decidir quando readiness isolada e quando advance
  separado seriam necessarios.

Correcao aplicada em CO-10.4:

1. `finish-subcheckpoint` foi adicionado como decisao humana governada para o
   caso interno nao-terminal.
2. A nova decisao usa o mesmo snapshot e as mesmas derivacoes de
   `mark-readiness` e `advance-subcheckpoint`:
   - sem readiness persistida, mas criterios satisfeitos -> disponivel;
   - com readiness ja persistida e `advance` disponivel -> disponivel;
   - terminal sem proximo `[ ]` -> nao se aplica.
3. O efeito permitido continua estreito: somente `tasks.md`, trocando os
   marcadores `[/] -> [x]` e `[ ] -> [/]`.
4. `work`, `cockpit`, wizard e `decide` passam a recomendar a mesma acao
   preferencial: `finish-subcheckpoint`.
5. `mark-readiness` e `advance-subcheckpoint` permanecem como caminhos
   explicitos para terminal/fallback, mas deixam de ser a experiencia principal
   do fim normal de sub-checkpoint.

Falsificacao adicionada:

- teste de `finish-subcheckpoint` prova disponibilidade sem readiness
  persistida quando os criterios estao satisfeitos;
- teste prova disponibilidade tambem quando readiness ja existia;
- teste prova bloqueio por CI pendente;
- teste prova que terminal sem proximo pendente nao usa `finish-subcheckpoint`;
- teste de apply prova commit exclusivo de `tasks.md`, com `CO-10.4 [/] -> [x]`
  e `CO-10.5 [ ] -> [/]`, sem alterar `state.yml`;
- teste de `GovernedFlow` prova que cockpit/work/decide concordam sobre
  `finish-subcheckpoint` como proxima acao interna;
- teste de cockpit prova que `finish-subcheckpoint` tem prioridade sobre
  `mark-readiness`;
- teste de wizard prova que a nota e a proxima acao vêm do mesmo `HumanSummary`.

Estado de seguranca:

- nenhum `finish-subcheckpoint` mutante foi executado no estado real durante esta
  implementacao;
- CO-10.4 continua ativo enquanto a owner nao exercer a decisao;
- CO-10.5 nao foi iniciado;
- nenhum Ready, Human Gate, gate artifact, merge ou abertura de novo PR foi
  executado.

## Dogfood CO-10.4 — smoke real nao deve ser pedagio de todo PR intermediario

Falha observada durante o acompanhamento de CI do PR #43:

- o check `smoke` aparecia como contexto required mesmo quando a suite real
  estava suspensa;
- a suspensao era intencional para nao transformar cada no intermediario da
  stack em validacao de pacote;
- mas o contrato ainda dizia, de forma ampla, que `pr-ready:check` bloquearia
  Ready/Human Gate sempre que `AI_GUIDELINES_SMOKE_TEMPORARILY_SUSPENDED=true`;
- isso misturava dois casos diferentes:
  1. PR intermediario que nao muda pacote/consumidor;
  2. fechamento final/publicacao, onde smoke real e obrigatorio.

Correcao aplicada em CO-10.4:

1. `pr-ready:check` passou a derivar uma politica factual de smoke a partir da
   topologia e do diff do PR.
2. Smoke real fica **adiado** quando o PR e intermediario e nao muda superficie
   de pacote/consumidor.
3. Mudanca de pacote/runtime consumidor em PR intermediario vira aviso
   explicito, nao bloqueio: a suite real volta a bloquear no fechamento final da
   spec e no release.
4. Smoke real fica **obrigatorio** quando:
   - o PR e o ultimo no antes de `integration-final`;
   - o diff nao pode ser classificado com seguranca.
5. O workflow `smoke` continua produzindo o contexto required para evitar drift
   do ruleset, mas a decisao de bloqueio fica em `pr-ready:check`.
6. O workflow de release agora roda `npm run test:smoke` explicitamente antes
   de `npm publish`.

Falsificacao adicionada:

- teste prova que smoke suspenso em PR intermediario sem impacto de pacote vira
  aviso, nao bloqueio;
- teste prova que pacote/runtime consumidor alterado em PR intermediario nao
  bloqueia smoke real, mas permanece classificado;
- teste prova que o ultimo no antes da integracao exige smoke real;
- teste prova que diff desconhecido falha fechado e exige smoke real;
- teste prova que, quando smoke e obrigatorio, ausencia do check `smoke` falha.

Estado de seguranca:

- smoke nao foi removido;
- publicacao npm continua protegida por smoke real;
- Ready/Human Gate continuam bloqueados quando a spec esta no fechamento final
  ou quando o diff nao pode ser classificado com seguranca;
- o release por tag continua bloqueado por `npm run test:smoke` antes do
  `npm publish`;
- nenhum Ready, Human Gate, gate artifact, merge ou abertura de novo PR foi
  executado por esta mudanca.

## Dogfood CO-10.4 — validacao intermediaria deve ser barata e orientada ao diff

Friccao observada durante o acompanhamento do PR #43:

- o workflow `repo-validation` rodava `npm run validate` completo em todo PR,
  inclusive enquanto o PR estava Draft e ainda em implementacao;
- isso fazia cada push intermediario pagar o custo de formatacao global, build
  completo, testes completos e checks historicos;
- ao mesmo tempo, remover validacao intermediaria seria inseguro, porque erros
  simples de formatacao, TypeScript ou contrato poderiam acumular ate o Human
  Gate.

Correcao aplicada em CO-10.4:

1. `npm run flow -- validate changed` foi adicionado como comando governado de
   validacao intermediaria.
2. O comando coleta os arquivos alterados por Git e executa:
   - `git diff --check`;
   - Prettier somente nos arquivos alterados formataveis;
   - `npm run build` quando o diff toca TypeScript/package;
   - checks especificos quando o diff toca contratos, workflows, state,
     projections, reviews ou gates.
3. `--fix` permite formatar somente os arquivos alterados em uso local.
4. `npm run validate:changed` foi projetado no contrato de scripts para CI e
   humanos.
5. O workflow `repo-validation` passou a ter duas fases:
   - PR Draft: `validate-changed`, rapido e orientado ao diff;
   - PR Ready/main: `validate-os`, com `npm run validate` completo e varredura
     historica de state.
6. O contexto required `repo-validation` permanece estavel; o que muda e o
   conteudo validado conforme a fase do PR.
7. O cockpit passou a mostrar explicitamente:
   - validacao intermediaria: `npm run flow -- validate changed`;
   - validacao completa para decisao: `npm run validate`.

Falsificacao adicionada:

- testes provam que arquivos formataveis do diff sao enviados ao Prettier;
- testes provam que `--fix` usa `prettier --write`;
- testes provam que TypeScript/package acionam build;
- testes provam que contrato/workflow/docs acionam `script-contracts:check`;
- testes provam que state/projection acionam `state-yml:check` e
  `active-specs:check`;
- testes provam que reviews/gates acionam `review:check`;
- teste prova que o contrato de workflow aceita comando contratado com
  argumentos, como `npm run validate:changed -- --base ...`, sem aceitar comando
  apenas parecido;
- dogfood real executou `npm run validate:changed` no diff desta implementacao.

Estado de seguranca:

- `npm run validate` continua existindo e continua sendo o gate completo antes
  de Ready/Human Gate;
- PR Ready e `main` continuam rodando a validacao completa em CI;
- a validacao intermediaria nao executa Ready, Human Gate, gate artifact, merge
  ou transicao de sub-checkpoint;
- CO-10.5 nao foi iniciado por esta mudanca.

## Dogfood CO-10.4 — wizard governado avancado com Clack

Friccao observada durante o dogfood do PR #43:

- `npm run flow` ja abria uma experiencia interativa, mas ainda parecia um menu
  simples;
- a pessoa precisava alternar mentalmente entre cockpit, work, decide,
  validacao do diff e provisioning;
- a proxima acao recomendada aparecia como uma opcao, mas sem briefing curto,
  preview visual ou separacao clara entre acoes disponiveis, bloqueadas e
  proibidas;
- o wizard de provisioning usava selecoes planas para providers/features,
  embora essas escolhas tenham grupos naturais;
- isso enfraquecia o objetivo do `co-flow-convergence`: uma entrada humana
  situada, guiada e derivada do mesmo modelo governado.

Correcao aplicada em CO-10.4:

1. A porta `Prompts` passou a expor affordances avancadas do Clack:
   `taskList`, `taskLog`, `groupMultiselect` e mensagens de status.
2. `ClackPrompts` virou o unico adapter interativo e apenas renderiza essas
   affordances; ele nao decide readiness, CI, PR Ready, Human Gate ou proxima
   acao.
3. O wizard raiz passou a mostrar resumo simples, status de acoes
   disponiveis/bloqueadas/proibidas e menu com a proxima acao destacada.
4. "Continuar proxima acao recomendada" agora mostra briefing curto,
   comando canonico e efeito permitido antes de delegar para `decide`.
5. O wizard nao aplica decisao propria: quando a pessoa confirma, ele abre o
   fluxo governado de `decide`.
6. A secao "Validar minhas mudancas" permite rodar `validate changed` e
   `validate changed --fix`, com confirmacao explicita para o caminho que pode
   formatar arquivos.
7. `init`, `adopt` e `update` continuam disponiveis via registry; `providers`
   continua inexistente como comando.
8. Providers e features passaram a usar selecao agrupada quando o prompt
   suporta `groupMultiselect`.
9. O wizard de `decide` passou a renderizar lista de decisoes, briefing,
   preview e aplicacao com affordances Clack, mantendo a confirmacao final no
   proprio `decide`.

Falsificacao adicionada:

- teste prova que `npm run flow` em non-TTY continua imprimindo cockpit
  textual, sem prompt;
- teste prova que o menu mostra a proxima acao, provisioning e validacao sem
  listar `providers`;
- teste prova que a proxima acao delega para `decide` e pode ser cancelada sem
  mutacao;
- teste prova que `validate changed` e `validate changed --fix` executam os
  comandos corretos, com confirmacao para `--fix`;
- teste prova que `init`/`adopt`/`update` permanecem no wizard e `providers`
  nao volta como operacao;
- teste prova que providers usam grupos de selecao e que a aplicacao do plano
  mostra spinner;
- teste prova que o adapter `ClackPrompts` delega `groupMultiselect`, `tasks`,
  `taskLog` e status para as primitivas do Clack;
- guard prova que `@inquirer/*`, `InquirerPrompts`, `/cli` legado e comando
  `providers` nao podem voltar sem falha.

Estado de seguranca:

- nenhuma decisao mutante foi executada durante esta melhoria;
- nenhum Ready, Human Gate, gate artifact, merge ou advance-subcheckpoint foi
  executado;
- CO-10.5 nao foi iniciado;
- a melhoria e somente de experiencia/derivacao de fluxo, mantendo
  `GovernedFlow`, `work`, `decide` e `CommandRegistry` como fontes de decisao.

## Dogfood CO-10.4 — escopo do ponto atual precisa aparecer no wizard

Friccao observada durante o dogfood do PR #43:

- o wizard ja mostrava o sub-checkpoint ativo e o proximo por id (`CO-10.4`,
  `CO-10.5`), mas nao explicava, em linguagem simples, o que cada ponto faz;
- a pessoa precisava abrir `tasks.md` para entender o escopo real de
  "dogfood ponta a ponta" e "falsificacao + Human Gate";
- a lista de acoes disponiveis mostrava "concluir ponto atual" e "declarar
  readiness" no mesmo nivel, sem deixar claro qual era a acao recomendada e
  qual era uma alternativa menor;
- isso enfraquecia o objetivo do `flow`: orientar a proxima acao sem exigir que
  a humana leia o codigo ou o arquivo de tarefas.

Correcao aplicada em CO-10.4:

1. `HumanSummary` passou a carregar `currentObject` e `nextObject`.
2. Esses objetos sao derivados do mesmo snapshot governado de sub-checkpoints,
   reaproveitando o texto de `tasks.md` quando disponivel.
3. O cockpit e o wizard mostram uma secao "Escopo em linguagem simples" com:
   - "Agora": id, titulo, objetivo e entrega esperada do ponto ativo;
   - "Depois": id, titulo, objetivo e entrega esperada do proximo ponto.
4. A lista de acoes disponiveis agora separa "Recomendada" de "Alternativa".

Falsificacao adicionada:

- teste prova que `GovernedFlow` extrai objetivo e saida do objeto atual e do
  proximo sub-checkpoint;
- teste prova que `renderHumanSummary` mostra a secao de escopo antes dos
  detalhes tecnicos;
- teste prova que o wizard herda o mesmo `HumanSummary`, sem criar regra
  propria;
- teste prova que a lista de acoes disponiveis distingue a acao recomendada da
  alternativa.

Estado de seguranca:

- nenhuma decisao mutante foi executada;
- nenhum Ready, Human Gate, gate artifact, merge ou advance-subcheckpoint foi
  executado;
- CO-10.5 nao foi iniciado;
- a melhoria e uma correcao de explicabilidade do fluxo, nao uma mudanca de
  topologia ou de autoridade.
