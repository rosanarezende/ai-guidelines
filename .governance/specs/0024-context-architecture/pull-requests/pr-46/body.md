## Visão pretendida

<!--
BASELINE de intenção do Draft PR #46 — preservada até o fim do PR (mudança
excepcional entra como "Prompt complementar", sem apagar o original).
Prompt gerado seguindo o padrão versionado
`.governance/visual-prompts/pr-intended-vision.prompt.md`.
-->

<details>
<summary><strong>Prompt final — visão pretendida</strong></summary>

```text
LANGUAGE CONSTRAINT: every visible word inside the generated image must be in Brazilian Portuguese (pt-BR). Do not render English labels. Keep code identifiers, branch names, file names, PR numbers and DEC/ADR ids exactly as written.

Generate a clean technical 16:9 infographic for PR #46 of ai-guidelines, titled "PR #46 — Arquitetura interna DDD/BDD".

Visual goal: show the framework's internal runtime being reorganized so humans can read it — same behavior, clearer structure — plus the birth of a derived governance graph snapshot.

Layout: three horizontal zones from left to right, connected by thin arrows.

LEFT ZONE — "Hoje: runtime funcional, mas denso"
Render a compact code shelf labeled "src/cli" with many mixed cards:
- "comandos"
- "derivações"
- "checks"
- "projeções"
- "testes espelhados"
Add a small warning card: "Legível para a máquina, custoso para humanos".

CENTER ZONE — "Mudança pretendida"
Render organized refactor rails with visible labels:
- "refactor behavior-preserving"
- "domínio ≠ CLI ≠ projeções ≠ testes"
- "gramática operacional (G01) fechada ou roteada"
- "contrato do graph snapshot derivado"
- "aprendizados estruturais do work-graph-model"
Show tests as a safety net under the rails: "comportamento não muda sem teste".

RIGHT ZONE — "Depois esperado"
Render maintainers navigating clear layers:
- "src legível por fronteira (domínio, aplicação, infraestrutura, CLI)"
- "snapshot do grafo: nodes/edges/source-refs/hashes, derivado e regenerável"
- "state.yml continua a única fonte estrutural"
Add one outcome card: "Framework sustentável por humanos, sem segunda fonte de verdade".

BOTTOM AUTHORITY RAIL:
Use three small color-coded chips:
- "SSOT: repo governado"
- "Projeção: snapshot/mapas derivados"
- "Decisão humana: gates"

BOUNDARY CALLOUT:
"Fora deste PR: dualroot-collapse, falsificação ampla, produto Guilda, banco de grafo".

Style: engineering documentation aesthetic, light background, compact cards, thin connector lines, restrained color palette, high contrast, no mascot, no vendor logos, no marketing hero composition, no decorative gradients. The image should feel like a precise architecture map for maintainers, not a product advertisement.
```

</details>

## Resumo

Este PR materializa o checkpoint `internal-architecture-refactor-ddd-bdd` (nó seq 13 da Spec 0024, PR #46 stacked sobre #45): reorganização **behavior-preserving** de `src/cli` e dos testes para que o próprio framework seja legível e sustentável por humanos, sem alterar comportamento nem conteúdo de produto.

Além do refactor estrutural, o checkpoint fecha (ou roteia explicitamente) a gramática operacional remanescente de `G01` e define o contrato do **graph snapshot derivado** (nodes/edges/source-refs/hashes; determinístico, regenerável, offline) como fronteira de projeção — tudo derived-only, sem segunda SSOT (`[DEC-0024-G23]`/`[DEC-0024-G28]`).

Os aprendizados do incubador `work-graph-model` (`model.yml`, `tracker.md`, `features.md`, `GUILDA-QRD-PRESERVATION-MATRIX.md`) são insumo obrigatório — aplicando ao framework apenas o que é estrutural; produto, UX, branding e roadmap da Guilda permanecem no repo irmão.

## Escopo

### Dentro do escopo

- Reorganização behavior-preserving de `src/cli` e testes (domínio ≠ CLI ≠ projeções ≠ testes), coberta por testes existentes/novos.
- Fechar ou dispositionar a gramática operacional remanescente de `G01`, sem reabrir a gramática de artefatos/evidências fechada no PR #45.
- Definir o contrato do graph snapshot derivado: quais nós, arestas, source-refs e hashes existem; como regenerar; como validar; como impedir segunda SSOT.
- Explicitar quais projeções de `G05` o snapshot atende e quais ficam para consumidores posteriores.
- Registrar disposição dos aprendizados relevantes da matriz Guilda: aplicado no framework, migrado ao repo Guilda, preservado como legado/evidência ou rebaixado com justificativa.

### Fora do escopo

- Merge em `main` (stack modo unit; merge é evento único no nó terminal).
- `dualroot-collapse` (agora seq 14) e qualquer movimentação física de `.specify`/`.ai-guidelines`.
- `broad-flow-falsification` (`G03`/`F-014` seguem roteados para lá, salvo decisão explícita).
- Adapter de banco de grafo e identidade cross-repo (spike futuro).
- Reativar a Guilda Governance como produto dentro deste repo.
- Ready/Human Gate automático.

## Valor entregue

- **Fronteiras internas protegidas:** as sete violações iniciais foram eliminadas; o guard agora falha em qualquer dependência indevida entre domínio, aplicação, infraestrutura e CLI, sem baseline de exceções.
- **Derivações centrais consolidadas:** `frenteProgression` virou a derivação canônica para a pergunta "qual é o próximo movimento?", consumida por `pr-ready`, `handoff`, `humanGate`, `advanceEligibility` e superfícies relacionadas.
- **Policy de reviews no domínio:** a política de revisão saiu de uma leitura de infraestrutura para um modelo de domínio reutilizável.
- **Graph snapshot derivado:** `governance-graph:build/check` materializa `governance-graph-snapshot.json` como projeção versionada, determinística, regenerável, offline e derived-only, usando `governed-work` em vez de `spec` como conceito público.
- **Débitos do snapshot fechados:** `active.yml.updated_at` foi normalizado fora do fingerprint, `generated-at/source-commit` foram decididos como fora do snapshot v1 por determinismo, e ids de tarefas deixaram de ser line-based.
- **Aprendizados do work-graph-model preservados:** matriz de lentes e alinhamento com `model.yml` v3 rastreiam o que foi aplicado ao framework, migrado para Guilda, preservado como evidência ou roteado para falsificação/revisão final.
- **G01 fechado no framework:** `[DEC-0024-G31]` registra a gramática operacional materializada; resíduos de escala consumidor, promoção/projeções e `terminus` permanecem roteados, sem encerramento global por decreto.
- **Publicação de reviews sem deadlock:** `review:publish` passou a publicar o artefato canônico e o `governance-graph-snapshot.json` sincronizado no mesmo envelope atômico declarado pela policy. O commit continua isolado, rejeita qualquer path arbitrário e não avança a cabeça funcional usada pela freshness da própria review.
- **Findings arquiteturais corrigidos no código:** o briefing de review agora consome o mesmo `review_plan` situado que `pr-ready` e `handoff`; os guards compartilham um grafo de dependências que cobre imports, reexports, imports dinâmicos e `require`; e a garantia offline do graph snapshot percorre todo o fechamento transitivo da derivação.
- **Revalidação assistida, não automática:** `flow -- decide --type review-revalidation` analisa o delta de reviews obrigatórias stale, classifica riscos e recomenda dispensar ou repetir; a owner confirma ou substitui a recomendação. A decisão fica limitada ao HEAD analisado, preserva o fato `stale` e é invalidada por qualquer mudança funcional posterior.

<details>
<summary><strong>Prompt final — valor entregue</strong></summary>

```text
LANGUAGE CONSTRAINT: every visible word inside the generated image must be in Brazilian Portuguese (pt-BR). Do not render English labels. Keep code identifiers, branch names, file names, PR numbers and DEC/ADR ids exactly as written.

Generate a clean technical 16:9 infographic for PR #46 of ai-guidelines, titled "PR #46 — Valor entregue".

Visual goal: show that the internal architecture refactor moved from "code organized by accidental surfaces" to "governed work with explicit boundaries, canonical derivations and derived graph projection". The image must communicate delivery evidence, not a future plan.

Layout: one central spine labeled "Trabalho governado" with three stacked layers and evidence chips.

TOP LAYER — "Fronteiras protegidas"
Show four boxes with clear boundaries:
- "Domínio"
- "Aplicação"
- "Infraestrutura"
- "CLI"
Add guard rails around them labeled "guard de camadas" and "zero exceções congeladas".

MIDDLE LAYER — "Derivações canônicas"
Render one highlighted node labeled "frenteProgression" feeding five smaller surfaces:
- "pr-ready"
- "handoff"
- "humanGate"
- "advanceEligibility"
- "workBrief"
Add a callout: "uma pergunta importante, uma derivação".

BOTTOM LAYER — "Projeções derivadas"
Render a versioned graph snapshot card labeled "governance-graph-snapshot.json" with nodes, edges, source_refs and fingerprint. Add three chips:
- "determinístico"
- "regenerável"
- "offline"
Add a warning crossed out: "segunda SSOT".

RIGHT SIDE — "Evidência preservada"
Show a compact list:
- "matriz de lentes"
- "model.yml v3 rastreado"
- "G01 fechado ou roteado"
- "review_plan: TA e AR obrigatórias"
- "Security dispensada por escopo"

BOTTOM AUTHORITY RAIL:
Use three small labels:
- "state.yml continua estrutural"
- "snapshot/mapas são projeções"
- "Human Gate decide"

Style: precise engineering documentation, light background, readable typography, restrained green/grafite/latão palette, compact diagram, no mascot, no product marketing composition, no decorative gradients, no vendor logos. The result should look like evidence for maintainers reviewing a framework checkpoint.
```

</details>

## Test plan

```bash
npm run build
npm run test
npm run validate
npm run validate:changed
npm run governed-work-map:check
npm run governance-graph:check
npm run artifact-kind:check
npm run research-index:check
npm run test:ts -- --runInBand src/app/reviews/reviewPublicationPolicy.test.ts src/app/reviews/reviewRequirements.test.ts src/cli/reviewFreshness.test.ts src/cli/reviewPublish.test.ts
npm run test:ts -- --runInBand src/cli/reviewBrief.test.ts src/test-utils/sourceDependencyGraph.test.ts src/test-utils/Boundaries.test.ts src/test-utils/LayerBoundaries.test.ts src/app/projections/governanceGraphSnapshot.test.ts
npm run test:ts -- --runInBand src/app/reviews/reviewRevalidation.test.ts src/cli/decide/reviewRevalidation.test.ts src/cli/reviewFreshness.test.ts src/app/reviews/reviewRequirements.test.ts
```

Refactor behavior-preserving: cada movimentação estrutural deve manter os testes existentes verdes; comportamento só muda com teste e justificativa registrada.

## Validação, evidências e checklist

### Evidências e gates

- Technical Audit: **required**; aprovada e revalidada até `b4d0c834`. Para o delta posterior registrado em `state.yml`, o sistema recomendou repetir por tocar a política e o fluxo de decisão; a owner dispensou explicitamente a revalidação. A dispensa é situada no HEAD analisado e não transforma a lane stale em current.
- Architectural Review: **required**; aprovada sobre `b4d0c834`, com três findings não bloqueantes já corrigidos. Para o delta posterior registrado em `state.yml`, o sistema recomendou repetir; a owner dispensou explicitamente a revalidação, limitada ao mesmo HEAD analisado.
- Security Review: **waived** por decisão situada da owner; o escopo é interno ao framework, sem nova superfície de auth, secrets, rede, permissão externa ou execução remota. TA/AR podem reabrir risco se encontrarem evidência.
- Human Gate: pendente — decisão reservada à owner; não é autorização de merge.
- Merge: fora do escopo deste PR individual; a stack segue em modo unit.

### Checklist operacional

- [x] Formatação verde
- [x] Validação canônica verde (`npm run validate`: 226 suítes / 2.381 testes + checks governados)
- [x] Commits atômicos
- [x] Sem secrets, credenciais ou contexto pessoal vazado
- [x] PR body atualizado com estado real
- [x] Fora de escopo registrado

## Cross-refs

- **Spec**: 0024
- **ADRs aplicáveis**: ADR 0018, ADR 0021, ADR 0022, ADR 0025, ADR 0026
- **DECs aplicáveis**: DEC-0024-G21, DEC-0024-G23, DEC-0024-G27, DEC-0024-G28, DEC-0024-G31
- **Issues/PRs relacionados**: Continuação governada de #45 (pacote `pull-requests/pr-45/continuations/2026-07-11-internal-architecture-refactor-ddd-bdd`); nó anterior: `artifact-taxonomy-and-model-review-contract`; nó ativo: `internal-architecture-refactor-ddd-bdd`

## Disclosure de IA

Implementação assistida por IA.

<details>
<summary><strong>Disclosure derivado (fatos de processo)</strong></summary>

<!-- fatos-derivados:início -->
<!-- (cole a saída de `npm run disclosure`; vazio até haver revisão registrada em artefato) -->
<!-- fatos-derivados:fim -->

</details>
