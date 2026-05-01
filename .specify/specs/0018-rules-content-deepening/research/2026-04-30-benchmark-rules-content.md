---
title: Benchmark de rules content em provedores e OSS curado
spec: 0018-rules-content-deepening
bloco: B
sub-bloco: B.0
date: 2026-04-30
status: Stage 1 — research output (sem decisões cravadas)
informa:
  - "[DEC-0018-B01] Taxonomia das categorias de regras"
  - "[DEC-0018-B02] Colocação por categoria (universal × por-IA × opt-in)"
  - "[DEC-0018-B04] Formato do catálogo de regras"
sources:
  - https://code.claude.com/docs/en/best-practices
  - https://www.humanlayer.dev/blog/writing-a-good-claude-md
  - https://www.turbodocx.com/blog/how-to-write-claude-md-best-practices
  - https://agents.md
  - https://developers.openai.com/codex/guides/agents-md
  - https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html
  - https://developer.android.com/studio/gemini/agent-files
  - https://docs.continue.dev/customize/deep-dives/rules
  - https://github.com/continuedev/awesome-rules
  - https://github.com/PatrickJS/awesome-cursorrules
  - https://github.com/Aider-AI/conventions/blob/main/README.md
  - https://aider.chat/docs/usage/conventions.html
  - https://github.com/oven-sh/bun/blob/main/CLAUDE.md
  - https://github.com/ClickHouse/pg_stat_ch/blob/main/CLAUDE.md
  - https://github.com/PostHog/housekeeper/blob/main/CLAUDE.md
---

# Benchmark de rules content em provedores e OSS curado

## 1. Sumário executivo

Este documento sintetiza, em uma única passagem, como os principais provedores de LLM (Anthropic, OpenAI, Google) e uma amostra de projetos OSS curados estruturam **conteúdo de regras editoriais** para agentes IA. O objetivo não é decidir, mas tornar visíveis os tradeoffs que `[DEC-0018-B01]` (taxonomia), `[DEC-0018-B02]` (colocação) e `[DEC-0018-B04]` (formato) precisam endereçar.

A pesquisa cobriu 15 fontes externas distintas — três provedores oficiais, três coletâneas/diretórios OSS (awesome-cursorrules, continue/awesome-rules, Aider-AI/conventions), o sistema de rules do Continue.dev, três exemplos de `CLAUDE.md` em projetos públicos (Bun, ClickHouse pg_stat_ch, PostHog housekeeper) e três posts de prática (HumanLayer, TurboDocx, Anthropic best-practices).

Achados-chave:

- **Não há especificação canônica de formato**. Tanto Anthropic quanto OpenAI/AGENTS.md são explícitos: "standard Markdown, qualquer heading que você quiser, sem campos obrigatórios". A única abstração formalizada (frontmatter YAML com `name`, `globs`, `regex`, `alwaysApply`, `description`) vem de **Continue.dev**, e mesmo lá só `name` é obrigatório.
- **Hierarquia por proximidade é convergência absoluta**. Anthropic (CLAUDE.md), OpenAI (AGENTS.md), Google (GEMINI.md) e Continue convergem em "arquivo mais próximo do código vence", carregamento automático ao subir o tree até `.git`/raiz, e merge concatenativo (não substitutivo).
- **Taxonomia é descritiva, não normativa**. Nenhum provedor prescreve categorias; sugerem "popular sections" como overview, build/test, code style, security, PR conventions. Os repositórios curados (awesome-cursorrules, continue/awesome-rules) usam taxonomias por **stack/domínio** (frontend, backend, testing, devops), não por **função editorial** (filosofia, processo, gates).
- **Comprimento ótimo recomendado: 60–300 linhas**. Anthropic recomenda < 300 linhas, HumanLayer roda com < 60, TurboDocx alvo < 200. Anti-padrão dominante: arquivos longos onde "regras importantes se perdem no ruído".
- **Separação universal × opt-in × por-IA é praticamente inexistente nos benchmarks**. A maioria dos projetos coloca tudo em um único `CLAUDE.md`/`AGENTS.md`. Onde há separação, ela é **espacial** (níveis global/projeto/módulo via filesystem) e não **conceitual** (universal × opcional). Isso é uma lacuna identificada — `ai-guidelines` é mais explícito que o estado-da-arte aqui.

## 2. Provedores oficiais

### 2.1 Anthropic — `CLAUDE.md`

**Estrutura física**:
- Localização hierárquica: `~/.claude/CLAUDE.md` (global, todas as sessões), `./CLAUDE.md` (projeto, versionado), `./CLAUDE.local.md` (projeto, gitignored), `parent/CLAUDE.md` (monorepo), `child/CLAUDE.md` (carregado on-demand quando se trabalha no diretório).
- Imports: sintaxe `@path/to/import` permite modularização (ex.: `@docs/git-instructions.md`).
- Carregamento: **a cada conversa**, sempre injetado no contexto.

**Categorias/taxonomia**:
- Não normativa. A documentação oficial lista, em formato de tabela ✅/❌, **o que incluir e o que excluir**:

| ✅ Incluir | ❌ Excluir |
| --- | --- |
| Bash commands que Claude não consegue adivinhar | Qualquer coisa que Claude descobre lendo o código |
| Code style que diverge do padrão | Convenções padrão da linguagem |
| Instruções de teste e test runners preferidos | Documentação de API detalhada (linkar) |
| Etiqueta de repositório (branch naming, PR) | Informação que muda com frequência |
| Decisões arquiteturais específicas | Descrições file-by-file do codebase |
| Quirks de ambiente (env vars necessárias) | Práticas auto-evidentes ("escreva código limpo") |
| Gotchas e comportamentos não-óbvios | Tutoriais longos |

- Exemplo canônico mostrado pela Anthropic usa apenas duas seções: `# Code style` e `# Workflow` — ~6 linhas no total.

**Formato por regra**:
- **Bullets** dominam. Prosa só para preâmbulos.
- Sem campos estruturados, sem IDs.
- Ênfase via maiúsculas inline ("IMPORTANT:", "YOU MUST") é recomendada — mas explicitamente "use sparingly, emphasis scales poorly".

**Convenção de IDs**: Nenhuma formalmente. Headings markdown servem como anchors implícitas para `@import`.

**Comprimento típico**:
- "Keep it short and human-readable".
- HumanLayer (post Anthropic-aligned): roda com < 60 linhas.
- Diretrizes mais agressivas: < 200 linhas. Anthropic explicitamente diz < 300.
- Heurística de poda: para cada linha, perguntar "removendo isso, Claude erraria?". Se não, cortar.

**Distinção relevante feita pela Anthropic**:
- CLAUDE.md = sempre injetado → só conteúdo "broadly applicable".
- **Skills** (`.claude/skills/<nome>/SKILL.md` com frontmatter `name`/`description`) = on-demand, carregados quando o agente julga relevante.
- **Hooks** (`.claude/settings.json`) = determinísticos, executam scripts em pontos do workflow. "Use hooks for actions that must happen every time with zero exceptions" — vs. CLAUDE.md "advisory".
- **Subagents** (`.claude/agents/*.md`) = contexto isolado, ferramentas restritas.

Esta separação CLAUDE.md / Skills / Hooks / Subagents é a peça mais explícita de **separação por intenção** que se encontra entre os provedores.

Fontes:
- https://code.claude.com/docs/en/best-practices
- https://www.humanlayer.dev/blog/writing-a-good-claude-md
- https://www.turbodocx.com/blog/how-to-write-claude-md-best-practices

### 2.2 OpenAI — `AGENTS.md`

**Estrutura física**:
- Spec oficial em https://agents.md (mantido pela OpenAI/Codex).
- Localização: raiz do repositório, mas múltiplos arquivos em subdiretórios são suportados.
- Hierarquia: "the closest AGENTS.md to the edited file wins; explicit user chat prompts override everything".
- Codex implementa também `~/.codex/AGENTS.md` (global) e `AGENTS.override.md` (override por subsistema).
- Merge: **concatenativo**, raiz → diretório atual; arquivos mais profundos aparecem **depois** no prompt e portanto sobrescrevem por proximidade textual.
- Limite operacional do Codex: `project_doc_max_bytes = 32 KiB`, configurável. Quando excede, "split instructions across nested directories".

**Categorias/taxonomia**:
- A spec é explícita: **sem campos obrigatórios, qualquer heading**.
- Categorias *populares* (sugeridas pela própria spec):
  1. Project overview
  2. Build and test commands
  3. Code style guidelines
  4. Testing instructions
  5. Security considerations
  6. Commit message / PR guidelines
  7. Deployment steps
- Codex adiciona vocabulário próprio: "working agreements" (defaults de equipe), "repository expectations" (normas do projeto), "service-specific rules" (subsistemas).

**Formato por regra**:
- Markdown padrão. Sem frontmatter requerido.
- Sem IDs. Sem schema.

**Convenção de IDs**: Nenhuma.

**Comprimento típico**:
- Não especificado explicitamente. O byte cap de 32 KiB do Codex equivale aproximadamente a ~600–800 linhas markdown — limite **operacional**, não recomendação editorial.
- Exemplo na spec: ~30 linhas em 4 seções (dev tips, testing, PR conventions, lint/typecheck).

**Adoção**:
- Compatível com Codex (OpenAI), Jules (Google), Factory, Aider, goose, opencode, Zed, Warp, VS Code, Devin (Cognition).
- Repo principal da OpenAI mantém **88 arquivos AGENTS.md** simultaneamente — evidência forte do padrão "um por subprojeto".

Fontes:
- https://agents.md
- https://developers.openai.com/codex/guides/agents-md

### 2.3 Google — `GEMINI.md`

**Estrutura física**:
- Hierarquia em três níveis explícitos:
  1. **Global**: `~/.gemini/GEMINI.md` (todos os projetos)
  2. **Project**: `GEMINI.md` no working dir e parents até a raiz `.git`
  3. **Component**: subdiretórios; respeita `.gitignore` e `.geminiignore`
- Todos os arquivos descobertos são **concatenados** antes de enviar ao modelo.
- Imports: mesma sintaxe `@file.md` (relativo ou absoluto).
- Comandos `/memory show|refresh|add` para inspecionar e gerenciar o contexto agregado.
- Customização do nome: `settings.json` com `context.fileName` aceita lista de nomes alternativos.

**Coexistência com AGENTS.md**: se ambos existem no mesmo diretório, `GEMINI.md` tem precedência (no Gemini CLI). Android Studio implementa o mesmo: `GEMINI.md` > `AGENTS.md`.

**Categorias/taxonomia (Android Studio docs, mais prescritivo que o gemini-cli core)**:
1. **Code Location References** ("the main activity is at X.kt")
2. **Architecture Guidelines** ("place all business logic in ViewModels")
3. **Technology Preferences** ("use library X for navigation; no XML layouts")
4. **Terminology & Domain Knowledge** ("the backend is referred to as 'PhotoSift-API'")
5. **Company/Team Style Guides**

**Formato por regra**:
- Markdown padrão. Headings e bullets recomendados — sem schema.
- Modularização via `@./shared/style-guidance.md`.

**Convenção de IDs**: Nenhuma. Anchors auto-geradas via headings.

**Comprimento típico**: Documentação não especifica. Exemplos mostrados são curtos (~20–50 linhas).

**Distinção relevante (Android Studio)**:
| Feature | Storage | Scope | Use Case |
| --- | --- | --- | --- |
| `AGENTS.md` | Junto ao código (VCS) | Todo prompt | Time, comportamento geral |
| Rules | `.idea/project.prompts.xml` | Todo prompt | Preferências por IDE |
| Skills | On-demand | Quando solicitado | Tarefas específicas |

Esta tabela é a mais próxima de uma matriz "universal × scoped × on-demand" entre os provedores oficiais.

Fontes:
- https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html
- https://developer.android.com/studio/gemini/agent-files

## 3. OSS curado

### 3.1 awesome-cursorrules (PatrickJS/awesome-cursorrules)

**Estrutura física**:
- Diretório por regra: `rules/<technology>-<focus>-cursorrules-prompt-file/`
- Arquivos: `.cursorrules` (regra) + `README.md` opcional (créditos/descrição).
- 36.900+ stars; ~280+ regras catalogadas no momento da coleta.

**Taxonomia (treze categorias, no README de raiz)**:
1. Frontend Frameworks and Libraries (React, Vue, Angular, Next.js, Astro, SvelteKit, Solid, Qwik)
2. Backend and Full-Stack (Node.js, Python, Go, Java, Laravel, Rails, Elixir, WordPress)
3. Mobile Development (React Native, Flutter, SwiftUI, Android, NativeScript)
4. CSS and Styling (Tailwind, Chakra, Styled Components)
5. State Management (Redux, MobX, React Query)
6. Database and API (GraphQL, Axios)
7. Testing (Cypress, Jest, Playwright, Vitest)
8. Hosting and Deployments (Netlify)
9. Build Tools and Development (Chrome extensions, Git, Kubernetes, Tauri)
10. Language-Specific (TypeScript, Python, JavaScript, Solidity)
11. Other (game dev, utilities, optimization)
12. Documentation (Gherkin testing, how-to)
13. Utilities

**Observação crítica**: a taxonomia é **stack-oriented** (por tecnologia/framework), **não por função editorial**. Não há a distinção "filosofia × processo × gate × gotcha".

**Formato por regra**:
- Prosa narrativa em primeira/segunda pessoa: "You are an expert in...". Comprimento médio 100–300 linhas.
- Sem frontmatter, sem IDs.

Fontes:
- https://github.com/PatrickJS/awesome-cursorrules

### 3.2 Continue.dev — sistema de rules

Continue é o único caso onde existe **um schema formalizado** para regras.

**Estrutura física**:
- `.continue/rules/` no workspace, ou Hub rules referenciadas via `config.yaml`.
- Suporta `.md` (com frontmatter YAML) ou `.yaml` puro. Documentação recomenda Markdown.
- Ordem de carregamento determinística: Hub assistant rules → Hub rules referenciadas → Local workspace rules → Global rules.

**Schema de uma regra**:

```yaml
---
name: <obrigatório>            # display name
globs: "**/*.{ts,tsx}"         # opcional, file pattern matching
regex: "import .* from 'react'" # opcional, content pattern matching
alwaysApply: false             # tristate: true | false | undefined
description: "..."             # opcional, agente usa para self-selecionar
---

# Conteúdo da regra em markdown
```

**Semântica de `alwaysApply`**:
- `true`: sempre incluída.
- `false`: incluída se globs casarem **ou** se o agente decidir baseado em `description`.
- `undefined` (default): incluída se não houver globs **ou** se globs casarem.

**Categorias/taxonomia**:
- Continue não impõe categoria. O catálogo público `continuedev/awesome-rules` agrupa em:
  1. **General** (cross-cutting: error handling, security)
  2. **Language Specific**
  3. **Framework Specific**
  4. **Code Quality** (lint, format, type safety)
  5. **Documentation**
  6. **Testing**
  7. **DevOps** (CI/CD, Docker, monitoring)

Esta taxonomia mistura **escopo técnico** (linguagem, framework) com **função editorial** (testing, documentation, devops) — é mais rica que awesome-cursorrules, mas ainda não separa "filosofia/processo/gate".

**Comprimento típico**: regras individuais costumam ser 20–100 linhas. O sistema é projetado para **muitas regras pequenas**, ao contrário do CLAUDE.md monolítico.

Fontes:
- https://docs.continue.dev/customize/deep-dives/rules
- https://github.com/continuedev/awesome-rules

### 3.3 Aider — `CONVENTIONS.md`

**Estrutura física**:
- Único arquivo na raiz: `CONVENTIONS.md`. Ou nome arbitrário via `--conventions-file`.
- Carregado por sessão: `aider --read CONVENTIONS.md` ou `/read CONVENTIONS.md` (read-only).
- Configuração persistente via `.aider.conf.yml`.

**Conventions repo (Aider-AI/conventions)**:
- Subdiretórios **por caso de uso**, não por linguagem. Cada um contém `README.md` (purpose) + `CONVENTIONS.md` (regras).
- Sem taxonomia normativa — convidam contribuidores a "criar subdiretório com nome descritivo".

**Categorias sugeridas pela documentação**:
- Coding style rules
- Preferred libraries and packages
- Type hint requirements
- Testing conventions
- Documentation standards

**Formato por regra**: prosa + bullets. Sem schema.

**Comprimento típico**: não especificado. Exemplos comunitários são tipicamente 40–150 linhas.

Fontes:
- https://aider.chat/docs/usage/conventions.html
- https://github.com/Aider-AI/conventions/blob/main/README.md

### 3.4 Bun (oven-sh/bun) — `CLAUDE.md` real-world

- **Comprimento**: ~321 linhas.
- **Headings de topo (H2)**: Building and Running Bun, Testing, Code Architecture, JavaScript Modules, Code Review Self-Check, Important Development Notes, Debugging CI Failures, Reading PR Feedback.
- **Formato**: misto. Prosa para overviews, bullets aninhados (até 3-4 níveis) para hierarquia, code blocks para comandos, **bold + all-caps inline** para diretivas críticas (`CRITICAL:`, `Do not:`).
- **IDs**: nenhum explícito; anchors auto-geradas pelo GitHub.
- **Separação universal vs opt-in**: ausente. Tudo em um único arquivo. Tem cláusulas de exceção inline (`Exception:`, `Tip:`, `Prefer X over Y`) que funcionam como **modulação contextual** — não separação física.

Fonte: https://github.com/oven-sh/bun/blob/main/CLAUDE.md

### 3.5 ClickHouse pg_stat_ch — `CLAUDE.md` real-world

- **Comprimento**: 137 linhas (~102 de conteúdo).
- **Sections (10)**: Project Overview, Dependencies, Build Commands, Development Commands, Testing, Code Style, Architecture, Version Compatibility, Versioning, Reference Projects, Useful Skills.
- **Formato**: bullets, code blocks com linguagem (`bash`), tabelas para version metadata, bold para emphasis.
- **IDs**: anchors auto-geradas.
- **Separação universal vs opt-in**: parcial. A seção Testing menciona condicionais (`TAP tests require PostgreSQL built with --enable-tap-tests`) — mas isso é **descritivo de feature do código**, não de "regra opt-in injetada por feature".

Fonte: https://github.com/ClickHouse/pg_stat_ch/blob/main/CLAUDE.md

### 3.6 PostHog housekeeper — `CLAUDE.md` real-world

- **Comprimento**: 92 linhas (~69 de conteúdo).
- **Sections (12)**: Project Overview, Primary Mode: MCP Server (Default), Analysis Mode (Optional), Development Commands, Running the Application, Development Environment, Dependency Management, Architecture, Core Components, Configuration Structure, Key Design Patterns, Important Notes.
- **Separação Default × Optional**: explícita nas duas primeiras seções comportamentais (`Primary Mode: MCP Server (Default)` vs. `Analysis Mode (Optional)`). Esta é a separação mais limpa observada na amostra — porém é separação **de modos do produto**, não de **categorias de regras**.

Fonte: https://github.com/PostHog/housekeeper/blob/main/CLAUDE.md

### 3.7 Tabela comparativa OSS

| Projeto | Estrutura | Taxonomia | Formato | Comprimento típico |
| --- | --- | --- | --- | --- |
| awesome-cursorrules | Um diretório por regra; `.cursorrules` + README | 13 categorias por **stack/tecnologia** | Prosa "You are an expert in..." | 100–300 linhas/regra |
| Continue.dev rules | `.continue/rules/<rule>.md` com frontmatter YAML | Hub categoriza em 7 grupos (General / Language / Framework / Quality / Docs / Testing / DevOps) | Markdown + frontmatter (`name`, `globs`, `regex`, `alwaysApply`, `description`) | 20–100 linhas/regra |
| Aider conventions | Único `CONVENTIONS.md` ou repo comunitário com subdirs por caso de uso | Não normativa; sugestões: style/libraries/types/testing/docs | Prosa + bullets, sem schema | 40–150 linhas |
| Bun (oven-sh) | Único `CLAUDE.md` na raiz | 8 H2 por **fluxo de trabalho** (build/test/architecture/review/debug) | Prosa + bullets aninhados + code blocks; emphasis via CRITICAL/Do not | ~321 linhas |
| ClickHouse pg_stat_ch | Único `CLAUDE.md` | 10 H2 por **aspecto do projeto** (overview/deps/build/test/style/arch) | Bullets + tabelas + code blocks | ~137 linhas |
| PostHog housekeeper | Único `CLAUDE.md` | 12 H2; introduz **Default vs Optional** como modos | Prosa + bullets | ~92 linhas |

## 4. Padrões emergentes

Convergências fortes entre todas as fontes:

- **Markdown puro como lingua franca**. Nenhum provedor adotou JSON/YAML como formato primário de conteúdo (apenas como frontmatter em Continue). A barreira de entrada zero é deliberada.
- **Hierarquia por proximidade no filesystem**. Anthropic, OpenAI, Google, Continue, Aider — todos implementam "arquivo mais próximo do código vence" e merge concatenativo. É o único mecanismo unânime de "scoping".
- **Separação `universal global × projeto × subprojeto` é espacial**. Implementada via filesystem (home dir vs repo root vs subdir), não via marcação semântica.
- **Imports/modularização** com sintaxe `@path/to/file`: presente em Anthropic, Google e Android Studio. OpenAI não tem oficialmente, mas Codex permite via convenção.
- **Pressão por concisão**. Toda fonte oficial e quase todo post de prática repete a mesma mensagem: "menos é mais", "ruído destrói sinal", "60–300 linhas".
- **Categorias-recipiente convergentes** (independente do nome): build/test commands, code style, architecture, conventions, testing, security, PR/commit. Estas aparecem em Anthropic, OpenAI, Google, Aider, Bun, ClickHouse e housekeeper.
- **Skills/Subagents/Plugins como caminho para conteúdo on-demand**. Anthropic é o mais explícito ("if relevante apenas às vezes, use skills"). Android Studio replica. Continue.dev usa `globs`/`regex` para o mesmo propósito declarativamente.

Convergências mais fracas:

- **Frontmatter YAML**: presente em Continue, Anthropic skills, awesome-cursor-rules-mdc — mas não em CLAUDE.md/AGENTS.md/GEMINI.md de uso geral.
- **Ênfase tipográfica** (CRITICAL, IMPORTANT, YOU MUST): todos usam, todos avisam para usar com parcimônia.

## 5. Anti-padrões observados

Reportados de forma cruzada por Anthropic, HumanLayer, TurboDocx e múltiplos posts:

1. **Over-specified files** ("kitchen sink CLAUDE.md"). Arquivos longos onde regras importantes se diluem. Heurística canônica: para cada linha, perguntar "removendo isso, o agente erraria?". Se não, cortar.
2. **Tratar como documentação humana**. CLAUDE.md/AGENTS.md **não é README**. Se a regra serve a humanos, mover para CONTRIBUTING.md/README.md. Se serve à IA, ficar lá.
3. **Regras hipotéticas sem ancoragem**. "Toda linha deve traçar de volta a um incidente real". Regras adicionadas por previsibilidade, não por dor observada, viram dead weight.
4. **Code style enforcement em prosa**. "Never send an LLM to do a linter's job". Style → linter/formatter (Prettier, ESLint, Biome). LLM é mais lento e caro do que ferramenta determinística para isso.
5. **Auto-geração sem revisão**. `/init` ou equivalente produz starter, mas "this highest-leverage touchpoint deserves careful manual crafting".
6. **Ênfase universal**. "Se toda regra é IMPORTANT, nenhuma é". Use emphasis sparingly.
7. **Instruções flat sem contexto**. `Never force push` é frágil; `Never force push. This rewrites shared history and is unrecoverable for collaborators.` generaliza melhor — porque o "porquê" permite ao modelo aplicar a regra a casos análogos.
8. **Duplicação cross-arquivo**. Quando GEMINI.md, AGENTS.md e CLAUDE.md coexistem com mesmo conteúdo, manutenção fica impossível e diverge silenciosamente.
9. **Regras sem fonte/owner**. Em catálogos curados (awesome-cursorrules), regras frequentemente não declaram autoria/data — um problema de auditabilidade.
10. **Listas extensas sem priorização**. Bullet lists de 30+ itens não-rankeados; o leitor (humano ou LLM) não sabe o que é crítico vs. nice-to-have.
11. **Mistura de "como" com "o quê"**. Regras de processo (execute X depois de Y) misturadas com decisões arquiteturais (use padrão A) — sem separação visual ou taxonômica, dificulta o leitor.
12. **Ausência de gates verificáveis**. Anthropic best practices: "Give Claude a way to verify its work — this is the single highest-leverage thing you can do". Regras sem critério de verificação ficam aspiracionais.

## 6. Implicações para `[DEC-0018-B01/B02/B04]`

Esta seção apresenta opções estruturadas com tradeoffs. **Não decide.**

### 6.1 `[DEC-0018-B01]` — Taxonomia das categorias de regras

A pergunta: como agrupar regras editoriais em `ai-guidelines`?

**Opção A — Taxonomia por stack/tecnologia** (modelo awesome-cursorrules)
- Categorias: Frontend, Backend, Mobile, Testing, DevOps, Language-Specific.
- Prós: precedente massivo (36k stars), familiar a contribuidores OSS, casa bem com `globs` em Continue-style.
- Contras: `ai-guidelines` é **stack-agnóstico por design** (`global-rules.md` é universal). Esta taxonomia força o framework a virar catálogo de regras stack-specific — colide com a identidade canônica.

**Opção B — Taxonomia por função editorial** (proposta nativa do Spec 0018)
- Categorias possíveis: Filosofia, Processo, Gates de qualidade, Gotchas/anti-padrões, Convenções de comunicação.
- Prós: reflete a identidade do framework (regras IA-agnósticas vs opt-in stack); separação útil para o leitor entender intent (princípio vs. checklist).
- Contras: sem precedente direto entre os benchmarks. Risco de sobre-engenharia se taxonomia não casar com como usuários **buscam** as regras.

**Opção C — Taxonomia por escopo de aplicação** (modelo Continue + Anthropic)
- Categorias: Always-on (universal), Conditional (opt-in via feature/flag), On-demand (skill/subagent).
- Prós: alinhado com a separação física que `ai-guidelines` já tem (`global-rules.md` × `opt-in/*.md`). Convergente com Continue (`alwaysApply`) e Anthropic (CLAUDE.md vs Skills).
- Contras: é uma taxonomia de **mecanismo**, não de **conteúdo**. Dois leitores buscando "regras sobre TDD" não as agrupariam por "always-on", e sim por tema.

**Opção D — Híbrida (função editorial dentro de escopo)**
- Hierarquia: primeiro escopo (universal/opt-in/per-IA), depois função (filosofia/processo/gate/gotcha).
- Prós: respeita simultaneamente a arquitetura física existente e a navegabilidade do leitor.
- Contras: dimensionalidade dobrada; risco de células vazias (ex.: "filosofia × per-IA"); contributores precisam aprender duas coordenadas.

### 6.2 `[DEC-0018-B02]` — Colocação por categoria

A pergunta: dado um pedaço de conteúdo, em qual arquivo ele vive (`global-rules.md` × `{claude,codex,gemini}.md` × `opt-in/*.md`)?

**Opção A — Critério "audience"** (quem precisa saber?)
- Regra cross-IA → `global-rules.md`.
- Regra que só faz sentido para um adapter (sintaxe específica do CLAUDE.md, comportamento do Codex CLI) → `{claude,codex,gemini}.md`.
- Regra dependente de stack/processo → `opt-in/*.md`.
- Prós: claro, defensável, alinhado com a filosofia "universal × per-IA × opt-in" já documentada na Spec 0008.
- Contras: zona cinza para regras que se aplicam a **todas** IAs mas têm nuance por adapter (ex.: "use plan mode" → Anthropic Plan Mode, OpenAI raciocínio, Gemini agent mode).

**Opção B — Critério "duplicação intolerável"**
- Se a mesma regra precisa aparecer em 2+ adapters, vai para `global-rules.md`.
- Se diverge fundamentalmente entre adapters, vai para o adapter específico.
- Prós: minimiza duplicação por construção; alinhado com o anti-padrão "duplicação cross-arquivo".
- Contras: pode forçar regras essencialmente per-IA para o universal só porque se traduzem para todas as três.

**Opção C — Critério "escopo de injeção"**
- Conteúdo sempre injetado (cobertura 100% dos consumidores) → `global-rules.md`.
- Conteúdo injetado quando feature ativa → `opt-in/*.md`.
- Conteúdo carregado pela IA específica → `{claude,codex,gemini}.md`.
- Prós: critério mecânico, fácil de aplicar; cada arquivo tem uma audience runtime claramente definida.
- Contras: foco mecânico esconde a pergunta editorial ("isso vale para todo mundo?"), e pode levar a `global-rules.md` virar dump.

### 6.3 `[DEC-0018-B04]` — Formato do catálogo de regras

A pergunta: cada regra deve ter estrutura formal (ID, campos, frontmatter)? Ou é prosa livre como Anthropic/OpenAI recomendam?

**Opção A — Prosa livre + headings markdown** (modelo Anthropic/OpenAI/Aider)
- Cada regra é um parágrafo ou bullet sob heading temática. Sem ID. Sem campos.
- Prós: máxima legibilidade; barreira zero para contribuir; alinhado com 100% dos provedores oficiais.
- Contras: sem rastreabilidade. Se um teste/CI quer asseverar "regra X foi cumprida", não há ancoragem estável. `ai-guidelines` já usa IDs `BR-*` para business rules — divergiria daquela convenção.

**Opção B — Frontmatter YAML por regra** (modelo Continue)
- Cada regra é um arquivo `.md` (ou bloco) com frontmatter `name`, `description`, `scope`, `tags`, `applies_to`.
- Prós: schema estruturado; permite ferramental (linter, generator, busca por tag); precedente em Continue e Anthropic Skills.
- Contras: uma regra por arquivo explode a quantidade de arquivos; um arquivo monolítico com múltiplos blocos frontmatter é não-padrão. Aumenta atrito de contribuição.

**Opção C — IDs inline com sintaxe leve** (modelo BR-* já usado em `ai-guidelines`)
- Cada regra começa com `[GR-XXXX]` (Global Rule) ou `[OPT-<feature>-XX]`. Conteúdo permanece prosa.
- Prós: rastreabilidade preservada sem schema pesado; convergente com a convenção interna existente; permite citar a regra em PRs, testes, ADRs.
- Contras: precisa de processo de alocação de IDs (igual a `BR-*`); risco de IDs órfãos se regras mudam de arquivo.

**Opção D — Estrutura mínima por regra** (compromisso)
- Cada regra: heading H3 com ID curto + 1 frase de "intent" + corpo livre + (opcional) "verificação" e "gotcha relacionado".
- Exemplo:
  ```markdown
  ### [GR-0042] Fail-fast em catch vazio
  **Intent**: Erros silenciados perdem rastreabilidade.
  Nunca capture exceção sem propagar ou recuperar estado. ...
  **Verificação**: ESLint `no-empty` ativado.
  ```
- Prós: balanceia rastreabilidade (ID), navegabilidade (heading), intent claro (1 linha), conteúdo livre, verificabilidade (alinhado com Anthropic best practice "give Claude a way to verify").
- Contras: estrutura nova; precisa de adoção disciplinada; risco de variações inconsistentes se contribuidores ignorarem campos opcionais.

## 7. Limitações desta síntese

- **Cobertura de OSS curado é amostral**: três projetos (Bun, ClickHouse pg_stat_ch, PostHog housekeeper) não constituem amostra estatística. Buscas por exemplos da Kong não retornaram CLAUDE.md público acessível na janela de pesquisa; substituído por housekeeper (que é PostHog, não Kong) sem investigar Kong em mais profundidade.
- **Viés temporal**: pesquisa feita em 2026-04-30. AGENTS.md ainda é spec recente; convenções podem mudar. Em particular, Anthropic Skills e OpenAI AGENTS.override.md são features novas cuja prática real ainda está se consolidando.
- **Viés de fonte oficial**: documentação de provedores reflete o **estado idealizado**, não necessariamente como usuários implementam na prática. Os três exemplos OSS (Bun, ClickHouse, PostHog) parcialmente compensam, mas n=3 é baixo.
- **Não pesquisado em profundidade**: Roo Code, opencode, Devin, goose, Warp — apenas mencionados via citação cruzada da spec AGENTS.md. Não consultei docs primárias.
- **Não pesquisado**: implementações em mainstream non-coding (regras editoriais para agentes de suporte, vendas, content). Pode haver convenções relevantes em domínios adjacentes que `ai-guidelines` poderia internalizar.
- **Não pesquisado**: ferramental de validação/CI para rules content (linters de markdown editorial, scoring automático de regras). Pode informar `[DEC-0018-B04]` mas exige busca específica.
- **Português vs inglês**: todas as fontes consultadas são em inglês. Convenções específicas de comunidades PT-BR não foram cobertas; se houver práticas relevantes em projetos brasileiros (`@rocketseat`, `@nubank`), não estão refletidas aqui.
- **Sem acesso a repositórios privados** (e.g., guidelines internas de Anthropic, OpenAI, Google). O que não é público está fora desta síntese.
- **Não foi feita análise quantitativa** (token count médio por categoria, distribuição de comprimento). As estimativas de "20–100 linhas" são por inspeção, não medição.
- **Conflitos não resolvidos**: PostHog housekeeper introduz "Default vs Optional" como divisão dentro do mesmo arquivo, enquanto o restante da amostra usa apenas separação por filesystem. Não está claro qual convenção convém a `ai-guidelines` — ambas são plausíveis e este documento não decide.

---

Fim da research. Decisões `[DEC-0018-B01]`, `[DEC-0018-B02]` e `[DEC-0018-B04]` permanecem em aberto; este documento alimenta o decision-brief correspondente sem cravar escolhas.
