# Research — Inventário arquitetural do backlog (Grupo A / B / C)

> **Data:** 2026-05-29
> **Spec:** [`../spec.md`](../spec.md)
> **DECs alimentados:** estrutural — define a fronteira de escopo da 0024 elevada a spec fundacional de arquitetura de contexto. Alimenta diretamente `[DEC-0024-G00..G05]` e a re-escopa de candidatas no backlog.
> **Fonte de evidência:** Fonte A (auditoria estrutural interna). A corroboração externa (Fonte B) virá dos artifacts per-sistema; este inventário **não fecha** decisão sozinho.

---

## Por que este artefato existe (a "pausa de uma etapa")

A 0024 foi elevada (decisão da owner, 2026-05-29) de `handoff-as-first-class` para **spec fundacional da arquitetura de preservação, promoção, seleção e projeção de contexto** do ai-guidelines. Handoff vira uma das projeções.

A elevação cria um risco imediato: _"isso entra na 0024 ou não?"_ vira disputa de intuição. Este inventário substitui intuição por **classificação por dependência arquitetural**. Ele é o **primeiro passo de execução** e **pré-requisito** de qualquer re-escopa do `backlog.md` — a conclusão (mover item X para a 0024) nunca aparece antes da evidência (a classificação validada).

> **Status:** DRAFT para validação humana. A re-escopa do backlog (`boilerplate-system-modernization` etc.) só ocorre **após** esta classificação ser validada no gate.

## Critério de classificação

| Grupo                | Critério                                                                                                          | Destino                                                                                                |
| :------------------- | :---------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **A — Fundacional**  | Se decidido **errado**, **invalida** o design de handoff/seleção/projeção/governança. É _modelo_, não execução.   | Entra no escopo de **decisão** da 0024 (DEC do Bloco G / A-F).                                         |
| **B — Derivado**     | Depende da ontologia que a 0024 cravar; é _execução do modelo_ (aplicar/converter/atualizar).                     | Faseado: ≥1 artefato de **referência** na 0024 (Stage 2) + migração ampla nas candidatas re-escopadas. |
| **C — Independente** | Não depende do resultado da 0024 para ser decidido corretamente. Pode ser informado por ela, mas não é bloqueado. | Trilha própria (candidatas/Later inalteradas).                                                         |

A fronteira canônica do plano: **a 0024 decide o modelo; não migra o mundo.**

---

## Grupo A — Fundacional (entra no escopo de decisão da 0024)

| Item do backlog / tema                                                                                                                                              | Por que é fundacional                                                                                                                                                                                                                 | DEC ancorante                                                                                |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------- |
| **Unidade primária de modelagem** (`spec`/`pilar`/`lifecycle`/`artefato`)                                                                                           | Se a unidade primária mudar, taxonomia, boilerplates, lifecycle, handoff e projeções mudam juntos. É a raiz.                                                                                                                          | `[DEC-0024-G00]` _(RAIZ)_                                                                    |
| **Papel dos 7 pilares MECE** (ADR 0010)                                                                                                                             | Testar a inversão `pilares → artefatos → lifecycle → tipo percebido`. Os pilares podem ser a estrutura primária; hoje tudo é spec-cêntrico.                                                                                           | `[DEC-0024-G01]`                                                                             |
| **Taxonomia `deterministic/mixed/evidence-driven`** (de `boilerplate-system-modernization`, hipótese linha 78)                                                      | Pode ser sintoma emergente, não entidade de 1ª classe. Erra o handoff se a taxonomia que organiza os artefatos estiver errada.                                                                                                        | `[DEC-0024-G02]`                                                                             |
| **Promotion pipeline** (reconcilia D04 + ADR 0010 `proposal→spec`/`experiment→spec` + cadeia `observação→regra→ADR`)                                                | Como unidades evoluem define o que o handoff projeta e quando promover.                                                                                                                                                               | `[DEC-0024-G03]` (+ D01-D04)                                                                 |
| **Contrato mínimo de boilerplate + extração do _core_ comum** (de `boilerplate-system-modernization`)                                                               | O _core_ comum é ontologia, não migração: define o que toda spec instancia. Sem ele, novas specs reproduzem o lifecycle antigo.                                                                                                       | `[DEC-0024-G04]`                                                                             |
| **Modelo de projeção SSOT → N consumidores** (eleva Bloco E)                                                                                                        | A tese central: uma SSOT, múltiplas projeções (handoff, wizard, AGENTS.md, dashboard).                                                                                                                                                | `[DEC-0024-G05]` (+ E01-E03)                                                                 |
| **`handoff-contracts-formalization`** (contratos stage→release / consumer→maintainer)                                                                               | Backlog já marca _"overlap parcial com handoff-as-first-class"_; `handoff/` já é **reserva estrutural** no catálogo/arquitetura de referência, não feature acessória. Afeta o modelo de continuidade entre sessões/agentes/humanos.   | research, liga E/F — **Grupo A confirmado (owner, 2026-05-29); absorve na research inicial** |
| **Invariante de topologia/SSOT-root canônico** — _definição_ de lar canônico + precedência + ownership dos artefatos (de `runtime-and-template-root-consolidation`) | A arquitetura de contexto pressupõe **onde** a SSOT vive, **quem é canônico** e paridade maintainer/consumer. **A _definição_ (lar/precedência/ownership) é A; migração/wiring/adaptação de CLI é B** — fronteira a manter explícita. | liga F                                                                                       |
| **`core-rules-top-naming-audit`** (fronteira CORE-\* vs GR-\*)                                                                                                      | _A-adjacente, baixo._ Toca a taxonomia de regras (unidade promovível). Informa G03/D, não bloqueia.                                                                                                                                   | informa `[DEC-0024-G03]`                                                                     |

> **Nota sobre splits:** `boilerplate-system-modernization` e `runtime-and-template-root-consolidation` **não** entram inteiras — só sua **camada de modelo** (contrato, core, taxonomia, invariante de topologia). Suas camadas de execução estão no Grupo B.

---

## Grupo B — Derivado (faseado: referência na 0024 + migração nas candidatas)

| Item                                                                                                                                                                                                                                                   | Por que é derivado (depende da ontologia)                                                                 |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| **`boilerplate-system-modernization`** (migração/retrofit/6 boilerplates por classe/versionamento/examples/quickstart/paths)                                                                                                                           | Executa o contrato que a 0024 cravar. Re-escopada para "migração + abrangência dada a ontologia da 0024". |
| **`runtime-and-template-root-consolidation`** — **apenas** execução (migração/wiring/adaptação de CLI: ~13 touch-points, remoção de legados, mover 8 specs, colapsar templates Fase 4). _A definição de lar canônico/precedência/ownership é Grupo A._ | Aplica o invariante de topologia (Grupo A) no ecossistema. Execução pesada, faseável.                     |
| **`regra-hierarquia`** (fragmentação de `AGENTS.md` por subdir)                                                                                                                                                                                        | `AGENTS.md` é projeção; sua fragmentação é refino da projeção definida em G05/E.                          |
| **`recipes-mirror-to-engine-migration`**                                                                                                                                                                                                               | Migração de templates para o engine — executa contra o contrato de boilerplate.                           |
| **`cli-mjs-to-src-ddd-cutover`**                                                                                                                                                                                                                       | Dívida técnica que limpa o runtime que abrigará as projeções. Habilitador, não definidor.                 |
| **`fix(boilerplates)` numeração de pointers** (Later)                                                                                                                                                                                                  | Execução contra o contrato de boilerplate.                                                                |

---

## Grupo C — Independente (trilha própria; informado, não bloqueado)

| Item                                                                                                                                                    | Por que é independente                                                                                                                       |
| :------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------- |
| **`governance-dashboard-and-visual-artifacts`** (Now §1)                                                                                                | O _modelo_ de projeção está na 0024 (G05/E); o **build** do dashboard é instância independente. Herda o modelo, não o define.                |
| **`coverage-rigor-enforcement`**                                                                                                                        | O _princípio_ (quais invariantes sob enforcement) já está em `[DEC-0024-F04]`; a implementação do piso de coverage é qualidade independente. |
| **`wizard-menu-scaling-redesign`**                                                                                                                      | Wizard é consumidor de projeção; o redesign de UX do menu não depende da ontologia.                                                          |
| **`harness-engineering`**                                                                                                                               | Validador/eval-as-gate; concern separado de governança de qualidade.                                                                         |
| **`stakeholder-intake-pipeline`**                                                                                                                       | _C com nota:_ informa G03 (como itens entram no pipeline), mas o mecanismo de intake é execução independente.                                |
| **`seguranca-ia-supply-chain`** · **`framework-observability-dashboard`** · **`pr-curator-action`** · **`cli-update-notifier`** · **`quota-awareness`** | Concerns operacionais/segurança/telemetria sem dependência da ontologia de contexto.                                                         |
| **Later** (composite-action; rename `buildContextBundle`; chore BR labels)                                                                              | Chores triviais.                                                                                                                             |

---

## O que este inventário demonstra

1. **Boa parte da camada fundacional já estava espalhada** entre `boilerplate-system-modernization`, `runtime-and-template-root-consolidation` e `handoff-contracts-formalization`. Parte relevante dessas 3 candidatas é **sintoma da mesma lacuna arquitetural fundacional** — descritas como independentes, mas convergentes. A 0024 não inventa escopo: transforma **3 candidatas parcialmente sobrepostas em um único modelo arquitetural explícito**, reduzindo backlog estrutural, ambiguidade futura e carga cognitiva dos gates.
2. **A fronteira modelo ≠ migração é objetiva**, não retórica: cada candidata grande foi **split** em camada-modelo (A) e camada-execução (B).
3. **Nenhum item do Grupo C é absorvido** — a elevação não vira "spec que engole o backlog inteiro".

## Limitação (honestidade epistêmica)

Esta é **Fonte A (auditoria interna)**. A hipótese mais radical da sessão — _"talvez estejamos modelando errado há muito tempo"_ — não pode ser confirmada só olhando os próprios artefatos (risco de reforçar o viés existente). A classificação acima, especialmente para `[DEC-0024-G00/G01/G02]`, **exige corroboração da Fonte B** (research externa: Hermes, Spec Kitty, Open Code, Cursor, Anthropic) antes de fechar no gate.
