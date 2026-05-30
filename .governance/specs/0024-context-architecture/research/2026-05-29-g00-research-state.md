# G00 Research State — consolidação (não-teoria)

> **Data:** 2026-05-29
> **Spec:** [`../spec.md`](../spec.md)
> **DEC:** `[DEC-0024-G00]` (raiz).
> **Propósito:** consolidar a trilha — **demonstrado / refutado / aberto / especulação** — antes de perder contexto. **Não** introduz hipóteses novas. Base para decidir continuar a pesquisa vs handoff.
> **Trilha de artefatos:** `g00-internal-audit` (Fonte A + mandatos) · `spec-kitty` · `hermes-agent` · `g00-ontological-map` (mapa + grafo causal + pivô transformação) · `multica`. Cursor/Open Code **pendentes**.

---

## Camada 1 — Demonstrado / consolidado (sobreviveu a múltiplas rodadas de falsificação)

- **Handoff não é o centro** — é uma projeção.
- handoff / boilerplates / taxonomia / decision-session / promotion **orbitam o mesmo problema** → a **elevação da 0024 foi correta**.
- **O framework NÃO é mono-entidade** (grounded: `Rule`, `Registry`, `Recipe` são 1ª classe não-subordinadas a `WorkItem`).
- **WorkItem sozinho não explica** o sistema; **lifecycle sozinho não explica** (é predicado, não entidade).
- **`State` é derivado** (propriedade de Entity), não primitivo (grounded no código).
- **`ADR`/`DEC` não são entidades de runtime** — markdown governado; o gerador é **humano-no-loop por design** (ADR 0018).
- **consumidor = atributo/projeção (G05)**, não eixo fundacional (Spec Kitty + Hermes + Multica: nenhum o trata como eixo).
- **governance-first é classe arquitetural distinta de autonomy-first** (4 sistemas).

## Camada 1b — Refutado explicitamente (cemitério de hipóteses)

| Hipótese                                      | Status             | Por quê                                                       |
| :-------------------------------------------- | :----------------- | :------------------------------------------------------------ |
| unidade primária = `WorkItem` (mono-entidade) | **REFUTADA**       | multi-entidade grounded                                       |
| unidade primária = `spec` / `artefato`        | **REFUTADA**       | spec = acidente histórico; artefato = projeção (ADR 0023/G05) |
| kernel = `{Entity, State, Rule}`              | **REFUTADA**       | State é derivado; Rule talvez derivado de Decision            |
| transformação **universal**                   | **REFUTADA**       | Multica/Hermes são object-centric/autônomos                   |
| consumidor = 4º eixo fundacional              | **quase-refutada** | 3 sistemas: atributo, não eixo                                |
| "metamodelo composto" como resposta           | **insuficiente**   | é descritivo, não causal                                      |

## Camada 2 — Forte, mas ABERTO

- Existe uma **fronteira humano→sistema central**; **ADR 0018 é mais central** do que parecia no início.
- A fronteira é **mais espessa em governance-first** (Spec Kitty, ai-guidelines) vs **fina/autônoma** (Hermes, Multica).
- **decision session não é acidental** — Spec Kitty tem análogo (review/accept); é o **seam** da fronteira.
- **transformação governada explica a 0024 melhor que objetos isolados.**
- O **regresso infinito** (cada "raiz" vira derivada no nível acima) indica que **"qual objeto?" é a pergunta errada** — o sistema responde com mecanismo, não com substantivo.

## Camada 3 — Especulação sofisticada (FREIO — não tratar como verdade)

- "o framework existe para transformar **contexto humano → governança executável**" (reframe candidato; atraente e grounded-ish, **não fechado**).
- "a transformação fundamental é a raiz."
- "espessura da fronteira é o eixo separador **universal**."
- "governance-first ⟺ transformation-centric" (bi-condicional não provado).

### Lente nova (do leitor tardio, NÃO testada) — substituí indevidamente por "espessura"

Talvez o eixo não seja **espessa vs fina**, mas **qual TIPO de responsabilidade cruza a fronteira**:

| Classe        | O que cruza a fronteira |
| :------------ | :---------------------- |
| ai-guidelines | **julgamento**          |
| Spec Kitty    | **aprovação**           |
| Multica       | **delegação**           |
| Hermes        | **aprendizado**         |

Esta lente é **mais rica** que espessura e ainda **não foi investigada**. Entra como **pergunta aberta de alto valor**, não achado.

---

## Perguntas abertas (priorizadas)

1. **[Decisivo / lente nova]** Qual **tipo de responsabilidade** cruza a fronteira humano→sistema, e isso é um eixo melhor que "espessura"? (julgamento / aprovação / delegação / aprendizado)
2. **Cursor e Open Code** (governance-leve): engrossam ou afinam a fronteira? Que responsabilidade cruza?
3. **`Decision → Rule`** (zona humana): demonstrar via `governance-foundation` (pipeline de promoção), ou aceitar que é **processo**, não runtime?
4. A "transformação governada de contexto→governança" **bounded** (assinatura de classe) é **suficiente para fechar G00**, ou precisa de formalização (gramática)?
5. **`WorkItem.status` vs `WorkflowState.stage`** — 1 eixo ou 2? (alimenta G01/G03)

## Impacto preliminar em G01-G05

- **G01 (7 pilares):** pilares = estrutura de **identidade** dentro da transformação; **não** a raiz. `WorkItemKind` é, no fundo, uma `Rule` (taxonomia).
- **G02 (taxonomia spec):** forte candidata a **SINTOMA** (consequência de pilar + certeza-de-design), não 1ª classe — consistente com "objetos são fases da transformação".
- **G03 (promotion pipeline):** `promotion` = **instância** da transformação governada (`Rule` sobre `State` de `Entity`). O pipeline **É** a transformação aplicada à promoção.
- **G04 (contrato de boilerplate):** boilerplate = **estrutura** que a transformação instancia; contrato mínimo = o que toda instância precisa.
- **G05 (projeções):** projeções = **saídas** da transformação; consumidor = atributo. Handoff/dashboard/decision-session = projeções da mesma transformação.

> **Observação:** se a transformação se confirmar como assinatura de classe, **G01-G05 deixam de ser 5 perguntas independentes** e viram **facetas de um mesmo modelo** (identidade / lifecycle / promoção / contrato / projeção da transformação). Isso simplificaria o gate — mas é Camada 3, não fechado.

## Recomendação de processo

- **Consolidação (este artefato): feita.**
- **Decisão pendente:** Cursor/Open Code valem 1 rodada final? (Sim, se a lente "tipo de responsabilidade" precisar de mais amostra.) Estimativa do leitor tardio: **+1 consolidação + talvez +1 validação**, depois **handoff**.
- **Risco atual ≠ falta de pesquisa.** É **perder a trilha lógica** — que já vale mais que qualquer sistema externo adicional. **Commit do round G00 + handoff** preservam a trilha.
