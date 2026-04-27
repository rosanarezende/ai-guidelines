# 🚀 Features do ai-guidelines

O `ai-guidelines` é organizado em módulos de funcionalidade (Features), divididos entre **Core** (essenciais para a governança) e **Opt-in** (ferramental de suporte).

## 🛠️ Features Core (Mandatórias)

Estas funcionalidades são aplicadas automaticamente para garantir a integridade da governança AI-First.

### 1. Pointers (AGENTS.md)

- **O que faz**: Estabelece a arquitetura de ponteiros. Cria um `AGENTS.md` na raiz que aponta para o diretório de governança (`.ai-guidelines/`).
- **Por que**: Garante que qualquer IA (ou humano) que entre no projeto saiba imediatamente onde encontrar as regras de engajamento, sem poluir a raiz do repositório.
- **Arquivos**: `AGENTS.md`, `.ai-guidelines/AGENTS.md`.

### 2. Rules

- **O que faz**: Sincroniza as diretrizes metodológicas e regras de engenharia do repositório central para o projeto local.
- **Por que**: Mantém o projeto atualizado com os padrões de desenvolvimento (ex: SDD, Token Economy) sem necessidade de cópia manual.
- **Arquivos**: `.ai-guidelines/rules/*`.

### 3. Gitattributes

- **O que faz**: Normaliza o final de linha (EOL) e garante a persistência correta dos arquivos de governança.
- **Por que**: Evita problemas de diff "fantasma" entre Windows/Linux e garante que as regras sejam versionadas corretamente.
- **Arquivos**: `.gitattributes`.

---

## ⚡ Features Opt-in (Configuráveis)

Funcionalidades que você pode escolher ativar via Wizard ou flags no `init`/`adopt`. Elas são divididas em duas categorias arquiteturais:

### Regras Editoriais (Opt-in)

Arquivos de texto Markdown sincronizados para o consumidor. Ficam armazenados internamente em `.core/rules/opt-in/` para que o motor não os force como regras obrigatórias (diferente do `global-rules.md`). Quando desativadas via flag `--prune`, os scripts das features limpam ativamente os arquivos do repositório consumidor.

#### 4. Quality Gates

- **O que faz**: Adiciona `quality-gates.md` em `.ai-guidelines/rules/`. Define limites objetivos (ex: complexidade ciclomática, test coverage) a serem seguidos pelo LLM.
- **Por que**: Evita problemas difíceis de rastrear (Memory Leaks, N+1) injetados passivamente por IA.

#### 5. TDD / BDD

- **O que faz**: Adiciona `tdd.md` em `.ai-guidelines/rules/`. Estabelece ciclo RED-GREEN-REFACTOR e testes no formato BDD em PT-BR como padrão imperativo.
- **Por que**: Reduz dívida técnica em features extensas que precisam de validação estrutural.

---

### Injeções Funcionais (Opt-in)

Modificam a infraestrutura (configurações, `package.json`, etc.) do projeto consumidor.

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
