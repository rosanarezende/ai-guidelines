# Checkpoint de Continuidade — PR #35 (pr-cli-cutover): Registry + superfície de navegação por Intent (SSOT de retomada)

> **Documento de RETOMADA canônico** (ADR 0022, situado). Assume zero acesso à conversa anterior. **Estende e supersede** (para retomada) o `2026-06-04-checkpoint-draft-first-convergence.md` — o volume de descobertas desde o `91d1671` justifica nova compactação. Data: 2026-06-04. Consolida o já decidido; sem decisões novas.

---

## 1. Estado atual

| Item         | Valor                                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Branch       | **`feat/spec-0024-pr-cli-cutover`** (= PR **#35**, Draft), stacked sobre `feat/spec-0024-insights-in-flight` (#34)      |
| HEAD         | **`85aead9`** (pushed; local = origin)                                                                                  |
| Working tree | limpo · `yarn validate` verde (inclui `intent:check`)                                                                   |
| Topology     | `#34` concluded → **`pr-cli-cutover`(#35) active** → `pr-compiler-ts`(4) → doctrine(5)…dualroot(10) → integration-final |
| Modo         | `unit` (não mergeia isolado)                                                                                            |

**O #35 deixou de ser cutover mecânico — produziu DUAS entregas de produto:**

- **Registry = SSOT de execução** (superfície IA/scriptável).
- **Intent Catalog + Wizard = SSOT de navegação humana** (superfície de descoberta).

```
Registry          ✅ validado (continue·insight·triage(+review)·release-prep·workflow)
Intent Catalog    ✅ validado (4 intents curadas + intent:check)
Wizard            ✅ validado (Intent→Action→Command via registry; render no CLI real)
Bootstrap TS      ❌ ainda não (etapa 4)
Ops avançadas     ❌ fora do modelo (seção transitória — dívida #35)
```

---

## 2. Decisões cravadas nesta sessão — **NÃO REABRIR**

| Decisão                                                                                                                                                                                                                                         | Estado                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **ADR 0025** — contêiner-primeiro em entrega governada (topology fiel em tempo real)                                                                                                                                                            | cravada (`2412928`)           |
| **Gate do #34** (`gates/c-graph-core.yml` approved)                                                                                                                                                                                             | cravada (`a2a7bda`)           |
| **Registry de comandos** = SSOT de execução; `Command{name,aliases?,parse,run}` genérico; **contrato não mudou** ao absorver posicional/flags/passthrough/subcomando(união)                                                                     | cravada                       |
| **Dupla-superfície**: IA→`Command` direto; humano→`Intent`; ambos sobre os mesmos use cases via Registry. Registry é fonte do catálogo do wizard                                                                                                | cravada                       |
| **`Intent` = artefato CURADO/editorial** (não derivado); **`IntentAction` = Value Object** (aresta `command`+`args?`+`label?`); Intent **nunca executa**, só referencia; `intent:check` garante integridade referencial (padrão `KnowledgeRef`) | cravada (`53d2708`)           |
| **Wizard = cliente do registry** (`Intent→Action→Command`); sem conceito intermediário; sem categorias/grupos (flat)                                                                                                                            | cravada (`85aead9`)           |
| **`review` → `triage`** (rename; `review` vira alias transitório) — comportamento real é triagem (DEC-0023-N01); colidia com review-as-artifact. Rename do módulo `review.ts→triage.ts` amarrado à deleção do legado                            | cravada (`149b59a`)           |
| **`parseFlags` schema-aware** (`--flag`/`--key=value`/`--key value`; mini-schema `{booleans}` LOCAL ao `parse`, não no contrato)                                                                                                                | cravada (`e7f4cb3`)           |
| **`pr-compiler-ts` (seq 4)** = tese separada do cutover, **subordinada** à conclusão do #35                                                                                                                                                     | cravada (`7936724`/`240100f`) |
| Orçamento de tokens = consultivo (refutado como restrição) · `.aider*` ignorado                                                                                                                                                                 | cravadas                      |

**Atritos vigiados no rebuild do wizard (nenhum apareceu):** catálogo seguiu simples · nenhuma op forçou virar Command no rebuild · wizard só `Intent→Action→Command` · zero pressão por categorias/multi-nível.

---

## 3. DONE do #35 (definição vigente)

Registry **roteador único** · **sem fallback** · `engine.mjs` e `args.mjs` **removidos** · bootstrap migrado para TS · **seção "Operações avançadas" eliminada** (sem segundo sistema) · rename `review.ts→triage.ts`.

Hoje só falta, para o roteador único: o fallback legado em `engine.mjs` (transitório) cobre ainda `init`/`adopt`/`providers`/`update` + `--help`/sem-comando; o resto roteia pelo registry.

---

## 4. Próxima sequência executável (PRIORIDADE REVISADA nesta sessão)

**Convergir a superfície humana ANTES do bootstrap** (contexto fresco; a dívida mais importante do #35 deixou de ser o `engine.mjs` — é a coexistência de duas superfícies humanas).

### 4a. Convergência das 5 ops avançadas → eliminar a seção transitória

Para remover "⚙️ Operações avançadas" **sem segundo sistema**, todas viram Commands:

| Op                | Destino                   | Prompts? |
| ----------------- | ------------------------- | -------- |
| list-active-specs | Command (read-only)       | não      |
| diagnose-drift    | Command (read-only)       | não      |
| integration-open  | Command + confirm         | sim      |
| merge-stack       | Command + modo + confirm  | sim      |
| visual-prompt     | Command + tipo + contexto | sim      |

Sequência mínima:

1. **Contrato (aditivo, opcional):** `Command.prompt?(ctx): Promise<TOptions>` (dual interativo de `parse`) + `CommandContext.prompts?`. Wizard chama `prompt()→run()` genericamente; CLI usa `parse()→run()`. `run` = execução compartilhada (um sistema, dois produtores de input). **Não toca os 5 commands atuais.**
2. 2 Commands read-only (list/drift) + Intents.
3. 3 Commands interativos (integration/merge/visual): lógica dos handlers → `run`+`prompt` (via `ctx.prompts`) + Intents.
4. `runIntent` usa `prompt()` quando presente.
5. **Deletar** `runAdvancedOps`/`runWizard`/`WIZARD_MENU`/handlers + entrada "advanced-ops".

> Nomes dos Commands (`specs`/`drift`/…) tocam a taxonomia ainda aberta (`state` namespace deferido) — provisórios; a ESTRUTURA é o que está cravado.

### 4b. Bootstrap pesado (etapa 4) — DEPOIS de 4a

Migrar `init`/`adopt`/`providers`/`update` ao registry (orquestração + provisionamento → TS), remover o fallback + `engine.mjs`/`args.mjs`, rename `review.ts→triage.ts`. `pr-compiler-ts` (motor de compilação) é nó próprio subordinado, **depois** do #35.

---

## 5. Disciplinas

pt-BR · TDD + BDD pt-BR (DADO/QUANDO/ENTÃO) · `yarn format`/`yarn validate` antes de commit · **CORE-07**: push autorizado por increment verde (cadência (a)) · **NÃO** mergeia em main (modo unit) · contrato `Command`/`Registry` só muda de forma aditiva/opcional · não criar segundo sistema (wizard é projeção do registry).
