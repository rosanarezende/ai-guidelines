# TDD & BDD: Desenvolvimento Guiado por Testes

A adoção de TDD/BDD é recomendada para garantir a estabilidade de sistemas complexos e facilitar a refatoração segura por agentes de IA.

---

## Ciclo Obrigatório

1. **RED:** Escreva um teste que falhe para a nova funcionalidade ou correção.
2. **GREEN:** Escreva o código mínimo necessário para fazer o teste passar.
3. **REFACTOR:** Melhore o código mantendo o teste verde.

---

## Padrão de Escrita (BDD)

Utilize a estrutura **DADO / QUANDO / ENTÃO** (ou Given/When/Then) em Português do Brasil para descrever comportamentos:

- **DADO** [cenário inicial / estado do sistema]
- **QUANDO** [ação executada pelo usuário ou sistema]
- **ENTÃO** [resultado esperado / verificação]

---

## Regras de Ouro

- **Um Teste, Uma Intenção:** Evite testes "omni-bus" que validam múltiplos comportamentos não relacionados.
- **Isolamento:** Testes unitários não devem depender de serviços externos (use mocks/stubs).
- **IA-First Testing:** Sempre peça para a IA gerar os casos de borda (edge cases) baseados na spec antes de implementar a lógica.
