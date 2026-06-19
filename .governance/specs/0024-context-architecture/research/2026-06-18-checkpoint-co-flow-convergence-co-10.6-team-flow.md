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

## Validacao externa por outra LLM (2026-06-19) e correcoes de fidelidade

Uma LLM revisora independente avaliou o PR #43 (site Flow em React/Vite no
Cloudflare Pages) e apontou tres riscos de FIDELIDADE (nao de governanca):

- B1 — narrativa operacional do site hard-coded em `flowData.ts`, fora do
  catalogo governado: segunda fonte de verdade que pode divergir do runtime.
- B2 — terminais do site eram strings simuladas que pareciam saida real (apenas
  `aria-label`, sem rotulo visivel).
- B3 — `optimize-assets.mjs` comparava bytes de WebP re-renderizado: quebra de
  build por diferenca de `sharp`/`libvips`, nao por conteudo.

Decisao da owner (autoridade explicita): refazer o site como porta de entrada do
produto com fatos operacionais derivados do runtime; prioridade dura "o site nao
pode mentir" antes de qualquer refino visual; transcripts reais quando estaveis.

### Correcoes aplicadas (ordem de fase: verdade antes de produto)

- B1 — `siteFlowCopy` projeta a superficie REAL de comandos (registry), o
  `INTENT_CATALOG` e a enumeracao de providers/features no modulo gerado.
  `flowData` deriva toda invocacao via `flowCommand`/`binCommand`; comando
  inexistente quebra o build. Guard `siteCommandSurface.test.ts`.
- A2 — auditoria de capacidades: as decisoes reservadas ao humano sao projetadas
  do registry de decisoes; o site enquadra Ready/Human Gate/merge como autoridade
  humana/bloqueavel, nunca automacao. Guard `siteCapabilities.test.ts`.
- B2 — gerador `site-scenarios`: captura stdout/exitCode REAIS de
  init/adopt/update `--dry-run` em diretorios temporarios (sem vazar caminhos) e
  deriva exemplos GUIADOS de work/handoff/decide/peer-review/specs a partir do
  contrato real do comando (gh/`.governance` indisponiveis em sandbox — fallback
  honesto). O site mostra procedencia VISIVEL por terminal (badge
  "Exemplo gerado/guiado/ilustrativo"). `site:scenarios:check` entra no
  `site:build`. Guard `siteScenarios.test.ts`.
- B3 — `site:assets:check` passa a gatear por hash da fonte PNG + parametros do
  encoder (`manifest.json`), nunca por bytes WebP. Troca de libvips nao quebra o
  check; so mudanca de fonte/parametros invalida o manifesto. Guard de
  determinismo em `tests/integration/site-assets-determinism.test.mjs`.
- Produto (Fase 2, apos verdade verde) — as jornadas exibem o transcript
  veridico associado (real/guiado); rota desconhecida vira 404 explicito (fim do
  soft-404 que caia em "flow"); cada rota recebe `document.title` proprio.

### Falsificacoes que passaram a existir

- Inserir `flowCommand("comando-inexistente")` no site quebra o guard de
  fidelidade (verificado).
- Editar a mao `flow-copy.generated.ts` ou `flow-scenarios.generated.ts` faz o
  respectivo `:check` falhar.
- Corromper bytes de um WebP NAO quebra `site:assets:check` (encoder tolerado);
  alterar o hash da fonte no manifesto QUEBRA (ambos verificados).
- `routeFromPath("/flow/inexistente")` retorna `notFound` (404 explicito).

### Limites preservados (reafirmados nesta rodada)

- Nenhum Ready, Human Gate, merge, advance-subcheckpoint ou mark-readiness.
- Nenhuma decisao mutante de `guidelines decide`; CO-5/CO-6 nao iniciados.
- Apenas arquivos funcionais do site/runtime, testes e este artefato de dogfood.

### Riscos residuais

- Transcripts reais cobrem init/adopt/update. work/handoff/decide/peer-review/
  specs ficam como exemplos GUIADOS rotulados (derivados do contrato), porque
  exigem `.governance`/git/`gh` e acoplar a saida viva a um artefato versionado
  seria um footgun de validacao. Promove-los a transcript real exige fixtures de
  repo governado — follow-up recomendado.
- A reestruturacao manteve os paths PT (`/flow/comecar` etc.) para nao quebrar
  links; uma migracao para paths canonicos `/flow/start` fica para depois.

## Redesign do site como porta de entrada (2026-06-19)

Com a fidelidade aceita como base, a owner pediu uma reorganizacao significativa
de informacao e layout — site como produto, nao colecao tecnica de fluxos.

- Home virou pagina de produto: hero claro, Problema, Solucao, tres caminhos por
  publico (projeto novo / repo existente / uso diario), teaser de time e trilha
  de seguranca (o que o sistema impede + callout "o que o humano decide",
  DERIVADO do registry de decisoes).
- `/flow` virou visao geral + tabs de cenarios reais; paginas `/flow/start`,
  `/flow/daily`, `/flow/team`, `/flow/review`, `/flow/reference` (paths PT
  mantidos como aliases para nao quebrar links). Referencia ganhou glossario.
- CSS mobile-first reescrito: secoes curtas, segmented control, callouts,
  skip-link, foco visivel, terminal sem overflow horizontal agressivo.
- Fidelidade preservada integralmente: comandos derivados/validados,
  providers/features do catalogo, transcripts reais/guiados rotulados, guards
  contra comando inexistente, asset check deterministico.

Limites reafirmados: sem runtime novo, sem promover guiados a reais, sem Ready/
Human Gate/merge/advance-subcheckpoint/readiness, sem novo PR, sem topologia.

Risco residual: screenshots nao puderam ser gerados no sandbox (sem browser; CDN
de browser bloqueado). A revisao visual fica no preview do Cloudflare Pages do PR.

## Separação de perfis: consumidor x contribuidor (2026-06-19)

O site bem visual ainda misturava duas superfícies: o CONSUMIDOR do framework
(`npx ai-guidelines …`) e o CONTRIBUIDOR deste repositório (`npm run flow …`,
governança de desenvolvimento). Onde havia mistura:

- jornadas e referência usavam `npm run flow -- <cmd>` como caminho principal;
- exemplos de terminal guiados despejavam usages internos (PR #43, handoff 0024,
  `decide --type <sub-checkpoint>`);
- glossário/descrições puxavam texto interno do registry (state.yml, sub-checkpoint).

Correção (sem runtime novo; fidelidade preservada):

- Superfície PÚBLICA passa a usar `npx ai-guidelines` em tudo (jornadas,
  referência, cenários). Comandos seguem validados contra o registry (binCommand).
- Identificadores internos genericizados: `0024`→`<spec>`/genérico, `PR #43`→
  "PR de um colega", `pr-43`→`pr-<n>`. Nada de Spec 0024 / CO-10 / sub-checkpoint
  na superfície pública.
- Nova rota SECUNDÁRIA `/contribute` ("Contribuindo com o ai-guidelines"),
  isolada da nav principal (só no rodapé), onde — e só onde — aparece
  `npm run flow` e o fluxo interno de desenvolvimento, marcado "Uso interno".
- Cenários ganham `surface: public | contributor`. Reais públicos: init/adopt/
  update/update --providers (npx, dry-run). Guiados públicos: work/specs/
  peer-review (npx, genéricos, nome validado). Contribuidor: `--help` real +
  fluxo `npm run flow`.
- Glossário e "comandos públicos" reescritos consumer-first (nomes validados +
  hints curados; sem descrição interna do registry).

Gap real da CLI registrado (não maquiado): `ai-guidelines --help` hoje DESTACA o
alias de contribuidor `npm run flow` antes de `npx ai-guidelines`. Por isso o
transcript de `--help` foi colocado na área de contribuidor, com nota explícita.
Melhoria futura sugerida da CLI: o `--help` deve liderar com `npx ai-guidelines
<comando>` para consumidores; `npm run flow` aparece como nota de contribuidor.

Guards adicionados/ajustados: `siteProfiles.test.ts` (público não usa
`npm run flow`; sem identificadores internos; init/adopt/update públicos;
`npm run flow` só na seção de contribuidor; cenários públicos têm
`surface: public` e começam com `npx ai-guidelines`; comando público existe no
registry). Fidelidade preservada (B1/B2/B3/A2 intactos).

Limites reafirmados: sem Ready/Human Gate/merge/advance-subcheckpoint/readiness,
sem decisão mutante de `decide`, sem novo PR, sem topologia.

## Produto público wizard-first (2026-06-19)

A separação consumidor/contribuidor resolveu a superfície errada (`npm run flow`
no público), mas a revisão humana ainda identificou um problema de experiência:
o site fazia parecer que o usuário precisava decorar vários comandos diretos.
Isso contradiz a intenção do produto — o caminho principal deve ser abrir o guia
interativo com `npx ai-guidelines` e escolher como seguir.

Correção aplicada:

- Home, cartões de público e jornadas passam a destacar `npx ai-guidelines`
  como "Caminho principal".
- `init`, `adopt`, `update`, `specs` e `peer-review` continuam aparecendo, mas
  como "Atalho direto" para automação ou para quem já sabe exatamente o que
  quer.
- `/flow` ganhou uma demonstração Clack-like do guia interativo: abrir o guia,
  escolher intenção, selecionar práticas derivadas dos catálogos reais e revisar
  preview antes de confirmar.
- Os transcripts reais de init/adopt/update seguem disponíveis, mas como apoio
  e equivalência do atalho direto — não como protagonista do onboarding.
- Guards atualizados para exigir a narrativa wizard-first: superfície pública
  contém `publicWizardDemo`, `BIN_WIZARD` como comando principal e a referência
  enquadra comandos públicos como atalhos diretos.

Limites reafirmados: sem Ready/Human Gate/merge/advance-subcheckpoint/readiness,
sem decisão mutante de `decide`, sem novo PR, sem topologia.
