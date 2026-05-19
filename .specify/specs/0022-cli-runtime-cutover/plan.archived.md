<!-- ai-guidelines-template: plan-boilerplate v=1 -->
<!-- ARCHIVED: methodologically invalid — preserved as historical evidence, NOT for execution. -->

# Plan (ARCHIVED) — Spec 0022 CLI Runtime Cutover (DDD + TDD + BDD)

> Spec: [`./spec.md`](./spec.md) — _ver aviso editorial naquele arquivo_
> Decision Brief: [`./decision-brief.md`](./decision-brief.md) — _ver aviso editorial naquele arquivo_
> Status: **ARCHIVED — pre-discovery planning artifact**

> 🚫 **ARQUIVADO — NÃO USAR COMO BASE DE IMPLEMENTAÇÃO**
>
> Este `plan.md` foi escrito durante a sessão de design 2026-05-18 e **arquivado na mesma sessão** após a revisão metodológica revelar que ele nasceu **antes do discovery arquitetural correto**.
>
> Renomeado para `plan.archived.md` para impedir uso operacional. Conteúdo preservado integralmente abaixo como artifact histórico — útil para a **Spec 0023 (Governance Workflow & Discovery Model)** como caso concreto de "planning prematuro" no lifecycle vigente.
>
> **Por que é metodologicamente inválido:**
>
> - Nasceu antes de qualquer `research.md` real (não existia o conceito ainda).
> - Deriva diretamente das premissas do `decision-brief.md` que também está enviesado por CLI-first/runtime-assumption/command-centricity.
> - O lifecycle vigente (spec → decision-brief → plan → tasks linear) não tem Stage A (Discovery) — esse vácuo é justamente o que a Spec 0023 vai corrigir.
> - As decisões técnicas aqui (composition root em `src/cli/`, ordem de cutover por dependência interna, bridge em `cli/ai-guidelines-cli.mjs`) **pressupõem** que a arquitetura-alvo já está definida — não está.
>
> **Conteúdo abaixo preservado como histórico. NÃO executar. NÃO usar como entrada de planning real.**

---

## 🛰️ Stage 1 / Stage 2

**Stage 1 (Research → opções).** Coletado em sessão de design 2026-05-18 entre Rosana Rezende e Claude Code. Evidência empírica condensada em `decision-brief.md` com 6 pontos abertos (5 no Bloco A + 1 no Bloco C mandatório). **Status:** Stage 1 fechado, aguardando gate humano.

**Stage 2 (Design + Implementação).** As subseções abaixo derivam linearmente das decisões cravadas pelo gate humano. Cada componente referencia o `[DEC-0022-XYZ]` que o alimenta. **Status:** placeholder até gate. Após o gate, este plano é refinado em "v2" conforme o checklist pós-gate da brief.

---

## 🏗️ Design e Arquitetura

### Princípio guia

**Cutover arquitetural completo via DDD + TDD + BDD.** Cada comando publicado e cada feature de runtime ganha um lar semântico em `src/` (camada DDD apropriada: `domain`, `app`, `infrastructure`, `cli`) e é coberto por testes próprios. A migração segue Strangler Fig: features migram uma a uma, com bridge em `cli/ai-guidelines-cli.mjs` durante a transição; o último sub-PR remove o bridge e elimina `cli/`.

**TDD nos use cases**: cada novo use case em `src/app/use-cases/X.ts` nasce de `X.test.ts` (red → green → refactor). Padrão dos 10 use cases existentes (entregues pela 0021) é referência.

**BDD nos smokes**: a suíte de smoke tests em `tests/smoke/` continua sendo a validação ponta-a-ponta. Estilo Gherkin é opcional (decisão em `[DEC-0022-A04]`); o que é mandatório é que cada comando publicado tenha smoke cobrindo seu fluxo principal via tarball real.

### Mapeamento do estado atual

#### Comandos publicados (5)

| Comando        | Estado em `cli/`                          | Estado em `src/`                         | Trabalho                                  |
| :------------- | :---------------------------------------- | :--------------------------------------- | :---------------------------------------- |
| `init`         | `cli/app/install.mjs` + features          | (não existe)                             | Criar `InitWorkspace` use case + adapters |
| `adopt`        | `cli/app/engine.mjs` + features           | `src/app/use-cases/AdoptWorkspace.ts` ✅ | Plugar use case existente; remover mjs    |
| `update`       | `cli/app/engine.mjs` (re-aplica baseline) | (não existe)                             | Criar `UpdateWorkspace` use case          |
| `providers`    | `cli/features/core/*` (subset)            | (não existe)                             | Criar `InstallProviders` use case         |
| `check-budget` | `cli/features/core/budget-report.mjs`     | (não existe)                             | Criar `RenderTokenBudgetReport` use case  |

#### Features de runtime (residuais)

Lar destino decidido em `[DEC-0022-A05]`. Pré-recomendação:

| Feature mjs                                 | Camada DDD provável     |
| :------------------------------------------ | :---------------------- |
| `cli/features/core/pointers.mjs`            | `src/domain/` (policy)  |
| `cli/features/core/templates.mjs`           | `src/app/use-cases/`    |
| `cli/features/core/recipes.mjs`             | `src/infrastructure/`   |
| `cli/features/core/rules-loader.mjs`        | `src/infrastructure/`   |
| `cli/features/core/budget-report.mjs`       | `src/domain/` + adapter |
| `cli/governance/monolith/rules-builder.mjs` | `src/infrastructure/`   |
| `cli/governance/monolith/compiler.mjs`      | `src/infrastructure/`   |
| `cli/fs/file-system.mjs`                    | `src/infrastructure/`   |
| `cli/fs/io.mjs`                             | `src/infrastructure/`   |
| `cli/fs/merge-utils.mjs`                    | `src/domain/` (policy)  |
| `cli/cli/args.mjs`                          | `src/cli/` (parser)     |

### Sub-blocos (alinhados com Harness Lock)

Estrutura dos sub-blocos depende de `[DEC-0022-A01]` (número de PRs). Recomendação inicial: **5 sub-PRs** com ordem por dependência interna (`[DEC-0022-A02]` Opção C).

#### Sub-bloco [PR1] — Setup + Auditoria + Cutover de `adopt`

**Estado atual:** `AdoptWorkspace.ts` existe em `src/` mas não está plugado. Comando `adopt` real roda via `cli/app/engine.mjs`.

**Decisão:** PR1 entrega:

1. Setup da spec (Fase 0 do `tasks.md`).
2. Auditoria detalhada do mapeamento (atualizar tabela acima com paths exatos e dependências).
3. Composition root inicial em `src/cli/composition.ts` que injeta adapters reais em `AdoptWorkspace`.
4. `cli/ai-guidelines-cli.mjs` modificado: rota do comando `adopt` delega para o use case via wrapper fino.
5. Smoke do comando `adopt` verde (validação ponta-a-ponta cross-OS).
6. TDD nos novos arquivos: composition root tem `composition.test.ts`; wrapper mjs → ts tem teste de integração.

#### Sub-bloco [PR2] — Cutover de `init`

**Estado atual:** `init` é o comando mais complexo (wizard interativo + geração de 10+ arquivos). Não tem use case DDD; usa `cli/app/install.mjs` + features de `cli/features/core/`.

**Decisão:** PR2 entrega:

1. `InitWorkspace.ts` em `src/app/use-cases/` criado via TDD. Reusa `AdoptWorkspace` internamente.
2. Adapters necessários migrados de `cli/features/core/` para `src/domain/` ou `src/infrastructure/` conforme `[DEC-0022-A05]`.
3. Rota do comando `init` em `cli/ai-guidelines-cli.mjs` delega para o use case.
4. Smoke do comando `init` verde.

#### Sub-bloco [PR3] — Cutover de `update` + `providers`

**Estado atual:** ambos compartilham features de geração de arquivos (managed-block writer, providers files).

**Decisão:** PR3 entrega:

1. `UpdateWorkspace.ts` + `InstallProviders.ts` em `src/app/use-cases/` via TDD.
2. Adapters de managed-block + providers migrados (compartilhados com `InitWorkspace` do PR2).
3. Rotas `update` e `providers` em `cli/ai-guidelines-cli.mjs` delegam.
4. Smoke de ambos verdes.

#### Sub-bloco [PR4] — Cutover de `check-budget` + features residuais

**Estado atual:** `check-budget` é read-only (lê config e emite relatório). Features residuais não-cobertas pelos PRs anteriores: `rules-builder`, `rules-loader`, `compiler`, `args`, `merge-utils`, etc.

**Decisão:** PR4 entrega:

1. `RenderTokenBudgetReport.ts` em `src/app/use-cases/` via TDD.
2. Features residuais migradas individualmente (conforme classificação de `[DEC-0022-A05]`).
3. Rota `check-budget` delega.
4. Smoke verde.

#### Sub-bloco [PR5] — Cleanup final + remoção de `cli/`

**Estado atual:** ao chegar aqui, todos os 5 comandos delegam para use cases em `src/`. `cli/ai-guidelines-cli.mjs` é o último arquivo "vivo" em `cli/` — um router fino.

**Decisão:** PR5 entrega:

1. Criar `src/cli/ai-guidelines.ts` como entrypoint final (substitui o router em `cli/`).
2. `package.json:bin` muda para `"src/cli/ai-guidelines.ts"` (ou `dist/...` se compilado).
3. `package.json:files` substitui `"cli"` por `"src/cli"` + `"dist"` (já presente desde a 0021).
4. `package.json:imports` (`#cli/*`, `#features/*`, `#app/*`, `#fs/*`, `#governance/*`) atualizados ou removidos conforme uso real pós-cutover.
5. Scripts em `package.json` (`guidelines:*`, `test`, `test:smoke`, `build:rules`, `living-docs:*`) atualizados para apontar para `src/`.
6. `git rm -r cli/` (deleta a pasta inteira).
7. Refs textuais em `README.md`, `AGENTS.md`, `.core/process/*`, `.core/governance/*` atualizadas onde descrevem layout (sweep mecânico).
8. `ARCHITECTURE.md` §3 ("Como o código está organizado") atualizado: `cli/` sai do mapa; `src/cli/` aparece como home único do runtime.
9. Specs frozen em `.specify/specs/0008..0021/` **NÃO** são tocadas (rastro histórico — política da 0021 § 4.B.3, 4.B.5).
10. Smoke completo cross-OS verde (tarball validado).

---

## 📐 Decisões revisitadas

(vazio — primeiro plan, sem revisões.)

---

## Riscos por componente

- **PR1 (Setup + adopt)**: o composition root injetar adapters errados causa regressão. Mitigação: TDD do composition root + smoke comparativo (output antes vs depois do PR).
- **PR2 (init)**: wizard interativo tem estado oculto (prompts encadeados). Use case DDD precisa modelar isso explicitamente. Mitigação: design de port `PromptAdapter` injetável (já existe precedente em `src/app/ports/`).
- **PR3 (update + providers)**: idempotência de managed-block writer é crítica. Mitigação: golden tests com fixtures comparando estado antes/depois.
- **PR4 (check-budget + residuais)**: features residuais podem ter acoplamentos cross-comando que só aparecem na migração. Mitigação: auditoria do PR1 mapear esses acoplamentos.
- **PR5 (cleanup)**: deletar `cli/` pode quebrar imports não-cobertos. Mitigação: rodar `yarn test:coverage` antes do delete, confirmar zero refs a `cli/*` em código vivo.
- **Risco transversal (todos os PRs)**: escopo crescer ao descobrir bugs no `cli/` durante a migração. Mitigação: regra "replicar comportamento, não corrigir"; bugs viram issues separadas.
