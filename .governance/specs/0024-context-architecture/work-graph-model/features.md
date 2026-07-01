# Features a implementar — roadmap da frente work-graph

> **O modelo prevê TODOS os fluxos; a construção se faseia aqui** (princípio da [Lente 1](tracker.md)). Este doc lista o que **modelamos** e ainda falta **implementar** — pra não confundir "fora do modelo" com "ainda não construído". Não-autoridade; alimentado junto com o [`tracker.md`](tracker.md) e as [`deliberation/`](deliberation/).
> Legenda: **P0** = base da taxonomia v2 (destrava o resto) · **P1** = lifecycles/dimensões core · **P2** = escala/enterprise. ✅ feito · 🚧 parcial · ⬜ a fazer.

---

## P0 · Migrar o modelo p/ a taxonomia v2 (destrava tudo)

- ⬜ **`model.ts`: famílias + membros** — `WorkKind` (5) → `delivery`/`maintenance` (CAPACIDADE) + mover `experiment`/`exploration` (APRENDIZADO), `incident` (RESPOSTA), `proposal`/`register` (INTAKE). Colapsar `fix`+`patch` em `maintenance`.
- ⬜ **Dimensões no domínio** — `source` · `visibility` · `maintenance-mode` · `change-class` · `service-class` · `planned-in` (ortogonais; opcionais no modelo, exigidas conforme a família).
- ⬜ **Presets (UX)** — "fix"/"security patch"/"bump de dep"/… → preenchem família + dimensões. Alias, não ontologia.
- ⬜ **Migração da sim + templates** — os `registry-entry`/briefs; migrar os works existentes (login) p/ a forma nova.
- ⬜ **Tirar `incident` das promoções planejadas** (proposal `promote-to`, breakdown) — incident nasce por gatilho.

## P1 · Lifecycles próprios (cada família com o seu)

- ⬜ **`experiment` — lifecycle operacional:** `experiment-brief` sela **hipótese + métricas**; roda atrás de **feature-flag** com **exposição · guardrails · duração · decision-rule**; fecha em **`experiment-outcome`** (won/lost/inconclusive) + **cleanup** (flag/variante morta). `won → delivery`.
- ⬜ **`incident` — lifecycle dedicado (RESPOSTA):** **severidade** · **declarar** (destrava merge/CI com **prazo**, blameless) · **mitigar** · **resolver** · **postmortem** (garantido por **alerta**) → gera `fix`/`maintenance`/`proposal`. + arestas `occurred-during`/`caused-by`/`related-to`.
- ⬜ **`maintenance` — modos:** `maintenance-mode` (corrective/adaptive/perfective/preventive, ISO 14764) + `reason`/`impact` (anti-buraco-negro).
- 🚧 **`exploration` — endurecer:** timebox (✅ tem) + **pergunta falsificável** + **stop-rule** + `fate` obrigatório. Disparar a exploration **de verdade** no work-repo (hoje a triagem só registra a disposição).
- ⬜ **Enforcement das dimensões** — cada dimensão afeta **workflow · lint · dashboard** (senão vira tag decorativa): ex. `change-class: emergency` destrava bypass; `service-class: expedite` prioriza; `security-visible` exige revisão.

## P1 · Triagem, matcher & métricas

- 🚧 **Matcher com contrato de confiança** — persistir **score + explicação + threshold + "unknown"** (fallback) + **freshness** da capability + escalonamento de owner. (Simulação já existe; falta o contrato.)
- ⬜ **Gerador de capabilities** (skill/CLI) — apoia a IA a escrever/atualizar as capabilities dos manifestos (a **alavanca** da qualidade do match).
- ⬜ **Métrica de tempo-bloqueado** (`needs-info`) — vista derivada: **quem** segura e **por quanto tempo** (a dor do remoto, medível).
- ⬜ **Confirmar/anexar** as conexões sugeridas (hoje a sugestão só é exibida).

## P1 · Release, entrega & acompanhamento

- ⬜ **`release ≠ merge`** — separar o merge do **release**: rollout gradual/**canary** · **rollback** · feature-flag · **janela de verificação** (o momento "acompanhar" ganha dentes).
- ⬜ **Anexos** (além de links) na iniciativa (upload).

## P2 · Governança de portfólio & escala (enterprise)

- ⬜ **Capacidade / WIP / classes of service** — limites, aging, políticas explícitas (Kanban).
- ⬜ **Priorização entre iniciativas** — RICE/ICE no nível do portfólio; roadmap.
- ⬜ **SLA / dono de fila / escalonamento** na triagem (aging + escalation).
- ⬜ **SLO / error-budget / observabilidade** — manifestos ligam a **SLIs/SLOs · alertas · dashboards**; alertas **disparam** incident.
- ⬜ **RACI / accountability** — accountable por fila, contrato, serviço, incidente, decisão, pós-ação.
- ⬜ **Event-log append-only + resolver estável + snapshot publicado assinado** — o file-first ganha trilha semântica de domínio (além do git), concorrência e consulta operacional.
- ⬜ **Query-API / provenance / envelope de tarefa-artefato p/ agentes** (MCP/A2A) — o grafo consultável por IA com permissões.

## Backend & app (infra do modelo)

- 🚧 **`Neo4jHostRepository`** (o host só tem File) + arestas da Lente 6 como **relações** no Neo4j (hoje nós-only).
- ⬜ **Revisitar a D3** (arestas cross-repo derivadas — era tentativa).
- ⬜ **Aposentar o `_viewer` legado** quando o `_app` cobrir o terreno.
- ⬜ **Nova simulação robusta** sobre a taxonomia v2 — **só depois** de validarmos as lentes do tracker; arquivar a `_org-simulation-v2` se preciso.

---

## Já entregue nesta frente (contexto)

✅ modelo file-first + banco derivado + backend plugável (4 paradigmas) · host agrega projeções publicadas · matcher advisory (léxico/LLM local/API, **simulável na triagem**) · manifesto-por-repo + auto-discovery · o **app `_app`** com o fluxo registro→triagem→gate→ativação · a estrutura `registers/{candidates,archived}` + `intents/` com `promote`/`discard` (consolida+move, `git mv`) · deliberações q/r/d (taxonomia · registro-triagem-gate · roteamento · manifesto · projeções).
