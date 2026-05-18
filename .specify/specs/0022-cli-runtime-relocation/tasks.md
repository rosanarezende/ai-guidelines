<!-- ai-guidelines-template: tasks-mixed-boilerplate v=1 -->

# Tasks — Spec 0022 CLI Runtime Relocation

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: Draft

> **Progress file vivo.** Atualizar a cada degrau concluído. Quando uma decisão mudar, refletir em `plan.md` na seção 📐 "Decisões revisitadas" e ajustar tasks impactadas.

---

## Fase 0 — Setup

> Bootstrap da spec: estado lido, classificação feita, branch criada, artefatos instanciados.

- [x] **0.1** **Bootstrap**: `roadmap/backlog.md` consultado; entry "Cutover completo da CLI mjs para `src/` DDD" identificado como candidato; sessão de design 2026-05-18 refinou em "de-arrumação" (esta spec) + "arquitetural" (Spec 0023+).
- [x] **0.2** **Tipo de spec**: `mixed` — Bloco A da brief tem 3 decisões macro com tradeoffs (precisam gate); pós-gate a execução é determinística (move + renames mecânicos).
- [x] **0.3** **Slug semântico**: `cli-runtime-relocation`. Captura o que a spec faz (relocate do runtime CLI) sem prescrever destino exato (que vai pro brief).
- [x] **0.4** Branch `feat/spec-0022-cli-runtime-relocation` criada a partir de `origin/main`.
- [x] **0.5** `spec.md` instanciado a partir de `.specify/templates/spec-boilerplate.md`; header completo com `Tipo de spec: mixed` preenchido.
- [ ] **0.6** **[MANDATÓRIO]** Validação Humana inicial: owner aprova problema e escopo definidos no `spec.md` **antes** de avançar para qualquer implementação. _(gate explícito desta spec — sem isso, não saímos da Fase 0.)_
- [x] **0.7** `plan.md` e `tasks.md` (variante mixed) instanciados a partir dos templates.
- [ ] **0.8** `roadmap/backlog.md` atualizado: entry "Cutover completo da CLI mjs para `src/` DDD" refinada — Spec 0022 absorve o cutover de-arrumação; débito residual (cutover arquitetural) permanece no backlog com referência cruzada a esta spec.
- [x] **0.9** `NEXT.md` instanciado (inclui o insight de meta-processo sobre inflação do `NEXT.md` que nasceu desta sessão).
- [ ] **0.10** Criar Pull Request em Draft. Usar template do repositório se existir (`.github/pull_request_template.md`); preencher Resumo + Spec Path + Tipo de Mudança (refactor) + Contexto.
- [ ] **0.[COMMIT]** Commit atômico inicial: `chore(spec-0022): setup inicial da spec — cutover de-arrumação cli/ → src/cli/`.

---

## Fase 1 — Stage 1 + Gate

> Stage 1 já condensado em sessão de design 2026-05-18 e capturado em `decision-brief.md`. Esta fase só executa o **gate humano** e o checklist pós-gate.

- [ ] **1.GATE** Owner abre `decision-brief.md`, revisa 4 pontos (A01, A02, A03, C01), assina cada um (escolha + justificativa + data + owner). Status agregado vira `Resolved`.
- [ ] **1.[POST-GATE-1]** `plan.md` v2 publicado: cada subseção de design técnico cita explicitamente o `[DEC-0022-XYZ]` que a alimenta. Se a decisão divergir da recomendação inicial, refletir aqui sem apagar histórico.
- [ ] **1.[POST-GATE-2]** `tasks.md` v2 publicado: tasks da Fase 2 abaixo refinadas conforme decisão final (ex.: se Opção B do A02 for escolhida, tasks de "move atômico" viram "distribuição por camada").
- [ ] **1.[POST-GATE-3]** Status agregado da brief atualizado para `Resolved` no header e na tabela "Resumo de status".
- [ ] **1.[POST-GATE-COMMIT]** Commit atômico marcando o gate: `docs(spec-0022): gate humano fechado — plan v2 + tasks v2 publicados`.

---

## Fase 2 — Implementação (placeholder, refinado após gate)

> As tasks abaixo refletem a **recomendação inicial** da brief. Após o gate humano, podem mudar conforme decisão.

### Sub-bloco [A] — Move atômico (paths)

> Origem: [`plan.md` § A](./plan.md#a--move-de-paths) + `[DEC-0022-A01]` Opção A + `[DEC-0022-A02]` Opção A (a confirmar pós-gate).

- [ ] **2.A.1** `git mv cli src/cli` (move atômico preservando histórico via git rename detection).
- [ ] **2.A.2** Atualizar `package.json:imports`: substituir prefixo `./cli/*` por `./src/cli/*` em todos os 7 aliases (`#app`, `#cli`, `#features`, `#governance`, `#governance/monolith`, `#formatters`, `#fs`).
- [ ] **2.A.3** Atualizar `package.json:bin` para `"src/cli/ai-guidelines-cli.mjs"`.
- [ ] **2.A.4** Atualizar `package.json:files`: substituir entry `"cli"` por `"src/cli"`; ajustar excludes `!cli/**/*.test.mjs` e `!cli/**/__fixtures__` para o novo path.
- [ ] **2.A.N** Pipeline: `yarn check && yarn test` verde — 296 testes passando.
- [ ] **2.A.[COMMIT]** `refactor(spec-0022): move cli/ → src/cli/`.

### Sub-bloco [B] — Scripts em package.json

> Origem: [`plan.md` § B](./plan.md#b--atualização-de-scripts-em-packagejson).

- [ ] **2.B.1** Atualizar `scripts.guidelines`, `guidelines:init`, `guidelines:adopt`, `guidelines:providers`: substituir path `cli/ai-guidelines-cli.mjs` por `src/cli/ai-guidelines-cli.mjs`.
- [ ] **2.B.2** Atualizar `scripts.test`, `test:smoke`, `test:coverage`: substituir patterns `cli/**/*.test.mjs` e `cli/**/**/*.test.mjs` por `src/cli/**/*.test.mjs` e `src/cli/**/**/*.test.mjs`.
- [ ] **2.B.3** Atualizar `scripts.build:rules`: substituir path `cli/governance/monolith/rules-builder.mjs` por `src/cli/governance/monolith/rules-builder.mjs`.
- [ ] **2.B.4** Atualizar `scripts.living-docs:generate` e `living-docs:check`: substituir `cli/living-docs.mjs` por `src/cli/living-docs.mjs`.
- [ ] **2.B.N** Pipeline: `yarn check && yarn test && yarn living-docs:check` verde.
- [ ] **2.B.[COMMIT]** `refactor(spec-0022): atualizar scripts package.json para src/cli/`.

### Sub-bloco [C] — Refs textuais canônicas

> Origem: [`plan.md` § C](./plan.md#c--atualização-de-docs-e-refs-canônicas) + `[DEC-0022-A03]` Opção B (a confirmar pós-gate).

- [ ] **2.C.1** `README.md`: trocar refs `cli/X` por `src/cli/X` onde descrevem layout (sweep manual, preservar refs narrativas).
- [ ] **2.C.2** `AGENTS.md`: trocar "a CLI em `cli/`" por "a CLI em `src/cli/`" (linha 12). Linha 27 (`yarn guidelines ...`) permanece — rebranding de scripts é spec própria.
- [ ] **2.C.3** Sweep `.core/process/*.md` e `.core/governance/*.md`: trocar `cli/` por `src/cli/` apenas onde descreve layout.
- [ ] **2.C.4** `ARCHITECTURE.md` §3 ("Como o código está organizado"): atualizar mapa visual — `cli/` sai como diretório raiz; `src/cli/` aparece como home do runtime executável.
- [ ] **2.C.5** Specs frozen em `.specify/specs/0008..0021/` **NÃO** são tocadas (rastro histórico — política da Spec 0021 § 4.B.3, 4.B.5).
- [ ] **2.C.N** Pipeline: `yarn check` verde (prettier não reclama).
- [ ] **2.C.[COMMIT]** `docs(spec-0022): refs textuais cli/ → src/cli/`.

### Sub-bloco [D] — Smoke real

> Origem: [`plan.md` § D](./plan.md#d--validação).

- [ ] **2.D.1** `yarn test:smoke` verde local (tarball + install + init em diretório vazio).
- [ ] **2.D.2** Inspecionar tarball: `npm pack /repo --ignore-scripts && tar -tzf ai-guidelines-*.tgz | grep package/src/cli/` deve listar o entrypoint; `tar -tzf ai-guidelines-*.tgz | grep package/cli/` deve retornar vazio.
- [ ] **2.D.3** CI verde: 8/8 (guardrails + 6 smoke matriz cross-OS + ai-guidelines-check).
- [ ] **2.D.[COMMIT]** `chore(spec-0022): validação smoke pós-relocate`.

### Sub-bloco [N] — Closure

- [ ] **2.N.[DEBT-REVIEW]** `NEXT.md` revisado pré-merge: insights migram para `roadmap/backlog.md`; resto deletado (regra do próprio NEXT.md).
- [ ] **2.N.[ARCHITECTURE]** `ARCHITECTURE.md` (vive na 0021): se a 0021 ainda não fechou §3 com o mapa atualizado, esta spec encerra essa pendência.
- [ ] **2.N.[COMMIT]** `chore(spec-0022): cleanup pré-merge`.

---

## Encerramento (gate)

- [ ] **[READY-FOR-REVIEW]** Marcar Ready apenas quando:
  - Gate humano fechado (todos os 4 pontos `Resolved`).
  - CI 8/8 verde no head do PR.
  - Smoke real verificado: tarball gerado, instalado em sandbox, comando `npx ai-guidelines init` em diretório vazio produz output idêntico ao baseline (diff de antes vs depois deve ser vazio).
  - `NEXT.md` sanitizado (≤ 30 linhas, só itens genuinamente fora do escopo).
