<!-- ai-guidelines-template: tasks-evidence-driven-boilerplate v=3 -->

# Tasks — Spec 0021 Governance Information Architecture — `evidence-driven`

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: In Progress (Stage 2)

> **Progress file vivo.** Atualizar a cada degrau concluído. Quando uma decisão mudar, refletir em `plan.md` na seção 📐 "Decisões revisitadas" e ajustar tasks impactadas. Não retroceder status sem registro.

> **Variante `evidence-driven`.** Use este boilerplate quando o **Tipo de spec** declarado no header da `spec.md` é `evidence-driven` — i.e., o design depende de evidência técnica/pesquisa **ainda não coletada** (cf. `.core/process/spec-foundation.md` § "Tipos de spec"). A diferença canônica em relação ao boilerplate genérico é a expansão da **Fase 0** com Stage 1 (Research → Decision-Brief → Gate humano), executada **antes** da Implementação A. Stage 2 só inicia após o gate humano resolver todos os pontos `[DEC-NNNN-*]` do `decision-brief.md`.

---

## 📋 Estratégia de PRs — 5 Entregas Sequenciais

> Esta spec resultará em código substancial (~3000-3500 linhas). Para facilitar review e respeitar o CORE-12 (checkpoints com aprovação humana), o trabalho foi reorganizado em **5 PRs sequenciais**, cada uma com escopo coeso e dependência clara da anterior.
>
> **Rationale**: Uma única mega-PR de 3500 linhas seria difícil de revisar atomicamente. Micro-PRs de ~200 linhas levariam a churn excessivo de merges. A estrutura de 5 PRs balanceia:
>
> - ✅ Coesão temática (cada PR aborda um domínio ou camada)
> - ✅ Dependências explícitas (PR2 depende de PR1, etc.)
> - ✅ Tamanho revisável (~500-1400 linhas por PR)
> - ✅ Gates de aprovação entre PRs para evitar retrabalho

| PR      | Fase      | Tamanho           | Descrição                                                   |
| ------- | --------- | ----------------- | ----------------------------------------------------------- |
| **PR0** | Fase 0    | Concluído         | Setup + Research + Decision-Brief + Gate (já em PR aberta)  |
| **PR1** | Fase 1    | ~500-700 linhas   | Fundação arquitetural: bounded contexts + TDD/BDD           |
| **PR2** | Fase 2    | ~800-1100 linhas  | Reestruturação física: estado + topologia + compatibilidade |
| **PR3** | Fases 3+4 | ~1050-1400 linhas | Automação + motor novo: living docs + composição modular    |
| **PR4** | Extra     | ~100-200 linhas   | Cleanup final: migração controlada + redirects              |

> **Fluxo**: PR1 → (human gate) → PR2 → (human gate) → PR3 → (human gate) → PR4 → (review final) → merge `main`

---

## Fase 0 — Setup + Stage 1 (Research → Decision-Brief → Gate humano)

> **Concluída.** O gate humano fechou em 2026-05-09. Esta fase permanece aqui como trilha de auditoria do lifecycle `evidence-driven`.

### Sub-bloco [0.Setup] — Bootstrap e instanciação

- [x] **0.1** **Bootstrap**: ler `roadmap/backlog.md` (spec ativa, prioridades, candidatas absorvidas) e `.core/process/spec-foundation.md` § "Tipos de spec".
- [x] **0.2** **Tipo de spec** confirmado como `evidence-driven` no header da `spec.md`. Critério-teste: _"o design depende de evidência técnica/pesquisa ainda não coletada?"_ → **sim**.
- [x] **0.3** **Slug semântico** definido: `governance-information-architecture`.
- [x] **0.4** Branch `feat/spec-0021-governance-information-architecture` criada a partir de `main`.
- [x] **0.5** `spec.md` instanciado a partir de `.specify/templates/spec-boilerplate.md`; header completo com `Tipo de spec: evidence-driven` e campo `Decision Brief` apontando para `./decision-brief.md`.
- [x] **0.6** **[MANDATÓRIO]** Validação Humana inicial: owner aprovou o problema e o escopo antes dos Code Actions.
- [x] **0.7** `plan.md` instanciado a partir de `.specify/templates/plan-boilerplate.md` com bloco Stage 1 / Stage 2 e perguntas explícitas de research.
- [x] **0.8** `tasks.md` (este arquivo) instanciado a partir desta variante.
- [x] **0.9** `decision-brief.md` instanciado com pontos `[DEC-0021-*]` em status `Pendente`.
- [x] **0.10** `roadmap/backlog.md` atualizado: 0021 movida para "Em execução", preservando rastreabilidade editorial mínima da candidata original.
- [x] **0.11** `NEXT.md` instanciado (mandatório).
- [x] **0.[COMMIT]** texto de commit atômico sugerido: `chore(spec-0021): setup inicial da spec governance-information-architecture`.
- [x] **0.[PULL-REQUEST]** Criar Pull Request em Draft (usando o template do repositório, se aplicável).

### Sub-bloco [0.Research] — Stage 1: produzir researches

- [x] **0.R.1** Listar perguntas de research a responder em `plan.md`, cada uma cruzada com o ponto `[DEC-0021-*]` correspondente.
- [x] **0.R.2** Consolidar o pacote inicial de evidência usando os dois researches obrigatórios de 2026-05-08 e o backlog da candidata.
- [x] **0.R.3** Produzir research complementar quando o pós-gate evidenciou lacunas reais de implementação (`2026-05-09-post-gate-gap-analysis.md`).
- [x] **0.R.4** Análise de débitos e implicações técnicas incorporada ao replanejamento do Stage 2.
- [x] **0.R.[COMMIT]** texto de commit incremental sugerido: `research(spec-0021): sínteses Stage 1 publicadas`.

### Sub-bloco [0.Brief] — Stage 1: popular `decision-brief.md` com opções

- [x] **0.B.1** Popular `[DEC-0021-A01]`, `[DEC-0021-A02]`, `[DEC-0021-A03]`, `[DEC-0021-B01]`, `[DEC-0021-B02]`, `[DEC-0021-B03]`, `[DEC-0021-B04]` e `[DEC-0021-B05]` com pergunta, contexto, opções e tradeoffs.
- [x] **0.B.2** Registrar recomendações iniciais quando já houver evidência convergente nos insumos de 2026-05-08.
- [x] **0.B.3** Publicar a tabela "Resumo de status" com todos os pontos em `Pendente`.
- [x] **0.B.4** Análise de débitos inicial registrada e depois expandida pelo pós-gate.
- [x] **0.B.[COMMIT]** texto de commit incremental sugerido: `docs(spec-0021): decision-brief.md populado com opções Stage 1`.

### Sub-bloco [0.Gate] — Gate humano (decision-brief → Resolved)

> **Fechado.** Stage 2 está autorizado.

- [x] **0.G.1** Owner revisou `decision-brief.md` com todos os pontos `[DEC-0021-*]`.
- [x] **0.G.2** Para cada ponto: owner escolheu opção, justificou e fechou status em `Resolved`.
- [x] **0.G.3** Perguntas que exigiram aprofundamento retornaram ao research antes do fechamento do gate.
- [x] **0.G.4** Status agregado do `decision-brief.md` mudou para `Resolved` com bloco final "✅ Gate fechado" assinado.
- [x] **0.G.5** `plan.md` passou a exigir v2 orientado pelas decisões cravadas.
- [x] **0.G.6** `tasks.md` passou a exigir v2 com Fases de Stage 2 reordenadas e aprofundadas.
- [x] **0.G.7** Replanejamento do Stage 2 aprovado pela owner antes dos edits nos artefatos.
- [x] **0.G.[COMMIT]** texto de commit atômico sugerido: `docs(spec-0021): gate humano fechado — plan v2 + tasks v2 publicados`.
- [x] **0.G.[PULL-REQUEST]** Atualizar PR com descrição focada em Stage 1 (contexto → perguntas de research → opções iniciais). O PR será marcado como "Ready for review", aguardando o fechamento do gate humano para Stage 2.
- [x] **0.G.[MANDATÓRIO]** Aprovação humana explícita para merge. **Não fazer merge autonomamente.**

---

## Fase 1 — Fundação arquitetural da nova CLI (DDD + TDD/BDD)

> Esta fase funda os domínios da nova CLI em um ambiente isolado (`src/`) usando TypeScript e Jest, sem modificar o código legado (`cli/`). A abordagem "Strangler Fig" garante uma transição segura e testável. O código legado continuará funcionando enquanto o novo domínio é construído e validado.
>
> **PR1**: Branch `feat/spec-0021-fase-1`, commits incrementais (1.0, 1.A, 1.B), merge após aprovação humana.

### Sub-bloco [1.0] — Setup Técnico (TypeScript + Jest)

- [x] **1.0.[NEW-BRANCH]** Branch `feat/spec-0021-fase-1` criada a partir de `main` (PR0 já mergeada).
- [x] **1.0.1** Adicionar dependências de desenvolvimento: `typescript`, `ts-node`, `jest`, `ts-jest`, `@types/node`, `@types/jest`.
- [x] **1.0.2** Criar `tsconfig.json` na raiz, configurado para ESM (`"module": "NodeNext"`) e output em `dist/`.
- [x] **1.0.3** Criar `jest.config.ts` na raiz, configurado para usar `ts-jest` e apontar para os testes em `src/`.
- [x] **1.0.4** Atualizar `package.json`: adicionar scripts `test:nova-cli` e `build` para o novo ambiente TS.
- [x] **1.0.5** Criar um teste de smoke (`src/smoke.test.ts`) para garantir que a configuração do Jest está funcionando.
- [x] **1.0.N** Pipeline de check + test verde após o sub-bloco 1.0.
- [ ] **1.0.6** Análise de débitos: atualizar `NEXT.md`.
- [x] **1.0.[COMMIT]** Commit atômico sugerido: `chore(spec-0021): setup typescript e jest para nova cli`.

### Sub-bloco [1.A] — Linguagem Ubíqua e Contratos do Domínio

> Foco: Traduzir as decisões do gate (`decision-brief.md`) em uma arquitetura de domínio explícita e testável. A linguagem ubíqua dos 6 pilares será materializada em tipos e interfaces, e os testes de comportamento serão escritos (e desabilitados) para validar esses contratos.

- [ ] **1.A.1** Criar a estrutura de diretórios `src/app`, `src/domain`, `src/infrastructure`.
- [ ] **1.A.2** **[Linguagem Ubíqua]** Em `src/domain/entities/`, definir os tipos e interfaces que representam os 6 pilares de valor: `Spec`, `Exploration`, `Fix`, `Patch`, `Incident`, `Proposal`. Cada um deve refletir seus atributos únicos conforme o `decision-brief.md`.
- [ ] **1.A.3** **[Bounded Contexts]** Definir as interfaces para os principais serviços do domínio: `RegistryService` (para gerenciar o `registry.yml`), `WorkspaceService` (para interagir com o filesystem do `.governance/`), e `PolicyService` (para validar as regras de transição de estado, ex: `proposal` -> `spec`).
- [ ] **1.A.4** **[TDD]** Escrever a suíte de testes de comportamento em `src/domain/**/*.test.ts` que valida os contratos e as regras de negócio. Ex: "DADO um `proposal` QUANDO promovido a `spec` ENTÃO ele deve ter um `spec.md` associado".
- [ ] **1.A.5** **[TDD]** Marcar todos os novos testes com `it.skip`. O objetivo é criar um blueprint executável da arquitetura e dos requisitos de negócio antes da implementação.
- [ ] **1.A.N** Pipeline de check + test verde (pois os testes do domínio estão desabilitados).
- [ ] **1.A.6** Análise de débitos: atualizar `NEXT.md`.
- [ ] **1.A.[COMMIT]** Commit atômico sugerido: `feat(spec-0021): define linguagem ubíqua e contratos do domínio`.

### Sub-bloco [1.B] — Normalização da Suíte e Implementação do Domínio

> Foco: Implementar a lógica de negócio para satisfazer os contratos definidos no sub-bloco 1.A, ativando os testes progressivamente. O objetivo é ter um domínio central sólido e 100% testado, isolado do legado.

- [ ] **1.B.1** Implementar as entidades e a lógica de negócio dentro de `src/domain/`, seguindo as interfaces do sub-bloco anterior.
- [ ] **1.B.2** **[Ciclo GREEN]** Ativar os testes (`it.skip` -> `it`), um por um ou por módulo, e escrever o código mínimo necessário no domínio para que eles passem.
- [ ] **1.B.3** Garantir que a suíte de testes do novo domínio atinja alta cobertura e valide todas as regras de negócio definidas no `decision-brief.md`.
- [ ] **1.B.4** Implementar os casos de uso em `src/app/` que orquestram o domínio, também com cobertura de testes unitários.
- [ ] **1.B.N** Pipeline de check + test verde, com todos os testes do novo domínio passando.
- [ ] **1.B.5** Análise de débitos: atualizar `NEXT.md`.
- [ ] **1.B.[COMMIT]** Commit atômico sugerido: `feat(spec-0021): implementa e valida o novo domínio da CLI`.

### Encerramento de PR1

- [ ] **1.[PULL-REQUEST]** Criar ou atualizar Pull Request em Draft com título `feat(spec-0021): Fase 1 — Fundação Arquitetural (PR1)`.
- [ ] **1.[DESCRIPTION]** Descrever em 3 seções: (1) Rationale da migração para TS/Jest e Strangler Fig; (2) Arquitetura DDD em `src/` e testes de comportamento; (3) Status: domínio fundado e testado, legado intacto.
- [ ] **1.[READY-FOR-REVIEW]** Marcar PR como "Ready for review" após conclusão de 1.B e pipeline verde.
- [ ] **1.[MANDATÓRIO]** Aguardar aprovação humana explícita. **Não fazer merge autonomamente.**
- [ ] **1.[MERGE]** Após aprovação, fazer merge com `git commit -m "..."` seguindo a chain em AGENTS.md.

---

## Fase 2 — Reestruturação física do workspace e contratos do consumidor

> Esta fase materializa os Blocos A e B do gate no filesystem, no contrato do consumidor e na superfície publicada do framework.
>
> **Dependência**: PR1 deve estar mergeada.
>
> **PR2**: Branch `feat/spec-0021-fase-2`, commits incrementais (2.A, 2.B, 2.C), merge após aprovação humana.

### Sub-bloco [2.A] — Estado canônico repo-first híbrido

- [ ] **2.A.[NEW-BRANCH]** Branch `feat/spec-0021-fase-2` criada a partir de `main` (assumindo PR1 já mergeada).
- [ ] **2.A.1** Introduzir o contrato canônico do estado estruturado em `.governance/registry.yml`, com IDs, campos mínimos e invariantes documentadas.
- [ ] **2.A.2** Provar o modelo com um lote mínimo representativo que inclua pelo menos uma origem não-spec, uma spec e uma entrega relacionada.
- [ ] **2.A.3** Validar que o modelo não depende de banco/serviço externo e pode ser reconstruído apenas a partir do repositório.
- [ ] **2.A.N** Pipeline de check + test verde após o sub-bloco 2.A.
- [ ] **2.A.4** Análise de débitos: atualizar `NEXT.md`.
- [ ] **2.A.[COMMIT]** Commit atômico sugerido: `feat(spec-0021): introduz estado repo-first híbrido em .governance`.

### Sub-bloco [2.B] — Placement documental e foundation/ADR

- [ ] **2.B.1** Aplicar a política canônica de placement para constituição operacional, ADRs, docs descritivos, referências e artefatos de framework.
- [ ] **2.B.2** Reservar explicitamente o lar canônico de PRD/intake, handoff/decision logs e telemetria sem implementar seus pipelines completos.
- [ ] **2.B.3** Materializar o modelo híbrido de arquitetura de informação: catálogo curto + reorganização física direcionada.
- [ ] **2.B.4** Tratar a fronteira foundation vs ADR, incluindo renome/refactor do documento-base do lifecycle.
- [ ] **2.B.5** Tratar o placement interno de `.core/rules/` conforme o gate, distinguindo explicitamente esse trabalho da fragmentação distribuída do consumidor.
- [ ] **2.B.6** Tratar o destino de `docs/` e demais ilhas documentais sob a nova topologia canônica.
- [ ] **2.B.N** Pipeline de check + test verde após o sub-bloco 2.B.
- [ ] **2.B.7** Análise de débitos: atualizar `NEXT.md`.
- [ ] **2.B.[COMMIT]** Commit atômico sugerido: `docs(spec-0021): consolida placement governance-driven`.

### Sub-bloco [2.C] — Root `.governance/` e compatibilidade com legado

- [ ] **2.C.1** Formalizar o contrato entre `sdd_dir`, `spec_workspace_dir` e o novo root `.governance/`.
- [ ] **2.C.2** Introduzir camada explícita de compatibilidade para leitura/migração de `.ai-guidelines/` e `.specify/`.
- [ ] **2.C.3** Alinhar help da CLI, surface publicada do pacote, smoke tests e docs com o novo contrato do consumidor.
- [ ] **2.C.4** Validar o contrato contra a fricção observada no consumidor `site`, evitando ambiguidade de onboarding.
- [ ] **2.C.N** Pipeline de check + test verde após o sub-bloco 2.C.
- [ ] **2.C.5** Análise de débitos: atualizar `NEXT.md`.
- [ ] **2.C.[COMMIT]** Commit atômico sugerido: `refactor(spec-0021): introduz root .governance com bridge de legado`.

### Encerramento de PR2

- [ ] **2.[PULL-REQUEST]** Criar ou atualizar Pull Request em Draft com título `feat(spec-0021): Fase 2 — Reestruturação Física (PR2)`.
- [ ] **2.[DESCRIPTION]** Descrever em 3 seções: (1) estado canônico e registry.yml; (2) placement documental e foundation; (3) root .governance/ e compatibilidade.
- [ ] **2.[READY-FOR-REVIEW]** Marcar PR como "Ready for review" após conclusão de 2.C e pipeline verde.
- [ ] **2.[MANDATÓRIO]** Aguardar aprovação humana explícita. **Não fazer merge autonomamente.**
- [ ] **2.[MERGE]** Após aprovação, fazer merge com `git commit -m "..."` seguindo a chain em AGENTS.md.

---

## Fase 3 — Living Documentation e Engine de Composição

> Esta fase implementa os Blocos C (Living Documentation) e D (composição modular) do gate como capacidades concretas do framework.
>
> **Dependência**: PR2 deve estar mergeada.
>
> **PR3**: Branch `feat/spec-0021-fase-3`, commits incrementais (3.A, 3.B, 4.A, 4.B), merge após aprovação humana.

### Sub-bloco [3.A] — Contrato da documentação viva

- [ ] **3.A.[NEW-BRANCH]** Branch `feat/spec-0021-fase-3` criada a partir de `main` (assumindo PR2 já mergeada).
- [ ] **3.A.1** Definir o schema do artefato estruturado gerado a partir dos testes `[BR-CLI-*]`.
- [ ] **3.A.2** Decidir o formato inicial de saída em `.governance/` e os metadados mínimos necessários para consumo futuro.
- [ ] **3.A.3** Garantir determinismo do artefato gerado para evitar churn artificial em PRs e builds.
- [ ] **3.A.N** Pipeline de check + test verde após o sub-bloco 3.A.
- [ ] **3.A.4** Análise de débitos: atualizar `NEXT.md`.
- [ ] **3.A.[COMMIT]** Commit atômico sugerido: `feat(spec-0021): define contrato da living documentation`.

### Sub-bloco [3.B] — Extração automática e guardrails de drift

- [ ] **3.B.1** Implementar extração automática dos testes `[BR-CLI-*]` via AST parsing ou reporter dedicado.
- [ ] **3.B.2** Integrar a geração do artefato ao ciclo local e ao CI.
- [ ] **3.B.3** Falhar a pipeline quando houver drift entre comportamento testado e artefato estruturado gerado.
- [ ] **3.B.4** Validar cobertura dos comportamentos críticos da CLI sob a nova taxonomia de regras.
- [ ] **3.B.N** Pipeline de check + test verde após o sub-bloco 3.B.
- [ ] **3.B.5** Análise de débitos: atualizar `NEXT.md`.
- [ ] **3.B.[COMMIT]** Commit atômico sugerido: `feat(spec-0021): extrai br-cli para .governance`.

### Sub-bloco [4.A] — Recipes e partials

- [ ] **4.A.1** Definir o schema declarativo das `recipes` de montagem.
- [ ] **4.A.2** Quebrar os boilerplates atuais em `partials` atômicos com fronteiras estruturais claras.
- [ ] **4.A.3** Garantir que `partials` sejam blocos Markdown completos e válidos por contrato.
- [ ] **4.A.4** Mapear como `artifactKind`, `workflowType`, idioma e stage resolvem a receita final.
- [ ] **4.A.N** Pipeline de check + test verde após o sub-bloco 4.A.
- [ ] **4.A.5** Análise de débitos: atualizar `NEXT.md`.
- [ ] **4.A.[COMMIT]** Commit atômico sugerido: `refactor(spec-0021): introduz recipes e partials`.

### Sub-bloco [4.B] — Montagem, validação estrutural e retirada do mirror legado

- [ ] **4.B.1** Implementar a montagem dos artefatos finais a partir de `recipes` e `partials`.
- [ ] **4.B.2** Validar integridade estrutural do Markdown gerado antes da persistência.
- [ ] **4.B.3** Substituir o sync legado de boilerplates integrais pelo novo fluxo de composição modular.
- [ ] **4.B.4** Garantir que customizações do consumidor sigam protegidas pelo novo modelo quando aplicável.
- [ ] **4.B.N** Pipeline de check + test verde após o sub-bloco 4.B.
- [ ] **4.B.5** Análise de débitos: atualizar `NEXT.md`.
- [ ] **4.B.[COMMIT]** Commit atômico sugerido: `feat(spec-0021): substitui mirror por composição atômica`.

### Encerramento de PR3

- [ ] **3.[PULL-REQUEST]** Criar ou atualizar Pull Request em Draft com título `feat(spec-0021): Fase 3 — Living Documentation + Engine (PR3)`.
- [ ] **3.[DESCRIPTION]** Descrever em 3 seções: (1) contrato e extração de [BR-CLI-*]; (2) schema e pipeline de living docs; (3) recipes, partials e composição modular.
- [ ] **3.[READY-FOR-REVIEW]** Marcar PR como "Ready for review" após conclusão de 4.B e pipeline verde.
- [ ] **3.[MANDATÓRIO]** Aguardar aprovação humana explícita. **Não fazer merge autonomamente.**
- [ ] **3.[MERGE]** Após aprovação, fazer merge com `git commit -m "..."` seguindo a chain em AGENTS.md.

---

## Fase 4 — Migração e Cleanup

> Esta fase executa renomeações finais, redirects e validação da topologia completa.
>
> **Dependência**: PR3 deve estar mergeada.
>
> **PR4**: Branch `feat/spec-0021-fase-4`, commit final (E), merge após aprovação humana.

### Sub-bloco [E] — Migração controlada e redirects

- [ ] **E.[NEW-BRANCH]** Branch `feat/spec-0021-fase-4` criada a partir de `main` (assumindo PR3 já mergeada).
- [ ] **E.1** Se a reorganização física for ampla, aplicar migração controlada com redirects/ponteiros no mesmo commit do rename.
- [ ] **E.2** Confirmar que links históricos, cross-refs editoriais, workflows e referências essenciais continuam íntegros.
- [ ] **E.3** Validar o tarball e o comportamento headless após a migração final dos paths.
- [ ] **E.4** Análise de débitos: atualizar `NEXT.md`.
- [ ] **E.N** Pipeline de check + test verde após o sub-bloco E.
- [ ] **E.[COMMIT]** Commit atômico sugerido: `refactor(spec-0021): migração controlada da arquitetura governance-driven`.

### Encerramento de PR4

- [ ] **4.[PULL-REQUEST]** Criar ou atualizar Pull Request em Draft com título `refactor(spec-0021): Fase 4 — Migração e Cleanup (PR4)`.
- [ ] **4.[DESCRIPTION]** Descrever: renomeações finais, redirects, validação tarball, smoke tests com nova topologia.
- [ ] **4.[READY-FOR-REVIEW]** Marcar PR como "Ready for review" após conclusão de E e pipeline verde.
- [ ] **4.[MANDATÓRIO]** Aguardar aprovação humana explícita. **Não fazer merge autonomamente.**
- [ ] **4.[MERGE]** Após aprovação, fazer merge com `git commit -m "..."` seguindo a chain em AGENTS.md.

---

## Fase de Review (Gate de Homologação)

> Executada após todas as PRs (0-4) estarem mergeadas em `main`.

- [ ] **R.1** Atualizar header da `spec.md`: status → `In Review`.
- [ ] **R.2** Pipeline canônico verde: rodar a suíte completa pertinente ao escopo final da spec.
- [ ] **R.3** Critérios de aceite de `spec.md` e DoD de `plan.md` confirmados ponto-a-ponto.
- [ ] **R.4** `decision-brief.md`: validar que todos os pontos `[DEC-0021-*]` estão `Resolved` e refletidos no design final.
- [ ] **R.5** Validar a entrega em ambiente real quando aplicável, especialmente contrato distribuído, Living Documentation e recipes.
- [ ] **R.6** Descrição consolidada de todas as PRs em um bloco final: contexto → decisões cravadas → impacto cross-spec.
- [ ] **R.7** **[MANDATÓRIO]** Aguardar Gate de Review Humano.
- [ ] **R.8** Aplicar correções demandadas em loops de review até aprovação.

---

## Fase de Encerramento Pré-Merge

> Executada no mesmo branch/PR de stage final, após aprovação do gate de review.

- [ ] **F.1** `NEXT.md`: migrar débitos relevantes para `roadmap/backlog.md` e deletar o arquivo.
- [ ] **F.2** Migrar research novo relevante para `.specify/specs/researchs/<domínio>/` e indexar em `research-index.md`.
- [ ] **F.3** `decision-brief.md` permanece no diretório da spec.
- [ ] **F.4** `spec.md` header: status → `Done (PR #X — YYYY-MM-DD)`.
- [ ] **F.5** `roadmap/historico.md`: mover a 0021 para concluídas e remover de "Em execução" em `backlog.md`.
- [ ] **F.6** Atualizar `CHANGELOG.md` e `package.json` se houver comportamento publicado alterado; se a entrega for apenas documental/estrutural sem release, registrar "não-aplicável" com justificativa.
- [ ] **F.7** Confirmar que a sessão atual não abriu outra spec antes deste encerramento.
- [ ] **F.8** **[COMMIT]** `chore(spec-0021): encerramento pré-merge — research migrado, NEXT removido, status final`.
- [ ] **F.9** **[MANDATÓRIO]** Aprovação humana explícita para merge. **Não fazer merge autonomamente.**
