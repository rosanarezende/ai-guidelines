# Backlog — `.governance/specs/` (canônico)

> **Localização canônica em diante.** Conforme [ADR 0019](../../../.core/governance/adrs/0019-governance-specs-root-in-maintainer.md), novas specs e novas entradas de backlog entram aqui. O backlog legado em [`.specify/specs/roadmap/backlog.md`](../../../.specify/specs/roadmap/backlog.md) permanece como referência histórica até cutover caso-a-caso.

> **Regra de ouro.** Nada aqui entra em execução sem nova spec (`.governance/specs/<NNNN>-<slug>/`). Este arquivo é leitura obrigatória antes de abrir spec nova ou fechar uma spec existente.

> **Política repo-first, integração-friendly.** O repositório é a memória canônica. Ferramentas externas (GitHub Projects, Issues, Linear, etc.) podem ser camada colaborativa via campo opcional `tracker` nas entradas; o resumo mínimo aqui é mandatório.

> **Consolidação aplicada em 2026-05-22 (PR5 S5 da Spec 0023).** O backlog foi reduzido de 6 candidatas soltas para 3 candidatas agrupadas em `Now` (com sub-escopos absorvidos explicitamente) + seção `Candidatas` zerada. Critério: candidatas que tocam o mesmo sistema (boilerplates, contexto IA) foram consolidadas; cada grupo deve virar uma spec única em vez de N specs sobrepostas. Histórico de absorção registrado nas próprias entries.

Detalhes de lifecycle em [`.core/process/governance-foundation.md`](../../../.core/process/governance-foundation.md).

---

## Em execução

- **spec 0023** — `workflow-runtime` (`.governance/specs/0023-workflow-runtime/`) — **In Progress (Stage 2)** _(stack ativa em `feat/spec-0023-runtime-active-state`; consulte `.governance/runtime/active-specs.yml` para o estado público corrente — fonte canônica per `[DEC-0023-G02]`)._
  - Pivotada de "discovery model" para "operational runtime". Lifecycle metodológico (ADR 0020) + enforcement estrutural (ADR 0021) cravados. PR3-runtime-state-index entregou o índice operacional público + `publish-state` manual.

---

## Now (próxima fila, ordem importa)

> **Sobre a ordem.** As 3 candidatas em `Now` são instanciáveis após a Spec 0023 fechar. A ordem abaixo segue critério misto (anti-paper urgency + bloqueio downstream + DX). Owner pode reordenar quando o momento da abertura chegar.

### 1. `governance-dashboard-and-visual-artifacts`

> **Vinculação metodológica:** materializa [ADR 0023 — Meta-artefatos de governança são SSOT YAML com derivações determinísticas](../../../.core/governance/adrs/0023-meta-artifacts-yaml-with-derivations.md). Cláusula anti-paper explícita (item 6) — ADR sem materialização rápida vira o anti-pattern (dashboard que nunca saiu do papel desde 2026-05-07) que motivou o ADR.

- **Fonte do insight:** PR5 S3–S4 da Spec 0023 (2026-05-22). Débito de dashboard de governança se arrasta desde a época do `living-docs.yml` e nunca saiu do papel. Combinado com a decisão arquitetural cravada em ADR 0023 (meta-artefatos como SSOT YAML com derivações JSON+HTML), a candidata materializa o primeiro caso real do padrão.
- **Princípio guia:** ADR 0023 — meta-artefatos de governança são SSOT em YAML com derivações determinísticas build-time. Derivações **NÃO usam LLM no runtime** (ADR 0018 preservado).
- **Escopo proposto (a confirmar quando a spec abrir):**
  - **Backlog convertido** para o padrão YAML SSOT + JSON derivado + HTML derivado. Schema declarado; `yarn build:meta-artifacts` (ou equivalente) regenera derivações; CI drift check garante sincronização.
  - **HTML dashboard** com visão de estado de governança: specs ativas, candidatas em `Now`/`Next`/`Later`, status de blocos de decisão. Estático na v1 (sem JS interativo).
  - **Mermaid diagrams** embedded onde fizer sentido (arquitetura, lifecycle, stack de PRs) — renderizado pelo GitHub.
  - **Prompts versionados** para imagens conceituais em diretório dedicado (ex.: `.governance/visual-prompts/`). Owner cola prompt em ferramenta externa (Claude/Midjourney/DALL-E/etc.) e retorna imagem; cobre arquitetura ponta a ponta, entrega de valor, andamento. Owner é visualmente orientada — esse débito é DX real.
- **Pré-requisitos:**
  - Spec 0023 mergeada (atômico ponta-a-ponta per ADR 0020).
  - ADR 0023 promovida de `Proposta` para `Aceita` no fechamento da 0023.
- **Sinal de "está na hora":** Spec 0023 fechar. Sem condição adicional — vinculação metodológica explícita por ADR 0023 item 6.
- **Riscos antecipados:**
  - **HTML virar "produto SaaS"** — adicionar JS interativo, autenticação, filtros runtime complexos. Mitigação: framing canônico anti-distorção de ADR 0023 (linguagem rejeitada).
  - **Prompts visuais perdendo aderência ao estado real** — risco de imagem gerada em momento X ficar obsoleta no momento Y. Mitigação: prompts versionados são instruções para regenerar, não imagens cacheadas.
  - **Padrão YAML+JSON+HTML aplicado a markdown narrativo por engano** — viola ADR 0023 item 5 (aplicabilidade restrita a meta-artefatos). Mitigação: critério de revisão explícito do ADR.
- **Não-objetivos:**
  - Reinventar Jira/Linear/Notion no repo. Dashboard é visualização **estática derivada** de SSOT YAML; SSOT continua editável via PR.
  - Filtros interativos runtime, busca client-side complexa, autenticação. Tudo isso reabre trade-off contra "database + UI custom" (opção 3 rejeitada do ADR 0023).
  - Geração de imagens via LLM no runtime (viola ADR 0018). Prompts são templates declarativos; geração acontece em ferramenta externa, manualmente, sob comando do humano.
- **Slug:** `governance-dashboard-and-visual-artifacts` (per [ADR 0017](../../../.core/governance/adrs/0017-spec-numbering-slug-to-branch.md)).

### 2. `handoff-as-first-class` (escopo expandido — absorve "arquitetura de regras portáveis vs. contexto framework-interno")

> **Vinculação metodológica:** materializa [ADR 0022 — Handoff situado em estado precede distribuição pré-carregada de regras](../../../.core/governance/adrs/0022-handoff-situated-precedes-static-distribution.md). Sem materialização, ADR 0022 vira "ADR de papel" — repete o anti-pattern de adiar princípios validados empiricamente sem entrega.
>
> **Consolidação 2026-05-22:** absorve a candidata "Arquitetura de regras portáveis vs. contexto framework-interno" (criada em 2026-05-20 durante PR de reorganização de scripts). Handoff é o **canal de entrega** de contexto situado; portable rules architecture trata da **SSOT do conteúdo** que o handoff apresenta. As duas são lados da mesma moeda — onde mora contexto para IA, e como ele chega ao agente. Manter separadas geraria specs sobrepostas. Escopo absorvido detalhado abaixo.

- **Fonte do insight:**
  - Validação empírica observada durante PR4 da Spec 0023 (2026-05-22) — sessão de IA iniciada com handoff redigido manualmente alcançou aderência ao processo qualitativamente superior à sessão iniciada apenas com `AGENTS.md` + arquivos por canal. Princípio cravado em ADR 0022.
  - Observação anterior (2026-05-20, durante PR `fix/package-scripts-reorganization`): memory feedbacks salvos em `~/.claude/projects/.../memory/` são local-only — não viajam entre providers (Codex, Gemini, Cursor) nem entre máquinas. Owner observou o gap como caso recorrente do desafio "contexto que deveria ser portável acumula em camadas mal definidas".
- **Princípio guia:** ADR 0022 — bootstrap de sessão IA é handoff situado em estado, não distribuição pré-carregada de regras. `AGENTS.md`, `.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md` viram stubs orientativos (≤ 10 linhas) apontando para o comando handoff. Conteúdo normativo permanece em SSOT (AGENTS.md compilado, ADRs, decision-briefs).
- **Escopo proposto — canal de entrega (a confirmar quando a spec abrir):**
  - **Comando `workflow handoff`** (ou modo expandido de `workflow continue`) — gera contexto situado a partir dos artefatos vivos: estado atual da spec, ordem de leitura prescrita, regras situacionais destacadas, primeiro turno scripted.
  - **Versão simples (`--simple`)** — handoff puramente determinístico (concatenação ordenada de artefatos relevantes + lista das CORE rules aplicáveis ao próximo passo). Suficiente para boot leve.
  - **Versão híbrida (`--hybrid`)** — handoff determinístico + slots TODO marcados para humano refinar antes de colar. Sem LLM no runtime (ADR 0018 preservado).
  - **Stubs canônicos** em cada canal de IA (`AGENTS.md`, `.cursorrules`, `CLAUDE.md`, `.github/copilot-instructions.md`) reduzidos a ≤ 10 linhas apontando para o comando.
  - **Integração com wizard CLI** — wizard oferece "Continuar trabalho atual" (continue resumido) vs "Iniciar sessão IA nova" (handoff completo). Decisão humana no momento, não automática.
  - **Cobertura de regras situacionais** (cf. discussão F05 da Spec 0023): regras como CORE-09/10 que se aplicam em momentos específicos são entregues pelo handoff quando contextualmente relevantes, em vez de viverem pré-distribuídas sem contexto de momento.
- **Escopo absorvido — SSOT do contexto repo-interno (era candidata "Arquitetura de regras portáveis vs. contexto framework-interno"):**
  - Hoje, contexto que deveria ser "lido por qualquer agente, em qualquer provider, em qualquer máquina" se acumula em 3 camadas mal definidas: (a) bloco `<AI_GUIDELINES>` em `AGENTS.md` (portável, mas não suporta contexto repo-interno); (b) fora de `<AI_GUIDELINES>` no próprio `AGENTS.md` (cresce ad-hoc, sem taxonomia, sprawla); (c) memória de provider (não-portável, não-versionada, invisível para outros agentes).
  - **Princípio violado:** ADR 0018 declara `AGENTS.md` como output runtime AI-agnóstico, não como SSOT sprawling.
  - **Direções a explorar:** novo bloco compilado em AGENTS.md (`<REPO_INTERNAL>`) com SSOT em `.governance/repo-internal.md`; arquivo paralelo canônico (`.governance/agent-context.md`); tag de escopo nas regras existentes (`repo-internal` além de `universal`/`adapter`/`opt-in`); convenção para memory feedbacks (espelho em artifact versionado obrigatório).
  - **Política de migração obrigatória junto com qualquer direção:** declarar explicitamente quais trechos atuais fora de `<AI_GUIDELINES>` em AGENTS.md passam a ser **proibidos**, **opcionais** ou **compilados/movidos** para a nova camada. Sem isso, vira "4ª camada" sem desativar a 2ª.
- **Obrigações metodológicas cruzadas (revisita obrigatória na abertura desta candidata):**
  - **[DEC-0023-F05]** (Spec 0023, decision-brief) — decisão sobre SSOT do princípio CORE-09/10 (PRs Draft + Draft→Ready exige revalidação) foi deferida em PR5 S5 da Spec 0023 com critério estrutural vinculado à abertura desta candidata. Sob a lente do ADR 0022, CORE-09/10 são regras situacionais que o handoff entrega contextualmente; o destino final da SSOT do princípio (ADR nova dedicada, nota cruzada para ADR 0021, ou distribuição em camadas) depende do comportamento real do canal de entrega — observável apenas quando este `handoff-as-first-class` materializar. Ao abrir a spec, F05 deve ser revisitada e fechada (Resolved A/B/C, novo Deferred com critério mais específico, ou Moved to spec própria se a discussão amadurecer). Sem essa revisita, F05 permanece em Deferred estrutural e o Bloco F da Spec 0023 fica formalmente incompleto.
- **Pré-requisitos:**
  - Spec 0023 mergeada (atômico ponta-a-ponta per ADR 0020).
  - ADR 0022 promovida de `Proposta` para `Aceita` no fechamento da 0023.
- **Sinal de "está na hora":** Spec 0023 fechar. Sem condição adicional — vinculação metodológica explícita por ADR 0022; gap de portable context já observado empiricamente (memory feedbacks que não viajam).
- **Riscos antecipados:**
  - **Versão híbrida virar pretexto para LLM no runtime** ("o LLM ajuda a preencher os TODOs"). Mitigação: critério de revisão de ADR 0022 (gatilho explícito de reabertura).
  - **Handoff virar nova burocracia** ("mais um ritual antes de qualquer ação"). Mitigação: integração com `workflow continue` existente — não criar verbo novo se possível.
  - **Stubs canais (.cursorrules etc.) saindo de sincronia** com o conteúdo do handoff. Mitigação: CI drift check (similar ao `living-docs:check`).
  - **Criar uma 4ª camada de contexto sem retirar a 2ª** (sprawl piora). Mitigação: política de migração obrigatória declarada acima.
  - **Excesso de prescrição** pode prejudicar flexibilidade de cada provider. Mitigação: cada provider pode ler/honrar a SSOT à sua maneira; o que o framework garante é a existência da SSOT no repo.
- **Não-objetivos:**
  - Eliminar `AGENTS.md` ou ADRs como SSOT — handoff é canal de entrega, não autoridade.
  - LLM no runtime para gerar/refinar handoff (viola ADR 0018).
  - Substituir `workflow continue` resumido — handoff é para boot frio; continue serve continuação dentro de fluxo.
  - Reinventar memory engine. A solução é estrutural (onde mora o texto), não computacional.
  - Forçar todos providers a comportamento uniforme.
- **Slug:** `handoff-as-first-class` (per ADR 0017). Slug definitivo a confirmar quando a spec abrir — pode evoluir para algo mais amplo como `agent-context-distribution-and-handoff` se o escopo absorvido predominar.

### 3. `boilerplate-system-modernization` (escopo expandido — absorve "stack-agnostic refactor" e "retrofit tasks-mixed-boilerplate D01")

> **Vinculação metodológica:** materializa [DEC-0023-F03](../../../.governance/specs/0023-workflow-runtime/decision-brief.md) (boilerplate dedicado por classe) e [DEC-0023-F04](../../../.governance/specs/0023-workflow-runtime/decision-brief.md) (múltiplos paths por classe). Sem essa modernização, F03+F04 cravados em PR5 S5 ficam no papel — sistema atual de boilerplates não suporta a tríade arquitetural B+B+A+A da Spec 0023.
>
> **Consolidação 2026-05-22:** absorve duas candidatas anteriores que tocavam o mesmo sistema de templates — "Refatorar boilerplates SDD para serem stack-agnostic" (criada em 2026-05-20) e "Retrofit `tasks-mixed-boilerplate` para honrar `[DEC-0023-D01]`" (criada em 2026-05-21). As três candidatas mexem nos mesmos arquivos; manter separadas geraria specs sobrepostas. Escopos absorvidos detalhados abaixo.

- **Fonte do insight:**
  - DEC-0023-F03 e F04 resolvidos em PR5 S5 (2026-05-22) cravam que cada classe MECE ganha boilerplate próprio + path próprio. Implementação não cabe na Spec 0023.
  - Auditoria 2026-05-20 (PR `fix/package-scripts-reorganization`) identificou que boilerplates SDD distribuídos carregam exemplos hard-coded com `yarn` como referência dominante, confundindo consumidores não-JS.
  - Auto-violação observada em 2026-05-21 durante PR #23: sub-bloco `[1.E]` do `tasks.md` da 0023 herda granularidade fine-grained do boilerplate (`1.X.N`, `1.X.[COMMIT]`), contradizendo `[DEC-0023-D01]` ("tasks.md é boundary de autorização, NÃO checklist fino").
  - **Hipótese estrutural emergente (2026-05-22):** categorização atual de boilerplates pode estar induzindo inversão de lifecycle (governance/execution). Owner observou que: (a) spec "deterministic" hoje carrega `decision-brief.md` — campo originalmente típico de mixed/evidence-driven, sugerindo que as fronteiras entre as 3 classes estão borradas; (b) spec "mixed" induz flexibilidade temporal entre decision e execution, podendo encorajar início de implementação sem decision-brief completo. Caso real observado: PR5 da Spec 0023 nasceu como `[🧾🔒]` PR governance-only para sanear Bloco F pendente, mas a abertura desse PR só foi necessária porque a inversão (execution iniciada com governance incompleta) aconteceu silenciosamente. Investigação dedicada faz parte do escopo desta candidata (vide cf. lição em `NEXT.md` da Spec 0023 § "Lição dogfooding — PR governance-only durante implementação ativa é anti-pattern").
- **Diagnóstico estrutural:** o sistema de boilerplates do framework nasceu em contexto anterior à existência do CLI, do workflow runtime e do wizard operacional. Carrega peso conceitual desalinhado ao framework atual. Enquanto boilerplates permanecerem desalinhados, o lifecycle continuará reproduzindo comportamento legado mesmo após convergência semântica dos DEC/ADR — cada nova spec instanciada repete a violação silenciosamente.
- **Escopo proposto — refresh + modernização (a confirmar quando a spec abrir):**
  - **Refresh do boilerplate atual de `spec`** — auditar peso conceitual herdado de contexto pré-CLI/pré-workflow/pré-wizard. Eliminar partes obsoletas; alinhar ao framework atual.
  - **Extração de core comum entre boilerplates** — identificar invariantes universais leves (accountability + traceability + outcome registration, research §8.1 da 0023) e materializar como núcleo compartilhado. Cada boilerplate por classe importa o core e adiciona partes específicas.
  - **Boilerplates dedicados por classe** (per F03) — spec, experiment, spike, incident, fix/patch combinado, proposal. Implementação por classe acontece quando o pilar específico for materializado (anti-premature-abstraction); a infraestrutura comum (core extraído, mecanismo de versionamento) vem nesta spec.
  - **Múltiplos paths no consumidor** (per F04) — `.governance/{specs,proposals,spikes,incidents,experiments,fixes,patches}/{slug}`. `adopt` cria a topologia automaticamente.
  - **Estratégia de versionamento de boilerplates pós-npm** — como mudanças se propagam para consumidores via `adopt`; semver dos templates; compatibilidade entre versões; estratégia de migração quando boilerplate evolui.
  - **Integração com wizard CLI** — wizard ajuda o consumidor a selecionar o boilerplate adequado por classe; lógica de seleção declarativa (cf. insight `Wizard operacional mínimo` em `NEXT.md` da Spec 0023).
- **Escopo absorvido — boilerplates stack-agnostic (era candidata "Refatorar boilerplates SDD para serem stack-agnostic"):**
  - Sintoma específico: linhas como `**1.A.N** Pipeline de check + test verde` ou `**3.2** Pipeline canônico verde: ... ex. no ai-guidelines: yarn check:repo` em `tasks-*-boilerplate.md`, `plan-boilerplate.md`, `spec-boilerplate.md` empurram consumidores não-JS para configurar yarn.
  - **Princípio a aplicar:** boilerplates distribuídos devem referir-se a **conceitos** (pre-commit hook + pre-push hook, format-on-save, drift guard), não a **comandos concretos de um stack**. Concretizar com ferramenta análoga ao stack do consumidor é responsabilidade do agente que instancia a spec.
  - **Não-objetivo:** não criar template para cada stack — manter um boilerplate por classe, com exemplos balanceados (1 frase conceitual + 1-2 exemplos em stacks diferentes).
  - **Material reusável:** edições aplicadas e revertidas estão na branch `fix/package-scripts-reorganization` (revertidas antes do merge); diff de referência via `git log -p`.
- **Escopo absorvido — retrofit tasks-mixed-boilerplate D01 (era candidata "Retrofit `tasks-mixed-boilerplate` para honrar `[DEC-0023-D01]`"):**
  - Sintoma: todo sub-bloco em `tasks-mixed-boilerplate v=3` carrega `[1.X.N]` (pipeline verde), `[1.X.[COMMIT]]` (mensagem de commit literal) — checklist operacional fino, não boundary de autorização.
  - **Princípio a aplicar:** `tasks.md` declara apenas decomposição autorizada + escopo do boundary + gates de autorização (`[REVIEW]`, `[COMMIT]` permanecem; são handoff explícito per ADR 0021). DoD operacional fino (pipeline, mensagem literal de commit, granularidade por arquivo) migra para `plan.md § Critérios de Aceite Detalhados`.
  - **Cuidado crítico:** retrofit precisa preservar gates explícitos de autorização (`[REVIEW]`, `[COMMIT]`) que ADR 0021 craveia como handoff humano — só "checklist operacional cego" sai; gates ficam. Confundir os dois recriaria o problema oposto (perda de autorização explícita).
- **Pré-requisitos:**
  - Spec 0023 mergeada (atômico ponta-a-ponta per ADR 0020).
  - DEC-0023-F03 e F04 cravados (já resolvidos em PR5 S5).
- **Sinal de "está na hora":** Spec 0023 fechar (sem isso, F03+F04 ficam no papel) OU implementação de qualquer classe ≠ spec ser pleiteada.
- **Riscos antecipados:**
  - **Refresh do boilerplate de spec quebrar specs ativas que já o consumiram** — mitigação: política de migração explícita; versionamento semver; specs antigas referenciam versão antiga até migração planejada.
  - **Core comum vira camada de abstração frágil** — mitigação: extração baseada em invariantes empíricos do research §8.1, não em design especulativo.
  - **Versionamento de boilerplates introduz overhead operacional** — mitigação: reaproveitar semver já praticado pelo pacote npm; mudança maior só quando uso real exigir.
  - **Stack-agnosticism mal-calibrado** perde clareza de "como na prática se faz isso?". Mitigação: 1 frase conceitual + 1-2 exemplos concretos em stacks diferentes.
- **Não-objetivos:**
  - Reescrever lifecycle da Spec 0023 (ADR 0020, ADR 0021, DEC-0023-D01, F01–F05 são premissas estáveis).
  - Mover boilerplates para fora do repo (continuam SSOT versionado).
  - Criar template para cada stack — manter um boilerplate por classe, com exemplos balanceados.
- **Slug:** `boilerplate-system-modernization` (per ADR 0017).

---

## Candidatas

_(sem candidatas soltas no momento — todas as candidatas pré-existentes foram consolidadas em `Now` na operação de sanitização do PR5 S5 da Spec 0023, 2026-05-22. Novas candidatas que emergirem devem ser registradas aqui antes de promoção para `Now`, com sinal de "está na hora" observável.)_

---

## Bloqueadores cross-spec

_(populado conforme blocos cruzam fronteiras de spec)_
