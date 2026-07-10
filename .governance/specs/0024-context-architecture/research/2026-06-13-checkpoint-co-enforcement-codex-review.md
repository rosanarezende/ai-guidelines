---
artifact-kind: pre-coding-review
subject: "revisao adversarial do framing arquitetural do checkpoint co-enforcement"
date: 2026-06-13
disposition: evidence
---

# Revisão adversarial — co-enforcement

> Data: 2026-06-13. Escopo: falsificar o framing arquitetural do checkpoint
> `co-enforcement` antes de implementação. Esta revisão não implementa código e
> não altera estado/topologia/gates/policy/scripts.

## Retomada factual

Fatos observados no repositório:

- `npm run guidelines -- handoff 0024` reportou spec
  `0024-context-architecture`, branch `feat/spec-0024-co-enforcement`, HEAD
  `d969776`, ahead/behind `0/0`, working tree limpa, cursor
  `co-enforcement · checkpoint-co-enforcement`, PR #42 `open`/Draft sobre
  `feat/spec-0024-co-projection`, CI 11/11 verde.
- `git status --short --branch` confirmou
  `## feat/spec-0024-co-enforcement...origin/feat/spec-0024-co-enforcement`
  sem arquivos modificados.
- `git rev-parse --short HEAD` retornou `d969776`.
- `git rev-list --left-right --count HEAD...origin/feat/spec-0024-co-enforcement`
  retornou `0 0`.
- `gh pr view 42 --json state,isDraft,headRefOid,headRefName,baseRefName`
  confirmou PR `OPEN`, Draft, head `feat/spec-0024-co-enforcement`, base
  `feat/spec-0024-co-projection`, OID
  `d96977626e11899ba1a4c06a3eeac91ac0612c7c`.
- `gh pr checks 42` listou 11 checks `pass`.
- O framing canônico existe, está rastreado em git e foi adicionado no commit
  `d9697762 docs(spec-0024): consolida framing do co-enforcement`.
- O diff do PR contra a base contém apenas artefatos governados/documentais do
  checkpoint (`active.yml`, `state.yml`, `tasks.md`, framing). Não encontrei
  implementação funcional iniciada no HEAD esperado.

Interpretação:

- A retomada factual bate com o estado esperado. Não há divergência material
  que exija parar a revisão.
- A linha de base do framing é válida para análise, mas algumas conclusões do
  apêndice não sobrevivem ao confronto com o código atual, especialmente a
  vivacidade das features editoriais `bdd`/`tdd`/`quality-gates`.

## Veredito executivo

Veredito: o desenho é promissor, mas o framing subestima dois riscos
estruturais. Primeiro, `surface` não é hoje um espaço governado uniforme:
`script-contracts.yml` cobre scripts npm, hooks e workflows, mas não registra
diretamente o subcomando `workflow publish-state`; o CommandRegistry é outra
fonte derivável. Segundo, guardrails não são compiláveis de forma honesta a
partir do Markdown atual sem parser frágil. O CO-3 só deve avançar se o primeiro
sub-checkpoint incluir uma fonte estruturada de `constraint` que cubra pelo
menos `rule` e `guardrail` reais.

Menor decisão segura: adotar `Constraint` como modelo normalizado e declarar
bindings em uma fonte estruturada governada, com schema explícito de
`enforcement` e `mode`. O Markdown atual deve virar projeção/compatibilidade, não
fonte executável para guardrails.

Risco bloqueante: a alternativa de dois campos (`surface`, `surface_class`) é
insuficiente. Ela não representa o mecanismo que executa o check nem a força
advisory/required, e portanto não consegue distinguir "esta constraint se aplica
a esta superfície" de "esta constraint é de fato enforçada por este handler".

## Q1 — EnforcementBinding

### Fatos observados

- `KnowledgeGraph` hoje é read-model puro e possui arestas
  `graduatedTo | falsifies | constrains | crystallizedAs`.
- `GovernedRef` aceita apenas `space: "knowledge"` e `space: "work"`. O comentário
  autoriza extensibilidade futura, mas `space: "surface"` ainda não é compatível
  com o parser nem com os invariantes atuais.
- `script-contracts.yml` é SSOT operacional para scripts/hooks/workflows/templates.
  Em `package_scripts`, cada script tem `name`, `command`, `category`,
  `mutates`, `consumers`, `description`.
- `script-contracts.yml` não descreve subcomandos do CommandRegistry. Logo,
  `review:publish` é referenciável como script npm; `workflow publish-state`
  não é referenciável diretamente ali.
- O parser TS de rules (`MarkdownRulesDirectorySource`) parseia blocos fenced
  `yaml` por regra, não frontmatter real. O comentário de
  `.core/rules/top/agents-core.md` confirma que frontmatter `---` foi descartado.
- Esse parser aceita YAML subset plano e arrays escalares; não aceita array de
  objetos. Um binding repetível e legível como lista de mapas exigiria evoluir o
  parser ou usar fonte YAML estruturada separada.

### Decisão

Schema recomendado: usar uma lista de bindings com quatro campos explícitos por
binding:

```yaml
bindings:
  - surface: npm-script:review:publish
    surface_class: event
    enforcement: handoff-receipt
    mode: advisory
```

Para o subcomando do registry:

```yaml
bindings:
  - surface: registry-command:workflow/publish-state
    surface_class: event
    enforcement: handoff-receipt
    mode: advisory
```

O menor schema honesto é:

- `surface`: referência estável para uma superfície derivável, com namespace.
- `surface_class`: `event | state`, declarado pelo humano e validado contra a
  fonte da superfície.
- `enforcement`: mecanismo/capability que executa a verificação.
- `mode`: força efetiva do binding, `advisory | required`.

A constraint em si é implícita pelo local onde o binding está declarado. Em
representação agregada/manifesto, deve aparecer como `constraint_ref`.

### Evidência

- Alternativa A:

  ```yaml
  surface: review:publish
  surface_class: event
  ```

  Falsifica o requisito "qual mecanismo executa a verificação" e "qual é a
  força". Ela descreve aplicabilidade, não enforcement.

- Alternativa B:

  ```yaml
  surface: review:publish
  surface_class: event
  enforcement: handoff-receipt
  ```

  Ainda falsifica advisory-first versus required. Não permite dogfood inicial sem
  hard block nem migração futura para required sem mudar semântica fora do dado.

- Alternativa C:

  ```yaml
  surface: review:publish
  surface_class: event
  enforcement: handoff-receipt
  mode: advisory
  ```

  É a menor das três que representa a execução real. Eu ajustaria apenas o valor
  de `surface` para ser namespaced (`npm-script:review:publish`) para evitar
  colisão com registry command, hook, workflow file ou estado.

### Alternativas rejeitadas

- Dois campos: rejeitado porque não diferenciam "constraint aplicável" de
  "constraint enforçada".
- `mode` na constraint: rejeitado porque a mesma constraint pode ser advisory em
  `workflow publish-state` e required em um gate terminal futuro.
- `mode` em policy global separada como única fonte: rejeitado para CO-3 porque
  cria lookup extra antes de existir necessidade comprovada. Uma policy global
  pode sobrescrever/validar depois; o binding deve carregar o default efetivo.
- Handler derivado por superfície: rejeitado. Uma superfície pode receber várias
  constraints com mecanismos diferentes; uma constraint pode usar mecanismos
  diferentes por superfície.
- Aresta `enforces` no grafo se a direção for `Constraint -> Surface`: rejeitado
  por semântica invertida. A constraint não "enforces" a superfície; ela a
  constrange, e o handler enforça a constraint.

### Placement recomendado

Curto prazo: a declaração canônica do binding deve morar junto da declaração
estruturada da constraint, não em `script-contracts.yml`.

Motivo:

- `script-contracts.yml` é SSOT de superfícies operacionais, não de normas.
- Inverter para `script-contracts.yml` (`surface -> constraints`) torna difícil
  preservar origem da constraint e misturaria política normativa com contrato de
  scripts.
- Guardrails atuais não têm bloco YAML por item. Colocar binding "no Markdown do
  guardrail" exigiria parser editorial frágil.

Placement recomendado para o modelo final do CO-3:

```text
.core/constraints/constraints.yml          # constraints core do framework
.governance/constraints.yml                # overlay de consumidores, futuro/cutover
.ai-guidelines/constraints.yml             # ponte legada opcional enquanto consumidor ainda usa .ai-guidelines/
```

Se a owner rejeitar novo path no CO-3, a alternativa menor é ampliar
`knowledge-backfill.yml` somente como plano da Spec 0024? Não recomendo: o próprio
arquivo diz que não é SSOT runtime universal. Usá-lo como fonte canônica de
enforcement violaria o comentário do repositório.

### Relação no KnowledgeGraph

Recomendação: no read-model, projetar uma aresta `constrains` de
`constraint` para `GovernedRef{space:"surface"}` e manter os detalhes
`enforcement/mode` no manifesto de bindings.

Exemplo conceitual:

```text
constraint:CORE-08 --constrains--> surface:npm-script:review:publish
binding(CORE-08, npm-script:review:publish) = handoff-receipt/advisory
```

Racional:

- `constrains` já existe e significa "esta proposição restringe este alvo
  governado".
- `enforces` só seria correto se a origem da aresta fosse a superfície ou o
  mecanismo, não a constraint. O grafo atual não reifica superfície como nó de
  primeira classe e não deve fazer isso agora.
- `boundToSurface` ou `appliesTo` seriam mais precisos, mas criam nova relação
  sem necessidade operacional forte. `constrains` é suficiente se o manifesto
  carrega o binding.

### GovernedRef surface

`GovernedRef { space: "surface" }` é compatível com a intenção dos invariantes
existentes, mas não com a implementação atual. Para ser honesto, o CO-3.1 precisa
incluir validação/parse/format para:

```yaml
surface:npm-script:review:publish
surface:registry-command:workflow/publish-state
surface:hook:pre-push
surface:github-workflow:.github/workflows/repo-validation.yml
surface:state-file:.governance/runtime/specs/active.yml
```

Não recomendo aceitar `review:publish` sem namespace no modelo canônico. Como
atalho de leitura, pode haver alias compatível que normalize para
`npm-script:review:publish`.

### Como referenciar script-contracts.yml sem duplicar

O binding deve referenciar apenas a chave estável:

```yaml
surface: npm-script:review:publish
```

O compilador resolve `review:publish` em
`.core/governance/script-contracts.yml#profiles.maintainer.package_scripts[name=review:publish]`
e deriva `command`, `category`, `mutates`, `consumers`. Esses campos não entram no
binding.

Para `workflow publish-state`, a resolução deve vir do CommandRegistry, não de
`script-contracts.yml`, salvo se o contrato operacional for ampliado para listar
subcomandos do registry. Fingir que ele já está no contrato criaria binding órfão.

### Exemplos válidos

```yaml
id: CORE-08
kind: constraint
origin:
  kind: rule
  source: .core/rules/top/agents-core.md
bindings:
  - surface: npm-script:review:publish
    surface_class: event
    enforcement: handoff-receipt
    mode: advisory
```

```yaml
id: GG-0004
kind: constraint
origin:
  kind: guardrail
  source: .core/process/governance-foundation.md
  sources: [DOGFOOD-0024]
bindings:
  - surface: registry-command:workflow/publish-state
    surface_class: event
    enforcement: handoff-receipt
    mode: advisory
  - surface: npm-script:review:publish
    surface_class: event
    enforcement: handoff-receipt
    mode: advisory
```

```yaml
id: GG-0001
kind: constraint
origin:
  kind: guardrail
  source: .core/process/governance-foundation.md
  sources: [DOGFOOD-0024]
bindings:
  - surface: npm-script:gate-decidability:check
    surface_class: event
    enforcement: gate-decidability-check
    mode: required
```

### Exemplos inválidos

```yaml
bindings:
  - surface: review:publish
    surface_class: event
```

Inválido: sem namespace, sem mecanismo, sem modo.

```yaml
bindings:
  - surface: npm-script:not-a-script
    surface_class: event
    enforcement: handoff-receipt
    mode: advisory
```

Inválido: superfície inexistente no contrato derivável.

```yaml
bindings:
  - surface: registry-command:workflow/publish-state
    surface_class: state
    enforcement: handoff-receipt
    mode: advisory
```

Inválido ou no mínimo warning required: `publish-state` é invocação/evento
mutante, não estado contínuo.

```yaml
bindings:
  - surface: npm-script:review:publish
    surface_class: event
    enforcement: handoff-receipt
    mode: required
```

Inválido para o primeiro dogfood aprovado: a decisão fechada é advisory-first.

### Invariantes

- Todo binding referencia uma constraint existente e normalizada como
  `constraint`.
- Todo binding tem `surface`, `surface_class`, `enforcement`, `mode`.
- `surface` é namespaced e resolvível por fonte derivável (`script-contracts`,
  CommandRegistry, hooks, workflow files, state files).
- `surface_class` pertence a `event | state`.
- `mode` pertence a `advisory | required`.
- `enforcement` pertence a catálogo local de mecanismos conhecidos, com adapter
  executável ou explicitamente planejado no mesmo checkpoint.
- `(constraint_ref, surface, enforcement)` é único.
- Uma constraint pode ter N bindings; uma superfície pode receber N constraints.
- Superfície removida/renomeada falha paridade.
- Incompatibilidade de classe (`event` apontando estado contínuo, ou `state`
  apontando comando de evento) é detectada.
- Consumidores adicionam constraints por overlay local; não editam `.core/`.

### Teste de falsificação

- Fixture com `surface: npm-script:not-a-script` deve falhar.
- Fixture com `surface: registry-command:workflow/publish-state` deve falhar se o
  resolver só olha `script-contracts.yml`. Esse teste impede o desenho de
  esquecer o CommandRegistry.
- Fixture com dois bindings para a mesma superfície e mecanismos diferentes deve
  passar.
- Fixture com duas constraints sobre `npm-script:review:publish` deve passar.
- Fixture com `mode: required` no dogfood inicial deve falhar enquanto a decisão
  advisory-first estiver em vigor.

## Q2 — Fonte executável de constraints

### Fatos observados

- Rules atuais vivem em `.core/rules/**`.
- O formato de cada rule é Markdown com heading `#### [ID]` e primeiro bloco
  fenced `yaml`; não é frontmatter real.
- O compilador TS (`src/infrastructure/filesystem/MarkdownRulesDirectorySource.ts`
  - `RulesCatalogBuilder`) gera `.core/rules/_meta/rules.json`,
    `.core/rules/catalog.md` e ledger.
- `rules.json` já é machine-readable e contém `id`, `scope`, `category`,
  `evidence_strength`, `sources`, `applicable_languages`, `tags`, `title`,
  `file`, `instruction_en`, `documentation_pt`, `adapter`, `opt_in_feature`.
- A origem da rule não é metadado explícito como `origin.kind`; hoje ela é
  inferida por topologia (`.core/rules/**`), `file`, `sources` e, na prática,
  prefixos de ID.
- Guardrails dogfoodados vivem em `.core/process/governance-foundation.md`.
  O texto atual lista `GG-0001` e `GG-0004`.
- `knowledge-backfill.yml` lista `GG-0001` e `GG-0002` planejado, mas não
  `GG-0004`. Isso é drift factual entre acervo processual e inventário da spec,
  não necessariamente bug de runtime, mas invalida qualquer estratégia que tente
  tratar o backfill como catálogo universal.
- `GG-0001` já tem enforcement real:
  `cli/governance/gate-decidability-check.mjs`, agregado por
  `gate-decidability:check` no `validate`.
- `GG-0004` descreve mecanismos já materializados (`governance-pr-check`,
  `pr-body:update`, `pr-ready:check`, `review:seal`), mas não possui entrada
  machine-readable dedicada.
- `GG-0002` ainda é planejado na topologia da Spec 0024.

### Decisão

Recomendação: adotar B2 como destino e executar via B3 como migração
incremental.

Em termos práticos:

- Não parsear guardrails do Markdown atual como fonte executável.
- Criar representação machine-readable governada para `Constraint`.
- Migrar no CO-3 pelo menos as constraints necessárias para provar
  `rule | guardrail -> constraint + binding`: uma rule real e um guardrail real
  com enforcement real (`GG-0001` ou `GG-0004`).
- Projetar Markdown humano a partir dessa fonte estruturada, ou manter o Markdown
  histórico com check de paridade temporário até a projeção substituir a edição
  manual.

Isso não deve ser tratado como "nova SSOT paralela" se a decisão for explícita:
a nova fonte substitui, para o domínio Constraint, o trecho prose de guardrails e
os metadados normativos hoje presos no Markdown de rules. A coexistência só é
aceitável com check de drift e data de término.

### Alternativa B1 — Parsear guardrails do Markdown atual

Benefícios:

- Menor mudança aparente no filesystem.
- Preserva `.core/process/governance-foundation.md` como texto humano primário.

Riscos:

- Parser editorial frágil: `GG-0001` mistura origem, enforcement, projeção,
  bullets mecânicos e julgamento humano em uma linha e uma lista.
- Não há schema para `origin`, `bindings`, `mode`, `surface_class`.
- O Markdown atual já diverge de `knowledge-backfill.yml` (`GG-0004` existe na
  foundation, mas não no backfill).
- Qualquer edição editorial pode quebrar compilação sem violar intenção.

Duplicação: baixa no curto prazo, alta no custo oculto; a estrutura teria de ser
inferida por regex e repetida nos testes.

Custo de migração: baixo inicialmente, alto quando o formato variar.

Impacto em consumidores: ruim. Consumidor teria de seguir convenção textual
implícita em Markdown, não contrato governado.

Como provar ausência de drift: praticamente só por snapshots frágeis do parser.

Recomendação: rejeitar.

### Alternativa B2 — Criar representação machine-readable governada e projetar Markdown

Benefícios:

- Permite `rule` e `guardrail` participarem do CO-3 com o mesmo schema.
- Preserva origem sem depender de prefixo:

  ```yaml
  origin:
    kind: guardrail
    source: .core/process/governance-foundation.md
    sources: [DOGFOOD-0024]
  ```

- Permite bindings repetíveis sem forçar o parser Markdown subset.
- Permite overlays de consumidor sem alterar `.core/`.
- Dá ao `knowledge:compile` uma entrada determinística e testável.

Riscos:

- Introduz nova fonte canônica para um domínio que hoje está espalhado.
- Exige decisão de cutover: quais campos continuam no Markdown de rules e quais
  passam a ser projeção.
- Se criada como sidecar "também verdade", vira a SSOT paralela que o framing
  queria evitar.

Duplicação: aceitável apenas durante migração com check de drift. No destino, o
Markdown deve ser projeção ou conter apenas corpo humano referenciado pela fonte
estruturada.

Custo de migração: médio. Requer parser/serializer YAML real, extensão de modelo
e projeção.

Impacto em consumidores: positivo se houver overlay local (`.governance`) e
compat de leitura para regras atuais.

Como provar ausência de drift:

- Check que recompõe projeção Markdown e falha se diffar.
- Check que todo `GG-*` na foundation tem constraint estruturada, ou que a
  foundation não contém mais declarações editáveis de `GG-*`.
- Check que todo `source` apontado existe.

Recomendação: aceitar como destino.

### Alternativa B3 — Guardrails históricos por compatibilidade e formato estruturado para novos

Benefícios:

- Migração incremental mais segura.
- Evita bloquear CO-3 na reedição completa de `.core/process`.
- Permite declarar `GG-0001`/`GG-0004` estruturados agora e deixar texto
  histórico como projeção/ponte.

Riscos:

- Se não houver critério de término, normaliza duas fontes.
- Pode esconder que guardrails ainda não estruturados não participam do
  enforcement.

Duplicação: média e temporária.

Custo de migração: baixo-médio.

Impacto em consumidores: bom se novos consumidores só puderem usar formato
estruturado.

Como provar ausência de drift:

- Campo `legacy_until` ou issue/checkpoint de término.
- `knowledge:compile` reporta guardrails históricos não estruturados como
  advisory ou required, conforme decisão do CO-3.
- Teste com `GG-0004` garante que guardrails reais, não apenas planned/backfill,
  entram no grafo.

Recomendação: usar como plano de execução da B2, não como destino permanente.

### Decisão recomendada sobre guardrails

Decisão:
Usar B2 como arquitetura final, com B3 como estratégia de transição controlada.

Evidência:
Guardrails atuais são prose doutrinária, não dados. O próprio guardrail `GG-0001`
declara campos sem estrutura formal. O parser de rules existente também não
suporta o shape necessário para múltiplos bindings. `rules.json` cobre rules,
mas guardrails não vivem nele.

Alternativas rejeitadas:
B1, por fragilidade e acoplamento editorial. B3 sem término, por criar duas
verdades permanentes.

Risco residual:
Criar `.core/constraints/constraints.yml` pode ser lido como nova SSOT paralela
se a owner não fechar o cutover. O risco é mitigável declarando que essa fonte
substitui a fonte executável de constraints, enquanto Markdown vira projeção ou
compat.

Teste de falsificação:
Adicionar um guardrail estruturado `GG-0004` e remover/editar sua seção Markdown.
O compilador deve continuar produzindo o binding correto a partir da fonte
estruturada; se depender do Markdown, o desenho falha.

## Q3 — Migração do legado

### Inventário independente

| Item                               | Entrada                                     | Saída                                                                                                   | Efeitos colaterais                                  | Consumidores diretos                                                                                             | Consumidores indiretos                               | Scripts/bins                                                                        | Testes                                                                                                           | Classificação                 |
| ---------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `compiler.mjs`                     | `rules.json` e dados em memória             | `loadRulesCatalog`, `compileRulesContent`, `compileCoreRulesContent`, `buildAgentsRuntimeStub`, helpers | `loadRulesCatalog` lê FS                            | `budget-report.mjs` usa `loadRulesCatalog`; `token-budget.mjs` usa `buildAgentsRuntimeStub`; testes usam o resto | `check-budget`                                       | Sem script/bin direto                                                               | `compiler.test.mjs`                                                                                              | compatibilidade               |
| `rules-builder.mjs`                | `.core/rules/**`                            | `rules.json`, ledger, catálogo, warnings de budget                                                      | Pode escrever artefatos quando executado standalone | Nenhum runtime; só testes e auto-exec manual                                                                     | Nenhum contrato atual                                | Não está em `package.json` nem script-contracts                                     | `rules-builder.test.mjs`; fixtures usadas por testes TS                                                          | morto                         |
| `rules-parser.mjs`                 | Markdown de rules com bloco fenced YAML     | objetos de rule                                                                                         | Lê FS via `parseRulesFromDirectory`                 | `rules-builder.mjs`, `diagnose.mjs`, testes                                                                      | Nenhum runtime                                       | Sem script/bin                                                                      | `rules-parser.test.mjs`                                                                                          | morto                         |
| `diagnose.mjs`                     | strings hardcoded/fixtures inline           | logs de diagnóstico no stdout                                                                           | stdout                                              | Nenhum runtime                                                                                                   | Nenhum                                               | Sem script/bin                                                                      | Sem teste direto                                                                                                 | morto                         |
| `rules-loader.mjs`                 | `.core/rules` + feature/lang                | paths e leitura de regras opt-in legadas                                                                | Pode ler FS                                         | `bdd.mjs`, `tdd.mjs`, `quality-gates.mjs`; testes                                                                | Nenhum fluxo runtime encontrado chama essas features | Sem script/bin                                                                      | `rules-loader.test.mjs`                                                                                          | adaptador trivial             |
| `token-budget.mjs`                 | catálogo rules                              | token count, thresholds, warnings                                                                       | Nenhum (puro)                                       | `budget-report.mjs`; `rules-builder.mjs` morto                                                                   | `check-budget`                                       | Sem script/bin direto                                                               | `token-budget.test.mjs`                                                                                          | capacidade sem equivalente TS |
| `budget-report.mjs`                | `.core/rules/_meta/rules.json`              | relatório stdout                                                                                        | stdout/stderr, `process.exitCode=1` em erro         | `cli/app/engine.mjs`                                                                                             | registry command `check-budget`                      | Bin público via `ai-guidelines check-budget`                                        | Coberto indiretamente por registry/args; sem teste específico suficiente de stdout                               | consumidor vivo               |
| `check-budget`                     | comando CLI                                 | relatório de orçamento                                                                                  | stdout/stderr/exitCode                              | `BootstrapCommand`, `args.mjs`, `engine.mjs`                                                                     | bin `package.json#bin`                               | Não é npm script; é comando do bin                                                  | `buildRegistry.test.ts`, `args.test.mjs`                                                                         | consumidor vivo               |
| features `bdd/tdd/quality-gates`   | target/options/context                      | sync/prune `.ai-guidelines/rules/*.md`                                                                  | escreve/remove arquivos no consumidor se chamadas   | Apenas testes e seus próprios módulos; não chamadas por `engine.mjs` atual                                       | Pacote ainda inclui os arquivos                      | Sem script/bin direto                                                               | `bdd.test.mjs`, `tdd.test.mjs`, `quality-gates.test.mjs`, integração valida que `.ai-guidelines/rules` não nasce | compatibilidade               |
| `build:rules`                      | `.core/rules/**`                            | `rules.json`, ledger, catálogo                                                                          | escreve artefatos derivados                         | `package.json`, hooks, prepack, validate                                                                         | CI, package tarball, handoff contract                | npm script `build:rules`; wrapper `cli/rules-build.mjs` -> `dist/cli/buildRules.js` | `buildRules.test.ts`, `RulesCatalogBuilder.test.ts`, hooks/CI                                                    | consumidor vivo               |
| `RulesCatalogBuilder`              | `RulesMarkdownSource`                       | `RulesCatalogJson`, ledger, catálogo                                                                    | puro                                                | `src/cli/buildRules.ts`                                                                                          | `build:rules`, `build:all`, prepack, validate        | via wrapper `cli/rules-build.mjs`                                                   | `RulesCatalogBuilder.test.ts`                                                                                    | consumidor vivo               |
| `RulesRuntimeCompiler`             | `RulesCatalogJson` + adapters/features/lang | adapter rules por provider                                                                              | puro                                                | `cli/features/core/pointers.mjs` via import dinâmico de `dist/app/services/RulesRuntimeCompiler.js`              | `init/adopt/providers/update`; pacote instalado      | bin `ai-guidelines` após build/prepack                                              | `RulesRuntimeCompiler.test.ts`, integração/smoke                                                                 | consumidor vivo               |
| carregamentos dinâmicos de `dist/` | módulos TS compilados                       | execução de wrappers e registry                                                                         | falha se `dist/` ausente                            | wrappers `cli/*.mjs`, `engine.mjs`, `pointers.mjs`, `templates.mjs`                                              | scripts npm, hooks, CI, pacote instalado             | `package.json#bin`, `prepack`, `build`                                              | smoke multi-OS, workflow-dispatch, wrapper tests                                                                 | consumidor vivo               |

### Correções ao framing

Decisão:
Reclassificar `bdd/tdd/quality-gates` de "consumidores vivos do
rules-loader" para "compatibilidade/test-only, sem chamada runtime encontrada".

Evidência:
`rg applyBdd|applyTdd|applyQualityGates` retorna só os módulos e seus testes.
`engine.mjs` importa apenas features de infraestrutura e diz que regras
editoriais são compiladas por `applyPointers`. `applyPointers` usa
`RulesRuntimeCompiler` via `dist/`.

Alternativas rejeitadas:
Aceitar a tabela do framing sem confronto. Isso faria portar path maps legados
como se fossem obrigatórios para runtime, inflando CO-3.3.

Risco residual:
Como os arquivos são publicados no pacote, um consumidor externo poderia estar
importando internals. Esse contrato não é público (`bin` aponta para
`cli/ai-guidelines-cli.mjs`), mas a remoção deve ser validada por `npm pack` e
smoke de pacote instalado.

Teste de falsificação:
Remover temporariamente os três módulos editoriais em uma branch experimental e
rodar `test:unit`, integração e smoke de pacote. Se só testes legados falharem,
eles não são consumidores runtime.

### Ordem segura de migração

Ordem recomendada:

```text
1. Portar token-budget para TS como domínio/app puro.
2. Criar testes de paridade MJS->TS para token count, thresholds, warnings,
   ordenação, paths, erros, stdout/stderr e exit codes.
3. Trocar `budget-report.mjs`/`check-budget` para consumir o port TS via `dist/`
   ou wrapper apropriado.
4. Remover dependência de `compiler.mjs` em `budget-report` e substituir
   `buildAgentsRuntimeStub` legado pelo stub TS atual.
5. Reavaliar features editoriais: ou remover como legado test-only, ou
   reconectá-las explicitamente se a owner ainda quiser distribuir
   `.ai-guidelines/rules/*.md`.
6. Provar ausência de consumidores com `rg`, scripts, hooks, workflows,
   CommandRegistry, package files, templates e smoke de tarball.
7. Remover `compiler.mjs`, `token-budget.mjs`, `rules-loader.mjs`,
   `rules-builder.mjs`, `rules-parser.mjs`, `diagnose.mjs` e testes legados
   apenas depois da troca.
8. Validar pacote e cross-platform: Linux/macOS/Windows, `dist/`, pacote
   instalado, hooks e CI.
```

Paridade mínima obrigatória:

- Tok-H (`ceil(chars / 3.5)`).
- `LIMITS` (`universal`, `opt-in`, `agentsMd`, `perAdapter`).
- soft ceiling 75%.
- texto exato dos warnings.
- ordenação de adapters.
- comportamento com catálogo ausente/inválido.
- stdout/stderr de `check-budget`.
- exit codes.
- uso do `AgentsRuntimeBootstrap` TS, não stub legado com texto antigo.
- funcionamento em pacote instalado após `npm pack`.

## Revisão dos sub-checkpoints

### Ordem proposta

```text
CO-3.1 — Constraint + EnforcementBinding
CO-3.2 — knowledge:compile + manifesto/paridade
CO-3.3 — migração e remoção do legado
CO-3.4 — dogfood do enforcement e recibo
```

### Decisão

A ordem é aceitável, mas CO-3.1 precisa incluir uma fatia vertical mínima do
compilador de bindings em teste, sem comando público. Caso contrário, o schema
só será falsificado em CO-3.2, tarde demais.

### Evidência

- O schema de binding depende de resolver superfícies reais. `workflow
publish-state` não vem de `script-contracts.yml`, então o resolver precisa ser
  provado cedo.
- Guardrails não têm fonte estruturada; adiar isso para depois de CO-3.1 faria
  `Constraint` nascer como renome de rules, não colapso real de `rule |
guardrail`.
- `knowledge:compile` pode continuar em CO-3.2 como comando/manifesta público,
  mas a estrutura de entrada deve ser exercitada em CO-3.1.

### Alternativas rejeitadas

- Mover CO-3.3 antes de CO-3.2: rejeitado. O port de token-budget é necessário
  para remover legado, mas não é precondição do manifesto de constraints.
- Separar em novos PRs: rejeitado por ora. A unidade aprovada é PR #42 e os
  riscos cabem em sub-checkpoints internos.
- Dogfood antes da compilação: rejeitado. Sem manifesto/paridade, o enforcement
  vira wiring manual e perde o valor de CO-3.

### Risco residual

CO-3 continua grande. O risco é controlável se cada sub-checkpoint tiver critério
de saída mecânico e não avançar com advisory "vermelho".

### Teste de falsificação

- CO-3.1 só sai se uma constraint de origem `rule` e uma de origem `guardrail`
  gerarem bindings válidos e um binding inválido for detectado.
- CO-3.2 só sai se duas execuções de `knowledge:compile` produzirem manifesto
  idêntico e se `build:rules` continuar compatível.
- CO-3.3 só sai se `check-budget` funcionar sem imports de `monolith`.
- CO-3.4 só sai se `workflow publish-state` e `review:publish` emitirem advisory
  com recibo stale e silêncio com recibo fresh.

### Ajustes recomendados no fatiamento

- CO-3.1: incluir fonte estruturada mínima de constraints e resolver de surface
  em testes. Não limitar a rules.
- CO-3.2: publicar `knowledge compile`, manifesto determinístico e checks de
  paridade. Manter `build:rules` como alias/compat.
- CO-3.3: portar token-budget antes de remover monolith; reclassificar features
  editoriais antes de portar path maps.
- CO-3.4: conectar advisory-first usando caminho não-lançante; não chamar
  diretamente `assertFreshHandoffReceipt` no wiring inicial.

## Riscos bloqueantes

- Schema A/B insuficiente para enforcement real.
- Ausência de fonte estruturada para guardrails: sem ela, CO-3 não absorve
  `rule | guardrail`, apenas rules.
- Resolver de superfícies incompleto: `workflow publish-state` não é entry de
  `script-contracts.yml`.
- Parser atual de rules não suporta bindings como lista de objetos; tentar
  encaixar o schema ali sem evoluir parser gera formato ilegível ou frágil.
- `token-budget` usa `buildAgentsRuntimeStub` legado; paridade ingênua pode
  preservar token count de texto antigo, não do runtime TS atual.

## Riscos não bloqueantes

- `GG-0004` existe na foundation e em promoted insights, mas não no
  `knowledge-backfill.yml`. Tratar como drift a reconciliar no CO-3.1/CO-3.2,
  não como bloqueio desta revisão.
- `rules-loader.mjs` e features editoriais são compatibilidade/test-only. Remover
  exige cuidado de pacote, mas não bloqueia schema de binding.
- `build:rules` é vivo e deve permanecer como compatibilidade mesmo com
  `knowledge compile`.
- `npm pack` não foi executado nesta revisão para evitar gerar artefato local;
  deve ser critério de saída do CO-3.3.

## Decisões recomendadas

Decisão:
Usar schema C com namespace de surface:

```yaml
surface: npm-script:review:publish
surface_class: event
enforcement: handoff-receipt
mode: advisory
```

Evidência:
É o menor schema que representa onde dispara, classe da superfície, mecanismo e
força. Dois campos não bastam.

Alternativas rejeitadas:
A e B; `mode` global-only; handler derivado implicitamente.

Risco residual:
Mais campos aumentam custo de autoria. Mitigar com defaults/projeções, não
omitindo semântica.

Teste de falsificação:
Trocar `mode` para `required` no dogfood inicial deve falhar por decisão
advisory-first.

---

Decisão:
Binding declarado junto da constraint estruturada; `script-contracts.yml` apenas
resolve superfícies de script.

Evidência:
`script-contracts.yml` não conhece `workflow publish-state` e não é catálogo de
normas.

Alternativas rejeitadas:
Binding dentro de `script-contracts.yml`; parser de Markdown de guardrail.

Risco residual:
Novo arquivo de constraints pode parecer nova SSOT. Mitigar declarando cutover:
ele substitui a fonte executável de constraints e projeta Markdown.

Teste de falsificação:
Binding para `registry-command:workflow/publish-state` deve resolver via registry,
não via script-contract.

---

Decisão:
Usar `constrains` no grafo para `Constraint -> surface`; manter
`enforcement/mode` no manifesto de bindings.

Evidência:
`enforces` teria direção semântica errada no grafo atual.

Alternativas rejeitadas:
Reificar surface como node só para poder usar `surface --enforces--> constraint`.

Risco residual:
`constrains` fica usado por falsifications e constraints. A fonte do edge
desambigua.

Teste de falsificação:
Traversal de incoming em uma surface deve apontar constraints e falsifications
se ambos restringirem o mesmo alvo, sem perder tipo de origem.

---

Decisão:
Fonte de guardrails: B2 como destino, B3 como migração. Não B1.

Evidência:
Guardrails atuais são prose e já exibem drift com backfill.

Alternativas rejeitadas:
Parsear `.core/process/governance-foundation.md`.

Risco residual:
Coexistência temporária de fontes.

Teste de falsificação:
Editar prose de `GG-0001` sem mudar structured constraint não pode mudar o
manifesto; se mudar, o parser continua acoplado ao Markdown.

---

Decisão:
Migrar legado começando por token-budget TS e `check-budget`.

Evidência:
`check-budget` é consumidor vivo; `rules-builder`/`rules-parser`/`diagnose` não
são.

Alternativas rejeitadas:
Deletar monolith por busca de imports; portar features editoriais antes de
provar vivacidade.

Risco residual:
Internals publicados podem ter consumidores externos não declarados.

Teste de falsificação:
Smoke de tarball instalado deve passar sem `cli/governance/monolith/**`.

## Testes de falsificação

- `constraint` legado `rule:CORE-08` e `guardrail:GG-0001` normalizam para
  `constraint` preservando `origin.kind`.
- Constraint sem `origin.kind` falha; origem não pode ser inferida apenas por
  prefixo.
- Binding com `surface` sem namespace falha ou normaliza com warning explícito.
- Binding para superfície removida/renomeada falha.
- Binding para `registry-command:workflow/publish-state` falha se o resolver só
  consultar `script-contracts.yml`.
- Binding `surface_class: state` para `review:publish` falha.
- Dois bindings na mesma constraint passam.
- Duas constraints na mesma superfície passam.
- `knowledge compile` é determinístico byte-a-byte em duas execuções.
- `build:rules` continua produzindo os mesmos artefatos derivados.
- `check-budget` pré e pós-port mantêm token count, warnings, stdout/stderr e
  exit codes esperados.
- Remoção de monolith não quebra bin instalado via tarball em Windows/Linux/macOS.
- Recibo stale em `workflow publish-state` e `review:publish` emite advisory; recibo
  fresh fica silencioso.

## Perguntas restantes para ChatGPT e owner

- A owner aceita criar uma fonte estruturada canônica de constraints
  (`.core/constraints/constraints.yml`) se ela substituir, e não duplicar, a fonte
  executável atual?
- Qual path exato de overlay de consumidor deve ser aceito primeiro:
  `.governance/constraints.yml`, `.ai-guidelines/constraints.yml`, ou ambos em
  ordem de precedência explícita?
- `GG-0004` deve entrar no primeiro conjunto estruturado de guardrails do CO-3,
  apesar de não estar no `knowledge-backfill.yml` atual?
- O namespace canônico de surfaces deve usar `npm-script:*` e
  `registry-command:*`, ou a owner prefere outro vocabulário?
- `mode: required` deve ser proibido no CO-3 inteiro ou apenas nos bindings do
  `handoff-receipt` advisory-first?
- As features editoriais legadas `bdd/tdd/quality-gates` devem ser removidas no
  CO-3.3 ou preservadas como API interna compatível até um cutover de consumidor?
