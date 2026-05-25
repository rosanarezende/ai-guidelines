# Backlog — ai-guidelines

> # ⚠️ CONGELADO / HISTÓRICO — não adicionar conteúdo novo aqui
>
> **Backlog canônico é [`.governance/specs/roadmap/backlog.md`](../../../.governance/specs/roadmap/backlog.md)** (per ADR 0019).
> Este arquivo é legado e permanece apenas como referência histórica. **Novos itens entram no canônico via PR.**
> A migração/sanitização completa deste arquivo é Fase 3 da candidata `runtime-and-template-root-consolidation` (backlog canônico) — não fazer ad-hoc.
> Uma **triagem mínima** dos itens ainda vivos foi executada no PR #25 (ver seção abaixo) e espelhada na candidata canônica.

## Triagem mínima executada no PR #25 (2026-05-25)

> Sinaliza itens **provavelmente vivos** deste backlog legado — não reclassifica tudo. A triagem completa (com reencaixe em `Now`/`Next`/`Later` e justificativa por item) é obrigação metodológica da candidata `runtime-and-template-root-consolidation` antes de sua abertura. Itens não listados aqui são (em geral) specs concluídas (0008–0021), absorvidas/riscadas, ou bloqueadores já resolvidos.

### Itens vivos identificados (triagem mínima)

1. **`recipes-mirror-to-engine-migration`** — _alta_ — só 1 de 11 recipes migrado; mirror `.specify/templates/` é o débito que a consolidação + `boilerplate-system-modernization` precisam fechar.
2. **`seguranca-ia-supply-chain`** (era spec 0012) — _alta_ — threat model OAuth de AI tools (operador humano); sem lar; gatilho por incidente provável.
3. **`harness-engineering`** (era spec 0009) — _média_ — agente validador + eval-as-gate + sensores; combate "falso done"/slop; não entregue.
4. **`cli-mjs-to-src-ddd-cutover`** — _média_ — `cli/*.mjs` legado convive com `src/*.ts`; alimenta a consolidação topológica.
5. **`stakeholder-intake-pipeline`** — _média_ — PRD/intake estruturado → spec; sem contrato de entrada, transformar demanda recai toda na mantenedora.
6. **`framework-observability-dashboard`** (telemetria) — _média_ — métricas vivas (Tok-H, eval baseline, adoção npm); overlap parcial com `governance-dashboard-and-visual-artifacts` (canônico `Now`#1) — verificar absorção.
7. **`pr-curator-action`** — _média_ — `pr-curator` é fantasma (citado em ADR 0009/CHANGELOG, sem código); automação cross-repo.
8. **`regra-hierarquia`** (era spec 0011) — _média_ — fragmentação de `AGENTS.md` por subdir no consumidor; gatilho por pressão de tokens.
9. **`handoff-contracts-formalization`** — _baixa_ — contratos de handoff stage→release / consumer→maintainer; overlap parcial com `handoff-as-first-class` (canônico `Now`#2) — verificar absorção.
10. **`core-rules-top-naming-audit`** — _baixa_ — fronteira `agents-core.md` (CORE-\*) vs `global-rules.md` (GR-\*) confunde; débito do 0021.
11. **`cli-update-notifier`** — _baixa_ — sensor "vX.Y disponível, rode update" pós-npm; infra de update já existe, falta o aviso.
12. **`quota-awareness`** (era spec 0014) — _baixa_ — dashboard de quota opt-in; gatilho por consumidor estourar quota.

---

Este arquivo é o backlog vivo do repositório. Captura specs em execução, próximas na fila, candidatas, bloqueadores cross-spec e itens oportunistas.

**Regra de ouro:** nada aqui entra em execução sem nova spec (`.specify/specs/<slug>/`). Este arquivo é leitura obrigatória antes de abrir spec nova ou fechar uma spec existente.

**Política repo-first, integração-friendly:** o repositório é a memória canônica. Ferramentas externas (GitHub Projects, Jira, Linear, etc.) podem ser camada colaborativa humana via campo opcional `tracker` nas entradas abaixo, mas o resumo mínimo no `backlog.md` é mandatório.

Detalhes de lifecycle em [`.core/process/governance-foundation.md`](../../../.core/process/governance-foundation.md).

---

## Em execução

Specs atualmente em branch ativa. Formato enxuto.

- **spec 0021** — `governance-information-architecture`
  (`.specify/specs/0021-governance-information-architecture/`) — **In Progress (Stage 1)** _(branch `feat/spec-0021-governance-information-architecture`, aberta em 2026-05-08 a partir de `main`)._
  - **Tipo:** `evidence-driven`.
  - **Histórico de numeração:** era a candidata `0020-governance-information-architecture` até 2026-05-07; foi renumerada para 0021 quando `npm-publication` foi promovida e a branch original da candidata foi reaproveitada pela 0020.
  - **Fonte do insight:** revisão da Spec 0018 (Stage 1, 2026-04-30) + benchmark comparativo externo de 2026-05-07, que reforçou a ausência de PRD/intake estruturado, handoff contracts e telemetria como gêneros com lar canônico explícito.
  - **Foco ativo do Stage 1:** (1) modelo canônico de estado repo-first híbrido; (2) artefatos não-spec como origem de valor; (3) fronteira `sdd_dir` vs `spec_workspace_dir`; (4) recorte Fases 1–3 agora e Fases 4–5 apenas mapeadas.
  - **Perguntas reincorporadas do backlog original:** catálogo central vs reorganização física vs híbrido; ADRs vs `governance-foundation.md`; reorganização física interna de `.core/rules/` no repo.
  - **Insumos obrigatórios já lidos na abertura:** `.core/process/governance-foundation.md`, `researchs/architecture/2026-05-08-consumer-bootstrap-frictions.md` e `researchs/architecture/2026-05-08-repo-first-structured-registry.md`.
  - **Cross-ref operacional:** abertura formal aprovada pela owner em 2026-05-08; gate humano de Stage 1 pendente em `.specify/specs/0021-governance-information-architecture/decision-brief.md`. Débito tático herdado: `[DEC-0018-A06]`.

> **Spec 0019** (`bootstrap-consumidor-e-runtime`) concluída e mergeada em 2026-05-07 (PR #5, commit `35af73a`).
> **Spec 0020** (`npm-publication`) concluída e mergeada em 2026-05-08 (PR #6).
> Detalhes em [`historico.md`](./historico.md).

---

## Now (próxima fila, ordem importa)

Specs ou candidatas priorizadas para iniciar em seguida. Ordem indica prioridade.

- **governance-information-architecture** (spec **0021**) — movida para **Em execução** em 2026-05-08. O escopo ativo agora vive em `.specify/specs/0021-governance-information-architecture/`, com reincorporação das perguntas históricas sobre carrier da política, fronteira ADR vs `governance-foundation.md` e placement interno de `.core/rules/`.

- **stakeholder-intake-pipeline** (Pipeline estruturado de PRD/intake → spec)
  - **Fonte do insight:** análise comparativa de frameworks AI-driven externos (2026-05-07) — frameworks maduros formalizam um contrato de entrada (PRD parseável → tasks atômicas com critérios de aceitação). O ai-guidelines hoje vai do chat → backlog → spec sem etapa estruturada antes; o `Ciclo de Fricção` (regra 7 do backlog) reconhece a porta de entrada via tag `friction` mas não define o **shape mínimo** do pedido.
  - **Insight central:** sem contrato de intake, cada nova demanda externa (consumidor, futuro time, owner como stakeholder de outro contexto) chega em formato livre e o trabalho de transformar em spec recai inteiramente sobre a mantenedora. Falta um boilerplate de PRD/RFC + comando CLI que extraia critérios de aceitação e dependências antes mesmo de virar candidata no backlog.
  - **Escopo potencial:** boilerplate `prd-boilerplate.md` em `.specify/templates/`; comando `ai-guidelines intake <slug>` que gera estrutura mínima (problema, hipótese, AC, dependências, audiência); integração com o `Ciclo de Fricção` definindo o shape do pedido; lar canônico do PRD definido pela Spec 0021 (sub-bloco antecipatório); decisão sobre se PRDs viram parte do framework distribuído (consumidores também recebem o boilerplate) ou ficam internos.
  - **Audiência:** mantenedora (entrada de demandas) + futuros stakeholders/consumidores que reportem friction ou peçam features.
  - **Pré-requisitos:** Spec 0021 mergeada (entrega o lar canônico para PRDs via sub-bloco antecipatório).
  - **Sinal de "está na hora":** 0021 mergeada (gatilho automático); ou primeiro consumidor externo abrir issue de friction sem shape mínimo.
  - **Riscos antecipados:** boilerplate denso vira fricção própria — mitigar com versão mínima viável (≤5 campos obrigatórios) e expansão opt-in; risco de duplicar `spec.md` — distinguir claramente: PRD captura **demanda**, spec captura **execução**.

- **framework-observability-dashboard** (Telemetria e dashboard de saúde do próprio framework)
  - **Fonte do insight:** análise comparativa de frameworks AI-driven externos (2026-05-07) — frameworks maduros expõem visibilidade rápida do estado do projeto (status CLI + dashboard navegável). O ai-guidelines tem `historico.md` (cronológico narrativo) e `research-index.md` (catálogo), mas **zero observabilidade viva**: não há resposta rápida para "quantas specs em execução? evolução do Tok-H? baseline de eval ainda válido?".
  - **Insight central:** o framework precisa **provar valor mensurável** — não apenas narrar processo. Audiência primária do dashboard é **owner + banca avaliadora em processo seletivo** (uso de portfólio), não consumidores externos. Por isso priorizado independente de adoção em consumidores reais.
  - **Escopo potencial faseado:**
    - **Fase 1 (entregável da spec):** schema JSON canônico de métricas em `.specify/telemetry/` (lar reservado pela 0021); CLI `ai-guidelines status` que emite o JSON em ~1s; renderizador HTML estático em `docs/dashboard.html` consumindo o JSON. Métricas mínimas: contagem/estado de specs por estágio, evolução do Tok-H por release, baseline de eval ativo, cobertura por zona (top/center/base/opt-in/universal), idade média do backlog, contagem de instalações via NPM (pós-publicação).
    - **Fase 2 (evolução, fora do escopo da spec):** framework dinâmico (Next.js) com pesquisa interativa, integração com Mixpanel para eventos do CLI nos consumidores, comparativos entre releases. Gatilho: schema JSON estável + ≥3 releases pós-Fase 1.
  - **Audiência:** owner + banca avaliadora (Fase 1); consumidores externos e mantenedores (Fase 2).
  - **Pré-requisitos:** Spec 0021 mergeada (lar reservado para `.specify/telemetry/`); Spec 0020 mergeada (entrega o pacote publicado no NPM, sob o qual o dashboard mede adoção real — narrativa de portfólio mais forte que dashboard isolado de métricas internas).
  - **Riscos antecipados:** schema JSON mal-modelado força rewrite na Fase 2 — mitigar com Stage 1 dedicado a esquema (campos versionados, extensível); HTML estático pode parecer amador para banca — mitigar investindo em layout limpo e gráficos via biblioteca leve (ex: Chart.js standalone) sem framework pesado; coleta de métricas pode acoplar demais com estado do repo — preferir parsers do `backlog.md`/`historico.md` em vez de novo storage.

- **seguranca-ia-supply-chain** (spec 0012 — Segurança de IA tools / supply chain)
  - **Fonte do insight:** incidente Vercel/Contex.ai (abril/2026), análise Lucas Montano [Hackearam a Vercel via AI](https://www.youtube.com/watch?v=oDXYfesz0qw). Síntese em `synthesis.md` Tema 4.
  - **Insight central:** ataque NÃO foi exploit de NextJS nem da API Vercel — foi via Contex.ai (AI agents) autorizado por funcionário Vercel via Google Workspace OAuth. Padrão emergente: cada AI tool autorizada via OAuth = nova superfície de ataque. _"O elo mais fraco nunca esteve sendo modelo. É a integração ou OAuth que essas ferramentas pedem na tela de onboarding."_
  - **Escopo potencial:** reescrever Regra 3 atual de `global-rules.md` cobrindo threat model OAuth de AI tools; criar `.core/rules/security.md` com política de marcação default sensitive, checklist de auditoria periódica de OAuth, política "nenhuma AI tool nova sem security review", rotação defensiva de secrets pós-incidente; comando CLI `audit-security` enumerando tools com OAuth.
  - **Audiência diferente de 0008:** governança de **operador humano** (não do agente IA) — por isso spec separada.
  - **Pré-requisitos:** Spec 0008 mergeada; idealmente decisão de visibilidade pública (cross-ref `project_ai_guidelines_visibilidade_publica.md`).
  - **Sinal de "está na hora":** consumidor real precisa autorizar nova AI tool e pergunta "como avalio o risco?"; ou outro incidente público similar (provável dada a tendência 2026).

> Candidatas anteriormente listadas no Now (`regra-hierarquia`, `cli-typescript`, `process-automations`) movidas para Next em 2026-05-07 com a reorganização do roadmap. Justificativa: dependem da classificação de informação que a Spec 0021 entrega (ou pelo menos não devem antecipá-la); priorização do Now passa a refletir o arco "publicar pacote → fundação de informação → entrada de demanda → visibilidade de saída".

### Oportunidades Priorizadas (Sem Spec)

- ~~**DRY nos testes das features Opt-in**: Abstrair o boilerplate de testes de integração/sincronização de regras (tdd, bdd, quality-gates) em um utilitário genérico `test-helpers.mjs`. (Débito da Spec 0016).~~ **Resolvido:** PR #1, Fase 2.7 — `cli/features/opt-in/test-helpers.mjs` com factory `createOptInRuleTestSuite()`.
- **Sobreposição Hierárquica na Arquitetura de Prompt**: parcialmente resolvido pelo ADR 0004 (Governance Single Responsibility) na Vaga E da spec 0004. Monitorar compliance em sessões futuras.
- **CLI `audit` — detecção de conflitos em configs globais**: comando que detecta `~/.gemini/GEMINI.md`, `~/.claude/CLAUDE.md`, `.cursorrules` globais, `~/.config/codex/instructions.md` e alerta sobre regras conflitantes com a Prime Directive do repositório. Fonte: ADR 0004.
- ~~**Automatizar ciclo de vida de Gaps**: workflow que facilite a alimentação de `NEXT.md` e `backlog.md` a partir de insights capturados no chat.~~ **Absorvido** por `process-refinement` (escopo item 4).
- ~~**Scaffold de fundação de spec via CLI** (`ai-guidelines spec init <slug>`): gerar `spec.md` + `plan.md` + `tasks.md` + `NEXT.md` a partir dos boilerplates com placeholders.~~ **Absorvido** por `process-automations` (Next) em 2026-05-07.

---

## Next (depois, ordem flexível)

Specs ou candidatas que entram na fila depois de esgotado o Now. Ordem pode ser reorganizada sem renumeração.

- ~~**template-lifecycle-e-update** (Candidata `evidence-driven` — ciclo de vida e update dos templates distribuídos)~~ **Absorvido pela Spec 0019** (reabertura consensuada 2026-05-07). A política de update unificada (`managed-block` para trampolins/ignores, `mirror` para templates SDD) e o comando `update` foram adicionados ao escopo da 0019 como sub-bloco C. Decidido resolver antes do merge para não fixar contrato que mudaria pouco depois e gerar re-trabalho na primeira leva de consumidores.

- **pr-curator-action** (`pr-curator` como feature CLI + GitHub Action ativa cross-repo)
  - **Fonte do insight:** auditoria durante a Fase 1 da Spec 0020 (2026-05-08). O plan original da 0020 § Componente E afirmava que `pr-curator` "existe como código no CLI"; revisão de `cli/features/{core,opt-in}/` confirmou que a feature **não está implementada** — `pr-curator` aparece apenas como documento de workflow editorial referenciado em ADR 0009 e `CHANGELOG.md`. Construir uma Action que invoca um comando inexistente seria implementação-fantasma.
  - **Decisão (2026-05-08, owner):** extrair de 0020 e tratar como spec própria. Publicação npm não depende dessa automação — `npx ai-guidelines init` funciona independentemente.
  - **Escopo potencial:** (1) implementar comando `pr-curator` na CLI (parser de PR, geração de patch cross-repo, integração com `gh`/Octokit, política de label `growth-relevant`); (2) workflow `.github/workflows/pr-curator.yml` no repositório da mantenedora com gatilho `pull_request` filtrado por label; (3) auth conforme **ADR 0009 Decisão 3** (GitHub App preferencial; PAT fino aceitável como bootstrap documentado); (4) e2e cross-repo executado pelo menos uma vez como evidência.
  - **Audiência:** mantenedora (operação de fluxo cross-repo entre repositório-base e consumidores).
  - **Pré-requisitos:** Spec 0020 mergeada (✓ esperada); ADR 0009 (já existente, insumo arquitetural).
  - **Riscos antecipados:** auth cross-repo é vetor de blast radius — ADR 0009 já fixa GitHub App como caminho preferencial; setup do App tem custo não-trivial e bootstrap via PAT fino é tolerável; rotação documentada no plan da spec.
  - **Sinal de "está na hora":** consumidor real precisar de patch cross-repo manual recorrente, ou owner começar a abrir PRs idênticos em múltiplos consumidores (sinal de que automação compensa custo de implementar).

- **tracker-automation** (Automação profunda de Trackers)
  - **Contexto:** A Spec 0016 revelou que apenas instruir o agente num arquivo `.md` não garante automação confiável com GitHub Projects V2 (que usa GraphQL e IDs globais).
  - **Escopo:** Feature opt-in (`tracker-github`) que injete scripts integradores (ex: `scripts/trackers/github-adapter.mjs`) e ensine o agente a rodar esses comandos no terminal para mover cards, garantindo precisão determinística.
  - **Origem:** Descoberta na Spec 0016.

- **harness-engineering** (spec 0009 — Harness Engineering)
  - **Fonte do insight:** Uncle Bob via [Lucas Montano — "até o Uncle Bob virou Vibe Coder"](https://www.youtube.com/watch?v=MvFO-W9zZRk) (cyclomatic complexity, mutation testing); [Lucas Montano — "Vai Faltar Dev 2027"](https://www.youtube.com/watch?v=T9V7EyB_B9w) (bugs típicos de IA invisíveis em review humano: N+1, race conditions, memory leaks).
  - **Cross-ref Spec 0008-E:** 0008 entrega o **checklist editorial**; 0009 entrega a **implementação técnica**.
  - **Tipos de falha que spec-driven não resolve sozinho:** amnésia entre sessões, falso "done", implementador e validador no mesmo processo, slop acumulado (degradação 5-10%/iteração), bugs de IA invisíveis em review humano.
  - **Escopo potencial:** agente validador separado com contrato "um-a-um"; sensores automáticos obrigatórios (prettier/typecheck/testes como gate, análise estática, mutation kill rate, detecção de bugs típicos de IA, secret scanning); evaluation como gate; integração com `/ultra-review`.
  - **Sub-bloco de modelagem de experimentos (absorvido 2026-05-07):** boilerplate de experimento (hipótese H, métrica M, baseline B, condição de sucesso, número de runs) em `.specify/templates/experiment-boilerplate.md`. Eval-as-gate é o coração da 0009; modelagem de experimento é a estrutura formal sob o gate. Absorvido aqui em vez de spec separada porque o acoplamento é total — eval da 0018 (manual, ad-hoc) vira a referência empírica do que o boilerplate deve capturar.
  - **Custo de adoção:** custo elevado assumido — multi-agent + sensors em cada feature = 2-3× tokens por PR. Compensa apenas quando custo de regressão começar a doer mais que custo de tokens.
  - **Pré-requisitos:** Spec 0003 mergeada (✓); idealmente Spec 0008 mergeada antes (sub-bloco B canoniza RPI ↔ governance-foundation; sub-bloco E canoniza checklist editorial); baseline da Spec 0018 já concluído.
  - **Seed deixada pela 0018:** o eval manual da 0018 vira **baseline-regression**; qualquer mudança futura em `rules` invalida esse baseline e exige re-rodada no harness. Research package congelado em `.specify/specs/researchs/governance/` + `.specify/specs/researchs/architecture/`.
  - **Artefatos preservados no histórico git:** `quality-gates/engine`, `detectors`, `ai-check` e `eval-runner` foram deliberadamente removidos do entregável da 0018, mas ficam como seed arquitetural para a 0009.
  - **Sinal de "está na hora":** um usuário rodar `/clear` esperando continuar uma spec e o agente novo não conseguir retomar com `tasks.md` + git; ou PR precisar de 3+ rounds de correção por causa de coisas que sensor automático pegaria.

- **regra-hierarquia** (spec 0011 — Hierarquia de regras por subdiretório no consumidor)
  - **Fonte do insight:** Diego (Rocketseat), [Claude Code em monorepo full-stack](https://www.youtube.com/watch?v=ARYzqW0W7iI) 2026-01-22. Síntese em `.specify/specs/0008-governance-coherence/research/synthesis.md` Tema 1.
  - **Insight central:** ferramentas como Claude Code já carregam contexto sob demanda em subdiretórios. Em vez de inflar `AGENTS.md` raiz, separar por domínio: `api/AGENTS.md`, `api/src/auth/AGENTS.md`, `dashboard/AGENTS.md`. Resultado: contexto cirúrgico, sem inflar tokens.
  - **Escopo potencial:** padrão **distribuído** que ai-guidelines passa para o consumidor — como ele organiza fragmentos de `AGENTS.md` em subdiretórios do próprio repo. Inclui template de fragmento, regra de descoberta, atualização do wizard de adopt para detectar/sugerir fragmentação. Princípio (Diego): documentar **padrões**, não nomes de arquivo/pasta.
  - **Distinção com Spec 0021:** 0021 organiza `.core/rules/` **dentro do nosso repo**; 0011 padroniza fragmentação **no repo do consumidor**. Audiências distintas, paths distintos.
  - **Pré-requisitos:** Spec 0008 e Spec 0018 concluídas (✓); Spec 0021 mergeada (entrega o lar de `.core/rules/` no nosso repo, do qual derivam os fragmentos distribuídos).
  - **Gatilho objetivo pós-0018:** priorizar quando o agregado compilado atingir **4,2 K tokens** (70% do teto de 6 K) ou quando consumidores começarem a reclamar de leitura indiferenciada entre domínios.
  - **Movida do Now em 2026-05-07** com a abertura da 0020.

- **handoff-contracts-formalization** (Contratos de handoff entre etapas e atores)
  - **Fonte do insight:** análise comparativa de frameworks AI-driven externos (2026-05-07) — frameworks maduros formalizam o handoff entre fases (estado persistente, transições auditadas) e entre atores (humano ↔ agente, agente ↔ agente). No ai-guidelines, `decision-brief.md` é o único handoff formalizado (Stage 1 → Stage 2 em specs evidence-driven). Faltam contratos para: Stage 2 → release/merge, spec fechada → memória de aprendizado, consumidor → mantenedora (friction reports), agente paralelo → agente paralelo.
  - **Insight central:** sem contrato de handoff, cada passagem de bastão depende de "lembrar de avisar" — escala mal além do owner solo. O item oportunista "Governança de Diálogo e Decisão" (alternativas ao `interaction-map.md`) é parente direto e fica **absorvido** nesta candidata.
  - **Escopo potencial:** boilerplate de handoff/decision-log genérico em `.specify/templates/`; contrato mínimo para PR description (handoff Stage 2 → review); contrato de friction report (handoff consumidor → mantenedora — depende de `stakeholder-intake-pipeline`); cross-ref com spec 0009 sobre handoff entre agente implementador e agente validador; lar canônico definido pela 0020.
  - **Pré-requisitos:** Spec 0021 mergeada (lar canônico); idealmente `stakeholder-intake-pipeline` mergeada (contrato de friction report depende dela).
  - **Riscos antecipados:** boilerplate de handoff vira fricção se obrigatório em todas as transições — mitigar com matriz "qual handoff exige qual artefato" e default opt-in para os menos críticos.

- **cli-typescript** (Migração TypeScript da CLI)
  - **Fonte do insight:** Remanescente do cli-refactor após a Spec 0017 assumir a reorganização de pastas.
  - **Escopo potencial:** migrar `.mjs` → `.ts` com `tsconfig.json` estrito, obtendo type-safety nas interfaces de features, options e context.
  - **Pré-requisitos:** Spec 0017 concluída (estrutura estável antes de migrar linguagem). Decisão sobre bundler (tsup, esbuild, ou script Node nativo).
  - **Riscos antecipados:** migração TS pode inflar `package.json` com deps de build; aliases precisam funcionar tanto em dev (`tsx`/`ts-node`) quanto no bundle publicado; diff será massivo (renomear ~40 arquivos).
  - **Movida do Now em 2026-05-07:** desacoplada de design; bulk técnico não bloqueia ninguém na fila.

- **process-automations** (Automatização de ciclo de vida de Gaps via CLI)
  - **Fonte do insight:** Remanescente do process-refinement (o processo em si foi absorvido pela 0017, mas a automação via CLI é separada).
  - **Escopo potencial:** criar workflow/comando no CLI que facilite a alimentação de `NEXT.md` e `backlog.md` a partir de insights capturados no chat; comando `ai-guidelines config` para bootstrap explícito do workspace documental e entrega de prompts canônicos de primeira sessão/continuidade; comando `ai-guidelines spec init <slug>` (scaffold de fundação de spec, incorporando o item oportunista correspondente) sobre o contrato canônico definido pela 0021.
  - **Pré-requisitos:** Spec 0021 mergeada (a classificação canônica define onde os artefatos scaffolded vão).
  - **Insumo de consumo real (2026-05-08):** no repo `site`, o fluxo `yarn add ai-guidelines --dev` + `npx ai-guidelines` foi percebido como lento e com encerramento estranho do processo interativo. Qualquer automação nova desta candidata deve nascer com UX headless/TTY claramente separada e teste de fim de fluxo via shim real (`npx`/`node_modules/.bin`), não apenas pelo entrypoint direto.
  - **Movida do Now em 2026-05-07:** depende da decisão de 0020 sobre placement.

- ~~**scaffolding-inteligente-de-provedores** (Candidata — automação de provider detection + trampolins)~~ **Incorporada** em `bootstrap-consumidor-e-runtime`: mantém a tese original de provider detection + trampolins + guardrails contra _Context Rot_, agora somada à distribuição de boilerplates SDD, UX do wizard e refactor topológico do `AGENTS.md`.

---

## Later (gatilho específico)

Specs ou candidatas que aguardam um gatilho externo (adoção, incidente, decisão estratégica). Documente o gatilho explícito.

- **quota-awareness** (spec 0014 — Quota Awareness Dashboard)
  - **Fonte do insight:** pesquisa Spec 0008 — `synthesis.md` Tema 5 (Lucas Montano "Vai Faltar Dev 2027") + decisão registrada 2026-04-24.
  - **Gatilho:** Spec 0008-C concluída (interpretação manual documentada) + um consumidor real estourar quota e perguntar "como eu sabia que estava perto disso?".
  - **Escopo potencial:** feature opt-in `quota-dashboard` ao lado de `prettier`/`husky`/`ci`; lê quotas via APIs de provider (Anthropic, OpenAI, Google) ou MCPs; sugere ações em thresholds (rotacionar para modelo mais barato, fragmentar tarefa, pausar até reset). **Decisão sempre fica com o usuário** — ferramenta sugere, não age.
  - **Riscos antecipados:** APIs de usage variam entre providers; credenciais = mais OAuth (cross-ref Spec 0012); sugerir "rotação para mais barato" pode parecer paternalista — UX precisa preservar autonomia do dev.

## Bloqueadores cross-spec

Decisões ou trabalho que bloqueiam múltiplas specs. Cada bloqueador lista as specs impactadas.

### 2. ~~Release Sync da Spec 0020 (`ai-guidelines@1.0.0` + `1.0.1`)~~ — **resolvido em 2026-05-08**

- **Resolução:** mini-PR `release/v1.0-sync` (PR #8) atualiza `roadmap/historico.md` com SHAs reais (`9ef875a` para `1.0.0`, `2bd4af3` para `1.0.1`), tags (`v1.0.0`, `v1.0.1`), links do registry e data — fechando o gap entre o PR auto-suficiente da Spec 0020 e o ato pós-merge de release. A remoção deste bloqueador é parte do mesmo PR (princípio de PR auto-suficiente: tudo o que precisa ficar consistente após o merge sai junto).
- **Padrão de framework cravado:** sequência canônica `merge → checkout main → publish → tag → Mini-PR de Release Sync` documentada em `.core/process/governance-foundation.md` § "Sequência canônica para specs com publish em registry externo", junto com a regra de bloqueio de nova spec enquanto Release Sync estiver pendente. Vale para releases futuras.
- **Origem:** padrão nasceu de dor real durante a execução da Spec 0020 — erro de sequência detectado pelo owner antes do publish irreversível, evoluindo para decisão arquitetural em vez de fix tático.

### 1. ~~Naming decision do package `ai-guidelines`~~ — **resolvido em 2026-05-07**

- **Impactava:** spec 0006 (renumerada como Spec 0020 com a promoção).
- **Decisão:** package principal publicado como **`ai-guidelines`** (não-scoped). A org `@ai-guidelines` (criada anteriormente em npmjs.com) fica reservada para extensões futuras (`@ai-guidelines/<addon>`).
- **Critério decisivo:** comando `npx ai-guidelines init` é objetivamente mais memorável e narrativamente mais forte para portfólio do que alternativas com scope (`@<scope>/core`). Disponibilidade verificada no registry npm em 2026-05-07 (`HTTP 404` em `registry.npmjs.org/ai-guidelines` → nome livre).
- **Risco residual:** alguém pode publicar `ai-guidelines` antes da Spec 0020 fechar. Mitigação opcional discutida mas não executada por padrão (publish placeholder); a opção pragmática adotada foi promover a 0020 imediatamente para fechar a janela de exposição rapidamente.
- **Cross-ref:** Spec 0020 (`npm-publication`) registra esta decisão em ADR formal como parte do entregável.

---

## Itens oportunistas (sem spec)

Ideias, insights e débitos pequenos que ainda não justificam uma spec dedicada.

- **Catalogar skills em `skills/`** com metadados (quando usar, última verificação, exemplos). Cross-ref Spec 0015 (auditoria pode mover skills/ para `docs/`).
- **Publicar versão sanitizada** do `ai-guidelines` como package da futura empresa quando aplicável (continuidade metodológica).
- **Expor skills via servidor MCP local** para Claude Desktop / Claude CLI consumir dinamicamente.
- **Avaliar Multica novamente** quando surgir nova oportunidade.
- **Cobertura para monorepos** com workspaces ativos (pnpm/yarn/npm workspaces) no init kit.
- **CI multi-SO para validação de EOL cross-platform**: smoke tests do CLI em runners Windows/Linux/macOS. _(herdado do `NEXT.md` da spec 0003 — atendido pela Spec 0020 via `smoke-multi-os.yml` mergeado em 2026-05-08; manter aqui apenas como referência histórica.)_
- **Documentar três armadilhas cross-platform descobertas na Spec 0020** em FAQ de contribuidor (`docs/cli/ai-guidelines-cli.md` ou similar): (1) `.npmignore` é ignorado quando `files` está em `package.json` (usar globs negativos dentro do próprio `files`); (2) `fs.readdir(absolute, { recursive: true })` + `entry.parentPath` é frágil cross-Node-version e cross-SO — usar recursão manual stack-based quando a corretude do path importar (referência canônica: `listFilesRecursive` em `cli/fs/file-system.mjs`); (3) `import.meta.url` resolve symlinks em macOS enquanto `process.argv[1]` mantém o path literal — guards de entrypoint precisam de `realpathSync` em ambos os lados (referência: `cli/ai-guidelines-cli.mjs`). Não justifica spec própria; é nota de conhecimento operacional. _(herdado do `NEXT.md` da Spec 0020 — débitos #1, #2, #3 da seção "Insights e Descobertas".)_
- **Merge semântico em repos com `.husky/` preexistente**: substituir "abort ou `--force`" por merge entre hooks existentes e do kit.
- **`init-project.ps1` Windows nativo**: para quem não tem Git Bash. Baixa prioridade enquanto Git Bash é o default.
- **Expansão do `adopt` para migrações mais agressivas**: upgrades de `AGENTS.md` legados sem marcadores e hooks Husky com shape mais complexo.
- **Adapters por IA no repo-alvo**: criar `for-claude/`, `for-gemini/`, `for-codex/` automaticamente durante o init.
- **Template de `CLAUDE.md` / `GEMINI.md` / `CODEX.md` por IA**: hoje o init só gera `AGENTS.md` agnóstico; extensões específicas ficam manuais.
- **Workflow / skill `codex-cross-review`** (Lucas Montano, Opus 4.7): antes de abrir PR, rodar Codex CLI com `--base <branch>` e classificar achados em P1/P2/P3. Adotar quando houver métrica de nitpicks recorrentes em review humano que codex pegaria.
- **Estratégia de 1M token context** (Opus 4.7): para refactors de módulo grande, mandar arquivos inteiros em vez de resumos. Tradeoff — gasta mais por operação, economiza em iterações. Regra prática: usar quando o próprio Claude pedir arquivo extra 2+ vezes na mesma sessão.
- **Kubb / Swagger → hooks tipados + mocks** (Diego Fernandes, não é ai-guidelines): quando repositórios mantenedores tiverem APIs próprias, Kubb lê OpenAPI e gera código tipado. Apontamento cross-repo.
- ~~**Governança de Diálogo e Decisão**: pesquisar alternativas ao `interaction-map.md` (Decision Logs agentic-aware) para evitar artefato efêmero sem peso de Plano.~~ **Absorvido** por `handoff-contracts-formalization` (Next) em 2026-05-07.
- **Check de Atualização interino no CLI**: antes da Spec 0020 (NPM), avaliar sensor leve no CLI que consulte API do GitHub para alertar sobre novas tags de release. Ver `research/update-notifications-strategy.md`. **Contexto adicional da Spec 0019:** a infraestrutura de update determinístico já existe (`ai-guidelines update` + `managed-block` + versionamento de templates). Falta apenas o sensor que avisa "vX.Y disponível, rode update" — decisões em aberto: (a) cache TTL para evitar request a cada invocação, (b) opt-out via env var, (c) acoplamento com 0020 como fonte canônica de "latest". Pode virar mini-spec ou ser absorvido pela 0020 (NPM).
- **Ajustes de UX no Gate de Cobertura**: refinar mensagens de erro e thresholds com base nos aprendizados da spec 0004 (thresholds realistas vs artificiais).
- **`GOVERNANCE-CATALOG.md` como regra runtime do `<AI_GUIDELINES>`**: o bloco `<AI_GUIDELINES>` compilado hoje não referencia o catálogo (só o `AGENTS.md` § Contexto Local aponta). Avaliar se o ponteiro deve virar regra `[CORE-*]` em `.core/rules/top/`, junto com a auditoria de naming dessa zona. _(migrado do `NEXT.md` da Spec 0021 — Fase 4 #5.)_
- **Auditoria de naming em `.core/rules/top/`**: a fronteira `agents-core.md` (workflow operacional do agente, CORE-\*) vs `global-rules.md` (princípios de engenharia, GR-\*) faz sentido em escopo mas o naming confunde. Avaliar (a) renomear arquivos para nomes auto-explicativos; (b) consolidar README na zona explicando a fronteira; (c) considerar sub-zonas (operacional vs engenharia vs editorial). _(migrado do `NEXT.md` da Spec 0021 — Fase 4 #7; débito original da Fase 3 sub-bloco 3.0.)_
- **Rename futuro do pacote npm `ai-guidelines`**: registrado como débito formal por `[ADR 0018]`. Decisão atual é manter o nome via reclaim semântico de surface (README, AGENTS.md framing). Se tração futura pedir rename mais explícito (`repo-governance`, `eng-governance`), abrir spec dedicada — não é princípio arquitetural, é decisão de positioning movida por sinal de mercado. _(migrado do `NEXT.md` da Spec 0021 — Fase 4 #8.)_
- **Reposicionamento de superfícies externas pós-merge da Spec 0021**: GitHub topics, descrição do repo no GitHub, landing page (se houver), badges. Release follow-up; não bloqueia merge da 0021. _(migrado do `NEXT.md` da Spec 0021 — Fase 4 #9.)_
- **Cutover completo da CLI mjs para `src/` DDD**: `[ADR 0018]` § "Onde se aplica". A 4.C iniciou o cutover via TemplateEngine (recipes substituindo mirror); o cutover completo (Registry mjs → `GovernanceRegistryStore` real, demais use cases) é trabalho de specs futuras dedicadas. **Spec 0022 aberta como discovery-first (PR #16, Stage A Paused), aguardando lifecycle metodológico novo.** _(migrado do `NEXT.md` da Spec 0021 — Fase 4 #10.)_
- **Harness Lock como contrato executável no boilerplate de `tasks.md`** (proposta de meta-spec): adicionar bloco canônico "PR Strategy Decision" ao boilerplate que determine objetivamente se a spec exige múltiplas PRs (gate por 2+ critérios: contrato consumidor, migração, novo SSOT, re-arquitetura runtime, topologia interna, engine "inteligente", diff >2000 LOC). Dimensionamento sugerido: 1 PR / 3 PRs / 5 PRs tipo 0021. Contrato por PR exige `[PR-MGMT.NEW-BRANCH]`, `[PR-MGMT.DESCRIPTION]` (6 seções), `[PR-MGMT.REVIEW-GATE]`, `[PR-MGMT.MERGE-CHAIN]`. Benefício: `tasks.md` opera como contrato executável, reduzindo risco de mega-PR irrevisável e churn de micro-PRs. _(migrado da seção "Insights" do `NEXT.md` da Spec 0021 — proposta nasce do aprendizado de executar a própria 0021 em Harness Lock.)_
- **Migração completa dos recipes restantes (`spec`, `plan`, `decision-brief`, `next`, `roadmap`, etc.) do mirror `.specify/templates/` para a TemplateEngine** (`AssembleArtifact` + `NodeRecipeStore`): a Spec 0021 sub-bloco 4.C.0 ativou a engine para a recipe `tasks-evidence-driven` (única migrada completamente, com partials atômicos). Os demais templates seguem como mirror estático em `.specify/templates/` consumidos por `tryRenderViaEngine` que cai em fallback mirror quando recipe não existe. **Migração total exige spec dedicada** — cada recipe envolve decisão de partials atômicos, schema validation, equivalência mirror↔engine (E1–E7), R4 (output naming), e atualização do `LegacyMirrorContract.test.ts`. Promovido a entrada explícita durante 4.D.[DEBT-REVIEW] da 0021 (antes vivia implicitamente no item "Cutover completo" acima). _(elevado de item "empurrado com a barriga" identificado na closure-review.md da 0021 §6.2.)_
- **Mecanismo de fechamento disciplinado para foundation/convergence specs** (proposta de meta-spec): a Spec 0021 inaugurou — sem template — o uso de `closure-review.md` como artifact de fechamento, para distinguir "completou seu escopo" de "deixou tarefas para depois" em specs que estabelecem paradigma (não entregam feature). Avaliar promover `closure-review.md` a artifact canônico do lifecycle (parte do template SDD), com critérios objetivos para quando usá-lo (ex.: spec absorveu amendments de escopo, spec expandiu sub-blocos pós-gate, spec virou foundation). _(elevado da observação meta-metodológica registrada na closure-review.md da 0021 — provavelmente parte do escopo da futura Spec 0023 sobre lifecycle metodológico.)_

---

## Regras de uso

1. Nada aqui entra em execução sem nova spec dedicada em `.specify/specs/<slug>/`.
2. Ao fechar uma spec (status Done), revisar seu `NEXT.md`: migrar itens ainda relevantes para este arquivo; depois **deletar** o `NEXT.md` da spec.
3. Ao abrir spec nova: ler este arquivo primeiro, referenciar itens relevantes no `spec.md` da nova spec (não duplicar conteúdo).
4. Se um item oportunista virar prioridade, promover para spec própria — não executar ad-hoc.
5. Bloqueadores cross-spec ficam aqui, não dentro de `NEXT.md` de specs individuais (evita duplicação).
6. Candidatas vivem por **slug semântico**; número só na criação da branch. Reorganizar prioridade = mover entre seções, não renumerar.
7. **Ciclo de Fricção:** toda Issue aberta com tag `friction` ou que reporte falhas sistêmicas no CLI (init/adopt) deve ser avaliada como candidata a Spec antes de qualquer correção ad-hoc, garantindo que o framework evolua por design e não por "patches".
