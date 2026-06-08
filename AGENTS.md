# AGENTS.md

> **[MANDATÓRIO — HARNESS LOCK]** É proibido rodar `git commit --no-verify` ou commitar com hooks/contrato ausentes. Toda submissão deve obedecer ao contrato operacional em `.core/governance/script-contracts.yml`, que projeta `package.json#scripts`, `.husky/*`, templates e `docs/scripts.md`. Se os hooks não estiverem instalados ou o contrato estiver divergente, pare e restaure o setup antes de commitar.

Este arquivo define o fluxo obrigatório para qualquer IA atuando neste repositório.

> **Atuando para um humano contribuidor?** Leia também
> [`CONTRIBUTING.md`](CONTRIBUTING.md) para os 4 workflows por persona (ajuste rápido, feature/refactor, spec consolidada, agente IA com autonomia). Este `AGENTS.md` cobre a parte operacional do agente; `CONTRIBUTING.md` cobre o fluxo humano que o agente está apoiando.

## Contexto Local

Este repositório é o próprio framework `ai-guidelines`, não um consumidor do framework. Aqui vivem o baseline canônico em `.core/` e a CLI em `cli/` que serão distribuídos para outros repositórios via `init`, `adopt` e `providers`.

**O framework é governance-first, AI-as-channel** (`[ADR 0018]`): o core ontológico é governança de engenharia repo-first; a SSOT do estado vive em `.governance/specs/` (canônico em diante per `[ADR 0019]`), com `.specify/specs/` permanecendo como bridge legada via double-lookup. `AGENTS.md` é **um dos outputs runtime** da governança — o canal de integração AI-agnóstica — não o artefato central do framework. Outros canais (Markdown derivado para humanos, `living-docs.yml` para pipelines) coexistem como projeções da mesma SSOT.

O `AGENTS.md` raiz tem papel duplo:

- documentação operacional local para humanos e agentes que contribuem neste repositório;
- artefato runtime de exemplo, com o bloco `<AI_GUIDELINES>` compilado pelo próprio framework — exemplificando o canal AI-agnóstico em ação.

Conteúdo específico deste repositório deve ficar fora de `<AI_GUIDELINES>`. O bloco compilado não é editado manualmente.

**Onde mora cada coisa?** A topologia canônica (paths, gêneros de trabalho, regras de lookup, lifecycle) está em [`.core/governance/GOVERNANCE-CATALOG.md`](.core/governance/GOVERNANCE-CATALOG.md). Para detalhes técnicos densos (bounded contexts, invariantes, glossário): [`.core/governance/ARCHITECTURE.md`](.core/governance/ARCHITECTURE.md) (lean) e [`ARCHITECTURE-REFERENCE.md`](.core/governance/ARCHITECTURE-REFERENCE.md) (denso).

## Quickstart Local

Este workspace usa Yarn 4 com Plug'n'Play. Para execução local da CLI, o caminho suportado é `yarn guidelines ...`.

```bash
yarn setup              # = install --immutable + build:all
yarn format             # prettier --write
yarn validate           # gate local: format:check + build:all + test + living-docs:check
yarn guidelines adopt --target . --dry-run
```

> **Referência única dos scripts:** [`docs/scripts.md`](docs/scripts.md) tem o mapa completo (categoria, composição, hooks, workflows). Use este Quickstart só para boot rápido; consulte `docs/scripts.md` antes de qualquer dúvida sobre o que cada script faz.

> **Nota sobre `dist/` (TemplateEngine):** o CLI mjs em `cli/` invoca dinamicamente a TemplateEngine compilada em `dist/` para renderizar recipes mapeadas (sub-bloco 4.C.0 da Spec 0021). Quando uma recipe existe mas `dist/` ainda não foi gerado, o fluxo **falha rapidamente** com mensagem orientada a diagnóstico (em vez de cair silenciosamente no mirror legado — comportamento intencional, ADR-aligned, para evitar regressão silenciosa). **Se estiver rodando o CLI localmente sem `yarn build` prévio**, espere essa falha — execute `yarn build` (ou `yarn build:all` para também regenerar `rules.json`) antes. No pacote publicado via NPM, `prepack: yarn build:all` garante que tanto `dist/` quanto `rules.json` estão sempre presentes; `engine-unavailable` em produção indica regressão real de packaging.

<AI_GUIDELINES>

## Runtime Bootstrap

This file is the AI-channel bootstrap, not the governance kernel.

- Repository state beats transcript, memory, and agent output.
- For a fresh AI session, run `yarn guidelines handoff [spec]` and follow the emitted reading order.
- The script contract at `.core/governance/script-contracts.yml` is the operational SSOT for scripts, hooks, workflows, and docs.
- Full rules remain governed in `.core/rules/**`, `.core/rules/catalog.md`, `.core/rules/_meta/rules.json`, and the rule ledger.
- Never bypass hooks with `--no-verify`; restore setup if hooks or generated script surfaces are missing.
- Never push without explicit maintainer authorization.
- Human Gate decides advancement; Ready is not merge authorization.
- Runtime commands must not call LLMs; AI is a synthesis/review channel.

### Centralized Governance

The root `AGENTS.md` is the channel bootstrap. Project-specific content must remain outside of the `<AI_GUIDELINES>` block.

### Consumer Bootstrap

Consumer-local ai-guidelines assets live under `.ai-guidelines/`. Templates mirrored by the CLI live in `.ai-guidelines/templates/`. Specs and roadmap remain under `.specify/specs/`.

</AI_GUIDELINES>
