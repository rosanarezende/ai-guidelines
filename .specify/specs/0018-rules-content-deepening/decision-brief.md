# Decision Brief — Spec 0018 Rules Content Deepening

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Tasks: [`./tasks.md`](./tasks.md)
> Status: **Open** <!-- Open | Partial | Resolved -->
> Última atualização: 2026-05-01 (Bloco A populado em A.1; A02/A03/A04 reformulados pelo eixo evidence-driven para portabilidade cross-repo; Bloco B aguarda B.0)

> **Apresenta opções com tradeoffs antes do gate humano e registra decisões
> validadas após o gate.** Este artefato é o gate canônico entre Stage 1
> (research) e Stage 2 (design + implementação) para specs de conteúdo.
> Não substitui ADRs (decisões arquiteturais cross-spec); é spec-level.
>
> **Convenção:** cada ponto tem ID `[DEC-NNNN-XYZ]` (NNNN = número da spec;
> XYZ = sub-bloco + sequência). Pontos novos podem ser adicionados durante
> Stage 1 quando research expor questões não previstas; opções de pontos
> podem evoluir até a marcação `Resolved`. Após `Resolved`, mudanças vão
> para `plan.md` "Decisões revisitadas".
>
> **Esta brief é a primeira instância (hand-rolled).** O Bloco A desta spec
> formaliza `decision-brief-boilerplate.md` informado pelo dogfood deste
> arquivo — ver `[DEC-0018-A05]`.

---

## Bloco A — Política framework + boilerplates

### [DEC-0018-A01] Updates por boilerplate

**Pergunta:** que mudanças aplicar em cada um dos 7 boilerplates existentes em `.specify/templates/`, e qual o conteúdo do 8º (`decision-brief-boilerplate.md`)?

**Contexto (research):**

- [`research/2026-04-30-boilerplates-audit.md`](./research/2026-04-30-boilerplates-audit.md) — § 8 traz a matriz canônica `manter | revisar | adicionar | remover` por boilerplate, com referência cruzada para as lacunas L1–L16 (§ 5), ruído R1–R7 (§ 6) e dogfood D1–D18 (§ 7). Cada item abaixo cita audit § correspondente.

**Estrutura das opções:** este ponto é **umbrella**. Cada boilerplate é uma sub-decisão. O owner pode aceitar a matriz inteira (Opção Global Aceitar), aceitar com ressalvas (Opção Global Híbrida — escolher item-a-item), ou rejeitar a matriz (Opção Global Rejeitar — voltar para Stage 1 com novo research). Em paralelo, decisões item-a-item são feitas nas sub-rows abaixo. Sub-rows são independentes — owner pode marcar `Resolved` por linha.

**Convenção:** cada item carrega tag `[manter|revisar|adicionar|remover]` + referência ao audit. Itens marcados `(gatilho: tipo evidence-driven|mixed)` dependem da resolução de `[DEC-0018-A02]`.

#### A01.1 — `spec-boilerplate.md`

- `[manter]` Header (Status, Author, Date, Owner, Plan); 🎯 Objetivo; 📦 Escopo; ✅ Critérios de Aceite alto-nível; 🛠️ Dependências e impactos; 📚 Referências. (audit § 8.1)
- `[revisar]` Convenção de **status composto**: aceitar valores como `Done (PR #X — YYYY-MM-DD)`, `Draft (revised YYYY-MM-DD)` formalmente. (audit § 5.2 / L7)
- `[revisar]` 🔬 Pesquisa de contexto: remover prescrição literal de `research/synthesis.md` — campo neutro aceita qualquer arquivo (incluindo `decision-brief.md`). (audit § 6 / R1)
- `[revisar]` "Riscos macro" — sincronizar com `spec-foundation.md` ou remover (drift bidirecional § 4.2).
- `[adicionar]` Campo **Tipo de spec** no header (gatilho: resolução `[DEC-0018-A02]`). (audit § 5 / L3)
- `[adicionar]` Campo opcional **Decision Brief** no header (gatilho: tipo `evidence-driven` ou `mixed`). (audit § 7 / D18, L8)
- `[adicionar]` Subseção opcional 🧠 **Decisão de Fusão** (critério + análise + conclusão; gatilho: spec absorve candidatas). (audit § 5 / L1)
- `[adicionar]` Subseção opcional 🛑 **Post-mortem / Motivo do Pivot** (gatilho: status `Pivoted` ou `Cancelled`). (audit § 5 / L6)
- `[adicionar]` Subseção opcional **Cross-refs com specs irmãs** dentro de "Dependências" (formato: spec / fronteira / motivo). (audit § 5 / L4)
- `[adicionar]` Referência cruzada para "Princípios da Escrita" de `spec-foundation.md`. (audit § 4.1 / L14)
- `[remover]` _(nenhum item totalmente removível identificado)_

#### A01.2 — `plan-boilerplate.md`

- `[manter]` 🏗️ Design (Princípio guia + Componentes); ✅ DoD operacional; 🧪 Estratégia de Testes; 🛠️ Arquivos modificados; ⚠️ Riscos técnicos. (audit § 8.2)
- `[revisar]` 📐 **Decisões revisitadas**: definir formato (data + mudança + razão + impacto em tasks.md) + cap (5? 10? sem cap?) + política de migração no encerramento. (audit § 3.2 / L2 — 0008 inflou para ~30 entradas)
- `[revisar]` "Princípio guia" 2-4 linhas estritas: relaxar cap rígido — variação 1ℓ–5§ é legítima por escopo. (audit § 6 / R7)
- `[adicionar]` Bloco **Stage 1 / Stage 2 placeholder** (gatilho: tipo `evidence-driven` ou `mixed`; depende de `[DEC-0018-A02]`). (audit § 5 / L9)
- `[adicionar]` Subseção opcional 📎 **Anexo — Conteúdo candidato pré-research** (gatilho: existe rascunho mergeado a reconciliar). (audit § 5 / L5)
- `[remover]` _(nenhum)_

#### A01.3 — `tasks-boilerplate.md`

- `[manter]` Estrutura Fase 0 → 1 → 2 → 3; **[MANDATÓRIO]** em 0.3 (validação humana inicial) e 3.5 (uma spec ativa). (audit § 8.3)
- `[revisar]` Fase 0.6 "Pesquisa inicial" + 0.7 "Síntese" prescritivos: tornar condicional ao tipo de spec (obrigatório para `evidence-driven`/`mixed`, opcional para `deterministic`). (audit § 6 / R3)
- `[revisar]` Fase 2.3 "CHANGELOG.md" como mandatório: explicitar gatilho ("mudança de comportamento publicada"). (audit § 6 / R4)
- `[revisar]` Fase 3.2 "research migration": sincronizar com política completa de `spec-foundation.md` (renomeia `YYYY-MM-DD-`, move para `.specify/specs/researchs/<domínio>/`, indexa em `research-index.md`). (audit § 5 / L11)
- `[adicionar]` Fase 0 explícita "0.X Bootstrap: ler `roadmap/backlog.md`" (canonizado em CLAUDE.md raiz e Spec 0017 A.3). (audit § 5 / L12)
- `[adicionar]` Fase 0 explícita sobre **critério de numeração** (slug semântico → número apenas na criação da branch). (audit § 5 / L13)
- `[adicionar]` Bloco **Fase 1.5 / Gate humano** (gatilho: tipo `evidence-driven` ou `mixed`; depende de `[DEC-0018-A02]` e `[DEC-0018-A06]`). (audit § 5 / L9)
- `[adicionar]` "Validação Humana" em mais gates entre Stage 1 e Stage 2 (gatilho: tipo `evidence-driven` ou `mixed`). (audit § 5 / L10)
- `[adicionar]` Quando há promoção de regra: classificar como universal vs opt-in (referência a `spec-foundation.md` § "Categorias de regras"). (audit § 5 / L15)
- `[remover]` _(nenhum)_

#### A01.4 — `next-boilerplate.md`

- `[manter]` Header advertindo "deletar no encerramento (Fase 3.1)"; 🏛️ Insights e Débitos Adiados (Problema/Insight/Ação por item). (audit § 8.4)
- `[revisar]` ✂️ "Itens descartados deliberadamente": downgrade para opcional (nenhuma das 5 specs usou). (audit § 6 / R2)
- `[adicionar]` Trigger explícito de **criação** (não apenas deleção): "criar quando a spec gerar débitos conscientes" — política existe em `spec-foundation.md` mas não em tasks-boilerplate. (audit § 4.1)
- `[remover]` _(considerar)_ "Itens descartados deliberadamente" se mantida nunca-usada após relançamento.

#### A01.5 — `research-index-boilerplate.md`

- `[manter]` Estrutura por categoria com emojis sugeridos (🏛️ 🏗️ 🛸 🔬 📐); regras de uso (≥ 2 estudos por categoria; ≤ 6 categorias). (audit § 8.5)
- `[revisar]` Sincronizar política de research lifecycle com `spec-foundation.md` (alimenta `[DEC-0018-A03]`).
- `[adicionar]` _(nenhum item óbvio)_
- `[remover]` _(nenhum)_

#### A01.6 — `roadmap-boilerplate.md`

- `[manter]` Split `historico.md` (passado, imutável) + `backlog.md` (presente/futuro, vivo); princípio "repo-first, integração-friendly" + campo opcional `tracker`. (audit § 8.6)
- `[revisar]` Localização da política "repo-first" + `tracker`: hoje vive apenas no boilerplate; alimenta `[DEC-0018-A03]` (drift bidirecional § 4.2).
- `[adicionar]` _(nenhum item óbvio)_
- `[remover]` _(nenhum)_

#### A01.7 — `project-config-boilerplate.md`

- `[manter]` NÃO versionado; copia para `~/.{ai}/projects.md`; lista de IAs alvo (Gemini, Claude, Codex). (audit § 8.7)
- `[revisar]` _(nenhum item óbvio)_
- `[adicionar]` _(nenhum item óbvio)_
- `[remover]` _(nenhum)_

#### A01.8 — _(novo)_ `decision-brief-boilerplate.md`

> Conteúdo derivado das opções de `[DEC-0018-A05]`. Esta sub-row apenas registra que **a criação do 8º artefato é uma adição umbrella** — o formato exato é decidido em A05.

- `[adicionar]` Criar `decision-brief-boilerplate.md` em `.specify/templates/` com estrutura validada em `[DEC-0018-A05]`. (audit § 8.8)

**Recomendação inicial (a confirmar pós-gate):** aceitar a matriz inteira (Opção Global "Aceitar"), com `[adicionar]`s gatilhados por tipo de spec ficando condicionais à resolução de `[DEC-0018-A02]`. Justificativa: cada item da matriz tem evidência empírica direta na auditoria; rejeitar item-a-item sem nova research seria voltar à acreção sem evidência que motivou a 0018.

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha consolidada: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-A02] Estrutura do campo "Tipo de spec"

**Pergunta:** como classificar specs em `spec-boilerplate.md` para que o lifecycle (single-pass × dois passes com gate) seja aplicado corretamente em **qualquer repositório consumidor** — não apenas no `ai-guidelines`?

**Contexto (research):**

- [`research/2026-04-30-boilerplates-audit.md`](./research/2026-04-30-boilerplates-audit.md) § 4.3 — gap canônico: nem boilerplate nem `spec-foundation.md` classificam por tipo. Specs reais re-classificadas pelo critério evidence-driven: 0008 (mixed), 0015 (deterministic — mapeamento prévio define alvos), 0016 (mixed → pivoted ao falhar a hipótese), 0017 (mixed — research de compliance + impl), 0018 (evidence-driven).
- 0018-rev1 `spec.md` originalmente propôs `conteúdo | infraestrutura | mista`. Proposta **abandonada durante A.1 (2026-05-01)** por ser específica do repo `ai-guidelines` (cujo deliverable **é** conteúdo de regras × CLI). Em consumidores genéricos (SaaS, library, infra-as-code, ML pipeline, design system) a categoria não generaliza — feature de auth, migração de banco, refatoração de pipeline, redesign de DS não cabem em "conteúdo vs infraestrutura". `spec.md` desta spec deve ser ajustada para refletir o novo framing (follow-up).

**Princípio guia (decisão de framing, 2026-05-01):** o eixo de fundo do workflow em dois passes não é "do que a spec trata", é **"o design depende de evidência ainda não coletada?"**. Specs que exigem research / benchmark / user-interview / A-B test / capacity planning / threat-model antes de cravar design → Stage 1 + gate humano. Specs com design determinístico dado o objetivo (fix bug conhecido, refactor mapeado, add CRUD endpoint, bump de dependência, migração com schema definido) → single-pass. A pergunta é universal: porta para qualquer consumidor.

**Eixos a decidir:**

1. **Cardinalidade dos valores** (quantos tipos)
2. **Critério distintivo** (o que define cada tipo)
3. **Default** (quando ausente, o que assumir)
4. **Diferenciação operacional** em `tasks-boilerplate.md` (que tasks ganham/perdem por tipo)

#### Sub-eixo 1 — Cardinalidade dos valores

| Opção | Valores                                                                                                            | Pró                                                                                  | Contra                                                                                         |
| :---- | :----------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| A     | 2: `evidence-driven` \| `deterministic`                                                                            | Binário; força escolha; reduz ambiguidade                                            | Spec com partes mistas (parte exige research, parte não) força classificação artificial        |
| B     | 3: `evidence-driven` \| `deterministic` \| `mixed`                                                                 | Captura realidade observada (0008, 0017 são mistos); aceita híbridos sem violência   | `mixed` tende a virar default preguiçoso; risco de perder enforcement de Stage 1+gate          |
| C     | Workflow direto: `single-pass` \| `two-pass-with-gate`                                                             | Pula categoria conceitual; nomeia o lifecycle diretamente                            | Perde a leitura "que tipo de spec é"; força owner a já saber o lifecycle antes de classificar  |
| D     | A ou B + sub-categoria customizável pelo consumidor (camada 2: `feature`, `migration`, `runbook`, `incident` etc.) | Deixa o consumidor adicionar rótulos de domínio sem alterar o lifecycle do framework | Complexidade extra; arrisca drift entre framework e consumidores se não houver convenção clara |

**Recomendação inicial (a confirmar pós-gate):** **B** com nota explícita no boilerplate de que `mixed` exige Stage 1+gate (não vira escape hatch). Por quê não A: 0008 e 0017 mostram que misturas existem na prática. Por quê não C: classificação por categoria preserva a leitura "do que a spec é" como meta-informação útil. **D pode ser candidata futura** quando consumers reais demonstrarem necessidade — entra como evolução, não como escopo desta spec.

#### Sub-eixo 2 — Critério distintivo

Pergunta a responder ao classificar uma spec: _qual é o teste para distinguir os tipos?_

| Opção | Critério distintivo                                                                                                                                                                                                   | Aplicação universal                                                                                                                               | Exemplo                                                                                                                                     |
| :---- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------ |
| A     | **Evidência exigida pré-design**: design depende de research/benchmark/interview/A-B test/threat-model/capacity-plan ainda não coletados → `evidence-driven`; design determinístico dado o objetivo → `deterministic` | Forte — cabe em qualquer repo (SaaS: user research; library: API benchmarks; infra: capacity planning; ML: dataset audit; security: threat model) | 0018 = `evidence-driven` (exige benchmark de provedores antes de fechar taxonomia); 0015 = `deterministic` (mapeamento prévio define alvos) |
| B     | **Por arquivo tocado**: regras/conteúdo → `evidence-driven`; CLI/infra → `deterministic`                                                                                                                              | Frágil — específico deste repo; quebra em consumidores                                                                                            | _(não generaliza)_                                                                                                                          |
| C     | **Por consumidor da entrega**: muda o que IA lê → `evidence-driven`; muda como IA é compilada → `deterministic`                                                                                                       | Frágil — só se aplica a meta-frameworks como este                                                                                                 | _(não generaliza)_                                                                                                                          |
| D     | **Por incerteza percebida**: alta incerteza → `evidence-driven`; baixa → `deterministic`                                                                                                                              | Subjetivo; difícil de operacionalizar sem heurística concreta                                                                                     | "acho que precisa de research"                                                                                                              |

**Recomendação inicial (a confirmar pós-gate):** **A**. Critério universal, operacionalizável (pergunta-teste objetiva: "consigo desenhar a solução agora ou preciso coletar evidência?"), e alinhado ao princípio guia. B/C podem ser citados em `spec-foundation.md` como _heurísticas auxiliares no contexto deste repo_ (mapeamento conteúdo→evidence-driven, infra→deterministic é frequente _aqui_, mas não regra universal).

#### Sub-eixo 3 — Default quando campo ausente

| Opção | Default                             | Pró                                                              | Contra                                                                       |
| :---- | :---------------------------------- | :--------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| A     | `deterministic` (mais permissivo)   | Specs já existentes (single-pass) continuam válidas sem retrofit | Pode esconder specs evidence-driven que precisariam do gate                  |
| B     | `evidence-driven` (mais rigoroso)   | Default seguro: força gate humano até prova em contrário         | Atrito alto para specs triviais que viram boilerplate-toda                   |
| C     | **Sem default — campo obrigatório** | Força reflexão; impossibilita pular a classificação              | Atrito mais alto; pode ser regredido por agentes que sempre escolhem o mesmo |

**Recomendação inicial (a confirmar pós-gate):** **C** — campo obrigatório. Custo é trivial (uma linha no header); benefício é impedir o anti-pattern "começar a codar sem decidir o tipo".

#### Sub-eixo 4 — Diferenciação operacional em `tasks-boilerplate.md`

| Opção | Como diferenciar                                                                                                                | Pró                                                             | Contra                                                                                 |
| :---- | :------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| A     | **Boilerplate único** com tasks marcadas `[gatilho: tipo X]`                                                                    | 1 arquivo só; menos manutenção                                  | Visualmente poluído; agente precisa filtrar mentalmente                                |
| B     | **Boilerplates separados**: `tasks-evidence-driven-boilerplate.md` + `tasks-deterministic-boilerplate.md`                       | Limpo; cada tipo tem checklist próprio                          | 2 arquivos para manter sincronizados; risco de drift entre eles                        |
| C     | **Boilerplate único + apêndice "Stage 1+Gate" condicional** (incluído ao instanciar quando tipo é `evidence-driven` ou `mixed`) | Compromisso: 1 fonte de verdade + escolha clara na instanciação | Requer instanciador (script CLI ou processo manual rigoroso) que aplique o condicional |

**Recomendação inicial (a confirmar pós-gate):** **C** — preserva fonte única + permite enforcement do gate sem inflar specs `deterministic`. Implica leve incremento ao processo de instanciação (script ou checklist humano).

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha (Sub-eixo 1, cardinalidade): \_\_\_
- Escolha (Sub-eixo 2, critério): \_\_\_
- Escolha (Sub-eixo 3, default): \_\_\_
- Escolha (Sub-eixo 4, diferenciação operacional): \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-A03] Localização e formato da política de tipos de spec em `spec-foundation.md`

**Pergunta:** onde, dentro de `docs/process/spec-foundation.md`, inserir a seção sobre tipos de spec (`evidence-driven` × `deterministic` × `mixed` — ver `[DEC-0018-A02]`) e o workflow em dois passes? Como descrevê-la sem inflar o documento, e cobrindo exemplos por tipo de repo (não só `ai-guidelines`)? E como sincronizar o drift bidirecional § 4.2 da auditoria (políticas hoje em boilerplates que deveriam viver na constituição)?

**Contexto (research):**

- [`research/2026-04-30-boilerplates-audit.md`](./research/2026-04-30-boilerplates-audit.md) § 4 — drift bidirecional: 8 políticas em `spec-foundation.md` que nenhum boilerplate reflete; 6 campos em boilerplates sem justificativa na constituição. Sincronização cruzada faz parte deste ponto.
- `[DEC-0018-A06]` decide a **localização física** (qual arquivo). Este ponto decide o **formato + onde dentro do arquivo escolhido**.

**Eixos:**

1. **Localização interna** dentro de `spec-foundation.md` (qual seção)
2. **Formato** (prosa × tabela × diagrama × híbrido)
3. **Sincronização do drift bidirecional** (que políticas migrar)

#### Sub-eixo 1 — Localização interna em `spec-foundation.md`

| Opção | Onde dentro do arquivo                                                                       | Pró                                                                                             | Contra                                                                           |
| :---- | :------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| A     | Nova seção dedicada **"Tipos de spec"** logo após "Quando usar spec-foundation"              | Encadeamento natural: depois de decidir "spec ou plano leve?", decidir "que tipo de spec?"      | Adiciona seção #4 (depois "Categorias de regras", "Hierarquia de documentos")    |
| B     | **Estender "Hierarquia de documentos"** com sub-seção "Workflow por tipo de spec"            | Reaproveita seção existente; não inflar contagem de seções                                      | Hierarquia mistura "que arquivos existem" com "que workflow se aplica"           |
| C     | Nova seção **"Workflow em dois passes"** ao final, antes de "Templates"                      | Agrupa toda a lógica de processo num único bloco                                                | Quebra ordem natural: leitor encontra "tipos" antes de "workflow" lendo top-down |
| D     | Híbrido: subseção curta em "Hierarquia" (taxonomia) + seção "Workflow em dois passes" (gate) | Separa conceito (tipo) de processo (gate) — espelha a separação `decision-brief.md` ↔ `plan.md` | 2 lugares para manter sincronizados                                              |

**Recomendação inicial (a confirmar pós-gate):** **A** — encadeamento didático claro; minimiza fragmentação; "Workflow em dois passes" cabe como subseção de "Tipos de spec".

#### Sub-eixo 2 — Formato

| Opção | Formato                                                                                                                                                                    | Pró                                   | Contra                                                               |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------ | :------------------------------------------------------------------- |
| A     | Tabela de 3 linhas (`evidence-driven` / `deterministic` / `mixed`) × colunas (Critério / Evidência exigida / Workflow / Exemplo por tipo de repo)                          | Compacto; scan rápido                 | Tabelas largas podem quebrar em renderers; exemplos longos não cabem |
| B     | Sub-seções por tipo (`### Spec evidence-driven`, `### Spec deterministic`, `### Spec mixed`) com prosa curta + 2-3 exemplos por tipo de repo (SaaS / library / infra / ML) | Suporta exemplo longo; idioma natural | Mais linhas; risco de prolixidade                                    |
| C     | Diagrama ASCII de fluxo (Stage 1 → Gate → Stage 2) + tabela de tipos                                                                                                       | Visual + textual                      | ASCII frágil em renderers; menor portabilidade                       |
| D     | Híbrido: tabela compacta de tipos (Sub-eixo 1) + 1 parágrafo descrevendo o gate + nota com 2-3 exemplos cross-repo                                                         | Compromisso: scan rápido + contexto   | Médio em todas as dimensões                                          |

**Recomendação inicial (a confirmar pós-gate):** **D** — espelha o estilo já usado em `spec-foundation.md` (tabela em "Categorias de regras" + prosa em "Princípios da Escrita").

#### Sub-eixo 3 — Sincronização do drift bidirecional

A auditoria § 4.2 lista 6 campos em boilerplates sem justificativa em `spec-foundation.md`. Nem todos precisam migrar — alguns podem ficar onde estão como decisão consciente. Opções por item:

| Item drift                                          | Hoje vive em                                       | Opção 1 (manter)                             | Opção 2 (promover)                                                    |
| :-------------------------------------------------- | :------------------------------------------------- | :------------------------------------------- | :-------------------------------------------------------------------- |
| "Riscos macro" como subseção formal                 | `spec-boilerplate.md`                              | Aceitar como convenção apenas de boilerplate | Documentar em `spec-foundation.md` "Hierarquia § spec.md"             |
| "Decisões revisitadas" formato                      | `plan-boilerplate.md`                              | Manter no boilerplate                        | Documentar formato + cap em `spec-foundation.md`                      |
| "Itens descartados deliberadamente"                 | `next-boilerplate.md`                              | Ver `[DEC-0018-A01]` A01.4 (downgrade)       | _(N/A — depende de A01.4)_                                            |
| Campo `tracker` + "repo-first, integração-friendly" | `roadmap-boilerplate.md`                           | Manter (já é específico de roadmap)          | **Promover** princípio à `spec-foundation.md` (relevância cross-spec) |
| Categorias com emojis em research-index             | `research-index-boilerplate.md`                    | Manter (estilo do índice apenas)             | _(N/A — overhead)_                                                    |
| Política de NEXT.md "criar quando há débitos"       | `next-boilerplate.md` + `tasks-boilerplate.md` 3.1 | _(já existe parcialmente)_                   | **Sincronizar** trigger de criação em tasks-boilerplate Fase 0        |

**Recomendação inicial (a confirmar pós-gate):** promover `tracker`/`repo-first` (princípio cross-spec) e o trigger de NEXT.md (lifecycle); manter os outros como convenção localizada de boilerplate.

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha (Sub-eixo 1): \_\_\_
- Escolha (Sub-eixo 2): \_\_\_
- Escolha (Sub-eixo 3): \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-A04] Texto da linha em `global-rules.md`

**Pergunta:** que texto curto, em `.core/rules/global-rules.md`, referencia a política sem duplicar `spec-foundation.md`? Em qual subseção entra ("Workflow com IA" existente, ou nova)?

**Contexto (research):**

- [`research/2026-04-30-boilerplates-audit.md`](./research/2026-04-30-boilerplates-audit.md) § 4.1 — `global-rules.md` hoje não menciona "Tipo de spec"; lacuna L14 propõe referenciar Princípios da Escrita também. A linha desta decisão **só faz sentido após `[DEC-0018-A03]`** decidir onde a política completa vive.
- Princípio da governance (Spec 0008): `global-rules.md` é "regra acionável", `spec-foundation.md` é "implementação canônica". Texto curto + ponteiro é o padrão estabelecido (ex.: regra "PR collab 3 etapas" também aponta para detalhes).

**Eixos:**

1. **Localização interna em `global-rules.md`** (subseção)
2. **Texto** (redação)

#### Sub-eixo 1 — Subseção em `global-rules.md`

Hoje `global-rules.md` (pós-b9efb83) tem 3 seções: Princípios de Engenharia, Eficiência de IA, Workflow com IA.

| Opção | Subseção                                                                            | Pró                                                                         | Contra                                                                                 |
| :---- | :---------------------------------------------------------------------------------- | :-------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| A     | "Workflow com IA" (existente) — adicionar 1 item                                    | Encaixa onde já vivem regras de processo (plan mode, RPI obrigatório, etc.) | Lista cresce; pode confundir leitor sobre escopo da subseção (workflow tarefa vs spec) |
| B     | Nova subseção **"Spec lifecycle"** dedicada                                         | Limpo; isola lifecycle de spec do workflow tarefa-a-tarefa                  | Inflar contagem de seções                                                              |
| C     | **Princípios de Engenharia** — adicionar como princípio "Tipo de spec define rigor" | Posiciona como princípio fundacional (não regra de processo)                | Mistura conceitual: "tipo de spec" não é princípio de engenharia stricto sensu         |

**Recomendação inicial (a confirmar pós-gate):** **A** — minimiza churn; "Workflow com IA" é o lugar natural (RPI obrigatório, plan mode antes de agent mode). A nova linha encaixa naturalmente como "lifecycle de spec respeita tipo".

#### Sub-eixo 2 — Texto candidato

Restrição: ≤ 2 linhas; aponta para `docs/process/spec-foundation.md`; não duplica conteúdo.

| Opção | Redação candidata                                                                                                                                                                                                                                                                                                         | Pró                                                      | Contra                                                                   |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------- | :----------------------------------------------------------------------- |
| A     | "**Specs têm tipo declarado** (`evidence-driven` \| `deterministic` \| `mixed`); specs `evidence-driven` ou `mixed` seguem workflow em dois passes (Stage 1 research → gate humano via `decision-brief.md` → Stage 2 implementação). Detalhes em `docs/process/spec-foundation.md`."                                      | Completo; auto-contido; cita o gate                      | 2-3 linhas (no limite); cita o nome do artefato (acoplamento ao formato) |
| B     | "**Antes de implementar quando o design depende de evidência ainda não coletada** (research/benchmark/interview/threat-model), registre opções e gate humano em `decision-brief.md` da spec. Detalhes em `docs/process/spec-foundation.md`."                                                                              | Curto; foco no comportamento esperado; universal         | Não cita o nome do tipo — leitor precisa inferir                         |
| C     | "**Classifique a spec por tipo** no header (`evidence-driven` \| `deterministic` \| `mixed`); o tipo determina o lifecycle (single-pass × dois passes com gate humano). Ver `docs/process/spec-foundation.md`."                                                                                                           | Foco na ação concreta (classificar); aponta consequência | Não cita `decision-brief.md` — leitor pula para spec-foundation          |
| D     | _(híbrido)_ Linha curta na subseção + 1 bullet de contexto: <br/> "**Tipo de spec é declarado no header**. Specs `evidence-driven` ou `mixed` exigem gate humano via `decision-brief.md` antes de Stage 2 — o teste é 'o design depende de evidência ainda não coletada?'. Ver `docs/process/spec-foundation.md`." (~2 ℓ) | Compromisso: ação + critério-teste + consequência        | Médio em todas as dimensões; mais densa que A/C                          |

**Recomendação inicial (a confirmar pós-gate):** **D** — equilibra concretude (declare tipo) com critério-teste universal ("evidência ainda não coletada?") e consequência observável (gate antes de Stage 2). Acoplamento ao nome `decision-brief.md` é aceitável: o boilerplate é fixo no framework.

**Dependências:** redação final depende de `[DEC-0018-A02]` (cardinalidade + nomes dos valores) e `[DEC-0018-A03]` (formato em spec-foundation.md). Owner pode escolher Opção D condicional ("redação final ajustada após A02/A03").

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha (Sub-eixo 1): \_\_\_
- Escolha (Sub-eixo 2): \_\_\_
- Texto final aprovado: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-A05] Formato do `decision-brief-boilerplate.md`

**Pergunta:** que estrutura, campos e transições de status fazem o boilerplate funcionar para specs futuras? Que melhorias o dogfood desta brief sugere?

**Contexto (research):**

- [`research/2026-04-30-boilerplates-audit.md`](./research/2026-04-30-boilerplates-audit.md) § 7 — dogfood: 7 itens funcionaram (D1–D7) e 11 precisam ajuste (D8–D18). § 8.8 traz a matriz de itens a adicionar para o 8º artefato.
- Esta brief é o protótipo (rev1, criada 2026-04-30); seus elementos validados em uso compõem a base do boilerplate.

**Estrutura da decisão:** o formato final é composição de **escolhas independentes** sobre 5 sub-eixos. Cada sub-eixo tem 2-3 opções; owner pode resolver sub-eixos em momentos diferentes (sub-eixos podem ficar `Resolved` independentemente).

#### Sub-eixo 1 — Estrutura por ponto `[DEC-*]`

| Opção | Estrutura                                                                                                       | Pró                                                                           | Contra                                                                       |
| :---- | :-------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| A     | **Mínima**: Pergunta + Opções + Decisão                                                                         | Compacto                                                                      | Perde rastreabilidade research → opção; leitor não sabe de onde a opção veio |
| B     | **Padrão (atual)**: Pergunta + Contexto (research) + Opções + Decisão                                           | Rastreabilidade clara; espelha decisões da brief atual                        | _(é o status quo — ok)_                                                      |
| C     | **Estendida**: Pergunta + Contexto + **Eixos a decidir** + Opções por eixo + **Recomendação inicial** + Decisão | Suporta pontos compostos (como A02, A03, A05 desta brief que têm sub-eixos)   | Mais verboso para pontos simples                                             |
| D     | **Híbrida adaptativa**: Padrão (B) por default, com Sub-eixos (C) quando o ponto exige decomposição             | Flexível; espelha realidade — alguns pontos precisam decomposição, outros não | Owner precisa julgar quando decompor                                         |

**Recomendação inicial (a confirmar pós-gate):** **D** — observação empírica desta brief: A06 ficou em B, A02/A03/A05 viraram C. Boilerplate deve documentar ambos os formatos como aceitos, com diretriz de quando usar cada.

#### Sub-eixo 2 — Convenção de IDs e legendas

| Opção | Convenção                                                                                                                               | Pró                                            | Contra                                     |
| :---- | :-------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------- | :----------------------------------------- |
| A     | `[DEC-NNNN-XYZ]` (NNNN spec; X = bloco; YZ = sequência ordinal) — **convenção atual**                                                   | Em uso; clara; permite cross-ref               | Não diferencia ponto principal de sub-eixo |
| B     | `[DEC-NNNN-XYZ.W]` para sub-eixos (W = sequência de sub-eixo)                                                                           | Granular; cada sub-eixo é citável              | Mais ruído visual                          |
| C     | A + **legenda canônica de status** no topo do boilerplate (Open / Partial / Resolved / Pendente)                                        | Resolve D11 (legenda ausente)                  | _(combina com qualquer outro)_             |
| D     | A + C + **convenção de "Pontos derivados"** documentada (regra: novo ponto exige nota de origem; IDs sequenciais sem reaproveitar gaps) | Resolve D12 (rotina ausente para pontos novos) | _(combina com A/B/C)_                      |

**Recomendação inicial (a confirmar pós-gate):** **A + C + D** combinados. **B** somente se a prática mostrar necessidade de citar sub-eixos isoladamente (ainda não observado).

#### Sub-eixo 3 — Recomendação inicial e tradeoffs

| Opção | Política sobre "Recomendação inicial"                                                                         | Pró                                                                        | Contra                                                           |
| :---- | :------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| A     | **Mandatória** em todo ponto                                                                                  | Força quem popula a expor seu palpite — owner sabe de onde a brief inclina | Pode tornar a brief um veículo de viés se quem popula tem agenda |
| B     | **Opcional**: incluir só quando há opção dominante por evidência                                              | Honesta sobre incerteza                                                    | Inconsistência entre pontos (D8 — alguns têm, outros não)        |
| C     | **Mandatória + obrigatoriamente justificada por research** (não pode recomendar opção sem citar evidência)    | Combate o anti-pattern "decisão pré-research" (D15)                        | Atrito alto; pode bloquear quando research é insuficiente        |
| D     | **Opcional + nota explícita** sobre quando incluir (gatilho: opção tem evidência convergente em ≥ 1 research) | Compromisso entre A e B                                                    | Médio em todas as dimensões                                      |

**Recomendação inicial (a confirmar pós-gate):** **D**. Ajuda o owner sem forçar viés; documenta o critério para quem populá-la no futuro.

**Sub-decisão correlata (D9):** formato dos tradeoffs nas Opções:

- **D9.A**: Tabela com colunas Pró/Contra (visto em A06 desta brief).
- **D9.B**: Lista bulleted "Pró: ... / Contra: ...".
- **D9.C**: Aceitar ambos — escolha do autor por ponto.

Recomendação: **D9.A** quando há ≥ 3 opções; **D9.B** quando há 2 opções (tabela superdimensiona).

#### Sub-eixo 4 — Resumo de status e gate

| Opção | Como representar status                                              | Pró                                 | Contra                                              |
| :---- | :------------------------------------------------------------------- | :---------------------------------- | :-------------------------------------------------- |
| A     | **Apenas headers individuais** (status por ponto — sem tabela final) | Sem duplicação                      | Perde scan rápido; force owner a rolar para status  |
| B     | **Apenas tabela "Resumo de status"** ao final (status só na tabela)  | Scan rápido; única fonte            | Status some do bloco do ponto; cross-ref via tabela |
| C     | **Headers + tabela** (atual)                                         | Redundância controlada; scan rápido | Risco de drift entre header e tabela (D10)          |
| D     | **Headers individuais + tabela gerada por script** ao mergear        | Scan rápido + zero drift            | Requer script (overhead de manutenção)              |

**Recomendação inicial (a confirmar pós-gate):** **C** (manter atual) — script (D) é over-engineering para tamanho atual do repo. Drift é mitigável por revisão pré-PR.

**Sub-decisão correlata (D16) — Bloco "Gate" ao final:**

- **D16.A**: Adicionar bloco final "✅ Gate fechado: data + owner + checkbox por ponto".
- **D16.B**: Reaproveitar a tabela "Resumo de status" como gate (linha "Status agregado" no final).
- **D16.C**: Não adicionar nada; gate é implícito quando todos `Resolved`.

Recomendação: **D16.A** — gate explícito é didático e evita ambiguidade.

#### Sub-eixo 5 — Checklist pós-gate (transição Stage 1 → Stage 2)

| Opção | O que documentar                                                                                                                                                                                             | Pró                                 | Contra                                                         |
| :---- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------- | :------------------------------------------------------------- |
| A     | Apenas "atualizar plan.md v2 e tasks.md v2"                                                                                                                                                                  | Curto                               | Vago; quem populou ainda precisa decidir o quê especificamente |
| B     | **Checklist explícito**: (1) plan.md v2 com seções derivadas das decisões; (2) tasks.md v2 substitui placeholder; (3) atualizar status agregado da brief para `Resolved`; (4) commit atômico marcando o gate | Concreto; impossível esquecer passo | Boilerplate cresce                                             |
| C     | B + **referência ao formato Stage 1/Stage 2** dos boilerplates atualizados (depende de `[DEC-0018-A02]`)                                                                                                     | Coerência cross-artefato            | Acoplamento — boilerplate brief muda quando A02 muda           |

**Recomendação inicial (a confirmar pós-gate):** **B**. **C** seria a escolha se A02 fechar antes de A05; aceitar B agora e revisitar se necessário.

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha (Sub-eixo 1, estrutura): \_\_\_
- Escolha (Sub-eixo 2, IDs/legendas): \_\_\_
- Escolha (Sub-eixo 3, recomendação inicial + D9): \_\_\_
- Escolha (Sub-eixo 4, status + D16): \_\_\_
- Escolha (Sub-eixo 5, pós-gate): \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-A06] Localização física da seção "Tipos de spec" + workflow em dois passes

**Pergunta:** onde fisicamente vive a seção que descreve a política conteúdo × infraestrutura e o workflow em dois passes? Decisão tática de curto prazo. **A decisão arquitetural ampla** (catálogo de informação essencial do framework, classificação por gêneros documentais, eventual reorganização física entre `docs/`, `adrs/`, `.specify/`, raiz) **fica para a candidata `governance-information-architecture` no backlog**, com pré-requisito "0018 mergeada".

**Contexto (research):**

- Discussão pass 3 da revisão da spec 0018 (2026-04-30): owner identificou que `docs/process/spec-foundation.md` é constituição operacional viva, misturada em `docs/` com documentos descritivos; ausência de catálogo de informação essencial; gêneros documentais sem classificação explícita.
- A candidata `governance-information-architecture` foi adicionada a `roadmap/backlog.md` (topo de "Now") justamente para tratar este problema arquitetural amplo.
- [`research/2026-04-30-boilerplates-audit.md`](./research/2026-04-30-boilerplates-audit.md) § 4.3 confirma o gap: nem boilerplate nem `spec-foundation.md` classificam por tipo. § 9 mantém a recomendação inicial **A** como coerente com a priorização (resposta tática enquanto a candidata arquitetural espera).

**Opções:**

| Opção | Onde                                                                                                        | Pró                                                                               | Contra                                                                                |
| :---- | :---------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| A     | Acrescentar nova seção ao próprio `docs/process/spec-foundation.md` (status quo)                            | Mínimo churn; entrega 0018 sem expandir escopo; não antecipa decisão arquitetural | Acumula dívida; `spec-foundation.md` cresce; reforça mistura de gêneros               |
| B     | Novo arquivo `docs/process/spec-types.md` cross-ref'd pelo `spec-foundation.md`                             | Modular; menor inflação por arquivo                                               | Cria dependência cruzada antes da decisão maior; provável move depois                 |
| C     | ADR atômica nova (ex: `adrs/0009-spec-types-content-vs-infra.md`) + ponteiro mínimo em `spec-foundation.md` | Imobiliza a decisão; alinha com o gênero ADR                                      | Política operacional viva em ADR (gênero não-canônico); split entre runbook e decisão |
| D     | Aguardar `governance-information-architecture` para definir antes de aplicar a política                     | Coerente arquiteturalmente                                                        | Bloqueia 0018 indefinidamente — incompatível com priorização                          |

**Recomendação inicial (a confirmar pós-gate):** **A** — entregar a 0018 no `spec-foundation.md` atual e tratar o reposicionamento como migração executada pela `governance-information-architecture` quando ela rodar. Opções B/C antecipam decisão arquitetural sem evidência; D viola priorização.

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

## Bloco B — Content overhaul (rules)

### [DEC-0018-B01] Taxonomia das categorias de regras

**Pergunta:** quantas categorias separar e quais? Hipótese inicial: (a) meta-regras do agente, (b) princípios universais de engenharia, (c) heurísticas de domínio — mas pode emergir outra estrutura da research.

**Contexto (research):**

- A preencher após `research/2026-04-30-benchmark-rules-content.md` e `spec-driven-tools-rules.md`.

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-B02] Colocação por categoria

**Pergunta:** cada categoria definida em `[DEC-0018-B01]` vai para qual arquivo (`global-rules.md` × `claude.md`/`codex.md`/`gemini.md` × `opt-in/*.md` × novos arquivos)?

**Contexto (research):**

- Depende de `[DEC-0018-B01]`.
- Informado por `benchmark-rules-content.md` e medição de tokens em `tokens-baseline-budget.md`.

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-B03] Orçamento de tokens

**Pergunta:** qual teto de tokens por arquivo e agregado para o `<AI_GUIDELINES>` compilado? Qual baseline e qual margem de crescimento aceitável?

**Contexto (research):**

- A preencher após `research/2026-04-30-tokens-baseline-budget.md`.

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-B04] Formato do catálogo de regras

**Pergunta:** que campos cada regra carrega (nome, trigger, anti-padrão, exemplo positivo, exemplo negativo, fonte)? Que convenção de ID (`[RULE-*]` paralelo a `[BR-*]` da CLI? Outra?)? Hierarquia entre arquivos (uma regra em um único arquivo? Adapter ≠ universal?).

**Contexto (research):**

- A preencher após `benchmark-rules-content.md` e `spec-driven-tools-rules.md`.

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-B05] Metodologia do eval mínimo

**Pergunta:** quantos prompts canônicos? Quais provedores (≥2)? Que métrica (kill rate? outra?)? Que threshold de corte (regras com kill rate baixo são repostadas ou cortadas)? Como tratar não-determinismo do LLM?

**Contexto (research):**

- A preencher após `empirical-bugs-ai-code.md` e `external-bug-taxonomies.md`.

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-B06] Fronteira com Spec 0011 (regra-hierarquia)

**Pergunta:** se a categoria (c) heurísticas de domínio (ou equivalente decidido em B01) crescer, em que ponto a hierarquia por subdiretório (Spec 0011) se torna necessária? Que débito declarar em `NEXT.md`?

**Contexto (research):**

- Backlog: `regra-hierarquia` em "Now"; pré-requisito declarado é a 0018 concluída.
- Informado por `tokens-baseline-budget.md` e `[DEC-0018-B02]`.

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-B07] Fronteira com Spec 0009 (harness-engineering)

**Pergunta:** o eval mínimo desta spec é seed para 0009. Que parte fica aqui (eval manual, registrado em research) e que parte fica para 0009 (harness automatizado, agente validador, integração com `/ultra-review`)?

**Contexto (research):**

- Backlog: `harness-engineering` em "Next"; cross-ref Spec 0008-E.
- Informado por `[DEC-0018-B05]`.

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

### [DEC-0018-B08] Política de reconciliação do conteúdo b9efb83

**Pergunta:** para cada regra do conteúdo de `global-rules.md` e `quality-gates.md` mergeado em b9efb83, que critério aplicar (manter | revisar | reverter)? Critério é "passou no eval"? "Tem fonte"? Combinação?

**Contexto (research):**

- Anexo do `plan.md` resume o conteúdo de b9efb83.
- Informado por todas as 5 sínteses de B.0.

**Opções:** _(populate after research)_

**Decisão (preencher pós-gate):**

- Status: `Pendente`
- Escolha: \_\_\_
- Justificativa: \_\_\_
- Data: \_\_\_
- Owner: \_\_\_

---

## Resumo de status

| ID               | Bloco | Status   |
| :--------------- | :---- | :------- |
| `[DEC-0018-A01]` | A     | Pendente |
| `[DEC-0018-A02]` | A     | Pendente |
| `[DEC-0018-A03]` | A     | Pendente |
| `[DEC-0018-A04]` | A     | Pendente |
| `[DEC-0018-A05]` | A     | Pendente |
| `[DEC-0018-A06]` | A     | Pendente |
| `[DEC-0018-B01]` | B     | Pendente |
| `[DEC-0018-B02]` | B     | Pendente |
| `[DEC-0018-B03]` | B     | Pendente |
| `[DEC-0018-B04]` | B     | Pendente |
| `[DEC-0018-B05]` | B     | Pendente |
| `[DEC-0018-B06]` | B     | Pendente |
| `[DEC-0018-B07]` | B     | Pendente |
| `[DEC-0018-B08]` | B     | Pendente |

**Status agregado:** `Open` (transita para `Partial` quando ≥1 ponto for `Resolved`; transita para `Resolved` quando todos forem `Resolved`).
