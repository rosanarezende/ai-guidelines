---
artifact-kind: dogfood
---

# CO-10.7 status - CLI publica autoexplicavel e wizard orientado ao contexto

> Spec 0024 · PR #43 · `checkpoint-co-flow-convergence`.
> Este artefato registra o estado factual de CO-10.7 apos a primeira entrega
> implementada e pushed em `cce1dc4`.
> Ele existe para evitar reavaliar a mesma pergunta a cada passo:
> "a entrega atual cobre a visao proposta para a CLI publica e o site?"
> Atualização 2026-06-19: `[DEC-0024-G17]` reabriu CO-10.7 porque esta
> resposta "parcialmente coberto" não podia ter virado fechamento do
> sub-checkpoint. CO-10.8 fica pausado até esta prova terminar.

## 1. Pergunta de controle

A visao proposta para CO-10.7 era:

```text
CLI como fonte da experiencia real
src/cli/copy como texto operacional da CLI
site como documentacao viva da experiencia real
rodada centrada na CLI antes de reorganizar mais o site
```

Resposta curta no estado atual:

```text
parcialmente coberto
CO-10.7 reaberto por DEC-0024-G17
```

A base estrutural correta foi entregue, mas ainda falta falsificar a experiencia
publica em cenarios reais usando `npx ai-guidelines` antes de declarar CO-10.7
como completo.

## 2. O que foi feito

### 2.1 CLI como porta publica

Foi corrigida a orientacao publica para que `npx ai-guidelines` seja o caminho
principal para consumidores.

`npm run flow` permanece como superficie local de contribuicao deste repositorio.

Comandos diretos continuam existindo, mas devem ser entendidos como atalhos para
pessoas experientes, automacao ou documentacao de referencia.

### 2.2 Wizard com leitura de contexto

O wizard passou a explicar, antes da escolha humana, o que foi detectado no
repositorio.

Ele agora cobre linguagem humana para:

- pasta vazia;
- arquivos soltos sem `package.json`;
- repositorio existente sem ai-guidelines;
- repositorio ja governado;
- formatter rival;
- Prettier existente;
- perfil de colaboracao quando ha `review-policy.yml`;
- ausencia de politica de colaboracao;
- nenhuma spec publicada;
- uma spec publicada;
- multiplas specs publicadas;
- branch associada a uma spec;
- branch sem spec clara;
- working tree limpa ou suja;
- PR Draft ou Ready;
- CI verde, pendente ou falha;
- findings abertos ou fechados;
- resolutions/dispositions registradas;
- reviews que exigem atencao;
- readiness disponivel;
- finish de sub-checkpoint disponivel;
- advance bloqueado;
- modo offline/degradado;
- review de PR de colega como fluxo separado;
- update de providers, praticas e colaboracao sem recriar comando `providers`.

### 2.3 Textos operacionais em `src/cli/copy`

Os textos novos foram colocados como copy operacional da CLI, nao como texto
comercial do site.

Entraram em:

- `src/cli/copy/locales/pt-BR/wizard.json`;
- `src/cli/copy/locales/pt-BR/provisioning.json`.

Eles cobrem labels, mensagens de contexto, bloqueios e avisos de autoridade.

### 2.4 Site sincronizado por projecao

A mudanca de copy operacional foi projetada para o site gerado em:

- `site/src/generated/flow-copy.generated.ts`.

Isso preserva a regra de que fatos operacionais usados pelo site devem vir da
CLI/catalago, nao de texto solto duplicado.

### 2.5 Testes adicionados

Foram adicionadas regressoes em:

- `src/cli/flowWizard.test.ts`.

Os testes cobrem:

- resumo inicial de repo governado;
- politica de colaboracao `team`;
- multiplas specs;
- PR Draft e CI verde;
- readiness e Human Gate explicados como protegidos;
- review de PR de colega como fluxo separado;
- update de providers/praticas/colaboracao;
- pasta vazia;
- arquivos soltos;
- repo existente sem governanca;
- conflito com Biome;
- findings abertos;
- indice de specs ausente;
- tree suja;
- CI pendente;
- CI falha;
- PR Ready;
- modo offline/degradado.

## 3. O que esta coberto da visao proposta

### 3.1 `npx ai-guidelines` como caminho principal

Coberto parcialmente.

O help publico ja foi corrigido para priorizar `npx ai-guidelines`.
O site publico tambem foi separado de `npm run flow`.

Ainda falta provar a experiencia completa rodando `npx ai-guidelines` em
cenarios reais, especialmente via pacote instalado ou fixture de consumidor.

Foi criada nesta rodada a base do `Consumer Journey Harness` em tres niveis:

| Nivel | Script                               | Papel                                                                            |
| ----- | ------------------------------------ | -------------------------------------------------------------------------------- |
| 1     | `npm run consumer:journey:pack`      | obrigatorio; executa `npm pack` e consumidores temporarios reais via smoke tests |
| 2     | `npm run consumer:journey:yalc`      | opcional; prepara o loop local rapido com `yalc` sem publicar no npm             |
| 3     | `npm run consumer:journey:verdaccio` | opcional; prepara a simulacao por registry local com Verdaccio antes do npm real |

O nivel 1 passa a ser a prova minima de pacote instalado. Os niveis 2 e 3 ficam
modelados como trilhas verificaveis, mas nao obrigam yalc/Verdaccio no validate
normal do repositorio.

### 3.2 Comandos diretos como atalhos

Coberto conceitualmente.

O site e a CLI ja caminham nessa direcao, mas ainda falta validar se a pessoa
consegue seguir pelo wizard sem decorar comandos em todos os cenarios principais.

### 3.3 Wizard detecta contexto

Coberto em snapshot/teste para muitos estados.

Ainda nao esta totalmente provado como fluxo interativo completo em cenarios reais.

### 3.4 `src/cli/copy` como texto operacional

Coberto para os textos novos de CO-10.7.

Ainda pode haver textos antigos hard-coded em outras partes da CLI que devem ser
inventariados em rodada futura se aparecerem no uso real.

### 3.5 Site como documentacao viva

Coberto parcialmente.

O site ja consome projecoes e cenarios gerados, mas ainda nao deve ser tratado
como concluido enquanto a CLI real nao for falsificada nos cenarios de usuario.

## 4. O que ainda falta fazer

### 4.1 Rodada real de `npx ai-guidelines`

Executar e mapear a CLI publica nos cenarios abaixo:

| Cenario                            | Resultado esperado                                          |
| ---------------------------------- | ----------------------------------------------------------- |
| pasta vazia                        | wizard sugere iniciar sem exigir conhecer `init`            |
| repo com `package.json`            | wizard sugere adotar preservando conteudo                   |
| repo com formatter rival           | wizard explica conflito e caminho seguro                    |
| repo governado solo                | wizard orienta uso diario sem comandos decorados            |
| repo governado com multiplas specs | wizard exige escolha explicita de foco                      |
| repo em time                       | wizard explica autoridade, reviews e politica               |
| review de PR de colega             | wizard orienta troca de branch/contexto sem perder trabalho |

Esses cenarios devem ser priorizados em cima do nivel 1 do harness. Quando a
rodada precisar de iteracao rapida em um repo externo local, usar nivel 2. Antes
de tratar a experiencia como candidata a release, usar nivel 3.

### 4.2 Comparar experiencia atual com experiencia desejada

Para cada cenario, registrar:

```text
estado inicial
comando executado
saida observada
opcoes oferecidas
opcoes indevidas
linguagem confusa
gap de produto
teste esperado
impacto no site
```

### 4.3 Corrigir a CLI antes do site

Se a CLI exigir que a pessoa decore comandos, a correcao deve acontecer primeiro
na CLI/wizard.

So depois o site deve capturar essa experiencia como print, transcript ou demo.

### 4.4 Provar relevancia das opcoes

Ainda falta provar que o wizard nao oferece caminhos indevidos, por exemplo:

- `init` em repo ja governado;
- `adopt` em repo ja governado;
- update de politica global sem aviso de autoridade;
- Human Gate antes de Ready/criterios;
- advance quando readiness, findings, CI ou branch bloqueiam;
- decisao em modo offline/degradado como se estivesse tudo fresco.

### 4.5 Site como reproducao da CLI real

Depois da falsificacao da CLI, o site deve ser atualizado para mostrar:

- fluxo real de projeto novo;
- fluxo real de repositorio existente;
- fluxo real de repositorio ja governado;
- fluxo real de trabalho diario;
- fluxo real de time/multiplas specs;
- fluxo real de review de PR de colega.

O site pode ter narrativa propria, mas os passos e telas operacionais precisam
existir na CLI.

## 5. Riscos residuais

### Risco 1 - wizard ainda explicar mais do que conduzir

O resumo contextual melhorou, mas ainda e necessario provar que as proximas telas
do wizard conduzem a pessoa sem exigir conhecimento previo dos comandos.

### Risco 2 - cenarios testados por snapshot nao equivalerem ao uso real

Os testes atuais cobrem estados simulados/fakes. Isso e util para regressao, mas
nao substitui rodar a CLI publica em diretorios reais de consumidor. O novo
`consumer:journey:pack` reduz esse risco para o pacote instalado, mas ainda falta
ampliar os cenarios de uso diario dentro desse harness.

### Risco 3 - site voltar a compensar lacuna do produto

Se o site continuar mais claro que a CLI, o produto segue invertido:

```text
documentacao explica
produto exige memoria
```

CO-10.7 deve evitar isso.

### Risco 4 - colaboracao/time ainda pouco falsificada

O wizard ja sabe mostrar perfil e autoridade quando ha politica, mas ainda falta
provar fluxo completo de repo em time e review de PR de colega.

## 6. Estado final esperado de CO-10.7

CO-10.7 so deve ser considerado pronto quando for possivel dizer:

```text
uma pessoa roda npx ai-guidelines
o sistema entende o contexto do repo
o sistema oferece os caminhos relevantes
o sistema explica bloqueios em linguagem humana
o sistema exige autoridade para decisoes sensiveis
a pessoa nao precisa decorar comandos para seguir
o site reproduz essa experiencia real
```

## 7. Validacao ja executada na entrega parcial

Na entrega `cce1dc4`, foram executados com sucesso:

- `git diff --check`;
- `npm run format`;
- `npm run build`;
- `npm run test:ts` (`2176` testes);
- `npm run validate`;
- `npm run flow`;
- `npm run flow -- work --authorization explicit-work-request`;
- checks remotos do PR #43.

## 8. Fronteira

Este artefato nao executa:

- readiness;
- advance-subcheckpoint;
- Ready;
- Human Gate;
- merge;
- abertura de novo PR;
- implementacao de CO-10.8.

Ele apenas registra o estado atual de CO-10.7 para orientar a proxima rodada.

## 9. Correcao de lifecycle - DEC-0024-G17

CO-10.7 foi reaberto porque o fechamento anterior confundiu base estrutural com
criterio de saida completo.

O criterio de saida agora fica operacionalmente explicito:

```text
consumer-empty/
consumer-existing-package/
consumer-existing-formatter-conflict/
consumer-governed-solo/
consumer-governed-team/
consumer-governed-multiple-specs/
consumer-peer-review/
```

Para cada cenario, o harness deve:

- instalar o pacote empacotado ou executar equivalente controlado;
- rodar `npx ai-guidelines`;
- capturar saida/opcoes do wizard;
- provar que `init`, `adopt` e `update` aparecem apenas quando fazem sentido;
- verificar `--dry-run`;
- verificar arquivos finais quando a aplicacao for permitida;
- verificar bloqueios e mensagens em linguagem humana;
- alimentar site/documentacao com a experiencia real, sem prints inventados.

O seed de CO-10.8 em `2d478b2` permanece preservado, mas nao e o trabalho ativo
ate CO-10.7 fechar corretamente.

## 10. Debito registrado - organizacao da pasta `research/`

Durante a retomada de CO-10.7, foi identificado um debito de governanca na forma
como a pasta `research/` esta sendo usada.

Fato observado:

```text
research/
→ pesquisa exploratoria
→ dogfood
→ status de checkpoint
→ inventario arquitetural
→ candidatos de gaps/features
→ matrizes de falsificacao
→ registros que talvez pertençam a plan.md/tasks.md/decision-brief
```

Problema:

```text
a pasta esta virando um deposito misto
→ fica dificil saber o que e evidencia, plano, status, decisao ou backlog
→ Rosana precisa reler muitos arquivos para reconstruir o estado
→ agentes podem usar um artefato errado como contrato da sessao
```

Impacto para CO-10.7:

- o harness de consumidores ainda deve ser concluido antes de qualquer
  reorganizacao ampla;
- este debito nao deve bloquear a implementacao da falsificacao publica da CLI;
- mas o fechamento de CO-10.7 deve revisitar a organizacao dos artefatos gerados
  neste checkpoint antes de recomendar readiness.

Tratamento esperado no fim do checkpoint atual:

1. separar o que e pesquisa exploratoria, dogfood, status, matriz de teste e
   backlog;
2. decidir o que deve permanecer em `research/`;
3. decidir o que deve ser promovido para `plan.md`, `tasks.md`,
   `decision-brief.md` ou outro artefato governado mais adequado;
4. registrar regra simples para evitar que proximos checkpoints continuem
   inflando `research/` com papeis diferentes;
5. se a reorganizacao for maior que ajuste documental local, abrir candidato
   explicito para CO-10.8 ou sub-checkpoint proprio.

Falsificacao:

```text
se uma nova sessao precisa ler varios arquivos em research/ para descobrir
qual e o contrato ativo, o debito ainda nao foi resolvido.
```

## 11. Rodada de implementacao - harness de consumidores reais

Rodada executada nesta sessao:

```text
npm run build
node --experimental-default-config-file --test tests/consumer-journey/*.test.mjs
npm run consumer:journey:pack
```

Resultado:

```text
7/7 cenarios de consumer journey passaram
12/12 testes de pacote instalado passaram no script consumer:journey:pack
```

Cenarios cobertos:

- `consumer-empty`: pasta vazia recebe orientacao principal para `init`;
- `consumer-existing-package`: repo Node existente recebe orientacao principal para
  `adopt`;
- `consumer-existing-formatter-conflict`: repo com Biome detecta formatter rival
  e orienta `--force-prettier` como decisao explicita;
- `consumer-governed-solo`: repo governado com perfil solo recebe orientacao para
  `update`;
- `consumer-governed-team`: repo governado com perfil team recebe orientacao para
  `update` e explicita o perfil detectado;
- `consumer-governed-multiple-specs`: repo com multiplas specs nao cai mais em
  erro irrecuperavel; orienta escolha de foco via `specs`/`handoff`;
- `consumer-peer-review`: comando publico de review entre pares falha de forma
  orientada quando falta o numero do PR, sem sugerir Human Gate ou merge.

Bug real revelado:

```text
repo governado com multiplas specs
→ `npx ai-guidelines` caia em "cockpit — estado irrecuperável"
→ causa: cockpit tentava resolver foco automaticamente e vazava erro tecnico
```

Correcao aplicada:

```text
quando o cockpit nao consegue resolver a spec por falta de foco claro
→ a entrada publica captura essa falha
→ renderiza uma orientacao de foco com specs ativas conhecidas
→ sugere `npx ai-guidelines specs`
→ sugere `npx ai-guidelines handoff <id-da-spec>`
→ nao executa decisao, readiness, Ready, Human Gate ou merge
```

Garantias do harness:

- instala o pacote empacotado em ambiente temporario;
- roda a CLI publica instalada (`npx ai-guidelines`/bin instalado);
- captura stdout/stderr e exit code;
- valida `--dry-run`;
- aplica `init`/`adopt` quando seguro;
- verifica arquivos finais esperados;
- compara preservacao real de arquivo existente antes/depois;
- garante que o texto "cockpit — estado irrecuperavel" nao apareca para o
  humano nos cenarios cobertos.

Limite ainda existente:

```text
os cenarios de uso diario governado ainda precisam ser refletidos no site como
prints/transcripts reais da CLI publica antes de declarar CO-10.7 pronto.
```

## 12. Rodada de implementacao - site refletindo a entrada publica real

Rodada executada depois da criacao do harness:

```text
npm run site:scenarios:sync
npm run site:scenarios:check
npm run site:build
npm run test:ts -- --runTestsByPath src/cli/siteScenarios.test.ts src/cli/copy/siteRoutes.test.ts src/cli/copy/siteProfiles.test.ts
```

Mudanca principal:

```text
site antes
→ mostrava muitos atalhos diretos como init/adopt/update

site agora
→ usa cenarios gerados a partir do runtime real
→ roda a entrada publica `npx ai-guidelines` nos fixtures de consumidor
→ mostra que a pessoa pode comecar pelo guia sem decorar comandos
```

Cenarios reais agora projetados para o site:

- `consumer-empty-entry`: pasta vazia com `npx ai-guidelines`;
- `consumer-existing-entry`: repo existente com `npx ai-guidelines`;
- `consumer-formatter-conflict-entry`: repo existente com formatter rival;
- `consumer-governed-solo-entry`: repo governado solo;
- `consumer-governed-team-entry`: repo governado em time;
- `consumer-multiple-specs-entry`: repo governado com multiplas specs.

O site passou a usar esses cenarios nas jornadas principais:

- projeto novo;
- repositorio existente;
- uso diario em repo governado;
- trabalho com multiplas frentes/specs.

Tambem foi ajustado o guard de comandos publicos para aceitar explicitamente o
caso raiz:

```text
npx ai-guidelines
```

Esse caso nao e um "comando ausente"; ele e a porta publica principal. Comandos
diretos continuam existindo como atalhos e referencia, mas o site nao deve
fazer a pessoa decorar esses atalhos para entender o produto.

Falsificacoes adicionadas/ajustadas:

- se o site apontar para um scenario inexistente, `siteRoutes.test` falha;
- se scenario publico nao iniciar com `npx ai-guidelines`, `siteProfiles.test`
  falha;
- se comando publico com verbo nao existir no registry real, `siteProfiles.test`
  falha;
- se os transcripts gerados ficarem stale, `site:scenarios:check` falha;
- se a entrada publica voltar a nao cobrir pasta vazia, repo existente, repo
  governado ou multiplas specs, `siteScenarios.test` falha.

Limite residual:

```text
o site agora reflete a entrada publica real para os cenarios principais,
mas ainda falta revisar visualmente no preview e decidir se os exemplos guiados
de work/specs/peer-review devem virar transcripts reais com fixtures completos
antes de readiness.
```

## 13. Rodada de implementacao - `/flow` orientado por situacao humana

Dogfood da rodada atual:

```text
problema observado
→ a pagina ja usava transcripts reais
→ mas ainda parecia pedir que a pessoa decorasse muitos comandos
→ exemplos diretos competiam com o guia publico
```

Decisao aplicada:

```text
o site publico deve comecar pela pergunta "em que situacao esta o repo?"
e nao por uma lista de comandos
```

Mudancas implementadas:

- a pagina `/flow` passou a renderizar um explorador de situacoes;
- o caminho principal em todas as situacoes e `npx ai-guidelines`;
- cada situacao mostra:
  - o que a CLI percebe;
  - o que ela oferece;
  - como evita erro;
  - o transcript gerado correspondente;
  - o passo a passo detalhado quando a pessoa quiser aprofundar;
- comandos diretos ficam recolhidos como "atalho para automacao";
- o fluxo de review de colega continua visivel como "em validacao" enquanto
  nao houver transcript real completo por fixture;
- os guards foram atualizados para impedir regressao para uma pagina publica
  centrada em comandos soltos.

Situacoes cobertas pela entrada da pagina:

| Situacao        | Cenario do site                 | Estado da prova                             |
| --------------- | ------------------------------- | ------------------------------------------- |
| projeto novo    | `consumer-empty-entry`          | transcript gerado da CLI publica            |
| repo existente  | `consumer-existing-entry`       | transcript gerado da CLI publica            |
| repo governado  | `consumer-governed-solo-entry`  | transcript gerado da CLI publica            |
| multiplas specs | `consumer-multiple-specs-entry` | transcript gerado da CLI publica            |
| review colega   | `peer-review`                   | exemplo guiado, explicitamente em validacao |

Falsificacao adicionada/ajustada:

- `siteProfiles.test` exige que a superficie publica apresente o guia como
  caminho principal;
- `siteProfiles.test` exige que o atalho direto fique tratado como automacao,
  nao como caminho obrigatorio;
- `siteRoutes.test` exige que `/flow` renderize o explorador de situacoes e
  continue apontando para paineis de scenario com procedencia visivel.

Limite residual:

```text
esta rodada melhora a entrada publica e a legibilidade;
a decisao de readiness ainda depende da revisao visual de Rosana no preview
e da decisao sobre transformar peer-review/work/specs guiados em transcripts
reais completos.
```

## 14. Rodada de implementacao - site reconstruido como simulador interativo da CLI

### 14.1 Por que a versao anterior ainda nao satisfazia

A versao anterior melhorou tecnicamente (ja consumia cenarios gerados do runtime
real), mas ainda parecia documentacao montada sobre partes antigas: home de
marketing + paginas estaticas de jornada (`/flow/start|daily|team|review|reference`)
que pediam que a pessoa entendesse comandos antes de sentir o produto. O site
continuava mais claro que a CLI em alguns pontos - o risco 3 deste artefato.

### 14.2 Novo modelo - site como simulador da CLI

O site foi reconstruido (rebuild limpo) em torno de um **simulador interativo**:

```text
home = simulador (porta do produto)
→ ScenarioChooser: "Escolha um cenario para simular"
→ CliSimulator: comeca por `npx ai-guidelines`, avanca passos
→ GovernanceExplainer: "por que isso apareceu"
→ EffectPreview: o que seria escrito/bloqueado/validado/decidido
→ modo iniciante x ver detalhes tecnicos; mobile-first; a11y real
```

Arquitetura nova (catalogo autoral legivel, separado dos transcripts gerados):

```text
site/src/content/scenarios/{types,catalog,resolve}.ts
site/src/features/{cli-simulator,scenario-catalog,scenario-player,effect-preview,governance-explainer}/
```

Paginas estaticas de jornada/marketing foram removidas; `/flow/*` e aliases PT
resolvem para o simulador (sem soft-404). Atalhos diretos (init/adopt/update/work/
specs/peer-review) ficam como `<details>` recolhido ("Atalho para automacao"), nunca
como caminho principal. `npm run flow` segue so na area de contribuidor.

### 14.3 Correcao de premissa (SSOT) aplicada

O arquivo gerado `site/src/generated/flow-scenarios.generated.ts` e tratado como
PROJECAO do runtime, **nao** como fonte de verdade. Um cenario so e `real` quando
TODA saida de passo e `transcript:<id>` (sem texto autoral); a saida `transcript`
nao duplica `lines` no catalogo (o renderer resolve do gerado). `lines` so existe
em `simulado`/`gap`. O guard `src/cli/copy/scenarioCatalog.test.ts` falha se um
cenario `real` virar string manual, se duplicar transcript, ou se houver passo
autoral marcado como real.

### 14.4 Classificacao conservadora dos 12 cenarios

```text
real (so captura, sem passo autoral): empty-project, existing-repo,
  formatter-conflict, governed-solo   → 1-4
simulado (mistura base real + modelo alvo autoral): governed-team, five-specs,
  resume-handoff, readiness, pr-ready-human-gate, peer-review, offline-degraded
gap (comportamento publico ainda ausente): review-finding
```

Mesmo nos cenarios `real`, o prompt-a-prompt interativo do @clack NAO e capturado
hoje; por isso o real e renderizado como navegacao entre capturas (guia -> dry-run
-> efeitos), e qualquer choreography de prompt seria `simulado` explicito, fora do
conjunto real.

### 14.5 Gaps descobertos (registrados aqui)

```text
- painel unificado por spec (branch/PR/estado/proxima acao numa tela) — five-specs
- fluxo publico guiado finding -> disposition -> resolution — review-finding
- distincao update x mudanca-de-politica + alerta de autoridade — governed-team
- captura controlada de handoff + persistencia de handoff — resume-handoff
- captura controlada de --no-remote/degradado — offline-degraded
- captura controlada de peer-review (depende de gh) — peer-review
- captura controlada de decide mark-readiness/human-gate (brief-only) — readiness,
  pr-ready-human-gate
constraint (nao-gap): providers/practices/collaboration seguem como selecao de
`update --providers`, nunca comando.
```

### 14.6 Testes adicionados/ajustados

```text
+ src/cli/copy/scenarioCatalog.test.ts (novo) — 12 cenarios obrigatorios, procedencia
  por saida, SSOT (sem duplicacao, real=so transcript), providers nao-comando,
  atalho secundario, invariantes por cenario (5-specs/conflito/offline/peer/gate)
~ src/cli/copy/siteProfiles.test.ts — reescrito para o simulador (home npx-first,
  publico x contribuidor, npm run flow so no contribuidor)
~ src/cli/copy/siteRoutes.test.ts — reescrito (rotas/404 explicito/titulos,
  procedencia visivel, layout mobile-first)
= siteCommandSurface.test / siteCapabilities.test / siteScenarios.test seguem verdes
```

### 14.7 O que ainda impede readiness de CO-10.7

```text
- revisao visual de Rosana no preview do simulador;
- transformar simulados/gaps prioritarios em comportamento real da CLI + captura
  controlada (handoff e offline sao os candidatos mais proximos de virar `real`);
- o debito da pasta research/ (secao 10) continua aberto.
```

### 14.8 Fronteira (reafirmada)

Esta rodada **nao** executa readiness, Ready, Human Gate, advance-subcheckpoint,
mark-readiness, merge nem abertura de novo PR. E implementacao de site + documentacao,
nao decisao de flow. Vale a mesma fronteira da secao 8.

## 15. Rodada de implementacao - home institucional + simulador projetado da CLI

### 15.1 Por que mudou de novo (feedback da owner)

A versao da secao 14 entregou cenarios em CARDS — a pessoa via cartoes que nunca
apareceriam numa CLI real. A owner pediu duas correcoes:

```text
1. a home nao deveria ser o simulador: ela explica o PRODUTO (governanca humano+IA;
   a LLM roda a CLI por baixo dos panos). O simulador foi para /cli.
2. a experiencia precisa ser como a do clack (terminal de verdade, navegacao por
   teclado), com textos vindos do codigo real e SO as saidas mockadas.
```

### 15.2 Keystone - projecao gerada da maquina de prompts (SSOT)

Decisao da owner: "projecao gerada da sequencia" (maxima fidelidade ao SSOT).

```text
- src/cli/sitePromptFlows.ts: um RecordingPrompts (porta Prompts) dirige o wizard
  REAL (command.prompt), que e prompting puro (nao toca filesystem), e registra cada
  mensagem/opcao/ramificacao reais. Para antes de run().
- saida: site/src/generated/flow-prompts.generated.ts (4 contextos: vazio, existente,
  conflito, governado). Deteccao real (inclui rival Biome). O resultado liga ao
  transcript de dry-run REAL ja capturado (transcriptId).
- npm run site:prompts:sync/:check + guard sitePromptFlows.test.ts: toda pergunta tem
  de existir na copy real; falha se virar texto autoral; sem drift.
- registrado em script-contracts.yml + cadeia site:build.
```

### 15.3 Site reconstruido

```text
- home (/) institucional: explica o produto, sem montar o terminal; CTA -> /cli.
- /cli: CliTerminal reproduz o clack (gutter, radios, checkboxes, scrollback, teclado
  + clique), dirigido pela projecao. Saida = transcript real de dry-run. Modo
  declarado: "Simulacao fiel gerada do runtime".
- rotas: add /cli; /flow e /flow/* -> /cli; /atalhos, /contribute, 404 preservados.
- guards atualizados (siteProfiles, SitePackaging) + novo simulatorFidelity.test.ts.
```

### 15.4 Investigacao do clack + decisao WebContainer (hibrido)

O time do clack NAO simula: roda a CLI real no browser via `@webcontainer/api` (Node
real) + `@xterm/xterm`, com `auth.init({clientId})` e COEP `require-corp`. Decisao da
owner: HIBRIDO.

```text
- padrao = simulacao projetada (mobile-first, offline, drift-check) — nao exige
  StackBlitz nem headers;
- enhancement opcional (desktop) = "Rodar de verdade no navegador" via WebContainer;
- se WebContainer falhar/mobile/offline/sem headers/sem clientId -> fallback para o
  simulador projetado;
- modo ativo sempre declarado.
```

### 15.5 Gap registrado - WebContainer como integracao progressiva

```text
WebContainer exige:
- um clientId do StackBlitz (a owner tem conta; vai gerar e registrar origens);
- headers COEP/COOP (cross-origin isolation) no Cloudflare Pages;
- nao funciona em mobile; precisa de rede + boot/instalacao.
Enquanto clientId/headers nao existirem, "Rodar de verdade" fica como CTA documentado,
e o simulador projetado e a experiencia principal. E GAP de integracao, nao bloqueio.
```

### 15.6 Outros gaps/limitacoes

```text
- so 4 contextos no primeiro corte; promover handoff/offline/peer-review a real exige
  captura controlada (secao 14.5 segue valida);
- componentes de cards antigos (ScenarioChooser/CliSimulator/ScenarioPlayer/catalog)
  permanecem no repo mas fora do app; limpeza pendente como fatia propria;
- polimento visual deliberadamente minimo (primeiro corte funcional).
```

### 15.7 O que ainda impede readiness de CO-10.7

```text
- revisao visual da owner no preview do /cli;
- wiring do WebContainer (depende do clientId/headers da owner);
- promover simulados/gaps prioritarios a comportamento real + captura;
- limpeza dos componentes de cards antigos;
- debito da pasta research/ (secao 10) segue aberto.
```

### 15.8 Fronteira (reafirmada)

Esta rodada **nao** executa readiness, Ready, Human Gate, advance-subcheckpoint,
mark-readiness, merge nem abertura de novo PR. E implementacao de site + documentacao,
nao decisao de flow. Vale a mesma fronteira da secao 8.
