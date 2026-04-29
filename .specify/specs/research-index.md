# Research Index (Base de Conhecimento RPI)

> **Fonte de Verdade**: `.specify/specs/research-index.md`
> **Propósito**: Centralizar a Inteligência do repositório. Agentes de IA recém-chegados devem usar este índice para recuperar contexto (RAG orgânico) sobre arquiteturas passadas, decisões de design e estudos de plataforma. Em vez de vasculhar dezenas de branches antigas, leia os links aqui listados.
> **Manutenção**: Toda vez que uma Spec for finalizada, o desenvolvedor (humano ou IA) DEVE transpor os arquivos de sua pasta `/research` local para este Index.

---

## 🏛️ Governança de IA e Engenharia Prompt

Estudos técnicos sobre adoção, comportamento e _guardrails_ das plataformas líderes de mercado de Inteligência Artificial.

- [Agentic Planning Modes & Artifact Management](./researchs/governance/2026-04-22-agentic-planning-modes.md) _(Diagnóstico arquitetural entre Cursor, Copilot, Aider e Claude Code vs SDD)_.
- [Diagnóstico de Sobreposição: AGENTS.md vs global-rules.md](./researchs/governance/2026-04-22-rules-overlap-diagnostic.md) _(Análise sobre entropia de diretivas no payload injection)_.

- [Arquitetura RAG Local e Prompt Caching](./researchs/governance/2026-04-26-research-prompts-analysis.md)
- [Benchmarks de Indexação para Adoção IA](./researchs/governance/2026-04-22-benchmarks-research-index-patterns.md)
- [Benchmarks: Agentic Dev Patterns (Primeiros Testes)](./researchs/governance/2026-04-26-benchmarks-ai-first-dev.md)
- [Governança SDD v2: Diagnóstico e Compliance](./researchs/governance/2026-04-26-governance-architecture-v2.md)

- [Benchmark de Governança e Testes BDD (Node 24)](./researchs/governance/2026-04-23-cli-governance-benchmark.md) _(Comparativo Husky/Backstage e infra de testes)_.
- [Catálogo Exaustivo de Regras de Negócio (BR-CLI)](./researchs/governance/2026-04-23-business-rules-catalog.md) _(Mapeamento de 36+ regras de governança)_.

- [Mapeamento: Documentação vs Regras Acionáveis](./researchs/governance/2026-04-26-mapping-doc-to-rules.md) _(Classificação de arquivos em humano, universal e opt-in)_.
- [Síntese de Insights de Transcrições (Temas 1-6)](./researchs/governance/2026-04-26-governance-synthesis.md) _(Destilação de vídeos/artigos sobre workflows agentic e eficiência)_.
- [Compliance Multi-Modelo: Regras Fragmentadas vs Runtime Monolítico](./researchs/governance/2026-04-29-agents-vs-rules-compliance.md) _(Veredito sintético para compilação monolítica contra ManyIH)_.
- [Concorrência em Specs e Branches de Design](./researchs/governance/2026-04-29-concurrency-best-practices.md) _(Boas práticas para specs simultâneas, RFCs e coordenação assíncrona)_.

## 🏗️ Design e Decisões de Arquitetura (Agnostic)

Decolamentos de arquitetura de código, CLI, e refatorações complexas que afetaram o ecossistema.

- [Reestruturação Monorepo e CLI](./researchs/architecture/2026-04-22-architecture-restructure.md)
- [Paridade de Business Rules do Motor](./researchs/architecture/2026-04-22-business-rules-parity.md)
- [Configuração Nativa do Node.js Test Runner](./researchs/architecture/2026-04-22-node-config-file.md) _(Substituição de scripts package.json por node.config.json)_.
- [Análise Multica (Case de Estudo do Layout Público)](./researchs/architecture/2026-04-22-multica-analysis.md)
- [Separação Arquitetural: TDD vs BDD](./researchs/architecture/2026-04-28-tdd-vs-bdd-separation.md) _(Racional para divisão de regras técnicas por domínio e idioma)_.
- [Governança de Agentes por Compilador Monolítico em Runtime](./researchs/architecture/2026-04-29-monolithic-runtime-compiler-governance.md) _(Pesquisa arquitetural completa sobre hierarquia de instruções, lost-in-the-middle e topologia do prompt)_.

## 🛸 Open Source & Publicação

Estudos visando preparar nosso framework interno CLI e guidelines para a comunidade externa.

- [Benchmarks de Open Source Public-Ready](./researchs/oss/2026-04-22-benchmarks-public-oss.md)
- [Estratégia de Notificações de Atualização (Interino)](./researchs/oss/2026-04-22-update-notifications-strategy.md)
- [Benchmarks de Formato de Roadmap & Backlog](./researchs/oss/2026-04-26-roadmap-format-benchmarks.md) _(Análise de 9 projetos OSS para definição de lifecycle de specs)_.

---

_Fim do Índice atual._
