# Research — Eliminação da taxonomia de tipos de spec (`deterministic / mixed / evidence-driven`)

> **Alimenta:** [`[DEC-0024-G02]`](../decision-brief.md).
> **Direção decidida (owner, 2026-05-30):** a taxonomia **será removida**. Este documento **não testa mais _se_ cai** — registra os **invariantes a preservar** + o **impacto** que o modelo substituto deve honrar (desenho em `2026-05-30-unified-tasks-model.md`).
> **Modo de gate:** `aceitação` do modelo substituto — **a confirmar** (ato formal aguarda cristalização + ordem do invariante com G00).
> **Data:** 2026-05-30. **Autoria:** owner (direção) + Claude Opus 4.8 (projeção/impacto) + ChatGPT (leitor tardio).
> **Invariante de ordem (ADR 0018):** G02 **não estabiliza antes de `G00 Resolved`**; a seta de autoria é `humano → sistema`. A **direção** é da owner; este doc produz **invariantes + impacto**, não o ato do gate.

---

## Pergunta (formulação da owner, 2026-05-30)

A taxonomia `deterministic / mixed / evidence-driven` está no **nível errado da modelagem**? Hipótese emergente:

- a spec **não possui tipo**;
- a spec **contém blocos**;
- cada bloco **pode ou não exigir pesquisa**; **pode ou não depender de decisão**;
- o fluxo é determinado **pelo trabalho**, não por uma classificação global da spec.

Consistente com a identidade C do G00: **a raiz é o mecanismo de transformação, não o objeto** — logo "tipo de spec" seria uma _projeção_, não uma entidade. Trajetória da sessão: `mixed deve existir?` → `mixed é sintoma (derivado de evidence-driven)` → **`os três tipos são sintomas do mesmo mecanismo`**.

---

## Objetivo 1 — Validar que a eliminação preserva os invariantes _(direção decidida; não é mais "testar se cai")_

**Resultado: preservável** — todo invariante hoje protegido pela taxonomia decompõe-se numa **propriedade de bloco** (Objetivos 2-3). As duas condições (C1, C2) que antes ressalvavam isso foram **dissolvidas** pela inversão _julgamento-primário_ (o gate fica coextensivo com "há incerteza real"; ver `2026-05-30-unified-tasks-model.md` § Princípio). O steelman da não-eliminação foi testado e **não sobrevive** — mantido abaixo por completude.

**Steelman da não-eliminação (invariante genuinamente global?):** o candidato mais forte é a **fronteira global Stage 1 → Stage 2** (o gate fecha para a spec _inteira_ de uma vez). Mas: (a) o `mixed` **já quebra** essa globalidade (sub-blocos determinísticos rodam pré-gate); (b) o runtime **não depende** dela para autorizar execução (lê `review.md`, não o tipo — ver Objetivo 4). Logo nem essa é spec-global-only. **O steelman não sobrevive** — não encontrei invariante expressável _apenas_ no nível da spec.

---

## Objetivo 2 — Invariantes que a taxonomia protege hoje

| #         | Invariante                                     | O que protege                                                                               | Fonte                                               |
| :-------- | :--------------------------------------------- | :------------------------------------------------------------------------------------------ | :-------------------------------------------------- |
| **INV-1** | **Freio anti-acreção-pré-research**            | specs `evidence-driven`/`mixed` exigem gate antes de cravar design técnico                  | `governance-foundation.md:48`                       |
| **INV-2** | **Existência condicional do `decision-brief`** | brief existe **iff** tipo ∈ {`evidence-driven`, `mixed`}                                    | `governance-foundation.md:385`                      |
| **INV-3** | **Caminho leve determinístico**                | `deterministic` = single-pass, sem brief/Stage 1/gate (sem cerimônia)                       | `tasks-deterministic-boilerplate.md:11`             |
| **INV-4** | **Caveat de paralelismo**                      | sub-blocos determinísticos podem rodar pré-gate (só `mixed`)                                | `governance-foundation.md:54`                       |
| **INV-5** | **Forcing function de classificação**          | o campo "Tipo de spec" força o critério-teste ("design depende de evidência não coletada?") | `spec-boilerplate` + `governance-foundation.md:382` |
| **INV-6** | **Self-consistency check (código)**            | `StructuralValidation` exige `artifact.workflowType == recipe.workflowType`                 | `StructuralValidation.ts:147-149`                   |

---

## Objetivo 3 — Esses invariantes são preserváveis por propriedades de bloco?

| Invariante               | Preservável por bloco?  | Como / ressalva                                                                                                                                                                                                                                |
| :----------------------- | :---------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| INV-1 (freio)            | ✅ **mais forte**       | bloco com `[DEC]`/necessidade de pesquisa dispara o gate **para aquele bloco**; o freio vira por-bloco (mais preciso que por-spec)                                                                                                             |
| INV-2 (brief existe)     | ✅ mais limpo           | brief existe **iff ≥1 bloco tem `[DEC]`**                                                                                                                                                                                                      |
| INV-3 (caminho leve)     | ⚠️ **condicional (C2)** | spec com **todos** os blocos determinísticos = sem brief, sem gate = single-pass. **Só vale se o boilerplate unificado degenerar limpo** ao caso trivial (sem gate-fantasma num fix de bug)                                                    |
| INV-4 (paralelismo)      | ✅ **nativo**           | já É propriedade de bloco; deixa de precisar de um "tipo `mixed`" — a razão de existir do mixed **se dissolve**                                                                                                                                |
| INV-5 (forcing function) | ⚠️ **condicional (C1)** | a pergunta migra de spec-creation para block-definition. **Depende do default:** se default = "exige pesquisa/gate" (determinístico é a **exceção marcada**, como a owner propôs), preserva-se; se default = determinístico, **erode** o freio |
| INV-6 (self-consistency) | ✅ bounded              | retirar o campo, **ou** torná-lo derivado ("artefato tem blocos gated?"); muda o alvo do check em `StructuralValidation`/`ComposedArtifact`/`AssembleArtifact`                                                                                 |

**Condições de sobrevivência da hipótese:**

- **(C1)** o **default de bloco** precisa ser "exige pesquisa/gate"; determinístico é a exceção _consciente e marcada_. Senão INV-5 (forcing function) e INV-1 (freio) erodem.
- **(C2)** o boilerplate unificado precisa **degenerar limpo** para single-pass quando nenhum bloco precisa de pesquisa. Senão INV-3 (caminho leve) se perde e specs triviais ganham cerimônia.

---

## Objetivo 4 — Impacto real (grounded)

| Camada                    | Impacto                                                                                                                                       | Severidade    | Fonte                                                                                                |
| :------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------- | :------------ | :--------------------------------------------------------------------------------------------------- |
| **Runtime**               | **Nenhum** — gating (`executionAuthorized`) **não ramifica** na taxonomia; lê `review.md`                                                     | 🟢 nulo       | busca por `executionAuthorized`/Stage vazia em `src/`                                                |
| **Schema registry/state** | **Nenhum** — usa `WorkItemKind` (7 pilares), taxonomia **ortogonal**                                                                          | 🟢 nulo       | `registrySchema.ts` / `types.ts` (WorkItemKind)                                                      |
| **ADRs**                  | **Nenhum a superseder** — taxonomia não é ADR-backed (ADR 0010 = pilares)                                                                     | 🟢 nulo       | `.core/governance/adrs/` (sem ADR de spec-type)                                                      |
| **Domínio**               | `WorkflowType` enum (`["evidence-driven","deterministic","mixed","n/a"]`) flui como **metadata** (não control-flow) + 1 check de consistência | 🟡 bounded    | `Recipe.ts:39-44`, `AssembleArtifact.ts:65`, `ComposedArtifact.ts:23`, `StructuralValidation.ts:147` |
| **Recipes / partials**    | 3 recipes de tasks → 1 (`ArtifactKind` já é **um** `"tasks"`; tipo é só qualificador). **Território do G04** (casa única dos templates)       | 🟠 estrutural | `Recipe.ts:31` (`"tasks"` singular); partials só `evidence-driven` migrados                          |
| **Wizard**                | **Nenhum prompt de spec-type encontrado** que ramifique na taxonomia (a confirmar)                                                            | 🟢 baixo      | busca em `cli/` (só falsos-positivos "deterministic build")                                          |
| **Boilerplates**          | 3 tasks-boilerplates → 1 modelo unificado + propriedade de bloco                                                                              | 🟠 estrutural | `tasks-{evidence-driven,deterministic,mixed}-boilerplate.md`                                         |
| **Documentação**          | `governance-foundation.md` § "Tipos de spec" (`:27-54`) + campo "Tipo de spec" no `spec-boilerplate`                                          | 🟡 doc        | `governance-foundation.md:27-54,382-385`                                                             |

**Leitura do mapa:** o footprint **não toca** runtime, schema nem ADRs. Concentra-se em **recipe/partials (G04) + um enum de metadata + boilerplates + doc**. É bounded — e majoritariamente na **camada de materialização que o G04 já governa**. Isso _de-risca_ a hipótese, mas confirma que é **decisão de G02 com consequências de G04**, não um edit.

---

## Objetivo 5 — Comparação dos modelos (simetria informacional — conjunto mínimo do contrato)

### Modelo Atual — 3 tipos de spec

- **Problema que resolve:** dá um gatilho explícito ("é evidence-driven → tem gate") e um caminho leve para specs triviais.
- **Benefícios:** sinal coarse glanceable; caminho determinístico sem cerimônia; classificação familiar.
- **Tradeoffs:** o tipo é decidido **antes** de se conhecer o trabalho; specs reais raramente são puras (daí o `mixed`).
- **Riscos:** **drift estrutural recorrente** (3 boilerplates a sincronizar à mão — observado: mixed sempre atrás); fronteiras borradas (obs #7, `decision-brief.md:37`).
- **Quando escolher:** se G01 revelar um invariante **próprio** de algum tipo, ou se houver demanda concreta pelo paralelismo _como tipo_.
- **Quando NÃO escolher:** quando o custo de drift recorrente excede o valor do sinal coarse — i.e., agora, dado N=4 specs e zero dependência limpa do `mixed`.

### Modelo Unificado — 1 spec + propriedades de bloco

- **Problema que resolve:** o fluxo segue o **trabalho real**; sem pré-classificação global; o freio vira por-bloco (mais preciso).
- **Benefícios:** **mata a classe inteira de drift** (1 modelo); coerente com G00 (mecanismo > objeto); dissolve a fronteira borrada (obs #7); paralelismo vira nativo.
- **Tradeoffs:** perde o sinal coarse spec-level (recuperável como propriedade derivada); a forcing function migra de spec→bloco.
- **Riscos:** **(C1)** se o default não for "exige gate", erode o freio; **(C2)** se não degenerar limpo, impõe cerimônia a specs triviais; custo de refactor em recipe/domínio/doc.
- **Quando escolher:** se C1 e C2 forem garantidas no design e G00 confirmar identidade C.
- **Quando NÃO escolher:** antes de G00 (invariante); ou se "determinístico é excepcional" for falso de tal modo que o default-and-exception fique ergonomicamente invertido (ver abaixo).

---

## O que isto NÃO resolve (falsificabilidade honesta)

1. **"Determinístico será excepcional" é falsificado pela 0023** — lá os sub-blocos determinísticos **dominaram** (A/B/C/G/H/L/N/O det vs. só D/E/F evidence-driven). Ou "excepcional" está errado, ou é artefato da convergência retroativa da 0023. **Não resolvido** — e C1 (o default) depende disso.
2. **N=4 specs** (0018-meta, 0019, 0023, 0024) — _"não usaram ainda" ≠ "nunca útil"_. Evidência forte, não fecha o futuro.
3. **C2 (degeneração limpa)** é afirmação de design ainda não desenhada — precisa de um esboço do boilerplate unificado para virar verificável.
4. **Depende de G00.** O finding é candidato líder do G02, mas não estabiliza antes do gate de G00.

---

## Roteamento (contrato)

- **Finding do G02**, modo de gate candidato `aceitação`. **Não cravar antes de G00.**
- **Meta-evidência para o gate de G00:** é a 2ª vez na sessão que a intuição da owner colapsa uma DEC downstream numa **faceta do G00** (mixed-é-sintoma → taxonomia-inteira-é-sintoma). É a **cascata prevista** (handoff §6/§7) acontecendo _antes_ de G00 ser cravado — sinal de que a identidade C é **load-bearing** (explica a órbita). Alimenta o gate de G00; não o decide.
- **Reflexo operacional:** **parkar** correções nos boilerplates de tasks (Achado 1 parte-tasks + Achado 3 sync-mixed) até o gate de G02 — corrigi-los agora é provável retrabalho. Forma D (decision-brief) + G00-reescrito + Achado 4 (plan) seguem **ortogonais e válidos**.
