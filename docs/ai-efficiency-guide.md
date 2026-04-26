# Guia Definitivo de Eficiência de IA: Modelos, IDEs e Tokens

Este guia une a filosofia agnóstica de Agentes de IA com as especificidades técnicas das ferramentas disponíveis, garantindo máxima performance e economia em qualquer ecossistema de projetos.

---

## 1. Núcleo de Eficiência (Agnóstico)

Independentemente da ferramenta ou modelo, siga estes pilares:

- **RPI Protocol**: Research (Pesquisar), Plan (Planejar), Implement (Implementar).
- **Modularidade Atômica**: Máximo de 3 arquivos por solicitação. Divida tarefas grandes em sub-tarefas.
- **Feedback Cirúrgico**: Faça as correções diretamente no artefato gerado. Evite reenviar prompts longos.

---

## 2. Deep Dive: Ferramentas Agentes (IDE/CLI)

Antigravity, Claude Code e Codex são ferramentas agentes — operam com autonomia para editar arquivos, rodar comandos e iterar. Cada uma tem seu próprio sistema de contexto e comandos de gestão.
Consulte o adapter específico para paths, comandos e configurações detalhadas:

- [for-gemini/setup.md](../for-gemini/setup.md) — Gemini CLI / Antigravity
- [for-claude/setup.md](../for-claude/setup.md) — Claude Code
- [for-codex/setup.md](../for-codex/setup.md) — Codex / OpenAI CLI

### Hierarquia de Contexto (universal)

1. **Nível 1 (GLOBAL)**: arquivo de regras globais da IA ativa — consulte `for-<ia>/setup.md` para o path específico.
2. **Nível 2 (REPO)**: `./AGENTS.md` — lido universalmente por todas as IAs.
3. **Nível 3 (JIT)**: `subpasta/AGENTS.md` — regras sob demanda por subdiretório.

---

## 3. Deep Dive: VS Code (Cursor & Claude Code)

Ferramentas integradas à IDE exigem gestão rigorosa de arquivos abertos.

### Cursor e `.cursorrules`

- Use o arquivo `.cursorrules` na raiz para definir o "espírito" do projeto (ex: "Sempre use Tailwind e TypeScript").
- **Dica**: Use o símbolo `@` para anexar apenas os arquivos estritamente necessários ao contexto.

### Claude Code e `CLAUDE.md`

- O arquivo `CLAUDE.md` serve como memória persistente. Ele é lido no início de cada sessão.
- **Dica**: Documente nele os comandos de build e teste (`npm run build`, `vitest`) para que a IA nunca precise perguntar "como rodo o projeto?".

---

## 4. Deep Dive: GitHub Copilot

O Copilot é excelente para preenchimento de código e consultas rápidas ao workspace.

- **`@workspace`**: Use para fazer perguntas sobre a arquitetura global (ex: "Onde definimos as rotas de API?").
- **`#file` / `#selection`**: Limite o contexto a arquivos específicos para evitar sugestões genéricas.
- **Context Indexing**: Garanta que o Copilot indexou seu repositório para melhores resultados semânticos.

---

## 5. Matrix Multi-Modelo: Quando usar o quê?

| Modelo                | Superpoder                                          | Quando Evitar                                                       |
| :-------------------- | :-------------------------------------------------- | :------------------------------------------------------------------ |
| **Gemini 2.x**        | Janela de Contexto Gigante (2M+) e Velocidade.      | Tarefas que exigem raciocínio lógico "zero-shot" ultra-refinado.    |
| **Claude 3.5 Sonnet** | Raciocínio (Coding Score alto) e Artefatos visuais. | Bases de código massivas onde os tokens de entrada são muito caros. |
| **GPT-4o**            | Versatilidade e Análise de Dados.                   | Sessões onde o "context rot" acontece rápido demais.                |

---

> [!IMPORTANT]
> **Gestão de Skills Globais:** Ferramentas agentes (Antigravity, Claude Code) mantêm skills em um diretório global específico (ex: `~/.gemini/skills/` no Antigravity). Remova scripts que não usa ativamente, pois eles consomem tokens de "System Prompt" em todas as chamadas. Consulte `for-<ia>/setup.md` para o path correto.
