# Research: Análise de Gaps Pós-Gate e Dívidas Arquiteturais

> Data: 2026-05-09
> Autor: Arquiteto de Software (via Gemini)
> Status: Concluído
>
> **Contexto:** Este documento registra insights críticos e gaps arquiteturais identificados durante a revisão de transição do Stage 1 (Research) para o Stage 2 (Design + Implementação), _após_ o `decision-brief.md` ter sido formalmente aprovado. O seu propósito é capturar conhecimento valioso que deve informar a próxima versão do `plan.md` e `tasks.md`, além de sugerir melhorias para o próprio processo de governança.

---

## 1. Resumo Executivo

A aprovação do `decision-brief.md` validou o **"o quê"** da Spec 0021, mas uma revisão arquitetural subsequente levantou questões críticas sobre o **"como"** e o **"quão abrangente"**. Identificamos duas dívidas técnicas significativas que, se não forem tratadas, comprometeriam o sucesso e a sustentabilidade da nova arquitetura de informação: a saúde da CLI que implementará a mudança e a incompletude da consolidação documental.

Este research propõe expandir o escopo da Spec 0021 para pagar essas dívidas agora, garantindo uma fundação robusta para o futuro do framework.

---

## 2. Gaps Identificados na Arquitetura e Escopo

### Gap 1: A Saúde Arquitetural da CLI (O "Frankenstein")

- **Observação:** O `decision-brief.md` focou nas mudanças funcionais (novo diretório `.governance/`, `registry.yml`), mas assumiu implicitamente que a CLI atual era uma base saudável para implementar essas mudanças. Uma análise crítica do diretório `/cli` revela uma arquitetura que cresceu organicamente, com responsabilidades acopladas, lógica reativa a diferentes IAs e uma ausência de um design coeso. Apenas "adaptar" esta CLI seria aplicar um verniz sobre uma fundação frágil.
- **Risco Associado:** Continuar construindo sobre a CLI atual resultaria em um "Frankenstein" ainda maior, tornando a manutenção futura exponencialmente mais custosa e lenta. Qualquer nova feature exigiria um esforço desproporcional de refatoração e testes.
- **Implicação no Escopo da Spec:** A Spec 0021 não pode ser apenas sobre "o que" a CLI faz, mas deve ser sobre **"o que a CLI é"**. Portanto, o escopo precisa ser formalmente expandido para incluir uma re-arquitetura completa da CLI.

### Gap 2: Consolidação Incompleta da Arquitetura de Informação

- **Observação:** A decisão de unificar `.specify/` e `.ai-guidelines/` em `.governance/` foi um passo correto, mas míope. Ele ignorou outros diretórios de primeiro nível que contribuem para a desordem da informação, mais notavelmente o diretório `/docs`. Seu conteúdo é de baixo consumo e propósito pouco claro, existindo como uma ilha de informação órfã.
- **Risco Associado:** Uma reorganização parcial apenas moveria o problema de lugar. A raiz do projeto continuaria poluída e a promessa de uma "arquitetura de informação única e explicável" não seria cumprida integralmente.
- **Implicação no Escopo da Spec:** O escopo da consolidação documental deve ser expandido para analisar **todos** os artefatos de documentação na raiz do projeto, com o objetivo de depreciar o que for obsoleto (como `/docs`) e encontrar um lar canônico e útil para o que for valioso (ex: dentro de `.core/docs/`).

---

## 3. Sugestões de Melhoria para o Processo de Governança

O fato de estes gaps terem sido identificados _após_ o gate formal é um sinal de que o nosso processo de Stage 1 pode ser melhorado.

### Sugestão 1: Adicionar um "Bloco de Saúde Técnica" ao `decision-brief.md`

- **Problema:** O template atual do `decision-brief.md` foca em decidir entre opções funcionais e de design, mas não força uma conversa sobre a viabilidade e o custo de implementação na base de código existente.
- **Proposta:** Adicionar um novo **"Bloco C: Saúde Técnica e Dívidas Associadas"** ao template do `decision-brief.md`. Este bloco conteria perguntas obrigatórias como:
  1.  Qual é o estado de saúde arquitetural do componente que implementará esta spec? (Escala: Saudável, Requer Refatoração, Requer Re-arquitetura).
  2.  Existem dívidas técnicas pré-existentes que esta spec irá exacerbar? Se sim, o plano inclui o pagamento delas?
  3.  A estratégia de testes para este componente é robusta o suficiente para garantir uma implementação segura?
- **Benefício:** Forçar essa discussão no Stage 1 teria tornado o problema do "Frankenstein" da CLI explícito antes do gate, permitindo um planejamento mais preciso desde o início.

### Sugestão 2: Adicionar Perguntas sobre "Escopo Holístico"

- **Problema:** A spec foi aberta para resolver a dor de `.specify/` e `.ai-guidelines/`, e o research permaneceu focado nesse escopo, perdendo a visão periférica de outros problemas relacionados (`/docs`).
- **Proposta:** Adicionar uma pergunta ao `plan.md` inicial para specs do tipo "Arquitetura de Informação" ou "Reorganização Estrutural":
  - _"Além do problema central que originou esta spec, existem outros artefatos ou processos 'vizinhos' que deveriam ser considerados para garantir uma solução holística e evitar a criação de novas ilhas de informação?"_
- **Benefício:** Incentiva uma análise de 360 graus, aumentando a probabilidade de resolver a causa raiz da desorganização, em vez de apenas os sintomas mais óbvios.

---

## 4. Análise de Riscos Táticos de Implementação

Além dos gaps estratégicos, a análise pós-gate revelou riscos de implementação concretos que um plano de execução deve mitigar de forma explícita.

### Risco 1: Quebra Massiva de Caminhos Codificados (Hardcoded Paths)

- **Gap:** A decisão mais impactante (`DEC-0021-A03`) é a unificação de `.specify/` e `.ai-guidelines/` no novo diretório `.governance/` no lado do consumidor. A nossa CLI, especialmente nos módulos `cli/features/core/`, está repleta de referências diretas a `".ai-guidelines"` e `".specify/templates"`.
- **Impacto:** Se a migração for feita sem uma atualização coordenada, todos os comandos da CLI (`init`, `adopt`, `update`, `providers`) falharão catastroficamente. Isso inclui a lógica de leitura de `config.json`, o espelhamento de templates e a criação dos entrypoints dos provedores.
- **Ressalva:** Este é o maior risco técnico da implementação. A refatoração da CLI não é opcional, é o coração da entrega.

### Risco 2: Inconsistência do Fluxo RPI (Research, Plan, Implement)

- **Gap:** A renomeação e refatoração do `governance-foundation.md` (`DEC-0021-B03`, `B04`) e a introdução dos 6 pilares de valor (`DEC-0021-A02`) tornam os templates atuais de `spec`, `plan` e `tasks` (`.specify/templates/`) obsoletos conceitualmente. Eles ainda operam sob uma visão "spec-cêntrica".
- **Impacto:** Se não atualizarmos os templates que a própria CLI distribui, estaremos entregando uma arquitetura nova (`.governance/` com 6 pilares) com ferramentas que ainda forçam o modelo antigo. Isso geraria confusão imediata no consumidor e invalidaria parte do valor da spec.
- **Ressalva:** A atualização dos templates de boilerplate em `.ai-guidelines/templates/` (que se tornarão `.governance/templates/`) é uma dependência direta da nova arquitetura.

### Risco 3: Dependência Circular no Build e Testes

- **Gap:** A reorganização interna de `.core/rules/` (`DEC-0021-B05`) pode quebrar os scripts de build (`yarn build:rules`) e testes que dependem da estrutura de diretórios atual para carregar e compilar as regras.
- **Impacto:** A pipeline de CI (`ai-guidelines-ci.yml`) e a suíte de testes locais podem falhar, bloqueando o merge e a validação de qualquer mudança.
- **Ressalva:** A mudança em `.core/rules/` deve ser feita de forma atômica com a atualização dos scripts que a consomem. Não pode ser um commit isolado.

### Risco 4: Documentação Desatualizada e Ponteiros Quebrados

- **Gap:** Vários documentos-chave (`README.md`, `CONTRIBUTING.md`, `AGENTS.md` e a pasta `docs/`) contêm referências aos caminhos antigos (`.specify/`, `.ai-guidelines/`).
- **Impacto:** Novos contribuidores (humanos ou IA) serão direcionados para uma estrutura de diretórios que não existe mais, causando atrito e perda de tempo.
- **Ressalva:** A atualização da documentação não é uma tarefa de "baixa prioridade"; ela é essencial para garantir a consistência da nova arquitetura de informação.

---

## 5. Próximos Passos Recomendados

Com base na análise consolidada, o plano de ação imediato foi redefinido para focar em fortalecer a fundação do processo de governança antes de prosseguir para a implementação.

1.  **Expandir o Escopo Formal da Spec:** Atualizar o arquivo `spec.md` da Spec 0021 para incluir formalmente a re-arquitetura da CLI e a consolidação documental holística como entregáveis mandatórios.
2.  **Generalizar o Processo de Análise Técnica:** Refinar o `decision-brief-boilerplate.md`, transformando a seção específica de "Estratégia de Testes" em uma "Estratégia de Validação e Qualidade" mais genérica e aplicável a qualquer consumidor do framework.
3.  **Aprofundar a Análise da Spec 0021:** Retroativamente aplicar o novo boilerplate ao `decision-brief.md` da Spec 0021, mas com opções especializadas que reflitam o alto padrão exigido para o nosso próprio repositório, incluindo TDD, BDD e a introdução de Domain-Driven Design (DDD).
4.  **Replanejar a Implementação:** Somente após a conclusão dos passos acima, iniciar a reescrita do `plan.md` e `tasks.md`, que agora serão baseados em um escopo mais preciso e em uma análise de saúde técnica mais profunda.

Este documento serve agora como a memória canônica desta importante etapa de revisão, garantindo que o valor gerado não se perca.
