---
name: 🐛 Bug report
about: Reportar uma falha no CLI, em uma regra do baseline, ou em link/path quebrado
title: "[BUG] "
labels: bug
assignees: ""
---

## Descrição

<!-- O que você esperava que acontecesse? O que aconteceu? -->

## Reprodução

<!-- Passos mínimos para reproduzir. Comando exato, argumentos, ambiente. -->

```bash
# exemplo: o que você rodou
node cli/ai-guidelines-cli.mjs adopt --target ../meu-repo --dry-run
```

## Contexto

- **OS / Shell:** <!-- Windows + Git Bash / macOS / Linux + zsh / WSL / etc. -->
- **Versão Node:** <!-- node --version -->
- **Versão ai-guidelines:** <!-- consultar CHANGELOG.md ou git log -->
- **Surface:** <!-- Claude Code / Gemini CLI / Codex / Cursor / outro -->

## Tipo de bug (marque o que se aplica)

- [ ] CLI quebrou (`init`, `adopt`, sync, wizard)
- [ ] Regra do `.core/rules/` produz comportamento errado
- [ ] Link quebrado em `.ai-guidelines/rules/` no consumidor pós-`adopt`
- [ ] Documentação confusa ou desatualizada
- [ ] Outro: <!-- descreva -->

## Logs / output

<!-- Cole logs relevantes aqui. Esconda dados sensíveis. -->

```text

```

## Sugestão de mitigação (opcional)

<!-- Se você já investigou, conte o que descobriu. -->

---

> Antes de submeter, leia [`CONTRIBUTING.md`](../../CONTRIBUTING.md) e
> [`SECURITY.md`](../../SECURITY.md) (este último para vulnerabilidades).
