# Como Contribuir

Obrigado pelo interesse em contribuir com o `ai-guidelines` BR! 🎉

Este repositório é **AI-governed**: humanos e agentes de IA seguem o mesmo fluxo de governança. Se você está usando uma IA para contribuir, oriente-a a ler [`AGENTS.md`](AGENTS.md) antes de qualquer ação.

> **Fluxo completo de desenvolvimento** (do research ao merge, com todos os comandos): [`WORKFLOW.md`](WORKFLOW.md).

Contribuições em PT-BR e EN são bem-vindas.

---

## Formas de contribuir

Contribuir não precisa ser um Pull Request. Você pode:

- Apontar uma ambiguidade na documentação
- Relatar uma fricção ao usar `init` ou `adopt`
- Sugerir adaptação para um caso de uso real (Python, Go, monorepos, etc.)
- Propor melhoria de exemplos ou onboarding
- Abrir discussão sobre compatibilidade com outra IA ou ambiente

Se for abrir issue, use os templates em [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/) — eles te ajudam a estruturar o relato de forma útil.

---

## Workflows por persona

Quatro caminhos, escolha o que se aplica ao seu caso:

### 1. 🩹 Ajuste rápido (typo, wording, bug pequeno)

Quando: mudança trivial, ≤ 1 arquivo, sem decisão arquitetural envolvida.

```
main → branch dedicada → commit atômico → PR Draft → CI verde → Ready → review
```

1. Crie branch: `fix/descricao-curta` ou `docs/descricao-curta`
2. Faça o ajuste
3. Abra PR em **modo Draft** usando o template [`.github/pull_request_template.md`](.github/pull_request_template.md)
4. Garanta CI verde (`yarn format` + `yarn validate`)
5. Converta para **Ready** e solicite review de pelo menos 1 owner

**Sem spec necessária.**

### 2. 🛠️ Feature ou refactor (mais de 1 sessão, > 1 arquivo)

Quando: mudança que toca múltiplos arquivos fora de uma feature isolada, ou que precisa sobreviver a troca de IA/sessão para ser concluída.

```
backlog.md (candidata) → spec → branch → implementação (stacked PRs) → closure na branch → merge
```

> Fluxo detalhado com todos os comandos: [`WORKFLOW.md`](WORKFLOW.md).

1. **Registre a intenção** — proponha entrada em [`.governance/specs/roadmap/backlog.md`](.governance/specs/roadmap/backlog.md) como candidata.
2. **Crie a fundação documental** em `.governance/specs/<NNNN>-<slug>/` a partir dos templates em [`.specify/templates/`](.specify/templates/):
   - `spec.md` — escopo e critérios de aceite (imutável após `In Review`)
   - `plan.md` — plano de implementação (vivo durante execução)
   - `tasks.md` — checklist de tarefas
   - `NEXT.md` — débitos adiados (apenas se houver; **deletado na branch antes do merge**)
3. Crie **branch dedicada**: `feat/spec-XXXX-<slug>`.
4. **Commits atômicos** por unidade lógica.
5. `yarn validate` antes de qualquer push (hook `pre-push` roda automaticamente).
6. Abra PRs em **modo Draft**, converta para Ready quando CI verde.
7. **Feche a branch antes do merge** (Estágio 5 do `WORKFLOW.md`): spec Done, state.yml done, NEXT.md deletado, historico/backlog/research atualizados. O merge não acontece com trabalho pendente na branch.
8. Solicite review de pelo menos **1 owner** (ver [CODEOWNERS](.github/CODEOWNERS)).

### 3. 🧩 Spec consolidada (absorve candidatas relacionadas)

Quando: várias candidatas no backlog tocam o mesmo contrato e fazem mais sentido como uma spec única que como specs separadas.

**Critério canônico** (Spec 0008):

> "Se a entrega de uma altera o contrato da outra, fundir em uma spec única. Caso contrário, manter separadas."

1. Documentar a fusão na própria `spec.md` (seção "Decisão de Fusão").
2. Atualizar candidatas absorvidas em [`backlog.md`](.governance/specs/roadmap/backlog.md) com cross-ref à spec consolidada (entradas legadas em [`.specify/specs/roadmap/backlog.md`](.specify/specs/roadmap/backlog.md) migram caso-a-caso).
3. Seguir workflow 2 a partir daí.

### 4. 🤖 Agente IA com autonomia

Quando: você está executando trabalho via Claude Code, Gemini CLI, Codex, Cursor, Antigravity ou similar.

1. Ler [`AGENTS.md`](AGENTS.md) - directive "FASE 1: The Prime Directive" obrigatória (Environment Check e persistência).
2. Ler [`AGENTS.md`](AGENTS.md) seção **"Regras Globais"** — princípios de engenharia e workflow universais aplicáveis ao agente.
3. Seguir **PR description colaborativo (3 etapas)**:
   - Listar tópicos relevantes para validação humana **antes** do texto final;
   - Só escrever o texto após o humano editar/aprovar a lista;
   - Submeter o texto final para um último check humano antes de criar/editar o PR.
4. Aprovação humana explícita obrigatória antes de `git push`.

---

## Achados fora de spec ativa

Durante o trabalho aparecem insights, bugs ou débitos que **não** pertencem ao escopo da spec corrente (ou surgem fora de qualquer spec ativa). **Nunca silenciar o achado** — o mínimo é registrar. Use a tabela abaixo para decidir o destino:

| Natureza do achado                                                | Destino canônico                                                                                                                                         |
| :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trivial e local (typo, wording, ajuste de 1 arquivo)              | PR direto pequeno (pillar `fix`). Sem spec.                                                                                                              |
| Exige decisão arquitetural ou cruza com spec futura               | Entrada em [`.governance/specs/roadmap/backlog.md`](.governance/specs/roadmap/backlog.md) como candidata, com link de evidência (issue, PR, comentário). |
| Urgente operacionalmente (build quebrando, bloqueador de release) | Spec rápida (pillar `patch`) ou incident.                                                                                                                |
| Dentro de spec ativa, mas extrapolando o escopo declarado         | Entrada no `NEXT.md` da spec corrente (débito adiado com critério de revisita).                                                                          |

**Por que isso importa:** sem essa convenção, achados arquiteturais legítimos viram cleanup silencioso dentro da spec errada (e poluem o diff), ou desaparecem completamente entre sessões. A entrada na backlog candidata é o nível mínimo de persistência que garante: (a) o achado sobrevive, (b) tem cross-ref de origem, (c) entra na fila normal de priorização junto às demais candidatas.

> **Localização do backlog:** entradas novas vão em `.governance/specs/roadmap/backlog.md` (canônico em diante, conforme [ADR 0019](.core/governance/adrs/0019-governance-specs-root-in-maintainer.md)). O backlog legado em `.specify/specs/roadmap/backlog.md` permanece como referência histórica; entradas pré-existentes lá serão migradas caso-a-caso.

---

## Convenções de commit

Conventional Commits em PT-BR (ou EN):

```
<tipo>(escopo): <descrição>

feat(cli): adicionar flag --dry-run ao comando adopt
fix(engine): corrigir detecção de monorepo no Windows
docs(readme): atualizar tabela de compatibilidade
chore(ci): atualizar threshold de cobertura para 85%
```

**Tipos aceitos:** `feat`, `fix`, `docs`, `test`, `chore`, `refactor`,
`style`.

---

## Padrões obrigatórios

| Regra                          | Detalhe                                                                                 |
| :----------------------------- | :-------------------------------------------------------------------------------------- |
| Nunca commitar em `main`       | Toda alteração em branch dedicada                                                       |
| Commits atômicos               | Uma unidade lógica por commit                                                           |
| PRs sempre em Draft            | CI verde → Ready → review de owner                                                      |
| `yarn format` antes do push    | CI valida formatação                                                                    |
| `yarn validate` antes do push  | Cobre format:check + build:all + test + living-docs:check (idêntico ao `pre-push` hook) |
| Documentar decisões relevantes | ADR para mudanças arquiteturais                                                         |
| Approval humano antes de push  | Aplica-se também a agentes IA                                                           |

---

## Estrutura de governança (Single Source of Truth)

Cada conteúdo vive em **um único lugar**; outros documentos apenas linkam:

| Conteúdo                          | Vive em                                  | Outros docs apenas linkam    |
| :-------------------------------- | :--------------------------------------- | :--------------------------- |
| Workflow obrigatório do agente IA | `AGENTS.md`                              | README, CONTRIBUTING         |
| Princípios de engenharia (regras) | `.core/rules/global-rules.md`            | AGENTS, CONTRIBUTING, README |
| Como contribuir (humano)          | `CONTRIBUTING.md`                        | README                       |
| Lifecycle de specs                | `.core/process/governance-foundation.md` | AGENTS, CONTRIBUTING         |
| Visão geral do framework          | `README.md`                              | (raiz, ponto de entrada)     |

Antes de começar, leia:

- [`AGENTS.md`](AGENTS.md) — fluxo obrigatório, princípios de engenharia e workflow (humanos e agentes).
- [`.core/process/governance-foundation.md`](.core/process/governance-foundation.md) — quando abrir spec, como estruturar `spec.md`/`plan.md`/`tasks.md` e como fechar débitos/research.
- [`.governance/specs/roadmap/backlog.md`](.governance/specs/roadmap/backlog.md) — backlog e candidatas (canônico). O legado em [`.specify/specs/roadmap/backlog.md`](.specify/specs/roadmap/backlog.md) permanece como referência histórica até cutover caso-a-caso.

---

## Setup local de desenvolvimento

Este repositório é o **framework canônico**, não apenas um exemplo de consumo: alterações em `.core/`, `cli/` e nos templates SDD mudam o baseline distribuído via npm para todos os repositórios consumidores.

### Pré-requisitos

- **Node ≥ 22** (piso técnico real — scripts de teste usam flags experimentais disponíveis a partir do Node 22).
- **Yarn 4** com Plug'n'Play (gerenciado via `corepack enable`).

### Comandos canônicos

```bash
yarn setup                   # = install --immutable + build:all
yarn format                  # prettier --write
yarn validate                # gate local: format:check + build:all + test + living-docs:check
```

> **Referência única dos scripts:** [`docs/scripts.md`](docs/scripts.md) tem o mapa completo — categorias, composição, hooks de git, workflows de CI, cadeia canônica. Não duplicado aqui.

### Operando a CLI a partir deste repositório

Use **`yarn guidelines …`** em vez de `npx ai-guidelines …`. O Yarn PnP garante que o código em desenvolvimento seja executado com resolução correta de dependências, sem depender do tarball publicado:

```bash
yarn guidelines init    --target ../meu-projeto --name meu-projeto
yarn guidelines adopt   --target ../repo-existente --dry-run
yarn guidelines update  --target ../repo --dry-run
```

Não use `node cli/ai-guidelines-cli.mjs …` direto — quebra resolução de imports `#cli/*`, `#features/*`, etc., sob PnP.

### Operando o ciclo da spec (workflow runtime, Spec 0023)

Para conduzir o ciclo de uma spec (não para distribuir baseline), use os comandos do workflow runtime. Todos têm `--help`; o wizard sem argumentos lista as opções.

| Comando                                             | Para quê                                                                                                                                                      |
| :-------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `yarn guidelines workflow`                          | Wizard operacional: navegar specs ativas, retomar, publicar estado, drift, abrir Integration PR, merge atômico (modos `unit`/`sequential` — ver docs/cli §11) |
| `yarn guidelines continue [<id\|slug>]`             | Briefing da spec ativa + gate de execução (recusa narrativa se não autorizada)                                                                                |
| `yarn guidelines review [<pr>]`                     | Reúne/estrutura os comentários de review de um PR (read-only) para colar na IA                                                                                |
| `yarn guidelines workflow publish-state --status=…` | Projeta o estado interno da spec no índice público `active-specs.yml`                                                                                         |
| `yarn guidelines release-prep [--version <v>]`      | Prepara a release da stack com plano explícito (`--dry-run` audita sem aplicar)                                                                               |

> Referência completa dos comandos e flags: `yarn guidelines --help` e [`docs/cli/ai-guidelines-cli.md`](docs/cli/ai-guidelines-cli.md) §11. Detalhe do ciclo de boundaries (tasks/review/release-log) em [`.core/process/governance-foundation.md`](.core/process/governance-foundation.md).

## Estrutura do repositório

```text
ai-guidelines/
├── .core/                      # Baseline canônico distribuído pela CLI
│   ├── rules/                  # Regras bilíngues (YAML + Markdown)
│   │   ├── _meta/              # Catálogo compilado (rules.json + ledger)
│   │   ├── opt-in/             # Regras vinculadas a features opcionais
│   │   └── catalog.md          # Catálogo navegável (humano)
│   ├── governance/             # ADRs (adrs/), GOVERNANCE-CATALOG, recipes, partials
│   ├── process/                # governance-foundation.md (lifecycle canônico)
│   └── templates/              # Templates injetados pelo init/adopt
├── cli/                        # CLI (ai-guidelines-cli.mjs)
│   ├── app/                    # Engine, orquestração, UI
│   ├── cli/                    # Parser de args + Wizard
│   ├── commands/               # Comandos de auditoria (ai-check.mjs)
│   ├── fs/                     # I/O, file-system, merge-utils
│   ├── governance/             # Compiladores e motores de análise
│   │   ├── monolith/           # Rules Builder, Parser, Token Budget
│   │   ├── quality-gates/      # Sensores baseados em rules.json
│   │   └── evaluation/         # Eval Runner
│   ├── features/               # Módulos de funcionalidade
│   │   ├── core/               # pointers (compiler), gitattributes
│   │   └── opt-in/
│   │       ├── editorial/      # tdd, bdd, quality-gates
│   │       └── infrastructure/ # prettier, husky, ci
│   └── formatters/             # Detecção de PM, formatter rival, monorepo
├── src/                        # Re-arquitetura DDD da CLI + workflow runtime (Spec 0023)
├── docs/                       # Documentação exposta ao consumidor
├── tests/                      # Testes (integration + smoke)
├── .governance/                # SSOT canônica (ADR 0019): specs/ (+ roadmap/, research-library/), registry.yml, runtime/
├── .specify/                   # Legado: specs/ (bridge via double-lookup) + templates/ (boilerplates distribuídos)
├── AGENTS.md                   # Fluxo obrigatório deste repositório
├── CONTRIBUTING.md             # Este arquivo
├── LICENSE                     # Apache-2.0
├── CHANGELOG.md                # Histórico de versões
└── README.md                   # Landing pública (npm + GitHub)
```

## Convenções internas do framework

Algumas regras locais importam para evitar drift:

- `AGENTS.md` é ao mesmo tempo documento operacional local **e** artefato runtime de exemplo.
- O bloco `<AI_GUIDELINES>` em `AGENTS.md` é compilado a partir das regras em `.core/rules/`; contexto local do repositório fica **fora** dele.
- Ao editar regras em `.core/rules/`, rode `yarn build:rules` (ou `yarn build:all`) para reconstruir `rules.json` e o ledger.
- Ao editar a CLI, preserve o contrato entre `cli/cli/args.mjs`, `cli/app/engine.mjs` e `docs/cli/ai-guidelines-cli.md`.
- Features editoriais (`tdd`, `bdd`, `quality-gates`) e de infraestrutura (`prettier`, `husky`, `ci`) têm taxonomias distintas e não devem ser misturadas na documentação nem no wizard.
- Sequência de release (publish em registry npm) é cravada em [`.core/process/governance-foundation.md`](.core/process/governance-foundation.md) § "Sequência canônica para specs com publish em registry externo" — leia antes de qualquer trabalho que envolva publish.

---

## Dúvidas?

Abra uma issue no GitHub com um dos [templates disponíveis](.github/ISSUE_TEMPLATE).
Não precisa ser perfeita — contexto real é sempre bem-vindo.

---

_Licença: [Apache-2.0](LICENSE)_
