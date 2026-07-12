# \_org-simulation — simulação de uma org multi-repo (anonimizada)

> **Não-autoridade · anonimizada** (`acme-*`, **sem nome/URL real**). Valida o modelo decidido em
> `../research/2026-06-25-work-graph-model.md`: a camada **`intent`** (governança global), os **6 tipos** de
> trabalho, o **registry per-kind**, o back-ref `intent: <id>`, e o **banco** (agregado derivado).
>
> **Convenção:** chaves/campos de YAML em **inglês**; **conteúdo** em **português**.

## Estrutura

- `acme-governance/` — o **meta-repo** (camada de governança global): `intents/` (os **planos** das intents) +
  `active-work.aggregate.yml` (o **banco** = união **derivada** dos grafos publicados pelos repos).
- **7 repos de trabalho** — cada um com `registry/<kind>.yml` (índice dos seus trabalhos) e, quando denso,
  `works/<kind>_<slug>/`:
  - `acme-mfe-platform` (a plataforma de MFEs — registry + runtime)
  - `acme-design-system` (componentes compartilhados)
  - `acme-api` (backend)
  - `acme-shell` (o host que monta os MFEs)
  - `acme-mfe-identity` (MFEs de identidade: login, signup, conta)
  - `acme-mfe-support` (MFE de ajuda/suporte — sob demanda + proativa)
  - `acme-mfe-growth` (outros MFEs: dashboard, billing)

## O que esta baseline mostra

- **Intents multi-repo** vivem no **meta-repo**; **trabalhos** vivem nos repos (**SSOT**) com back-ref `intent: <id>`.
- **Trabalho reativo standalone** (`fix`/`patch`) **sem intent** — aparece no banco mesmo assim (decisão _intent
  opcional/emergente_).
- Estados mistos: **em andamento** (`active`) e **finalizado** (`done`).
- O **banco** agrega **tudo** (com ou sem intent) com ids namespaceados `<repo>/<id>`.

> **Iteração 1 — `intent-004` (login system), modelagem exploration-first:** a intent nasce com 2 perguntas → 2
> explorations (form validado no DS? · suporte proativo viável?). As **deliveries nascem só após a retroalimentação**
> (não pré-quebradas). `acme-mfe-support` é **repo próprio** (segue o diagrama, não o growth).
