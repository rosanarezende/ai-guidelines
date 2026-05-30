# Research (Fonte A grounded) — Mapa ontológico do framework (G00)

> **Data:** 2026-05-29
> **Spec:** [`../spec.md`](../spec.md)
> **DEC alimentado:** `[DEC-0024-G00]` (raiz) + insumo para G01-G05.
> **Fonte:** **A grounded** — `src/domain/*` (código), `GOVERNANCE-CATALOG.md`, `ARCHITECTURE.md`, ADR 0010/0018. **Não** memória de sessão.
> **Método (leitor tardio):** **mapa primeiro, cardinalidade depois.** Não provar qual hipótese vence; classificar cada conceito real nas camadas, depois ler o resultado.
> **Status:** DRAFT. Resposta grounded para o ai-guidelines; falta corroboração externa (Cursor/Open Code/Multica) de que o padrão não é idiossincrático + leitura tardia.

---

## Conceitos reais (extraídos do código, não inventados)

| Conceito                                        | Onde no código                    | Natureza declarada                                                                                          |
| :---------------------------------------------- | :-------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| `WorkItem`                                      | `work-item/WorkItem.ts`           | **"Entidade central"** (discriminated union por `kind`); tem `id` + `kind` (identidade) e `status` (estado) |
| `WorkItemKind` (7 pilares)                      | `shared/types.ts` + `WorkItem.ts` | **Regra de classificação** MECE (ADR 0010)                                                                  |
| `WorkItemPatch`                                 | `WorkItem.ts`                     | **delta** de mutação (input de transformação)                                                               |
| `InMemoryRegistry`                              | `registry/Registry.ts`            | **Entidade-ledger** (SSOT; contém WorkItems; add/update/archive)                                            |
| `WorkflowState` (`stage`+`gate`+`focus`+`next`) | `workflow/WorkflowState.ts`       | **Estado** (posição de lifecycle da spec) — **separado** do `WorkItem.status`                               |
| `promote()`                                     | `policy/PromotionPolicy.ts`       | **Transformação** (verbo) — função pura **policy-gated**                                                    |
| `Policy` (WorkItem/Promotion/Governance)        | `policy/*`                        | **Regra/gate** ("policy-first": nada acontece sem aprovar)                                                  |
| `Rule` (CORE/GR)                                | `rules/Rule.ts`                   | **Entidade própria** (governança); compila o `AGENTS.md`; **não** subordinada a WorkItem                    |
| `Recipe` / `Partial` / `ComposedArtifact`       | `templates/*`                     | **Entidade-template** + **projeção** (composição determinística)                                            |
| `LivingDocs` / `registry.yml` / `AGENTS.md`     | `living-docs/*` + serializers     | **Projeções derivadas** de uma SSOT                                                                         |

---

## O mapa ontológico (concept × camada)

| Conceito                                                  |     Entidade     |    Estado     |      Transformação      |     Regra/Política      | Projeção |
| :-------------------------------------------------------- | :--------------: | :-----------: | :---------------------: | :---------------------: | :------: |
| WorkItem                                                  |   ✅ (central)   | 🟡 (`status`) |                         |                         |          |
| WorkItemKind (7 pilares)                                  | 🟡 (identidade)  |               |                         |        ✅ (MECE)        |          |
| Registry                                                  | ✅ (ledger/SSOT) |               | 🟡 (add/update/archive) |                         |          |
| WorkflowState (stage+gate)                                |                  |      ✅       |                         |        🟡 (gate)        |          |
| Promotion                                                 |                  |               |           ✅            |  ✅ (PromotionPolicy)   |          |
| Policy / GovernancePolicies                               |                  |               |                         |           ✅            |          |
| Rule (CORE/GR)                                            |   ✅ (própria)   |               |                         |           ✅            |          |
| Recipe / Partial                                          |  ✅ (template)   |               |      🟡 (compose)       | ✅ (contrato, ADR 0014) |          |
| ComposedArtifact / AGENTS.md / living-docs / registry.yml |                  |               |                         |                         |    ✅    |
| Handoff / Dashboard / Briefing / Decision Session         |                  |               |      🟡 (projetar)      |                         |    ✅    |

**Leitura por camada:** o framework **ocupa todas as colunas**. Nenhuma sozinha contém tudo. Há **múltiplas entidades de 1ª classe não-subordinadas** (WorkItem, Registry, Rule, Recipe), **dois conceitos de estado** distintos (`WorkItem.status` no registry × `WorkflowState.stage` na spec), **transformações policy-gated** e **projeções derivadas**.

---

## A spinha: "Policy-first" (governança de transformações)

O invariante **mais central e enforced em código** não é uma entidade — é uma **regra sobre transformações**:

> **Garantia #3 / Princípio #5 (ARCHITECTURE.md):** _"Nada acontece sem a política aprovar."_ Toda mudança passa pela validação **antes** de qualquer efeito. `promote()` é função pura que **gateia** a transição; o use case só toca registry/workspace **depois** de a policy aprovar.

Ou seja: o sistema existe porque **transformações governadas (policy-gated) acontecem** sobre entidades. Isso é exatamente a hipótese #4 — como **spinha/invariante**, não como negação das entidades.

---

## Veredito grounded de G00 (Fonte A — forte, não fechado)

**As 5 hipóteses NÃO são mutuamente exclusivas** (o leitor tardio acertou). A realidade do código é **composta**:

- **#1 Mono-entidade — REFUTADA como "o sistema = 1 entidade".** WorkItem é "central", mas `Rule`, `Registry`, `Recipe` são entidades de 1ª classe **não subordinadas** a ele.
- **#2 Multi-entidade — SUSTENTADA.** Múltiplos bounded contexts com conceitos de 1ª classe próprios.
- **#4 Transformação fundacional — SUSTENTADA como SPINHA.** "Policy-first" é o invariante code-enforced: todo estado muda por transformação governada.
- **#5 Metamodelo composto — A LEITURA MAIS FIEL.** Camadas (entidade · estado · transformação · regra · projeção) coexistem; nenhuma é a raiz sozinha.

**Formulação grounded:** o ai-guidelines é um **metamodelo de governança em camadas** com **`WorkItem` como entidade-trabalho central**, **`Rule`/`Policy` como camada de governança co-igual** (não subordinada), e **spinha = transformação policy-gated**. **Não é um átomo único.** A pergunta "qual é a entidade primária?" estava mal-posta; a resposta é um **conjunto mínimo em camadas**, não um substantivo.

**Por que isto explica a elevação da 0024:** handoff, boilerplates, taxonomia, promotion pipeline, decision session e projeções **não viraram 5 sistemas** porque são **camadas do mesmo metamodelo** orbitando a tríade `entidade-trabalho (WorkItem) → transformação policy-gated → projeção`. A 0024 absorveu a **camada-modelo** desse metamodelo.

---

## Sub-questões abertas (grounded levantou)

1. **Dois estados, não um:** `WorkItem.status` (draft→done, registry) ≠ `WorkflowState.stage` (discovery→done, spec). São o mesmo eixo em granularidades diferentes, ou dois eixos? (Alimenta G01/G03.)
2. **`Rule` é entidade de governança independente** — confirma a hipótese #2 (multi-entidade: trabalho **+** governança). Reforça "não mono-entidade".
3. **ADR/DEC não estão no domínio de código** — vivem como artefatos markdown governados, não como `class` no `src/domain`. São **projeções/registros** de decisão, não entidades de runtime. (Toca o "decision session": decisão é transformação registrada, não entidade.)

## Limitações

- Fonte A grounded em **código de domínio** — mas o código é a re-arquitetura DDD (`src/`) ainda **não plugada como entrypoint** (o runtime real é `cli/*.mjs`). O modelo declarado em `src/domain` é o **destino canônico**; pode haver delta com o runtime atual.
- Falta corroboração externa: **o "metamodelo em camadas" é universal ou idiossincrático do governance-first?** Cursor/Open Code/Multica precisam testar.
- Falta leitura tardia.

---

## Atualização — Primitivo vs Derivado (estrutura CAUSAL, leitor tardio 2026-05-29)

"Metamodelo composto" ainda é **descritivo**. Falta o **causal**: o que é **fundamental** e o que **emerge**. Classificação grounded:

**Primitivos (kernel gerador):**

- `WorkItem` — a **entidade-trabalho** (o que é governado). Sem ela não há objeto.
- `Rule`/`Policy` — a **governança** (o gate). "Policy-first" é o invariante; sem ela nada é autorizado.
- `State` — o **atributo que muda** (`status`/`stage` como valores).
- _(candidato)_ `Registry/SSOT` — a **fronteira de persistência** da entidade (onde a verdade vive).
- `WorkItemKind` (taxonomia) — classificação de identidade, **mas no fundo é uma `Rule`** (MECE declarada); provavelmente **não** é primitivo independente.

**A RELAÇÃO fundamental (não é categoria — é a operação geradora):**

- **Transformação governada** = `Rule (Policy)` aplicada sobre o `State` de uma `Entity` → `State'`. `promote()` é exatamente isso (função pura que gateia + devolve patch). **`Promotion` não é categoria; é instância dessa relação** — confirma o leitor tardio.

**Derivados (emergem da aplicação da relação + projeção):**

- `WorkflowState` (máquina de estágios) — derivada de regras de gate sobre estado.
- `Promotion` / `register` / `archive` / `gate-close` — instâncias da transformação governada.
- `ADR`/`DEC` — **registros de decisões** (transformações) que podem **realimentar como `Rule`** (promoção a governança) — o loop generativo.
- `Handoff` / `Dashboard` / `Briefing` / `Decision Session` / `AGENTS.md` / `living-docs` / `registry.yml` / `ComposedArtifact` — **projeções** da SSOT.

### Estrutura causal de G00 (grounded)

> O ai-guidelines não tem um átomo, **nem** é apenas um "metamodelo composto" descritivo. Tem um **kernel gerador mínimo** — `{ Entity (WorkItem), State, Rule }` — relacionado por **uma operação fundamental: a transformação governada** (`Rule` aplicada sobre o `State` de uma `Entity`). **Todo o resto emerge**: promoções, decisões/ADRs, projeções, handoff, dashboards, decision-sessions.

**Reconcilia substantivo × verbo:** os **primitivos são substantivos** (Entity, State, Rule); a **operação geradora é um verbo** (transformação governada). A call dos devs ("governança de transformações") e o código ("policy-first") apontam para a **mesma operação** como coração — mas operando **sobre** primitivos, não no vácuo.

**Gramática geradora candidata (G00, forte, grounded — sob leitura tardia + Fonte B):**

```text
Rule ∘ (Entity × State) → State'   ⇒   Projeções (handoff, dashboard, briefing, decision session)
```

G00 deixou de ser "qual o objeto?" e virou **"qual a gramática geradora do sistema?"**.

---

## Retração + grafo causal (leitor tardio 2026-05-29)

**Retração honesta:** a seção acima **propôs** o kernel `{Entity, State, Rule}` e a fórmula `Rule ∘ (Entity × State) → State'`. Isso foi **classificação proposta, não grafo causal demonstrado**. Risco: trocar a hipótese elegante "work-item governado" por outra elegante "Entity+State+Rule". Abaixo, o grafo causal de verdade — e ele **contradiz parte do meu próprio kernel**.

### Grafo causal: gerado por / depende de / definível sozinho?

| Conceito                                  | Gerado por                                   | Depende de p/ existir                          | Definível sem os demais?        | Veredito                                                         |
| :---------------------------------------- | :------------------------------------------- | :--------------------------------------------- | :------------------------------ | :--------------------------------------------------------------- |
| **Registry** (SSOT)                       | instanciação (fronteira)                     | noção de identidade/persistência               | sim (ledger genérico)           | **candidato a primitivo** (fronteira de identidade/persistência) |
| **Entity** (WorkItem)                     | ato de registro                              | `kind` (Rule) + Registry (persistência)        | shape sim; **sentido não**      | candidato a primitivo, **mas depende de Registry + Rule**        |
| **State**                                 | transições (transformação)                   | é estado **DE** uma Entity + Rule (transições) | **não** — propriedade de Entity | **DERIVADO** (o leitor tardio acertou; não é primitivo)          |
| **Rule**                                  | **Decision** (ADR/DEC → princípio) + autoria | uma Decision tê-la estabelecido                | shape sim; **existência não**   | **possivelmente DERIVADO de Decision** (nó-chave aberto)         |
| **Decision**                              | humano no gate (decision session)            | opções (evidência) + autoridade + momento      | é um **ato/relação**, não coisa | **candidato a raiz generativa**                                  |
| **ADR / DEC**                             | uma Decision                                 | Decision + registro                            | não — é registro de Decision    | **DERIVADO** (registro de Decision)                              |
| **Promotion**                             | Policy(Rule) sobre State de Entity           | Entity + State + Rule                          | não                             | **DERIVADO** (instância da transformação)                        |
| **WorkflowState** (máquina)               | Rules de gate/stage                          | Entity + Rules                                 | não                             | **DERIVADO**                                                     |
| **Projection** (handoff/dashboard/AGENTS) | derivação da SSOT                            | SSOT + consumidor + regra                      | não                             | **DERIVADO**                                                     |

### O que o grafo revela (e que eu tinha pulado)

1. **State NÃO é primitivo** — é propriedade de Entity. Meu kernel estava errado nesse ponto.
2. **Rule pode ser DERIVADO de Decision.** No pipeline do framework (`observação → … → ADR → regra`, NEXT obs #5 + `governance-foundation`), **a Decision gera a Rule**. Se confirmado, Rule não é primitivo — **Decision é mais fundamental**.
3. **Duas zonas, e a raiz generativa vive na zona humana:**
   - **Zona humana (governança, FORA do runtime — ADR 0018):** `Decision → Rule`. Os atos geradores.
   - **Zona determinística (runtime, `src/domain`):** `Rule ∘ (Entity × State) → State' → Projection`. As derivações mecânicas.
   - **Seam = o gate / decision session.** É exatamente onde a 0024 descobriu o consumidor não-modelado (obs #8).
   - **Pista grounded:** `ADR`/`DEC`/`Decision` **não existem em `src/domain`** (são markdown governado, não `class` de runtime). Isso não é lacuna — é **evidência** de que o gerador é humano-no-loop, por design (ADR 0018). O runtime determinístico só **aplica** o que a decisão humana cravou.

### Estado honesto de G00 (NÃO fecho; NÃO corôo kernel)

- **Demonstrado derivado:** State, ADR/DEC, Promotion, WorkflowState, Projection.
- **Candidatos a primitivo/raiz:** Registry (persistência/identidade), Entity (com dependências), e **Decision** (raiz generativa na zona humana).
- **Nó-chave aberto e decisivo:** **`Decision → Rule` ou `Rule` é primitivo?** Disto depende toda a cardinalidade. Não resolver isso = não fechar G00.
- **Não há kernel coroado.** O grafo mostra estrutura (2 zonas, raiz na humana), não um favorito.

---

## Pivô: do objeto para a transformação (leitor tardio 2026-05-29)

**O meta-padrão (o sintoma que eu não via):** a investigação subiu de nível a cada iteração, e **cada "raiz" anterior virou derivada**:

`WorkItem` (raiz) → atributo de governança · `{Entity,State,Rule}` (kernel) → State/Rule derivados · `Decision → Rule` → _(a próxima iteração dissolveria Decision: "Decision nasce de quê?")_.

Isso é **regresso infinito**, e é o sintoma de estar fazendo a **pergunta errada**: _"qual é o OBJETO fundamental?"_ (substantivo) — quando o framework, a cada nível, responde com uma **transformação** (verbo). Substantivos se dissolvem no nível acima; uma transformação não.

**O pivô:** G00 deixa de ser _"qual é o objeto fundamental?"_ e passa a ser **_"qual é a transformação fundamental?"_** — concretamente: **o que atravessa a fronteira entre a zona humana e a zona determinística?**

**A fronteira (apareceu em TODA parte):** ADR 0018 (canal humano × runtime determinístico) · promotion pipeline (`obs → … → ADR`) · decision session (o gate) · `observação → insight → ADR` · owner no gate · rule enforcement · handoff · projection. **Tudo converge nela.**

**O que atravessa (grounded):** **julgamento/contexto humano cristalizado em governança versionada e executável.** Âncora em código/arquitetura: ARCHITECTURE §princípio 2 — _"se está no Git, é verdade; se não está, não existe"_. Atravessar a fronteira = **virar verdade governada e versionada na SSOT determinística**. O runtime **nunca gera o julgamento** (ADR 0018); só **aplica** o que cruzou.

**Reframe candidato do propósito do framework:**

> **O ai-guidelines existe para transformar _contexto humano_ em _governança executável_.**

Nesse eixo, os "objetos" são **fases / estruturas / produtos / projeções de UMA transformação**:

- `WorkItem` = estrutura · `Decision` = momento · `Rule` = produto · `Promotion` = aplicação · `Handoff`/`Dashboard` = projeção · os **5 eixos** (seleção/persistência/promoção/projeção/governança) = **fases** da mesma transformação.

**Por que isto encerra o regresso:** uma transformação não se dissolve em "o que a gera?" — ela **é** o mecanismo gerador. "O que gera a transformação?" = o **propósito** do framework, que é a própria transformação. Saímos da camada dos objetos para a camada do **mecanismo**.

**Disciplina (não coroar):** "transformação fundamental" pode virar a nova favorita elegante. Ela só se sustenta se (a) explicar todos os conceitos **sem hand-waving** — acima parece explicar, mas é Fonte A; (b) sobreviver à Fonte B. **Mandato Fonte B (revisado de novo):** os sistemas maduros são **object-centric** ou **transformation-centric**? O que atravessa a fronteira humano→sistema **deles**? Se convergirem para "uma transformação governada de `contexto → execução`", a **descoberta estrutural da 0024** se confirma — e ela é mais importante que descobrir qual substantivo veio primeiro.
