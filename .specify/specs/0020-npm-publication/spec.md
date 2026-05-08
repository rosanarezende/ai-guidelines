# Spec 0020 — npm-publication

> Status: Done (PR #6 — 2026-05-08)
> Author: rosanarezende
> Date: 2026-05-07
> Owner: rosanarezende
> Tipo de spec: deterministic
> Plan: [`./plan.md`](./plan.md)

> **Princípio de imutabilidade:** após status `In Review`, este arquivo só
> muda por consenso explícito. Decisões em aberto vão para `plan.md` (vivo).
>
> **Princípios da Escrita:** ver `.core/process/spec-foundation.md` §
> "Princípios da Escrita" (agnosticismo humano/IA, BR IDs, contratos).

---

## 🎯 Objetivo

O framework `ai-guidelines` está há ciclos sendo descrito como "instalável via `npx`" mas nunca foi publicado no registry npm — `package.json` carrega `"private": true`, versão interna em `1.4.0` e nenhum consumidor externo consegue de fato rodar `npx ai-guidelines init`. Auditoria em 2026-05-07 mostrou que o pacote está ~90% pronto (nome `ai-guidelines` configurado, `bin`/`files`/`dependencies` corretos); o gap é cerimonial (metadados de publish, ADR de naming, smoke tests cross-SO) e bloqueia a narrativa de portfólio que pressupõe pacote real instalável.

O resultado esperado é o pacote `ai-guidelines@1.0.0` publicado no registry público e instalável de fora do repositório, com `npx ai-guidelines init` funcionando em diretório vazio e em projeto existente, validado por CI nos três sistemas operacionais (Windows, Linux, macOS) sobre o tarball de publish (e não sobre o checkout local). A decisão de naming — `ai-guidelines` não-scoped como package principal, org `@ai-guidelines` reservada para extensões — fica registrada em ADR formal.

> **Recorte de escopo — 2026-05-08.** A ativação do `pr-curator` como GitHub Action ativa, originalmente listada nesta spec, foi extraída para spec própria (`pr-curator-action`, registrada em `roadmap/backlog.md`). Auditoria durante a Fase 1 mostrou que o comando `pr-curator` ainda não existe como código na CLI — apenas como documento de workflow editorial — e construir o Action exigiria implementar a feature do zero, o que extrapola o escopo "publicar pacote no npm". Publicação no registry não depende dessa automação cross-repo; o consumidor `npx ai-guidelines init` funciona independentemente.

---

## 📦 Escopo

### Dentro do escopo

- Ajuste de `package.json` para publish: remover `"private": true`; adicionar `license`, `repository`, `homepage`, `bugs`, `keywords`, opcional `engines`; bumpar `version` para `1.0.0` (1.4.0 interno nunca saiu; 1.0.0 inicia a série pública).
- ADR de naming: `ai-guidelines` não-scoped como package principal; org `@ai-guidelines/<addon>` reservada para extensões futuras; rationale de registry público vs paid org documentado.
- Smoke tests de `npx ai-guidelines init` rodando contra o **tarball** (via `npm pack` + `npm install <tarball>`) em diretório vazio e em projeto existente, garantindo que o pacote publicado — não o checkout — produz o resultado esperado.
- CI multi-SO (Windows / Linux / macOS) executando os smoke tests sobre o tarball; matriz mínima como gate de release.
- Documentação consumer-facing no `README`: seção de instalação trocando orientação interna `yarn guidelines` por `npx ai-guidelines`, mantendo seção de contribuidor distinta.
- Publish efetivo de `ai-guidelines@1.0.0` no registry npm público.

### Fora do escopo (vira spinoff ou fica em outra spec)

- Reorganização canônica de `docs/` / `adrs/` / `.core/rules/` — fica para Spec 0021 (`governance-information-architecture`); 0020 só toca `README.md` superficialmente e adiciona um ADR.
- Dashboard de adoção / telemetria de instalações — depende de pacote publicado e fica para a candidata correspondente em `roadmap/backlog.md` (Now #4).
- Padrão distribuído de fragmentação `AGENTS.md` no consumidor — fica para Spec 0011.
- Versionamento semântico avançado / canários multi-tag — começa simples (`latest` apenas); evolui se houver demanda real pós-1.0.0.
- Migração para GitHub Packages ou registry privado — registry público padrão (gratuito) é suficiente; ADR registra que privado só se justificar acesso restrito futuro.
- **Ativação do `pr-curator` como GitHub Action ativa** — extraído em 2026-05-08 para spec própria (`pr-curator-action`, ver `roadmap/backlog.md`). Implementar requer primeiro o comando como feature da CLI; ortogonal à publicação npm. ADR 0009 (decisão de auth GitHub App vs PAT fino) permanece válido e é insumo da spec futura.

---

## ✅ Critérios de Aceite (alto nível)

- [x] `npx ai-guidelines init` funciona em diretório vazio: smoke test verde sobre o tarball em Windows, Linux e macOS. _(sub-bloco C + matriz D verde nos 6 jobs em 2026-05-08.)_
- [x] `npx ai-guidelines init` funciona em projeto existente sem quebra de arquivos pré-existentes; smoke test verde nos 3 SOs. _(idem.)_
- [x] Comando `update` aplica patches sob `managed-block` em consumidor recém-init (contrato herdado da Spec 0019, validado aqui ponta-a-ponta). _(idem; suite `update-managed-block.test.mjs`.)_
- [x] CI matriz (Windows / Linux / macOS) verde sobre o tarball antes do publish. _(workflow `smoke-multi-os.yml`, 6 jobs verdes em 2026-05-08.)_
- [x] ADR de naming registrado em `adrs/` com rationale de não-scoped + reserva de `@ai-guidelines`. _(ADR 0009 — `adrs/0009-package-naming-and-registry.md`.)_
- [ ] Pacote `ai-guidelines@1.0.0` publicado no registry npm público e instalável (`npm view ai-guidelines version` retorna `1.0.0`). _(Fase 2 — requer gate humano explícito em 2.G.4.)_
- [x] `README.md` com seção consumer-facing usando `npx ai-guidelines` (orientação interna `yarn guidelines` permanece em seção de contribuidor). _(commit `18b116a`, sub-bloco F.)_
- [x] Pipeline de check + test verde (`yarn check && yarn test`). _(`yarn check:repo` verde local em 2026-05-08: 266/266; CI ai-guidelines-check + content-guardrails verdes.)_
- [ ] PR Draft revisado e aprovado por humano antes de Ready. _(Gate humano — 3.6.)_

---

## 🛠️ Dependências e impactos (alto nível)

- **Pré-requisitos:**
  - Spec 0005 (curadoria público/privado) — concluída ✓.
  - Spec 0019 (bootstrap-consumidor-e-runtime) — mergeada ✓ (entrega contrato `managed-block` + comando `update` que esta spec valida em smoke test real).
  - Naming decision — resolvida em 2026-05-07 (`ai-guidelines` não-scoped); a spec apenas formaliza em ADR.
- **Specs afetadas:**
  - Spec 0021 (`governance-information-architecture`) — herda repo já em estado publicado; 0020 → 0021 evita churn no `README` durante publish.
  - Candidata "dashboard de adoção" (Now #4) — passa a poder medir adoção real pós-publish.
- **Cross-refs com specs irmãs:**
  - **Spec 0019** — entrega contrato de update; 0020 só publica sob esse contrato (não redefine `managed-block`).
- **Riscos macro:**
  - **Janela de exposição do nome:** alguém pode publicar `ai-guidelines` antes de 0020 fechar — mitigação adotada foi promover a spec imediatamente para fechar a janela; janela de `unpublish` do npm é 72h após publish.
  - **Visibilidade pública** (cf. ADR 0007): pacote publicado é leitura indireta do repositório — qualquer conteúdo em `files` do `package.json` (`cli`, `.core`, `docs`, `README.md`, `CHANGELOG.md`) vai ao registry; auditar antes do publish.
  - ~~**Tokens cross-repo do `pr-curator`:**~~ — risco transferido para a spec `pr-curator-action`. ADR 0009 já registrou a escolha (GitHub App preferencial; PAT fino como bootstrap) e permanece válido para a spec futura.

---

## 📚 Referências

- Specs relacionadas: 0005, 0019, 0021.
- ADRs aplicáveis: ADR 0005 (curadoria público/privado), ADR 0007 (visibilidade pública), ADR a criar nesta spec (naming + registry).
- Decisão de naming: `roadmap/backlog.md` § "Bloqueadores resolvidos" (entrada de 2026-05-07).
- Auditoria de prontidão do `package.json`: registrada em `roadmap/backlog.md` § "Now" (2026-05-07).
