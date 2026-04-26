# Diagnóstico de Sobreposição: AGENTS.md vs global-rules.md

**Data**: 2026-04-21  
**Contexto**: Durante o refinamento do Framework da Spec 0004.1, observou-se que a arquitetura orgânica de regras do repositório acarretou redundância e conflito de escopo entre o payload de injeção (`AGENTS.md`) e a constituição universal (`global-rules.md`).

## 1. O Conflito de Flow (Exemplo Clássico)

- **`global-rules.md` (Regra 3):** Exige a execução de formatação (`yarn format`) **antes do git commit**.
- **`AGENTS.md` (Regra 5):** Exigia a execução de testes e formatações **antes do git push** (já corrigido para refletir a escolha da equipe pelo pre-commit).

## 2. Leak de Escopo e Redundância de Tokens

O `AGENTS.md` (como vetor injetor via CLI nos outros repositórios) deveria ser restrito apenas à **Fase 0 à Fase 3** engatilhadas de sobrevivência imediata. Contudo, atualmente há severa repetição:

- **Prime Directive (Agnostic SDD Override)** está explícita como Rule 0 no `AGENTS.md` inteiramente repetida na Rule 14 do `global-rules.md`.
- **Rito RPI e Atualização de Tracking System** está nas Rules 8/9/10 do `AGENTS.md` e espelhado nas Rules 10 e 11 do `global-rules.md`.

## 3. Consideração Arquitetural Futura

Esta sobreposição gera confusões semânticas nos motores de IA e desperdiça _Tokens de Contexto_ a cada request.
**Opção de Investigação Mapeada:**

- Deletar fisicamente comandos de _Git_ e do _Override_ puramente tático do `global-rules.md`.
- Consagrar o `global-rules.md` _exclusivamente_ para regras de negócios vitais não-táticas que aplicam a qualquer Dev humano ou AI: Protocolos de Segurança, Guidelines de Engenharia e UI e Alocação de Modelos (Flash/Pro).

_Este diagnóstico fica oficializado para futura auditoria e reestruturação da governança geral do framework._
