# GOVERNANCE-CATALOG.md — Carrier Canônico da Arquitetura de Informação

> **Âncoras:** `[DEC-0021-B02]` (reserva de lar canônico), `[DEC-0021-B03]` (carrier híbrido: catálogo curto + topologia física direcionada).
> **Detalhes técnicos densos** (bounded contexts, invariantes, glossário, códigos de erro): `ARCHITECTURE-REFERENCE.md`.
> **Decisões ancoradas:** `.specify/specs/0021-governance-information-architecture/decision-brief.md`.

Este documento responde a quatro perguntas operacionais:

1. **Que gêneros de trabalho existem** e como se distinguem? (§1)
2. **Onde mora cada coisa**, no mantenedor e no consumidor? (§2)
3. **Como achar a verdade** sobre estado, processo, regras, decisões e cobertura? (§3)
4. **Qual o ciclo de vida** de um artefato, e como a verdade estruturada vira narrativa? (§4)

§5 mapeia gêneros futuros já com lar reservado; §6 lista débitos de transição honestos (o repositório ainda não está 100% alinhado com a política — o catálogo descreve o destino e expõe a delta).

---

## 1 — Classes de gênero (7 pilares MECE)

Os 7 pilares são **mutuamente exclusivos e coletivamente exaustivos**. Todo trabalho rastreado deve caber em exatamente um. Definição runtime: `WORK_ITEM_KINDS` em `src/domain/work-item/WorkItem.ts`.

| Kind         | Classe  | Intenção                                                     | `workspacePath` | Campos obrigatórios extras     |
| :----------- | :------ | :----------------------------------------------------------- | :-------------- | :----------------------------- |
| `spec`       | Dense   | Trabalho formal e planejado com artefatos versionados        | Obrigatório     | —                              |
| `experiment` | Dense   | Hipótese de produto com métricas de sucesso e outcome        | Obrigatório     | `hypothesis`, `successMetrics` |
| `spike`      | Dense   | PoC, prototipagem ou estudo técnico time-boxed (aprendizado) | Obrigatório     | —                              |
| `incident`   | Dense   | Ocorrência operacional rastreada com severidade              | Obrigatório     | `severity`                     |
| `proposal`   | Virtual | Discussão ou proposta sem entregável físico                  | Proibido        | —                              |
| `patch`      | Virtual | Mudança de manutenção simples sem burocracia de spec         | Proibido        | —                              |
| `fix`        | Virtual | Correção rastreada de baixo custo                            | Proibido        | —                              |

**Promoções permitidas** (definidas em `src/domain/policy/PromotionPolicy.ts`):

- `proposal → spec` quando `status ∈ {review, done}` e `workspacePath` definido.
- `experiment → spec` quando `outcome === 'won'` e `workspacePath`; herda `hypothesis` e `successMetrics` para preservar linhagem.
- `patch`, `fix`, `incident`: **ciclo fechado** — nenhuma promoção permitida (`POLICY_MAINTENANCE_NOT_PROMOTABLE`).

**Por que MECE.** A taxonomia define classes mutuamente exclusivas (`spec` ≠ `incident` ≠ `experiment`) e coletivamente exaustivas (todo trabalho de valor cabe em um dos 7). Quando um item não cabe, a resposta correta é abrir ADR — não criar pilar novo de oportunidade. Critério formalizado em `.core/governance/adrs/0010-taxonomy-mece-pillars.md`.

---

## 2 — Paths canônicos

A política é **bilateral**: o repo do mantenedor (este) e o repo do consumidor (projeto que adota o framework) têm topologias distintas. O catálogo descreve as duas; a CLI traduz uma na outra.

### 2.1 No repo do mantenedor (este repositório)

| Path                                   | Responsabilidade                                                                                                                                                                              | Estado                                      |
| :------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------ |
| `AGENTS.md`                            | Runtime artifact compilado — entrypoint canônico para qualquer agente IA                                                                                                                      | Ativo                                       |
| `CLAUDE.md`, `GEMINI.md`               | Hard-redirects do provider para `AGENTS.md` (vide ADP-0101…0103)                                                                                                                              | Ativo                                       |
| `README.md`, `CONTRIBUTING.md`         | Documentação humana de entrada (não é runtime)                                                                                                                                                | Ativo                                       |
| `.core/`                               | Baseline canônico distribuível via CLI (`init`, `adopt`)                                                                                                                                      | Ativo                                       |
| `.core/governance/`                    | Artefatos de governança transversal: `ARCHITECTURE*.md`, **este catálogo**, `adrs/`, `recipes/`, `templates/partials/`                                                                        | Ativo                                       |
| `.core/governance/adrs/`               | **Lar canônico único** das ADRs globais. Hoje: 0003–0009 (legadas, preservam numeração) + 0010–0014 (locais PR3 renumeradas em 4.B.5).                                                          | Ativo                                       |
| `.core/governance/recipes/`            | Recipes YAML da TemplateEngine (composição modular)                                                                                                                                           | Ativo (PR3)                                 |
| `.core/governance/templates/partials/` | Partials Markdown atômicos compostos por recipes                                                                                                                                              | Ativo (PR3)                                 |
| `.core/process/`                       | Constituição operacional viva — `governance-foundation.md` (renomeado em 4.B.1)                                                                                                               | Ativo                                       |
| `.core/rules/`                         | Regras distribuídas: `top/` sempre injetado; `center/`, `base/` opt-in; `adapters/` por provider; `_meta/` derivado                                                                           | Ativo                                       |
| `.core/templates/`                     | Templates de infraestrutura distribuída (`AGENTS-core.md.tmpl`, `package.json.fragment.json`)                                                                                                 | Ativo                                       |
| `.specify/specs/`                      | `spec_workspace_dir` canônico — onde specs vivem (`[DEC-0021-A03]`)                                                                                                                           | Ativo                                       |
| `.specify/specs/roadmap/`              | Visão narrativa: `backlog.md` (candidatas) + `historico.md` (concluídas)                                                                                                                      | Ativo                                       |
| `.specify/specs/researchs/`            | Arquivo de pesquisas internas (`architecture/`, `governance/`, `oss/`)                                                                                                                        | Ativo                                       |
| `.specify/templates/`                  | Boilerplates de specs (boilerplate de `spec.md`, `plan.md`, `tasks.md`, etc.)                                                                                                                 | Ativo (cutover em 4.C.0 para recipes)       |
| `cli/`                                 | CLI mjs **em produção hoje** (`ai-guidelines-cli.mjs`, features, providers)                                                                                                                   | Ativo (cutover gradual para `src/` em PR4+) |
| `src/`                                 | Re-arquitetura DDD da CLI (PR1–PR3 da 0021) — ainda não plugada como entrypoint                                                                                                               | Ativo (paralelo)                            |
| `tests/`                               | Suíte canônica — `[BR-CLI-*]` é a SSOT da Living Documentation                                                                                                                                | Ativo                                       |
| ~~`adrs/`~~                            | ~~Legado — ADRs 0003–0009.~~ **Removido em 4.B.5 (2026-05-17)**: ADRs consolidadas em `.core/governance/adrs/` preservando numeração 0003–0009; locais PR3 renumerados 0001–0005 → 0010–0014. | ✅ Removido                                 |
| `docs/`                                | **Ilhas órfãs** — `ai-efficiency-guide.md`, `features.md`, `tdd-guidelines.md`, `rpi-protocol.md`, `process/`, `cli/`. Auditoria em **4.C.1**                                                 | Depreciado parcialmente                     |
| `docs/process/spec-foundation.md`      | Stub de redirect declarado pela 0018 — **removido por esta spec (4.C.1)**                                                                                                                     | A remover                                   |

### 2.2 No repo do consumidor

| Path                       | Responsabilidade                                                                           | Estado       |
| :------------------------- | :----------------------------------------------------------------------------------------- | :----------- |
| `.governance/`             | **Root canônico unificado** — declarado em `[DEC-0021-A03]`                                | Ativo (PR2+) |
| `.governance/registry.yml` | Estado primário estruturado (SSOT) — derivados nunca editados à mão                        | Ativo        |
| `.governance/intake/`      | Reservado — PRD/intake estruturado (`stakeholder-intake-pipeline`)                         | Reservado    |
| `.governance/handoff/`     | Reservado — contratos de handoff/decision logs (`handoff-contracts-formalization`)         | Reservado    |
| `.governance/telemetry/`   | Reservado — telemetria do framework (`framework-observability-dashboard`)                  | Reservado    |
| `AGENTS.md` (consumidor)   | Runtime compilado — bloco `<AI_GUIDELINES>` gerado pela CLI; conteúdo do projeto vive fora | Ativo        |
| `.ai-guidelines/`          | **Bridge legada** — CLI mjs ainda escreve aqui; migração consumer-side em PR4              | Depreciado   |
| `.specify/`                | **Legacy workspace dir** — migração para `.governance/` em PR4                             | Depreciado   |

Reservas materializadas idempotentemente por `AdoptWorkspace.execute`; declaração runtime em `RESERVED_GOVERNANCE_DIRS` (`src/domain/workspace/MigrationPlan.ts`). **Sem alias mágico** entre `.governance/` e `.ai-guidelines/`: a bridge é explícita.

---

## 3 — Regras de lookup

### 3.1 No mantenedor (este repo)

| Pergunta                                              | Fonte canônica                                                                          |
| :---------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| Qual o estado de uma spec em andamento?               | `.specify/specs/<spec-id>/tasks.md` + `NEXT.md`                                         |
| Quais specs estão abertas / fechadas?                 | `.specify/specs/roadmap/backlog.md` + `historico.md` (visão narrativa)                  |
| Qual o processo de abertura e ciclo de vida?          | `.core/process/governance-foundation.md`                                                |
| Quais decisões arquiteturais estáveis guiam o design? | `.core/governance/adrs/` (canônico) — `/adrs/` legado migra em 4.B.5                    |
| Quais regras o agente IA recebe?                      | `AGENTS.md` → bloco `<AI_GUIDELINES>` compilado                                         |
| Quais regras são **fonte** (editáveis)?               | `.core/rules/{top,center,base,adapters}/` — `_meta/` é derivado                         |
| Como montar artefatos de spec novos?                  | `.core/governance/recipes/` + `templates/partials/` (PR3); cutover em 4.C.0             |
| Qual a arquitetura macro da CLI re-arquitetada?       | `.core/governance/ARCHITECTURE.md` (entrada lean) + `ARCHITECTURE-REFERENCE.md` (denso) |
| Qual o roadmap operacional de uma spec específica?    | `.specify/specs/<spec-id>/tasks.md`                                                     |
| Onde ficam pesquisas internas?                        | `.specify/specs/researchs/{architecture,governance,oss}/`                               |

### 3.2 No consumidor

| Pergunta                            | Fonte canônica                                              |
| :---------------------------------- | :---------------------------------------------------------- |
| Qual o estado atual de um trabalho? | `.governance/registry.yml` (SSOT estruturado)               |
| O que os testes cobrem?             | `.governance/living-docs.yml` (gerado — nunca editar à mão) |
| Quais regras o agente IA recebe?    | `AGENTS.md` → bloco `<AI_GUIDELINES>` compilado pela CLI    |
| Onde ficam specs do projeto?        | `.governance/specs/` (PR4+) — hoje em `.specify/specs/`     |

---

## 4 — Lifecycle e relação estruturado ↔ narrativo

```
Draft → In Progress → In Review → Done   (ou Cancelled / Superseded)
```

- **Dense kinds** ganham `workspacePath` ao transitar de Draft → In Progress (a pasta da spec é criada atomicamente; falha em criar workspace ⇒ rollback do registry).
- **Virtual kinds** nunca têm workspace físico; são encerrados por resolução direta no registry.
- **Promoting:** muda o `kind` e preserva o `id`; o histórico de status não é truncado.
- **Archival:** artefatos `Done` permanecem no registry estruturado.

### 4.1 SSOT estruturado vs. narrativa humana

No **consumidor**, a verdade é `.governance/registry.yml` (estruturado, versionado, parseável). Visões humanas/IA derivadas vivem em Markdown gerado.

No **mantenedor**, hoje a verdade é o conjunto de `.specify/specs/<id>/` (cada spec é uma pasta com artefatos canônicos). `roadmap/backlog.md` e `roadmap/historico.md` são **visões narrativas curadas manualmente** — backlog lista candidatas pendentes, historico arquiva concluídas. O registry estruturado do mantenedor é uma evolução futura (não no escopo da 0021).

Regra de transição: enquanto não houver `registry.yml` do mantenedor, **mover uma spec entre estados** exige atualização coerente de (a) header da `spec.md`, (b) `tasks.md` checklist, (c) `roadmap/backlog.md` ↔ `roadmap/historico.md`.

---

## 5 — Gêneros futuros reservados

Os paths `.governance/{intake,handoff,telemetry}/` são criados idempotentemente por `AdoptWorkspace` como reserva explícita de lar canônico `[DEC-0021-B02]`. **Conteúdo entra somente com as specs futuras responsáveis**:

| Gênero futuro       | Path reservado           | Spec futura responsável             | Status       |
| :------------------ | :----------------------- | :---------------------------------- | :----------- |
| PRD / intake        | `.governance/intake/`    | `stakeholder-intake-pipeline`       | Não iniciada |
| Handoff / decisions | `.governance/handoff/`   | `handoff-contracts-formalization`   | Não iniciada |
| Telemetria          | `.governance/telemetry/` | `framework-observability-dashboard` | Não iniciada |

Reservar o lar **sem implementar o fluxo** é a opção B do `[DEC-0021-B02]`: evita que specs futuras reabram a discussão de placement e contém o escopo da 0021.

---

## 6 — Débitos de transição (deltas honestos com a política)

O catálogo descreve o **destino**. O repositório ainda não está 100% lá. Lista do delta — todos itens já mapeados em sub-blocos da 0021 ou em específicas futuras:

| Delta                                                                                                                                                                                                                                                                                                                            | Estado atual                                                           | Destino                                                                | Resolvido em                |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- | :--------------------------------------------------------------------- | :-------------------------- |
| ~~ADRs legadas em `/adrs/` coabitam com `.core/governance/adrs/`~~ — **resolvido em 4.B.5 (2026-05-17)**: `/adrs/` removido; ADRs consolidadas em `.core/governance/adrs/` (0003-0009 legadas preservam numeração; 0001-0005 locais PR3 renumeradas para 0010-0014). Auditoria a/b/c por ADR aplicada em 4.B.4 (próximo commit). | Lar único consolidado.                                                 | —                                                                      | ✅ 4.B.5                    |
| ~~`.core/process/spec-foundation.md` tem nome legado~~ — **resolvido em 4.B.1 (2026-05-17): renomeado para `governance-foundation.md`**.                                                                                                                                                                                         | Renomeado.                                                             | —                                                                      | ✅ 4.B.1                    |
| `docs/process/spec-foundation.md` é stub que diz "será removido pela spec 0021".                                                                                                                                                                                                                                                 | Stub vivo.                                                             | Removido.                                                              | **4.C.1**                   |
| `/docs/` carrega ilhas órfãs (`features.md`, `tdd-guidelines.md`, `ai-efficiency-guide.md`, `rpi-protocol.md`).                                                                                                                                                                                                                  | Conteúdo descritivo sem lar canônico.                                  | Cada documento: migrar para lar canônico **ou** depreciar formalmente. | **4.C.1**                   |
| `.specify/templates/` (boilerplates por mirror) coexiste com `.core/governance/recipes/` (composição atômica).                                                                                                                                                                                                                   | Dois mecanismos ativos; CLI mjs ainda copia mirror.                    | Cutover da CLI para TemplateEngine; recipes substituem mirror 1:1.     | **4.C.0**                   |
| `/cli/` mjs em produção convive com `/src/` (DDD re-arquitetado).                                                                                                                                                                                                                                                                | CLI mjs é o entrypoint real; `src/` não plugado.                       | `src/` torna-se entrypoint (cutover incremental).                      | **PR4 + specs posteriores** |
| Consumidor ainda recebe `.ai-guidelines/` (bridge legada), não `.governance/`.                                                                                                                                                                                                                                                   | CLI mjs escreve `.ai-guidelines/`.                                     | CLI escreve `.governance/`.                                            | **PR4 (consumer cutover)**  |
| Mantenedor não tem `registry.yml` próprio.                                                                                                                                                                                                                                                                                       | Verdade do mantenedor é `.specify/specs/<id>/` + narrative `roadmap/`. | Evolução futura — fora do escopo 0021.                                 | Spec futura                 |

> **Regra do catálogo:** se este documento e a topologia divergirem, o catálogo está certo se o destino for o estado declarado para _após_ o sub-bloco resolvedor. Hoje, durante a 0021 PR4, deltas listados acima são **transição esperada**, não bugs.

---

## 7 — Manutenção do catálogo

Qualquer mudança de path canônico, gênero ou regra de lookup exige atualização **simultânea**:

1. Este catálogo (`.core/governance/GOVERNANCE-CATALOG.md`).
2. `ARCHITECTURE-REFERENCE.md` §6 (Convenções de topologia).
3. `ARCHITECTURE.md` (lean) se for mudança visível na entrada principal.
4. Se afetar reservas em `.governance/`: `RESERVED_GOVERNANCE_DIRS` em `src/domain/workspace/MigrationPlan.ts` + `ReservedDirsContract.test.ts`.
5. Se afetar pilares ou promoções: `WorkItemPolicy` + `PromotionPolicy` + ADR correspondente.

Drift entre catálogo e código falha o pipeline na CI quando o ponto tocado tem invariante coberto por teste; para os demais, drift é detectado por revisão humana — leitura desalinhada do catálogo é sintoma de débito a abrir.
