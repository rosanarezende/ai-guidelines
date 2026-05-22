<!-- ai-guidelines-template: next-boilerplate v=1 -->

# NEXT — Spec 0023 Workflow Runtime

> **Arquivo de acompanhamento contínuo.** Itens aqui são descobertas que **extrapolam o escopo** desta spec e precisam sobreviver até o encerramento. Pendências que serão resolvidas antes do merge vão para a tasklist da sessão de implementação. **DELETADO no encerramento pré-merge**; itens relevantes migram para `.governance/specs/roadmap/backlog.md` (canônico per ADR 0019; legacy em `.specify/specs/roadmap/backlog.md` aceito como fallback até cutover) ou viram issues.

---

## 🏛️ Débitos Adiados

### Stage B (Decision closed; PR1 em execução)

_(Sem débitos adiados no momento do gate. Itens emergentes durante PR1 entram aqui.)_

### Pós-Bloco D (lifecycle metodológico cravado; PR2-lifecycle em construção)

- **Stacking pain manual** é aceito por enquanto (`[DEC-0023-D02]` risco aceito). Reabrir se ≥ 2 ciclos consecutivos confirmarem inviabilidade.
- **Definição objetiva de "pequeno" para fast-track** deferida até observação empírica de ≥ 3 fast-tracks reais (`[DEC-0023-D05]` risco aceito).
- **Drift detection profundo no CI** explicitamente diferido (`[DEC-0023-D02]` C-completo). Reabrir como spec própria quando padrões de divergência se acumularem.

### Pós-PR3 (runtime-state-index entregue; vigilância arquitetural elevada)

> Estes itens NÃO são débitos de código pendentes — são **sinais de vigilância** identificados pelo owner ao aprovar os Passos 5 e 7 do PR #23. Cada um tem critério observável de revisita; sem critério ativo, não acionar.

- **Semântica de `updatedAt` no `ActiveSpecEntry`.** Campo é registro factual de publicação, NÃO sinal operacional. Documentado em jsdoc do `src/domain/workflow/ActiveSpecEntry.ts`. **Critério de revisita:** se aparecer qualquer derivação de `updatedAt` (sorting, freshness flag, staleness, heartbeat, "última ativa"), parar e materializar `[DEC-NNNN-*]` antes de codar. Pressão antecipada pelo owner pós-Passo 5.

- **`title` na fronteira entre estrutural e visual.** Primeiro campo opcional do índice que não é lookup-crítico. **Critério de revisita:** se aparecerem propostas de novos campos de conveniência visual (`summary`, `owner`, `labels`, `tags`, `category`, `priority`), rejeitar ou exigir DEC própria com framing anti-distorção (cf. `[DEC-0023-E05]`). Pressão antecipada pelo owner pós-Passo 5.

- **`PublishState` virando mini-orchestrator.** Hoje aceitável (detecta → lê → projeta → valida → serializa → upsert → escreve). **Critério de revisita:** crescimento por feature (novos campos, regras condicionais, fluxos novos) — refatorar antes de aceitar. Esta classe virou centro operacional do runtime público.

- **`publish-state` continua manual-first.** Hooks/CI/PRs automáticos de state estão deferidos em `[DEC-0023-G03]`. **Critério de revisita:** auto-publicação/sync/atualização requer DEC própria; o nome `publish` é declarativo por design e começa a mentir se o sistema decide publicar sozinho.

- **UX-creep no `renderActiveSpecsIndex`.** Lista negra explícita: stale detection, ordering, upstream/downstream, prioridade, "próxima spec recomendada", status agregados. **Critério de revisita:** qualquer adição requer DEC própria.

- **`HEAD` unborn dependency.** Descoberta operacional do Passo 7: `git init -b <branch>` sem commit deixa HEAD inválido; `NodeWorkflowFileSystem.currentBranch()` retorna `null` nesse estado. Hoje o runtime trata como caso degradado (orienta o humano). **Critério de revisita:** se ≥ 2 consumidores externos reportarem fricção (init fresh + publish-state imediato), considerar mensagem orientativa mais explícita.

- **Bug resolvido — `publish-state` falhava em branches "de trabalho"** (escopo do PR ≠ slug canônico). Revelado pela validação humana em clone limpo do PR #23 (2026-05-21). Branch `feat/spec-0023-runtime-active-state` derivava slug `0023-runtime-active-state`, que não existia como diretório — `DetectActiveSpec` retornava null e `publish-state` falhava mesmo com entry válida no índice. Resolvido por **fallback explícito em `PublishState`**: quando detecção via branch falha, consulta o índice e procura entry cujo `branch` case exatamente. Match estrito; sem fuzzy; ambiguidade vira erro narrativo. Escopo restrito a `PublishState` (caller único hoje). Não é sinal de vigilância — é resolução.

- **`runtime-state becoming source-of-truth creep`** (sinal arquitetural sinalizado pelo owner pós-Passo 8). O índice público ficou forte o suficiente para começar a atrair: coordenação, priorização, ordering, freshness, automação, dashboards, ranking, resolução implícita. **Critério de revisita:** qualquer proposta envolvendo "ordenação automática", "spec mais recente/ativa/relevante", "próxima spec sugerida", "spec stale", "auto continue", "sync inteligente" requer DEC própria — esses ficam **vetados por default** nesta fase. Princípio canônico: o índice é fonte de **descoberta declarada**, não fonte de **decisão derivada**.

### Pós-Bloco E (enforcement estrutural cravado; visíveis com critério de revisita)

> Convenção operacional: **não usar "talvez depois" como justificativa**. Todo item deferido aqui tem (a) camada nomeada, (b) critério de revisita observável, (c) sem entrada em memória implícita.

- **L3 — hooks locais (pre-commit, pre-push)** deferido. **Critério de revisita:** L2 (`workflow continue` refuse) + L4 (`governance-pr-check` CI) comprovarem insuficientes em ≥ 2 casos reais. Cf. `[DEC-0023-E03]` + ADR 0021.
- **Drift detection semântico** (mapping arquivos↔tasks, análise de cobertura) deferido. **Critério de revisita:** ≥ 2 ciclos de stacked PRs revelarem padrões de divergência específicos que CI mínimo deixa passar. Cf. `[DEC-0023-E04]` + ADR 0020.
- **Runtime stateful complexo** (eventos, transitions, plugins) deferido. **Critério de revisita:** L2 atual (state derivado + refuse narrativo) provar insuficiente em ≥ 2 casos. Evitar engine-shape até lá. Cf. `[DEC-0023-E04]` + framing anti-distorção em `[DEC-0023-E05]`.
- **Pre-tool hooks no harness** (Claude Code settings.json hooks, equivalentes em outros providers) deferido. **Critério de revisita:** decisão própria sobre channel-specific enforcement; hoje viola ADR 0018 (acopla a provider). Cf. `[DEC-0023-E04]`.
- **Definição objetiva de "raridade" para fast-track** deferida. **Critério de revisita:** ≥ 3 fast-tracks reais observados; padrão de abuso suspeito. Cf. `[DEC-0023-E05]` + ADR 0021.

---

## 💡 Insights e Descobertas

### 1. Cutover de `.specify/` → `.governance/` é caso-a-caso, sem timeline

- ADR 0019 declara: novas specs em `.governance/`; specs antigas decidem caso-a-caso.
- **Não** abrir spec de migração em massa. Cada spec antiga que migra precisa de justificativa própria (acessos quebrados? referências em ADR? dogfooding de outra spec?).

### 2. PRs futuros (PR2–PR4) são candidatos, não promessa

- Cada um precisa passar pelo teste "isto reduz carga cognitiva?".
- `review-research` (PR2 candidato) só faz sentido depois que PR1 provar o modelo de briefing+menu.
- Avaliação empírica (PR4 candidato) depende de ≥ 2 specs novas usarem o runtime.

### 3. Context bundle copy-paste é a única "linguagem natural" do runtime

- Não embutir LLM. Não tentar interpretar intenção localmente além do trivial.
- O ganho conversacional vem do agente IA externo (Claude Code, Cursor), não do runtime.

### 4. Trilha legacy em `.specify/specs/0023-governance-workflow-discovery-model/` é evidência, não dívida

- Research, hipóteses, anti-patterns continuam sendo material citável.
- Não copiar para o novo path; referenciar com link relativo.

### 5. `tasks.md` NÃO é checklist operacional — é boundary de autorização (insight do Bloco D)

- Cravado em `[DEC-0023-D01]`. Diferença fundamental do template SDD anterior.
- Checklist operacional fino fica em `plan.md § DoD`. `tasks.md` declara apenas decomposição autorizada + escopo do boundary.
- Sem essa distinção, `tasks.md` vira instrumento de microgerenciamento; com ela, vira instrumento de governança.

### 6. PR2-lifecycle é bootstrap auto-violação declarada

- Não dá pra aplicar o modelo à sua própria introdução.
- Próxima iteração que aplica o modelo estritamente é PR3-runtime-state-index (atual) → PR4-enforcement-runtime → PR5-DX-thinking → PR6-DX-execution.
- Trilha de aprendizado preservada em `[DEC-0023-D04]` (PR1 também pre-model declarado por motivo análogo).

### 7. Convergência research lifecycle-architecture.md (taxonomy ↔ lifecycle)

- Research dedicado fechou em 299 linhas (cap absoluto 300; +49 sobre primário com justificativa).
- Convergências cravadas: (a) invariantes universais leves (accountability + traceability + outcome registration); (b) lifecycle intent categories como eixo de leitura (5 classes), não nova taxonomia; (c) runtime taxonomy-aware sem orchestration engine; (d) enforcement universal leve.
- Princípio canônico: **"governança universal não significa artifacts universais"**.
- 5 perguntas (F1–F5) cravadas como `[DEC-0023-F01..F05]` no Bloco F do decision-brief — status Pendente, opções populadas + recomendação inicial.
- F6/F7 permanecem candidates no research §9 (não promovidos a DEC para evitar consumir convergência via expansão).
- **Pós-Bloco F deferido (com critério):** PR3-enforcement-runtime aguarda Bloco F Resolved + estabilização semântica antes de iniciar implementação de runtime profundo.

### 8. Convenção operacional derivada — PR title

- Documentada em [`.core/process/pr-title-conventions.md`](../../../.core/process/pr-title-conventions.md) + checkboxes no `pull_request_template.md`. Materialização dogfoodada em PR #18 (`[🛠️➜] [Bootstrap]`) e PR #19 (`[🧾🔒]`).
- Origem: dor real observada ao revisar a stack #18 ↔ #19 — GitHub native states (Draft/Ready/Merged/Closed) cobrem lifecycle operacional mas **não** capturam o contrato arquitetural "PR não-mergeable isoladamente" que ADR 0020 introduziu.
- **Refinada em 2026-05-20** em duas iterações:
  - **(i)** Após observação de que PR #18 não encaixava honestamente nem como governance pura nem execution pura. Primeira tentativa: adicionar 🧭 como emoji de "transitional/pre-model". Resultou em `[🧭🛠️➜]` visualmente ambíguo — 3 emojis aglutinados perdiam clareza categórica.
  - **(ii)** Refinada novamente: **separar tipo (emoji fechado) de nuance (label textual fechada)**. 🧭 removido como emoji; nuances viram brackets textuais separados (`[Bootstrap]`, `[Pre-model]`, `[Hotfix]`). PR #18 hoje: `[🛠️➜] [Bootstrap] [Spec 0023] Workflow runtime`.
  - **(iii)** Estendida para suportar **pillar markers no identificador** (ex.: `[🛠️] [fix] ...`) — permite PRs não-spec (fix/patch/spike/incident/experiment/proposal) vinculados diretamente ao `WorkItem.kind` do `registry.yml`. Primeiro uso: PR de reorganização de scripts (fix pillar) como dogfooding.
- **Conjuntos fechados:**
  - Emojis: 🧾 (governance) · 🛠️ (execution) · 🔒 (governance contract) · 1️⃣2️⃣3️⃣ (order) · ➜ (downstream) · 🚑 (fast-track). **Nenhum emoji adicional será introduzido.**
  - Labels textuais: `[Bootstrap]` · `[Pre-model]` · `[Hotfix]`. **Lista fechada;** nova label exige ≥ 2 casos justificando + cross-ref.
  - Pillars no identificador: `fix` · `patch` · `incident` · `spike` · `experiment` · `proposal` (alinhados com taxonomia MECE da Spec 0021).
- **Regras explícitas:** governance NÃO usa número; ausência de ➜ em execution = terminal; ausência de número em execution = isolado; cada bracket carrega uma dimensão semântica (não aglutinar tipo + nuance no mesmo bracket).
- **Anti-DAG guardrail explícito** reforçado: emojis/números/labels são sinalização humana L1, não input para automação. Qualquer parser, DAG tooling, merge orchestration, CI lint de prefixo → reabrir DEC própria (L4).
- **Não é nova decisão** (não abre Bloco G, ADR ou DEC). É hygiene visual sobre o lifecycle já cravado. Sem enforcement automático.
- **Critério de revisita:**
  - se ≥ 3 casos de drift na prática (PRs nascendo sem prefixo ou com prefixo errado), reabrir como DEC própria com enforcement leve no `governance-pr-check`;
  - se renumeração ocorrer > 2 vezes na mesma stack, sinal de stack instável — reabrir DEC sobre forma de rollout antes de continuar;
  - se stacks > 4 PRs aparecerem recorrentemente, sinal de scope creep — considerar splitar em specs.

### DX e Narrativa Operacional (insights emergentes, pós-PR3 / 2026-05-21)

> Dois insights de **produto/DX** que emergiram do uso real do PR #23: (a) infográficos pré/pós no body do PR durante review; (b) crescimento da carga cognitiva da CLI textual à medida que o runtime ganha superfície. **Registro deliberado para não desaparecer pós-merge.** Não numerados (estão em incubação, não em backlog formal — promoção a backlog requer ≥ 2 casos adicionais ou pedido explícito do owner).

#### PR narrative artifacts (infográficos por PR)

- **Fonte do insight:** PR #23 — owner anexou infográficos visuais no body do PR antes da implementação (objetivo / problema atual / hipótese arquitetural / guardrails / impacto esperado) e ao final (valor entregue / fluxo novo habilitado / bugs descobertos / trade-offs / impacto operacional). Efeito observado: review mais rápido, onboarding do reviewer encurtado, contexto histórico preservado sem precisar reler diff completo.
- **Hipótese a confirmar:** o PR deixa de ser apenas "diff de código" e vira "incremento operacional compreensível". Pessoas absorvem arquitetura mais rápido por fluxo visual do que por diff textual — ergonomia diferente de governança.
- **Família de artefatos candidatos:** `vision.png` (intenção), `value-delivered.png` (valor entregue), `workflow-impact.png` (mudança operacional habilitada).
- **Caminhos futuros possíveis** (cada um exige decisão própria; não promover automaticamente):
  - (a) Adicionar slot opcional em `.github/pull_request_template.md` para anexar essas imagens (zero enforcement; convite).
  - (b) Geração assistida por agente IA (mais ambicioso; cruza ADR 0018 — agente como canal, não engine; viável se permanecer opt-in e copy-paste).
  - (c) ADR futuro de DX consolidando o padrão se for adotado por ≥ 2 contribuidores diferentes em ≥ 3 PRs.
- **Não-objetivo:** automação de geração no runtime (`yarn guidelines pr-artifacts`) — premature; geração manual + convite via template é o MVP.
- **Sinal de "está na hora" de promover a backlog formal:** outro contribuidor adotar o padrão espontaneamente OU ≥ 3 PRs subsequentes usarem a mesma forma.

#### Wizard operacional mínimo

- **Fonte do insight:** owner observou pós-PR3 que conforme o runtime ganha superfície (`workflow`, `continue`, `continue <id>`, `workflow publish-state --status=... --updated-by=...`), a CLI textual cresce em carga cognitiva. Aceitável hoje para uso diário do owner; problemático para reviewers, novos contribuidores, uso casual, branches paralelas, operações recorrentes.
- **Hipótese arquitetural:** menu guiado declarativo minimalista no boot de `yarn guidelines workflow` reduz atrito operacional **sem violar lookup-only** (cf. memory `feedback-lookup-not-coordination`). Exemplo de superfície proposta:

  ```
  O que deseja fazer?
    1. Continuar spec atual
    2. Continuar outra spec
    3. Publicar estado
    4. Ver specs ativas
    5. Diagnosticar drift
  ```

- **Por que preserva a filosofia da 0023:**
  - **Determinístico** — opções fixas, sem priorização, sem ranking, sem ordering por relevância.
  - **Lookup explícito** — opção 2 ("continuar outra spec") leva a um sub-menu que lista specs do índice (sem inferência de "qual provável").
  - **Sem inferência forte** — nenhuma opção decide pelo humano; cada uma traduz para um comando que já existe (`continue`, `publish-state`, etc.).
  - **Sem orquestração** — wizard é shell visual sobre comandos existentes, não nova engine de fluxo.
- **Risco principal a vigiar** (se algum dia for implementado): wizard virar "auto-detector inteligente de próxima ação" — exatamente o tipo de coordination creep que `feedback-lookup-not-coordination` veta. Implementação eventual exige `[DEC-NNNN-*]` próprio cravando o framing anti-distorção.
- **Não-objetivo:** REPL conversacional, NLP-lite, sugestão de "próxima ação recomendada", autocomplete fuzzy de slug.
- **Sinal de "está na hora" de promover a backlog formal:** ≥ 2 reviewers/contribuidores reportarem atrito concreto na CLI textual OU primeiro consumidor externo do framework chegar e reportar fricção operacional.

#### Caso real — AI-slop em brain folder de ferramenta IA (Antigravity CLI, 2026-05-21)

- **Fonte do insight:** primeira sessão de implementação remota usando o
  framework (Antigravity CLI como implementador + Claude como revisor
  paralelo + owner como gate). Antigravity recebeu briefing correto via
  `yarn guidelines continue 0023` e produziu plano direcionalmente
  coerente, mas escreveu **plano completo** em
  `~/.gemini/antigravity-cli/brain/.../implementation_plan.md` —
  scratchpad próprio da ferramenta, externo ao repo.
- **Diagnóstico:** caso de AI-slop ferramenta-específico previsto em
  [CORE-02]. Plano detalhado em brain folder:
  - não sobrevive a compactação/encerramento da sessão da ferramenta;
  - não é auditável por revisores externos;
  - não é versionado (sem histórico git);
  - duplica conteúdo que deveria viver em `tasks.md` (decomposição
    autorizada) ou `plan.md § DoD detalhado` (granularidade fina).
- **Mitigação aplicada nesta sessão:** owner instruiu Antigravity a
  tratar brain folder como pointer-only (`→ Ver .governance/specs/0023-.../tasks.md`)
  e usar artefatos vivos da spec como SSOT.
- **Padrão para futuras sessões com ferramentas IA que tenham scratchpad
  próprio** (Antigravity, Cursor, Codex CLI, Claude Code memory, etc.):
  cada owner que instancia o framework precisa orientar a ferramenta
  específica a respeitar [CORE-02] — pointer no scratchpad, conteúdo
  normativo nos artefatos vivos.
- **Cross-ref:** candidata `Arquitetura de regras portáveis vs.
contexto framework-interno` em `.governance/specs/roadmap/backlog.md` — esse
  insight é empiricamente o caso de uso que motiva aquela candidata.
  Quando ela amadurecer, este caso real é evidência.
- **Critério de "está na hora" de promover a backlog formal:** ≥ 2
  outras ferramentas (Codex, Cursor, etc.) apresentarem o mesmo padrão
  de AI-slop em scratchpad próprio durante uso do framework.

> **Meta-observação (sem registro formal aqui):** os 2 insights apontam na mesma direção — reduzir custo cognitivo da governança sem perder rigor. PR narrative artifacts atacam o **lado humano-reviewer**; wizard ataca o **lado humano-operador**. Se ≥ 1 deles for adotado e validado, vale considerar consolidação como princípio cross-spec (memory ou ADR de DX), não antes.

---

## 🗺️ Backlog estratégico

### 9. Composite action para setup compartilhado dos workflows

**Estado atual (pós-consolidação):** 3 workflows (`repo-validation.yml`, `smoke-multi-os.yml`, `governance-pr-check.yml`) compartilham o mesmo bloco de setup (checkout + setup-node com cache yarn + corepack + install). Boilerplate replicado em ~10 linhas por workflow.

**Deferido com critério:** criar `.github/actions/setup/action.yml` (composite action) para encapsular o setup compartilhado. **Reabrir quando:**

- atingirmos > 5 workflows (atualmente 3); ou
- a manutenção do boilerplate causar drift entre workflows em ≥ 2 ocasiões.

**Justificativa do deferimento:** em 3 workflows, composite action é arquitetura prematura — overhead de indirection > ganho de DRY. Reavaliar quando volume justificar.

### 10. Sanctification cutover (`cli/` → `src/`)

A coexistência bridge-first (`cli/ ↔ src/`) é temporariamente aceita como estratégia de transição e validação incremental — **não como estado arquitetural final desejado**.

O cutover definitivo deverá ser reavaliado após:

- estabilização do lifecycle governance-first;
- validação empírica dos PRs stacked governance/execution;
- consolidação do runtime workflow;
- maturidade suficiente do enforcement estrutural.

Objetivo do cutover futuro:

- consolidar runtime canônico em `src/`;
- reduzir surface area legado;
- eliminar bridges transitórias;
- simplificar manutenção e onboarding;
- transformar o modelo governance-first em foundation única do projeto.

**Evitar antecipar o cutover** antes da maturidade operacional da governança, para não misturar consolidação arquitetural com investigação metodológica.

**Referência histórica:** PR #16 (Spec 0022 — CLI Runtime Cutover) fechado em 2026-05-20 como **deferred pending governance/runtime stabilization** (não superseded). Trilha histórica da branch `feat/spec-0022-cli-runtime-cutover` preservada via close (sem delete).
