# Research: Práticas validadas de Living Documentation, Discovery Técnico e Composição de Templates — destilação interna + benchmark AI-first 2025-2026

**Data:** 2026-05-11
**Domínio:** Engine de Documentação Viva e Composição de Templates (PR3 da Spec 0021)
**Relacionado a:** Spec 0021 (`governance-information-architecture`), sub-blocos 3.A → 3.F
**Status:** Insumo de Stage 2 — alimenta as ADRs do PR3 (próximo passo) antes da implementação TDD do sub-bloco 3.A.

---

## 0. Por que este research existe

A Fase 3 do PR2-PR3 entra em terreno onde a arquitetura já está definida (ARCHITECTURE.md §1.3 reserva `LivingDocumentation` e `TemplateEngine` como bounded contexts), mas as decisões finas — schema do artefato, política de versioning, mecânica do drift guard, contrato de partials/recipes — ainda não foram fechadas em ADR. Em vez de cravar essas decisões direto no código, esta sessão consolida:

1. **Princípios operacionais já validados** dentro do círculo de experiência da owner (tradição de engineering de experimentação em escala — squads que rodaram dezenas de testes A/B, feature flags faseados, shape-up/clean-up disciplinados). Esses princípios entram como **regras genéricas**; nenhuma referência a empresas, ferramentas internas ou pessoas específicas é trazida.
2. **Benchmark externo 2025-2026** sobre Spec-Driven Development, Living Documentation com IA, trunk-based development com feature flags, drift detection em CI/CD, sizing de PRs, e composição de templates determinísticos. O insumo interno tem mais de um ano e foi escrito antes da maturação de SDD AI-first em 2025; precisa ser cruzado com prática atual.
3. **Mapeamento direto** de cada princípio para os sub-blocos `[3.A]` a `[3.F]` do `tasks.md`, com critério de aceite proposto. Saída esperada: ADR(s) curtas e implementação TDD sem reabrir discussão de design no meio.

> **Não-objetivo:** isto não é um manual operacional, nem reabre decisões já fechadas em `decision-brief.md` (`[DEC-0021-*]`). É insumo de design para PR3.

---

## 1. Princípios operacionais destilados (visão de engenharia de experimentação)

Sete princípios extraídos da observação direta de squads maduras em produto com tração e ciclo curto. Cada um traz **motivação**, **evidência externa** que o reforça em 2025-2026, e **aplicação concreta** ao PR3.

### 1.1 Outcome explícito é cidadão de primeira classe

**Motivação interna.** Times maduros de experimentação não tratam o estado de um experimento como atributo "derivado" — `won`, `lost`, `inconclusive` (mais `shape-up` ou `clean-up` como continuação) são valores nomeados, registrados em campo dedicado, e governam o próximo passo do fluxo (sistematizar vs. limpar). Quando o estado vira inferência ("se a métrica passou de X, então…"), o sistema acumula casos-borda que ninguém quer revisitar.

**Evidência externa.** Plataformas modernas de experimentação (LaunchDarkly, Unleash, Statsig, ConfigCat) modelam outcomes como enums explícitos persistidos, separados de métricas brutas. Trunk-based development com feature flags depende de outcomes legíveis para tomada de decisão de rollout (cf. trunk-based.com).

**Aplicação no PR3.**

- `coverageState` (3.A.1) é o equivalente direto desse contrato. Deve ser **enum fechado** (`covered | pending | deprecated`), não string livre. Schema falha se outro valor aparecer.
- Mensagem de erro do schema-guard precisa nomear o enum permitido — usuário (humano ou IA) que escreveu um teste e está só esperando ver `pending` precisa receber a forma certa.
- Em paralelo: já há precedente no domínio — `WorkItemKind` é discriminated union; `ResolutionMode` é enum. Manter coerência semântica.

### 1.2 Monitoramento é uma tarefa explícita, não side-effect de outra coisa

**Motivação interna.** No fluxo maduro, "monitoramento pós-deploy" é um card próprio no board — não algo que acontece "naturalmente" como subproduto de uma feature. Sem essa separação, monitoria vira sub-tarefa esquecida e dores chegam só pelo cliente.

**Evidência externa.** A pesquisa "How a Traceability Matrix Fits into Modern CI/CD Workflows" (Medium, fev/2026) reforça: sem job dedicado de verificação, pipelines ficam "rápidos mas frágeis". Drift detection em IaC (Spacelift, HashiCorp Well-Architected, env0) é unanimemente posicionado como **job de CI separado**, executando após deploys ou em janelas dedicadas. 86% das organizações relatam drift como desafio operacional crítico (HashiCorp State of Cloud Strategy 2025-2026).

**Aplicação no PR3.**

- Sub-bloco 3.C define `yarn living-docs:generate` (local, escreve o artefato) e `yarn living-docs:check` (CI, falha se commit divergir da geração). **Manter dois comandos**, mesmo que o segundo seja basicamente "generate + diff".
- O `check` precisa de exit code não-zero deterministico em divergência. Output em modo "diff legível" para revisor humano (não só "files differ").
- Adicionar job dedicado no CI workflow (ex.: `.github/workflows/living-docs.yml` ou job dentro do CI principal) com nome explícito, não escondido em pipeline genérico. O CI precisa **dizer o que falhou** quando falhar.

### 1.3 Kill switch auditável é parte do contrato, não exceção

**Motivação interna.** Toda intervenção crítica em produção tem mecanismo de desligamento rápido — feature flag, rollback de release, força para controle, switch administrativo. Sem isso, qualquer correção urgente vira incidente prolongado.

**Evidência externa.** LaunchDarkly e Unleash documentam feature flags como **kill switches by design** — não como conveniência. Best practices recomendam que toda nova feature em produção tenha flag desligável, com auditoria de quem desligou e por quê (cf. "Feature Flags 101", LaunchDarkly Blog).

**Aplicação no PR3.**

- O drift guard (3.C) **precisa de mecanismo declarativo de bypass auditável**. Proposta: comentário-instrução em código `// living-docs:allow-drift [reason] @<DEC-XXXX> until=<date>` que o extrator reconhece e registra na saída como "drift conhecido", sem falhar o CI. Sem `until`, drift falha. Sem `@<DEC-...>`, drift falha. Sem mecanismo, qualquer fix urgente vira refém.
- Cada uso de bypass deve aparecer no artefato gerado como entrada de primeira classe (`coverageState: deprecated`, com motivo). Não é "hidden flag" — é **drift autorizado e registrado**.
- Critério: o bypass não pode ser silencioso. Se passou pelo bypass, está visível no artefato e no PR review.

### 1.4 PRs pequenos não são preferência estética — são proteção operacional

**Motivação interna.** A cultura interna estudada já operava com regra prática de "um card = um PR" e PRs ~50 linhas (25-100 aceitável). Não por dogma; porque sistemas que dependem de feature flags + monitoramento por experimento exigem **mudanças isoladas, reversíveis e auditáveis**.

**Evidência externa (2025-2026).** Estudos com centenas de milhares de PRs convergem:

- PRs <200 LOC aprovados 3× mais rápido que PRs grandes (Velocity by Code Climate; Engineering Manager Tools).
- PRs 200-400 LOC têm 40% menos defeitos detectados que PRs grandes; PRs >1000 LOC têm 70% menos defeitos detectados (Propel Code; GitClear).
- Times que ignoram esse padrão queimam 20-40% da velocidade em revisões lentas (LeadDev).
- Google recomenda <200 LOC; bom limite operacional é <400 LOC.

**Aplicação no PR3.**

- Sub-bloco 3.A já está quebrado em 3 unidades (schema/determinism/versioning). Cada uma tende a fechar em <200 LOC se TDD for estrito. Manter como **commits separados** dentro do PR3 — `feat(spec-0021): living docs schema v0`, `feat(spec-0021): living docs determinism`, etc. — para que o revisor possa fazer review incremental.
- 3.B (AST extractor) é o sub-bloco mais pesado. Quebrar em: (i) parse + descoberta de IDs; (ii) source mapping; (iii) filtro de false positives. Cada commit ≤200 LOC.
- Estratégia geral: o `tasks.md` já segrega commits atômicos por sub-bloco; reforçar disciplina de não bundlar.

### 1.5 Distinguir regras fixas de regras flexíveis evita invalidar resultado

**Motivação interna.** Na modelagem de experimentos, há separação rígida entre `experiment_conditions` (regras de segmentação fixas — não podem mudar com estado do usuário, senão grupos contaminam) e `can_see_the_experiment` (regras flexíveis — podem reagir a estado). Misturar invalidou experimentos no passado, gerou dados ruins para análise, custou ciclos.

**Evidência externa.** Specification by Example (BDD moderno, 2026) reforça princípio análogo: separar **invariantes do contrato** (Given fixos) de **modulações de comportamento** (When/Then variáveis). Em SDD AI-first, especificações que misturam os dois geram contexto ambíguo para LLM e produzem outputs inconsistentes (cf. Thoughtworks, "Spec-driven development", 2025; Wasowski, "BDD as the Missing Link", abr/2026).

**Aplicação no PR3.**

- 3.B.3 ("Avoid false positives") já reconhece o problema. Mas precisa de **regra precisa de extração**: IDs `[BR-CLI-*]` só são "covered" se aparecerem como argumento de `it(...)` ou `test(...)` em arquivo `.test.ts` **ativo** (não `.skip`, não fixture, não comment, não string em código de produção).
- Distinguir três classes: **fixos do contrato** (IDs em testes ativos = covered), **flexíveis** (IDs em testes skip = pending), **irrelevantes** (IDs em comentários/fixtures = out-of-extraction). A terceira classe não deve aparecer no artefato.
- Implementação: TypeScript Compiler API consegue narrow por `CallExpression.expression.escapedText === 'it' || 'test' || 'describe'`, e por arquivo `.test.ts` no resolver de fontes. ts-morph (dsherret/ts-morph) é wrapper recomendado.

### 1.6 Hand-off documentado é interface, não cortesia

**Motivação interna.** Quando um shape-up acontece em time diferente do que rodou o experimento, o hand-off precisa ser **artefato versionado e completo**, não conversa síncrona. Senão, time receptor reabre todo o discovery e perde semanas.

**Evidência externa.** O conceito casa diretamente com "Spec as Contract" da literatura SDD 2025-2026 (Thoughtworks; evoailabs SDD; arxiv 2602.00180). Em times AI-first, hand-off entre humano e LLM exige spec executável (BDD scenarios, schemas tipados) — diferente do hand-off informal entre humanos, onde lacunas podem ser preenchidas conversando.

**Aplicação no PR3.**

- O artefato `living-docs.yml` **é** o hand-off do framework para o consumidor: "estas são as regras que estamos garantindo, com cobertura, fonte, e estado". Schema (3.A.1) precisa ser legível por humano não-técnico (mantenedor de outro projeto, líder de produto) **e** parseável por agente IA (Claude lendo o repo).
- Critério: cada entrada do artefato deve responder a 4 perguntas: **O que** garante (`title`/`summary`); **Onde** mora (`source`); **Em que estado** está (`coverageState`); **Por que** existe (`tags` ou `boundedContext` ou link para `[DEC-...]`).
- Reservas de `.governance/handoff/` (declaradas em 2.D) eventualmente vão receber artefatos derivados; living-docs é o primeiro caso real.

### 1.7 Composição atômica > redundância copiada

**Motivação interna.** Em times com vários experimentos rodando em paralelo, qualquer "lógica copiada entre lugares" (classes de XP, validações de elegibilidade, instrumentação de eventos) vira passivo: alterar a regra exige editar N arquivos, e drift é certo. A solução madura é abstrações leves e composição (helpers, services, hooks compartilhados).

**Evidência externa.**

- Em geração de documentação como código, Pandoc Partials, Assemble, Marc (bredele/marc) e Markdown Styles documentam o padrão: **partial = unidade reusável e completa**, recipe = ordem canônica de slots. Mais robusto que template monolítico com condicionais.
- markdownlint enforça convenções determinísticas, reduzindo drift estilístico.

**Aplicação no PR3 — TemplateEngine (3.D, 3.E, 3.F).**

- Schema de Recipe (3.D.1) deve declarar: `artifactKind`, `workflowType`, `language`, `slots[]` (ordem canônica), `partials[]` por slot. Não permitir condicionais aninhadas dentro de partial — toda variação vira nova partial.
- Cada partial é Markdown válido **e autocontido** (3.D.2) — pode ser inspecionado e testado isoladamente. Sem dependências implícitas de outros partials.
- Validação estrutural por `artifactKind` (3.E) checa **invariantes semânticas** (headings obrigatórios presentes, ordem das seções, blocos mandatórios como Harness Lock em tasks), não estética/formatação. Quem checa estética é markdownlint, opcionalmente. Quem checa **semântica do gênero documental** é o validator.

---

## 2. Benchmark externo 2025-2026 — visão consolidada

### 2.1 Spec-Driven Development como prática emergente em AI-first

O ecossistema 2025-2026 convergiu em SDD (Spec-Driven Development) como complemento natural ao BDD/Specification by Example. Diferenças relevantes para o PR3:

- **BDD clássico** (Cucumber, Given-When-Then, "living documentation" via Relish/Cucumber Reports): ainda válido, ainda usado, mas otimizado para teste de aceitação de feature, não para descrição de regras de framework. Output legível para PO, mas com overhead alto para regras técnicas.
- **SDD em 2026**: spec é **contrato executável** consumido tanto por humano quanto por LLM, com forma estruturada (YAML/JSON com schema), gerada/mantida com assistência IA. Few-shot examples viram parte do contrato. (Refs: Thoughtworks, "Spec-driven development"; evoailabs SDD; arxiv 2602.00180; Wasowski, abr/2026).

**Implicação para living-docs.yml.** O artefato gerado pelo PR3 é mais **SDD-shaped** do que BDD-shaped — não é "scenario humano em Given-When-Then", é "registro tipado das regras de negócio extraídas dos testes". Schema YAML/JSON com `schemaVersion` é a forma correta. Não tentar emular Cucumber.

### 2.2 Trunk-based development + feature flags como pano de fundo

A convergência 2025-2026 é clara: trunk-based + feature flags + small PRs é o tripé operacional default para times que entregam contínuo (refs: trunkbaseddevelopment.com; LaunchDarkly; Unleash; Harness Developer Hub; Flagsmith; DevCycle).

**Implicação para o PR3.** O framework ai-guidelines não tem feature flags runtime hoje (não há cliente final por trás). Mas o **drift guard kill switch (§1.3)** é a versão correspondente do mecanismo: bypass auditável quando precisamos commitar antes de regenerar o artefato. Sem isso, drift guard vira freio.

### 2.3 Drift detection: lições do IaC para living docs

A maturidade da indústria em drift detection cresceu em torno de IaC (Terraform state vs. real infra). Os padrões transferíveis:

1. **Roda como job CI separado**, não embutido em outro pipeline (Spacelift; HashiCorp Well-Architected; env0).
2. **Idempotente e determinístico** — mesmo input gera mesmo output byte-a-byte (Cloudoptimo; harness.io).
3. **Exit code estável e mensagem útil** — distinção entre "drift autorizado" (ok) e "drift não-autorizado" (fail).
4. **Auditoria por commit** — cada alteração no artefato versionado tem owner, motivo, data (Cycode; yrkan.com).

Os 4 critérios mapeiam 1-para-1 nos contratos de 3.A.3 (determinismo), 3.C.1 (definição formal de drift), 3.C.2 (mecanismo de falha), 3.C.4 (integração CI obrigatória).

### 2.4 TypeScript Compiler API + custom reporters Jest

Para 3.B (AST extractor), o terreno é estável:

- **ts-morph** (dsherret/ts-morph) é wrapper canônico sobre TS Compiler API com ergonomia melhor que API raw. Recomendado para parse/walk.
- **TypeScript Compiler API raw** (microsoft/TypeScript wiki) também viável e mais leve em dependências.
- **Custom reporter Jest** (jestjs.io/docs/configuration; Chanon Roy, Medium) é caminho alternativo: o reporter recebe estado dos testes em runtime, pode emitir artefato durante a execução. Vantagem: cobre o que **realmente roda** (covered ≠ skip).

**Trade-off para a Spec 0021.**

- **AST-only** (decisão atual em 3.B.1): determinismo total — mesmo input estático gera mesma saída, sem dependência do run de teste. Cobertura semântica = "teste existe e está ativo".
- **Custom reporter** (alternativa): cobertura real = "teste passou ou falhou na última execução". Mais informativo, mas acopla artefato ao resultado de run, perde determinismo puro.
- **Híbrido** (futuro?): AST gera schema + IDs + estado declarado; reporter atualiza um campo opcional `lastRunStatus`. Não implementar agora — registrar como evolução em §6.

Recomendação: **AST-only para 3.B**, custom reporter como evolução pós-PR3 se necessário. ADR registra a escolha.

### 2.5 Composição de templates: estado da arte

Tools como Pandoc Partials, Assemble, Marc, Markdown Styles consolidaram o padrão **recipes-and-partials**:

- Recipe = ordem canônica de slots por tipo de artefato.
- Partial = Markdown válido completo, indexável por slot.
- Engine = orquestra resolução, monta, valida estrutura.

Esse é o desenho exato decidido em `[DEC-0021-D01]`. O benchmark valida a direção.

**Detalhe operacional descoberto na pesquisa.** Marc (bredele/marc) trata Markdown como **template dinâmico atualizável**, com partials como includes + filtros. Não vamos usar Marc (peso de dependência, integração com nosso engine TS), mas o **padrão de filtros opcionais por slot** é interessante para casos onde uma recipe precisa transformar levemente um partial antes de inserir (ex.: ajustar nível de heading). Registrar como sub-débito de 3.D se aparecer.

---

## 3. Síntese — decisões propostas para ADRs do PR3

Sete princípios → quatro ADRs candidatas. Decisão de quantas e quais ADRs efetivar fica na próxima fase (gate com o usuário). Proposta inicial:

### ADR proposta A — `coverageState` é enum fechado com semântica estável

**Decisão.** `coverageState ∈ {covered, pending, deprecated}`, fechada. Mensagens de erro nomeiam o enum.
**Motivação.** Outcomes explícitos (§1.1).
**Anti-objetivo.** Não permitir `coverageState: in-progress` ou outros valores derivados.

### ADR proposta B — Drift guard tem bypass declarativo auditável

**Decisão.** Suportar diretiva `// living-docs:allow-drift @<DEC-XXXX> until=YYYY-MM-DD reason="..."` reconhecida pelo extrator. Sem `@<DEC>` e `until`, falha. Cada bypass vira entrada `coverageState: deprecated` no artefato com `expiresAt`.
**Motivação.** Kill switch auditável (§1.3) — fix urgente sem reabertura de CI.
**Anti-objetivo.** Não criar bypass silencioso, não criar bypass sem prazo, não permitir bypass sem ADR de referência.

### ADR proposta C — AST-only para extraction; custom reporter fica para evolução

**Decisão.** RuleExtractor (3.B) usa apenas análise estática via TypeScript Compiler API / ts-morph. `coverageState=covered` significa "teste ativo presente no AST", não "teste passou no último run".
**Motivação.** Determinismo (§2.4 trade-off); separar SSOT (código + AST) de telemetria (run results).
**Evolução.** Telemetria de run via custom reporter pode chegar pós-PR3 em campo opcional, sem quebrar consumers.

### ADR proposta D — Validação estrutural cobre semântica de gênero, não estética

**Decisão.** MarkdownStructuralValidation (3.E) valida invariantes por `artifactKind` (headings obrigatórios, ordem das seções, blocos mandatórios), não estilo/formatação. markdownlint fica opcional/separado se entrar.
**Motivação.** Composição atômica (§1.7) precisa enforcer semântico, não estético. Confundir leva a regras frágeis (espaços, blank lines) que mais quebram pipelines do que protegem.
**Anti-objetivo.** Não validar "uso de bullet vs. numbered list" como invariante.

---

## 4. Anti-objetivos do PR3 (limites de escopo)

Para evitar overengineering:

1. **Não construir framework de migração v0→v1 do schema** (3.A.2). Definir **política**: schemaVersion no header + commit de não-breaking-change explícito. Implementar migration utility só quando v1 existir.
2. **Não tentar emular Cucumber/Gherkin**. O artefato é SDD-shaped (YAML estruturado), não BDD-narrativo.
3. **Não acoplar artefato a run results de teste agora**. AST-only no PR3; telemetria fica para evolução pós-PR3.
4. **Não criar UI/dashboard agora**. `[DEC-0021-B01]` explicitamente reserva Fases 4-5 (DB/dashboard) como **fora do escopo desta spec**.
5. **Não criar feature flag runtime no framework**. Não há cliente final por trás; o kill switch é o bypass declarativo do drift guard, não rollout faseado.
6. **Não migrar boundary enforcement de regex para AST como parte do 3.B**. ARCHITECTURE.md §4 já marca essa migração como "natural junto com pipeline AST do LivingDocumentation"; pode ser sub-débito separado dentro de 3.B se sobrar tempo, mas não bloqueia.
7. **Não migrar builder mjs para TS no PR3**. NEXT.md já registra como débito 2.C.1: "manter mjs como SSOT até PR3". A transição pode ser sub-débito separado quando 3.B começar; não bloqueia o PR3.

---

## 5. Riscos antecipados (vigilância)

| #   | Risco                                                                                                   | Mitigação                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **False positives no extractor** — IDs `[BR-CLI-*]` em comentários ou fixtures viram entradas espúrias. | Filtro estrito por `CallExpression` + arquivo `.test.ts` (§1.5 + §2.4). Teste `RuleExtractorFalsePositives.test.ts` (3.B.6) precisa cobrir 3 cenários: ID em comentário, ID em string literal de produção, ID em arquivo `.fixture.ts`.                   |
| 2   | **Drift guard vira freio** se rodada sem bypass auditável.                                              | ADR B (§3) — bypass declarativo com prazo e referência a ADR.                                                                                                                                                                                             |
| 3   | **Schema v0 vira gargalo** se decidir tudo agora "para nunca mais mexer".                               | Política de versioning conservadora (ADR não-criada agora, registrada como anti-objetivo §4.1). Aceitar que v0 vai mudar; provar pelo build do PR3 que consumidores tolerem mudança.                                                                      |
| 4   | **Custom reporter como tentação** durante implementação.                                                | ADR C (§3) trava decisão de AST-only. Se aparecer pressão para reporter, abrir ADR de evolução depois, não no PR3.                                                                                                                                        |
| 5   | **Partial soup** — TemplateEngine acumula 50 partials sem governança.                                   | Limitar inicialmente a partials para tipos de spec já existentes (`evidence-driven`, `mixed`, `direct`). Não permitir partials "soltas". Validação `PartialsContract.test.ts` (3.D.5) checa cada partial declarada está em uso por pelo menos uma recipe. |
| 6   | **Mirror removido cedo demais** (3.F).                                                                  | 3.F.1 explicita "equivalência mínima validada antes de remover". Manter mirror em paralelo durante uma janela; só virar chave após snapshot regression test passar (3.F.2).                                                                               |

---

## 6. Insumo para o próximo passo (ADRs + TDD)

**Fluxo proposto:**

1. **Apresentar este research ao usuário** (gate humano). Capturar feedback sobre princípios, mapeamento, anti-objetivos.
2. **Redigir ADRs** (A-D propostas no §3) em `.specify/specs/specs/adrs/` ou `.specify/specs/0021-governance-information-architecture/adrs/` — escolha de path por convenção do repo (precisa checar — não há ADRs sob 0021 ainda).
3. **Começar TDD 3.A** — escrever `LivingDocsSchema.test.ts`, `LivingDocsDeterminism.test.ts`, `LivingDocsVersioning.test.ts` em RED, implementar tipos puros em `src/domain/living-docs/`, commit atômico após GREEN.

**Sequência de sub-blocos no PR3** (conforme `tasks.md` mantido):
3.A → 3.B → 3.C → 3.D → 3.E → 3.F → encerramento.

Cada sub-bloco encerra com `[DEBT-REVIEW]` e `[ARCHITECTURE]` por contrato do `[SUB-MGMT.MANDATORY]`. Esta sequência **não muda** — apenas ganha base ADR explícita antes do código.

---

## 7. Fontes externas (benchmark 2025-2026)

### Spec-Driven Development / Living Documentation com IA

- [Spec-driven development: Unpacking one of 2025's key new AI-assisted engineering practices](https://www.thoughtworks.com/en-us/insights/blog/agile-engineering-practices/spec-driven-development-unpacking-2025-new-engineering-practices) — Thoughtworks
- [Behavior-driven development (BDD): an essential guide for 2026](https://monday.com/blog/rnd/behavior-driven-development/) — monday.com
- [Specification-Driven Development (SDD)](https://evoailabs.medium.com/specification-driven-development-sdd-66a14368f9d6) — evoailabs (Medium)
- [Spec-Driven Development: From Code to Contract in the Age of AI Coding](https://arxiv.org/pdf/2602.00180) — arXiv preprint
- [AI SDD in 2026. How Spec-Driven Development Is Making AI Coding More Reliable](https://medium.com/@ioneswalter/ai-sdd-in-2026-bdbe69f2eb04) — Iones Walter (Medium)
- [SDD Writing Specifications for AI: BDD as the Missing Link](https://medium.com/@wasowski.jarek/sdd-writing-specifications-for-ai-bdd-as-the-missing-link-spec-driven-development-ad1b540b7f75) — Wasowski (Medium, abr/2026)
- [Using Specification by Example to Drive AI](https://urgo.medium.com/using-specification-by-example-to-drive-ai-95c19f0bb4ec) — Ürgo Ringo (Medium)
- [Living Documentation in the BDD with Relish](https://shashikantjagtap.net/living-documentation-in-the-bdd-with-relish/) — Superagentic AI Blog

### Trunk-based development + Feature flags + Experimentação

- [Feature flags — Trunk Based Development](https://trunkbaseddevelopment.com/feature-flags/) — trunkbaseddevelopment.com
- [Feature Flags 101: Use Cases, Benefits, and Best Practices](https://launchdarkly.com/blog/what-are-feature-flags/) — LaunchDarkly
- [Implement trunk-based development using feature flags](https://docs.getunleash.io/guides/trunk-based-development) — Unleash
- [Use Feature Flags for trunk-based development](https://developer.harness.io/docs/feature-flags/get-started/trunk-based-development/) — Harness Developer Hub
- [How to Use Feature Flags for Trunk-Based Development](https://www.flagsmith.com/blog/trunk-based-development-feature-flags) — Flagsmith
- [Using Feature Flags to Enhance Trunk-Based Development in 2025](https://www.featbit.co/articles2025/trunk-based-development-feature-flags-2025) — FeatBit
- [Trunk-based Development](https://www.atlassian.com/continuous-delivery/continuous-integration/trunk-based-development) — Atlassian

### Drift detection / Traceability em CI/CD

- [Infrastructure Drift Detection](https://spacelift.io/blog/drift-detection) — Spacelift
- [How a Traceability Matrix Fits into Modern CI/CD Workflows](https://medium.com/@sancharini.panda/how-a-traceability-matrix-fits-into-modern-ci-cd-workflows-714c5a6862af) — Sancharini Panda (Medium, fev/2026)
- [Automatically detect resource drift and health](https://developer.hashicorp.com/well-architected-framework/optimize-systems/monitor-system-health/detect-configuration-drift) — HashiCorp Well-Architected
- [Drift Detection in IaC: Prevent Your Infrastructure from Breaking](https://www.env0.com/blog/drift-detection-in-iac-prevent-your-infrastructure-from-breaking) — env0
- [Drift Detection in Infrastructure: Complete Guide to IaC State Management](https://yrkan.com/blog/drift-detection-in-infrastructure/) — Yuri Kan

### PR sizing (estudos quantitativos)

- [Pull Request Size — Velocity by Code Climate](https://docs.velocity.codeclimate.com/en/articles/2913568-pull-request-size) — Code Climate
- [How Teams Can Speed Up GitHub PR Reviews in 2026](https://www.codeant.ai/blogs/github-code-reviews) — CodeAnt AI
- [Pull Request Size: The Metric That Improves All Others](https://www.em-tools.io/engineering-metrics/pull-request-size) — Engineering Manager Tools
- [The Impact of PR Size on Code Review Quality: What Data Tells Us](https://www.propelcode.ai/blog/pr-size-impact-code-review-quality-data-study) — Propel Code
- [30% Less is More: Code Review Strategies That Cut Pull Request Size](https://www.gitclear.com/research_studies/pull_request_diff_methods_comparison_faster_review) — GitClear
- [Why elite dev teams focus on pull-request metrics](https://leaddev.com/reporting/why-elite-dev-teams-focus-pull-request-metrics) — LeadDev

### AST + Jest tooling

- [Using the Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API) — microsoft/TypeScript Wiki
- [ts-morph: TypeScript Compiler API wrapper for static analysis](https://github.com/dsherret/ts-morph) — dsherret
- [Getting Started With Handling TypeScript ASTs](https://www.jameslmilner.com/posts/ts-ast-and-ts-morph-intro/) — James L Milner
- [How to setup a custom test reporter for Jest](https://chanonroy.medium.com/how-to-setup-a-custom-test-reporter-for-jest-f994636073a9) — Chanon Roy (Medium)
- [Configuring Jest — reporters](https://jestjs.io/docs/configuration) — Jest docs

### Template composition / Markdown deterministic

- [Marc — Markdown as a dynamic template engine](https://github.com/bredele/marc) — bredele/marc
- [Pandoc Partials](https://rsdoiel.github.io/blog/2020/11/09/Pandoc-Partials.html) — R. S. Doiel
- [Assemble — Markdown / Partials](https://assemble.io/docs/Markdown.html) — assemble.io
- [Markdown Docs — Create a Custom Template](https://gi60s.github.io/markdown-docs/templates/custom) — Markdown Docs

---

## 8. Resumo executivo (para revisor pressionado)

**O que este research entrega.** Sete princípios operacionais destilados, mapeados a sub-blocos `[3.A]`-`[3.F]`, validados por benchmark externo 2025-2026, com quatro ADRs propostas e seis riscos catalogados.

**Decisão de design mais carregada.** ADR B (drift guard com bypass declarativo auditável) — sem isso, qualquer correção urgente vira refém do CI. Este é o único princípio que **não era explícito** no `decision-brief.md` original e merece ADR formal.

**Decisões "automáticas".** ADRs A/C/D consolidam contratos já implícitos em `tasks.md` em forma escrita, para que TDD do PR3 não reabra discussões.

**Anti-objetivos críticos.** §4 — não construir migration framework agora; não emular Cucumber; AST-only; sem UI/dashboard.

**Próximo gate humano.** Revisar princípios, mapeamento, ADRs propostas. Após aprovação, redigir ADRs e iniciar TDD 3.A.
