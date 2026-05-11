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

1. **2.A.5 — Deprecation plan do legado não definido.** Quando parar de ler `.specify/` / `.ai-guidelines/`? Como comunicar (warnings determinísticos, schedule)? Decisão de produto pendente; bloqueia retirada formal do legado em PR4.
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

### Débitos da Fase 3 (Living Documentation + Engine)

### Débitos da Fase 3 (Living Documentation + Engine)

_(A preencher conforme execução)_

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
