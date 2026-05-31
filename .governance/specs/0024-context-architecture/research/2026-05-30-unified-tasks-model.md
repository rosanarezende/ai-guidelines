# Desenho — Modelo único de tasks (substituto da taxonomia) + plano de migração

> **Alimenta:** `[DEC-0024-G02]`. **Status:** desenho para o gate de G02 (Pendente). **Não é remoção** — é o que a owner exigiu ver **antes** da remoção física.
> **Data:** 2026-05-30. **Autoria:** owner (direção) + ChatGPT (inversão do mecanismo) + Claude Opus 4.8 (desenho/impacto).
> **Invariante + dependência de G00:** G02 não estabiliza antes de G00. **Este desenho assume a identidade C convergida em G00** (`contexto humano → governança executável`; a cadeia `incerteza → julgamento → gate → DEC registra` nasce dela). **Se G00 for reenquadrado materialmente no gate, o substituto deve ser reavaliado** — a _direção_ (remover a taxonomia) sobrevive; o _desenho_ não necessariamente. A execução das fases vem depois do gate.

---

## Princípio (julgamento primário; o DEC é registro, não pivô)

> **Revisão 2026-05-30 (leitor tardio, corroborada pelo README/imagem das 3 camadas):** a versão anterior ainda colocava o `[DEC]` perto do centro (`bloco → DEC → gate`). Corrigido pela lente. **O DEC continua sendo projeção** — é o _registro persistente do julgamento_, não o gatilho.

> **A propriedade primária é "o bloco possui incerteza relevante que exige julgamento?".**

```text
bloco
   ↓ possui incerteza relevante
exige julgamento
   ↓ (consequência)
gate            ← onde o humano decide (CAMADA 3)
   ↓ (persistência)
[DEC] registra o resultado   ← artefato de governança (CAMADA 2)
```

**Por que a inversão importa (análise pela lente — não cosmética):** tratar o `[DEC]` como pivô obriga a criar um **DEC-stub vazio só para marcar o gate** antes de existir conteúdo de decisão. Tratar **"exige julgamento"** como primário elimina esse artefato-fantasma: o bloco declara a _necessidade_ (uma propriedade), e o `[DEC]` é criado/populado **conforme o julgamento se forma e é cravado no gate**. Passa o critério da lente (**remove trabalho operacional real**, não renomeia) → a inversão é legítima, não estética.

Dissolve as duas condições de sobrevivência (do research de eliminação), agora ancoradas em _exige julgamento_ (não em _tem DEC_):

- **C1 (default) evapora:** um bloco é gated _iff_ exige julgamento. Não há default a errar; o freio (INV-1) fica coextensivo com "há incerteza real".
- **C2 (degeneração) é automática:** zero blocos que exigem julgamento ⟹ sem `decision-brief`, sem Stage 1 ⟹ single-pass.
- **"determinístico é excepcional" torna-se irrelevante** — o mecanismo está correto independentemente da frequência (neutraliza a 0023).

A entidade de 1ª classe deixa de ser `spec type` e passa a ser **o bloco** — com **`exige julgamento?`** como **propriedade** (derivada de "há incerteza relevante"), **não um tipo**.

> **Guard anti-taxonomia (leitor tardio, 2026-05-30):** o reflexo humano é `remove tipo antigo → cria tipo novo`. **NÃO** existem "tipos de bloco" (`bloco-julgamento` vs `bloco-determinístico`) — existe **o bloco**, portador de propriedades. Se em qualquer ponto o desenho falar em _categorias de bloco_ em vez de _propriedades de bloco_, **parar**: é a taxonomia se reconstruindo um nível abaixo. Determinístico/exige-julgamento são **valores de uma propriedade**, não classes.

### Validação contra a imagem das 3 camadas (README — artefato arquitetural ativo)

O README centra _"o julgamento humano acontece apenas onde existe incerteza real"_ — e **nem menciona DEC**. A imagem é concêntrica e mapeia o modelo exatamente:

| Camada (imagem)                                                                        | No modelo de tasks                                                                                 |
| :------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| **CAMADA 1 — Automação estrutural** (runtime, CI, validações)                          | bloco **sem** incerteza → determinístico, single-pass, sem gate                                    |
| **CAMADA 2 — Governança operacional** (contratos, `tasks`, `decision-brief`, registry) | o **`[DEC]`** mora aqui — registro persistente; o contrato/Forma D **protege** o espaço de decisão |
| **CAMADA 3 — Julgamento humano** (decisões, exceções)                                  | o **gate** — onde o bloco com incerteza real é decidido                                            |

**Resultado:** o modelo unificado é coerente com a imagem; e a imagem **confirma** a inversão (o DEC é Camada 2 / registro; o julgamento é Camada 3 / primário). O desenho anterior violava isso ao tratar o DEC (Camada 2) como gatilho.

---

## O artefato único (as 6 respostas)

| #   | Pergunta                           | Desenho                                                                                                                                                                                                                                                                                                          |
| :-- | :--------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Artefato único de tasks            | Promover `tasks-boilerplate.md` (a espinha genérica que **já existe** — "referência única do modelo, sem injeções por tipo") a canônico. Estrutura: `Fase 0 Setup → [Stage 1 condicional] → Fase 1 Implementação → Review → Encerramento`. Deletar as 3 variantes                                                |
| 2   | Bloco declara que exige julgamento | Declara **incerteza relevante** (propriedade do bloco) → gera um **gate**; o `[DEC-NNNN-*]` **registra** o julgamento (Camada 2) e o Stage 2 do bloco aguarda o gate fechar. A `Origem:` torna legível; a **fonte da verdade é a incerteza/julgamento**, não o artefato DEC                                      |
| 3   | Bloco declara determinístico       | Declara **"sem decisão pendente"** → `Origem:` cita só `plan §X`; pode iniciar após Setup + aprovação de escopo (0.6), **em paralelo** ao Stage 1 de outros blocos (absorve nativamente o paralelismo do antigo `mixed`)                                                                                         |
| 4   | Spec 100% determinística degenera  | Nenhum bloco com decisão pendente ⟹ Stage 1 **ausente**, `decision-brief.md` **não instanciado**, sem gate. Fase 0 = Setup → Fase 1 direto. É o single-pass de hoje, agora caso degenerado — **zero cerimônia**                                                                                                  |
| 5   | Spec multi-pesquisa                | Vários blocos com decisão pendente ⟹ Stage 1 produz research + popula o brief com esses `[DEC]` ⟹ gate resolve (rodadas; `Partial` válido) ⟹ cada bloco desbloqueia quando **seu** `[DEC]` fica `Resolved`. Blocos determinísticos correm em paralelo desde o Setup. **Gate por-bloco-preciso**, não spec-global |
| 6   | Impacto                            | ver tabela abaixo                                                                                                                                                                                                                                                                                                |

### Impacto (grounded — do research de eliminação)

| Camada                | Mudança                                                                                                                                          | Sev. |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- | :--- |
| runtime               | **nenhuma** — gating não ramifica na taxonomia (lê `review.md`)                                                                                  | 🟢   |
| registry/state schema | **nenhuma** — usa `WorkItemKind` (pilares), ortogonal                                                                                            | 🟢   |
| ADRs                  | **nenhum a superseder** (taxonomia não é ADR-backed)                                                                                             | 🟢   |
| enums/domínio         | `WorkflowType` (`Recipe.ts:39-44`) → aposentar ou derivar; consumidores `AssembleArtifact:65`, `ComposedArtifact:23`                             | 🟡   |
| validações            | self-consistency `workflowType` (`StructuralValidation.ts:147`) → retargetar/remover                                                             | 🟡   |
| recipes/partials      | 3 recipes de `tasks` → 1; partials de Stage 1 viram condicionais (**G04**)                                                                       | 🟠   |
| boilerplates          | deletar `tasks-{evidence-driven,deterministic,mixed}`; promover genérico                                                                         | 🟠   |
| wizard                | remover pergunta "tipo de spec" (nenhum branch achado no `cli/`)                                                                                 | 🟢   |
| documentação          | `governance-foundation.md` §"Tipos de spec" (`:27-54`) → "Propriedades de bloco"; campo "Tipo de spec" do `spec-boilerplate:9` removido/derivado | 🟡   |

---

## Plano de migração (executável — NÃO executar antes do gate de G02 + ordem do invariante)

> Sequenciado para **nunca** deixar o repo num estado onde artefato vivo contradiz o contrato. Cada fase é mergeável e reversível.

- **Fase 0 — Gate de G02** _(pré-requisito; sob G00)_. Owner crava o finding. Sem isto, nada físico abaixo.
- **Fase 1 — Boilerplates ao contrato** ✅ _(feito 2026-05-30, independente de G02)_. Pró/Contra → conjunto mínimo; Forma D; gate modes; cláusula do plan. Os 3 tasks-boilerplates refletem o contrato **enquanto existirem**.
- **Fase 2 — Promover o modelo único.** `tasks-boilerplate.md` genérico → canônico, com Stage 1 condicional + declaração de bloco (`tem decisão pendente?`). Documentar em `governance-foundation.md` (§"Tipos de spec" → §"Propriedades de bloco"). _Ainda sem deletar as variantes._
- **Fase 3 — Aposentar `WorkflowType`.** Domínio: tornar derivado ou remover (`Recipe.ts`); retargetar `StructuralValidation`/`ComposedArtifact`/`AssembleArtifact`. Testes verdes. Runtime/schema intocados.
- **Fase 4 — Simplificar wizard.** Remover a pergunta de tipo de spec; a declaração migra para block-definition. Remover/derivar o campo "Tipo de spec" do `spec-boilerplate`.
- **Fase 5 — Apagar a taxonomia antiga.** Deletar `tasks-{evidence-driven,deterministic,mixed}-boilerplate.md` (×3 roots) + partials específicos; limpar referências em doc. **Só após Fases 2-4 estáveis.**

> **Liga ao G04:** Fases 2/5 colidem com a "casa única dos templates" (tri-root). Idealmente G04 (modelo de fonte única) crava **antes** da Fase 5, para a deleção acontecer numa topologia só. Se G04 ainda não fechou, a Fase 5 replica a deleção nas 3 raízes (imposto conhecido).

---

## Footprint por classe de impacto (revisão — leitor tardio, 2026-05-30)

> Re-slice do plano sob a pergunta _"o que realmente exige mudança de código?"_. Confirma a suspeita: o footprint executável é **pequeno**; o grosso é doc + recipes/templates.

| Classe                       | Itens                                                                                                                                                                                                                                                                    | Tamanho                     |
| :--------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------- |
| **Executável real (código)** | `WorkflowType` enum (`Recipe.ts:39-44`) + 3 consumidores (`AssembleArtifact:65`, `ComposedArtifact:23`, `StructuralValidation:147`) → aposentar/derivar · wizard: remover a pergunta de tipo (se houver branch). **Zero** em runtime gating, schema registry/state, ADRs | 🟢 ~4 arquivos TS + wizard  |
| **Documental**               | `governance-foundation.md` §"Tipos de spec" (`:27-54`, refs `:382-385`) → "Propriedades de bloco" · campo "Tipo de spec" no `spec-boilerplate` · menções soltas (README/AGENTS)                                                                                          | 🟡 doc                      |
| **Recipes/templates**        | deletar `tasks-{evidence-driven,deterministic,mixed}` (×3 roots) + promover o genérico + partials condicionais · tri-root (**G04**)                                                                                                                                      | 🟠 estrutural, mas mecânico |

**Conclusão:** ~70% do plano é **documental + recipes/templates** (mecânico, reversível, sem risco de runtime). O **código real** resume-se a aposentar um enum de metadata + ~3 consumidores + 1 prompt de wizard. O impacto estava **superestimado** pela leitura das 5 fases — elas descrevem _sequência_, não _tamanho_. As fases seguem válidas como ordenação; esta tabela é o tamanho real.

---

## O que falta decidir (não decidido aqui)

- **Mecanismo de declaração do bloco:** o bloco declara a **propriedade "exige julgamento"** (há incerteza relevante) — **não** se ancora no artefato `[DEC]` (inversão acima). Forma legível candidata: marcador no sub-bloco `(julgamento)` / `(determinístico)`, e o `[DEC]` nasce como **registro** quando o julgamento é cravado no gate. **A owner confirma no gate de G02.**
- Ordenação com **G01** (a propriedade primária bloco-com-decisão reenquadra os pilares) — alimenta G01, não decide.
