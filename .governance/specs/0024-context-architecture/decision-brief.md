<!-- ai-guidelines-template: decision-brief-boilerplate v=2 -->

# Decision Brief — Spec 0024 Context Architecture

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Tasks: [`./tasks.md`](./tasks.md)

> **Artefato exclusivo de decisão humana** (reforma 2026-05-31). Contém **apenas** `[DEC]` em estado `Pendente` ou `Resolvido` — nada que não exija julgamento humano.
>
> - Perguntas abertas / evidência / síntese / achados convergidos → [`research/findings.md`](./research/findings.md).
> - Convenções (legenda de status, convenção de IDs, formas B/C/D, checklist pós-gate, critério de saída) → `decision-brief-boilerplate.md` + `.core/process/governance-foundation.md`. A instância **não repete a constituição**.
> - Histórico / cronologia / notas de atualização → **git**.
>
> **Critério de sucesso:** se um conteúdo aqui não exige **aceitar / rejeitar / reenquadrar**, ele está no artefato errado.

## Decisões desta spec

| ID               | Estado                    |
| :--------------- | :------------------------ |
| `[DEC-0024-G00]` | **Resolved (2026-05-31)** |
| `[DEC-0024-G02]` | Pendente                  |
| `[DEC-0024-G06]` | Resolved (2026-05-30)     |

> Perguntas ainda não convergidas (ex-`G01/G03/G04/G05` e os blocos de pressão `A`–`F`) **não são decisões** — vivem como **findings abertos** em [`research/findings.md`](./research/findings.md) e só retornam aqui como `[DEC] Pendente` quando convergirem e exigirem julgamento. **(2026-05-31 — `G00` Resolved: o invariante de ordem cumpriu-se; G01+ está destravado para investigação estrutural, mas aceitar G00 não resolve esses temas.)**

---

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
  - **Não há lacuna de evidência** bloqueando a decisão; o risco dominante neste ponto é **refinar indefinidamente** algo já suficientemente delimitado.
  - A aceitação **não implica** aceitar explicações causais, gramática estrutural, taxonomia final, modelo de estados, promotion pipeline, mecanismo Finding→DEC ou qualquer tema em investigação.
  - Aceita-se **exclusivamente** a afirmação: _a unidade arquitetural primária do ai-guidelines é a transformação de `contexto humano → governança executável`._
- **Data / Owner:** 2026-05-31 / @rosana

---

### [DEC-0024-G02] Taxonomia `deterministic/mixed/evidence-driven` → removida; substituída por bloco + propriedade `exige-julgamento`

**Direção decidida (owner, 2026-05-30):** a taxonomia dos 3 tipos **será removida** — decisão de produto, no nível de direção. G02 **não investiga mais _se_ a taxonomia cai**; o trabalho é **projetar o modelo substituto, avaliar impacto e preservar invariantes**. Permanece `Pendente` apenas pelo **ato formal do gate** (cristalizar o desenho + ordem do invariante com G00); a **remoção física** vem depois (plano de migração).

**Modo de gate:** `aceitação` — o gate aceita/reenquadra **o modelo substituto** (não "se a taxonomia é sintoma" — isso está decidido).

**O modelo substituto (o que se cristaliza):**

> A entidade de 1ª classe é **o bloco**. **`exige julgamento?`** é uma **propriedade** dele (derivada de "há incerteza relevante") — **não um tipo de bloco** (guard anti-taxonomia: determinístico / exige-julgamento são _valores de propriedade_, não classes). Um bloco passa pelo crivo de pesquisa/gate **se e somente se exige julgamento**; o **gate** é onde o julgamento acontece; o `[DEC]` **registra** o resultado (Camada 2 da imagem das 3 camadas) — não é gatilho nem unidade. A taxonomia era **projeção** disso (`deterministic` = nenhum bloco exige julgamento; `mixed` = alguns; `evidence-driven` = todos) — por isso é removida.

**O que está sendo aceito (bounded):** a propriedade primária migra de **spec-level** (`tipo`) para **bloco-level** (`exige julgamento?`); `mixed` deixa de existir (caso degenerado); a degeneração para single-pass é automática (zero blocos que exigem julgamento ⟹ sem gate/brief).

**O que NÃO está sendo aceito ainda:** a **remoção física** (plano de migração, pós-cristalização); o mecanismo legível exato de declaração do bloco (marcador vs derivação — ver desenho); nada que dependa de G00 estabiliza aqui.

**Por que a taxonomia caiu (justificativa da direção — settled):** exigia sincronização manual de 3 modelos paralelos (drift recorrente: `mixed` sempre atrás); fronteiras borradas; a única diferença real entre os tipos era presença/ausência de julgamento. Runtime/registry/ADR **não dependem** dela (footprint = enum `WorkflowType` + recipe/partials [G04] + doc). _Só reabriria_ se G01 revelasse invariante próprio de um tipo.

**Evidências** (consolidadas em [`research/findings.md`](./research/findings.md)): **F-004** (taxonomia = projeção do crivo de julgamento; impacto grounded), **F-005** (DEC = registro, não gatilho). **Desenho:** `research/2026-05-30-unified-tasks-model.md` (modelo substituto + impacto por classe + plano de migração).

**Dependência de G00 (explícita):** este modelo substituto **assume a identidade C atualmente convergida em G00** (`contexto humano → governança executável`; a cadeia `incerteza → julgamento → gate → DEC registra` nasce dela). **Se G00 for reenquadrado materialmente no gate, o substituto de G02 deve ser reavaliado.** Distinção: a **direção** (remover a taxonomia) é robusta a isso; o **desenho do substituto** não necessariamente. **(2026-05-31 — G00 Resolved: C foi _aceito_, não reenquadrado → a premissa do substituto está confirmada e a ressalva não disparou. G02 segue `Pendente` pelo seu próprio gate.)**

**Decisão do Gate Humano (`aceitação`):**

- **Status:** [x] Pendente | [ ] Resolvido <!-- direção cravada; ato formal aguarda cristalização do desenho + ordem do invariante (G00). -->
- **Ato (no gate):** [ ] Aceitar o modelo substituto + autorizar a migração · [ ] Reenquadrar (ajustar o substituto / mecanismo de declaração) · [ ] **Rejeitar o desenho** — _não a direção_: o substituto/migração não preserva algum invariante, ou o mecanismo `exige-julgamento` falha → volta ao desenho; a remoção da taxonomia segue de pé
- **Justificativa / Ressalvas:** > [owner crava no gate de G02]
- **Data / Owner:** **\_\_** / @rosana

---

### [DEC-0024-G06] Contrato da cadeia `research → … → implementação` (decisão de processo)

**Pergunta:** O que protege a autoria humana (seta `humano → sistema`, ADR 0018) em cada seam da cadeia — não só no seam `research → decision-brief` que falhou no G00?

**Modo de gate:** `aceitação` <!-- decisão de processo em sessão colaborativa humano-agente, 2026-05-29/30; cf. governance-foundation "Casos limites". -->

**Decisão (Resolved):** cravar em `governance-foundation.md` § "Contrato da cadeia" o contrato de I/O de cada fase em **três eixos** — _produz · proibido de produzir · escala para_ —, o **critério de parada da research** (para quando a decisão é possível; modos de gate `escolha`/`aceitação`), os **mecanismos de escalonamento** (roteamento por classe de descoberta, reusando primitivos existentes) e o **anti-padrão #6**. Boilerplates (`decision-brief`, `plan`) e `rpi-protocol.md` **refletem** o contrato; a constituição é SSOT. **Sem enforcement mecânico** (dogfood primeiro). Evidência-origem: `research/2026-05-30-research-output-contract.md` (+ findings `F-005`).

**Nota de ordem:** é decisão de **governança-processo**, ortogonal ao _conteúdo_ de G00 — **não viola o invariante de ordem**. G00 permanece `Pendente`. **Promotável a ADR no fechamento da spec.**

**Status:** Resolved (2026-05-30) / @rosana — decisão de processo colaborativa.
