# Research Index (Base de Conhecimento RPI)

> **Fonte de Verdade**: `.specify/specs/research-index.md`
> **Propósito**: Centralizar a Inteligência do repositório. Agentes de IA recém-chegados devem usar este índice para recuperar contexto (RAG orgânico) sobre arquiteturas passadas, decisões de design e estudos de plataforma. Em vez de vasculhar dezenas de branches antigas, leia os links aqui listados.
> **Manutenção**: Toda vez que uma Spec for finalizada, o desenvolvedor (humano ou IA) DEVE transpor os arquivos de sua pasta `/research` local para este Index.

---

## 🏛️ Governança de IA e Engenharia Prompt

Estudos técnicos sobre adoção, comportamento e _guardrails_ das plataformas líderes de mercado de Inteligência Artificial.

- [Agentic Planning Modes & Artifact Management](./researchs/0004.1-sdd-contingency/agentic-planning-modes.md) _(Diagnóstico arquitetural entre Cursor, Copilot, Aider e Claude Code vs SDD)_.
- [Diagnóstico de Sobreposição: AGENTS.md vs global-rules.md](./researchs/0004.1-sdd-contingency/rules-overlap-diagnostic.md) _(Análise sobre entropia de diretivas no payload injection)_.

- [Arquitetura RAG Local e Prompt Caching](./researchs/0004-ai-dev-foundations-public-ready/research-prompts-analysis.md)
- [Benchmarks de Indexação para Adoção IA](./researchs/0004-ai-dev-foundations-public-ready/benchmarks-research-index-patterns.md)
- [Benchmarks: Agentic Dev Patterns (Primeiros Testes)](./researchs/0004-ai-dev-foundations-public-ready/benchmarks-ai-first-dev.md)
- [Governança SDD v2: Diagnóstico e Compliance](./researchs/0004-ai-dev-foundations-public-ready/governance-architecture-v2.md)

- [Benchmark de Governança e Testes BDD (Node 24)](./researchs/0005-cli-adopt-refactor/cli-governance-benchmark.md) _(Comparativo Husky/Backstage e infra de testes)_.
- [Catálogo Exaustivo de Regras de Negócio (BR-CLI)](./researchs/0005-cli-adopt-refactor/business-rules-catalog.md) _(Mapeamento de 36+ regras de governança)_.

## 🏗️ Design e Decisões de Arquitetura (Agnostic)

Decolamentos de arquitetura de código, CLI, e refatorações complexas que afetaram o ecossistema.

- [Reestruturação Monorepo e CLI](./researchs/0004-ai-dev-foundations-public-ready/architecture-restructure.md)
- [Paridade de Business Rules do Motor](./researchs/0004-ai-dev-foundations-public-ready/business-rules-parity.md)
- [Configuração Nativa do Node.js Test Runner](./researchs/0004-ai-dev-foundations-public-ready/node-config-file.md) _(Substituição de scripts package.json por node.config.json)_.
- [Análise Multica (Case de Estudo do Layout Público)](./researchs/0004-ai-dev-foundations-public-ready/multica-analysis.md)

## 🛸 Open Source & Publicação

Estudos visando preparar nosso framework interno CLI e guidelines para a comunidade externa.

- [Benchmarks de Open Source Public-Ready](./researchs/0004-ai-dev-foundations-public-ready/benchmarks-public-oss.md)
- [Estratégia de Notificações de Atualização (Interino)](./researchs/0004-ai-dev-foundations-public-ready/update-notifications-strategy.md)

---

_Fim do Índice atual._
