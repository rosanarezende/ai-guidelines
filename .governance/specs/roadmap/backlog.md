# Backlog — `.governance/specs/` (canônico)

> **Localização canônica em diante.** Conforme [ADR 0019](../../../.core/governance/adrs/0019-governance-specs-root-in-maintainer.md), novas specs e novas entradas de backlog entram aqui. O backlog legado em [`.specify/specs/roadmap/backlog.md`](../../../.specify/specs/roadmap/backlog.md) permanece como referência histórica até cutover caso-a-caso.

> **Regra de ouro.** Nada aqui entra em execução sem nova spec (`.governance/specs/<NNNN>-<slug>/`). Este arquivo é leitura obrigatória antes de abrir spec nova ou fechar uma spec existente.

> **Política repo-first, integração-friendly.** O repositório é a memória canônica. Ferramentas externas (GitHub Projects, Issues, Linear, etc.) podem ser camada colaborativa via campo opcional `tracker` nas entradas; o resumo mínimo aqui é mandatório.

Detalhes de lifecycle em [`.core/process/governance-foundation.md`](../../../.core/process/governance-foundation.md).

---

## Em execução

- **spec 0023** — `workflow-runtime` (`.governance/specs/0023-workflow-runtime/`) — **In Progress (Stage 2)** _(stack ativa em `feat/spec-0023-runtime-active-state`; consulte `.governance/runtime/active-specs.yml` para o estado público corrente — fonte canônica per `[DEC-0023-G02]`)._
  - Pivotada de "discovery model" para "operational runtime". Lifecycle metodológico (ADR 0020) + enforcement estrutural (ADR 0021) cravados. PR3-runtime-state-index entregou o índice operacional público + `publish-state` manual.

---

## Candidatas

### Refatorar boilerplates SDD para serem stack-agnostic

- **Fonte do insight:** auditoria durante reorganização de scripts (PR `fix/package-scripts-reorganization`, 2026-05-20) — minha tentativa de propagar a convenção `yarn validate` para os boilerplates `.specify/templates/*` e `.ai-guidelines/templates/*` (e os partials em `.core/governance/templates/partials/tasks-evidence-driven/`) **piorou** o problema existente.
- **Diagnóstico:** os boilerplates SDD são distribuídos para repositórios consumidores de **qualquer stack** (Python, Go, Rust, JS/TS, etc.), mas hoje carregam exemplos hard-coded com `yarn` como referência dominante (`yarn check && yarn test` no `ai-guidelines`, com `npm test`, `pnpm verify`, `cargo test`, `pytest` apenas como sufixo "substitua pelo equivalente"). Para um agente IA trabalhando em repo não-JS, a primeira leitura confunde — empurra para configurar yarn.
- **Sintoma específico identificado:**
  - Linhas `**1.A.N** Pipeline de check + test verde após o sub-bloco A` (e equivalentes) nos boilerplates `tasks-*-boilerplate.md`.
  - Linhas `**3.2** Pipeline canônico verde: ... ex. no ai-guidelines: yarn check:repo`.
  - Linhas em `plan-boilerplate.md` e `spec-boilerplate.md` com o mesmo padrão.
- **Princípio a aplicar:** boilerplates distribuídos devem referir-se a **conceitos** (pre-commit hook + pre-push hook, format-on-save, drift guard), não a **comandos concretos de um stack**. Concretizar com ferramenta análoga ao stack do consumidor é responsabilidade do agente que instancia a spec, não do template.
- **Pré-requisitos / cross-ref:** A própria Spec 0023 (`workflow-runtime`) está reformulando o lifecycle metodológico — boilerplate refactor pode ser absorvido como sub-bloco dela, ou tratado como spec própria após 0023 mergear. Decidir caso-a-caso.
- **Sinal de "está na hora":** Spec 0023 atingir estado estável; OU primeiro consumidor não-JS reportar fricção concreta com os boilerplates.
- **Riscos antecipados:** abstrair demais perde a clareza de "como na prática se faz isso?". Mitigar com: 1 frase conceitual + 1 ou 2 exemplos concretos em stacks diferentes (não dominados por JS).
- **Não-objetivo:** não criar template para cada stack — manter um boilerplate por tipo de spec, com exemplos balanceados.
- **Material reusável:** as edições aplicadas e revertidas estão na branch `fix/package-scripts-reorganization` (revertidas antes do merge); diff de referência via `git log -p`.

### Retrofit `tasks-mixed-boilerplate` para honrar `[DEC-0023-D01]` (boundary, não checklist fino)

- **Fonte do insight:** Spec 0023 / PR #23 — auto-violação detectada em 2026-05-21 durante dogfooding do runtime-state-index. Sub-bloco `[1.E]` do `tasks.md` da 0023 herda granularidade fine-grained (`1.X.N`, `1.X.[COMMIT]`) do boilerplate, contradizendo o próprio `[DEC-0023-D01]` que craveia "`tasks.md` é boundary de autorização, NÃO checklist fino" (checklist fino vive em `plan.md § DoD`).
- **Diagnóstico estrutural:** **templates canônicos são enforcement behavior** — decisões vivem em ADR/DEC, mas comportamento real emerge dos boilerplates. **Enquanto boilerplates permanecerem desalinhados, o lifecycle continuará reproduzindo comportamento legado, mesmo após convergência semântica dos DEC/ADR.** A decisão D01 já está cravada, mas o template ainda gera o anti-pattern, e cada nova spec instanciada a partir dele repete a violação silenciosamente. Sem retrofit, o lifecycle existe no papel e morre na prática.
- **Sintoma específico:** todo sub-bloco em `tasks-mixed-boilerplate v=3` carrega `[1.X.N]` (pipeline verde), `[1.X.[COMMIT]]` (mensagem de commit literal) — checklist operacional fino, não boundary de autorização.
- **Princípio a aplicar:** `tasks.md` declara apenas decomposição autorizada + escopo do boundary + gates de autorização (`[REVIEW]`, `[COMMIT]` permanecem; são handoff explícito per ADR 0021). DoD operacional fino (pipeline, mensagem literal de commit, granularidade por arquivo) migra para `plan.md § Critérios de Aceite Detalhados`.
- **Pré-requisitos / cross-ref:** Spec 0023 estável; mesma família de retrofit que ["Refatorar boilerplates SDD para serem stack-agnostic"](#refatorar-boilerplates-sdd-para-serem-stack-agnostic) — ambas são "boilerplate atrasado em relação à decisão", candidatas a serem absorvidas no mesmo PR de retrofit.
- **Sinal de "está na hora":** Spec 0023 mergeada OU 2º caso de auto-violação observado em spec nova instanciada a partir do boilerplate.
- **Riscos antecipados:** retrofit precisa preservar gates explícitos de autorização (`[REVIEW]`, `[COMMIT]`) que ADR 0021 craveia como handoff humano — só "checklist operacional cego" (`[1.X.N]`, mensagem literal) sai; gates ficam. Confundir os dois recriaria o problema oposto (perda de autorização explícita).
- **Não-objetivo:** redesenhar lifecycle (D01, ADR 0020, ADR 0021 são premissas estáveis); apenas alinhar a forma textual do template canônico ao contrato já cravado.

### Arquitetura de regras portáveis vs. contexto framework-interno — "como ai-guidelines não vira nova fonte de repetição"

- **Fonte do insight:** sessão de trabalho em 2026-05-20 (PR `fix/package-scripts-reorganization`). Owner observou que, ao longo da conversa, eu (IA) salvei vários _memory feedbacks_ em `~/.claude/projects/.../memory/` — utilizáveis apenas no Claude Code local desta máquina. Para Codex, Gemini, Cursor (ou Claude Code em outra máquina), esse contexto desaparece.
- **Diagnóstico — o gap dogfooding:** o `ai-guidelines` nasceu para **eliminar a necessidade de repetir instruções para IA**. Mas hoje, contexto que deveria ser "lido por qualquer agente, em qualquer provider, em qualquer máquina" se acumula em três camadas mal definidas:
  1. **`<AI_GUIDELINES>` em AGENTS.md** — bloco compilado, conteúdo portável e versionado. Funciona para regras universais distribuídas para consumidores. **Não suporta** contexto repo-interno do próprio `ai-guidelines`.
  2. **Fora do bloco `<AI_GUIDELINES>` em AGENTS.md** — "Contexto Local", "Quickstart Local", notas avulsas. Cresce ad-hoc, sem taxonomia, sprawla. Sintoma observado pelo owner: "tenho inserido informações em AGENTS.md, fora das tags `<AI_GUIDELINES>`, mas isso não é escalável nem me parece a melhor opção".
  3. **Memória de provider (Claude memory, Codex context, Cursor rules, etc.)** — não-portável, não-versionada, invisível para outros agentes. Sintoma observado: feedbacks que salvei nesta sessão não estarão disponíveis quando owner abrir Codex amanhã.
- **Princípio violado:** ADR 0018 declara `AGENTS.md` como **output runtime** AI-agnóstico, não como SSOT sprawling. Hoje a SSOT do contexto repo-interno é o próprio AGENTS.md fora do bloco — exatamente o oposto da intenção arquitetural.
- **Direções a explorar (não decidir agora):**
  - **(a) Novo bloco compilado em AGENTS.md** (ex.: `<REPO_INTERNAL>`) preenchido por uma SSOT versionada (ex.: `.governance/repo-internal.md`). Mantém AGENTS.md como output mas separa escopos.
  - **(b) Arquivo paralelo canônico** (ex.: `.governance/agent-context.md`), lido por qualquer agente que entre no repo, equivalente a `<AI_GUIDELINES>` mas para contexto repo-específico (não-distribuído).
  - **(c) Tag de escopo nas regras existentes**: além de `universal`/`adapter`/`opt-in`, adicionar `repo-internal`. O bloco compilado teria subseção dedicada.
  - **(d) Convenção para memory feedbacks:** toda memory salva localmente deve ter espelho num artifact versionado do projeto, OU declarar explicitamente "este é local-only por razão X".
  - **(e) Política de migração (obrigatória junto com qualquer das direções acima):** se uma nova camada canônica for criada para contexto repo-interno, **declarar explicitamente** quais trechos atuais fora de `<AI_GUIDELINES>` em AGENTS.md passam a ser **proibidos**, **opcionais** ou **compilados/movidos** para a nova camada. Sem essa política, a solução vira a "4ª camada" sem desativar a 2ª, e o sprawl piora ao invés de fechar. Critério de fechamento: AGENTS.md raiz só pode ter conteúdo fora de `<AI_GUIDELINES>` se cobrir uma categoria explicitamente listada como "permitida" no novo modelo.
- **Pré-requisitos / cross-ref:**
  - Spec 0023 (`workflow-runtime`) atingir estado estável (lifecycle + enforcement cravados).
  - Spec 0021 (governance information architecture) PR1 mergeada — fornece o lar canônico para artifacts não-spec.
  - ADR 0018 (AGENTS.md como output AI-agnóstico) — premissa a respeitar.
  - ADR 0019 (`.governance/specs/` como root) — premissa a respeitar.
- **Sinal de "está na hora":**
  - Owner observar 2º+ caso de "contexto que eu repeti em outra ferramenta porque não está em lugar canônico".
  - Primeiro consumidor real ≠ `ai-guidelines` perguntar "onde coloco contexto repo-específico que não cabe no AGENTS.md distribuído?".
  - Sessão de trabalho com agente em provider ≠ Claude Code expor o gap de forma concreta.
- **Riscos antecipados:**
  - Criar uma 4ª camada sem retirar a 2ª (fora do bloco em AGENTS.md) só piora o sprawl.
  - Excesso de prescrição pode prejudicar a flexibilidade de cada provider (Claude memory, Cursor rules, Codex AGENTS.md têm semantics próprias).
  - Tornar contexto repo-interno "obrigatório" para qualquer agente lê-lo (ao invés de opt-in) pode vazar ruído para consumidores.
- **Não-objetivos:**
  - Reinventar memory engine. A solução é estrutural (onde mora o texto), não computacional.
  - Forçar todos providers a comportamento uniforme. Cada provider pode ler/honrar a SSOT à sua maneira; o que ai-guidelines garante é a existência da SSOT no repo.
- **Por que isto importa agora:** sem isso, o próprio `ai-guidelines` falha no seu objetivo fundador — owner segue repetindo contexto entre sessões/providers, e cada nova máquina/agente reinicia o ciclo. Adiar é aceitar que o framework não cumpre sua promessa de raiz.

---

## Now (próxima fila, ordem importa)

### `governance-dashboard-and-visual-artifacts`

> **Vinculação metodológica:** primeira candidata a ser instanciada como spec **imediatamente após Spec 0023 fechar**, antes de qualquer outra coisa. Vínculo explícito com a cláusula anti-paper de [ADR 0023](../../../.core/governance/adrs/0023-meta-artifacts-yaml-with-derivations.md) item 6 — ADR sem materialização rápida vira o anti-pattern (dashboard que nunca saiu do papel desde 2026-05-07) que motivou o ADR.

- **Fonte do insight:** PR5 S3–S4 da Spec 0023 (2026-05-22). Owner reconheceu que o débito de dashboard de governança se arrasta desde a época do `living-docs.yml` e nunca saiu do papel. Combinado com a decisão arquitetural cravada em [ADR 0023](../../../.core/governance/adrs/0023-meta-artifacts-yaml-with-derivations.md) (meta-artefatos como SSOT YAML com derivações JSON+HTML), a candidata materializa o primeiro caso real do padrão.
- **Princípio guia:** ADR 0023 — meta-artefatos de governança são SSOT em YAML com derivações determinísticas build-time. Derivações **NÃO usam LLM no runtime** (ADR 0018 preservado).
- **Escopo proposto (a confirmar quando a spec abrir):**
  - **Backlog convertido** para o padrão YAML SSOT + JSON derivado + HTML derivado. Schema declarado; `yarn build:meta-artifacts` (ou equivalente) regenera derivações; CI drift check garante sincronização.
  - **HTML dashboard** com visão de estado de governança: specs ativas, candidatas em `Now`/`Next`/`Later`, status de blocos de decisão. Estático na v1 (sem JS interativo).
  - **Mermaid diagrams** embedded onde fizer sentido (arquitetura, lifecycle, stack de PRs) — renderizado pelo GitHub.
  - **Prompts versionados** para imagens conceituais em diretório dedicado (ex.: `.governance/visual-prompts/` ou similar). Owner cola prompt em ferramenta externa (Claude/Midjourney/DALL-E/etc.) e retorna imagem; cobre arquitetura ponta a ponta, entrega de valor, andamento. Owner é visualmente orientada — esse débito é DX real.
- **Pré-requisitos:**
  - Spec 0023 mergeada (atômico ponta-a-ponta per ADR 0020).
  - ADR 0023 promovida de `Proposta` para `Aceita` no fechamento da 0023.
- **Sinal de "está na hora":** Spec 0023 fechar. Sem condição adicional — vinculação metodológica explícita por ADR 0023 item 6.
- **Riscos antecipados:**
  - **HTML virar "produto SaaS"** — adicionar JS interativo, autenticação, filtros runtime complexos. Mitigação: framing canônico anti-distorção de ADR 0023 (linguagem rejeitada).
  - **Prompts visuais perdendo aderência ao estado real** — risco de imagem gerada em momento X ficar obsoleta no momento Y. Mitigação: prompts versionados são instruções para regenerar, não imagens cacheadas; owner regenera quando precisar.
  - **Padrão YAML+JSON+HTML aplicado a markdown narrativo por engano** — viola ADR 0023 item 5 (aplicabilidade restrita a meta-artefatos). Mitigação: critério de revisão explícito do ADR.
- **Não-objetivos:**
  - Reinventar Jira/Linear/Notion no repo. Dashboard é visualização **estática derivada** de SSOT YAML; SSOT continua editável via PR.
  - Filtros interativos runtime, busca client-side complexa, autenticação. Tudo isso reabre trade-off contra "database + UI custom" (opção 3 rejeitada do ADR 0023).
  - Geração de imagens via LLM no runtime (viola ADR 0018). Prompts são templates declarativos; geração acontece em ferramenta externa, manualmente, sob comando do humano.
- **Slug:** `governance-dashboard-and-visual-artifacts` (per [ADR 0017](../../../.core/governance/adrs/0017-spec-numbering-slug-to-branch.md) — número alocado apenas quando o branch for criado).

---

## Bloqueadores cross-spec

_(populado conforme blocos cruzam fronteiras de spec)_
