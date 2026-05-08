# Tasks — Spec 0020 npm-publication — `deterministic`

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Status: Draft

> **Progress file vivo.** Atualizar a cada degrau concluído. Quando uma decisão mudar, refletir em `plan.md` na seção 📐 "Decisões revisitadas" e ajustar tasks impactadas. Não retroceder status sem registro.

> **Variante `deterministic`.** Design conhecido (publish + tooling); sem Stage 1 / decision-brief. Workflow single-pass: Setup → Implementação → Review → Encerramento.

---

## Fase 0 — Setup

> Bootstrap da spec: ler estado do roadmap, classificar a spec, criar branch, instanciar artefatos e travar escopo com humano antes de qualquer implementação.

### Sub-bloco [0.Setup] — Bootstrap e instanciação

- [x] **0.1** **Bootstrap**: `roadmap/backlog.md` lido (spec ativa, escopo, candidatas absorvidas) e `.core/process/spec-foundation.md` § "Tipos de spec" referenciado.
- [x] **0.2** **Tipo de spec** confirmado como `deterministic`. Critério-teste: _"o design depende de evidência técnica/pesquisa ainda não coletada?"_ → **não** (decisão de naming já resolvida; demais escolhas são cerimônia de publish).
- [x] **0.3** **Slug semântico**: `npm-publication`.
- [x] **0.4** Branch `0020-npm-publication` criada a partir de `main` (commit `fbe17eb`).
- [x] **0.5** `spec.md` instanciado a partir de `.specify/templates/spec-boilerplate.md`; header com `Tipo de spec: deterministic`; campo `Decision Brief` ausente (correto para `deterministic`).
- [x] **0.6** **[MANDATÓRIO]** Validação Humana inicial: owner aprova problema e escopo definidos no `spec.md` **antes** de avançar para implementação.
- [x] **0.7** `plan.md` instanciado a partir de `.specify/templates/plan-boilerplate.md`; bloco "Stage 1 / Stage 2" omitido (correto para `deterministic`); design técnico direto.
- [x] **0.8** `tasks.md` (este arquivo) instanciado a partir da variante `deterministic`.
- [x] **0.9** `roadmap/backlog.md`: spec já em "Em execução" desde 2026-05-07 (entrada criada na promoção). Confirmar formato no início da Fase 1.
- [x] **0.10** `NEXT.md` instanciado.
- [x] **0.11** Criar Pull Request em Draft usando template do repositório (se existir em `.github/pull_request_template.md`); descrição inicial cobrindo contexto + escopo.
- [x] **0.[COMMIT]** texto de commit atômico sugerido: `chore(spec-0020): setup inicial da spec npm-publication`.

---

## Fase 1 — Implementação

> Cada sub-bloco encerra com **commit incremental atômico**. Sequência escolhida para que CI verde no tarball (D) seja pré-requisito do publish (G).

### Sub-bloco [A] — Metadados de publish em `package.json`

> Origem: [`plan.md` § Componente A](./plan.md)

- [x] **1.A.1** Remover `"private": true` de `package.json`.
- [x] **1.A.2** Adicionar `license: "Apache-2.0"` (conforme ADR 0006); `repository` (`type: git`, `url: git+https://github.com/rosanarezende/ai-guidelines.git`); `homepage`; `bugs.url`.
- [x] **1.A.3** Adicionar `keywords` curados: `ai`, `governance`, `agents`, `claude`, `copilot`, `cli` (revisar com owner antes do publish).
- [x] **1.A.4** Adicionar `engines.node` com `>=22.0.0` — CI roda Node 24, mas o piso técnico real é 22 (flags `--experimental-default-config-file` e `--experimental-test-coverage` exigem Node 22+).
- [x] **1.A.5** Bumpar `version` de `1.4.0` para `1.0.0`.
- [x] **1.A.6** `CHANGELOG.md`: entrada `[1.0.0] — 2026-05-07` documentando início da série pública e justificativa do reset (1.4.0 interno nunca foi publicado).
- [x] **1.A.7** Validar `npm publish --dry-run`: aceita sem erros (113 → 70 arquivos após exclusão de `*.test.mjs` + `__fixtures__/` via globs negativos no campo `files`); tarball contém `cli` (sem testes), `.core`, `docs`, `README.md`, `CHANGELOG.md`. Tamanho final: 102 kB / 343 kB unpacked.
- [x] **1.A.8** Pipeline `yarn check && yarn test` verde após o sub-bloco (exit 0, suíte completa passa).
- [x] **1.A.9** Análise de débitos: `NEXT.md` atualizado (insight sobre `.npmignore` × `files`).
- [ ] **1.A.[COMMIT]** texto de commit incremental sugerido: `chore(spec-0020): metadados de publish em package.json e bump para 1.0.0`.

### Sub-bloco [B] — ADR de naming + registry

> Origem: [`plan.md` § Componente B](./plan.md)

- [x] **1.B.1** Criado `adrs/0009-package-naming-and-registry.md` com 3 decisões cravadas: (1) naming `ai-guidelines` não-scoped + reserva `@ai-guidelines/<addon>`; (2) registry público padrão (gratuito); (3) auth do `pr-curator` — GitHub App preferencial, PAT fino como bootstrap documentado. Janela de unpublish do npm (72h) registrada como rede de segurança operacional.
- [x] **1.B.2** Índice de ADRs atualizado: a tabela canônica vive em `README.md` § "Decisões arquiteturais" (não em `adrs/README.md`, que é descritivo); ADR 0009 adicionado lá.
- [x] **1.B.3** Cross-ref do ADR 0009 no `CHANGELOG.md` da entrada `[1.0.0]`.
- [x] **1.B.4** Análise de débitos: nenhum novo débito (escopo do ADR fechado e auto-contido).
- [x] **1.B.[COMMIT]** texto de commit incremental sugerido: `docs(spec-0020): ADR 0009 de naming e registry`.

### Sub-bloco [C] — Smoke tests sobre tarball

> Origem: [`plan.md` § Componente C](./plan.md)

- [x] **1.C.1** Criar `tests/smoke/helpers/tarball.mjs`: API mínima (`packLocal()`, `installInTempDir(tarballPath)`, `cleanup()`); tudo via Node API (sem shell POSIX).
- [x] **1.C.2** Criar `tests/smoke/init-empty.test.mjs`: instala tarball em diretório vazio, roda `npx ai-guidelines init`, valida artefatos esperados (`.ai-guidelines/`, `AGENTS.md`).
- [x] **1.C.3** Criar `tests/smoke/init-existing-project.test.mjs`: setup mock com `package.json` + arquivos sentinela; valida que `init` não sobrescreve fora de `managed-block`.
- [x] **1.C.4** Criar `tests/smoke/update-managed-block.test.mjs`: pós-init, simula nova versão do framework e valida que `update` aplica patch corretamente sob `managed-block` (contrato Spec 0019).
- [x] **1.C.5** Suíte smoke verde local em Windows: bug de spawn (`shell:true` + `node.exe` com path contendo espaços + `.cmd` exigindo shell desde Node 20+/CVE-2024-27980) corrigido em `tests/smoke/helpers/tarball.mjs` via resolver de `npm`/`npx`/`yarn` para `.cmd` e `shell:true` condicional. As três suítes (`init-empty`, `init-existing-project`, `update-managed-block`) passam ponta-a-ponta.
- [x] **1.C.6** Pipeline `yarn check && yarn test` verde com a suíte smoke incluída.
- [x] **1.C.7** Análise de débitos: atualizar `NEXT.md`.
- [x] **1.C.[COMMIT]** texto de commit incremental sugerido: `test(spec-0020): smoke tests sobre tarball para init e update`.

### Sub-bloco [D] — CI matriz multi-SO

> Origem: [`plan.md` § Componente D](./plan.md)

- [x] **1.D.1** Auditado: `.github/workflows/` contém `ai-guidelines-ci.yml` e `content-guardrails.yml`, ambos `ubuntu-latest` × Node 24, gatilhos `pull_request → main` + `push → main`. Workflow novo segue mesma forma (corepack + `yarn install --immutable`).
- [x] **1.D.2** Criado `.github/workflows/smoke-multi-os.yml` com matriz `os: [ubuntu-latest, windows-latest, macos-latest]` × `node: [22.x, 24.x]`. **Decisão revisitada** vs plan original (Node 20.x): alinhada com `engines.node >=22.0.0` cravado em 1.A.4 — registrada em `plan.md` § "Decisões revisitadas".
- [x] **1.D.3** Job executa `yarn test:smoke` (script novo em `package.json`); a suíte `tests/smoke/*` faz `npm pack` + `npm install <tarball>` em diretório temp internamente via `tests/smoke/helpers/tarball.mjs`. Validado localmente em Windows (3/3 suítes verdes, ~63s).
- [ ] **1.D.4** **[PARA HUMANO]** Configurar `smoke / *` como required check em branch protection do `main` (requer permissão admin no repositório). Não bloqueante para 1.0.0; pode ser feito junto com a aprovação do publish em 2.G.4.
- [ ] **1.D.5** Confirmar matriz verde em PR Draft após push (rodar pelo menos uma vez).
- [x] **1.D.6** Análise de débitos: nenhum novo débito; D.4 fica como ação operacional para humano (registrada acima).
- [ ] **1.D.[COMMIT]** texto de commit incremental sugerido: `ci(spec-0020): matriz multi-SO sobre tarball`.

### Sub-bloco [E] — `pr-curator` como GH Action ativa

> Origem: [`plan.md` § Componente E](./plan.md)
>
> **Nota — promoção de regra.** Não há promoção de regra editorial neste sub-bloco; é integração de tooling.

- [ ] **1.E.1** Criar `.github/workflows/pr-curator.yml` com gatilho `pull_request` filtrado por label `growth-relevant`.
- [ ] **1.E.2** Configurar auth conforme ADR 0009 (preferência GitHub App; PAT fino aceitável como bootstrap inicial). Documentar setup necessário (criação do App / geração do PAT) em comentário no workflow ou em `docs/`.
- [ ] **1.E.3** Workflow executa `pr-curator` contra o PR e abre PR cross-repo no destino.
- [ ] **1.E.4** Executar pelo menos um fluxo end-to-end real (PR de teste com label) e registrar evidência no PR desta spec.
- [ ] **1.E.5** Análise de débitos: atualizar `NEXT.md`.
- [ ] **1.E.[COMMIT]** texto de commit incremental sugerido: `ci(spec-0020): pr-curator como GitHub Action ativa`.

### Sub-bloco [F] — README consumer-facing

> Origem: [`plan.md` § Componente F](./plan.md)

- [x] **1.F.1** README atualizado: bloco principal de comandos da seção "Para Desenvolvedores" usa `npx ai-guidelines …` como caminho canônico para consumidores externos (requer Node ≥ 22; suporta `npx ai-guidelines@<versão>` para pinning em CI). _(Antecipado no sub-bloco B junto com a entrada do ADR 0009 no índice de ADRs.)_
- [x] **1.F.2** Orientação `yarn guidelines …` realocada para seção "Para Contribuidores" como equivalente local explícito de `npx ai-guidelines`, com rationale do Yarn PnP. Cross-ref bidirecional entre as duas seções.
- [ ] **1.F.3** Não tocar em `docs/` profundamente — escopo profundo de reorganização fica para Spec 0021 (registrar como decisão consciente em `NEXT.md` se aparecer fricção).
- [ ] **1.F.4** Análise de débitos: atualizar `NEXT.md`.
- [ ] **1.F.[COMMIT]** texto de commit incremental sugerido: `docs(spec-0020): README consumer-facing com npx ai-guidelines`.

---

## Fase 2 — Publish (Implementação B)

> Fase exclusiva de release. Ocorre **após** review humano da Fase 3 ou imediatamente antes, conforme decisão do owner. CI matriz (D) verde é pré-requisito não negociável.

### Sub-bloco [G] — Publish 1.0.0

> Origem: [`plan.md` § Componente G](./plan.md)

- [ ] **2.G.1** Confirmar CI matriz verde no último commit da branch.
- [ ] **2.G.2** `npm publish --dry-run` final: revisar tarball; confirmar `version` = `1.0.0`; confirmar ausência de arquivos sensíveis.
- [ ] **2.G.3** Confirmar `CHANGELOG.md` com entrada `[1.0.0] — YYYY-MM-DD` publicada (não em `[Unreleased]`).
- [ ] **2.G.4** **[MANDATÓRIO]** Aprovação humana explícita para publish (operação irreversível; janela de unpublish é 72h e tem custos).
- [ ] **2.G.5** `npm publish --access public` (executado por humano com credenciais; agente não publica autonomamente).
- [ ] **2.G.6** Validar `npm view ai-guidelines version` = `1.0.0`.
- [ ] **2.G.7** Instalação manual final em sandbox limpo: `mkdir tmp && cd tmp && npx ai-guidelines init` — confirmar funcionamento sem o checkout local.
- [ ] **2.G.8** Tag git `v1.0.0` no commit publicado.
- [ ] **2.G.9** Análise de débitos: atualizar `NEXT.md`.
- [ ] **2.G.[COMMIT]** texto de commit sugerido: `release(spec-0020): publish ai-guidelines@1.0.0`.

---

## Fase 3 — Review (Gate de Homologação)

> **Fase exclusiva para empacotamento e homologação.** Nenhuma implementação nova após este ponto, exceto correções demandadas pelo review humano.

- [ ] **3.1** Atualizar header da `spec.md`: status → `In Review`.
- [ ] **3.2** Pipeline canônico verde: `yarn check:repo` (install bloqueado/immutable + format check + test com coverage).
- [ ] **3.3** Critérios de aceite de `spec.md` (alto nível) e DoD de `plan.md` (detalhado) confirmados ponto-a-ponto.
- [ ] **3.4** Validação em ambiente real: instalação do tarball em consumidor / sandbox limpo nos 3 SOs (mínimo Windows + Linux).
- [ ] **3.5** PR atualizado: descrição em 3 etapas (contexto → decisões cravadas → impacto cross-spec).
- [ ] **3.6** **[MANDATÓRIO]** Aguardar **Gate de Review Humano**. **Não prosseguir** sem aprovação explícita.
- [ ] **3.7** Aplicar correções demandadas em loops de review até aprovação; cada correção é commit incremental rastreável.

---

## Fase 4 — Encerramento Pré-Merge

> **[MANDATÓRIO]** Esta fase ocorre **na branch do PR, antes do merge**. Nenhuma tarefa pós-merge — o pacote deve estar **100% auto-suficiente** no momento do merge.

- [ ] **4.1** `NEXT.md`: migrar débitos relevantes para `roadmap/backlog.md` e **deletar** o arquivo.
- [ ] **4.2** Migração de research: provavelmente não-aplicável (spec `deterministic` sem research ad-hoc); registrar "não-aplicável" no PR se confirmado.
- [ ] **4.3** `spec.md` header: status → `Done (PR #X — YYYY-MM-DD)`.
- [ ] **4.4** `roadmap/historico.md`: spec movida para "Specs concluídas" com data; entrada removida de "Em execução" em `roadmap/backlog.md`.
- [ ] **4.5** `CHANGELOG.md`: confirmar entrada `[1.0.0] — YYYY-MM-DD` publicada (já feita em 1.A.6 + 2.G.3); confirmar `version` em `package.json` = `1.0.0`.
- [ ] **4.6** **[MANDATÓRIO]** Confirmar que **a sessão atual** não abriu outra spec antes deste encerramento (uma sessão, uma spec ativa).
- [ ] **4.7** **[COMMIT]** `chore(spec-0020): encerramento pré-merge — status final e limpeza de débitos`.
- [ ] **4.8** **[MANDATÓRIO]** Aprovação humana explícita para merge. **Não fazer merge autonomamente.**
