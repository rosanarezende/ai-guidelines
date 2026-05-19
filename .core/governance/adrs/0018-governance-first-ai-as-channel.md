# ADR 0018 — Governance-First, AI-as-Channel

**Status**: Aceita
**Origem histórica**: Spec 0021 sub-bloco 4.E (`[DEC-0021-B07]`, 2026-05-17).
**Refina escopo de**: [`ADR 0008 — Governança Monolítica`](./0008-monolithic-runtime-compiler-governance.md) (narrow scope: opera sobre canal AI, não sobre core).

---

## Contexto

O framework `ai-guidelines` nasceu (2025) a partir de fricções reais observadas em times usando LLMs no fluxo de engenharia: padronização, lost-in-the-middle e riscos SecOps. A casca pública e o naming refletiram esse gatilho — "governança AI-first", `AGENTS.md` como artefato central, `<AI_GUIDELINES>` como bloco compilado.

Ao longo das specs 0008–0021, o conteúdo arquitetural evoluiu sem que a superfície acompanhasse:

- A taxonomia MECE de 7 pilares (`spec`, `experiment`, `spike`, `incident`, `proposal`, `patch`, `fix`) **não menciona IA**.
- O domínio core (`WorkItem`, `Registry`, `GovernanceWorkspace`, `LivingDocumentation`, `TemplateEngine`) é puro modelo de governança de engenharia.
- O contrato consumer-side declarado em PR2 é `.governance/`, não `.ai-guidelines/`.
- O guardrail emblemático do framework (`POLICY_EXPERIMENT_REQUIRES_HYPOTHESIS`) bloqueia humano e IA igual — é governança de produto, não governança de IA.

A discrepância entre o que o código modela e o que a superfície comunica gera duas leituras incompatíveis:

- **AI-first**: "guidelines para usar IA com qualidade".
- **Governance-first**: "framework de governança de engenharia repo-first, com integração AI-agnóstica como canal de primeira classe".

A segunda leitura é coerente com o código atual. A primeira é uma herança histórica que limita o ROI: o framework é cobrado como AI tooling enquanto entrega governance machinery.

## Princípio

**O core do `ai-guidelines` é governança de engenharia repo-first. Integração AI-agnóstica é canal de primeira classe, mas não é o domínio core — é uma família de adapters (Claude, Gemini, Codex, Cursor, Copilot, etc.) que consome a SSOT de governança.**

Operacionalmente:

1. **Core ontológico:** `.governance/registry.yml` (SSOT estruturado), taxonomia MECE dos 7 pilares, `GovernanceWorkspace`, `LivingDocumentation`, `TemplateEngine`, ciclo SDD com gates humanos.
2. **Canais (opt-in feature):** AI agent adapters, compilação `<AI_GUIDELINES>` em `AGENTS.md`, provider entrypoints (`CLAUDE.md`, `GEMINI.md`, etc.).
3. **Naming:** o pacote npm `ai-guidelines` permanece. O termo "guidelines" já é semanticamente palavra de governança; o framing externo reclama essa leitura via surface (README, AGENTS.md framing, features.md classification) — evita churn de URLs, imports, badges e tração já construída.

## Opções avaliadas

| #   | Opção                                                          | Trade-off                                                                                                                                                      |
| --- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | **Manter AI-first** (status quo)                               | Coerência histórica; mas vende menos valor que o que entrega, e a evolução natural (intake, telemetry, handoff) é de governança, não de IA.                    |
| B   | **Governance-First, AI-as-Channel** (escolhida)                | Reflete o código real; abre porta para evolução natural; preserva integração AI como diferencial real; reclaim semântico do naming sem rename.                 |
| C   | **Rename do pacote** (ex: `repo-governance`, `eng-governance`) | Resolveria ambiguidade definitivamente; custo alto (npm não tem rename; quebra import paths; churn de badges/links externos); compete em categoria mais ampla. |

## Onde se aplica

Este princípio rege:

- Naming e tagline do `README.md` (lidera com "governance", AI vira seção "Integrations").
- Abertura textual de `AGENTS.md` (fora do bloco `<AI_GUIDELINES>` compilado — esse continua sendo runtime).
- Classificação de features: AI adapters viram **opt-in** (igual Prettier/Husky/CI).
- Critério de inclusão/exclusão para specs futuras: se a spec só faz sentido sob framing AI-first, ela precisa justificar contra esta ADR.
- Linguagem em pitches, docs externas e issues do GitHub.

Este princípio **não** rege:

- Rename de pacote npm — fica como débito futuro, decidido por tração/sinal externo, não por princípio arquitetural.
- Renomeação de `AGENTS.md` — permanece como output runtime canônico do canal AI; só sua interpretação muda (de "o artefato" para "um artefato entre vários canais").

## Consequências

- README, `AGENTS.md` (abertura), `docs/features.md` e `GOVERNANCE-CATALOG.md` ganham framing governance-first.
- ADR 0008 (Monolithic Runtime Compiler) tem seu escopo afinado: a decisão segue válida, mas opera sobre o canal AI, não sobre o core ontológico.
- Specs futuras de evolução natural — `stakeholder-intake-pipeline`, `handoff-contracts-formalization`, `framework-observability-dashboard` — herdam naturalmente o framing governance-first (não precisam justificar por que não são AI-centric).
- Risco residual: consumidores existentes que adotaram o framework pela leitura AI-first podem precisar releitura do README. **Mitigação**: `CHANGELOG.md` registra o repositioning como entrada visível na próxima release.

---

_Implementação concreta do repositioning: Spec 0021 sub-bloco 4.E (README, AGENTS.md framing, features.md reclassificação, ARCHITECTURE.md §1)._
