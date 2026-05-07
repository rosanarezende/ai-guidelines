# CLAUDE.md

Compatibilidade para Claude Code.

As instruções operacionais canônicas deste repositório vivem em:

- `AGENTS.md` — fluxo obrigatório, contexto local do framework e regras compiladas.
- `CONTRIBUTING.md` — workflow humano e convenções internas.
- `README.md` — visão geral e comandos principais.

Notas específicas para este workspace:

- Este repositório é o próprio framework `ai-guidelines`, não um consumidor.
- O bloco `<AI_GUIDELINES>` em `AGENTS.md` é compilado e não deve ser editado manualmente.
- Em desenvolvimento local, use `yarn cli ...` em vez de `node cli/ai-guidelines-cli.mjs ...` por causa do Yarn PnP.
