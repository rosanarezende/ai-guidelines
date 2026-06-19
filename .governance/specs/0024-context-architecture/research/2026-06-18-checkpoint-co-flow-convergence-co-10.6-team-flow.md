# CO-10.6 — fluxo de time, multiplas specs e criacao de spec nova

> Spec 0024 · PR #43 · `checkpoint-co-flow-convergence`.
> Registro de implementacao e dogfood do sub-checkpoint CO-10.6.

## Problema observado

O dogfood de CO-10.5 melhorou o `npm run flow` como guia humano, mas ainda
deixava um caso importante escondido em uma area tecnica:

- ver specs abertas;
- continuar uma spec especifica;
- entender como iniciar uma spec nova;
- diferenciar a autoridade de contributor, maintainer e owner;
- evitar que uma pessoa use branch/PR/spec errada quando ha mais de uma frente
  aberta.

Esse problema e a mesma classe que originou `co-flow-convergence`: o humano
precisava reconciliar manualmente intencao, branch, PR, indice de specs, SSOT e
comando correto.

## Decisao de desenho aplicada

O wizard passou a ter uma entrada principal:

```text
Escolher ou iniciar uma spec
```

Ela nao e uma segunda fonte de verdade. A tela apenas conduz o humano para
superficies ja governadas:

- `npm run flow -- specs` para ver o indice publico de specs ativas;
- `npm run flow -- continue <id-ou-slug>` para carregar uma spec especifica;
- uma orientacao fail-closed para spec nova, sem criar branch, PR, topologia ou
  artefatos automaticamente.

## Jornada modelada

### 1. Ver specs abertas

Entrada humana:

```text
npm run flow
→ Escolher ou iniciar uma spec
→ Ver specs abertas
```

Efeito permitido:

```text
read-only
→ delega para specs
→ mostra id, slug, branch, stage, status e drift do indice publico
```

Teste esperado:

- o wizard despacha `specs`;
- nao chama `workflow`;
- nao altera arquivos.

### 2. Continuar uma spec especifica

Entrada humana:

```text
npm run flow
→ Escolher ou iniciar uma spec
→ Continuar uma spec especifica
→ informar "0024" ou "context-architecture"
```

Efeito permitido:

```text
read-only
→ delega para continue <identifier>
→ o comando existente resolve pelo indice ou pela spec local
→ se o path nao existir, orienta checkout/fetch em vez de inferir
```

Teste esperado:

- o wizard pede identificador;
- chama `continue <identifier>`;
- nao decide sozinho qual spec e mais importante.

### 3. Iniciar uma spec nova

Entrada humana:

```text
npm run flow
→ Escolher ou iniciar uma spec
→ Entender como iniciar uma spec nova
```

Efeito permitido:

```text
read-only
→ exibe protocolo de autoridade e precondicoes
→ nao cria branch
→ nao cria PR
→ nao altera state/tasks/active
```

Orientacao exibida:

1. Confirmar se a demanda nao pertence a uma spec ja aberta.
2. Ver specs abertas com `npm run flow -- specs`.
3. Definir objetivo, owner, tipo de mudanca e impacto esperado.
4. Pedir autorizacao humana explicita para criar branch, artefatos governados e
   PR Draft.
5. So depois materializar `state.yml`, `tasks.md`, `active.yml` e PR.

Autoridades:

- contributor: propoe e prepara contexto;
- maintainer: autoriza materializacao operacional;
- owner/Rosana: decide topologia, Ready, Human Gate e merge.

## Gaps eliminados

| Antes                                                     | Depois                                                           |
| --------------------------------------------------------- | ---------------------------------------------------------------- |
| `continue <id>` ficava escondido em ferramentas tecnicas. | `Escolher ou iniciar uma spec` virou opcao principal do wizard.  |
| Ver specs abertas parecia diagnostico, nao fluxo de time. | A tela explica quando usar o indice publico.                     |
| Spec nova nao tinha caminho humano visivel.               | O wizard mostra protocolo seguro sem mutacao automatica.         |
| A pessoa precisava lembrar autoridade e proibicoes.       | A tela explicita contributor/maintainer/owner e acoes proibidas. |

## Dogfood visual do site

Durante a revisao visual do `site/flow`, a primeira versao do material de
multiplas specs substituiu o fluxo anterior de repo em uso. Isso repetia a
classe de erro que o proprio CO-10.6 quer evitar: um novo caso de uso apagando
um caminho existente em vez de coexistir como fluxo distinto.

Correcao aplicada:

- `Fluxo 3` voltou a ser **Usar e manter um repo governado**;
- `Fluxo 4` passou a ser **Trabalhar em time com multiplas specs**;
- a navegacao do site mostra os dois caminhos;
- o Fluxo 3 explica uso diario, proxima acao, validacao, reviews, update e
  Gate;
- o Fluxo 3 recupera a linguagem de manutencao aprovada: repo governado usa
  `update`, nao `init/adopt`, e pode atualizar base, IA, qualidade, limpeza e
  colaboracao sem reinicializar o projeto;
- mudancas de colaboracao aparecem com aviso de autoridade, porque alteram a
  pratica global do repositorio;
- o Fluxo 4 explica indice de specs, escolha explicita, branch/PR, retomada,
  spec nova e trabalho em time.

Falsificacao esperada: se uma futura alteracao remover o Fluxo 3 ao adicionar
um fluxo de time, o site volta a esconder o caso de repo ja governado e deve
ser tratado como regressao de produto/documentacao.

### Reorganizacao em dois blocos humanos

Nova rodada de dogfood mostrou que quatro fluxos lineares tambem eram dificeis
de consumir: a pessoa precisava descobrir sozinha quais caminhos acontecem uma
vez (`init`/`adopt`) e quais pertencem ao uso diario (`flow`, specs, update,
review, Gate e merge).

Correcao aplicada:

- o topo do site agora separa **Comecar com ai-guidelines** de **Usar
  ai-guidelines no dia a dia**;
- `init` e `adopt` aparecem como jornadas de entrada, nao como acoes normais em
  repo ja governado;
- uso diario passou a agrupar continuidade da spec, multiplas specs, manutencao
  do repo, review entre pares e decisao humana;
- a matriz de comandos passou a listar `specs` e `peer-review` como superficies
  explicitas.

Falsificacao esperada: em um repo ja governado, o wizard/site nao deve sugerir
`init` ou `adopt` como caminho principal; para revisar PR de colega, deve haver
caminho proprio sem obrigar a trocar de branch manualmente.

### Review entre pares

Novo caso modelado:

```text
pessoa trabalhando em sua spec
→ precisa revisar PR de colega
→ escolhe PR
→ ve briefing read-only
→ escolhe worktree separado ou checkout guiado
→ confirma
→ revisa sem Ready/Human Gate/merge/transicao
```

Regra de seguranca:

- worktree separado e recomendado quando ha trabalho local;
- checkout guiado exige working tree limpa;
- o fluxo apenas prepara o ambiente de review;
- Ready, Human Gate, merge e transicao de checkpoint continuam fora desse
  caminho.

Comandos adicionados ao produto:

```bash
npm run flow -- peer-review 43 --brief-only
npm run flow -- peer-review 43 --mode worktree --confirm
npm run flow -- peer-review 43 --mode checkout --confirm
```

Falsificacao esperada: `peer-review --mode checkout --confirm` deve falhar com
working tree suja; `peer-review --mode worktree --confirm` nao deve exigir tree
limpa e deve criar worktree isolado.

### Site React navegavel para o Flow

Novo dogfood visual mostrou que, mesmo com conteudo melhor, o `site/flow` ainda
era uma pagina HTML longa demais para uso humano em celular. A pessoa precisava
rolar demais, comparar fluxos mentalmente e interpretar uma documentacao que
parecia mais um anexo estatico do que uma entrada navegavel do produto.

Correcao aplicada:

- o Flow saiu de `site/flow/index.html` e passou a ser renderizado dentro da
  aplicacao React/Vite;
- `/flow`, `/flow/comecar`, `/flow/uso-diario`, `/flow/time`,
  `/flow/review-entre-pares` e `/flow/referencia` viraram rotas navegaveis;
- o site passou a ter fallback SPA (`site/public/_redirects`) para abrir rotas
  diretas em preview/producao;
- os textos reais da CLI continuam sendo projetados, agora em
  `site/src/generated/flow-copy.generated.ts`;
- `init`/`adopt`, uso diario, time/multiplas specs e review entre pares viraram
  jornadas separadas com passos clicaveis e simulacao de terminal;
- o layout passou a ser mobile-first: explicacao primeiro, terminal/simulacao
  depois, e grids so entram em telas maiores.

Falsificacao esperada: se `site/flow/index.html` ou `flowHtml.json` voltar, o
site recria uma segunda fonte de apresentacao dificil de manter e deve falhar
nos guards de projecao.

## Limites preservados

- CO-10.7 nao foi iniciado.
- Readiness nao foi marcada.
- Nenhum Ready, Human Gate, merge ou advance-subcheckpoint foi executado.
- Nenhum comando mutante de criacao de spec foi introduzido.

## Riscos residuais para CO-10.7

- A criacao real de spec nova ainda nao e uma transicao mutante completa. Ela
  esta orientada de forma segura, mas ainda depende de autorizacao e execucao
  por agente/humano.
- O indice publico de specs continua sendo projecao; quando stale ou ausente, o
  sistema deve falhar com orientacao, nao inferir por heuristica.
- A proxima falsificacao deve cobrir branch errada, spec inexistente, indice com
  path ausente, PR stale e permissao insuficiente.
