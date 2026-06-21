# CO-10.8 — Inventário de arquitetura interna, organização DDD e BDD visual

> Spec: 0024-context-architecture  
> Nó: `co-flow-convergence`  
> Sub-checkpoint planejado: `CO-10.8 — arquitetura interna, organização DDD e BDD visual para mantenedores`  
> Decisão: `[DEC-0024-G16]`  
> Data: 2026-06-19  
> Status: seed antecipado pausado por `[DEC-0024-G17]`; CO-10.8 volta a ficar pendente até CO-10.7 fechar corretamente.

> Nota de lifecycle: o commit `2d478b2` já produziu inventário, split inicial do
> wizard e catálogo BDD mínimo. Esse trabalho fica preservado como seed, mas não
> autoriza continuar a reorganização interna enquanto a CLI pública de CO-10.7
> não for falsificada em consumidores reais/simulados e refletida no site.

## Por que este sub-checkpoint existe

O dogfood do site mostrou um aprendizado importante: organização de arquivos também é experiência humana. Quando o React ficou dividido por páginas, componentes, conteúdo e artefatos gerados, ficou mais fácil revisar texto, fluxo e gaps. O runtime ainda não passou pela mesma disciplina.

A intenção original de `src/` era DDD/hexagonal:

```text
src/cli             delivery, composition, registry, comandos, parsing, prompts, renderers
src/app             casos de uso, ports e orquestração de aplicação
src/domain          modelo e políticas puras, sem IO
src/infrastructure  adapters concretos: fs, git, github, yaml, processos, package managers
```

Essa fronteira existe, mas a implementação gradual deixou pontos grandes demais para humanos manterem sem contexto externo. O objetivo do CO-10.8 é corrigir essa organização sem mudar comportamento.

## Fatos observados na árvore atual

Leitura feita em 2026-06-19 no HEAD `b962340`, branch `feat/spec-0024-co-flow-convergence`, tree limpa e local igual ao remoto.

Distribuição por área:

| Área                 | Arquivos | Tamanho observado |
| -------------------- | -------: | ----------------: |
| `src/cli`            |      189 |          ~1.93 MB |
| `src/app`            |      104 |          ~0.44 MB |
| `src/domain`         |      108 |          ~0.43 MB |
| `src/infrastructure` |       64 |          ~0.42 MB |
| `src/test-utils`     |        9 |          ~0.03 MB |

Maiores concentrações observadas:

| Arquivo                                        | Tamanho | Leitura arquitetural                                         |
| ---------------------------------------------- | ------: | ------------------------------------------------------------ |
| `src/cli/workflow.test.ts`                     |   81 KB | teste amplo demais para um único ponto de entrada            |
| `src/cli/flowWizard.ts`                        |   61 KB | wizard, contexto, menus, ações e textos muito próximos       |
| `src/cli/workflow.ts`                          |   56 KB | fluxo governado com múltiplas responsabilidades históricas   |
| `src/cli/flowWizard.test.ts`                   |   54 KB | cobertura extensa, mas pouco navegável por intenção humana   |
| `src/cli/workBrief.ts`                         |   52 KB | briefing, renderização e derivação ainda próximos            |
| `src/app/use-cases/ProvisionWorkspace.test.ts` |   49 KB | teste de use case cobrindo muitos efeitos no mesmo arquivo   |
| `src/cli/handoff.ts`                           |   44 KB | coleta, renderização e contrato de retomada concentrados     |
| `src/cli/reviewBrief.ts`                       |   39 KB | lane de review ainda muito acoplada à apresentação CLI       |
| `src/cli/flow/GovernedFlow.ts`                 |   38 KB | coração do modelo comum; precisa ficar legível e protegido   |
| `src/cli/handoffFacts.ts`                      |   34 KB | snapshot situado e fatos operacionais misturados ao delivery |

Subpastas existentes em `src/cli`:

| Área                     | Arquivos | Tamanho observado | Observação                                                    |
| ------------------------ | -------: | ----------------: | ------------------------------------------------------------- |
| `src/cli/decide`         |       22 |           ~266 KB | decisões já agrupadas, mas ainda delivery/app misturados      |
| `src/cli/registry`       |       44 |           ~141 KB | registry/catálogos/capabilities; tende a ser SSOT operacional |
| `src/cli/flow`           |        5 |            ~86 KB | modelo comum existe, mas ainda pequeno diante de consumidores |
| `src/cli/delivery`       |        8 |            ~68 KB | delivery bootstrap existe, mas outros comandos seguem soltos  |
| `src/cli/copy`           |       13 |            ~61 KB | texto operacional da CLI já separado parcialmente             |
| `src/cli/visual-prompts` |        6 |            ~25 KB | adapter visual separado, bom precedente                       |

Contraste positivo no site:

```text
site/src/app
site/src/pages
site/src/features
site/src/shared
site/src/content
site/src/generated
site/src/assets
```

Essa organização ainda não é perfeita, mas já demonstra que separar páginas, componentes compartilhados, conteúdo e gerados reduziu o custo humano de revisão.

## Problema central

O problema não é só tamanho de arquivo. O problema é que a pessoa mantenedora precisa saber "onde procurar" antes de conseguir revisar:

- próxima ação e estado governado;
- wizard e linguagem humana;
- handoff/work/decide;
- readiness, Human Gate, Ready e avanço;
- reviews/findings/resolutions/dispositions;
- PR/GitHub/CI/branch/tree;
- provisioning init/adopt/update;
- site projection/transcripts;
- testes de jornada/BDD.

Hoje essas responsabilidades aparecem em módulos que cresceram por migração incremental. O resultado é parecido com o antigo `site/src/App.tsx`: funciona, mas não comunica a arquitetura.

## Princípios do CO-10.8

1. **Behavior-preserving:** mover, dividir e renomear sem alterar comportamento da CLI, outputs governados ou regras de negócio.
2. **Sem segunda SSOT:** a reorganização não cria outro modelo de fluxo.
3. **DDD explícito:** domínio decide, app orquestra, infraestrutura aplica IO, CLI entrega experiência.
4. **Feature-oriented onde ajuda humanos:** dentro de cada camada, agrupar por fluxo humano real, não por histórico de arquivo.
5. **Testes acompanham a responsabilidade:** teste amplo deve virar suite navegável por jornada/feature.
6. **BDD para mantenedores:** cenários importantes devem poder virar uma página navegável para Rosana e revisores entenderem o fluxo sem ler todo o código.
7. **Sem conteúdo novo de produto:** este sub-checkpoint não reescreve copy pública, site ou UX, salvo ajustes mínimos exigidos pela movimentação estrutural.

## Árvore-alvo proposta

Esta é uma árvore-alvo inicial, não um contrato fechado de nomes. O objetivo é tornar explícita a direção antes da migração.

```text
src/
  cli/
    main.ts
    bin.ts
    composition/
      runtime.ts
      adapters.ts
      commandContext.ts
    registry/
      commandRegistry.ts
      commandDescriptions.ts
      intentCatalog.ts
      capabilityGuards.ts
    commands/
      provisioning/
        initCommand.ts
        adoptCommand.ts
        updateCommand.ts
      flow/
        handoffCommand.ts
        workCommand.ts
        decideCommand.ts
        cockpitCommand.ts
      review/
        reviewCommand.ts
        reviewCheckCommand.ts
        peerReviewCommand.ts
      validation/
        changedValidationCommand.ts
        prReadyCommand.ts
      site/
        siteFlowCopyCommand.ts
        siteScenariosCommand.ts
      consumer/
        consumerJourneyCommand.ts
    experience/
      wizard/
        FlowWizard.ts
        menus/
        flows/
        provisioning/
        decisions/
        validation/
      cockpit/
        renderCockpit.ts
        renderHumanSummary.ts
      prompts/
        Prompts.ts
        ClackPrompts.ts
      renderers/
        markdown.ts
        terminal.ts
      copy/
        flow.pt-BR.json
        provisioning.pt-BR.json
        decisions.pt-BR.json

  app/
    flow/
      use-cases/
        GetGovernedFlowSnapshot.ts
        DetermineNextAction.ts
        MarkReadiness.ts
        FinishSubcheckpoint.ts
      ports/
        GitStateReader.ts
        PullRequestReader.ts
        ReviewArtifactReader.ts
      policies/
        FlowActionPolicy.ts
        AuthorityPolicy.ts
    reviews/
      use-cases/
      ports/
      policies/
    provisioning/
      use-cases/
      ports/
    site-projection/
      use-cases/
      ports/
    consumer-journey/
      use-cases/
      ports/

  domain/
    flow/
      model/
        GovernedFlowSnapshot.ts
        FlowAction.ts
        FlowState.ts
      policies/
        NextActionPolicy.ts
        ReadinessPolicy.ts
        GatePolicy.ts
    reviews/
      model/
      policies/
    provisioning/
      model/
      policies/
    knowledge/
      model/
      policies/

  infrastructure/
    filesystem/
    git/
    github/
    package-manager/
    process/
    yaml/
    site/
    consumer/

  testing/
    flow-scenarios/
      fixtures/
      fakes/
      assertions/
    bdd/
      scenarioCatalog.ts
      scenarioMetadata.ts
```

## Mapeamento inicial de responsabilidades

| Hoje                                           | Alvo provável                                                            | Motivo                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `src/cli/flowWizard.ts`                        | `src/cli/experience/wizard/**`                                           | separar menus, fluxos, validações visuais e execução delegada |
| `src/cli/flowWizard.test.ts`                   | `src/cli/experience/wizard/**/__tests__` ou `src/testing/flow-scenarios` | teste por intenção humana, não por arquivo gigante            |
| `src/cli/workflow.ts`                          | `src/app/flow`, `src/domain/flow`, `src/cli/commands/flow`               | separar política, use case e comando                          |
| `src/cli/workflow.test.ts`                     | suites por jornada em `src/testing/flow-scenarios`                       | facilitar leitura BDD e falsificação                          |
| `src/cli/workBrief.ts`                         | `src/cli/experience/cockpit`, `src/app/flow/use-cases`                   | briefing é projeção; derivação deve vir do modelo             |
| `src/cli/handoff.ts`                           | `src/cli/commands/flow`, `src/app/flow/use-cases`                        | comando entrega; app coleta/deriva                            |
| `src/cli/handoffFacts.ts`                      | `src/app/flow/use-cases`, `src/infrastructure/*`                         | snapshot situado não deve morar como arquivo solto de CLI     |
| `src/cli/reviewBrief.ts`                       | `src/cli/commands/review`, `src/app/reviews`                             | review é bounded context próprio                              |
| `src/cli/reviewCheck.ts`                       | `src/app/reviews`, `src/cli/commands/review`                             | check deve consumir policy comum                              |
| `src/cli/decide/**`                            | manter agrupado, mas separar command/app/domain                          | decisão humana é fluxo próprio, não só subpasta CLI           |
| `src/cli/siteFlowCopy.ts` / `siteScenarios.ts` | `src/app/site-projection`, `src/cli/commands/site`                       | site projection é use case; comando só dispara                |
| `src/cli/consumerJourney.ts`                   | `src/app/consumer-journey`, `src/cli/commands/consumer`                  | validação de consumidor deve ser reusável fora do bin         |

## Preparação BDD visual para mantenedores

O objetivo não é criar documentação manual de testes. O objetivo é que cenários reais e falsificáveis possam ser navegados por humanos.

Modelo proposto:

```text
teste/cenário executável
→ metadado BDD curto
→ catálogo gerado
→ página navegável para mantenedores
```

Exemplo de metadado:

```yaml
id: flow-daily-dirty-tree
persona: maintainer
area: governed-flow
journey: uso diário
given:
  - repo governado
  - sub-checkpoint ativo
  - working tree suja
when:
  - pessoa roda npx ai-guidelines
then:
  - wizard explica que a próxima ação é limpar/validar mudanças
  - readiness e avanço aparecem bloqueados
  - comando recomendado é validação do diff
evidence:
  test: src/testing/flow-scenarios/daily/dirtyTree.test.ts
  command: npx ai-guidelines
```

Saída humana desejada:

- página de mantenedores separada do site público;
- navegação por jornada: onboarding, uso diário, review, decisão, consumidor, falha;
- cada cenário mostra estado inicial, ação, resultado esperado, teste que protege e artefatos tocados;
- nada é descrito como implementado se não houver teste/transcript/cenário executável.

## Critérios de saída do CO-10.8

Para marcar readiness deste sub-checkpoint, o mínimo esperado é:

1. inventário da árvore atual completo e reconciliado;
2. árvore-alvo validada contra DDD/hexagonal;
3. plano de migração por grupos de responsabilidade;
4. refactor estrutural behavior-preserving executado nos hotspots principais;
5. testes reorganizados ou mapeados por jornada quando útil;
6. seed de catálogo BDD humano criada a partir de cenários reais;
7. `npm run build`, `npm run test:ts`, `npm run validate` verdes;
8. sem mudança de comportamento público da CLI;
9. sem Ready, Human Gate, merge ou advance.

## Falsificação esperada

O CO-10.8 deve falhar ou parar se:

- a migração exigir alterar regra de negócio para "aproveitar" o refactor;
- uma regra de lifecycle migrar para `src/cli` por conveniência;
- o wizard passar a calcular estado fora de `GovernedFlow`;
- o site público ou copy pública mudar sem decisão de produto;
- os testes ficarem mais difíceis de navegar;
- a árvore-alvo criar outra camada genérica sem vínculo com jornadas reais;
- BDD virar documentação manual sem lastro em teste executável.

## Dogfood inicial executado como seed antecipado de CO-10.8

Data: 2026-06-19
HEAD de partida: `95c953c`
Estado governado observado no momento do seed: `CO-10.8 [/]`, PR #43 Draft, CI remoto verde após a transição CO-10.7 → CO-10.8.

Estado corrigido por `[DEC-0024-G17]`: `CO-10.7 [/]` volta a ser ativo; `CO-10.8 [ ]` fica pendente. O dogfood abaixo permanece como evidência preservada, não como autorização para continuar CO-10.8 agora.

### Refactor estrutural behavior-preserving

Primeiro hotspot tratado: `src/cli/flowWizard.ts`.

Antes:

```text
src/cli/flowWizard.ts
→ wizard principal
→ detecção de provisioning
→ update guiado de providers/features/colaboração
→ leitura de package.json/review-policy
→ seleção de spec ativa/múltiplas specs
→ renderização de resumo e ações
```

Depois:

```text
src/cli/flowWizard.ts
→ orquestra o wizard, resumo, ações e seções principais

src/cli/experience/wizard/provisioning.ts
→ detecta contexto init/adopt/update
→ renderiza e executa a seção de provisioning
→ concentra provider/features/colaboração/review-policy

src/cli/experience/wizard/specWork.ts
→ carrega índice de specs
→ renderiza foco de trabalho
→ orienta troca de branch/fetch/continue sem auto-checkout
```

Resultado medido após o split:

| Arquivo                                     | Linhas |
| ------------------------------------------- | -----: |
| `src/cli/flowWizard.ts`                     |    893 |
| `src/cli/experience/wizard/provisioning.ts` |    597 |
| `src/cli/experience/wizard/specWork.ts`     |    279 |

O comportamento público não foi alterado: os imports externos continuam usando `src/cli/flowWizard.ts`, os testes existentes do wizard continuam exercitando a mesma API e `npm run build` passou após a migração.

### Guard criado

Foi criado `src/test-utils/InternalArchitectureOrganization.test.ts` para impedir regressão imediata deste hotspot.

O guard não tenta medir "beleza" de código. Ele protege apenas o fato estrutural que motivou a migração:

- o wizard raiz não pode voltar a importar `node:fs`/`node:path`;
- o wizard raiz não pode voltar a depender diretamente de `reviewPolicyReader`, `ProviderCatalog`, `ReviewPolicyBaseline`, `FormatterContext` ou `PackageJson`;
- os módulos `experience/wizard/provisioning.ts`, `experience/wizard/specWork.ts` e `testing/bdd/maintainerScenarioCatalog.ts` precisam existir.

### Seed BDD para mantenedores

Foi criado `src/testing/bdd/maintainerScenarioCatalog.ts` com cenários BDD tipados e ancorados em testes reais.

Cada cenário declara:

- pessoa/persona;
- área;
- jornada;
- Given/When/Then;
- artefatos tocados;
- teste que prova o comportamento;
- comando associado quando aplicável.

Foi criado `src/testing/bdd/MaintainerScenarioCatalog.test.ts` para garantir que:

- cada cenário aponta para um arquivo de teste real;
- o nome do teste citado existe literalmente no arquivo;
- os artefatos citados existem;
- há agrupamento navegável por jornada.

Jornadas cobertas no seed:

| Jornada                  | Cenários iniciais                                                       |
| ------------------------ | ----------------------------------------------------------------------- |
| uso diário               | tree suja orienta validação; múltiplas specs exigem foco explícito      |
| decisão governada        | readiness usa a mesma fonte de verdade de `work`/`decide`               |
| fechamento de checkpoint | último sub-checkpoint pronto não tenta `advance-subcheckpoint` indevido |
| manutenção de repo       | repo governado usa `update`, não `init/adopt`                           |
| validação de consumidor  | pacote instalado é validado sem publicar no npm                         |
| documentação viva        | site não ensina comando inexistente                                     |

Esse seed ainda não é a página visual de mantenedores. Ele é o lastro executável necessário para que uma página futura não vire documentação manual paralela.

### Falsificação já aplicada

Validação focada executada:

```bash
npm run build
npx jest --config ./.jest/jest.config.js \
  src/testing/bdd/MaintainerScenarioCatalog.test.ts \
  src/test-utils/InternalArchitectureOrganization.test.ts \
  src/cli/flowWizard.test.ts \
  --runInBand
```

Resultado:

- `npm run build`: verde;
- testes focados: 45 testes verdes.

Uma falha real foi encontrada e corrigida durante o dogfood: o cenário BDD `site-command-fidelity` apontava para uma descrição de teste que não existia literalmente. O novo teste falhou, forçando o catálogo a se ancorar em evidência real.

### O que ainda falta antes de retomar CO-10.8

Este primeiro slice não encerra CO-10.8 e, após `[DEC-0024-G17]`, não deve ser continuado antes de CO-10.7 fechar. Ainda faltam:

0. concluir CO-10.7 com harness de consumidores e site refletindo a experiência real da CLI pública;

1. avaliar se outro hotspot precisa de split imediato antes da readiness (`workflow.ts`, `workBrief.ts`, `handoff.ts`, `reviewBrief.ts` ou testes muito grandes);
2. decidir se o seed BDD atual é suficiente para readiness ou se precisa de uma projeção visual mínima ainda neste sub-checkpoint;
3. rodar validação completa (`git diff --check`, `npm run format`, `npm run build`, `npm run test:ts`, `npm run validate`);
4. registrar o estado final e só então usar o fluxo governado de readiness, se os critérios estiverem satisfeitos.
