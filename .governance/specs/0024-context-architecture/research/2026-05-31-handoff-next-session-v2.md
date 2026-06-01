# Handoff v2 — Retomada da Spec 0024 `context-architecture` (fase de ABSORÇÃO OPERACIONAL)

> **Para:** próxima sessão (qualquer agente/máquina). **De:** sessão 2026-05-31 (owner + Claude Opus 4.8 + Codex GPT-5.5 + ChatGPT GPT-5.5).
> **Leia ANTES de qualquer ação. Supersede `2026-05-31-handoff-next-session.md` (v1, pos-G00).**
> **Objetivo:** retomar em **EXECUÇÃO de PRs de absorção**. A pesquisa acabou; o trabalho é fazer o sistema refletir decisões já tomadas.
> **Meta (dogfooding):** este handoff é também evidência do que um handoff precisa preservar para sobreviver à troca de sessão/contexto/agente — ver §8.

> ## ⚠️ ERRATA de vocabulário (2026-05-31, Checkpoint 2.1) — ler antes do §4
>
> Este handoff usa **"PR-1 … PR-12"** para unidades de implementação — **isso era drift** (conflita com Pull Request real do GitHub; a 0023 já diagnosticara em `review.md` R6: _"drift 'PR6' não existe"_). **Corrigido em `plan.md`**, que é a **SSOT do plano** a partir de agora. Releia o §4 com esta tradução:
>
> - **PR-N → Checkpoint N** (unidade de implementação da spec). **PR / `#N`** passa a significar exclusivamente Pull Request real do GitHub.
> - **ritual de checkpoint → Gate**: `Technical Audit Gate` (Codex) → `Architectural Review Gate` (ChatGPT) → `Human Gate` (owner).
> - **Topologia (alinhada à 0023):** `#32` = **PR de governança/bootstrap** (Checkpoint 1 + 2 + 2.1) e **encerra** (mergeia em `main`). **Checkpoint 3 em diante = Pull Requests reais independentes** off `main` (modo `sequential`, ADR 0024). **Integration PR** terminal + `review.md` no encerramento.
> - **Proveniência:** `ref: #<PR> @ <sha>` · `checkpoint: <N>` · `role: <papel>`.
>
> O §4 abaixo (tabela "PLANO DE PRs") fica **preservado verbatim como trilha datada**; a versão viva e correta é `plan.md § "Sequência de Checkpoints"` + `§ "Topologia operacional"`.

> ## ⚠️ Histórico (não operacional) — tudo abaixo é registro datado
>
> **Se você só ler uma coisa:** leia [`plan.md`](../plan.md) § **"Glossário operacional"** + § **"Topologia operacional"** — é a **SSOT do plano**.
>
> **Qualquer ocorrência de `PR-1 … PR-12`** no corpo abaixo (notadamente §0 e §4) é **histórica** e deve ser lida como **`Checkpoint 1 … Checkpoint 12`**. Da mesma forma, "EXECUÇÃO de PRs de absorção" (objetivo, topo) lê-se "execução de **Checkpoints** de absorção". Este handoff foi escrito **antes** da correção de vocabulário (Checkpoint 2.1); permanece **preservado verbatim como trilha datada**, mas **não é operacional**. O estado vivo e correto está em `plan.md` / `tasks.md` / `state.yml`.

---

## 0. O que mudou nesta sessão (executivo)

A 0024 **saiu da pesquisa e entrou em absorção operacional.** Conclusão-raiz (validada pela auditoria do Codex): **o problema não é falta de decisão — é falta de absorção.** Decisões convergidas ainda não alteraram o comportamento do sistema ("a arquitetura converge enquanto o código diverge").

**5 commits nesta branch** (`feat/spec-0024-context-architecture`, sem push — CORE-07):

| Commit    | O quê                                                                                                                                                                    |
| :-------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `c2a9ef9` | decision-brief reestruturado **por estado** (Decidido/Aberto/Virou regra/Virou enforcement) + **`[DEC-0024-G02]` Resolved** (marcador `(julgamento)`/`(determinístico)`) |
| `41db912` | **GG-0001** — 1º guardrail dogfoodado (regra + check `gate-decidability-check` + projeção no boilerplate)                                                                |
| `055b1b9` | **`WorkflowType` removido do domínio** (execução de G02; `Recipe`/`ComposedArtifact`/`StructuralValidation` + testes + recipe)                                           |
| `180b55b` | absorve achados Codex #3 (`Deferred` canônico) + #4 (**GG-0001 → interno**, fora de `rules.json`) + alinha `state.yml` (`implementation`/`closed`)                       |
| `87865ca` | **PR-1** — publica 0024 no índice público (`active-specs.yml`) via `workflow publish-state`                                                                              |

**PR-1 fechou o checkpoint completo** (Claude → Codex → ChatGPT → gate humano @rosanarezende, os 4 comentários no PR #32). **Próximo: PR-2.**

---

## 1. Contexto OPERACIONAL — reinstalar EXPLICITAMENTE (F-007)

- **Idioma:** **pt-BR em toda saída.** Disciplina de **falsificação = modo ATIVO** (discordar com evidência, inclusive do owner e dos revisores).
- **Tetra-party (papéis, não entidades):** **owner decide** · **Claude (Opus 4.8) constrói** · **Codex (GPT-5.5) auditoria técnica** · **ChatGPT (GPT-5.5) revisão arquitetural** (leitor tardio). A cadeia produziu achados que nenhum agente isolado produziu — o caso-prova é o achado CRÍTICO do Codex (taxonomia removida ainda ensinada pelo runtime).
- **Fluxo de checkpoint (experimento operacional da 0024):** `Claude implementa → para no checkpoint → Codex audita → ChatGPT revisa → owner decide → Claude continua`. **1 PR atômico por vez**, parar no checkpoint quando o commit estiver pronto. Correções locais pequenas NÃO esperam validação externa; mudanças estruturais (runtime/regra/projeção/doutrina/migração) SIM.
- **Commits — HARNESS LOCK:** `yarn format ; yarn validate ; git add ; git commit`. **`[CORE-14]` humano roda/autoriza; `[CORE-07]` push/rename remoto só com autorização explícita.** Agente sugere a mensagem. Cada commit dispara husky (build:rules + suíte).
- **Deliberação:** owner prefere **prosa** a `AskUserQuestion`. **Web-research** pré-autorizada.
- **Critério de trabalho (cravado pela owner):** _"já foi validado empiricamente na 0024?"_ → **absorver / enforçar / executar.** NÃO re-modelar, NÃO re-pesquisar o que convergiu, NÃO empurrar para backlog/spec futura o que já foi decidido.
- **RISCO DOMINANTE:** voltar para rodadas de modelagem em vez de remover divergências uma a uma. O gargalo agora é **execução**.

## 2. Identidade do projeto (NÃO re-derivar)

`ai-guidelines` = framework **governance-first, AI-as-channel** (ADR 0018: nenhum LLM no runtime; CLI determinístico; **repo é memória**; AI é canal). A spec **dogfooda o próprio framework.** PR vivo **#32** (Draft). `.governance/` é canônico; `.specify/` é legado (ADR 0019).

## 3. Estado dos artefatos (o que já está absorvido)

- **`decision-brief.md`** — organizado por **estado**, não por numeração. `[DEC-0024-G00]` (identidade), `[DEC-0024-G02]` (taxonomia removida), `[DEC-0024-G06]` (contrato da cadeia) = **Resolved**. Numeração G00–G06 = âncora + mapa de rastreabilidade, **não eixo de leitura**.
- **`state.yml`** — `stage: implementation`, `gate.status: closed`. **NÃO descreve mais discovery.**
- **`active-specs.yml`** — lista 0023 + **0024** (PR-1).
- **GG-0001** — guardrail **interno** (dogfooding), em `governance-foundation.md § "Guardrails dogfoodados"` + check `cli/governance/gate-decidability-check.mjs` (no `validate`). **NÃO em `rules.json`** (não consumer-facing). Fonte `DOGFOOD-*` na `sources-taxonomy`.
- **`Deferred`** = status canônico (adiamento consciente com critério de revisita).
- **`WorkflowType`** removido do domínio (código). **Resíduos pendentes** (Codex): runtime/doutrina ainda ensinam a taxonomia (ver §4 PR-7) + docs arquiteturais (PR-12).

## 4. PLANO DE PRs — CONGELADO (sequência inline, não dependa de arquivo local)

> ⚠️ O plano detalhado vive em `~/.claude/plans/proud-painting-rain.md` — **arquivo local/efêmero, NÃO sobrevive a troca de máquina/agente.** Por isso a sequência está **embutida aqui**. **No PR-2, dobrar esta sequência para dentro do `plan.md` da spec** (artefato canônico no repo), aposentando a dependência do arquivo local.

Backlog = **relatório de auditoria do Codex** (referência principal de divergências decisão↔código). Cada PR: atômico, mergeável, reversível, com checkpoint Codex/ChatGPT/owner.

| PR         | Objetivo                                                                                                                                                                                                                                                                                                                                                                                               | Deps        | Status                       |
| :--------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------- | :--------------------------- |
| **PR-1**   | `active-specs.yml` lista a 0024 (Codex A3)                                                                                                                                                                                                                                                                                                                                                             | —           | ✅ feito + gated (`87865ca`) |
| **PR-2**   | reframe `tasks/plan/NEXT/spec` → absorção (Codex A2/P1/P2); `spec.md` via nota datada sem apagar histórico; **dobrar este plano no `plan.md`**                                                                                                                                                                                                                                                         | —           | ⏭️ **PRÓXIMO**               |
| **PR-3**   | **GG-0003 Consistency Projection Check** — estritamente mecânico: `state.yml` é fonte de verdade + lista FIXA de marcadores literais contraditórios (`"Stage 1 ativo"`, `"gate aberto"`, brief `Pendente`…). Sem parsing semântico.                                                                                                                                                                    | PR-2        | pendente                     |
| **PR-4A**  | **Workflow Provenance · storage** — `.governance/runtime/provenance.yml` (append-only, runtime-scoped). Campos: `spec`(obrig.)/`actor`/`role`/`at`/`ref`, `model?` opcional. **`role` = string LIVRE** (novos papéis sem schema). **Espinha** `implementation`+`human_gate` = sempre DERIVADA (git/active-specs), não persistida, nunca bloqueia. **Opcionais** persistidos (audit/review/security/…). | PR-1/2      | pendente                     |
| **PR-4B**  | **Workflow Provenance · projeção** no `workflow continue`: impl (derivada) + `Auditorias/revisões registradas:` (lista de tamanho variável) + gate (derivado) + `Revisão independente: PENDENTE/OK`. Mostra **fatos/pendências**, NUNCA prescrição (DEC-0023-B06 lookup-not-coordination). **Provenance = projeção, NÃO compliance/bloqueio/lifecycle.**                                               | PR-4A       | pendente                     |
| **PR-5**   | **AGENTS sync** — `agents:build` (recompila bloco `<AI_GUIDELINES>` de `rules.json`) + `agents:check` (gate no `validate`). Destrava PR-7.                                                                                                                                                                                                                                                             | —           | pendente                     |
| **PR-6**   | **GG-0002 mecanismo** — `banned-concept-check` + registro `banned-by-dec.yml` (sem termo live ainda) + fixture. **Antes** da remoção.                                                                                                                                                                                                                                                                  | —           | pendente                     |
| **PR-7**   | **CRÍTICO (Codex A1/P0)** — remover taxonomia `evidence-driven/deterministic/mixed` de `GR-0101`→`AGENTS.md`, `governance-foundation §"Tipos de spec"→"Propriedades de bloco"`, `spec-boilerplate` ×2; **registrar o ban no mesmo commit** (sem janela de regressão).                                                                                                                                  | PR-5 + PR-6 | pendente                     |
| **PR-8**   | corrigir path morto na msg do `gate-decidability-check` (→ `governance-foundation § Guardrails`) (Codex B1)                                                                                                                                                                                                                                                                                            | — (flex)    | pendente                     |
| **PR-9**   | desacoplar existência do `decision-brief` de `evidence-driven/mixed` (Codex B3)                                                                                                                                                                                                                                                                                                                        | PR-7        | pendente                     |
| **PR-10**  | tasks boilerplate **único**; aposentar 3 variantes; renomear recipe/partials `tasks-evidence-driven`→genérico (Codex C2/C3)                                                                                                                                                                                                                                                                            | PR-7        | pendente                     |
| **PR-11A** | drift-guard do legado `.specify/templates` (estanca a hemorragia) (Codex C1)                                                                                                                                                                                                                                                                                                                           | PR-10       | pendente                     |
| **PR-11B** | trocar fonte ativa → root canônico (⚠️ **micro-decisão da owner:** `.core/templates` vs `.ai-guidelines/templates`)                                                                                                                                                                                                                                                                                    | PR-11A      | pendente                     |
| **PR-11C** | remover legado `.specify/templates` após 11B estável                                                                                                                                                                                                                                                                                                                                                   | PR-11B      | pendente                     |
| **PR-12**  | limpar docs arquiteturais de `workflowType` (ARCHITECTURE.md, ADR 0014 nota histórica) (Codex B2/D1)                                                                                                                                                                                                                                                                                                   | —           | pendente                     |

**Ordem de valor:** PR-1✅ → PR-2 → (PR-3 consistência + PR-4A/B proveniência: barreiras novas **antes** da migração) → PR-5+PR-6 → **PR-7 (o crítico, protegido)** → PR-9/10 → PR-11A/B/C → PR-8/PR-12 (flex).

## 5. Decisões cravadas (NÃO revisitar sem evidência nova)

G00 identidade · G02 taxonomia removida (marcador explícito) · G06 contrato da cadeia · `Open` abolido / DEC nasce `Pendente` / `Deferred` canônico · brief por estado · GG-0001 interno · guardrail = regra+check com fonte `DOGFOOD-*`, **interno** (não consumer-facing) · proveniência **runtime-scoped**, `role` livre, espinha (impl+gate) derivada, **projeção não governança** · GG-0002 instalado **antes** da remoção, ban ativado no mesmo commit.

## 6. Aprendizados desta sessão — candidatos a absorção (ainda NÃO formalizados)

> Surgiram do uso real da stack. Triar numa próxima sessão: alguns viram guardrail/check, outros finding, outros só nota. **Não over-modelar.**

1. **Drift silencioso SSOT→projeção é o padrão recorrente nº 1.** A mesma forma apareceu 4×: `state.yml`↔`active-specs` (A3), `rules.json`↔`AGENTS.md` (C4), `state.yml`↔`tasks/plan/NEXT/brief` (A2), código↔`ARCHITECTURE.md` (B2). **Sinal arquitetural:** _toda aresta SSOT→projeção precisa de um gate de sync, ou diverge em silêncio._ Os PRs 3/5 são instâncias; vale generalizar (candidato a guardrail-classe ou princípio).
2. **Validação mecânica vs semântica** — todo guardrail deveria declarar seu **subconjunto 🤖 (check falha)** e **👁 (julgamento humano)**, como GG-0001 fez. Candidato a regra de autoria de guardrails. _Validar via clean-clone/smoke é o complemento para o que `yarn validate` não pega (correção de distribuição — ex.: PR-11): `test:smoke` existe e deveria gatear PRs que afetam o que o consumidor recebe._
3. **Simplificação cognitiva do gate humano à medida que a automação cresce** — observado ao vivo: o `gate-decidability-check` achou os 4 defeitos do G02 _no lugar do_ owner reler tudo; o gate encolheu para "ratificar a afirmação única / dizer go". **Pattern:** enforcement absorve a parte mecânica do julgamento, deixando ao humano só o julgamento irredutível (coerente com ADR 0021 + imagem das 3 camadas; ainda não nomeado como pattern).
4. **Handoff como artefato operacional de continuidade — e sua fragilidade:** o plano executável viveu em `~/.claude/plans/` (local/efêmero). **Lição:** um handoff (e o plano) NÃO pode depender de estado local de ferramenta; tem de carregar a sequência + decisões no **repo** (por isso §4 está inline; por isso PR-2 dobra no `plan.md`). Reforça F-007/ADR 0022.
5. **Anti-taxonomia é recorrente em todos os níveis** — apareceu em G02 (tipos de spec), guardrails (família GG-*), e roles de proveniência. **Disciplina:** ao remover uma taxonomia fechada, resistir a recriá-la um nível acima; preferir *propriedade livre + papéis reconhecidos (hints de projeção)\*, não enum fechado.
6. **DX do `workflow continue`:** projeta branch/spec/estado, mas não a cadeia operacional (quem implementou/auditou/decidiu) — gap que motivou PR-4. Operador quer "onde estamos + quem tocou + o que está pendente" num olhar.
7. **"Enforcement previne a classe, não o sintoma"** — GG-0002 protege contra reintrodução do conceito banido, não só corrige o caso atual; o guard entra **antes/junto** da correção (sem janela de regressão).

## 7. O que NÃO fazer na retomada

- **Não reabrir** G00/G02/G06 nem a reforma do brief. **Não re-modelar** a arquitetura — está congelada.
- **Não tratar absorção como pesquisa.** Não empurrar decidido para backlog/spec futura.
- **Não depender** do arquivo de plano local (`~/.claude/plans/`) — a verdade executável é a §4 deste handoff (e, após PR-2, o `plan.md`).
- **Não fazer** proveniência virar compliance/bloqueio (é projeção). **Não** congelar `role` em enum.
- **Não encadear** vários PRs estruturais sem passar pelo checkpoint.

## 8. Meta — o que este handoff demonstra que um bom handoff precisa preservar (dogfooding)

Um handoff sobrevive à troca de sessão/contexto/agente quando carrega, **no repo**, os quatro:

1. **Contexto operacional** (idioma, papéis, disciplinas, locks) — sem ele o agente retoma "errado" (F-007).
2. **Sequência executável + decisões cravadas** — embutida, não por referência a estado local/efêmero.
3. **Aprendizados ainda não absorvidos** — senão reaprendemos o mesmo (é o próprio anti-padrão que a 0024 combate).
4. **O que NÃO fazer** — fronteiras explícitas contra reabrir o decidido e re-modelar.

## 9. Pré-condições a verificar na retomada

Branch `feat/spec-0024-context-architecture` · 5 commits (`c2a9ef9`→`87865ca`) · `git status` limpo · `yarn validate` verde · `state.yml` = `implementation`/`closed` · PR #32 Draft com 4 comentários de checkpoint do PR-1 · **próxima ação: PR-2.**
