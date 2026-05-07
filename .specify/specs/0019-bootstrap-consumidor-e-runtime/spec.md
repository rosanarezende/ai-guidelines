# Spec 0019 — Bootstrap Consumidor e Runtime

> Status: Done (PR #5 — 2026-05-07)
> Author: Antigravity
> Date: 2026-05-06
> Owner: Rosana Rezende
> Tipo de spec: mixed
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Plan: [`./plan.md`](./plan.md)

> **Princípio de imutabilidade:** após status `In Review`, este arquivo só
> muda por consenso explícito. Decisões em aberto vão para `plan.md` (vivo).
>
> **Reabertura consensuada (2026-05-07):** owner aprovou ampliar o escopo
> para absorver o spinoff `template-lifecycle-e-update`, padronizar uma
> política de update unificada (marcadores `managed-block` + modo `mirror`),
> mover adapter rules dos trampolins (eliminando wrapper `### Provider Adapters`
> do `AGENTS.md` compilado) e adicionar o comando dedicado `update`. Motivação:
> a primeira leva de consumidores não pode receber uma política de update que
> mudaria pouco depois — fixar contrato agora evita re-trabalho e drift.
>
> **Princípios da Escrita:** ver `.core/process/spec-foundation.md` §
> "Princípios da Escrita" (agnosticismo humano/IA, BR IDs, contratos).

---

## 🎯 Objetivo

A integração inicial de consumidores ao ai-guidelines deixa lacunas críticas na governança local. Atualmente, os consumidores acumulam arquivos de configuração isolados para diferentes IAs (`CLAUDE.md`, `.codex/`, `GEMINI.md`) sem alinhamento com a fonte canônica, o que causa drift ("Context Rot"). Além disso, utilitários fundamentais como `.specify/templates/` não são distribuídos.

O `AGENTS.md` compilado resultante também precisa de uma revisão topológica (remover duplicações, melhorar a ordem semântica, definir o futuro do `AGENTS-pointer`). E na CLI, o wizard mistura categorias operacionais (editoriais vs. infraestrutura), causando fricção na adoção. O objetivo desta spec é resolver a cadeia completa de scaffolding local e a coerência do runtime que os consumidores recebem.

---

## 📦 Escopo

### Dentro do escopo

- Scaffolding de guardrails específicos por provedor (ex: `.claudeignore`) e trampolins (`CLAUDE.md`, `GEMINI.md`, `.openai/instructions.md`, etc.) com hard-redirect para `AGENTS.md`.
- **Adapter content colocalizado no trampolino**: regras específicas de cada provider (`.core/rules/adapters/<id>.md`) deixam de viver no `AGENTS.md` compilado e passam a ser injetadas dentro do trampolino do provider correspondente, eliminando o wrapper `### Provider Adapters`.
- Sincronização e distribuição da pasta `.specify/templates/` para `.ai-guidelines/templates` nos consumidores no `init/adopt`.
- **Política de update unificada** para o conteúdo distribuído ao consumidor:
  - Modo `managed-block`: trampolins e ignore files recebem marcadores `<!-- ai-guidelines:managed-start v=1 -->` ... `<!-- ai-guidelines:managed-end -->`. Updates substituem somente o bloco interno; conteúdo legado/customizado fora do bloco é preservado, com comentário humano em PT-BR sinalizando a presença de conteúdo legado.
  - Modo `mirror`: `.ai-guidelines/templates/` é overwrite total (boilerplates SDD não são editados in-place; customização ocorre em `.specify/specs/<slug>/`).
- **Comando dedicado `update`**: lê `.ai-guidelines/config.json` existente e re-aplica trampolins + templates + recompilação do `AGENTS.md` de forma idempotente e não-interativa, sem modificar o config.
- Separação em categorias do wizard interativo (opt-ins editoriais separados de infraestrutura).
- Refatoração do wizard interativo para prompts robustos de seleção múltipla com `checkbox`, incluindo adoção de biblioteca especializada aprovada pelo owner.
- Formalização do contrato de execução local da CLI via scripts `yarn`, compatível com Yarn PnP e com a dependência de prompts em runtime.
- Revisão do compilador do runtime `AGENTS.md` para garantir clareza semântica, eliminando duplicações.
- Remoção do template legado `AGENTS-pointer`.

### Fora do escopo (vira spinoff ou fica em outra spec)

- **Reabertura do baseline de conteúdo (Spec 0018):** Nenhuma alteração nas regras aprovadas, apenas mudança na _disposição_ (arquitetura do payload).
- **Hierarquia por subdiretórios:** Essa é responsabilidade da candidata _regra-hierarquia_ (Spec 0011).
- **Troca ampla de framework de CLI além dos prompts interativos**: a adoção fica restrita ao `@inquirer/prompts` para resolver UX de seleção e não abre escopo para reconstrução total da interface.
- **Notificação proativa de updates disponíveis** (consultar GitHub/npm comparando versão local vs upstream): permanece no `roadmap/backlog.md` como item oportunista; a 0019 entrega a infraestrutura de marcadores que viabiliza o update determinístico, mas não o sensor que avisa quando atualizar.

---

## ✅ Critérios de Aceite (alto nível)

- [x] A CLI distribui corretamente os templates SDD (ex. spec-boilerplate) ao consumidor.
- [x] O wizard da CLI apresenta categorização distinta para features editoriais e operacionais (infra).
- [x] Trampolins para modelos específicos são criados por padrão para conter e desestimular "Context Rot".
- [x] O arquivo compilado `AGENTS.md` apresenta estrutura limpa, coesa e com zonas declaradas.
- [x] Adapter rules de cada provider são injetadas dentro do trampolino correspondente; o `AGENTS.md` compilado não contém mais a seção `### Provider Adapters`.
- [x] Trampolins e ignore files são gerados dentro de marcadores `managed-block` que permitem update não-destrutivo em arquivos preexistentes.
- [x] O comando `update` re-aplica trampolins, templates e recompilação a partir do `config.json` existente, de forma idempotente e sem modificar o config.
- [x] Pipeline de check + test verde, sempre (`yarn check && yarn test`).
- [ ] PR Draft revisado e aprovado por humano antes de Ready.

---

## 🔬 Pesquisa de contexto

- [`./decision-brief.md`](./decision-brief.md) — gate humano de decisões pré-design (specs `evidence-driven` ou `mixed`).
- Insight original registrado no fechamento da Spec 0018 e documentado em `.specify/specs/roadmap/backlog.md`.

---

## 🧠 Decisão de Fusão

- **Critério de fusão**: O `bootstrap-consumidor-e-runtime` absorve inteiramente a candidata `scaffolding-inteligente-de-provedores`.
- **Análise**: O scaffolding de trampolins é apenas uma das etapas do bootstrap/início do consumidor. Tratar separadamente levaria a duas manutenções distintas na mesma CLI de init.
- **Conclusão**: Absorvido.

---

## 🛠️ Dependências e impactos (alto nível)

- **Pré-requisitos**: Spec 0018 concluída e baseline congelado.
- **Riscos macro**: Mudança na arquitetura de prompts gerados aos consumidores pode impactar fluxos já estabelecidos, demandando cautela em atualizações.

---

## 📚 Referências

- Spec 0018 — Rules Content Deepening
- Backlog (`bootstrap-consumidor-e-runtime`)
