# Pesquisa A.8 — Benchmarks AI-first dev tooling (2025–2026)

## 1) `AGENTS.md` standard

O formato `AGENTS.md` está consolidando-se como padrão aberto de instruções para agentes, com adoção ampla em OSS e stewardship no ecossistema da Agentic AI Foundation (Linux Foundation):  
https://agents.md  
https://openai.com/index/agentic-ai-foundation/

Padrão canônico observado:

- comandos de setup/teste,
- convenções de código,
- instruções de PR,
- possibilidade de arquivos `AGENTS.md` aninhados por subprojeto.

## 2) `CLAUDE.md` patterns em repos públicos

No benchmark `multica`, `CLAUDE.md` é um contrato técnico detalhado (arquitetura, boundaries, state management, test rules), enquanto `AGENTS.md` fica curto e roteia para ele:  
https://github.com/multica-ai/multica/blob/main/AGENTS.md  
https://github.com/multica-ai/multica/blob/main/CLAUDE.md

Padrão recomendado: **arquivo-ponte curto + arquivo profundo de execução**.

## 3) Memory / context persistence patterns

### Cline

Padrão de regras e instruções no próprio repo (incluindo `copilot-instructions.md`) + docs/fluxo disciplinado:  
https://github.com/cline/cline/tree/main/.github

### Cursor rules

No mercado, o padrão conhecido é `.cursor/rules/*` para regras por projeto. A documentação pública do Cursor é JS-heavy, mas a noção de “rules por contexto” está alinhada com os concorrentes.

### Continue

Continue documenta regras locais (`.continue/rules`) e regras de hub, com ordem de aplicação e suporte a metadados (`globs`, `alwaysApply`, `description`):  
https://github.com/continuedev/continue/blob/main/docs/customize/rules.mdx  
https://github.com/continuedev/continue/blob/main/docs/customize/deep-dives/rules.mdx

### Aider

Aider mantém forte foco em uso terminal + repomap para contexto de codebase:  
https://github.com/Aider-AI/aider/blob/main/README.md  
https://aider.chat/docs/repomap.html  
https://aider.chat/docs/usage.html

### Claude Code memory

Padrão de memória persistente por diretório de usuário (`~/.claude/...`) é referência relevante para “state entre sessões”:  
https://docs.anthropic.com/en/docs/claude-code/memory

### GitHub Spec Kit

Spec Kit enfatiza fluxo spec-driven e comandos estruturados, favorecendo memória processual por artefatos (`spec/plan/tasks`):  
https://github.com/github/spec-kit/blob/main/README.md

## 4) Skills / prompt catalogs

Padrões emergentes:

- catálogo com metadados (nome, descrição, escopo, instruções de uso);
- acoplamento com fluxo de execução (quando chamar, quando não chamar);
- validação de qualidade/review (ex.: templates de PR com disclosure de IA).

Evidências:

- Continue Hub + regras locais/hub.
- Spec Kit: ecossistema de extensions/presets e contribuição com disclosure de IA.  
  https://github.com/github/spec-kit/blob/main/CONTRIBUTING.md

## 5) `docs/ai-context/` e equivalentes

Não há um único padrão universal, mas duas famílias aparecem:

1. **Guides por tarefa/domínio** (ex.: `docs/ai-context/*`).
2. **Contrato operacional central + anexos específicos** (`AGENTS`/`CLAUDE` + docs técnicas em `docs/`).

Para `ai-guidelines`, a combinação das duas é mais robusta.

## 6) `BEFORE_CODING.md` / pre-flight checklists

Não é um padrão “formal” de mercado como AGENTS.md, mas em repositórios AI-first maduros aparecem checklists pré-execução, obrigatoriedade de leitura e gates de qualidade.  
Internamente, repositórios desse tipo já validam esse formato como altamente útil.

## 7) Testing conventions em repos AI-collab

Baseline observado:

- lint + test em CI obrigatórios;
- contribuição exige evidência de teste;
- foco em regressão e previsibilidade.

Exemplos:

- Multica CI com frontend+backend:  
  https://github.com/multica-ai/multica/blob/main/.github/workflows/ci.yml
- Cline/Continue/Spec Kit com workflows e checklists de PR.

## 8) Context efficiency practices

Padrões que reduzem ruído:

- docs em camadas (entrypoint curto + profundidade referenciada),
- regras locais por diretório/subprojeto,
- artefatos de processo previsíveis (spec/plan/tasks),
- evitar duplicação de fontes de verdade.

## Recomendação consolidada para spec 0004

Dado o estado do mercado em 2026, `ai-guidelines` deve:

1. **Adotar oficialmente AGENTS.md como interface pública com agentes** e incluir guidance para AGENTS aninhados.
2. **Padronizar arquitetura de contexto em 3 níveis**:
   - `AGENTS.md` (roteamento e regras macro),
   - `CLAUDE.md`/equivalentes (regras operacionais detalhadas),
   - `docs/ai-context/` (guias por domínio/tarefa).
3. **Implementar catálogo de skills/rules com metadados mínimos** (`name`, `description`, `when-to-use`, `when-not-to-use`, `last-reviewed`).
4. **Integrar memória processual por artefatos** (spec/plan/tasks + índice persistente A.9), evitando depender só de memória de sessão.
