<!-- ai-guidelines-template: decision-brief-boilerplate v=2 -->

# Decision Brief — Spec 0024 Context Architecture

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Tasks: [`./tasks.md`](./tasks.md)
> Status agregado: **Resolved (decisões)** — todas as `[DEC]` desta spec estão `Resolved`; a pesquisa estrutural ainda aberta vive em [`research/findings.md`](./research/findings.md), não aqui.
> Última atualização: 2026-05-31 — **reestruturação por estado** (aposentada a organização G00–G06) + `G02` registrado como `Resolved`.

> **Artefato exclusivo de decisão humana.** Organizado por **estado**, não por numeração histórica (reestruturação 2026-05-31). Quatro estados respondem, à primeira vista, _o que já foi decidido · o que ainda está aberto · o que virou regra · o que virou enforcement_:
>
> - **Decidido** — `[DEC]` `Resolved`: o julgamento cravado.
> - **Aberto** — pesquisa genuína (alternativas reais competindo) → **ponteiro** para `findings.md`; nunca reproduzida aqui.
> - **Virou regra** — decisão promovida a princípio/regra declarada (ADR / `rules.json`) — camada _awareness_ (ADR 0021 L1).
> - **Virou enforcement** — decisão ligada a check que **pode falhar** ou a código que a reflete — camada _estrutural_ (ADR 0021 L2/L4). É onde "reduzir divergência entre aprendizado e código" acontece.
>
> Convenções (formas B/C/D, IDs, contrato da cadeia) → `decision-brief-boilerplate.md` + `.core/process/governance-foundation.md`. Histórico/cronologia → **git**. Os IDs `[DEC-0024-G##]` permanecem **âncoras estáveis**, mas **não organizam mais a leitura** (mapa no fim).
>
> **Critério de sucesso:** se um conteúdo aqui não exige **aceitar / rejeitar / reenquadrar**, ele está no artefato errado.

---

## 1 · Decidido — julgamento cravado (`Resolved`)

> Pontos `Resolved` são **imutáveis** (revisões vão para `plan.md` § "Decisões revisitadas"). Reproduzidos **verbatim** desde o gate respectivo, apenas reorganizados.

### [DEC-0024-G00] (RAIZ) Unidade arquitetural primária do framework

> **A unidade arquitetural primária do ai-guidelines é a transformação de `contexto humano → governança executável`.**

**A única pergunta do gate:** _concordo ou não concordo com a afirmação acima?_

**O que está sendo aceito:**

- a unidade primária é uma **transformação** (`contexto humano → governança executável`);
- é o que o framework modela na raiz — o ponto de partida do qual o resto deriva.

**O que NÃO está sendo aceito:**

- **não** é a afirmação de que isto "explica tudo" no framework — é **identidade arquitetural**, não explicação universal;
- **não** decide a estrutura/gramática (pilares, taxonomia, pipeline, projeções) — isso é **G01-G05**;
- **não** crava a fronteira fina que distingue esta classe de outros sistemas governados (o `terminus`) — deferido a G01.

**Concorrentes considerados** (por que nenhum é a unidade _primária_):

- **spec** — é um agrupamento/projeção de trabalho; o framework também modela o que não é spec (regras, ADRs, handoffs). Não é a raiz.
- **task** — é unidade de **execução** derivada do plano (a ponta do fluxo); só existe depois da decisão. Não gera o resto.
- **decision** — é um **momento** dentro da transformação (o ponto de julgamento); a transformação a contém, não o contrário.
- **finding** — é um **estado intermediário** (conhecimento convergido); insumo da transformação, não a transformação.
- **artifact** — é **produto/projeção** da transformação (saída por estado/consumidor); o que ela emite, não a raiz.
- **workflow** — é a **sequência observável** em que a transformação se manifesta no tempo; descreve o fluxo, não a unidade modelada.

**Escopo da decisão:**

- **G00 responde à identidade arquitetural** (_qual é a unidade primária_).
- **G01 permanece aberto** para estrutura/gramática (_como ela se organiza_).
- **Aceitar G00 não resolve G01.**

**Decisão do Gate Humano (`aceitação`):**

- **Status:** [ ] Pendente | [x] **Resolvido**
- **Ato do gate:**
  - [x] **Aceitar** — concordo com a afirmação.
  - [ ] **Rejeitar**
  - [ ] **Reenquadrar**
- **Justificativa (owner):**
  - A investigação convergiu para uma **única candidata estável** sob todos os testes realizados.
  - Nenhum concorrente (`spec`, `task`, `decision`, `finding`, `artifact`, `workflow`) demonstrou poder explicativo superior nem ocupou legitimamente o papel de unidade arquitetural primária.
  - As rodadas posteriores passaram a discutir estrutura, gramática, estados, artefatos, governança, trilhos e comportamento do sistema — temas **fora do escopo de G00** (pertencem a **G01+**).
  - **Não há lacuna de evidência** bloqueando a decisão; o risco dominante neste ponto é **refinar indefinidamente** algo já cristalizado.
  - A aceitação **não implica** aceitar explicações causais, gramática estrutural, taxonomia final, modelo de estados, promotion pipeline, mecanismo Finding→DEC ou qualquer tema em investigação.
  - Aceita-se **exclusivamente** a afirmação: _a unidade arquitetural primária do ai-guidelines é a transformação de `contexto humano → governança executável`._
- **Data / Owner:** 2026-05-31 / @rosanarezende

---

### [DEC-0024-G02] Taxonomia `deterministic/mixed/evidence-driven` → removida; substituída por bloco + propriedade `exige-julgamento`

**Modo de gate:** `aceitação`

**O finding (o que foi aceito):**

> A entidade de 1ª classe é **o bloco**. **`exige julgamento?`** é uma **propriedade** dele (derivada de "há incerteza relevante") — **não um tipo de bloco**. Um bloco passa pelo crivo de pesquisa/gate **se e somente se exige julgamento**; o **gate** é onde o julgamento acontece; o `[DEC]` **registra** o resultado (Camada 2). A taxonomia dos 3 tipos era **projeção** disso (`deterministic` = nenhum bloco exige julgamento; `mixed` = alguns; `evidence-driven` = todos) — por isso é **removida**.

**O que está sendo aceito (bounded):**

- a propriedade primária migra de **spec-level** (`tipo`) para **bloco-level** (`exige julgamento?`);
- `mixed` deixa de existir (caso degenerado); a degeneração para single-pass é automática (zero blocos que exigem julgamento ⟹ sem gate/brief);
- **mecanismo de declaração = marcador explícito** no sub-bloco: `(julgamento)` / `(determinístico)` (decisão do owner, 2026-05-31 — resolve o último átomo aberto; **não** é derivação implícita).

**O que NÃO está sendo aceito:** nada que exija nova pesquisa — a direção e o desenho estão cravados. A **execução** (migração de `WorkflowType`, boilerplates, wizard, doc) **deriva** desta decisão e vive em `plan.md` / `tasks.md` — não é julgamento pendente, é trabalho (ver § 4 · Virou enforcement).

**Por que as alternativas falham + o que reabriria** (falsificabilidade):

- **Manter a taxonomia de 3 tipos:** refutada — exigia sincronização manual de 3 modelos paralelos (drift recorrente: `mixed` sempre atrás); a única diferença real entre tipos era presença/ausência de julgamento. _Reabre se:_ G01 revelar invariante próprio de um tipo (não observado).
- **Taxonomia binária (2 tipos: determinístico / julgamento):** refutada pelo _guard anti-taxonomia_ — recria a taxonomia um nível abaixo (classes em vez de propriedade). _Reabre se:_ a propriedade `exige julgamento?` provar-se insuficiente para gating preciso.
- **`[DEC]` como pivô/gatilho (`bloco → DEC → gate`):** refutada por `F-005` — exige DEC-stub fantasma antes de haver conteúdo de decisão. _Reabre se:_ o gate precisar de um registro anterior ao julgamento (não observado).
- **Booleano spec-level (`requires-research`):** refutado — reintroduz o drift do `mixed` (spec "mista" volta a ser tipo impreciso). _Reabre se:_ o gating por-bloco provar-se custoso demais na prática.
- **O finding é falsificável por:** um caso real onde um bloco precise de gate **sem** incerteza relevante, ou onde a taxonomia capture um invariante que a propriedade não captura.

**Dependência de G00 (resolvida):** o desenho assumia a identidade C de G00. **G00 foi _aceito_ (não reenquadrado) em 2026-05-31 → a premissa está confirmada; a ressalva não disparou.**

**Evidências:** `F-004` (taxonomia = projeção do crivo de julgamento), `F-005` (DEC = registro, não gatilho). **Desenho:** `research/2026-05-30-unified-tasks-model.md` (modelo substituto + impacto por classe + plano de migração).

**Decisão do Gate Humano (`aceitação`):**

- **Status:** [ ] Pendente | [x] **Resolvido**
- **Ato:**
  - [x] **Aceitar** — o modelo substituto + mecanismo de declaração por **marcador explícito** `(julgamento)`/`(determinístico)`.
  - [ ] **Rejeitar** · [ ] **Reenquadrar**
- **Justificativa / Ressalvas (owner):**
  - A direção (remover a taxonomia) estava cravada desde 2026-05-30; o desenho do substituto convergiu e o único átomo aberto (mecanismo de declaração) foi decidido: **marcador explícito**.
  - Tratar isto como julgamento pendente era **documentação atrasada, não decisão aberta** (Caso B): o gate registra o julgamento já formado, não reabre.
  - A migração física **não é** condição do gate — é execução derivada.
- **Data / Owner:** 2026-05-31 / @rosanarezende

---

### [DEC-0024-G06] Contrato da cadeia `research → … → implementação` (decisão de processo)

**Pergunta:** O que protege a autoria humana (seta `humano → sistema`, ADR 0018) em cada seam da cadeia — não só no seam `research → decision-brief` que falhou no G00?

**Modo de gate:** `aceitação` <!-- decisão de processo em sessão colaborativa humano-agente, 2026-05-29/30; cf. governance-foundation "Casos limites". -->

**Decisão (Resolved):** cravar em `governance-foundation.md` § "Contrato da cadeia" o contrato de I/O de cada fase em **três eixos** — _produz · proibido de produzir · escala para_ —, o **critério de parada da research** (para quando a decisão é possível; modos de gate `escolha`/`aceitação`), os **mecanismos de escalonamento** (roteamento por classe de descoberta, reusando primitivos existentes) e o **anti-padrão #6**. Boilerplates (`decision-brief`, `plan`) e `rpi-protocol.md` **refletem** o contrato; a constituição é SSOT. **Sem enforcement mecânico** (dogfood primeiro). Evidência-origem: `research/2026-05-30-research-output-contract.md` (+ findings `F-005`).

**Nota de ordem:** é decisão de **governança-processo**, ortogonal ao _conteúdo_ de G00 — **não viola o invariante de ordem**. G00 permanece `Pendente`. **Promotável a ADR no fechamento da spec.** <!-- nota datada de 2026-05-30; G00 passou a Resolved em 2026-05-31 (ver § 1). Preservada verbatim por imutabilidade do DEC. -->

**Status:** Resolved (2026-05-30) / @rosanarezende — decisão de processo colaborativa.

---

### [DEC-0024-G07] Topologia como dado (`state.yml` = SSOT) + enforcement L4 de projeções de PR

**Pergunta:** Onde vive a topologia de PRs de uma spec (qual PR, papel, posição no stack, quais checkpoints embarca) e o que impede os artefatos visuais (título, template de PR) de divergirem dela em silêncio?

**Modo de gate:** `aceitação` <!-- decisão de processo/arquitetura, sessão colaborativa 2026-06-01; descoberta pelo Architectural Review Gate do Checkpoint 2.3, absorvida no 2.3a. -->

**Decisão (Resolved):**

- A topologia vive como **dado estruturado** em `state.yml § topology` (`cursor` + `prs.{concluded,active,planned}`; campos `id/github_pr/role/terminal/sequence/checkpoints`). É a **SSOT** da topologia, validada por schema em `workflowStateSerializer` (gate `state-yml:check`), incluindo invariantes de `sequence` — **única, contígua `1..K`, presente sse `role: execution`** (Checkpoint 2.3a / O6).
- Título de PR e seções do template são **projeções** derivadas dessa SSOT. O `governance-pr-check` (L4 CI) **valida** as projeções contra a SSOT — **nunca o inverso** (não lê verdade de título/emoji). **Supersede** a postura anti-recursão do Anti-DAG (`pr-title-conventions.md`), que vedava CI validar formato/ordem de título _"sem DEC registrada"_: **esta é a DEC**.
- **Hierarquia de SSOT (O1):** `state.yml` é a fonte estrutural única. O `plan.md` contém uma **projeção derivada explícita** (rotulada como tal), nunca uma fonte paralela; em divergência, `state.yml` vence. **Sem** sincronização automática (repo é memória; humano reconcilia).
- **Postura de enforcement (O5):** `governance-pr-check` é **advisory** (sinal de CI; **não** é required status check) **enquanto não existir o guard inverso topologia↔realidade git** (deferido — `topology:check`, análogo à producibilidade do 2.2). Promoção a `required` é **condicionada** a esse guard. Racional: enforçar projeções contra uma SSOT ainda não-guardada poderia **bloquear merge por erro da própria SSOT** (o 2.3 nasceu com um nó-fantasma) — recriaria o mascaramento por admin-bypass que a 0024 combate.
  - **↳ Revisão (Checkpoint 2.3b, 2026-06-01):** a pré-condição foi **dividida** — (i) _well-formedness_ da SSOT virou **guard local** (invariantes no `state-yml:check`/`repo-validation`, já required) e (ii) _paridade-API_ ficou como hardening **não-bloqueante**. Com (i) satisfeita, o `governance-pr-check` foi **promovido a `required`** (apply consolidado: `repo-validation`+`smoke`+`governance-pr-check`; paridade vivo↔versionado verde). Detalhe em [`plan.md § "Decisões revisitadas"`](./plan.md) (2026-06-01). _(Nota de reconciliação aditiva — não altera o julgamento Resolved acima.)_

**O que NÃO está sendo decidido:** ler topologia a partir de títulos; montar DAG a partir de títulos; auto-sync `plan.md`↔`state.yml`; construir o `topology:check` completo agora (deferido); promover o check a `required` antes do guard inverso.

**Trade-off cravado:** a SSOT é mantida à mão → pode divergir do git (o próprio 2.3 divergiu; corrigido no 2.3a/B1). Mitigação atual: revisão humana + invariantes internos do schema; mitigação estrutural futura: `topology:check` (guard inverso).

**Status:** Resolved (2026-06-01) / @rosanarezende — absorvido no Checkpoint 2.3a (Architectural Review → Human).

---

## 2 · Aberto — pesquisa genuína (única coisa ainda em investigação)

> Estes **não são decisões** — são findings com **alternativas reais ainda competindo**. Vivem em [`research/findings.md`](./research/findings.md); aqui só o ponteiro. Só retornam como `[DEC] Pendente` ao **convergir + exigir julgamento**. **Critério (2026-05-31):** se não há alternativa viva competindo, **não pertence aqui** — é decisão (§ 1) ou trabalho (§ 4).

| Tema                                            | Finding            | Por que ainda é pesquisa                                                                          |
| :---------------------------------------------- | :----------------- | :------------------------------------------------------------------------------------------------ |
| Estrutura/gramática (ex-`G01`)                  | `F-AG01` / `F-003` | pilares MECE vs reframe _estados > entidade_; `terminus` não falsificado — alternativas vivas     |
| Pipeline de promoção (ex-`G03`)                 | `F-AG03`           | reconciliar promoção de work-item (ADR 0010) × promoção contextual — desenho em aberto            |
| Contrato de boilerplate / casa única (ex-`G04`) | `F-AG04`           | modelo de fonte única (tri-root → SSOT) em aberto; o **drift-guard** já vira enforcement (§ 4)    |
| Projeções por consumidor (ex-`G05`, resíduo)    | `F-AG05`           | modelo de N projeções da SSOT; a projeção _gate-ready_ já **saiu daqui** (virou GG-0001, § 3/§ 4) |
| Explicação do comportamento não-linear          | `F-014`            | 3 explicações concorrentes, nenhuma decidida — **opcional, baixa prioridade**                     |

---

## 3 · Virou regra — decisão promovida a princípio/regra declarada (camada _awareness_)

> Aprendizados da 0024 que já são (ou serão, no fechamento) um **princípio declarado** — ADR ou entrada em `rules.json`. Camada L1 do ADR 0021: **necessária, insuficiente sozinha** — a versão que falha mecanicamente está em § 4.

| Aprendizado (origem)                                                | Forma de regra                                            | Estado                                              |
| :------------------------------------------------------------------ | :-------------------------------------------------------- | :-------------------------------------------------- |
| enforcement > awareness                                             | **ADR 0021**                                              | já é ADR (origem 0023; reafirmado aqui)             |
| handoff carrega contexto operacional (`F-007`)                      | **ADR 0022**                                              | já é ADR                                            |
| state derivado > declarado                                          | **ADR 0021 §5**                                           | já é ADR                                            |
| governance-first como eixo de 1ª classe (`F-013`)                   | ADR 0018 / finding convergido                             | princípio estabelecido                              |
| `research/finding/decision/execution` são **estados** (`F-006`)     | princípio (alimenta G01)                                  | convergido; reflete-se nesta própria reestruturação |
| DEC nasce `Pendente` (não `Open`); pergunta aberta vive em findings | regra de processo → `governance-foundation` + boilerplate | **em absorção** (§ 4)                               |
| **GG-0001** — teste de decidibilidade de gate                       | regra `rules.json` (fonte `DOGFOOD-*`)                    | **em absorção** (§ 4)                               |

---

## 4 · Virou enforcement — decisão ligada a check que pode falhar / código que a reflete (camada _estrutural_)

> Camada L2/L4 do ADR 0021: onde o aprendizado deixa de depender de memória e passa a **falhar mecanicamente** se violado, ou onde o **código passa a refletir** a decisão. É aqui que _"reduzir divergência entre aprendizado e código"_ acontece. **Status:** 🟢 feito · 🔜 em absorção nesta spec.

| Decisão                                                          | Enforcement / migração                                                                                                                                                                                                         | Status                       |
| :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------- |
| `G02` — taxonomia removida                                       | `WorkflowType` → modelo único; 3 `tasks-*` boilerplates → genérico; wizard; doc                                                                                                                                                | 🔜 migrar `WorkflowType`     |
| DEC sem status `Open`                                            | check rejeita `Open` em `decision-brief`; legenda corrigida (roots)                                                                                                                                                            | 🔜 consistência boilerplates |
| boilerplates tri-root divergem (`F-AG04`)                        | drift-guard: check falha se roots divergem — passo 1 da fonte única                                                                                                                                                            | 🔜 boilerplates fonte única  |
| `.specify` é legado (ADR 0019)                                   | hard-stop em escrita nova (drift-guard) → cutover p/ `.governance`                                                                                                                                                             | 🔜 cutover `.specify`        |
| `GG-0001` (subconjunto mecânico)                                 | check estrutural de decidibilidade projetado no seam do gate                                                                                                                                                                   | 🔜 implementar GG-0001       |
| `G07` — topologia-as-data + projeção                             | `state.yml` schema (invariantes de `sequence`) + `governance-pr-check` valida título/template contra a SSOT — **`required`** desde 2026-06-01 (2.3b: well-formedness por guard local; paridade-API = hardening não-bloqueante) | 🟢 feito (2.3a/2.3b)         |
| ruleset-as-code (achado: `guardrails` órfão)                     | `ruleset:check` — **producibilidade** (todo required-context tem produtor estável; no `validate`) + **paridade** vivo↔versionado (`ruleset-drift`)                                                                             | 🟢 feito (2.2/2.2b)          |
| revisão-como-artefato (**dogfood**, sem DEC — análogo a GG-0001) | `review:check` (no `validate`): reviews/gates versionados; gate `approved` exige zero finding bloqueante `open`; selos de integridade (per-finding + envelope)                                                                 | 🟢 feito (2.4→2.4c)          |

---

## Rastreabilidade histórica — numeração `G00–G06` → estado

> Os IDs `[DEC-0024-G##]` permanecem **âncoras estáveis** (citados em findings, ADRs, git, handoffs) — mas **não organizam mais a leitura**. Mapa de equivalência:

| ID histórico | Tema                                                  | Estado atual                                                                                                 |
| :----------- | :---------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| `G00`        | identidade (transformação)                            | **Decidido** — § 1 (Resolved 2026-05-31)                                                                     |
| `G01`        | estrutura/gramática                                   | **Aberto** — § 2 (`F-AG01`)                                                                                  |
| `G02`        | taxonomia → bloco + propriedade                       | **Decidido** — § 1 (Resolved 2026-05-31) → migração em § 4                                                   |
| `G03`        | promotion pipeline                                    | **Reaberto (modelagem)** — `[DEC-0024-G08]` 2026-06-03; pipeline `insight→decision→rule\|guardrail→doctrine` |
| `G04`        | contrato de boilerplate / casa única                  | **Reaberto (modelagem)** — `[DEC-0024-G08]`; casa única / tri-root → SSOT na trilha de convergência          |
| `G05`        | projeções / decision-session                          | **Reaberto (modelagem)** — `[DEC-0024-G08]`; projeções derivadas (fonte↔projeção) + KnowledgeGraph           |
| `G06`        | contrato da cadeia                                    | **Decidido** — § 1 (Resolved 2026-05-30) → ADR no fechamento                                                 |
| `G07`        | topologia-as-data + enforcement L4                    | **Decidido** — § 1 (Resolved 2026-06-01) → enforcement em § 4                                                |
| `G08`        | reabertura de G03/G04/G05 + direção orientada a grafo | **Decidido** — Resolved 2026-06-03 (owner); a modelagem fica DENTRO da 0024; NÃO há 0025 independente        |

---

## Gate — assinaturas

> Decisões desta spec, todas `Resolved`. Pesquisa estrutural aberta (§ 2) **não** é ponto de gate — segue em `findings.md` sem bloquear.

- [x] `[DEC-0024-G00]` — Resolved 2026-05-31 / @rosanarezende
- [x] `[DEC-0024-G02]` — Resolved 2026-05-31 / @rosanarezende
- [x] `[DEC-0024-G06]` — Resolved 2026-05-30 / @rosanarezende
- [x] `[DEC-0024-G07]` — Resolved 2026-06-01 / @rosanarezende
- [x] `[DEC-0024-G08]` — Resolved 2026-06-03 / @rosanarezende

---

### `[DEC-0024-G08]` Reabertura de G03/G04/G05 + direção arquitetural orientada a grafo

**Status:** Resolved (2026-06-03, owner).

**O que está sendo aceito:** os eixos `G03` (promotion pipeline), `G04` (casa única / tri-root→SSOT) e `G05` (projeções), deixados **abertos** no Stage 1, são **reabertos para modelagem deliberada DENTRO da 0024**, porque se mostraram necessários para problemas reais observados no uso (mis-binding da retomada; recuperabilidade; "a resposta estava num ADR esquecido"). A **direção assumida** é arquitetura **orientada a grafo**: entidades (`Insight→Decision→Rule/Guardrail→Doctrine`) + relações navegáveis (`KnowledgeRef`) + projeções derivadas (`KnowledgeGraph`, fonte↔projeção). O objetivo passa a ser **convergir o repositório** para esse modelo.

**O que NÃO está sendo aceito:** (i) reabrir `G00/G02/G06/G07` (seguem cravados); (ii) que tenha surgido uma **spec 0025 independente** — a evidência (brief: G03/G04/G05 são eixos da própria 0024; `plan.md` §41: split 0025 superado; inventário 2026-05-29: candidatas Grupo B já catalogadas) mostra que **não** nasceu domínio independente: é a modelagem deferida da 0024 ressurgindo + candidatas de migração já identificadas.

**Concorrentes refutados:** "isto é a 0025" (refutado: split absorvido na 0024); "isto é drift de absorção a estancar" (refutado pelo owner: a reabertura é decisão, os eixos eram necessários). **O que reabriria:** evidência de que a direção a grafo não resolve a recuperabilidade observada.

**Consequência:** a disciplina "NÃO re-modelar" passa a valer **só para os eixos resolvidos**; em G03/G04/G05 a modelagem é a direção. Trilha de execução = programa de convergência (ver `plan.md § Trilha de convergência` + `state.yml § topology`).
