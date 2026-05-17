<!-- ai-guidelines-template: spec-boilerplate v=1 -->

# Spec 0021 — Governance Information Architecture

> Status: Draft
> Author: Codex
> Date: 2026-05-08
> Owner: Rosana Rezende
> Tipo de spec: evidence-driven
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Plan: [`./plan.md`](./plan.md)

> **Princípio de imutabilidade:** após status `In Review`, este arquivo só
> muda por consenso explícito. Decisões em aberto vão para `plan.md` (vivo).
>
> **Princípios da Escrita:** ver `.core/process/governance-foundation.md` §
> "Princípios da Escrita" (agnosticismo humano/IA, BR IDs, contratos).

---

## 🎯 Objetivo

O framework já distribui regras, templates, roadmap e pesquisas úteis, mas o estado canônico da governança continua difuso. Hoje `backlog.md` e `historico.md` concentram memória narrativa, `.core/process/governance-foundation.md` mistura constituição viva com débito arquitetural, `.core/rules/`, `docs/`, `adrs/` e `.specify/` coexistem sem uma política explícita de "qual gênero mora onde", e artefatos sem spec formal ainda entram no fluxo de valor de forma ad-hoc.

Após o gate humano de 2026-05-09, o objetivo da 0021 deixa de ser apenas decidir a arquitetura de informação e passa a entregar a transição oficial do framework de **Spec-Driven** para **Governance-Driven**. Isso preserva a tese original da spec e a expande em quatro frentes complementares:

- consolidar o modelo **repo-first híbrido** com estado canônico estruturado, artefatos não-spec como origem legítima de valor e `.governance/` como novo root unificado do consumidor;
- fechar a política de placement documental do meta-framework, incluindo fronteira entre constituição operacional, ADRs, runtime rules, templates distribuídos e documentação descritiva;
- **re-arquitetar a CLI de governança** com DDD + TDD/BDD, trocando a fundação legada por domínios explícitos e contratos coerentes com o novo modelo;
- inverter a documentação executável para um modelo de **Living Documentation**, em que testes `it/test` com IDs `[BR-CLI-*]` viram a Fonte Única de Verdade e alimentam artefatos estruturados em `.governance/`.

O resultado esperado desta spec é uma arquitetura de informação única e explicável, acompanhada de uma fundação técnica compatível com ela. Ao final, uma pessoa ou LLM deve conseguir responder de forma curta e objetiva:

- onde vive a verdade canônica do framework;
- como artefatos `spec`, `spike`, `fix`, `patch`, `incident`, `proposal` e `experiment` entram no fluxo de valor;
- como o novo workspace `.governance/` organiza estado, templates, handoffs, telemetria e execução;
- como a CLI monta, valida e distribui esses artefatos sem drift entre código, testes e documentação.

---

## 🧭 Origem Editorial

- **Histórico de numeração:** esta iniciativa era a candidata `0020-governance-information-architecture` até 2026-05-07. Foi renumerada para **0021** quando `npm-publication` foi promovida após a auditoria do `package.json`; a branch original foi reaproveitada pela 0020 e a abertura formal desta spec ficou pendente até o fechamento daquela sequência.
- **Fonte do insight:** a raiz da spec está no Stage 1 da Spec 0018 (2026-04-30), quando ficou explícito que `.core/process/governance-foundation.md` opera como constituição viva, mas coabita sem fronteira clara com documentos descritivos e com decisões arquiteturais de outra natureza. Esse diagnóstico foi reforçado em 2026-05-07 por benchmark comparativo de frameworks AI-driven, que expôs três gêneros ainda ausentes no framework: PRD/intake estruturado, contratos de handoff e telemetria.
- **Cross-ref tático que vira pergunta arquitetural:** `[DEC-0018-A06]` capturou o débito imediato sobre onde deveria viver a seção "Tipos de spec"; a 0021 responde esse débito em nível de arquitetura de informação, não como ajuste isolado de redação.
- **Virada de Stage:** em 2026-05-09 o gate humano fechou `decision-brief.md` em status `Resolvido`, expandindo formalmente o escopo para cobrir re-arquitetura da CLI, Living Documentation, composição modular e adoção de `.governance/` como root unificado. Em 2026-05-10, o 7º pilar (`experiment`) foi adicionado com base em princípios de Growth Engineering (hipótese, métricas e ciclo de vida won/lost/inconclusive).

---

## 📦 Escopo

### Dentro do escopo

- Definir o modelo canônico de estado **repo-first híbrido**: registro estruturado versionado no repositório como fonte primária, Markdown derivado para humanos/IA e projeções futuras apenas como derivados.
- Tratar artefatos não-spec como origem legítima de valor, com taxonomia mínima, relações e regras de promoção/resolução baseadas nos 7 pilares aprovados no gate: `spec`, `spike`, `fix`, `patch`, `incident`, `proposal` e `experiment`.
- Formalizar a fronteira entre `sdd_dir`, `spec_workspace_dir` e o lar físico do estado estruturado, consolidando o novo root `.governance/` no lado do consumidor.
- Reservar o lar canônico para gêneros ainda não implementados, mas já aprovados como necessidade futura: PRD/intake estruturado, handoff/decision logs e telemetria do framework.
- Decidir e materializar o **carrier canônico** da política de arquitetura de informação: catálogo central, reorganização física direcionada ou modelo híbrido.
- Decidir a fronteira entre constituição operacional viva e decisões arquiteturais formais, incluindo a refatoração/renomeação de `governance-foundation.md` para refletir o novo paradigma Governance-Driven.
- Reorganizar fisicamente o próprio `.core/rules/` dentro deste repositório, alinhando topologia, taxonomia e runtime sem confundir esse trabalho com a fragmentação distribuída no consumidor.
- Tratar explicitamente o placement canônico dos templates distribuídos herdados da Spec 0020 e evoluí-los do espelhamento de boilerplates inteiros para uma arquitetura de composição modular.
- **Re-arquitetar e refatorar completamente a CLI de governança** (atualmente em `/cli`) sob DDD + TDD/BDD, substituindo a fundação legada por domínios explícitos, linguagem ubíqua e limites de contexto claros.
- Implementar o paradigma de **Living Documentation**: os testes com IDs `[BR-CLI-*]` tornam-se a Fonte Única de Verdade e passam a alimentar artefatos estruturados em `.governance/` via extração automatizada.
- Implementar uma **engine de composição atômica** capaz de montar artefatos finais de governança a partir de `partials` e `recipes`, abandonando o espelhamento cego de arquivos integrais.
- Melhorar o próprio processo de governança com a validação retroativa do novo bloco de saúde técnica do `decision-brief.md`, usando esta spec como primeiro caso de uso real.
- Entregar o recorte arquitetural das **Fases 1, 2 e 3** da 0021: contrato, novo estado estruturado no repo e visões derivadas mínimas; **Fases 4 e 5** ficam apenas mapeadas.

### Fora do escopo (vira spinoff ou fica em outra spec)

- Fragmentação distribuída de `AGENTS.md` em subdiretórios do consumidor — continua sendo escopo da Spec 0011.
- Implementação completa do pipeline de PRD/intake, dos contratos de handoff ou da telemetria/dashboard — esta spec reserva o lar canônico, define o contrato e prepara a fundação técnica.
- Introdução de SQLite, dashboard web, backend hospedado ou serviço externo como fonte primária — Fases 4 e 5 ficam apenas mapeadas.
- Migração big-bang de todo o histórico do repositório para o novo modelo antes de provar um lote representativo.
- Novas automações de produto que dependem do contrato final, mas não são necessárias para fundar a arquitetura agora, como workflows completos de intake/status beyond Stage 2.
- Adoção de dependências de terceiros novas para parsing/rendering sem aprovação humana explícita, conforme governança do repositório.

---

## 🎁 Entregáveis de Stage 2

- Contrato canônico do novo workspace `.governance/`, incluindo `registry.yml` como estado primário visível e versionado.
- Arquitetura macro da nova CLI com bounded contexts explícitos, cobrindo pelo menos `Registry`, `GovernanceWorkspace`, `RulesEngine`, `TemplateEngine` e `LivingDocumentation`.
- Estratégia de migração controlada entre os paths legados (`.ai-guidelines/`, `.specify/`) e o novo root unificado.
- Reestruturação física dos templates distribuídos em torno de `recipes` e `partials`, eliminando redundância de boilerplates integrais.
- Pipeline de extração automática dos testes `[BR-CLI-*]` para artefato estruturado dentro de `.governance/`, protegido por CI contra drift.
- Atualização dos contratos documentais e operacionais do framework para refletir o paradigma Governance-Driven, os 6 pilares de valor e a nova fronteira foundation/ADR.
- Prova mínima do modelo repo-first híbrido com artefatos além de `spec`, evitando que o novo estado nasça espec-cêntrico por inércia.

---

## 🧱 Diretrizes de Implementação

- O `registry.yml` representa **estado de domínio**, não lógica de renderização; receitas de montagem pertencem ao domínio `TemplateEngine`.
- A re-arquitetura da CLI deve separar explicitamente `Application`, `Domain` e `Infrastructure`, evitando novo acoplamento transversal por path ou modo de execução.
- Toda feature nova da CLI deve nascer por TDD/BDD, com testes de comportamento nomeados e rastreáveis por IDs `[BR-CLI-*]` sempre que a regra de negócio for do domínio da CLI.
- `partials` devem ser blocos Markdown completos e válidos por contrato; a composição deve ocorrer em fronteiras estruturais, nunca por concatenação textual arbitrária.
- A pipeline de Living Documentation deve ser determinística, auditável e falhar se houver drift entre suíte de testes e artefato gerado.
- A compatibilidade com o legado deve existir como camada de migração explícita, e não como acoplamento invisível permanente no novo design.
- Mudanças em `.core/rules/`, runtime compilado, hooks, smoke tests, publish surface e documentação pública devem ser tratadas como partes da mesma arquitetura, não como housekeeping posterior.

---

## ✅ Critérios de Aceite (alto nível)

- [ ] Existe uma resposta única e curta para: "onde vive o estado canônico de PRDs, incidentes, specs e entregas, e como isso vira backlog/histórico?".
- [ ] A arquitetura declara explicitamente o papel de artefatos não-spec como origem de valor, com IDs, relações e modo de resolução/promoção canônicos.
- [ ] A spec decide explicitamente o carrier da política de informação, a fronteira ADR vs foundation e o placement interno de `.core/rules/`.
- [ ] A fronteira `sdd_dir` vs `spec_workspace_dir` está documentada com defaults, responsabilidades e impacto sobre automações futuras.
- [ ] O novo root `.governance/` está definido como contrato canônico do consumidor, incluindo o lar do `registry.yml`.
- [ ] A CLI passa a ter uma arquitetura de domínio explícita compatível com o novo modelo Governance-Driven.
- [ ] Os testes `[BR-CLI-*]` são capazes de alimentar artefato estruturado em `.governance/` sem drift entre comportamento e documentação.
- [ ] A geração de artefatos deixa de depender de espelhamento cego de arquivos inteiros e passa a operar por composição modular com `partials` e `recipes`.
- [ ] O recorte da própria 0021 está fechado: Fases 1, 2 e 3 entram como entregável desta spec; Fases 4 e 5 ficam apenas mapeadas como evolução posterior.
- [ ] Pipeline de check + test verde, sempre (ex.: `yarn check && yarn test` no `ai-guidelines`; substitua pelo equivalente do stack do consumidor — `npm test`, `pnpm verify`, `cargo test`, `pytest`, etc.).
- [ ] PR Draft revisado e aprovado por humano antes de Ready.

---

## 🔬 Pesquisa de contexto

- [`./decision-brief.md`](./decision-brief.md) — gate humano de decisões pré-design, agora fechado em `Resolvido`.
- [`./research/2026-05-09-post-gate-gap-analysis.md`](./research/2026-05-09-post-gate-gap-analysis.md) — gap analysis pós-gate que fundamenta a expansão de escopo para CLI, Living Documentation e composição modular.
- [`.specify/specs/researchs/architecture/2026-05-08-consumer-bootstrap-frictions.md`](../researchs/architecture/2026-05-08-consumer-bootstrap-frictions.md) — evidência empírica para `sdd_dir` vs `spec_workspace_dir` e contrato de onboarding.
- [`.specify/specs/researchs/architecture/2026-05-08-repo-first-structured-registry.md`](../researchs/architecture/2026-05-08-repo-first-structured-registry.md) — direção preferencial para o modelo repo-first híbrido.
- `decision-brief.md` da Spec 0018 — especialmente `[DEC-0018-A06]`, que transforma o débito tático sobre "Tipos de spec" numa pergunta ampla de placement/gênero documental.
- `.specify/specs/roadmap/backlog.md` — fonte de escopo vivo, riscos e cross-refs desta candidata antes e depois do gate.

---

## 🛠️ Dependências e impactos (alto nível)

- **Pré-requisitos**:
  - Spec 0018 mergeada — fornece a base de governança e o débito explícito sobre "Tipos de spec".
  - Spec 0019 mergeada — entrega o runtime e o `sdd_dir` hoje distribuído ao consumidor.
  - Spec 0020 mergeada — expõe o débito de placement de `.specify/templates/` e a necessidade de separar contrato de estado de payload de publish.
- **Specs afetadas**:
  - `stakeholder-intake-pipeline` — depende do lar canônico de PRD/intake.
  - `handoff-contracts-formalization` — depende do lar canônico de handoffs.
  - `framework-observability-dashboard` — depende do contrato de telemetria e do estado estruturado.
  - `process-automations` — depende da fronteira `sdd_dir` vs `spec_workspace_dir` e do novo contrato da CLI.
- **Cross-refs com specs irmãs**:
  - **Spec 0011** — 0021 reorganiza o meta-framework dentro deste repositório; 0011 padroniza a fragmentação distribuída no repositório do consumidor.
- **Riscos macro**:
  - Reorganização física ampla pode gerar diff transversal em documentação, CLI, publish surface e referências históricas.
  - Um schema excessivamente maximalista pode congelar a adoção antes de provar o fluxo mínimo.
  - Re-arquitetar a CLI sem domínio explícito reproduziria o acoplamento legado sob novos nomes.
  - Adotar Living Documentation sem normalizar a taxonomia dos testes criaria uma SSOT incompleta ou enganosa.

---

## 📚 Referências

- Specs relacionadas: 0011, 0018, 0019, 0020.
- Cross-ref: `[DEC-0018-A06]` na decision-brief da Spec 0018.
- Researches centrais de 2026-05-08 em `.specify/specs/researchs/architecture/`.
