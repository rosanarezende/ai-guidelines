# TDD: Desenvolvimento Guiado por Testes (Red-Green-Refactor)

> Esta regra instrui agentes de IA a seguirem o ciclo TDD estrito.
> **Foco:** estrutura de código, ciclo de feedback e cobertura.

---

## Ciclo Obrigatório (Strict TDD)

Toda nova funcionalidade ou correção de bug DEVE seguir este ciclo:

1. **RED:** Escreva um teste que falhe — defina o comportamento esperado antes de qualquer implementação.
2. **GREEN:** Escreva o código mínimo necessário para fazer o teste passar. Sem otimizações prematuras.
3. **REFACTOR:** Melhore o código (nomes, estrutura, DRY) mantendo todos os testes verdes.

> **Regra:** Nunca pule o passo RED. Código sem teste que falhou primeiro não é TDD.

---

## Princípios Estruturais

- **Um Teste, Uma Intenção:** Cada caso de teste valida exatamente um comportamento. Evite testes "omni-bus".
- **Isolamento:** Testes unitários não devem depender de serviços externos, rede ou banco de dados. Use mocks/stubs para dependências.
- **Colocation:** Arquivos de teste devem ficar no mesmo diretório que o código testado (ex: `engine.mjs` → `engine.test.mjs`).
- **Cobertura como Gate:** Mínimo recomendado de **85%** de cobertura de linhas. Exceções devem ser documentadas.

---

## Regras para Agentes de IA

- Ao receber uma tarefa, escreva os testes ANTES da implementação.
- Gere casos de borda (edge cases) baseados na spec antes de implementar a lógica.
- Se um teste existente quebrar durante refatoração, corrija-o antes de prosseguir.
- Nunca delete ou desabilite testes para fazer o build passar.
