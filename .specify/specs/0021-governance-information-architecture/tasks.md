<!-- ai-guidelines-template: tasks-evidence-driven-boilerplate v=3 -->

# Tasks — Spec 0021 Governance Information Architecture — `evidence-driven`

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: In Progress (Stage 1)

> **Progress file vivo.** Atualizar a cada degrau concluído. Quando uma decisão mudar, refletir em `plan.md` na seção 📐 "Decisões revisitadas" e ajustar tasks impactadas. Não retroceder status sem registro.

> **Variante `evidence-driven`.** Use este boilerplate quando o **Tipo de spec** declarado no header da `spec.md` é `evidence-driven` — i.e., o design depende de evidência técnica/pesquisa **ainda não coletada** (cf. `.core/process/spec-foundation.md` § "Tipos de spec"). A diferença canônica em relação ao boilerplate genérico é a expansão da **Fase 0** com Stage 1 (Research → Decision-Brief → Gate humano), executada **antes** da Implementação A. Stage 2 (Fases 1–4) só inicia após o gate humano resolver todos os pontos `[DEC-NNNN-*]` do `decision-brief.md`.

---

## Fase 0 — Setup + Stage 1 (Research → Decision-Brief → Gate humano)

> Em `evidence-driven`, a Fase 0 estende o Setup canônico com **Stage 1**: coletar evidência, registrar opções no `decision-brief.md`, fechar o gate humano. **Nenhum design técnico cravado pré-research.** Stage 2 (Fase 1+) só inicia após o gate fechar.

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
- [x] **0.10** `roadmap/backlog.md` atualizado: 0021 movida para "Em execução".
- [x] **0.11** `NEXT.md` instanciado (mandatório).
- [ ] **0.12** Criar Pull Request em Draft usando o template do repositório, se aplicável.
- [x] **0.[COMMIT]** texto de commit atômico sugerido: `chore(spec-0021): setup inicial da spec governance-information-architecture`.

### Sub-bloco [0.Research] — Stage 1: produzir researches

> Nesta spec, o Stage 1 começa reaproveitando research já migrado para `.specify/specs/researchs/architecture/`. Só abrir `./research/` local novo se os insumos existentes não responderem alguma pergunta do brief.

- [x] **0.R.1** Listar perguntas de research a responder em `plan.md`, cada uma cruzada com o ponto `[DEC-0021-*]` correspondente.
- [x] **0.R.2** Consolidar o pacote inicial de evidência usando os dois researches obrigatórios de 2026-05-08 e o backlog da candidata.
- [ ] **0.R.3** Se o gate abrir lacunas reais, produzir `research/YYYY-MM-DD-<tema>.md` local para a 0021 antes de fechar qualquer ponto como `Resolved`.
- [ ] **0.R.4** Análise de débitos: atualizar `NEXT.md` com eventuais insights secundários.
- [ ] **0.R.[COMMIT]** texto de commit incremental sugerido: `research(spec-0021): sínteses Stage 1 publicadas`.

### Sub-bloco [0.Brief] — Stage 1: popular `decision-brief.md` com opções

- [x] **0.B.1** Popular `[DEC-0021-A01]`, `[DEC-0021-A02]`, `[DEC-0021-A03]`, `[DEC-0021-B01]` e `[DEC-0021-B02]` com pergunta, contexto, opções e tradeoffs.
- [x] **0.B.2** Registrar recomendações iniciais quando já houver evidência convergente nos insumos de 2026-05-08.
- [x] **0.B.3** Publicar a tabela "Resumo de status" com todos os pontos em `Pendente`.
- [x] **0.B.4** Análise de débitos: nenhum débito novo obrigatório identificado na abertura; `NEXT.md` permanece sem itens.
- [ ] **0.B.[COMMIT]** texto de commit incremental sugerido: `docs(spec-0021): decision-brief.md populado com opções Stage 1`.

### Sub-bloco [0.Gate] — Gate humano (decision-brief → Resolved)

> **[MANDATÓRIO]** Stage 2 (Fase 1+) só inicia após este gate fechar.

- [ ] **0.G.1** Owner revisa `decision-brief.md` com todos os pontos `[DEC-0021-*]` em status `Pendente`.
- [ ] **0.G.2** Para cada ponto: owner escolhe opção (ou propõe nova), preenche "Decisão do Gate Humano" com escolha + justificativa + data; status muda para `Resolved`.
- [ ] **0.G.3** Pontos que demandem mais research voltam para [0.Research]. Iterar até zero pontos `Pendente`/`Partial`.
- [ ] **0.G.4** Status agregado do `decision-brief.md` mudado para `Resolved` e bloco final "✅ Gate fechado" assinado.
- [ ] **0.G.5** `plan.md` v2 publicado: seções de design técnico derivadas das decisões cravadas.
- [ ] **0.G.6** `tasks.md` v2: Fases 1–4 abaixo refinadas com tasks operacionais finais do Stage 2.
- [ ] **0.G.7** Análise de débitos: atualizar `NEXT.md`.
- [ ] **0.G.[COMMIT]** texto de commit atômico sugerido: `docs(spec-0021): gate humano fechado — plan v2 + tasks v2 publicados`.

---

## Fase 1 — Implementação A (Stage 2)

### Sub-bloco [A] — Estado canônico repo-first híbrido

> Origem: [`plan.md` § Estado Canônico Repo-First Híbrido](./plan.md) e [`[DEC-0021-A01]`](./decision-brief.md#dec-0021-a01), [`[DEC-0021-A02]`](./decision-brief.md#dec-0021-a02).

- [ ] **1.A.1** Introduzir o contrato canônico do estado estruturado no path decidido pelo gate, com IDs, campos mínimos e invariantes documentadas.
- [ ] **1.A.2** Provar o modelo com um lote mínimo representativo que inclua pelo menos uma origem não-spec, uma spec e uma entrega relacionada.
- [ ] **1.A.3** Validar que o modelo não depende de banco/serviço externo e pode ser reconstruído apenas a partir do repositório.
- [ ] **1.A.N** Pipeline de check + test verde após o sub-bloco A.
- [ ] **1.A.4** Análise de débitos: atualizar `NEXT.md`.
- [ ] **1.A.[COMMIT]** texto de commit incremental sugerido: `feat(spec-0021): introduz estado repo-first híbrido`.

### Sub-bloco [B] — Placement documental e gêneros de valor

> Origem: [`plan.md` § Placement Documental e Gêneros de Valor](./plan.md) e [`[DEC-0021-B02]`](./decision-brief.md#dec-0021-b02).

- [ ] **1.B.1** Aplicar a política canônica de placement para constituição operacional, ADRs, docs descritivos, referências e artefatos de framework.
- [ ] **1.B.2** Reservar explicitamente o lar canônico de PRD/intake, handoff/decision logs e telemetria sem implementar seus pipelines completos.
- [ ] **1.B.3** Tratar o placement de `.specify/templates/` conforme o gate, com plano de migração de referências e da CLI se aplicável.
- [ ] **1.B.N** Pipeline de check + test verde após o sub-bloco B.
- [ ] **1.B.4** Análise de débitos: atualizar `NEXT.md`.
- [ ] **1.B.[COMMIT]** texto de commit incremental sugerido: `docs(spec-0021): define placement canônico de informação`.

### Sub-bloco [C] — Contrato `sdd_dir` vs `spec_workspace_dir`

> Origem: [`plan.md` § Contrato do Workspace do Consumidor](./plan.md) e [`[DEC-0021-A03]`](./decision-brief.md#dec-0021-a03).

- [ ] **1.C.1** Documentar o contrato formal entre `sdd_dir`, `spec_workspace_dir` e o lar do estado estruturado.
- [ ] **1.C.2** Alinhar boilerplates, processo e eventuais pontos de código/documentação afetados pelo novo contrato.
- [ ] **1.C.3** Validar o contrato contra a fricção observada no consumidor `site`, evitando ambiguidade de onboarding.
- [ ] **1.C.N** Pipeline de check + test verde após o sub-bloco C.
- [ ] **1.C.4** Análise de débitos: atualizar `NEXT.md`.
- [ ] **1.C.[COMMIT]** texto de commit incremental sugerido: `docs(spec-0021): formaliza sdd_dir e spec_workspace_dir`.

### Sub-bloco [D] — Fases 1, 2 e 3 da 0021

> Origem: [`plan.md` § Envelope de Entrega da 0021](./plan.md) e [`[DEC-0021-B01]`](./decision-brief.md#dec-0021-b01).

- [ ] **1.D.1** Entregar o recorte executável da própria 0021: contrato, registro estruturado no repo e visões derivadas mínimas.
- [ ] **1.D.2** Mapear Fases 4 e 5 como evolução posterior sem implementá-las como fonte primária ou superfície final.
- [ ] **1.D.3** Registrar a estratégia de migração inicial evitando big-bang histórico.
- [ ] **1.D.N** Pipeline de check + test verde após o sub-bloco D.
- [ ] **1.D.4** Análise de débitos: atualizar `NEXT.md`.
- [ ] **1.D.[COMMIT]** texto de commit incremental sugerido: `feat(spec-0021): prova fases 1-3 e mapeia 4-5`.

---

## Fase Extra Condicional (Implementação B, Migração, etc.)

### Sub-bloco [E] — Migração controlada e redirects

- [ ] **E.1** Se o gate aprovar reorganização física ampla, aplicar migração controlada com redirects/ponteiros no mesmo commit do rename.
- [ ] **E.2** Confirmar que links históricos e references essenciais continuam íntegros.
- [ ] **E.3** Análise de débitos: atualizar `NEXT.md`.
- [ ] **E.[COMMIT]** texto de commit incremental sugerido: `refactor(spec-0021): migração controlada da arquitetura de informação`.

---

## Fase de Review (Gate de Homologação)

- [ ] **3.1** Atualizar header da `spec.md`: status → `In Review`.
- [ ] **3.2** Pipeline canônico verde: rodar a suíte completa pertinente ao escopo final da spec.
- [ ] **3.3** Critérios de aceite de `spec.md` e DoD de `plan.md` confirmados ponto-a-ponto.
- [ ] **3.4** `decision-brief.md`: validar que todos os pontos `[DEC-0021-*]` estão `Resolved` e refletidos no design final.
- [ ] **3.5** Validar a entrega em ambiente real quando aplicável, especialmente se o contrato distribuído ao consumidor mudar.
- [ ] **3.6** PR atualizado com descrição em 3 etapas (contexto → decisões cravadas → impacto cross-spec).
- [ ] **3.7** **[MANDATÓRIO]** Aguardar Gate de Review Humano.
- [ ] **3.8** Aplicar correções demandadas em loops de review até aprovação.

---

## Fase de Encerramento Pré-Merge

- [ ] **4.1** `NEXT.md`: migrar débitos relevantes para `roadmap/backlog.md` e deletar o arquivo.
- [ ] **4.2** Migrar research novo relevante para `.specify/specs/researchs/<domínio>/` e indexar em `research-index.md`.
- [ ] **4.3** `decision-brief.md` permanece no diretório da spec.
- [ ] **4.4** `spec.md` header: status → `Done (PR #X — YYYY-MM-DD)`.
- [ ] **4.5** `roadmap/historico.md`: mover a 0021 para concluídas e remover de "Em execução" em `backlog.md`.
- [ ] **4.6** Atualizar `CHANGELOG.md` e `package.json` se houver comportamento publicado alterado; se a entrega for apenas documental/estrutural sem release, registrar "não-aplicável" com justificativa.
- [ ] **4.7** Confirmar que a sessão atual não abriu outra spec antes deste encerramento.
- [ ] **4.8** **[COMMIT]** `chore(spec-0021): encerramento pré-merge — research migrado, NEXT removido, status final`.
- [ ] **4.9** **[MANDATÓRIO]** Aprovação humana explícita para merge. **Não fazer merge autonomamente.**
