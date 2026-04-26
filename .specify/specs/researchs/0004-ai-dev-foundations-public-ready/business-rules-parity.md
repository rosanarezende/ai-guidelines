# Research Benchmark: Documentação Viva e Regras de Negócio

Este documento consolida a pesquisa sobre como ferramentas e repositórios maduros documentam regras de negócio, resolvem o gap entre código e especificação e garantem alta confiança sem burocracia inerte.

## 1. O Problema da Documentação Estática

Documentos de especificações tradicionais tendem a ficar obsoletos rapidamente. A separação física e lógica entre "onde a doc vive" (ex: wiki) e "onde o código testa" causa dessincronização.

## 2. Padrões de Mercado e Filosofia

### Living Documentation (Documentação Viva)

- **Princípio:** O repositório de código deve ser "Single Source of Truth" (Única Fonte de Verdade).
- **Execução:** Markdown versionado junto ao sistema atua não apenas como instrução, mas também como base para relatórios dinâmicos e testes rastreáveis.

### Executable Specifications e BDD (Behavior-Driven Development)

- **Princípio:** As especificações e os testes são uma coisa só.
- **Execução:** Escrever testes no formato textual `Given/When/Then` e forçar o motor de testes a ler essas frases para aprovação, colapsando regras e testes matemáticos em um mesmo arquivo ou link visual.

### Feature-Sliced Design e DDD (Domain-Driven Design)

- **Princípio:** O código que muda junto, vive junto. Se a regra de negócio do parser do CLI for atualizada, o teste dela não deve estar escondido a três pastas de distância.
- **Execução (Co-location):** Mover testes do formato `scripts/tests/*.test.mjs` para `scripts/ai-guidelines-cli/*.test.mjs`, aproximando a validação do executor lógico.

## 3. Rastreabilidade 1-to-1 com Identificadores (Business Rule IDs)

A forma mais comprovada de ligar MD puro com um output de runner de teste (ex: `node:test` nativo) sem importar bibliotecas pesadas de parsers (Ex: Cucumber) é o uso de **Identificadores Simbólicos**.

1. **Na Documentação (`.md`):** A regra ganha uma chave inquestionável (ex: `[BR-CLI-INIT-01]`).
2. **No Teste (`.test.mjs`):** A descrição do teste assume o ID:
   ```javascript
   it("[BR-CLI-INIT-01] Given init flags When parseArgs Then resolves defaults");
   ```
3. **No CI e Validation:** Pode-se validar facilmente, com regex ou scripts leves, se todos os IDs mapeados nos documentos markdown aparecem no resultado (ou fonte) da suíte de testes. Isso atesta **100% de coverage semântico** das Regras de Negócio, permitindo flexibilidade na cobertura literal de linhas de código (ex: threshold caindo para 95% overall).

## 4. Recomendações

- Abandonar a pasta separada estritamente por formato de arquivo (`scripts/tests/`) em favor de domínios ou diretórios feature-based.
- Adotar Identificadores (e.g., `BR-XXX`) para regras críticas documentadas e incluí-las nos arquivos colocalizados (`.test.mjs`).
