<!-- ai-guidelines-template: next-boilerplate v=1 -->

# NEXT — Spec 0021 Governance Information Architecture

> **Arquivo de acompanhamento contínuo.** Instanciado **sempre** no setup da spec.
> Ao final de cada fase, registre aqui apenas itens que **extrapolem o escopo**
> desta spec e precisem sobreviver até o encerramento. Se a pendência será
> resolvida antes do merge desta própria spec, ela deve ir para o `tasks.md`.
> **DELETADO no encerramento pré-merge** (fase final do `tasks.md`); itens relevantes
> migram antes para `.specify/specs/roadmap/backlog.md` ou viram issues.

---

## 🏛️ Débitos Adiados

### Débitos da Fase 0 (Setup)

_(Nenhum débito registrado)_

### Débitos da Fase 1 (Fundação Arquitetural)

Foram identificados os seguintes riscos arquiteturais ainda existentes:

1. WorkItemPatch é estruturalmente wide. Como envelope de mutação, aceita todos os campos — incluindo id/createdAt (com runtime guard de imutabilidade no Registry). Migração para um patch tipado por categoria é trabalho do PR2 quando o YAML schema-guard chegar.
2. Cast as WorkItem em Registry.update. O merge {...current, ...patch} não pode ser provado type-safe pelo TS sobre o union; o cast é deliberado e está documentado no código.
3. Boundary enforcement por regex. Continua provisório; o ARCHITECTURE.md trata a migração para AST como obrigatória antes de carregamento dinâmico/plugins. Risco baixo no PR1, ativo a partir do PR3.
4. Glossário "ubíquo" não tem enforcement automático. Convivência entre identificadores no código e definições do §G ainda é convencional. Evolução natural quando o LivingDocumentation (PR3) puder cruzar AST × glossário.
5. ~~Ausência de testes integrados E2E.~~ **Parcialmente mitigado em 2.A** — `NodeWorkspaceIntegration.test.ts` exercita o adapter real do filesystem (mkdir/scope/rollback). Permanece pendente: E2E cruzando Application use cases + adapters reais (chega quando `NodeRegistryStore` existir em 2.B).
6. ResolutionMode modelado, mas pouco exercitado. Semântica de cleaned-up/kept para experiments perdidos só será coberta no PR2/PR3.

### Débitos da Fase 2 (Reestruturação Física)

#### Sub-bloco 2.A (GovernanceWorkspace) — registrado em 2026-05-10

1. ~~**2.A.5 — Deprecation plan do legado não definido.**~~ **Resolvido em 2.D (2026-05-10):** o contrato canônico declarado em `ARCHITECTURE.md` §C invariante 12 + §H formaliza `.governance/` como root consumidor e marca `.ai-guidelines/` (atualmente escrito pela CLI mjs) como **bridge legada explícita**. O marco objetivo de retirada do legado é **PR4 / 4.C (cleanup holístico)**, condicionado a plugar `AdoptWorkspace` no engine mjs em PR3/PR4 e atualizar docs distribuídas (README, AGENTS.md do consumidor, help da CLI). Sem warnings de deprecação no CLI por enquanto — a bridge é silenciosa-por-design (não-disruptiva) até o cutover; warnings serão acionados em PR4 quando a migração real começar.
2. **2.A.8 — Bridge reader não implementado.** O flag `allowExplicitLegacyBridge` existe em `WorkspacePrecedence`, mas nenhum use case lê de `.specify/` ainda. Quando um consumidor pedir essa leitura (provavelmente em PR4 durante consolidação), criar `ReadLegacyArtifact` use case + port `LegacyReader`.
3. **Race window em `NodeWorkspaceProvisioner.ensureDirectory`.** O pré-check `existedBefore` é separado do `mkdirSync` — outro processo poderia criar o diretório entre os dois. Em runtime single-process da CLI o risco é nulo; documentar no contrato e revisitar se a CLI virar daemon.
4. **`Isolation.test.ts` segue em skip.** A criação de pasta **por item denso** (`.governance/specs/<id>/`) depende de plugar um adapter real do `WorkspaceStore` (atual port já existente) — fica natural em 2.B quando `NodeRegistryStore` materializar `registry.yml` no mesmo `.governance/`.
5. **`FileSystemAdapter.test.ts` segue em skip.** Atomicidade de escrita (`tmp + rename`) é exatamente o contrato que 2.B precisa implementar para `registry.yml`. Promover skips a testes reais lá.

#### Sub-bloco 2.B (Registry YAML SSOT) — registrado em 2026-05-10

1. **`FileSystemAdapter.test.ts` resolvido por equivalência.** A atomicidade (`tmp + rename`) está agora coberta por `RegistryRoundTrip.test.ts` ("DADO save falhando ENTÃO arquivo original permanece intacto") sobre o store real. Manter os `it.skip` originais por ora (eles ainda descrevem um adapter genérico de filesystem que não existe como bloco isolado); converter em débito para retirada formal quando — e se — um `FileSystemAdapter` separado for extraído.
2. **`Isolation.test.ts` segue em skip.** Continua dependendo de plugar adapter real para `WorkspaceStore` (pasta `.governance/specs/<id>/`). Independente de 2.B; é puramente sobre densidade física por item. Resolução natural quando 2.C/2.D ligar `WorkspaceStore` ao IO real do `.governance/`.
3. **Comment Preservation (2.B.5) implementada (Caminho A) com limitação documentada.** `commentBefore` em yaml@2 está vinculado ao **próximo nó** da seq; ao remover um item, o comentário-cabeça migra para o item seguinte ao invés de sumir. Comportamento é **conservador por design** (jamais destrói texto do usuário) e está documentado em `RegistryCommentPreservation.test.ts`. Evolução opcional: detectar comentários "órfãos" e mover para área neutra (header) — só se a dor real aparecer; abrir ADR específica nesse caso.
4. **Cobertura do `RegistryService` abaixo do esperado.** Service tem CRUD via DI mas só `add` é exercitado em teste explícito (RoundTrip). `update`/`remove`/`load`/`save` via service ainda só são cobertos indiretamente via `GovernanceRegistryStore`; `autosave: false` (batch) nunca é testado. Aceitar como débito ergonômico — a regra de negócio vive no store; o service é casca fina. _Revisitado em `[2.C-sanitize]` (2026-05-10): mantido como débito; resolução em 2.D quando a CLI plugar o `RegistryService` em fluxo real._
5. **Não há use case que orquestre `RegistryService` real ainda.** `RegisterWorkItem`/`PromoteWorkItem` seguem com `RegistryStore` injetado (in-memory nos testes). A ligação CLI → `GovernanceRegistryStore` real chega em 2.D / PR4 quando a CLI for plugada no `.governance/` materializado.

#### Sub-bloco 2.C (RulesEngine + Reorg físico Top/Center/Base/Adapters) — registrado em 2026-05-10

1. **Builder mjs continua produzindo o SSOT.** A nova camada DDD em `src/domain/rules/` + `src/app/services/RulesEngine.ts` é leitora-tipada do `rules.json` (consome o artefato já compilado). A migração do parser markdown para TS (AST-first) só fará sentido junto com `RuleExtractor` do PR3 — manter o mjs como SSOT até lá; abrir débito formal para essa transição quando 3.B começar.
2. **Compatibility ponteiros: scripts/docs externos.** Foram atualizados os comentários em código (`cli/features/opt-in/editorial/test-helpers.mjs`, `cli/features/core/budget-report.mjs`) e o cross-ref interno de `top/agents-core.md`. Specs históricas (`.specify/specs/0008|0015|0016|0017|0018|0019`) ainda referenciam `opt-in/methodologies/` e `opt-in/quality/` no texto — registro como débito **documental** a ser tratado em 2.D / 4.C (cleanup holístico). Não afeta builder/runtime/CI.
3. **Boundary Lock por regex revisitado.** O novo bounded context não introduz carga dinâmica de módulos. A migração para AST (débito 3 da Fase 1) permanece com gatilho em PR3 conforme `ARCHITECTURE.md` §D — sem urgência adicional.
4. **`OPT_IN_FEATURE_LAYOUT` é mapa estático.** Toda nova `opt_in_feature` adicionada ao runtime mjs precisa de entry correspondente em `src/domain/rules/ruleZone.ts` antes do build, senão `scopeToZone` lança `RULE_OPT_IN_UNKNOWN_FEATURE`. Aceito como acoplamento intencional (forçar reflexão de zona para cada feature nova); revisitar se passar de 10 entries.
5. **`RulesCompilation`/`RulesProjection` não consomem `rules.json` real ainda.** Os testes usam `RulesCatalogSource` em memória; `RulesTopologyConsistency.test.ts` é quem amarra ao artefato real lendo `readFileSync` direto (esquiva da DI). Coverage do `JsonRulesCatalogSource` permanece em 0%. Adicionar suite end-to-end fica como follow-up barato. _Revisitado em `[2.C-sanitize]` (2026-05-10): mantido como débito; resolução em 2.D ou PR3 com living-docs._

#### Sub-bloco 2.C-sanitize (Auditoria pré-2.D) — registrado em 2026-05-10

1. **Auditoria DDD executada.** Doc completo em [`./audit-2026-05-10-pre-2d-sanitization.md`](./audit-2026-05-10-pre-2d-sanitization.md). Achado bloqueador (policy virtual incompleta — só `proposal` era validada) corrigido; drift de contagem de pilares (6 → 7) reconciliado em `plan.md` e `decision-brief.md` A02; `tasks.md` 1.C.5 e PR1 PR-MGMT marcados retroativos; `ARCHITECTURE.md` §E.3 ganhou explicação da inversão de ordem `Register`/`Promote`; helper puro `assertRegistryImmutables` extraído para `src/domain/registry/integrity.ts` (consumido por `InMemoryRegistry` e `GovernanceRegistryStore`).
2. **Pillars.test.ts ganhou suite parametrizada** cobrindo os 3 virtual kinds (`proposal`/`patch`/`fix`) com o novo código `POLICY_VIRTUAL_REJECTS_WORKSPACE`. O código antigo `POLICY_PROPOSAL_MUST_BE_VIRTUAL` deixou de ser emitido (sem release pública dependendo dele — pre-1.0).
3. **Nenhum débito novo aberto.** Achados pequenos (B5/B6/C-series) ou são oportunismo sem dor real (não tocar agora) ou viraram débitos já existentes atualizados com referência à auditoria.

#### Sub-bloco 2.D (Superfície publicada + contrato `.governance/`) — registrado em 2026-05-10

1. **Débito 2.A.5 fechado.** Deprecation plan formalizado via contrato `.governance/` declarado em `ARCHITECTURE.md` §C invariante 12 + §H reservas canônicas. Cutover técnico para PR4.
2. **Docs / help legados ainda apontam para `.ai-guidelines/` no consumidor.** Honesto-por-design — a CLI mjs ainda escreve lá. Sites afetados que **descrevem o estado atual**: `cli/cli/args.mjs` `printHelp` (linha `--prune Remove arquivos órfãos em .ai-guidelines/`), `docs/cli/ai-guidelines-cli.md` (BR-CLI-EDITORIAL-02 etc.), `AGENTS.md` § Consumer Bootstrap, `README.md` § modo `mirror`. **Não trocar agora** — viraria mentira. Migração coordenada em PR4 com o cutover da engine.
3. **Specs históricas referenciam `opt-in/methodologies/` e `opt-in/quality/` no texto** (`.specify/specs/0008|0015|0016|0017|0018|0019`). Débito documental herdado de 2.C; manter no escopo de **4.C (cleanup holístico)** — não é honesto reescrever specs já mergeadas, e elas têm valor histórico.
4. **`RESERVED_GOVERNANCE_DIRS` ganha drift guard.** `ReservedDirsContract.test.ts` em `src/domain/workspace/` valida o conjunto exato `[intake, handoff, telemetry]`. Alterar o conjunto sem revisar `ARCHITECTURE.md` §H e `docs/cli/ai-guidelines-cli.md` faz o pipeline cair.

### Débitos da Fase 3 (Living Documentation + Engine)

#### Sub-bloco 3.0 (Saneamento de Fundação pré-TDD) — registrado em 2026-05-11

1. **Renomeação `exploration` → `spike` aplicada.** Auditoria MECE pré-PR3 detectou colisão do nome `exploration` com vocabulário Product Discovery AI-first 2026. `spike` é canônico em XP/Scrum desde 1999 e adotado em JIRA/Linear/GitLab/GitHub Issues. Semântica do pilar preservada (investigação técnica time-boxed: PoC, prototype, estudo). Aplicação tocou: domínio (`src/domain/shared/types.ts`, `src/domain/work-item/WorkItem.ts`), testes (`Pillars.test.ts`, `Isolation.test.ts`), e 5 docs canônicas (`decision-brief.md`, `plan.md`, `spec.md`, `tasks.md`, `ARCHITECTURE*.md`). Pipeline 130 passed/15 skipped sem regressão. Pesquisa: [`../researchs/governance/2026-05-11-mece-taxonomy-and-adr-audit.md`](../researchs/governance/2026-05-11-mece-taxonomy-and-adr-audit.md). ADR: [`.core/governance/adrs/0001-taxonomy-mece-pillars.md`](../../../.core/governance/adrs/0001-taxonomy-mece-pillars.md).
2. **5 ADRs fundacionais Aceitas em `.core/governance/adrs/`.** Lar canônico antecipado (consolidação `/adrs/` → `.core/governance/adrs/` fica para PR4 / 4.B.5). ADRs cobrem: taxonomia MECE de pilares (0001), outcomes como enums fechados (0002), bypass auditável de contratos de CI (0003), análise estática AST como SSOT (0004), separação validação semântica vs estética (0005). Critério editorial "ADR é princípio perene, não revisitação datada" formalizado no README do diretório.
3. **Auditoria das ADRs legadas em `/adrs/` marcada como preliminar.** Parte 2 do research MECE foi escrita antes do critério editorial; reclassificações finais (caminhos a/b/c por ADR) acontecem em PR4 / 4.B.4 com critério atualizado.
4. **Critério editorial "ADR é princípio perene" tornou-se runtime agnóstico de agente.** Regra `[CORE-15]` em [`.core/rules/top/agents-core.md`](../../../.core/rules/top/agents-core.md) com pointer para SSOT detalhada em [`.core/governance/adrs/README.md`](../../../.core/governance/adrs/README.md). Cross-ref bidirecional consolidado. Memória local do Claude Code apagada (repo é fonte canônica; sem duplicação por-agente).
5. **Débito aberto — auditoria estrutural de `.core/rules/top/`.** Durante o saneamento 3.0, observou-se que a fronteira `agents-core.md` (workflow operacional do agente, CORE-\*) vs `global-rules.md` (princípios de engenharia do código, GR-\*) faz sentido em **escopo**, mas o **naming confunde** ("agents-core" pode soar como definição do que é um agente; "global rules" pode parecer "as mais importantes"). Auditoria proposta para PR4 / sub-bloco 4.B (que já trata fronteira foundation/ADR e reescrita do README das ADRs). Escopo: avaliar (a) renomear arquivos para nomes mais auto-explicativos; (b) consolidar README em `.core/rules/top/` documentando a fronteira; (c) avaliar se a zona "top" não deveria ter sub-zonas (operacional vs engenharia vs editorial).

#### Sub-bloco 3.A (LivingDocumentation: schema + versioning + determinismo) — registrado em 2026-05-11

1. **Schema v0 do LivingDocumentation entregue** em `src/domain/living-docs/`. Tipos puros: `LivingDocsEntry` (com `coverageState` enum fechado e bloco `bypass` opcional), `LivingDocsArtifact` (com `schemaVersion` em conjunto frozen). Funções: `assertValidEntry`, `assertValidArtifact`, `canonicalizeArtifact`. Aplica ADR 0002, 0003 e 0004. 34 testes novos sob 3 suites (`Schema`, `Determinism`, `Versioning`); pipeline 176 passed/15 skipped sem regressão. Boundary preservado: domain puro, sem IO.
2. **Anti-objetivo respeitado.** Migration framework v0→v1 NÃO foi implementado — só política (frozen set + ADR de extensão). Implementação real só quando v1 existir.
3. **Débito 4 (glossário sem enforcement) permanece.** Schema do living-docs não cruza glossário arquitetural diretamente. Revisar quando AST extractor em 3.B puder cruzar `boundedContext`/`domain` com termos do `ARCHITECTURE-REFERENCE` §5.
4. ~~**Bypass directive declarada em ADR 0003 não está implementada como parser.**~~ **Resolvido em 3.C.3a (2026-05-11):** parser puro entregue em `src/domain/living-docs/BypassDirective.ts`. Reconhece `<guard-id>:allow-drift until=YYYY-MM-DD ref=ID reason="..."` com validações estritas + integração ao `TypeScriptRuleExtractor`. Aceita qualquer `expectedGuardId` (não-hardcoded a living-docs).

#### Sub-bloco 3.B (AST extractor: descoberta + source map + false positives) — registrado em 2026-05-11

1. **RuleExtractor entregue em duas camadas:** port em `src/app/ports/RuleExtractor.ts` (interface fina) + adapter `TypeScriptRuleExtractor` em `src/infrastructure/ast/` usando TypeScript Compiler API raw. Boundary preservado: package `typescript` só importável sob `src/infrastructure/ast/`. Aplica ADR 0004.
2. **Filtro de false positives é estrutural por construção** — o walker só inspeciona `arguments[0]` de `it`/`test`/`.skip` em arquivos `.test.ts`. IDs em comentários (JSDoc, inline), strings de produção (`console.log`, atribuição), arquivos `.fixture.ts`/`.ts` comuns, template literals com interpolação, e prefixos não-canônicos são todos ignorados sem erro. 11 testes negativos congelam essa invariante.
3. **Coverage semantics derivada sintaticamente.** `it`/`test` → `covered`; `.skip` → `pending`. `deprecated` virá em 3.C com o parser de diretiva de bypass.
4. **Débito 3 da Fase 1 (Boundary Lock por regex) revisitado.** O TS Compiler API agora está instanciada e em uso pelo extractor — migração natural do `Boundaries.test.ts` para AST tornou-se viável. Fica como sub-débito de PR4 / 4.B (não bloqueia 3.C/D/E/F).
5. **`describe.skip`/`describe.only` reconhecidos.** O extractor extrai a label do describe mesmo quando há modificador, garantindo que tags não regridam quando a suite é parcialmente desabilitada.
6. **Convenção de path estável.** `boundedContext` é o terceiro segmento (`src/<layer>/<bc>/...`); `domain` é o nome do arquivo sem `.test.ts`. Convenção é parte do contrato — mudança de layout exige atualização paralela no extractor (e teste regressão `RuleExtractorSourceMap`).

#### Sub-bloco 3.C (Drift guard: parser de bypass + generate + check) — registrado em 2026-05-11

1. **Parser de bypass directive entregue** em `src/domain/living-docs/BypassDirective.ts` (ADR 0003). Função pura `parseBypassDirective(text, { todayIso, expectedGuardId })` reconhece sintaxe canônica `<guard-id>:allow-drift until=YYYY-MM-DD ref=ID reason="..."` com validações estritas (data ISO, expiração estrita, reason ≥ 8 chars). Integrado ao `TypeScriptRuleExtractor` para enriquecer entries com `coverageState=deprecated` + bloco `bypass`. **O mesmo parser serve a qualquer guard futuro** (boundary-lock, schema-check) — só muda o `expectedGuardId`.
2. **Use cases `GenerateLivingDocs` e `CheckLivingDocs`** em `src/app/use-cases/`. Generate orquestra extractor → canonicalize → assertValidArtifact. Check regenera e compara byte-a-byte com `committedYaml` lido pelo caller. Diff legível mínimo emitido em caso de divergência.
3. **Novo port `LivingDocsSerializer`** em `src/app/ports/` (type alias function). Preservou boundary `app → infra` que `CheckLivingDocs` ia violar (test detectou). Composition root injeta `serializeLivingDocs` da infra.
4. **Entrypoint CLI** em `src/cli/livingDocs.ts` exportando `runGenerate`, `runCheck`, `discoverTestFiles`. Auto-execution via `import.meta.url` removido (incompatível com `ts-jest` config atual); migrar para `cli/living-docs.mjs` quando o débito de build for resolvido.
5. ~~**Bin físico + yarn scripts bloqueados por TS6133 em `ruleZone.ts`.**~~ **Resolvido em camadas (2026-05-11):** (i) `chore(spec-0021): remove import nao-usado em ruleZone.ts` destravou `yarn build`; (ii) `feat(spec-0021): drift guard end-to-end verde + bin físico (1 it = 1 rule)` materializou `cli/living-docs.mjs` (Windows-compatible via `pathToFileURL`). Bin físico + execução e2e validados — `node cli/living-docs.mjs generate` retorna exit 0 e produz `.governance/living-docs.yml` com 148 entries. **Falta apenas:** yarn scripts (`living-docs:generate`/`:check`) + decisão de versionar baseline + integração CI — todos escopo de `[3.C.4]`.
6. ~~**Integração CI depende do bin.**~~ **Bin destravado**, mas job CI dedicado (`yarn living-docs:check`) ainda não foi adicionado a `ai-guidelines-ci.yml`. Trabalho trivial (~5 linhas), escopo de `[3.C.4]`.
7. **Nenhum falso-positivo conhecido do drift guard.** Testes `CheckLivingDocs.test.ts` (7) + `livingDocs.test.ts` (8) congelam comportamento estrutural (drift detectado quando esperado; in-sync quando esperado; idempotência byte-a-byte).
8. **ADR 0003 §1 confirmada na prática.** A sintaxe `<guard-id>:allow-drift` foi adotada genericamente (não hardcoded para `living-docs`). Quando o boundary lock migrar para AST (débito Fase 1 #3), o mesmo parser absorve a diretiva `// boundary-lock:allow-drift ...` mudando só o `expectedGuardId`.
9. ~~**Gate de design — agregação por ruleId no Living Docs.**~~ **RESOLVIDO em `[3.C.4-prep]` (2026-05-11).** Auditoria [`./audit-2026-05-11-pre-3c4-living-docs-aggregation.md`](./audit-2026-05-11-pre-3c4-living-docs-aggregation.md) cravou Opção (C). 4 commits TDD atômicos entregaram (a) schema v0 in-place com `evidence: LivingDocsSource[]` plural, (b) `canonicalizeArtifact` agregando por ruleId com fusão determinística de coverageState e bypass convergente, (c) extractor agrupando intra-arquivo, (d) guard estrutural "1 it = 1 rule" + bin físico + e2e verde. **5 erros estáveis** novos honram ADR 0002 §4 (sem fallback silencioso): `LIVING_DOCS_INVALID_EVIDENCE`, `LIVING_DOCS_INCONSISTENT_DEPRECATION`, `LIVING_DOCS_BYPASS_DIVERGENT`, `LIVING_DOCS_RULE_CROSS_FILE`, `LIVING_DOCS_AMBIGUOUS_RULE_ID`. Pipeline: 290 passed (+28 novos desde 3.C), 0 regressão. End-to-end: `node cli/living-docs.mjs generate` produz `.governance/living-docs.yml` com 148 entries, idempotência byte-a-byte confirmada via MD5.
10. **Sub-débitos candidatos para `[3.C.aux]` paralelo (auditoria 2026-05-11).** Dois débitos baratos (~1-2h cada) que aproveitam a tooling AST/store em foco: **2.B.4** (RegistryService coverage abaixo de update/remove/load/save + autosave:false nunca testado) e **2.C.5** (`JsonRulesCatalogSource` em 0% coverage). Não bloqueio; pegar em paralelo só se houver folga. Owner decide.
11. **Dívida invisível encontrada pelo drift guard (2026-05-11).** Living Docs encontrou três classes de dívida que vinham desde PR1/PR2 e nenhuma outra ferramenta detectava:
    - **8 sites usando `BR-CLI-POLICY-01` como guarda-chuva** para 6 invariantes distintas (`DENSE_REQUIRES_WORKSPACE`, `VIRTUAL_REJECTS_WORKSPACE`, `PATCH_REJECTS_EXPERIMENT_FIELDS`, `TITLE_TOO_SHORT`, `PROPOSAL_NOT_MATURE`, `MAINTENANCE_NOT_PROMOTABLE`) em `Pillars.test.ts` + `Promotion.test.ts`. **Corrigido em `[3.C.4-prep]`** sequenciando para POLICY-04..08.
    - **2 sites usando `BR-CLI-POLICY-03`** para regras semanticamente distintas (`EXPERIMENT_REQUIRES_HYPOTHESIS` vs `EXPERIMENT_NOT_WON`). **Corrigido** renomeando o segundo para POLICY-09.
    - **4 títulos de teste em `AstRuleExtractor.test.ts`** com tags `[BR-CLI-X-01]` citadas no meio + ID real no final → ambiguidade estrutural. **Corrigido** substituindo as citações por placeholders `<fixture-id>` + adicionando guard `LIVING_DOCS_AMBIGUOUS_RULE_ID` que torna recorrência impossível.
12. ~~**Bug do extractor — `it.each`/`test.each` não reconhecidos.**~~ **RESOLVIDO em `[3.C.4-prep-fix]` (2026-05-11, commit `e88b9af`).** TDD red→green em commit único: `classifyTestCall` ganhou cláusula para `CallExpression` aninhado cujo expression interno é `PropertyAccessExpression(it|test, each)`. Validação e2e: YAML subiu de 148 → 157 entries; 7 ruleIds antes invisíveis agora presentes (`POLICY-01`, `POLICY-04`, `POLICY-08`, `LIVING-DOCS-SCHEMA-02/03/04`, `LIVING-DOCS-VERSIONING-04`). 292 passed (+2 novos), idempotência byte-a-byte preservada (MD5 `4fd426fa...`).

_(A preencher conforme execução do restante da Fase 3)_

### Débitos da Fase 4 (Consolidação)

_(A preencher conforme execução)_

---

## 💡 Insights e Descobertas

### Evolução do Boilerplate de `tasks.md`: quando e como quebrar em múltiplas PRs (Harness Lock)

**Contexto:** A Spec 0021 mostrou que “uma PR por spec” não escala quando o trabalho altera contratos críticos (paths/root, SSOT, engine/runtime) e exige validação humana por checkpoints. Sem um critério explícito, o repositório tende a dois extremos ruins: **mega-PRs irrevisáveis** ou **micro-PRs com churn**.

**Proposta (melhoria do boilerplate):** adicionar ao boilerplate um bloco canônico **“PR Strategy Decision”** que determine, de forma objetiva, se a spec exige Harness Lock (múltiplas PRs) e quantas PRs são recomendadas.

#### 1) Critérios objetivos para recomendar quebra em PRs (gate)

> Regra sugerida: **se 2+ critérios abaixo forem verdadeiros, a spec deve usar Harness Lock (≥3 PRs)**.

- **Mudança de contrato do consumidor** (paths/root, comandos, publish surface, smoke).
- **Migração/compatibilidade** (Strangler Fig, bridges, precedence, rollback, deprecation).
- **Novo SSOT ou mudança de storage** (registry estruturado, schema, determinismo de serialização).
- **Re-arquitetura de runtime/CLI** (DDD + TDD/BDD, bounded contexts novos).
- **Mudança de topologia interna crítica** (ex.: reorganização de `.core/rules/` impactando builder/runtime/CI).
- **Introdução de engine “inteligente”** (AST extraction/living docs, template engine por composição).
- **Diff estimado alto** (heurística: >2000 LOC, ou tocando múltiplas superfícies core: CI + runtime + docs + publish).

#### 2) Como sugerir o número de PRs (dimensionamento simples)

- **1 PR**: mudanças pequenas/localizadas, sem contrato do consumidor, sem migração, sem engine/runtime.
- **3 PRs (mínimo Harness Lock):**
  1. Domain/Contracts
  2. Topology/Migration
  3. Consolidation/Docs/Smoke
- **5 PRs (modelo tipo 0021)** quando houver simultaneamente **mudança de contrato + migração + engine/runtime**:
  1. **Domain Memory Foundation** (DDD core, sem IO real)
  2. **Topology Migration Layer** (Strangler Fig + builder/runtime)
  3. **Executable Intelligence Runtime** (Living Docs + Template Engine)
  4. **Governance Consolidation** (carrier/placement + foundation/ADR + cleanup)
  5. **Final Homologation** (smoke/tarball/ambiente real) — opcional conforme risco

#### 3) Contrato obrigatório por PR (Harness Lock)

Quando Harness Lock for recomendado, o boilerplate deve exigir que cada fase inclua no `tasks.md`:

- `[PR-MGMT.NEW-BRANCH]` (branch canônica)
- `[PR-MGMT.DESCRIPTION]` (template em 6 seções: decisões/domínios/invariantes/riscos/rollback/validação)
- `[PR-MGMT.REVIEW-GATE]` (pipeline verde + aprovação humana)
- `[PR-MGMT.MERGE-CHAIN]` (comandos obrigatórios)

**Benefício:** o `tasks.md` deixa de ser apenas lista de tarefas e passa a operar como **contrato executável**: define quando quebrar PRs, reduz risco de mega-PR irrevisável, elimina micro-PR churn, e preserva gates humanos (CORE-12/14).

_(Sem novos insights registrados nesta sessão)_
