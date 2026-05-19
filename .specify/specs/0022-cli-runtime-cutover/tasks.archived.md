<!-- ai-guidelines-template: tasks-mixed-boilerplate v=1 -->
<!-- ARCHIVED: methodologically invalid — preserved as historical evidence, NOT for execution. -->

# Tasks (ARCHIVED) — Spec 0022 CLI Runtime Cutover (DDD + TDD + BDD)

> Spec: [`./spec.md`](./spec.md) — _ver aviso editorial naquele arquivo_
> Plan: ~~[`./plan.md`](./plan.md)~~ → [`./plan.archived.md`](./plan.archived.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md) — _ver aviso editorial naquele arquivo_
> Status: **ARCHIVED — pre-discovery tasks artifact**

> 🚫 **ARQUIVADO — NÃO EXECUTAR**
>
> Este `tasks.md` foi escrito durante a sessão de design 2026-05-18 e **arquivado na mesma sessão** após a revisão metodológica revelar que ele nasceu como **planning prematuro** — deriva de `plan.md` que por sua vez deriva de `decision-brief.md` enviesado por CLI-first/runtime-assumption.
>
> Renomeado para `tasks.archived.md` para impedir execução. Conteúdo preservado integralmente abaixo como artifact histórico.
>
> **Por que é metodologicamente inválido:**
>
> - As Fases 2-6 do Harness Lock (PR1 setup+adopt → PR2 init → PR3 update+providers → PR4 check-budget → PR5 cleanup) **pressupõem** que os comandos atuais são bounded contexts reais. A Spec 0023 (Governance Workflow & Discovery Model) precisa investigar se isso é verdade antes de qualquer cutover.
> - As tasks de criação de use cases (`InitWorkspace`, `UpdateWorkspace`, `InstallProviders`, `RenderTokenBudgetReport`) **pressupõem** mapeamento 1-para-1 entre comando CLI e caso de uso DDD. Esse mapeamento pode estar errado.
> - O sub-bloco de "Auditoria detalhada" (2.A.1-3) **deveria ter sido** discovery arquitetural anterior à criação desta spec — não primeira task de implementação.
>
> **Conteúdo abaixo preservado como histórico. NÃO executar checkboxes. NÃO usar como progresso real.**

---

## Fase 0 — Setup (parte do PR1)

> Bootstrap da spec: estado lido, classificação feita, branch criada, artefatos instanciados.

- [x] **0.1** **Bootstrap**: `roadmap/backlog.md` consultado; entry "Cutover completo da CLI mjs para `src/` DDD" identificada; sessão de design 2026-05-18 confirmou escopo arquitetural completo via DDD/TDD/BDD (não "de-arrumação" como na tentativa anterior PR #15 fechada).
- [x] **0.2** **Tipo de spec**: `mixed` — Bloco A da brief tem 5 decisões macro com tradeoffs (precisam gate); pós-gate a execução por sub-PR é determinística.
- [x] **0.3** **Slug semântico**: `cli-runtime-cutover` (substitui `cli-runtime-relocation` da tentativa anterior).
- [x] **0.4** Branch `feat/spec-0022-cli-runtime-cutover` criada a partir de `origin/main`.
- [x] **0.5** `spec.md` instanciado a partir de `.specify/templates/spec-boilerplate.md`; header completo com `Tipo de spec: mixed`.
- [ ] **0.6** **[MANDATÓRIO]** Validação Humana inicial: owner aprova problema e escopo definidos no `spec.md` **antes** de avançar para qualquer implementação. _(gate explícito desta spec — sem isso, não saímos da Fase 0.)_
- [x] **0.7** `plan.md` e `tasks.md` (variante mixed) instanciados a partir dos templates.
- [ ] **0.8** `roadmap/backlog.md` atualizado: entry "Cutover completo da CLI mjs para `src/` DDD" marcada como **absorvida** por esta spec; entry movida para "Em execução" com cross-ref a PR #16. _(executado dentro do PR1 quando este PR for confirmado como a continuação correta da 0022.)_
- [x] **0.9** `NEXT.md` instanciado (inclui insight de meta-processo referenciado).
- [x] **0.10** Pull Request em Draft criado: PR #16. Template do repositório preenchido com Resumo + Spec Path + Tipo de Mudança + Contexto.
- [ ] **0.[COMMIT]** Commit atômico inicial: `chore(spec-0022): setup inicial da spec — cutover arquitetural completo cli/ → src/ via DDD+TDD+BDD`.

---

## Fase 1 — Stage 1 + Gate Humano

> Stage 1 condensado em sessão de design 2026-05-18 e capturado em `decision-brief.md` com 6 pontos. Esta fase executa apenas o **gate humano** e o checklist pós-gate.

- [ ] **1.GATE** Owner abre `decision-brief.md`, revisa 6 pontos (A01 nº sub-PRs, A02 ordem, A03 bridge, A04 testes, A05 features residuais, C01 saúde técnica), assina cada um com escolha + justificativa + data + owner. Status agregado vira `Resolved`.
- [ ] **1.[POST-GATE-1]** `plan.md` v2 publicado: cada subseção cita explicitamente o `[DEC-0022-XYZ]` que a alimenta. Se a decisão divergir da recomendação inicial, refletir aqui sem apagar histórico.
- [ ] **1.[POST-GATE-2]** `tasks.md` v2 publicado: tasks das Fases 2+ abaixo refinadas conforme decisão final (ex.: se A01 escolher 3 PRs, fundir Fase 2/3 e Fase 4/5).
- [ ] **1.[POST-GATE-3]** Status agregado da brief atualizado para `Resolved` no header e na tabela "Resumo de status".
- [ ] **1.[POST-GATE-COMMIT]** Commit atômico marcando o gate: `docs(spec-0022): gate humano fechado — plan v2 + tasks v2 publicados`.

---

## Fase 2 — PR1: Setup + Auditoria + Cutover de `adopt`

> Origem: [`plan.md` § PR1](./plan.md#sub-bloco-pr1--setup--auditoria--cutover-de-adopt). Primeiro sub-PR do Harness Lock. Valida o approach com o caso de uso DDD já pronto (`AdoptWorkspace.ts` da Spec 0021).

### Sub-bloco [PR1.A] — Auditoria detalhada

- [ ] **2.A.1** Mapear cada arquivo em `cli/` com seu equivalente atual ou planejado em `src/` (atualizar a tabela do `plan.md` § "Mapeamento do estado atual"). Output: doc `audit-cli-mapping.md` na pasta da spec.
- [ ] **2.A.2** Listar acoplamentos cross-comando (ex.: features usadas por múltiplos comandos) para evitar duplicação durante o cutover.
- [ ] **2.A.3** Identificar use cases já prontos em `src/` que podem ser plugados imediatamente vs. os que precisam ser criados via TDD.

### Sub-bloco [PR1.B] — Composition root

- [ ] **2.B.1** Criar `src/cli/composition.ts` com factory que instancia `AdoptWorkspace` com adapters reais (`NodeRecipeStore`, `GovernanceRegistryStore`, etc.). TDD: `composition.test.ts` adjacente.
- [ ] **2.B.2** Criar `src/cli/runAdopt.ts` (handler do comando `adopt`) que pega argv parseado, chama composition, executa use case, formata output. TDD: `runAdopt.test.ts`.

### Sub-bloco [PR1.C] — Wire-up em `cli/ai-guidelines-cli.mjs`

- [ ] **2.C.1** Modificar rota do `adopt` em `cli/ai-guidelines-cli.mjs` para `import` o handler de `src/cli/runAdopt` (via `dist/` compilado, conforme padrão da 0021).
- [ ] **2.C.2** Manter rotas dos outros 4 comandos inalteradas (continuam em `cli/app/engine.mjs` por enquanto).
- [ ] **2.C.3** Teste de integração: `cli/ai-guidelines-cli.mjs adopt --dry-run` produz output esperado em diretório de fixture.

### Sub-bloco [PR1.D] — Validação

- [ ] **2.D.1** Pipeline: `yarn check && yarn test:coverage` verde (296+ testes baseline preservados + novos testes de PR1).
- [ ] **2.D.2** `yarn test:smoke` verde local — smoke do `adopt` via tarball real continua passando.
- [ ] **2.D.3** Golden test: rodar `cli/ai-guidelines-cli.mjs adopt --dry-run` em fixture pré-cutover (referência da 0021) e pós-cutover (este PR); diff deve ser vazio (ou só linhas-de-debug filtráveis).
- [ ] **2.D.4** CI 8/8 verde no PR.
- [ ] **2.D.[COMMIT]** `feat(spec-0022): PR1 — setup + auditoria + cutover do comando adopt`.

---

## Fase 3 — PR2: Cutover de `init`

> Origem: [`plan.md` § PR2](./plan.md#sub-bloco-pr2--cutover-de-init). Comando mais complexo: wizard interativo + 10+ arquivos gerados.

- [ ] **3.A** Criar `src/app/ports/PromptAdapter.ts` (port para wizard interativo, modelando os prompts encadeados de `init`). TDD: testes com `InMemoryPromptAdapter`.
- [ ] **3.B** Criar `src/app/use-cases/InitWorkspace.ts` que orquestra: descoberta de workspace + prompts + adoption + geração de arquivos de providers. Reusa `AdoptWorkspace` internamente. TDD: `InitWorkspace.test.ts`.
- [ ] **3.C** Migrar features residuais consumidas por `init` para `src/` conforme `[DEC-0022-A05]`.
- [ ] **3.D** Criar `src/cli/runInit.ts` (handler) + adapter real `NodeReadlinePromptAdapter` em `src/infrastructure/`.
- [ ] **3.E** Modificar rota `init` em `cli/ai-guidelines-cli.mjs` para delegar ao novo handler.
- [ ] **3.N** Pipeline + smoke + golden test verdes.
- [ ] **3.[COMMIT]** `feat(spec-0022): PR2 — cutover do comando init`.

---

## Fase 4 — PR3: Cutover de `update` + `providers`

> Origem: [`plan.md` § PR3](./plan.md#sub-bloco-pr3--cutover-de-update--providers). Ambos compartilham features de geração de arquivos (managed-block, providers).

- [ ] **4.A** Criar `src/app/use-cases/UpdateWorkspace.ts` via TDD. Reusa adapters de managed-block já migrados em PR2.
- [ ] **4.B** Criar `src/app/use-cases/InstallProviders.ts` via TDD.
- [ ] **4.C** Migrar features residuais não-cobertas no PR2 (specific de update/providers).
- [ ] **4.D** Handlers `src/cli/runUpdate.ts` + `src/cli/runProviders.ts`.
- [ ] **4.E** Modificar rotas em `cli/ai-guidelines-cli.mjs`.
- [ ] **4.N** Pipeline + smoke + golden test verdes.
- [ ] **4.[COMMIT]** `feat(spec-0022): PR3 — cutover dos comandos update e providers`.

---

## Fase 5 — PR4: Cutover de `check-budget` + features residuais

> Origem: [`plan.md` § PR4](./plan.md#sub-bloco-pr4--cutover-de-check-budget--features-residuais). Comando read-only + cleanup das features que sobraram.

- [ ] **5.A** Criar `src/app/use-cases/RenderTokenBudgetReport.ts` via TDD.
- [ ] **5.B** Inventariar features ainda em `cli/` não migradas (sweep `find cli -name '*.mjs'`).
- [ ] **5.C** Migrar cada feature residual conforme classificação de `[DEC-0022-A05]`. Cada migração: criar TS adjacente, TDD, atualizar imports cross-arquivo.
- [ ] **5.D** Handler `src/cli/runCheckBudget.ts`.
- [ ] **5.E** Modificar rota em `cli/ai-guidelines-cli.mjs`.
- [ ] **5.N** Pipeline + smoke + golden test verdes.
- [ ] **5.[COMMIT]** `feat(spec-0022): PR4 — cutover do check-budget + features residuais`.

---

## Fase 6 — PR5: Cleanup final + remoção de `cli/`

> Origem: [`plan.md` § PR5](./plan.md#sub-bloco-pr5--cleanup-final--remoção-de-cli). Último PR: troca o `bin`, remove `cli/`, atualiza docs canônicas.

- [ ] **6.A** Criar `src/cli/ai-guidelines.ts` como entrypoint final (substitui o router em `cli/ai-guidelines-cli.mjs`). Parsing de argv + dispatch para handlers `src/cli/run*.ts`.
- [ ] **6.B** `package.json:bin` muda para apontar para `src/cli/ai-guidelines.ts` (ou caminho compilado em `dist/`).
- [ ] **6.C** `package.json:files`: substituir `"cli"` por `"src/cli"`; manter `"dist"` (já presente desde a 0021).
- [ ] **6.D** `package.json:imports`: atualizar prefixos `#cli/*`, `#features/*`, `#app/*`, `#fs/*`, `#governance/*` para apontar para `src/` (ou remover aliases não mais usados).
- [ ] **6.E** `package.json:scripts`: atualizar `guidelines:*`, `test`, `test:smoke`, `test:coverage`, `build:rules`, `living-docs:*` para paths em `src/`.
- [ ] **6.F** **`git rm -r cli/`** — deletar a pasta inteira.
- [ ] **6.G** Sweep de refs textuais em `README.md`, `AGENTS.md`, `.core/process/*.md`, `.core/governance/*.md`: trocar `cli/` por `src/cli/` onde descrevem layout; preservar refs narrativas (rebranding textual é spec própria).
- [ ] **6.H** `ARCHITECTURE.md` §3 ("Como o código está organizado"): atualizar mapa — `cli/` sai, `src/cli/` é home único do runtime.
- [ ] **6.I** Specs frozen em `.specify/specs/0008..0021/` **NÃO** são tocadas (rastro histórico).
- [ ] **6.J** Inspecionar tarball: `npm pack /repo --ignore-scripts && tar -tzf *.tgz | grep package/cli/` deve retornar vazio; `package/src/cli/` deve listar todos os handlers.
- [ ] **6.K** Smoke completo cross-OS verde (matriz CI: ubuntu/macos/windows × node 22/24).
- [ ] **6.L** Golden test final: rodar todos os 5 comandos em fixture pré-cutover e pós-cutover; diff vazio.
- [ ] **6.N.[DEBT-REVIEW]** `NEXT.md` revisado pré-merge: insights migram para `roadmap/backlog.md`; resto deletado.
- [ ] **6.N.[ARCHITECTURE]** `roadmap/backlog.md`: entry "Cutover completo da CLI mjs para `src/` DDD" movida para `roadmap/historico.md` com ponteiro a esta spec.
- [ ] **6.[COMMIT]** `feat(spec-0022): PR5 — cleanup final + remoção de cli/`.

---

## Encerramento (gate)

- [ ] **[READY-FOR-REVIEW]** Marcar Ready apenas quando:
  - Gate humano fechado (todos os 6 pontos `Resolved`).
  - Todos os 5 sub-PRs do Harness Lock mergeados.
  - CI 8/8 verde no head do PR final (PR5).
  - `cli/` não existe mais (`ls cli/` → "No such file or directory").
  - Golden tests verdes: comportamento do consumidor inalterado.
  - `NEXT.md` sanitizado (≤ 30 linhas, só itens genuinamente fora do escopo).
