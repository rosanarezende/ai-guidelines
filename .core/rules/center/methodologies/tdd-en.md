### TDD: Test-Driven Development (Red-Green-Refactor)

> This rule instructs AI agents to follow the strict TDD cycle.
> **Focus:** code structure, feedback loop and coverage.

---

#### [OPT-0401] Strict TDD Cycle

```yaml
id: OPT-0401
scope: opt-in
opt_in_feature: tdd
category: correctness
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [opt-in, tdd, testing]
```

**Instruction (en):**
Every new feature or bug fix MUST follow the RED -> GREEN -> REFACTOR cycle. Write a failing test first. Never skip the RED step. Write minimum code to pass. Maintain >85% coverage. Test files must be colocated. Unit tests must be isolated with mocks/stubs.

**Documentação (pt-br):**

1. **RED:** Escreva um teste que falhe — defina o comportamento esperado antes de qualquer implementação.
2. **GREEN:** Escreva o código mínimo necessário para fazer o teste passar. Sem otimizações prematuras.
3. **REFACTOR:** Melhore o código (nomes, estrutura, DRY) mantendo todos os testes verdes.

- **Isolamento:** Testes unitários não devem depender de serviços externos, rede ou banco de dados. Use mocks/stubs.
- **Colocation:** Arquivos de teste devem ficar no mesmo diretório que o código testado.

**See also:** [OPT-0101], [OPT-0201]
