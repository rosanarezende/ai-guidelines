# Framing — checkpoint co-enforcement (CO-3 / seq 9 / PR #42)

> **Data:** 2026-06-13 · **Nó:** `co-enforcement` (seq 9, CO-3) · **PR:** #42 (Draft, stacked sobre #41) · **HEAD na investigação:** `703d72f`
> **Status:** investigação/enquadramento — **sem implementação**. Etapa **Claude** do fluxo de checkpoint estrutural (Claude→Codex→ChatGPT→owner).
> **Autorização:** Human Gate do #41 (`gates/c-co-projection.yml`, 2026-06-12).
> **Escopo deste documento:** consolidar as decisões arquiteturais abertas antes de tocar código. NÃO altera `state.yml`/`tasks.md`/código funcional/body do PR.

---

## 0. Mandato e restrições

Investigar e propor (não implementar): inventário do motor TS; mapa do substrato legacy + consumidores; modelo do grafo + placement do binding sem nova SSOT; schema mínimo de `EnforcementBinding`; quatro sub-checkpoints com critérios de saída/falsificação; 1–2 comandos mutantes para dogfood do recibo.

**Inclinações cravadas pela owner (orientam, não reabrem):**

- **D1.** `Constraint` **não** é entidade nova: é o **colapso canônico** de `rule | guardrail`, com a origem virando **metadado** e **compatibilidade de leitura** para artefatos antigos.
- **D2.** `EnforcementBinding` é **dado mínimo declarado** (escolher a superfície é decisão humana). Existência da superfície, paridade com a implementação, sincronização e artefatos runtime são **projeções/verificações derivadas**.
- **D3.** `knowledge:compile` **reutiliza e orquestra** o compilador TS existente — não cria outro motor. Investigar o destino de `build:rules` (alvo interno / alias compatível / subcomando).
- **D4.** A migração plena do substrato legacy **pertence ao CO-3**, em **sub-checkpoint próprio** dentro do PR #42.
- **D5.** O recibo é conectado **minimamente** no CO-3, **advisory-first**, em **1–2 comandos mutantes** escolhidos por risco. O dispatcher amplo permanece no CO-6.

---

## 1. Inventário factual

### 1.1 Motor de regras em TypeScript (`src/`) — o alvo de reuso

| Componente                                               | Entradas                                                         | Saídas                                                                        | Contrato / side effects                                                   | Testes                                                |
| :------------------------------------------------------- | :--------------------------------------------------------------- | :---------------------------------------------------------------------------- | :------------------------------------------------------------------------ | :---------------------------------------------------- |
| `RulesEngine` (`app/services/RulesEngine.ts`)            | `RulesCatalogSource` (porta)                                     | `RulesCatalogJson` / `BuiltCatalog` / markdown / lookups                      | **Puro**, app-layer; 4 pipelines (parse/build/projection/lookup); sem I/O | `RulesProjection.test.ts`, `RulesCompilation.test.ts` |
| `RulesCatalogBuilder.buildRulesCatalog` (`app/services`) | `RulesMarkdownSource` + `{baseDir, generatedAt, tags?, scopes?}` | `{catalogJson, ledgerMarkdown, humanCatalogMarkdown}` + `validateBuildOutput` | Determinístico; valida ids únicos + coerência `by_scope`/`by_feature`     | `RulesCatalogBuilder.test.ts`                         |
| `RulesRuntimeCompiler` (`app/services`)                  | `RulesCatalogJson` + `{includeAdapters, optInFeatures, lang}`    | `compileAdapterRulesByName` / `formatRuleInstruction` / `filterRulesByScope`  | **Puro**; é o **port TS do `compileRulesContent` legacy**                 | `RulesRuntimeCompiler.test.ts`                        |
| `AgentsRuntimeBootstrap` (`app/services`)                | stub args + conteúdo AGENTS existente                            | `<AI_GUIDELINES>` stub + merge idempotente                                    | **Puro**; valida bloco único/bem-formado; **é o stub vivo** do AGENTS.md  | `AgentsRuntimeBootstrap.test.ts`                      |
| `src/cli/buildRules.ts` (`build:rules`)                  | `repoRoot`                                                       | escreve `rules.json` + `catalog.md` + ledger                                  | **I/O** (composition root); delega ao Builder                             | `buildRules.test.ts`                                  |
| AST: `TypeScriptRuleExtractor` (`infrastructure/ast`)    | fontes TS                                                        | regras extraídas                                                              | base do `ruleset:check` (producibilidade)                                 | vários `infrastructure/ast/*.test.ts`                 |

**Achado-chave (D3):** o caminho **vivo** de compilação de regras já é TS. `pointers.mjs` (provider entrypoints) importa **dinamicamente** `dist/app/services/RulesRuntimeCompiler.js` e chama `compileAdapterRulesByName` (`cli/features/core/pointers.mjs:17-34`). Ou seja, **o `RulesRuntimeCompiler` TS é o compilador de adapter-rules de produção** — o `compileRulesContent` do monólito é cópia legada **morta**. `knowledge:compile` orquestra **estes** componentes; não há motor novo a construir.

### 1.2 Substrato legacy (`cli/governance/monolith/`) + grafo exato de consumidores

Contagem de importadores **não-teste** (medida no HEAD `703d72f`):

| Módulo              | Importadores vivos (não-teste)                                     | Símbolo realmente consumido                               | Veredito                                                                                                                                                                                  |
| :------------------ | :----------------------------------------------------------------- | :-------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compiler.mjs`      | `governance/index.mjs` (barrel), `features/core/budget-report.mjs` | só `loadRulesCatalog` (em budget-report)                  | re-export do barrel é **morto** (engine.mjs só usa `agents-merge`); `compile*`/`groupUniversal*`/`buildAgentsRuntimeStub` legacy **mortos** (superados por RRC/AgentsRuntimeBootstrap TS) |
| `rules-loader.mjs`  | barrel + `bdd.mjs` + `tdd.mjs` + `quality-gates.mjs`               | só `getOptInRuleRelativePath` (mapa de 3 entradas)        | resíduo **trivial**; `normalizeAdapterSelection`/`readRulesByName`/`readOptInRules` mortos                                                                                                |
| `token-budget.mjs`  | `budget-report.mjs`                                                | `analyzeBudget` (+ `LIMITS`, `calculateTokH`, `analyze*`) | **único resíduo substantivo**: SEM equivalente TS (`grep` em `src/` = nada). Heurística Tok-H (`chars/3.5`) + limites por scope/payload                                                   |
| `rules-builder.mjs` | **0** vivos (só `rules-builder.test.mjs`)                          | —                                                         | **morto** (superado por `RulesCatalogBuilder` TS)                                                                                                                                         |
| `rules-parser.mjs`  | só `rules-builder.mjs` (que é test-only)                           | —                                                         | **morto transitivamente**                                                                                                                                                                 |
| `diagnose.mjs`      | **0**                                                              | —                                                         | **morto**                                                                                                                                                                                 |

**Consumidor de saída do token-budget:** `budget-report.mjs` → comando `check-budget` (`cli/cli/args.mjs:11` `SUPPORTED_MODES`; headless por contrato em `args.mjs:305-307`). É um modo da CLI **legacy** (`cli/`), não do registry TS.

**Conclusão da migração (D4):** a "migração plena" é **menor do que o nome sugere**. O único port não-trivial é `token-budget` → TS. Os demais são deleção + re-fiação de 3 features editoriais (mapa de paths) + remoção do barrel. Isso torna CO-3.3 tratável e atômico.

### 1.3 Modelo do grafo de conhecimento — onde o binding se ancora (D2)

- **`KnowledgeGraph`** (`app/projections/KnowledgeGraph.ts`): **read-model puro**, recomputa-se das fontes. Nós = `artifact` (com `stage`) | `falsification`. **`EdgeRelation = "graduatedTo" | "falsifies" | "constrains" | "crystallizedAs"`**. Aresta `to` pode ser `KnowledgeRef` **ou** `GovernedRef`.
- **A aresta `constrains` JÁ EXISTE** — hoje sai de uma `Falsification` para um `GovernedRef` (`KnowledgeGraph.ts:74`). Semântica atual: "esta falsificação restringe esta superfície governada".
- **`GovernedRef`** (`domain/knowledge/GovernedRef.ts`): união discriminada por `space` (`knowledge | work`), **explicitamente extensível a "futuros espaços governados, sem `DecisionSurface` persistida (INV-4/ADR 0026): o alvo é sempre uma ref existente/derivável"**. ← Este é o gancho exato para o binding sem nova entidade.
- **`KnowledgeStage`** (`domain/knowledge/KnowledgeStage.ts`): `insight→decision→rule|guardrail→doctrine`. O comentário do próprio arquivo já declara: **"`rule` e `guardrail` são o mesmo nível de cristalização (norma enforçada); diferem só na origem (`guardrail` = dogfood/interna)"** e `stageOrder` empata os dois em 2. ← D1 já está meio-feito na doutrina; falta executar o colapso.
- **`knowledge-backfill.yml`** (validado por `KnowledgeBackfill.ts` + `co-knowledge:inventory`): declara `rule`/`guardrail`/`decision`/`doctrine`/`insight`/`falsification` como entradas `KB-*` com `ref`, `priority`, `scope: runtime_bootstrap_p0`. **É plano governado DA SPEC 0024, não SSOT runtime universal** (cabeçalho do próprio arquivo). Invariante relevante: **≥2 exemplos por `kind`** (`KB_KIND_UNDERREPRESENTED`).
- **Origem já é derivável do ID:** `GG-*` = guardrail/interno; `CORE-*`/`GR-*`/`OPT-*`/`ADP-*` = rule/externo. O prefixo do ID **já codifica a origem** — "mover origem para metadado" pode ser "derivar do namespace do ID", sem campo novo.

**Heterogeneidade de fonte (risco de D2):** rules vivem em `.core/rules/**` (com front-matter compilável); **guardrails NÃO** — `GG-0001` vive em `.core/process/governance-foundation.md` (cf. `knowledge-backfill.yml` KB-0007). Logo, "binding no front-matter da fonte da constraint" não cobre guardrails uniformemente. Isto é o nó górdio do placement (ver §3/§6).

### 1.4 Superfícies de enforcement (`script-contracts.yml`) + recibo de carga

- **`.core/governance/script-contracts.yml`** é a **SSOT operacional** de scripts/hooks/workflows/templates. Cada entrada tem `name`, `command`, `category`, **`mutates: true|false`**, `consumers: [human|script|hook|lifecycle]`, `description`. **Já é o registro de superfícies de enforcement** — e o campo `mutates` resolve D5 de brinde (filtro objetivo de comandos mutantes).
- **Recibo** (`src/cli/handoffReceipt.ts`, CO-4): `createLoadReceipt`/`validateLoadReceipt` (puros) + `assertFreshHandoffReceipt` (lança) + I/O em `.git/ai-guidelines/handoff-load.json` (worktree-safe, fora do versionamento). O próprio código (`handoffReceipt.ts:176-181`) declara: _"o wiring amplo é evolução de enforcement/CO-6 — deliberadamente NÃO conectado agora"_. `assertFreshHandoffReceipt` **lança** (hard) — **incompatível com advisory-first**; CO-3.4 precisa de um caminho que **avisa, não interrompe** (espelhando `handoff:check`).

---

## 2. Opções consideradas

### D1 — rótulo do colapso `rule|guardrail` → `Constraint`

- **(1a) Estágio único `constraint`** substituindo `rule`/`guardrail` no enum; aceitar `rule`/`guardrail` como **alias de leitura**; origem **derivada do prefixo do ID** (GG=interno).
- **(1b) Manter `rule` como guarda-chuva** e tratar `guardrail` como alias/metadado (sem introduzir o termo `constraint` no código).
- **(1c) Campo `origin` explícito** no artefato, além do colapso de estágio.

### D2 — casa e direção do binding (sem nova SSOT)

- **(2a) Front-matter da constraint** (`.core/rules/**`): cada regra ganha `enforced_by`/`surface_class` opcional, compilado ao `rules.json`. **Problema:** não cobre guardrails (fonte heterogênea).
- **(2b) Lado-superfície em `script-contracts.yml`**: cada superfície lista `enforces: [<constraint-ref>...]`. Direção invertida (superfície→constraint), mas usa SSOT existente.
- **(2c) Aresta derivada `enforces` no grafo + declaração mínima por-ID** numa seção governada existente, com alvo = **novo `GovernedRef` space `surface`** (id = nome da entrada em `script-contracts.yml`, ref existente/derivável). A declaração NÃO cria arquivo novo; a aresta e a verificação são derivadas.
- **(2d) Sidecar novo** `.core/governance/enforcement-bindings.yml`. **Rejeitada de saída:** é exatamente a "nova SSOT" que a owner vetou.

### D3 — destino de `build:rules`

- **(3a) Alias compatível:** `build:rules` permanece (hooks/`build:all`/script-contracts dependem dele); `knowledge:compile` é superset que o invoca internamente.
- **(3b) Subcomando:** `knowledge compile --rules-only`.
- **(3c) Alvo interno:** `build:rules` vira passo privado de `knowledge:compile`.

### D5 — comandos para dogfood do recibo

- Candidatos `mutates: true` de maior risco em sessão retomada: `workflow publish-state` (escreve `state.yml`/`active.yml` — **a exata superfície que ficou stale no PIT-0011**), `review:publish` (sela + **faz push** — outward-facing), `pr-body:update` (muta PR), `merge`/`integration` (terminal).

---

## 3. Proposta recomendada

### 3.1 Constraint (D1) → **opção (1a) + origem derivada do ID**

Colapsar `rule|guardrail` num único estágio **`constraint`**; `stageOrder` colapsa 2; **`rule`/`guardrail` aceitos na leitura** (alias) para artefatos antigos; **origem derivada do prefixo do ID** (`GG-*`⇒interno) — sem campo novo (anti-taxonomia, `plan.md §123`). Superfícies tocadas: `KnowledgeStage` (+`stageOrder`/`KNOWLEDGE_STAGES`), `KnowledgeRef.ID_PATTERN`, `typedArtifacts.ruleArtifact`, `KnowledgeBackfill.KNOWLEDGE_BACKFILL_KINDS` (cuidar do invariante ≥2-por-kind), `KnowledgeStage.test.ts`. **Read-compat é requisito de saída.**

### 3.2 EnforcementBinding (D2) → **opção (2c): aresta `enforces` derivada + declaração mínima + `GovernedRef` space `surface`**

- **Schema mínimo declarado** (o que o humano escreve — apenas o que NÃO é derivável):

  ```
  enforces:                      # bloco opcional na declaração da constraint
    surface: <script-contract-name | workflow-id | hook-id>   # ref EXISTENTE
    surface_class: event | state                              # PIT-0008
  ```

  Apenas dois campos: **qual** superfície e **classe** evento/estado. Tudo o mais é derivado.

- **`GovernedRef` ganha `space: "surface"`** (`{ space: "surface"; id: <surface-name> }`), `id` = nome de uma entrada existente em `script-contracts.yml` — honra o contrato "ref existente/derivável, sem entidade persistida".
- **Aresta `enforces`** adicionada a `EdgeRelation`; derivada por `knowledge:compile` (Constraint → `GovernedRef{surface}`).
- **Derivado/verificado (não declarado):** (i) a superfície existe em `script-contracts.yml`; (ii) paridade `mutates`/`category` coerente com `surface_class` (PIT-0008: `event`⇏superfície de estado contínuo); (iii) sincronização. Tudo **advisory-first**, espelhando `co-knowledge:check`.
- **Casa da declaração:** recomendo **começar pelas rules** (front-matter `.core/rules/**`, compilado pelo Builder existente) e **deferir guardrails** (fonte heterogênea — `governance-foundation.md`) como **pergunta aberta Q3**, para não inflar o sub-checkpoint. Isso entrega ≥2 bindings reais (dogfood) sem resolver a heterogeneidade de fonte agora.

### 3.3 knowledge:compile (D3) → **orquestrador + alias compatível (3a)**

`knowledge:compile` = composition root que **orquestra peças existentes**: (1) `buildRulesCatalog` (rules.json), (2) `KnowledgeGraph.from(...)` agora com arestas `enforces`, (3) verificação derivada do binding (§3.2). **`build:rules` permanece como alias compatível** (hooks + `build:all` + `script-contracts.yml` o referenciam — renomear quebraria o contrato operacional). O **port TS de `token-budget`** é dobrado na migração legacy (§3.4), não aqui.

### 3.4 Recibo (D5) → **`workflow publish-state` (#1) + `review:publish` (#2), advisory-first**

`publish-state` é o alvo mais justificado pela própria dor da spec (drift de `active.yml` no PIT-0011 ocorreu numa transição de nó com retomada stale). `review:publish` adiciona cobertura outward-facing (push). **Advisory-first exige um caminho não-lançante** (ex.: `checkHandoffReceipt(...)` que retorna aviso + comando de recarga) — **não** usar `assertFreshHandoffReceipt` (que lança) no wiring. O dispatcher amplo fica no CO-6.

---

## 4. Riscos

| #   | Risco                                                                                    | Mitigação                                                                                                                  |
| :-- | :--------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| R1  | Colapso D1 trinca o invariante `≥2-por-kind` do backfill (`guardrail` deixa de ser kind) | Read-compat + remapear `kind` no backfill no mesmo commit; teste de regressão com artefato `guardrail` legado              |
| R2  | **Placement do binding** vira nova SSOT ou acopla direção errada (risco dominante)       | Aresta **derivada** + declaração mínima em fonte existente + `GovernedRef{surface}` (ref existente); sidecar (2d) proibido |
| R3  | Heterogeneidade de fonte (guardrails fora de `.core/rules/**`)                           | Escopar CO-3.2 a **rules primeiro**; guardrails = Q3 (decisão explícita), não improviso                                    |
| R4  | Port TS de `token-budget` desvia warnings (Tok-H/limites)                                | **Teste de paridade** TS↔mjs sobre o catálogo atual antes de deletar o monólito                                            |
| R5  | Deleção do monólito quebra `check-budget`/features editoriais silenciosamente            | Critério de saída `grep monolith` = 0 consumidores vivos + `test:smoke` (prova consumidor intacto)                         |
| R6  | Recibo lançante quebra CI/automação que roda comando mutante sem retomada                | **Advisory-first** (avisa, não interrompe); limite honesto: aviso pode ser ignorado (PIT-0011)                             |
| R7  | Escopo do CO-3 é grande (5 frentes, 4 slots)                                             | Disciplina de 4 sub-checkpoints, cada um verde isolado, **Gate único ao fim** (modo unit)                                  |

---

## 5. Decisões suficientemente fechadas

> Convergência owner (2026-06-13). NÃO reabrir o conceitual; o **formato/schema exato** segue para revisão adversarial (§6).

### D1 — Constraint

- `constraint` é o **conceito canônico** do estágio hoje representado por `rule | guardrail`.
- **Não** criar `constraint` como **sexto estágio** ao lado de ambos — é o colapso dos dois.
- Leitores antigos **continuam aceitando** `rule` e `guardrail` (read-compat).
- O **modelo normalizado expõe `constraint`**.
- A **origem não deve depender silenciosamente apenas do prefixo do ID** — precisa de metadado explícito (formato a refinar com o schema; conceito fechado).

### D2 — Natureza do EnforcementBinding

- O binding é **dado mínimo declarado**.
- **Escolher a superfície é decisão humana.**
- **Existência da superfície, paridade, sincronização e implementação são verificações derivadas.**
- **Não** criar sidecar runtime como **nova SSOT**.
- O **schema exato** ainda será revisado pelo Codex (Q1).

### D3 — knowledge:compile

- É **orquestrador** do compilador TS existente; **não** cria motor paralelo.
- Deve compilar **conhecimento, constraints, bindings e projeções**.
- `build:rules` **permanece temporariamente** como alias/entrada compatível para hooks e automações existentes.
- Entrypoint humano desejado: **`npm run guidelines -- knowledge compile`**, se compatível com o registry.

### D4 — Fatiamento

Um PR #42, **quatro sub-checkpoints**, um Human Gate final (modo unit):

```text
CO-3.1 — Constraint + EnforcementBinding
CO-3.2 — knowledge:compile + manifesto/paridade
CO-3.3 — migração e remoção do substrato legacy
CO-3.4 — dogfood do enforcement e recibo
```

### D5 — Primeiro dogfood do recibo

- Superfícies selecionadas: **`workflow publish-state`** e **`review:publish`**.
- Motivos: são **mutantes**, **participaram de dores observadas**, operar com **contexto stale** tem impacto real, e têm **fronteira de evento clara**.
- Modo inicial: **advisory-first** — **não** usar diretamente o guard lançante como comportamento inicial.

---

## 6. Questões técnicas ainda abertas para revisão adversarial

> Pacote reduzido a **três** questões para o Codex (lente técnica/implementabilidade) → ChatGPT (lente arquitetural) → owner (decisão).

### Q1 — Schema e placement do binding

Avaliar o **menor contrato** que represente honestamente:

```text
qual constraint
qual superfície
classe event | state
qual mecanismo/check executa
força advisory | required
```

- Dois campos (`surface`, `surface_class`) **bastam**, ou falta representar `enforcement`/handler e `mode`?
- `enforcement`/handler precisa ser **explícito** (ou é derivável de `script-contracts.yml`)?
- `mode` (advisory|required) pertence ao **binding** ou à **policy**?
- Como usar `GovernedRef` + aresta do grafo **sem duplicar** `script-contracts.yml`?
- Qual arquivo é a **fonte canônica** da declaração?
- Como **impedir binding para superfície inexistente**?

### Q2 — Guardrails como fonte executável

O checkpoint precisa absorver **rules e guardrails**. Investigar:

- Como **normalizar** `.core/rules/**` (estruturado) e guardrails hoje documentados em `governance-foundation.md` (prosa doutrinária).
- Se a **fonte atual de guardrails é estruturada o bastante** para ser compilável.
- Como **evitar um sidecar concorrente**.
- Se é necessário **promover uma representação machine-readable já governada** dos guardrails.
- Como **preservar o texto doutrinário** sem usá-lo como parser frágil.
- Como **consumidores** definem constraints próprias.

### Q3 — Migração do legado

Definir **ordem segura** para:

- Remover partes mortas de `compiler.mjs`.
- Substituir o mapa trivial de `rules-loader.mjs`.
- Portar `token-budget.mjs` para TS.
- Reconciliar `budget-report.mjs` / `check-budget`.
- Reconectar `bdd`/`tdd`/`quality-gates`.
- **Provar paridade** de warnings, tokens, paths, packaging e cross-platform.
- **Apagar o monólito apenas quando não houver consumidor vivo.**

---

## 7. Plano dos sub-checkpoints (dentro do PR #42; Gate único ao fim, modo unit)

> Fronteiras conforme **D4 (fechado)**. Ordem por dependência: modelo+binding → compilador+manifesto → migração legacy → enforcement+recibo. Cada sub-checkpoint: atômico, `validate` verde, sem merge isolado.

### CO-3.1 — Constraint + EnforcementBinding (modelo + declaração)

- **Entrega:** estágio único `constraint` (alias de leitura `rule`/`guardrail`; **origem como metadado normalizado**, não só prefixo de ID); `EnforcementBinding` como **schema mínimo declarado** + alvo `GovernedRef{space:"surface"}` (ref existente) + aresta `enforces` no grafo; **≥2 bindings reais** de rules declarados (dogfood). Superfícies tocadas: `KnowledgeStage`/`KnowledgeRef`/`typedArtifacts`/`KNOWLEDGE_BACKFILL_KINDS`/`GovernedRef`/`KnowledgeGraph` + testes.
- **Saída:** grafo recompõe do backfill+falsifications atuais; artefatos legados `rule`/`guardrail` **carregam como constraint**; modelo normalizado **expõe `constraint`**; **nenhum arquivo SSOT novo**; `co-knowledge:*` + `validate` verdes.
- **Falsificação:** fixture com artefato estágio `guardrail` (legado) carrega e grafa como constraint (remover o alias **quebra**); binding declarado para superfície **inexistente** é **detectável**.

### CO-3.2 — knowledge:compile + manifesto/paridade

- **Entrega:** comando `knowledge:compile` (entrypoint humano **`npm run guidelines -- knowledge compile`**, se compatível com o registry) orquestrando `buildRulesCatalog` + `KnowledgeGraph` (com `enforces`) → **manifesto compilado** (conhecimento + constraints + bindings + projeções) + **verificação de paridade derivada** (existência da superfície / coerência `event|state` / sincronização), **advisory-first**; `build:rules` permanece como **alias compatível**.
- **Saída:** **zero motor novo** (reusa o motor TS); manifesto **determinístico**; paridade verde; `build:rules`/hooks intactos.
- **Falsificação:** binding `surface_class: event` apontando superfície de **estado contínuo** ⇒ advisory sinaliza (PIT-0008); manifesto **não-determinístico** (duas execuções divergem) ⇒ falha.

### CO-3.3 — Migração e remoção do substrato legacy (sub-checkpoint próprio — D4)

- **Entrega:** port TS de `token-budget` (`analyzeBudget`/`LIMITS`/Tok-H) + reconectar `budget-report`/`check-budget`; port de `getOptInRuleRelativePath` + reconectar `bdd`/`tdd`/`quality-gates`; substituir `loadRulesCatalog` por leitura TS; **deletar** `monolith/{compiler,rules-loader,token-budget,rules-builder,rules-parser,diagnose}.mjs` + barrel `governance/index.mjs` (re-exports mortos) + testes legados.
- **Saída:** `grep monolith` = **0** consumidores vivos; `check-budget` funciona via TS; **teste de paridade** (warnings/tokens/paths/packaging/cross-platform) verde; `validate` + `test:smoke` verdes.
- **Falsificação:** remover o monólito **sem** quebrar `check-budget`/features editoriais (smoke prova consumidor intacto); o port de budget reproduz os **mesmos warnings** do catálogo atual.

### CO-3.4 — Dogfood do enforcement e recibo (advisory-first — D5)

- **Entrega:** caminho **não-lançante** de verificação do recibo conectado em `workflow publish-state` (+ `review:publish`), emitindo aviso + comando de recarga quando stale; **sem** alterar comportamento quando fresh; dispatcher amplo permanece no CO-6.
- **Saída:** comando **avisa** em retomada stale; **silencioso** quando fresh; `assertFreshHandoffReceipt` (lançante) **não** é usado no wiring.
- **Falsificação:** rodar `publish-state` com recibo de HEAD divergente **emite** o advisory de recarga; com recibo fresh, **silêncio**.

---

## 8. Apêndice factual para revisão independente

> Cada linha aponta o **arquivo/consumidor** que a sustenta (medido no HEAD `703d72f`). `status`: vivo | trivial | morto | sem-equivalente-TS.

### Motor TS (alvo de reuso)

- **`RulesEngine`** — `src/app/services/RulesEngine.ts`. **entrada:** `RulesCatalogSource` (porta). **saída:** `RulesCatalogJson`/`BuiltCatalog`/markdown/lookups. **efeito:** nenhum (puro, app-layer; 4 pipelines parse/build/projection/lookup). **consumidores vivos:** núcleo de pipeline (sem importador de produção direto encontrado em `src/` além de testes/`RulesProjection`). **testes:** `RulesProjection.test.ts`, `RulesCompilation.test.ts`. **status:** vivo (núcleo).
- **`RulesCatalogBuilder.buildRulesCatalog`** — `src/app/services/RulesCatalogBuilder.ts`. **entrada:** `RulesMarkdownSource` + `{baseDir, generatedAt?, tags?, scopes?}`. **saída:** `{catalogJson, ledgerMarkdown, humanCatalogMarkdown}` + `validateBuildOutput`. **efeito:** nenhum (puro). **consumidores vivos:** `src/cli/buildRules.ts` (`build:rules`). **testes:** `RulesCatalogBuilder.test.ts`. **status:** vivo.
- **`RulesRuntimeCompiler`** — `src/app/services/RulesRuntimeCompiler.ts`. **entrada:** `RulesCatalogJson` + `{includeAdapters, optInFeatures, lang}`. **saída:** `compileAdapterRulesByName`/`formatRuleInstruction`/`filterRulesByScope`. **efeito:** nenhum (puro). **consumidores vivos:** `cli/features/core/pointers.mjs:17-34` (import dinâmico de `dist/app/services/RulesRuntimeCompiler.js`). **testes:** `RulesRuntimeCompiler.test.ts`. **status:** vivo (compilador de adapter-rules de produção).
- **`KnowledgeGraph`** — `src/app/projections/KnowledgeGraph.ts`. **entrada:** `KnowledgeArtifact[]` + `Falsification[]`. **saída:** nós/arestas tipadas; `EdgeRelation = graduatedTo|falsifies|constrains|crystallizedAs`. **efeito:** nenhum (read-model puro, recomputável). **consumidores vivos:** projeções/checks de conhecimento + testes. **testes:** `KnowledgeGraph.test.ts`. **status:** vivo (gancho do binding: aresta `constrains` + `GovernedRef`).
- **`script-contracts.yml`** — `.core/governance/script-contracts.yml`. **entrada:** declaração SSOT de scripts/hooks/workflows/templates (`name`/`command`/`category`/**`mutates`**/`consumers`). **saída:** projeta `package.json`/docs/hooks. **efeito:** SSOT (fonte). **consumidores vivos:** `script-contracts:sync`/`check`. **status:** vivo (registro de superfícies de enforcement; `mutates` filtra comandos do recibo).

### Substrato legacy (`cli/governance/monolith/`)

- **`compiler.mjs`** — **saída:** `loadRulesCatalog` (JSON.parse) + `compile*`/`groupUniversal*`/`buildAgentsRuntimeStub` (legacy). **consumidores vivos:** `budget-report.mjs` (**só** `loadRulesCatalog`); `governance/index.mjs` (barrel, re-export **não consumido** — `engine.mjs` usa só `agents-merge`). **testes:** `compiler.test.mjs`. **status:** parcialmente morto (só `loadRulesCatalog` vivo; trivial).
- **`rules-loader.mjs`** — **saída:** `getOptInRuleRelativePath` (mapa de 3 entradas) + `normalizeAdapterSelection`/`readRulesByName`/`readOptInRules`. **consumidores vivos:** `bdd.mjs`/`tdd.mjs`/`quality-gates.mjs` (**só** `getOptInRuleRelativePath`); barrel. **testes:** `rules-loader.test.mjs`. **status:** trivial (resíduo = mapa de paths; resto morto).
- **`token-budget.mjs`** — **entrada:** catálogo. **saída:** `analyzeBudget`/`analyzeScopeBudgets`/`analyzeAgentsMdBudget`/`analyzePerAdapterBudgets`/`calculateTokH`/`LIMITS` (Tok-H = `chars/3.5`). **efeito:** nenhum (puro). **consumidores vivos:** `budget-report.mjs`. **testes:** `token-budget.test.mjs`. **status:** **sem-equivalente-TS** (único port substantivo).
- **`rules-builder.mjs`** — **consumidores vivos:** 0 (só `rules-builder.test.mjs`). **status:** morto (superado por `RulesCatalogBuilder`).
- **`rules-parser.mjs`** — **consumidores vivos:** só `rules-builder.mjs` (test-only). **status:** morto transitivamente.
- **`diagnose.mjs`** — **consumidores vivos:** 0. **status:** morto.

### Consumidores do legacy

- **`budget-report.mjs`** — `cli/features/core/budget-report.mjs`. **entrada:** `rulesJsonPath` (default `.core/rules/_meta/rules.json`). **saída:** relatório no stdout. **efeito:** `process.exitCode=1` em erro de leitura. **importa:** `loadRulesCatalog` + `analyzeBudget` do monólito. **status:** vivo (consumidor do token-budget).
- **`check-budget`** — `cli/cli/args.mjs:11` (`SUPPORTED_MODES`), headless por contrato (`args.mjs:305-307`). **saída:** delega a `runBudgetReport`. **status:** vivo (modo da CLI legacy `cli/`, não do registry TS).
- **`bdd`/`tdd`/`quality-gates`** — `cli/features/opt-in/editorial/{bdd,tdd,quality-gates}.mjs`. **entrada:** `targetDir`/`options`. **saída:** sync de `.ai-guidelines/rules/<feature>.md`. **efeito:** escreve/`unlink` arquivos no target (I/O). **importa:** `getOptInRuleRelativePath`. **status:** vivo (consumidores do rules-loader).

### Recibo + superfícies de dogfood

- **`handoffReceipt.ts`** — `src/cli/handoffReceipt.ts`. **entrada:** `HandoffFacts` + selo (puros) / texto persistido. **saída:** `HandoffLoadReceipt`/`ReceiptStatus`. **efeito:** I/O em `.git/ai-guidelines/handoff-load.json` (worktree-safe, fora do versionamento). **nota:** `assertFreshHandoffReceipt` **lança** (`:181-193`); o próprio arquivo (`:176-181`) declara wiring amplo deferido p/ CO-6. **testes:** `handoffReceipt.test.ts`. **status:** vivo (guard pronto, não conectado).
- **`workflow publish-state`** — `src/cli/registry/commands/WorkflowCommand.ts:35-63` → `workflow.ts`/`PublishState.ts`. **efeito:** projeta/escreve estado da spec (`state.yml`/`active.yml`). **status:** vivo; **`mutates: true`**; alvo #1 do recibo (superfície que ficou stale no PIT-0011).
- **`review:publish`** — `cli/review-publish.mjs` (script `review:publish`). **efeito:** sela + publica artefato de review + **push** (outward-facing). **status:** vivo; **`mutates: true`**; alvo #2 do recibo.

---

## 9. Roteamento

Este é o enquadramento **Claude**. Próximo: rotear as **três questões abertas (§6, Q1–Q3)** a **Codex** (lente técnica/implementabilidade) → **ChatGPT** (lente arquitetural) → **owner** (decisão), conforme o fluxo de checkpoint estrutural. Só então o primeiro sub-checkpoint (CO-3.1) entra em implementação. Nada em `state.yml`/`tasks.md`/código/PR foi alterado nesta sessão.

---

## 10. Decisão da owner (2026-06-13) — entrada do CO-3.1

> Após a revisão adversarial (`research/2026-06-13-checkpoint-co-enforcement-codex-review.md`), a owner fechou o contrato de entrada do **CO-3.1**. Esta seção é o registro vivo da decisão; o schema conceitual **não reabre** sem contradição factual concreta.

- **Schema de quatro campos por binding** (Codex Q1, schema C): `surface` (namespaced) · `surface_class` (`event|state`) · `enforcement` (mecanismo) · `mode` (`advisory|required`). Dois campos foram falsificados como insuficientes (não distinguem aplicabilidade de enforcement real). A constraint é implícita pelo item; no manifesto normalizado aparece como `constraint_ref`.
- **Fonte estruturada canônica:** `.core/constraints/constraints.yml` (identidade executável + origem explícita + bindings). Overlay **opcional** de consumidor: `.governance/constraints.yml`. **Sem** `.ai-guidelines/constraints.yml` nesta sessão (ponte legada deferida). O Markdown (rules em `.core/rules/**`, guardrails em `governance-foundation.md`) permanece **doutrina/corpo humano** referenciado por `source_ref` — **não** é parseado semanticamente (B2 destino, sem B1).
- **Origem explícita, não por prefixo:** `origin.kind: rule|guardrail` é declarado e **verificado** contra o catálogo real (rules.json / foundation), nunca inferido só do prefixo do ID.
- **Namespaces iniciais:** `npm-script:<nome>` e `registry-command:<comando>/<subcomando>`. Demais namespaces (hook, workflow, state-file, gate, fs, api) são **recusados** como não-suportados nesta sessão.
- **Resolvers:** `npm-script` resolve por `.core/governance/script-contracts.yml` (deriva command/category/mutates/consumers); `registry-command` resolve pelo `CommandRegistry` real (introspecção read-only via descriptor `subcommands`), reconhecendo no mínimo `registry-command:workflow/publish-state` — que **não** existe em `script-contracts.yml` (prova de que o resolver de registry é necessário).
- **Mecanismos registrados (CO-3.1):** `gate-decidability-check` (implemented) e `script-contracts-check` (implemented); `handoff-receipt` reconhecido **estruturalmente** como `planned` (não conectado). Binding `required` **não** pode apontar mecanismo `planned`; classe incompatível falha.
- **Dados reais:** `GG-0001` → `npm-script:gate-decidability:check` / `gate-decidability-check` / `event` / `required`; `CORE-08` (HARNESS LOCK — cita "declared script contract / generated script surfaces stale") → `npm-script:script-contracts:check` / `script-contracts-check` / `event` / `required`. Ambos mecanismos `implemented` e presentes no `validate`.
- **Grafo:** `GovernedRef` ganha `space: "surface"` (id = ref namespaced, sem entidade `Surface` persistida); aresta projetada é `constrains` (Constraint → SurfaceRef). **Não** se cria aresta `enforces`; `enforcement/mode/surface_class` vivem no binding/manifesto.
- **Manifesto runtime persistido:** **deferido para CO-3.2.** No CO-3.1 o manifesto é **somente em memória** (determinístico, serializável). `knowledge:compile` (entrypoint público) também é CO-3.2.

Ver `## Dogfood CO-3.1 — modelo e resolução` (abaixo, registrada na implementação) para as evidências de falsificação e os comandos verdes no repo real.

---

## Dogfood CO-3.1 — modelo e resolução

> Implementação de CO-3.1 (2026-06-13). Fatia vertical mínima e real, dos artefatos versionados ao manifesto em memória. `knowledge:compile`, manifesto runtime persistido, GG-0004, wiring do recibo, token-budget e remoção do monólito permanecem **intocados** (CO-3.2+).

### Superfícies novas

- **Fonte estruturada:** `.core/constraints/constraints.yml` (core) + leitura opcional de `.governance/constraints.yml` (overlay). **Nenhum** `.ai-guidelines/constraints.yml`.
- **Modelo:** `src/domain/constraints/{Constraint,SurfaceRef,EnforcementMechanism}.ts`; `GovernedRef` ganhou `space: "surface"`.
- **App:** `src/app/constraints/{SurfaceResolver,NpmScriptSurfaceResolver,RegistryCommandSurfaceResolver,compileConstraints}.ts`.
- **Reader:** `src/infrastructure/yaml/constraintsSourceReader.ts`.
- **Check:** `cli/constraints-check.mjs` → `src/cli/constraintsCheck.ts`; `constraints:check` integrado ao `validate` (após `co-knowledge:inventory`).
- **Introspecção read-only do registry:** `Command.subcommands` + `src/cli/registry/describeCommands.ts` (sem segundo catálogo manual; `WorkflowCommand` declara `["publish-state"]`).

### Constraints reais compiladas (manifesto em memória, determinístico)

```text
CORE-08 (rule)      --constrains--> surface:npm-script:script-contracts:check   [event · script-contracts-check · required · implemented]
GG-0001 (guardrail) --constrains--> surface:npm-script:gate-decidability:check  [event · gate-decidability-check · required · implemented]
```

`constraints:check` no repo real:

```text
✅ constraints:check — 2 constraints · 2 bindings · 2 superfícies resolvidas · paridade íntegra
```

Determinismo: duas execuções de `runConstraintsCheck` produzem manifesto **byte-idêntico**; `provenance.sources[]` sela o sha256 da fonte core.

### Falsificações rejeitadas (mutações controladas sobre as fontes/fixtures)

| #   | Mutação                                                                       | Veredito                                                                    |
| :-- | :---------------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| 1   | superfície inexistente (`npm-script:nao-existe`)                              | `SURFACE_NOT_FOUND`                                                         |
| 2   | mecanismo inexistente (`enforcement: fantasma`)                               | `MECHANISM_UNKNOWN`                                                         |
| 3   | `mode: required` apontando mecanismo `planned` (`handoff-receipt`)            | `MECHANISM_PLANNED_REQUIRED`                                                |
| 4   | `source_ref` quebrado (arquivo inexistente)                                   | `PARITY_SOURCE_MISSING`                                                     |
| 5   | binding duplicado (mesma tupla)                                               | `BINDING_DUPLICATE`                                                         |
| 6   | `registry-command:workflow/publish-state` + `surface_class: state`            | `SURFACE_CLASS_INCOMPATIBLE`                                                |
| 7   | overlay duplicando ID do core                                                 | `ConstraintsParseError` (sem override implícito)                            |
| 8   | `registry-command:workflow/publish-state` resolvido só por `script-contracts` | `SURFACE_RESOLVER_ABSENT` (prova que o resolver de registry é necessário)   |
| 9   | origem `GG-*` declarada como `rule`                                           | `PARITY_RULE_UNKNOWN` (origem confrontada com o catálogo, não pelo prefixo) |

Todos rejeitados **deterministicamente**. Cobertura: 68 testes focados (schema/sources/surfaces/mechanisms/manifesto/grafo/consumer) — `GovernedRef{space:"surface"}` round-trip, aresta `constrains`, ausência de nó `Surface` persistido, `handoff-receipt` advisory reconhecido estruturalmente.

### Limite honesto

A **classe observável** de `npm-script` não é derivável de `script-contracts.yml` (`mutates`/`category` não a determinam): a classe declarada é validada apenas contra o mecanismo, não contra a superfície (limitação declarada, sem inventar certeza). Já `registry-command` deriva `event` da natureza de invocação — daí a incompatibilidade da falsificação #6.

---

## Dogfood operacional — briefing de implementação ainda reconstruído manualmente

> **Data:** 2026-06-13 · **Contexto:** sessão de correção do Technical Audit (F1–F3) do CO-3.1.

**1. Contexto.** Para corrigir F1–F3 o repositório já projetava a RETOMADA (`guidelines handoff`) e o contrato de REVIEW (`guidelines review <tipo>`). Mesmo assim, a **execução do trabalho funcional** dependeu de um mega-prompt humano.

**2. Pedido humano que deveria bastar.**

```text
Corrija os findings atuais.
```

**3. Informação repetida no mega-prompt (toda derivável do repo).** branch, PR, checkpoint e HEAD esperados; review e findings; ações permitidas; ações proibidas; regras de autoridade; necessidade de resolutions; comandos de validação; política de commit/push; critério de parada; formato detalhado da resposta final.

**4. Hipótese falsificada.** `handoff + review briefing + policy` **não** tornam automaticamente o contrato de **implementação e de entrega do relatório** descobrível. O contrato de review já era descobrível; o de TRABALHO (escopo/autoridade/validações/parada/relatório) ainda vivia no prompt humano. (PIT-0011, 3ª classe de ocorrência — agora sobre o ato de IMPLEMENTAR/ENTREGAR, não retomar/revisar.)

**5. Impacto.** custo de contexto (mega-prompt a cada sessão); risco de autoridade excessiva (agente assume permissões não concedidas); comandos/validações esquecidos; relatórios finais inconsistentes entre sessões.

**6. Decisão.** Criar `guidelines work` — briefing GOVERNADO de trabalho, sibling do `review` brief: `contrato permanente do repositório (work-policy.yml) + estado situado derivado (mesmo snapshot do handoff) + pedido humano curto → briefing completo`. Modo inferido por precedência determinística (`blocked → resolve_findings → await_revalidation → implement_checkpoint → prepare_close → current`), reusando `deriveNextAction` + consolidação de findings/resolutions; report contract por modo na fonte governada (NÃO hardcoded em prompt nem em TS). Autorização capability-scoped derivada do pedido explícito (`--authorization explicit-work-request`).

**7. Limite.** O briefing PROJETA o contrato; **não executa** trabalho (zero LLM no runtime — ADR 0018): não edita arquivos, não commita, não faz push, não aplica patch. O agente continua sendo canal; o humano decide.

**8. Dogfood do próprio estado.** Com F1–F3 `open` mas com resolutions `fixed` (refs válidas), `guidelines work` deve inferir **`await_revalidation`** (e NÃO `resolve_findings` como o handoff cru ainda deriva) — próxima ação = revalidação independente por reviewer/owner; nenhuma nova resolution para F1–F3; CO-3.2 proibido. É a distinção que o handoff não fazia (ele retorna `resolve-findings` por `openFindings>0`, sem olhar resolutions).

---

## Dogfood operacional — publicação prospectiva de verification

> **Data:** 2026-06-13 · **Contexto:** revalidação independente do CO-3.1 (EV1) pelo Codex.

**1. Sintoma.** O EV1 (verification approved dos findings F1–F3) era um artefato VÁLIDO e SELADO, mas **não pôde ser publicado pelo comando canônico** `review:publish`. O Codex teve de recorrer a commit/push manual seguro.

**2. Causa — circularidade.** A derivação de modo do `reviewBrief` mantinha a lane em `VERIFICATION` enquanto houvesse finding open com resolution — e a disposition de F1–F3 permanece `open` por contrato (só reviewer/owner fecha). `review:publish` exigia lane `CURRENT` antes do commit. Logo:

```text
o evento precisa estar publicado para a lane virar CURRENT
↓
review:publish exige CURRENT
↓
o evento que TORNARIA a lane CURRENT não pode ser publicado
```

**3. git HEAD × functional HEAD.** O EV1 é um commit **review-only** (vive em `<spec>/reviews/`): ele avança o git HEAD mas NÃO o functional HEAD (último commit fora de `reviews/`). O subject auditável é o functional HEAD — por isso o commit do próprio evento não pode tornar a lane stale.

**4. Correção — avaliação prospectiva.** (a) Findings já REVALIDADOS por um evento que cobre o functional HEAD não mantêm a lane em `verification` (o ledger append-only que cobre o HEAD já a torna `current`). (b) `review:publish` ganhou `evaluateProspectiveReviewPublication`: avalia o estado PROSPECTIVO (o candidato já em disco fecha a lane como `current`?) + diff review-only + branch/path/checkpoint/role canônicos + `review:check`, sem exigir o evento commitado e sem alterar seu fingerprint.

**5. Resultado do dogfood.** Fixture bare-remote prova o ciclo completo `VERIFICATION (findings open+resolution) → seal → review:publish → commit exclusivo → push → CURRENT`, com o functional HEAD inalterado pelo commit review-only.

**6. Limites preservados.** fail-closed sem autorização; GitHub forbidden-by-default (nenhum comentário remoto); push normal (nunca `--force`/`--no-verify`); o review original e o EV1 permanecem intactos; dispositions seguem `open` (fechamento é do reviewer/owner); nenhuma resolution nova para F1–F3.

**7. PIT-0011 (ocorrência distinta).** O contrato era DESCOBERTO (`review:publish` canônico) e o artefato PRODUZÍVEL (EV1 selado), mas a **automação de publicação não conseguia concluir o próprio fluxo canônico** (pré-condição circular). É a evolução da classe ("descoberto ≠ executável") para "produzível ≠ publicável pela ferramenta canônica". Registrado em PIT-0011; não promovido.
