### TDD: Desenvolvimento Guiado por Testes (Red-Green-Refactor)

> Esta regra instrui agentes de IA a seguirem o ciclo TDD estrito.
> **Foco:** estrutura de código, ciclo de feedback e cobertura.

---

#### [OPT-0501] Ciclo TDD Estrito

```yaml
id: OPT-0501
scope: opt-in
opt_in_feature: tdd
category: correctness
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [opt-in, tdd, testing]
```

**Instruction (en):**
Every new feature or bug fix MUST follow the RED -> GREEN -> REFACTOR cycle. Write a failing test first. Never skip the RED step. Write minimum code to pass. Maintain >85% coverage. Test files must be colocated. Unit tests must be isolated with mocks/stubs. If a business rule `[BR-*]` is provided, include it in the test name.

**Documentação (pt-br):**

1. **RED:** Escreva um teste que falhe — defina o comportamento esperado antes de qualquer implementação.
2. **GREEN:** Escreva o código mínimo necessário para fazer o teste passar. Sem otimizações prematuras.
3. **REFACTOR:** Melhore o código (nomes, estrutura, DRY) mantendo todos os testes verdes.

- **Isolamento:** Testes unitários não devem depender de serviços externos, rede ou banco de dados. Use mocks/stubs para dependências.
- **Colocation:** Arquivos de teste devem ficar no mesmo diretório que o código testado (ex: `engine.mjs` → `engine.test.mjs`).
- **Rastreabilidade:** Quando uma regra de negócio tiver identificador `[BR-*]`, o teste que a valida deve carregar o mesmo identificador no nome.

**See also:** [OPT-0101], [OPT-0201]
