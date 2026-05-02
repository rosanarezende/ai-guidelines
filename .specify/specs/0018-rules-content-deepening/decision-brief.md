# Decision Brief — Spec 0018 Rules Content Deepening

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Tasks: [`./tasks.md`](./tasks.md)
> Status: **Partial** <!-- Open | Partial | Resolved -->
> Última atualização: 2026-05-01 (Bloco A populado em A.1; A02/A03/A04 reformulados pelo eixo evidence-driven para portabilidade cross-repo; Bloco B populado em B.1 com base nas 5 sínteses de B.0)

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

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Escolha Consolidada (marque com `x`):**
  - [ ] Opção Global Aceitar
  - [x] Opção Global Híbrida
  - [ ] Opção Global Rejeitar
- **Justificativa / Ressalvas:** >
  Aceito a matriz de atualizações, mas com modificações estruturais no `tasks-boilerplate.md` inspiradas em práticas maduras de mercado para engenharia de software, focadas em PRs autossuficientes e quebra atômica de tarefas. O boilerplate passará a ter **5 Fases (0 a 4)**:
  **1. Fases 1 e 2 (Implementação A e B):** Para emular a quebra de um 'Discovery Técnico', a implementação será dividida em fases distintas. Exige "Commits Incrementais" ao final de cada sub-bloco para garantir a atomicidade da entrega (semelhante à conclusão de histórias de usuário).
  **2. Fase 3 (Preparação para Review - Gate de Homologação):** Fase exclusiva para empacotamento e homologação. Exige mudar o status para "In Review", atualizar a descrição do PR, e parar a execução aguardando o **Gate de Review Humano** (equivalente a uma homologação técnica formal).
  **3. Fase 4 (Encerramento Pré-Merge):** Nenhuma tarefa deve ocorrer após o merge. O encerramento ocorre na branch do PR. O merge só ocorre com o pacote 100% atômico e concluído.
- **Data / Owner:** 2026-05-02 / @rosanarezende

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

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Sub-eixo 1 — Cardinalidade dos valores (marque com `x`):**
  - [ ] A (2 tipos: evidence-driven | deterministic)
  - [x] B (3 tipos: evidence-driven | deterministic | mixed)
  - [ ] C (Workflow direto: single-pass | two-pass-with-gate)
  - [ ] D (A ou B + sub-categoria customizável pelo consumidor)
- **Sub-eixo 2 — Critério distintivo (marque com `x`):**
  - [x] A (A evidência é exigida pré-design?)
  - [ ] B (Por arquivo tocado: regras vs infra)
  - [ ] C (Por consumidor da entrega)
  - [ ] D (Por incerteza percebida: alta vs baixa)
- **Sub-eixo 3 — Default quando campo ausente (marque com `x`):**
  - [ ] A (deterministic)
  - [ ] B (evidence-driven)
  - [x] C (Sem default — campo obrigatório no header)
- **Sub-eixo 4 — Diferenciação operacional em tasks (marque com `x`):**
  - [ ] A (Boilerplate único com marcadores visuais de gatilho)
  - [x] B (Boilerplates separados por tipo)
  - [ ] C (Boilerplate único + apêndice "Stage 1+Gate" condicional injetado)
- **Justificativa / Ressalvas:** >
  Adoção das opções B + A + C, conforme recomendado pela pesquisa, garantindo que o framework possa lidar tanto com demandas investigativas complexas (como um discovery técnico pré-implementação) quanto com tarefas determinísticas de engenharia (como uma refatoração ou clean-up de código), forçando a classificação prévia no header.
  Para o Sub-eixo 4, divergimos da pesquisa e adotamos a **Opção B (Boilerplates separados)**. A justificativa é a economia de tokens e redução de carga cognitiva para a IA. Ter templates separados (`tasks-evidence-driven-boilerplate.md`, etc.) evita que o agente gaste contexto lendo regras condicionais complexas na hora de instanciar a spec. O pequeno custo de manutenção duplicada compensa o ganho em previsibilidade e eficiência do prompt.
- **Data / Owner:** 2026-05-02 / @rosanarezende

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

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Sub-eixo 1 — Localização interna no spec-foundation (marque com `x`):**
  - [x] A (Nova seção "Tipos de spec" logo após "Quando usar spec-foundation")
  - [ ] B (Estender "Hierarquia de documentos" com sub-seção)
  - [ ] C (Nova seção "Workflow em dois passes" ao final)
  - [ ] D (Híbrido: subseção curta em "Hierarquia" + seção "Workflow em dois passes")
- **Sub-eixo 2 — Formato (marque com `x`):**
  - [ ] A (Tabela de 3 linhas × colunas)
  - [ ] B (Sub-seções por tipo em prosa com exemplos)
  - [ ] C (Diagrama ASCII de fluxo + tabela de tipos)
  - [x] D (Híbrido: tabela compacta + 1 parágrafo gate + exemplos cross-repo)
- **Sub-eixo 3 — Sincronização do drift bidirecional (marque com `x`):**
  - [ ] Opção 1 (Manter as políticas atuais como convenções exclusivas de boilerplates)
  - [ ] Opção 2 (Promover todas as políticas apontadas para a spec-foundation)
  - [x] Misto (Promover `tracker`/`repo-first` e o trigger de `NEXT.md`; manter formato de decisões e riscos como convenção local de boilerplate)
- **Justificativa / Ressalvas:** >
  Embora o arquivo `spec-foundation.md` atual sofra de problemas arquiteturais (é uma documentação 'humana' não consumida pelos repositórios alvo, e será refatorado na spec futura 'governance-information-architecture'), decidimos injetar a nova seção "Tipos de spec" nele agora (Opções A e D) para evitar a criação prematura de novos arquivos soltos. No momento da implementação, a nova seção deve receber uma anotação de débito (TODO) indicando que seu conteúdo deverá ser migrado para o catálogo de regras canônicas na próxima refatoração arquitetural. Adotamos o modelo misto para o drift bidirecional para não inflar desnecessariamente um arquivo que já está destinado ao refatoramento.
- **Data / Owner:** 2026-05-02 / @rosanarezende

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

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Sub-eixo 1 — Subseção em `global-rules.md` (marque com `x`):**
  - [x] A ("Workflow com IA" - existente)
  - [ ] B ("Spec lifecycle" - nova seção dedicada)
  - [ ] C ("Princípios de Engenharia")
- **Sub-eixo 2 — Texto candidato (marque com `x`):**
  - [ ] A (Completo: lista todos os tipos, artefatos e passes)
  - [ ] B (Comportamental: "Antes de implementar quando o design depende de evidência...")
  - [ ] C (Foco na ação: "Classifique a spec por tipo no header...")
  - [x] D (Híbrido: Linha curta destacada + bullet explicando o critério-teste e o gate)
- **Texto final (se desejar redigir ou ajustar a opção escolhida):** >
  "**Tipo de spec é declarado no header (`evidence-driven`, `deterministic`, `mixed`).** Specs `evidence-driven` ou `mixed` exigem um gate humano via `decision-brief.md` antes da implementação — o teste é: _'o design depende de evidência técnica/pesquisa ainda não coletada?'_. Detalhes em `docs/process/spec-foundation.md`."
- **Justificativa / Ressalvas:** >
  Adoção das opções recomendadas (A + D) para minimizar churn no arquivo global de regras, aproveitando a seção de workflow existente. O texto híbrido foi ajustado para refletir a taxonomia de 3 tipos decidida no A02, fornecendo à IA a instrução exata de comportamento sem duplicar a documentação extensa que viverá no spec-foundation.
- **Data / Owner:** 2026-05-02 / @rosanarezende

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

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Sub-eixo 1 — Estrutura por ponto `[DEC-*]` (marque com `x`):**
  - [ ] A (Mínima: Pergunta + Opções + Decisão)
  - [ ] B (Padrão: Pergunta + Contexto + Opções + Decisão)
  - [ ] C (Estendida: Pergunta + Contexto + Eixos a decidir + Opções + Recomendação + Decisão)
  - [ ] D (Híbrida adaptativa: B por default, C quando exige decomposição)
- **Sub-eixo 2 — Convenção de IDs e legendas (marque com `x`):**
  - [ ] A (`[DEC-NNNN-XYZ]`)
  - [ ] B (`[DEC-NNNN-XYZ.W]` granular)
  - [ ] C (Opção A + Legenda canônica de status no topo do boilerplate)
  - [ ] D (Opção A + C + Convenção documentada de pontos derivados/novos)
- **Sub-eixo 3 — Recomendação inicial e tradeoffs (marque com `x`):**
  - [ ] A (Mandatória em todo ponto)
  - [ ] B (Opcional, só quando há dominância)
  - [ ] C (Mandatória + obrigatoriamente justificada por research)
  - [ ] D (Opcional + nota explícita com gatilho de evidência convergente)
  - **D9 - Tradeoffs:** [ ] D9.A (Tabela) | [ ] D9.B (Lista bulleted) | [ ] D9.C (Aceitar ambos)
- **Sub-eixo 4 — Resumo de status e gate (marque com `x`):**
  - [ ] A (Apenas headers individuais)
  - [ ] B (Apenas tabela final)
  - [ ] C (Headers + Tabela manual)
  - [ ] D (Headers + Tabela por script)
  - **D16 - Bloco Gate:** [ ] D16.A (Bloco final explicito) | [ ] D16.B (Na própria tabela) | [ ] D16.C (Gate implícito)
- **Sub-eixo 5 — Checklist pós-gate (marque com `x`):**
  - [ ] A (Apenas avisar "atualizar plan e tasks")
  - [ ] B (Checklist explícito de 4 passos)
  - [ ] C (B + Referência ao formato Stage 1/2)
- **Justificativa / Ressalvas:** >
- **Data / Owner:**

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

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [x] Resolvido
- **Escolha (marque com `x`):**
  - [x] A (Acrescentar nova seção ao próprio `docs/process/spec-foundation.md` como status quo)
  - [ ] B (Novo arquivo `docs/process/spec-types.md` e apenas linkar)
  - [ ] C (Criar uma ADR atômica nova e linkar)
  - [ ] D (Aguardar e bloquear a spec até rodar a `governance-information-architecture`)
- **Justificativa / Ressalvas:** >
  Decisão tática de curto prazo. Cientes de que o `spec-foundation.md` precisa ser refatorado para que regras de fluxo cheguem aos repositórios alvo, optamos pela inserção no arquivo atual (Opção A) para não bloquear a entrega da Spec 0018. A reestruturação profunda da arquitetura de informação (gêneros documentais, o que vai ou não para a CLI) fica delegada para a candidata `governance-information-architecture` no backlog, usando a versão final desta spec como baseline.
- **Data / Owner:** 2026-05-02 / @rosanarezende

---

## Bloco B — Content overhaul (rules)

### [DEC-0018-B01] Taxonomia das categorias de regras

**Pergunta:** quantas categorias separar e quais? Hipótese inicial mencionada na rev1 do plan ((a) meta-regras / (b) princípios universais / (c) heurísticas de domínio) é apenas uma das opções viáveis — research aponta múltiplas alternativas.

**Contexto (research):**

- [`research/2026-04-30-benchmark-rules-content.md`](./research/2026-04-30-benchmark-rules-content.md) § 4 (padrões emergentes), § 6.1 (opções A–D para B01) — convergência absoluta entre Anthropic/OpenAI/Google é "markdown puro + headings", **sem taxonomia normativa**; OSS curado divide por **stack** (awesome-cursorrules, 13 categorias) ou por **escopo de aplicação** (Continue, alwaysApply); **nenhum benchmark separa por função editorial** — `ai-guidelines` é mais explícito que o estado-da-arte.
- [`research/2026-04-30-empirical-bugs-ai-code.md`](./research/2026-04-30-empirical-bugs-ai-code.md) § 7.1 — sugere **três eixos ortogonais**: tipo de defeito (hallucination/functional/security/reliability/maintainability/process), camada de detecção (linter/teste/mutation/review/runtime), evidência empírica (forte/média/emergente/heurística declarada).
- [`research/2026-04-30-external-bug-taxonomies.md`](./research/2026-04-30-external-bug-taxonomies.md) § 10.1 — quatro opções estruturadas inspiradas em fontes maduras: Sonar (4 cat), OWASP-LLM + correctness (6 cat), 3 dimensões + tags (Sonar full), 4 fases SDLC (CERT).
- [`research/2026-04-30-spec-driven-tools-rules.md`](./research/2026-04-30-spec-driven-tools-rules.md) § 11 — opções observadas em SDD tools: eixo único (Spec Kit/BMAD), dual universal × scope (Continue/Cursor), trial categorial (≈ ai-guidelines atual), categoria adicional "decisão pré-design", categoria adicional "agente-vs-código".
- [`research/2026-04-30-tokens-baseline-budget.md`](./research/2026-04-30-tokens-baseline-budget.md) § 8.1 — baseline atual mostra `global-rules.md` (33 % do compilado-min) como o maior _driver_ unitário; qualquer taxonomia que infle universal cresce o teto agregado.

**Estrutura das opções:** o ponto é **multi-dimensional** (eixo principal + eixo secundário). Opções abaixo cobrem o eixo principal; o eixo secundário (scope/colocação) é tratado em `[DEC-0018-B02]`. Convenção: cada opção referencia o research § correspondente.

#### Sub-eixo 1 — Eixo primário da taxonomia

| Opção | Eixo primário                                                                                                                     | Pró                                                                                                                                                           | Contra                                                                                                                                            |
| :---- | :-------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| A     | **Por stack/tecnologia** (modelo awesome-cursorrules, 13 cat: frontend/backend/mobile/CSS/state…)                                 | Precedente massivo (36k stars); familiar a contribuidores OSS; casa com `globs` Continue-style                                                                | `ai-guidelines` é stack-agnóstico por design; força framework a virar catálogo stack-specific; colide com identidade canônica (`global-rules.md`) |
| B     | **Por função editorial** (filosofia / processo / gates / gotchas / convenções) — proposta nativa                                  | Reflete identidade do framework (regras IA-agnósticas vs opt-in); separação útil para o leitor entender intent (princípio vs checklist)                       | Sem precedente direto; risco de over-engineering se taxonomia não casar com como usuários **buscam** as regras                                    |
| C     | **Por escopo de aplicação** (always-on / conditional / on-demand) — modelo Continue + Anthropic                                   | Alinhado com a separação física que `ai-guidelines` já tem (`global-rules.md` × `opt-in/*.md`); convergente com Continue (`alwaysApply`) e Anthropic (Skills) | Taxonomia de **mecanismo**, não de **conteúdo**; dois leitores buscando "regras sobre TDD" não as agrupariam por "always-on" e sim por tema       |
| D     | **Por tipo de defeito** (Sonar 4 cat: Correctness / Security / Maintainability / Process)                                         | Convergente com indústria; mapeia para tags PR/issue; cross-ref CWE/OWASP                                                                                     | "Process / IA-Editorial" não tem âncora externa; pode virar saco de gato; sobreposição Correctness ↔ Maintainability                              |
| E     | **Por tipo de defeito + LLM-security** (6 cat: Correctness / Security / LLM-Security / Maintainability / Quality Gates / Process) | Explicita o eixo LLM/IA — diferencial do framework; isola Quality Gates como categoria de 1ª classe; reflete `.core/rules/` × `opt-in/`                       | 6 categorias é o limite cognitivo; risco de sobreposição Security ↔ LLM-Security; alguns consumidores vão querer simplificar                      |
| F     | **Híbrida — função editorial dentro de escopo** (D × A: primeiro escopo, depois função)                                           | Respeita arquitetura física existente **e** navegabilidade; espelha o split universal × per-IA × opt-in já em uso                                             | Dimensionalidade dobrada; risco de células vazias (ex.: "filosofia × per-IA"); 2 coordenadas para contribuidores                                  |
| G     | **3 dimensões ortogonais com tags** (Sonar full: Tipo × Severidade × Domínio livre)                                               | Mais expressivo; permite filtrar regras de várias formas; espelha sistema de produção                                                                         | Mais cognitivamente caro; framework não tem CI rodando regras (são editoriais); severity é semi-arbitrário; setup overhead alto                   |

#### Sub-eixo 2 — Eixo secundário (calibração de evidência)

Independente do eixo primário, toda regra carrega tag de evidência (sugestão de [`empirical-bugs § 7.1`](./research/2026-04-30-empirical-bugs-ai-code.md)):

| Opção | Política sobre tag de evidência                                                                                                     | Pró                                                                               | Contra                                                   |
| :---- | :---------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- | :------------------------------------------------------- |
| H     | **Mandatória** (toda regra declara força: Forte / Média / Emergente / Heurística declarada)                                         | Combate "AI-slop disfarçado"; força fundamentação; alinha com objetivo da 0018    | Atrito alto para contribuir; bloqueia regra sem source   |
| I     | **Opcional** (tag aparece quando há fonte; ausência = "heurística")                                                                 | Menor atrito; aceita regras observadas internamente sem corpus externo            | Permite reentrada do anti-pattern pré-research           |
| J     | **Mandatória só para categorias-âncora**: Correctness/Security/Reliability exigem evidência; Process/Editorial podem ser declaradas | Compromisso: rigor onde carrega risco real; flex onde a regra é convenção interna | 2 regimes para manter; precisa documentar onde se aplica |

**Recomendação inicial (a confirmar pós-gate):** **F (eixo primário) + J (tag de evidência)**. Justificativa: F preserva a arquitetura `.core/rules/` × `opt-in/` já vencedora (Spec 0008) e adiciona discriminação editorial — coerente com a Spec 0018 sem refundar; J ataca o problema-raiz da 0018 (b9efb83 sem fonte) onde ele dói (regras de defeito) sem inflar atrito em regras editoriais. **Não recomendar A** (colide com identidade); **não recomendar G** (over-engineering para o tamanho atual). C/D/E são alternativas próximas — owner pode escolher se preferir alinhamento mais forte com Sonar (D/E) em detrimento do split universal × per-IA × opt-in.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Sub-eixo 1 — Eixo primário da taxonomia (marque com `x`):**
  - [ ] A (Por stack/tecnologia - modelo awesome-cursorrules, 13 cats)
  - [ ] B (Por função editorial - filosofia/processo/gates/gotchas/convenções)
  - [ ] C (Por escopo de aplicação - always-on/conditional/on-demand)
  - [ ] D (Por tipo de defeito - Sonar 4 cats: Correctness/Security/Maintainability/Process)
  - [ ] E (Por tipo de defeito + LLM-security - 6 cats)
  - [ ] F (Híbrida — função editorial DENTRO de escopo universal/per-IA/opt-in)
  - [ ] G (3 dimensões ortogonais com tags estilo Sonar full)
- **Sub-eixo 2 — Eixo secundário: tag de evidência (marque com `x`):**
  - [ ] H (Mandatória para todas as regras: Forte/Média/Emergente/Heurística)
  - [ ] I (Opcional, quando não há = "heurística")
  - [ ] J (Mandatória APENAS para categorias-âncora como Correctness/Security; opcional para Process/Editorial)
- **Justificativa / Ressalvas:** >
- **Data / Owner:**

---

### [DEC-0018-B02] Colocação por categoria

**Pergunta:** dado um pedaço de conteúdo, em qual arquivo ele vive — `global-rules.md` × `{claude,codex,gemini}.md` × `opt-in/*.md` × novos arquivos? Que critério mecânico aplica para evitar drift e duplicação?

**Contexto (research):**

- [`research/2026-04-30-benchmark-rules-content.md`](./research/2026-04-30-benchmark-rules-content.md) § 6.2 — três opções estruturadas (audience / duplicação intolerável / escopo de injeção); convergência absoluta entre provedores oficiais é "hierarquia por proximidade no filesystem", **não** por marcação semântica.
- [`research/2026-04-30-spec-driven-tools-rules.md`](./research/2026-04-30-spec-driven-tools-rules.md) § 11 (B02) — opções observadas: monolith único (BMAD), prefixos numéricos (Continue/Cline), frontmatter scope (Cursor `.mdc`), pastas por taxonomia (awesome-cursorrules; modelo já em uso aqui), decision-briefs em `.specify/specs/<spec>/`.
- [`research/2026-04-30-tokens-baseline-budget.md`](./research/2026-04-30-tokens-baseline-budget.md) § 8.1 — colocação tem efeito sobre **recall** segundo Liu et al. ("Lost in the Middle"): zona topo (`global-rules.md` + adapters) tem vantagem de posição; zona centro (opt-in) tem pior recall mesmo quando ativada. Implicação: regras críticas precisam ficar no topo.
- [`research/2026-04-30-empirical-bugs-ai-code.md`](./research/2026-04-30-empirical-bugs-ai-code.md) § 7.3 — opção C de B08 (refundar catálogo) implica re-colocação; B02 e B08 têm acoplamento.
- Spec 0008 (governance-coherence) já cravou: `global-rules.md` é universal IA-agnóstica; adapters são por-IA; opt-in é dependente de stack/processo. **Esta decisão deve respeitar esse contrato** ou propor amendment explícito.

**Estrutura das opções:** o ponto pergunta dois sub-eixos: (1) **critério-teste** para classificar uma regra; (2) **arquitetura física** (manter vs introduzir novos arquivos/diretórios). Sub-eixos podem fechar independentemente.

#### Sub-eixo 1 — Critério-teste para classificar uma regra

| Opção | Critério                                                                                                                                                           | Pró                                                                                                 | Contra                                                                                                                                 |
| :---- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| A     | **Audience** (quem precisa saber?). Cross-IA → `global-rules.md`; sintaxe-específica de IA → adapter; stack/processo → `opt-in/*.md`                               | Claro; defensável; alinhado com Spec 0008                                                           | Zona cinza para regras universais com nuance por adapter (ex.: "use plan mode" → Anthropic Plan Mode, OpenAI raciocínio, Gemini agent) |
| B     | **Duplicação intolerável**. Mesma regra em 2+ adapters → `global-rules.md`; diverge fundamentalmente → adapter                                                     | Minimiza duplicação por construção; alinhado com anti-pattern "duplicação cross-arquivo"            | Pode forçar regras essencialmente per-IA para o universal só porque se traduzem para todas as três                                     |
| C     | **Escopo de injeção** (cobertura runtime). Sempre injetada → `global-rules.md`; condicional → `opt-in/*.md`; per-IA → adapter                                      | Critério mecânico; cada arquivo tem audience runtime claramente definida; fácil de lintar           | Foco mecânico esconde a pergunta editorial ("isso vale para todo mundo?"); pode levar `global-rules.md` a virar dump                   |
| D     | **Híbrido A + posição**. A como critério primário; quando ambíguo, considerar **posição no compilado** (zona topo vs centro) e priorizar topo para regras críticas | Endereça a evidência de Lost-in-the-Middle (§ 6.1 do tokens-baseline-budget); preserva clareza de A | Complexidade leve adicional; "regra crítica" precisa de definição (cross-ref a `[DEC-0018-B01]` Sub-eixo 2 / tag de evidência)         |

#### Sub-eixo 2 — Arquitetura física

| Opção | Arquitetura                                                                                                                                       | Pró                                                                                                                                                                      | Contra                                                                                                                                                          |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E     | **Manter status quo**: `global-rules.md` (1 arquivo) + 3 adapters + `opt-in/*.md` (flat)                                                          | Zero churn; testes/snapshots intactos; modelo já validado pela Spec 0008                                                                                                 | Não escala se Bloco B inflar; B02-D (zona topo) só endereçável por ordem de inserção, não por estrutura                                                         |
| F     | **Hierarquia por subdiretório dentro de `opt-in/`** (ex.: `opt-in/editorial/`, `opt-in/engineering/`, `opt-in/security/`)                         | Prepara terreno para Spec 0011 sem antecipá-la; deixa universal/adapter intactos                                                                                         | Spec 0011 está no roadmap como "Now"; antecipar parcialmente pode gerar débito (mover de novo)                                                                  |
| G     | **Split de `global-rules.md` em arquivos temáticos** (ex.: `global-engineering.md`, `global-process.md`, `global-philosophy.md`)                  | Endereça B02-D aplicando taxonomia B01-B/F na própria zona topo; cada arquivo cabe num teto menor                                                                        | Cada arquivo concatenado precisa novo header/separador no compiler; zonas topo crescem em número de arquivos (mas não em tokens necessariamente)                |
| H     | **Hierarquia full por subdiretório** (`global-rules/<categoria>/*.md` + `opt-in/<categoria>/*.md`) — adoção parcial da Spec 0011                  | Solução completa de organização                                                                                                                                          | **Antecipar 0011** colidiria com pré-requisito declarado em `roadmap/backlog.md` ("0018 mergeada"); inverte ordem de execução                                   |
| I     | **Novo arquivo `meta-rules.md`** para meta-regras do agente (model routing, plan mode, contexto enxuto), separando-as de princípios de engenharia | Limpa `global-rules.md` que hoje mistura "Princípios de Engenharia" + "Eficiência de IA" + "Workflow com IA"; aproveita opção E adicional do spec-driven research (§ 11) | Mais um arquivo; precisa decisão sobre nome (`meta-rules.md` vs `agent-rules.md` vs outro); cresce surface de adapter (claude/codex/gemini precisam saber dele) |

**Recomendação inicial (a confirmar pós-gate):** **D + E** como mínimo; **D + F** como upgrade controlado. Justificativa:

- **D** (Sub-eixo 1) endereça simultaneamente o critério editorial (audience) e a evidência empírica de posição (Lost-in-the-Middle) sem inverter a Spec 0008.
- **E** (Sub-eixo 2) é o caminho de menor risco: mantém arquitetura validada; deixa **F** disponível como adoção incremental se o Bloco B mostrar que `opt-in/` precisa de scoping antes da Spec 0011.
- **G** é alternativa séria se `[DEC-0018-B01]` resolver eixo primário em B/F (função editorial). **H** é prematuro (viola pré-requisito de 0011); **I** é preferência tática que cabe ser rediscutida durante reconciliação do b9efb83 (`[DEC-0018-B08]`) — onde "Eficiência de IA" e "Workflow com IA" estão hoje misturados.

**Cross-ref:** decisão de B02 cruza com `[DEC-0018-B03]` (orçamento) — qualquer arquitetura escolhida deve caber no teto agregado decidido em B03; cruza com `[DEC-0018-B06]` (fronteira 0011) — F/H antecipam parcialmente a Spec 0011.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Sub-eixo 1 — Critério-teste para classificar regra (marque com `x`):**
  - [ ] A (Audience: Cross-IA vs Adapter específica vs Opt-in)
  - [ ] B (Duplicação intolerável: igual em 2 adapters = global)
  - [ ] C (Escopo de injeção em runtime)
  - [ ] D (Híbrido A + Posição crítica: regras críticas vão pro topo)
- **Sub-eixo 2 — Arquitetura física (marque com `x`):**
  - [ ] E (Manter status quo flat: 1 global + 3 adapters + opt-in flat)
  - [ ] F (Hierarquia apenas por subdiretório dentro de `opt-in/`)
  - [ ] G (Split de `global-rules.md` em múltiplos arquivos temáticos)
  - [ ] H (Hierarquia full por subdiretório em todas as pastas)
  - [ ] I (Novo arquivo `meta-rules.md` exclusivo para metainstruções do agente)
- **Justificativa / Ressalvas:** >
- **Data / Owner:**

---

### [DEC-0018-B03] Orçamento de tokens

**Pergunta:** qual teto de tokens **por arquivo** e **agregado** para o `<AI_GUIDELINES>` compilado? Hard ceiling ou soft ceiling? Que enforcement (lint determinístico × audit por processo)? Que unidade canônica (tokens × linhas × instruções)?

**Contexto (research):**

- [`research/2026-04-30-tokens-baseline-budget.md`](./research/2026-04-30-tokens-baseline-budget.md) — medição instrumental dos 3 cenários compilados (min 3,3–3,8 K, qg 3,9–4,5 K, full 4,9–5,5 K tokens); distribuição por arquivo-fonte (drivers: `core` 32 %, `global-rules` 33 %, adapters 31 %); convergência de evidência externa que sustenta tetos; § 9 traz famílias de opções (granularidade, tipo de teto, valores numéricos, enforcement).
- [Anthropic Claude Code best-practices](https://code.claude.com/docs/en/best-practices) — _"Bloated CLAUDE.md files cause Claude to ignore your actual instructions"_, _"if a rule is getting lost, the file is probably too long"_; sem número absoluto.
- [HumanLayer "Writing a good claude.md"](https://www.humanlayer.dev/blog/writing-a-good-claude-md) — "<300 linhas, idealmente <60". Compilado-min está em 238 linhas (cabe); compilado-full em 381 (estoura).
- [MindStudio "Context rot in Claude Code skills"](https://www.mindstudio.ai/blog/context-rot-claude-code-skills-bloated-files) — "<2.000–3.000 tokens por skill file"; "exceeding the threshold = signal to audit, not to expand".
- [AGENTS.md / Hivetrail](https://hivetrail.com/blog/agents-md-vs-claude-md-cross-tool-standard) — "frontier LLMs reliably follow ~150–200 instructions"; budget por **instruction-count**, não tokens.
- [Cem Karaca, "My CLAUDE.md was eating 42K tokens"](https://medium.com/@cem.karaca/my-claude-md-was-eating-42-000-tokens-per-conversation-heres-how-i-fixed-it-85ffba809bd4) — trajetória empírica de inflação (150→1207 linhas / 2K→42K tokens em 9 meses).
- [Chroma "Context Rot" 2025](https://research.trychroma.com/context-rot) — degradação **a cada incremento** de comprimento, não só perto do limite anunciado.

**Estrutura das opções:** ponto **multi-dimensional**. 4 sub-eixos independentes (granularidade × tipo × valores × enforcement) — owner pode resolver cada um separadamente. Convenção: tokens medidos via Tok-H (banda alta, chars/3,5 — calibrada para PT-BR via tokens-baseline-budget § 3.2).

#### Sub-eixo 1 — Granularidade do teto

| Opção | Granularidade                      | Pró                              | Contra                                      |
| :---- | :--------------------------------- | :------------------------------- | :------------------------------------------ |
| A     | Apenas teto **agregado**           | Simples de medir e comunicar     | Ignora _drivers_ individuais inflados       |
| B     | Apenas teto **por arquivo**        | Localiza inflação cirurgicamente | Agregado pode crescer no acúmulo silencioso |
| C     | **Ambos** (por arquivo + agregado) | Defesa em profundidade           | Mais regra para manter / lintar             |

#### Sub-eixo 2 — Tipo de teto

| Opção | Tipo                                                  | Pró                                          | Contra                                                       |
| :---- | :---------------------------------------------------- | :------------------------------------------- | :----------------------------------------------------------- |
| D     | **Hard ceiling** (lint falha)                         | Enforcement determinístico                   | Bloqueia PR legítimo; tendência a "comentar pra desbloquear" |
| E     | **Soft ceiling + audit obrigatório**                  | Alinhado com MindStudio; preserva flex       | Enforcement por processo (humano); drift possível            |
| F     | **Soft → Hard escalonado** (aviso `≥ X`, falha `≥ Y`) | Aviso antes de bloquear; reduz fricção de PR | Mais complexo; 2 thresholds para manter                      |

#### Sub-eixo 3 — Valores numéricos

Posição atual (Tok-H): `core` 1.232; `global-rules` 1.273; max adapter (gemini) 502; max opt-in (qg) 630; **compilado-min** 3.815; **compilado-qg** 4.472; **compilado-full** 5.554.

| Opção | Teto agregado                                                  | Universal/file       | Adapter/file | Opt-in/file | Cabe o status atual?                                                                     |
| :---- | :------------------------------------------------------------- | :------------------- | :----------- | :---------- | :--------------------------------------------------------------------------------------- |
| G     | ≤ 4 K tokens                                                   | ≤ 1.000 tok          | ≤ 400 tok    | ≤ 800 tok   | **Não** — `core` 1.232 e `global-rules` 1.273 estouram universal; gemini estoura adapter |
| H     | ≤ 6 K tokens                                                   | ≤ 1.500 tok          | ≤ 600 tok    | ≤ 1.200 tok | **Sim** para min/qg/full atuais; pequena folga                                           |
| I     | ≤ 8 K tokens                                                   | ≤ 2.000 tok          | ≤ 800 tok    | ≤ 1.500 tok | **Sim** confortavelmente; folga grande                                                   |
| J     | ≤ 10 K tokens                                                  | ≤ 3.000 tok          | ≤ 1.500 tok  | ≤ 3.000 tok | **Sim** com folga; alinhado com MindStudio (≤ 3 K por arquivo)                           |
| K     | **% relativo**: ≤ 5 % de janela usável de 100 K (= 5 K tokens) | derivado do agregado | derivado     | derivado    | Equivalente numérico ao **H** mas com fundamento explícito                               |

#### Sub-eixo 4 — Enforcement / instrumentação

| Opção | Enforcement                                                                                                     | Pró                                 | Contra                                                   |
| :---- | :-------------------------------------------------------------------------------------------------------------- | :---------------------------------- | :------------------------------------------------------- |
| L     | **Manual** (revisão de PR / checklist)                                                                          | Sem código novo                     | Drift inevitável; depende de disciplina                  |
| M     | **Lint custom** em `cli/governance/monolith/` que mede chars (Tok-H) e falha por threshold                      | Determinístico; dentro do framework | Heurística pode divergir do tokenizer Anthropic em ±10 % |
| N     | **Lint via Anthropic [`messages.count_tokens`](https://docs.anthropic.com/en/api/messages-count-tokens)** em CI | Canônico (oficial)                  | Requer secret no CI; rate-limit; latência                |
| O     | **M (heurística como gate) + N opcional** (sanity check periódico off-CI)                                       | Compromisso pragmático              | 2 mecanismos; precisa documentar quando rodar N          |

#### Sub-eixo 5 — Unidade canônica documentada em `global-rules.md`

| Opção | Unidade primária                                                                | Pró                                                                | Contra                                                                            |
| :---- | :------------------------------------------------------------------------------ | :----------------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| P     | **Tokens** (com Tok-H como heurística)                                          | Mesma unidade dos modelos; converte direto para custo/sessão       | Heurística aproximada; precisa documentar metodologia                             |
| Q     | **Linhas**                                                                      | Direto medir em qualquer editor; alinhado com Anthropic/HumanLayer | Variável conforme prosa-densa vs bullets; razão tokens/linha cresce com o tamanho |
| R     | **Instruções** (item-count)                                                     | Alinhado com AGENTS.md/Hivetrail "150–200 instruções"              | Definição de "instrução" é ambígua (bullet vs frase vs parágrafo)                 |
| S     | **Multi-unidade**: tokens primário; linhas/instruções como derivadas auxiliares | Triangulação; cada unidade boa para um caso de uso                 | Mais pesado de comunicar                                                          |

**Recomendação inicial (a confirmar pós-gate):** **C + E + H + O + P** (com **S** como anotação informacional). Justificativa:

- **C** (granularidade dupla) — sem ambos, drift entra por algum lado.
- **E** (soft ceiling + audit) — alinhado com MindStudio "exceeding = signal to audit, not to expand"; preserva capacidade de exceção legítima sem virar escape hatch.
- **H** (≤ 6 K agregado / ≤ 1,5 K universal / ≤ 600 adapter / ≤ 1,2 K opt-in) — cabe o estado atual com ~6 % de folga no agregado; deixa espaço razoável para Bloco B sem permitir inflação descontrolada. **G** (4 K) é apertado demais (rebenta no estado atual); **I/J** abrem caminho para regredir (Cem Karaca month-3 caiu em 8 K com 400 linhas).
- **O** (lint heurístico no framework + count_tokens canônico off-CI) — determinismo onde dói (PR-time) sem acoplar CI a secret externa; sanidade canônica como auditoria periódica.
- **P** (tokens primário) — unidade que importa para o consumidor real; **Q/R** ficam derivadas em comentário pedagógico no `global-rules.md` ("≤ 6 K tokens ≈ ≤ 300 linhas ≈ ≤ 50 itens-âncora").

**Dependências:** `[DEC-0018-B02]` (colocação) deve respeitar este teto; `[DEC-0018-B06]` (fronteira 0011) usa este teto como trigger ("se o agregado cruzar X, Spec 0011 vira mandatória"); `[DEC-0018-B08]` (reconciliação b9efb83) precisa garantir que o conteúdo reconciliado caiba no teto.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Sub-eixo 1 — Granularidade do teto (marque com `x`):**
  - [ ] A (Apenas teto agregado final)
  - [ ] B (Apenas teto por arquivo individual)
  - [ ] C (Ambos: por arquivo + agregado)
- **Sub-eixo 2 — Tipo de teto (marque com `x`):**
  - [ ] D (Hard ceiling: lint CI falha o build)
  - [ ] E (Soft ceiling + Audit manual obrigatório via gate)
  - [ ] F (Soft → Hard escalonado: avisa primeiro, depois falha)
- **Sub-eixo 3 — Valores numéricos (marque com `x`):**
  - [ ] G (≤ 4 K tokens totais agregados)
  - [ ] H (≤ 6 K tokens totais agregados - tem folga segura hoje)
  - [ ] I (≤ 8 K tokens totais agregados)
  - [ ] J (≤ 10 K tokens totais agregados)
  - [ ] K (% relativo ao tamanho da janela de contexto)
- **Sub-eixo 4 — Enforcement / instrumentação (marque com `x`):**
  - [ ] L (Manual: checklist de revisão do PR)
  - [ ] M (Lint heurístico rodando localmente)
  - [ ] N (Lint via API da Anthropic no CI)
  - [ ] O (M local como gate + N como sanity check periódico)
- **Sub-eixo 5 — Unidade canônica documentada (marque com `x`):**
  - [ ] P (Tokens via Tok-H)
  - [ ] Q (Quantidade de Linhas de markdown)
  - [ ] R (Quantidade de Instruções)
  - [ ] S (Multi-unidade: tokens principal, linhas/instruções como referência)
- **Justificativa / Ressalvas:** >
- **Data / Owner:**

---

### [DEC-0018-B04] Formato do catálogo de regras

**Pergunta:** que campos cada regra carrega? Que convenção de ID (`[RULE-*]`, `[GR-*]`, `AIGL-*` paralelos ao `[BR-*]` da CLI)? Estrutura mínima por regra ou prosa livre? Frontmatter YAML por regra ou inline em arquivo monolítico?

**Contexto (research):**

- [`research/2026-04-30-benchmark-rules-content.md`](./research/2026-04-30-benchmark-rules-content.md) § 6.3 — quatro opções estruturadas: prosa livre + headings (Anthropic/OpenAI/Aider), frontmatter YAML por regra (Continue/Anthropic Skills), IDs inline com sintaxe leve (modelo `BR-*` já em uso aqui), estrutura mínima de compromisso (heading + ID + intent + body livre + verificação opcional).
- [`research/2026-04-30-external-bug-taxonomies.md`](./research/2026-04-30-external-bug-taxonomies.md) Anexo B — **esqueleto consolidado** de "regra bem documentada" derivado da interseção CWE / CERT / Sonar RSPEC / OWASP-LLM / ESLint. Campos: `id`, `name`, `type`, `severity`, `why_is_this_an_issue`, `noncompliant_example`, `compliant_example`, `exceptions`, `risk_assessment` (opcional CERT), `see_also` (cross-refs), `tags`, `applicable_languages`, `introduced_in_version`, `mode_of_introduction`.
- [`research/2026-04-30-spec-driven-tools-rules.md`](./research/2026-04-30-spec-driven-tools-rules.md) § 5–8 — Continue tem schema explícito (`name`, `globs`, `regex`, `alwaysApply`, `description`); Cursor `.mdc` tem frontmatter pareado a globs; Cline expande YAML; Spec Kit/BMAD/OpenSpec não impõem schema.
- [`research/2026-04-30-tokens-baseline-budget.md`](./research/2026-04-30-tokens-baseline-budget.md) — formato afeta densidade de tokens; frontmatter pesado infla cada regra.

**Estrutura das opções:** 3 sub-eixos: (1) **estrutura por regra**; (2) **convenção de ID**; (3) **organização físico-arquivo**.

#### Sub-eixo 1 — Estrutura por regra

| Opção | Estrutura                                                                                                                          | Pró                                                                                                                                                                 | Contra                                                                                                                         |
| :---- | :--------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------- |
| A     | **Prosa livre + headings** (Anthropic/OpenAI/Aider)                                                                                | Máxima legibilidade; barreira zero p/ contribuir; alinhado com 100 % dos provedores oficiais                                                                        | Sem rastreabilidade; teste/CI não tem âncora estável; diverge da convenção `BR-*` interna                                      |
| B     | **Frontmatter YAML por regra** (modelo Continue, RSPEC Sonar, esqueleto AnexoB completo)                                           | Schema completo; permite ferramental (linter/generator/busca por tag); padrão indústria                                                                             | Uma regra/arquivo explode quantidade de arquivos; monolito com múltiplos blocos YAML é não-padrão; atrito de contribuição alto |
| C     | **IDs inline com sintaxe leve** (`[GR-XXXX]` ou `[RULE-XXXX]` no início do bullet/heading; corpo prosa)                            | Rastreabilidade preservada sem schema pesado; convergente com `BR-*` interno; permite citar regra em PR/teste/ADR                                                   | Precisa de processo de alocação de IDs; risco de IDs órfãos se regras mudam de arquivo                                         |
| D     | **Estrutura mínima por regra** (heading H3 com ID curto + 1 frase de _intent_ + corpo livre + opcional _verificação_)              | Compromisso: rastreabilidade (ID) + navegabilidade (heading) + intent claro + verificabilidade — alinhado com Anthropic best-practice "give Claude a way to verify" | Estrutura nova; precisa adoção disciplinada; risco de variações inconsistentes se contribuidores ignorarem campos opcionais    |
| E     | **D + campos opcionais condicionais por categoria** (ex.: `severity` mandatório em `[RULE-SEC-*]` mas opcional em `[RULE-EDIT-*]`) | Combina rigor onde dói com flex onde cabe — espelha a recomendação **J** de `[DEC-0018-B01]` Sub-eixo 2 (tag de evidência)                                          | Mais complexo; precisa documentar quando cada campo é mandatório (mais ruído de boilerplate)                                   |

#### Sub-eixo 2 — Convenção de IDs

| Opção | Convenção                                                                                    | Pró                                                                                                                         | Contra                                                              |
| :---- | :------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| F     | `[RULE-NNNN]` global sequencial                                                              | Simples; espelha `BR-NNNN`                                                                                                  | Não codifica categoria; precisa lookup para entender domínio        |
| G     | `[RULE-<CAT>-NN]` (ex.: `[RULE-ENG-01]`, `[RULE-SEC-01]`, `[RULE-PROC-01]`)                  | Cat embutida no ID; legível                                                                                                 | Categoria fica acoplada ao ID; renomeação da categoria invalida IDs |
| H     | `[GR-NNNN]` para universal + `[OPT-<feature>-NN]` para opt-in + `[ADP-<ia>-NN]` para adapter | Codifica colocação no próprio ID; espelha arquitetura física (`global-rules.md` × `opt-in/*` × `adapters`)                  | 3 prefixos; precisa documentar; renomeação de feature invalida IDs  |
| I     | `AIGL-NNN` (alinhado com Anexo B do external-bug-taxonomies)                                 | Alinhado com sugestão research; "AI-Guidelines" embutido — útil quando regras vão para `roadmap/backlog.md` ou outras specs | Não diferencia categoria; só prefixa o framework                    |
| J     | **Misto**: prefixo por colocação (H) + campo `category` interno na regra                     | ID estável (não muda com renomeação de cat); colocação na cara                                                              | 2 lugares para classificar (ID + campo)                             |

#### Sub-eixo 3 — Organização físico-arquivo

| Opção | Onde regras vivem                                                                                               | Pró                                                                                      | Contra                                                                |
| :---- | :-------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| K     | **Status quo**: regras inline em `.core/rules/*.md` (monolito por arquivo)                                      | Zero churn; um lugar por arquivo                                                         | Catálogo cresce sem disciplina visual                                 |
| L     | **Catálogo separado** `.core/rules/catalog.md` linkado pelos arquivos canônicos                                 | Source-of-truth única; arquivos canônicos viram pointers                                 | Indireção; agente pode não seguir o link; reorganização do framework  |
| M     | **Continue-style**: `.core/rules/atomic/<rule>.md` com frontmatter (uma regra/arquivo)                          | Granularidade máxima; ferramental fácil; fácil shifting de regra                         | Explode número de arquivos; muda profundamente o compiler             |
| N     | **K + apêndice "Catálogo + cross-ref" em `.core/rules/catalog.md`** (resumo navegável; regras vivem onde estão) | Compromisso: regras seguem como inline (familiar) + catálogo dá visão global e cross-ref | Risco de drift entre catálogo e regras; precisa de lint cross-arquivo |

**Recomendação inicial (a confirmar pós-gate):** **D + H + N**. Justificativa:

- **D** (estrutura mínima) — barreira de contribuição baixa; rastreabilidade adequada; cabe no orçamento de tokens (frontmatter pesado de B inflaria cada regra ~30 tokens × n regras → conflito com `[DEC-0018-B03]`).
- **H** (prefixos por colocação) — leitor sabe imediatamente "isto é universal" vs "isto vem de feature X" só pelo ID; alinha com o critério de `[DEC-0018-B02]` (escopo de injeção).
- **N** (regras inline + catálogo separado) — preserva familiaridade e zero-churn nos arquivos canônicos; oferece visão global navegável; alinha com prática Sonar (RSPEC + see-also).
- **E** (Sub-eixo 1 estendido) é candidato sério se `[DEC-0018-B05]` cravar metodologia que demande severity/risk-assessment para categorias específicas. Owner pode escolher D agora e migrar para E em Stage 2 se eval evidenciar necessidade.
- **B** (frontmatter completo) é over-engineering hoje; reservado como evolução opcional (gatilhada se Spec 0009 / harness-engineering cravar enforcement automático).

**Dependências:** decisão depende de `[DEC-0018-B01]` (taxonomia define quais categorias prefixos H precisam representar) e influencia `[DEC-0018-B05]` (eval precisa de regra com formato estável). Owner pode escolher Sub-eixo 1 e 2 condicional ("D/H confirmados após B01 fechar").

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Sub-eixo 1 — Estrutura por regra (marque com `x`):**
  - [ ] A (Prosa livre + headings apenas)
  - [ ] B (Frontmatter YAML por regra: modelo Sonar/Continue completo)
  - [ ] C (IDs inline com sintaxe leve + corpo prosa)
  - [ ] D (Estrutura mínima: heading H3 + ID curto + intent + corpo + verify)
  - [ ] E (D + campos opcionais condicionais por categoria)
- **Sub-eixo 2 — Convenção de IDs (marque com `x`):**
  - [ ] F (`[RULE-NNNN]` global sequencial)
  - [ ] G (`[RULE-<CAT>-NN]` por categoria)
  - [ ] H (`[GR-NNNN]`, `[OPT-NNNN]`, `[ADP-NNNN]` por escopo de injeção)
  - [ ] I (`AIGL-NNN` genérico alinhado com taxonomias)
  - [ ] J (Misto: Prefixo de escopo H + campo `category` interno)
- **Sub-eixo 3 — Organização físico-arquivo (marque com `x`):**
  - [ ] K (Status quo: monolito inline em `.core/rules/*.md`)
  - [ ] L (Catálogo massivo em `.core/rules/catalog.md` + links)
  - [ ] M (Continue-style: `.core/rules/atomic/<rule>.md` 1 por arquivo)
  - [ ] N (K + apêndice com catálogo resumo/índice em `catalog.md`)
- **Justificativa / Ressalvas:** >
- **Data / Owner:**

---

### [DEC-0018-B05] Metodologia do eval mínimo

**Pergunta:** quantos prompts canônicos? Quais provedores (≥ 2)? Que métrica (kill-rate? passa/não-passa?)? Que threshold de corte? Como tratar não-determinismo do LLM? Que escopo cabe aqui (eval mínimo manual) vs Spec 0009 (harness automatizado)?

**Contexto (research):**

- [`research/2026-04-30-empirical-bugs-ai-code.md`](./research/2026-04-30-empirical-bugs-ai-code.md) § 7.2 — lições da literatura: SWE-Bench+ teve **47,93 % de falsos positivos** se confiar só em "passa/não-passa"; declarar a camada (modelo standalone vs agente vs agente-com-tools); cobrir múltiplas linguagens; problema de tamanho realista (snippets HumanEval-style não exibem race/memory/N+1); anti-leak por construção; múltiplas rodadas (Spracklen: 43 % dos hallucinated packages são **consistentes** entre runs). 3 opções estruturadas: A "narrow & deep", B "broad & shallow", C híbrido.
- [`research/2026-04-30-external-bug-taxonomies.md`](./research/2026-04-30-external-bug-taxonomies.md) § 10.2 — 4 opções complementares (combináveis): E1 "CERT Risk Assessment" (severity × likelihood × remediation cost); E2 "OWASP Top-10 factors" (incidence × exploitability × detectability); E3 "ESLint regression test" (golden examples + prompt-eval); E4 "Sonar RSPEC + see-also" (documentação rigorosa, sem prompt-eval). Síntese: **E4 obrigatório + E3 amostral**.
- [`research/2026-04-30-spec-driven-tools-rules.md`](./research/2026-04-30-spec-driven-tools-rules.md) — nenhuma das ferramentas SDD pesquisadas (Spec Kit, BMAD, OpenSpec, Continue, Aider, Cursor, Cline) implementa eval de "regra cumpre seu propósito". Eval contra modelo é território não-padronizado.
- Contexto de operação: framework é PT-BR; provedores alvo são Claude, Codex, Gemini (matching `.core/rules/{claude,codex,gemini}.md`); custo de inference é da owner (sem CI Anthropic key configurada); volume aceitável de eval semanal/mensal é restrito.

**Estrutura das opções:** as opções são naturalmente **multi-dimensionais** e parcialmente **combináveis** (uma metodologia é um vetor: largura × profundidade × tipo-de-asserção × ferramenta de medição). 5 sub-eixos.

#### Sub-eixo 1 — Largura × profundidade

| Opção | Forma                                                                                                    | Pró                                                                   | Contra                                                               |
| :---- | :------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------- | :------------------------------------------------------------------- |
| A     | **Narrow & deep**: 3–5 cenários cobrindo exatamente as categorias de B01, com mutation + inspeção humana | Calibrado; mensura efeito da regra; alinhado com tamanho do framework | Caro; cobertura editorial limitada                                   |
| B     | **Broad & shallow**: dezenas de cenários auto-rodáveis, métrica simples (pass/fail + scanner CWE)        | Amplo; replicável; barato                                             | Vícios SWE-bench-like; falsos positivos altos                        |
| C     | **Híbrido**: B amplo para regressão CI; A trimestral para calibração                                     | Compromisso entre cobertura e custo                                   | 2 mecanismos para manter; precisa de governance de quando rodar cada |

#### Sub-eixo 2 — Tipo de asserção (o que se mede)

| Opção | Asserção                                                                                                               | Pró                                                                                               | Contra                                                                               |
| :---- | :--------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- |
| D     | **Pass/Fail por cenário** (modelo Aider eval, HumanEval)                                                               | Simples; binário                                                                                  | 47,93 % de falsos positivos em SWE-Bench+; subestima regras semânticas               |
| E     | **Mutation kill-rate** (regra "mata" o mutante introduzido?)                                                           | Empírico; mede efeito da regra contra _bug-shape_; alinha com Quality Gates feature (≥ 60 % kill) | Requer pipeline de mutation testing; caro; só aplica a regras detectáveis em código  |
| F     | **Delta comportamental**: rodar IA com regra × sem regra; medir mudança de comportamento contra golden examples (E3)   | Mensura **o efeito da regra na IA** (não só formulação); empirista                                | Requer infra de eval (test runner contra modelo); custo alto; golden set para manter |
| G     | **Documentação obrigatória** (E4 — RSPEC mínima): each rule has Why / Noncompliant / Compliant / Exceptions / See-also | Barato; alinha com prática indústria; ergonômico; bom para regras editoriais não auto-rodáveis    | Não mede efeito na IA — só formaliza documentação                                    |
| H     | **G + F amostral**: G obrigatório em toda regra; F só para subset crítico (regras com tag "Forte" de B01-J)            | Compromisso pragmático: rigor onde dói, doc-only onde basta                                       | Precisa critério para "subset crítico" (cross-ref tag B01)                           |

#### Sub-eixo 3 — Provedores e quantidade

| Opção | Provedores                                                                   | Pró                                                                                                                                                  | Contra                                                             |
| :---- | :--------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------- |
| I     | **1 provedor** (Claude, paritário ao framework principal)                    | Custo mínimo; rápido                                                                                                                                 | Não detecta variação cross-IA; risco de regra IA-específica passar |
| J     | **2 provedores** (Claude + Gemini, ou Claude + GPT)                          | Cobre divergência cross-IA; alinhado com [`empirical-bugs § 7.2`](./research/2026-04-30-empirical-bugs-ai-code.md) "Cobrir múltiplas linguagens/IAs" | Custo dobra; 2 chaves para gerenciar                               |
| K     | **3 provedores** (Claude + Codex + Gemini, paritários aos adapters)          | Coerente com a estrutura `.core/rules/{claude,codex,gemini}.md`; cobre todos os adapters                                                             | Custo triplica; chaves múltiplas; tempo de eval maior              |
| L     | **2 provedores + 1 fallback** (Claude + Gemini com Codex como backup ad-hoc) | Compromisso de custo + cobertura                                                                                                                     | Heurística "quando rodar fallback?" precisa documentação           |

#### Sub-eixo 4 — Não-determinismo

| Opção | Como tratar                                                                                      | Pró                                                                         | Contra                                                       |
| :---- | :----------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------- | :----------------------------------------------------------- |
| M     | **Single-shot, temperature = 0**                                                                 | Determinístico; reprodutível; simples                                       | Não captura variabilidade real (consumidores rodam temp > 0) |
| N     | **N=3 rodadas, reportar passa-rate** (alinha com Spracklen: 43 % de hallucinations consistentes) | Captura variabilidade; permite distinguir bug determinístico de estocástico | Custo 3 ×; precisa decidir threshold (passa em 2/3? 3/3?)    |
| O     | **N=5 + bootstrap CI**                                                                           | Robusto estatisticamente                                                    | Custo alto; over-engineering para eval mínimo                |

#### Sub-eixo 5 — Threshold de corte

| Opção | Threshold                                                                                                 | Pró                                                       | Contra                                                    |
| :---- | :-------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------- | :-------------------------------------------------------- |
| P     | **Hard**: regra reprovada em ≥ X % das rodadas → cortada                                                  | Determinístico; força corte                               | Pode cortar regra útil que apenas precisa de reformulação |
| Q     | **Soft**: regra reprovada → flag em `NEXT.md` como débito de revisão; reavalia em próxima rodada          | Preserva regra; permite iteração editorial                | Drift inevitável se débitos não forem trabalhados         |
| R     | **Categorizado**: regras com tag "Forte" (B01-J) seguem P; regras com tag "Heurística declarada" seguem Q | Rigor onde dói; flex onde a regra é assumidamente opinião | 2 regimes; precisa documentar                             |

**Recomendação inicial (a confirmar pós-gate):** **C + H + J + N + R** como vetor candidato:

- **C** (híbrido) — ataca o tradeoff custo × cobertura sem cravar um lado.
- **H** (G obrigatório + F amostral) — endereça o achado central de [`empirical-bugs § 7.2`](./research/2026-04-30-empirical-bugs-ai-code.md): documentação rigorosa para todas; eval real para regras críticas. Síntese E4 + E3 do `external-bug-taxonomies` confirma.
- **J** (2 provedores) — Claude paritário ao adapter principal + Gemini para detectar variação cross-IA. **K** (3 provedores) é mais alinhado mas custa 50 % mais; deixar como upgrade pós-validação.
- **N** (3 rodadas) — captura não-determinismo sem inflar para over-engineering; passa-rate de **2/3** como default plausível (3/3 estoura em qualquer flutuação).
- **R** (categorizado) — espelha tag de evidência decidida em `[DEC-0018-B01]` Sub-eixo 2 / opção J.

**Não-recomendar pré-gate:** **D** (pass/fail puro) sozinho — falsos positivos altos demais; **E** (mutation) sozinho — só aplica a regras detectáveis em código, exclui editoriais. **I** (1 provedor) — não detecta o problema central de variação cross-IA.

**Cross-ref para `[DEC-0018-B07]`:** este eval mínimo é seed; a versão automatizada/agente-validador/gate fica para Spec 0009 (harness-engineering). Fronteira definida em B07.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Sub-eixo 1 — Largura × Profundidade (marque com `x`):**
  - [ ] A (Narrow & deep: 3-5 cenários aprofundados com inspeção humana)
  - [ ] B (Broad & shallow: dezenas de cenários auto-rodáveis simplificados)
  - [ ] C (Híbrido: B para regressão em CI, A trimestral para calibração)
- **Sub-eixo 2 — Tipo de asserção (marque com `x`):**
  - [ ] D (Pass/Fail por cenário)
  - [ ] E (Mutation kill-rate)
  - [ ] F (Delta comportamental contra golden examples)
  - [ ] G (Apenas verificação documental no padrão Sonar/RSPEC)
  - [ ] H (Híbrido: G obrigatório para todas, F apenas por amostragem nas críticas)
- **Sub-eixo 3 — Provedores e quantidade (marque com `x`):**
  - [ ] I (1 provedor: apenas Claude)
  - [ ] J (2 provedores: Claude + Gemini para divergência)
  - [ ] K (3 provedores: Claude + Codex + Gemini)
  - [ ] L (2 provedores + 1 fallback sob demanda)
- **Sub-eixo 4 — Não-determinismo (marque com `x`):**
  - [ ] M (Single-shot, temperature 0)
  - [ ] N (3 rodadas, considerando taxa de passe ex: 2/3)
  - [ ] O (5 rodadas com bootstrap no CI)
- **Sub-eixo 5 — Threshold de corte (marque com `x`):**
  - [ ] P (Hard: reprovou no % exigido, é cortada da codebase)
  - [ ] Q (Soft: reprovou, vira débito listado em `NEXT.md`)
  - [ ] R (Categorizado: Hard para críticas, Soft para opinativas/heurísticas)
- **Justificativa / Ressalvas:** >
- **Data / Owner:**

---

### [DEC-0018-B06] Fronteira com Spec 0011 (regra-hierarquia)

**Pergunta:** em que **gatilho mensurável** a hierarquia por subdiretório (Spec 0011) deixa de ser "feature requested" e vira mandatória? Que débitos a Spec 0018 declara em `NEXT.md` para passar à 0011? Que partes de organização hierárquica esta spec **antecipa** vs **adia**?

**Contexto (research):**

- [`roadmap/backlog.md`](../../roadmap/backlog.md) linhas 90–95 — Spec 0011 está em "Now"; pré-requisito declarado: "Spec 0008 mergeada" + "decidir se hierarquia espelha layout do consumidor ou usa namespacing dentro de `.ai-guidelines/rules/<topic>/`". **Sinal-de-pronto** documentado: "quando `global-rules.md` consolidado da 0008 inflar (>200 linhas) ou consumidor reclamar que regras de domínios diferentes todo mundo lê tudo". O baseline atual de `global-rules.md` é **37 linhas / 1.273 tokens** ([`tokens-baseline-budget § 4.2`](./research/2026-04-30-tokens-baseline-budget.md)).
- [`research/2026-04-30-tokens-baseline-budget.md`](./research/2026-04-30-tokens-baseline-budget.md) § 8.3 — três triggers candidatos derivados de evidência: (1) agregado compilado ≥ X tokens (X depende de `[DEC-0018-B03]`); (2) número de arquivos opt-in ≥ Y (atual: 3 + 2 variantes EN; sugestivamente 8–10); (3) instruções/regras agregadas ≥ 150 (referência AGENTS.md "150–200 instruções").
- [`research/2026-04-30-spec-driven-tools-rules.md`](./research/2026-04-30-spec-driven-tools-rules.md) § 11 (B06) — **fronteira sugerida**: Spec 0018 define **conteúdo e taxonomia**; Spec 0011 define **governança da mudança e organização hierárquica** (quem pode editar, como propagar, amendment vs delta). Não há overlap semântico. OpenSpec delta specs e Cline AI-editable rules sugerem padrões para 0011.
- [`research/2026-04-30-benchmark-rules-content.md`](./research/2026-04-30-benchmark-rules-content.md) § 4 — **convergência absoluta**: Anthropic/OpenAI/Google/Continue todos implementam "hierarquia por proximidade no filesystem"; é o único mecanismo unânime de scoping. Spec 0011 alinha com esse padrão.

**Estrutura das opções:** 3 sub-eixos: (1) **fronteira semântica** (o que pertence a qual spec); (2) **gatilho de transição** (quando 0011 vira mandatória); (3) **conteúdo do `NEXT.md`**.

#### Sub-eixo 1 — Fronteira semântica

| Opção | Fronteira                                                                                                                                 | Pró                                                                                           | Contra                                                                           |
| :---- | :---------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| A     | **0018: conteúdo + taxonomia + colocação rasa; 0011: hierarquia profunda (subdiretórios)**                                                | Preserva separação clean; 0018 entrega resultado tangível; 0011 vira responsabilidade isolada | Se `[DEC-0018-B02]` escolher F (subdiretório em opt-in/), antecipa parte da 0011 |
| B     | **0018 entrega TUDO inclusive hierarquia inicial; 0011 entrega apenas governança da mudança** (amendment, delta-spec, compliance)         | Spec 0018 fica completa em escopo                                                             | Inflar 0018; aumentar PR; arrastar prazo                                         |
| C     | **0018 entrega taxonomia + sinaliza 0011; 0011 absorve qualquer pendência hierárquica**                                                   | Mínimo escopo para 0018; 0011 absorve toda a complexidade                                     | Se hierarquia for necessária para enforcement de B03 (orçamento), bloqueia 0018  |
| D     | **0018 = taxonomia + colocação atual + organização lógica via prefixos de ID** (B04 H/J); 0011 = organização física por subdiretório real | Compromisso: organização cognitiva entrega valor agora; organização física fica para 0011     | Prefixos de ID podem virar inconsistentes se 0011 mudar a colocação              |

#### Sub-eixo 2 — Gatilho de transição (quando 0011 vira mandatória)

| Opção | Gatilho                                                                                                       | Pró                                                                        | Contra                                                                                                                         |
| :---- | :------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| E     | **Por linhas de `global-rules.md`** (status quo do backlog: > 200 linhas)                                     | Já documentado; familiar                                                   | Linhas variam com prosa-densa vs bullet; ver [`tokens-baseline-budget § 3.3`](./research/2026-04-30-tokens-baseline-budget.md) |
| F     | **Por tokens agregados do compilado** (ex.: ≥ 70 % do teto agregado decidido em `[DEC-0018-B03]`)             | Coerente com B03; mensurável; alinha com evidência empírica de context-rot | Acoplado a B03; precisa lint para checar                                                                                       |
| G     | **Por número de arquivos opt-in** (ex.: ≥ 8 arquivos)                                                         | Direto; sinaliza scoping necessário                                        | Conta arquivos, não conteúdo; arquivos podem variar muito de tamanho                                                           |
| H     | **Por número de regras agregadas** (item-count, ex.: ≥ 100 regras totais; ref AGENTS.md "150–200 instruções") | Alinha com convenção AGENTS.md                                             | Definição de "regra/instrução" é ambígua se B04 escolher D (estrutura mínima)                                                  |
| I     | **Múltiplo (E + F + G)**: qualquer um dispara                                                                 | Defesa em profundidade; primeiro gatilho que dispara é o que vale          | 3 medições para acompanhar                                                                                                     |
| J     | **Subjetivo**: "quando consumidor reclamar de regras misturadas"                                              | Aceita feedback empírico real                                              | Sem trigger objetivo; pode arrastar arbitrariamente                                                                            |

#### Sub-eixo 3 — Conteúdo do `NEXT.md` (débitos para Spec 0011)

| Opção | Que débitos declarar                                                                                                                                                                       | Pró                                                    | Contra                                                              |
| :---- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------- | :------------------------------------------------------------------ |
| K     | **Mínimo**: declarar gatilho escolhido em Sub-eixo 2 + cross-ref para 0011                                                                                                                 | Curto; foco                                            | Pode esquecer detalhes editoriais de B01/B04 que importam para 0011 |
| L     | **K + lista de regras candidatas a hierarquização** (subset que claramente quer subdiretório próprio)                                                                                      | Concreto; quem trabalhar 0011 não começa do zero       | Lista pode ficar obsoleta se reconciliação b9efb83 mudar regras     |
| M     | **L + decisão sobre namespacing**: hierarquia espelha layout do consumidor (`api/AGENTS.md`) ou namespacing interno (`.ai-guidelines/rules/<topic>/`) — pré-requisito declarado em backlog | Resolve antecipadamente o pré-requisito                | Pode antecipar decisão que cabe na 0011                             |
| N     | **K + apêndice "estado canônico do `<AI_GUIDELINES>` ao fim da 0018"** (medição de tokens, listagem de regras, taxonomia final)                                                            | Snapshot útil para 0011 começar com baseline conhecido | Mais conteúdo no `NEXT.md` (que será deletado no encerramento)      |

**Recomendação inicial (a confirmar pós-gate):** **A + I + N**:

- **A** (fronteira clean) — preserva escopo; 0018 entrega valor sem inflar; 0011 fica isolada e endereçável independentemente.
- **I** (gatilho múltiplo E+F+G) — primeiro a disparar é o sinal real; **F** (tokens) é o mais empírico; **E** e **G** capturam dimensões diferentes que F sozinho perde.
- **N** (NEXT.md mínimo + snapshot canônico) — minimiza prosa em arquivo descartável; entrega contexto operacional concreto.

**Caso especial:** se `[DEC-0018-B02]` Sub-eixo 2 escolher **F** (hierarquia por subdiretório dentro de `opt-in/`), a fronteira deste B06 muda para **D** (Sub-eixo 1) — a hierarquia inicial fica em 0018; 0011 só absorve governança da mudança. Owner deve decidir B02 e B06 em sequência ou marcá-los como dependentes.

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Sub-eixo 1 — Fronteira semântica (marque com `x`):**
  - [ ] A (0018 taxonomia rasa / 0011 hierarquia profunda real)
  - [ ] B (0018 entrega tudo, 0011 faz só governança/amendments)
  - [ ] C (0018 sinaliza taxonomia, 0011 absorve o resto)
  - [ ] D (0018 lógica por prefixos ID, 0011 faz as pastas)
- **Sub-eixo 2 — Gatilho de transição p/ a 0011 virar mandatória (marque com `x`):**
  - [ ] E (Por volume de linhas do global-rules)
  - [ ] F (Por tokens agregados, cruzando 70% do teto)
  - [ ] G (Por quantidade de arquivos opt-in criados)
  - [ ] H (Por quantidade total de regras/instruções)
  - [ ] I (Qualquer um dos acimas: E + F + G)
  - [ ] J (Subjetivo, reclamação do usuário)
- **Sub-eixo 3 — Conteúdo de débito do NEXT.md (marque com `x`):**
  - [ ] K (Apenas gatilho e link)
  - [ ] L (K + lista de regras suspeitas precisando hierarquia)
  - [ ] M (L + decisão do namespacing antecipada)
  - [ ] N (K + apêndice com snapshot de medição ao fim da 0018)
- **Justificativa / Ressalvas:** >
- **Data / Owner:**

---

### [DEC-0018-B07] Fronteira com Spec 0009 (harness-engineering)

**Pergunta:** o eval mínimo decidido em `[DEC-0018-B05]` é **seed** para Spec 0009 (harness-engineering). Que parte fica aqui (eval manual, registrado em research) e que parte fica para 0009 (harness automatizado, agente validador separado, sensores em CI, integração com `/ultra-review`)? Que débitos declarar em `NEXT.md`?

**Contexto (research):**

- [`roadmap/backlog.md`](../../roadmap/backlog.md) linhas 97–104 — Spec 0009 está em "Next"; **fonte do insight**: Uncle Bob via Lucas Montano (cyclomatic complexity, mutation testing); "Vai Faltar Dev 2027" (bugs típicos de IA invisíveis em review humano: N+1, race conditions, memory leaks). **Cross-ref Spec 0008-E**: 0008 entrega o **checklist editorial**; 0009 entrega a **implementação técnica**. **Tipos de falha que spec-driven não resolve sozinho**: amnésia entre sessões, falso "done", implementador e validador no mesmo processo, slop acumulado (degradação 5–10 %/iteração), bugs de IA invisíveis em review humano. **Escopo potencial**: agente validador separado com contrato "um-a-um"; sensores automáticos obrigatórios; evaluation como gate; integração com `/ultra-review`. **Custo de adoção**: elevado — multi-agent + sensors em cada feature = 2–3 × tokens por PR. **Sinal-de-pronto**: usuário rodar `/clear` e novo agente não conseguir retomar; ou PR precisar de 3+ rounds de correção que sensor automático pegaria.
- [`research/2026-04-30-empirical-bugs-ai-code.md`](./research/2026-04-30-empirical-bugs-ai-code.md) § 7.2 — eval mínimo desta spec é manual/episódico; harness é eval contínuo/automático. As lições gerais (declarar a camada, anti-leak, múltiplas rodadas, golden examples) **continuam aplicáveis** ao harness — esta spec **planta as fundações metodológicas**, 0009 **as instrumenta**.
- [`research/2026-04-30-spec-driven-tools-rules.md`](./research/2026-04-30-spec-driven-tools-rules.md) § 11 (B07) — observação metodológica: nenhuma das ferramentas SDD pesquisadas implementa o equivalente do harness 0009. É território fronteira.
- Observação meta: a research file `spec-driven-tools-rules` § 11 (B07) **erroneamente** descreve Spec 0009 como "visibilidade pública / npm orgs". A descrição correta consta no `roadmap/backlog.md` e no header deste ponto: 0009 é **harness-engineering**. Tratado como erro tipográfico do research; não invalida demais conclusões.

**Estrutura das opções:** 3 sub-eixos: (1) **escopo do que fica em 0018**; (2) **escopo do que vai para 0009**; (3) **artefatos de transição** (o que registrar em research/NEXT.md para 0009 começar bem).

#### Sub-eixo 1 — Escopo retido em 0018 (eval mínimo)

| Opção | Escopo retido                                                                                                                       | Pró                                                         | Contra                                                            |
| :---- | :---------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------- | :---------------------------------------------------------------- |
| A     | **Apenas documentação metodológica** (RSPEC mínima por regra — opção G de B05). Nenhuma rodada de eval real é executada nesta spec. | Custo zero; foca no editorial                               | Não valida o catálogo; B08 (reconciliação) fica sem evidence-base |
| B     | **A + 1 rodada manual de eval** (single-shot por regra crítica) registrada em `research/2026-04-30-eval-results.md` (novo)          | Provê evidence-base para B08; sinaliza viabilidade          | Custo moderado; resultados single-shot têm reservas (cf. B05)     |
| C     | **A + N rodadas manuais** (vetor de B05 escolhido) registradas em `research/2026-04-30-eval-results.md`                             | Cumpre o que B05 cravar; calibra B08 com rigor              | Custo significativo; pode arrastar prazo da 0018                  |
| D     | **A + B amostral (subset crítico)** + débito de "rodar full eval em ciclo de 0009"                                                  | Compromisso: começa com baseline + transfere ônus para 0009 | Subset arbitrário; precisa documentar critério                    |

#### Sub-eixo 2 — Escopo transferido para 0009

| Opção | Escopo transferido                                                                                                                | Pró                                                             | Contra                                                            |
| :---- | :-------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------- | :---------------------------------------------------------------- |
| E     | **Tudo automatizado**: agente validador separado, sensores CI, integração `/ultra-review`, eval em CI                             | Escopo claro; 0009 é "trazer eval ao runtime"                   | 0009 fica grande; reduz pressão para entregar partes incrementais |
| F     | **Tudo automatizado + governance** (matriz de quando rodar eval: PR, nightly, release)                                            | Endereça custo (2–3 × tokens) com política de quando rodar      | Mais escopo para 0009; pode arrastar                              |
| G     | **Apenas o agente validador + sensores básicos**; eval pleno fica para uma terceira spec ainda não nomeada                        | Reduz escopo de 0009; permite incremento                        | Cria dependência futura indefinida                                |
| H     | **E + adoção do eval mínimo de 0018 como _baseline regression_** (qualquer mudança em rules invalida eval; precisa rodar de novo) | Eval baseline-driven; combina com `[DEC-0018-B03]` (re-medição) | Acoplamento eval ↔ catálogo; precisa de governance de invalidação |

#### Sub-eixo 3 — Artefatos de transição

| Opção | Artefatos a deixar prontos                                                                                                                                           | Pró                                                 | Contra                                                                     |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------- | :------------------------------------------------------------------------- |
| I     | **Mínimo**: `NEXT.md` com pointer para 0009 + cross-ref a `[DEC-0018-B05]`                                                                                           | Curto                                               | 0009 começa quase do zero                                                  |
| J     | **I + research congelado em `.specify/specs/researchs/<dom>/`** (todos os 5 researches da 0018 são reutilizáveis; B05 + empirical-bugs são particularmente valiosos) | Reaproveitamento direto; alinhado com lifecycle SDD | _(é o que F9.2 do encerramento já fará — trivial)_                         |
| K     | **J + golden examples codificados** (se B05 escolheu F/H — delta comportamental — os golden examples já podem ser commitados em `.core/eval/<rule-id>.md`)           | 0009 herda corpus pronto                            | Acoplamento eval ↔ rule-id; renomeação invalida; mais arquivos para manter |
| L     | **K + skeleton de instrumentação** (esqueleto de script para rodar eval contra modelo, sem chave configurada — pronto para 0009 acoplar)                             | 0009 herda código + corpus                          | Antecipa decisão arquitetural de 0009 (qual SDK, qual provider abstrair)   |

**Recomendação inicial (a confirmar pós-gate):** **D + H + J**:

- **D** (eval amostral em 0018) — provê evidence-base para `[DEC-0018-B08]` (reconciliação) sem inflar 0018; aceita explicitamente que eval pleno é para 0009.
- **H** (todo o automatizado em 0009 + eval mínimo como baseline-regression) — preserva o trabalho desta spec como _âncora canônica_; mudanças em rules são re-evaluadas pelo harness.
- **J** (research congelado + cross-ref no NEXT.md) — caminho de menor antecipação; **K** e **L** são candidatos sérios mas dependem de escolhas de B05 (F/H delta comportamental) e arrastam decisão arquitetural de 0009 (qual SDK, qual abstração) — não cabem em Stage 1.

**Cross-ref para `[DEC-0018-B05]`:** **D** só faz sentido se B05 escolher H (G obrigatório + F amostral). Owner pode escolher D condicional ("D se B05 fechar em H/C; senão A").

**Cross-ref para `[DEC-0018-B08]`:** evidência produzida em D alimenta B08 (critério "tem source/passa eval?"). Sem D, B08 fica sem evidence-base e cai em opção A do próprio B08 ("manter como heurística declarada").

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Sub-eixo 1 — Escopo retido na 0018 (marque com `x`):**
  - [ ] A (Nenhum teste. Apenas a documentação RSPEC)
  - [ ] B (A + 1 rodada de eval manual em regra crítica salva em research)
  - [ ] C (A + Múltiplas rodadas manuais salvas em research)
  - [ ] D (A + B amostral + Débito pra 0009 automatizar)
- **Sub-eixo 2 — Escopo transferido pra 0009 (marque com `x`):**
  - [ ] E (Tudo: validador, CI, ultra-review, etc)
  - [ ] F (E + política de release governance)
  - [ ] G (Apenas validador base + sensores)
  - [ ] H (E + O teste manual da 0018 vira baseline no CI da 0009)
- **Sub-eixo 3 — Artefatos de transição em NEXT.md (marque com `x`):**
  - [ ] I (Mínimo: link pra 0009)
  - [ ] J (I + Papers de pesquisa congelados em pastas para a 0009 ler)
  - [ ] K (J + Golden examples já salvos em `.core/eval/`)
  - [ ] L (K + Esqueleto de código bash/node para a 0009 herdar)
- **Justificativa / Ressalvas:** >
- **Data / Owner:**

---

### [DEC-0018-B08] Política de reconciliação do conteúdo b9efb83

**Pergunta:** para cada regra do conteúdo mergeado em `b9efb83` (20 itens em `global-rules.md` + 4 categorias em `quality-gates.md`), que critério aplicar (manter / revisar / reverter)? Critério é "tem source"? "Passa eval"? Combinação? Quem é a unidade de decisão (regra-a-regra × bloco × seção)?

**Contexto (research):**

- [Anexo do `plan.md`](./plan.md) — resumo do conteúdo de `b9efb83`. **`global-rules.md` (20 itens em 3 seções)**: _Princípios de Engenharia_ (7: PT-BR, não modificar arquivos críticos sem confirmação, acesso seguro a chaves, tipagem estrita, estado/imutabilidade, fail-fast, concorrência explícita); _Eficiência de IA_ (5: model routing, feedback cirúrgico, modularidade, redução de ruído, check de contexto); _Workflow com IA_ (8: plan mode, referenciar padrão existente, PR description colaborativo, patterns agnósticos, padrões-não-paths, RPI obrigatório, contexto enxuto, routing de esforço). **`quality-gates.md` (4 categorias)**: análise estática, cobertura+mutação (≥85 %/≥60 % kill), sensores de bugs típicos de IA (N+1, race conditions, memory leaks — _declarativo, sem fonte_), security & secrets.
- [`research/2026-04-30-empirical-bugs-ai-code.md`](./research/2026-04-30-empirical-bugs-ai-code.md) § 4 (verificação dos sensores) e § 7.3 (3 opções estruturadas A/B/C). Achado: **dos 3 sensores do b9efb83, race conditions e memory leaks têm evidência empírica média a moderada (concorrência em CONCUR; software aging studies); N+1 não aparece como categoria autônoma em nenhuma taxonomia consultada — é heurística de engenharia sem suporte empírico direto**. Ver § 4 para detalhes.
- [`research/2026-04-30-external-bug-taxonomies.md`](./research/2026-04-30-external-bug-taxonomies.md) — taxonomias maduras (CWE, CERT, Sonar, OWASP-LLM) **não tratam N+1 como categoria autônoma**. Aparece, quando aparece, como sub-padrão dentro de "performance" ou "code-smell".
- [`research/2026-04-30-tokens-baseline-budget.md`](./research/2026-04-30-tokens-baseline-budget.md) § 4.2 — `global-rules.md` pós-b9efb83 pesa **1.114–1.273 tokens / 37 linhas / 33 % do compilado-min**. Qualquer revisão (manter, expandir, reverter) tem efeito direto no orçamento de `[DEC-0018-B03]`.
- [`research/2026-04-30-benchmark-rules-content.md`](./research/2026-04-30-benchmark-rules-content.md) § 5 — anti-padrões observados em `CLAUDE.md` de produção: **"Regras hipotéticas sem ancoragem"**, _"Toda linha deve traçar de volta a um incidente real"_; **"Regras sem fonte/owner"** — em catálogos curados, regras frequentemente não declaram autoria/data, problema de auditabilidade. b9efb83 cai exatamente nesses anti-padrões.

**Estrutura das opções:** ponto multidimensional. Sub-eixos: (1) **unidade de decisão**; (2) **critério de manter/revisar/reverter**; (3) **artefato de registro**.

#### Sub-eixo 1 — Unidade de decisão

| Opção | Unidade                                                                                                                                    | Pró                                                  | Contra                                                                   |
| :---- | :----------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------- | :----------------------------------------------------------------------- |
| A     | **Regra-a-regra** (24 itens individuais decididos)                                                                                         | Granularidade máxima; preserva o que é bom           | Custo de revisão alto; risco de inconsistência cross-regra               |
| B     | **Por seção** (3 seções de `global-rules` + 4 categorias de `quality-gates`)                                                               | Custo moderado; respeita a estrutura editorial atual | Pode forçar manter regra ruim que esteja numa seção majoritariamente boa |
| C     | **Bloco inteiro** (todo b9efb83 vai por uma única política)                                                                                | Decisão rápida                                       | Joga fora regras boas com regras ruins (ou vice-versa)                   |
| D     | **Híbrido** (regra-a-regra para `quality-gates` que é onde a evidência aponta lacunas; por seção para `global-rules` que é mais editorial) | Calibra rigor com onde dói                           | Precisa de critério para "dor"                                           |

#### Sub-eixo 2 — Critério de manter/revisar/reverter

| Opção | Critério                                                                                                                                                                                               | Pró                                                                          | Contra                                                                                             |
| :---- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| E     | **Tem source explícita?** (≥ 1 fonte CWE/CERT/Sonar/OWASP/paper) → manter; sem source → reverter                                                                                                       | Empirista puro                                                               | Cor regras editoriais (PT-BR, plan mode, RPI obrigatório) não têm CWE — viraria reverso falsamente |
| F     | **Passa eval?** (eval mínimo de B05 mostra delta comportamental positivo)                                                                                                                              | Mensura efeito real; usa o que B05 cravar                                    | Caro; acoplado à execução do eval (depende de B07 também); regras editoriais podem não testar bem  |
| G     | **Categorizado por tipo de regra**: regras editoriais (PT-BR, plan mode) → manter (são convenção interna); regras de defeito (sensores QG) → exigir source; regras de processo → manter se replicáveis | Espelha a tag de evidência de `[DEC-0018-B01]` Sub-eixo 2 (J — categorizado) | 3 regimes para manter; precisa critério para classificar                                           |
| H     | **Combinação E+F**: source obrigatória; eval valida quando source for fraca                                                                                                                            | Defesa em profundidade                                                       | Custo combinado; regras editoriais ficam ainda em zona cinza                                       |
| I     | **Manter status quo + reverter apenas o claramente sem evidência** (N+1; outras heurísticas declaradamente sem source)                                                                                 | Custo mínimo; preserva trabalho                                              | Reincide no problema-raiz da 0018: aceita conteúdo sem evidence-base                               |

#### Sub-eixo 3 — Artefato de registro da decisão

| Opção | Artefato                                                                                                                                   | Pró                                                          | Contra                                                                |
| :---- | :----------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------- | :-------------------------------------------------------------------- |
| J     | **Tabela inline em `plan.md` v2** (regra/decisão/justificativa)                                                                            | Tudo num arquivo já consultado                               | `plan.md` cresce; tabela longa pode embotar leitura                   |
| K     | **Apêndice em `plan.md` v2** (separado, "📎 Reconciliação b9efb83")                                                                        | Isolado; não inflar o corpo do plan                          | Apêndice cresce também                                                |
| L     | **Arquivo dedicado** `research/2026-04-30-b9efb83-reconciliation.md`                                                                       | Limpo; rastreável; não polui plan                            | Mais um arquivo (mas é research; cabe lifecycle)                      |
| M     | **CHANGELOG.md** + comentário em commit que aplicar a reconciliação                                                                        | Rastreabilidade git nativa                                   | Pode ficar disperso; CHANGELOG não é lugar de justificativa detalhada |
| N     | **L + commit-message-driven**: cada regra revertida tem commit isolado; cada manter declara source no `b04-formato` (Why-is-this-an-issue) | Granularidade máxima; rastreabilidade dupla (research + git) | Custo de governance alto                                              |

#### Sub-eixo 4 — Ordem temporal (quando reconciliar)

| Opção | Quando                                                                                                      | Pró                                                       | Contra                                                                    |
| :---- | :---------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------- | :------------------------------------------------------------------------ |
| O     | **Antes** de aplicar `[DEC-0018-B01]`/`[DEC-0018-B04]` (Stage 2): reverter o que cabe; depois reorganizar   | Reconciliação não fica refém da reorganização             | Pode reverter regra que se torna salvável depois                          |
| P     | **Depois** de B01/B04 (Stage 2): aplicar nova taxonomia/formato → reavaliar regra-a-regra com novo critério | Cada regra tem oportunidade no novo formato antes de cair | Mais churn; regra ruim entra na nova taxonomia mesmo que destinada a sair |
| Q     | **Em paralelo** com B01/B04: revisar enquanto reorganiza                                                    | Eficiente em tempo                                        | Difícil rastrear "isto saiu por reconciliação ou por reorganização?"      |

**Recomendação inicial (a confirmar pós-gate):** **D + G + L + O**:

- **D** (híbrido) — `quality-gates.md` é onde a research aponta lacunas (N+1 sem source, race/memory com evidência média): merece regra-a-regra. `global-rules.md` é editorial: revisar por seção é suficiente.
- **G** (categorizado por tipo) — endereça honestamente o ponto de que regras editoriais (PT-BR, plan mode, RPI) **não precisam** de CWE source; o problema-raiz é regra-de-defeito sem source. Espelha a recomendação **J** de `[DEC-0018-B01]` (tag de evidência).
- **L** (arquivo dedicado) — preserva rastreabilidade sem inflar `plan.md`; alinha com lifecycle de research (move para `.specify/specs/researchs/governance/` no encerramento, F9.2).
- **O** (antes da reorganização) — separa o problema "isto tem evidência?" do problema "como organizar?". Reorganizar depois fica mais limpo.
- **N** (commit-message-driven) é candidato sério se `[DEC-0018-B07]` cravar artefato robusto (K do B07 — golden examples + skeleton). Owner pode upgrades L→N se 0009 antecipar instrumentação.

**Cross-ref:** depende de `[DEC-0018-B01]` (categorias para classificar editorial vs defeito) e influencia `[DEC-0018-B03]` (revisão pode reduzir tokens em `global-rules.md`, dando folga ao orçamento).

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Sub-eixo 1 — Unidade de decisão (marque com `x`):**
  - [ ] A (Regra-a-regra)
  - [ ] B (Por seção dos arquivos)
  - [ ] C (O Bloco B inteiro de uma vez)
  - [ ] D (Híbrido: Regra-a-regra p/ QG; Seção p/ Global Rules)
- **Sub-eixo 2 — Critério de manter/revisar/reverter (marque com `x`):**
  - [ ] E (Tem source explícita?)
  - [ ] F (Passa no eval empírico?)
  - [ ] G (Categorizado: source p/ defeito, manter p/ editorial)
  - [ ] H (Combinação E + F)
  - [ ] I (Manter status quo, só reverter explicitamente sem evidência como N+1)
- **Sub-eixo 3 — Artefato de registro (marque com `x`):**
  - [ ] J (Tabela inline em `plan.md`)
  - [ ] K (Apêndice em `plan.md`)
  - [ ] L (Arquivo `.md` de reconciliação em `/research`)
  - [ ] M (CHANGELOG + commit)
  - [ ] N (L + commits atômicos detalhados por regra revertida)
- **Sub-eixo 4 — Ordem temporal (quando reconciliar) (marque com `x`):**
  - [ ] O (Antes do novo formato/taxonomia: reverter o ruim e reorganizar o bom)
  - [ ] P (Depois: formata tudo para a taxonomia nova e depois corta)
  - [ ] Q (Paralelo)
- **Justificativa / Ressalvas:** >
- **Data / Owner:**

---

## Resumo de status

| ID               | Bloco | Status   |
| :--------------- | :---- | :------- |
| `[DEC-0018-A01]` | A     | Resolved |
| `[DEC-0018-A02]` | A     | Resolved |
| `[DEC-0018-A03]` | A     | Resolved |
| `[DEC-0018-A04]` | A     | Pendente |
| `[DEC-0018-A05]` | A     | Pendente |
| `[DEC-0018-A06]` | A     | Resolved |
| `[DEC-0018-B01]` | B     | Pendente |
| `[DEC-0018-B02]` | B     | Pendente |
| `[DEC-0018-B03]` | B     | Pendente |
| `[DEC-0018-B04]` | B     | Pendente |
| `[DEC-0018-B05]` | B     | Pendente |
| `[DEC-0018-B06]` | B     | Pendente |
| `[DEC-0018-B07]` | B     | Pendente |
| `[DEC-0018-B08]` | B     | Pendente |

**Status agregado:** `Open` (transita para `Partial` quando ≥1 ponto for `Resolved`; transita para `Resolved` quando todos forem `Resolved`).
