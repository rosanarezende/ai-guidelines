# Backlog — ai-guidelines

Este arquivo é o backlog vivo do repositório. Captura specs em execução, próximas na fila, candidatas, bloqueadores cross-spec e itens oportunistas.

**Regra de ouro:** nada aqui entra em execução sem nova spec (`.specify/specs/<slug>/`). Este arquivo é leitura obrigatória antes de abrir spec nova ou fechar uma spec existente.

**Política repo-first, integração-friendly:** o repositório é a memória canônica. Ferramentas externas (GitHub Projects, Jira, Linear, etc.) podem ser camada colaborativa humana via campo opcional `tracker` nas entradas abaixo, mas o resumo mínimo no `backlog.md` é mandatório.

Detalhes de lifecycle em [`.core/process/spec-foundation.md`](../../../.core/process/spec-foundation.md).

---

## Em execução

Specs atualmente em branch ativa. Formato enxuto.

_(Nenhuma spec em execução no momento.)_

> **Spec 0019** (`bootstrap-consumidor-e-runtime`) concluída e mergeada em 2026-05-07 (PR #5, commit `35af73a`).
> **Spec 0020** (`npm-publication`) concluída e mergeada em 2026-05-08 (PR #6).
> Detalhes em [`historico.md`](./historico.md).

---

## Now (próxima fila, ordem importa)

Specs ou candidatas priorizadas para iniciar em seguida. Ordem indica prioridade.

- **governance-information-architecture** (spec **0021** — Auditoria + classificação canônica de informação essencial do framework) — **próxima na fila** _(Spec 0020 mergeada em 2026-05-08; ver `historico.md`.)_
  - **Histórico de numeração:** era candidata a Spec 0020 até 2026-05-07. Renumerada para 0021 quando `npm-publication` foi promovida (auditoria do package.json revelou que estava quase pronto). Branch original `0020-governance-information-architecture` renomeada para `0020-npm-publication` e o conteúdo desta candidata aguarda nova branch quando 0020 fechar.
  - **Fonte do insight:** revisão da Spec 0018 (Stage 1, 2026-04-30) — owner identificou que `.core/process/spec-foundation.md` é constituição operacional viva, mas está misturada em `docs/` com documentos descritivos; ausência de catálogo de informação essencial; gêneros documentais (constituição × ADR × regra runtime × doc descritivo × referência) sem classificação explícita nem regra de "qual gênero vai para onde". Reforçada em 2026-05-07 por análise comparativa de frameworks AI-driven externos, que evidenciou três gêneros documentais ainda **ausentes** no framework: PRD/intake estruturado, contratos de handoff, telemetria de framework.
  - **Insight central:** o framework hoje tem 5+ classes de informação espalhadas em `docs/`, `adrs/`, `.core/`, `.specify/`, raiz — sem catálogo único, sem princípio de classificação documentado. ADRs cobrem decisões singulares; `spec-foundation.md` cobre processo vivo; `.core/rules/*` cobrem runtime distribuído; `docs/features.md`/`ai-efficiency-guide.md` são descritivos. Tudo coabita sem fronteira. Novo agente/contribuidor precisa adivinhar onde olhar primeiro.
  - **Escopo potencial:** auditoria de placement atual de cada documento essencial; classificação canônica em N classes (constituição operacional × ADRs × regras runtime distribuídas × documentação descritiva × referência operacional); decisão entre catálogo central (`INFORMATION-CATALOG.md`) vs reorganização física (`.specify/foundation/`) vs híbrido; decisão sobre ADRs absorverem decisões atômicas que hoje vivem dentro de `spec-foundation.md`; **reorganização física do próprio `.core/rules/` no repo** (top/center/base, opt-in/universal — placement interno do framework, não fragmentação no consumidor); tornar a política parte do framework distribuído (template) se aplicável.
  - **Sub-bloco antecipatório (Stage 1):** identificar gêneros documentais **ausentes** detectados em benchmark comparativo externo e **reservar lar canônico** sem implementar agora — (a) PRD/intake estruturado de stakeholders, (b) contratos de handoff/decision logs entre etapas e atores, (c) telemetria de framework (schema JSON canônico de métricas, cobrindo dashboard local-first inicial e evolução para framework dinâmico Next/Mixpanel). Sem esse sub-bloco, cada candidata posterior (`stakeholder-intake-pipeline`, `handoff-contracts-formalization`, `framework-observability-dashboard`) reabriria a discussão de "onde mora".
  - **Tipo:** `evidence-driven`. Stage 1 obrigatório (auditoria + decision-brief + gate humano) antes de Stage 2 (migração + redirects + atualização de links).
  - **Audiência:** governança meta-framework. **Distinção com Spec 0011:** 0021 organiza meta-docs do framework e o lar físico de `.core/rules/` **dentro do nosso repo**; 0011 padroniza como o **consumidor** fragmenta `AGENTS.md` por subdiretório (`api/AGENTS.md`, `dashboard/AGENTS.md`) **no repo dele**. Audiências distintas (mantenedora vs consumidor); sem conflito de paths.
  - **Out of scope (declarar em `spec.md`):** padrão distribuído de fragmentação em consumidores (fica para 0011); implementação dos três novos gêneros (intake, handoff, telemetria — viram specs próprias); CLI scaffold de spec (fica para `process-automations`).
  - **Pré-requisitos satisfeitos:** Spec 0018 mergeada (✓), Spec 0019 mergeada (✓). Spec 0020 (npm-publication) em execução — não bloqueia conceitualmente, mas a sequência 0020 → 0021 evita churn no `README` durante publicação.
  - **Riscos antecipados:** tocar em paths estáveis (`docs/`, `adrs/`, `.core/rules/`) gera diff amplo; pode requerer migração de links em vários docs (`README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `CLAUDE.md`). Mitigar com rename + ponteiro de redirect comentado nos arquivos antigos durante transição; commits isolados por classe migrada (não big-bang); redirects no mesmo commit do rename.
  - **Insumo herdado da Spec 0020:** débito #2 do `NEXT.md` da 0020 (placement canônico de `.specify/templates`) — a smoke do tarball expôs que os boilerplates SDD distribuídos ao consumidor vivem em `.specify/templates/` mas são lidos como artefato do framework por `cli/features/core/templates.mjs`. A 0020 corrigiu o payload do npm incluindo `.specify/templates` explicitamente em `files`; a 0021 deve tratar a migração para um lar canônico em `.core/` como decisão arquitetural explícita, com plano de migração de referências (`README`, `.core/process/spec-foundation.md`, specs históricas, código da CLI).
  - **Insumo de consumo real (2026-05-08):** teste manual de adoção no repo consumidor `site` (Yarn Classic 1.22.22) via `yarn add ai-guidelines --dev` + `npx ai-guidelines` expôs três fricções de ponta a ponta: (a) percepção de latência alta no bootstrap; (b) sensação de retenção do TTY/encerramento estranho da CLI ("só saiu quando dei Enter"); (c) ausência de um comando explícito de configuração/bootstrap do sistema documental. A 0021 **não** deve corrigir a CLI, mas deve decidir se existe um `spec_workspace_dir` configurável (com default canônico), a separação formal entre `sdd_dir` e esse workspace, e o contrato documental para comandos futuros (`config`, `spec init`, `intake`, `status`). Research de apoio: `.specify/specs/researchs/architecture/2026-05-08-consumer-bootstrap-frictions.md`.
  - **Cross-ref:** `[DEC-0018-A06]` na decision-brief da 0018 captura o débito tático (onde fica a seção "Tipos de spec") cuja resposta arquitetural ampla é desta candidata.

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
  - **Pré-requisitos:** Spec 0003 mergeada (✓); idealmente Spec 0008 mergeada antes (sub-bloco B canoniza RPI ↔ spec-foundation; sub-bloco E canoniza checklist editorial); baseline da Spec 0018 já concluído.
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
- **Padrão de framework cravado:** sequência canônica `merge → checkout main → publish → tag → Mini-PR de Release Sync` documentada em `.core/process/spec-foundation.md` § "Sequência canônica para specs com publish em registry externo", junto com a regra de bloqueio de nova spec enquanto Release Sync estiver pendente. Vale para releases futuras.
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

---

## Regras de uso

1. Nada aqui entra em execução sem nova spec dedicada em `.specify/specs/<slug>/`.
2. Ao fechar uma spec (status Done), revisar seu `NEXT.md`: migrar itens ainda relevantes para este arquivo; depois **deletar** o `NEXT.md` da spec.
3. Ao abrir spec nova: ler este arquivo primeiro, referenciar itens relevantes no `spec.md` da nova spec (não duplicar conteúdo).
4. Se um item oportunista virar prioridade, promover para spec própria — não executar ad-hoc.
5. Bloqueadores cross-spec ficam aqui, não dentro de `NEXT.md` de specs individuais (evita duplicação).
6. Candidatas vivem por **slug semântico**; número só na criação da branch. Reorganizar prioridade = mover entre seções, não renumerar.
7. **Ciclo de Fricção:** toda Issue aberta com tag `friction` ou que reporte falhas sistêmicas no CLI (init/adopt) deve ser avaliada como candidata a Spec antes de qualquer correção ad-hoc, garantindo que o framework evolua por design e não por "patches".
