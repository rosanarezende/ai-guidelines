# Auditoria pré-3.C.4-prep — Agregação de Evidências no Living Docs + Status dos Débitos NEXT.md

> **Spec:** [`./spec.md`](./spec.md)
> **Plan:** [`./plan.md`](./plan.md)
> **Tasks:** [`./tasks.md`](./tasks.md) (sub-bloco `[3.C]`, item 3.C.4 PENDENTE)
> **NEXT:** [`./NEXT.md`](./NEXT.md) (débito 9 do sub-bloco 3.C)
> **Data:** 2026-05-11
> **Owner da auditoria:** @rosanarezende (revisão humana) + Claude Opus 4.7 (execução)
> **Status:** Concluída — abre sub-bloco `[3.C.4-prep]` em `tasks.md` com decisão fundamentada.

---

## 🎯 Motivação

Após 3.C entregar o pipeline TDD completo do drift guard (parser de bypass, serializador YAML, use cases `GenerateLivingDocs` / `CheckLivingDocs`, módulo CLI), a sessão seguinte tentou destravar 3.C.4 (bin físico + yarn scripts + integração CI). A casca do shell foi escrita, o débito de build (`TS6133` em `ruleZone.ts`) foi sanado, mas a **primeira execução real de `runGenerate` contra a árvore do repo explodiu** com `LIVING_DOCS_DUPLICATE_RULE_ID`.

A causa raiz não é bug de implementação — é **decisão de modelagem do domínio**: o extractor emite 1 entry por `it`, mas o padrão BDD adotado no projeto é **1 rule → N cenários** (GIVEN/WHEN/THEN como `it`'s irmãos compartilhando o mesmo `[BR-CLI-*]`).

Esta auditoria responde:

1. **Decisão técnica:** qual a forma certa de agregar múltiplas evidências de uma mesma `ruleId` no schema do Living Docs?
2. **Decisão de escopo:** quais débitos do `NEXT.md` já estão de fato fechados (e precisam só housekeeping), quais são baratos de resolver agora, e quais permanecem bloqueio futuro real?
3. **Decisão de sequenciamento:** o sub-bloco `3.C.4-prep` precisa nascer antes do bin, com qual escopo mínimo?

O objetivo é evitar três armadilhas conhecidas:

- **Bola de neve** — adiar débito de design barato hoje porque amanhã será mais caro.
- **Overengineering oportunista** — bumpar schema sem necessidade, criar abstrações para hipóteses futuras.
- **Hack pontual** — patchar o sintoma (renomear IDs de teste, deduplicar silenciosamente) sem corrigir o modelo.

---

## 📊 Survey: a magnitude real do gap "1 rule → N tests"

Varrendo `src/**/*.test.ts` no estado atual da branch (`feat/spec-0021-pr3-executable-intelligence-runtime`), agrupando ocorrências de `[BR-CLI-*-*]` por ruleId:

| ruleId               | Ocorrências | Natureza                             |
| -------------------- | ----------- | ------------------------------------ |
| `BR-CLI-A-01`        | 31          | Fixture do extractor (testes do AST) |
| `BR-CLI-B-01`        | 7           | Fixture do extractor                 |
| `BR-CLI-APP-01`      | 6           | **Real** — RegisterItem.test.ts      |
| `BR-CLI-POLICY-01`   | 6           | **Real** — Pillars.test.ts           |
| `BR-CLI-A-99`        | 5           | Fixture do extractor                 |
| `BR-CLI-Z-01`        | 4           | Fixture do extractor                 |
| `BR-CLI-APP-02`      | 4           | **Real** — PromoteItem.test.ts       |
| `BR-CLI-Y-01`        | 3           | Fixture do extractor                 |
| `BR-CLI-C-01`        | 3           | Fixture do extractor                 |
| `BR-CLI-X-01`        | 2           | Fixture do extractor                 |
| `BR-CLI-W-01`        | 2           | Fixture do extractor                 |
| `BR-CLI-REGISTRY-01` | 2           | **Real** — RegistryRoundTrip.test.ts |
| `BR-CLI-POLICY-03`   | 2           | **Real** — Pillars.test.ts           |
| `BR-CLI-B-99`        | 2           | Fixture do extractor                 |
| `BR-CLI-X-99` …      | 1           | Único — não dispara o gate           |

**Leitura:**

- **Fixtures de teste do extractor** (IDs como `A-01`, `B-01`) repetem por design — fixture diferente em arquivos `.test.ts` distintos do próprio AST suite. Esses repeats são _intencionais_ e estão isolados dentro de arquivos fixture montados em `tmp/`, mas **o `discoverTestFiles` lê o `src/` real**, e fixtures inline em testes que vivem sob `src/infrastructure/ast/` acabam sendo capturados.
- **Casos reais de produção** (`APP-01`, `POLICY-01`, `APP-02`, `REGISTRY-01`, `POLICY-03`) confirmam o padrão BDD legítimo: **uma rule expressa por GIVEN/WHEN/THEN em vários `it` irmãos**, cada um amarrando um cenário ao mesmo `ruleId`.

O modelo "1 entry por it" é **estruturalmente errado** em ambos os casos:

- Para o caso real, a documentação viva da rule precisa carregar _todas_ as evidências (cenários cobertos), não apenas a primeira encontrada.
- Para o caso de fixture, o pipeline cai mesmo que o autor não tenha cometido erro — o extractor não distingue "teste do código" de "teste sobre o teste do código".

Logo: o gate de design é **real e estrutural**, não cosmético.

---

## 🔎 Estado do código em 2026-05-11

### O que já é byte-a-byte estável

- `canonicalizeArtifact` ordena entries por `ruleId` lexicograficamente, deduplica tags, projeta campos canônicos — ADR 0013 §2 atendido.
- `serializeLivingDocs` produz YAML determinístico (`lineWidth: 0`, `sortMapEntries: false`).
- `LivingDocsEntry` carrega **um** `source: { file, lineStart, lineEnd }`.
- `assertValidArtifact` rejeita `ruleId` duplicado como falha fatal (`LIVING_DOCS_DUPLICATE_RULE_ID`).

### Testes que cristalizam o comportamento atual

| Teste                          | O que afirma hoje                                                         | Implicação no redesign                                                                       |
| ------------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `SCHEMA-14`                    | Artifact com entries duplicadas → erro                                    | **Muda** — passa a aceitar duplicate (agregando)                                             |
| `GENERATE-04`                  | Use case propaga `LIVING_DOCS_DUPLICATE_RULE_ID`                          | **Muda** — passa a agregar (não propaga)                                                     |
| `SCHEMA-04`                    | Campo obrigatório `source` ausente → erro                                 | **Muda** — `source` vira `evidence[]` plural                                                 |
| `SCHEMA-05/06/07`              | Validação de line range em `source` único                                 | **Muda** — passa a validar cada item de `evidence[]`                                         |
| `SOURCEMAP-02/03/04/09`        | Range derivado do `it` único; múltiplos `it` produzem múltiplos entries   | **Muda** — extractor passa a agregar localmente                                              |
| `DETERMINISM-01/02`            | Ordenação alfa por `ruleId`                                               | Inalterado                                                                                   |
| `DETERMINISM-03/04/05`         | Tags dedup + ordenadas                                                    | Inalterado (mantido para evidence-level tags ou agregadas)                                   |
| `DETERMINISM-06/07/08`         | Idempotência + ausência de timestamps + byte-a-byte                       | Inalterado                                                                                   |
| `VERSIONING-01/02/03/04/05/06` | `schemaVersion === "v0"` cravado + supported frozen                       | **Inalterado** — não bumpamos (ver §"Sem bump")                                              |
| `BYPASS` (família)             | Bypass como bloco de entry deprecated                                     | **Muda parcialmente** — bypass vira atributo de evidence ou da entry agregada (decisão fina) |
| `EXTRACTOR-01..12`             | Convenção de path → boundedContext/domain; reconhecimento de it/test/skip | Inalterado no nível do walker; muda só o output shape                                        |
| `CheckLivingDocs.test.ts` (7)  | Drift detection + idempotência                                            | Inalterado conceitualmente; fixtures mudam o shape                                           |
| `cli/livingDocs.test.ts` (8)   | Smoke: exit codes, stderr, idempotência                                   | Inalterado                                                                                   |

**Total de testes que mudam de afirmação: ~12 a 18** (dependendo da granularidade do refactor das fixtures). Os outros ~40 testes da família Living Docs ficam inalterados — o redesign é **localizado**, não uma reescrita.

### Por que não bumpamos schemaVersion

O `VERSIONING-01` exige `LIVING_DOCS_SCHEMA_VERSION === "v0"`. ADR 0011 §6 e invariante 13 da `ARCHITECTURE-REFERENCE` dizem que mudar a cardinalidade do schema exige bump. Aqui há um detalhe:

- **`coverageState`** continua o mesmo enum fechado `{covered, pending, deprecated}` — cardinalidade preservada.
- O que muda é o **shape** do entry (`source: SourceLocation` → `evidence: SourceLocation[]`). Em outras palavras: muda a forma do dado, não a cardinalidade de outcomes.
- O artefato `v0` **nunca foi escrito em produção** — não há baseline para migrar. O ponteiro do drift guard é só este `_prep` antes de escrever pela primeira vez.

Por isso, evoluir `v0` _in-place_ é **honesto, não risco**. ADR 0011 §6 protege a evolução de outcomes; aqui não há outcome novo. Documentaremos a decisão no `tasks.md` do `_prep`, e o `VERSIONING-01..06` continua verde.

> Se a owner preferir bumpar v0→v1 como sinal cultural ("schema mudou mesmo sem consumidor externo"), o custo extra é ~1 teste novo no `VERSIONING` + atualização da constante. Tradeoff: ganha disciplina ritual; perde simplicidade. Recomendação técnica é **manter v0**, mas a decisão é editorial e pode ser revertida sem custo.

---

## 🛠️ Opções de design avaliadas

Quatro caminhos foram considerados para o gap "1 rule → N tests". A tabela compara em 6 eixos; o detalhe vem depois.

| Opção                                                             | Mudança de shape | Quem dedupa | Custo TDD | Honra ADR 0011 | Honra ADR 0012                  | Honra ADR 0013                        |
| ----------------------------------------------------------------- | ---------------- | ----------- | --------- | -------------- | ------------------------------- | ------------------------------------- |
| **(A)** Dedup silencioso em `canonicalize` (1ª vence)             | Não              | domain      | Baixo     | OK             | **Frágil** (qual bypass vence?) | OK                                    |
| **(B)** Pré-agregação no extractor (mantém shape atual)           | Não              | infra       | Médio     | OK             | **Frágil** (mesmo problema)     | **Frágil** (lógica de merge na infra) |
| **(C)** Schema evoluído: `evidence: SourceLocation[]`             | **Sim**          | domain      | Médio     | OK             | OK                              | OK                                    |
| **(D)** Rejeitar duplicates (status quo) + 1-it-por-rule via lint | Não              | n/a         | Alto      | OK             | OK                              | OK                                    |

### (A) Dedup silencioso em `canonicalize` — preserve first, drop rest

**Mecânica:** `canonicalizeArtifact` recebe entries duplicadas, escolhe a primeira (ou a de menor `lineStart`) e descarta as demais. `assertValidArtifact` deixa de rejeitar duplicate.

**Por que rejeitada:**

1. **Perde informação real.** Cenários BDD são GIVEN/WHEN/THEN da _mesma_ rule — descartar 4 deles porque um vence é apagar 80% da documentação viva da regra.
2. **Bypass fica ambíguo.** Se 3 cenários têm `coverageState: deprecated` (com bypass) e 2 têm `covered`, quem vence? A regra é "covered como um todo" ou "deprecated como um todo"? Não há resposta sintaticamente justificável.
3. **Drift guard fica frágil.** Reordenar dois `it` irmãos muda qual vence — pequena edição de teste vira diff grande no artefato. Viola ADR 0013 §2 (mesma árvore → mesmo artefato).
4. **Falha silenciosa de cobertura.** Se um cenário covered some por erro, mas outro persiste como covered, a regra continua "covered" — mas a cobertura real diminuiu. O artefato mente.

**Veredito:** ❌ Rejeitada. Honra a forma byte-a-byte, mas mata a semântica do artefato.

### (B) Pré-agregação no extractor — emite 1 entry por ruleId, agregando localmente

**Mecânica:** `TypeScriptRuleExtractor` mantém o walker, mas antes de retornar entries, agrupa por `ruleId` e funde os agrupados em um único `LivingDocsEntry` cujo `source` é "o primeiro encontrado" + `tags` união.

**Por que rejeitada:**

1. **Move regra de negócio para infra.** O domain rule "uma rule consolida N evidências" é decisão de modelo, não de adapter. Boundary fica torto — `canonicalizeArtifact` deixa de ser SSOT da forma final.
2. **Mesmo problema de bypass** que (A) — quem decide o coverageState do agregado e que bypass aparece, se vários `it` declaram diretivas diferentes?
3. **Schema não reflete a realidade.** O entry continua dizendo `source: { file, lineStart, lineEnd }` único, mas o autor leu múltiplos call sites para sintetizá-lo. Consumidor a jusante (humano lendo o YAML) não consegue navegar dos 5 cenários porque só vê o primeiro.
4. **Quebra a invariante "AST → SSOT".** Se o adapter já "sintetiza", o artefato deixa de ser função pura da árvore — vira função do walker mais regras de merge.

**Veredito:** ❌ Rejeitada. Pior que (A): contamina a infra com lógica de domain.

### (C) Schema evoluído — `evidence: SourceLocation[]` no entry

**Mecânica:** `LivingDocsEntry` passa a ter `evidence: SourceLocation[]` (cardinalidade ≥ 1) no lugar de `source: SourceLocation` único. O agregado natural fica:

```ts
interface LivingDocsEntry {
  readonly ruleId: string;
  readonly title: string; // do primeiro it (lineStart mínimo), ou agregado
  readonly boundedContext: string; // todos os evidence devem coincidir; senão erro
  readonly domain: string; // idem
  readonly evidence: readonly SourceLocation[]; // ≥ 1, ordenado por (file, lineStart)
  readonly tags: readonly string[]; // união dos describe-stacks
  readonly coverageState: CoverageState; // regra de fusão determinística (ver "Fusão de coverageState")
  readonly bypass?: LivingDocsBypass; // só presente se coverageState === "deprecated" (regra preservada)
}
```

Onde:

```ts
interface SourceLocation {
  readonly file: string;
  readonly lineStart: number;
  readonly lineEnd: number;
  readonly testName: string; // título do it() — ajuda navegação
  readonly coverageState: CoverageState; // do it específico
  readonly bypass?: LivingDocsBypass; // bypass do it específico
}
```

**Fusão de coverageState do entry agregado** (regra determinística, parte do domain):

| Cenário                                                 | `entry.coverageState`                                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Todos `evidence[*].coverageState === "covered"`         | `covered`                                                                                                         |
| ≥ 1 `evidence[*].coverageState === "covered"` (mistura) | `covered` (cobertura existe, mesmo que parcial)                                                                   |
| Nenhum covered, ≥ 1 pending                             | `pending`                                                                                                         |
| Todos `deprecated`                                      | `deprecated` (entry.bypass = bypass da `evidence[0]` deprecated; ver §"Bypass agregado")                          |
| Mistura de deprecated e covered/pending                 | Erro fatal `LIVING_DOCS_INCONSISTENT_DEPRECATION` — autor deve marcar todos os cenários como deprecated ou nenhum |

**Bypass agregado:** quando todos cenários são deprecated, cada `evidence[i].bypass` pode ser idêntico ou diferente (autor pode ter posto a mesma diretiva 5 vezes, ou diretivas distintas). Como o entry agregado expõe **um** bloco `bypass` no topo (compatibilidade com ADR 0012 §5), a regra é:

- Se todas `evidence[*].bypass` coincidirem em `(until, ref, reason)` → entry.bypass = essa diretiva única.
- Se discordarem → erro fatal `LIVING_DOCS_BYPASS_DIVERGENT` listando os valores.

Isso preserva a invariante "bypass aparece no artefato como evento de primeira classe" (ADR 0012 §5) sem inventar uma fusão arbitrária.

**Coerência de boundedContext/domain:** se `it` com mesmo `ruleId` aparecerem em arquivos diferentes (cross-file BDD), há duas opções:

- (C.1) **Erro fatal** `LIVING_DOCS_RULE_CROSS_FILE` listando os files. Força disciplina: 1 rule vive em 1 arquivo `.test.ts`.
- (C.2) **Aceitar** e usar o boundedContext/domain do `evidence[0]` ordenado por (file, lineStart). Mais permissivo.

Recomendação: **(C.1)** — o `boundedContext` é parte da identidade do entry; cruzar arquivos é sinal de modelo confuso. Pode ser revisitado se a dor aparecer.

**Por que aceita:**

1. **Honra a semântica.** Uma rule documentada com N cenários é exatamente o que BDD expressa. O schema reflete o modelo, não a sintaxe do framework de teste.
2. **Determinismo preservado.** Cada `evidence[i]` é ordenado por (file, lineStart). Tags fundidas por união + dedup. Fusão de coverageState é função pura da entrada.
3. **Bypass continua de primeira classe.** Regra de divergência impede ambiguidade silenciosa.
4. **ADR 0013 honrada.** `canonicalizeArtifact` agora agrupa por `ruleId` _no domain_, pulando a infra. Mesma árvore → mesmo agregado.
5. **Navegação melhora.** Consumidor lendo `living-docs.yml` vê os 5 cenários cobertos de `BR-CLI-APP-01`, com nome de cada um — mais útil que "o primeiro it".
6. **Drift guard fica mais forte.** Adicionar um `it` novo a uma rule existente vira drift legítimo (entry agregado ganha evidence) — captura o evento "cobertura cresceu" como diff explícito.

**Custo:**

- ~5 a 7 testes do schema/determinism/generate são reescritos (fixtures novas).
- ~3 a 5 testes do extractor são reescritos (output passa de N entries para 1 entry com N evidence).
- 1 use case (Generate) ganha 10–15 linhas para agrupar entries por ruleId e fundir coverageState/bypass.
- 1 invariante nova (LIVING_DOCS_INCONSISTENT_DEPRECATION + LIVING_DOCS_BYPASS_DIVERGENT + LIVING_DOCS_RULE_CROSS_FILE).
- `ARCHITECTURE-REFERENCE` §1.3 e §5 ganham o vocabulário `evidence`.
- A serialização YAML naturalmente passa a expor `evidence:` como lista — legibilidade melhora.

**Veredito:** ✅ **Aceita.** É a única opção que honra simultaneamente os ADRs 0002, 0003, 0004 e a semântica BDD do projeto.

### (D) Rejeitar duplicates (status quo) + 1-it-por-rule via lint/convenção

**Mecânica:** mantém o domain como está; introduz lint rule que falha quando dois `it` no mesmo arquivo carregam o mesmo `[BR-CLI-*]`. Cenários BDD viram sub-testes dentro de um único `it` (com `assert.step` ou um for-loop interno).

**Por que rejeitada:**

1. **Vai contra a cultura BDD do projeto.** Os 6 sites de `BR-CLI-APP-01` em `RegisterItem.test.ts` já estão organizados como GIVEN/WHEN/THEN — refatorá-los em 1 `it` único piora a legibilidade e tira o report de Jest (que mostra cada cenário separado).
2. **Custo de migração alto.** 5+ ruleIds reais (não-fixture) precisam ser reorganizados: `APP-01`, `APP-02`, `POLICY-01`, `POLICY-03`, `REGISTRY-01`. Cada um exige análise editorial — não é refactor mecânico.
3. **Falha de mensagem.** O drift guard vira "edite seus testes para parar de me incomodar" em vez de "documento sua rule como ela se organiza naturalmente".
4. **Não captura cross-file legítimo.** Se uma rule futuramente precisar de cobertura em dois arquivos (ex.: domain test + integration test), o lint impede algo razoável.

**Veredito:** ❌ Rejeitada. Empurra fricção para o autor de teste em vez de modelar o domínio corretamente.

---

## 📐 Recomendação consolidada

**Adotar opção (C): schema evoluído com `evidence: SourceLocation[]`.**

Implementação em 4 passos TDD, cada um vira commit:

1. **Schema:** evoluir `LivingDocsEntry` para `evidence[]`; adicionar `LivingDocsSource.testName` e `LivingDocsSource.coverageState`/`bypass`. Reescrever `LivingDocsSchema.test.ts` (afetados: SCHEMA-04 a SCHEMA-07; SCHEMA-08 a SCHEMA-12 — bypass agora vive em evidence). Manter `BR-CLI-LIVING-DOCS-SCHEMA-*` IDs (rules estáveis; só fixtures mudam).
2. **Canonicalização + agregação:** `canonicalizeArtifact` agrupa entries cruas por `ruleId`, ordena `evidence` por (file, lineStart), aplica fusão de coverageState/bypass, valida coerência de boundedContext/domain. Reescrever `LivingDocsDeterminism.test.ts` afetados; novos testes: agregação, fusão, divergência.
3. **Extractor:** `TypeScriptRuleExtractor` deixa de emitir 1 entry por `it` — passa a emitir N entries cruas que `canonicalizeArtifact` agrupa. Alternativa: extractor agrupa por ruleId _dentro de cada arquivo_ (mantendo dedupe local + cross-file fica para domain). **Decisão técnica:** o extractor agrupa por ruleId apenas _dentro do arquivo_; cross-file é caso de erro fatal tratado pelo domain. Isso preserva o ADR 0013 ("artefato é função pura da AST") sem inflar a infra.
4. **Use cases:** `GenerateLivingDocs` deixa de propagar `LIVING_DOCS_DUPLICATE_RULE_ID` (que vira erro impossível pós-agregação); ganha possibilidade de propagar os 3 novos códigos (`LIVING_DOCS_INCONSISTENT_DEPRECATION`, `LIVING_DOCS_BYPASS_DIVERGENT`, `LIVING_DOCS_RULE_CROSS_FILE`). `CheckLivingDocs` não muda — opera sobre o YAML serializado, agnóstico ao shape.

Após os 4 commits, 3.C.4 destrava:

- Bin físico (cli/living-docs.mjs já desenhado na sessão anterior; reaproveitar).
- Yarn scripts (`living-docs:generate` / `living-docs:check`).
- Geração real do `.governance/living-docs.yml` (decisão de versionar baseline volta a ser questão aberta com a owner).
- Integração CI.

**Sub-bloco `[3.C.4-prep]`** é o nome canônico desse trabalho. Ele precede `[3.C.4]` (que vira o trabalho de casca que esta sessão tentou fazer).

---

## 🧾 Auditoria do NEXT.md: o que está aberto, o que pode fechar agora

Varredura completa do `NEXT.md` em 2026-05-11 cruzando com o estado real do código:

### ✅ Resolvidos (housekeeping pendente — atualizar status no NEXT.md)

| Débito                                          | Status real                                                                                                                                                                                 | Ação proposta                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **2.A.5** — Deprecation plan do legado          | **Resolvido em 2.D** (já marcado no NEXT.md como riscado)                                                                                                                                   | OK — manter como histórico                  |
| **3.A.4** — Bypass directive não tem parser     | **Resolvido em 3.C.3a** (parser entregue em `src/domain/living-docs/BypassDirective.ts`)                                                                                                    | **Marcar como `~~resolvido~~`** com pointer |
| **3.C.5** — Bin físico bloqueado por TS6133     | **Build destravado em 2026-05-11** (`chore(spec-0021): remove import nao-usado em ruleZone.ts`). Bin físico segue PENDENTE — não pela mesma causa: o novo bloqueio é 3.C.9 (gate de design) | **Reescrever débito** apontando para 3.C.9  |
| **3.C.6** — Integração CI também depende do bin | Mesma situação que 3.C.5                                                                                                                                                                    | **Reescrever** apontando para 3.C.9         |

### 🟡 Abertos — baratos, podem ser resolvidos em paralelo a 3.C.4-prep (1-2h cada)

| Débito                                                | Resumo                                                                                                | Estimativa | Risco se adiar                                                                                                     |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| **2.B.4** — `RegistryService` cobertura baixa         | `update`/`remove`/`load`/`save` via service só cobertos indiretamente; `autosave:false` nunca testado | ~1-2h      | Bola de neve **baixa** — service é casca fina; risco real só se a CLI plugar o service em PR4                      |
| **2.C.5** — `JsonRulesCatalogSource` coverage 0%      | Suite e2e que cruza `rules.json` real está faltando                                                   | ~1-2h      | Bola de neve **média** — quando AST-based rules entrar em PR3.D+, o caminho json vira legacy importante de validar |
| **2.D.4** — Drift guard de `RESERVED_GOVERNANCE_DIRS` | Já entregue (`ReservedDirsContract.test.ts`) — só falta confirmar trigger no pipeline canônico        | ~30min     | **Quase nada** — só verificar que o teste roda no test:nova-cli                                                    |

**Recomendação:** considerar **2.B.4 e 2.C.5** como sub-débitos de `[3.C.4-prep]` ou abrir sub-bloco paralelo `[3.C.aux]`. Owner decide. Se a sessão de `_prep` tiver folga, pegar **2.C.5** primeiro (é o que mais ganha com a tooling AST que já estará em foco).

### 🔴 Abertos — bloqueio futuro real ou trabalho denso (não tocar agora)

| Débito                                                               | Resumo                                                                                                                                       | Quando resolver                                                                                                                  |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Fase 1 #1, #2, #6**                                                | WorkItemPatch wide; cast em Registry.update; ResolutionMode pouco exercitado                                                                 | PR2 (parcialmente endereçados) / PR3 (CheckLivingDocs amarrou parte de #6 indiretamente) — manter                                |
| **Fase 1 #3** + **2.C.3** + **3.B.4**                                | Boundary Lock por regex → migrar para AST (mesma família de débito)                                                                          | **PR4 / 4.B** — tooling AST já existe; pode virar trabalho concreto. Estimativa: 1-2 dias. Recomendação: priorizar antes de 4.C  |
| **Fase 1 #4**                                                        | Glossário sem enforcement                                                                                                                    | Quando a tooling de "AST × glossário" amadurecer (provavelmente após TemplateEngine 3.D, que terá engine de manipulação textual) |
| **Fase 1 #5**                                                        | E2E cruzando use cases + adapters reais                                                                                                      | PR4 (parcialmente coberto por NodeWorkspaceIntegration; segue parcial)                                                           |
| **2.A.4, 2.A.5, 2.B.1, 2.B.2** — skips de filesystem                 | `Isolation.test.ts` (8 skips), `FileSystemAdapter.test.ts` (4 skips)                                                                         | Quando `WorkspaceStore` ganhar adapter real plugado em densidade por item (PR4)                                                  |
| **2.A.8** — Bridge reader                                            | `WorkspacePrecedence.allowExplicitLegacyBridge` sem reader implementado                                                                      | PR4 quando o cutover real do legado começar                                                                                      |
| **2.A.3** — Race em `ensureDirectory`                                | Pré-check + mkdir separados                                                                                                                  | Só se a CLI virar daemon — risco nulo hoje                                                                                       |
| **2.B.5** — Use case orquestrando `RegistryService`                  | `RegisterWorkItem`/`PromoteWorkItem` ainda usam in-memory; integração com store real em 2.D / PR4                                            | PR4                                                                                                                              |
| **2.C.1** — Builder mjs como SSOT da regra catalog                   | Migração parser markdown → TS (AST-first); fará sentido junto com 3.D ou depois                                                              | PR3.D ou PR4 — não bloqueia 3.C.4-prep                                                                                           |
| **2.C.4** — `OPT_IN_FEATURE_LAYOUT` mapa estático                    | Aceito como acoplamento intencional                                                                                                          | Revisitar se passar de 10 entries — provavelmente nunca                                                                          |
| **2.D.2** — Docs/help legados apontam para `.ai-guidelines/`         | Honesto-por-design; troca coordenada em PR4 com cutover                                                                                      | PR4 / 4.A                                                                                                                        |
| **2.D.3** — Specs históricas com referências `opt-in/methodologies/` | Débito documental herdado de 2.C                                                                                                             | PR4 / 4.C                                                                                                                        |
| **3.0.5** — Auditoria estrutural de `.core/rules/top/`               | Renomear arquivos / consolidar README — escopo PR4 / 4.B                                                                                     | PR4 / 4.B                                                                                                                        |
| **3.A.3** — Glossário não cruzado com schema do living-docs          | Mesma família que Fase 1 #4 + relacionado a `evidence`/`testName` introduzidos em 3.C.4-prep (oportunidade óbvia de melhoria, mas não agora) | PR3.D ou PR4                                                                                                                     |
| **3.B.4** — Boundary Lock por AST                                    | Mesma família que 2.C.3 + Fase 1 #3                                                                                                          | PR4 / 4.B                                                                                                                        |

### 📌 Débitos novos a abrir após 3.C.4-prep

Quando o sub-bloco `_prep` fechar, registrar:

- **3.C.4** (renumerado para vir depois de `_prep`): bin + scripts + CI, agora destravado.
- Eventual sub-débito sobre **decisão de versionar baseline** `.governance/living-docs.yml` (a primeira geração será ~2-5KB de YAML; owner decide).
- Eventual sub-débito sobre **integração CI dedicada** (se `ai-guidelines-ci.yml` já existe, só adicionar step `yarn living-docs:check`).

---

## 🧨 Anti-objetivos (explícitos)

Para esta sessão e o `[3.C.4-prep]`, **NÃO** fazer:

1. **Não bumpar `LIVING_DOCS_SCHEMA_VERSION` para `v1`.** Argumentado em §"Por que não bumpamos". Decisão revertível se a owner quiser disciplina ritual.
2. **Não inventar `coverageHistory` ou `lastRunStatus` no schema.** ADR 0013 §6: telemetria é camada aditiva separada, não pertence ao SSOT estático.
3. **Não migrar `Boundaries.test.ts` para AST nesta sessão.** Mesmo com a tooling AST já em uso, esse trabalho é PR4/4.B — abre escopo demais.
4. **Não tocar em `RegisterItem.test.ts` / `Pillars.test.ts` / etc. para "consertar" os duplicates.** A solução vai pelo schema, não pelo teste.
5. **Não criar reporter Jest custom.** Mantém SSOT estática; reporter pode entrar quando alguém pedir `lastRunStatus`.
6. **Não decidir o destino do `.governance/living-docs.yml` (versionar ou não) nesta sessão de \_prep.** Pertence ao 3.C.4 final, quando o YAML estiver gerado pelo schema novo e a owner ver o tamanho real.

---

## 🎬 Próximos passos imediatos

1. Owner valida esta auditoria (especialmente as decisões: schema evoluído, sem bump, regras de fusão).
2. Sub-bloco `[3.C.4-prep]` aberto em `tasks.md` com 4 passos TDD declarados nesta auditoria.
3. NEXT.md ganha housekeeping: **3.A.4 marcado resolvido** apontando para 3.C.3a; **3.C.5 e 3.C.6 reescritos** apontando para 3.C.9 como bloqueio canônico; **3.C.9** linkado a esta auditoria.
4. Sessão de execução TDD do `_prep` começa pelo schema (teste vermelho da nova invariante `evidence[]`) — não pelo extractor.

---

## 🔗 Referências canônicas usadas

- ADR 0011 — Outcomes em artefatos derivados são enums fechados ([`.core/governance/adrs/0002-coverage-state-enum.md`](../../../.core/governance/adrs/0002-coverage-state-enum.md))
- ADR 0012 — Bypass auditável de contratos de CI ([`.core/governance/adrs/0003-drift-guard-bypass.md`](../../../.core/governance/adrs/0003-drift-guard-bypass.md))
- ADR 0013 — AST como SSOT para artefatos derivados ([`.core/governance/adrs/0004-ast-only-extraction.md`](../../../.core/governance/adrs/0004-ast-only-extraction.md))
- ARCHITECTURE-REFERENCE.md §1.3 (contextos PR3), §2 invariantes 13 e 14, §5 glossário ([`.core/governance/ARCHITECTURE-REFERENCE.md`](../../../.core/governance/ARCHITECTURE-REFERENCE.md))
- Auditoria pré-2.D (precedente de formato) ([`./audit-2026-05-10-pre-2d-sanitization.md`](./audit-2026-05-10-pre-2d-sanitization.md))
- Pesquisa de fundo Living Docs ([`../researchs/governance/2026-05-11-living-docs-and-template-composition-practices.md`](../researchs/governance/2026-05-11-living-docs-and-template-composition-practices.md))
