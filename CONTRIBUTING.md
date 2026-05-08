# Como Contribuir

Obrigado pelo interesse em contribuir com o `ai-guidelines` BR! 🎉

Este repositório é **AI-governed**: humanos e agentes de IA seguem o mesmo fluxo de governança. Se você está usando uma IA para contribuir, oriente-a a ler [`AGENTS.md`](AGENTS.md) antes de qualquer ação.

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
4. Garanta CI verde (`yarn format` + `yarn check`)
5. Converta para **Ready** e solicite review de pelo menos 1 owner

**Sem spec necessária.**

### 2. 🛠️ Feature ou refactor (mais de 1 sessão, > 1 arquivo)

Quando: mudança que toca múltiplos arquivos fora de uma feature isolada, ou que precisa sobreviver a troca de IA/sessão para ser concluída.

```
backlog.md (candidata) → spec em .specify/specs/<slug>/ → branch → commits → PR Draft → CI → Ready → review
```

1. **Registre a intenção** — abra issue com label apropriado, ou proponha entrada em [`.specify/specs/roadmap/backlog.md`](.specify/specs/roadmap/backlog.md).
2. **Crie a fundação documental** em `.specify/specs/<slug>/` a partir dos templates SDD em [`.specify/templates/`](.specify/templates/):
   - `spec.md` — escopo e critérios de aceite (imutável após `In Review`)
   - `plan.md` — plano de implementação (vivo durante execução)
   - `tasks.md` — checklist de tarefas
   - `NEXT.md` — débitos adiados (apenas se houver; deletar no encerramento)
3. Crie **branch dedicada**: `feat/spec-XXXX-<slug>` (número sequencial alocado quando a candidata sai do backlog).
4. **Commits atômicos** por unidade lógica (não agrupe docs + código + config num commit só).
5. `yarn format` e `yarn check` antes de qualquer push.
6. Abra PR em **modo Draft** com matriz preenchida.
7. Trabalho finalizado + CI verde → converta para **Ready**.
8. Antes de pedir review, confirme a checklist técnica: spec/plan/tasks atualizados, decisões arquiteturais registradas em ADR quando necessário, `yarn format` + `yarn check` verdes, ausência de contexto pessoal/operacional vazado, e impacto downstream documentado.
9. Solicite review de pelo menos **1 owner** (ver [CODEOWNERS](.github/CODEOWNERS)).

### 3. 🧩 Spec consolidada (absorve candidatas relacionadas)

Quando: várias candidatas no backlog tocam o mesmo contrato e fazem mais sentido como uma spec única que como specs separadas.

**Critério canônico** (Spec 0008):

> "Se a entrega de uma altera o contrato da outra, fundir em uma spec única. Caso contrário, manter separadas."

1. Documentar a fusão na própria `spec.md` (seção "Decisão de Fusão").
2. Atualizar candidatas absorvidas em [`backlog.md`](.specify/specs/roadmap/backlog.md) com cross-ref à spec consolidada.
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

| Regra                          | Detalhe                            |
| :----------------------------- | :--------------------------------- |
| Nunca commitar em `main`       | Toda alteração em branch dedicada  |
| Commits atômicos               | Uma unidade lógica por commit      |
| PRs sempre em Draft            | CI verde → Ready → review de owner |
| `yarn format` antes do push    | CI valida formatação               |
| `yarn check` antes do push     | CI valida cobertura e testes       |
| Documentar decisões relevantes | ADR para mudanças arquiteturais    |
| Approval humano antes de push  | Aplica-se também a agentes IA      |

---

## Estrutura de governança (Single Source of Truth)

Cada conteúdo vive em **um único lugar**; outros documentos apenas linkam:

| Conteúdo                          | Vive em                            | Outros docs apenas linkam    |
| :-------------------------------- | :--------------------------------- | :--------------------------- |
| Workflow obrigatório do agente IA | `AGENTS.md`                        | README, CONTRIBUTING         |
| Princípios de engenharia (regras) | `.core/rules/global-rules.md`      | AGENTS, CONTRIBUTING, README |
| Como contribuir (humano)          | `CONTRIBUTING.md`                  | README                       |
| Lifecycle de specs                | `.core/process/spec-foundation.md` | AGENTS, CONTRIBUTING         |
| Visão geral do framework          | `README.md`                        | (raiz, ponto de entrada)     |

Antes de começar, leia:

- [`AGENTS.md`](AGENTS.md) — fluxo obrigatório, princípios de engenharia e workflow (humanos e agentes).
- [`.core/process/spec-foundation.md`](.core/process/spec-foundation.md) — quando abrir spec, como estruturar `spec.md`/`plan.md`/`tasks.md` e como fechar débitos/research.
- [`.specify/specs/roadmap/backlog.md`](.specify/specs/roadmap/backlog.md) — backlog e candidatas.

---

## Setup local de desenvolvimento

Este repositório é o **framework canônico**, não apenas um exemplo de consumo: alterações em `.core/`, `cli/` e nos templates SDD mudam o baseline distribuído via npm para todos os repositórios consumidores.

### Pré-requisitos

- **Node ≥ 22** (piso técnico real — scripts de teste usam flags experimentais disponíveis a partir do Node 22).
- **Yarn 4** com Plug'n'Play (gerenciado via `corepack enable`).

### Comandos canônicos

```bash
yarn install --immutable     # restaura node_modules sob PnP
yarn build:rules             # compila .core/rules/_meta/rules.json + ledger
yarn check                   # prettier check + build:rules
yarn test                    # suíte completa (unit + integration + smoke)
yarn check:repo              # pipeline canônico (install immutable + check + test:coverage)
```

### Operando a CLI a partir deste repositório

Use **`yarn guidelines …`** em vez de `npx ai-guidelines …`. O Yarn PnP garante que o código em desenvolvimento seja executado com resolução correta de dependências, sem depender do tarball publicado:

```bash
yarn guidelines init    --target ../meu-projeto --name meu-projeto
yarn guidelines adopt   --target ../repo-existente --dry-run
yarn guidelines update  --target ../repo --dry-run
```

Não use `node cli/ai-guidelines-cli.mjs …` direto — quebra resolução de imports `#cli/*`, `#features/*`, etc., sob PnP.

## Estrutura do repositório

```text
ai-guidelines/
├── .core/                      # Baseline canônico distribuído pela CLI
│   ├── rules/                  # Regras bilíngues (YAML + Markdown)
│   │   ├── _meta/              # Catálogo compilado (rules.json + ledger)
│   │   ├── opt-in/             # Regras vinculadas a features opcionais
│   │   └── catalog.md          # Catálogo navegável (humano)
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
├── docs/                       # Documentação exposta ao consumidor
├── adrs/                       # Decisões arquiteturais (ADRs)
├── tests/                      # Testes (integration + smoke)
├── .specify/specs/             # Specs SDD em execução + roadmap/
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
- Ao editar regras em `.core/rules/`, rode `yarn check` para reconstruir `rules.json` e o ledger.
- Ao editar a CLI, preserve o contrato entre `cli/cli/args.mjs`, `cli/app/engine.mjs` e `docs/cli/ai-guidelines-cli.md`.
- Features editoriais (`tdd`, `bdd`, `quality-gates`) e de infraestrutura (`prettier`, `husky`, `ci`) têm taxonomias distintas e não devem ser misturadas na documentação nem no wizard.
- Sequência de release (publish em registry npm) é cravada em [`.core/process/spec-foundation.md`](.core/process/spec-foundation.md) § "Sequência canônica para specs com publish em registry externo" — leia antes de qualquer trabalho que envolva publish.

---

## Dúvidas?

Abra uma issue no GitHub com um dos [templates disponíveis](.github/ISSUE_TEMPLATE).
Não precisa ser perfeita — contexto real é sempre bem-vindo.

---

_Licença: [Apache-2.0](LICENSE)_
