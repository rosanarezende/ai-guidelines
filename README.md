<p align="center">
  <img src="https://raw.githubusercontent.com/rosanarezende/ai-guidelines/main/docs/assets/ai-guidelines-flow.png" alt="ai-guidelines — ciclo de governança de engenharia, do backlog ao valor entregue" width="880">
</p>

<h1 align="center">ai-guidelines</h1>

<p align="center">
  <strong>Governança de engenharia repo-first. Do backlog ao valor entregue, com integração AI-agnóstica de primeira classe.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ai-guidelines"><img src="https://img.shields.io/npm/v/ai-guidelines.svg" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/npm/l/ai-guidelines.svg" alt="license"></a>
  <img src="https://img.shields.io/node/v/ai-guidelines.svg" alt="node engine">
</p>

---

## Por que existe

Times de engenharia sérios enfrentam três fricções estruturais que o ferramental atual não resolve em conjunto:

**Processo rastreável do problema ao valor.** Backlog, especificação, decisões arquiteturais, gates humanos, distribuição cross-repo e visibilidade para liderança ficam por conta da disciplina manual — ou se diluem em ferramentas externas (Jira, Linear) que não sobrevivem a troca de stack ou de IA.

**Estado canônico que mora no repositório, não num dashboard.** Quando a verdade sobre "o que está em curso" vive fora do Git, ela some quando alguém troca de ferramenta. O `ai-guidelines` põe esse estado dentro do repo, versionado, em `.governance/registry.yml`.

**Coerência quando IAs entram no fluxo.** Cada agente (Claude, Gemini, Codex, Cursor, Copilot, Windsurf, Aider) traz seu próprio formato de regras. Sem governança comum, eles leem instruções divergentes — e o time humano vira árbitro de conflitos.

O `ai-guidelines` cobre os três eixos no mesmo framework:

- **Ciclo SDD versionado** — Backlog → Spec → Plano → Execução → PR → Merge → Valor entregue, com gates humanos explícitos onde importa.
- **Taxonomia MECE de 7 pilares de trabalho** — `spec`, `experiment`, `spike`, `incident`, `proposal`, `patch`, `fix`. Tudo que entra no fluxo cabe em exatamente um.
- **`.governance/` como SSOT** — `registry.yml` estruturado + Markdown derivado + reservas para intake, handoff, telemetria à medida que o framework evolui. Repo é a memória.
- **Living Documentation** — testes com IDs `[BR-CLI-*]` são a fonte única de verdade das regras de negócio; documentação derivada protegida por drift guard fatal na CI.
- **Integração AI-agnóstica de primeira classe** — um runtime governado distribui regras para 7+ provider entrypoints sincronizados (`CLAUDE.md`, `GEMINI.md`, `.openai/instructions.md`, `.cursor/rules/`, etc.).
- **Política de update auditável** (`managed-block` + `mirror`) que delimita o que a CLI gerencia e o que é do consumidor — sem sobrescrita silenciosa.

Você escreve a regra de governança uma vez. Você abre uma spec uma vez. O framework propaga até o merge — com IA opcional, mas de primeira classe.

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

- **Governance-by-design** — não tente ensinar devs ou IAs a "fazer bons prompts"; o sistema bloqueia o caminho errado por construção (ex.: `POLICY_EXPERIMENT_REQUIRES_HYPOTHESIS` recusa experimento sem hipótese declarada).
- **Spec-Driven Development governado** — boilerplates SDD distribuídos e versionados (`spec.md`, `plan.md`, `tasks.md`, `decision-brief.md`) prontos para o ciclo Backlog → Spec → Plano → Execução → PR → Merge.
- **Gates humanos explícitos** onde importa (passagem de spec para review, merge, release sync), em vez de aprovações implícitas.
- **Estado canônico repo-first** — `.governance/registry.yml` versionado é fonte primária; humanos e agentes leem do mesmo lugar.
- **Auditável** — tudo o que a CLI gerencia fica entre marcadores `managed-block`. O resto do seu projeto permanece intocado.
- **Headless por design** — `update` é idempotente e não-interativo; integra em CI sem prompt.
- **Modular por opt-in** — escolha no wizard o que adotar (Prettier, Husky, CI, TDD, BDD, Quality Gates, AI agent integration). Sem sobrescrita silenciosa.

## Comandos essenciais

| Comando                       | Quando usar                                                         |
| :---------------------------- | :------------------------------------------------------------------ |
| `npx ai-guidelines init`      | Projeto novo, baseline governance-first via wizard interativo       |
| `npx ai-guidelines adopt`     | Repositório existente, adoção conservadora (preserva código legado) |
| `npx ai-guidelines providers` | Adicionar ou remover AI provider entrypoints específicos            |
| `npx ai-guidelines update`    | Re-aplicar baseline após upgrade da CLI (headless, idempotente)     |
| `npx ai-guidelines workflow`  | Wizard operacional do runtime (preview — cf. Spec 0023)             |
| `npx ai-guidelines continue`  | Briefing da spec ativa + enforcement L2 (preview — cf. Spec 0023)   |

Todo comando aceita `--dry-run` para preview e `--help` para detalhes. Sem argumentos, a CLI inicia o wizard.

## Workflow Runtime (preview)

> **Preview — UX may evolve.** Capacidades em validação empírica. Versão estável requer ao menos 1 consumidor externo + materialização das candidatas próximas do backlog.

<p align="center">
  <img src="https://raw.githubusercontent.com/rosanarezende/ai-guidelines/main/docs/assets/ai-guidelines-dx-flow.png" alt="ai-guidelines workflow runtime — sessão típica em 4 momentos: wizard, execução, estado publicado, enforcement" width="880">
</p>

A partir do `1.1.0-preview`, a CLI ganha um **runtime operacional** que opera sobre o ciclo de governança sem substituí-lo:

- **`npx ai-guidelines workflow`** — wizard com opções declarativas para navegar specs ativas, retomar trabalho, publicar estado e diagnosticar drift.
- **`npx ai-guidelines continue`** — briefing da spec ativa com enforcement de pré-condições estruturais (recusa narrativamente quando a spec não está pronta para execução).
- **Estado canônico no repo** — `.governance/runtime/active-specs.yml` lista specs ativas com schema fechado; descoberta cross-machine sem dashboard externo.

Runtime nunca embute LLM: integração com agentes IA acontece via ferramenta externa sob comando humano. Detalhes operacionais e decisões arquiteturais em [`.governance/specs/0023-workflow-runtime/`](.governance/specs/0023-workflow-runtime/).

## Como funciona (em um minuto)

A governança vive em `.governance/` no consumidor — `registry.yml` como SSOT estruturado, Markdown derivado para humanos, e reservas para intake, handoff e telemetria à medida que o framework evolui.

A CLI compila projeções desse estado para canais distintos:

- **Humanos:** README, CONTRIBUTING e Markdown derivado em `.governance/`.
- **Pipelines:** `living-docs.yml` gerado a partir de testes `[BR-CLI-*]`, protegido por drift guard fatal.
- **Agentes IA (opt-in):** `AGENTS.md` compilado + provider entrypoints sincronizados (`CLAUDE.md`, `GEMINI.md`, `.openai/instructions.md`, etc.).

A distribuição usa dois modos de update:

- **`managed-block`** — atualiza apenas o conteúdo entre marcadores `<!-- ai-guidelines:managed-start -->` e `<!-- ai-guidelines:managed-end -->`. Tudo fora dos marcadores é seu — fica intocado entre updates.
- **`mirror`** — overwrite total para boilerplates SDD (bridge legado em transição para composição modular via recipes, conforme Spec 0021).

Detalhamento técnico em [`docs/cli/ai-guidelines-cli.md`](docs/cli/ai-guidelines-cli.md). Topologia canônica em [`.core/governance/GOVERNANCE-CATALOG.md`](.core/governance/GOVERNANCE-CATALOG.md).

## Integrações AI-agnósticas (opt-in)

| IA / Ferramenta    | Provider entrypoint                      | Validação                   |
| :----------------- | :--------------------------------------- | :-------------------------- |
| Claude Code        | `CLAUDE.md` + `.claudeignore`            | ✅ E2E validado             |
| Gemini CLI         | `GEMINI.md` + `.aiexclude`               | ✅ E2E validado             |
| Codex / OpenAI CLI | `.openai/instructions.md` + `.gptignore` | ✅ E2E validado             |
| GitHub Copilot     | `.github/copilot-instructions.md`        | 🔧 Distribuição configurada |
| Cursor             | `.cursor/rules/ai-guidelines.mdc`        | 🔧 Distribuição configurada |
| Windsurf           | `.windsurfrules`                         | 🔧 Distribuição configurada |
| Aider              | `CONVENTIONS.md` + `.aiderignore`        | 🔧 Distribuição configurada |
| Outras IAs         | `AGENTS.md` como fallback universal      | 🔄 Esperado                 |

> ✅ **E2E validado:** validação empírica feita pela mantenedora em uso real ou em smoke tests dedicados.
> 🔧 **Distribuição configurada:** provider entrypoint gerado conforme contrato documentado da IA; comportamento ponta-a-ponta com a IA real ainda não foi testado.
>
> Contribuições com evidência de uso real são bem-vindas.

## Documentação & contribuição

- [`.core/governance/GOVERNANCE-CATALOG.md`](.core/governance/GOVERNANCE-CATALOG.md) — topologia canônica (paths, gêneros, lookup)
- [`.core/governance/ARCHITECTURE.md`](.core/governance/ARCHITECTURE.md) — arquitetura macro da CLI
- [`docs/`](docs/) — guias técnicos e features
- [`AGENTS.md`](AGENTS.md) — workflow para humanos e agentes IA neste repositório
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — como contribuir, setup local, convenções
- [`.specify/specs/roadmap/backlog.md`](.specify/specs/roadmap/backlog.md) — backlog vivo do framework
- [`CHANGELOG.md`](CHANGELOG.md) — histórico de versões

## Licença

[Apache-2.0](LICENSE) © 2026 Rosana Rezende.

Permite uso comercial. Mantenha o aviso de copyright e indique modificações ao distribuir. A cláusula de patentes (§3) protege quem usa e quem contribui.

---

<p align="center"><sub>Feito no Brasil · contribuições em PT-BR e EN são bem-vindas</sub></p>
