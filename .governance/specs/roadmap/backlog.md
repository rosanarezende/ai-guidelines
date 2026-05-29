# Backlog — `.governance/specs/` (canônico)

> **Localização canônica em diante.** Conforme [ADR 0019](../../../.core/governance/adrs/0019-governance-specs-root-in-maintainer.md), novas specs e novas entradas de backlog entram aqui. O backlog legado em [`.specify/specs/roadmap/backlog.md`](../../../.specify/specs/roadmap/backlog.md) permanece como referência histórica até cutover caso-a-caso.

> **Regra de ouro.** Nada aqui entra em execução sem nova spec (`.governance/specs/<NNNN>-<slug>/`). Este arquivo é leitura obrigatória antes de abrir spec nova ou fechar uma spec existente.

> **Política repo-first, integração-friendly.** O repositório é a memória canônica. Ferramentas externas (GitHub Projects, Issues, Linear, etc.) podem ser camada colaborativa via campo opcional `tracker` nas entradas; o resumo mínimo aqui é mandatório.

> **Consolidação aplicada em 2026-05-22 (PR5 S5 da Spec 0023).** O backlog foi reduzido de 6 candidatas soltas para 3 candidatas agrupadas em `Now` (com sub-escopos absorvidos explicitamente) + seção `Candidatas` zerada. Critério: candidatas que tocam o mesmo sistema (boilerplates, contexto IA) foram consolidadas; cada grupo deve virar uma spec única em vez de N specs sobrepostas. Histórico de absorção registrado nas próprias entries.

Detalhes de lifecycle em [`.core/process/governance-foundation.md`](../../../.core/process/governance-foundation.md).

---

## Em execução

### Spec 0024 — Context Architecture (spec fundacional de arquitetura de contexto, evidence-driven)

- **Branch:** `feat/spec-0024-handoff-as-first-class` (slug-alvo: `context-architecture`; rename físico em milestone próprio — cf. header de `spec.md`).
- **Instanciada em:** 2026-05-28 · **Elevada a spec fundacional em:** 2026-05-29.
- **Status:** Stage 1 (Research) ativo. **Elevada** de "handoff-as-first-class" para a **arquitetura canônica de preservação, promoção, seleção e projeção de contexto**; handoff é uma das projeções. Decision-brief ganhou o **Bloco G — Arquitetura Fundacional** (`G00` raiz → `G05`) acima dos 5 eixos (A-F); invariante de ordem "A-F não estabiliza até `G00 Resolved`".
- **Pré-requisitos atendidos:** Spec 0023 mergeada ✅; ADR 0022 Aceita ✅ (PR #29, 2026-05-28).
- **Camadas-modelo absorvidas (Grupo A do inventário):** taxonomia de specs + contrato/core de boilerplate (de `boilerplate-system-modernization`); definição de lar canônico/precedência/ownership (de `runtime-and-template-root-consolidation`); contratos de handoff (`handoff-contracts-formalization`). **Camadas-execução (Grupo B) permanecem nas candidatas.** Fronteira: **modelo ≠ migração**. Cf. [`research/2026-05-29-architectural-inventory.md`](../0024-handoff-as-first-class/research/2026-05-29-architectural-inventory.md).
- **Implementação:** entregue **dentro desta spec** (Stage 2, faseada como na 0023) — handoff + boilerplate de referência. O split `0024 → 0025` **não é pressuposto** (só se a research revelar mudança de direção relevante).
- **Detalhes:** [`.governance/specs/0024-handoff-as-first-class/`](../0024-handoff-as-first-class/) (spec + decision-brief + plan + tasks + state + research).

---

## Now (próxima fila, ordem importa)

> **Sobre a ordem.** As candidatas em `Now` são instanciáveis após a Spec 0023 fechar (originalmente 3; 1 promovida a spec ativa em 2026-05-28 — ver `Em execução`). A ordem abaixo segue critério misto (anti-paper urgency + bloqueio downstream + DX). Owner pode reordenar quando o momento da abertura chegar.

> **Reordenação aplicada em 2026-05-28.** `handoff-as-first-class` promovida de posição 2 para posição 1 com base em evidência operacional pós-fechamento da Spec 0023: sessão com handoff situado manualmente produziu aderência operacional significativamente superior à sessão iniciada com `AGENTS.md` estático; o problema gera fricção ativa agora; a solução emergiu empiricamente. `governance-dashboard-and-visual-artifacts` passa para posição 2 — permanece relevante como camada de projeção e visualização do estado governado, mas não resolve a fricção operacional imediata de bootstrap situado entre sessões/agentes. ADR 0023 permanece `Proposta` — promoção deferida pendente de esclarecimento da sua primeira materialização após estabilização do runtime de handoff.

> **Atualização — 2026-05-28 (mesma data).** `handoff-as-first-class` instanciada formalmente como **Spec 0024 (research-first / evidence-driven)** e movida para `## Em execução`. Now passa a ter 2 candidatas restantes: `governance-dashboard-and-visual-artifacts` (§1) e `boilerplate-system-modernization` (§2). Renumeração refletida abaixo. Nota de reordenação acima preservada como histórico do raciocínio que levou à promoção.

### 1. `governance-dashboard-and-visual-artifacts`

> **Classificação 2026-05-29 (inventário da Spec 0024): Grupo C — consumidor, não fundação.** O _modelo_ de projeção (uma SSOT → N projeções) vive na 0024 (`[DEC-0024-G05]`); este dashboard é uma **instância de projeção** que consome esse modelo. Permanece candidata independente; **não absorvida**.

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
  - ADR 0023 permanece `Proposta` — promoção deferida pendente de esclarecimento da primeira materialização pós-handoff (ver nota de reordenação 2026-05-28).
- **Sinal de "está na hora":** `handoff-as-first-class` fechar (ou evidência empírica consolidada de que o primeiro caso de materialização da ADR 0023 continua sendo o dashboard).
- **Riscos antecipados:**
  - **HTML virar "produto SaaS"** — adicionar JS interativo, autenticação, filtros runtime complexos. Mitigação: framing canônico anti-distorção de ADR 0023 (linguagem rejeitada).
  - **Prompts visuais perdendo aderência ao estado real** — risco de imagem gerada em momento X ficar obsoleta no momento Y. Mitigação: prompts versionados são instruções para regenerar, não imagens cacheadas.
  - **Padrão YAML+JSON+HTML aplicado a markdown narrativo por engano** — viola ADR 0023 item 5 (aplicabilidade restrita a meta-artefatos). Mitigação: critério de revisão explícito do ADR.
- **Não-objetivos:**
  - Reinventar Jira/Linear/Notion no repo. Dashboard é visualização **estática derivada** de SSOT YAML; SSOT continua editável via PR.
  - Filtros interativos runtime, busca client-side complexa, autenticação. Tudo isso reabre trade-off contra "database + UI custom" (opção 3 rejeitada do ADR 0023).
  - Geração de imagens via LLM no runtime (viola ADR 0018). Prompts são templates declarativos; geração acontece em ferramenta externa, manualmente, sob comando do humano.
- **Sub-escopo cravado em PR5 S5 — investigação automatizada local para prompts visuais:** o wizard CLI (opção 6 do menu, opção `[c]` do submenu) hoje exibe placeholder "em breve" para o caminho automatizado. Implementação: substituir o passo manual de investigação por execução determinística de comandos `git`/`gh` (lê PR body, decision-brief, ADRs, CHANGELOG) no wizard, montando síntese estruturada antes de emitir o prompt de imagem. Preserva ADR 0018 (sem LLM no runtime; só shell determinístico + parsing local). Cf. embrião em `.governance/visual-prompts/` cravado em PR5 1.H.12 e cf. label "[em breve]" no menu do wizard.
- **Evidência empírica do escopo de investigação automatizada (sessão Antigravity em 2026-05-22 sobre PR #25):** o agente IA conversacional executou ~28 operações para reunir contexto suficiente para o prompt de valor entregue — a maioria reproduzível deterministicamente em runtime sem LLM. Lista observada para informar o protótipo:
  - **Por PR:** `gh pr view <N> --json title,body,headRefBranch,baseRefBranch,files`; `git log <base>..<head> --oneline`; `git diff <base>...<head> --stat`; `gh pr view <N>` (body markdown).
  - **Por spec:** listar `.governance/specs/<id>-<slug>/`; ler `state.yml`, `tasks.md`, `decision-brief.md` (filtrar por sub-bloco grep), `NEXT.md`; identificar ADRs referenciadas em `.core/governance/adrs/`.
  - **Cross-cutting:** `git log --all --grep=<N> --oneline`; `git status`; `git log origin/main..HEAD --oneline`; ler `CHANGELOG.md` (filtrar seção `[Unreleased]`); ler `.governance/specs/roadmap/backlog.md`.
  - **Padrão:** maioria dos comandos é `git` puro + leitura de markdown estruturado + `gh` para metadata do PR. Nenhum exige LLM no runtime — geração do prompt final pode acontecer por template + interpolação determinística. Quando contexto local é insuficiente (ex.: PR fechado fora do repo, sem `gh` disponível), wizard cai gracioso para o fluxo (b) (manual via IA conversacional).
- **Slug:** `governance-dashboard-and-visual-artifacts` (per [ADR 0017](../../../.core/governance/adrs/0017-spec-numbering-slug-to-branch.md)).

### 2. `boilerplate-system-modernization` (escopo expandido — absorve "stack-agnostic refactor" e "retrofit tasks-mixed-boilerplate D01")

> **Re-escopa 2026-05-29 (elevação da Spec 0024).** A **camada-modelo** desta candidata — validade/substituição da taxonomia de tipos de spec + **contrato mínimo de boilerplate + extração do core comum** — foi **absorvida pela Spec 0024** (Grupo A do inventário; `[DEC-0024-G02]`/`G04`). Esta candidata permanece como a **camada-execução (Grupo B)**: migração/retrofit dos boilerplates por classe, versionamento, stack-agnostic, examples, quickstart, paths — executada **dado o contrato que a 0024 cravar**. Fronteira modelo ≠ migração. Cf. [`inventário da 0024`](../0024-handoff-as-first-class/research/2026-05-29-architectural-inventory.md).

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
- **Items deferidos da Spec 0023 absorvidos aqui (revisita obrigatória na abertura):**
  - **Spec 0023 / [1.H.4]** — `examples/minimal-spec/` por classe (per F03+F04: cada classe MECE ganha example próprio, sem reproduzir violação de [DEC-0023-D01] do boilerplate atual).
  - **Spec 0023 / [1.H.6]** — `docs/guides/workflow-quickstart.md` (dogfoodado com sistema modernizado, não com boilerplate atual). Cobertura: enforcement L2, criação de spec, comandos da CLI, integração com wizard.
- **Slug:** `boilerplate-system-modernization` (per ADR 0017).

---

## Candidatas

> Novas candidatas que emergirem entram aqui antes de promoção para `Now`, com sinal de "está na hora" observável.

### `runtime-and-template-root-consolidation`

> **Re-escopa 2026-05-29 (elevação da Spec 0024).** A **definição** do lar canônico / precedência / ownership dos artefatos (o _princípio_ de topologia) foi **absorvida pela Spec 0024** (Grupo A do inventário; liga Bloco F / `[DEC-0024-G05]`). Esta candidata permanece como a **execução (Grupo B)**: cutover dos ~13 touch-points, remoção dos roots legados, mover specs legadas, colapsar templates (Fase 4). Cf. inventário arquitetural da 0024.

> **Registrada no PR #25 (2026-05-25) como captura docs-only.** NÃO inicia agora — gatilho de abertura abaixo. Esta entry preserva o aprendizado para que o cutover não se perca nem recomece do zero.

- **Contexto:** o framework mantém **tri-root permanente** — `.governance/` (canônico atual), `.specify/` (legado: specs antigas + templates-fonte + backlog/historico não-sanitizados) e `.ai-guidelines/` (legado: `sdd_dir` com config + templates mirror). O custo é real e recorrente: humano e LLM gastam tokens reverse-engineering quem é fonte vs. mirror vs. recipe; cada concern (specs, templates, contrato de consumer) vive em ≥2 lugares; é fonte ativa de confusão e drift. Diagnóstico empírico levantado durante o fechamento da Spec 0023.
- **Evidências (a direção já foi decidida — faltou execução + forcing function):**
  - **ADR 0008** — removeu o legado `.ai-guidelines/` (era `rules/` multi-arquivo); ele **ressurgiu** como `sdd_dir` (config + templates mirror).
  - **ADR 0019** — `.governance/specs/` root no mantenedor, mas declarou `.specify/` bridge **"sem deprecation timeline"** → "sem prazo" é exatamente o que tornou a dualidade permanente.
  - **Spec 0021** — declarou `.governance/` como **SSOT canônica no consumidor**, e marcou o mirror `.specify/templates/` como **formalmente deprecado** (fallback). Mas o código ainda usa `sdd_dir=.ai-guidelines` e `pointers.mjs` aponta specs para `.specify/specs/`; o cutover do consumer contract (0021 NEXT item 2.D.2) nunca completou.
  - **Conclusão:** ninguém decidiu manter os legados — três decisões mandaram matá-los/depreciá-los. Faltou (a) terminar o cutover, (b) um prazo, (c) uma forcing function de CI.
- **Plano faseado (Bucket B — proposta pós-0023, não implementar aqui):**
  - **Fase 0 — ADR de consolidação** (supersede 0019): crava `.governance/` como root único maintainer+consumer + os 3 invariantes (abaixo) + **prazo de remoção** de `.specify/` e `.ai-guidelines/`.
  - **Fase 1 — Consumer contract parity:** `sdd_dir` default → `.governance`; `pointers.mjs` → specs em `.governance/specs/`; `adopt`/`init` criam `.governance/` no consumer. (maior ganho/custo — corrige a assimetria que é a causa-raiz)
  - **Fase 2 — Eliminar o double-lookup do runtime** (≈13 touch-points: `CheckIntegrationReadiness`, `ReadWorkflowState`, `PublishState`, `OpenIntegrationPR`, `CheckExecutionAuthorized`, `workflow.ts`, `AssembleBriefing`, `governance-pr-check`, `DiscoverWorkspace`, `WorkspaceState.LegacySource`, `collectLocalContext`).
  - **Fase 3 — Specs legadas + backlog/historico:** congelar/mover as 8 specs de `.specify/specs/`; sanitização completa do backlog legado (a triagem mínima abaixo é só o começo).
  - **Fase 4 — Colapsar templates:** uma fonte só; eliminar o mirror `.specify/templates/`. **Overlap explícito com `boilerplate-system-modernization`** (eixo recipe-vs-flat) — coordenar para não duplicar.
  - **Fase 5 — Forcing function + remoção:** ligar o check de CI; remover os legados quando o prazo vencer e zero referências restarem.
- **Princípios (transversais — deliverables da spec futura, não ADR novo agora):**
  - **Paridade maintainer/consumer (dogfooding):** o mantenedor usa o layout **idêntico** ao que entrega ao consumer; CI falha se divergir. (teria impedido o split `.governance` maintainer vs `.ai-guidelines`/`.specify` consumer)
  - **Migração sempre com timeline + condição de remoção do antigo** — proibir "sem deprecation timeline".
  - **Forcing function de CI** — falha se um root legado ganhar conteúdo **novo**, ou se maintainer/consumer divergirem de layout.
- **Obrigação metodológica cruzada (não pode ser ignorada):** antes de abrir esta spec, **triagem completa** do backlog legado `.specify/specs/roadmap/backlog.md` é obrigatória, e deve produzir atualização do backlog canônico (`Now`/`Next`/`Later`) **com justificativa por item**. A triagem mínima abaixo (PR #25) é o ponto de partida, não a triagem completa.
- **Gatilho de abertura:** **somente após a Spec 0023 fechar** (stack mergeada + Integration PR #26 resolvido).
- **Itens vivos detectados no backlog legado (triagem mínima — PR #25):** _(espelha a seção homônima em `.specify/specs/roadmap/backlog.md`; a spec futura não pode ignorar)_
  1. **`recipes-mirror-to-engine-migration`** — _alta_ — só 1 de 11 recipes migrado; o mirror `.specify/templates/` é o débito que esta consolidação + `boilerplate-system-modernization` precisam fechar.
  2. **`seguranca-ia-supply-chain`** (era spec 0012) — _alta_ — threat model OAuth de AI tools (governança do operador humano); sem lar; gatilho por incidente provável.
  3. **`harness-engineering`** (era spec 0009) — _média_ — agente validador separado + eval-as-gate + sensores; combate "falso done"/slop; não entregue.
  4. **`cli-mjs-to-src-ddd-cutover`** — _média_ — `cli/*.mjs` legado convive com `src/*.ts`; alimenta diretamente a consolidação topológica.
  5. **`stakeholder-intake-pipeline`** — _média_ — PRD/intake estruturado → spec; sem contrato de entrada, transformar demanda em spec recai toda na mantenedora.
  6. **`framework-observability-dashboard`** (telemetria) — _média_ — métricas vivas (Tok-H, eval baseline, adoção npm); **overlap parcial com `Now`#1 `governance-dashboard-and-visual-artifacts`** — verificar absorção vs. recorte de telemetria.
  7. **`pr-curator-action`** — _média_ — `pr-curator` é fantasma (citado em ADR 0009/CHANGELOG, sem código); automação cross-repo.
  8. **`regra-hierarquia`** (era spec 0011) — _média_ — fragmentação de `AGENTS.md` por subdir no consumidor; gatilho por pressão de tokens.
  9. **`handoff-contracts-formalization`** — **absorvida (Grupo A) pela Spec 0024** (2026-05-29) — contratos de handoff stage→release / consumer→maintainer entram na research fundacional (Bloco G / `[DEC-0024-G05]`). Item da triagem fechado por absorção; cf. inventário arquitetural da 0024.
  10. **`core-rules-top-naming-audit`** — _baixa_ — fronteira `agents-core.md` (CORE-\*) vs `global-rules.md` (GR-\*) confunde; débito migrado do 0021.
  11. **`cli-update-notifier`** — _baixa_ — sensor "vX.Y disponível, rode update" pós-npm; infra de update já existe, falta o aviso.
  12. **`quota-awareness`** (era spec 0014) — _baixa_ — dashboard de quota opt-in; gatilho por consumidor estourar quota.
- **Slug:** `runtime-and-template-root-consolidation` (per [ADR 0017](../../../.core/governance/adrs/0017-spec-numbering-slug-to-branch.md); pode evoluir na abertura).

### `coverage-rigor-enforcement`

> **Registrada no PR #25 (2026-05-25) como captura docs-only.** Detalhamento máximo proposital — esta entry precisa carregar todo o contexto para uma LLM futura abrir a spec sem reconstruir o diagnóstico.

- **Contexto:** o framework declara fundação **DDD + BDD + TDD**, mas o próprio repo **não dogfooda 100% desse rigor**. Durante o fechamento da Spec 0023 (review do Copilot no PR #25), surgiram achados que um framework TDD-first não deveria permitir — incluindo inconsistência de texto de help (`release-prep` fora da linha "Uso") e qualidade frágil de teste (`REPO_ROOT` via `.pathname`, `FakePrompts.input` mascarando prompts). A dor é estrutural, não pontual.
- **Diagnóstico estrutural (causa-raiz):**
  - O gate de coverage é **≥85% agregado** (cf. critério de aceite da própria 0023). **Agregado esconde o buraco:** uma camada bem-coberta (`src/`, DDD/TS) compensa estatisticamente uma mal-coberta.
  - A camada **`cli/*.mjs`** (bridge/entrypoint legado, anterior ao DDD) escapa do rigor que `src/` tem. **`cli/cli/args.mjs` (parsing de argumentos da CLI) vive nessa camada** — deveria ser 100%, mas não é. Caso emblemático: a linha "Uso:" desatualizada não seria pega por nenhum teste unitário existente.
  - **Não é falta de TDD documentado — é falta de _enforcement_.** Mesmo padrão do tri-root (`runtime-and-template-root-consolidation`): o princípio existe, falta a forcing function que o torna inevitável. Um framework TDD-first com piso agregado de 85% e uma camada inteira fora do rigor é a **mesma incoerência de dogfooding** capturada em [[feedback-migration-needs-timeline-and-dogfooding-parity]] (paridade: o mantenedor deve viver o rigor que prega).
- **Escopo proposto (a confirmar na abertura):**
  - **Piso por-arquivo/por-camada**, não só agregado: cada arquivo de `src/` e de `cli/` tem mínimo próprio; agregado deixa de poder mascarar regressão local. (jest `coveragePathIgnorePatterns`/`coverageThreshold` por glob + gate equivalente no runner node de `cli/`.)
  - **100% obrigatório em paths críticos:** parsing de argumentos (`args.mjs`/sucessor), use cases de domínio, serializers/validators de schema, e qualquer código que decida autorização (ex.: `CheckExecutionAuthorized`, `CheckIntegrationReadiness`). Critério: "código que, se quebrar silenciosamente, corrompe estado ou autorização → 100%".
  - **Cobrir texto/contrato que teste unitário não pega:** gate que valide consistência de help/usage (ex.: snapshot do `printHelp` ou teste que cruza `SUPPORTED_MODES` com a linha "Uso:" e com os blocos de comando). Foi exatamente o gap do review do Copilot.
  - **Forcing function de CI:** PR que reduz coverage de qualquer arquivo crítico abaixo do piso **falha** (não só o agregado). Estende `governance-pr-check` ou o gate de coverage existente.
  - **Mutation testing (opcional, escopo de avaliação):** coverage de linha ≠ coverage de asserção. Avaliar mutation testing (ex.: Stryker) em paths críticos para fechar o gap "linha executada mas não assertada" — overlap com `harness-engineering` (sensors/eval-as-gate); decidir se mora aqui ou lá.
- **Obrigações metodológicas cruzadas (revisita obrigatória na abertura):**
  - **`cli-mjs-to-src-ddd-cutover`** (item vivo triado) — a camada `cli/*.mjs` é precisamente a que escapa do rigor; o cutover remove a causa. Coordenar: ou esta spec espera o cutover, ou crava piso para `cli/*.mjs` enquanto ele existir. Não duplicar.
  - **`harness-engineering`** (era spec 0009) — sensors automáticos obrigatórios (typecheck/testes como gate, mutation kill rate, detecção de bugs típicos de IA) materializam "caminho não-testado não pode existir". Mutation testing provavelmente mora lá; esta spec foca no **piso/enforcement de coverage**. Decidir a fronteira na abertura.
  - **Feature `quality-gates`** (opt-in existente) — esta spec pode endurecer o gate distribuído aos consumidores, não só o do mantenedor (dogfooding: o que exigimos de nós vale para quem adota).
- **Princípio guia:** **dogfooding de rigor** — o framework exige de si o mesmo nível de teste que prega aos consumidores. Coverage agregado é métrica de vaidade; piso por-arquivo + 100% em paths críticos + forcing function é a versão honesta. Cf. [[feedback-migration-needs-timeline-and-dogfooding-parity]].
- **Não-objetivos:**
  - 100% cego em todo o repo (testar getters triviais, re-exports, types) — vira fricção sem valor. O alvo é **paths críticos a 100% + piso saudável no resto**, não cobertura cosmética universal.
  - Reescrever testes existentes que já cobrem comportamento — o foco é fechar buracos estruturais, não churn.
  - Embutir LLM no runtime para "gerar testes" (viola ADR 0018). Geração assistida por IA é trabalho do agente no canal, não comportamento do runtime.
- **Riscos antecipados:**
  - **Piso alto vira fricção** se aplicado cego — mitigar com a fronteira "crítico=100% / resto=piso saudável" e allowlist explícita de exclusões justificadas.
  - **Mutation testing infla tempo de CI** — restringir a paths críticos; rodar full em schedule, não em todo PR.
  - **Overlap com 3 candidatas** (cutover, harness, quality-gates) → risco de specs sobrepostas. Mitigar com a obrigação cruzada acima: decidir fronteiras na abertura, possivelmente abrir como **uma** spec coordenadora.
- **Evidência empírica (PR #25, 2026-05-25):** review do Copilot pegou o que o gate de 85% agregado deixou passar — prova viva de que o piso atual é insuficiente para a tese TDD-first do framework.
- **Débitos de cobertura concretos herdados da Spec 0023 (triados do `NEXT.md` na R3, 2026-05-25 — alvos diretos do piso por-arquivo):**
  - **REPL structured commands** (`gate`/`gaps`/`next`/`quit` digitados) sem cobertura em `src/cli/workflow.ts` — pré-existentes do REPL (PR1). Escrever 4 tests BDD triviais quando ≥1 uso externo for reportado OU as structured commands forem estendidas.
  - **`collectLocalContext.ts`** success paths de `gh`/`git` ~65% — **não** expandir via mocks de `execFileSync` (frágil e contraditório ao best-effort); cobrir com integration test (subprocess + fs reais) quando `governance-dashboard-and-visual-artifacts` materializar.
  - **`governance-pr-check.ts`** ~62% — bloco de validação de chain integrity exercitado só via CI real; cobrir se uma falha de CI revelar gap que unit test teria barrado.
  - **Adapters de I/O:** `JsonRulesCatalogSource.ts` 0%, `InquirerPrompts.ts` 40%, `NodeClipboard.ts` 71% — nível certo é integration (TTY/clipboard/JSON real); expandir se a porta ganhar tipo novo OU bug em consumidor externo.
  - **Chore pós-merge:** 10 test files sem label `[BR-*]` (lista preservada no histórico git do `NEXT.md`) — batch `chore(tests): padroniza BR labels`. Não-bloqueador; também listado em `Later`.
- **`it.skip` de comportamento `[DEC-0021-*]` — RESOLVIDOS no PR terminal da 0023 (`[DEC-0023-O02]`, 2026-05-27).** Auditoria dos 14 skips (originalmente registrados aqui como dívida a diferir) mostrou que **~12 eram duplicatas stale** de comportamento já testado vivo sob abstrações refatoradas, não código mal-coberto. Sanitização executada: `FileSystemAdapter.test.ts` removido (abstração morta); 9 skips removidos com pointer ao teste vivo; 1 design superado retirado (`[DEC-0021-C01]` — living-docs desacoplada); 2 comportamentos parciais viraram teste real (preservação de comentários + ordem estável em `RegistryRoundTrip.test.ts`); 1 feature genuína implementada (soft-delete via `InMemoryRegistry.archive()`, `[DEC-0021-A01]`). **Não há mais skip silencioso com ID de DEC no repo.** Detalhe completo em `[DEC-0023-O02]`.
  - **Resta nesta candidata — a forcing function:** gate que falha quando um `it.skip` carrega ID de decisão (`[DEC-*]`/`[ADR-*]`) sem entry correspondente em backlog/spec aberta — fecha na raiz a brecha de "skip invisível ao living-docs" (o extractor só captura `[BR-CLI-*]`). Decidir na abertura se vive aqui ou em `harness-engineering`. **Sem ela, nada impede um novo skip silencioso reabrir a mesma classe de risco de O01/O02.**
  - **Follow-up de produto (quando houver consumidor):** cabear `archive()` através do port `RegistryStore` + comando CLI (`ArchiveItem`/`DeleteItem`) — hoje a operação existe só no domínio, sem use case que a invoque (boundary explícito de O02, não dívida silenciosa).
- **Gatilho de abertura:** após a Spec 0023 fechar. Sinal adicional de urgência: qualquer novo review (humano ou IA) que pegue gap que um gate de coverage por-arquivo teria barrado.
- **Slug:** `coverage-rigor-enforcement` (per ADR 0017; pode evoluir na abertura, ex.: `test-rigor-and-coverage-floor`).

### `wizard-menu-scaling-redesign`

> **Triada do `NEXT.md` da 0023 na R3 (2026-05-25).** Sinal arquitetural com critério observável; não inicia agora.

- **Contexto:** o wizard cresceu **5 (`[DEC-0023-B06]`) → 6 (`B07`) → 8 (`[DEC-0023-L01]`)** opções em ~3 turnos, dentro de uma única spec. Hoje o menu flat com icons (📍 📡 🔗 🔀 📋 🔍 🎨) + agrupamento por posição (navegação / governance / inspeção / utilidade) resolve, mas as categorias semânticas ficaram **implícitas** — não cravadas como modelo. Se cada spec futura adicionar 1–2 ops de governance (revert-stack, archive-spec, branch-rebase), o menu vira lista densa difícil de escanear.
- **Critério de abertura:** ≥10 opções no wizard **OU** ≥2 usuários reportarem confusão de navegação **OU** uma única spec lifecycle exigir >2–3 visitas ao wizard.
- **Escopo provável:** separadores/categorias visíveis; multi-step (`categoria → ação`); subcomandos tipo `git`/`gh` (`workflow lookup`, `workflow gov`); OU split por tier (Tier 1 lookup wizard vs Tier 2 ops wizard).
- **Vetado por default:** auto-ranking de opções, contextual filtering ("mostrar só o que faz sentido no stage"), "próxima ação recomendada" — anti-patterns cravados em `[DEC-0023-B06]`/`[DEC-0023-L01]`; cf. memory `[[feedback_lookup_not_coordination]]`.
- **Slug:** `wizard-menu-scaling-redesign` (per ADR 0017; pode evoluir na abertura).

---

## Later (follow-ups pós-0023 — não exigem spec dedicada)

> Itens de pillar `fix`/`chore`/`patch` triados do `NEXT.md` da 0023 na R3 (2026-05-25). Executáveis como PRs pequenos pós-merge, sem abrir spec.

- **Composite action para setup compartilhado dos workflows** — `repo-validation.yml`, `smoke-multi-os.yml` e `governance-pr-check.yml` repetem ~10 linhas de setup (checkout + setup-node + cache yarn + corepack + install). Criar `.github/actions/setup/action.yml`. **Reabrir quando** >5 workflows (hoje 3) OU o boilerplate causar drift entre workflows em ≥2 ocasiões. Em 3 workflows é abstração prematura.
- **Rename cosmético `buildContextBundle()` / variável `bundle`** em `src/cli/workflow.ts` para o vocabulário canônico "contexto" — termo legado "context bundle" foi preservado no código interno no fechamento da 0023 para evitar churn; governance/CHANGELOG/docs já usam "contexto da spec". Follow-up cosmético, não-bloqueador.
- **`fix(boilerplates)`: realinhar numeração dos pointers de fase-review** nos `tasks-*-boilerplate.md` — citam "R1–R6 liberam abrir o Integration PR; R7 (merge authorization)"; o correto pós-renumeração é **R1–R7 abrem; R8 = merge auth**. Afeta 3 roots (`.core/governance/templates/partials/`, `.specify/templates/`, `.ai-guidelines/templates/`) sob `LegacyMirrorContract` (parity test). Pode ser feito standalone OU dobrado na **Fase 4** de `runtime-and-template-root-consolidation`. _(achado da R4, 2026-05-25.)_
- **`chore(tests)`: padroniza labels `[BR-*]`** em 10 test files pré-existentes (lista no histórico git do `NEXT.md`). Tests passam; falta só padronização editorial. Também referenciado em `coverage-rigor-enforcement`.

---

## Bloqueadores cross-spec

_(populado conforme blocos cruzam fronteiras de spec)_
