# Research: Melhores Práticas para Concorrência em Projetos de Design Aberto

> Data: 2026-04-29
> Tópico: Gestão de specs simultâneas e estrutura de backlog em projetos OSS.

## 1. Introdução

Gerenciar solicitações simultâneas de comentários (RFCs) e especificações de design em projetos de código aberto exige uma combinação de processos claros, comunicação transparente e governança estruturada. Quando várias propostas estão em andamento simultaneamente, o objetivo é evitar confusão, duplicidade de esforço e garantir que as decisões sejam tomadas com alinhamento da comunidade.

## 2. Melhores Práticas Principais

### 1. Estabelecer um Processo de RFC Formalizado

- **Template Padronizado:** Exigir que todas as propostas de design sigam um template consistente. Seções principais devem incluir:
  - **Motivação/Problema:** Por que esta mudança é necessária?
  - **Detalhes de Design/Implementação:** A solução proposta.
  - **Alternativas Consideradas:** Por que esta é a melhor abordagem?
  - **Desvantagens:** Reconhecer trade-offs e riscos.
  - **Impacto:** Quem e o que será afetado?
- **Repositório Centralizado:** Armazenar todas as RFCs em um repositório dedicado (ou pasta específica, como `.specify/specs/`). Isso garante uma fonte única de verdade.
- **Ciclo de Vida Definido:** Usar estados distintos (ex: `Draft`, `Proposed`, `Under Review`, `Accepted`, `Rejected`, `Implemented`).

### 2. Gerenciar Concorrência e Coordenação

- **Escopo Pré-submissão (Abordagem Issue-First):** Antes de escrever uma spec completa, abrir uma Issue para discutir o intento. Isso ajuda a identificar sobreposições e colaborações precocemente.
- **Rastreamento e Gestão de Projetos:** Usar ferramentas (como GitHub Projects ou `backlog.md`) para visualizar specs ativas, categorizando-as por área ou impacto.
- **Comunicação Assíncrona:** Manter o debate principal no Pull Request ou Issue para transparência histórica.

### 3. Promover Consenso e Transparência

- **Stakeholders Claros:** Identificar quem precisa assinar a proposta, evitando o "design por comitê" excessivo.
- **Documentar Decisões:** Tratar RFCs aceitas como registros históricos imutáveis que capturam a racionalidade por trás das escolhas.
- **Governança para Resolução de Conflitos:** Recorrer a estruturas estabelecidas (comitês técnicos ou mantenedores) quando houver propostas conflitantes.

### 4. Manter o Processo Leve

- **Evitar Over-Engineering:** O processo deve ser ágil, não um entrave burocrático. Focar no essencial para o buy-in dos stakeholders.
- **Ênfase em "Software Funcional":** RFCs devem esclarecer decisões arquiteturais de alto nível, não ser especificações de implementação exaustivas que exigem manutenção constante.

## 3. Por que isso funciona

- **Previne Perda de Conhecimento:** Cria um "registro de auditoria de decisão".
- **Democratiza a Tomada de Decisão:** Oferece uma plataforma inclusiva para contribuidores.
- **Reduz Fricção:** Antecipa discussões de design, minimizando o vaivém durante revisões de código.

## 4. Fontes

- [1] milvus.io
- [2] fuchsia.dev
- [3] thoughtworks.com
- [4] innersourcecommons.org
- [5] dev.to
- [6] increment.com
