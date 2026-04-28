# Spec 0016 — Adapters Opt-in para Trackers (GitHub Projects / Jira / Linear)

> Status: Draft <!-- Draft | In Review | Active | Done -->
> Author: Antigravity
> Date: 2026-04-27
> Owner: Rosana Rezende
> Plan: [`./plan.md`](./plan.md)

> **Princípio de imutabilidade:** após status `In Review`, este arquivo só
> muda por consenso explícito. Decisões em aberto vão para `plan.md` (vivo).

---

## 🎯 Objetivo

A governança `ai-guidelines` gerencia o ciclo de desenvolvimento SDD via repositório local (`tasks.md`, `backlog.md`, `NEXT.md`), o que é ideal para a Single Source of Truth do código. No entanto, equipes e stakeholders do mundo real exigem visibilidade e controle usando plataformas de tracking tradicionais (GitHub Projects, Jira, Linear).

O objetivo desta spec é padronizar **Adapters Opt-in** para que os agentes de IA saibam como integrar as atualizações do repositório (ex. marcação de progresso, fechamento de specs) diretamente nestas plataformas. Isso elimina o trabalho manual e previne que o tracker fique defasado em relação à realidade do repositório.

---

## 📦 Escopo

### Dentro do escopo

- Criação de features opt-in no CLI (`tracker-github`, `tracker-jira`, `tracker-linear`) injetáveis via comando `adopt`.
- Documentação de regras de negócio (`.core/rules/opt-in/tracker-*.md`) definindo como o RPI e SDD local devem refletir nos tickets.
- Sincronização básica de estados: instrução ao agente para mover issues/tickets ao iniciar ou fechar uma fase da Spec.

### Fora do escopo (vira spinoff ou fica em outra spec)

- Integração bidirecional robusta via webhooks/CI (o foco aqui é na atuação do agente interagindo com as APIs via CLI/MCP server do tracker durante a sessão, não em listeners server-side).

---

## ✅ Critérios de Aceite (alto nível)

- [ ] O comando `adopt` passa a oferecer suporte a `--feature tracker-github` (e outros).
- [ ] Regras de governança agnósticas documentadas sobre como mapear a pasta `.specify` para os Epics/Tickets da ferramenta externa.
- [ ] `yarn check && yarn test` verde (sempre).
- [ ] PR Draft revisado e aprovado por humano antes de Ready.

---

## 🛠️ Dependências e impactos (alto nível)

- **Pré-requisitos**: Spec 0008 (Governance Coherence) define o workflow básico das features opt-in.
- **Riscos macro**: Complexidade de setup para o consumidor final (ex: a necessidade de configurar tokens de API ou MCP servers para que o agente possa interagir com o Jira/Linear).
