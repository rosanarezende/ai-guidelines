# CO-10.7 status - CLI publica autoexplicavel e wizard orientado ao contexto

> Spec 0024 · PR #43 · `checkpoint-co-flow-convergence`.
> Este artefato registra o estado factual de CO-10.7 apos a primeira entrega
> implementada e pushed em `cce1dc4`.
> Ele existe para evitar reavaliar a mesma pergunta a cada passo:
> "a entrega atual cobre a visao proposta para a CLI publica e o site?"

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
