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
- [Auditoria Editorial dos Boilerplates SDD](./researchs/governance/2026-04-30-boilerplates-audit.md) _(Base do bloco A da Spec 0018: drift real dos boilerplates, lacunas e formato do decision-brief)_.
- [Reconciliação do Legado b9efb83](./researchs/governance/2026-04-30-b9efb83-reconciliation.md) _(Purga radical regra-a-regra do conteúdo pré-research da Spec 0018)_.
- [Benchmark Externo: Akita LLM Coding Benchmark](./researchs/governance/2026-05-05-akita-benchmark-analysis.md) _(Evidência empírica cruzada para GR-0001, GR-0004, GR-0005 e o desvio controlado do eval para N=1)_.
- [Benchmarks de LLM para Governança de IA](./researchs/governance/2026-05-05-benchmark-LLM-para-governanca-AI.md) _(Leitura arquitetural ampla de SWE-bench e benchmarks 2025-2026 aplicada ao framework)_.
- [Viabilidade de Integração com Projetos Externos](./researchs/governance/2026-05-05-integration-viability.md) _(Compatibilidade de licenças, fair use e limites de integração com tooling e benchmarks externos)_.
- [Prompts Canônicos do Eval Amostral da Spec 0018](./researchs/governance/2026-05-06-eval-prompts.md) _(Corpus manual de avaliação para secrets, error swallowing e concorrência insegura)_.
- [Resultados do Eval Amostral da Spec 0018](./researchs/governance/2026-05-06-eval-results.md) _(Consolidação do baseline Claude/Codex/Gemini após a sanitização final do Stage 2)_.
- [Outputs Brutos do Eval Amostral da Spec 0018](./researchs/governance/2026-05-06-spec-0018-eval-outputs/README.md) _(Arquivo-índice para as 9 execuções salvas do baseline manual)_.

## 🏗️ Design e Decisões de Arquitetura (Agnostic)

Decolamentos de arquitetura de código, CLI, e refatorações complexas que afetaram o ecossistema.

- [Reestruturação Monorepo e CLI](./researchs/architecture/2026-04-22-architecture-restructure.md)
- [Paridade de Business Rules do Motor](./researchs/architecture/2026-04-22-business-rules-parity.md)
- [Configuração Nativa do Node.js Test Runner](./researchs/architecture/2026-04-22-node-config-file.md) _(Substituição de scripts package.json por node.config.json)_.
- [Análise Multica (Case de Estudo do Layout Público)](./researchs/architecture/2026-04-22-multica-analysis.md)
- [Separação Arquitetural: TDD vs BDD](./researchs/architecture/2026-04-28-tdd-vs-bdd-separation.md) _(Racional para divisão de regras técnicas por domínio e idioma)_.
- [Governança de Agentes por Compilador Monolítico em Runtime](./researchs/architecture/2026-04-29-monolithic-runtime-compiler-governance.md) _(Pesquisa arquitetural completa sobre hierarquia de instruções, lost-in-the-middle e topologia do prompt)_.
- [Benchmark de Rules Content em Provedores e OSS Curado](./researchs/architecture/2026-04-30-benchmark-rules-content.md) _(Padrões e anti-padrões de regras editoriais em Anthropic, OpenAI, Google e OSS selecionado)_.
- [Bugs Empíricos em Código Gerado por IA](./researchs/architecture/2026-04-30-empirical-bugs-ai-code.md) _(Base para race conditions, memory leaks e descarte de N+1 como categoria evidence-backed)_.
- [Taxonomias Externas de Defeitos](./researchs/architecture/2026-04-30-external-bug-taxonomies.md) _(Mapeamento CWE/CERT/Sonar/OWASP-LLM para o catálogo de regras do framework)_.
- [Spec-Driven Tools e Regras de Governança](./researchs/architecture/2026-04-30-spec-driven-tools-rules.md) _(Como ferramentas SDD e runtimes agentic tratam regras editoriais, escopo e decisões pré-design)_.
- [Baseline de Tokens e Orçamento Tok-H](./researchs/architecture/2026-04-30-tokens-baseline-budget.md) _(Medição instrumental do runtime e definição do teto heurístico adotado na Spec 0018)_.
- [Topologia do Runtime AGENTS.md](./researchs/architecture/2026-05-06-topologia-runtime.md) _(Diagnóstico da dispersão semântica no compilado e fundação para as zonas temáticas adotadas em `[DEC-0019-B02]`)_.
- [Trampolins e Provider Guardrails contra Context Rot](./researchs/architecture/2026-05-06-trampolins-e-guardrails.md) _(Mapeamento dos arquivos nativos de IA/IDE para 2026 e racional do hard-redirect adotado em `[DEC-0019-B01]`)_.

## 🛸 Open Source & Publicação

Estudos visando preparar nosso framework interno CLI e guidelines para a comunidade externa.

- [Benchmarks de Open Source Public-Ready](./researchs/oss/2026-04-22-benchmarks-public-oss.md)
- [Estratégia de Notificações de Atualização (Interino)](./researchs/oss/2026-04-22-update-notifications-strategy.md)
- [Benchmarks de Formato de Roadmap & Backlog](./researchs/oss/2026-04-26-roadmap-format-benchmarks.md) _(Análise de 9 projetos OSS para definição de lifecycle de specs)_.

---

_Fim do Índice atual._
