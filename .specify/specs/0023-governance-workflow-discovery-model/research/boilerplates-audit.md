# Anexo — Auditoria dos Boilerplates Atuais

> **Anexo da Spec 0023 [`research.md`](../research.md)**, alimentando a hipótese H3 ("boilerplates atuais embutem epistemologia execution-first") e o anti-pattern AP5 ("artefatos informais cumprindo papéis canônicos sem template").
>
> **Stage A — observação, não conclusão.** Esta auditoria identifica premissas implícitas e comportamentos induzidos pelos boilerplates atuais. Sugestões registradas aqui são candidatas a alterações pontuais (não redesign), a serem decididas no `decision-brief.md` futuro.

---

## Escopo desta auditoria

Examinar cada arquivo em `.specify/templates/`:

1. **Premissas implícitas** que ele carrega.
2. **Workflow induzido** por reflexo na prática.
3. **Onde induz comportamento errado**, com referência a casos concretos do repo.
4. **Sugestões pontuais** (alteração mínima necessária para destravar o lifecycle proposto).

**Não é redesign.** A 0023 declara explicitamente em § "Fora do escopo" que **não** reescreve boilerplates existentes — pode apenas propor alterações pontuais.

---

## 1. `.specify/templates/spec-boilerplate.md`

**Premissas implícitas:**

- Toda spec tem `Decision Brief` e `Plan` no header — os links no header sugerem que esses arquivos vão existir desde o setup.
- A iniciativa começa com "Objetivo" definido antes de qualquer investigação.
- "Fora do escopo" é desenhado **antes** de discovery (sem evidência empírica do que está realmente fora).

**Workflow induzido:** `spec.md` criado primeiro com objetivo amarrado → `decision-brief.md` segue (com links já apontando) → `plan.md` segue → `tasks.md` segue. Não há momento canônico para investigação independente entre a criação da spec e a primeira decisão.

**Onde induz comportamento errado:**

- `Plan: [./plan.md](./plan.md)` no header sugere que `plan.md` é obrigatório desde o setup. Para specs em Stage A sem plan ainda, o autor é forçado a escolher entre (a) link quebrado, (b) criar `plan.md` placeholder (que vira plan prematuro), ou (c) deletar a linha (mas o boilerplate é template canônico).
- A Spec 0023 contorna isso declarando explicitamente `Plan: (não criado em Stage A — nasce após decision-brief)` — mas essa é solução ad-hoc, não suportada pelo boilerplate.

**Sugestão pontual (a confirmar na 0023):** boilerplate aceitar formatos alternativos no header:

- `Decision Brief: [./decision-brief.md](./decision-brief.md)` (quando existe), **ou**
- `Decision Brief: (não criado em Stage A — nasce após research)` (quando Stage A explícito).

Mesma flexibilidade para `Plan:`. Nada além disso muda no boilerplate.

---

## 2. `.specify/templates/decision-brief-boilerplate.md`

**Premissas implícitas:**

- Decisões podem ser formuladas como perguntas com opções A/B/C **antes** de pesquisa profunda.
- Owner consegue assinar gate sem `research.md` precedente — research é tratada como "Contexto" opcional no rodapé de cada ponto `[DEC-*]`.

**Workflow induzido:** brief instanciado cedo no setup → owner é confrontada com opções que parecem genéricas mas embutem premissas → assina sem necessariamente ter visto evidência profunda → decisões cristalizam premissas implícitas como verdades canônicas.

**Onde induz comportamento errado:**

- Caso concreto: Spec 0022 PR #16 — [`decision-brief.md` da 0022](../../0022-cli-runtime-cutover/decision-brief.md) foi arquivado como **"historical pre-discovery framing artifact"**. As 6 perguntas A/B/C embutiam premissas CLI-first/runtime-assumption que **não tinham sido auditadas** em research independente.
- O bloco mandatório "Bloco C — Saúde Técnica" do boilerplate atual exige análise de "saúde arquitetural" sem exigir `research.md` precedente para essa análise. O autor escreve do que sabe — não do que investigou.

**Sugestão pontual (a confirmar na 0023):** cada ponto `[DEC-*]` exigir **referência explícita** a um `research.md` específico (ou anexo de `research/`), não apenas "Contexto" opcional. Sem `research.md` referenciado, o ponto fica em status `Open` (não `Pendente`) — não está pronto para gate.

---

## 3. `.specify/templates/plan-boilerplate.md`

**Premissas implícitas:**

- `plan.md` "vive durante execução" (frase literal no boilerplate) — sugere existência desde o setup.
- Sub-blocos e componentes são identificáveis **antes** de research arquitetural.
- "Decisões revisitadas" assume que decisões iniciais já existem (vieram do `decision-brief.md`).

**Workflow induzido:** plan criado no setup → componentes nomeados de cabeça → tasks derivam dos componentes nomeados → execução começa sobre estrutura imaginada. Investigação só acontece se autor explicitamente abrir Stage 1 (sub-bloco do `tasks-evidence-driven-boilerplate.md`).

**Onde induz comportamento errado:**

- Caso concreto: Spec 0022 PR #16 [`plan.archived.md`](../../0022-cli-runtime-cutover/plan.archived.md) foi arquivado porque "deriva diretamente das premissas do `decision-brief.md` que está enviesado por CLI-first/runtime-assumption". Os sub-blocos (PR1 setup+adopt, PR2 init, PR3 update+providers, PR4 check-budget+features, PR5 cleanup) foram nomeados como se a arquitetura-alvo já estivesse decidida — mas o domínio não tinha sido investigado.

**Sugestão pontual (a confirmar na 0023):** `plan.md` **não** instanciado no setup; nasce apenas **após gate humano de Stage A → Stage B**. Boilerplate atual pode continuar como referência de estrutura, mas estado inicial da spec é `Plan: (a definir)`.

---

## 4. `.specify/templates/tasks-boilerplate.md` (e variantes)

**Premissas implícitas:**

- Fases (0/1/2/...) são previsíveis no setup.
- As variantes existentes (`evidence-driven`/`deterministic`/`mixed`) cobrem todos os tipos de trabalho do framework.
- Stage 1 (Research) é **sub-bloco do tasks**, não artifact independente — só aparece na variante `evidence-driven` (e como `Stage 1 condicional` em `mixed`).

**Workflow induzido:** tasks criado no setup → autor preenche placeholders → tarefas viram comprometimento sem investigação real. A variante `evidence-driven` declara "Stage 1 (Research): coletar evidência" mas trata research como **etapa do tasks**, não como artifact próprio.

**Onde induz comportamento errado:**

- Casos concretos: tasks `[ ]` viram backlog operacional cedo demais; autor sente pressão para "completar" tarefas que talvez não devessem existir (Spec 0022 PR #16 — 6 fases planejadas antes do discovery).
- A existência da variante `evidence-driven` sugere que o framework reconhece a necessidade de research, mas a coloca **dentro** do tasks. Isso impede que `research.md` exista como artifact de primeira classe — ele está enterrado em sub-bloco de outro arquivo.

**Sugestão pontual (a confirmar na 0023):** `tasks.md` **não** instanciado no setup; nasce após gate humano de Stage A → Stage B → planning. Considerar adicionar variante `discovery-first` que reconheça `research.md` como artifact externo precedente (não sub-bloco).

---

## 5. `.specify/templates/next-boilerplate.md`

**Premissas implícitas:**

- Débitos têm classificação fácil ("fica nesta spec" vs "vai pro backlog") no momento do registro.
- O autor sabe distinguir débito de insight no momento de escrever.
- `NEXT.md` é deletado pré-merge — itens relevantes migram para `roadmap/backlog.md`.

**Workflow induzido:** débitos vão para `NEXT.md` por reflexo → sem gate de classificação imediata → `NEXT.md` infla até o pré-merge → "sanitize" pesado no fim.

**Onde induz comportamento errado:**

- Caso concreto: `NEXT.md` da Spec 0021 chegou a 208 linhas antes do sanitize 4.C.[SANITIZE-NEXT]. Vários itens foram "empurrados com a barriga" entre fases, virando meta-débito que contaminou o sub-bloco `[DEBT-REVIEW]` toda vez. Ver [`closure-review.md` §6 da 0021](../../0021-governance-information-architecture/closure-review.md).

**Sugestão pontual (a confirmar na 0023):** boilerplate inclui regra editorial visível **no topo do arquivo** (não enterrada em política): "ao adicionar item ao `NEXT.md`, classifique imediatamente em uma das três categorias: (a) fica nesta spec → vai para `tasks.md`; (b) vai para backlog → migra para `roadmap/backlog.md` agora; (c) merece spec própria → abre candidata em `roadmap/backlog.md` agora". Eventualmente, gate quantitativo (linhas / itens abertos por fase) pode ser adicionado.

---

## 6. Boilerplate ausente: `research-boilerplate.md`

**Premissa atual:** research é opcional, vive em `.specify/specs/researchs/` ad-hoc ou em audits dentro de pastas de specs (sem contrato).

**Workflow induzido:** Stage A da spec não tem artifact canônico → autor pula direto para `decision-brief.md` (porque ele tem template), construindo perguntas sobre premissas implícitas → planning herda essas premissas.

**Casos concretos onde o vácuo apareceu:**

- 3 audits dentro da Spec 0021 (`audit-2026-05-10-pre-2d-sanitization.md`, `audit-2026-05-11-pre-3c4-living-docs-aggregation.md`, `audit-2026-05-11-pre-3d-template-engine.md`) nasceram fora do template porque o framework não tinha lugar para esse tipo de documento. Cumpriram o papel informalmente, mas sem contrato — cada um adotou estrutura própria.
- `closure-review.md` da 0021 inaugurou outro precedente sem template.

**Sugestão pontual (output esperado da 0023, não desta auditoria):** criar `research-boilerplate.md` com estrutura mínima obrigatória (hipóteses, evidências, matriz, anti-patterns, perguntas abertas) — espelhando a estrutura usada pelo próprio `research.md` desta 0023 como protótipo testado em dogfooding.

---

## 7. Boilerplate ausente: `closure-review-boilerplate.md`

**Premissa atual:** specs de fundação/convergência fecham sob o template comum (`tasks.md` finalizando + `NEXT.md` sanitizado + `roadmap/historico.md` atualizado). Não há artifact dedicado a "boundary review" para specs que estabelecem paradigma.

**Casos concretos:** `closure-review.md` da Spec 0021 nasceu sem template, durante a sessão de design 2026-05-18, como artifact reconhecido necessário. Cabeçalho declara explicitamente: "**NÃO é parte do template SDD vigente**".

**Sugestão pontual (output esperado da 0023):** avaliar criação de `closure-review-boilerplate.md` com critério explícito de "quando usar" (specs de fundação / specs com amendments de escopo / specs com sub-blocos pós-gate / específico para foundation/convergence). Decisão pertence ao `decision-brief.md` futuro da 0023.

---

## 8. Síntese da auditoria

**Premissa comum aos 5 boilerplates existentes:** todos assumem que **execução começa cedo** e que **research é etapa opcional dentro do tasks**, não artifact independente. Isso materializa epistemologia execution-first.

**Sinal para a H3 do `research.md`:** suporte preliminar **forte** (cada boilerplate auditado mostra ao menos uma premissa que induz planning prematuro). Isto **sugere** que a H3 entra no `decision-brief.md` futuro como hipótese bem-suportada, mas a decisão sobre como tratá-la pertence ao gate humano, não a esta auditoria.

**Alterações pontuais sugeridas (consolidado):**

| Boilerplate                     | Alteração mínima                                                                                    |
| :------------------------------ | :-------------------------------------------------------------------------------------------------- |
| `spec-boilerplate.md`           | Header aceitar `Decision Brief: (não criado em Stage A)` e `Plan: (não criado em Stage A)`.         |
| `decision-brief-boilerplate.md` | Cada ponto `[DEC-*]` exigir referência explícita a `research.md` (não apenas "Contexto" opcional).  |
| `plan-boilerplate.md`           | Não instanciado no setup; nasce após gate Stage A → Stage B.                                        |
| `tasks-boilerplate.md`          | Não instanciado no setup; considerar variante `discovery-first` reconhecendo `research.md` externo. |
| `next-boilerplate.md`           | Regra editorial visível no topo: "classifique na hora em (a)/(b)/(c)".                              |

**Boilerplates novos a considerar (output da 0023):**

- `research-boilerplate.md` (alta prioridade — endereça vácuo principal).
- `closure-review-boilerplate.md` (média prioridade — endereça vácuo de specs de fundação).
- `hypothesis-boilerplate.md` + `findings-boilerplate.md` (média prioridade — endereça vácuo para `experiment`, se a taxonomia for reposicionada).
- `findings-boilerplate.md` para `spike` (média prioridade).

**Aviso final:** todas as alterações e boilerplates novos acima são **propostas a serem decididas** no `decision-brief.md` futuro da 0023. A decisão final pondera custo/benefício caso a caso.
