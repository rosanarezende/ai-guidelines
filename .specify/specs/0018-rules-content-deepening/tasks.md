# Tasks — Spec 0018 Rules Content Deepening

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: In Progress — **Stage 2 (Implementation)** — Fases 0–3 concluídas (Stage 1 + gate humano); Fases 4–7 abertas (Stage 2)

> **Progress file vivo, em duas etapas.** Stage 1 (Fases 0–3) cobre Setup +
> Research + Síntese de opções + Gate humano — todas marcadas `[x]`. Stage 2
> (Fases 4–7) reflete o novo modelo canônico de 5 fases que a própria 0018
> institui em `tasks-boilerplate.md` (`[DEC-0018-A01]` ressalva): Implementação A
> → Implementação B → Preparação para Review (Gate de Homologação) → Encerramento
> Pré-Merge. Cada sub-bloco referencia o `[DEC-0018-*]` que o alimenta e exige
> commit incremental ao final.

> **Reabertura 2026-04-30:** estrutura abaixo substitui integralmente as
> Fases 1+ das versões anteriores. Tasks A.1, A.2, B.1 marcadas `[x]` na
> versão pré-revisão referem-se ao conteúdo de `b9efb83`, agora preservado
> no Anexo do `plan.md` e tratado como rascunho candidato para reconciliação
> em Stage 2.

> **Encerramento Stage 1 — 2026-05-02:** gate humano resolveu os 14 pontos
> `[DEC-0018-*]` do `decision-brief.md`. Plan v2 publicado com desenho técnico
> derivado; tasks v2 (este arquivo) substitui o placeholder de Fase 4+ por
> tasks operacionais reais.

> **Convenção de status — Política A (cravada 2026-05-03):** uma task só vira
> `[x]` quando existe **commit incremental correspondente**. Enquanto o
> trabalho está escrito mas ainda não commitado, usar `[/]` (em progresso)
> com nota inline "_Pendente de commit_". Tasks `[COMMIT]` continuam sendo
> a unidade de fechamento de cada sub-bloco.

---

## Fase 0 — Setup

- [x] **0.1** Branch `feat/spec-0018-rules-content-deepening` criada a partir de `main`.
- [x] **0.2** `spec.md` instanciado a partir de `.specify/templates/spec-boilerplate.md`.
- [x] **0.3** **[MANDATÓRIO]** Validação Humana inicial: aprovação do problema e escopo (chat).
- [x] **0.4** `plan.md` e `tasks.md` criados.
- [x] **0.5** `roadmap/backlog.md` atualizado: spec 0018 em "Em execução".
- [x] **0.6** Reabertura formal: `spec.md`, `plan.md` e `tasks.md` reescritos como `Draft (revised 2026-04-30)`.
- [x] **0.7** Refatoração pass 2: estrutura Stage 1 + Gate adotada após feedback do owner.
- [x] **0.8** Criar `decision-brief.md` inicial com pontos `[DEC-0018-A01]`–`[DEC-0018-A06]` (Bloco A) e `[DEC-0018-B01]`–`[DEC-0018-B08]` (Bloco B), todos em status `Pendente`, sem opções preenchidas (opções entram durante Fases 1 e 2).
- [x] **0.9** **[MANDATÓRIO]** Validação Humana da revisão pass 2: aprovar a estrutura A+B em Stage 1 + Gate antes de iniciar Fase 1. Owner sinalizou "iniciar a Fase 1 (A.0 audit dos boilerplates)" em 2026-05-01.

---

## Fase 1 — Bloco A (Stage 1): Auditoria research-backed dos boilerplates

### Sub-bloco [A.0] — Auditoria

- [x] **A.0.1** Inventariar os 7 boilerplates em `.specify/templates/`: campos, propósito declarado, vocabulário usado. — Output: `research/2026-04-30-boilerplates-audit.md` § 2.
- [x] **A.0.2** Mapear como specs executadas (0008, 0015, 0016, 0017, 0018-rev0) preencheram cada artefato — capturar campos ignorados, campos ad-hoc adicionados, seções que cresceram informalmente. — Output: § 3 (drift estrutural).
- [x] **A.0.3** Cross-check entre boilerplates × `.core/process/spec-foundation.md`: detectar drift bidirecional (políticas ausentes em boilerplate; campos ausentes em política). — Output: § 4.
- [x] **A.0.4** Catalogar lacunas trazidas pela prática: "Decisão de Fusão", "Decisões revisitadas", "Tipo de spec" (conteúdo × infra), "Cross-refs com specs irmãs", "Conteúdo candidato pré-research", outras emergentes. — Output: § 5 (16 lacunas L1–L16).
- [x] **A.0.5** Catalogar ruído removível: campos que nunca foram preenchidos. — Output: § 6 (7 itens R1–R7).
- [x] **A.0.6** Avaliar dogfood: o `decision-brief.md` desta spec funcionou? Que campos, IDs, transições de status foram úteis ou problemáticos? Que melhorias informam o futuro `decision-brief-boilerplate.md`? — Output: § 7 (D1–D18).
- [x] **A.0.7** Produzir matriz **boilerplate × manter | revisar | adicionar | remover** com justificativa por linha em `research/2026-04-30-boilerplates-audit.md`. **Sem decisões finais** — apenas opções estruturadas. — Output: § 8 (8.1 a 8.8, incluindo o 8º artefato `decision-brief-boilerplate.md`).

### Sub-bloco [A.1] — Popular `decision-brief.md` com opções (Bloco A)

- [x] **A.1.1** A partir da matriz de A.0, popular `[DEC-0018-A01]` (updates por boilerplate, umbrella com sub-rows) com opções e tradeoffs. — Sub-rows A01.1 a A01.8 com itens `[manter|revisar|adicionar|remover]` referenciando audit § 8.1–8.8.
- [x] **A.1.2** Popular `[DEC-0018-A02]` (estrutura do campo "Tipo de spec") com opções. — 4 sub-eixos (cardinalidade / semântica / default / diferenciação operacional) com opções A–C.
- [x] **A.1.3** Popular `[DEC-0018-A03]` (localização e formato da política content × infra em `spec-foundation.md`) com opções. — 3 sub-eixos (localização interna / formato / sincronização do drift bidirecional § 4.2).
- [x] **A.1.4** Popular `[DEC-0018-A04]` (texto da linha em `global-rules.md`) com candidatos. — 2 sub-eixos (subseção / redação) com 4 candidatos textuais (A–D).
- [x] **A.1.5** Popular `[DEC-0018-A05]` (formato do `decision-brief-boilerplate.md`) com opções derivadas do dogfood (A.0.6). — 5 sub-eixos cobrindo D8–D17 da auditoria.
- [x] **A.1.6** Popular `[DEC-0018-A06]` (localização física da seção "Tipos de spec" + workflow em dois passes) com opções. — Já populado na criação do brief; cross-ref para audit § 4.3 e § 9 adicionada.

---

## Fase 2 — Bloco B (Stage 1): Research lifecycle e opções

### Sub-bloco [B.0] — Research

- [x] **B.0.1** `research/2026-04-30-benchmark-rules-content.md` — provedores (Anthropic, OpenAI, Google), OSS curado (Kong, ClickHouse, Bun, multica), `awesome-cursorrules`, Continue, Aider conventions.
- [x] **B.0.2** `research/2026-04-30-empirical-bugs-ai-code.md` — METR, SWE-bench, Aider eval, estudos sobre falhas em código IA.
- [x] **B.0.3** `research/2026-04-30-external-bug-taxonomies.md` — CWE, SEI CERT, Sonar, OWASP-LLM.
- [x] **B.0.4** `research/2026-04-30-spec-driven-tools-rules.md` — Spec Kit, BMAD, OpenSpec, Continue, Aider; foco em rules editoriais e decisões pré-design.
- [x] **B.0.5** `research/2026-04-30-tokens-baseline-budget.md` — medição instrumental do `<AI_GUIDELINES>` atual (compilado-min ≈3,3–3,8 K tokens / 238 linhas; full ≈4,9–5,5 K) + síntese cross-fontes (Anthropic best-practices, HumanLayer, MindStudio, Chroma context-rot, Lost-in-the-Middle, Cem Karaca trajetória) + projeção de teto.

### Sub-bloco [B.1] — Popular `decision-brief.md` com opções (Bloco B)

- [x] **B.1.1** Popular `[DEC-0018-B01]` (taxonomia das categorias de regras) com opções. — 2 sub-eixos (eixo primário A–G; tag de evidência H–J), com cross-refs para 4 researches.
- [x] **B.1.2** Popular `[DEC-0018-B02]` (colocação por categoria) com opções. — 2 sub-eixos (critério-teste A–D; arquitetura física E–I).
- [x] **B.1.3** Popular `[DEC-0018-B03]` (orçamento de tokens) com opções e medições baseline. — 5 sub-eixos (granularidade A–C; tipo D–F; valores numéricos G–K; enforcement L–O; unidade canônica P–S).
- [x] **B.1.4** Popular `[DEC-0018-B04]` (formato do catálogo de regras) com opções. — 3 sub-eixos (estrutura A–E; IDs F–J; organização físico-arquivo K–N).
- [x] **B.1.5** Popular `[DEC-0018-B05]` (metodologia do eval) com opções. — 5 sub-eixos (largura×profundidade A–C; asserção D–H; provedores I–L; não-determinismo M–O; threshold P–R).
- [x] **B.1.6** Popular `[DEC-0018-B06]` (fronteira com Spec 0011) com opções. — 3 sub-eixos (fronteira semântica A–D; gatilho de transição E–J; conteúdo NEXT.md K–N).
- [x] **B.1.7** Popular `[DEC-0018-B07]` (fronteira com Spec 0009) com opções. — 3 sub-eixos (escopo retido A–D; escopo transferido E–H; artefatos de transição I–L).
- [x] **B.1.8** Popular `[DEC-0018-B08]` (política de reconciliação do b9efb83) com opções. — 4 sub-eixos (unidade A–D; critério E–I; artefato J–N; ordem temporal O–Q), com identificação explícita de N+1 como heurística sem suporte empírico.

---

## Fase 3 — Gate humano (decision-brief → Resolved) — concluída 2026-05-02

> **[MANDATÓRIO]** Stage 2 só inicia após este gate.

- [x] **3.1** Owner revisa `decision-brief.md` com todos os pontos `[DEC-0018-*]` em status `Pendente` e opções preenchidas.
- [x] **3.2** Para cada ponto: owner escolhe opção (ou propõe nova), preenche bloco "Decisão" com escolha + justificativa + data; status muda para `Resolved`.
- [x] **3.3** Pontos que demandem mais research voltam para Fase 1/2 com tarefa derivada — todos os 14 pontos resolveram em rodada única; nenhum reabrimento necessário.
- [x] **3.4** Status agregado do `decision-brief.md` mudado para `Resolved` em 2026-05-02.
- [x] **3.5** `plan.md` v2: sub-blocos A.2–A.6 e B.2–B.7 reescritos com desenho técnico derivado das decisões; cada subseção referencia o `[DEC-*]` correspondente.
- [x] **3.6** `tasks.md` v2: placeholder abaixo (Fases 4+) substituído por tasks operacionais derivadas do plan v2.

---

## Fase 4 — Stage 2 / Implementação A (Bloco A: boilerplates + foundation + global-rules)

> Mapeamento canônico: Fase 4 desta spec ≡ **Fase 1 (Implementação A)** do novo `tasks-boilerplate.md` que esta própria 0018 institui. Cada sub-bloco encerra com **commit incremental** atômico.

### Sub-bloco [A.2] — Updates incrementais nos 7 boilerplates existentes

> Origem: [`[DEC-0018-A01]`](./decision-brief.md#dec-0018-a01-updates-por-boilerplate). Plan: § A.2.

- [x] **4.A2.1** `spec-boilerplate.md`: adicionar campo **Tipo de spec** (obrigatório, sem default — `evidence-driven` | `deterministic` | `mixed`); adicionar campo opcional **Decision Brief**; adicionar subseções opcionais 🧠 **Decisão de Fusão**, 🛑 **Post-mortem / Motivo do Pivot**, **Cross-refs com specs irmãs**; revisar status composto (`Done (PR #X — YYYY-MM-DD)`); remover prescrição literal de `research/synthesis.md`; adicionar referência cruzada para "Princípios da Escrita" de `spec-foundation.md`.
- [x] **4.A2.2** `plan-boilerplate.md`: formalizar formato 📐 **Decisões revisitadas** (data + mudança + razão + impacto); adicionar bloco **Stage 1/Stage 2 placeholder** condicional ao tipo; relaxar cap "2-4 linhas" do Princípio guia; adicionar subseção opcional 📎 **Anexo — Conteúdo candidato pré-research**.
- [x] **4.A2.3** `next-boilerplate.md`: adicionar trigger explícito de **criação** ("criar quando a spec gerar débitos conscientes"); downgrade da subseção ✂️ "Itens descartados deliberadamente" para opcional.
- [x] **4.A2.4** `roadmap-boilerplate.md`: alinhar com promoção de `tracker`/`repo-first` para `spec-foundation.md` (cross-ref a 4.A5.2).
- [x] **4.A2.5** `research-index-boilerplate.md`: sincronizar com a política de research lifecycle de `spec-foundation.md`.
- [x] **4.A2.6** `project-config-boilerplate.md`: confirmar zero churn (validar contra auditoria § 8.7).
- [x] **4.A2.7** Atualizar header da `spec.md` desta 0018 com `Tipo de spec: evidence-driven` (exceção consciente à imutabilidade pós-`In Review`, registrada em `plan.md` "Decisões revisitadas").
- [x] **4.A2.8** **[COMMIT]** `feat(spec-0018): updates incrementais de 7 boilerplates + spec.md retroativa`.

> **Reabertura A.2 — 2026-05-02.** Após cravarmos a premissa de que `.specify/templates/` será ofertado aos repos consumidores (registrada em `plan.md` § "Decisões revisitadas" 2026-05-02), os 5 boilerplates editados em 4.A2.1–4.A2.5 precisam revisão de **agnosticismo de stack** análoga à que aplicamos em `tasks-boilerplate.md` e `tasks-evidence-driven-boilerplate.md` nesta sessão (comandos do `ai-guidelines` viram exemplos opcionais com nota de adaptação). Executar **após sub-bloco A.3 completo**.

- [x] **4.A2.9** Revisar `spec-boilerplate.md`, `plan-boilerplate.md`, `next-boilerplate.md`, `roadmap-boilerplate.md`, `research-index-boilerplate.md` — aplicar agnosticismo de stack: comandos `yarn`, `node cli/ai-guidelines-cli.mjs`, paths assumindo estrutura interna do `ai-guidelines` viram ilustrações opcionais com nota "ou equivalente do stack do consumidor". — Auditoria identificou apenas 2 dos 5 com cravamentos: `spec-boilerplate.md` (L52, DoD `yarn check && yarn test`) e `plan-boilerplate.md` (L76-78 DoD `yarn`/`yarn test`/diff em consumidor + L88 extensão `.test.mjs`). `next-`, `roadmap-` e `research-index-` são puramente semânticos (paths do framework SDD), zero ajuste.
- [x] **4.A2.10** **[COMMIT]** `refactor(spec-0018): boilerplates do A.2 ganham agnosticismo de stack para distribuição`.

### Sub-bloco [A.3] — Reestruturação `tasks-boilerplate.md` em 5 fases + split por tipo

> Origem: [`[DEC-0018-A01]`](./decision-brief.md#dec-0018-a01-updates-por-boilerplate) ressalva e [`[DEC-0018-A02]`](./decision-brief.md#dec-0018-a02-estrutura-do-campo-tipo-de-spec) Sub-eixo 4 = B. Plan: § A.3.

- [x] **4.A3.1** Reescrever `.specify/templates/tasks-boilerplate.md` com nova estrutura de 5 fases (0–4): Setup → Implementação A → Implementação B → Preparação para Review (Gate de Homologação) → Encerramento Pré-Merge.
- [x] **4.A3.2** Criar `.specify/templates/tasks-evidence-driven-boilerplate.md`: variante com sub-bloco "Stage 1 (Research)" + "Gate humano via decision-brief" entre Setup e Implementação A.
- [x] **4.A3.3** Criar `.specify/templates/tasks-deterministic-boilerplate.md`: variante single-pass (Setup → Implementação A direto, sem Stage 1). — Gerado com Gemini 3.1 Pro + revisão Claude (4 ajustes editoriais: estilo L9, parêntese L30, gramática + nota L96, alinhamento da nota da Spec 0017 L100).
- [x] **4.A3.4** Criar `.specify/templates/tasks-mixed-boilerplate.md`: variante híbrida (Stage 1 condicional para sub-blocos identificados como evidence-driven). — Gerado com Gemini 3.1 Pro + revisão Claude (3 ajustes editoriais: bullet L17, caveat de paralelismo L24, cláusula L137).
- [x] **4.A3.5** **[COMMIT]** `feat(spec-0018): tasks-boilerplate em 5 fases + split por tipo de spec`.

### Sub-bloco [A.4] — Criar `decision-brief-boilerplate.md` (8º artefato)

> Origem: [`[DEC-0018-A05]`](./decision-brief.md#dec-0018-a05-formato-do-decision-brief-boilerplatemd). Plan: § A.4.

- [x] **4.A4.1** Criar `.specify/templates/decision-brief-boilerplate.md` com: estrutura híbrida adaptativa (B padrão / C decomposto); convenção de IDs `[DEC-NNNN-XYZ]` + legenda canônica de status no topo + convenção documentada para pontos derivados; recomendação inicial opcional com gatilho "evidência convergente em ≥ 1 research"; tradeoffs aceitando tabela ou lista bulleted (D9.C); headers individuais + Tabela "Resumo de status" final manual; Bloco final explícito **✅ Gate fechado**; checklist explícito de 4 passos pós-gate. — Boilerplate criado cravando o combo D + (A+C+D) + (D + D9.C) + (C + D16.A) + B; uso de fences ` ` (4 backticks) para mostrar templates markdown dentro do markdown; nota explícita "permanece no diretório da spec após o merge" coerente com Fase 4 das tasks-boilerplates.
- [x] **4.A4.2** **[COMMIT]** `feat(spec-0018): decision-brief-boilerplate.md (8º artefato canônico)`.

### Sub-bloco [A.5] — Atualizar `.core/process/spec-foundation.md`

> Origem: [`[DEC-0018-A03]`](./decision-brief.md#dec-0018-a03-localização-e-formato-da-política-de-tipos-de-spec-em-spec-foundationmd) (A + D + Misto) e [`[DEC-0018-A06]`](./decision-brief.md#dec-0018-a06-localização-física-da-seção-tipos-de-spec--workflow-em-dois-passes) (A). Plan: § A.5.

- [x] **4.A5.0** **Movimentação física**: `git mv docs/process/spec-foundation.md .core/process/spec-foundation.md` + stub temporário em `docs/process/spec-foundation.md` apontando ao novo path + substituição de path em 18 arquivos vivos (4 arquivos imutáveis — Spec 0008 e `roadmap/historico.md` — preservam path antigo via stub). Distribuição efetiva via CLI fica como débito da próxima spec `governance-information-architecture` (registrado em `NEXT.md` ao fim da 0018). Concluído em 2026-05-02 nesta sessão; registrado em `plan.md` § "Decisões revisitadas".
- [x] **4.A5.1** Adicionar nova seção **"Tipos de spec"** logo após "Quando usar spec-foundation". Formato híbrido: tabela compacta (3 linhas × Critério-teste / Workflow / Exemplo) + 1 parágrafo descrevendo o gate humano + nota com 2-3 exemplos cross-repo (SaaS, library, infra-as-code, ML pipeline). — Inserida com critério-teste universal explícito ("o design depende de evidência técnica/pesquisa ainda não coletada?"), 4 exemplos por tipo de repo, listagem das 4 variantes operacionais de `tasks.md` e cross-ref ao `decision-brief-boilerplate.md`.
- [x] **4.A5.2** Promover para `spec-foundation.md` o princípio "repo-first, integração-friendly" + campo `tracker` (atualmente em `roadmap-boilerplate.md`). — Nova seção "## Roadmap: repo-first, integração-friendly" entre "Hierarquia de documentos" e "Templates" + lista de Templates atualizada de 4 → 11 boilerplates com agrupamento por função (drift óbvio decorrente de A.3 + A.4).
- [x] **4.A5.3** Promover para `spec-foundation.md` o trigger de criação de `NEXT.md` ("criar quando há débitos conscientes"). — Trigger reforçado em § `NEXT.md` (já existia parcialmente): cravado "Criar somente quando" + "Sem débitos → não criar" + ajuste do encerramento para "fase final do `tasks.md`".
- [x] **4.A5.4** Adicionar comentário **TODO** visível no topo da nova seção: anotação explícita de que o conteúdo deverá migrar para a futura spec **`governance-information-architecture`** (do backlog) na refatoração arquitetural. — Bloco quote 🚧 no topo de "## Tipos de spec".
- [x] **4.A5.5** **Reconciliar concorrência de specs em `spec-foundation.md`** (débito da Spec 0017 que vazou): linhas 149-150 hoje cravam _"uma spec ativa por vez: feche a spec anterior antes de abrir uma nova"_ — lê-se como restrição global do repo. Reescrever para alinhar com (i) a research da 0017 [`2026-04-29-concurrency-best-practices.md`](../../specs/researchs/governance/2026-04-29-concurrency-best-practices.md) (OSS opera com múltiplas RFCs simultâneas via Issue-first + backlog) e (ii) a linha 186 do mesmo documento (_"uma sessão, uma spec ativa"_ — escopo de sessão). Redação alvo: tornar explícito que o limite é **por sessão de trabalho / contribuidor**, não por repositório. Cross-ref para a research no rodapé da seção. Registrado em `plan.md` § "Decisões revisitadas" 2026-05-02. — Reescrita aplicada com cross-ref à research da 0017 e ponteiro à linha "uma sessão, uma spec ativa" do Checklist de fechamento. Adicional: § `tasks.md` atualizado para modelo de 5 fases + Checklist de abertura cita variantes por tipo + linha `yarn check && yarn test` agnostificada (drifts decorrentes de A.3 sincronizados na mesma trinca).
- [x] **4.A5.6** **[COMMIT]** `docs(spec-0018): spec-foundation.md ganha "Tipos de spec" + sync de drift bidirecional + reconciliação de concorrência (0017)`.

### Sub-bloco [A.6] — Atualizar `.core/rules/global-rules.md` (linha de workflow)

> Origem: [`[DEC-0018-A04]`](./decision-brief.md#dec-0018-a04-texto-da-linha-em-global-rulesmd) (A + D). Plan: § A.6.

- [x] **4.A6.1** Adicionar à subseção **"Workflow com IA"** o texto cravado pelo owner em A04: _"Tipo de spec é declarado no header (`evidence-driven`, `deterministic`, `mixed`). Specs `evidence-driven` ou `mixed` exigem um gate humano via `decision-brief.md` antes da implementação — o teste é: 'o design depende de evidência técnica/pesquisa ainda não coletada?'. Detalhes em `.core/process/spec-foundation.md`."_ — Inserido como item 7 entre "RPI obrigatório" (item 6) e "Contexto enxuto" (renumerado para 8); itens 7 e 8 antigos viram 8 e 9. Texto idêntico ao cravado em [DEC-0018-A04] linha 347 do brief.\_
- [x] **4.A6.2** **[COMMIT]** `docs(spec-0018): global-rules.md acrescenta linha sobre tipo de spec + gate humano`.

---

## Fase 5 — Stage 2 / Implementação B (Bloco B: purga + pipeline Docs-as-Code + eval)

> Mapeamento canônico: Fase 5 desta spec ≡ **Fase 2 (Implementação B)** do novo `tasks-boilerplate.md`. Cada sub-bloco encerra com **commit incremental** atômico.

### Sub-bloco [B.2] — Purga radical do legado `b9efb83` (precede a reorganização)

> Origem: [`[DEC-0018-B08]`](./decision-brief.md#dec-0018-b08-política-de-reconciliação-do-conteúdo-b9efb83) (A + E + L + O). Plan: § B.2.

> **Reabertura controlada B.2 — 2026-05-03.** Após inventário inicial (5.B2.1/5.B2.2), owner introduziu um **quarto estado de decisão** `mover (convenção)` para preservar regras pain-driven sem source canônica. Aplica-se a **PE-01** (PT-BR), **EF-04** (Redução de Ruído) e **WF-03** (PR description 3 etapas). Mudança expande (não reverte) o critério **E** de [`[DEC-0018-B08]`](./decision-brief.md#dec-0018-b08-política-de-reconciliação-do-conteúdo-b9efb83); brief permanece `Resolved`. Adicionalmente: débito cravado para regra **nova** "IA gera apenas texto do commit" (não no inventário b9efb83 — adição em B.4). Justificativa completa em [`plan.md` § Decisões revisitadas — 2026-05-03](./plan.md#-decisões-revisitadas).

- [x] **5.B2.1** Inventariar 24 regras candidatas (20 itens em 3 seções de `.core/rules/global-rules.md` + 4 categorias em `.core/rules/opt-in/quality-gates.md`) numa tabela seed.
- [x] **5.B2.2** Para cada regra, pesquisar e atribuir **fonte canônica externa** candidata (CWE, CERT, Sonar RSPEC, OWASP, paper validado). Documentar URL + ID externo. Sem source aceitável → `reverter`.
- [x] **5.B2.3** Validar no research [`empirical-bugs`](./research/2026-04-30-empirical-bugs-ai-code.md) e [`external-bug-taxonomies`](./research/2026-04-30-external-bug-taxonomies.md) os achados sobre N+1 (heurística sem suporte empírico — reverter), race conditions e memory leaks (medium evidence — manter se source é citada).
- [x] **5.B2.4** Publicar `research/2026-04-30-b9efb83-reconciliation.md` com tabela final: regra / texto original / source proposta / decisão (`manter` | `reverter` | `revisar com source X` | `mover (convenção)`) / justificativa. Validado pelo owner em 2026-05-03 (incluindo expansão para 4º estado de decisão `mover (convenção)`).
- [x] **5.B2.5** Aplicar reversões em `.core/rules/*.md` num commit isolado, ANTES de qualquer trabalho de B.3+.
- [x] **5.B2.6** **[COMMIT]** `refactor(spec-0018): purga radical b9efb83 — remove regras sem fonte canônica`.

### Sub-bloco [B.3] — Schema bilíngue + parser YAML + builder `rules.json`

> Origem: [`[DEC-0018-B01]`](./decision-brief.md#dec-0018-b01-taxonomia-das-categorias-de-regras) (F + J), [`[DEC-0018-B02]`](./decision-brief.md#dec-0018-b02-colocação-por-categoria) (C + F), [`[DEC-0018-B04]`](./decision-brief.md#dec-0018-b04-formato-do-catálogo-de-regras) (E + H + N). Plan: § B.3.

- [x] **5.B3.1** Definir schema YAML formal de uma regra: campos `id`, `scope` (`universal` | `adapter` | `opt-in`), `adapter` (opcional), `opt_in_feature` (opcional), `category` (`correctness` | `security` | `maintainability` | `process` | `editorial`), `evidence_strength` (`strong` | `medium` | `emerging` | `declared_heuristic`), `sources` (lista, **obrigatório apenas para categorias-âncora `correctness`/`security` com `evidence_strength: strong|medium`**), `applicable_languages`, `tags`. Documentar em `decision-brief-boilerplate.md` (4.A4) e em `CLAUDE.md` raiz. **Garantir que `category: process|editorial` aceita `declared_heuristic` sem `sources` (cobre Convenções do Owner + diretivas core).** **Padrão YAML cravado em 2026-05-03, revisado no mesmo dia (alinha com B.3.1.5):** **Opção B — primeiro bloco fenced ` ```yaml ` imediatamente após o heading da regra.** Opção A (frontmatter `---` real) foi descartada porque Prettier reformata blocos `---` repetidos em arquivos multi-regra (frontmatter padrão de mercado só vale no início absoluto do arquivo) — quebra a convenção. `rules-parser.mjs` (B.3.2) deve procurar YAML assim: para cada heading de regra (formato `#### [ID] Title`), capturar o **próximo bloco fenced ` ```yaml `** como frontmatter da regra. **Hierarquia de headings cravada:** arquivos em `.core/rules/` usam `###` no topo do arquivo e `####` por regra (alinha com `global-rules.md` / `opt-in/quality-gates.md` legados). Compiler em B.3.5 deve preservar/rebaixar consistentemente — `#`/`##` quebram a formatação do `<AI_GUIDELINES>` injetado no `AGENTS.md` consumidor.
- [x] **5.B3.1.5** **AGENTS-core como catálogo revisável (ledger) usando schema YAML.** Origem: gap identificado em 2026-05-03 — `.core/templates/AGENTS-core.md.tmpl` é o conteúdo mais caro em tokens do framework, sempre injetado, e nunca passou por revisão crítica.
  - [x] **5.B3.1.5.1** Criar `.core/rules/agents-core.md` com 13 diretivas (CORE-01 a CORE-13) extraídas do template, no schema YAML de B.3.1 + corpo bilíngue. **Não-injetado** enquanto B.3.5 não rodar (catálogo paralelo). Tags: `[core, agents, always_injected]`. _Conteúdo escrito em 2026-05-03; revisão editorial no mesmo dia (Opção B fenced ```yaml após heading, headings rebaixados para `###`/`####`, cross-refs corrigidas, Instruction (en) encurtada em CORE-02/CORE-08/CORE-11). Commits: criação inicial + ajuste para Opção B pós-Prettier._
  - [x] **5.B3.1.5.2** Em B.3.4 (builder): filtrar regras com `tags: core` e gerar `.core/rules/_meta/agents-core-ledger.md` automaticamente, com tabela `id | title | category | evidence_strength | sources | chars | lines` ordenada por `id` (estabilidade).
  - [x] **5.B3.1.5.3** Em B.3.2 (parser): incluir ignore list — `.core/rules/_meta/**`, `.core/rules/catalog.md`, arquivos com sufixo `-ledger.md`, arquivos prefixados com `_`. Necessário para o ledger e o catálogo navegável (B.7) coexistirem em `.core/rules/` sem virar regras.
  - [x] **5.B3.1.5.4** Tests BDD: (i) parser ignora `_meta/` sem falhar; (ii) regras core são carregadas para `rules.json`; (iii) ledger é gerado com linhas esperadas.
  - [x] **5.B3.1.5.5** **CUTOVER aplicado 2026-05-04:** `cli/features/core/pointers.mjs` agora prefere `compileCoreRulesContent(catalog)` (filtra `scope: universal` + `tags: core` do `.core/rules/_meta/rules.json`) como `coreTemplate`; `AGENTS-core.md.tmpl` é fallback explícito quando o catálogo está ausente/inválido (sem injeção dupla — quando o catálogo entrega core, o template é ignorado). Helper `compileCoreRulesContent` adicionado em `compiler.mjs` com 4 testes BDD novos (`[BR-COMPILER-26..29]`). Snapshots de `engine.test.mjs` e `agents-merge.test.mjs` permanecem verdes (196/196) — fallback preserva comportamento legado enquanto o catálogo estiver ausente/inválido. **Movimentação física do `.tmpl` permanece deferida** (mantido como fallback até B.4 migrar `global-rules.md` e estabilizar o catálogo). Débito de remoção do template + redução de tokens cravado para `NEXT.md` em B.7.
- [x] **5.B3.2** Implementar `cli/governance/monolith/rules-parser.mjs`: lê todos os `.core/rules/**/*.md` **respeitando ignore list (5.B3.1.5.3)**; extrai bloco YAML após heading de regra (Opção B cravada em 5.B3.1); valida (i) IDs únicos, (ii) cross-refs apontando para IDs existentes, (iii) categorias-âncora `correctness`/`security` com `evidence_strength: strong`/`medium` e `sources` não-vazio (categorias `process`/`editorial` aceitam `declared_heuristic` sem source). Falha rápido em violação. **Concluído 2026-05-03:** ~350 linhas, parser caseiro sem dependências externas. Suporta: strings, arrays inline/multi-linha, comentários, validação de indentação 2-space, schema obrigatório com enum checks. Testes 31/31 validam completamente (discovery, detection, YAML subset, schema validation, cross-refs, fail-fast). Commit: `feat(spec-0018): B.3.2-B.3.3 rules-parser GREEN PHASE — 31/31 BDD tests` (2026-05-04).

- [x] **5.B3.3** Tests BDD em `cli/governance/monolith/rules-parser.test.mjs` (PT-BR, formato `DADO ... QUANDO ... ENTÃO ...`, traceability `[BR-PARSER-NN]`). Cobertura ≥ 85 %, kill-rate ≥ 60 %. **Concluído 2026-05-03:** 31/31 testes passando (100% cobertura). Parser validado manualmente com `diagnose.mjs`. Corrigido: helper `parseYamlSubset()` agora suporta arrays multi-linha + indentação validation; todos os testes BR-PARSER-01..31 passando com formato BDD completo e rastreabilidade. Commit: `feat(spec-0018): B.3.2-B.3.3 rules-parser GREEN PHASE — 31/31 BDD tests` (2026-05-04).

  **Estrutura cravada em 2026-05-03 (full coverage + TDD red→green→refactor):**
  - **Discovery (BR-PARSER-01..05):** percorre `.core/rules/**/*.md`; ignora `_meta/**`, `catalog.md`, `*-ledger.md`, arquivos prefixados com `_`.
  - **Detecção de regras (BR-PARSER-06..10):** padrão "heading `#### [ID] Title` ou `## [ID] Title` → próximo bloco fenced ` ```yaml ` "; múltiplas regras por arquivo; arquivos sem regras (só metadados) não falham.
  - **Parse YAML subset (BR-PARSER-11..18):** strings simples, arrays inline `[a, b]`, arrays multi-linha `- a\n- b`, arrays vazios `[]`, comentários `#`, strings com aspas, indentação consistente.
  - **Validação de schema (BR-PARSER-19..28):** campos obrigatórios; enums (`scope`, `category`, `evidence_strength`); IDs únicos cross-arquivo; `sources` obrigatório p/ categorias-âncora `correctness`/`security` com `evidence_strength: strong|medium`; `process`/`editorial` aceitam `declared_heuristic` sem `sources`; `scope: opt-in` exige `opt_in_feature`; `scope: adapter` exige `adapter`.
  - **Cross-refs (BR-PARSER-29..32):** `see_also` apontando para IDs existentes; falha rápido em ID quebrado (cross-arquivo).
  - **Fail-fast (BR-PARSER-33..36):** YAML malformado, ID duplicado, scope inválido, evidence_strength inválido — todos falham com mensagem precisa (linha + arquivo + razão).

  **Fixtures isoladas:** `cli/governance/monolith/__fixtures__/rules-parser/` com casos válidos e inválidos. **Nunca tocar `.core/rules/` real nos testes** — fixtures controladas garantem reprodutibilidade.

- [x] **5.B3.4** Implementar `cli/governance/monolith/rules-builder.mjs`: serializa o catálogo completo em `rules.json` (build artifact). Estrutura: `{ rules: [...], by_id: {...}, by_scope: {...}, generated_at, schema_version }`. **Adicionalmente:** filtrar regras com `tags: core` e gerar `.core/rules/_meta/agents-core-ledger.md` (tabela ordenada por `id`, ver 5.B3.1.5.2). Tests co-located. **Concluído 2026-05-04:** ~300 linhas, builder caseiro sem dependências externas. Suporta: 4 índices (rules[], by_id, by_scope, by_feature), validação cross-índice, geração de ledger markdown, fail-fast com acumulação de erros. Testes 31/31 validam completamente (discovery, indexing, validação, core ledger, metadata, edge cases). Commit: `feat(spec-0018): 5.B3.4 rules-builder.mjs + 31/31 BDD tests verdes` (2026-05-04).
- [x] **5.B3.5** Refatorar `cli/governance/monolith/compiler.mjs`: itera regras filtradas por escopo de injeção (universal + adapters ativos + opt-in selecionados); extrai apenas o bloco `Instruction (en)` de cada regra para o `<AI_GUIDELINES>`. Documentação PT-BR fica fora do bloco compilado. **Concluído 2026-05-03:** funções principais `compileRulesFromCatalog()`, `compileRulesContent()`, `filterRulesByScope()`, `extractInstructionEn()` implementadas e testadas. 28 testes BDD passando, testes BR-COMPILER-23 e BR-COMPILER-25 corrigidos (lógica de erro ao arquivo não encontrado alinhada com padrão de retorno). Todos os testes da suite verde.
- [x] **5.B3.6** Atualizar `package.json` com alvo `yarn build:rules` (executa `rules-builder.mjs`) e adicionar etapa de validação no `yarn check`.
- [x] **5.B3.7** Atualizar snapshots de `cli/app/engine.test.mjs` e `cli/governance/agents-merge.test.mjs` conscientemente (revisar diff regra-a-regra, não silenciosamente).
- [x] **5.B3.8** **[COMMIT — B.3.5 COMPILER REFACTOR]** Commit: `feat(spec-0018): 5.B3.5 compiler refactor — consumes rules.json, compileRulesFromCatalog workflow GREEN`. Contém: funções de compilação de catálogo, extração de instruções, testes de integração. 28 BDD tests passando (cobertura completa de casos: arquivo válido, path inexistente, múltiplos adapters/features). _Pronto para yarn format && yarn check && git commit._

### Sub-bloco [B.4] — Migração das regras sobreviventes para formato bilíngue

> Origem: [`[DEC-0018-B04]`](./decision-brief.md#dec-0018-b04-formato-do-catálogo-de-regras). Plan: § B.4.

- [ ] **5.B4.1** Reorganizar `.core/rules/global-rules.md`: cada regra como heading H2 com frontmatter YAML inline e corpo bilíngue (`Instruction (en)` / `Documentação (pt-br)` / `Why this is an issue` / `Noncompliant example` / `Compliant example` / `See also`). Atribuir IDs `[GR-NNNN]` sequenciais.
- [ ] **5.B4.2** Mesma operação em `.core/rules/{claude,codex,gemini}.md` com IDs `[ADP-NNNN]` (e campo `adapter`).
- [ ] **5.B4.3** Mesma operação em `.core/rules/opt-in/*.md` com IDs `[OPT-NNNN]` (e campo `opt_in_feature`). Aplicar hierarquia inicial em subdiretórios `opt-in/<tema>/` quando o tema ficar evidente (ex.: `opt-in/security/`, `opt-in/editorial/`) — sem antecipar a Spec 0011.
- [ ] **5.B4.4** **Tradução qualificada** do campo `Instruction` para Inglês — toda regra sobrevivente. Foco em jargão idiomático para modelos de fronteira; revisão humana antes do commit.
- [ ] **5.B4.5** Cobertura mínima de cross-refs: cada regra `category: security` ou `correctness` tem ≥ 1 entrada em `see_also`.
- [ ] **5.B4.6** **[COMMIT]** `feat(spec-0018): regras migradas para formato bilíngue + IDs canônicos`.

### Sub-bloco [B.5] — Eval amostral em 3 provedores

> Origem: [`[DEC-0018-B05]`](./decision-brief.md#dec-0018-b05-metodologia-do-eval-mínimo) (C + H + K + N + R) e [`[DEC-0018-B07]`](./decision-brief.md#dec-0018-b07-fronteira-com-spec-0009-harness-engineering) (D — só amostral aqui). Plan: § B.5.

- [ ] **5.B5.1** Selecionar subset crítico: regras com `evidence_strength: strong` + categorias-âncora (`correctness`, `security`).
- [ ] **5.B5.2** Definir prompts canônicos para asserção F (delta comportamental) — cenários reproduzíveis com noncompliant_example como input.
- [ ] **5.B5.3** Rodar 3 rodadas em **Claude + Codex + Gemini** para cada prompt (vetor K + N).
- [ ] **5.B5.4** Registrar passa-rate por regra × provedor com limiar **2/3** em `research/2026-04-30-eval-results.md`.
- [ ] **5.B5.5** Aplicar threshold categorizado (R): regras críticas reprovadas → cortadas no catálogo; regras opinativas/heurísticas reprovadas → débito em `NEXT.md`.
- [ ] **5.B5.6** **[COMMIT]** `research(spec-0018): eval amostral em 3 provedores publicado`.

### Sub-bloco [B.6] — Token budget: lint heurístico + sanity check

> Origem: [`[DEC-0018-B03]`](./decision-brief.md#dec-0018-b03-orçamento-de-tokens) (C + E + H + O + P). Plan: § B.6.

- [ ] **5.B6.1** Implementar `cli/governance/monolith/token-budget.mjs`: medição via Tok-H (chars/3,5 calibrado para PT-BR) + tetos por escopo (agregado ≤ 6 K; universal ≤ 1,5 K; adapter ≤ 600; opt-in ≤ 1,2 K).
- [ ] **5.B6.2** Soft ceiling: lint emite `WARN` ao 70 % de qualquer teto; **nunca** `FAIL` (alinhado com decisão E). Tests co-located.
- [ ] **5.B6.3** Hook em `yarn check` para reportar status de tokens (sem quebrar o build em soft ceiling).
- [ ] **5.B6.4** Implementar `cli/scripts/token-sanity-check.mjs` (off-CI, standalone): chama `messages.count_tokens` da API Anthropic para auditoria periódica. Documentar quando rodar (pré-release; revisão mensal).
- [ ] **5.B6.5** Documentar metodologia Tok-H em `global-rules.md` (princípio editorial; unidade canônica = tokens, com linhas/instruções como derivadas pedagógicas).
- [ ] **5.B6.6** **[COMMIT]** `feat(spec-0018): token budget lint (soft ceiling 6K) + sanity check via Anthropic API`.

### Sub-bloco [B.7] — Catálogo navegável + `NEXT.md` (débitos cravados)

> Origem: [`[DEC-0018-B04]`](./decision-brief.md#dec-0018-b04-formato-do-catálogo-de-regras) Sub-eixo 3 = N; [`[DEC-0018-B06]`](./decision-brief.md#dec-0018-b06-fronteira-com-spec-0011-regra-hierarquia) (A + F + N); [`[DEC-0018-B07]`](./decision-brief.md#dec-0018-b07-fronteira-com-spec-0009-harness-engineering) (D + H + J). Plan: § B.7.

- [ ] **5.B7.1** Gerar/manter `.core/rules/catalog.md`: índice navegável humano com 1 linha por regra (ID + intent curto + escopo + categoria + link). Validar cross-refs no `rules-parser.mjs` (5.B3.2).
- [ ] **5.B7.2** Criar `NEXT.md` com:
  - **Spec 0011 (regra-hierarquia)**: gatilho cravado `agregado compilado ≥ 4,2 K tokens (= 70 % do teto de 6 K)`; apêndice com snapshot canônico do `<AI_GUIDELINES>` ao fim da 0018 (medição Tok-H, listagem de regras, taxonomia final, cobertura de cross-refs).
  - **Spec 0009 (harness-engineering)**: pointer + nota cravando que "eval mínimo da 0018 = baseline-regression no harness" (qualquer mudança em rules invalida baseline e exige re-rodada).
  - **Inovação spec futura — Scaffolding Inteligente de Provedores**: CLI detecta provedores ativos no consumidor (heurística: presença de `CLAUDE.md`, `.codex/`, `gemini.md`) e gera (i) `.claudeignore` focado e (ii) trampolins (`CLAUDE.md` contendo apenas `@AGENTS.md`) — mitiga _Context Rot_ e elimina arquivos soltos.
- [ ] **5.B7.3** **[COMMIT]** `docs(spec-0018): catálogo navegável + NEXT.md (débitos para 0011, 0009, Scaffolding)`.

---

## Fase 6 — Stage 2 / Preparação para Review (Gate de Homologação)

> Mapeamento canônico: Fase 6 desta spec ≡ **Fase 3 (Preparação para Review)** do novo `tasks-boilerplate.md`. Esta fase é **exclusiva para empacotamento e homologação**. Nenhuma implementação após este ponto, exceto correções demandadas pelo review.

- [ ] **6.1** Atualizar header da `spec.md` desta 0018: status → `In Review`.
- [ ] **6.2** Rodar pipeline canônico: `yarn check:repo` (= `install --immutable` + `format --check` + `test:coverage`) verde.
- [ ] **6.3** Validar token budget agregado ≤ 6 K (warning ≥ 4,2 K registrado no PR description se aplicável).
- [ ] **6.4** Validar bilingual schema: nenhuma regra sobrevivente sem `Instruction (en)` E `Documentação (pt-br)`.
- [ ] **6.5** Diff em consumidor real: `node cli/ai-guidelines-cli.mjs adopt --target ../<consumidor> --dry-run` revisado para regressões.
- [ ] **6.6** Atualizar PR description (3 etapas conforme regra de PR collab): contexto → decisões cravadas (cross-ref `decision-brief.md`) → impacto cross-spec (0011, 0009, governance-information-architecture, Scaffolding).
- [ ] **6.7** **[MANDATÓRIO]** Aguardar Gate de Review Humano (homologação técnica formal). **Não prosseguir** para Fase 7 sem aprovação explícita.
- [ ] **6.8** Aplicar correções demandadas em loops de review até aprovação. Cada correção é commit incremental rastreável.

---

## Fase 7 — Stage 2 / Encerramento Pré-Merge

> Mapeamento canônico: Fase 7 desta spec ≡ **Fase 4 (Encerramento Pré-Merge)** do novo `tasks-boilerplate.md`. **[MANDATÓRIO]** Esta fase ocorre **na branch do PR, antes do merge**. Nenhuma tarefa após o merge.

- [ ] **7.1** `NEXT.md`: migrar débitos para `roadmap/backlog.md` (atualizar candidatas Spec 0011, Spec 0009, abrir candidata "Scaffolding Inteligente de Provedores") e **deletar** o arquivo.
- [ ] **7.2** Migrar 6 researches da 0018 para `.specify/specs/researchs/governance/` (auditoria, b9efb83-reconciliation, eval-results) ou `architecture/` (benchmark, bug-taxonomies, spec-driven-tools, tokens-baseline, empirical-bugs) conforme domínio. Atualizar `.specify/specs/research-index.md` com link e resumo.
- [ ] **7.3** `decision-brief.md` permanece no diretório da spec (`.specify/specs/0018-rules-content-deepening/`) como artefato histórico — **não migra**.
- [ ] **7.4** `spec.md` header: status → `Done (PR #X — YYYY-MM-DD)`.
- [ ] **7.5** `roadmap/historico.md`: spec 0018 movida para "Specs concluídas" com data; entrada removida da seção "Em execução" em `roadmap/backlog.md`.
- [ ] **7.6** `CHANGELOG.md`: entrada da 0018 (purga radical b9efb83 + pipeline Docs-as-Code bilíngue + soft ceiling de tokens + 8º boilerplate `decision-brief` + reestruturação tasks em 5 fases).
- [ ] **7.7** Confirmar que **nenhuma spec subsequente foi aberta** antes deste encerramento (regra de "uma spec ativa").
- [ ] **7.8** **[COMMIT]** `chore(spec-0018): encerramento pré-merge — research migrado, NEXT removido, status final`.
- [ ] **7.9** Aprovação humana explícita para merge. **[MANDATÓRIO]** Não fazer merge autonomamente.
