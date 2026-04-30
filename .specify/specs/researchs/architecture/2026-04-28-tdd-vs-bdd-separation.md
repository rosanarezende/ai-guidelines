# TDD vs BDD: Separação de Conceitos e Padrões da Indústria

## Contexto

Durante o review manual do Sub-bloco E da Spec 0008, identificou-se que a feature `tdd` do CLI de governança impõe simultaneamente dois padrões distintos:

1. **O ciclo iterativo de testes** (TDD: Red-Green-Refactor).
2. **O padrão de linguagem de requisitos** (BDD: Dado/Quando/Então).
   Além disso, as regras geradas estão fixadas em Português do Brasil (PT-BR).

## Benchmarks da Indústria

- **Separação de Preocupações:** Na prática de engenharia contemporânea, TDD (Test-Driven Development) é considerado uma técnica de design arquitetural e validação de baixo nível (ex: testes unitários com Jest, JUnit). Já BDD (Behavior-Driven Development) é uma técnica de especificação e comunicação de negócio (ex: Cucumber, E2E com Cypress), utilizando Gherkin.
- **Ecossistema CLI (Angular CLI, Nx, Vue CLI):** Ferramentas padrão de mercado geralmente oferecem configuração de TDD/testes unitários como uma feature fundamental ou _opt-in_ separada da configuração E2E/BDD.
- **Linguagem:** Ferramentas BDD adotam i18n massivamente. O idioma do projeto afeta a taxonomia dos testes. Impor PT-BR quebra a fluidez em projetos puramente globais (EN).

## Decisão

Com base no princípio "opt-in de stack" (Spec 0005) e no Single Responsibility Principle da governança (ADR 0004), decidiu-se:

1. **Separar a feature:** Extrair as regras BDD para uma nova feature opt-in `bdd`, mantendo a feature `tdd` restrita a regras de ciclo de desenvolvimento focado em testes técnicos.
2. **Adicionar suporte i18n:** Oferecer a escolha entre `pt` e `en` na geração de regras para as features `tdd` e `bdd` por meio de uma flag `--lang` ou pelo wizard.
