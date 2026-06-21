# 🚀 Features do ai-guidelines

O `ai-guidelines` é **governance-first com integração AI-agnóstica de primeira classe** (ver [`ADR 0018`](../.core/governance/adrs/0018-governance-first-ai-as-channel.md)): o core ontológico é governança de engenharia repo-first; integração com agentes de IA é canal opt-in importante, mas não o coração do framework.

Features são organizadas em três grupos:

- **Core (mandatórias)** — bootstrap do framework no projeto consumidor; garantem hygiene mínima.
- **Opt-in Editorial / Infrastructure** — features de engenharia que o consumidor escolhe (TDD, Prettier, Quality Gates, CI).
- **Opt-in AI Integration** — provider entrypoints sincronizados (Claude, Gemini, Codex, Cursor, etc.). Hoje a maioria dos consumidores ativa, mas tecnicamente é canal opcional — o core de governança funciona sem.

## 🛠️ Features Core (Mandatórias)

Estas funcionalidades garantem o piso de governança em qualquer consumidor, independentemente de stack ou integração com IA.

### 1. Runtime AGENTS.md (Canal AI)

- **O que faz**: Mantém um bootstrap curto dentro da tag `<AI_GUIDELINES>` no `AGENTS.md` da raiz, apontando para `handoff` situado, script contracts e catálogo de regras.
- **Por que**: Materializa o **canal de integração AI-agnóstica** sem pré-carregar o kernel inteiro; sessões novas recebem contexto via `npx ai-guidelines handoff`.
- **Classificação**: Hoje distribuído como Core porque é o mecanismo central da CLI mjs. A Spec 0021 PR4 (4.C cutover) **declara e arquiteta** a SSOT de governança (`registry.yml`, `living-docs.yml`, etc.) como distribuição canônica independente; a **distribuição operacional completa** no consumidor (geração real via `cli init`/`adopt`) depende do cutover do runtime (Spec 0022+, ainda em discovery). O Runtime AGENTS.md permanece como **canal opt-in primário** para consumidores que querem integração AI ativa.
- **Arquivos**: `AGENTS.md`.

### 2. Rules Compiler

- **O que faz**: Lê as regras modulares em `.core/rules/` e gera catálogo, ledger e `rules.json`.
- **Por que**: Mantém modularidade no source do framework e permite que `AGENTS.md` seja stub em vez de payload monolítico.
- **Classificação**: Fonte governada consumida por handoff, checks e provider entrypoints.
- **Arquivos**: `.core/rules/catalog.md`, `.core/rules/_meta/rules.json`, `.core/rules/_meta/agents-core-ledger.md`, `AGENTS.md` (stub).

### 3. Gitattributes

- **O que faz**: Normaliza o final de linha (EOL) e garante a persistência correta dos arquivos de governança.
- **Por que**: Evita problemas de diff "fantasma" entre Windows/Linux e garante que as regras sejam versionadas corretamente. Hygiene de governança, **independente de IA**.
- **Arquivos**: `.gitattributes`.

---

## ⚡ Features Opt-in (Configuráveis)

Funcionalidades que você pode escolher ativar via Wizard ou flags no `init`/`adopt`. Elas são divididas em **duas categorias arquiteturais**:

| Categoria          | Símbolo | O que fazem                            | Onde ficam no source  |
| :----------------- | :------ | :------------------------------------- | :-------------------- |
| **Editoriais**     | 📝      | Alimentam catálogo/ledger de regras    | `.core/rules/opt-in/` |
| **Infraestrutura** | ⚡      | Modificam `package.json`, hooks, CI/CD | `.core/templates/`    |

> **Nota**: Features de infraestrutura **não geram arquivos de regras**. Elas configuram ferramentas externas (Prettier, Husky, GitHub Actions) no projeto consumidor.

---

### 📝 Editoriais (alimentam o catálogo de regras)

Arquivos de texto Markdown armazenados internamente em `.core/rules/opt-in/`. O compilador indexa regras em catálogo/ledger; o canal AI inicial usa `AGENTS.md` como stub e `handoff` para contexto situado.

**CLI source**: `cli/features/opt-in/editorial/`

#### 4. Quality Gates

- **O que faz**: Registra limites objetivos (ex: complexidade ciclomática, test coverage) como regra opt-in governada.
- **Por que**: Evita problemas difíceis de rastrear (Memory Leaks, N+1) injetados passivamente por IA.

#### 5. TDD / BDD

- **O que faz**: Registra ciclo RED-GREEN-REFACTOR e testes no formato BDD em PT-BR ou EN como regra opt-in governada.
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
- **Por que**: Garante que scripts de qualidade (como `yarn format` / `yarn lint-staged` / `yarn validate`) sejam executados obrigatoriamente antes de cada commit e push.

#### 8. CI (GitHub Actions)

- **O que faz**: Cria um workflow de Integração Contínua (`ai-guidelines-ci.yml`) adaptado ao seu gerenciador de pacotes (npm, yarn, pnpm).
- **Por que**: Bloqueia merges de códigos que não passam nos critérios de qualidade "Golden Green".

---

### 🛡️ Auditoria e Governança (CLI tool)

Ferramentas internas de governança distribuídas junto ao `ai-guidelines`.

#### 9. AI Check (`yarn ai:check`)

- **O que faz**: Prover sensores locais ("Quality Gates") que rastreiam violações de regras estruturais e auxiliam no controle do uso de tokens na janela de contexto das IAs. Verifica heurísticas de degradação (como ausência de ignore files ou presença de `node_modules` no contexto) e regras catalogadas.
- **Por que**: A ferramenta apenas reporta violações como alertas (`warnings`) agrupadas por regra (`ruleId`). O processo de build não quebra, garantindo baixo atrito (fail-open) enquanto educa o desenvolvedor.
