# Business Rules: ai-guidelines CLI

Este documento mapeia as regras de negócio canônicas da CLI, servindo de fonte única de verdade para os testes unitários BDD.

> **📣 Contrato Governance-Driven (Spec 0021).** O contrato canônico de longo prazo do consumidor é `.governance/` como root unificado (PR2/PR3 da Spec 0021 — ver `.specify/specs/0021-governance-information-architecture/`). A CLI mjs descrita aqui ainda escreve em `.ai-guidelines/` no consumidor — esse caminho funciona como **bridge legado explícita** até a CLI ser plugada no novo `GovernanceWorkspace` (rastreado em PR4). Nenhum alias mágico é introduzido entre os dois roots; a migração acontece por adoção explícita.
>
> **Reservas canônicas em `.governance/`:** `intake/` (PRD/intake), `handoff/`, `telemetry/`. Materializadas como `RESERVED_GOVERNANCE_DIRS` em `src/domain/workspace/MigrationPlan.ts` e criadas idempotentemente por `AdoptWorkspace`. Smoke tests atuais validam o **bridge legado** (`.ai-guidelines/`); a migração para asserções sob `.governance/` chega quando a CLI plugar o novo workspace.

## 0. Política de Update — `managed-block` + `mirror`

Os artefatos distribuídos ao consumidor seguem **dois modos de update** distintos, escolhidos por tipo de arquivo:

### Modo `managed-block`

Aplicável a: provider entrypoints nativos (`CLAUDE.md`, `GEMINI.md`, `.openai/instructions.md`, `.cursor/rules/ai-guidelines.mdc`, `.windsurfrules`, `CONVENTIONS.md`, etc.) e _ignore files_ (`.claudeignore`, `.aiexclude`, `.gptignore`, `.aiderignore`).

O conteúdo gerenciado pela CLI fica entre marcadores explícitos:

```markdown
<!-- ai-guidelines:managed-start v=1 -->

...hard-redirect para AGENTS.md + adapter rules específicas...

<!-- ai-guidelines:managed-end -->
```

Updates substituem **apenas o bloco interno**. Conteúdo do consumidor fora dos marcadores é preservado em qualquer cenário. Em arquivos pré-existentes sem marcadores (adoção), a CLI faz prepend do bloco gerenciado e injeta um comentário em PT-BR sinalizando que o conteúdo legado abaixo deve ser revisado pelo mantenedor humano.

### Modo `mirror`

Aplicável a: boilerplates SDD copiados para `.ai-guidelines/templates/` (origem em `.specify/templates/` da fonte).

Overwrite total é seguro porque esses arquivos **não são editados in-place**: o trabalho do consumidor vive em `.specify/specs/<slug>/` (instâncias dos templates), não nos templates em si. Cada template carrega header de versão (`<!-- ai-guidelines-template: <slug> v=N -->`) e a CLI loga transições no formato `write spec-boilerplate.md (template v=1 -> v=2)` quando uma versão sobe.

### Garantia de não-destruição

`npx ai-guidelines providers --prune` remove apenas os provider entrypoints de providers **não selecionados** — **nunca** apaga arquivos em `.ai-guidelines/templates/` nem conteúdo do consumidor fora de `managed-block`.

---

## 1. Comportamento Global de Sincronização

### [BR-CLI-SYNC-01] Delta Sync do Runtime

DADO que a CLI precisa sincronizar o runtime core no bloco `<AI_GUIDELINES>`
QUANDO executado
ENTÃO deve reescrever apenas o bloco gerenciado quando o conteúdo compilado diferir, preservando o restante do `AGENTS.md`.

### [BR-CLI-SYNC-02] Identificação de SSOT Radical (AGENTS.md)

DADO o arquivo `AGENTS.md` no repositório alvo
QUANDO o motor de adoção é acionado
ENTÃO deve manter o arquivo raiz como artefato runtime, preservando conteúdo local fora do bloco `<AI_GUIDELINES>`.

### [BR-CLI-SYNC-03] Erro em Baseline Corrompido

DADO que a pasta `.core/rules/` está ausente no framework CORE
QUANDO executado
ENTÃO deve lançar um erro crítico informando que o framework está incompleto.

### [BR-CLI-SYNC-04] Persistência de .gitattributes

DADO o arquivo `.gitattributes` no destino
QUANDO o motor de baseline é acionado
ENTÃO deve fundir as regras canônicas (LFS, line-endings) com as existentes usando merge atômico de linhas para garantir a integridade do controle de versão.

### [BR-CLI-SYNC-05] Gestão Inteligente de .prettierignore

DADO o arquivo `.prettierignore`
QUANDO no modo `adopt`
ENTÃO só deve injetar o arquivo se houver sinais de Prettier (dependências/scripts) e nenhum formatador rival detectado, evitando poluição de arquivos em repositórios que não adotam a ferramenta.

### [BR-CLI-SYNC-06] Core Mandatório sem Skip

DADO um comando `adopt` com flags de skip legadas para core
QUANDO executado
ENTÃO a CLI deve ignorar bypass de core (`AGENTS.md`, `.gitattributes`) e aplicar somente o controle de features opt-in (`prettier`, `husky`, `ci`).

### [BR-CLI-SYNC-07] Orientação para Formatadores Rivais

DADO que um formatador rival foi detectado
QUANDO no modo `adopt`
ENTÃO a CLI deve fornecer orientações claras recomendando a permanência do rival ou passos para migração incremental para Prettier, evitando mudanças disruptivas.

### [BR-CLI-SYNC-08] Detecção de Monorepo

DADO um projeto com workspaces (pnpm, yarn, npm)
QUANDO o baseline é aplicado
ENTÃO deve alertar o usuário que o baseline será aplicado apenas na raiz, preservando os subpacotes para gestão manual do desenvolvedor.

---

## 2. Gestão de Dependências (package.json)

### [BR-CLI-PKG-01] Aborto por Formatter Rival

DADO um repositório existente (modo `adopt`)
QUANDO detectado um formatador rival configurado (Ex: Biome, ESLint Prettier Plugin)
ENTÃO a CLI deve pular a injeção do Prettier no `package.json` para evitar conflitos de ferramentas, a menos que `--force` seja usado.

### [BR-CLI-PKG-02] Criação de Baseline em Repos Sem Package

DADO um diretório sem `package.json`
QUANDO executado em modo `init`
ENTÃO deve criar um `package.json` minimalista com os scripts padrão de `format` e `check` apontando para o framework.

### [BR-CLI-PKG-03] Fusão Inteligente (Merge)

DADO um `package.json` preexistente
QUANDO a CLI funde o fragmento de baseline
ENTÃO deve adicionar os novos scripts e dependências sem sobrescrever versões já existentes que sejam mais recentes que o baseline, respeitando a soberania do projeto alvo.

---

## 3. Automação de Git Hooks (Husky)

### [BR-CLI-HOOKS-01] Pré-requisito de Scripts

DADO um repositório alvo
QUANDO a CLI tenta instalar os Git Hooks
ENTÃO só deve criar o hook `pre-commit` se o script `format` estiver presente, e o `pre-push` se o script `check` estiver presente no `package.json`.

### [BR-CLI-HOOKS-02] Fusão de Conteúdo de Hook

DADO um arquivo de hook preexistente (ex: `.husky/pre-commit`)
QUANDO a CLI injeta o comando de baseline
ENTÃO deve concatenar o novo comando aos existentes, a menos que o comando exato já esteja presente, garantindo idempotência.

---

## 4. Integração Contínua (GitHub Actions)

### [BR-CLI-CI-01] Atualização Conservadora de Workflow Existente

DADO que o arquivo `.github/workflows/ai-guidelines-ci.yml` já existe
QUANDO em modo `adopt` (sem a flag `--force`)
ENTÃO a CLI deve comparar o baseline e, em ambiente interativo (TTY), pedir confirmação antes de atualizar; sem confirmação, deve preservar o arquivo existente.

### [BR-CLI-CI-02] Detecção de Runner e PackageManager

DADO que a CLI está gerando o workflow de CI
QUANDO executado
ENTÃO de detectar se o projeto usa `yarn`, `npm` ou `pnpm` e ajustar os comandos de `install` e `check` no arquivo YAML para condizer com o ambiente real do projeto.

### [BR-CLI-CI-03] Fallback de Script de Check

DADO que o script de `check` (ou `format:check`) está ausente no `package.json`
QUANDO o workflow de CI é gerado
ENTÃO deve injetar um comando de fallback (echo) no YAML para garantir que o pipeline seja sintaticamente válido e explicite a falta de automação.

---

## 5. Features Opt-in — Editoriais (📝) [BR-CLI-EDITORIAL]

> Features compiladas como blocos XML dentro de `<AI_GUIDELINES>`.
> **CLI source**: `cli/features/opt-in/editorial/`

### [BR-CLI-EDITORIAL-01] Taxonomia de Features

DADO o sistema de features opt-in
QUANDO classificadas
ENTÃO devem seguir duas categorias: **Editoriais** (geram blocos `<FEATURE_*>` no `AGENTS.md`) e **Infraestrutura** (modificam `package.json`, hooks, CI). A lista canônica é derivada de `EDITORIAL_FEATURES` e `INFRASTRUCTURE_FEATURES` em `cli/cli/args.mjs`.

### [BR-CLI-EDITORIAL-02] Compilação de Regras

DADO uma feature editorial ativa (ex: `quality-gates`, `tdd`, `bdd`)
QUANDO executada
ENTÃO deve injetar o template de `.core/rules/center/methodologies/<feature>.md` (TDD/BDD) ou `.core/rules/base/quality/<feature>.md` (quality-gates) no `AGENTS.md` do consumidor, dentro de uma tag `<FEATURE_*>`, respeitando idioma (`lang`) quando aplicável. A topologia física `.core/rules/{top,center,base,adapters}/` foi formalizada em 2.C — ver `.core/governance/ARCHITECTURE-REFERENCE.md` §6.

### [BR-CLI-EDITORIAL-03] Prune Individual

DADO uma feature editorial desativada com flag `--prune`
QUANDO executada
ENTÃO deve remover o bloco `<FEATURE_*>` correspondente do `AGENTS.md`, sem afetar conteúdo fora de `<AI_GUIDELINES>`.

### [BR-CLI-EDITORIAL-04] Proteção no Prune Global

DADO o motor de prune global
QUANDO recompila o bloco `<AI_GUIDELINES>`
ENTÃO deve preservar conteúdo do consumidor fora da tag mãe e remover apenas blocos governados por `FEATURE_*` que não estejam ativos.

---

## 6. Features Opt-in — Infraestrutura (⚡) [BR-CLI-INFRA]

> Features que modificam `package.json`, hooks e CI/CD do consumidor.
> **CLI source**: `cli/features/opt-in/infrastructure/`
> **Nota**: Não geram arquivos de regras no consumidor.

As business rules para features de infraestrutura estão documentadas nas seções anteriores:

- Prettier → [BR-CLI-SYNC-05](#br-cli-sync-05-gestão-inteligente-de-prettierignore), [BR-CLI-PKG-01](#br-cli-pkg-01-aborto-por-formatter-rival)
- Husky → [BR-CLI-HOOKS-01](#br-cli-hooks-01-pré-requisito-de-scripts), [BR-CLI-HOOKS-02](#br-cli-hooks-02-fusão-de-conteúdo-de-hook)
- CI → [BR-CLI-CI-01](#br-cli-ci-01-atualização-conservadora-de-workflow-existente) a [BR-CLI-CI-03](#br-cli-ci-03-fallback-de-script-de-check)

---

## 7. Proteção de Dados e Sanitização

### [BR-CLI-FS-01] Bloqueio de Inicialização em Raiz de Sistema

DADO que a CLI é chamada acidentalmente em pastas de sistema (Ex: `/`, `C:\`, `~`)
QUANDO validado o alvo
ENTÃO deve disparar um erro crítico e abortar a operação para evitar injeção de lixo em diretórios globais do usuário.

---

## 8. Processamento de Entrada [BR-CLI-INPUT]

### [BR-CLI-INPUT-01] Parsing de Flags e Argumentos

DADO argumentos via CLI
QUANDO o parser é executado
ENTÃO deve aceitar flags com `--` e valores separados por espaço ou `=`, tratando flags booleanas (`--force`, `--dry-run`, `--install`, `--prune`) de forma idempotente.

### [BR-CLI-INPUT-02] Validação de Modos Suportados

DADO um comando inserido pelo usuário
QUANDO validado pelo shell
ENTÃO deve permitir apenas `init` ou `adopt`, disparando a ajuda (`help`) em caso de comandos desconhecidos.

---

## 9. Entrada Guiada (Wizard) [BR-CLI-WIZARD]

### [BR-CLI-WIZARD-01] Ativação Automática (Interatividade)

DADO ausência de parâmetros obrigatórios (`init/adopt`, `--target`, etc.)
QUANDO a CLI detecta um ambiente interativo (TTY)
ENTÃO deve iniciar o Wizard automaticamente para capturar as informações necessárias do usuário.

### [BR-CLI-WIZARD-02] Resolução de Valores Padrão

DADO que o usuário pressiona `Enter` sem digitar uma resposta no Wizard
QUANDO em ambiente TTY
ENTÃO a CLI deve assumir os valores canônicos (`WIZARD_DEFAULTS`) definidos para o modo selecionado.

### [BR-CLI-WIZARD-03] Rigor de Validação (Retry Loop)

DADO uma entrada inválida fornecida pelo usuário no Wizard (ex: modo inexistente ou package manager não suportado)
QUANDO validado pelo prompt
ENTÃO deve emitir um alerta de erro e repetir a pergunta indefinidamente até que uma entrada válida seja fornecida, garantindo a integridade dos parâmetros de execução.

---

## 10. Orquestração de Alto Nível (Engine) [BR-CLI-ENG]

### [BR-CLI-ENG-01] Guarda de Inicialização (Conflict Check)

DADO o subcomando `init`
QUANDO executado em um diretório que já contém arquivos de baseline (ex: `AGENTS.md`)
ENTÃO deve abortar a execução com um erro explicativo para evitar corrupção de projetos existentes, a menos que `--force` seja explicitado.

### [BR-CLI-ENG-02] Automação de Instalação Pós-Adoção

DADO a adição de novas dependências durante o `adopt`
QUANDO detectado ambiente TTY
ENTÃO deve oferecer ao usuário a opção de instalar as dependências imediatamente usando o package manager detectado.

---

## Histórico de Versões (Gênese)

- **v0.1.0**: Mapeamento das regras core de sincronização e proteção de framework.
- **v0.2.0**: Mapeamento da camada de Shell (Input/Wizard/Engine).
- **v0.3.0**: Taxonomia Editorial/Infraestrutura e business rules de features opt-in.
- **v0.4.0**: Refatoração Monolítica (Spec 0017): Hierarquia semântica e injeção direta no `AGENTS.md`.
