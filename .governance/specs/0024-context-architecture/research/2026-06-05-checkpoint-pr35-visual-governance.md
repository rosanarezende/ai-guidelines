# Checkpoint de Continuidade — PR #35: governança visual + modelo epistêmico (SSOT de retomada)

> **Documento de RETOMADA canônico** (ADR 0022, situado). Assume zero acesso à conversa anterior.
> **Supersede para retomada** o `2026-06-04-checkpoint-pr35-intent-surface.md` — as decisões daquele
> seguem válidas (Registry/Intent/Wizard/contrato Command), mas o estado e a sequência avançaram.
> Data: 2026-06-05. Consolida o já decidido; **sem decisões novas**.

---

## 1. Estado atual

| Item         | Valor                                                                                                       |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| Branch       | **`feat/spec-0024-pr-cli-cutover`** (= PR **#35**, Draft), stacked sobre `#34`                              |
| HEAD         | **`49b700d`** (pushed; local = origin)                                                                      |
| Working tree | limpo · `yarn validate` verde                                                                               |
| PR #35       | OPEN · Draft · base `feat/spec-0024-insights-in-flight` (#34) · título `[🛠️3️⃣➜] [Spec 0024] pr-cli-cutover` |
| Modo         | `unit` (não mergeia isolado)                                                                                |

**O #35 acumulou, além do cutover, DUAS entregas desta sessão:** (a) etapas 1–3 parciais da convergência das ops avançadas a Commands; (b) **governança visual obrigatória com enforcement por gate**. E uma descoberta arquitetural capturada (modelo epistêmico, PIT-0007).

---

## 2. Commits desta sessão (`2a33f04..HEAD`) — o que cada um introduziu

| Commit    | Introduziu                                                                                                                                                                 |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `9a5ef86` | **Etapa 1**: contrato `Command.prompt?(ctx)` + `CommandContext.prompts?` (aditivo/opcional; não toca os 5 commands)                                                        |
| `ec5772e` | **Etapa 2a**: `list-active-specs` → `ListActiveSpecsCommand` (`specs`, read-only) + Intent `inspecionar-specs-ativas`                                                      |
| `b7ab390` | **Etapa 2b**: `diagnose-drift` → `DiagnoseDriftCommand` (`drift`, read-only) + ação no mesmo Intent                                                                        |
| `2706350` | **Etapa 3 (wiring)**: `dispatch` escolhe produtor — `prompt(ctx)` sse `ctx.prompts && command.prompt`, senão `parse(rest)`; `runIntent` injeta `prompts`                   |
| `28c3579` | **Etapa 3**: `visual-prompt` → `VisualPromptCommand` interativo (parse/prompt/run) + Intent `gerar-prompt-visual`; catálogo `VISUAL_PROMPT_OPTIONS` → módulo compartilhado |
| `2845e07` | ~~`pr-visual` (comando)~~ — **REVERTIDO** (ver `4b5a7a7`)                                                                                                                  |
| `ad860e9` | **Modelo epistêmico**: captura PIT-0007 + `research/2026-06-04-epistemic-commitment-model.md`                                                                              |
| `4b5a7a7` | **Revert do `pr-visual`** (over-modeling — base limpa)                                                                                                                     |
| `f2f0bdb` | **Governança visual** obrigatória com enforcement por gate (matriz aprovada)                                                                                               |
| `9843384` | **Correção**: gatear o **prompt final**, não a imagem (Ready não bloqueia por gerador externo)                                                                             |
| `49b700d` | **Correção (Achado A)**: Draft/Ready de fonte ÚNICA (flag `isDraft` do GitHub); remove regex no body                                                                       |

---

## 3. Decisões cravadas nesta sessão — **NÃO REABRIR**

### 3.1 Contrato Command + convergência (etapas 1–3 parciais)

- **`Command.prompt?(ctx): Promise<TOptions>`** é o dual interativo opcional de `parse`. Um `run` compartilhado, dois produtores de input. O **`dispatch` seleciona** o produtor (`ctx.prompts && command.prompt` → prompt; senão parse). **Não criar segundo tipo de Command.**
- **`specs`/`drift`** (read-only, sem prompt) e **`visual-prompt`** (interativo, com prompt) migrados a Commands + Intents. visual-prompt **provou o desenho limpo** (`prompt` só produz `TOptions`; `run` idêntico nas duas superfícies; sem estado intermediário; sem lógica no wizard).
- Nomes `specs`/`drift`/… são provisórios (taxonomia `state` deferida); a ESTRUTURA é o cravado.

### 3.2 `pr-visual` REVERTIDO — a imagem visual é seção AUTORADA, não comando

- O prompt visual é **conteúdo autorado do PR** (como o Resumo), produzido pela IA que prepara o PR (AI-as-Channel, ADR 0018). **Não** é comando, **não** precisa de transporte/persistência/arquivo versionado. `pr-visual` era over-modeling — revertido.

### 3.3 Governança visual obrigatória (matriz aprovada, com enforcement real)

- **O artefato GATEADO é o PROMPT FINAL autorado** (paste-ready), **não a imagem**. A imagem é a renderização externa: opcional no Ready, **obrigação de publicação em R4 (degradável** — deferral declarado se gerador indisponível; prompts preservados).
- **`governance-pr-check`** (required check, roda no CI) FALHA por estado epistêmico: **#1 Visão pretendida + #3 Valor entregue** em PR de execução Ready; **#1 + #4 Convergência** no Integration PR. **#2 Capacidade opcional** (nunca falha). fast-track bypassa. **Draft é isento**. O gate aceita o prompt (bloco ` ``` `) **ou** a imagem.
- **Estado Draft/Ready vem EXCLUSIVAMENTE do flag `isDraft` do GitHub** (fonte única, idêntica ao `MergeStack`). O checkbox de lifecycle no body é **documental** — nunca enforcement.
- Atualizados: `.github/pull_request_template.md`, `integration-pr-boilerplate` + `review-boilerplate` (R4) nos dois roots (`.ai-guidelines/` + `.specify/`), doutrina **CORE-09/CORE-10/GR-0203** (fonte `.core/rules/` → AGENTS.md regenerado via `update`), `WORKFLOW.md`.

### 3.4 Modelo de compromisso epistêmico — capturado, NÃO cristalizado

- Descoberta: topology, PR lifecycle, gates, `WorkflowStage`, `KnowledgeStage`, disclosure são **instanciações de UM princípio gerador**: _compromisso epistêmico monotônico gateado por evidência_ ("não afirmar além do que a evidência sustenta"). É **princípio gerador, NÃO enum universal de estados** (falsificado).
- Status correto (o próprio modelo aplicado a si): **insight em trânsito** (PIT-0007) + research de fundação. **Caminho:** capturar → observar reaparecer → só então ADR/doctrine (`pr-doctrine`, sequence 5). **Guardrail ao cristalizar: não reificar um enum universal.**

---

## 4. Hipóteses falsificadas/descartadas nesta sessão — **NÃO REABRIR**

- ❌ `pr-visual` como comando (over-modeling) → revertido; é seção autorada.
- ❌ Gatear a **imagem** no Ready → acopla o Ready a serviço externo/ortogonal (gerador pode estar fora) → gateia-se o **prompt final**.
- ❌ Visual prompt como **meta-prompt embutido** (prompt-que-gera-prompt) → é o **prompt final autorado** direto.
- ❌ Visual prompt precisar de transporte/persistência/arquivo versionado → não há problema de transporte; é seção do body.
- ❌ Modelo epistêmico como **enum universal de 4 estados** → falsificado; é princípio gerador (instanciações de granularidade variável por domínio).
- ❌ **Checkbox do body** como fonte de Draft/Ready → eliminado; fonte única = flag do GitHub.

---

## 5. Direção arquitetural assumida

1. **Registry = SSOT execução · Intent = SSOT navegação · Wizard = cliente** (do checkpoint anterior — mantida).
2. **Command** = `parse` (CLI) + `prompt?` (wizard) → `run` compartilhado; `dispatch` seleciona o produtor por `ctx.prompts`.
3. **Governança visual** = prompt final autorado é o artefato gateado (AI-as-Channel); imagem é publicação downstream (R4, degradável); estado por `isDraft` do GitHub.
4. **Modelo epistêmico** = lente capturada (PIT-0007 + research), ainda não doctrine; orienta decisões (a imagem casa com o estado epistêmico do marco).
5. **ADR 0024 Ready→Mergeable** = enforcement **parcial** por limite estrutural do GitHub; `MergeStack` é o executor inevitável da aterrissagem atômica.

---

## 6. Sequência executável restante

### 6a. **DECISÃO PENDENTE (bloqueia a etapa 3): `confirm-in-run`**

> Pausada pela owner. **Investigação ENCERRADA** (não reabrir): o padrão `plan → display → confirm → execute` é **cravado em ADR 0024 §"Operational CLI commands"** (CLI helpers transacionais, Tier 2/3) e instanciado em **3 casos reais**: `integration-open`, `merge-stack`, `release-prep` (todos com use case `plan()`/`execute()`). **Menor modelagem correta:** um **portão transacional compartilhado** que recebe `(plan, renderPlan, confirmSource)` e faz display→confirm→execute, com `confirmSource = ctx.prompts (wizard) | flag --yes (CLI)`. NÃO é novo tipo de Command, nem estado intermediário. **Falta a owner decidir o shape e autorizar.**

### 6b. Etapa 3 restante (após 6a)

> **SUPERSEDED (2026-06-06):** `confirm-in-run` resolvido (sem abstração) e a "migração de `integration-open`/`merge-stack` a Commands" **FALSIFICADA** (ADR 0026 — são passos do `workflow`, não capabilities de 1ª classe). SSOT atual: `2026-06-06-checkpoint-pr35-cutover-knowledge.md`.

- Migrar **`integration-open`** + **`merge-stack`** a Commands (consumindo a resolução do `confirm-in-run`).
- **Reduzir/remover** a seção "⚙️ Operações avançadas" do wizard (entradas paralelas hoje duplicam `specs`/`drift`/`visual-prompt`).

### 6c. DONE do #35 (do checkpoint anterior — ainda válido)

- Bootstrap (`init`/`adopt`/`providers`/`update`) → registry; remover fallback `engine.mjs`/`args.mjs`; rename `review.ts → triage.ts`.
- `pr-compiler-ts` (sequence 4) = nó próprio subordinado, **depois** do #35.

---

## 7. Riscos conhecidos

- **Token budget** universal em **1709/1500 (114%)** após as cláusulas de doutrina visual — **soft/consultivo** (cravado; build NÃO falha). Enxugar o EN das rules é opção futura.
- **Governança visual aplicada a si mesma:** quando **#35** for levado a Ready, precisará de **#1 + #3** (prompt final) no body, senão o `governance-pr-check` falha (a feature vale para o próprio PR). Hoje #35 é Draft → isento.
- **`confirm-in-run` não resolvido** bloqueia a conclusão da etapa 3.
- **Gap Ready→Mergeable** (investigado, §9): mapeado, **sem decisão tomada**; `MergeStack` + disciplina seguram hoje. Não é regressão — é estado conhecido.

---

## 8. Próximos passos concretos

1. **Owner decide `confirm-in-run`** (moldura pronta: portão transacional com `confirmSource`).
2. Implementar `integration-open` + `merge-stack` como Commands (TDD/BDD pt-BR).
3. Reduzir/remover "Operações avançadas".
4. (depois) Bootstrap → registry + remoção do fallback + rename `review→triage`.

---

## 9. Investigações ENCERRADAS nesta sessão — **NÃO REABRIR**

- **Auditoria adversarial (Antigravity) — Achado A (state drift Ready/Draft):** **VERDADEIRO** → **CORRIGIDO** (`49b700d`). Havia duas fontes de verdade (`MergeStack` usava `isDraft`; `governance-pr-check` usava regex no body). Convergidas ao flag `isDraft` do GitHub; `isReadyForReview` removido (0 ocorrências). 4 testes de regressão (isDraft × checkbox) provam o checkbox ignorado.
- **Achado B (R4 "enforcement ilusório"):** **FALSO**. (1) enforcer errado — R4 é validado por `CheckIntegrationReadiness` (checkbox em `review.md`), não por `reviewCheck` (que lê ymls de `reviews/`+`gates/`); (2) modelo de gate errado — **nenhum** R-gate auto-valida conteúdo; R1/R5/R8 também são checkbox + evidência humana; (3) premissa superada — R4 agora é publicação degradável (assets OU deferral).
- **Enforcement da ADR 0024 (Draft→Ready→Mergeable):** **Draft→Ready = real** (estado nativo do GitHub). **Ready→Mergeable = parcial**. O gap é **MISTO**: o _bloqueio_ de merge prematuro **é corrigível no GitHub** (required check topology/R8-aware) — lacuna de implementação; mas a **aterrissagem multi-PR atômica** + o **bind absoluto do top-owner** (repo pessoal) são **limite ESTRUTURAL do GitHub** → `MergeStack` é dependência inevitável. (Mapa completo: ver histórico da sessão; **nenhuma decisão/correção foi tomada** — investigação pura, a pedido.)
- **Discussão de imagens:** produziu uma **lente** (o estado epistêmico decide qual projeção é honesta), não uma feature isolada.

---

## 10. Disciplinas

pt-BR · TDD + BDD pt-BR (DADO/QUANDO/ENTÃO) · `yarn format`/`yarn validate` antes de commit · **CORE-07**: push autorizado por increment verde (cadência (a)) · **NÃO** mergeia em main (modo unit) · contrato `Command`/`Registry` só muda de forma aditiva/opcional · não criar segundo sistema · **fluxo de checkpoint** (mudanças estruturais: Claude→Codex→ChatGPT→Rosana antes de avançar; correções locais pequenas não esperam).

---

## 11. Higiene de contexto — o que este checkpoint supersede

- **Supersede PARA RETOMADA:** `2026-06-04-checkpoint-pr35-intent-surface.md` (era o SSOT anterior, commit `2a33f04`). Suas **decisões seguem válidas** (Registry/Intent/Wizard/contrato Command); o **estado e a sequência** avançaram — use ESTE como ponto de partida.
- **Históricos já superados pela cadeia anterior** (não reabrir): `2026-06-04-checkpoint-draft-first-convergence.md`, `2026-06-04-checkpoint-human-gate-pr34.md`, e os `*-handoff-next-session*` de 2026-05-29 a 2026-06-03.
- Memória `spec-0024-resumption-ssot` atualizada para apontar a este checkpoint.

> **Suficiência:** este checkpoint + o research do modelo epistêmico (`2026-06-04-epistemic-commitment-model.md`) + os artefatos versionados (código, templates, doutrina, `insights.yml` PIT-0007) contêm todo o raciocínio desta sessão. Uma sessão nova pode descartar o contexto conversacional sem perda nem regressão.
