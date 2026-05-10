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
5. Ausência de testes integrados E2E. Use cases testados com doubles; o cruzamento Application + Infrastructure real só acontece quando o IO chegar (PR2).
6. ResolutionMode modelado, mas pouco exercitado. Semântica de cleaned-up/kept para experiments perdidos só será coberta no PR2/PR3.

### Débitos da Fase 2 (Reestruturação Física)

_(A preencher conforme execução)_

### Débitos da Fase 3 (Living Documentation + Engine)

_(A preencher conforme execução)_

### Débitos da Fase 4 (Migração)

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
