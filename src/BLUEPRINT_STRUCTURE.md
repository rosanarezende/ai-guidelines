# Blueprint Governance — AI Guidelines Framework

Este documento descreve a estrutura de governança técnica e a motivação por trás de cada componente no diretório `src/`, servindo como guia para humanos e IAs durante o desenvolvimento do motor de governança.

## 🏗️ Estratégia de Arquitetura (DDD)

Adotamos **Domain-Driven Design (DDD)** para isolar as regras de negócio complexas das tecnologias de infraestrutura (filesystem).

| Camada             | Pasta                 | Motivação                                                                                                            |
| :----------------- | :-------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **Application**    | `src/app/`            | Orquestra casos de uso. Garante que fluxos complexos (ex: registrar um item) sejam atômicos e sigam a ordem correta. |
| **Domain**         | `src/domain/`         | Onde reside a inteligência do framework. Não conhece o filesystem ou o mundo externo.                                |
| **Infrastructure** | `src/infrastructure/` | Implementa os "detalhes" técnicos. Ex: como salvar um arquivo no Windows usando Node.js.                             |

---

## 📜 Mapeamento de Regras de Negócio [BR-CLI-*]

### 1. Políticas de Governança (`PolicyService`)

- **[BR-CLI-POLICY-01] Promoção**: Rege como um `proposal` vira `spec`. Exige maturidade (`review`/`done`).
- **[BR-CLI-POLICY-02] Incidentes**: Exige severidade e vinculação física para análise de causa raiz (RCA).
- **[BR-CLI-POLICY-03] Experimentos**: Exige hipótese e métricas. Rege o Shape-up (won -> spec) e Clean-up (lost -> limpo).

### 2. Integridade do Registro (`RegistryService`)

- **[BR-CLI-REGISTRY-01]**: Garante que o `registry.yml` seja a Fonte Única de Verdade.
  - Unicidade de IDs.
  - Imutabilidade de `id` e `createdAt`.
  - Preservação de comentários humanos (Human-friendly YAML).

### 3. Gestão de Workspace (`WorkspaceService`)

- **[BR-CLI-WORKSPACE-01]**: Define o mapeamento físico.
  - Cria pastas apenas para itens densos (`spec`, `incident`, `experiment`, `exploration`).
  - Isola itens virtuais (`patch`, `proposal`), impedindo IO acidental.

### 4. Orquestração (`Application`)

- **[BR-CLI-APP-01]**: Fluxo de Registro atômico (Valida -> Registra -> Cria Pasta).
- **[BR-CLI-APP-02]**: Fluxo de Promoção seguro (Evolui estado documental e físico).

---

## 🧪 Estrutura de Blueprints (Testes)

Os testes são a **Documentação Viva** do sistema. Eles devem ser mantidos em `it.skip` até que a regra de negócio seja validada e a implementação iniciada.

| Arquivo de Teste                                          | Alvo da Regra                                               |
| :-------------------------------------------------------- | :---------------------------------------------------------- |
| `src/domain/policy/Pillars.test.ts`                       | Definição dos 7 Pilares MECE e requisitos de cada tipo.     |
| `src/domain/policy/Promotion.test.ts`                     | Regras de transição (Shape-up, maturidade, imutabilidade).  |
| `src/domain/registry/Integrity.test.ts`                   | Integridade do `registry.yml` e preservação de comentários. |
| `src/domain/workspace/Isolation.test.ts`                  | Root `.governance/`, itens virtuais e Composição Atômica.   |
| `src/app/use-cases/RegisterItem.test.ts`                  | Atomicidade e lógica "Policy-First" no registro.            |
| `src/app/use-cases/PromoteItem.test.ts`                   | Orquestração segura da evolução de itens.                   |
| `src/infrastructure/filesystem/FileSystemAdapter.test.ts` | Segurança de escopo e atomicidade técnica de IO.            |

---

## 🚀 Workflow de Manutenção

1. **Rethink**: Se uma regra mudar, atualize este arquivo e o Blueprint correspondente.
2. **RED**: Ative o teste (`it.skip` -> `it`).
3. **GREEN**: Implemente o código mínimo para passar.
4. **REFACTOR**: Melhore o código mantendo o teste verde.
