# Research — G00 Auditoria interna (Fonte A): qual é a unidade primária de modelagem?

> **Data:** 2026-05-29
> **Spec:** [`../spec.md`](../spec.md)
> **DEC alimentado:** `[DEC-0024-G00]` (raiz). Insumo também para G01-G05.
> **Fonte:** **A — auditoria estrutural interna** (o framework lendo seus próprios artefatos/código/histórico).
> **Status:** **DRAFT pré-leitor-tardio.** Fonte A **não fecha G00** — a disciplina de falsificação exige corroboração da Fonte B (research externa) antes de cravar. Aqui não há veredito; há modelo observado + tensões + candidato preliminar + alvos de refutação.

---

## Método e guardrails (owner, 2026-05-29)

Duas perguntas **distintas**:

1. **Qual unidade o framework efetivamente USA hoje?** (`spec` / `pilar` / `lifecycle` / `artefato` / combinação inconsistente)
2. **Qual unidade melhor EXPLICA o todo pós-elevação?** Cobertura exigida: preservação, promoção, seleção, projeção, governança, taxonomia, boilerplates, handoff, decision session, reference implementation.

Disciplina: separar **(a) modelo atual observado**, **(b) tensões observadas**, **(c) candidato mais explicativo**. Falsificação **real** — sustentar seriamente cada candidato, **sem partir de "pilar" como destino**. Lifecycle é contender forte (o fluxo desta sessão é evidência a favor). **Nenhum sobreviver é resultado válido.**

---

## Parte 1 — Modelo atual observado (por camada)

O framework não tem **uma** unidade primária. Ele usa **unidades diferentes em camadas diferentes** — esta é a observação central.

| Camada                          | Unidade primária de fato                                 | Evidência                                                                                                                                                                                                                                                |
| :------------------------------ | :------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domínio (código)**            | **pilar** (`WorkItemKind`)                               | ADR 0010: `WorkItemKind` é union dos 7 pilares; `WorkItem` é discriminated union Dense/Virtual; `WorkItemPolicy`/`PromotionPolicy` operam sobre `kind`; registry serializa `kind`.                                                                       |
| **Estado operacional**          | **lifecycle (stage)**                                    | `state.yml` tem `stage` (`discovery\|decision\|planning\|implementation\|closing\|done`) como **campo de estado canônico**. O estado de uma unidade é uma **posição no lifecycle**, não um pilar nem um artefato.                                        |
| **Processo / boilerplates**     | **spec**                                                 | Lifecycle (Setup→Stage1→Stage2→Review→Encerramento), boilerplates (spec/decision-brief/plan/tasks), wizard, handoff, `governance-pr-check` são todos **modelados em torno de `spec`**. Pilares não-spec não têm boilerplate próprio (F03/F04 deferidos). |
| **Materialização**              | **artefato**                                             | Tudo é markdown versionado; `living-docs`, ADR 0014 (validação por gênero), "repo é memória" (CORE-02).                                                                                                                                                  |
| **Sub-classificação de `spec`** | **tipo de spec** (`deterministic/mixed/evidence-driven`) | `governance-foundation.md` + GR-0101 + recipes. **Sobreposta ao pilar `spec`** — não é eixo independente.                                                                                                                                                |

**Resposta à Pergunta 1:** o framework usa hoje uma **combinação inconsistente** — `pilar` no domínio, `lifecycle` no estado, `spec` no processo, `artefato` na materialização. A unidade "primária" depende de **qual camada se olha**.

---

## Parte 2 — Tensões observadas

1. **Domínio (pilar) vs Processo (spec).** ADR 0010 declara 7 pilares peers, mas a máquina de processo é spec-shaped. Pilares não-spec (experiment/spike/incident) são **cidadãos de segunda classe** operacionalmente — existem no domínio, mas sem boilerplate/lifecycle próprios. _Modelo declarado ≠ modelo operante._
2. **`spec` overloaded.** `spec` é simultaneamente (a) um dos 7 pilares e (b) o substrato de quase todo o processo. A sub-taxonomia `deterministic/mixed/evidence-driven` pendura-se só em `spec` — sintoma de sobrecarga (cf. `[DEC-0024-G02]`, obs #7).
3. **Estado é lifecycle, identidade é pilar — e ninguém nomeou isso.** `state.yml.stage` trata a unidade como posição-no-lifecycle; ADR 0010 trata como `kind`. As duas verdades coexistem sem reconciliação — é o que `[DEC-0024-G03]` (promotion pipeline) precisa resolver.
4. **Artefato como átomo vs como projeção.** ADR 0023 (meta-artefatos YAML SSOT + derivações) e `[DEC-0024-G05]` modelam artefatos como **projeções derivadas** de uma SSOT — contradizendo qualquer leitura de "artefato = unidade primária".
5. **A elevação adicionou dimensões lifecycle-shaped.** projeção, handoff, decision session, reference implementation — todas introduzidas/elevadas pela 0024 — são **posições ou transições de lifecycle**, não tipos de trabalho. O centro de gravidade do modelo mudou em direção ao lifecycle.

---

## Parte 3 — Teste de falsificação por candidato

> Para cada candidato: sustentação séria + tentativa honesta de refutação + cobertura das 10 dimensões pós-elevação.

### `spec` = unidade primária

- **Sustentação:** todo o processo, boilerplates, wizard, handoff, `state.yml` per-spec, ADR 0017 (numeração de specs), backlog→spec. É o que o framework _parece_ ser na superfície.
- **Refutação:** ADR 0010 nega explicitamente o privilégio do spec (1 de 7). "spec primária" é **artefato histórico** (o framework cresceu spec-first), não escolha arquitetural. Não explica por que experiment/spike/incident existem como peers. **Falsificado como modelo arquitetural** — sobrevive só como descrição do status quo acidental.
- **Cobertura:** alta em boilerplates/processo; ~zero em taxonomia (contradiz os 7 pilares), promoção, projeção.

### `pilar` = unidade primária (ADR 0010)

- **Sustentação:** a classificação **mais formalizada** (ADR + domínio + registry + política de promoção). Explica taxonomia (G01/G02) e promoção de work-item (G03 parcial). Resolve a tensão #1/#2 se promovido a primário também no processo.
- **Refutação (séria, sem complacência):** pilar é uma classificação de **intenção de saída** — responde "_que tipo de coisa é_", não "_onde está_" nem "_como aparece_". Não explica naturalmente projeção, handoff, decision session, reference implementation (todas lifecycle-shaped). E hoje é **declarado mas não operante** (sem boilerplate por pilar). Risco do viés: parece forte porque ADR 0010 já existe — mas existir ≠ ser a raiz.
- **Cobertura:** alta em taxonomia/promoção/boilerplates; **baixa** em estado/projeção/handoff/decision-session/reference-impl.

### `lifecycle` = unidade primária (contender forte)

- **Sustentação:** `state.yml.stage` **já é** o estado canônico (lifecycle-position). Setup→Stage1→Stage2→Review→Encerramento estrutura tudo. Os artefatos (decision-brief/plan/tasks/review/release-log) mapeiam fases. **As 4 dimensões que a elevação tornou first-class — projeção, handoff, decision session, reference implementation — são todas posições/transições de lifecycle.** O fluxo desta sessão (`Research → Decision Session → Reference Implementation → Generalization`) é lifecycle puro. Promoção (G03) é inerentemente um lifecycle (`observação→…→ADR`).
- **Refutação (séria):** lifecycle **não explica a taxonomia** — por que 7 pilares? Um lifecycle é o mesmo independentemente de o trabalho ser spec ou fix (embora a _forma_ do lifecycle varie por pilar). Lifecycle-primário rebaixa pilar a atributo — e a intenção-de-saída (ADR 0010) é real, não acessória. Logo, lifecycle **cobre o processo/projeção, mas terceiriza o "que é"**.
- **Cobertura:** **alta** em estado/seleção/projeção/governança/handoff/decision-session/reference-impl/preservação; **baixa** em taxonomia.

### `artefato` = unidade primária

- **Sustentação:** tudo é markdown; repo é memória; boilerplates são templates de artefato; validação por gênero (ADR 0014).
- **Refutação:** ADR 0023 + G05 modelam artefato como **projeção derivada de uma SSOT** — explicitamente _downstream_. A mesma decisão vive em vários artefatos. **Falsificado rápido** — artefato é contêiner/projeção, não átomo de significado.
- **Cobertura:** quase nula como primário (é a camada de saída).

### `categoria ainda não identificada`

- **Hipótese emergente desta auditoria:** a tricotomia `spec/pilar/lifecycle` pode ser **mal-posta**. Os dados sugerem **eixos ortogonais**, não candidatos rivais:
  - **pilar** = eixo de **identidade** (que tipo de trabalho / intenção de saída — ADR 0010);
  - **lifecycle** = eixo de **estado** (onde o trabalho está — `state.yml.stage`);
  - **contexto** = a **substância** que é selecionada/promovida/projetada ao longo do lifecycle (o objeto da própria 0024).
- Nessa leitura, a "unidade primária" é um **work-item identificado por pilar, cujo estado é uma posição de lifecycle, cuja substância projetável é contexto**. `spec` é só o pilar dominante a que o processo se sobreajustou.
- **Sustentação:** explica por que cada candidato cobre só um pedaço — cada um é uma _projeção_ de um eixo. **Cobre as 10 dimensões** distribuindo-as: taxonomia/promoção→pilar; estado/seleção/projeção/handoff/decision-session/reference-impl→lifecycle; preservação/projeção→contexto.
- **Refutação a tentar:** é elegante demais? Pode ser uma forma de evitar escolher. Fonte B precisa dizer se sistemas reais tratam identidade e estado como eixos separados ou colapsam num só.

---

## Parte 4 — Matriz candidato × dimensão (cobertura preliminar, Fonte A)

Legenda: ✅ explica bem · 🟡 parcial · ❌ não explica / contradiz.

| Dimensão                 | spec | pilar | lifecycle | artefato | eixos ortogonais |
| :----------------------- | :--: | :---: | :-------: | :------: | :--------------: |
| preservação              |  🟡  |  🟡   |    ✅     |    🟡    |        ✅        |
| promoção                 |  ❌  |  ✅   |    ✅     |    ❌    |        ✅        |
| seleção                  |  ❌  |  ❌   |    ✅     |    ❌    |        ✅        |
| projeção                 |  ❌  |  ❌   |    ✅     |    🟡    |        ✅        |
| governança               |  🟡  |  🟡   |    ✅     |    ❌    |        ✅        |
| taxonomia                |  ❌  |  ✅   |    ❌     |    ❌    |        ✅        |
| boilerplates             |  ✅  |  🟡   |    🟡     |    🟡    |        ✅        |
| handoff                  |  🟡  |  ❌   |    ✅     |    ❌    |        ✅        |
| decision session         |  ❌  |  ❌   |    ✅     |    ❌    |        ✅        |
| reference implementation |  ❌  |  ❌   |    ✅     |    ❌    |        ✅        |

> Leitura: **`lifecycle` é o melhor candidato único** (cobre ~8/10), mas falha em **taxonomia**. **`pilar`** é o único que cobre taxonomia limpo, mas falha em metade do resto. **Nenhum candidato único sobrevive ao conjunto completo** — exatamente o "resultado válido" que a owner previu. A leitura de **eixos ortogonais** é a única que cobre tudo, ao custo de dizer que a pergunta original era mal-posta.

---

## Parte 5 — Achado preliminar (Fonte A — NÃO é veredito)

- **(a) Modelo atual:** combinação inconsistente em 4 camadas (domínio=pilar, estado=lifecycle, processo=spec, materialização=artefato). A inconsistência é a doença que G00 diagnostica.
- **(b) Tensão central:** identidade (pilar) e estado (lifecycle) são tratados como verdades separadas e nunca reconciliados; `spec` está sobrecarregado; artefato já é (corretamente) projeção.
- **(c) Candidato mais explicativo:** entre os 4 originais, **`lifecycle`** (reforçado pela elevação e pelo fluxo desta sessão). Mas a hipótese **eixos ortogonais (`pilar` identidade × `lifecycle` estado × `contexto` substância)** explica o conjunto **completo** melhor que qualquer unidade isolada — e dissolve a falsa rivalidade.
- **Anti-viés registrado:** este resultado **não** confirmou "pilar é a raiz" (a favorita aparente). Pilar saiu como **um eixo**, não a unidade primária. Isso é sinal de que a falsificação foi real.
- **Possível 4º eixo (levantado pelo leitor tardio, 2026-05-29):** além de identidade/estado/substância, há **consumidor** — _para quem_ o contexto é projetado (handoff→agente, dashboard→mantenedor, review→reviewer, decision-session→owner, briefing→implementador). A elevação inteira da 0024 nasceu ao perceber que o mesmo contexto projeta diferente por consumidor. **A testar na Fonte B:** consumidor é só atributo de projeção (G05) ou eixo fundacional tão básico quanto os outros três?
- **Auto-alerta de elegância:** a leitura de eixos ortogonais explica tudo — mas isso pode ser porque é correta **ou** porque foi formulada _depois_ de ver os dados. A Fonte B precisa tentar derrubá-la, não admirá-la.

---

## Parte 6 — O que a Fonte B precisa tentar REFUTAR

A Fonte A aponta para lifecycle/eixos-ortogonais. A Fonte B (Hermes, Cursor, Open Code, Spec Kitty, Anthropic) deve **tentar derrubar** isso, buscando:

1. **Sistemas que colapsam identidade e estado num só átomo** (refutaria "eixos ortogonais"). Ex.: a unidade é "task" e ponto?
2. **Sistemas artifact-centric ou spec-centric bem-sucedidos** (sustentaria spec/artefato que a Fonte A falsificou).
3. **Sistemas lifecycle-centric explícitos** (Hermes skill loop, Spec Kitty stage coordination) — confirmam ou refinam lifecycle como spinha?
4. **Como cada sistema trata "tipo de trabalho" (taxonomia)** — é eixo separado do estado, ou inexistente?
5. **Onde mora a "decision session"** em sistemas externos — existe um análogo, ou é lacuna de todos (reforçando o diferencial governance-first)?
6. **Refutar os próprios "eixos ortogonais" (não só lifecycle).** Hermes/Cursor/Spec Kitty/Open Code **separam identidade e estado**, ou operam sobre **uma entidade única** (ex.: "task" e ponto)? Se sistemas maduros convergirem para entidade única, a hipótese de eixos ortogonais **enfraquece fortemente** — e a Fonte A terá sido elegante demais.
7. **Consumidor: eixo ou atributo?** Os sistemas tratam "para quem se projeta" como dimensão fundacional separada, ou como mero atributo da projeção? (Decide se o 4º eixo é real ou parte de G05.)

8. **Qual é a entidade que ATRAVESSA todas as transições?** (não só "qual é a unidade"). Spec Kitty → `Mission`. Hermes → skill? task? loop? workspace? Cursor → session? task? thread? workspace? Open Code → ? **Se cada sistema tiver UMA entidade-sujeito** que atravessa tudo (possuindo identidade/estado/contexto), converge para **"work-item governado"**. **Se houver múltiplas entidades de 1ª classe sem sujeito único**, a hipótese cai.

> **Ascensão registrada (pós-spec-kitty, 2026-05-29):** o candidato líder deixou de ser "lifecycle" e passou a ser **work-item governado** (entidade-sujeito) com identidade/estado/contexto/projeções como atributos. Detalhe em [`2026-05-29-spec-kitty.md § Síntese`](./2026-05-29-spec-kitty.md). lifecycle é **predicado**, não a entidade.

### Freio metodológico + mandato expandido (leitor tardio, 2026-05-29)

**Avanço ≠ prova.** A ascensão a "entidade de governança" foi real, mas **não está demonstrado que exista uma única entidade-sujeito**. Hermes mostrou _autônomo ⇒ multi-entidade_; **não** mostrou _governance-first ⇒ mono-entidade_. Spec Kitty é mono-entidade, mas foi **desenhado** assim. O ai-guidelines já exibe vários candidatos a 1ª classe: work-item, promotion pipeline, ADR, DEC, backlog candidate, observação, research artifact.

**Cinco hipóteses em aberto — e possivelmente NÃO mutuamente exclusivas (mandato revisado, leitor tardio 2026-05-29):**

1. **Mono-entidade** — um work-item governado é o sujeito; o resto são atributos/projeções.
2. **Multi-entidade governada** — ≥ 2 entidades irredutíveis coexistem (ex.: work-item **+** ADR/decision/promotion-record como entidade de governança própria).
3. **Entidade + relação fundacional** — uma entidade-âncora **mais** uma relação que a constitui (ex.: work-item + promotion).
4. **Transformação fundacional (governança de transformações)** — **não há entidade-raiz**; o sistema existe porque **transformações governadas acontecem** (decidir, promover, validar, revisar, transicionar, projetar). Entidades (ADR, DEC, state, handoff) são **produtos** das transformações, não a raiz. **Sinal crescente** (call de devs seniores 2026-05-29 + predomínio de **verbos** no vocabulário do framework). Não promovida a líder; entra na lista que a Fonte B deve tentar refutar.
5. **Metamodelo composto (não-atomizado)** — entidades, estados, transformações, regras e projeções **coexistem como camadas**, e **nenhuma sozinha é a raiz**. As hipóteses 1-4 deixam de ser rivais e viram **camadas** de um metamodelo. O ai-guidelines pode **nunca ter tido um átomo** — pode ser um **metamodelo de governança**. **Resultado perfeitamente válido para G00.**

> **Mudança de método (decisiva — leitor tardio 2026-05-29):** **NÃO** tentar provar qual hipótese vence. **Primeiro construir o mapa ontológico real** — classificar cada conceito (`Work Item`, `WorkItemKind`, `WorkflowState`, `Promotion`, `ADR`, `DEC`, `Registry`, `Handoff`, `Dashboard`, `observação`, `regra`) nas colunas **{entidade · estado · transformação · regra · projeção · substância}**, usando `ARCHITECTURE.md` + `ARCHITECTURE-REFERENCE.md` + `GOVERNANCE-CATALOG.md` + ADR 0008/0021 + `src/domain/*`. **Só depois** avaliar cardinalidade (mono / multi / entidade+relação / transformação / metamodelo). A maior ameaça agora não é confirmar a favorita — é **procurar um átomo numa arquitetura que talvez nunca tenha tido um**.

**Reframe de G00:** de "qual é a entidade primária?" para **"qual é o conjunto mínimo de entidades (e/ou relações) irredutíveis do sistema?"** — sem assumir cardinalidade 1.

**Testes adicionais (Fonte A do próprio ai-guidelines + Fonte B):**

- **Irredutibilidade:** quais entidades **continuam existindo quando removemos as demais**? Se > 1 sobrevive, G00 fecha num **conjunto**, não numa entidade. _Cuidado com salto lógico:_ persistência própria (ex.: ADR 0018 existe sem spec ativa) demonstra **ciclo de vida próprio**, mas **não prova** entidade fundacional vs artefato persistente produzido por outra entidade — fica em aberto.
- **Generatividade:** quais entidades **geram outras** sem depender delas para existir? (ADR gera regras? Decision gera ADR? Work-item gera ADR? Promotion gera estado?) O que gera muitos e depende de poucos está mais perto da raiz.
- **Substantivo vs verbo:** o que atravessa tudo é uma **coisa** (entidade) ou uma **transformação** (promotion/decision/handoff/derivation)?

**G00 só fecha quando:** (a) o candidato líder for seriamente **refutado** por ≥ 1 sistema externo (não só confirmado); (b) os testes de irredutibilidade e generatividade forem aplicados ao próprio ai-guidelines (Fonte A, **sobre o código de domínio + ADRs + catálogo de arquitetura**, não só memória de sessão); (c) a **cardinalidade e a natureza** (1 entidade / conjunto de entidades / entidade+relação / **transformação**) estiverem decididas. Avanço ≠ prova.

**Alvos Fonte B (atualizado 2026-05-29):** ✅ Spec Kitty (spec-driven) · ✅ Hermes (autonomous-learning) · pendentes: Cursor (harness/session), Open Code (provider-agnostic), Anthropic Dreaming (curated memory), **Multica** (<https://github.com/multica-ai/multica> — nova classe: **agent orchestration / skill systems**; testa "existe entidade-sujeito ou só transformações coordenadas?").

**Evidência adicional — call de devs seniores (2026-05-29, parcial):** dezenas de devs experientes convergindo espontaneamente para _governança do trabalho executado por modelos_ ("LLM ≠ produto; harness = produto"; "modelo = motor; governança = sistema"). Vocabulário dominante = **verbos** (orquestrar/promover/validar/revisar/transicionar/governar). Reforça a hipótese #4 (transformação fundacional) e o "decision session" (`modelo → controle → validação → decisão`, não `modelo → execução`). **Peso:** evidência arquitetural (≈ Spec Kitty/Hermes), não pesquisa de apoio. Análise 4-níveis (explícito / implícito / impacto-G00 / impacto-spec) **pendente** da transcrição completa.

### Mandato Fonte B revisado (pós-mapa ontológico, leitor tardio 2026-05-29)

O grounding deslocou G00 de "qual entidade?" para **"qual a estrutura causal — primitivo vs derivado?"** (cf. [`2026-05-29-g00-ontological-map.md § Primitivo vs Derivado`](./2026-05-29-g00-ontological-map.md)). A Fonte B muda de pergunta: **não mais** "qual entidade atravessa tudo?", e sim **"como sistemas maduros (Cursor / Open Code / Multica) separam conceitos PRIMITIVOS de DERIVADOS?"** — têm um **kernel gerador mínimo + projeções**, ou misturam tudo? Testa se a gramática `Rule ∘ (Entity × State) → State' ⇒ projeções` é **universal** ou **idiossincrática do governance-first**.
