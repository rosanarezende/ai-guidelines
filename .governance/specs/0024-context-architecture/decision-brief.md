<!-- ai-guidelines-template: decision-brief-boilerplate v=2 -->

# Decision Brief — Spec 0024 Context Architecture

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Tasks: [`./tasks.md`](./tasks.md)
> Status agregado: **Resolved (decisões)** — todas as `[DEC]` desta spec estão `Resolved`; a pesquisa estrutural ainda aberta vive em [`research/findings.md`](./research/findings.md), não aqui.
> Última atualização: 2026-07-11 — **`[DEC-0024-G27]` registrada**: o protocolo interino de PR grande vira fluxo governado `continuation:check -> continuation:prepare -> continuation:create-pr`, preparando pacotes versionados em `pull-requests/pr-N/continuations/` e exigindo confirmação humana explícita antes de criar Draft PR. Antes — **`[DEC-0024-G26]` registrada**: artefatos versionados de Pull Request passam a morar em `pull-requests/pr-N/`, começando por `body.md`, e futuras continuações/assets ficam sob o mesmo contêiner de PR. Não declara Ready/Human Gate.

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

**Nota posterior:** `[DEC-0024-G18]` preserva a decisão de `co-flow-convergence` vir antes de `co-capture`, mas reordena a cauda planejada para executar `dualroot-collapse` imediatamente depois de `co-flow-convergence` e antes de `co-capture`/`co-events`.

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

### [DEC-0024-G18] Antecipar `dualroot-collapse` antes de `co-capture` e `co-events`

**Pergunta:** Depois de `co-flow-convergence`, a Spec 0024 deve seguir para `co-capture`/`co-events` como planejado, mesmo com `.ai-guidelines/` e `.specify/` ainda vivos como ponte, ou deve antecipar `dualroot-collapse` para consolidar a estrutura canônica antes de automatizar captura e eventos?

**Modo de gate:** `aceitação` <!-- decisão operacional/arquitetural da owner, 2026-06-20, durante CO-10.7. -->

**Contexto:** O dogfood de CO-10.7 expôs que a experiência pública (`npx ai-guidelines`, site e simulador) ainda precisa explicar um estado transitório: consumidores recebem `.governance/` como raiz de governança, mas `config.json` e templates continuam sob `.ai-guidelines/`, e specs/roadmap ainda carregam ponte com `.specify/`. O próprio runtime bootstrap declara que isso é bridge até `dualroot-collapse`. Se `co-capture` e `co-events` forem implementados antes do colapso, há risco de automatizar e testar a estrutura temporária, aumentando o custo da migração e tornando a explicação do produto mais confusa. Ao mesmo tempo, absorver o colapso completo dentro do PR #43 ampliaria demais o escopo de `co-flow-convergence` e bloquearia CO-10.8/CO-10.9/CO-10.10.

**Decisão (Resolved):**

- Antecipar `dualroot-collapse` para imediatamente depois de `co-flow-convergence`.
- Atualizar a topologia planejada para:
  - `co-flow-convergence` seq 10;
  - `dualroot-collapse` seq 11;
  - `co-capture` seq 12;
  - `co-events` seq 13;
  - `housekeeping` seq 14;
  - `knowledge-readiness` seq 15;
  - `integration-final` terminal.
- Manter `dualroot-collapse` como PR/checkpoint dedicado, não como sub-checkpoint novo dentro do PR #43.
- Permitir que CO-10.7 registre honestamente o estado bridge quando necessário, mas sem migrar arquivos, paths canônicos ou contratos de consumidor neste PR.
- Continuar o PR #43 com CO-10.8, CO-10.9 e CO-10.10 conforme já planejado. **Supersedida por `[DEC-0024-G19]`: CO-10.8..CO-10.10 saem para próximo PR.**
- Exigir que `co-capture` e `co-events` sejam desenhados contra a estrutura pós-colapso, não contra `.ai-guidelines/`/`.specify/` como raízes vivas.

**Impacto esperado:**

- `init`/`adopt`/`update`, templates, config, runtime bootstrap, fixtures de consumidor, smoke tests, site e documentação pública passam a ter uma casa canônica antes da automação de captura/eventos.
- Repositórios já adotados com `.ai-guidelines/` precisam de migração explícita e falsificável, sem apagar estado do usuário e sem tratar `active.yml` como SSOT.
- Testes que hoje validam `.ai-guidelines/config.json` e `.ai-guidelines/templates/` deverão migrar no PR de `dualroot-collapse`, junto com fixtures e docs.
- `co-capture` e `co-events` ganham menos compatibilidade transitória para carregar.

**O que NÃO está sendo decidido:** implementar `dualroot-collapse` no PR #43; deletar `.ai-guidelines/` ou `.specify/` agora; executar Ready; exercer Human Gate; fazer merge; avançar sub-checkpoint; abrir novo PR automaticamente; iniciar CO-5/CO-6; transformar `active.yml` em fonte primária; criar migração parcial sem PR dedicado.

**Status:** Resolved (2026-06-20) / @rosanarezende — decisão topológica para antecipar o colapso dual-root e manter o PR #43 focado no fechamento de `co-flow-convergence`.

---

### [DEC-0024-G19] Fechar PR #43 no recorte CO-10.1..CO-10.7 e mover CO-10.8..CO-10.10 para próximo PR

**Pergunta:** Depois de CO-10.7, o PR #43 deve continuar absorvendo CO-10.8/CO-10.9/CO-10.10, ou deve parar no recorte já entregue, pedir revisão externa e mover a continuação para um novo PR?

**Modo de gate:** `aceitação` <!-- decisão operacional/arquitetural da owner, 2026-06-20, após concluir CO-10.7 e reavaliar o tamanho/risco do PR #43. -->

**Contexto:** CO-10.7 reabriu a experiência pública de `npx ai-guidelines`, adicionou harnesses de consumidores, simulador/site e ajustes no wizard real. O PR #43 ficou grande e passou a carregar mudanças de runtime, site, testes e artefatos governados. A próxima etapa planejada, CO-10.8, é uma reorganização estrutural de arquitetura interna/DDD/BDD para mantenedores; CO-10.9 e CO-10.10 dependem dessa reorganização e da falsificação ampla subsequente. Continuar no mesmo PR aumentaria o risco de revisar arquitetura interna por cima de um PR já extenso, misturando valor entregue ao usuário com refactor estrutural. Ao mesmo tempo, fechar o PR #43 sem uma revisão externa criaria risco de Human Gate com viés, porque a entrega passou por muitas iterações de UX, CLI pública, site e harness.

**Decisão (Resolved):**

- Encerrar o escopo de entrega do PR #43 no recorte `CO-10.1..CO-10.7`.
- Tratar `CO-10.8 — arquitetura interna, organização DDD e BDD visual para mantenedores`, `CO-10.9 — falsificação ampla do fluxo` e `CO-10.10 — revisão independente + Human Gate` como continuação a ser executada em próximo PR, não como pendência executável dentro do PR #43.
- Preservar o seed antecipado de CO-10.8 (`2d478b2`) como material de entrada para o próximo PR, sem tentar expandi-lo neste PR.
- Antes de qualquer Ready/Human Gate do PR #43, pedir uma revisão externa independente para avaliar o recorte realmente entregue, os riscos residuais e se a decisão de split deixa o PR coerente.
- Não executar Human Gate, Ready, merge, `advance-subcheckpoint`, `finish-subcheckpoint`, `mark-readiness` ou abertura automática de novo PR por esta decisão.

**Impacto esperado:**

- O PR #43 fica revisável como entrega coesa de convergência do fluxo até a CLI pública autoexplicável.
- A reorganização interna/DDD/BDD deixa de competir com o fechamento do PR atual e ganha um PR próprio para inventário robusto, árvore-alvo e migração behavior-preserving.
- A revisão externa passa a ser o próximo passo antes da decisão humana do PR #43, reduzindo o risco de overclaim e de aceitação enviesada por dogfood interno.
- O próximo PR poderá começar de uma base mais limpa, usando os achados de CO-10.7 e o seed de CO-10.8 como entrada, sem carregar todo o histórico de reescritas do site/CLI pública.

**O que NÃO está sendo decidido:** implementar CO-10.8 agora; apagar o seed já produzido; executar revisão como decisão mutante; converter o PR para Ready; exercer Human Gate; fazer merge; iniciar `dualroot-collapse`; abrir PR novo automaticamente. **Nota posterior:** `[DEC-0024-G20]` revisa a parte "não alterar `state.yml`" somente para reconciliar `next` e topologia antes do Gate; não autoriza implementar a continuação nem mudar o recorte do PR #43.

**Status:** Resolved (2026-06-20) / @rosanarezende — decisão de recorte para revisão externa do PR #43 antes do Human Gate e continuação de CO-10.8..CO-10.10 em próximo PR.

**Nota posterior em G18:** a frase "Continuar o PR #43 com CO-10.8, CO-10.9 e CO-10.10" foi supersedida por G19. G18 continua válida para a ordem relativa pós-continuação (`dualroot-collapse` antes de `co-capture`/`co-events`), mas `[DEC-0024-G20]` materializa a continuação CO-10.8..CO-10.10 como nó próprio antes de `dualroot-collapse`.

---

### [DEC-0024-G20] Ancorar a continuação CO-10.8..CO-10.10 antes de `dualroot-collapse`

**Pergunta:** Depois da revisão externa pré-Human Gate do PR #43, a continuação CO-10.8..CO-10.10 pode permanecer apenas em prosa, ou precisa virar nó planejado na topologia antes de `dualroot-collapse`, `co-capture` e `co-events`?

**Modo de gate:** `aceitação` <!-- decisão operacional/arquitetural da owner, 2026-06-21, após revisão externa independente do PR #43. -->

**Contexto:** A revisão externa independente do PR #43 confirmou que o recorte CO-10.1..CO-10.7 é coerente e entrega valor próprio, mas apontou três fechamentos obrigatórios antes de Ready/Human Gate: o body do PR ainda descrevia majoritariamente CO-10.1; `state.yml § next` ainda narrava "retomar CO-10.8" por G17; e a continuação CO-10.8..CO-10.10 estava registrada em `tasks.md`/`plan.md`, mas não materializada na `state.yml § topology`. Isso criava risco de mis-binding: o Human Gate poderia aprovar o recorte sem deixar explícito qual movimento topológico vem antes de `dualroot-collapse`/`co-capture`/`co-events`.

**Decisão (Resolved):**

- Manter o PR #43 limitado ao recorte entregue `CO-10.1..CO-10.7`.
- Registrar a revisão externa pré-Human Gate como concluída e usar seus achados para correção documental/topológica antes de Ready.
- Materializar a continuação CO-10.8..CO-10.10 como nó planejado `co-flow-continuation` imediatamente após `co-flow-convergence`.
- Atualizar a topologia planejada para:
  - `co-flow-convergence` seq 10;
  - `co-flow-continuation` seq 11 — CO-10.8 arquitetura interna/DDD/BDD visual; CO-10.9 falsificação ampla; CO-10.10 revisão independente + Human Gate da continuação;
  - `dualroot-collapse` seq 12;
  - `co-capture` seq 13;
  - `co-events` seq 14;
  - `housekeeping` seq 15;
  - `knowledge-readiness` seq 16;
  - `integration-final` terminal.
- Reconciliar `state.yml § next`, `plan.md`, `tasks.md` e o body do PR #43 para refletirem o mesmo recorte e o mesmo próximo movimento.
- Declarar no PR/body/Gate que os reviews formais de TA/AR/Security do nó cobriram o inventário CO-10.1; a superfície entregue até CO-10.7 foi validada por dogfood, harness de consumidores e revisão externa independente, com nova rodada formal prevista na continuação.
- Declarar que o smoke real/multi-OS segue diferido por política de PR intermediário e retorna no fechamento apropriado; o PR #43 mantém evidência local via harness de consumidores.

**O que NÃO está sendo decidido:** implementar CO-10.8/CO-10.9/CO-10.10 neste PR; iniciar `dualroot-collapse`; iniciar CO-5/CO-6; abrir PR novo automaticamente; converter o PR #43 para Ready; exercer Human Gate; fazer merge; executar `advance-subcheckpoint`, `finish-subcheckpoint`, `mark-readiness` ou qualquer decisão mutante.

**Impacto esperado:**

- O Human Gate do PR #43 passa a ter próximo movimento topológico explícito.
- `dualroot-collapse`, `co-capture` e `co-events` continuam bloqueados por ordenação até a continuação do fluxo ser executada e falsificada.
- A revisão externa deixa de ser só narrativa de chat e passa a ser artefato governado com achados rastreáveis.
- A decisão G19 continua válida no recorte do PR #43; G20 apenas corrige a representação topológica necessária para que o recorte seja honesto.

**Status:** Resolved (2026-06-21) / @rosanarezende — decisão de reconciliação pré-Ready após revisão externa independente do PR #43.

---

### [DEC-0024-G21] Checkpoints semânticos, taxonomia de artefatos e veto a débito arquitetural silencioso

**Pergunta:** Depois do dogfood do PR #44, a continuação deve seguir usando a nomenclatura `CO-10.8.*` e adiar a taxonomia/review-policy para "depois", ou deve registrar agora o modelo semântico e exigir que a próxima implementação entregue o contrato arquitetural completo, sem débito silencioso?

**Modo de gate:** `aceitação` <!-- decisão arquitetural da owner, 2026-06-22, após mapa V2, inventário de lifecycle, inventário de árvore, revisões de falsificação e dogfood de drift/research. -->

**Contexto:** O PR #44 começou como continuação de CO-10.8..CO-10.10, mas o dogfood mostrou que a própria estrutura decimal virou ruído: ela escondia entregas diferentes sob `CO-10.8.*` e dificultava acompanhar o que estava decidido, implementado, revisado ou apenas projetado. Em paralelo, a pasta `research/` deixou de conter apenas pesquisa para `decision-brief` e passou a misturar pesquisa, status, dogfood, revisão pré-codificação, inventário, prompt e projeção visual. As revisões de falsificação registradas em `research/2026-06-22-checkpoint-co-flow-continuation-spec-map-falsification-review.md`, `research/2026-06-22-checkpoint-co-flow-continuation-artifact-taxonomy-falsification-review.md`, `research/2026-06-22-checkpoint-co-flow-continuation-decomposition-falsification-review.md` e `research/2026-06-22-checkpoint-co-flow-continuation-repo-tree-inventory.md` confirmaram três fatos: (1) o modelo semântico é coerente, mas ainda não estava em fonte governada; (2) mover arquivos agora quebraria referências, inclusive ADRs, porque `.specify` ainda é dual-root; (3) uma decisão arquitetural sem implementação contratual viraria o mesmo débito silencioso que a Spec 0024 foi criada para eliminar.

**Decisão (Resolved):**

- Abandonar `CO-10.8.*` como nomenclatura operacional da continuação a partir deste ponto. Os IDs históricos G16/G20 continuam válidos como âncoras, mas a execução passa a usar nomes semânticos de checkpoint.
- Reinterpretar o PR #44 como o PR de **decisão, inventário e dogfood de reparo de drift** do nó `co-flow-continuation`: ele fecha a camada de Governance Doctor já implementada, registra os inventários/revisões de falsificação e decide a fronteira da taxonomia de artefatos. Ele não deve absorver o refactor DDD/BDD amplo.
- Criar o guardrail interno **GG-0005 — Sem débito arquitetural silencioso**: quando o dogfood expõe uma decisão arquitetural estruturante, ela só pode ser encerrada se (a) for implementada como contrato coerente no mesmo PR; (b) for agendada em PR/checkpoint governado imediatamente seguinte com aceitação, enforcement e fronteira explícitos; ou (c) for rejeitada por DEC. Não é aceitável deixá-la apenas em `research/`, backlog genérico ou memória de agente.
- Definir que o próximo PR de continuação deve implementar a taxonomia de artefatos de forma robusta, não como prova mínima:
  - `kind`/metadado equivalente como fonte única da natureza do artefato;
  - classificação dos artefatos atuais relevantes sem mover arquivos referenciados;
  - unificação das ordens de autoridade hoje divergentes (`research/README.md` e o inventário de taxonomia) em uma única regra canônica, por domínio;
  - classificação dos handoffs antigos como `kind: handoff-legacy` ou equivalente, sem criar uma nova pasta para handoff persistido e preservando ADR 0022/PIT-0010;
  - `research-index` canônico reparado e verificado por check;
  - promoção dos artefatos reutilizáveis já maduros para `research-library/<domínio>/` com índice atualizado;
  - projeções visuais, mapas e assets rotulados como não-autoridade;
  - tipo governado de **review pré-codificação/model-review** materializado quando aceito: schema/home, autoridade, lifecycle, check/documentação e exemplo mínimo. Se a owner rejeitar esse tipo, a rejeição deve ser DEC explícita, não ausência silenciosa.
- Manter fora desse próximo PR a migração física de `.specify/specs/researchs`, a unificação do índice legado `.specify`, a consolidação ampla de templates e a remoção da ponte runtime `.specify`/`.ai-guidelines`. Esses itens continuam pertencendo ao `dualroot-collapse`, porque tocam referências concretas e devem ser migrados no mesmo movimento que atualiza os links.
- Reescrever `tasks.md`, `plan.md` e `state.yml § next` para refletir o recorte semântico, evitando que uma sessão nova leia `CO-10.8.2` como trabalho ativo dentro do PR #44.

**Impacto esperado:**

- O PR #44 fica honesto: decisão e inventário arquitetural, reparo inicial de drift, revisões de falsificação e mapa visual, sem overclaim de implementação da arquitetura final.
- O próximo PR ganha critério de saída forte: entregar a taxonomia e o review pré-codificação como produto governado real, com check, documentação e exemplo, em vez de apenas etiquetar arquivos.
- `dualroot-collapse` permanece coeso: ele não vira depósito de decisões adiadas; fica responsável pelo que realmente toca `.specify`, templates e ponte runtime.
- O framework passa a registrar o padrão aprendido no dogfood: **decisão arquitetural sem contrato implementado vira drift**, não "planejamento".

**O que NÃO está sendo decidido:** executar Ready, Human Gate, merge, `advance-subcheckpoint`, `finish-subcheckpoint`, `mark-readiness` ou abrir PR automaticamente; mover arquivos de `.specify`; reescrever a árvore de `src/cli`; implementar a taxonomia neste mesmo commit; promover `model-review` como review obrigatório universal; transformar mapas visuais em SSOT.

**Status:** Resolved (2026-06-22) / @rosanarezende — decisão de recorte semântico e enforcement contra débito arquitetural silencioso no PR #44.

---

### [DEC-0024-G22] Vocabulário de modelagem: Spec › Frente › Checkpoint › Etapa › Tarefa

**Pergunta:** Como nomear, de forma humana e estável, o nível de agrupamento acima de checkpoint — sem reusar "nó" (confunde com grafo/topologia) nem "Fase" (colide com usos legados em `tasks.md`) — e como resolver a tensão estrutural do #45?

**Modo de gate:** `aceitação` <!-- decisão de vocabulário da owner, 2026-06-22, após mapa V4 e investigação empírica de colisão (`research/2026-06-22-checkpoint-artifact-taxonomy-map-v4-nomenclature-review.md`). -->

**Contexto:** A V3/V4 testaram um vocabulário humano para acompanhar a spec. A revisão de confronto da V4 mediu a colisão empírica dos candidatos (`git grep` em `.md/.yml/.html`): `bloco` 1058, `fase` 543 (incl. `Fase de Absorção/Review/Encerramento` no próprio `tasks.md`), `camada` 201, `frente` 42 (quase tudo o idioma "à frente"). "Frente" tem a menor colisão real entre os nomes com sentido de _span_ e já é usado informalmente no repo (`Frente C+D`). A V4 também expôs uma incoerência: o nó `artifact-taxonomy-and-model-review-contract` (#45) tem `sequence: 12` em `state.yml § topology`, mas um comentário dizia que "não é um novo nó topológico".

**Decisão (Resolved):**

- Adotar o vocabulário humano de modelagem: **Spec › Frente › Checkpoint › Etapa › Tarefa**.
- **Frente** = termo humano para um agrupamento de trabalho maior que checkpoint. É **projeção/leitura derivada** de um conjunto ordenado de nós/checkpoints de `state.yml § topology` — **não** é nova SSOT, nem novo campo obrigatório de `state.yml`, nem segunda topologia.
- **Rejeitar `Fase`** para esse uso, por colisão forte com os usos legados em `tasks.md` (Setup/Absorção/Review/Encerramento, que são **estágios de lifecycle** — sentido diferente). Os headers históricos permanecem como registro; o termo humano para agrupamento passa a ser "Frente".
- **Checkpoint** = entrega governada e revisável (normalmente com PR principal claro). **Etapa** = subdivisão opcional dentro de checkpoint grande (ex-"sub-checkpoint"). **Tarefa** = folha executável ou evidência, sem autoridade. **PR** = contêiner de revisão no GitHub, **não** unidade de autoridade do lifecycle (ADR 0025).
- **Níveis intermediários são opcionais:** nem toda Frente precisa de Checkpoints+Etapas+Tarefas; a profundidade acompanha o tamanho real do trabalho.
- **Como gaps entram no modelo (via `GG-0005`, sem débito silencioso):** (a) absorver no checkpoint atual; (b) virar etapa explícita; (c) virar checkpoint novo; (d) virar frente futura; (e) rejeitar por DEC. Gap sem uma dessas disposições registrada na casa governada = débito silencioso, vetado.
- **Resolver a tensão do #45:** `artifact-taxonomy-and-model-review-contract` **é** um nó topológico ativo (`sequence: 12`, `github_pr: 45`), _stacked_ sobre `co-flow-continuation` (#44, seq 11). O comentário que dizia "não é um novo nó" foi removido de `state.yml`, que segue a SSOT estrutural. "Frente" não vira campo de `state.yml`; permanece como leitura derivada (V4 + este DEC).

**Impacto esperado:**

- Acompanhamento humano da spec ganha vocabulário estável e de baixa colisão, sem criar segunda fonte de verdade.
- `state.yml` fica honesto sobre o #45 (estrutura e comentário concordam).
- A V4 (`assets/spec-0024-map-v4.html`) deixa de ser "experimental" e passa a projetar uma decisão governada — continuando projeção, não SSOT.

**O que NÃO está sendo decidido:** implementar a taxonomia de artefatos ou o tipo governado `model-review`; criar campo `frente` em `state.yml`; renomear os headers históricos de `tasks.md`; alterar sequência/ordem/cursor da topologia; executar Ready, Human Gate, merge, `advance-subcheckpoint`, `finish-subcheckpoint` ou `mark-readiness`.

**Status:** Resolved (2026-06-22) / @rosanarezende — adoção do vocabulário de modelagem e reconciliação da tensão estrutural do #45.

---

### [DEC-0024-G23] Extensão de G08: grafo de governança derivado, entrega incremental e camada de consulta

**Pergunta:** A dor de "prova de valor só no fim" + as hipóteses de grafo de governança operacional, graph snapshot derivado e banco orientado a grafo (compilado `research/2026-06-23-governance-graph-incremental-delivery-and-query-layer-direction.md`) exigem nova spec/frente/repo, ou cabem na 0024 estendendo `[DEC-0024-G08]`?

**Modo de gate:** `aceitação` <!-- decisão de direção da owner, 2026-06-23, após auditoria decidido-vs-aberto (`research/2026-06-23-governance-model-question-audit.md`) e três revisões externas registradas no compilado. -->

**Contexto:** `[DEC-0024-G08]` (2026-06-03) já fixou que a direção orientada a grafo vive DENTRO da 0024 e rejeitou uma 0025 independente, reabrindo G03/G04/G05 para modelagem. O compilado de 2026-06-23 levanta três dimensões adicionais — (H1) grafo de **governança operacional** (distinto do `KnowledgeGraph`, hoje knowledge-only em `src/app/projections/`); (H3) **entrega incremental com prova de valor** (a etapa ativa diz "Não é prova mínima" = ausência de conceito governado); (H4) **camada de consulta** (graph snapshot derivado e, no futuro, banco orientado a grafo para site/simulador/dashboards/cross-repo). A auditoria mostrou que essas dimensões ou já têm casa nas etapas planejadas ou são lacunas novas roteáveis — nenhuma exige nova spec.

**Decisão (Resolved):**

- **Estender o envelope de `[DEC-0024-G08]`, sem superseder:** H1/H3/H4 permanecem DENTRO da 0024. **Sem spec/frente/repo novo** (o mérito não atinge o limiar de reabrir G08).
- **Derived-only / sem 2ª SSOT (invariante dura):** grafo de governança, **graph snapshot** e qualquer **banco orientado a grafo** são **projeções estritamente derivadas e regeneráveis** do repo versionado (`state.yml`/`tasks.md`/`decision-brief.md`/reviews/gates/Git). O repo permanece SSOT; banco/snapshot **não decidem** e **não governam** (reafirma `[DEC-0024-G07]` "projeção NÃO governança", `research/2026-06-08-graph-store-options.md` e `GG-0005`). Adoção concreta de banco fica deferida ao spike `knowledge-graph-store-spike`.
- **Roteamento por etapa (critérios de aceite, não nova topologia):**
  - `internal-architecture-refactor-ddd-bdd` decide a **forma do grafo operacional** (estender `KnowledgeGraph` × novo bounded context × read-model acima de contexts) e o **contrato do graph snapshot derivado** (nodes/edges/source-refs/hashes, determinístico, regenerável, offline).
  - `broad-flow-falsification` é dona do contrato `fixtures/journeys`, da unificação das fontes paralelas e da **falsificação de prova de valor** (a journey afirma _valor entregue_, não só _transição válida_), além da fronteira dogfood-humano × fixtures.
  - `artifact-taxonomy-and-model-review-contract` (#45) mantém o escopo atual; ao materializar `kind`, projeta a taxonomia como **semente compatível com tipos de nó do grafo** (uma taxonomia, não duas) e fecha Decision/Review/Finding **no nível de taxonomia** (papel de nó/aresta deferido).
- **Entrega incremental / prova de valor (H3)** é lacuna nova **sem casa de implementação ainda**: começa como modelagem leve (esta DEC + a falsificação de valor acima). Só vira **etapa própria** (`incremental-delivery-and-proof-of-value-model`, entre refactor e falsification) **se** um follow-up concluir que precisa de implementação dedicada — gate explícito, **sem reordenar** a sequência atual.
- **Sequência preservada, modelagem aditiva:** _"modelar = adicionar projeção + contrato, não reescrever a árvore Markdown"_. G00/G02/G06/G07 seguem cravados; G01/G03/G04/G05 seguem as casas abertas/reabertas (o 7-MECE permanece em G01/`F-AG01`).

**Impacto esperado:**

- O modelo nasce preparado para exportação cross-repo (empresas/dashboards) **sem** nascer local demais e **sem** adotar banco agora.
- A lacuna de prova de valor ganha rastreabilidade governada (não vira débito silencioso) sem inflar o #45.
- As três etapas seguintes recebem critérios de aceite explícitos, mantendo a ordem.

**O que NÃO está sendo decidido:** a forma concreta do grafo operacional (deferida a `internal-…-refactor`); adotar Neo4j ou qualquer banco (deferido ao spike); o schema final de prova de valor; identidade/segurança cross-repo (futuro); abrir nova spec/frente/repo; superseder G08, G22 ou qualquer eixo cravado; executar Ready, Human Gate, merge, advance, `mark-readiness` ou abrir PR.

**Status:** Resolved (2026-06-23) / @rosanarezende — estende o envelope de G08 para grafo derivado + entrega incremental + camada de consulta, derived-only e sem 2ª SSOT.

---

### [DEC-0024-G24] Contrato de artifact-kind, disposição e pre-coding-review

**Pergunta:** Como fechar o checkpoint `artifact-taxonomy-and-model-review-contract` sem transformar pesquisa, assets, handoffs ou a incubação Guilda em segunda fonte de autoridade, e sem perder o raciocínio produzido durante a tentativa de chegar à taxonomia proposta?

**Modo de gate:** `aceitação` <!-- decisão operacional/arquitetural da owner, 2026-07-10, após extração da Guilda para repositório irmão e reconciliação do work-graph-model como evidência da taxonomia. -->

**Contexto:** O checkpoint #45 nasceu para materializar a taxonomia de artefatos e o contrato de review pré-codificação/model-review. Durante a execução, o `work-graph-model` incubou a Guilda Governance até ela ser extraída para repo próprio, produzindo QRDs, assets, testes, seeds, frontend/backend e documentação de produto. Esse volume ampliou o PR e expôs uma tensão: preservar a informação valiosa sem deixar que demos, projeções, assets ou arquivos legados pareçam estado vivo da Spec 0024. A revisão `research/2026-06-24-artifact-taxonomy-and-folder-model-review.md` já convergiu a distinção entre `artifact-kind` e uma dimensão de **disposição**; a matriz `work-graph-model/GUILDA-QRD-PRESERVATION-MATRIX.md` mapeia como as decisões da Guilda alimentam, mas não substituem, os objetivos do checkpoint.

**Decisão (Resolved):**

- `artifact-kind` permanece um conjunto fechado para artefatos de classe `research/` e `assets/`, distinto de `WorkItemKind` e da topologia da spec.
- `disposition: living|evidence|legacy|open` vira dimensão ortogonal em `.core/governance/artifact-taxonomy.yml`. Ela descreve o papel atual do artefato no repositório, **sem conceder autoridade**.
- `artifact-kind:check` continua brando para cobertura: arquivo sem `artifact-kind` não bloqueia. Mas qualquer artefato em `research/` ou `assets/` que declare `artifact-kind` ou `disposition` passa a ser validado contra o conjunto fechado.
- `pre-coding-review` exige frontmatter mínimo `subject` e `date` (`YYYY-MM-DD`). O artefato continua advisory; findings só governam quando promovidos a DEC/task/review/gate.
- A incubação Guilda fica arquivada em `work-graph-model/_archive/guilda-incubation-2026-07/` e a antiga pasta `governance-demo/` vira tombstone. Isso preserva histórico, QRDs, testes e assets como evidência/legado, não como produto vivo dentro deste repo.
- O mapeamento `GUILDA-QRD-PRESERVATION-MATRIX.md` é aceito como ponte de preservação: ele mostra quais decisões alimentam `model.yml`, `tracker.md`, `features.md`, `integration-catalog.*` e quais foram migradas para o repo Guilda.
- A reorganização física ampla sugerida no model-review (`falsifications/`, `evidence/`, `legacy/`) fica deferida. A disposição no frontmatter é o contrato mínimo do #45 para evitar débito silencioso sem mover toda a árvore agora.
- O antigo Gap B ("comando para abrir próximo PR interno") fica diferido como automação futura; o protocolo interino em `research/2026-07-07-pr-continuation-protocol.md` é o contrato humano até o comando existir.

**O que NÃO está sendo decidido:** declarar Ready; exercer Human Gate; fazer merge; fechar PR #45; abrir o próximo PR automaticamente; transformar a Guilda em produto vivo dentro de `ai-guidelines`; reverter a extração para repo irmão; exigir classificação universal de todos os Markdown legados; mover `research/` para `falsifications/`/`evidence/`/`legacy/`; transformar assets/projeções em SSOT.

**Impacto esperado:**

- O checkpoint passa a ter enforcement mecânico para kind inválido, disposição inválida e `pre-coding-review` incompleto.
- A história da Guilda permanece auditável dentro da Spec 0024, mas claramente separada do produto ativo e da autoridade do framework `ai-guidelines`.
- O próximo ciclo pode retomar o objetivo original do checkpoint com menos ambiguidade: taxonomia, model-review e preservação do aprendizado, não validação final do app Guilda.

**Status:** Resolved (2026-07-10) / @rosanarezende — contrato de artifact-kind/disposition/pre-coding-review e disposição da incubação Guilda dentro do checkpoint #45.

---

### [DEC-0024-G25] Linguagem viva: trabalho governado e work graph

**Pergunta:** Como nomear os mapas e projeções vivas depois dos aprendizados do `work-graph-model`, sem manter "spec" como centro conceitual e sem perder o identificador histórico `0024-context-architecture`?

**Modo de gate:** `aceitação` <!-- decisão de linguagem/modelagem da owner, 2026-07-10, após revisão do mapa V5 e identificação de que "spec" confundia o entendimento da taxonomia. -->

**Contexto:** `[DEC-0024-G22]` adotou o vocabulário humano **Spec › Frente › Checkpoint › Etapa › Tarefa** para resolver a leitura do mapa V4 e reduzir colisões com "Fase". Depois, o `work-graph-model` amadureceu: `model.yml` passou a ser o SSOT normativo do work graph, Guilda foi extraída para repo próprio e `[DEC-0024-G24]` separou `artifact-kind`, `disposition`, evidência histórica e produto vivo. Nesse ponto, continuar nomeando novas projeções como "mapa da spec" reforça uma leitura errada: a taxonomia não é "da spec"; é uma taxonomia de artefatos/evidências dentro de um **trabalho governado**.

**Decisão (Resolved):**

- **"Spec" permanece como invólucro histórico e caminho físico**, por compatibilidade com `.governance/specs/0024-context-architecture/`, PRs/branches existentes e documentação antiga.
- **A linguagem viva para novas projeções, geradores e documentação operacional passa a ser "trabalho governado" e "work graph".**
- Mapas futuros devem nomear o objeto como **Mapa Vivo do Trabalho Governado**, preservando `0024` apenas como identificador do recorte histórico: `Context Architecture / 0024`.
- Scripts/geradores futuros devem preferir nomes como `governed-work-map:build` e `governed-work-map:check`, não `spec-map:*`.
- `artifact-kind` é a taxonomia dos **artefatos** (`research/` e `assets/`), distinta de `WorkItemKind`, da topologia e do work graph.
- `[DEC-0024-G22]` não é apagada: ela continua válida como decisão histórica do V4 e como explicação da transição. A partir desta DEC, porém, "Spec" não deve ser usado como centro conceitual das projeções vivas.

**Consequências práticas:**

- O `spec-0024-map-v5.html` passa a se apresentar como **Mapa Vivo do Trabalho Governado — Context Architecture / 0024**.
- O eventual gerador vivo deve seguir o fluxo `SSOT governada -> modelo tipado -> projection`, sem criar segunda fonte de verdade.
- O PR #45 continua sendo checkpoint de framework (`artifact-kind`, `disposition`, `pre-coding-review`, research-index e reconciliação), não readiness do produto Guilda.

**O que NÃO está sendo decidido:** renomear fisicamente `.governance/specs/`; migrar todo histórico para outro diretório; abrir nova spec; alterar `state.yml`; declarar Ready/Human Gate; mudar a taxonomia fechada de `artifact-kind`; implementar o gerador nesta DEC.

**Status:** Resolved (2026-07-10) / @rosanarezende — linguagem viva das projeções passa de "spec" para "trabalho governado" + "work graph", mantendo `0024` como identificador histórico.

---

### [DEC-0024-G26] Artefatos de Pull Request sob `pull-requests/pr-N/`

**Pergunta:** `pr-bodies/` deve continuar como pasta isolada, enquanto continuações e assets específicos de PR nascem em outros lugares, ou o framework deve ter uma casa canônica por Pull Request para reunir body versionado, assets e pacotes de continuação?

**Modo de gate:** `aceitação` <!-- decisão operacional/arquitetural da owner, 2026-07-10, após QRD sobre PRs grandes, continuação governada e aprendizado do work-graph-model. -->

**Contexto:** O PR #45 mostrou que PRs longos não são apenas problema de texto: eles precisam de um contêiner versionado para o que pertence ao PR, sem transformar GitHub em memória e sem espalhar `body`, assets e propostas de continuação por pastas paralelas. `pr-bodies/` nasceu dentro da Spec 0024 para resolver o body como fonte versionada, mas o próprio dogfood revelou uma organização melhor: o PR é uma superfície de revisão/projeção; portanto, seus artefatos devem ficar juntos por número de PR.

**Decisão (Resolved):**

- A casa canônica de artefatos versionados de PR passa a ser `pull-requests/pr-<n>/` dentro do trabalho governado.
- O body versionado do PR passa a ser `pull-requests/pr-<n>/body.md`; a pasta isolada `pr-bodies/` deixa de ser o padrão.
- Futuras automações de continuação devem usar o mesmo contêiner, por exemplo `pull-requests/pr-<n>/continuations/<date>-<slug>/`.
- Assets específicos de PR devem ficar em `pull-requests/pr-<n>/assets/`; assets de valor geral continuam em `assets/` conforme `artifact-kind`/`disposition`.
- O contêiner de PR é **projeção/evidência/revisão**, não autoridade de topologia. `state.yml`, `tasks.md`, `decision-brief.md`, reviews e gates continuam sendo as fontes governadas do trabalho.
- Scripts `pr-body:check`, `pr-body:publish` e `pr-body:pull`, quando chamados com `--spec` + `--pr`, devem derivar o caminho `pull-requests/pr-<n>/body.md`.

**Consequências práticas:**

- O body do PR #45 migra de `pr-bodies/pr-45.md` para `pull-requests/pr-45/body.md`.
- O mapa vivo e a documentação operacional passam a apontar para a nova casa.
- A futura sequência `continuation:check -> continuation:prepare -> continuation:create-pr` deve produzir pacotes versionáveis sob `pull-requests/pr-N/continuations/`, com decisão humana explícita antes de qualquer criação de PR.

**O que NÃO está sendo decidido:** criar automações de continuação nesta fatia; converter PR #45 para Ready; executar Human Gate; alterar a topologia; criar ou publicar novo PR; mover todo histórico antigo fora do PR #45; transformar o diretório de PR em SSOT do trabalho.

**Status:** Resolved (2026-07-10) / @rosanarezende — pasta canônica de PR definida como `pull-requests/pr-N/`, com body versionado em `body.md` e espaço reservado para assets/continuations.

---

### [DEC-0024-G27] Fluxo governado de continuação de PR

**Pergunta:** Depois de criar a casa `pull-requests/pr-N/`, o framework deve continuar dependendo apenas de um protocolo humano para PRs grandes, ou deve entregar um fluxo completo para diagnosticar, preparar e criar continuações de PR sem capturar decisões humanas?

**Modo de gate:** `aceitação` <!-- decisão operacional/arquitetural da owner, 2026-07-11, após concordância explícita com a sequência check/prepare/create-pr e com a regra de que a automação prepara/verifica, mas não decide Ready, Human Gate, merge ou avanço. -->

**Contexto:** O PR #45 mostrou dois aprendizados simultâneos. Primeiro, PR grande precisa de um protocolo honesto para não misturar escopo, readiness e validação de produto. Segundo, apenas avisar o humano que há continuação pendente não é suficiente: sem pacote versionado, body inicial, briefing, branch proposta e cross-ref, o alerta vira trabalho manual solto. `[DEC-0024-G24]` aceitou um protocolo interino; `[DEC-0024-G26]` definiu a casa `pull-requests/pr-N/`. Esta DEC transforma o protocolo em automação segura.

**Decisão (Resolved):**

- Criar uma família de scripts `continuation:*` para PRs grandes e continuações governadas.
- `continuation:check` é read-only no efeito governado: verifica se o PR tem casa versionada, body versionado, protocolo de continuidade e pacotes de continuação válidos. Ele não escreve, não cria branch e não cria PR.
- `continuation:prepare` cria um pacote versionado sob `pull-requests/pr-<n>/continuations/<date>-<slug>/`, contendo `manifest.yml`, `body.md`, `briefing.md` e `commands.md`.
- `continuation:create-pr` consome um pacote preparado. Sem `--confirm`, apenas imprime o comando de criação. Com `--confirm`, cria no máximo um **Draft PR** via `gh pr create --draft`.
- Nenhum comando `continuation:*` pode declarar Ready, registrar Human Gate, fazer merge, alterar topologia ou avançar estado governado.
- O pacote de continuação é evidência/projeção operacional, não SSOT. `state.yml`, `tasks.md`, `decision-brief.md`, reviews e gates continuam governando o trabalho.

**Consequências práticas:**

- O antigo Gap B deixa de ser apenas protocolo interino: passa a ter caminho executável, auditável e versionado.
- PRs longos passam a ter uma forma segura de gerar a próxima superfície de revisão sem depender de memória de chat.
- A owner ainda decide se quer criar o PR, quando criar e se a continuação deve avançar.

**O que NÃO está sendo decidido:** converter PR #45 para Ready; exercer Human Gate; fazer merge; abrir PR automaticamente sem confirmação; alterar `state.yml`; criar nova frente/checkpoint; substituir `flow -- decide`; criar automação de merge/advance; transformar pacotes de continuação em autoridade de topologia.

**Status:** Resolved (2026-07-11) / @rosanarezende — sequência `continuation:check -> continuation:prepare -> continuation:create-pr` adotada como fluxo completo e seguro para continuação governada de PR.

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

| ID histórico | Tema                                                                       | Estado atual                                                                                                                                                                                 |
| :----------- | :------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `G00`        | identidade (transformação)                                                 | **Decidido** — § 1 (Resolved 2026-05-31)                                                                                                                                                     |
| `G01`        | estrutura/gramática                                                        | **Aberto** — § 2 (`F-AG01`)                                                                                                                                                                  |
| `G02`        | taxonomia → bloco + propriedade                                            | **Decidido** — § 1 (Resolved 2026-05-31) → migração em § 4                                                                                                                                   |
| `G03`        | promotion pipeline                                                         | **Reaberto (modelagem)** — `[DEC-0024-G08]` 2026-06-03; pipeline `insight→decision→rule\|guardrail→doctrine`                                                                                 |
| `G04`        | contrato de boilerplate / casa única                                       | **Reaberto (modelagem)** — `[DEC-0024-G08]`; casa única / tri-root → SSOT na trilha de convergência                                                                                          |
| `G05`        | projeções / decision-session                                               | **Reaberto (modelagem)** — `[DEC-0024-G08]`; projeções derivadas (fonte↔projeção) + KnowledgeGraph                                                                                           |
| `G06`        | contrato da cadeia                                                         | **Decidido** — § 1 (Resolved 2026-05-30) → ADR no fechamento                                                                                                                                 |
| `G07`        | topologia-as-data + enforcement L4                                         | **Decidido** — § 1 (Resolved 2026-06-01) → enforcement em § 4                                                                                                                                |
| `G08`        | reabertura de G03/G04/G05 + direção orientada a grafo                      | **Decidido** — Resolved 2026-06-03 (owner); a modelagem fica DENTRO da 0024; NÃO há 0025 independente                                                                                        |
| `G09`        | eliminação integral de `/cli` (→ CO-3.5)                                   | **Decidido** — § 1 (Resolved 2026-06-15, owner); supersede o "wrapper" do #38; topologia externa inalterada                                                                                  |
| `G10`        | `co-flow-convergence` antes de `co-capture`                                | **Decidido** — § 1 (Resolved 2026-06-16, owner); nó próprio para convergência ponta a ponta do fluxo                                                                                         |
| `G11`        | suspensão temporária de smoke durante co-flow                              | **Decidido** — § 1 (Resolved 2026-06-16, owner); bloqueia Ready/Human Gate até reativação                                                                                                    |
| `G12`        | CO-10.2 entrega convergência coesa inicial                                 | **Decidido** — § 1 (Resolved 2026-06-16, owner); remove heurísticas locais já comprovadamente divergentes                                                                                    |
| `G13`        | CO-10.5 dedicado a UX/linguagem/wizard Clack                               | **Decidido** — § 1 (Resolved 2026-06-17, owner); G14 subdivide o fechamento antes do Gate                                                                                                    |
| `G14`        | CO-10.6 dedicado a fluxo de time/múltiplas specs                           | **Decidido** — § 1 (Resolved 2026-06-18, owner); G15/G16 subdividem o fechamento antes do Gate                                                                                               |
| `G15`        | CLI pública autoexplicável como porta de entrada                           | **Decidido** — § 1 (Resolved 2026-06-19, owner); G16 insere arquitetura interna/BDD humano antes da falsificação final                                                                       |
| `G16`        | arquitetura interna, organização DDD e BDD visual                          | **Decidido** — § 1 (Resolved 2026-06-19, owner); pausado por G17 até CO-10.7 fechar corretamente                                                                                             |
| `G17`        | reabrir CO-10.7 antes de retomar CO-10.8                                   | **Decidido** — § 1 (Resolved 2026-06-19, owner); corrige fechamento prematuro de CO-10.7                                                                                                     |
| `G18`        | antecipar `dualroot-collapse`                                              | **Decidido** — § 1 (Resolved 2026-06-20, owner); próximo PR dedicado após `co-flow-convergence`, antes de CO-5/CO-6                                                                          |
| `G19`        | recorte do PR #43 + revisão externa antes do Gate                          | **Decidido** — § 1 (Resolved 2026-06-20, owner); PR #43 fecha CO-10.1..CO-10.7; CO-10.8..CO-10.10 vão para próximo PR                                                                        |
| `G20`        | ancorar continuação CO-10.8..CO-10.10 na topologia                         | **Decidido** — § 1 (Resolved 2026-06-21, owner); nó `co-flow-continuation` seq 11 antes de `dualroot-collapse`                                                                               |
| `G21`        | checkpoints semânticos + sem débito arquitetural silencioso                | **Decidido** — § 1 (Resolved 2026-06-22, owner); PR #44 fecha decisão/inventário e próximo PR implementa taxonomia/review pré-codificação com enforcement                                    |
| `G22`        | vocabulário Spec›Frente›Checkpoint›Etapa›Tarefa + tensão #45               | **Decidido** — § 1 (Resolved 2026-06-22, owner); `Frente` (rejeita `Fase`) como agrupamento derivado/não-SSOT; #45 reconciliado como nó topológico ativo (seq 12)                            |
| `G23`        | extensão de G08: grafo derivado + entrega incremental + camada de consulta | **Decidido** — § 1 (Resolved 2026-06-23, owner); H1/H3/H4 dentro da 0024 como projeção derivada (sem 2ª SSOT, sem spec nova); roteado a `internal-…-refactor`/`broad-flow-falsification`/#45 |
| `G24`        | artifact-kind, disposição e contrato pre-coding-review                     | **Decidido** — § 1 (Resolved 2026-07-10, owner); `disposition` ortogonal, `pre-coding-review` com `subject`+`date`, Guilda preservada como evidência/legado sem virar app vivo               |
| `G25`        | linguagem viva: trabalho governado + work graph                            | **Decidido** — § 1 (Resolved 2026-07-10, owner); "Spec" fica como invólucro histórico/caminho físico; novas projeções falam em trabalho governado e work graph                               |

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
- [x] `[DEC-0024-G18]` — Resolved 2026-06-20 / @rosanarezende
- [x] `[DEC-0024-G19]` — Resolved 2026-06-20 / @rosanarezende
- [x] `[DEC-0024-G20]` — Resolved 2026-06-21 / @rosanarezende
- [x] `[DEC-0024-G21]` — Resolved 2026-06-22 / @rosanarezende
- [x] `[DEC-0024-G22]` — Resolved 2026-06-22 / @rosanarezende
- [x] `[DEC-0024-G23]` — Resolved 2026-06-23 / @rosanarezende
- [x] `[DEC-0024-G24]` — Resolved 2026-07-10 / @rosanarezende
- [x] `[DEC-0024-G25]` — Resolved 2026-07-10 / @rosanarezende
- [x] `[DEC-0024-G26]` — Resolved 2026-07-10 / @rosanarezende

---

### `[DEC-0024-G08]` Reabertura de G03/G04/G05 + direção arquitetural orientada a grafo

**Status:** Resolved (2026-06-03, owner).

**O que está sendo aceito:** os eixos `G03` (promotion pipeline), `G04` (casa única / tri-root→SSOT) e `G05` (projeções), deixados **abertos** no Stage 1, são **reabertos para modelagem deliberada DENTRO da 0024**, porque se mostraram necessários para problemas reais observados no uso (mis-binding da retomada; recuperabilidade; "a resposta estava num ADR esquecido"). A **direção assumida** é arquitetura **orientada a grafo**: entidades (`Insight→Decision→Rule/Guardrail→Doctrine`) + relações navegáveis (`KnowledgeRef`) + projeções derivadas (`KnowledgeGraph`, fonte↔projeção). O objetivo passa a ser **convergir o repositório** para esse modelo.

**O que NÃO está sendo aceito:** (i) reabrir `G00/G02/G06/G07` (seguem cravados); (ii) que tenha surgido uma **spec 0025 independente** — a evidência (brief: G03/G04/G05 são eixos da própria 0024; `plan.md` §41: split 0025 superado; inventário 2026-05-29: candidatas Grupo B já catalogadas) mostra que **não** nasceu domínio independente: é a modelagem deferida da 0024 ressurgindo + candidatas de migração já identificadas.

**Concorrentes refutados:** "isto é a 0025" (refutado: split absorvido na 0024); "isto é drift de absorção a estancar" (refutado pelo owner: a reabertura é decisão, os eixos eram necessários). **O que reabriria:** evidência de que a direção a grafo não resolve a recuperabilidade observada.

**Consequência:** a disciplina "NÃO re-modelar" passa a valer **só para os eixos resolvidos**; em G03/G04/G05 a modelagem é a direção. Trilha de execução = programa de convergência (ver `plan.md § Trilha de convergência` + `state.yml § topology`).
