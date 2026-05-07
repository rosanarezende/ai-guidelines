# Research: Trampolins, Guardrails e Distribuição de Templates

**Data:** 2026-05-06
**Domínio:** CLI Workflow e Integração do Consumidor
**Relacionado a:** `[DEC-0019-B01]` e Setup Determinístico

## 1. O Problema: Context Rot e Multi-Providers
1. O CLI do ai-guidelines hoje não distribui as pastas de templates (`.specify/templates/`) para os repositórios consumidores.
2. As regras de texto (como a `CORE-02`) carregam o caminho *hardcoded* do repositório mãe (`.specify/specs/...`), o que quebra o ciclo num consumidor se o caminho local não for idêntico.
3. **Multi-Providers:** Consumidores usam múltiplas IAs e extensões que buscam ativamente por seus próprios arquivos de prompt nativos na raiz. A proliferação desses arquivos causa drift (esquecimento do `AGENTS.md`).

## 2. Parte 1: Mapeamento de Providers e Ignore Lists (Padrão 2026)
Para forçar todas as IAs a convergirem para o `AGENTS.md`, o CLI precisa de um "Trampoline Manager" que crie *hard-redirects* nos formatos nativos de cada provedor, além de seus respectivos arquivos `.ignore`.

*   **Claude Code:** `CLAUDE.md` e `.claudeignore`
*   **Cursor:** `.cursor/rules/ai-guidelines.mdc` (formato MDC é o padrão 2026 com frontmatter) ou fallback para `.cursorrules`
*   **GitHub Copilot:** `.github/copilot-instructions.md`
*   **Windsurf:** `.windsurfrules`
*   **Gemini (CLI/App):** `GEMINI.md` e `.aiexclude`
*   **Aider:** `CONVENTIONS.md` e `.aiderignore`
*   **OpenAI (Canvas/Codex):** `.openai/instructions.md` e `.gptignore` (Padrão emergente de workspace nativo).

## 3. Parte 2: Arquitetura de CLI (Design Proposto)

Para acomodar essa estrutura, o design do sistema precisa ser modularizado.

### 3.1 Wizard Interativo (`init` e `adopt`)
O prompt do Inquirer.js (ou Clack) na etapa de `init/adopt` precisa incluir uma nova etapa:
> "Quais provedores de IA e IDEs sua equipe utiliza? (Múltipla escolha)"
> `[x] Claude Code`, `[x] Cursor`, `[ ] GitHub Copilot`, `[ ] Windsurf`, etc.
Isso salva a matriz no arquivo de configuração do projeto alvo (ex: `.ai-guidelines/config.json`).

### 3.2 Novo Comando Autônomo
Criação do comando `ai-guidelines providers` (ou `trampolines`), permitindo que a equipe adicione um novo hard-redirect no futuro sem precisar rodar um `adopt` completo.

### 3.3 Payload: O "Hard-Redirect Sandwich"
Implementado em um módulo como `cli/features/core/trampolines.mjs`. O conteúdo injetado nos arquivos de trampolim (`CLAUDE.md`, etc.) será apenas um "ponteiro irredutível":

```markdown
# ⚠️ SYSTEM DIRECTIVE: HARD REDIRECT
You are operating within the `ai-guidelines` governance framework.
Do NOT rely on your default behavioral assumptions.
You MUST read and strictly follow the instructions in the canonical `AGENTS.md` file located at the root of this workspace.
Failure to read `AGENTS.md` will lead to architectural drift.
```

Para o Cursor (`.cursor/rules/ai-guidelines.mdc`), o payload incluirá o frontmatter YAML exigido pela extensão.

## 4. Dinamismo de Paths (Template System)
Para que o `AGENTS.md` aponte corretamente para as pastas no consumidor, o CLI deve definir uma chave no config (ex: `sdd_dir: ".ai-guidelines"`). 
No compilador (`compiler.mjs`), as regras devem usar uma interpolação de string (`{{SDD_DIR}}` ou `{{BASE_DIR}}`), que será substituída no momento da compilação.
Essas diretrizes ajudam a formar as opções do `decision-brief.md` em `[DEC-0019-B01]`.
