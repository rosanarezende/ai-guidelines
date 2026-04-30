# 🚀 Features do ai-guidelines

O `ai-guidelines` é organizado em módulos de funcionalidade (Features), divididos entre **Core** (essenciais para a governança) e **Opt-in** (ferramental de suporte).

## 🛠️ Features Core (Mandatórias)

Estas funcionalidades são aplicadas automaticamente para garantir a integridade da governança AI-First.

### 1. Runtime AGENTS.md

- **O que faz**: Compila o runtime de governança dentro da tag `<AI_GUIDELINES>` no `AGENTS.md` da raiz.
- **Por que**: Garante que qualquer IA que leia `AGENTS.md` receba diretivas, regras globais, adapters e opt-ins em um único artefato topológico, preservando regras próprias do projeto fora da tag.
- **Arquivos**: `AGENTS.md`.

### 2. Rules Compiler

- **O que faz**: Lê as regras modulares em `.core/rules/` e as injeta no bloco `<AI_GUIDELINES>`.
- **Por que**: Mantém modularidade no source do framework sem espalhar arquivos de regras no consumidor.
- **Arquivos**: `AGENTS.md`.

### 3. Gitattributes

- **O que faz**: Normaliza o final de linha (EOL) e garante a persistência correta dos arquivos de governança.
- **Por que**: Evita problemas de diff "fantasma" entre Windows/Linux e garante que as regras sejam versionadas corretamente.
- **Arquivos**: `.gitattributes`.

---

## ⚡ Features Opt-in (Configuráveis)

Funcionalidades que você pode escolher ativar via Wizard ou flags no `init`/`adopt`. Elas são divididas em **duas categorias arquiteturais**:

| Categoria          | Símbolo | O que fazem                                 | Onde ficam no source  |
| :----------------- | :------ | :------------------------------------------ | :-------------------- |
| **Editoriais**     | 📝      | Injetam blocos `<FEATURE_*>` no `AGENTS.md` | `.core/rules/opt-in/` |
| **Infraestrutura** | ⚡      | Modificam `package.json`, hooks, CI/CD      | `.core/templates/`    |

> **Nota**: Features de infraestrutura **não geram arquivos de regras**. Elas configuram ferramentas externas (Prettier, Husky, GitHub Actions) no projeto consumidor.

---

### 📝 Editoriais (injetam regras em tags XML)

Arquivos de texto Markdown armazenados internamente em `.core/rules/opt-in/`. O compilador injeta apenas as features ativas dentro do bloco `<AI_GUIDELINES>`, usando tags como `<FEATURE_TDD>`. Quando desativadas via `--prune`, a recompilação remove o bloco XML correspondente sem tocar em conteúdo próprio do projeto.

**CLI source**: `cli/features/opt-in/editorial/`

#### 4. Quality Gates

- **O que faz**: Injeta `<FEATURE_QUALITY_GATES>` no `AGENTS.md`. Define limites objetivos (ex: complexidade ciclomática, test coverage) a serem seguidos pelo LLM.
- **Por que**: Evita problemas difíceis de rastrear (Memory Leaks, N+1) injetados passivamente por IA.

#### 5. TDD / BDD

- **O que faz**: Injeta `<FEATURE_TDD>` e/ou `<FEATURE_BDD>` no `AGENTS.md`. Estabelece ciclo RED-GREEN-REFACTOR e testes no formato BDD em PT-BR ou EN como padrão imperativo.
- **Por que**: Reduz dívida técnica em features extensas que precisam de validação estrutural.

---

### ⚡ Infraestrutura (modificam package.json, hooks, CI/CD)

Modificam a infraestrutura (configurações, `package.json`, workflows) do projeto consumidor. **Não geram arquivos de regras.**

**CLI source**: `cli/features/opt-in/infrastructure/`

#### 6. Prettier (Styling)

- **O que faz**: Configura o Prettier com o baseline do framework.
- **Por que**: Garante que o código gerado pela IA siga um padrão estrito, facilitando revisões e evitando ruído em Pull Requests.
- **Rivalidade**: O sistema detecta automaticamente ferramentas rivais (como Biome) e pula esta etapa se detectar conflitos.

#### 7. Husky (Automation)

- **O que faz**: Instala e configura Git Hooks para automação local.
- **Por que**: Garante que scripts de qualidade (como `yarn format` ou `yarn check`) sejam executados obrigatoriamente antes de cada commit.

#### 8. CI (GitHub Actions)

- **O que faz**: Cria um workflow de Integração Contínua (`ai-guidelines-ci.yml`) adaptado ao seu gerenciador de pacotes (npm, yarn, pnpm).
- **Por que**: Bloqueia merges de códigos que não passam nos critérios de qualidade "Golden Green".
