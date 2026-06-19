<!-- ai-guidelines-template: decision-brief-boilerplate v=2 -->

# Decision Brief — Spec 0024 Context Architecture

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Tasks: [`./tasks.md`](./tasks.md)
> Status agregado: **Resolved (decisões)** — todas as `[DEC]` desta spec estão `Resolved`; a pesquisa estrutural ainda aberta vive em [`research/findings.md`](./research/findings.md), não aqui.
> Última atualização: 2026-06-19 — **`[DEC-0024-G17]` registrada**: `CO-10.7` foi reaberto por fechamento prematuro; `CO-10.8` fica pausado até a CLI pública ser falsificada em consumidores reais/simulados e refletida no site.

> **Artefato exclusivo de decisão humana.** Organizado por **estado**, não por numeração histórica (reestruturação 2026-05-31). Quatro estados respondem, à primeira vista, _o que já foi decidido · o que ainda está aberto · o que virou regra · o que virou enforcement_:
>
> - **Decidido** — `[DEC]` `Resolved`: o julgamento cravado.
> - **Aberto** — pesquisa genuína (alternativas reais competindo) → **ponteiro** para `findings.md`; nunca reproduzida aqui.
> - **Virou regra** — decisão promovida a princípio/regra declarada (ADR / `rules.json`) — camada _awareness_ (ADR 0021 L1).
> - **Virou enforcement** — decisão ligada a check que **pode falhar** ou a código que a reflete — camada _estrutural_ (ADR 0021 L2/L4). É onde "reduzir divergência entre aprendizado e código" acontece.
>
> Convenções (formas B/C/D, IDs, contrato da cadeia) → `decision-brief-boilerplate.md` + `.core/process/governance-foundation.md`. Histórico/cronologia → **git**. Os IDs `[DEC-0024-G##]` permanecem **âncoras estáveis**, mas **não organizam mais a leitura** (mapa no fim).
>
> **Critério de sucesso:** se um conteúdo aqui não exige **aceitar / rejeitar / reenquadrar**, ele está no artefato errado.

---

## 1 · Decidido — julgamento cravado (`Resolved`)

> Pontos `Resolved` são **imutáveis** (revisões vão para `plan.md` § "Decisões revisitadas"). Reproduzidos **verbatim** desde o gate respectivo, apenas reorganizados.

### [DEC-0024-G00] (RAIZ) Unidade arquitetural primária do framework

> **A unidade arquitetural primária do ai-guidelines é a transformação de `contexto humano → governança executável`.**

**A única pergunta do gate:** _concordo ou não concordo com a afirmação acima?_

**O que está sendo aceito:**

- a unidade primária é uma **transformação** (`contexto humano → governança executável`);
- é o que o framework modela na raiz — o ponto de partida do qual o resto deriva.

**O que NÃO está sendo aceito:**

- **não** é a afirmação de que isto "explica tudo" no framework — é **identidade arquitetural**, não explicação universal;
- **não** decide a estrutura/gramática (pilares, taxonomia, pipeline, projeções) — isso é **G01-G05**;
- **não** crava a fronteira fina que distingue esta classe de outros sistemas governados (o `terminus`) — deferido a G01.

**Concorrentes considerados** (por que nenhum é a unidade _primária_):

- **spec** — é um agrupamento/projeção de trabalho; o framework também modela o que não é spec (regras, ADRs, handoffs). Não é a raiz.
- **task** — é unidade de **execução** derivada do plano (a ponta do fluxo); só existe depois da decisão. Não gera o resto.
- **decision** — é um **momento** dentro da transformação (o ponto de julgamento); a transformação a contém, não o contrário.
- **finding** — é um **estado intermediário** (conhecimento convergido); insumo da transformação, não a transformação.
- **artifact** — é **produto/projeção** da transformação (saída por estado/consumidor); o que ela emite, não a raiz.
- **workflow** — é a **sequência observável** em que a transformação se manifesta no tempo; descreve o fluxo, não a unidade modelada.

**Escopo da decisão:**

- **G00 responde à identidade arquitetural** (_qual é a unidade primária_).
- **G01 permanece aberto** para estrutura/gramática (_como ela se organiza_).
- **Aceitar G00 não resolve G01.**

**Decisão do Gate Humano (`aceitação`):**

- **Status:** [ ] Pendente | [x] **Resolvido**
- **Ato do gate:**
  - [x] **Aceitar** — concordo com a afirmação.
  - [ ] **Rejeitar**
  - [ ] **Reenquadrar**
- **Justificativa (owner):**
  - A investigação convergiu para uma **única candidata estável** sob todos os testes realizados.
  - Nenhum concorrente (`spec`, `task`, `decision`, `finding`, `artifact`, `workflow`) demonstrou poder explicativo superior nem ocupou legitimamente o papel de unidade arquitetural primária.
  - As rodadas posteriores passaram a discutir estrutura, gramática, estados, artefatos, governança, trilhos e comportamento do sistema — temas **fora do escopo de G00** (pertencem a **G01+**).
  - **Não há lacuna de evidência** bloqueando a decisão; o risco dominante neste ponto é **refinar indefinidamente** algo já cristalizado.
  - A aceitação **não implica** aceitar explicações causais, gramática estrutural, taxonomia final, modelo de estados, promotion pipeline, mecanismo Finding→DEC ou qualquer tema em investigação.
  - Aceita-se **exclusivamente** a afirmação: _a unidade arquitetural primária do ai-guidelines é a transformação de `contexto humano → governança executável`._
- **Data / Owner:** 2026-05-31 / @rosanarezende

---

### [DEC-0024-G02] Taxonomia `deterministic/mixed/evidence-driven` → removida; substituída por bloco + propriedade `exige-julgamento`

**Modo de gate:** `aceitação`

**O finding (o que foi aceito):**

> A entidade de 1ª classe é **o bloco**. **`exige julgamento?`** é uma **propriedade** dele (derivada de "há incerteza relevante") — **não um tipo de bloco**. Um bloco passa pelo crivo de pesquisa/gate **se e somente se exige julgamento**; o **gate** é onde o julgamento acontece; o `[DEC]` **registra** o resultado (Camada 2). A taxonomia dos 3 tipos era **projeção** disso (`deterministic` = nenhum bloco exige julgamento; `mixed` = alguns; `evidence-driven` = todos) — por isso é **removida**.

**O que está sendo aceito (bounded):**

- a propriedade primária migra de **spec-level** (`tipo`) para **bloco-level** (`exige julgamento?`);
- `mixed` deixa de existir (caso degenerado); a degeneração para single-pass é automática (zero blocos que exigem julgamento ⟹ sem gate/brief);
- **mecanismo de declaração = marcador explícito** no sub-bloco: `(julgamento)` / `(determinístico)` (decisão do owner, 2026-05-31 — resolve o último átomo aberto; **não** é derivação implícita).

**O que NÃO está sendo aceito:** nada que exija nova pesquisa — a direção e o desenho estão cravados. A **execução** (migração de `WorkflowType`, boilerplates, wizard, doc) **deriva** desta decisão e vive em `plan.md` / `tasks.md` — não é julgamento pendente, é trabalho (ver § 4 · Virou enforcement).

**Por que as alternativas falham + o que reabriria** (falsificabilidade):

- **Manter a taxonomia de 3 tipos:** refutada — exigia sincronização manual de 3 modelos paralelos (drift recorrente: `mixed` sempre atrás); a única diferença real entre tipos era presença/ausência de julgamento. _Reabre se:_ G01 revelar invariante próprio de um tipo (não observado).
- **Taxonomia binária (2 tipos: determinístico / julgamento):** refutada pelo _guard anti-taxonomia_ — recria a taxonomia um nível abaixo (classes em vez de propriedade). _Reabre se:_ a propriedade `exige julgamento?` provar-se insuficiente para gating preciso.
- **`[DEC]` como pivô/gatilho (`bloco → DEC → gate`):** refutada por `F-005` — exige DEC-stub fantasma antes de haver conteúdo de decisão. _Reabre se:_ o gate precisar de um registro anterior ao julgamento (não observado).
- **Booleano spec-level (`requires-research`):** refutado — reintroduz o drift do `mixed` (spec "mista" volta a ser tipo impreciso). _Reabre se:_ o gating por-bloco provar-se custoso demais na prática.
- **O finding é falsificável por:** um caso real onde um bloco precise de gate **sem** incerteza relevante, ou onde a taxonomia capture um invariante que a propriedade não captura.

**Dependência de G00 (resolvida):** o desenho assumia a identidade C de G00. **G00 foi _aceito_ (não reenquadrado) em 2026-05-31 → a premissa está confirmada; a ressalva não disparou.**

**Evidências:** `F-004` (taxonomia = projeção do crivo de julgamento), `F-005` (DEC = registro, não gatilho). **Desenho:** `research/2026-05-30-unified-tasks-model.md` (modelo substituto + impacto por classe + plano de migração).

**Decisão do Gate Humano (`aceitação`):**

- **Status:** [ ] Pendente | [x] **Resolvido**
- **Ato:**
  - [x] **Aceitar** — o modelo substituto + mecanismo de declaração por **marcador explícito** `(julgamento)`/`(determinístico)`.
  - [ ] **Rejeitar** · [ ] **Reenquadrar**
- **Justificativa / Ressalvas (owner):**
  - A direção (remover a taxonomia) estava cravada desde 2026-05-30; o desenho do substituto convergiu e o único átomo aberto (mecanismo de declaração) foi decidido: **marcador explícito**.
  - Tratar isto como julgamento pendente era **documentação atrasada, não decisão aberta** (Caso B): o gate registra o julgamento já formado, não reabre.
  - A migração física **não é** condição do gate — é execução derivada.
- **Data / Owner:** 2026-05-31 / @rosanarezende

---

### [DEC-0024-G06] Contrato da cadeia `research → … → implementação` (decisão de processo)

**Pergunta:** O que protege a autoria humana (seta `humano → sistema`, ADR 0018) em cada seam da cadeia — não só no seam `research → decision-brief` que falhou no G00?

**Modo de gate:** `aceitação` <!-- decisão de processo em sessão colaborativa humano-agente, 2026-05-29/30; cf. governance-foundation "Casos limites". -->

**Decisão (Resolved):** cravar em `governance-foundation.md` § "Contrato da cadeia" o contrato de I/O de cada fase em **três eixos** — _produz · proibido de produzir · escala para_ —, o **critério de parada da research** (para quando a decisão é possível; modos de gate `escolha`/`aceitação`), os **mecanismos de escalonamento** (roteamento por classe de descoberta, reusando primitivos existentes) e o **anti-padrão #6**. Boilerplates (`decision-brief`, `plan`) e `rpi-protocol.md` **refletem** o contrato; a constituição é SSOT. **Sem enforcement mecânico** (dogfood primeiro). Evidência-origem: `research/2026-05-30-research-output-contract.md` (+ findings `F-005`).

**Nota de ordem:** é decisão de **governança-processo**, ortogonal ao _conteúdo_ de G00 — **não viola o invariante de ordem**. G00 permanece `Pendente`. **Promotável a ADR no fechamento da spec.** <!-- nota datada de 2026-05-30; G00 passou a Resolved em 2026-05-31 (ver § 1). Preservada verbatim por imutabilidade do DEC. -->

**Status:** Resolved (2026-05-30) / @rosanarezende — decisão de processo colaborativa.

---

### [DEC-0024-G07] Topologia como dado (`state.yml` = SSOT) + enforcement L4 de projeções de PR

**Pergunta:** Onde vive a topologia de PRs de uma spec (qual PR, papel, posição no stack, quais checkpoints embarca) e o que impede os artefatos visuais (título, template de PR) de divergirem dela em silêncio?

**Modo de gate:** `aceitação` <!-- decisão de processo/arquitetura, sessão colaborativa 2026-06-01; descoberta pelo Architectural Review Gate do Checkpoint 2.3, absorvida no 2.3a. -->

**Decisão (Resolved):**

- A topologia vive como **dado estruturado** em `state.yml § topology` (`cursor` + `prs.{concluded,active,planned}`; campos `id/github_pr/role/terminal/sequence/checkpoints`). É a **SSOT** da topologia, validada por schema em `workflowStateSerializer` (gate `state-yml:check`), incluindo invariantes de `sequence` — **única, contígua `1..K`, presente sse `role: execution`** (Checkpoint 2.3a / O6).
- Título de PR e seções do template são **projeções** derivadas dessa SSOT. O `governance-pr-check` (L4 CI) **valida** as projeções contra a SSOT — **nunca o inverso** (não lê verdade de título/emoji). **Supersede** a postura anti-recursão do Anti-DAG (`pr-title-conventions.md`), que vedava CI validar formato/ordem de título _"sem DEC registrada"_: **esta é a DEC**.
- **Hierarquia de SSOT (O1):** `state.yml` é a fonte estrutural única. O `plan.md` contém uma **projeção derivada explícita** (rotulada como tal), nunca uma fonte paralela; em divergência, `state.yml` vence. **Sem** sincronização automática (repo é memória; humano reconcilia).
- **Postura de enforcement (O5):** `governance-pr-check` é **advisory** (sinal de CI; **não** é required status check) **enquanto não existir o guard inverso topologia↔realidade git** (deferido — `topology:check`, análogo à producibilidade do 2.2). Promoção a `required` é **condicionada** a esse guard. Racional: enforçar projeções contra uma SSOT ainda não-guardada poderia **bloquear merge por erro da própria SSOT** (o 2.3 nasceu com um nó-fantasma) — recriaria o mascaramento por admin-bypass que a 0024 combate.
  - **↳ Revisão (Checkpoint 2.3b, 2026-06-01):** a pré-condição foi **dividida** — (i) _well-formedness_ da SSOT virou **guard local** (invariantes no `state-yml:check`/`repo-validation`, já required) e (ii) _paridade-API_ ficou como hardening **não-bloqueante**. Com (i) satisfeita, o `governance-pr-check` foi **promovido a `required`** (apply consolidado: `repo-validation`+`smoke`+`governance-pr-check`; paridade vivo↔versionado verde). Detalhe em [`plan.md § "Decisões revisitadas"`](./plan.md) (2026-06-01). _(Nota de reconciliação aditiva — não altera o julgamento Resolved acima.)_

**O que NÃO está sendo decidido:** ler topologia a partir de títulos; montar DAG a partir de títulos; auto-sync `plan.md`↔`state.yml`; construir o `topology:check` completo agora (deferido); promover o check a `required` antes do guard inverso.

**Trade-off cravado:** a SSOT é mantida à mão → pode divergir do git (o próprio 2.3 divergiu; corrigido no 2.3a/B1). Mitigação atual: revisão humana + invariantes internos do schema; mitigação estrutural futura: `topology:check` (guard inverso).

**Status:** Resolved (2026-06-01) / @rosanarezende — absorvido no Checkpoint 2.3a (Architectural Review → Human).

---

### [DEC-0024-G09] Eliminação integral da árvore-fonte `/cli` — `/dist` como única superfície executável publicada

**Pergunta:** A árvore-fonte `/cli` deve permanecer como "wrapper/compatibilidade" (desenho do nó `bootstrap-compiler`, #38) ou ser **eliminada**, com toda a implementação em `/src` e `/dist` como única superfície executável distribuída?

**Modo de gate:** `aceitação` <!-- decisão de desenho da owner, 2026-06-15, após nova evidência operacional; supersede o desenho narrado em plan.md (nó bootstrap-compiler / #38). -->

**Decisão anterior (SUPERSEDED, não apagada):** o nó `bootstrap-compiler` (#38) cravou que "`/cli` passa a wrapper/compatibilidade" e que a "migração ampla do ecossistema (Grupo B)" ficaria FORA da 0024 (fronteira "modelo ≠ migração", `plan.md`). O cutover de roteamento (#35) migrou o `CommandRegistry` para `/src`, mas **não a execução**.

**Evidência que a falsificou (operacional, 2026-06-15):** `/cli` NÃO virou wrapper fino — ainda contém runtime, wizard (`cli/cli/args.mjs`), provisionamento (`cli/app`, `cli/features`, `cli/fs`, `cli/formatters`), filesystem e ~30 entrypoints de check. `BootstrapCommand` ainda depende de `LegacyExecuteFn`/`loadLegacyExecute` (`cli/app/engine.mjs`); o registry controla o NOME do comando, mas delega ao runtime legado; há lista duplicada de comandos (`SUPPORTED_MODES` × registry); `package.json` `bin`/`files`/`imports` ainda publicam e executam código-fonte de `/cli`. Uma fronteira chamada "compatibilidade" virou a IMPLEMENTAÇÃO REAL — uma 2ª arquitetura executável.

**Decisão (Resolved):**

- A árvore-fonte `/cli` será **eliminada por completo**.
- Toda implementação (runtime, wizard, provisionamento, features, filesystem, formatters, parsing, comandos, checks) viverá em `/src`.
- `/dist` é a **única superfície executável publicada** (`package.json#bin → dist/…`; tarball SEM `/cli`).
- `CommandRegistry` é a única fonte de comandos/help/interação; sem `LegacyExecuteFn`/`loadLegacyExecute` nem lista paralela de verbos.

**Veículo:** sub-checkpoint próprio **CO-3.5 — colapso integral do runtime CLI**, no MESMO nó (`co-enforcement`), MESMO PR (#42) e MESMO Human Gate (modo unit). A **topologia externa** (`state.yml § topology`) é **inalterada** — o nó segue `co-enforcement`; muda só a sequência INTERNA de sub-checkpoints do PR #42. NÃO há spec nova nem nó novo em `state.yml`.

**O que NÃO está sendo decidido:** inflar o significado do CO-3.4 (que segue ESTRITO: advisory do recibo nas 2 superfícies; ver `[DEC]`-livre/CO-3.4); deferir a remoção para outra spec/backlog; alterar a topologia externa; iniciar o CO-3.5 nesta sessão.

**Trade-off cravado:** assume-se uma migração ampla (porte fiel de ~83 `.mjs` para `/src` + guard arquitetural do cutover + revalidação de pacote instalado em consumidor novo/existente) DENTRO da 0024 — revisando a fronteira "modelo ≠ migração" para ESTE runtime especificamente. Racional da owner: a fronteira só se justifica se "compatibilidade" for de fato fina; quando ela é a implementação real, manter `/cli` é manter duas arquiteturas executáveis — o oposto do objetivo da 0024.

**Status:** Resolved (2026-06-15) / @rosanarezende — decisão de desenho da owner.

---

### [DEC-0024-G10] Inserir `co-flow-convergence` antes de `co-capture` — convergência do fluxo ponta a ponta

**Pergunta:** Depois do fechamento técnico do CO-3.5, a Spec 0024 deve avançar diretamente para `co-capture`/`co-events`, ou precisa de um nó próprio para revisar e corrigir a modelagem ponta a ponta do fluxo governado antes de automatizá-lo?

**Modo de gate:** `aceitação` <!-- decisão topológica da owner, 2026-06-16, antes do Human Gate do co-enforcement / PR #42. -->

**Contexto:** O CO-3.5 ficou tecnicamente pronto (`/cli` inexistente, bin em `dist`, tarball sem `/cli`, consumidores validados, CI remoto verde, `work` projetando `PREPARE_CLOSE`), mas o dogfood da própria 0024 revelou uma classe recorrente de conflito: **dois caminhos tentando explicar o mesmo estado**.

**Evidências observadas durante a Spec 0024:**

- `handoff` × `work`;
- `work` × `decide`;
- readiness inferida por findings antigos;
- registry novo delegando para `/cli`;
- recibo sendo reescrito pelo próprio fluxo que deveria validá-lo;
- checks e comandos usando critérios diferentes;
- rotas antigas e novas convivendo até CO-3.5.

**Decisão (Resolved):**

- Inserir um novo nó planejado na Spec 0024: `co-flow-convergence` — **convergência do fluxo ponta a ponta**.
- Posição: imediatamente após `co-enforcement` e antes de `co-capture`.
- Topologia: `co-enforcement` seq 9 → `co-flow-convergence` seq 10 → `co-capture` seq 11 → `co-events` seq 12 → `housekeeping` seq 13 → `dualroot-collapse` seq 14 → `knowledge-readiness` seq 15 → `integration-final` terminal.
- O nó é PR próprio da stack, antes de CO-5, e permanece dentro da Spec 0024.

**O que o nó deve fazer:**

```text
inventário real
→ modelo canônico
→ confronto modelo × código
→ correção integral dos gaps
→ dogfood ponta a ponta
→ falsificação
→ Human Gate
```

**Fluxo a modelar como máquina de estados única:**

```text
nova sessão
→ handoff
→ work
→ implementação
→ review
→ resolution
→ disposition
→ avanço de sub-checkpoint
→ Ready
→ Human Gate
→ transição de nó
→ integração
→ merge
```

Cada transição deve declarar: fato de entrada, autoridade, comando, efeito permitido, artefato alterado, validação, próximo estado e ações proibidas.

**Matriz mínima de fontes a produzir:** conceito · SSOT · projeções · consumidores · validações, cobrindo pelo menos nó ativo, sub-checkpoint, reviews, findings/resolutions/dispositions, receipt, readiness, PR Draft/Ready, Human Gate, comandos, scripts, CI e integração final. Qualquer conceito com duas SSOTs vira erro ou decisão explícita.

**Invariantes esperadas:** `work` e `decide` precisam concordar; bloqueio em `decide` não pode ser executável em `work`; um estado não pode ser simultaneamente `IMPLEMENT_CHECKPOINT` e `PREPARE_TRANSITION`; projeção não atualiza a fonte que valida; mutação declara autoridade e efeito; readiness terminal não aciona `advance-subcheckpoint`; zero findings não bloqueia sub-checkpoint concluído; findings antigos não liberam sub-checkpoint novo; registry/help/wizard/scripts não divergem; caminho legado não volta após CO-3.5.

**Jornadas obrigatórias de teste:** sessão nova → implementação; finding → fix → verification → disposition; sub-checkpoint sem findings → transição; sub-checkpoint com findings → bloqueio → correção; último sub-checkpoint → fechamento/prepare close; PR Draft → Ready → Human Gate; consumidor novo → init; consumidor existente → adopt/update; branch/CI/receipt stale; retomada após interrupção; modo offline/degradado.

**O que NÃO está sendo decidido:** implementar o nó agora; preparar Ready; executar Human Gate; abrir novo PR nesta sessão; abrir CO-5; transformar o nó em spec separada ou housekeeping; remover a readiness do CO-3.5; marcar CO-3.5 como `[x]`.

**Status:** Resolved (2026-06-16) / @rosanarezende — decisão topológica da owner, registrada antes do Human Gate do `co-enforcement`.

---

### [DEC-0024-G11] Suspender temporariamente smoke tests durante `co-flow-convergence`, sem liberar Ready/Human Gate

**Pergunta:** Durante a migração/convergência do fluxo governado no PR #43, os smoke tests remotos devem continuar rodando a cada push, ou podem ser suspensos temporariamente para reduzir atrito operacional enquanto a arquitetura do fluxo é confrontada e corrigida?

**Modo de gate:** `aceitação` <!-- decisão operacional da owner, 2026-06-16, durante CO-10.2. -->

**Contexto:** O nó `co-flow-convergence` precisa alterar e testar o próprio lifecycle do framework. Os smoke tests multi-OS/tarball são valiosos como gate final de distribuição, mas são caros e pouco informativos durante a fase intermediária CO-10.2/CO-10.3, antes da reativação final do fluxo. Ao mesmo tempo, remover silenciosamente o required context `smoke` ou permitir Ready/Human Gate sem smoke real recriaria drift entre validação, ruleset e decisão humana.

**Decisão (Resolved):**

- Suspender temporariamente a execução real dos smoke tests remotos durante CO-10.2/CO-10.3.
- Preservar o contexto required estável `smoke` como produtor explícito no workflow, evitando required context órfão e drift de ruleset.
- Manter `npm run validate`, testes TypeScript/unitários e guards governados como validação obrigatória local/CI.
- Bloquear `pr-ready:check`, Ready e Human Gate enquanto a suspensão estiver ativa.
- Reativar smoke real antes da readiness final do nó e antes de qualquer Human Gate do PR #43.

**O que NÃO está sendo decidido:** remover definitivamente smoke; enfraquecer o gate final do nó; alterar o ruleset para deixar de exigir `smoke`; autorizar Ready/Human Gate com smoke suspenso; pular validação local; aplicar a suspensão fora do escopo de CO-10.2/CO-10.3.

**Critério de reversão obrigatório:** antes do fechamento do nó `co-flow-convergence`, o workflow `smoke-multi-os.yml` deve voltar a executar `npm run test:smoke`, `npm run ci` deve voltar a incluir smoke, `pr-ready:check` deve deixar de detectar suspensão, e o PR deve validar smoke real antes de Ready/Human Gate.

**Status:** Resolved (2026-06-16) / @rosanarezende — decisão operacional temporária com enforcement de bloqueio em `pr-ready:check`.

---

### [DEC-0024-G12] CO-10.2 entrega convergência coesa inicial do fluxo, não apenas matriz

**Pergunta:** O CO-10.2 deve parar após mapear o confronto modelo × código, deixando a remoção de heurísticas locais para CO-10.3, ou deve substituir no mesmo ciclo as divergências já comprovadas na superfície humana/next-action?

**Modo de gate:** `aceitação` <!-- decisão operacional da owner, 2026-06-16, durante CO-10.2. -->

**Contexto:** O dogfood de CO-10.2 mostrou que uma migração excessivamente incremental recriaria o padrão que o nó `co-flow-convergence` existe para corrigir: cockpit, wizard, `work`, `decide`, `pr-ready` e readiness poderiam continuar calculando o mesmo estado por heurísticas locais diferentes enquanto aguardam um sub-checkpoint posterior.

**Decisão (Resolved):**

- CO-10.2 continua fazendo o confronto modelo × código, mas também deve entregar uma convergência coesa inicial quando a divergência já estiver comprovada.
- Cada regra movida para o modelo comum deve remover a regra local correspondente.
- `npm run flow` é a superfície humana local canônica; o binário público continua `ai-guidelines`.
- O wizard interativo deve projetar o mesmo modelo usado por cockpit/work/decide, sem lista paralela de comandos ou cálculo próprio de readiness/Human Gate.
- `@clack/prompts` substitui Inquirer como único adapter interativo; `@inquirer/*` e `InquirerPrompts` não permanecem como débito.
- CO-10.3 fica responsável pelos gaps remanescentes classificados em CO-10.2, especialmente transições de nó e invariantes que ainda exigem matriz/falsificação adicional.

**O que NÃO está sendo decidido:** iniciar CO-10.3; executar `advance-subcheckpoint`; marcar readiness; converter PR para Ready; executar Human Gate; fazer merge; remover a suspensão temporária dos smoke tests antes do ponto governado.

**Status:** Resolved (2026-06-16) / @rosanarezende — decisão operacional de escopo do CO-10.2, registrada após o dogfood de `flow`.

---

### [DEC-0024-G13] CO-10.5 dedicado a UX, linguagem humana e convergência do wizard

**Pergunta:** A melhoria de linguagem/UX do `npm run flow` deve ser tratada como ajuste residual dentro do dogfood/falsificação, ou como sub-checkpoint próprio antes da falsificação/Human Gate?

**Modo de gate:** `aceitação` <!-- decisão operacional da owner, 2026-06-17, durante CO-10.4. -->

**Contexto:** O dogfood de CO-10.4 mostrou que a convergência técnica de `flow`, `work`, `decide` e registry ainda não basta para a pessoa humana operar o fluxo sem inspecionar código ou memorizar termos internos. O menu atual ainda expunha vocabulário de implementação (`cockpit`, `briefing`, `review governado`, `comando mutante`, `wizard`, `Entrypoints com adapter runtime`) e ainda parecia carregar camadas legadas em vez de uma experiência única.

**Decisão (Resolved):**

- Inserir `CO-10.5 — UX, linguagem humana e convergência do wizard` antes da etapa de falsificação/Human Gate.
- Renumerar a etapa anterior `CO-10.5 — falsificação + Human Gate` para `CO-10.6`.
- Tratar as melhorias já iniciadas no wizard como seed de CO-10.5, não como fechamento do trabalho.
- `npm run flow` deve projetar o mesmo modelo governado, mas com linguagem humana, menu por intenção e explicações claras de agora/depois/bloqueios/alternativas.
- O wizard deve aproveitar melhor `@clack/prompts` (`intro/outro`, `note`/`box`, `select`, `groupMultiselect`, `tasks`/`taskLog`, `spinner`, `confirm`, cancelamento limpo), sem criar regra própria de readiness, PR Ready, CI, Human Gate ou próxima ação.
- `init`/`adopt`/`update` devem continuar disponíveis, mas contextualmente: o caminho normal mostra a operação adequada ao estado do repositório; as demais ficam em caminho avançado com aviso.

**Nota posterior:** `[DEC-0024-G14]` subdividiu o fechamento que G13 havia renumerado para CO-10.6: CO-10.6 passa a ser fluxo de time/múltiplas specs/spec nova; falsificação ampla passa a CO-10.7; revisão independente + Human Gate passa a CO-10.8.

**O que NÃO está sendo decidido:** executar Ready; exercer Human Gate; fazer merge; avançar sub-checkpoint; abrir novo PR; reintroduzir Inquirer; recriar comando `providers`; mover regra de lifecycle para o wizard.

**Status:** Resolved (2026-06-17) / @rosanarezende — decisão operacional de UX/convergência antes da falsificação final do nó.

---

### [DEC-0024-G14] CO-10.6 dedicado a fluxo de time, múltiplas specs e criação de spec nova

**Pergunta:** O nó `co-flow-convergence` pode ir direto para falsificação/Human Gate, ou precisa antes modelar o fluxo de desenvolvimento em time, com múltiplas specs abertas e criação/continuação de specs?

**Modo de gate:** `aceitação` <!-- decisão operacional da owner, 2026-06-18, antes do fechamento de co-flow-convergence. -->

**Contexto:** O uso do site/flow como documentação viva expôs que o produto ainda explica bem o fluxo de uma spec ativa, mas não cobre com clareza o caso de time: várias specs abertas, uma pessoa querendo continuar uma spec específica, outra querendo iniciar uma spec nova, branch/PR divergentes e autoridades diferentes para contributor/maintainer/owner. Esse é o mesmo tipo de problema que originou `co-flow-convergence`: o humano vira o reconciliador entre intenção, branch, PR, SSOT e comando.

**Decisão (Resolved):**

- Inserir `CO-10.6 — fluxo de time, múltiplas specs e criação de spec nova` antes da falsificação final.
- Dividir a antiga etapa `CO-10.6 — falsificação + Human Gate` em:
  - `CO-10.7 — falsificação ampla do fluxo`;
  - `CO-10.8 — revisão independente + Human Gate`.
- `CO-10.6` deve modelar e implementar orientação governada para:
  - listar specs/nós relevantes quando houver mais de um caminho possível;
  - continuar uma spec específica sem inferência silenciosa errada;
  - iniciar uma spec nova pelo fluxo governado;
  - explicar branch/PR/CI/tree/autoridade antes de qualquer ação;
  - diferenciar ações de contributor, maintainer e owner.
- `CO-10.7` deve falsificar o fluxo completo, incluindo cenários negativos e não óbvios.
- `CO-10.8` deve preparar uma rodada independente de Technical Audit, Architectural Review e Security Review com outra LLM, usando prompts que busquem falsificações não óbvias e reduzam viés antes do Human Gate.

**Nota posterior:** `[DEC-0024-G15]` inseriu `CO-10.7 — CLI pública autoexplicável e wizard orientado ao contexto`; `[DEC-0024-G16]` inseriu `CO-10.8 — arquitetura interna, organização DDD e BDD visual para mantenedores`. Por isso a falsificação ampla passou a `CO-10.9` e a revisão independente + Human Gate passou a `CO-10.10`.

**O que NÃO está sendo decidido:** abrir CO-5; executar Ready; exercer Human Gate; fazer merge; abrir novo PR; criar lock distribuído falso; automatizar criação de PR/spec sem confirmação humana; tornar toda review obrigatória universalmente.

**Status:** Resolved (2026-06-18) / @rosanarezende — decisão operacional de fluxo em time antes da falsificação e Gate do nó.

---

### [DEC-0024-G15] CLI pública autoexplicável como porta de entrada do produto

**Pergunta:** O site deve continuar explicando comandos e jornadas como camada editorial principal, ou o produto precisa primeiro garantir que a CLI pública (`npx ai-guidelines`) seja autoexplicável e consiga orientar a pessoa a partir do estado real do repositório?

**Modo de gate:** `aceitação` <!-- decisão operacional da owner, 2026-06-19, durante CO-10.6/planejamento de fechamento do co-flow-convergence. -->

**Contexto:** O redesign do site ajudou a visualizar o produto, mas também revelou uma inversão perigosa: o site começou a explicar um fluxo ideal enquanto a experiência pública ainda podia parecer uma lista de comandos que a pessoa precisa decorar (`init`, `adopt`, `update`, `work`, `specs`, `peer-review`). A owner decidiu que o produto principal deve ser a CLI/wizard: a pessoa deve poder rodar `npx ai-guidelines`, o framework detectar o contexto e oferecer o próximo caminho correto. O site deve funcionar como documentação viva e reprodução fiel dessa experiência, não como fonte paralela que tenta compensar lacunas da CLI.

**Decisão (Resolved):**

- Inserir `CO-10.7 — CLI pública autoexplicável e wizard orientado ao contexto` antes da falsificação ampla.
- Renumerar:
  - `CO-10.7 — falsificação ampla do fluxo` para `CO-10.8`;
  - `CO-10.8 — revisão independente + Human Gate` para `CO-10.9`.
- `npx ai-guidelines` deve ser tratado como a porta de entrada pública do produto; comandos diretos continuam disponíveis como atalhos para automação ou usuários experientes, mas não devem ser a experiência principal.
- A CLI deve detectar e explicar, com linguagem humana, pelo menos:
  - pasta vazia;
  - projeto novo com arquivos soltos;
  - repositório existente sem ai-guidelines;
  - repositório existente com conflitos;
  - repositório já governado;
  - perfil solo, contribuições externas ou time;
  - uma spec ativa;
  - múltiplas specs abertas;
  - ausência de spec ativa;
  - branch errada;
  - working tree suja;
  - PR Draft/Ready;
  - CI verde, pendente ou falha;
  - findings/reviews/resolutions/dispositions;
  - readiness ausente, readiness terminal e avanço permitido;
  - revisão de PR de outra pessoa;
  - modo offline/degradado.
- Os cenários mínimos de uso diário devem ser decompostos em subcenários falsificáveis:
  - nova sessão em repo governado com uma spec ativa;
  - nova sessão com múltiplas specs e necessidade de escolher foco;
  - retomar depois de interrupção;
  - validar mudanças locais com tree suja;
  - resolver finding de review;
  - fechar resolution/disposition;
  - decidir readiness de sub-checkpoint;
  - avançar sub-checkpoint quando permitido;
  - bloquear avanço quando readiness, findings, CI ou branch impedem;
  - preparar Ready sem executar Ready;
  - preparar Human Gate sem executar Gate;
  - revisar PR de colega sem perder a branch atual;
  - atualizar providers/práticas em repo já governado;
  - distinguir atualização comum de mudança de política de colaboração que exige autoridade.
- O site deve reproduzir a experiência real da CLI por transcripts/cenários derivados sempre que possível; textos editoriais do site podem explicar intenção e valor, mas não podem inventar comportamento.

**O que NÃO está sendo decidido:** executar Ready; exercer Human Gate; fazer merge; avançar sub-checkpoint; abrir novo PR; alterar topologia externa da Spec 0024; mover narrativa editorial do site para `src/cli/copy`; transformar comandos diretos em única forma de uso; criar alias legado `providers`; introduzir nova fonte paralela de estado.

**Status:** Resolved (2026-06-19) / @rosanarezende — decisão operacional de produto/UX pública antes da falsificação final do nó.

---

### [DEC-0024-G16] Arquitetura interna, organização DDD e BDD visual para mantenedores antes da falsificação final

**Pergunta:** O nó `co-flow-convergence` pode ir direto para falsificação ampla e Human Gate depois da CLI pública autoexplicável, ou precisa antes reorganizar a arquitetura interna para que o próprio framework seja compreensível, navegável e sustentável por humanos?

**Modo de gate:** `aceitação` <!-- decisão operacional/arquitetural da owner, 2026-06-19, durante CO-10.7. -->

**Contexto:** A reorganização do site React mostrou, por dogfood, que organização de arquivos também é parte da experiência humana: quando componentes, conteúdo e projeções ficam misturados, a owner perde capacidade de revisar fluxo, encontrar gaps e acompanhar evolução. O mesmo padrão apareceu no runtime. Apesar da intenção DDD de `src/cli`, `src/app`, `src/domain` e `src/infrastructure`, a migração gradual deixou módulos e testes extensos demais, com responsabilidades difíceis de localizar. Evidência inicial: `src/cli/flowWizard.ts`, `src/cli/workflow.ts`, `src/cli/workBrief.ts`, `src/cli/handoff.ts`, `src/cli/reviewBrief.ts` e testes espelhados concentram grande parte do comportamento humano/fluxo.

**Decisão (Resolved):**

- Inserir `CO-10.8 — arquitetura interna, organização DDD e BDD visual para mantenedores` antes da falsificação ampla.
- Renumerar:
  - `CO-10.8 — falsificação ampla do fluxo` para `CO-10.9`;
  - `CO-10.9 — revisão independente + Human Gate` para `CO-10.10`.
- O sub-checkpoint deve produzir inventário robusto da organização atual e uma árvore-alvo proposta para `src`, separando domínio, aplicação, infraestrutura, delivery, experiência CLI/wizard, decisões, reviews, PR/GitHub, site projection e testes.
- O refactor esperado é estrutural e behavior-preserving: mover/splitar/renomear para reduzir acoplamento humano e técnico, removendo arquivos gigantes e agrupando testes por responsabilidade, sem alterar conteúdo de produto nem regras de negócio.
- O sub-checkpoint deve preparar BDD visual para mantenedores: cenários e testes devem poder ser navegados por humanos, idealmente projetáveis para uma página interna de acompanhamento, do mesmo modo que o site público ajuda a validar a experiência de usuários.
- Gaps ou features descobertos durante a pesquisa devem ir para artefato exclusivo de candidatos; só viram escopo executável por decisão posterior.

**O que NÃO está sendo decidido:** executar Ready; exercer Human Gate; fazer merge; avançar sub-checkpoint; alterar topologia externa; reescrever comportamento da CLI; redesenhar copy de produto; transformar o site de mantenedores em requisito imediato; criar novo nó sem nova decisão; implementar CO-5/CO-6.

**Status:** Resolved (2026-06-19) / @rosanarezende — decisão de manutenibilidade interna e BDD humano antes da falsificação final do nó.

---

### [DEC-0024-G17] Reabrir CO-10.7 antes de retomar CO-10.8

**Pergunta:** CO-10.7 pode permanecer fechado depois do seed inicial de CLI pública autoexplicável, ou precisa ser reaberto porque a experiência pública real ainda não foi falsificada de ponta a ponta?

**Modo de gate:** `aceitação` <!-- decisão operacional da owner, 2026-06-19, após detectar fechamento prematuro de CO-10.7. -->

**Contexto:** A owner identificou que o fechamento de CO-10.7 ocorreu antes do critério pretendido. A intenção do sub-checkpoint não era apenas ajustar copy, wizard e site, mas provar que uma pessoa usuária roda `npx ai-guidelines` e é orientada pela CLI sem decorar comandos. A prova esperada inclui consumidores simulados/instalados (`consumer-empty`, `consumer-existing-package`, `consumer-existing-formatter-conflict`, `consumer-governed-solo`, `consumer-governed-team`, `consumer-governed-multiple-specs`, `consumer-peer-review`), captura da saída real, verificação das opções oferecidas, dry-run, aplicação quando permitido, arquivos finais, bloqueios e mensagens. O artefato `research/2026-06-19-checkpoint-co-flow-convergence-co-10.7-status.md` já registrava que isso estava apenas parcialmente coberto.

**Decisão (Resolved):**

- Reabrir `CO-10.7 — CLI pública autoexplicável e wizard orientado ao contexto`.
- Voltar `CO-10.7` de `[x]` para `[/]` em `tasks.md`.
- Voltar `CO-10.8` de `[/]` para `[ ]` em `tasks.md`, sem apagar o trabalho já produzido.
- Classificar o commit `2d478b2` como seed antecipado de CO-10.8: inventário, split inicial do wizard e catálogo BDD mínimo ficam preservados, mas pausados.
- Não continuar a reorganização interna enquanto a experiência pública de CO-10.7 não estiver falsificada e refletida no site/documentação.
- O próximo trabalho autorizado volta a ser o harness de consumidor/CLI pública, com site como reprodução da experiência real da CLI, não como compensação de lacuna do produto.

**O que NÃO está sendo decidido:** reverter commits; apagar o seed de CO-10.8; executar Ready; exercer Human Gate; fazer merge; avançar sub-checkpoint; abrir novo PR; alterar topologia externa; implementar CO-10.8; iniciar CO-10.9.

**Status:** Resolved (2026-06-19) / @rosanarezende — correção de lifecycle para alinhar tasks/work/handoff à intenção real de CO-10.7.

---

## 2 · Aberto — pesquisa genuína (única coisa ainda em investigação)

> Estes **não são decisões** — são findings com **alternativas reais ainda competindo**. Vivem em [`research/findings.md`](./research/findings.md); aqui só o ponteiro. Só retornam como `[DEC] Pendente` ao **convergir + exigir julgamento**. **Critério (2026-05-31):** se não há alternativa viva competindo, **não pertence aqui** — é decisão (§ 1) ou trabalho (§ 4).

| Tema                                            | Finding            | Por que ainda é pesquisa                                                                          |
| :---------------------------------------------- | :----------------- | :------------------------------------------------------------------------------------------------ |
| Estrutura/gramática (ex-`G01`)                  | `F-AG01` / `F-003` | pilares MECE vs reframe _estados > entidade_; `terminus` não falsificado — alternativas vivas     |
| Pipeline de promoção (ex-`G03`)                 | `F-AG03`           | reconciliar promoção de work-item (ADR 0010) × promoção contextual — desenho em aberto            |
| Contrato de boilerplate / casa única (ex-`G04`) | `F-AG04`           | modelo de fonte única (tri-root → SSOT) em aberto; o **drift-guard** já vira enforcement (§ 4)    |
| Projeções por consumidor (ex-`G05`, resíduo)    | `F-AG05`           | modelo de N projeções da SSOT; a projeção _gate-ready_ já **saiu daqui** (virou GG-0001, § 3/§ 4) |
| Explicação do comportamento não-linear          | `F-014`            | 3 explicações concorrentes, nenhuma decidida — **opcional, baixa prioridade**                     |

---

## 3 · Virou regra — decisão promovida a princípio/regra declarada (camada _awareness_)

> Aprendizados da 0024 que já são (ou serão, no fechamento) um **princípio declarado** — ADR ou entrada em `rules.json`. Camada L1 do ADR 0021: **necessária, insuficiente sozinha** — a versão que falha mecanicamente está em § 4.

| Aprendizado (origem)                                                | Forma de regra                                            | Estado                                              |
| :------------------------------------------------------------------ | :-------------------------------------------------------- | :-------------------------------------------------- |
| enforcement > awareness                                             | **ADR 0021**                                              | já é ADR (origem 0023; reafirmado aqui)             |
| handoff carrega contexto operacional (`F-007`)                      | **ADR 0022**                                              | já é ADR                                            |
| state derivado > declarado                                          | **ADR 0021 §5**                                           | já é ADR                                            |
| governance-first como eixo de 1ª classe (`F-013`)                   | ADR 0018 / finding convergido                             | princípio estabelecido                              |
| `research/finding/decision/execution` são **estados** (`F-006`)     | princípio (alimenta G01)                                  | convergido; reflete-se nesta própria reestruturação |
| DEC nasce `Pendente` (não `Open`); pergunta aberta vive em findings | regra de processo → `governance-foundation` + boilerplate | **em absorção** (§ 4)                               |
| **GG-0001** — teste de decidibilidade de gate                       | regra `rules.json` (fonte `DOGFOOD-*`)                    | **em absorção** (§ 4)                               |

---

## 4 · Virou enforcement — decisão ligada a check que pode falhar / código que a reflete (camada _estrutural_)

> Camada L2/L4 do ADR 0021: onde o aprendizado deixa de depender de memória e passa a **falhar mecanicamente** se violado, ou onde o **código passa a refletir** a decisão. É aqui que _"reduzir divergência entre aprendizado e código"_ acontece. **Status:** 🟢 feito · 🔜 em absorção nesta spec.

| Decisão                                                          | Enforcement / migração                                                                                                                                                                                                         | Status                       |
| :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------- |
| `G02` — taxonomia removida                                       | `WorkflowType` → modelo único; 3 `tasks-*` boilerplates → genérico; wizard; doc                                                                                                                                                | 🔜 migrar `WorkflowType`     |
| DEC sem status `Open`                                            | check rejeita `Open` em `decision-brief`; legenda corrigida (roots)                                                                                                                                                            | 🔜 consistência boilerplates |
| boilerplates tri-root divergem (`F-AG04`)                        | drift-guard: check falha se roots divergem — passo 1 da fonte única                                                                                                                                                            | 🔜 boilerplates fonte única  |
| `.specify` é legado (ADR 0019)                                   | hard-stop em escrita nova (drift-guard) → cutover p/ `.governance`                                                                                                                                                             | 🔜 cutover `.specify`        |
| `GG-0001` (subconjunto mecânico)                                 | check estrutural de decidibilidade projetado no seam do gate                                                                                                                                                                   | 🔜 implementar GG-0001       |
| `G07` — topologia-as-data + projeção                             | `state.yml` schema (invariantes de `sequence`) + `governance-pr-check` valida título/template contra a SSOT — **`required`** desde 2026-06-01 (2.3b: well-formedness por guard local; paridade-API = hardening não-bloqueante) | 🟢 feito (2.3a/2.3b)         |
| ruleset-as-code (achado: `guardrails` órfão)                     | `ruleset:check` — **producibilidade** (todo required-context tem produtor estável; no `validate`) + **paridade** vivo↔versionado (`ruleset-drift`)                                                                             | 🟢 feito (2.2/2.2b)          |
| revisão-como-artefato (**dogfood**, sem DEC — análogo a GG-0001) | `review:check` (no `validate`): reviews/gates versionados; gate `approved` exige zero finding bloqueante `open`; selos de integridade (per-finding + envelope)                                                                 | 🟢 feito (2.4→2.4c)          |

---

## Rastreabilidade histórica — numeração `G00–G06` → estado

> Os IDs `[DEC-0024-G##]` permanecem **âncoras estáveis** (citados em findings, ADRs, git, handoffs) — mas **não organizam mais a leitura**. Mapa de equivalência:

| ID histórico | Tema                                                  | Estado atual                                                                                                           |
| :----------- | :---------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| `G00`        | identidade (transformação)                            | **Decidido** — § 1 (Resolved 2026-05-31)                                                                               |
| `G01`        | estrutura/gramática                                   | **Aberto** — § 2 (`F-AG01`)                                                                                            |
| `G02`        | taxonomia → bloco + propriedade                       | **Decidido** — § 1 (Resolved 2026-05-31) → migração em § 4                                                             |
| `G03`        | promotion pipeline                                    | **Reaberto (modelagem)** — `[DEC-0024-G08]` 2026-06-03; pipeline `insight→decision→rule\|guardrail→doctrine`           |
| `G04`        | contrato de boilerplate / casa única                  | **Reaberto (modelagem)** — `[DEC-0024-G08]`; casa única / tri-root → SSOT na trilha de convergência                    |
| `G05`        | projeções / decision-session                          | **Reaberto (modelagem)** — `[DEC-0024-G08]`; projeções derivadas (fonte↔projeção) + KnowledgeGraph                     |
| `G06`        | contrato da cadeia                                    | **Decidido** — § 1 (Resolved 2026-05-30) → ADR no fechamento                                                           |
| `G07`        | topologia-as-data + enforcement L4                    | **Decidido** — § 1 (Resolved 2026-06-01) → enforcement em § 4                                                          |
| `G08`        | reabertura de G03/G04/G05 + direção orientada a grafo | **Decidido** — Resolved 2026-06-03 (owner); a modelagem fica DENTRO da 0024; NÃO há 0025 independente                  |
| `G09`        | eliminação integral de `/cli` (→ CO-3.5)              | **Decidido** — § 1 (Resolved 2026-06-15, owner); supersede o "wrapper" do #38; topologia externa inalterada            |
| `G10`        | `co-flow-convergence` antes de `co-capture`           | **Decidido** — § 1 (Resolved 2026-06-16, owner); nó próprio para convergência ponta a ponta do fluxo                   |
| `G11`        | suspensão temporária de smoke durante co-flow         | **Decidido** — § 1 (Resolved 2026-06-16, owner); bloqueia Ready/Human Gate até reativação                              |
| `G12`        | CO-10.2 entrega convergência coesa inicial            | **Decidido** — § 1 (Resolved 2026-06-16, owner); remove heurísticas locais já comprovadamente divergentes              |
| `G13`        | CO-10.5 dedicado a UX/linguagem/wizard Clack          | **Decidido** — § 1 (Resolved 2026-06-17, owner); G14 subdivide o fechamento antes do Gate                              |
| `G14`        | CO-10.6 dedicado a fluxo de time/múltiplas specs      | **Decidido** — § 1 (Resolved 2026-06-18, owner); G15/G16 subdividem o fechamento antes do Gate                         |
| `G15`        | CLI pública autoexplicável como porta de entrada      | **Decidido** — § 1 (Resolved 2026-06-19, owner); G16 insere arquitetura interna/BDD humano antes da falsificação final |
| `G16`        | arquitetura interna, organização DDD e BDD visual     | **Decidido** — § 1 (Resolved 2026-06-19, owner); pausado por G17 até CO-10.7 fechar corretamente                       |
| `G17`        | reabrir CO-10.7 antes de retomar CO-10.8              | **Decidido** — § 1 (Resolved 2026-06-19, owner); corrige fechamento prematuro de CO-10.7                               |

---

## Gate — assinaturas

> Decisões desta spec, todas `Resolved`. Pesquisa estrutural aberta (§ 2) **não** é ponto de gate — segue em `findings.md` sem bloquear.

- [x] `[DEC-0024-G00]` — Resolved 2026-05-31 / @rosanarezende
- [x] `[DEC-0024-G02]` — Resolved 2026-05-31 / @rosanarezende
- [x] `[DEC-0024-G06]` — Resolved 2026-05-30 / @rosanarezende
- [x] `[DEC-0024-G07]` — Resolved 2026-06-01 / @rosanarezende
- [x] `[DEC-0024-G08]` — Resolved 2026-06-03 / @rosanarezende
- [x] `[DEC-0024-G09]` — Resolved 2026-06-15 / @rosanarezende
- [x] `[DEC-0024-G10]` — Resolved 2026-06-16 / @rosanarezende
- [x] `[DEC-0024-G11]` — Resolved 2026-06-16 / @rosanarezende
- [x] `[DEC-0024-G12]` — Resolved 2026-06-16 / @rosanarezende
- [x] `[DEC-0024-G13]` — Resolved 2026-06-17 / @rosanarezende
- [x] `[DEC-0024-G14]` — Resolved 2026-06-18 / @rosanarezende
- [x] `[DEC-0024-G15]` — Resolved 2026-06-19 / @rosanarezende
- [x] `[DEC-0024-G16]` — Resolved 2026-06-19 / @rosanarezende
- [x] `[DEC-0024-G17]` — Resolved 2026-06-19 / @rosanarezende

---

### `[DEC-0024-G08]` Reabertura de G03/G04/G05 + direção arquitetural orientada a grafo

**Status:** Resolved (2026-06-03, owner).

**O que está sendo aceito:** os eixos `G03` (promotion pipeline), `G04` (casa única / tri-root→SSOT) e `G05` (projeções), deixados **abertos** no Stage 1, são **reabertos para modelagem deliberada DENTRO da 0024**, porque se mostraram necessários para problemas reais observados no uso (mis-binding da retomada; recuperabilidade; "a resposta estava num ADR esquecido"). A **direção assumida** é arquitetura **orientada a grafo**: entidades (`Insight→Decision→Rule/Guardrail→Doctrine`) + relações navegáveis (`KnowledgeRef`) + projeções derivadas (`KnowledgeGraph`, fonte↔projeção). O objetivo passa a ser **convergir o repositório** para esse modelo.

**O que NÃO está sendo aceito:** (i) reabrir `G00/G02/G06/G07` (seguem cravados); (ii) que tenha surgido uma **spec 0025 independente** — a evidência (brief: G03/G04/G05 são eixos da própria 0024; `plan.md` §41: split 0025 superado; inventário 2026-05-29: candidatas Grupo B já catalogadas) mostra que **não** nasceu domínio independente: é a modelagem deferida da 0024 ressurgindo + candidatas de migração já identificadas.

**Concorrentes refutados:** "isto é a 0025" (refutado: split absorvido na 0024); "isto é drift de absorção a estancar" (refutado pelo owner: a reabertura é decisão, os eixos eram necessários). **O que reabriria:** evidência de que a direção a grafo não resolve a recuperabilidade observada.

**Consequência:** a disciplina "NÃO re-modelar" passa a valer **só para os eixos resolvidos**; em G03/G04/G05 a modelagem é a direção. Trilha de execução = programa de convergência (ver `plan.md § Trilha de convergência` + `state.yml § topology`).
