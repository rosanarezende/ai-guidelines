# Governance Runtime — Architecture Reference

> **Escopo:** este documento descreve a arquitetura do runtime **governance-driven** entregue pela CLI `ai-guidelines`. Cobre runtime, bounded contexts, invariantes, policy composition, modelagem de domínio e roadmap. Não é "documentação interna do `src/`" — é a referência canônica do contrato governance-driven do projeto.
>
> **Localização:** `.core/governance/ARCHITECTURE.md`. O arquivo vive ao lado de `.core/process/spec-foundation.md` porque descreve o **runtime de governança** do framework, não detalhes de pasta.
>
> **Status:** vivo. Atualizado a cada PR da Spec 0021. Decisões estáveis migram para ADRs; este documento permanece como descrição operacional da arquitetura corrente + roadmap.
>
> **Âncoras:** `[DEC-0021-A01]`, `[DEC-0021-A02]`, `[DEC-0021-A03]`, `[DEC-0021-C01]`, `[DEC-0021-D01]` (ver `decision-brief.md` da Spec 0021).

---

## A — Visão geral

O runtime de governança é um motor **policy-first** que materializa, na CLI `ai-guidelines`, o contrato entre os 7 pilares de valor (`spec`, `exploration`, `fix`, `patch`, `incident`, `proposal`, `experiment`) e a topologia física do repositório consumidor.

Princípios arquiteturais:

1. **Governance-driven runtime.** O comportamento da CLI é ditado por políticas explícitas no domínio, não por convenções implícitas em scripts.
2. **Repo-first.** O repositório é a memória canônica. Não há banco, dashboard ou estado vivo fora do repo `[DEC-0021-A01]`.
3. **Tests-as-SSOT.** Os testes (`*.test.ts`) são a documentação executável das regras de negócio (`[BR-CLI-*]`); o PR3 derivará deles um artefato `living-docs.yml` versionado.
4. **DDD + TDD/BDD.** O domínio é puro; aplicação orquestra via ports; infraestrutura só aparece atrás de adaptadores. RED → GREEN → REFACTOR é o fluxo padrão `[DEC-0021-C01]`.
5. **Policy-first orchestration.** Nenhum side-effect (registry, filesystem) acontece sem que a policy aprove o draft/promoção primeiro.
6. **Composição atômica.** Templates e topologias são compostos de partials/recipes, não espelhados a partir de monolitos `[DEC-0021-D01]`.
7. **Composição de policies.** Não existe "God Service" central de governança. `GovernancePolicies` é uma fachada fina que **compõe** funções puras especializadas (uma por eixo de decisão) — adicionar um eixo novo significa criar um módulo novo, não inflar a fachada.

---

## B — Bounded contexts

### B.1 Implementados (PR1)

| Contexto           | Pasta                 | Responsabilidade                                                                                                                                                                             | Pode conhecer                         | NÃO pode conhecer                                                 |
| ------------------ | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| **Domain**         | `src/domain/`         | Modelo do mundo: entidade `WorkItem` (discriminated union Dense/Virtual), invariantes por pilar, políticas puras de promoção, registry SSOT em memória. Funções determinísticas, sem efeito. | Apenas outros módulos do `domain/`    | `app/`, `infrastructure/`, Node APIs (`fs`, `path`, `process`)    |
| **Application**    | `src/app/`            | Orquestração de casos de uso (`RegisterWorkItem`, `PromoteWorkItem`). Garante atomicidade e ordem (policy → registry → workspace). Tudo via ports.                                           | `domain/`, `app/ports/`               | `infrastructure/` direto, qualquer IO concreto                    |
| **Infrastructure** | `src/infrastructure/` | Adaptadores técnicos (filesystem, YAML, processos). Nenhuma implementação real ainda — apenas blueprints (testes em skip) que congelam o contrato do PR2.                                    | `domain/`, ports do `app/`, Node APIs | Conhecer use cases por dentro; chamar outras infras circularmente |

### B.2 Reservados / futuros

| Contexto                 | Status    | Quando       | Responsabilidade prevista                                                                                                                                        |
| ------------------------ | --------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GovernanceWorkspace**  | Reservado | PR2 (Fase 2) | Resolver `.governance/` como root unificado, aplicar precedência sobre legados, executar migração idempotente, expor estado para a Application `[DEC-0021-A03]`. |
| **Registry (YAML SSOT)** | Parcial   | PR2 (Fase 2) | Persistir o registry em `registry.yml` com determinismo, schema guard, imutabilidade e estratégia explícita de preservação de comentários `[DEC-0021-A01]`.      |
| **RulesEngine**          | Reservado | PR2 (Fase 2) | Alinhar topologia física `.core/rules/` com builder/runtime; pipelines de parse, build, projection e lookup.                                                     |
| **LivingDocumentation**  | Reservado | PR3 (Fase 3) | Extrair `[BR-CLI-*]` via AST, gerar artefato determinístico, expor drift guard no CI `[DEC-0021-C01]`.                                                           |
| **TemplateEngine**       | Reservado | PR3 (Fase 3) | Recipes + partials, montagem por slots, validação estrutural de Markdown `[DEC-0021-D01]`.                                                                       |

Cada contexto futuro deve aparecer como subdiretório explícito quando nascer e ser documentado aqui antes de ganhar IO real.

---

## C — Invariantes arquiteturais

Estas invariantes são contrato; quebrá-las é um erro de design, não de estilo. O Blueprint Integrity Lock (ver §D) detecta as duas primeiras automaticamente.

1. **Domain é puro.** `src/domain/**` jamais importa `src/app/**` nem `src/infrastructure/**`. Nada de `node:fs`, `node:path` ou variáveis de ambiente no domínio.
2. **Application via ports.** `src/app/**` jamais importa `src/infrastructure/**` direto. Toda comunicação atravessa um port declarado em `src/app/ports/**`.
3. **Policy-first.** Nenhum use case toca registry ou workspace antes de a policy aprovar o draft/promoção. O caso negativo é parte dos blueprints (`RegisterItem.test.ts`).
4. **Atomicidade bilateral.** Falha em criar workspace ⇒ rollback do registry. Falha em persistir registry ⇒ rollback do workspace já criado. Blueprints garantem ambos os sentidos.
5. **Registry é SSOT lógica.** No PR1 vive em memória; no PR2 vira `registry.yml`. Em ambos os modos: IDs únicos, `id` e `createdAt` imutáveis, `updatedAt` controlado pelo Clock, listagem determinística.
6. **WorkItem é discriminated union.** `WorkItem = DenseWorkItem | VirtualWorkItem`, discriminado por `kind`. Combinações inválidas (ex.: `severity` em `proposal`, `workspacePath` ausente em `spec`) são rejeitadas por construção/policy — não por convenção.
7. **YAML ainda não existe.** PR1 não introduz parsing/escrita de YAML. Qualquer teste que dependa de IO real está em `it.skip` com `[SKIP-REASON]` apontando para PR2/PR3.
8. **Anti-drift é objetivo estrutural.** Tudo que precisa permanecer alinhado entre código e documentação tem (ou terá) um teste que falha quando divergir — boundaries hoje, living docs no PR3.

---

## D — Boundary enforcement

Implementado em `src/test-utils/Boundaries.test.ts`.

**Como funciona hoje (provisório):**

- Lista todos os `.ts` de produção sob `src/` (testes excluídos).
- Extrai imports relativos via regex (`import … from "…"`).
- Resolve cada destino e classifica origem/destino em `domain | app | infra | other`.
- Falha se houver aresta `domain → app|infra` ou `app → infra`.

**Limitações conhecidas:**

- Não cobre `import("…")` dinâmico nem `require()`.
- Não acompanha re-exports indiretos cross-camada.
- Imports de pacote/stdlib não são classificados (boundaries são entre camadas próprias).
- Regex pode ter falso-negativo em casos exóticos (multi-linha incomum); o estilo do código mantém os imports dentro do reconhecível.

**Roadmap obrigatório.** Esta verificação **deve** migrar para análise via **TS Compiler API / dependency graph (AST)** **antes** de:

- introdução de extensões/plugins runtime;
- carregamento dinâmico de módulos (PR3+ quando `TemplateEngine` resolver recipes/partials por path dinâmico);
- qualquer mecanismo de discovery que monte o grafo de imports em runtime.

Motivo: regex-scan opera sobre o source estático em texto. No momento em que módulos forem carregados dinamicamente (ou re-exportados por barrel files plugáveis), a verificação textual passa a ser **falsamente verde** — a aresta proibida existe em runtime, mas não aparece no source. O dependency graph baseado em AST resolve simbolicamente, capturando o grafo real e fechando essa janela de drift.

A migração natural acontece junto com o pipeline AST do `LivingDocumentation` (PR3), que já vai exigir TS Compiler API instanciada. Antes disso, a regra **não pode** ser desligada nem afrouxada.

---

## E — Modelagem de domínio

### E.1 Pilares MECE `[DEC-0021-A02]`

Sete `WorkItemKind`, mutuamente exclusivos, exaustivos quanto à intenção de saída — particionados em **duas categorias semânticas**:

| Categoria | Kinds                                           | Workspace físico  | Tipo TS           |
| --------- | ----------------------------------------------- | ----------------- | ----------------- |
| Dense     | `spec`, `experiment`, `exploration`, `incident` | Sim (obrigatório) | `DenseWorkItem`   |
| Virtual   | `proposal`, `patch`, `fix`                      | **Proibido**      | `VirtualWorkItem` |

Invariantes específicas por `kind` (centralizadas em `WorkItemPolicy.assertValidDraft`):

- `spec`: exige `workspacePath` (via `POLICY_DENSE_REQUIRES_WORKSPACE`).
- `experiment`: exige `hypothesis` (≥10 chars) + ≥1 `successMetrics` + `workspacePath`.
- `exploration`: exige `workspacePath`; foco em aprendizado/arquivamento.
- `incident`: exige `severity` + `workspacePath`.
- `proposal`: virtual; rejeita `workspacePath`; promoção exige maturidade.
- `patch`: virtual; rejeita campos experimentais (`hypothesis`/`successMetrics`) **e** de incidente (`severity`).
- `fix`: virtual; manutenção rastreada sem burocracia de spec.

Constantes de medida (`TITLE_MIN`, `HYPOTHESIS_MIN`) vivem em `WorkItemPolicy.PILLAR_INVARIANTS`.

### E.2 Por que discriminated union (e não inheritance OO)

A entidade central é uma **discriminated union** sobre `kind`:

```ts
type WorkItem = DenseWorkItem | VirtualWorkItem;
```

Decisões de design:

- **`workspacePath` é obrigatório em `DenseWorkItem`** — a categoria carrega a promessa de par físico; um `spec` sem `workspacePath` não é um `spec` defeituoso, é um item que não devia existir.
- **`VirtualWorkItem` não declara campos densos.** Não é só "policy diz que não pode" — o tipo simplesmente não tem `workspacePath`/`severity`/`hypothesis`. A combinação é typed-out por construção.
- **Campos "nicho" (hypothesis, severity, ...) seguem opcionais em `DenseWorkItem`** porque seriam exigidos só em alguns dense kinds (`experiment` exige hypothesis; `incident` exige severity). A política tightening fica em `WorkItemPolicy`, não no tipo — explodir em quatro subtipos densos seria abstração vazia neste estágio.
- **Sem hierarquia OO** — sem classe abstrata, sem herança. Type guards (`isDenseItem`, `isVirtualItem`) bastam para narrowing; o ganho de rigor vem do union, não de inheritance.

### E.3 Promotion semantics

- `proposal → spec`: requer `status ∈ {review, done}` e `workspacePath` definido. Patch resultante: `kind = spec`, `status = in-progress`.
- `experiment → spec` (Shape-up): requer `outcome === 'won'` e `workspacePath`. A nova spec **herda** `hypothesis` e `successMetrics` para preservar linhagem.
- `patch | fix | incident`: ciclo fechado. Nenhuma promoção é permitida (`POLICY_MAINTENANCE_NOT_PROMOTABLE`).

Toda decisão de promoção devolve um `WorkItemPatch` puro; aplicar ao registry e tocar workspace é responsabilidade do use case.

### E.4 Patch envelope

`WorkItemPatch` é o **envelope de mutação** consumido pelo registry e produzido pela `PromotionPolicy`. Não é um `WorkItem` válido por si só — é o delta a ser mesclado. Re-validação após merge é responsabilidade do caller. Aceita `id`/`createdAt` apenas para que o teste de imutabilidade do registry os exercite com mensagens determinísticas; valores divergentes do atual sempre lançam.

### E.5 Riscos de modelagem (vigilância)

| Risco                                       | Mitigação atual                                                                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| **God Entity** em `WorkItem`                | Particionada em `DenseWorkItem                                                                                                                   | VirtualWorkItem`; campos cruzados são impossíveis na variante errada. |
| **God Service** em `GovernancePolicies`     | Hoje é fachada fina (delega para `WorkItemPolicy.assertValidDraft` + `PromotionPolicy.promote`); o nome no plural reforça a regra de composição. |
| **Acoplamento por campos opcionais densos** | Validação por pilar (`assertValidDraft`) rejeita campos cruzados e exige presença mandatória; cada `code` tem teste dedicado.                    |
| **Drift de invariantes**                    | Constantes em `PILLAR_INVARIANTS`; mensagens carregam o número, blueprints conferem.                                                             |
| **Patch envelope wide**                     | Documentado como envelope de mutação; merge final é re-tipado para `WorkItem`; futuras tightening ficam no use case/registry.                    |

---

## F — Roadmap arquitetural

| PR  | Fase   | Foco                                                                                                                                                                | Estado      |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| PR0 | Fase 0 | Setup, research, decision-brief, gate humano                                                                                                                        | ✅ Merged   |
| PR1 | Fase 1 | DDD core (domain + policy + registry em memória) + use cases atômicos via ports + Boundary Lock + discriminated union (Dense/Virtual) + façade `GovernancePolicies` | 🚧 Atual    |
| PR2 | Fase 2 | `GovernanceWorkspace` (Strangler Fig sobre `.specify/` legado) + `Registry` YAML real + `RulesEngine`                                                               | ⏭️ Pendente |
| PR3 | Fase 3 | `LivingDocumentation` (AST + drift guard CI) + `TemplateEngine` (recipes/partials) + validação estrutural de Markdown + **migração do Boundary Lock para AST**      | ⏭️ Pendente |
| PR4 | Fase 4 | Consolidação: carrier híbrido + foundation/ADR + cleanup de docs/ponteiros + homologação                                                                            | ⏭️ Pendente |

PR3/PR4 só ganham diretórios em `src/` quando começarem; reservar nomes hoje seria abstração vazia.

---

## G — Linguagem ubíqua

Termos abaixo têm significado preciso no runtime; usar fora desse significado é divergência a corrigir.

| Termo                   | Definição operacional                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **WorkItem**            | Entidade central; **discriminated union** `DenseWorkItem                                                                                          | VirtualWorkItem`discriminada por`kind`. |
| **DenseWorkItem**       | Variante de WorkItem para `spec                                                                                                                   | experiment                              | exploration                                                                | incident`. `workspacePath`obrigatório. Tem par físico em`.governance/` (a partir do PR2). |
| **VirtualWorkItem**     | Variante de WorkItem para `proposal                                                                                                               | patch                                   | fix`. Sem `workspacePath` por construção; nenhum IO de workspace é gerado. |
| **WorkItemDraft**       | DTO de entrada para criação de um `WorkItem`; sem timestamps, sem id obrigatório no input do use case.                                            |
| **WorkItemPatch**       | Envelope estrutural de mutação consumido por `RegistryStore.update` e produzido por `PromotionPolicy`.                                            |
| **WorkItemPolicy**      | Política pura que valida um draft contra os invariantes do seu pilar (`assertValidDraft`).                                                        |
| **PromotionPolicy**     | Política pura que decide se/como um item pode ser promovido entre pilares e devolve o `WorkItemPatch` a aplicar.                                  |
| **PromotionPatch**      | Alias semântico de `WorkItemPatch` no contexto de promoção.                                                                                       |
| **GovernancePolicies**  | Fachada fina (não-God) que compõe as políticas puras (`validateNewItem`, `promote`). Plural intencional: novos eixos viram módulos plugados aqui. |
| **Registry**            | Coleção SSOT de WorkItems. PR1: `InMemoryRegistry`. PR2: `registry.yml` no `.governance/` do consumidor.                                          |
| **RegistryStore**       | Port (`src/app/ports/RegistryStore.ts`) através do qual a Application interage com o registry sem depender da implementação.                      |
| **WorkspaceStore**      | Port para criação/remoção física de pastas de itens densos. Sem implementação real no PR1; doubles em test-utils.                                 |
| **Clock / IdGenerator** | Ports utilitários para tempo e IDs determinísticos em testes. Implementações reais entram quando a CLI for ligada (PR2/PR3).                      |
| **Dense item**          | Item de pilar denso (`spec                                                                                                                        | experiment                              | exploration                                                                | incident`); use case cria pasta a partir de `workspacePath`.                              |
| **Virtual item**        | Item de pilar virtual (`proposal                                                                                                                  | patch                                   | fix`); use case garante zero IO no workspace.                              |
| **Promotion**           | Transição entre pilares regida pela `PromotionPolicy` (proposal→spec; experiment(won)→spec). Maintenance kinds não promovem.                      |
| **ResolutionMode**      | Modo de fechamento de um experimento perdido/inconclusivo (`cleaned-up                                                                            | kept                                    | pending`). Modelado para uso completo no PR2/PR3.                          |
| **GovernanceError**     | Erro de domínio com `code` estável (ex.: `POLICY_PROPOSAL_NOT_MATURE`). O `code` é a SSOT de mensagens em testes e UI.                            |
| **`[BR-CLI-*]`**        | Identificador estável de regra de negócio inscrita nos testes; futura entrada de `living-docs.yml` (PR3).                                         |
| **`[DEC-0021-*]`**      | Decisão arquitetural ancorada no `decision-brief.md` da Spec 0021; usada para rastreabilidade em código quando agrega valor documental.           |
| **LivingDocumentation** | Artefato derivado dos testes (PR3); fonte de verdade legível das `[BR-CLI-*]` ativas, com drift guard no CI.                                      |
| **Recipe**              | Declaração estrutural de um artefato (spec/plan/tasks/...) em termos de `slots` e `partials` (PR3, TemplateEngine).                               |
| **Partial**             | Fragmento Markdown autossuficiente, slot-addressable, usado por uma `Recipe` para montar um artefato final por composição atômica.                |
| **Composição atômica**  | Princípio: gerar artefatos por agregação determinística de partials, não por espelhamento de templates monolíticos `[DEC-0021-D01]`.              |

---

## H — Convenções de topologia

- **Diretórios em kebab-case:** `work-item/`, `use-cases/`, `test-utils/`. Pastas existentes que usavam camelCase foram migradas.
- **Arquivos em PascalCase quando exportam um tipo/classe principal** (`WorkItem.ts`, `PromotionPolicy.ts`, `InMemoryRegistry.ts`). Utilitários e barris ficam em camelCase (`doubles.ts`).
- **Um conceito por arquivo no domain.** `WorkItem.ts` (entidade union + tipos relacionados) ≠ `WorkItemDraft.ts` (DTO) ≠ `WorkItemPolicy.ts` (validação). Misturar os três é o que originou o God File evitado nas consolidações desta fase.
- **Sem pastas vazias.** Se uma camada futura ainda não existe, ela não é uma pasta vazia — é uma seção em §B.2 deste documento.
- **`.core/governance/`** hospeda artefatos de governança transversal (este documento). `src/` hospeda código.

---

## I — Como contribuir com a arquitetura

1. **Mudou um invariante de pilar?** Atualize `WorkItemPolicy` + blueprint correspondente + tabela §E.1.
2. **Adicionou uma promoção nova?** Atualize `PromotionPolicy` + blueprint + tabela §E.3.
3. **Adicionou um eixo de policy novo (lifecycle, archival, ...)?** Crie um módulo próprio em `domain/policy/`, plugue em `GovernancePolicies` como composição, documente em §B.1 / §G. **Não** infle a fachada com lógica nova.
4. **Criou um novo bounded context?** Documente em §B antes de criar a pasta; só depois crie o diretório.
5. **Quebrou intencionalmente um boundary?** Não. Reabra a discussão em decision-brief; este documento descreve o que está garantido, não o que está flexível.
