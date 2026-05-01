# Spec 0018 — Rules Content Deepening

> Status: Draft (revised 2026-04-30)
> Author: Rosana Rezende
> Date: 2026-04-30 (rev. de 2026-04-30 inicial)
> Owner: Rosana Rezende
> Plan: [`./plan.md`](./plan.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)

> **Princípio de imutabilidade:** após status `In Review`, este arquivo só
> muda por consenso explícito. Decisões em aberto vão para `decision-brief.md`
> (gate humano pré-design); detalhes técnicos vão para `plan.md` (vivo).

---

## 🎯 Objetivo

As últimas specs (0008, 0017) entregaram um motor de **infraestrutura de injeção de contexto** maduro (Arquitetura de Ponteiros, Monolithic Compiler). Mas o **conteúdo** das regras injetadas — `global-rules.md`, `quality-gates.md`, adapters por IA — permaneceu procedural e genérico, escrito por acreção sem evidência de eficácia. Em paralelo, os **boilerplates de SDD** em `.specify/templates/` (7 arquivos) acumularam drift em relação à prática real das specs executadas: nem todos refletem políticas canonizadas (lifecycle de research, deletar `NEXT.md` no encerramento, "Decisão de Fusão") e nenhum classifica specs por tipo (conteúdo × infraestrutura).

Esta spec tem **duas entregas intencionais e de mesmo peso**, na mesma branch e mesma PR, porque a primeira é pré-requisito metodológico da segunda e ambas nascem do mesmo insight ("o repositório acelera infraestrutura mas não disciplina conteúdo"):

- **Bloco A — Política framework + auditoria editorial dos boilerplates.** Auditar os 7 boilerplates de `.specify/templates/`, criar o 8º (`decision-brief-boilerplate.md`), sincronizar com `docs/process/spec-foundation.md` e canonizar a distinção **spec de conteúdo × spec de infraestrutura** com **workflow em dois passes** (Stage 1 research → gate humano via decision-brief → Stage 2 design+implementação) para specs de conteúdo.
- **Bloco B — Content overhaul research-backed das regras.** Aplicar a política recém-criada à própria 0018: research lifecycle → decision-brief com opções → gate humano → catálogo de regras → eval empírico mínimo → reconciliação do conteúdo já-mergeado em b9efb83.

A spec original (rev. inicial) propôs apenas o Bloco B, sem research e sem eval, violando o ciclo RPI do próprio framework. Esta revisão corrige a omissão e dogfood-a a regra: **a primeira spec de conteúdo é a que cria a regra que a rege**, e a primeira instância de `decision-brief.md` (esta) é o protótipo do `decision-brief-boilerplate.md` que o Bloco A formalizará.

---

## 📦 Escopo

### Dentro do escopo

**Bloco A — Política framework + boilerplates**

- Auditoria research-backed dos 7 boilerplates existentes em `.specify/templates/` (`spec-`, `plan-`, `tasks-`, `next-`, `research-index-`, `roadmap-`, `project-config-`).
- Criação do 8º boilerplate `decision-brief-boilerplate.md`, formalizando o artefato de gate humano.
- Cross-check com `docs/process/spec-foundation.md` para detectar drift bidirecional.
- Atualização dos boilerplates conforme decisões consolidadas em `decision-brief.md`.
- Adição do campo **"Tipo de spec"** (`conteúdo` | `infraestrutura` | `mista`) em `spec-boilerplate.md` e checklist diferenciado em `tasks-boilerplate.md`.
- Política em `docs/process/spec-foundation.md`: workflow em dois passes para specs de conteúdo, com gate humano via `decision-brief.md`; specs de infraestrutura mantêm o fluxo single-pass atual.
- Linha condensada em `.core/rules/global-rules.md` referenciando a política.

**Bloco B — Content overhaul (rules)**

- Research lifecycle (5 sínteses externas + 1 medição instrumental de baseline) sobre rules content em provedores, OSS curado, taxonomias externas e estudos empíricos de bugs em código gerado por IA.
- Consolidação de opções em `decision-brief.md` para taxonomia, colocação por arquivo, orçamento de tokens, formato do catálogo, metodologia do eval, fronteiras com 0011/0009 e política de reconciliação.
- Após gate: catálogo de regras conforme formato validado; eval mínimo conforme metodologia validada; reconciliação do conteúdo de b9efb83 conforme política validada.

### Fora do escopo (vira spinoff ou fica em outra spec)

- **Mudanças no compilador CLI (Spec 0017):** infraestrutura permanece intacta.
- **Spec 0011 (regra-hierarquia por subdiretório):** a fronteira fica registrada como decisão validada em `decision-brief.md`, mas execução da hierarquia em si permanece spec separada.
- **Spec 0009 (harness-engineering):** o eval mínimo desta spec é seed metodológico; sensores automáticos completos e agente-validador em pipeline ficam para 0009.
- **Spec 0012 (segurança IA / supply chain):** OAuth, threat model de AI tools — spec dedicada.

---

## ✅ Critérios de Aceite (alto nível)

- [ ] Política **conteúdo × infraestrutura** publicada em `docs/process/spec-foundation.md`, descrevendo workflow em dois passes com gate humano via `decision-brief.md`.
- [ ] Os 7 boilerplates existentes auditados; matriz de decisão registrada em `research/`; `decision-brief-boilerplate.md` (8º) criado; updates aplicados conforme decisões validadas; cross-check com `spec-foundation.md` sem drift residual.
- [ ] `decision-brief.md` desta spec com **todas as decisões em status `Resolved`** antes de iniciar Stage 2 (design + implementação).
- [ ] Catálogo de regras produzido conforme formato validado em `decision-brief.md`, com fonte/evidência por regra (research).
- [ ] Eval mínimo executado conforme metodologia validada em `decision-brief.md`; resultados registrados em research.
- [ ] Conteúdo de `global-rules.md` e `quality-gates.md` mergeado em b9efb83 reconciliado: cada regra com decisão explícita (manter | revisar | reverter) conforme política validada.
- [ ] Compilação do `<AI_GUIDELINES>` no `AGENTS.md` permanece dentro do orçamento de tokens validado.
- [ ] `yarn check && yarn test` verde.
- [ ] Pesquisas migradas para `.specify/specs/researchs/<domínio>/` e indexadas em `research-index.md`; `NEXT.md` (se existir) deletado; `decision-brief.md` permanece no diretório da spec como artefato histórico.
- [ ] PR Draft revisado e aprovado por humano antes de Ready.

---

## 🔬 Pesquisa de contexto

Mandatória nesta spec — é a primeira a aplicar a política do Bloco A a si mesma. Ponteiros para `./research/` (a serem produzidos durante Stage 1):

**Bloco A:**

- `research/2026-04-30-boilerplates-audit.md` — inventário, drift bidirecional, lacunas trazidas pela prática, ruído removível, matriz `manter | revisar | adicionar | remover` por boilerplate.

**Bloco B:**

- `research/2026-04-30-benchmark-rules-content.md` — provedores (Anthropic CLAUDE.md best practices, OpenAI AGENTS.md spec, Google Gemini.md), OSS curado (Kong, ClickHouse, Bun, multica), `awesome-cursorrules`, Continue rules, Aider conventions.
- `research/2026-04-30-empirical-bugs-ai-code.md` — METR, SWE-bench, Aider eval, estudos publicados sobre falhas recorrentes em código gerado por IA.
- `research/2026-04-30-external-bug-taxonomies.md` — CWE, SEI CERT, Sonar rules, OWASP Top 10 LLM.
- `research/2026-04-30-spec-driven-tools-rules.md` — Spec Kit (GitHub), BMAD, OpenSpec, Continue, Aider — como tratam regras editoriais vs infraestrutura, e como tratam decisões pré-design.
- `research/2026-04-30-tokens-baseline-budget.md` — medição do `<AI_GUIDELINES>` atual + projeção de teto por arquivo.

**Síntese cross-research** consolidada nas opções apresentadas em `decision-brief.md` (não em `research/synthesis.md` separado — a brief absorve a função de síntese decisional). Resultados do eval (Stage 2) ficam em `research/2026-04-30-eval-results.md`.

Lifecycle de fechamento: ao mergear, todas as researches migram para `.specify/specs/researchs/governance/` (ou `architecture/` quando o domínio for arquitetural) com prefixo de data e indexadas em `research-index.md`. `decision-brief.md` permanece no diretório da spec.

---

## 🛠️ Dependências e impactos (alto nível)

- **Pré-requisitos:** Spec 0017 (Process Refinement & CLI Refactor) concluída (✓).
- **Specs afetadas:**
  - **Define a política aplicada por specs futuras** que tocarem `.core/rules/` ou conteúdo do `<AI_GUIDELINES>`.
  - **0011 (regra-hierarquia):** a fronteira é decisão validada no `decision-brief.md`.
  - **0009 (harness-engineering):** o eval mínimo é seed para o harness completo; fronteira validada no `decision-brief.md`.
- **Riscos macro:**
  - _Inflação de tokens:_ regras mais ricas vs orçamento finito do contexto LLM. Mitigado por orçamento explícito como decisão validada + medição contínua.
  - _PR grande:_ dois blocos juntos. Mitigado por commits atômicos por sub-bloco e possibilidade de quebrar em PRs sequenciais (A merge antes de B) se ficar pesado.
  - _Stage 1 derrapando:_ research expandindo indefinidamente sem fechar opções. Mitigado por `decision-brief.md` ser o gate explícito — não se inicia Stage 2 com decisões pendentes.

---

## 📚 Referências

- Specs relacionadas: **0008** (governance-coherence — taxonomia editorial × infraestrutura para features), **0017** (CLI refactor + monolithic compiler — entrega a infraestrutura sobre a qual o conteúdo desta spec roda), **0011** (hierarquia de regras — fronteira definida em `decision-brief.md`), **0009** (harness-engineering — eval seed).
- ADRs aplicáveis: **ADR 0004** (Governance Single Responsibility — base da taxonomia), **ADR 0008** (Monolithic Runtime Compiler — define o envelope onde o conteúdo roda).
- Conteúdo a reconciliar: commit **b9efb83** (`feat: implement content deepening framework with new global rules, quality gates, and spec 0018 planning`) — tratado como rascunho candidato pré-research (ver Anexo no `plan.md`).
