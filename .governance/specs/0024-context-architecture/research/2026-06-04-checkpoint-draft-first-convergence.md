# Checkpoint de Convergência — Draft-first + retomada pós-Human Gate do #34 (SSOT)

> **Documento de RETOMADA canônico** (ADR 0022, situado). Assume zero acesso à conversa anterior. **Estende e supersede** (para fins de retomada) o `2026-06-04-checkpoint-human-gate-pr34.md`: aquele parou no Human Gate pending; este registra a **convergência Draft-first** e o estado **pré-confirmação formal do gate** (que é amanhã). Data: 2026-06-04. Não contém decisões novas além das já convergidas com o owner.

---

## 1. Estado atual (git — tudo LOCAL, NADA pushed)

| Item         | Valor                                                                      |
| ------------ | -------------------------------------------------------------------------- |
| Branch ativa | **`feat/spec-0024-pr-cli-cutover`** (LOCAL, não-pushed)                    |
| HEAD         | **`2412928`** (seed Draft-first)                                           |
| Parent       | **`a2a7bda`** (gate do #34 fechado via artefato)                           |
| Working tree | limpo · `yarn validate` verde                                              |
| Stack        | `#32`→main · `#33`→#32 · `#34`(insights-in-flight)←`pr-cli-cutover`(local) |

**Commits desta sessão (na branch `pr-cli-cutover`, ainda local):**

- `a2a7bda` — **gate do #34** fechado via artefato: `gates/c-graph-core.yml` `decision: approved` (2 lanes approved / 0 findings). Vive na linha do #34 pela convenção (gate de N na branch de N).
- `2412928` — **seed Draft-first**: ADR 0025 (Aceita) + emenda CORE-09 + `rules.json`/`ledger`/`AGENTS.md` regenerados.

> ⚠️ **CONFIRMAÇÃO FORMAL do Human Gate do #34 = AMANHÃ (owner).** O artefato do gate (`approved`) já está commitado, mas a ratificação formal + os pushes são de amanhã. O owner pediu este checkpoint justamente para **não depender de memória de sessão** para preservar o estado convergido.

---

## 2. Decisões cravadas nesta sessão — **NÃO REABRIR**

| Decisão                                                                                                                                                                                 | Estado  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **Draft-first / contêiner-primeiro** como default de entrega governada (**ADR 0025, Aceita**)                                                                                           | cravada |
| Motivação primária = **topology fiel ao trabalho em tempo real** (fecha a janela de drift `planned` vs código avançando); o chicken-egg `active⟺github_pr` é consequência, não o fim    | cravada |
| Exceção **por natureza** (classes ADR 0010: `fix`/`patch`/`spike`/`incident` = código-primeiro) **e por circunstância** (opt-out declarado em trabalho governado)                       | cravada |
| Enforcement **soft** (nudge em `workflow`/`continue`/estado; nunca gate bloqueante)                                                                                                     | cravada |
| É **ADR, não Insight** (decisão madura: dor observada → solução escolhida → aplicação imediata)                                                                                         | cravada |
| CORE-09 = dono do **estado** (Draft); ADR 0025 = dono do **timing** + exceções; CORE-09 só ganha pointer mínimo                                                                         | cravada |
| **Premissa do orçamento de tokens REFUTADA**: `token-budget.mjs` é puramente **consultivo** (warning ≥75%, nunca `throw`/bloqueia build/validate/runtime). Não é restrição arquitetural | cravada |
| ADR 0025 + CORE-09 aterrissam como **seed do `pr-cli-cutover`** (não em nó separado)                                                                                                    | cravada |

Deliberação: Claude → ChatGPT (2 rodadas) → owner (concordou). Cravadas anteriores (gate, framing 0024, hipóteses descartadas) seguem no checkpoint anterior.

---

## 3. Próxima sequência executável (AMANHÃ, após confirmação FORMAL do gate)

1. **[push ①]** `push` do gate `a2a7bda` → `origin/feat/spec-0024-insights-in-flight` (#34).
2. **[push ②]** `push` da branch `feat/spec-0024-pr-cli-cutover` + `gh pr create --draft --base feat/spec-0024-insights-in-flight` → nº **N**.
3. **[commit+push]** transição da topology em `state.yml`: `#34`→`concluded`, `pr-cli-cutover`→`active` com `github_pr: N`, cursor→`pr-cli-cutover`/`checkpoint-cli-cutover`.
4. **[trabalho]** construir o cutover (registry de comandos em `src/`, dissolver costura `engine.mjs`/`args.mjs`; destravar `ag graph`/`ag why`) **dentro** do PR draft.

Disciplinas: **CORE-07** (push só com autorização — amanhã) · **NÃO** merge em main (modo `unit`) · `yarn format`/`yarn validate` antes de commit · não alterar topology fora deste passo executável.

---

## 4. Investigação PRIORITÁRIA (item C) — após os passos 1→4

**Tema:** dependência residual de contexto via `AGENTS.md` (injeção) **vs.** seleção de contexto orientada por `KnowledgeGraph`.

**Foco NÃO é orçamento de tokens.** O interesse é entender a **transição contexto-injetado → contexto-selecionado-via-grafo**. Mapear objetivamente:

- quais comandos ainda dependem **exclusivamente** da injeção do `AGENTS.md`;
- quais poderiam consumir **conhecimento projetado do grafo**;
- quais **lacunas** impedem isso hoje;
- qual seria o **primeiro caminho viável** para o `KnowledgeGraph` começar a participar da seleção de contexto.

Fato âncora da investigação: hoje o `KnowledgeGraph` é read-model projetado de Insights e **não alimenta contexto de LLM** (a injeção `AGENTS.md` é 100% do canal vivo). O `token-budget` mede **texto injetado, não conhecimento**.

---

## 5. Observação arquitetural registrada (NÃO tratar agora)

Em `NEXT.md` (Débitos da Fase de Absorção): **drift fonte↔`AGENTS.md` compilado** — o bloco `<AI_GUIDELINES>` é derivado por `update`/`adopt`, mas o `validate` não checa sync; emenda em `.core/rules/**` deixa o `AGENTS.md` stale silenciosamente. Menor correção futura: `agents-sync:check`. Levantada pelo owner nesta sessão.
