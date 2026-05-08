# Plan — Spec 0020 npm-publication

> Spec: [`./spec.md`](./spec.md)
> Status: Draft

> **Vive durante a execução.** Diferente da `spec.md` (imutável após In Review),
> este arquivo é atualizado conforme o entendimento técnico evolui. Decisões
> revisitadas devem registrar a anterior em nota, não apagar o histórico.

---

## 🏗️ Design e Arquitetura

### Princípio guia

Publish enxuto sobre infra existente: o pacote já está ~90% pronto no `package.json` e o contrato de update foi resolvido pela Spec 0019. O design aqui é checklist de cerimônia (metadados, ADR, smoke tests sobre tarball, CI matriz, README), não invenção arquitetural. O único trade-off não-trivial é o mecanismo de auth do `pr-curator` (PAT fino vs GitHub App) — registrado em ADR para fechar a discussão.

### Componentes ou Sub-blocos

#### [A] Metadados de publish em `package.json`

**Estado atual:** `package.json` em `1.4.0` interno, `"private": true`, sem `license`/`repository`/`homepage`/`bugs`/`keywords`/`engines`. `bin`, `files`, `dependencies` corretos.

**Decisão:**

- Remover `"private": true`.
- Adicionar campos canônicos: `license` (`Apache-2.0`, conforme ADR 0006), `repository` (`type: git, url: git+https://github.com/rosanarezende/ai-guidelines.git`), `homepage`, `bugs.url`, `keywords` (curados — `ai`, `governance`, `agents`, `claude`, `copilot`, `cli`).
- Adicionar `engines.node` com piso `>=22.0.0` — CI atual roda Node 24, mas o piso técnico real é 22 (scripts `test`/`test:coverage` usam `--experimental-default-config-file` e `--experimental-test-coverage`, ambos disponíveis a partir do Node 22).
- Bumpar `version` de `1.4.0` para `1.0.0` (1.4.0 interno nunca foi publicado; 1.0.0 inicia a série pública). Registrar a quebra de versionamento no `CHANGELOG.md`.

**Mudanças em arquivos:**

- `package.json` — todos os ajustes acima.
- `CHANGELOG.md` — entrada `[1.0.0]` documentando início da série pública e justificativa do reset de versão.

#### [B] ADR de naming + registry

**Estado atual:** decisão de naming resolvida em 2026-05-07 (registrada em `backlog.md`); sem ADR formal.

**Decisão:**

- Criar `adrs/0009-package-naming-and-registry.md` documentando:
  - Decisão: package principal publicado como `ai-guidelines` (não-scoped); org `@ai-guidelines/<addon>` reservada para extensões futuras.
  - Critério decisivo: `npx ai-guidelines init` é mais memorável e narrativamente mais forte para portfólio do que `@<scope>/core`.
  - Registry: público padrão (gratuito); paid org / privado fica como gatilho condicional documentado.
  - Auth do `pr-curator`: decisão entre PAT fino vs GitHub App (preferência por GitHub App quando o uso justificar; PAT fino como bootstrap aceitável).
  - Janela de unpublish do npm: 72h — usar como rede de segurança em caso de bug crítico no primeiro publish.

**Mudanças em arquivos:**

- `adrs/0009-package-naming-and-registry.md` (novo).
- `adrs/README.md` — registrar o novo ADR no índice (se houver convenção de listagem).

#### [C] Smoke tests sobre tarball

**Estado atual:** existem testes em `cli/**` e `tests/**` rodando sobre o checkout. Nenhum teste valida o pacote como ele será **instalado** — i.e., a partir do tarball gerado por `npm pack`.

**Decisão:**

- Adicionar suíte de smoke em `tests/smoke/` rodando:
  1. `npm pack` para gerar tarball local.
  2. Em diretório temporário vazio: `npm install <tarball>` + `npx ai-guidelines init`; validar artefatos esperados (`.ai-guidelines/`, `AGENTS.md`, etc.).
  3. Em diretório temporário com projeto pré-existente (mock contendo `package.json` + arquivos sentinela): mesmo fluxo; validar que `init` não sobrescreve arquivos existentes fora dos `managed-block`.
  4. Validação de `update` aplicando patch sob `managed-block` em consumidor recém-init (contrato Spec 0019).
- Smoke tests usam apenas Node + utilitários cross-platform (sem `bash`/`sh` específico) para rodarem em Windows nativo.

**Mudanças em arquivos:**

- `tests/smoke/init-empty.test.mjs` (novo).
- `tests/smoke/init-existing-project.test.mjs` (novo).
- `tests/smoke/update-managed-block.test.mjs` (novo).
- `tests/smoke/helpers/tarball.mjs` (novo) — utilitário de `npm pack` + setup de sandbox.

#### [D] CI matriz multi-SO

**Estado atual:** CI atual roda em Linux apenas (a confirmar em D.1 lendo `.github/workflows/`).

**Decisão:**

- Adicionar (ou estender) workflow GitHub Actions com matriz `os: [ubuntu-latest, windows-latest, macos-latest]` × `node: [20.x]` (versão LTS atual; expandir se `engines` permitir).
- Job de smoke roda **após** `npm pack` e instala o tarball — não roda diretamente sobre o checkout.
- Falha em qualquer SO bloqueia merge e bloqueia publish.

**Mudanças em arquivos:**

- `.github/workflows/smoke-multi-os.yml` (novo) ou estender `.github/workflows/<existente>.yml` se já houver.

#### [E] ~~`pr-curator` como GH Action ativa~~ — extraído em 2026-05-08

**Status:** ⛔ **REMOVIDO desta spec.** Auditoria durante a Fase 1 mostrou que o comando `pr-curator` **não existe** como código na CLI (revisão de `cli/features/{core,opt-in}/` em 2026-05-08) — apenas como documento de workflow editorial referenciado em ADR/CHANGELOG/docs. Construir o Action exigiria implementar a feature CLI primeiro, escopo que extrapola a publicação npm. A spec `pr-curator-action` foi criada em `roadmap/backlog.md` para tratar esse trabalho.

**Estado atual histórico (pré-recorte):** `pr-curator` existe como código no CLI; não está plugado como Action real. _(Esta afirmação revelou-se incorreta na auditoria de 2026-05-08; o documento de workflow editorial foi confundido com implementação.)_

**Decisão:**

- Workflow GitHub Action no repositório da mantenedora que:
  - Dispara em `pull_request` com label `growth-relevant`.
  - Usa auth conforme decisão do ADR 0009 (preferência GitHub App; PAT fino como bootstrap).
  - Executa `pr-curator` contra o PR e abre PR cross-repo no destino apropriado.
- Validar com pelo menos um fluxo end-to-end real antes do publish do pacote (não bloqueia 1.0.0, mas registra evidência).

**Mudanças em arquivos:**

- ~~`.github/workflows/pr-curator.yml`~~ — escopo transferido para spec `pr-curator-action`.
- ~~`docs/<...>` — documentação curta de operação~~ — idem.

#### [F] README consumer-facing

**Estado atual:** `README.md` orienta `yarn guidelines …` (uso interno do contribuidor); usuário externo não tem caminho claro.

**Decisão:**

- Adicionar seção "Instalação" no topo do README orientando `npx ai-guidelines init` como caminho canônico para consumidores externos.
- Mover orientação `yarn guidelines …` para seção "Contribuindo" / "Desenvolvimento local", deixando explícito que é fluxo interno.
- Não tocar em `docs/` profundamente — escopo profundo de reorganização fica para Spec 0021.

**Mudanças em arquivos:**

- `README.md` — restruturação superficial (apenas seção de instalação + sinalização do escopo interno do `yarn guidelines`).

#### [G] Publish 1.0.0

**Estado atual:** pacote nunca publicado; `npm view ai-guidelines` retorna 404.

**Decisão:**

- Pré-publish checklist:
  - CI matriz verde sobre tarball (componente D).
  - `npm pack --dry-run` revisado: confirmar que `files` exporta apenas o esperado (sem `tests/`, `.specify/`, `adrs/` se não estiverem em `files`).
  - `CHANGELOG.md` com entrada `[1.0.0]` publicada (não em `[Unreleased]`).
- Publish: `npm publish --access public` (não-scoped já é público por padrão; flag explícita evita ambiguidade).
- Pós-publish: validar `npm view ai-guidelines version` = `1.0.0` e instalar em sandbox limpo final como confirmação manual.
- Janela de unpublish (72h) usada apenas se bug crítico for descoberto; preferência por `1.0.1` patch.

**Mudanças em arquivos:**

- Nenhum arquivo de código — operação de release. Reflexo: `package.json` (já bumpado em A) + `CHANGELOG.md` publicado (já em A).

---

## ✅ Critérios de Aceite Detalhados (DoD operacional)

### Componente [A] — package.json

- [ ] `private: true` removido.
- [ ] `license`, `repository`, `homepage`, `bugs`, `keywords`, `engines.node` adicionados e validados (`npm publish --dry-run` aceita).
- [ ] `version` = `1.0.0`.
- [ ] `CHANGELOG.md` com entrada `[1.0.0] — YYYY-MM-DD` publicada.

### Componente [B] — ADR

- [ ] `adrs/0009-package-naming-and-registry.md` criado com decisão + rationale + auth do `pr-curator`.
- [ ] `adrs/README.md` atualizado (se aplicável).

### Componente [C] — Smoke tests

- [ ] Smoke em diretório vazio passa localmente em Windows, Linux e macOS.
- [ ] Smoke em projeto existente passa e não sobrescreve arquivos fora de `managed-block`.
- [ ] Smoke de `update` aplica patch corretamente sob `managed-block`.
- [ ] Helpers cross-platform (sem dependência de shell POSIX).

### Componente [D] — CI matriz

- [ ] Workflow rodando em `ubuntu-latest`, `windows-latest`, `macos-latest`.
- [ ] Job instala o tarball (não o checkout) antes de rodar smoke.
- [ ] Workflow é gate de merge para a branch.

### ~~Componente [E] — pr-curator~~ — extraído para spec própria em 2026-05-08

- DoD transferido para a spec `pr-curator-action` (registrada em `roadmap/backlog.md`). ADR 0009 (Decisão 3 — auth) permanece insumo dessa spec futura.

### Componente [F] — README

- [ ] Seção "Instalação" com `npx ai-guidelines init` no topo.
- [ ] Orientação `yarn guidelines` realocada para seção interna/contribuidor.

### Componente [G] — Publish

- [ ] `npm publish --dry-run` clean.
- [ ] `npm publish --access public` executado.
- [ ] `npm view ai-guidelines version` = `1.0.0`.
- [ ] Instalação manual final em sandbox limpo bem-sucedida.

### Globais (toda a spec)

- [ ] Pipeline de format/lint verde (`yarn check`).
- [ ] Suíte de testes verde (`yarn test`) — incluindo smoke nova.
- [ ] CI matriz verde nos 3 SOs.
- [ ] Diff em consumidor real revisado: zero quebras (smoke em projeto existente atende; complementar com adopt em consumidor real se disponível).

---

## 🧪 Estratégia de Testes

- **Unit/BDD:** suíte existente em `cli/**/*.test.mjs` e `tests/**/*.test.mjs` permanece o gate de comportamento interno; nenhum unit novo é parte do escopo desta spec.
- **Integração / Smoke (novo):** `tests/smoke/*.test.mjs` rodando contra o **tarball** (`npm pack` → `npm install`) — esta é a contribuição testável central da spec.
- **Manual:** validação pós-publish em sandbox limpo (Windows e Linux no mínimo); fluxo `pr-curator` cross-repo executado uma vez como evidência.

---

## 🛠️ Arquivos modificados (esperado)

- `package.json` — metadados de publish + bump 1.0.0.
- `CHANGELOG.md` — entrada `[1.0.0]` publicada.
- `README.md` — seção consumer-facing de instalação + realocação do `yarn guidelines`.
- `adrs/0009-package-naming-and-registry.md` (novo).
- `adrs/README.md` — índice (se aplicável).
- `tests/smoke/init-empty.test.mjs` (novo).
- `tests/smoke/init-existing-project.test.mjs` (novo).
- `tests/smoke/update-managed-block.test.mjs` (novo).
- `tests/smoke/helpers/tarball.mjs` (novo).
- `.github/workflows/smoke-multi-os.yml` (novo).
- ~~`.github/workflows/pr-curator.yml`~~ — extraído para spec `pr-curator-action` (2026-05-08).
- `.specify/specs/roadmap/backlog.md` — atualizar status da spec ao longo da execução.
- `.specify/specs/roadmap/historico.md` — entrada de encerramento no merge.

---

## ⚠️ Riscos técnicos (concretos)

| Risco                                                   | Mitigação                                                                                                                                                              |
| :------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Smoke em Windows quebra por path separator / shell      | Usar APIs Node (`path.join`, `node:fs`) em todos os helpers; nada de `&&` shell-specific nos workflows; testar localmente em Windows antes de subir CI.                |
| Tarball inclui arquivos sensíveis ou inflado            | Revisar `npm pack --dry-run` no DoD do componente A; ajustar `files` em `package.json` se aparecer ruído.                                                              |
| ~~Auth do `pr-curator` falha em produção~~              | _Risco transferido para a spec `pr-curator-action`._ ADR 0009 permanece como decisão arquitetural válida; mitigação operacional será detalhada no plan da spec futura. |
| Bug crítico no primeiro publish                         | Fluxo de retry: `1.0.1` patch é o caminho preferido; `unpublish` apenas dentro da janela de 72h e só se o bug for crítico (corrupção de estado consumidor).            |
| Bump 1.4.0 → 1.0.0 confunde quem acompanha o repo       | Entrada explícita no `CHANGELOG.md` justificando o reset (1.4.0 nunca foi publicado, 1.0.0 inicia série pública); ADR 0009 referencia.                                 |
| `engines.node` mais alto do que CI atual quebra usuário | Confirmar piso lendo CI atual; alinhar `engines.node` ao mínimo que o CI matriz testa.                                                                                 |

---

## 📐 Decisões revisitadas

- **2026-05-08 — Sub-bloco E (`pr-curator` como GH Action ativa) extraído para spec própria.**
  - **Decisão anterior considerada:** entregar a Action `pr-curator` dentro da Spec 0020, com auth conforme ADR 0009 e validação cross-repo end-to-end.
  - **Decisão revista:** **remover** o componente desta spec e abrir spec própria (`pr-curator-action`) no `roadmap/backlog.md`. ADR 0009 permanece válido como insumo dessa spec futura.
  - **Motivo:** auditoria de `cli/features/{core,opt-in}/` em 2026-05-08 confirmou que o comando `pr-curator` **não existe** como código na CLI (apenas como documento de workflow editorial referenciado em ADR/CHANGELOG). Construir uma Action que invoca um comando inexistente seria implementação-fantasma; implementar a feature do zero extrapola "publicar pacote no npm". Publicação no registry é independente dessa automação cross-repo — `npx ai-guidelines init` funciona sem ela.

- **2026-05-08 — Matriz Node do `smoke-multi-os.yml`: `[22.x, 24.x]`, não `20.x`.**
  - **Decisão anterior considerada:** matriz Node `[20.x]` (LTS amplamente disponível na época da escrita do plan), conforme [`§ Componente D`](#d-ci-matriz-multi-so) original.
  - **Decisão revista:** matriz `[22.x, 24.x]`. 22.x cobre o piso de `engines.node` cravado em 1.A.4 (`>=22.0.0`); 24.x replica o Node usado pelos workflows pré-existentes (`ai-guidelines-ci.yml`, `content-guardrails.yml`) e exercita a versão atual em produção interna.
  - **Motivo:** Node 20.x está abaixo do piso técnico real (scripts `test`/`test:coverage` exigem flags `--experimental-default-config-file` e `--experimental-test-coverage`, ambas Node 22+). Manter `20.x` na CI testaria uma combinação que `engines` já recusa, gerando ruído sem cobrir cenário real de consumidor.

- **2026-05-07 — Templates SDD permanecem em `.specify/templates` na Spec 0020.**
  - **Decisão anterior considerada:** antecipar a Spec 0021 e mover os boilerplates SDD para `.core/` agora, para alinhar runtime publicável e placement canônico.
  - **Decisão revista:** **não mover** nesta spec. O pacote publicado passa a incluir explicitamente `.specify/templates` no campo `files` do `package.json`, mantendo o contrato vigente da CLI e evitando churn amplo em documentação, specs históricas e referências internas.
  - **Motivo:** o bug descoberto pela smoke era de payload do tarball, não de incapacidade técnica da CLI. Resolver via allowlist do publish fecha a 0020 com baixo risco. A reorganização semântica/física dos boilerplates continua como débito arquitetural para a Spec 0021 (`governance-information-architecture`).
