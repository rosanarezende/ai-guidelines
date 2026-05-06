# Spec 0019 — Bootstrap Consumidor e Runtime

> Status: Draft
> Author: Antigravity
> Date: 2026-05-06
> Owner: Rosana Rezende
> Tipo de spec: mixed
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Plan: [`./plan.md`](./plan.md)

> **Princípio de imutabilidade:** após status `In Review`, este arquivo só
> muda por consenso explícito. Decisões em aberto vão para `plan.md` (vivo).
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

- Scaffolding de guardrails específicos por provedor (ex: `.claudeignore`) e trampolins mínimos (`CLAUDE.md` com um pointer).
- Sincronização e distribuição da pasta `.specify/templates/` para `.ai-guidelines/templates` nos consumidores no `init/adopt`.
- Separação em categorias do wizard interativo (opt-ins editoriais separados de infraestrutura).
- Revisão do compilador do runtime `AGENTS.md` para garantir clareza semântica, eliminando duplicações.
- Remoção do template legado `AGENTS-pointer`.

### Fora do escopo (vira spinoff ou fica em outra spec)

- **Reabertura do baseline de conteúdo (Spec 0018):** Nenhuma alteração nas regras aprovadas, apenas mudança na _disposição_ (arquitetura do payload).
- **Hierarquia por subdiretórios:** Essa é responsabilidade da candidata _regra-hierarquia_ (Spec 0011).

---

## ✅ Critérios de Aceite (alto nível)

- [ ] A CLI distribui corretamente os templates SDD (ex. spec-boilerplate) ao consumidor.
- [ ] O wizard da CLI apresenta categorização distinta para features editoriais e operacionais (infra).
- [ ] Trampolins para modelos específicos são criados por padrão para conter e desestimular "Context Rot".
- [ ] O arquivo compilado `AGENTS.md` apresenta estrutura limpa, coesa e com zonas declaradas.
- [ ] Pipeline de check + test verde, sempre (`yarn check && yarn test`).
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
