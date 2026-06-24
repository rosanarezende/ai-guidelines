---
artifact-kind: handoff-legacy
---

> ⚠️ **SUPERSEDIDO (2026-06-04)** por `research/2026-06-04-checkpoint-human-gate-pr34.md` — use **aquele** como SSOT de retomada (cobre até o Human Gate do #34: contratos 2.4e→2.4g, technical_audit + architectural_review approved). Este arquivo é mantido como **histórico**.

# Handoff — Spec 0024, retomada pós-reabertura de G03/G04/G05 (sessão nova)

> **Documento de RETOMADA situado** (ADR 0022), não resumo histórico. Assume zero acesso à conversa anterior. Objetivo: continuar a **trilha de convergência orientada a grafo** sem reabrir investigações já encerradas. **Supersede** `2026-06-02-handoff-checkpoint-3.md`.

## 0. Verificar ANTES de qualquer ação

- Branch ativa: **`feat/spec-0024-insights-in-flight`** (= **PR #34**, Draft).
- Git limpo · `yarn validate` verde (**812 testes**) · `yarn state-yml:check` (2 conformam) · `insights:check` verde (6 percepções).
- **NÃO mergeia em `main`** (modo `unit`; merge único ao fim). **CORE-07**: push/apply só com autorização explícita. **pt-BR** em toda saída. `yarn format ; yarn validate` antes de commit.

## 1. A decisão que define esta fase — `[DEC-0024-G08]` (Resolved 2026-06-03)

Os eixos **`G03`** (promotion pipeline), **`G04`** (casa única / tri-root→SSOT) e **`G05`** (projeções), deixados **abertos** no Stage 1, foram **REABERTOS para modelagem deliberada DENTRO da 0024** — porque se mostraram necessários para problemas reais observados no uso. **Direção assumida: arquitetura orientada a grafo** (entidades + relações navegáveis `KnowledgeRef` + projeções derivadas).

**NÃO REABRIR (investigações encerradas):**

- **Não existe 0025 independente.** Foi falsificado por evidência (G03/G04/G05 são eixos da própria 0024; `plan.md §41`: split 0025 superado; inventário 2026-05-29: candidatas Grupo B já catalogadas). O dir `0025-…` foi criado e **retirado** (`b3f1761`). É a modelagem deferida da 0024 ressurgindo.
- **Não re-investigar o enquadramento** (0024 vs 0025 vs transição). Encerrado: é 0024, eixos reabertos.
- **G00/G02/G06/G07 seguem cravados** — não reabrir.
- A disciplina "NÃO re-modelar" agora vale **só para o decidido**; em G03/G04/G05 modelar **é** a direção.

## 2. Estado da branch / PR #34

- **PR #34** `[🛠️2️⃣➜] [Spec 0024] Insights (capability) + fundação Knowledge + KnowledgeGraph núcleo` — Draft, base `feat/spec-0024-ruleset-producibility` (#33), `sequence 2` na topologia.
- **CI:** `governance-pr-check` ✅ (verde após a reconciliação) · `repo-validation` + `smoke` ✅. (O vermelho inicial era o check correto apontando que #34 não estava na topologia — sanado em `b3f1761`.)
- **Topologia (`state.yml § topology`, SSOT):** `#32` + `#33` **concluded**; **#34 active** (`insights-in-flight`, embarca `checkpoint-insights` + `checkpoint-knowledge-kernel` + `checkpoint-graph-core`); `planned` = trilha de convergência.

## 3. Commits relevantes (vs base #33)

| SHA       | Introduziu                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `9c7ad54` | Capability Insights — slice vertical (domínio DDD + `insights.yml` + CLI `add/saw/list` + projeção no `continue` + `insights:check`)              |
| `4fbd17a` | Ciclo de vida Insights — `promote/discard` na CLI + `insights:check` no `validate` (sem YAML manual)                                              |
| `72bd435` | Auditoria de engenharia — actor/timestamp nas terminais; remove campo morto `links`; `specId` autoritativo; forma canônica no check               |
| `42b201f` | **Fundação do domínio Knowledge** — kernel `KnowledgeStage`/`KnowledgeRef`/`KnowledgeArtifact`; Insight = estágio 0; aresta de graduação derivada |
| `d06035d` | (histórico) persistiu o programa em `0025/state.yml` — **depois retirado** em `b3f1761`                                                           |
| `ab883a8` | **`pr-graph-core`** — núcleo do `KnowledgeGraph` (read-model; `KnowledgeGraph.from`, `knowledgeGraphFromInsights`)                                |
| `b3f1761` | **Reconciliação `[DEC-0024-G08]`** — reabre G03/G04/G05; topology (#33 concluded, #34 active, trilha de convergência); retira o dir 0025          |

## 4. O que JÁ EXISTE no código (não reconstruir)

- `src/domain/insight/*` — agregado `Insight` (VOs, policy, transitions, ledger) + `insightKnowledge.ts` (estágio 0 + `graduationRefOf`).
- `src/domain/knowledge/*` — `KnowledgeStage` (pipeline), `KnowledgeRef` (aresta + validação de forma), `KnowledgeArtifact` (contrato de extensão).
- `src/app/projections/KnowledgeGraph.ts` + `knowledgeSources.ts` — read-model (puro; cresce monotônico; semeado por Insights).
- `src/cli/insight.ts` (`add/saw/list/promote/discard`) + `src/cli/insightsCheck.ts` (invariantes + forma canônica + arestas).
- `.governance/runtime/insights.yml` — ledger (6 percepções; **PIT-0004..0006 = motivação da convergência**, consultável por `insight list`).
- **Padrão para as próximas entidades:** Decision/Rule/Guardrail/Doctrine **implementam `KnowledgeArtifact`** (declaram `stage` + `graduatedTo: KnowledgeRef`) e **somam-se em `knowledgeSources.collectKnowledgeArtifacts`** — o `KnowledgeGraph` não muda. Cada entidade entrega **+N arestas navegáveis imediatas**.

## 5. Sequência executável restante (`state.yml § topology` = SSOT)

`#34 (ativo) → pr-cli-cutover → pr-doctrine → pr-decision → pr-rule-guardrail → pr-projection-split → pr-workitem-registry → pr-dualroot-collapse → integration-final`

Cada PR **constrói uma entidade/superfície E dissolve a fusão/legado** que ela torna redundante; os checkpoints de absorção 3–12 foram **dobrados** nos PRs onde se sobrepõem (mapeamento nos comentários de cada nó da topologia). Próximo = **`pr-cli-cutover`** (registry de comandos em `src/`, dissolvendo a costura `engine.mjs`/`args.mjs`) — **decidido como #1** porque cada verbo novo do cockpit (incl. `ag graph`/`ag why`) hoje paga imposto por-comando na costura legada; cutar primeiro torna todos baratos. (Alternativa de igual valor: abrir o surface `ag graph`/`ag why` do read-model que já existe — mas pagaria o imposto que o cutover remove.)

## 6. Direção arquitetural assumida (o "porquê", para não re-derivar)

- **Knowledge é um PIPELINE de maturação** (não taxonomia MECE como `WorkItem`): `insight→decision→rule|guardrail→doctrine`.
- **O grafo é o read-model/produto primário** (CQRS): entidades = write-model (fontes com invariantes); grafo = read-model derivado (recuperabilidade). "Derivado ≠ tardio/acessório."
- **Navegabilidade vem de entidades+grafo, não de mover diretórios.** Relocar `.core/` está **fora** (estética; as entidades tornam a localização física irrelevante).
- **Programa de convergência** = materializar `Doctrine/Decision/Rule` como entidades navegáveis + dissolver fusões (`NEXT.md`, `governance-foundation` monólito) + separar fonte/projeção + colapsar dual-root. Mata o sintoma raiz: "a resposta estava num ADR esquecido" (recuperabilidade).

## 7. Hipóteses descartadas (não ressuscitar)

- "Existe uma 0025 independente / spawn cross-spec" → **falsificado** (§1).
- "Falta um tipo de nó de transição cross-spec na topologia" → **retratado**; o problema era #34 não-registrado, não um gap de modelo de transição.
- "Relocar `.core/`→`governance/knowledge/`" → fora (baixo valor).
- `next[]` como fonte da próxima ação / `ranking`/ordem-total / `participants.yml` / `Co-Authored-By` como fonte de participação → **rejeitados** em rodadas anteriores (ver Insights + ADRs).
- Disclosure derivado para #34 → N/A (decidido): o branch é linha de convergência; revisões viram artefatos `reviews/*.yml` no review.

## 8. Riscos conhecidos (não-bloqueantes; já anotados)

- **Ledger Insights framework-wide committado** pode gerar conflito de merge em specs paralelas; `promotion.ref` valida só **forma**, não existência (integridade referencial = decisão futura). Estes são exatamente os temas que `pr-workitem-registry` / `pr-dualroot-collapse` tocam.
- **Surface CLI do grafo ausente** (`ag graph`/`ag why`) — depende do `pr-cli-cutover`.
- **Escopo do #34 não-atômico** (6 commits cross-eixo) — desvio consciente do owner; registrado no PR.
- **`next[]` da 0024 ainda é log conflado** (a "Próxima ação" do `continue` lê `next[0]` antigo) — débito conhecido; `pr-decision` dissolve a fusão NEXT.

## 9. Próximos passos concretos (em ordem)

1. **Abrir `pr-cli-cutover`** (próximo nó `planned`): branch stacked sobre `feat/spec-0024-insights-in-flight`; registry de comandos em `src/` + parser genérico; `engine.mjs`/`args.mjs` viram shim; re-registrar `continue/workflow/review/insight`. TDD/BDD. Ao abrir: mover `#34`→concluded? **NÃO** — #34 segue ativo até seu gate; o novo PR entra como `active` adicional ou a topologia decide (seguir o padrão do handoff anterior: o nó novo nasce `active` com `github_pr`).
2. Depois: `pr-doctrine` (Doctrine + DoctrineGraph + `doctrine:check`; ADRs navegáveis; retira `.agents/` vazio).
3. Seguir a trilha (§5), cada PR pelo Gate (Claude → Codex Technical Audit → ChatGPT Architectural Review → Human), artefatos `reviews/*.yml` + `gates/*.yml`.

## 10. Prompt de retomada (colar em sessão nova)

```
Retome a Spec 0024 na trilha de convergência orientada a grafo ([DEC-0024-G08]).
NÃO reabra: enquadramento (não há 0025; é 0024 com G03/G04/G05 reabertos),
G00/G02/G06/G07, nem as hipóteses descartadas (§7 do handoff).

Leia, nesta ordem:
- .governance/specs/0024-context-architecture/research/2026-06-03-handoff-convergence-reopened.md (ESTE)
- .governance/specs/0024-context-architecture/state.yml § topology (SSOT da trilha)
- .governance/specs/0024-context-architecture/decision-brief.md § [DEC-0024-G08]
- ag insight list  (motivação viva: PIT-0004..0006)

Estado: branch feat/spec-0024-insights-in-flight = PR #34 (Draft, CI verde).
Já materializado: capability Insights + kernel Knowledge + KnowledgeGraph núcleo.
Próximo: pr-cli-cutover (registry de comandos em src/). Cada entidade futura
implementa KnowledgeArtifact + soma-se em knowledgeSources; o grafo não muda.

Disciplinas: pt-BR; yarn format ; yarn validate antes de commit; CORE-07;
NÃO mergeia em main (modo unit); 1 PR pelo Gate por vez. Verifique git limpo +
validate verde antes de agir.
```
