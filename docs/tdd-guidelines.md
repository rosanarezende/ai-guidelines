# TDD & BDD Guidelines

Este guia estabelece os padrões e filosofias para o desenvolvimento orientado a comportamento de testes dentro do framework `ai-guidelines`.

## 1. Filosofia Baseline

A filosofia do nosso ecossistema de documentações baseia-se em **Living Documentation**.
Para assegurar o alto nível de confiança, os testes são modelados sob os princípios de BDD em **Português do Brasil**:

- As descrições seguem firmemente o modelo `DADO/QUANDO/ENTÃO`:
  - **DADO (Given)** foca na preparação do estado, dependências ou inputs iniciais.
  - **QUANDO (When)** foca na ação (frequentemente o fluxo de disparo do módulo testado).
  - **ENTÃO (Then)** faz asserções de saída de forma atômica e declarativa.

## 2. A Camada Interna do Framework (ai-guidelines-cli)

O pacote CLI do framework adere aos seguintes pilares técnicos e test tests nativos (Built-in Node.js runner):

### 2.1 Colocation (Proximidade Física)

Os arquivos de testes habitam o mesmo namespace/pasta em que a lógica atua. Se você criar ou modificar `file-system.mjs`, o arquivo vizinho `file-system.test.mjs` assumirá todas as asserções unitárias. Fica imediatamente aparente quando os testes existem e a busca linear se torna extremamente amigável.

### 2.2 Rastreabilidade (Business Rules IDs)

Qualquer regra imposta através da documentação de engenharia (ex. `docs/cli/ai-guidelines-cli.md`) precisa carregar um Identificador único (e.g., `[BR-CLI-X]`).

Obrigatoriamente no framework, os cases de teste que validam esse fluxo trazem no seu nome o identificador da documentação.

```javascript
import { describe, it } from "node:test";

describe("core", () => {
  it("[BR-CLI-INIT-01] DADO flag sem --force QUANDO arquivos existem ENTÃO ocorre erro de conflito", () => {
    // ... asserções garantindo esse comportamento especifico.
  });
});
```

### 2.3 Threshold (Gate Guardrails)

- Adota-se oficialmente a meta de **100%** de linhas de código cobertas por teste para toda a lógica core (`cli/core/`, `cli/adopt/`).
- O gate técnico no CI assegura a checagem usando `node --experimental-test-coverage`, quebrando PRs cujos patamares escorrarem da grade de **100%**.
- Exceções cirúrgicas (como bootstrappers de entrada) devem ser documentadas no ADR 0003.

### 2.4 Regime de Strict TDD

O desenvolvimento do framework segue o ciclo **Strict TDD**:

1. **Regra**: Identificar ou criar a Business Rule `[BR-CLI-*]` no Markdown oficial.
2. **RED**: Escrever o teste unitário BDD (`DADO/QUANDO/ENTÃO`) que falha ao tentar validar a regra.
3. **GREEN**: Implementar a lógica mínima necessária para o teste passar.
4. **REFACTOR**: Limpar o código mantendo o teste verde e a cobertura total.

## 3. A Camada Mista do CLI Externo (`init/adopt`)

Quando usamos o comando para aplicar em outros repositórios via adopt, eles devem absorver a recomendação conservadora: os testes BDD são recomendados como defaults na base `package.json` injetada, e as chaves de testing de threshold podem ser herdadas, porém configuráveis para que projetos novos consigam definir o seu coverage.
