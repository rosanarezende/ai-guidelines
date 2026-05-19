<!-- ai-guidelines-template: spec-boilerplate v=1 -->

# Spec 0023 — Workflow Runtime (Operational Lens for Human-AI Governance)

> Status: Draft (Stage B — Decision closed; Stage C — Implementation in progress)
> Author: Rosana Rezende + Claude Code (sessão 2026-05-19)
> Date: 2026-05-19
> Owner: Rosana Rezende
> Tipo de spec: mixed
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Plan: (inline neste spec.md § "Rollout"; vira `plan.md` próprio quando o número de PRs ≥ 4)

> **Princípio de imutabilidade:** após status `In Review`, este arquivo só
> muda por consenso explícito. Decisões em aberto vão para `decision-brief.md`.
>
> **Continuidade:** esta spec é o pivot da Spec 0023 original (`discovery-model`), formalizado em `decision-brief.md` § Bloco A com gate Stage A → Stage B assinado em 2026-05-19. A pasta legacy [`/.specify/specs/0023-governance-workflow-discovery-model/`](../../../.specify/specs/0023-governance-workflow-discovery-model/) permanece como trilha histórica — research, hipóteses e anti-patterns foram **insumo da decisão**, não material a descartar.

---

## 🎯 Objetivo

O framework `ai-guidelines` consolidou-se como **governance-first** pela Spec 0021 (ADR 0018: AI-as-Channel). A 0023 original investigou o lifecycle metodológico e confirmou empiricamente as quatro hipóteses (H1–H4) de Stage A: o problema-raiz das specs recentes não é metodologia documental insuficiente, é **carga cognitiva operacional**. Specs nascem em `.specify/`, o discurso é `.governance/`-first; humanos precisam **lembrar o framework inteiro** (lifecycle, gates, artefatos, próximos passos); IA gasta context window reconstruindo estado a cada sessão.

Esta spec entrega o **runtime operacional humano-IA** que materializa o cutover: a IA continua sendo **canal** (ADR 0018, preservado), o framework ganha uma **lente contextual** que reduz reconstrução de contexto e elimina artefatos/gates implícitos. O resultado observável: um humano consegue retomar uma spec parada há ≥ 1 semana sem reler a pasta inteira, e um agente IA consegue obter briefing operacional barato via comando único.

Resultado esperado quando esta spec encerrar:

- Comando `ai-guidelines workflow` apresenta briefing contextual (≤ 25 linhas) e menu de ações estruturadas derivadas do estado real da spec ativa.
- Novas specs nascem em `.governance/specs/`. `.specify/` permanece como bridge sem deprecation timeline.
- `state.yml` mínimo (4 chaves) reduz reconstrução de estágio/gate/foco/próxima ação.
- Texto livre no REPL gera context bundle copy-paste-ready para sessão IA — sem embutir LLM no framework.

---

## 📦 Escopo

### Dentro do escopo

- **Runtime CLI mínimo** com 1 comando principal (`workflow`) + 1 atalho (`continue`). REPL interativo. Comandos estruturados internos (`briefing`, `gaps`, `gate`, `next`, `quit`). Texto livre vira context bundle, **não** chamada de LLM.
- **`state.yml`** com schema 4-chave canônico (`stage`, `gate.status`, `focus`, `next`). Serializer + validador em domínio. Default sensato quando ausente.
- **Topologia `.governance/specs/`** como root primária no repo do mantenedor (este). Double-lookup runtime: `.governance/specs/{slug}` → fallback `.specify/specs/{slug}`. ADR 0019 registra.
- **Detecção de spec ativa**: branch name → diretório slug; fallback por arquivos modificados (git).
- **AssembleBriefing**: estado + cabeçalhos do `spec.md` e `research.md` → bloco de 15–25 linhas determinístico.
- **Código novo exclusivamente em `src/`** (DDD): `domain/workflow/`, `app/workflow/`, `adapters/cli/workflow/`. Bridge mínima no entrypoint `cli/ai-guidelines-cli.mjs` (delegate dinâmico).
- **Dogfooding**: esta própria spec usa o `state.yml` desde o primeiro commit; testar `ai-guidelines workflow` nela é critério de aceite do PR1.

### Fora do escopo (vira spinoff ou fica em outra spec)

- **LLM embutido no runtime**: rejeitado em `decision-brief.md` § DEC-0023-A03. AI-as-Channel preservado.
- **Migração em massa das specs antigas de `.specify/`**: caso-a-caso, decisão própria por spec. O ADR 0019 declara `.specify/` como bridge **sem deprecation timeline**.
- **Comandos especializados separados** (`start-spec`, `review-research`, `review-decision`, `start-implementation`): rejeitados como superfície. As mesmas ações nascem como itens do menu interno do wizard (incrementalmente, em PRs futuros).
- **Schema rico de `state.yml`** (hypotheses, sessions, summaries): rejeitado em `decision-brief.md` § DEC-0023-A04. Quando inferência por arquivos puder cobrir, não duplicar em YAML.
- **Reescrita dos boilerplates** de `.specify/templates/`: alterações pontuais permitidas; redesign completo é spec própria.
- **Cutover total de `.specify/`** neste repo: novas specs em `.governance/`; específicas antigas decidem caso-a-caso.
- **Workflow engine genérico**: sem orchestration DAG, sem state machine enterprise, sem plugin runtime. Decisões compulsoriamente revisadas contra a métrica "isto reduz carga cognitiva operacional?" — se aumenta, sai do escopo.

---

## ✅ Critérios de Aceite (alto nível)

- [ ] `ai-guidelines workflow` na branch desta spec mostra briefing contextual coerente com `state.yml` + arquivos da pasta.
- [ ] `ai-guidelines continue` executa o briefing + a ação marcada em `state.next`.
- [ ] `state.yml` validado por schema (4 chaves; sem campos opcionais explodidos).
- [ ] Double-lookup funciona: spec resolvida via `.governance/specs/` quando presente, via `.specify/specs/` quando não.
- [ ] Detecção de spec ativa por branch name funciona para `feat/spec-NNNN-*`; fallback documentado.
- [ ] Texto livre no REPL gera context bundle (≤ 30 linhas) e copia para clipboard quando possível; fallback stdout.
- [ ] Nenhuma lógica nova de domínio em `cli/`; bridge no entrypoint é o único toque.
- [ ] BDD pt-BR (DADO/QUANDO/ENTÃO) cobrindo cada use case novo; coverage ≥ 85%.
- [ ] ADR 0019 publicado (`.governance/` root + bridge).
- [ ] Pipeline `yarn format ; yarn check ; yarn test` verde.
- [ ] Dogfooding: a 0023 atravessou Stage B → Stage C (implementação) usando o próprio `workflow` para retomar contexto entre commits.

---

## 🔬 Pesquisa de contexto

- [Decision brief](./decision-brief.md) — gate Stage A → Stage B fechado em 2026-05-19. Contém os 4 pontos resolvidos (escopo, topologia, forma do runtime, state.yml).
- [Research legado](../../../.specify/specs/0023-governance-workflow-discovery-model/research.md) — hipóteses H1–H4 e anti-patterns AP1–AP5 que motivaram o pivot. **Não migrar**; ler como evidência histórica.
- [Spec 0021 closure](../../../.specify/specs/0021-governance-information-architecture/closure-review.md) — fundação governance-first.
- [ADR 0018](../../../.core/governance/adrs/0018-governance-first-ai-as-channel.md) — AI-as-Channel; restrição arquitetural que rejeita LLM embutido no runtime.

---

## 🛠️ Rollout (inline; vira plan.md quando ≥ 4 PRs)

| PR               | Escopo                                                                                                                                                                                                  | Tasks                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **PR1 (este)**   | Pivot formal + state.yml + double-lookup + REPL workflow/continue + bridge entrypoint + ADR 0019 + dogfooding                                                                                           | T1–T9 (ver tasklist da sessão)           |
| **PR2** (futuro) | Ações de menu: `review-research` (síntese de gaps C1–C7), `gate` (transição assistida com aprovação humana explícita)                                                                                   | TBD em decision-brief novo se necessário |
| **PR3** (futuro) | `start-spec` (wizard de criação de spec nova em `.governance/specs/`)                                                                                                                                   | TBD                                      |
| **PR4** (futuro) | Avaliação empírica: 2 specs novas atravessam discovery → decision usando o runtime; coleta de evidência de redução de carga cognitiva (tempo de retomada, leituras evitadas, prompts manuais reduzidos) | TBD                                      |

PRs futuros são **candidatos**, não promessa. Cada um precisa de sua própria validação contra a métrica "reduz carga cognitiva?".

---

## 📚 Referências

- Specs relacionadas: **0021** (foundation governance-first), **0022** (CLI Runtime Cutover paused).
- ADRs aplicáveis: **ADR 0018** (AI-as-Channel; restritivo), **ADR 0019** (`.governance/` root primária no mantenedor — novo nesta spec).
- Trilha histórica: [`.specify/specs/0023-governance-workflow-discovery-model/`](../../../.specify/specs/0023-governance-workflow-discovery-model/).
- Sessão de decisão 2026-05-19 — commits da branch `feat/spec-0023-governance-workflow-discovery-model`.
