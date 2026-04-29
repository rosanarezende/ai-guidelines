# Pesquisa de Reestruturação do Repositório (Vaga Intermediária)

## 1. O Problema Atual

O repositório `ai-guidelines` evoluiu de um mero agregador de tutoriais Markdown para um **CLI Executável** e ecossistema de SDK validado. Contudo, a estrutura de pastas ainda reflete o estágio embrionário:

- `workflows/`: Originalmente usado para mapear heurísticas humanas (ex. `project-init.md`). Com o CLI, a inicialização tornou-se baseada em código e abstraída do usuário via script shell (`yarn ai-cli init`).
- Regras de Negócio de CLI (Business Rules): Estão acopladas na pasta de documentação genérica ou não consolidadas estruturalmente num ponto único da verdade.
- Co-location parcial: O ecossistema está começando a adotar Feature-Sliced Design / colocation em `/scripts/ai-guidelines-cli/`, mas a doc permanece difusa.

## 2. Benchmarks de Mercado (Ferramentas CLI & AI-First OSS)

Ao analisarmos repositórios maduros de ferramentas (ex.: ESLint, Turborepo, NPM CLI, Vue CLI):

1. **Estrutura Flat no Raiz e Pastas por Domínio:**
   Eles minimizam pastas organizacionais superficiais. Uma CLI não possui "workflows" para usuários se a CLI em si _é_ o workflow.
2. **Business Rules Parity:**
   A "Specification" ou "Architecture" define a API da aplicação. Repositórios maduros mapeiam as regras no formato de RFCs ou numa pasta `/docs/architecture/`, ligadas 1:1 com os testes.
3. **TDD Living Documentation:**
   O código consumível por IAs funciona melhor quando a documentação da ferramenta que ela deverá usar não conflita com um tutorial antigo em outra pasta.

## 3. Avaliação da Estrutura Atual (Pós-Insight)

**Pastas Existentes Identificadas como Legado:**

- `workflows/`: Totalmente obsoleta. A inicialização e manutenção (`project-init.md`, `project-scaffolding.md`) agora pertencem à própria CLI. Práticas em time (`ai-review-ritual.md`) devem migrar para `docs/process/` ou `rules/`.
- `for-claude/`, `for-codex/`, `for-gemini/`: Pastas focadas em tutoriais fragmentados para vendors específicos. O ideal é unificar o conhecimento em `rules/global-rules.md` (Agnóstico) ou `docs/vendors/`.
- `scripts/`: Historicamente usado para pequenos bash scripts. Hospedar a CLI inteira sob `/scripts/cli/ai-guidelines-cli` se provou uma arquitetura profunda, confusa e de difícil indexação.

**Pastas Estratégicas a Preservar:**

- `design/`, `rules/`, `templates/`, `docs/`, `.specify/`, `adrs/`: Todas cumprem papéis definidos e singulares na governança das IAs e da UI.

## 4. Proposta de Reestruturação (Nova Fase)

Para transicionar do aspecto de "repositório de tutoriais soltos" para um **CLI/Framework Public-Ready**, a arquitetura adotará fatiamento de escopo por funcionalidade:

1. **Expurgo do Legado (Consolidação)**
   - Deletar `for-codex`, `for-gemini`, `for-claude` e exportar seus valores críticos para `docs/vendors/` (ou descartar).
   - Mover remanescentes úteis de `workflows/` para `docs/process/`.

2. **Promoção da CLI à Raiz do Repositório (`cli/`)**
   - Retirar a CLI das engrenagens ocultas de `scripts/` e trazê-la para o top-level.
   - Dividir o código por escopo funcional, visando Single Responsibility:
     - `cli/init/` -> Lógica específica de instanciar novos repositórios.
     - `cli/adopt/` -> Lógica de adequação para repositórios legados.
     - `cli/formatters/` -> Lidando com ecossistemas (ex.: Prettier, Biome).
     - `cli/core/` -> Motor (engine, bash runner, text-io).
     - `cli/testing/` -> Utilitários gerais e o runner da integração.
3. **Co-location Estrita:** Os testes (`*.test.mjs`) navegarão emparelhados com as funcionalidades distribuídas nessas novas pastas.
