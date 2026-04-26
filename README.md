# ai-guidelines BR

> Case study vivo de governança de IA multi-agente em desenvolvimento de
> software. Agnóstico de modelo, IDE e linguagem. Licença [Apache-2.0](LICENSE).

---

## O que é (e o que não é)

`ai-guidelines` é uma resposta concreta a uma dor real que o mantenedor
enfrentou ao montar workflows com IA: **como manter coerência editorial e
governança técnica entre múltiplos agentes (Claude, Gemini, Codex) sem
reescrever as mesmas regras em N lugares**.

**Não é uma solução definitiva.** É um caso vivo, opinionated, em evolução
pública — desenhado para ser adotado, criticado e contribuído pela comunidade
brasileira de desenvolvedores.

### Vs. [GitHub Spec Kit](https://github.com/github/spec-kit)

Sobreposição de ~30% (ambos aplicam Spec-Driven Development como
metodologia). Diferenciação real:

| Aspecto              | spec-kit (GitHub)               | ai-guidelines                                                    |
| :------------------- | :------------------------------ | :--------------------------------------------------------------- |
| Distribuição         | Slash commands (template-based) | Pointer architecture (`adopt` puxa rules vivas)                  |
| Surface              | GitHub-native                   | Multi-agent agnóstico (Claude / Gemini / Codex / Cursor)         |
| Governança editorial | Implícita                       | First-class (ADRs, single source of truth, RPI loop)             |
| Composição de regras | Não tem                         | Opt-in features composable (prettier, husky, ci, quality-gates)  |
| Comunidade           | Internacional                   | BR-first (PT-BR, contribuição open source para comunidade local) |

São complementares, não competidores. Quem usa spec-kit ganha methodology;
quem usa ai-guidelines ganha methodology + distribuição via CLI + governança
multi-agente + composição opt-in.

---

## Para começar

Três caminhos por persona:

### 🚀 Quero usar o framework no meu repo

```bash
# Projeto novo — nasce AI-first desde o primeiro commit
node cli/ai-guidelines-cli.mjs init --target ../meu-projeto --name meu-projeto --package-manager npm

# Repo existente — adoção conservadora, nunca sobrescreve silenciosamente
node cli/ai-guidelines-cli.mjs adopt --target ../repo-existente --dry-run   # preview
node cli/ai-guidelines-cli.mjs adopt --target ../repo-existente             # aplica
```

> Em terminal interativo, o CLI abre wizard quando faltam argumentos. Em CI,
> use flags explícitas. Detalhes em [Documentação de Features](docs/features.md).

### 🛠️ Quero contribuir

Ler [`CONTRIBUTING.md`](CONTRIBUTING.md) para o fluxo completo. Atalhos:

- **Bug, fricção, ideia pequena:** abrir issue ou PR Draft direto.
- **Feature / refactor maior:** registrar em
  [`backlog.md`](.specify/specs/roadmap/backlog.md) → criar spec em
  `.specify/specs/<slug>/` a partir dos templates SDD → branch → PR Draft.

Comunidade ai-guidelines BR aceita contribuições em PT-BR e EN.

### 🤖 Sou agente IA atuando neste repo

Ler [`AGENTS.md`](AGENTS.md) (Phase 0 obrigatório). Ciclo SDD descrito em
[`docs/process/spec-foundation.md`](docs/process/spec-foundation.md).
Workflow canônico de IA em
[`.core/rules/global-rules.md`](.core/rules/global-rules.md) seção
"Workflow com IA".

---

## Por que existe

Conforme a IA entrou no desenvolvimento de software, ficou claro que o problema
não é apenas "ter acesso a um bom modelo". O problema real é:

- cada repositório inventar seu próprio ritual de uso de IA;
- agentes trabalharem sem contexto suficiente ou regras explícitas;
- falta de continuidade entre sessões;
- adoção difícil em projetos que já existem;
- dependência excessiva de uma única ferramenta.

O `ai-guidelines` se propõe a mitigar esses sintomas com uma base prática de
governança: regras universais, protocolos de planejamento e execução,
templates, um CLI `init + adopt`, e documentação pensada para humanos e
agentes operarem o mesmo contrato.

---

## O que está incluído

### Regras e protocolos

| Arquivo                           | Propósito                                      |
| :-------------------------------- | :--------------------------------------------- |
| `AGENTS.md`                       | Fluxo obrigatório para IA e humanos neste repo |
| `.core/rules/global-rules.md`     | Princípios agnósticos de engenharia AI-first   |
| `docs/rpi-protocol.md`            | Ciclo Research → Plan → Implement              |
| `docs/process/spec-foundation.md` | Lifecycle de specs e SDD versionado            |
| `docs/tdd-guidelines.md`          | Padrões BDD e cobertura                        |
| `docs/cli/ai-guidelines-cli.md`   | Constituição (Business Rules) da CLI           |

### Adapters por ferramenta

| Arquivo                 | Ferramenta              |
| :---------------------- | :---------------------- |
| `.core/rules/claude.md` | Claude Code / Anthropic |
| `.core/rules/gemini.md` | Gemini CLI / Google     |
| `.core/rules/codex.md`  | Codex / OpenAI          |

### Processos reutilizáveis

Em `docs/` estão os guias públicos de processos operacionais:

- Fundação de specs (`docs/process/spec-foundation.md`) — lifecycle de SDD.
- RPI Protocol (`docs/rpi-protocol.md`) — Ciclo Research → Plan → Implement.
- TDD Guidelines (`docs/tdd-guidelines.md`) — padrões de testes e cobertura.

### CLI `init + adopt`

O CLI vive em `cli/` e suporta:

- `init` — baseline AI-first para projeto novo
- `adopt` — adoção conservadora em repo existente
- Wizard interativo em TTY
- Detecção de formatter rival (`biome`, `dprint`, `rome`, `standard`)
- Detecção de monorepo (npm/yarn/bun/pnpm workspaces)
- EOL awareness no Windows
- `--dry-run` — preview antes de qualquer escrita
- `--force` — atualização explícita quando o diff está entendido

Saiba mais sobre os módulos disponíveis em
[Documentação de Features](docs/features.md).

---

## Compatibilidade

| IA / Ferramenta    | Entrada                                 | Status       |
| :----------------- | :-------------------------------------- | :----------- |
| Claude Code        | `AGENTS.md` + `.core/rules/claude.md`   | ✅ Suportado |
| Gemini CLI         | `AGENTS.md` + `.core/rules/gemini.md`   | ✅ Suportado |
| Codex / OpenAI CLI | `AGENTS.md` + `.core/rules/codex.md`    | ✅ Suportado |
| GitHub Copilot     | instruções específicas quando aplicável | ⚡ Parcial   |
| Outras IAs         | `AGENTS.md` como baseline               | 🔄 Esperado  |

---

## Estrutura do repositório

```text
ai-guidelines/
├── .core/                      # Baseline canônico (consumido pelo CLI)
│   ├── rules/                  # Regras universais + adapters por IA (claude/gemini/codex)
│   └── templates/              # Templates injetados pelo init/adopt no repo alvo
├── cli/                        # CLI local (ai-guidelines-cli.mjs)
│   ├── core/                   # Engine, file-system, cli-input, content-merge
│   ├── features/               # core/ (pointers, rules, gitattributes) + opt-in/ (prettier, husky, ci)
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

O backlog vivo está em
[`.specify/specs/roadmap/backlog.md`](.specify/specs/roadmap/backlog.md);
specs concluídas em
[`.specify/specs/roadmap/historico.md`](.specify/specs/roadmap/historico.md).

Próximas iniciativas:

- Publicação como package npm (`@ai-guidelines/core`)
- CLI `audit` para detecção de conflitos em configs globais de IA
- Adapters opt-in para integração com GitHub Projects / Jira / Linear
- Automações cross-repo e expansão do ecossistema

---

## Versionamento

Seguimos [Semantic Versioning](https://semver.org/lang/pt-BR/).
Histórico completo em [CHANGELOG.md](CHANGELOG.md).
Versão atual: consultar a release mais recente no `CHANGELOG.md` e no
`package.json`.

---

## Decisões arquiteturais

| ADR                                                         | Decisão                                            |
| :---------------------------------------------------------- | :------------------------------------------------- |
| [ADR 0003](adrs/0003-cobertura-framework.md)                | Cobertura e framework de testes                    |
| [ADR 0004](adrs/0004-governance-single-responsibility.md)   | Governança de responsabilidade única               |
| [ADR 0005](adrs/0005-curadoria-publico-privado.md)          | Curadoria público/privado                          |
| [ADR 0006](adrs/0006-licenca.md)                            | Licença Apache-2.0                                 |
| [ADR 0007](adrs/0007-visibilidade-publica-ai-guidelines.md) | Visibilidade pública: fresh repo + snapshot curado |

---

## Licença

[Apache-2.0](LICENSE) © 2026 Rosana Rezende

**TL;DR em português:**

Você pode usar, copiar, modificar e distribuir este projeto — inclusive em
produtos comerciais — sem precisar pedir permissão.

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
