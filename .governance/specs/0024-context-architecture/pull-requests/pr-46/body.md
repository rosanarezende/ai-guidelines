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

<!--
Preencher ao final, antes de entregar para revisão final / Human Gate.
Em Draft este slot permanece como placeholder.
-->

_(placeholder — preenchido ao final do checkpoint)_

## Test plan

```bash
npm run build
npm run test
npm run validate:changed
npm run governed-work-map:check
# checks específicos do graph snapshot quando implementados
```

Refactor behavior-preserving: cada movimentação estrutural deve manter os testes existentes verdes; comportamento só muda com teste e justificativa registrada.

## Validação, evidências e checklist

### Evidências e gates

- Technical Audit / Architectural Review: plano situado de revisões será registrado em `state.yml § topology...review_plan` antes de Ready (decisão da owner).
- Human Gate: pendente — decisão reservada à owner; não é autorização de merge.
- Merge: fora do escopo deste PR individual; a stack segue em modo unit.

### Checklist operacional

- [ ] Formatação verde
- [ ] Validação canônica verde
- [ ] Commits atômicos
- [ ] Sem secrets, credenciais ou contexto pessoal vazado
- [ ] PR body atualizado com estado real
- [x] Fora de escopo registrado

## Cross-refs

- **Spec**: 0024
- **ADRs aplicáveis**: ADR 0018, ADR 0021, ADR 0022, ADR 0025, ADR 0026
- **DECs aplicáveis**: DEC-0024-G21, DEC-0024-G23, DEC-0024-G27, DEC-0024-G28
- **Issues/PRs relacionados**: Continuação governada de #45 (pacote `pull-requests/pr-45/continuations/2026-07-11-internal-architecture-refactor-ddd-bdd`); nó anterior: `artifact-taxonomy-and-model-review-contract`; nó ativo: `internal-architecture-refactor-ddd-bdd`

## Disclosure de IA

Implementação assistida por IA.

<details>
<summary><strong>Disclosure derivado (fatos de processo)</strong></summary>

<!-- fatos-derivados:início -->
<!-- (cole a saída de `npm run disclosure`; vazio até haver revisão registrada em artefato) -->
<!-- fatos-derivados:fim -->

</details>
