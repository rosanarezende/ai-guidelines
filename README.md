# ai-guidelines BR

> Estrutura de governança para desenvolvimento de software auxiliado por inteligência artificial, agnóstica em relação a modelos, ambientes de desenvolvimento integrados (IDEs) e linguagens de programação. Licença [Apache-2.0](LICENSE).

---

## O que é?

`ai-guidelines` é um framework concebidO para mitigar o desafio de manter a coerência técnica e editorial ao **integrar múltiplos agentes de IA** (como o Claude, Gemini ou Codex) em projetos de desenvolvimento.

Este repositório é o **framework canônico**, não apenas um exemplo de consumo. Alterações em `.core/`, `cli/` e nos templates mudam o baseline distribuído para repositórios consumidores.

A ferramenta centraliza a governança num único ponto, resolvendo problemas comuns de desorganização através de:

- _Distribuição via CLI_: Aplicação automatizada e limpa de regras universais em qualquer repositório.
- _Governança Multi-agente_: Regras de atuação agnósticas que operam independentemente do Large Language Model (LLM) utilizado.
- _Modularidade (Opt-in)_: Configuração flexível de ferramentas de qualidade e estilo (como Prettier, Husky ou processos de CI).

**Não é uma solução definitiva.** É um caso vivo, em evolução pública — desenhado para ser adotado, criticado e contribuído pela comunidade brasileira de desenvolvedores.

---

## Como utilizar

As diretrizes variam de acordo com o perfil de atuação no projeto:

### 🚀 Para Desenvolvedores

A gestão das regras do projeto é feita através da Interface de Linha de Comandos (CLI):

```bash
# Para novos projetos — Inicialização com arquitetura AI-first:
yarn cli init --target ../meu-projeto --name meu-projeto

# Para repositórios existentes — Adoção conservadora (sem substituição silenciosa):
yarn cli adopt --target ../repo-existente --dry-run   # Modo de pré-visualização
yarn cli adopt --target ../repo-existente             # Aplicação definitiva
```

> Nota: A execução da CLI sem argumentos inicia automaticamente um assistente de configuração interativo.
> Em desenvolvimento local neste repositório, use `yarn cli ...` para garantir a resolução de dependências em ambiente Yarn PnP.
> Em CI, use flags explícitas. Detalhes em [Documentação de Features](docs/features.md).

### 🛠️ Para Contribuidores

A leitura do documento [`CONTRIBUTING.md`](CONTRIBUTING.md) é recomendada para o entendimento completo do fluxo de trabalho. Em suma:

- **Correções menores (Bugs, pequenas fricções):** abrir issue ou Pull Request (PR) em estado de rascunho (Draft).
- **Alterações de arquitetura ou novas funcionalidades:** registrar em [`backlog.md`](.specify/specs/roadmap/backlog.md) → criar spec em `.specify/specs/<slug>/` a partir dos templates SDD → branch → PR Draft.

Comunidade ai-guidelines BR aceita contribuições em PT-BR e EN.

Para desenvolver o próprio framework localmente:

```bash
yarn install --immutable
yarn build:rules
yarn check
yarn test
yarn check:repo
```

### 🤖 Para Agentes de IA

Ler [`AGENTS.md`](AGENTS.md): "FASE 1: The Prime Directive" e workflow canônico de IA em seção "Workflow com IA" obrigatórios.
Ciclo SDD descrito em [`.core/process/spec-foundation.md`](.core/process/spec-foundation.md).

---

## O que está incluído

### Regras e protocolos

| Arquivo                            | Propósito                                      |
| :--------------------------------- | :--------------------------------------------- |
| `AGENTS.md`                        | Fluxo obrigatório para IA e humanos neste repo |
| `docs/rpi-protocol.md`             | Ciclo Research → Plan → Implement              |
| `.core/process/spec-foundation.md` | Lifecycle de specs e SDD versionado            |
| `docs/tdd-guidelines.md`           | Padrões BDD e cobertura                        |
| `docs/cli/ai-guidelines-cli.md`    | Constituição (Business Rules) da CLI           |
| `.core/rules/_meta/rules.json`     | Catálogo consolidado de regras em JSON         |
| `.core/rules/catalog.md`           | Catálogo navegável e documentação humana       |

### CLI `init`, `adopt` e `ai:check`

O CLI vive em `cli/` e suporta:

- `init` — baseline AI-first para projeto novo
- `adopt` — adoção conservadora em repo existente
- `yarn ai:check` — CLI de auditoria (Quality Gates e Token Linting)
- Wizard interativo em TTY
- Detecção de formatter rival (`biome`, `dprint`, `rome`, `standard`)
- Detecção de monorepo (npm/yarn/bun/pnpm workspaces)
- EOL awareness no Windows
- `--dry-run` — preview antes de qualquer escrita
- `--force` — atualização explícita quando o diff está entendido
- Runtime monolítico em `AGENTS.md`, delimitado por `<AI_GUIDELINES>`
- Opt-ins editoriais compilados em tags XML (`<FEATURE_TDD>`, `<FEATURE_BDD>`, etc.)
- Gerenciamento de Token Budget (soft ceilings) baseado na heurística Tok-H

Saiba mais sobre os módulos disponíveis em
[Documentação de Features](docs/features.md).

---

## Matriz de Compatibilidade (adaptadores por IA)

| IA / Ferramenta    | Ponto de entrada                                      | Status       |
| :----------------- | :---------------------------------------------------- | :----------- |
| Claude Code        | `AGENTS.md` com `Adaptador: Claude (Anthropic)`       | ✅ Suportado |
| Gemini CLI         | `AGENTS.md` com `Adaptador: Gemini (Google)`          | ✅ Suportado |
| Codex / OpenAI CLI | `AGENTS.md` com `Adaptador: Codex / Copilot (OpenAI)` | ✅ Suportado |
| GitHub Copilot     | `AGENTS.md` com `Adaptador: Codex / Copilot (OpenAI)` | ⚡ Parcial   |
| Outras IAs         | `AGENTS.md` como baseline                             | 🔄 Esperado  |

---

## Estrutura do repositório

```text
ai-guidelines/
├── .core/                      # Baseline canônico (consumido pelo CLI)
│   ├── rules/                  # Regras bilíngues (YAML + Markdown)
│   │   ├── _meta/              # Catálogo compilado (rules.json e ledger)
│   │   ├── opt-in/             # Regras vinculadas a features opcionais
│   │   └── catalog.md          # Catálogo navegável (humano)
│   └── templates/              # Templates injetados pelo init/adopt no repo alvo
├── cli/                        # CLI local (ai-guidelines-cli.mjs)
│   ├── app/                    # Engine, orquestração e UI
│   ├── cli/                    # Parser de argumentos e Wizard
│   ├── commands/               # Comandos de auditoria (ai-check.mjs)
│   ├── fs/                     # I/O, file-system e merge-utils
│   ├── governance/             # Compiladores e Motores de Análise
│   │   ├── monolith/           # Rules Builder, Parser e Token Budget
│   │   ├── quality-gates/      # Sensores baseados no rules.json
│   │   └── evaluation/         # Eval Runner (agregação de violações)
│   ├── features/               # Módulos de funcionalidade (Features)
│   │   ├── core/               # pointers (compiler), gitattributes
│   │   └── opt-in/             #
│   │       ├── editorial/      # tdd, bdd, quality-gates (injetados no monólito)
│   │       └── infrastructure/ # prettier, husky, ci (modificam package.json/hooks)
│   └── formatters/             # Detecção de PM, formatter rival, monorepo
├── docs/                       # Documentação exposta ao consumidor
│   ├── cli/                    # Business Rules da CLI
│   ├── process/                # Lifecycle SDD e spec-foundation
│   └── features.md             # Guia de features do baseline
├── adrs/                       # Decisões arquiteturais
├── tests/                      # Testes de integração
├── .specify/specs/             # Evolução do próprio framework (SDD) + roadmap/
├── AGENTS.md                   # Fluxo obrigatório deste repositório
├── CONTRIBUTING.md             # Como contribuir
├── CODE_OF_CONDUCT.md          # Código de conduta
├── SECURITY.md                 # Política de segurança
├── LICENSE                     # Apache-2.0
├── CHANGELOG.md                # Histórico de versões
└── README.md                   # Este arquivo
```

---

## Roadmap

O backlog vivo está em [`.specify/specs/roadmap/backlog.md`](.specify/specs/roadmap/backlog.md);
specs concluídas em [`.specify/specs/roadmap/historico.md`](.specify/specs/roadmap/historico.md).

Próximas iniciativas:

- Refinamento de processos (Research Lifecycle, concorrência de specs) [In Progress]
- Migração TypeScript da CLI (`cli-typescript`)
- Publicação como package npm (`@ai-guidelines/core`)
- CLI `audit` para detecção de conflitos em configs globais de IA

---

## Versionamento

Seguimos [Semantic Versioning](https://semver.org/lang/pt-BR/).
Histórico completo em [CHANGELOG.md](CHANGELOG.md).
Versão atual: consultar a release mais recente no `CHANGELOG.md` e no `package.json`.

---

## Decisões arquiteturais

| ADR                                                             | Decisão                                            |
| :-------------------------------------------------------------- | :------------------------------------------------- |
| [ADR 0003](adrs/0003-cobertura-framework.md)                    | Cobertura e framework de testes                    |
| [ADR 0004](adrs/0004-governance-single-responsibility.md)       | Governança de responsabilidade única               |
| [ADR 0005](adrs/0005-curadoria-publico-privado.md)              | Curadoria público/privado                          |
| [ADR 0006](adrs/0006-licenca.md)                                | Licença Apache-2.0                                 |
| [ADR 0007](adrs/0007-visibilidade-publica-ai-guidelines.md)     | Visibilidade pública: fresh repo + snapshot curado |
| [ADR 0008](adrs/0008-monolithic-runtime-compiler-governance.md) | Governança Monolítica (Runtime Compiler)           |

---

## Licença

[Apache-2.0](LICENSE) © 2026 Rosana Rezende

**Síntese das Condições de Utilização:**

A utilização, cópia, modificação e distribuição deste software — incluindo para fins comerciais — é permitida.

O que você **precisa fazer:**

- Manter o aviso de copyright nos arquivos que distribuir
- Informar se fez modificações
- Incluir uma cópia da licença

O que **não pode:**

- Usar o nome do projeto ou da autora para endossar seus produtos
- Processar contribuidores por patentes relacionadas ao código que eles
  contribuíram (a licença inclui concessão explícita de patentes — §3)

**Por que Apache-2.0 e não MIT?**
Ambas são permissivas. A diferença prática: Apache-2.0 tem uma cláusula
explícita de concessão de patentes (§3), que protege quem usa e contribui
com o framework. MIT é silêncio jurídico nesse ponto. Para um framework
adotado por equipes e empresas, essa proteção é relevante.

> Texto legal completo: [LICENSE](LICENSE)
