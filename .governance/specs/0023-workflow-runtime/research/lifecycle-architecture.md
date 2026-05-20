# Research — Lifecycle Architecture (Spec 0023)

> Status: §§0–9 materializados — aguarda autorização do owner para consolidar decisões em `[DEC-0023-F*]` (Bloco F do decision-brief)
> Spec: [`../spec.md`](../spec.md)
> Decision Brief: [`../decision-brief.md`](../decision-brief.md) (alimentará Bloco F)
> Cap: **250 linhas (primário); 300 linhas (absoluto excepcional)**. Ultrapassar 250 exige justificativa explícita; ultrapassar 300 é **scope drift** e força fechamento imediato.
> **Justificativa over-cap (~298 linhas, +48 sobre primário 250):** preservar invariantes universais, 5 anti-recursão guards e síntese operacional viável. Trim aplicado para ficar dentro do cap absoluto 300. **Investigação fechada** — sem expansão; tensões futuras viram `[DEC-0023-F*]` ou spec própria.

---

## 0. Restrições e guardrails da investigação

### 0.1 Por que esta seção existe

A 0023 detectou empiricamente o pattern "investigação expandindo recursivamente sem fechar tensões anteriores". Esta investigação inaugura bloco potencialmente expansivo (taxonomy ↔ lifecycle); sem firewall declarado, recria o anti-pattern que motivou sua abertura.

### 0.2 O que esta investigação É

- Mapeamento do **gap atual** entre lifecycle cravado (Blocos D + E + ADRs 0020/0021) e taxonomy MECE cravada (Spec 0021 — 7 pilares: `spec`, `proposal`, `spike`, `experiment`, `fix`, `patch`, `incident`).
- Geração de hipóteses estruturadas (H1–H4) sobre como o lifecycle se aplica universalmente vs especializadamente por pilar.
- Identificação de **perguntas** que viram `[DEC-0023-F*]` no Bloco F.
- Convergência para **modelo operacional mínimo viável** — não apenas mapeamento de possibilidades.

### 0.3 O que esta investigação NÃO É

- Redesign de boilerplates. Alterações pontuais podem decorrer de DECs F\* aprovadas; redesign completo é spec própria.
- Refactor da taxonomy MECE. Os 7 pilares ficam onde estão (Spec 0021 fechou esse capítulo).
- Spec nova de "Lifecycle MECE". Tudo vive dentro da 0023.
- Implementação, prototipagem, ou refactor de código. Investigação pura.
- Resposta às 7 questões originais do owner. **Respostas vivem em DECs do Bloco F.** Aqui só mapeamos opções e tensões.

### 0.4 Princípio importante — taxonomia não pode ser apenas nominal

O objetivo desta investigação não é redesenhar a taxonomy MECE, **mas operacionalizar minimamente sua existência arquitetural**. Taxonomia apenas nominal — onde os 7 pilares existem como registro mas o lifecycle/boilerplates/runtime/enforcement orbitam só o pilar `spec` — é considerada **inconsistência estrutural ativa**, não escolha pragmática.

### 0.5 Visibilidade arquitetural (consumer vs maintainer)

Eixo regulatório das decisões F\*:

- **Complexidade percebida apenas pelo mantenedor** (este repo, agentes contribuindo aqui) é **aceitável em certo grau** — overhead arquitetural local.
- **Complexidade percebida pelo consumidor do framework** (via `init`/`adopt`/`workflow`) é **dívida arquitetural prioritária** — qualquer regra/gate/artifact que apareça no rosto do consumidor sem reduzir carga cognitiva dele é candidata a refusal.

Aplicar este teste em cada hipótese H1–H4 e em cada pergunta F\*. Se a complexidade adicional só protege o framework de si mesmo, registrar como tal.

### 0.6 Critérios de fechamento

A investigação **fecha** (e o gate para Bloco F **abre**) quando todos os 5 critérios estão marcados:

1. Tabela §2 (mapeamento 7 pilares × lifecycle) completa: cada célula tem hipótese explícita ou "não-aplicável" justificado.
2. Cada hipótese H1–H4 tem ≥ 2 casos concretos de evidência interna do repo OU contraexemplo registrado.
3. §9 lista ≥ 5 perguntas prontas para virar `[DEC-0023-F*]`.
4. Documento total ≤ 250 linhas (cap primário). 251–300 exige justificativa textual; > 300 = scope drift.
5. **Investigação converge para modelo operacional mínimo viável** — direção prática aplicável em PR3 e além —, não apenas mapeamento de possibilidades. Sem (5), as outras 4 não destravam o gate.

Se algum critério não conseguir ser marcado em prazo razoável, registrar a lacuna como `[DEC-0023-F*]` aberto — não expandir investigação para "completá-la".

### 0.7 Princípio meta-recursivo — 4 testes editoriais

Toda hipótese, DEC candidata e seção nova passa por 4 testes antes de ser escrita:

1. **Fecha tensão ou abre tensão?** Se abre mais do que fecha em ≥ 2 dimensões, parar.
2. **Visível ao consumidor ou só ao mantenedor?** Tensões só-mantenedor são ruído aceitável; consumer-visible são prioridade (§0.5).
3. **Pode ser registrada como "parada com critério" em vez de "investigação aberta"?** Preferir "deferida com critério ≥ N casos" a "ainda investigando".
4. **Reduz complexidade operacional percebida pelo usuário do framework?** Se não reduzir, justificar explicitamente por que o custo cognitivo adicional vale. **DevEx é restrição arquitetural cravada** (cf. Bloco E + ADR 0021).

Estes 4 testes são **regra editorial**, não checklist técnico.

---

## 1. Gap observado: lifecycle spec-centric vs taxonomy MECE

### 1.1 Evidência nos boilerplates

`.specify/templates/` contém:

- `spec-boilerplate.md` — único pilar-specific.
- `decision-brief-boilerplate.md` — header pede `Tipo de spec`; pressupõe contexto de spec.
- `plan-boilerplate.md` — § "Design e Arquitetura" + "Critérios de Aceite Detalhados" — pressupõe fase de design + DoD por componente.
- `tasks-{deterministic,evidence-driven,mixed}-boilerplate.md` — três variantes, todas derivadas de `tasks-boilerplate.md` (boilerplate de spec).
- `next-boilerplate.md`, `research-index-boilerplate.md`, `roadmap-boilerplate.md`, `project-config-boilerplate.md` — meta-artifacts; não pilar-specific.

**Não há boilerplates para 6 dos 7 pilares** (`proposal`, `spike`, `experiment`, `fix`, `patch`, `incident`).

### 1.2 Evidência nas ADRs recentes

- **ADR 0020** (Governance precede execução): fala em "Spec X PR", ciclo "discovery → decision → planning → execution", `tasks.md` como boundary. Pressupõe spec como container.
- **ADR 0021** (Enforcement estrutural): fala em "execution PR / governance PR", `executionAuthorized` derivado. Pressupõe spec lifecycle.
- **ADR 0019** (`.governance/specs/` root): topologia menciona `specs/`, não outros pilares.

### 1.3 Evidência no runtime e enforcement

- `DetectActiveSpec` busca `.governance/specs/{slug}` → fallback `.specify/specs/{slug}`. Não procura `.governance/proposals/`, `.governance/incidents/`, etc.
- `state.yml` vive em `.governance/specs/{slug}/state.yml`.
- `tasks.md` vive em `.governance/specs/{slug}/tasks.md` (boundary canônico).
- `governance-pr-check` valida path `(.governance|.specify)/specs/{slug}/tasks.md` — hardcoded em `specs`.

### 1.4 Síntese — a inconsistência estrutural

Taxonomy MECE da Spec 0021 declara 7 pilares como categorias de `WorkItem` (registry). Operacionalmente, **6 dos 7 pilares não têm lifecycle definido**: só `spec` tem boilerplates, lifecycle cravado, runtime support e enforcement aplicável. Os outros existem no `registry.yml` mas não têm operação correspondente. Exatamente o que §0.4 nomeia como "taxonomia apenas nominal" — inconsistência estrutural ativa.

---

## 2. Mapeamento atual: o que cada pilar herda implicitamente

> **Aviso:** células abaixo registram **hipótese** com base em evidência atual + ADRs 0010-0014 (taxonomia MECE original). Não são decisões — decisões pertencem a `[DEC-0023-F*]`.

| Pilar        | Boilerplate próprio? | decision-brief?                      | plan.md? | tasks.md (boundary)?            | Stacked PRs?               | gov-pr-check aplicável? |
| :----------- | :------------------- | :----------------------------------- | :------- | :------------------------------ | :------------------------- | :---------------------- |
| `spec`       | sim                  | sim (evidence-driven/mixed)          | sim      | sim                             | sim                        | sim                     |
| `proposal`   | ❌                   | (?) pré-decisão; sem comprometimento | ❌       | ❌ — não há execução            | ❌ — sem execution PR      | ❌                      |
| `spike`      | ❌                   | (?) — time-boxed                     | reduzido | reduzido — output é aprendizado | ?                          | parcial                 |
| `experiment` | ❌                   | (?) hypothesis-heavy + outcome       | sim      | sim                             | sim                        | sim                     |
| `fix`        | ❌                   | raro                                 | raro     | raro                            | (?) fast-track             | (?) fast-track          |
| `patch`      | ❌                   | raro                                 | raro     | raro                            | (?) fast-track             | (?) fast-track          |
| `incident`   | ❌                   | (?) emergente                        | reduzido | reduzido                        | (?) fast-track sistemático | (?) fast-track          |

### 2.1 Anomalias e conflitos detectados

- **`proposal`** é pré-decisão (ADR 0010 — sem comprometimento de execução). Aplicar boundary `tasks.md → execution autorizada` **não faz sentido** — não há execução. Lifecycle termina em "promoted to spec / rejected / archived".
- **`incident`** pode disparar trabalho de qualquer outro tipo (`fix`/`patch`/`spike`/`proposal`). Fluxo é **emergente, não pré-planejado**. Lifecycle universal de 4 fases parece desalinhado — talvez incident seja **operational state** que gera workitems, não workitem em si (consistente com observação do research legado §2.5).
- **`experiment`** tem outcome formal (`won/lost/inconclusive` — ADR 0011) que outros pilares não têm. Lifecycle precisa modelar transições de outcome além de gates de execução.
- **`fix` / `patch`** são iniciativas pequenas com lifecycle ad-hoc. Aplicar 4 fases + decision-brief + plan + tasks + stacked PRs cria overhead desproporcional — recria **AP3 (spec como container universal)** identificado no research legado.
- **`spike`** é time-boxed learning (ADR 0001 legacy). Output é aprendizado técnico (PoC/prototype), não código mergeado. Lifecycle universal com `tasks.md` como boundary de execução parece deslocado — boundary diferente: time-box vs autorização.

### 2.2 Síntese parcial

Lifecycle universal de ADR 0020 (`discovery → decision → planning → execution` com `tasks.md` boundary) foi desenhado tendo `spec` em mente — e secundariamente `experiment`. Para os 5 pilares restantes, há divergências estruturais visíveis:

- `proposal`: lifecycle terminal **sem fase execution**.
- `spike`: lifecycle time-boxed; boundary é **timebox**, não `tasks.md`.
- `incident`: lifecycle emergente; possivelmente **não é WorkItem** mas operational state.
- `fix`/`patch`: lifecycle compactado; possivelmente **sem decision-brief/plan/tasks separados** (commit message + PR description bastam).

### 2.3 Classificação preliminar — lifecycle intent categories

> **Aviso:** classificação preliminar observacional, não decisão. Pilares podem cair em uma classe ou em transição entre classes. Eixo de leitura para H1–H4.

| Classe                        | Exemplo principal    | Característica central                               |
| :---------------------------- | :------------------- | :--------------------------------------------------- |
| Decision artifact             | `proposal`           | Lifecycle termina em decisão; sem execução           |
| Learning artifact             | `spike`              | Time-boxed; output é aprendizado, não merge          |
| Execution artifact            | `spec`, `experiment` | Lifecycle completo com rollout autorizado            |
| Operational-response (state?) | `incident`           | Fluxo emergente; dispara workitems de outras classes |
| Maintenance artifact          | `fix`, `patch`       | Lifecycle ad-hoc; PR + commit message como contrato  |

### 2.4 Implicação — WorkItem vs lifecycle intent

As divergências mapeadas sugerem que **"WorkItem"** (categoria operacional cravada na Spec 0021) **pode não ser categoria operacional suficiente sozinha**. Os pilares parecem representar **diferentes intenções de lifecycle**, não apenas diferentes tamanhos de trabalho. Tratar `fix`/`patch` como "spec-lite" recria AP3 (spec como container universal); tratar `incident` como WorkItem ignora comportamento emergente; tratar `proposal` como precursor de execução é inconsistente com lifecycle terminal. Esta observação **não invalida** a MECE (que continua válida como classificação de intenção de saída — cf. ADR 0010), mas sugere que o lifecycle não pode ser desenhado tratando todos os pilares como WorkItem operacionalmente equivalentes.

---

## Framing das hipóteses H1–H4 — invariantes universais vs especialização por classe

> **Pergunta central que H1–H4 endereçam:** qual é o **menor conjunto de invariantes universais** que todos os pilares compartilham, mesmo quando seus boilerplates/gates/rollouts diferem?
>
> Sem invariantes universais, runtime vira **branching explosion** (ramificação por pilar em cada operação). Sem especialização por classe, recriamos o spec-centric drift. Cada hipótese abaixo:
>
> 1. nomeia o caso específico (qual pilar diverge e como);
> 2. identifica **a divergência estrutural** (o que não pode ser tratado como spec);
> 3. propõe **invariante universal candidato** (o que sobrevive e pode ancorar o runtime sem branching).

---

## 3. H1 — `incident` como operational state, não WorkItem (hipótese prioritária)

**Enunciado (hipótese, não decisão):** `incident` pode não ser WorkItem no mesmo nível que `spec`/`experiment`/etc. — pode ser **operational state emergente** que dispara WorkItems de outras classes (`fix`/`patch`/`spike`/`proposal`) como resposta. Sua presença no registry como categoria igual aos outros 6 pilares pode ser **categoria-erro estrutural**.

**Evidência interna:**

- Research legado §2.5: "incident parece distinto operacionalmente — mudança de estado emergente que pode disparar trabalho de qualquer outro tipo".
- `WorkItem.ts`: `incident` está em `DenseKind` com `severity` (atributo de **estado**); outros DenseKind têm `outcome`/`resolution` (atributos de **execução**).
- Comportamento real: incidents disparam fix/patch/spike — coordenam resposta, não executam por si.

**Divergência estrutural:**

- Lifecycle não é "discovery → decision → planning → execution"; é "detectado → contido → diagnosticado → resolvido via outro tipo".
- Sem `tasks.md` próprio — trabalho real vive nos WorkItems disparados.
- `executionAuthorized` não se aplica.

**Invariante universal candidato:** **accountability + traceability** — mesmo que incident não seja WorkItem, precisa ter ownership explícito + link para WorkItems disparados. Esses invariantes são universais a todos os pilares.

**Tensão se aceita:** mudança no domain model (separar `WorkItem` execucional de `OperationalState`); Spec 0021 MECE permanece válida em intenção, mas categorias internas se rebalanceiam. Decisão F\* registra como ajuste, não revogação.

---

## 4. H2 — `proposal` como decision artifact com lifecycle terminal

**Enunciado (hipótese):** `proposal` é **decision artifact** — não "work preceding execution". Lifecycle termina em decisão (promoted to spec / rejected / archived); **nunca atinge fase execution**.

**Evidência interna:**

- ADR 0010 (taxonomy MECE): proposal declarada como **pré-decisão**, sem comprometimento de execução.
- `WorkItem.ts`: `proposal` em `VirtualKind` (vive só no registry; sem workspace físico).
- Boilerplate atual presume execução; proposal não cabe.

**Divergência estrutural:**

- Lifecycle = discovery → decision → **terminal** (não → planning → execution).
- `tasks.md` boundary incoerente: não há execução a autorizar.
- `executionAuthorized` nunca aplica — estado permanentemente inaplicável.
- Promoção a `spec` cria nova entidade; proposal em si encerra.

**Invariante universal candidato:** **accountability + traceability + decision auditability** — proposal precisa registrar quem decidiu, quando, com que rationale. Universal a todos os pilares (mesmo execution-heavy).

**Tensão se aceita:** runtime reconhece pilares com **lifecycle terminal** e não exige tasks.md/execução. Ramificação pequena, não branching explosion. Boilerplate `proposal` se justificar — provavelmente `summary + decision-rationale + outcome`. Pequeno.

---

## 5. H3 — `spike` como learning artifact com boundary de timebox

**Enunciado (hipótese):** `spike` é **learning artifact** com lifecycle bounded por **timebox**, não por autorização de execução. Output é aprendizado técnico (PoC/prototype/decision input), não código mergeado em main.

**Evidência interna:**

- ADR 0001 (legacy) formaliza vocabulário de spike como time-boxed.
- Comportamento real: spikes geram research notes + decision inputs; raramente mergeiam código de produção.
- `WorkItem.ts`: `spike` em `DenseKind` mas sem `outcome` formal (diferente de `experiment`).

**Divergência estrutural:**

- Lifecycle = setup → time-boxed exploration → conclusion (extension via decisão explícita).
- Boundary é **timebox completion**, não `tasks.md`.
- Output pode ou não disparar `spec`/`proposal`; spike-only é resultado válido.

**Invariante universal candidato:** **accountability + traceability + outcome registration** — spike precisa registrar o que aprendeu, mesmo sem virar código. Outcome registration é universal — apenas o formato muda (spec: rollout done; spike: learning captured; proposal: decided; etc.).

**Tensão se aceita:** runtime modela **boundary semantics variável por classe**: tasks.md (execution) vs timebox (learning) vs decision-gate (decision). Pequena abstração, não engine.

---

## 6. H4 — `fix` / `patch` como maintenance class (não spec-lite)

**Enunciado (hipótese):** `fix` e `patch` são **maintenance artifacts** com lifecycle **classe própria**, não versões reduzidas de `spec`. Tratar como "spec-lite" recria AP3 (spec como container universal); maintenance tem lifecycle estruturalmente diferente, não apenas escalado.

**Evidência interna:**

- `WorkItem.ts`: `fix` e `patch` em `VirtualKind` (sem workspace físico) — diferente de `spec` (denso).
- AP3 do research legado: tratar tudo como spec gera overhead desproporcional em iniciativas pequenas.
- Prática real: fixes/patches resolvem via commit message + PR description, sem decision-brief/plan/tasks separados.

**Divergência estrutural:**

- Lifecycle = identification → implementation → review → merge (sem fases formais de discovery/decision/planning).
- "Artifact" do fix/patch **é o próprio commit + PR description**, não decision-brief.md + plan.md + tasks.md.
- `tasks.md` é overkill; commit message + PR description carregam rationale suficiente.

**Invariante universal candidato:** **accountability + traceability** — cada fix/patch precisa de autor + rationale + link para origem (issue, incident, observation). Invariantes existem em spec/experiment/proposal/spike também — apenas o lugar onde vivem muda (commit message + PR description vs decision-brief.md dedicado).

**Tensão se aceita:** fast-track formal em `[DEC-0023-D05]` + ADR 0021 já reconhece esse caso operacionalmente. H4 propõe elevar de "exceção declarada" para "classe própria com contrato mínimo" — talvez sem requerer label `fast-track` para fix/patch (que deixaria de ser exceção e viraria padrão da classe). Risco se rejeitada: tratar fix/patch como exceções ao modelo spec recria AP3 sob outro nome.

---

## 7. CORE-09/10 mapeadas contra invariantes universais

CORE-09 (PR Draft) e CORE-10 (Ready após revalidação explícita) enunciam caso particular de **accountability + traceability** — não assumir continuação implícita. Aplicam a toda iniciativa que produz PR, com **formato class-specific**: `spec`/`experiment` → gate sobre decision-brief + tasks; `fix`/`patch` → review sobre commit + diff; `proposal` → decisão de promoção; `incident` → confirmação de resolução.

**Implicação:** CORE-09/10 permanecem L1 em AGENTS.md (lembrete universal) **e** ganham ancoragem em ADR 0021 (princípio estrutural). Não migram totalmente — convivem em camadas (L1 advisory + L2/L4 enforcement) conforme Bloco E.

---

## 8. Anti-recursão concreta — guards para Bloco F e investigações subsequentes

5 reforços que vivem nas decisões F\* e em investigações derivadas:

1. **Lifecycle intent categories ≠ nova taxonomia formal.** Eixos de leitura para identificar invariantes — não viram sub-taxonomy, inheritance tree ou meta-model. Se alguma F\* começar a ganhar sub-categorias por classe, **parar e revisar**.
2. **Invariantes universais ≠ artifacts universais.** Accountability/traceability/outcome registration são invariantes; formatos variam por classe (commit+PR no `fix`/`patch`; tasks.md no `spec`; outcome log no `experiment`; incident commander no `incident`). Nenhum artifact concreto é universal — só os invariantes que ele serve.
3. **Runtime taxonomy-aware sem orchestration engine.** Runtime detecta pilar + roteia para boundary correto; **não orquestra**. Sem transition automática, sem side effects além de leitura/recusa narrativa. Se ganhar "if pillar == X then trigger Y" em múltiplos pontos, **revisar**.
4. **Enforcement universal permanece leve.** `governance-pr-check` não cresce além de linkage estrutural; ramificação por classe via configuração, não regras adicionais.
5. **Critério de stop:** ≥ 2 reforços violados em F\* → suspender investigação subsequente e abrir DEC meta "esta direção expande categoria sem fechar tensão?".

---

## 9. Perguntas prontas para virar `[DEC-0023-F*]`

> Cumpre §0.6 critério 3 (≥ 5 perguntas). Respostas vivem no Bloco F do decision-brief, **não aqui**.

**F1** — `incident` permanece WorkItem ou vira `OperationalState`? Implicação: schema `registry.yml` + `WorkItem.ts`. Opções: (A) WorkItem com flag especial; (B) entity nova; (C) registry estável + runtime trata diferente.

**F2** — Boundary canônico por classe? Esquema candidato: `spec` → tasks.md; `proposal` → decision-gate; `spike` → timebox; `experiment` → outcome; `fix`/`patch` → PR merge; `incident` → resolution.

**F3** — Boilerplates: por classe ou universal+slots? Opções: (A) por classe (≥ 5 arquivos); (B) universal com seções condicionais; (C) `spec` mantém atual + classes leves sem boilerplate formal.

**F4** — Runtime: `DetectActiveSpec` → `DetectActiveWorkItem`? Opções: (A) múltiplos paths; (B) `WorkItem.kind` derivado de path/frontmatter; (C) double-lookup por classe.

**F5** — CORE-09/10: ADR formal ou agent rule? Opções: (A) ADR 0022 nova; (B) AGENTS.md + nota ADR; (C) regra L1 + complemento em `.core/process/`.

**Candidatos:** **F6** visibilidade arquitetural (consumer vs maintainer) como ADR perene; **F7** schema `state.yml` ganha `kind` derivado para não-spec pilares.

---

## Síntese final — modelo operacional mínimo viável

Convergência (§0.6 critério 5):

1. **Lifecycle intent categories** = 5 eixos de leitura, não nova taxonomia.
2. **Invariantes universais** = accountability + traceability + outcome registration. Formato varia por classe.
3. **Boundary canônico** = class-specific (F2). `tasks.md` é boundary só de execution class.
4. **Runtime taxonomy-aware** detecta + roteia; não orquestra (F4).
5. **Enforcement universal mínimo** = CORE-09/10 (L1) + governance-pr-check (L4) + state derivado (L2). Modelo alimenta Bloco F + PR3-enforcement-runtime.
