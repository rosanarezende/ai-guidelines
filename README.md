<p align="center">
  <img src="https://raw.githubusercontent.com/rosanarezende/ai-guidelines/main/docs/assets/ai-guidelines-flow.png" alt="ai-guidelines — ciclo de governança AI-driven, do backlog ao valor entregue" width="880">
</p>

<h1 align="center">ai-guidelines</h1>

<p align="center">
  <strong>Governança AI-first portátil. Do backlog ao valor entregue, com coerência multi-IA.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ai-guidelines"><img src="https://img.shields.io/npm/v/ai-guidelines.svg" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/ai-guidelines.svg" alt="license"></a>
  <img src="https://img.shields.io/node/v/ai-guidelines.svg" alt="node engine">
</p>

---

## Por que existe

Adotar IAs no fluxo de desenvolvimento sério expõe três fricções que o ferramental atual não resolve em conjunto:

**Coerência entre múltiplos modelos.** Cada IA traz seu próprio arquivo de regras, convenções e _ignore lists_. Sem governança comum, Claude, Gemini, Codex, Cursor e Copilot leem instruções divergentes — e o time humano vira árbitro de conflitos.

**Processo rastreável, do problema ao valor.** A maior parte do ferramental cobre apenas a fase de codificação assistida. Backlog, especificação, decisões arquiteturais, gates humanos, distribuição cross-repo e visibilidade para liderança ficam por conta da disciplina manual.

**Auditabilidade real, não confiança implícita.** Sem marcadores explícitos do que foi gerado pela CLI, do que foi atualizado e do que foi preservado, cada update vira aposta. Operadores humanos perdem controle sobre o estado do projeto.

O `ai-guidelines` cobre os três eixos no mesmo framework:

- **Runtime governado único** (`AGENTS.md`) que compila e distribui regras para provider entrypoints sincronizados (`CLAUDE.md`, `GEMINI.md`, `.openai/instructions.md`, `.cursor/rules/`, e por aí vai).
- **Ciclo de specs versionado** — Backlog → Spec → Plano → Execução → PR → Merge → Valor entregue — com gates humanos explícitos onde importa, e capítulos emergentes para release lifecycle e arquitetura da informação (ver imagem acima).
- **Política de update auditável** (`managed-block` + `mirror`) que delimita o que a CLI gerencia e o que é do consumidor — sem sobrescrita silenciosa.

Você escreve a regra uma vez. Você abre uma spec uma vez. O framework propaga e te leva até o merge.

## Quick start

```bash
# projeto novo — wizard interativo
npx ai-guidelines init

# repositório existente — adoção conservadora (preserva o que já tem)
npx ai-guidelines adopt --target . --dry-run     # preview
npx ai-guidelines adopt --target .               # aplica
```

Requer **Node ≥ 22**. Para fixar versão em CI: `npx ai-guidelines@<versão> ...`.

## O que você ganha

- **Governança Multi-IA unificada** — 7+ provedores suportados de fábrica (Claude, Gemini, Codex, Cursor, Copilot, Windsurf, Aider). Adicione um novo sem reescrever regra.
- **Modular por opt-in** — escolha no wizard o que adotar (Prettier, Husky, CI, TDD, BDD, Quality Gates). Sem sobrescrita silenciosa de hooks ou configs existentes.
- **Auditável** — tudo o que a CLI gerencia fica entre marcadores `managed-block`. O resto do seu projeto permanece intocado.
- **Headless por design** — o comando `update` é idempotente e não-interativo; integra em CI sem prompt.
- **Spec-Driven Development governado** — boilerplates SDD distribuídos e versionados (`spec.md`, `plan.md`, `tasks.md`) prontos para o ciclo Backlog → Spec → Plano → Execução → PR → Merge.
- **Gates humanos explícitos** onde importa (passagem de spec para review, merge), em vez de aprovações implícitas.

## Comandos essenciais

| Comando                       | Quando usar                                                         |
| :---------------------------- | :------------------------------------------------------------------ |
| `npx ai-guidelines init`      | Projeto novo, baseline AI-first via wizard interativo               |
| `npx ai-guidelines adopt`     | Repositório existente, adoção conservadora (preserva código legado) |
| `npx ai-guidelines providers` | Adicionar ou remover provider entrypoints específicos               |
| `npx ai-guidelines update`    | Re-aplicar baseline após upgrade da CLI (headless, idempotente)     |

Todo comando aceita `--dry-run` para preview e `--help` para detalhes. Sem argumentos, a CLI inicia o wizard.

## Compatibilidade Multi-IA

| IA / Ferramenta    | Provider entrypoint (managed-block)      | Status       |
| :----------------- | :--------------------------------------- | :----------- |
| Claude Code        | `CLAUDE.md` + `.claudeignore`            | ✅ Suportado |
| Gemini CLI         | `GEMINI.md` + `.aiexclude`               | ✅ Suportado |
| Codex / OpenAI CLI | `.openai/instructions.md` + `.gptignore` | ✅ Suportado |
| Cursor             | `.cursor/rules/ai-guidelines.mdc`        | ✅ Suportado |
| GitHub Copilot     | `.github/copilot-instructions.md`        | ⚡ Parcial   |
| Windsurf           | `.windsurfrules`                         | ✅ Suportado |
| Aider              | `CONVENTIONS.md` + `.aiderignore`        | ✅ Suportado |
| Outras IAs         | `AGENTS.md` como fallback universal      | 🔄 Esperado  |

## Como funciona (em um minuto)

O runtime vive em `AGENTS.md` — fonte única lida por humanos e IAs. A CLI compila esse runtime em zonas temáticas (Primary Directives, Lifecycle, Git Workflow, Engineering Principles) e o distribui para provider entrypoints nativos por meio de dois modos de update:

- **`managed-block`** — atualiza apenas o conteúdo entre marcadores `<!-- ai-guidelines:managed-start -->` e `<!-- ai-guidelines:managed-end -->`. Tudo fora dos marcadores é seu — fica intocado entre updates.
- **`mirror`** — overwrite total para boilerplates SDD copiados para `.ai-guidelines/templates/`. Seguro porque esses templates não são editados in-place; o trabalho do consumidor vive em `.specify/specs/<slug>/`.

Detalhamento técnico em [`docs/cli/ai-guidelines-cli.md`](docs/cli/ai-guidelines-cli.md).

## Documentação & contribuição

- [`docs/`](docs/) — guias técnicos, features e FAQ
- [`AGENTS.md`](AGENTS.md) — workflow obrigatório para humanos e agentes IA neste repositório
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — como contribuir, setup local, convenções
- [`.specify/specs/roadmap/backlog.md`](.specify/specs/roadmap/backlog.md) — backlog vivo do framework
- [`CHANGELOG.md`](CHANGELOG.md) — histórico de versões

## Licença

[Apache-2.0](LICENSE) © 2026 Rosana Rezende.

Permite uso comercial. Mantenha o aviso de copyright e indique modificações ao distribuir. A cláusula de patentes (§3) protege quem usa e quem contribui — diferencial relevante em relação à MIT.

---

<p align="center"><sub>Feito no Brasil · contribuições em PT-BR e EN são bem-vindas</sub></p>
