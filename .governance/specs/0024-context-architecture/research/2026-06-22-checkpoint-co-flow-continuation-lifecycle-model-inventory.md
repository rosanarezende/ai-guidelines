# PR #44 — Inventario do lifecycle ponta a ponta

Data: 2026-06-22  
Spec: 0024 — context-architecture  
No: `co-flow-continuation`  
PR: #44 — `feat/spec-0024-co-flow-continuation`  
Decisao de recorte: **[DEC-0024-G21] — PR #44 fecha decisao de modelo + inventario, com guardrail contra debito arquitetural silencioso**

## 1. Veredito curto

Este inventario transforma a dor observada na Spec 0024 em modelo analisavel:
runtime antigo, runtime novo, regras duplicadas e derivacoes parciais estavam
tentando explicar o mesmo estado por caminhos diferentes.

O PR #44 nao deve resolver toda a arquitetura. Ele deve fechar:

- o modelo conceitual de fronteiras: **no topologico**, **checkpoint** e **PR**;
- a matriz ponta a ponta do lifecycle governado;
- os principais pontos de drift entre SSOT, projecoes, comandos e experiencia;
- o plano dos proximos checkpoints/PRs sem usar a nomenclatura `CO-10.8.*`.

Implementacao estrutural, refactor, BDD visual, falsificacao ampla e Human Gate
ficam para checkpoints/PRs posteriores.

## 2. Fronteiras de modelo

| Conceito      | Definicao proposta                          | SSOT                                     | Pode atravessar PR?                    | Observacao                              |
| ------------- | ------------------------------------------- | ---------------------------------------- | -------------------------------------- | --------------------------------------- |
| No topologico | Etapa estrutural ordenada da spec           | `state.yml § topology`                   | Sim, mas cada PR deve declarar recorte | Define ordem macro e proximo no         |
| Checkpoint    | Entrega governada com criterio de saida     | `tasks.md` + decisao governada aplicavel | Nao deveria; se atravessa, quebrar     | Unidade humana de trabalho/revisao      |
| PR            | Container de diff, CI e review              | GitHub + branch + PR body                | Sim, pode conter checkpoints coesos    | Nao deve virar SSOT da entrega          |
| Gate          | Registro posterior a decisao humana         | `gates/`                                 | Nao                                    | Nasce depois da decisao, nunca antes    |
| Review        | Artefato de avaliacao/falsificacao          | `reviews/` + `review-policy.yml`         | Pode acumular eventos                  | Obrigatoriedade vem da policy           |
| Drift         | Divergencia entre fonte, projecao e consumo | Governance Doctor + checks               | Sim, ate ser classificado              | Detectar/explicar nao significa reparar |

## 3. Regra de divisao por PR

### Regra candidata

Um PR pode conter mais de um checkpoint somente quando todos forem:

1. pequenos;
2. sequenciais;
3. coesos;
4. revisaveis juntos;
5. explicitamente listados no PR body.

Um checkpoint que precisa atravessar varios PRs deve ser dividido em checkpoints
menores. A nomenclatura decimal (`CO-10.8.1`) nao deve ser usada como mecanismo
de divisao; o checkpoint deve ganhar um nome semantico.

### Aplicacao ao PR #44 apos G21

O PR #44 fecha o recorte de decisao/inventario/dogfood:

- `drift-diagnosis-and-repair`;
- `checkpoint-model-boundaries`;
- `lifecycle-model-inventory`.
- `artifact-taxonomy-inventory`;
- `no-silent-architecture-debt` / GG-0005.

O PR #44 nao deve fechar:

- `lifecycle-code-confrontation`;
- `lifecycle-architecture-refactor`;
- `maintainer-bdd-visualization`;
- `broad-flow-falsification`;
- `continuation-external-review-and-human-gate`.

## 4. Fontes, projecoes e consumidores

| Conceito         | SSOT                                       | Projecoes                            | Consumidores            | Validadores atuais                           | Risco atual                                     |
| ---------------- | ------------------------------------------ | ------------------------------------ | ----------------------- | -------------------------------------------- | ----------------------------------------------- |
| No ativo         | `state.yml § topology.cursor`              | handoff, work, mapa, PR body         | CLI, agentes, humanos   | `reconcile:check`, handoff                   | Narrativa `next` divergir da topologia          |
| Checkpoint ativo | `tasks.md`                                 | handoff, work, decide, mapa          | implementador, reviewer | `active-specs:check`, testes de decide       | Linha de task ausente ou marcador contraditorio |
| Branch ativa     | Git + `active.yml` como projecao           | handoff, work, mapa                  | hooks, push, agentes    | `active-specs:check`, `repair` drift #1      | Projecao stale bloquear ou orientar errado      |
| PR ativo         | GitHub PR                                  | handoff, pr-ready, mapa              | humanos, CI, reviewers  | `pr-ready:check`, checks GitHub              | Body stale ou checks de fontes diferentes       |
| Reviews          | `reviews/` + eventos                       | review:check, handoff, gate briefing | owner, reviewers        | `review:check`                               | Reviews opcionais confundidos com bloqueantes   |
| Findings         | artefatos de review                        | decide, work, gate                   | implementador, owner    | `review:check`, consolidate                  | Findings antigos inferirem readiness indevida   |
| Readiness        | decisao governada / marcador em `tasks.md` | work, decide, pr-ready               | owner, PR               | `deriveAdvanceEligibility`, `pr-ready:check` | Heuristicas locais divergirem                   |
| Human Gate       | `gates/` apos decisao                      | handoff, PR body, mapa               | owner, proximo no       | gate artifact + policy                       | Gate ser tratado como pre-criado                |
| Receipt          | `.git/ai-guidelines/*`                     | advisories/checks                    | comandos mutantes       | handoff:check/advisory                       | Recibo ser reescrito pelo fluxo que valida      |
| Commands         | registry                                   | help, wizard, site, scripts          | humanos, LLMs, CI       | command surface tests                        | Comandos duplicados fora do registry            |
| Site/mapa        | artefatos derivados                        | site, HTML local, futura API         | humanos/liderancas      | ainda manual                                 | Virar SSOT paralela se editado manualmente      |
| Imagens/prompts  | ainda sem catalogo formal                  | PR/mapa/site                         | humanos visuais         | nenhum                                       | Prompts se perderem em chat/PR                  |

## 5. Lifecycle canônico proposto

O ciclo completo que a arquitetura deve modelar de forma unica:

```text
nova sessão
→ handoff
→ work
→ implementação
→ review
→ resolution
→ disposition
→ avanço de checkpoint
→ Ready
→ Human Gate
→ transição de nó
→ integração
→ merge
```

O modelo precisa declarar, para cada transicao:

- fato de entrada;
- autoridade;
- comando;
- efeito permitido;
- artefato alterado;
- validacao;
- proximo estado;
- acoes proibidas.

## 6. Matriz de transicoes

| Estado/transicao                           | Fato de entrada                        | Autoridade                                          | Comando/superficie                                                              | Efeito permitido                                         | Artefato alterado                                                 | Validacao                              | Proximo estado                  | Acoes proibidas                             |
| ------------------------------------------ | -------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------- | ------------------------------- | ------------------------------------------- |
| Nova sessao → handoff                      | Repo governado, spec/branch detectavel | Read-only                                           | `npm run flow -- handoff [spec]`                                                | Emitir snapshot situado e recibo efemero                 | `.git/ai-guidelines/handoff-load.json`                            | `handoff:check`, fontes fresh          | Humano/LLM entende estado       | Alterar tasks/state/reviews/gates           |
| Handoff → work                             | Handoff situado carregado              | Read-only; autorizacao so amplia escopo do trabalho | `npm run flow -- work [--authorization explicit-work-request]`                  | Projetar escopo, proibições, validacoes e contrato final | Nenhum, salvo recibos efemeros                                    | Work policy + snapshot                 | Implementacao delimitada        | Ready, gate, merge, outro checkpoint        |
| Work → implementacao                       | Pedido humano explicito                | Humano autoriza trabalho no escopo                  | Edicao de codigo/docs + testes                                                  | Alterar arquivos do escopo                               | Codigo/docs/testes/projecoes                                      | `validate:changed` ou alvo equivalente | Diff implementado               | Mudar topologia sem decisao                 |
| Implementacao → review                     | Humano pede review/auditoria           | Humano autoriza review especifica                   | `npm run flow -- review <type> --authorization explicit-review-request`         | Criar/atualizar artefato de review                       | `reviews/`                                                        | `review:check`                         | Findings/review selados         | Autoaprovar findings                        |
| Review → resolution                        | Findings aceitos/exigem correcao       | Implementador no escopo do finding                  | Codigo/docs + artefato de resolution                                            | Corrigir e declarar resolucao                            | codigo/docs + `reviews/*resolutions.yml`                          | testes + `review:check`                | Finding pronto para disposition | Fechar finding sem reviewer/decisao         |
| Resolution → disposition                   | Reviewer/owner decide sobre findings   | Humano/reviewer autorizado                          | `npm run flow -- decide --type close-dispositions`                              | Registrar disposition                                    | artefatos de review/resolution                                    | `review:check`                         | Findings fechados ou pendentes  | Mutar codigo fora do escopo                 |
| Checkpoint em execucao → checkpoint pronto | Criterios de saida satisfeitos         | Humano                                              | `npm run flow -- decide --type mark-readiness` ou caminho equivalente           | Declarar readiness                                       | `tasks.md`                                                        | eligibility de readiness               | Checkpoint pronto para avancar  | Criar gate/merge                            |
| Checkpoint pronto → proximo checkpoint     | Readiness + guardas satisfeitos        | Humano                                              | `npm run flow -- decide --type finish-subcheckpoint` ou `advance-subcheckpoint` | Marcar atual concluido e ativar proximo                  | `tasks.md`                                                        | `deriveAdvanceEligibility`             | Proximo checkpoint ativo        | Pular checkpoint, editar state indevido     |
| PR Draft → Ready                           | Checkpoint/recorte entregue e validado | Humano/maintainer                                   | `pr-ready:check`, atualizar PR body, converter Ready                            | Comunicar que esta pronto para decisao                   | GitHub PR body/status                                             | CI + `pr-ready:check`                  | PR pronto para Human Gate       | Ready se body/testes/reviews incoerentes    |
| Ready → Human Gate                         | Review/CI/briefing completos           | Rosana                                              | `npm run flow -- decide --type human-gate`                                      | Registrar decisao humana                                 | `gates/`                                                          | gate artifact + policy                 | Aprovado, rejeitado ou mudanças | Merge automatico, abrir proximo sem decisao |
| Human Gate → transicao de no               | Gate aprovado e proximo no planejado   | Humano                                              | `open-next-node` / fluxo governado aplicavel                                    | Criar branch/PR do proximo no e reconciliar projecoes    | `state.yml`, `active.yml`, PR Draft, `tasks.md` conforme contrato | hooks + active-specs + CI              | Proximo no ativo em PR novo     | Iniciar no sem branch/PR/projecao coerente  |
| Transicao → integracao                     | Stack pronta conforme modo unit        | Humano                                              | comandos governados de integration/land                                         | Preparar fechamento de spec/stack                        | integration PR/release artifacts                                  | review final + CI                      | Spec pronta para merge unico    | Merge parcial em main                       |
| Integracao → merge                         | Boundary terminal aprovado             | Humano                                              | merge GitHub                                                                    | Integrar em main                                         | Git history/main                                                  | CI/ruleset                             | Spec encerrada                  | Merge sem gate terminal                     |

## 7. Invariantes que precisam ser executaveis

1. Se `work` recomenda uma decisao, `decide` deve oferecer a mesma decisao ou
   explicar o bloqueio com os mesmos fatos.
2. Se `decide` bloqueia uma acao, `work` nao pode tratar essa acao como
   executavel.
3. Um estado nao pode ser simultaneamente "implementar checkpoint" e "preparar
   transicao".
4. Uma projecao nao pode atualizar silenciosamente a fonte que esta validando.
5. Toda mutacao deve declarar autoridade, preview, artefatos afetados e validacao.
6. Registry, wizard, help, scripts e site devem derivar comandos da mesma fonte.
7. Readiness nao pode ser inferida por findings antigos ou por contagem local.
8. Reviews opcionais nao podem virar bloqueio sem policy.
9. Gate artifact nasce depois da decisao humana, nunca antes.
10. Mapa/site/API devem projetar estado; nao podem virar SSOT paralela.

## 8. Gaps conhecidos a confrontar depois do inventario

| Gap                                                        | Evidencia observada                     | Classificacao inicial  | Proximo passo                            |
| ---------------------------------------------------------- | --------------------------------------- | ---------------------- | ---------------------------------------- |
| `handoff` x `work` explicam estado por caminhos diferentes | Historico da Spec 0024 e dogfood        | risco arquitetural     | Confronto modelo x codigo                |
| `work` x `decide` ja divergiram sobre advance/readiness    | Testes/arquivos de `advanceEligibility` | parcialmente corrigido | Provar invariante para todas as decisoes |
| Readiness inferida por findings antigos                    | Dogfood CO-10.1..10.7                   | parcialmente corrigido | Falsificar jornada real                  |
| Registry novo delegando superficies legadas                | Historico de cutover                    | risco residual         | Inventariar delegacoes restantes         |
| Recibo reescrito pelo fluxo que valida recibo              | Dogfood CO-3.4                          | corrigido em parte     | Confirmar nao regressao                  |
| Checks e comandos com criterios diferentes                 | Drifts #2..#7 e preflight               | ativo                  | Centralizar derivacoes                   |
| PR body/manualidade de templates                           | Dogfood PR #44                          | candidato de produto   | Conectar a `pr-body:create/update`       |
| Mapas/prompts visuais manuais                              | Artefatos em `assets/` e chat           | candidato de produto   | Criar `SpecMapViewModel`                 |

## 9. Modelo de proximos checkpoints sem `CO-10.8.*`

| Ordem candidata | Checkpoint semantico                          | Objetivo                                                                    | PR sugerido       |
| --------------- | --------------------------------------------- | --------------------------------------------------------------------------- | ----------------- |
| 1               | `drift-diagnosis-and-repair`                  | Detectar/explicar/reparar drift seguro quando houver gerador deterministico | PR #44            |
| 2               | `checkpoint-model-boundaries`                 | Decidir modelo no/checkpoint/PR e abandonar sub-sub checkpoint decimal      | PR #44            |
| 3               | `lifecycle-model-inventory`                   | Inventariar ciclo completo e fontes/consumidores                            | PR #44            |
| 4               | `artifact-taxonomy-and-model-review-contract` | Implementar taxonomia de artefatos, index check e review pre-codificacao    | PR seguinte       |
| 5               | `lifecycle-code-confrontation`                | Comparar modelo x codigo e classificar gaps                                 | PR posterior      |
| 6               | `lifecycle-architecture-refactor`             | Reorganizar runtime/testes sem alterar comportamento                        | PR posterior      |
| 7               | `maintainer-bdd-visualization`                | Criar vitrine visual de cenarios para mantenedores                          | PR posterior      |
| 8               | `broad-flow-falsification`                    | Rodar jornadas reais e falsificacoes amplas                                 | PR posterior      |
| 9               | `continuation-external-review-and-human-gate` | Revisao independente e decisao humana do no                                 | PR terminal do no |

## 10. Perguntas para revisao externa

1. O modelo separa corretamente no, checkpoint e PR?
2. A regra "checkpoint nao atravessa PR" e forte demais ou adequada?
3. A matriz de transicoes omite algum estado obrigatorio do lifecycle real?
4. Alguma transicao tem autoridade indefinida ou efeito amplo demais?
5. Alguma projecao esta sendo tratada como fonte?
6. O PR #44 fica revisavel com o recorte de G21?
7. O inventario e suficiente para orientar o confronto modelo x codigo?
8. O mapa visual cria risco de nova SSOT paralela?

## 11. Criterio de saida do PR #44 para este recorte

Este recorte pode ser considerado fechado quando:

- `[DEC-0024-G21]` estiver registrada;
- o mapa V2 estiver disponivel como artefato visual nao-SSOT;
- este inventario estiver versionado;
- o guardrail GG-0005 estiver registrado;
- o PR body declarar claramente o que o PR #44 fecha e o que fica fora;
- revisao/falsificacao puder avaliar o inventario antes de refactor;
- nenhum `CO-10.8.*` novo for introduzido como checkpoint real.

## 12. Fronteira explicita

Este inventario nao autoriza:

- Ready;
- Human Gate;
- merge em main;
- transicao para `dualroot-collapse`;
- refactor estrutural sem confronto modelo x codigo;
- criacao de API/spec-map runtime;
- uso do mapa como SSOT.

## 13. Revisao de falsificacao relacionada

Este inventario foi submetido a uma revisao de falsificacao pre-implementacao em
`research/2026-06-22-checkpoint-co-flow-continuation-spec-map-falsification-review.md`.

A revisao confirmou que a matriz e util como inventario de modelo, mas bloqueou seu
uso como base topologica ate que a decomposicao semantica seja registrada em DEC,
reconciliada com `state.yml`/`tasks.md` e refletida no body do PR #44.
