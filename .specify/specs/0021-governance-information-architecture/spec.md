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
> **Princípios da Escrita:** ver `.core/process/spec-foundation.md` §
> "Princípios da Escrita" (agnosticismo humano/IA, BR IDs, contratos).

---

## 🎯 Objetivo

O framework já distribui regras, templates, roadmap e pesquisas úteis, mas o estado canônico da governança continua difuso. Hoje `backlog.md` e `historico.md` concentram memória narrativa, `.core/process/spec-foundation.md` mistura constituição viva com débito arquitetural, `.core/rules/`, `docs/`, `adrs/` e `.specify/` coexistem sem uma política explícita de "qual gênero mora onde", e artefatos sem spec formal ainda entram no fluxo de valor de forma ad-hoc.

O resultado esperado desta spec é uma arquitetura de informação única e explicável: onde vive o estado canônico do framework, como artefatos não-spec entram como origem de valor, qual é a fronteira entre `sdd_dir` e `spec_workspace_dir`, e como Fases 1, 2 e 3 do modelo repo-first híbrido são entregues sem antecipar SQLite/dashboard/backend como fonte primária. Ao final, uma pessoa ou LLM deve conseguir responder de forma curta e objetiva onde está a verdade canônica e como ela vira backlog, histórico e futuras automações.

---

## 📦 Escopo

### Dentro do escopo

- Definir a política canônica de arquitetura de informação do framework: classes documentais, fronteiras entre `.core/`, `adrs/`, `docs/`, raiz e artefatos operacionais de `.specify/`.
- Decidir o modelo canônico de estado **repo-first híbrido**: registro estruturado versionado no repositório como fonte primária, Markdown derivado para humanos/IA e projeções futuras apenas como derivados.
- Tratar artefatos não-spec como origem legítima de valor, com taxonomia mínima, relações e regras de promoção/resolução (`prd`, `incident`, `friction`, `note`, `spec`, `delivery`, `adr` e equivalentes que o gate confirmar).
- Decidir a fronteira formal entre `sdd_dir` e eventual `spec_workspace_dir`, incluindo default canônico e implicações para futuros comandos `config`, `spec init`, `intake` e `status`.
- Entregar o recorte arquitetural das **Fases 1, 2 e 3** da 0021: contrato, introdução do registro estruturado no repo e visões derivadas mínimas; **Fases 4 e 5** ficam apenas mapeadas.
- Reservar lar canônico para gêneros ainda não implementados, mas já aprovados como necessidade futura: PRD/intake estruturado, contratos de handoff/decision logs e telemetria do framework.
- Tratar explicitamente o placement canônico de `.specify/templates/` herdado da Spec 0020 como decisão arquitetural, com implicações para a CLI e para a documentação.

### Fora do escopo (vira spinoff ou fica em outra spec)

- Fragmentação distribuída de `AGENTS.md` em subdiretórios do consumidor — continua sendo escopo da Spec 0011.
- Implementação do pipeline completo de PRD/intake, dos contratos de handoff ou da telemetria/dashboard — esta spec só reserva o lar canônico e o contrato arquitetural.
- Implementação de comandos finais de produto (`ai-guidelines config`, `spec init`, `intake`, `status`) — dependem da arquitetura definida aqui e ficam para `process-automations` ou specs irmãs.
- Introdução de SQLite, dashboard web, backend hospedado ou serviço externo como fonte primária — Fases 4 e 5 ficam apenas mapeadas.
- Migração big-bang de todo o histórico do repositório para o novo modelo antes de provar um lote representativo.

---

## ✅ Critérios de Aceite (alto nível)

- [ ] Existe uma resposta única e curta para: "onde vive o estado canônico de PRDs, incidentes, specs e entregas, e como isso vira backlog/histórico?".
- [ ] A arquitetura declara explicitamente o papel de artefatos não-spec como origem de valor, com IDs, relações e modo de resolução/promoção canônicos.
- [ ] A fronteira `sdd_dir` vs `spec_workspace_dir` está documentada com defaults, responsabilidades e impacto sobre automações futuras.
- [ ] O recorte da própria 0021 está fechado: Fases 1, 2 e 3 entram como entregável desta spec; Fases 4 e 5 ficam apenas mapeadas como evolução posterior.
- [ ] A política de placement documental e o lar canônico de gêneros ausentes/futuros estão explícitos, evitando reabrir a discussão em specs posteriores.
- [ ] Pipeline de check + test verde, sempre (ex.: `yarn check && yarn test` no `ai-guidelines`; substitua pelo equivalente do stack do consumidor — `npm test`, `pnpm verify`, `cargo test`, `pytest`, etc.).
- [ ] PR Draft revisado e aprovado por humano antes de Ready.

---

## 🔬 Pesquisa de contexto

- [`./decision-brief.md`](./decision-brief.md) — gate humano de decisões pré-design.
- [`.specify/specs/researchs/architecture/2026-05-08-consumer-bootstrap-frictions.md`](../researchs/architecture/2026-05-08-consumer-bootstrap-frictions.md) — evidência empírica para `sdd_dir` vs `spec_workspace_dir` e contrato de onboarding.
- [`.specify/specs/researchs/architecture/2026-05-08-repo-first-structured-registry.md`](../researchs/architecture/2026-05-08-repo-first-structured-registry.md) — direção preferencial para o modelo repo-first híbrido.
- `.specify/specs/roadmap/backlog.md` — fonte de escopo vivo, riscos e cross-refs desta candidata antes da abertura formal.

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
  - `process-automations` — depende da fronteira `sdd_dir` vs `spec_workspace_dir`.
- **Cross-refs com specs irmãs**:
  - **Spec 0011** — 0021 reorganiza o meta-framework dentro deste repositório; 0011 padroniza a fragmentação distribuída no repositório do consumidor.
- **Riscos macro**:
  - Reorganização física ampla pode gerar diff transversal em documentação, CLI e referências históricas.
  - Um schema excessivamente maximalista pode congelar a adoção antes de provar o fluxo mínimo.
  - Escolher defaults ruins para `spec_workspace_dir` pode cristalizar UX equivocada em automações futuras do consumidor.

---

## 📚 Referências

- Specs relacionadas: 0011, 0018, 0019, 0020.
- Cross-ref: `[DEC-0018-A06]` na decision-brief da Spec 0018.
- Researches centrais de 2026-05-08 em `.specify/specs/researchs/architecture/`.
