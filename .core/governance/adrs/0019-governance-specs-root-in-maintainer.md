# ADR 0019 — `.governance/specs/` como root primária no repositório mantenedor

**Status**: Aceita
**Origem histórica**: Spec 0023 sub-bloco DEC-0023-A02 (2026-05-19).
**Relaciona-se com**: [`ADR 0018 — Governance-First, AI-as-Channel`](./0018-governance-first-ai-as-channel.md). Refina topologia no repositório mantenedor; preserva a restrição de canal.

---

## Contexto

A Spec 0021 (foundation) declarou `.governance/` como SSOT canônica **no consumidor** e estabeleceu o princípio governance-first. No **repositório mantenedor** (este), específicas continuaram nascendo em `.specify/specs/` por herança histórica — o sistema diz "governance-first" mas a UX de criação de spec ainda é "spec-first".

A Spec 0023 (Workflow Runtime, pivot 2026-05-19) identificou essa inconsistência conceitual como causa raiz de carga cognitiva: humanos precisam manter dois modelos mentais simultâneos (discurso × prática), e o runtime operacional não pode resolver isso enquanto a topologia for ambígua.

Três caminhos foram comparados (cf. [`decision-brief.md` § DEC-0023-A02](../../../.governance/specs/0023-workflow-runtime/decision-brief.md)):

- **A — Manter `.specify/` como root no mantenedor.** Zero custo de migração; inconsistência conceitual persiste indefinidamente.
- **B — `.governance/specs/` como root primária; `.specify/` vira bridge explícita; sem deprecation timeline.** Resolve inconsistência; convive com specs antigas em `.specify/` sem quebrar; runtime trata as duas como fontes legítimas (double-lookup).
- **C — Migração em massa das 9 specs antigas.** PR gigante; quebra trilha histórica e referências externas; alto risco sem benefício imediato; viola o critério "isto reduz carga cognitiva?".

## Decisão

**Adotamos B.** Novas specs no repositório mantenedor nascem em `.governance/specs/{NNNN-slug}/`. `.specify/specs/` permanece como bridge física, sem deprecation timeline declarada nesta ADR.

## Princípio

O **runtime de workflow** (cf. Spec 0023) implementa **double-lookup** como contrato:

1. Resolução de uma spec por slug → preferir `.governance/specs/{slug}` se existir;
2. fallback para `.specify/specs/{slug}` se não;
3. UI sinaliza explicitamente quando a spec foi resolvida via `.specify/` (`source: specify-legacy`), orientando — sem pressionar — a migração caso-a-caso.

Migração de specs **antigas** (0008–0022) **não é objeto desta ADR**. Cada migração é decisão própria, com justificativa explícita por spec (acessos quebrados, referência em ADR, dogfooding de outra spec, etc.). Não há cronograma agregado, não há PR de migração em massa.

## Consequências

- **Imediatas:**
  - Spec 0023 (workflow-runtime) é a primeira spec a viver em `.governance/specs/0023-workflow-runtime/`.
  - Runtime CLI (`ai-guidelines workflow` / `continue`) implementa double-lookup como funcionalidade central.
  - Pasta legacy `.specify/specs/0023-governance-workflow-discovery-model/` permanece como trilha histórica do Stage A, marcada `Pivoted`.

- **De médio prazo:**
  - Boilerplates continuam em `.specify/templates/` por enquanto. Movimento é spinoff próprio se/quando justificado.
  - Roadmap (`.specify/specs/roadmap/`) e researchs cross-spec (`.specify/specs/researchs/`) permanecem onde estão até decisão explícita.

- **Não-consequências (importantes):**
  - **Não** introduz alias mágico nem symlink. Adoção é explícita.
  - **Não** quebra nenhuma referência existente. Specs antigas continuam funcionais nos paths atuais.
  - **Não** altera o contrato do **consumidor** estabelecido pela Spec 0021 — `.governance/` continua sendo a SSOT canônica do consumidor; esta ADR apenas estende esse contrato ao mantenedor.

## Critério de revisão

Esta ADR deve ser revisada se:

- ≥ 3 specs antigas foram migradas caso-a-caso, com padrão de migração emergindo → considerar formalizar.
- `.specify/specs/` ficar com ≤ 2 specs ativas → considerar deprecation timeline.
- Bridge double-lookup mostrar friction operacional não previsto → reabrir DEC-0023-A02.

Sem nenhum desses gatilhos, esta ADR permanece estável.
