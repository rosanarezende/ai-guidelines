# CO-10.6 — falsificacao + preparacao de Human Gate

> Spec 0024 · PR #43 · `checkpoint-co-flow-convergence`.
> Este dossie registra a falsificacao terminal do no `co-flow-convergence`.
> Nao executa Ready, Human Gate, merge, abertura de novo PR ou transicao de no.

## Retomada factual

Snapshot inicial da sessao:

- branch: `feat/spec-0024-co-flow-convergence`;
- HEAD: `54da3bb`;
- local == origin;
- PR #43 aberto e Draft;
- CI remoto verde no HEAD observado;
- sub-checkpoint ativo: `CO-10.6 — falsificacao + Human Gate`;
- `work`: `IMPLEMENT_CHECKPOINT`;
- Human Gate indisponivel: `CO-10.6` ainda sem entrega/readiness e PR ainda Draft.

## Objetivo da falsificacao

O objetivo nao e provar que "esta tudo perfeito". O objetivo e tentar quebrar o
modelo nos pontos em que a Spec 0024 ja falhou antes:

1. dois comandos explicando o mesmo estado de forma diferente;
2. readiness liberada antes de haver entrega real;
3. ultimo sub-checkpoint tentando acionar `advance-subcheckpoint`;
4. Human Gate aparecendo antes de Ready/readiness/CI;
5. PR Ready usando criterio diferente de `decide human-gate`;
6. estado degradado liberando decisao insegura;
7. pos-Human Gate sem comando governado para abrir o proximo no;
8. caminhos legados ou aliases reaparecendo depois do colapso do runtime CLI.

## Falsificacao implementada

Foi adicionada a suite:

```text
src/cli/flow/finalFalsification.test.ts
```

Ela usa snapshots puros/fakes e nao executa mutacao real. Cada caso simula um
estado do fluxo e compara consumidores diferentes do mesmo modelo.

| Jornada falsificada                           | O que deve acontecer                                                                                                    | Prova automatizada                                       |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `CO-10.6` recem-ativado                       | `flow`, `work` e `decide` concordam que ainda e implementacao; readiness fica bloqueada por falta de commit de entrega. | `estado recém-ativado: flow, work e decide concordam...` |
| Entrega de `CO-10.6` feita, sem readiness     | proxima acao vira `mark-readiness`; `advance-subcheckpoint` nao se aplica porque nao ha proximo `[ ]`.                  | `CO-10.6 entregue mas sem readiness...`                  |
| Readiness terminal + PR Draft                 | `work` aponta Human Gate apenas como inspecao bloqueada; `decide` bloqueia por Draft; nao ha advance interno indevido.  | `readiness terminal + PR Draft...`                       |
| PR Ready + readiness terminal + checks verdes | Human Gate fica disponivel; `work`, `flow`, `decide` e `pr-ready` convergem.                                            | `PR Ready + readiness terminal + checks verdes...`       |
| Estado inseguro/degradado                     | CI pendente, branch atras ou tree suja bloqueiam readiness, Ready e Gate.                                               | `estado degradado ou inseguro falha fechado...`          |
| Pos-Human Gate aprovado                       | proxima acao e `open-next-node`; o efeito nao autoriza merge nem implementar o novo no.                                 | `pós-Human Gate: a próxima ação...`                      |

## Simulacao ampla de uso humano

A falsificacao tambem cobre uma pessoa que recebeu uma tarefa e precisa usar o
sistema sem olhar codigo. A simulacao nao executa decisoes mutantes; ela valida
se o modelo oferece a orientacao correta em cada estado.

| Momento da pessoa usuaria                   | Orientacao esperada do sistema                                                                          | Cobertura automatizada                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Recebeu a tarefa do sub-checkpoint atual    | mostrar `CO-10.6`, explicar que ainda e implementacao e nao oferecer decisao mutante antes da entrega.  | `simula uma pessoa recebendo uma tarefa...` |
| Terminou a entrega local                    | recomendar `mark-readiness`, com briefing read-only e comando mutante separado por autorizacao humana.  | `simula uma pessoa recebendo uma tarefa...` |
| Declarou readiness terminal, PR ainda Draft | orientar inspeção de Human Gate, mas bloquear por Draft; nao sugerir `advance-subcheckpoint` terminal.  | `simula uma pessoa recebendo uma tarefa...` |
| PR convertido para Ready com CI verde       | disponibilizar Human Gate e manter `flow`, `work`, `decide` e `pr-ready` convergentes.                  | `simula uma pessoa recebendo uma tarefa...` |
| Estado inseguro                             | orientar primeiro limpar working tree/reconciliar branch/aguardar CI; bloquear readiness, Ready e Gate. | `simula uma pessoa recebendo uma tarefa...` |
| Human Gate aprovado                         | recomendar `open-next-node`; continuar proibindo merge e implementacao automatica do proximo no.        | `simula uma pessoa recebendo uma tarefa...` |

### Adoção de repositório já em uso

Foi adicionada uma falsificacao especifica para o caso em que a pessoa quer
adotar o framework em um repositorio existente, com configuracoes e conflitos
reais. O objetivo e provar que o sistema nao cobre apenas o caminho feliz.

| Momento da pessoa usuaria              | Cenario simulado                                                                                                   | Resultado esperado                                                                                                  | Cobertura automatizada                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Escolhe adotar repo existente          | wizard usa `adopt`, package manager `npm`, providers `claude/openai/cursor` e features `prettier/husky/ci/tdd/bdd` | providers e features aparecem agrupados por intencao humana, com preview antes de aplicar.                          | `wizard de adopt guia conflito, bloqueio e correção com recursos avançados` |
| Repositorio ja tinha decisoes proprias | `package.json` com Biome, `AGENTS.md` humano, `CLAUDE.md` com bloco gerenciado antigo, CI propria e hook existente | plano preserva contexto humano e so altera blocos/effects explicitamente modelados.                                 | `adopt em repo existente encontra conflitos e corrige...`                   |
| Tentativa sem forcar                   | hook `pre-commit` tem formato nao suportado.                                                                       | comando falha com mensagem acionavel, nao escreve arquivos e nao executa processo.                                  | `adopt em repo existente encontra conflitos e corrige...`                   |
| Pessoa corrige a decisao               | nova tentativa com `force`, `force-prettier`, `prune` e install desabilitado.                                      | hook/CI/prettier/templates sao atualizados, template obsoleto e removido e textos humanos sao preservados.          | `adopt em repo existente encontra conflitos e corrige...`                   |
| Recursos avancados do Clack            | selecao agrupada, task log, lista de tarefas, preview e confirmacao.                                               | wizard conduz a pessoa pela escolha e pela correcao, mas nao cria regra propria fora do provisioning e do registry. | `wizard de adopt guia conflito, bloqueio e correção com recursos avançados` |

Conclusao da simulacao: o sistema esta preparado para orientar o caminho
principal da pessoa usuaria ate o ponto de decisao humana e tambem a jornada de
adocao em repositorio ja em uso, incluindo conflito, bloqueio e correcao
explicita. A pessoa nao precisa descobrir manualmente a sequencia entre `work`,
`decide`, Ready, Human Gate, transicao de no, `adopt`, `force`,
`force-prettier` e `prune`.

## Invariantes cobertas

- `flow`, `work` e `decide` nao podem recomendar acoes mutantes diferentes para
  o mesmo snapshot.
- Readiness exige entrega depois da ativacao do sub-checkpoint.
- Readiness terminal nao aciona `advance-subcheckpoint`.
- Human Gate exige readiness terminal, PR Ready, CI verde, checks canonicos e
  ausencia de bloqueios reais.
- `pr-ready` e Human Gate compartilham os fatos de CI/tree/reviews quando
  aplicavel.
- Estado sujo, branch atras, CI pendente/falha e fonte remota insegura falham
  fechado.
- Pos-Human Gate nao depende mais de sequencia manual: `open-next-node` e a
  decisao governada para abrir o proximo PR stacked.
- A abertura do proximo no nao autoriza merge nem implementacao do no novo.

## Evidencia local

Rodada focada:

```text
npm run test:ts -- src/cli/flow/finalFalsification.test.ts
```

Resultado:

```text
7 tests passed
```

Rodadas focadas adicionais para a jornada de adocao em repositorio existente:

```text
npm run test:ts -- src/cli/delivery/bootstrap/bootstrapDelivery.test.ts
npm run test:ts -- src/app/use-cases/ProvisionWorkspace.test.ts
```

Resultado:

```text
bootstrapDelivery.test.ts: 21 tests passed
ProvisionWorkspace.test.ts: 46 tests passed
```

## Riscos residuais para o Human Gate

Estes riscos nao bloqueiam a existencia da falsificacao, mas devem aparecer na
decisao humana:

1. `security_review`, `technical_audit` e `architectural_review` do checkpoint
   seguem opcionais e stale no snapshot atual. Pela politica vigente, isso nao
   bloqueia Gate, mas e informacao relevante para a owner.
2. `workflow` ainda existe como superficie tecnica historica. CO-10.5 o
   subordinou no menu, mas a Spec ainda devera observar se ele cria confusao
   fora do wizard.
3. `FLOW.html` e material explicativo, nao SSOT. O SSOT continua no modelo
   governado, nos comandos e nos testes.
4. Smoke real permanece adiado em PR intermediario quando a politica classifica
   que nao ha impacto de pacote/consumidor; volta a ser obrigatorio no fechamento
   final/publicacao ou quando o diff exigir.
5. `co-capture` ainda nao foi iniciado. Qualquer abertura do proximo no deve
   acontecer somente apos Ready + Human Gate aprovado + decisao governada
   `open-next-node`.

## Fronteira desta rodada

Esta rodada nao executou:

- `guidelines decide`/`flow decide` mutante de Human Gate;
- Ready;
- gate artifact;
- merge;
- abertura de novo PR;
- transicao de no.

Depois da entrega e validacao, o proximo passo governado esperado sera declarar
readiness terminal de `CO-10.6` por decisao propria, e nao por edicao manual de
`tasks.md`.
