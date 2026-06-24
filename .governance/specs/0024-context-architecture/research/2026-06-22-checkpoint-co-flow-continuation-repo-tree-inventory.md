---
artifact-kind: inventory
---

# PR #44 — Inventário completo da árvore do repositório (snapshot)

Data: 2026-06-22
Spec: 0024 — context-architecture
Nó: `co-flow-continuation` (seq 11)
Método: `git ls-files` (apenas arquivos versionados; exclui `node_modules/`, `dist/`,
`coverage/` e demais gitignored). Total: **1038 arquivos versionados**.

## Natureza deste artefato

- **Inventário/snapshot datado, read-only, NÃO autoridade.** Retrato da árvore neste commit;
  árvores mudam — confirme contra `git ls-files` para o estado atual.
- **Não decide reorganização.** Existe para dar a "foto completa" do repositório **antes** de
  qualquer decisão de taxonomia/reorganização. Findings viram DEC/task/revisão depois.
- **Não move/edita nenhum artefato.** Só descreve.

**Por que existe:** as revisões de taxonomia (`...artifact-taxonomy-*.md`) estavam sendo feitas
sobre uma visão parcial (prints + leituras pontuais). Este mapa fecha o ponto cego: o problema de
"onde mora cada artefato" é **repo-wide e multi-root**, não um problema de `research/`.

---

## 1. Top-level (11 entradas + 24 arquivos de raiz)

| Entrada                       | Arquivos | Papel                                                           | Autoridade  |
| ----------------------------- | -------: | --------------------------------------------------------------- | ----------- |
| `src/`                        |      499 | Código (DDD: app/domain/infrastructure/cli)                     | código      |
| `.governance/`                |      173 | **Root canônico** de governança (ADR 0019)                      | SSOT        |
| `.specify/`                   |      118 | **Root LEGADO** (dual-root; agendado p/ `dualroot-collapse`)    | read-only   |
| `site/`                       |       72 | Site/simulador público (React) — projeção                       | projeção    |
| `.core/`                      |       71 | Kernel do framework (ADRs, rules, process, templates, policies) | doutrina    |
| `tests/`                      |       30 | consumer-journey / integration / smoke                          | código      |
| (raiz)                        |       24 | entrypoints de IA, configs, ignores, docs de projeto            | mista       |
| `.github/`                    |       17 | workflows, rulesets, PR/issue templates, CODEOWNERS             | CI/governo  |
| `docs/`                       |       15 | docs públicas + editorial (imagens + prompts)                   | projeção    |
| `.ai-guidelines/`             |       15 | Templates consumer-local + config                               | distribuído |
| `.husky/` `.jest/` `.openai/` |        4 | hooks, jest config, entrypoint Codex                            | infra       |

**Arquivos de raiz (24):** entrypoints de IA (`AGENTS.md` canônico, `CLAUDE.md`, `GEMINI.md`);
ignores por-provider (`.aiexclude`, `.claudeignore`, `.geminiignore`, `.gptignore`,
`.prettierignore`); configs (`.prettierrc.json`, `.lintstagedrc.json`, `.gitattributes`,
`.gitignore`, `tsconfig.json`, `node.config.json`, `package.json`, `package-lock.json`,
`rewrite.js`); docs (`README`, `CHANGELOG`, `CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY`,
`LICENSE`, `WORKFLOW.md`).

## 2. `.governance/` (173) — root canônico

```text
.governance/
  living-docs.yml · review-policy.yml          # policies de instância
  runtime/
    constraints/manifest.json                  # constraints compiladas
    falsifications/ledger.yml
    insights/{open,promoted,discarded}.yml      # PITs (PIT-0001..0013)
    specs/{active,history}.yml                  # projeção de specs ativas/histórico
  visual-prompts/{README, architecture-end-to-end.prompt, value-delivered.prompt}   # (+ código em src/cli/visual-prompts/)
  specs/
    research-index.md                           # ÍNDICE canônico cross-spec (por domínio)
    research-library/architecture/{2026-05-19-lifecycle, 2026-06-05-enforcement-surfaces}   # promovidos (enforcement-surfaces NÃO indexado = drift)
    roadmap/{backlog.md, historico.md}
    0023-workflow-runtime/   (8)  spec/plan/tasks/state/decision-brief/review/integration-pr/release-log
    0024-context-architecture/
      spec.md · plan.md · tasks.md · state.yml · decision-brief.md · NEXT.md · knowledge-backfill.yml
      assets/        (6)  + assets/pr-value-images/ (11)        # projeção visual + imagens
      gates/         (11)                                       # Human Gates (autoridade)
      reviews/       (37) + reviews/events/ (10)                # reviews governados de gate
      research/      (66)                                       # ⚠️ a pasta sobrecarregada
```

## 3. `.specify/` (118) — root LEGADO (dual-root)

```text
.specify/
  specs/
    research-index.md                  # ⚠️ 2º índice; autodeclara "Fonte de Verdade" (contradiz ADR 0019)
    0008,0015,0016,0017,0018,0019,0020,0021,0023/   # specs antigas (cada uma com research/ próprio)
      0018-.../research/ (12) + eval-outputs
      0021-.../research/ (1)
      0023-.../research/ (2)
    researchs/                         # ⚠️ research-library LEGADA, por domínio
      architecture/ (15) · governance/ (21 + eval-outputs 10) · oss/ (3)
    roadmap/ (2)
  templates/ (14)                      # ⚠️ inclui tasks-{deterministic,evidence-driven,mixed} (taxonomia REMOVIDA por G02)
```

## 4. `.core/` (71) — kernel/doutrina do framework

```text
.core/
  constraints/constraints.yml
  governance/
    ADRs (25 + README)                 # 0003..0026
    ARCHITECTURE.md · ARCHITECTURE-REFERENCE.md · GOVERNANCE-CATALOG.md
    human-decision-policy.yml · work-policy.yml · script-contracts.yml
    recipes/tasks-evidence-driven.recipe.yml          # ⚠️ taxonomia removida (G02)
    templates/partials/tasks-evidence-driven/ (10)    # ⚠️ idem
  process/ (7)   governance-foundation.md (§4.5 = contrato de promoção) · rpi-protocol · tdd · pr-title · checkpoint-comment · ai-efficiency · test-coverage
  rules/   top/{agents-core,global-rules} · adapters/{claude,codex,gemini} · center/methodologies/{tdd,bdd × en/pt} · base/quality · _meta/{rules.json,...} · catalog.md
  templates/ (4 .tmpl + .github/.husky subdirs)       # AGENTS-core, package.json fragment, ci/husky tmpl
```

## 5. `src/` (499) — código (DDD)

```text
src/
  app/         constraints(8) ports(20) projections(4) services(15) use-cases(26) workflow(26)
  domain/      provisioning(34) knowledge(12) insight(11) templates(8) workspace(7) living-docs(7)
               workflow(6) constraints(6) policy(4) registry(4) rules(4) work-item(3) shared(2)
  infrastructure/  yaml(32) filesystem(15) ast(7) io(4) git(2) process(2) json(1) time(1)
  cli/  (99)   registry/commands(33) decide(22) registry(13) delivery/bootstrap(8) copy(8+locales10)
               visual-prompts(6) flow(5) repair(5) experience/wizard(2)
  test-utils(10) · testing/bdd(2)
```

## 6. `site/` (72) e `docs/` (15) — projeções públicas

- **`site/`** — app React (Vite): `src/pages/*` (home/cli/reference/advanced/contribute/not-found,
  cada um com `locales/`), `features/cli-simulator/` (`RealCliRunner`, `CliTerminal`),
  `features/terminal/`, `shared/{layout,ui}`, **`src/generated/` + `src/assets/generated/`**
  (conteúdo derivado), `content/`, `public/`, `scripts/`.
- **`docs/`** — `features.md`, `scripts.md`, `cli/ai-guidelines-cli.md`, **`assets/` (6 PNGs)** e
  **`editorial/*.prompt.md` (5 prompts de imagem)** + `editorial/README.md`.

## 7. Síntese — as superfícies de "onde mora artefato" (visão repo-wide)

Este é o achado central do mapa: **o problema é multi-root e cross-cutting**, não de `research/`.

| Tipo de artefato             | Quantos lugares hoje | Onde                                                                                                                                                       |
| ---------------------------- | -------------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Research**                 |               **≥4** | `.governance/.../research/` · `research-library/<domínio>/` · `.specify/specs/researchs/<domínio>/` · `.specify/specs/<spec>/research/`                    |
| **Índice de research**       |                **2** | `.governance/specs/research-index.md` (canônico) · `.specify/specs/research-index.md` (legado, "Fonte de Verdade")                                         |
| **Templates**                |               **≥4** | `.core/templates` + `.core/governance/templates/partials` + `.core/governance/recipes` · `.ai-guidelines/templates` · `.specify/templates`                 |
| **Taxonomia removida (G02)** |                **3** | `.ai-guidelines/templates/tasks-{deterministic,evidence-driven,mixed}` · `.specify/templates/` idem · `.core/.../tasks-evidence-driven/` (recipe+partials) |
| **Prompt visual/imagem**     |                **3** | `.governance/visual-prompts/` (+ código) · `docs/editorial/*.prompt.md` · `assets/pr-value-images/`                                                        |
| **Projeção visual**          |                **4** | `assets/` (spec) · `site/` (público) · `docs/assets/` · `site/src/{generated,assets/generated}`                                                            |
| **Policies**                 |          **2 roots** | `.core/governance/*.yml` (kernel) · `.governance/{review-policy,living-docs}.yml` (instância)                                                              |
| **Decisão/estado**           |             canônico | per-spec `state.yml`/`tasks.md`/`decision-brief.md` · `gates/` · `runtime/specs/{active,history}.yml`                                                      |

## 8. Implicação para a decisão de reorganização (liga-se a F12 da revisão de taxonomia)

1. **A taxonomia de `research/` é um recorte local de um problema global.** As mesmas patologias
   (cópias paralelas, dual-root, índice stale) aparecem em **templates** e **prompts/projeções**,
   não só em research. Resolver só `research/` deixaria 3 outras frentes intactas.
2. **Vários eixos da reorganização JÁ são nós planejados:** `dualroot-collapse` (`.specify` →
   `.governance`; templates; researchs legada; 2º research-index), `housekeeping`
   (`checkpoint-taxonomy-removal` P0 — a taxonomia removida que sobrevive em 3 lugares),
   `knowledge-readiness`. Decidir uma reorganização ampla **agora** (#44) competiria com esses nós.
3. **O que é seguro no #44 permanece o que a revisão de taxonomia já recomendou:** apenas aditivo
   (`kind:` em frontmatter; ponteiro de README para o `research-index.md` canônico; reparar o
   índice stale). Reorganização **física** pertence ao `dualroot-collapse`/`housekeeping`, onde as
   referências serão atualizadas no mesmo movimento.
4. **Antes de qualquer DEC de reorganização**, este mapa deveria virar a baseline: a DEC decide
   sobre a árvore real (4 locais de template, 2 índices, 3 homes de prompt), não sobre `research/`
   isoladamente.

## 9. Extensão — referências cruzadas (dimensionamento do `dualroot-collapse`)

> **Snapshot datado (2026-06-22), read-only. NÃO autoriza migração.** Mede acoplamento por
> referências em arquivos **versionados** (`git grep`, só tracked). **Mudanças físicas pertencem
> ao `dualroot-collapse`**, não ao #44. **No PR #44, o máximo seguro é decisão conceitual/aditiva
> — não mover paths.** Números são **linhas-com-referência (proxy)**; uma linha pode conter o path
> em link vivo **ou** em prosa/citação histórica — a distinção está anotada abaixo.

### 9.1 Contagem por alvo (linhas-com-referência, por área de origem)

| Alvo                                                                       |  Linhas | Origem (top-level)                                                                                                          | Leitura                       |
| -------------------------------------------------------------------------- | ------: | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **`.specify/`** (legado)                                                   | **578** | `.specify` 58 · **`src` 32** · `.core` 22 · `.governance` 15 · `.ai-guidelines` 7 · tests 3 · site 3 · `.github` 2 · raiz 4 | alvo do colapso               |
| **`.governance/`** (canônico)                                              | **993** | **`src` 128** · `.governance` 65 · `.core` 16 · `.specify` 14 · docs 7 · tests 5 · site 4 · raiz 5                          | não move (canônico)           |
| **`research/`**                                                            | **380** | `.governance` 51 · `.specify` 32 · `.core` 8 · `.ai-guidelines` 6 · `src` 3                                                 | move por promoção             |
| **`research-library/`**                                                    |  **24** | `.governance` 7 · `.core` 2 · `src` 1 · raiz 2                                                                              | nascente (subutilizado)       |
| **`.specify/templates`**                                                   | **183** | (consolidação de templates)                                                                                                 | move/funde                    |
| **`.ai-guidelines/templates`**                                             | **113** | (consolidação de templates)                                                                                                 | move/funde                    |
| **taxonomia removida G02** (`tasks-{deterministic,evidence-driven,mixed}`) | **151** | `.specify` 14 · **`src` 8** · `.governance` 8 · `.core` 4 · `.ai-guidelines` 4 · site 1                                     | housekeeping/taxonomy-removal |
| **`visual-prompts/`**                                                      |  **34** | **`src` 7** · `.governance` 5 · docs 1 · raiz 1                                                                             | first-class (toca código)     |

### 9.2 Referências que QUEBRARIAM ao mover arquivos (refs com nome de arquivo concreto)

| Movimento                                        |                                     Refs com arquivo concreto | Onde estão (load-bearing)                                                                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mover arquivos de `.specify/…` → `.governance/…` |                                                       **207** | `.specify` 37 (internas) · **`.core` 17 (ADRs citando research legada)** · `.ai-guidelines` 7 · **`src` 6** · tests 3 · `.governance` 3 · `.github` 2 · raiz 2 |
| Promover/mover `research/AAAA-…md`               | **176** (≈**40 arquivos** fora dos meus artefatos de análise) | cross-links de doc; ADRs; índices                                                                                                                              |

### 9.3 Leitura honesta dos números (o que dimensiona o colapso)

1. **O runtime tem uma ponte legada real, mas pequena:** **~32 arquivos `src/` referenciam
   `.specify/`** (double-lookup/bridge) contra **128 referenciando `.governance/`**. O código já é
   majoritariamente canônico; o colapso precisa **remover a ponte**, não reescrever o mundo.
2. **A doutrina permanente aponta para research legada:** **17 referências em `.core/`** (ADRs:
   _"Pesquisa de suporte: `.specify/specs/researchs/…md`"_) citam arquivos que **existem** e
   **moveriam** numa promoção para `research-library/`. ADR é perene → essas citações precisam ser
   repointadas no mesmo movimento. É a maior fonte de quebra "silenciosa".
3. **~20 refs a `.specify/` já são fantasmas:** apontam para paths que **nem estão na árvore**
   (`.specify/memory`, `.specify/constitution.md`, `.specify/registry`, `.specify/telemetry`,
   `.specify/state`). São citações históricas (ADR 0005/0007) — já "penduradas"; **não quebram
   mais** no colapso, mas inflam a contagem bruta. Por isso 578 ≠ "578 links a consertar".
4. **`.specify/` é majoritariamente `specs/` (326) + `templates/` (187).** O colapso tem dois
   sub-alvos nítidos: **(a) workspace de specs legado** e **(b) mirror de templates** — este último
   somado a `.ai-guidelines/templates` (113) é a real superfície de "consolidação de templates".
5. **A taxonomia removida (G02) ainda vive em código:** **8 referências em `src/`** + 4 em `.core/`
   além dos boilerplates. Atenção: `tasks-evidence-driven` é **também** o nome da recipe/partials
   **ativa** (`.core/governance/recipes/`), então a contagem mistura _remoção legada_ com
   _maquinária ativa_ — `checkpoint-taxonomy-removal` é mais entrelaçado que "apagar 3 arquivos".
6. **`research-library/` está subutilizado (24 refs, só 1 em `src/`)** e **`visual-prompts/` é
   first-class (7 refs em `src/`)** — confirmam F11 (promoção definida mas não-enforçada) e a
   correção de F9 (prompt visual tem casa **e código**; mover toca runtime).

### 9.4 Conclusão da extensão (sem decidir nada)

- O `dualroot-collapse` é **substancial mas delimitado**: remover ~32 pontos de ponte em `src/`,
  repointar ~17 citações de ADR, fundir 2 mirrors de template (`.specify/templates` +
  `.ai-guidelines/templates`) e unificar os 2 `research-index.md`. Já está **parcialmente
  documentado** (o `GOVERNANCE-CATALOG.md` cataloga `.specify/` como bridge legada com double-lookup).
- **Isto reforça, com números, que a reorganização física NÃO cabe no #44.** Mover paths agora
  quebraria centenas de referências — incluindo doutrina perene (ADRs) — e exigiria editar fontes
  que o recorte do #44 proíbe tocar. **No #44, o seguro é apenas conceitual/aditivo** (`kind:` em
  frontmatter; ponteiro de README; reparar o índice stale). A movimentação pertence ao
  `dualroot-collapse` (seq 12) e ao `housekeeping`/`taxonomy-removal`, onde as referências são
  atualizadas no mesmo commit.

## 10. Fronteira explícita

Este arquivo **não decide nada** e não move/edita artefatos. É um snapshot datado da árvore
versionada, produzido para dar a foto completa antes de uma reorganização. **A extensão § 9 não
autoriza migração**; apenas dimensiona o `dualroot-collapse`. Em divergência, vence `git ls-files`
(estado real) e as fontes governadas (`state.yml`/`tasks.md`/`decision-brief.md`/`reviews/`/
`gates/`). Findings precisam virar DEC/task/revisão governada depois.

_Read-only. Nenhum arquivo de estado, tarefa, gate, PR ou código foi alterado._
