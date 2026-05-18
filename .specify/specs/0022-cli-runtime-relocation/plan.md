<!-- ai-guidelines-template: plan-boilerplate v=1 -->

# Plan — Spec 0022 CLI Runtime Relocation

> Spec: [`./spec.md`](./spec.md)
> Decision Brief: [`./decision-brief.md`](./decision-brief.md)
> Status: Draft

> **Vive durante a execução.** Diferente da `spec.md` (imutável após In Review),
> este arquivo é atualizado conforme o entendimento técnico evolui. Decisões
> revisitadas devem registrar a anterior em nota, não apagar o histórico.

---

## 🛰️ Stage 1 / Stage 2

**Stage 1 (Research → opções).** Coletado em sessão de design 2026-05-18 entre Rosana Rezende e Claude Code. Evidência empírica condensada em `decision-brief.md` com 4 pontos abertos (3 no Bloco A + 1 no Bloco C mandatório). **Status:** Stage 1 fechado, aguardando gate humano.

**Stage 2 (Design + Implementação).** As subseções abaixo derivam linearmente das decisões cravadas pelo gate humano. Cada componente referencia o `[DEC-0022-XYZ]` que o alimenta. **Status:** placeholder até gate. Após o gate, este plano é refinado em "v2" conforme o checklist pós-gate da brief.

Specs `mixed` aplicam Stage 1 apenas aos sub-blocos identificados como evidence-driven; nesta spec, o **Bloco A** (decisões de escopo e destino) é o evidence-driven, e a execução pós-gate é determinística.

---

## 🏗️ Design e Arquitetura

### Princípio guia

Spec **cirúrgica**: move + renames + atualiza imports. Zero refator de conteúdo, zero mudança de lógica. Critério-teste: _"se a mudança couber em diff puramente mecânico — rename + substituição de prefixos de import — é deste escopo; se exige mudança de assinatura, comportamento ou contrato, NÃO é"_.

A regra Harness Lock que a Spec 0021 promoveu (migrada para `roadmap/backlog.md` como "Harness Lock como contrato executável no boilerplate de tasks.md") é o gate operacional: esta spec **não** atende 2+ critérios de quebra de PR (não muda contrato consumidor, não muda SSOT, não muda topologia interna crítica — só mexe em paths). Portanto entra como 1 PR.

### Componentes ou Sub-blocos

#### [A] — Move de paths

**Estado atual** (baseline antes da spec, em `main` pós-merge da 0021):

- Pasta raiz `cli/` com 41 arquivos `.mjs` (sem tests).
- Pasta raiz `src/` com 53 arquivos `.ts` (sem tests), incluindo `src/cli/livingDocs.ts` (criado pela Spec 0021 sub-bloco 3.C).
- `package.json:bin = "cli/ai-guidelines-cli.mjs"`.
- `package.json:imports` aliases apontam para `./cli/*/*.mjs` (`#app/*`, `#cli/*`, `#features/*`, `#governance/*`, `#fs/*`, `#governance/monolith/*`, `#formatters/*`).
- `package.json:files` inclui `"cli"` com excludes de tests/fixtures.

**Decisão** (depende de `[DEC-0022-A01]` Opção A + `[DEC-0022-A02]` Opção A):

- Move atômico via `git mv cli src/cli` (preserva histórico de blame). O `src/cli/` existente já tem 1 arquivo (`livingDocs.ts`) — o move agrega `cli/*` dentro dele, sem conflito de paths.
- Atualizar `package.json:imports` substituindo prefixo `./cli/...` por `./src/cli/...` em todos os aliases.
- Atualizar `package.json:bin` para `"src/cli/ai-guidelines-cli.mjs"`.
- Atualizar `package.json:files`: substituir entry `"cli"` por `"src/cli"`; ajustar excludes `!cli/**/*.test.mjs` e `!cli/**/__fixtures__` para refletir o novo path.

#### [B] — Atualização de scripts em `package.json`

**Estado atual:**

- Scripts que referenciam paths `cli/`: `guidelines`, `guidelines:init`, `guidelines:adopt`, `guidelines:providers`, `test`, `test:coverage`, `build:rules`, `living-docs:generate`, `living-docs:check`.

**Decisão** (depende de `[DEC-0022-A03]` Opção B):

- Cada script que referencia `cli/X` passa a referenciar `src/cli/X`. Nada mais muda — nomes dos scripts (`guidelines:*`, `test:smoke`, etc.) permanecem; rebranding desses nomes é spec própria.

#### [C] — Atualização de docs e refs canônicas

**Estado atual:**

- Refs textuais a `cli/X` em `README.md`, `AGENTS.md`, e arquivos sob `.core/process/`, `.core/governance/`. Algumas refs descrevem layout (precisam atualizar); outras descrevem narrativa ("a CLI faz X", não muda).
- Specs frozen em `.specify/specs/00*/` referem `cli/` por contexto histórico; política da Spec 0021 (sub-blocos 4.B.3, 4.B.5) já estabeleceu que specs frozen são rastro intencional e **não** devem ser limpas quando o resultado for perder rastreabilidade.

**Decisão** (depende de `[DEC-0022-A03]` Opção B):

- Sweep mecânico em `README.md`, `AGENTS.md`, `.core/process/*.md`, `.core/governance/*.md` (excluindo arquivos auto-gerados) trocando `cli/` por `src/cli/` apenas onde o path descreve layout.
- Refs narrativas ("a CLI") permanecem — esse rebranding é spec própria.
- Specs frozen em `.specify/specs/0008..0021/` **não** são tocadas.
- `ARCHITECTURE.md` §3 ("Como o código está organizado") atualiza o mapa visual: `cli/` deixa de aparecer como diretório raiz; `src/cli/` aparece como home do runtime executável.

#### [D] — Validação

**Decisão:**

- Pipeline local: `yarn check && yarn test:coverage` verde — 296 unit/integration tests passando após move.
- Smoke local: `yarn test:smoke` verde em ubuntu (mínimo) — `npm pack` + install em tempdir + roda `init`/`adopt`/`update` via tarball real.
- Inspeção de tarball: `npm pack /repo --ignore-scripts && tar -tzf *.tgz | grep package/src/cli/ | head` confirma que entrypoint está no path novo; `tar -tzf *.tgz | grep package/cli/` retorna vazio (não há mais paths antigos no tarball).
- CI matriz cross-OS verde: guardrails + 6 smoke (ubuntu/macos/windows × node 22/24) + ai-guidelines-check = 8/8.

---

## 📐 Decisões revisitadas

(vazio — primeiro plan, sem revisões.)

---

## Riscos por componente

- **[A] Move de paths**: imports cross-arquivo podem ficar quebrados se algum hardcoded path absoluto não estiver coberto pelos aliases. Mitigação: rodar `yarn test` imediatamente após o `git mv` e ajustar.
- **[B] Scripts package.json**: erro de substituição pode quebrar `yarn build:rules` ou `yarn living-docs:check`. Mitigação: `yarn check && yarn test` cobre via execução real.
- **[C] Docs e refs**: erro de sweep pode tocar specs frozen (rastro histórico). Mitigação: sweep com filtros explícitos `--include='*.md'` + exclusões `--exclude-dir='.specify/specs'` quando aplicável.
- **[D] Smoke**: Windows pode falhar em path resolution case-sensitive ou comportamento de `node:path`. Mitigação: confiar na matriz CI e rodar smoke localmente em ubuntu antes do push.
