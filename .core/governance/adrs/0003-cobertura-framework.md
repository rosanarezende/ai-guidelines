# ADR 0003: Cobertura de Testes e Living Documentation (Paridade BDD/Negócio)

## Status

Aceito

## Contexto e Premissa

O motor `baseline-apply.mjs` é o coração da automação SSOT do `ai-guidelines`. Para garantir que nenhuma alteração de comportamento seja introduzida sem validação, adotamos o rito de **BDD-First** (Markdown define a regra, Teste a valida).

Contudo, a busca cega pelos 100% de cobertura técnica demonstrou-se prejudicial, forçando a injeção de "test hooks" no código de produção para validar falhas de infraestrutura virtualmente impossíveis em ambiente saudável.

## Decisão

1.  **Threshold Obrigatório em Scripts**: **95%** de cobertura de linhas para o motor principal (`baseline-apply.mjs`).
2.  **Soberania das Regras de Negócio**: 100% das regras mapeadas em `docs/cli/` DEVEM ser testadas.
3.  **Exceções Técnicas**: Linhas que tratam de erros catastróficos de sistema (arquivos do framework ausentes) são isentas da meta de cobertura automatizada, pois sua validação exige poluição do código de produção.

### Lista de Exceções (Baseline Apply)

- **applyAgents.mjs**: Linhas 155-156 (throw se AGENTS.md.tmpl sumir).
- **applyRules.mjs**: Linhas 246-249 (throw se pasta rules/ sumir).
- **applyProcessDocs.mjs**: Linhas 260-263 (throw se pasta docs/process/ sumir).

## Consequências

- **Melhoria**: Código de produção mais limpo e legível.
- **Melhoria**: Suíte de testes mais rápida e menos frágil.
- **Risco**: Erros nestas linhas específicas só seriam detectados em runtime, mas o impacto é aceitável dado que o framework estaria corrompido de qualquer forma.

## Decisões

1. **Test Colocation:** Mover testes do framework para atuarem ao lado dos scripts nativos (`/*.test.mjs` junto dos `/*.mjs`). Isso engloba os conceitos de _Feature-Sliced Design_ adaptado.
2. **Threshold Global de 85%**: O node built-in testing evaluator (`--experimental-test-coverage`) monitorará e rejeitará CI's abaixo desse limiar no pacote `cli/` (agregado dos módulos canonizados).
3. **Isenções Justificadas**: Componentes de infraestrutura pura (`install-runtime.mjs`) e blocos de erro catastróficos são isentos da meta, pois sua validação exige poluição excessiva do código.
4. **Threshold Semântico de 100% (Business Rules Parity):** Regras de negócio importantes marcadas na documentação central (e.g. `docs/cli/ai-guidelines-cli.md`) receberão identificadores imutáveis (Ex: `[BR-CLI-*]`). Tais identificadores devem mapear obrigatoriamente para `it(...)` em blocos de BDD dos testes.
5. **Bootstrapper Exception**: O entrypoint base `cli/ai-guidelines-cli.mjs` agirá como um _thin wrapper_ deslogado do teste coberto numérico de unidade, visto que apenas espelha rotas sob um runner `node`. Ele escapa do threshold global mas deve ser testado puramente na integração `smoke`.

## Consequências

- Melhora dramática na leitura do ciclo de vida das funcionalidades: qualquer pessoa sabendo procurar pela string `[BR-CLI` sabe imediatamente onde ela foi definida e onde ela está garantida.
- Maior velocidade para alteração do código sem se preocupar em cobrir loops/ternários irrelevantes.
- Mudança na forma de escrever teste: o programador precisa referenciar o `.md` correspondente.
