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

### Convenção operacional — inquirer em todo input humano da CLI (2026-05-22)

- **Contexto:** o wizard de `init`/`adopt` (`cli/cli/args.mjs`) já usa `@inquirer/prompts` desde a Spec 0021. Durante o PR5 da Spec 0023, o wizard do `workflow runtime` (`src/cli/workflow.ts`) foi inicialmente construído na mão com `node:readline` + classe `StdinReader` dual-mode (TTY/pipe). Owner identificou a inconsistência — inquirer já é dependência paga; reimplementar menu na mão reinventa roda e cria experiência fragmentada.
- **Convenção cravada (aplicar em todo prompt humano novo da CLI):** input humano via wizard usa `@inquirer/prompts` (`select`, `input`, `confirm`, `checkbox`). Porta abstrata em `src/app/ports/Prompts.ts`; implementação default `src/infrastructure/io/InquirerPrompts.ts`. Tests injetam `FakePrompts` com array de respostas. Esta convenção vale para qualquer novo ponto de entrada interativo do CLI.
- **Justificativa estrutural:** uma única biblioteca de prompts elimina (a) inconsistência de UX entre fluxos, (b) duplicação de tooling (StdinReader dual-mode TTY/pipe vs inquirer interno), (c) ambiguidade de "como mockar input em tests" — `FakePrompts` é o padrão único.
- **Aplicado em PR5 do PR5:** `src/cli/workflow.ts` (wizard runtime + REPL legacy + sub-wizard de visual prompts) migrado para `Prompts` porta + `InquirerPrompts`. `cli/app/install.mjs` (prompt Y/n de install de deps) migrado para `@inquirer/prompts.confirm`. `StdinReader`/`InputReader` removidos. Tests migrados de `ScriptedReader` para `FakePrompts`. Dependência `@inquirer/testing` adicionada como devDep (reservada para casos de teste end-to-end que precisem simular comportamento real de inquirer; hoje todos os tests usam injeção direta com `FakePrompts`).
- **Trade-off aceito:** pipe mode com `echo "..." | yarn guidelines workflow` deixa de funcionar como antes (inquirer detecta non-TTY e seleciona default). Homologação de fluxo via shell vira chamada direta a `runWorkflow()` em Node API ou tests Jest. Pipe shell continua útil só para demo trivial.
- **Critério de revisita futura:** se houver violação observada (alguém construir prompt manual em código novo da CLI), reabrir como ADR formal para cravar o princípio como regra perene. Hoje fica como convenção operacional registrada aqui — não precisa de ADR enquanto for respeitada por consenso.
- **Vínculo com handoff:** quando a candidata `handoff-as-first-class` materializar, esta convenção deve ser uma das regras situacionais entregues pelo handoff em sessões CLI novas (cf. cross-link na entry da candidata no backlog).

### Lição dogfooding — items de tasks.md podem envelhecer quando decisões subsequentes mudam o sentido (2026-05-22)

- **Observação:** o sub-bloco [1.H] do `tasks.md` da Spec 0023 foi cravado em 2026-05-19 (Bloco B do decision-brief). Em 2026-05-22, F01–F04 cravaram tríade arquitetural B+B+A+A (modelo/boundary/template/path por classe) + ADR 0022 (handoff) + ADR 0023 (meta-artefatos YAML+JSON+HTML). 3 dos 10 items de [1.H] (1.H.4 `examples/minimal-spec/`, 1.H.6 `workflow-quickstart.md`, 1.H.7 `workflow-with-ai-agents.md`) ficaram desalinhados — sua execução agora reproduziria forma legacy (boilerplate antigo, padrão pré-handoff) e exigiria retrabalho quando as candidatas Now materializarem (`boilerplate-system-modernization`, `handoff-as-first-class`).
- **Diagnóstico estrutural:** items de `tasks.md` são boundary de autorização (cf. `[DEC-0023-D01]`), mas seu **conteúdo** pode envelhecer entre o momento da cravação e o momento da execução quando decisões intermediárias mudam o sentido. O sistema atual não tem mecanismo formal de "revisita de items pendentes após decisão estrutural cravada".
- **Gate 3 estrito é a mitigação prevista por ADR 0021** — revisar planning sob ambiente sanitizado antes de execution iniciar é exatamente o passo que captura items envelhecidos. PR5 acabou absorvendo Gate 3 + execution no mesmo PR (corrigindo a inversão lifecycle), mas o Gate 3 propriamente dito foi executado durante a S5 — momento em que a análise revelou os 3 items desalinhados.
- **Critério estrutural derivado:** sempre que uma DEC nova (ADR ou bloco do decision-brief) for cravada dentro de spec ativa, items pendentes de `tasks.md` devem ser revisitados para verificar se permanecem alinhados. Items desalinhados ganham Deferred com critério vinculado à candidata downstream que vai cobri-los, em vez de execução prematura que viola a forma futura.
- **Aplicação retroativa nesta sessão:** 1.H.4, 1.H.6 e 1.H.7 marcados como Deferred com critério estrutural (vide `tasks.md`). Items mantidos com escopo reduzido (1.H.5, 1.H.8) para entregar valor user-facing sem antecipar handoff ou boilerplates novos. Wizard CLI mínimo promovido de insight (NEXT.md) para item formal via novo `[DEC-0023-B05]` no decision-brief — entrega de valor real coerente com o que está cravado.

### Lição dogfooding — PR governance-only durante implementação ativa é anti-pattern (2026-05-22)

- **Observação:** PR5 foi aberto originalmente como `[🧾🔒] PR5-DX-thinking` para sanear débitos estruturais antes do Gate 3. Owner identificou durante o S5 que o título e a categoria estavam errados — PR governance/thinking puro só faz sentido **antes** de qualquer execution PR da spec; durante implementação ativa, governance pendente deveria ter sido bloqueador da execution, não justificativa para abrir thinking-only paralelo. A categoria correta seria `[🛠️4️⃣➜]` (execution intermediária), com escopo combinado [1.G] + [1.H].
- **Diagnóstico estrutural:** o lifecycle SDD da Spec 0023 (ADR 0020) declara que governance precede execução. Quando o decision-brief tem bloco em estado `Pendente` solto (caso de F01–F05 desde 2026-05-19), execution PRs já abertos violam a precedência implicitamente. Abrir um PR de "sanear governance pendente" durante implementação ativa cria a inversão visível, mas o erro original foi não ter bloqueado a execution enquanto governance estava incompleta.
- **Hipótese conectada (sinal a investigar):** os boilerplates atuais de spec (`spec-boilerplate.md`, `tasks-deterministic-boilerplate.md`, `tasks-mixed-boilerplate.md`, `tasks-evidence-driven-boilerplate.md`) podem estar reforçando a inversão. Owner observou que a categorização atual induz: (a) spec "deterministic" hoje carrega decision-brief — campo originalmente típico de mixed/evidence-driven; (b) spec "mixed" sugere flexibilidade temporal entre decision e execution, podendo induzir início de implementação sem decision-brief completo. Investigação dedicada vinculada à candidata [`boilerplate-system-modernization`](../roadmap/backlog.md) (vide enriquecimento da entry).
- **Critério estrutural derivado (aplicável imediatamente):** se uma spec ativa tem decision-brief com bloco `Pendente` solto (sem `Resolved`, sem `Deferred com critério`) e há execution PR aberto, isso é violação de ADR 0020 — bloquear o execution PR até governance fechar, OU absorver a resolução de governance no escopo do execution PR corrente. **Não abrir PR governance-only paralelo durante implementação ativa.**
- **Aplicação retroativa nesta sessão:** PR5 já tem escopo expandido para [1.G] + [1.H] (corrigindo a inversão); título atualizado para `[🛠️4️⃣➜]`; categoria do PR Type virou Execution. Lição registrada aqui para sobreviver ao merge da Spec 0023.

### Pós-PR5 sanitização (Bloco F resolvido, 2026-05-22)

- **Bloco F do decision-brief — destinos finais após S5 do PR5:**
  - **F01 → Resolved (B)** — `incident` separado como `OperationalState` em domain model. Escopo faseado: spec + incident bem implementados nesta fase; demais pilares com modelagem mínima reservando espaço.
  - **F02 → Resolved (B)** — boundary canônico por classe; definição fina de cada boundary exige research específica antes da implementação de cada pilar.
  - **F03 → Resolved (A)** — boilerplate dedicado por classe; materialização cravada como candidata `boilerplate-system-modernization` em backlog `Now`.
  - **F04 → Resolved (A)** — múltiplos paths por classe (`.governance/{specs,incidents,...}`); topologia espelha taxonomy. Materialização vinculada a `boilerplate-system-modernization`.
  - **F05 → Deferred com critério estrutural** — onde mora a SSOT do princípio CORE-09/10 fica vinculado à abertura da candidata `handoff-as-first-class`. Sob a lente do ADR 0022 (handoff como canal de entrega de regras situacionais), decidir SSOT antes do canal estar materializado seria escolher forma sem comportamento real.
- **Tríade arquitetural cravada:** F01+F02+F03+F04 = B+B+A+A. Cada classe MECE ganha modelo próprio em código (F01), boundary próprio no lifecycle (F02), template próprio (F03) e diretório próprio no consumidor (F04). Materialização real fica para spec dedicada (`boilerplate-system-modernization`).
- **Não-violação de ADR 0021 item 7:** F05 deferimento tem critério estrutural observável ("abertura da spec X"), não "talvez depois". F01–F04 fechados com escolha cravada.
- **Parser permissivo de Spec (tradeoff / débito técnico):** A implementação de prompts visuais aceita o formato numérico isolado (e.g. "0023") como alias de spec para fins de conforto na DX. **Critério de revisita:** se o ecossistema do framework passar a suportar outras entidades com ID puramente numérico que colidam de forma ambígua (e.g. incidentes, experimentos, patches), refatorar o regex do `parseContextTarget` para exigir prefixos explícitos e garantir desambiguação MECE.

### Pós-PR5 review (PR #25 / 2026-05-23) — vigilância arquitetural elevada após uso empírico

> Sinais emergentes do review do PR #25: combinação de Copilot review automático + validação empírica do owner rodando `yarn guidelines workflow` ao vivo + segunda opinião Codex sobre comportamento observado. **Cada item abaixo tem critério estrutural de revisita observável** (cf. ADR 0021 item 7); nenhum vira "talvez depois". Não são débitos de código pendentes — são sinais de vigilância que protegem boundaries arquiteturais.

- **"Wizard pareça agente sem ser"** — sinal de maturidade + alerta de boundary. Após o redesign de identity canônica (`[DEC-0023-I01]`) e a renumeração posicional do menu (Item 7.5 do review), o owner observou em uso ao vivo: "sensação de continuidade operacional" forte o suficiente para gerar expectativa de inteligência embutida (mesmo sem haver). Codex (2026-05-23): _"vocês precisarão proteger cuidadosamente o boundary entre coordenação, contexto, e automação real. Senão a pressão natural do produto vai empurrar a 0023 para orchestration creep, agent creep, provider coupling."_ **Critério de revisita:** se aparecer ≥ 1 proposta no backlog ou candidata Now sugerindo "auto-detection", "smart routing", "automated handoff" ou termo semanticamente equivalente, reabrir como DEC anti-distorção dedicada (estendendo `[DEC-0023-E05]`) antes de aprovar. ADR 0018 (AI-as-Channel) precisa continuar sendo bandeira ativa, não restrição passiva esquecida.

- **Ação 4 do REPL (`executar próxima ação`) é placeholder narrativo declarado** — boundary evolutivo identificado. A mensagem `"execução automática não está no escopo do PR1 — registre o resultado em state.yml manualmente"` é honesta operacionalmente, mas Codex (2026-05-23) flagrou: _"marca claramente o próximo boundary evolutivo do sistema. Você está chegando no limite do runtime informativo. E começando a entrar no território runtime procedural."_ **Critério de revisita:** vinculado à abertura da candidata `handoff-as-first-class` (backlog `Now`). Sob a lente do ADR 0022 (handoff situado precede distribuição pré-carregada), "executar próxima ação" deveria deixar de ser placeholder e virar handoff just-in-time — o canal entrega o contexto operacional necessário para a IA externa retomar de onde o humano parou. Enquanto a candidata não materializar, a ação 4 permanece placeholder válido (não é bug, é boundary declarado).

- **Verbosidade colapsada do briefing — 3 camadas misturadas em `state.yml.next`** — sinal arquitetural para spec futura. Codex (2026-05-23) observou que o briefing mistura: (a) próximos passos operacionais, (b) débitos arquiteturais com critério, (c) sinais de vigilância sistêmica, (d) guardrails históricos. Hoje colapsadas em uma única lista `next:`. _"Ainda aceitável. Mas já mostra pressão de crescimento."_ Sugestão de 3-camada premature agora — exige DEC + escolha de forma + validação empírica de necessidade. **Critério de revisita:** se ≥ 2 specs externas instanciarem o runtime e relatarem fricção com verbosity do briefing OU se uma lista `next:` cravada em spec ativa passar de 6 itens consistentemente, reabrir como spec dedicada (provável escopo: separar `state.yml` em projeções por gênero — operational / architectural / vigilance — mas só com evidência empírica). **Vetado por default:** introduzir 3-camada agora sem critério ativo.

- **Delimiter "Context bundle" sobrevive como jargão interno** — drift residual de Item 6 do review. O delimitador de output (`── Context bundle (copie para sua sessão IA) ──`) ainda carrega o termo "bundle" mesmo após o footer do wizard ter sido reescrito (Item 6, 2026-05-23) com a sugestão Codex `"...para gerar contexto pronto para colar na sua IA"`. Parentética do delimitador compensa parcialmente. **Critério de revisita:** se ≥ 1 usuário externo perguntar "o que é Context bundle?" análogo ao que o owner perguntou sobre o footer (2026-05-23), reabrir como UX hygiene em PR fix pequeno (não exige DEC; troca puro de string). Hoje: deixado conscientemente, drift conhecido e contornado.

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

#### Validação empírica do modelo tri-party (Antigravity + Claude + Owner, 2026-05-22)

- **Fonte do insight:** PR #24 (PR4-enforcement-runtime) — primeira entrega
  não-trivial sob divisão tripartida com **prova de funcionamento operacional**:
  Antigravity (Gemini 3 Flash) como implementador autônomo, Claude (Opus 4.7)
  como revisor crítico paralelo verificando diffs direto no disco, owner como
  gate humano autorizando cada commit/push/Draft→Ready textualmente. 7 commits,
  3 camadas DDD, 12 cenários de teste novos, 544 testes verdes.
- **Hipótese confirmada:** modelo previsto por ADR 0018 (AI-as-Channel)
  suporta colaboração multi-agente IA + humano sem violar a regra "nenhum LLM
  embutido no runtime". Cada IA é canal externo; humano é a única fonte de
  decisão.
- **Otimização emergente:** Antigravity inicialmente colava diffs completos
  em mensagens de reporte para o owner copiar pra Claude — gasto duplo de
  tokens. Owner instruiu: Antigravity reporta apenas (a) resultado de
  validate, (b) arquivos modificados, (c) sugestão de commit message; Claude
  verifica direto no disco. Atrito eliminado.
- **Lacuna observada — implementador obediente desperdiça valor:** Antigravity
  operou puramente como executor — recebeu plano detalhado de cada commit e
  implementou sem questionar. Implementadores IA têm capacidade de identificar
  overengineering, edge cases, acoplamentos suspeitos e bugs latentes antes
  de codar — usar apenas como "máquina de digitar código" subutiliza o modelo
  e desperdiça tokens. **Direção de evolução:** implementador deveria ter
  **voz crítica calibrada** — capacidade de questionar **1 round por
  sub-bloco** quando detectar (a) overengineering óbvio (ex.: helper usado
  1 vez), (b) violação de guardrail conhecido (memory de feedback, `[DEC-*]`,
  ADR), (c) edge case não previsto no plano, (d) custo desproporcional ao
  valor. **Anti-padrões explicitamente vetados:** debate infinito,
  questionamento vago ("acho que pode ser melhor"), re-litigation após
  decisão do owner. **Critério de "fechado":** após 1 round, owner decide
  e implementador executa sem rediscussão.
- **Padrão para futuras specs:** divisão tri-party é candidata a ADR
  próprio se ≥ 2 specs adicionais validarem o modelo. Hoje fica como
  insight em incubação — promoção a backlog formal exige recorrência
  observável.
- **Critério de "está na hora" de promover a backlog/ADR formal:** ≥ 2
  outras specs usarem o modelo tri-party com avaliação empírica positiva,
  OU primeiro consumidor externo do framework reportar uso do padrão, OU
  a lacuna acima (implementador obediente) for endereçada e validada em
  ≥ 1 sub-bloco real.

#### Gap de documentação user-facing pós-PR4 (achado fora de escopo, 2026-05-22)

- **Fonte do achado:** owner identificou que toda a entrega do workflow
  runtime (PRs #18→#19→#22→#23→#24) está documentada apenas em
  `.governance/specs/0023-workflow-runtime/*` (governance interna) e
  `CHANGELOG.md`. Surfaces user-facing — `README.md`, `AGENTS.md`,
  `CONTRIBUTING.md`, `docs/cli/ai-guidelines-cli.md`, `docs/features.md`
  — têm **0 menções** a `workflow continue`, `publish-state`, ou
  enforcement L2.
- **Decisão metodológica:** documentar user-facing está **pré-alocado
  ao sub-bloco [1.H] do PR6-DX-execution** (itens 1.H.6/1.H.7/1.H.8/1.H.9).
  Não criar PR docs avulso fora de sequência — mantém arquitetura da
  spec intacta. Pull-forward formal sincronizado em `tasks.md [1.H]`
  com nota "Escopo expandido pós-PR4 (pull-forward)" em cada item afetado.
- **Risco aceito:** docs user-facing ausentes durante a janela
  PR4 mergeado → PR6 entregue. Mitigação parcial: CHANGELOG já tem
  entry, e `workflow continue --help` (1.H.5) deve apontar para a doc
  quando existir.
- **Critério de revisita:** se a janela PR4→PR6 ultrapassar 14 dias
  OU se houver tentativa de uso externo do framework antes do PR6,
  reavaliar a decisão e considerar PR docs antecipado.

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
