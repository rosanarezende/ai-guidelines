# Research: Auditoria MECE dos 7 pilares + Inventário das ADRs legadas (Saneamento de Fundação pré-PR3)

**Data:** 2026-05-11
**Domínio:** Taxonomia de Work Items e Governança Documental
**Relacionado a:** Spec 0021 (`governance-information-architecture`), `[DEC-0021-A02]`, sub-bloco 4.B (foundation vs ADR)
**Status:** Insumo de Stage 2 — material de **Saneamento de Fundação** ordenado pelo Arquiteto Líder antes do TDD do PR3.

---

## 0. Contexto e escopo

O Arquiteto Líder pediu, antes do TDD 3.A, duas auditorias paralelas:

1. **Taxonômica:** validar se os 7 pilares atuais (`spec`, `exploration`, `fix`, `patch`, `incident`, `proposal`, `experiment`) são genuinamente MECE e se os nomes funcionam no vocabulário AI-first 2026. Se necessário, propor revisão de `[DEC-0021-A02]`.
2. **Documental:** inventariar as ADRs existentes em `/adrs/` (raiz do repo), avaliar quais ainda fazem sentido como ADR e propor cleanups via tasks na Spec 0021.

Saída esperada: relatório executivo + recomendações concretas + tasks a serem adicionadas no `plan.md`/`tasks.md` antes da elaboração dos rascunhos das ADRs (A–E).

---

## Parte 1 — Auditoria MECE dos 7 pilares

### 1.1 Análise interna (Mutuamente Exclusivos?)

Tabela de tensões par-a-par, do mais problemático ao trivial:

| Par                              | Tensão                                | Veredito                                                                     | Raciocínio                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`exploration` ⇄ `experiment`** | 🔴 **Alta** (apontada pelo arquiteto) | Distintos por domínio decisório, mas o **nome `exploration` é problemático** | `exploration` = "consigo construir? qual a melhor forma técnica?" (domínio: engenharia). `experiment` = "isso gera valor de produto/negócio?" (domínio: mercado/hipótese). São MECE por intenção, mas a palavra "exploration" é ambígua — colide com "product discovery / exploration phase" (vocabulário PM) e com "exploratory data analysis" (vocabulário data). |
| **`fix` ⇄ `patch`**              | 🟡 Média                              | MECE por intenção, mas a fronteira exige disciplina humana                   | `fix` = correção de bug funcional **observável pelo usuário**, exige `plan+tasks` mínimos. `patch` = manutenção **invisível** (libs, lint, refactor transparente). A distinção é semântica, não estrutural. Pode haver casos limítrofes (refactor que corrige bug latente). Aceitável como custo de granularidade fina.                                             |
| **`fix` ⇄ `incident`**           | 🟢 Baixa                              | MECE por **severidade**                                                      | `incident` tem `severity` obrigatório, impacta métricas/CI/downtime. `fix` é correção sem severidade atribuída.                                                                                                                                                                                                                                                     |
| **`proposal` ⇄ `spec`**          | 🟢 Baixa                              | MECE por **maturidade do ciclo**                                             | `proposal` = semente, sem pasta física, promotível. `spec` = ciclo formal completo.                                                                                                                                                                                                                                                                                 |
| **`spec` ⇄ `experiment`**        | 🟢 Baixa                              | MECE por **certeza**                                                         | `spec` = vou entregar uma feature decidida. `experiment` = vou testar uma hipótese; pode promover a spec se won.                                                                                                                                                                                                                                                    |
| Restantes                        | 🟢 Baixa                              | MECE trivial                                                                 | Categorias distintas por construção (dense vs virtual; estado vs entrega).                                                                                                                                                                                                                                                                                          |

**Veredito MECE:** os 7 pilares são genuinamente MECE em **semântica**. O único problema real é de **naming** em `exploration`.

### 1.2 Análise interna (Coletivamente Exaustivos?)

Verifiquei cenários reais para detectar "buracos":

- **Research arquitetural puro** (este próprio documento) — não é WorkItem; vive em `.specify/specs/researchs/`. ✅ Fora do escopo por construção.
- **Documentation-only changes** (atualizar README/AGENTS.md sem mudar comportamento) — cai em `patch` (manutenção invisível). ✅ Coberto.
- **Hotfix urgente em produção** — cai em `incident` ou `fix`, dependendo da severidade. ✅ Coberto.
- **Refactor maior multi-arquivo** — cai em `spec` se for grande/arquitetural, `patch` se transparente. ⚠️ Limite cinza mas aceitável.
- **Migração de dependência major** — `patch` se transparente para o usuário, `spec` se introduzir mudança comportamental. ⚠️ Limite cinza.
- **Decisão arquitetural pura sem código** — vira ADR, não WorkItem. ✅ Fora do escopo por construção.

**Veredito exaustividade:** **Coletivamente exaustivo** para tudo que **gera commit no repo**. Pequenas zonas cinza (`fix` vs `patch`, `patch` vs `spec` em refactors médios) são custo aceitável de granularidade.

### 1.3 Benchmark externo de naming (AI-first 2026)

Pesquisa externa mostra convergência em três famílias de vocabulário:

#### Família A — Agile/XP tradicional (JIRA, Scrum, Visual Paradigm)

- **Story / Feature** — entrega de capacidade.
- **Bug** — correção.
- **Task** — trabalho sem entrega visível.
- **Epic** — agrupador.
- **Spike** — investigação técnica time-boxed (citação direta: "Spikes primarily come in two forms: technical and functional. Technical spikes are used for evaluating the impact new technology has on current implementation").

#### Família B — Shape Up (Basecamp)

- **Pitch** → **Bet** → **Cycle**.
- Vocabulário **não-MECE** por design — é fluxo, não taxonomia.
- Não substitui o esquema de pilares.

#### Família C — AI-first / Product Discovery (Productboard, McKinsey, Thoughtbot, Miro)

- **Discovery** — processo contínuo, não work item.
- **Exploration** — fase divergente do discovery, "expand possibilities through research" (Productboard).
- **Prototype / PoC** — artefato produzido pela exploration.
- **Functional prototype** vs **production-ready system** — distinção temporal explícita (1-2 semanas vs 2-3 meses).

**Convergência crítica:** em vocabulário 2026, **`exploration` significa fase de discovery de produto**, não investigação técnica. Há colisão direta com nosso uso atual.

### 1.4 Proposta de naming

**Recomendação primária:** renomear `exploration` → **`spike`**.

| Critério                                | Justificativa                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Precisão semântica**                  | `spike` é canônico desde XP/Scrum para "time-boxed technical investigation". Cobre PoCs, prototipos e estudos práticos exatamente como a justificativa de `[DEC-0021-A02]` descreveu o `exploration`. |
| **Diferenciação clara de `experiment`** | `spike` = pergunta técnica ("consigo construir?"); `experiment` = pergunta de valor ("isto gera resultado?"). Vocabulário distinto, raramente confundido na literatura.                               |
| **Compatibilidade AI-first 2026**       | Não colide com "discovery"/"exploration" do mundo PM/produto. Permite navegar conversas com PMs/PDs e times técnicos sem disambiguation.                                                              |
| **Adoção no mercado**                   | JIRA inclui `Spike` como issue type oficial (community thread "How to adding Spike as a new issue type" tem alta tração). Linear, GitLab e GitHub Issues aceitam `spike` como label canônico.         |
| **Custo de migração**                   | Baixo: troca textual em domain (`WorkItemKind`), policy, testes, decision-brief e ARCHITECTURE.md. Sem release pública dependendo do nome antigo (pre-1.0).                                           |

**Alternativas avaliadas e rejeitadas:**

- `prototype`: muito específico — não cobre estudos sem entregável tangível. Spike inclui prototype como possível resultado, não substitui.
- `poc`: acrônimo, perde clareza. Inclusive abrange casos onde nem chega a PoC (estudo puro).
- `discovery`: colide com vocabulário PM. Sugere processo, não item.
- `investigation`: válido mas menos canônico; perde efeito de "time-boxed" embutido em `spike`.
- Manter `exploration`: assume débito de naming permanente em vocabulário 2026.

**Recomendação secundária:** **manter os outros 6 nomes** (`spec`, `fix`, `patch`, `incident`, `proposal`, `experiment`). Todos têm cobertura externa robusta e zero colisão problemática.

### 1.5 Impacto da mudança proposta

Se aprovada, a renomeação `exploration` → `spike` impacta:

| Camada          | Itens                                                                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain**      | `WorkItem.ts` (`WorkItemKind`), `WorkItemPolicy.ts` (`PILLAR_INVARIANTS`), `integrity.ts`, `Pillars.test.ts`                                              |
| **Application** | nenhum (use cases não codificam kind no nome)                                                                                                             |
| **Infra**       | `registrySchema.ts` (`UNKNOWN_KIND` lista), eventualmente fixtures YAML                                                                                   |
| **Docs**        | `decision-brief.md` [DEC-0021-A02], `plan.md` (linha 25 — citada pelo arquiteto), `ARCHITECTURE.md` §3.1 e §5 glossário, `ARCHITECTURE-REFERENCE.md` §3.1 |
| **Tasks**       | Esta spec não precisa de update; PR4 cleanup pode usar para alinhar specs históricas                                                                      |

Tamanho estimado da PR de renomeação: <100 LOC (find/replace controlado + ajuste de testes). Cabe em sub-bloco atômico **antes ou junto com 3.A** (decisão do arquiteto).

### 1.6 Conclusão Parte 1

> **Os 7 pilares são MECE em semântica.** O único defeito é o nome `exploration`, que colide com vocabulário AI-first 2026 ("exploration" como fase de discovery de produto). **Recomendo revisão pontual de `[DEC-0021-A02]` para renomear `exploration` → `spike`**, mantendo os outros 6 nomes. Não é "reabrir o gate" — é correção de naming pré-1.0, antes que o vocabulário endureça.

---

## Parte 2 — Inventário e auditoria das ADRs legadas

> **⚠️ Status desta Parte 2: PRELIMINAR.** O inventário e as reclassificações abaixo (`Superseded by`, `Parcialmente Superseded`) foram redigidos **antes** do critério editorial "ADR é princípio perene, não revisitação datada" ter sido estabelecido (2026-05-11, durante reescrita das 5 ADRs novas em `.core/governance/adrs/`). À luz desse critério, o problema das ADRs legadas é mais profundo do que "superseded por X": muitas delas foram escritas como **relatórios de execução de uma fase**, citando "Spec 0004 — Vaga E", listando mudanças por nome de arquivo — o que as descaracteriza como ADR. **A auditoria definitiva acontece em PR4 (sub-bloco 4.B.4)**, aplicando o critério: (a) reescrever como princípio se ainda fizer sentido; (b) rebaixar para "nota histórica" não-ADR se for relatório de execução; (c) arquivar como decisão superada por outro princípio. As classificações abaixo permanecem como **insumo inicial**, não como decisão.

### 2.1 ADRs existentes em `/adrs/` (estado atual)

| #    | Arquivo                                     | Status declarado | Spec ancorada          | Data       | Tamanho    |
| ---- | ------------------------------------------- | ---------------- | ---------------------- | ---------- | ---------- |
| 0003 | `cobertura-framework.md`                    | Aceito           | (sem ancora explícita) | 2026-04-30 | 43 linhas  |
| 0004 | `governance-single-responsibility.md`       | Aceita           | Spec 0004              | 2026-04-21 | 76 linhas  |
| 0005 | `curadoria-publico-privado.md`              | Aceita           | Spec 0004              | 2026-04-21 | 93 linhas  |
| 0006 | `licenca.md`                                | Aceita           | Spec 0004              | 2026-04-21 | 76 linhas  |
| 0007 | `visibilidade-publica-ai-guidelines.md`     | Aceito           | Spec 0008              | 2026-04-25 | 243 linhas |
| 0008 | `monolithic-runtime-compiler-governance.md` | Aceita           | Spec 0017              | 2026-04-30 | 55 linhas  |
| 0009 | `package-naming-and-registry.md`            | Aceita           | Spec 0020              | 2026-05-07 | 130 linhas |

**Observações estruturais:**

- Numeração começa em 0003 — 0001 e 0002 nunca existiram nesta árvore (provavelmente convenção herdada de um repo anterior — não há referência cruzada que cite 0001/0002).
- README.md curto (21 linhas) descreve o propósito como "ADRs de Prompt Engineering" — vocabulário hoje obsoleto, alinhado à fase inicial pré-PR1.
- Localização canônica: `/adrs/` na raiz. Não há `.core/governance/adrs/` nem `.specify/specs/adrs/` ainda.

### 2.2 Análise por ADR

#### 0003 — Cobertura de Testes e Living Documentation

- **Conteúdo misto:** parte arquitetural sólida (sistema de identificadores `[BR-CLI-*]`, soberania das regras de negócio) + parte tática/operacional (threshold 95%, lista de exceções com números de linha específicos).
- **Status proposto:** ⚠️ **Parcialmente Superseded** — a parte do contrato `[BR-CLI-*]` continua válida e **é insumo direto do PR3** (LivingDocumentation). A parte de threshold + exceções por linha **envelhece mal** (números de linha mudam a cada refactor; código original `baseline-apply.mjs` pode nem existir mais — verificar).
- **Recomendação:**
  - **Curto prazo (PR3):** abrir nova ADR cobrindo "Living Documentation como SSOT de regras de negócio" (esta seria nossa **ADR proposta E ou a evolução natural de A**) que **substitui parcialmente 0003**.
  - **Longo prazo (PR4 cleanup):** mover a parte tática (threshold/exceções) para `.core/process/` como policy operacional, não como ADR. Marcar 0003 como `Superseded by ADR-<n>` no PR4.

#### 0004 — Governance Single Responsibility

- **Conteúdo:** decisão histórica importante sobre eliminação de duplicações da Prime Directive.
- **Status proposto:** ⚠️ **Superseded by 0008** — a arquitetura Monolítica (ADR 0008, abril/2026, dez dias após esta) **absorveu** o problema. Hoje a Prime Directive vive **dentro do bloco monolítico injetado**, não em arquivo separado de regras. A "responsabilidade única" virou propriedade emergente do monolítico.
- **Recomendação:** marcar status como `Superseded by ADR 0008` no PR4 cleanup. Manter como histórico (não deletar — registra o caminho da decisão).

#### 0005 — Curadoria Público/Privado

- **Conteúdo:** decisão estável sobre o que vai público no repositório.
- **Status proposto:** ✅ **Aceita — manter**. Decisão de governança operacional contínua. Estendida por 0007 (que faz cross-ref explícito).

#### 0006 — Licença Apache-2.0

- **Conteúdo:** decisão de licença.
- **Status proposto:** ✅ **Aceita — manter**. Decisão fundacional e estável.

#### 0007 — Visibilidade Pública (fresh repo + snapshot curado)

- **Conteúdo:** decisão sobre estratégia de tornar o repo público.
- **Status proposto:** ✅ **Aceita — manter**. Cross-referenciada em MEMORY do agente; estende 0005.

#### 0008 — Monolithic Runtime Compiler

- **Conteúdo:** decisão arquitetural fundacional sobre injeção monolítica de regras.
- **Status proposto:** ✅ **Aceita — manter**. Fundacional. **Pode ser revisitada parcialmente em PR3** quando o RulesEngine ganhar projeções derivadas — mas o **núcleo da decisão** (governança monolítica para combater "Lost-in-the-Middle") segue válido.

#### 0009 — Package Naming + Registry + Auth

- **Conteúdo:** 3 decisões em um documento (naming `ai-guidelines`, registry público, GitHub App para Action).
- **Status proposto:** ✅ **Aceita — manter**. Estável. Espelhada em memória (`project_npm_orgs.md`).
- **Sub-observação:** três decisões num único arquivo é levemente sub-ótimo (cada uma poderia ser ADR separada), mas custo de churn não justifica reabrir. Aceitar como débito documental sem ação.

### 2.3 Resumo executivo do inventário

| ADR  | Avaliação                  | Ação proposta                                                 | Janela      |
| ---- | -------------------------- | ------------------------------------------------------------- | ----------- |
| 0003 | ⚠️ Parcialmente superseded | Nova ADR sobre Living Docs (PR3) + cleanup parte tática (PR4) | PR3 + PR4   |
| 0004 | ⚠️ Superseded por 0008     | Marcar status `Superseded by ADR 0008`                        | PR4 cleanup |
| 0005 | ✅ Manter                  | Nenhuma                                                       | —           |
| 0006 | ✅ Manter                  | Nenhuma                                                       | —           |
| 0007 | ✅ Manter                  | Nenhuma                                                       | —           |
| 0008 | ✅ Manter                  | Nenhuma                                                       | —           |
| 0009 | ✅ Manter                  | Nenhuma                                                       | —           |

### 2.4 Lar canônico das ADRs

**Estado atual:** `/adrs/` na raiz do repositório. Não há subdiretório por spec, não há `.core/governance/adrs/`.

**Decisão do Arquiteto Líder (registrada nesta sessão):**

- **Durante a Spec 0021:** ADRs novas vivem em `.specify/specs/0021-governance-information-architecture/adrs/` (lar local da spec).
- **Após merge:** promovidas para a raiz global (`/adrs/`) no rito de encerramento.

**Implicação adicional descoberta nesta auditoria:** `/adrs/` na raiz convive estranhamente com `.core/governance/` (que hospeda ARCHITECTURE.md). Vale propor — em PR4 — **consolidar `/adrs/` → `.core/governance/adrs/`** para coerência da arquitetura de informação que a Spec 0021 está estabelecendo. Não fazer agora (escopo PR3 é outro); registrar como cleanup PR4.

### 2.5 Cobertura no plano atual da Spec 0021

Análise do `tasks.md` PR4:

- **4.B.2** prevê "Extrair decisões arquiteturais estáveis para ADRs" — mas focado em **extrair de `spec-foundation.md`**, não em **auditar as ADRs existentes**.
- **4.C.1** prevê "Auditar `/docs` e decidir" — não menciona `/adrs/`.
- **Nenhum item explícito** cobre o cleanup de ADRs existentes ou a consolidação `/adrs/` → `.core/governance/adrs/`.

**Veredito:** plano atual **NÃO cobre** explicitamente o saneamento das ADRs legadas. Precisa receber tasks novas. Proposta no §3.

---

## Parte 3 — Tasks novas a serem adicionadas no `tasks.md`

Proposta de acréscimos no PR4 / sub-bloco 4.B:

### Sub-bloco [4.B] — Foundation vs ADR (fronteira híbrida explícita) — atualizações

Manter 4.B.1, 4.B.2, 4.B.3 e adicionar:

- **4.B.4 [NOVO] Auditoria das ADRs históricas e re-classificação**
  - Re-status ADR 0003 → "Parcialmente superseded by ADR-<new>" após nova ADR de Living Docs (esta ADR nasce em PR3).
  - Re-status ADR 0004 → `Superseded by ADR 0008`.
  - Manter ADRs 0005-0009 como Aceitas. Auditar cross-refs.
- **4.B.5 [NOVO] Consolidar `/adrs/` na arquitetura de informação**
  - Mover `/adrs/*.md` para `.core/governance/adrs/` (alinha com ARCHITECTURE.md vivendo em `.core/governance/`).
  - Atualizar links em `README.md`, `AGENTS.md`, MEMORY do agente, ADRs internas que se referenciam.
  - Pode ser comutativo com 4.B.4 ou atômico junto.
- **4.B.6 [NOVO] Atualizar README das ADRs**
  - O README atual descreve "ADRs de Prompt Engineering (Micro-Decisões)" — vocabulário pré-PR1, obsoleto.
  - Reescrever para refletir a fronteira híbrida (`[DEC-0021-B04]`): ADR como decisão arquitetural estável cross-spec; foundation/process para constituição operacional viva.

Proposta de acréscimo no PR3 / sub-bloco 3.A (preparatório):

- **3.A.0 [NOVO] (Opcional) Renomear `exploration` → `spike`** — se a recomendação MECE for aprovada.
  - Find/replace controlado em `WorkItemKind`, `PILLAR_INVARIANTS`, testes, decision-brief, plan, ARCHITECTURE, ARCHITECTURE-REFERENCE.
  - Atualizar `[DEC-0021-A02]` com ressalva `2026-05-11` similar à existente para "6 vs 7 pilares".
  - Pode ser commit atômico antes ou junto com 3.A.1.

Alternativa: tratar a renomeação como **sub-bloco zero do PR3** (`[3.0] Saneamento taxonômico`), separando claramente do TDD do schema.

---

## Parte 4 — Proposta final de ADRs do PR3 (atualizada)

Após este saneamento, o conjunto de ADRs propostas para PR3 é:

| ID provisório    | Tema                                                                     | Origem                           | Prioridade              |
| ---------------- | ------------------------------------------------------------------------ | -------------------------------- | ----------------------- |
| **ADR-A**        | `coverageState` enum fechado + semântica estável                         | Princípio 1 do research anterior | Alta                    |
| **ADR-B**        | Drift guard com bypass declarativo auditável (sintaxe canônica decidida) | Princípio 3 do research anterior | Alta                    |
| **ADR-C**        | AST-only para extração; custom reporter como evolução pós-PR3            | Princípio 5 + benchmark externo  | Alta                    |
| **ADR-D**        | Validação estrutural cobre semântica de gênero, não estética             | Princípio 7 do research anterior | Média                   |
| **ADR-E [NOVO]** | Taxonomia MECE dos pilares — confirmação e/ou renomeação                 | Este saneamento                  | **Decide ANTES de A–D** |

**Ordem de elaboração proposta:** E primeiro (decide vocabulário usado nos demais), depois A → B → C → D.

**Lar canônico (decidido pelo Arquiteto):** `.specify/specs/0021-governance-information-architecture/adrs/`. Numeração sequencial: `0001-taxonomy-mece-pillars.md`, `0002-coverage-state-enum.md`, `0003-drift-guard-bypass.md`, `0004-ast-only-extraction.md`, `0005-structural-validation.md` (numeração local da spec, não global do repo).

---

## 5. Próximos passos (gate humano antes de prosseguir)

1. **Validação do Arquiteto Líder** sobre:
   - Recomendação MECE: aprovar/rejeitar renomeação `exploration` → `spike`.
   - Inventário das ADRs: aprovar/ajustar os status propostos (parcial-superseded para 0003, superseded para 0004).
   - Acréscimos no `tasks.md` (4.B.4, 4.B.5, 4.B.6 + opcional 3.A.0/[3.0]).
   - Lar canônico e numeração proposta para as 5 ADRs novas.
2. **Após validação:** redigir os 5 rascunhos de ADRs.
3. **Após aprovação dos rascunhos:** iniciar TDD 3.A.

> Esta sessão **não toca código** até que esse alinhamento seja explicitado.

---

## 6. Fontes externas (benchmark 2026)

### Taxonomia de work items

- [What is Spike in Scrum?](https://www.visual-paradigm.com/scrum/what-is-scrum-spike/) — Visual Paradigm
- [Jira Issue Types: A Complete Guide for 2026](https://community.atlassian.com/forums/App-Central-articles/Jira-Issue-Types-A-Complete-Guide-for-2026/ba-p/2928042) — Atlassian Community
- [How to adding Spike as a new issue type and place it in the proper hierarchy level](https://community.atlassian.com/forums/Jira-questions/How-to-adding-Spike-as-a-new-issue-type-and-place-it-in-the/qaq-p/2983825) — Atlassian Community
- [Understanding Jira Issue Types: A Comprehensive Guide](https://planyway.com/blog/jira-issue-types) — Planyway
- [Linear Review 2026: The Issue Tracker That Made Me Quit Jira](https://aitoolbriefing.com/blog/linear-ai-review-2026/) — AI Tool Briefing
- [Linear vs Jira: Why 30% of Teams Switched [2026]](https://tech-insider.org/linear-vs-jira-2026/) — Tech Insider

### Discovery vs Exploration vs Spike (AI-first)

- [Product Discovery with AI](https://www.productboard.com/blog/how-to-do-product-discovery-with-ai/) — Productboard
- [How Product Discovery changes with AI](https://www.proofofconcept.pub/p/how-product-discovery-changes-with) — David Hoang
- [New Era of Product Discovery in an AI-Enabled World](https://agilemania.com/ai-product-discovery) — Agilemania
- [Discovery work for an AI product](https://thoughtbot.com/blog/discovery-work-for-an-ai-product) — Thoughtbot
- [How an AI-enabled software product development life cycle will fuel innovation](https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/how-an-ai-enabled-software-product-development-life-cycle-will-fuel-innovation) — McKinsey
- [Top AI Product Discovery Tools for Enterprises in 2026](https://rootstack.com/en/blog/top-ai-product-discovery-tools-enterprises-2026) — Rootstack

### Shape Up (vocabulário alternativo)

- [Place Your Bets](https://basecamp.com/shapeup/2.3-chapter-09) — Shape Up / Basecamp
- [Bets, Not Backlogs](https://basecamp.com/shapeup/2.1-chapter-07) — Shape Up / Basecamp
- [Shape Up: Stop Running in Circles](https://basecamp.com/shapeup/shape-up.pdf) — Basecamp (livro completo)

### AI Engineering 2026

- [AI Skills to Learn in 2026 for Engineering](https://growthx.club/blog/ai-engineering-skills-2026) — GrowthX
- [10 AI Engineering Principles in 2026](https://www.turingcollege.com/playbooks/ai-engineering-guidebook) — Turing College
- [How agentic AI will reshape engineering workflows in 2026](https://www.cio.com/article/4134741/how-agentic-ai-will-reshape-engineering-workflows-in-2026.html) — CIO
- [A taxonomy of AI experiments](https://www.sciencedirect.com/science/article/pii/S2214804326000170) — ScienceDirect

---

## 7. Resumo executivo (TL;DR para o Arquiteto)

**Taxonomia (Parte 1):** 7 pilares são MECE em semântica. Único problema é o nome `exploration` — colide com vocabulário AI-first 2026. **Recomendo renomeação para `spike`** (vocabulário Agile/XP canônico, zero colisão, custo baixo). Os outros 6 nomes ficam.

**ADRs legadas (Parte 2):** das 7 ADRs em `/adrs/`, **5 ficam intocadas**, **0004 vira Superseded por 0008**, **0003 vira parcialmente superseded** pela nova ADR de Living Docs que nasce no PR3.

**Plano (Parte 3):** atual `tasks.md` **não cobre** auditoria de ADRs. Proponho **4.B.4 + 4.B.5 + 4.B.6** no PR4 + sub-bloco opcional `[3.0]` no PR3 se a renomeação for aprovada.

**ADRs novas do PR3 (Parte 4):** sobe de 4 para 5 com a ADR-E (Taxonomia). Lar: `.specify/specs/0021-governance-information-architecture/adrs/`. Numeração local 0001-0005.

**Status:** aguardando aprovação do Arquiteto Líder antes de redigir os 5 rascunhos.
