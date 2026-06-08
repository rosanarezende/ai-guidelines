# Rules Catalog

> Índice navegável gerado automaticamente.
> **NÃO EDITE ESTE ARQUIVO** — ele é reconstruído via `yarn build:rules`.

| ID           | Title                                                      | Scope       | Category          | Link                                          |
| ------------ | ---------------------------------------------------------- | ----------- | ----------------- | --------------------------------------------- |
| **ADP-0101** | Model Routing                                              | `adapter`   | `process`         | [Ver](adapters/claude.md#adp0101)             |
| **ADP-0102** | Context e Ignore                                           | `adapter`   | `process`         | [Ver](adapters/claude.md#adp0102)             |
| **ADP-0103** | Comportamento Observado                                    | `adapter`   | `process`         | [Ver](adapters/claude.md#adp0103)             |
| **ADP-0201** | Integração com IDE                                         | `adapter`   | `process`         | [Ver](adapters/codex.md#adp0201)              |
| **ADP-0202** | Contexto e Ignore                                          | `adapter`   | `process`         | [Ver](adapters/codex.md#adp0202)              |
| **ADP-0203** | Comportamento Observado                                    | `adapter`   | `process`         | [Ver](adapters/codex.md#adp0203)              |
| **ADP-0301** | Integração com CLI                                         | `adapter`   | `process`         | [Ver](adapters/gemini.md#adp0301)             |
| **ADP-0302** | Skills Globais                                             | `adapter`   | `process`         | [Ver](adapters/gemini.md#adp0302)             |
| **ADP-0303** | Estratégia de Ignore                                       | `adapter`   | `process`         | [Ver](adapters/gemini.md#adp0303)             |
| **ADP-0304** | Comportamento Observado                                    | `adapter`   | `process`         | [Ver](adapters/gemini.md#adp0304)             |
| **CORE-01**  | Environment check antes da primeira ação                   | `universal` | `process`         | [Ver](top/agents-core.md#core01)              |
| **CORE-02**  | Agnostic SDD Override — repositório como memória           | `universal` | `process`         | [Ver](top/agents-core.md#core02)              |
| **CORE-03**  | Cross-ref para catálogo de regras                          | `universal` | `process`         | [Ver](top/agents-core.md#core03)              |
| **CORE-04**  | Nunca trabalhe direto em main/master                       | `universal` | `process`         | [Ver](top/agents-core.md#core04)              |
| **CORE-05**  | Não versione contexto vazado                               | `universal` | `process`         | [Ver](top/agents-core.md#core05)              |
| **CORE-06**  | Commits incrementais atômicos                              | `universal` | `process`         | [Ver](top/agents-core.md#core06)              |
| **CORE-07**  | Nunca execute git push autonomamente                       | `universal` | `process`         | [Ver](top/agents-core.md#core07)              |
| **CORE-08**  | HARNESS LOCK — contrato operacional obrigatório pré-commit | `universal` | `process`         | [Ver](top/agents-core.md#core08)              |
| **CORE-09**  | PRs abrem como Draft com matriz oficial                    | `universal` | `process`         | [Ver](top/agents-core.md#core09)              |
| **CORE-10**  | Draft → Ready apenas via revalidação humana                | `universal` | `process`         | [Ver](top/agents-core.md#core10)              |
| **CORE-11**  | Plano formado antes de ação                                | `universal` | `process`         | [Ver](top/agents-core.md#core11)              |
| **CORE-12**  | Checkpoints antes de ação após contexto extenso            | `universal` | `process`         | [Ver](top/agents-core.md#core12)              |
| **CORE-13**  | Artefatos vivos durante o trabalho                         | `universal` | `process`         | [Ver](top/agents-core.md#core13)              |
| **CORE-14**  | Commit sob autorização explícita e contrato instalado      | `universal` | `process`         | [Ver](top/agents-core.md#core14)              |
| **CORE-15**  | ADR é princípio perene, não revisitação datada             | `universal` | `process`         | [Ver](top/agents-core.md#core15)              |
| **CORE-16**  | Sync de base ≠ merge atômico ponta-a-ponta                 | `universal` | `process`         | [Ver](top/agents-core.md#core16)              |
| **GR-0001**  | Secure secret handling                                     | `universal` | `security`        | [Ver](top/global-rules.md#gr0001)             |
| **GR-0002**  | Strict typing (anti-hacks)                                 | `universal` | `correctness`     | [Ver](top/global-rules.md#gr0002)             |
| **GR-0003**  | Immutability over shared mutation                          | `universal` | `maintainability` | [Ver](top/global-rules.md#gr0003)             |
| **GR-0004**  | Fail-fast error handling                                   | `universal` | `correctness`     | [Ver](top/global-rules.md#gr0004)             |
| **GR-0005**  | Explicit async and concurrency intent                      | `universal` | `correctness`     | [Ver](top/global-rules.md#gr0005)             |
| **GR-0006**  | No autonomous dependency installation (Anti-Slopsquatting) | `universal` | `security`        | [Ver](top/global-rules.md#gr0006)             |
| **GR-0101**  | Spec type must be declared                                 | `universal` | `process`         | [Ver](top/global-rules.md#gr0101)             |
| **GR-0102**  | Token Budget Methodology (Tok-H)                           | `universal` | `editorial`       | [Ver](top/global-rules.md#gr0102)             |
| **GR-0201**  | Repository language standard                               | `universal` | `editorial`       | [Ver](top/global-rules.md#gr0201)             |
| **GR-0202**  | Context noise reduction                                    | `universal` | `process`         | [Ver](top/global-rules.md#gr0202)             |
| **GR-0203**  | Collaborative PR description                               | `universal` | `process`         | [Ver](top/global-rules.md#gr0203)             |
| **OPT-0101** | BDD Test Structure                                         | `opt-in`    | `correctness`     | [Ver](center/methodologies/bdd-en.md#opt0101) |
| **OPT-0201** | Estrutura de Teste BDD                                     | `opt-in`    | `correctness`     | [Ver](center/methodologies/bdd-pt.md#opt0201) |
| **OPT-0301** | Quality Gates (Checklist)                                  | `opt-in`    | `correctness`     | [Ver](base/quality/quality-gates.md#opt0301)  |
| **OPT-0401** | Strict TDD Cycle                                           | `opt-in`    | `correctness`     | [Ver](center/methodologies/tdd-en.md#opt0401) |
| **OPT-0501** | Ciclo TDD Estrito                                          | `opt-in`    | `correctness`     | [Ver](center/methodologies/tdd-pt.md#opt0501) |
