# Adaptador: Claude (Anthropic)

> Diretrizes complementares para agentes baseados em modelos Anthropic Claude.
> Estas regras **complementam** (não substituem) o `global-rules.md`.

---

## Model Routing

- **Haiku / Sonnet leve:** tarefas atômicas de codificação, formatação, refatoração scoped.
- **Sonnet / Opus:** planejamento arquitetural, análise de múltiplos arquivos, decisões de design complexas.

## Contexto e Ignore

- Utilize `.claudeignore` na raiz do repositório para controlar quais arquivos a IA carrega no contexto.
- O formato segue o padrão `.gitignore`.
- Claude carrega automaticamente o `AGENTS.md` da raiz — garanta que o bloco `<AI_GUIDELINES>` esteja presente.

## Comportamento Observado

- Claude tende a ser verboso por padrão. As Global Rules já instruem respostas sucintas — reforce se necessário com "seja conciso" no prompt.
- Em sessões longas, Claude pode perder contexto de arquivos lidos no início. Use `/clear` ou reinicie a sessão quando perceber repetição de erros.
- Claude Code respeita `CLAUDE.md` na raiz — este arquivo pode conter instruções específicas do projeto que complementam o baseline injetado.
