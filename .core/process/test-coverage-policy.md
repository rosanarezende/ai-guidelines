# Test Coverage Policy — Operacionalização do ADR 0003

> **Princípio canônico:** [`ADR 0003 — Rastreabilidade BR-CLI é Contrato; Cobertura é Política Operacional`](../governance/adrs/0003-cobertura-framework.md).
>
> Este documento captura a **operacionalização tática** do princípio: thresholds numéricos, lista de exceções por arquivo/linha e mecanismos. Detalhes operacionais evoluem com o código sem exigir reabertura do ADR.

---

## Threshold global

**Piso de cobertura agregado**: **85%** no pacote `cli/` (módulos canonizados).

Cumprido via `--experimental-test-coverage` do node test runner. Falha do piso bloqueia merge na CI.

## Threshold por módulo crítico

**Motor SSOT** (`baseline-apply.mjs` e equivalentes futuros): **95%** de cobertura de linhas. Excedente em relação ao piso global se justifica pelo blast radius: erro no motor afeta todo consumidor.

## Threshold semântico (paridade BDD/Negócio)

**100%** das regras rotuladas `[BR-CLI-*]` em documentação canônica DEVEM mapear para ao menos um `it(...)` em bloco BDD nos testes. Detecção via Living Documentation drift guard (ADR 0012). Falha de paridade é falha de contrato, bloqueia merge.

## Exceções (isenções por escrito)

Exceções vivem aqui, não no código. Cada exceção tem três campos obrigatórios: caminho, justificativa, condição de validação alternativa.

### Bootstrappers (thin wrappers)

Entrypoint `cli/ai-guidelines-cli.mjs` espelha rotas sob um runner `node`. Escapa do threshold global e é validado pela suíte `smoke` (integração ponta-a-ponta).

| Caminho                     | Justificativa                                           | Validação alternativa          |
| :-------------------------- | :------------------------------------------------------ | :----------------------------- |
| `cli/ai-guidelines-cli.mjs` | Thin wrapper que apenas roteia para módulos canonizados | Suíte `tests/smoke/*.test.mjs` |

### Defesa contra estado impossível

Linhas que tratam de erros catastróficos de sistema (arquivos do framework ausentes em runtime do próprio framework) são isentas. Validação por teste exigiria injeção de test hooks em código de produção.

| Arquivo                                        | Linhas¹                                | Tipo de defesa                      |
| :--------------------------------------------- | :------------------------------------- | :---------------------------------- |
| `cli/governance/monolith/applyAgents.mjs`      | `throw` se `AGENTS.md.tmpl` sumir      | Catastrófico — framework corrompido |
| `cli/governance/monolith/applyRules.mjs`       | `throw` se pasta `.core/rules/` sumir  | Catastrófico — framework corrompido |
| `cli/governance/monolith/applyProcessDocs.mjs` | `throw` se pasta `docs/process/` sumir | Catastrófico — framework corrompido |

¹ Números de linha específicos não são versionados aqui — refatoração move linhas, mas o **tipo de exceção** permanece. O reviewer identifica a defesa pelo padrão `throw`, não pelo número exato. Originalmente (2026-04-21) documentadas como `applyAgents.mjs:155-156`, `applyRules.mjs:246-249`, `applyProcessDocs.mjs:260-263`.

### Infraestrutura pura

Componentes de infraestrutura pura cujo único caminho não-coberto é boilerplate de setup do próprio runtime (caso de `install-runtime.mjs` no PR3) também são isentos com a mesma justificativa.

## Mecanismo de Test Colocation

Testes vivem ao lado dos módulos que cobrem:

- `cli/foo.mjs` → `cli/foo.test.mjs` (mesma pasta).
- `src/foo.ts` → `src/foo.test.ts` (mesma pasta).
- Smoke tests (cruzam vários módulos) → `tests/smoke/*.test.mjs`.
- Integration tests (cruzam vários módulos em fluxo real) → `tests/integration/*.test.mjs`.

**Não existe** diretório `tests/unit/` espelhando topologia de `cli/` ou `src/`. Espelhar topologia dobra o custo de refactor e amplifica fricção de manter dois lugares em sincronia.

## Atualização desta policy

Mudanças nos thresholds ou na lista de exceções acontecem por PR dedicado com referência ao ADR 0003 nas justificativas. **Não** exigem novo ADR — operacionalização evolui dentro do princípio. Reabrir o princípio (e.g. abandonar BR-CLI traceability como contrato) sim exige nova ADR superseding 0003.
