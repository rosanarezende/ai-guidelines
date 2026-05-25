<!-- ai-guidelines-template: decision-brief-boilerplate v=2 -->

# Decision Brief — Spec 0023 Workflow Runtime

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md) (criado em 2026-05-19 conforme `[DEC-0023-B05]`).
> Tasks: tasklist da sessão de implementação (PR1).
> Status agregado: **Resolved** — Blocos A/B/C/D/E/F/G/I/J/K/L/M todos fechados (F01–F04 Resolved em PR5 S5 / 2026-05-22; F05 Deferred com critério estrutural vinculado à abertura de `handoff-as-first-class`; B07 + I01 cravados durante review do PR #25 / 2026-05-23; J01 + ADR 0024 cravados na Frente #3 do hardening / 2026-05-23–24; K01 cravado no fechamento operacional / 2026-05-24; L01 + ADR 0024 amendment cravados na Frente C+D do hardening / 2026-05-24 II; G05 cravado no dogfooding de fechamento / 2026-05-24 II — `active-specs.yml` permanece minimal canonical projection, não coordination source-of-truth; M01 cravado no dogfooding final / 2026-05-25 — modelo de 3 boundaries tasks/review/closure).
> Última atualização: 2026-05-24 (II) — Frente C+D do hardening do PR #25: `[DEC-0023-L01]` (Bloco L — Operational CLI commands) + ADR 0024 amendment (extensão do modelo de 3 estados com tier model de execução transacional).

> **Artefato canônico do gate humano entre Stage 1 (research) e Stage 2 (design + implementação).** Para esta spec, a Stage 1 é a investigação documentada na pasta legacy `.specify/specs/0023-governance-workflow-discovery-model/` (research.md + anexos). Este brief materializa o gate Stage A → Stage B com 4 decisões cravadas em sessão de design 2026-05-19.

---

## Resumo de status

| ID               | Bloco | Status   |
| :--------------- | :---- | :------- |
| `[DEC-0023-A01]` | A     | Resolved |
| `[DEC-0023-A02]` | A     | Resolved |
| `[DEC-0023-A03]` | A     | Resolved |
| `[DEC-0023-A04]` | A     | Resolved |
| `[DEC-0023-B01]` | B     | Resolved |
| `[DEC-0023-B02]` | B     | Resolved |
| `[DEC-0023-B03]` | B     | Resolved |
| `[DEC-0023-B04]` | B     | Resolved |
| `[DEC-0023-B05]` | B     | Resolved |
| `[DEC-0023-B06]` | B     | Resolved |
| `[DEC-0023-B07]` | B     | Resolved |
| `[DEC-0023-C01]` | C     | Resolved |
| `[DEC-0023-D01]` | D     | Resolved |
| `[DEC-0023-D02]` | D     | Resolved |
| `[DEC-0023-D03]` | D     | Resolved |
| `[DEC-0023-D04]` | D     | Resolved |
| `[DEC-0023-D05]` | D     | Resolved |
| `[DEC-0023-E01]` | E     | Resolved |
| `[DEC-0023-E02]` | E     | Resolved |
| `[DEC-0023-E03]` | E     | Resolved |
| `[DEC-0023-E04]` | E     | Resolved |
| `[DEC-0023-E05]` | E     | Resolved |
| `[DEC-0023-F01]` | F     | Resolved |
| `[DEC-0023-F02]` | F     | Resolved |
| `[DEC-0023-F03]` | F     | Resolved |
| `[DEC-0023-F04]` | F     | Resolved |
| `[DEC-0023-F05]` | F     | Deferred |
| `[DEC-0023-G01]` | G     | Resolved |
| `[DEC-0023-G02]` | G     | Resolved |
| `[DEC-0023-G03]` | G     | Resolved |
| `[DEC-0023-G04]` | G     | Resolved |
| `[DEC-0023-G05]` | G     | Resolved |
| `[DEC-0023-I01]` | I     | Resolved |
| `[DEC-0023-J01]` | J     | Resolved |
| `[DEC-0023-K01]` | K     | Resolved |
| `[DEC-0023-L01]` | L     | Resolved |
| `[DEC-0023-M01]` | M     | Resolved |

**Status agregado:** Resolved — Blocos A/B/C/D/E/F/G/I/J/K todos fechados. F01–F04 Resolved (tríade arquitetural B+B+A+A cravada em PR5 S5 / 2026-05-22); F05 Deferred com critério estrutural observável (revisita obrigatória na abertura da candidata `handoff-as-first-class`); J01 cravado na Frente #3 do hardening do PR #25 (2026-05-23/24) com ADR 0024 materializando o modelo de 3 estados Draft/Ready/Mergeable; K01 crava Integration PR como PR de homologação/convergência final antes da autorização de merge atômico.

---

## Bloco A — Pivot da 0023 e forma do runtime

### [DEC-0023-A01] Escopo da Spec 0023: discovery model vs operational runtime

**Pergunta:** Manter a 0023 com escopo metodológico original (lifecycle + research-contract + matriz workflow→artefatos) ou expandir para runtime operacional humano-IA?

**Contexto (research):**

- Research legado §1 (H1–H4) confirmou que o problema-raiz é **carga cognitiva operacional**, não falta de metodologia documental.
- Research legado §4 (AP1–AP5) mapeou anti-patterns que persistem mesmo com mais documentação — sintoma de que documentação **adicional** não resolve.
- Discussão de owner 2026-05-19: framework cresceu arquiteturalmente mas custo cognitivo cresceu junto; risco real é governança virar overhead.

**Opções:**

| Opção | Descrição                                                                                                                                             | Pró                                                                                                                                | Contra                                                                                                                                     |
| :---- | :---------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| A     | **Manter escopo discovery**: 0023 fecha entregando lifecycle + research-contract + matriz, sem código. Spec 0024 separada para runtime.               | Limpeza conceitual; preserva imutabilidade da spec.md original.                                                                    | Fragmenta artificialmente um domínio único (workflow/lifecycle/discovery/runtime); spec 0024 nasceria vazia; perde rationale já produzido. |
| B     | **Expandir para runtime operacional**: 0023 pivota; research virou evidência da decisão; spec.md reescrita sob novo objetivo; código entra no escopo. | Preserva research como insumo; dogfooda o lifecycle que a própria 0023 propõe (research → decisão → execução); evita fragmentação. | Viola escopo declarado em §"Fora do escopo" da spec original — exige reescrita do spec.md; risco de overload (escopo crescer).             |

**Recomendação inicial (a confirmar pós-gate):** Opção B — evidência convergente em research §1+§4 de que o problema é operacional, não documental; manter escopo "discovery model" entregaria mais documentação para o mesmo problema.

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:**
  - [ ] A
  - [x] B
- **Justificativa / Ressalvas:**
  > B preserva o rationale produzido e materializa o lifecycle no caso mais difícil (pivot de escopo). Ressalva: spec.md **original** permanece intocada na pasta legacy como trilha histórica; o novo `spec.md` vive em `.governance/specs/0023-workflow-runtime/`. Imutabilidade da original respeitada — não é rewrite, é pivot registrado.
- **Data / Owner:** 2026-05-19 / @rosanarezende

> **Nota de sequencing (2026-05-21):** o Bloco G inseriu `PR3-runtime-state-index` antes do enforcement. Sempre que Blocos B/E mencionarem `PR3`/`PR4`/`PR5` sem o novo sufixo, leia como **sequenciamento histórico pré-Bloco G**, não como numbering atual da stack.

---

### [DEC-0023-A02] Topologia: `.specify/` vs `.governance/` no repo do mantenedor

**Pergunta:** Onde novas specs nascem neste repositório a partir desta decisão?

**Contexto (research):**

- ADR 0018 declarou `.governance/` como SSOT no **consumidor**; no **mantenedor** specs continuavam em `.specify/`.
- Owner identificou inconsistência conceitual: discurso governance-first, UX ainda spec-first. Adiar repete AP1 (decisões empurradas).

**Opções:**

| Opção | Descrição                                                                                                                   | Pró                                                                                            | Contra                                                                                                  |
| :---- | :-------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| A     | **Manter `.specify/`** como root no mantenedor; `.governance/` só no consumidor.                                            | Sem mudança; specs antigas e novas convivem.                                                   | Inconsistência conceitual persiste; UX contradiz discurso governance-first.                             |
| B     | **`.governance/specs/` como root primária**; `.specify/` vira bridge explícita com double-lookup; sem deprecation timeline. | Resolve inconsistência conceitual; runtime trata as duas como fontes legítimas; zero-breakage. | Duplicidade temporária; specs antigas ficam fisicamente em `.specify/`.                                 |
| C     | **Migração em massa**: mover todas as 9 specs antigas para `.governance/specs/`.                                            | Topologia limpa.                                                                               | Quebra links históricos; PR gigante; risco alto sem benefício imediato; viola "reduz carga cognitiva?". |

**Recomendação inicial (a confirmar pós-gate):** Opção B — resolve inconsistência sem custo de migração em massa.

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:**
  - [ ] A
  - [x] B
  - [ ] C
- **Justificativa / Ressalvas:**
  > B materializada via ADR 0019 + adapter de double-lookup no runtime. `.specify/` permanece sem deprecation timeline. Migração caso-a-caso é decisão própria por spec, não escopo da 0023.
- **Data / Owner:** 2026-05-19 / @rosanarezende

---

### [DEC-0023-A03] Forma do runtime: múltiplos comandos vs wizard guiado vs LLM embutido

**Pergunta:** Qual a forma do runtime que entrega "redução de carga cognitiva" sem virar workflow engine ou wrapper de LLM?

**Contexto (research):**

- Briefing inicial sugeria 5 comandos (`start-spec`, `continue`, `review-research`, `review-decision`, `start-implementation`) — análise crítica identificou risco de substituir carga cognitiva documental por carga cognitiva operacional ("qual comando uso agora?").
- ADR 0018 (AI-as-Channel) restringe: framework não pode virar wrapper de LLM.
- Owner reforçou que a dor não é "falta de menu", é "reconstrução contextual e carga cognitiva".

**Opções:**

| Opção | Descrição                                                                                                                                                                                       | Pró                                                                                                                         | Contra                                                                                                                   |
| :---- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| A     | **Múltiplos comandos especializados** (start-spec, review-research, etc.)                                                                                                                       | Responsabilidades explícitas.                                                                                               | Cresce a superfície; humano lembra comandos; viola "reduz carga cognitiva".                                              |
| B     | **Wizard contextual** (`workflow` + atalho `continue`): REPL local, briefing + menu numerado + texto livre que gera **contexto da spec pronto para colar** na IA externa. **Sem LLM embutido.** | Superfície mínima; AI-as-Channel preservado; runtime offline-friendly; conversação fica onde já é boa (Claude Code/Cursor). | Tradeoff: terminal puro não tem chat; usuário cola o contexto no agente IA externo.                                      |
| C     | **REPL com LLM embutido**: runtime chama Claude/OpenAI API internamente, interpreta intenção, responde.                                                                                         | UX conversacional direta.                                                                                                   | Viola ADR 0018; cria dependência de provider; custo recorrente; concorre com Claude Code/Cursor; framework vira wrapper. |

**Recomendação inicial (a confirmar pós-gate):** Opção B — única coerente com ADR 0018 e com a métrica de cognitive load.

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:**
  - [ ] A
  - [x] B
  - [ ] C
- **Justificativa / Ressalvas:**
  > B preserva AI-as-Channel, mantém runtime AI-agnóstico, offline-friendly, sem custo de provider. Texto livre vira contexto da spec pronto para colar na IA externa; quando o humano está dentro de um agente IA, o agente pode chamar `workflow briefing` por baixo e usar o output. **Não embutir LLM no framework** é restrição arquitetural cravada.
- **Data / Owner:** 2026-05-19 / @rosanarezende

---

### [DEC-0023-A04] `state.yml`: derivado por inferência vs explícito mínimo

**Pergunta:** O estado de cada spec é derivado por inferência (presença/ausência de arquivos) ou explícito em arquivo dedicado?

**Contexto (research):**

- Briefing inicial sugeria schema rico (hypotheses, sessions, summaries, nextRecommendedActions).
- Proposta conservadora inicial sugeria pura inferência (sem state.yml).
- Owner observou: pura inferência fica frágil com múltiplos devs/specs/agentes simultâneos e context windows limitadas; reconstrução contextual a cada execução gasta tokens.

**Opções:**

| Opção | Descrição                                                                                         | Pró                                                              | Contra                                                                          |
| :---- | :------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| A     | **Pura inferência por arquivos** (sem state.yml).                                                 | Zero arquivos novos para lembrar.                                | Frágil com concorrência; ambiguidades crescem; cada execução redescobre estado. |
| B     | **`state.yml` mínimo** (4 chaves: `stage`, `gate.status`, `focus`, `next`).                       | Reduz reconstrução contextual; barato de manter; deterministico. | Mais um arquivo (mas pequeno).                                                  |
| C     | **`state.yml` rico** (stage, gate, hypotheses, sessions, summaries, nextRecommendedActions, ...). | Modelo completo.                                                 | Workflow engine disfarçado; mantém o problema que a spec quer resolver.         |

**Recomendação inicial (a confirmar pós-gate):** Opção B — mínimo necessário para reduzir reconstrução sem virar engine.

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:**
  - [ ] A
  - [x] B
  - [ ] C
- **Justificativa / Ressalvas:**
  > B com schema canônico documentado: `stage ∈ {discovery, decision, planning, implementation, closing}`, `gate.status ∈ {open, awaiting-review, closed}`, `focus: string[]`, `next: string[]`. Drift guard simples: se conteúdo dos arquivos contradiz state.yml, runtime sinaliza. Sem campos opcionais explodidos; novas chaves exigem decisão própria (não acreção silenciosa).
- **Data / Owner:** 2026-05-19 / @rosanarezende

---

## Bloco B — Escopo do PR2 (DX, docs, onboarding)

> **Sessão de decisão 2026-05-19** após PR1 merged localmente (5 commits em `feat/spec-0023-workflow-runtime`). Owner explicitou que o próximo incremento deve priorizar **experiência operacional e onboarding**, não novas abstrações. Auditoria de release npm produziu lista de gaps; este Bloco B craveia o escopo do PR2.

### [DEC-0023-B01] Escopo do PR2: DX/docs apenas, ou DX/docs + bootstrap?

**Pergunta:** O PR2 inclui apenas DX/docs (clipboard, README, guides, help CLI, integration test, examples), ou inclui também bootstrap (`workflow init` / `workflow upgrade-state`)?

**Contexto:**

- Owner pediu explicitamente "sem novas abstrações" para o próximo incremento.
- Bootstrap é comando novo — abstração nova com decisão própria (cardinalidade de spec? campos opcionais? interação com state.yml ausente?).
- Clipboard detection é **acabamento** do UX de contexto copiável existente, não comando novo.

**Opções:**

| Opção | Descrição                                              | Pró                                                                      | Contra                                                                                    |
| :---- | :----------------------------------------------------- | :----------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| A     | PR2 = docs only; clipboard junto com bootstrap em PR3. | Disciplina absoluta com "sem abstrações novas".                          | UX de contexto copiável fica meia-pronto durante todo o PR2; docs precisariam apologizar. |
| B     | PR2 = DX/docs com clipboard; bootstrap fica para PR3.  | UX de contexto copiável fica completo; bootstrap recebe decisão própria. | Linha "abstração nova vs acabamento" precisa ser explícita.                               |
| C     | PR2 = DX/docs + bootstrap.                             | Tudo junto, próximo release tem mais coisa.                              | Bootstrap nasce sem decision-brief próprio; risco AP1 (planning antes research).          |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [x] B | [ ] C
- **Justificativa:** Clipboard é acabamento essencial do contexto copiável (heart da experiência AI-as-Channel). Sem ele, o fluxo parece incompleto e a tese principal ("runtime como lente, IA como canal") perde força operacional. Bootstrap é comando novo, merece decisão própria — vai para PR3 com brief próprio.
- **Data / Owner:** 2026-05-19 / @rosanarezende

---

### [DEC-0023-B02] Tratamento da fragilidade do AssembleBriefing

**Pergunta:** Como tratar o fato de que `extractSpecHeaders` casa convenções específicas do template (`### H1 —`, `### 8.1 ...`) e devolve briefing vazio para specs fora desse padrão?

**Contexto:**

- Owner identificou que parser semântico/heurística agressiva é exatamente o tipo de abstração prematura que a 0023 quer evitar.
- Convenção atual é razoavelmente seguida pelos boilerplates de `.specify/templates/`.

**Opções:**

| Opção | Descrição                                                                  | Pró                                           | Contra                                                  |
| :---- | :------------------------------------------------------------------------- | :-------------------------------------------- | :------------------------------------------------------ |
| A     | Documentar convenção + emitir warning quando extraction devolve vazio.     | Pragmático; transparente; sem abstração nova. | Specs fora do padrão recebem briefing thin.             |
| B     | Parser semântico mais robusto (NLP-lite, múltiplos formatos de cabeçalho). | Briefing rico para qualquer formato.          | Engenharia prematura; difícil de testar exaustivamente. |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [x] A | [ ] B
- **Justificativa:** Convenção documentada + warning explícito resolve agora sem virar dívida técnica nova. Se >2 specs externas reportarem briefing thin por formato divergente, reabrir como B02-revisited.
- **Data / Owner:** 2026-05-19 / @rosanarezende

---

### [DEC-0023-B03] Inclusão de `examples/` no PR2

**Pergunta:** O PR2 inclui pasta `examples/` com spec real mínima, ou só docs textuais?

**Contexto:**

- Owner observou: "contexto concreto reduz carga cognitiva muito mais do que teoria".
- Examples têm custo de manutenção (drift entre exemplo e runtime real).

**Opções:**

| Opção | Descrição                                                                                         | Pró                                           | Contra                                             |
| :---- | :------------------------------------------------------------------------------------------------ | :-------------------------------------------- | :------------------------------------------------- |
| A     | Não incluir; só docs textuais.                                                                    | Zero manutenção.                              | Onboarding fica mais teórico.                      |
| B     | Incluir `examples/minimal-spec/` (≤ 4 arquivos: spec.md, NEXT.md, state.yml, README explicativo). | Substrato concreto para quem instala via npm. | Custo de manutenção pequeno (≤ 4 arquivos curtos). |
| C     | Incluir `examples/` rico com múltiplas specs simuladas.                                           | Cobre múltiplos cenários.                     | Custo de manutenção alto; drift garantido.         |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [x] B | [ ] C
- **Justificativa:** Minimal-spec aceita o custo pequeno em troca de onboarding concreto. Adicionar ao `files` do package.json para o consumidor receber.
- **Data / Owner:** 2026-05-19 / @rosanarezende

---

### [DEC-0023-B04] Estratégia de release npm: quando lançar workflow runtime?

**Pergunta:** Quando o workflow runtime sai do estado interno (branch only) para release npm público?

**Contexto:**

- Auditoria 2026-05-19 identificou 10 gaps; 5 são blockers de DX no primeiro uso (branch dependency, state.yml ausente sem bootstrap, clipboard ausente, README sem mencionar, CHANGELOG sem entry).
- PR2 resolve 3 desses 5; PR3 resolve o restante (bootstrap).

**Opções:**

| Opção | Descrição                                                             | Pró                                                            | Contra                                                            |
| :---- | :-------------------------------------------------------------------- | :------------------------------------------------------------- | :---------------------------------------------------------------- |
| A     | Lançar preview agora (após merge de PR1).                             | Sinal público rápido.                                          | Usuário encontra blockers no primeiro uso; queima credibilidade.  |
| B     | Lançar preview após PR2 (docs/DX entregue, bootstrap ainda ausente).  | Discovery (README) e contexto copiável (clipboard) prontos.    | Runtime continua "leitor only"; quem tenta criar spec se vira só. |
| C     | Lançar preview após PR3 (bootstrap entregue) com CHANGELOG explícito. | Fluxo end-to-end utilizável; preview tag gerencia expectativa. | Mais tempo até feedback externo.                                  |
| D     | Estável só após N specs externas dogfoodando.                         | Maturidade comprovada.                                         | Pode demorar muito; perde momentum.                               |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [ ] B | [x] C | [ ] D
- **Justificativa:** Preview após PR3 é o ponto mínimo onde o usuário consegue atravessar um fluxo completo sem se sentir abandonado. Tag `1.1.0-preview.0` ou similar; CHANGELOG explícito "workflow runtime in preview — UX may evolve". Versão estável (1.1.0 sem -preview) só depois de feedback de ≥ 2 consumidores externos. D vira critério de exit do preview, não estratégia de lançamento.
- **Data / Owner:** 2026-05-19 / @rosanarezende

---

### [DEC-0023-B05] `plan.md` inline em `spec.md` vs `plan.md` separado

**Pergunta:** A 0023 mantém o rollout inline no `spec.md` § Rollout (escolha tácita do PR1) ou cria `plan.md` próprio alinhado com o boilerplate canônico?

**Contexto (decisão emergente detectada):**

- Durante PR1, o `spec.md` pós-pivot foi escrito com `Plan: (inline neste spec.md § "Rollout"; vira plan.md próprio quando o número de PRs ≥ 4)` — escolha do agente, **sem decisão registrada**. Threshold "≥ 4 PRs" foi inventado, não derivado de research.
- Owner detectou em 2026-05-19: "manter inline sem decisão explícita é exatamente a acreção silenciosa que a 0023 quer evitar". O problema não é o arquivo ausente — é a decisão estrutural emergindo implícita.
- Boilerplate vigente (`spec-boilerplate.md` + `plan-boilerplate.md`) assume `plan.md` desde o setup. Divergir disso sem rationale registrado contradiz a métrica principal da 0023 (reduzir decisões implícitas).
- Esta spec já claramente não é pequena: 4 PRs candidatos, rollout duradouro, piloto metodológico.

**Opções:**

| Opção | Descrição                                                                                                                                                                                         | Pró                                                                                         | Contra                                                                                                                          |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------ |
| A     | **Manter inline** em `spec.md § Rollout`, com decisão explícita + critério objetivo de promoção a `plan.md` (não threshold arbitrário).                                                           | Um arquivo a menos; coerente com AP3 (não criar artifacts por reflexo).                     | Diverge do boilerplate vigente; cria ambiguidade ("isso é o pattern novo?"); aumenta heurística implícita para quem vem depois. |
| B     | **Criar `plan.md` separado** alinhado com boilerplate canônico (tight, operacional, sem ceremony). Move conteúdo de `spec.md § Rollout` para `plan.md`; mantém pequena summary + link no spec.md. | Consistência estrutural; previsibilidade; menos surpresa; alinha com `spec-boilerplate.md`. | Mais um arquivo; risco residual de virar ceremony (mitigado pela disciplina "sem planejamento excessivo").                      |
| C     | Tratar como gap dos boilerplates; abrir spec própria de revisão.                                                                                                                                  | Investigação mais profunda.                                                                 | Empurra decisão concreta para depois; **anti-pattern AP1 disfarçado** (decisão importante eternamente adiada).                  |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [x] B | [ ] C
- **Justificativa:** Consistência estrutural + previsibilidade > economizar um arquivo. O fato de a owner ter perguntado "isso veio do boilerplate?" prova que a ausência de `plan.md` criou ambiguidade operacional. Disciplina explícita: `plan.md` permanece pequeno, operacional, incremental — sem virar ceremony. Critério de revisão de tamanho: se passar de ~150 linhas sem deduplicação com `spec.md`, reavaliar.
- **Data / Owner:** 2026-05-19 / @rosanarezende

---

### [DEC-0023-B06] Wizard CLI operacional mínimo (promoção de insight em incubação)

**Pergunta:** O insight `Wizard operacional mínimo` (em `NEXT.md § DX e Narrativa Operacional`) deve ser materializado no PR5 da Spec 0023, ou continuar em incubação aguardando outras evidências?

**Contexto:**

- Insight cravado em `NEXT.md` durante PR3 (2026-05-21): conforme o runtime ganha superfície (`workflow`, `continue`, `continue <id>`, `workflow publish-state --status=...`), a CLI textual cresce em carga cognitiva.
- Critério original de promoção: "≥ 2 reviewers/contribuidores reportarem atrito concreto OU primeiro consumidor externo do framework chegar e reportar fricção".
- Durante PR5 (2026-05-22), owner mencionou múltiplas vezes que wizard CLI vai entrar na 0023 — sinal direto e repetido. Critério empírico de "promoção inequívoca" atingido pela própria voz do owner.
- Análise complementar: items 1.H.4/1.H.6/1.H.7 deferidos por incoerência com decisões F03+F04+ADR 0022. Spec 0023 corre risco de fechar com entrega user-facing fina mesmo após ter cravado todo o lifecycle metodológico e enforcement L2. Wizard CLI é a entrega visível significativa coerente com o que está cravado.

**Opções:**

| Opção | Descrição                                                                                        | Pró                                                                                                       | Contra                                                                                                                                                 |
| :---- | :----------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | Materializar wizard CLI mínimo no PR5 (5 opções fixas declarativas no boot do REPL).             | Entrega user-facing visível; valida pattern declarativo lookup-only; reduz carga cognitiva imediatamente. | Promove insight em incubação sem DEC formal prévia (este próprio DEC corrige isso); risco de scope creep se permitir auto-detecção/ranking/inferência. |
| B     | Manter insight em incubação aguardando mais evidência (≥ 1 consumidor externo reportar fricção). | Respeita princípio "promoção de sinais distribuídos" estritamente.                                        | Spec 0023 fecha sem entrega visível significativa; momentum de modernização da DX se perde.                                                            |
| C     | Materializar versão mais ambiciosa (wizard com integração handoff + dashboard preview).          | Visão "completa" do que vem.                                                                              | Antecipa candidatas `handoff-as-first-class` e `governance-dashboard-and-visual-artifacts` — escopo creep brutal; PR5 fica gigante.                    |

**Decisão do Gate Humano:**

- **Status:** [x] Resolved (PR5 S5, 2026-05-22)
- **Escolha:** [x] A | [ ] B | [ ] C
- **Justificativa:** o critério de promoção do insight (≥ 2 sinais distintos) foi atingido empiricamente — owner mencionou wizard explicitamente em pelo menos 3 turnos desta sessão como entrega esperada da 0023; o sinal não é mais distribuído, é dirigido. Adicionalmente, a deferral de 1.H.4/6/7 deixou a Spec 0023 com entrega user-facing fina — materializar o wizard agora preserva o senso de fechamento real da spec sem antecipar candidatas Now (handoff, dashboard, boilerplates).
- **Escopo cravado do wizard mínimo:**
  - 5 opções fixas declarativas exibidas no boot interativo do REPL (`workflow` sem argumentos):
    1. Continuar spec atual
    2. Continuar outra spec
    3. Publicar estado
    4. Ver specs ativas
    5. Diagnosticar drift
  - Cada opção mapeia 1:1 para um comando que já existe (`continue`, `continue <slug>`, `publish-state`, listagem do índice, `publish-state --diagnose` ou similar). Wizard é shell visual sobre comandos existentes, não nova engine de fluxo.
  - **Anti-patterns explicitamente vetados** (cf. memory `feedback-lookup-not-coordination`): auto-detecção de "próxima ação recomendada", NLP-lite, sugestão de spec mais relevante, ranking/ordering, autocomplete fuzzy de slug, qualquer inferência sobre intenção do humano.
  - REPL conversacional permanece **fora do escopo** (já cravado no NEXT.md como não-objetivo).
- **Critério de revisão futura:** se wizard for adotado por contribuidores externos OU se ≥ 1 sub-bloco da Spec 0024+ (qualquer slug) precisar de opção nova no menu, reabrir como DEC própria — decisão atual cobre apenas as 5 opções iniciais.
- **Data / Owner:** 2026-05-22 / @rosanarezende

---

### [DEC-0023-B07] Opção 6 do wizard (Gerar prompt visual) — entrega declarada do embrião visual + reafirmação do gate de B06

**Pergunta:** A opção 6 "Gerar prompt visual (para gerador de imagem externo)" foi adicionada ao wizard CLI durante o sub-bloco 1.H.12 sem reabrir DEC própria, ativando o critério auto-instituído de `[DEC-0023-B06]` ("≥ 1 sub-bloco precisar de opção nova → reabrir como DEC própria"). Como formalizar a adição já feita, honrar o gate de B06, e cravar framing canônico anti-agent-creep?

**Contexto:**

- **B06 cravou** (PR5 S5, 2026-05-22): wizard CLI mínimo = **5 opções fixas declarativas** + critério explícito: "se ≥ 1 sub-bloco precisar de opção nova no menu, reabrir como DEC própria". Anti-patterns vetados: auto-detecção, NLP-lite, ranking, sugestão de spec relevante, autocomplete fuzzy, inferência sobre intenção do humano.
- **1.H.12 adicionou opção 6 "Gerar prompt visual"** como embrião da candidata `governance-dashboard-and-visual-artifacts` (backlog `Now`). Implementação: wizard pergunta `tipo` (architecture-end-to-end / value-delivered / etc.) + `context` (texto livre); substitui `{{context}}` em template parametrizável de `.governance/visual-prompts/<tipo>.prompt.md`; imprime o prompt pronto entre delimitadores para copy-paste em ferramenta externa (Claude conversacional / Midjourney / DALL-E / Nano Banana / etc.). **Sem LLM no runtime** — geração de imagem acontece em ferramenta externa, manualmente, sob comando do humano (coerente com ADR 0018).
- **Drift detectado pelo Copilot review do PR #25** (2026-05-23): _"[DEC-0023-B06] define explicitamente 'wizard mínimo' como 5 opções fixas (lista 1–5), mas a implementação/help já expõe 6 opções. Para evitar drift entre governança e execução, ajuste o DEC ou crie um DEC separado para a opção extra e referencie-o."_ Achado correto — a 0023 está provando "governança viva + enforcement + anti-acreção silenciosa"; o sistema precisa obedecer seus próprios mecanismos mesmo quando inconveniente.
- **Tensão arquitetural identificada na revisão Codex+Claude+owner (2026-05-23):** se a primeira reabertura real do gate vira amendment-inline em B06, o critério vira letra morta — gate auto-instituído destruído no primeiro caso onde ele importa. DEC própria honra o mecanismo que B06 estabeleceu e preserva legitimidade para próximos casos.

**Opções:**

| Opção | Descrição                                                                                                                                                | Pró                                                                                                                                            | Contra                                                                                                                                                                                                  |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A     | **Amendment-inline em B06** (acrescenta opção 6 + nota sobre embrião)                                                                                    | Mais econômico em arquivos; narrativa mais compacta em um único DEC                                                                            | **Viola auto-prescrição de B06** ("reabrir como DEC própria"); enfraquece o gate exatamente no primeiro caso real onde ele importa; sinaliza que critérios da spec são negociáveis quando inconveniente |
| B     | **Novo `[DEC-0023-B07]` formal** (este DEC) — reconhece critério hit; crava opção 6 como entrega declarada do embrião; reafirma gate para próximos casos | Honra o mecanismo de B06; rastreabilidade auditável; preserva legitimidade do gate; framing anti-distorção dedicado; coerente com tese da 0023 | Mais um DEC no Bloco B; narrativa cresce um nó                                                                                                                                                          |
| C     | **Reverter opção 6** (remover do wizard; mover para PR futuro da candidata `governance-dashboard-and-visual-artifacts`)                                  | Disciplina máxima                                                                                                                              | Desperdiça implementação já dogfoodada e validada; ignora que o embrião foi proposital e mapeado à candidata Now                                                                                        |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [x] B | [ ] C
- **Justificativa:** B é a única forma honesta. A 0023 inteira está provando "governança viva, enforcement, anti-acreção silenciosa"; usar amendment-inline na primeira reabertura real de B06 destruiria o gate exatamente no momento em que ele importa. Acordo Codex+Claude+owner na sessão de revisão do Copilot review (2026-05-23). Reverter (C) seria disciplina vazia — o embrião é coerente com a candidata Now e validado por uso.
- **Opção 6 cravada como entrega declarada:**
  - **Item de menu:** `"6. Gerar prompt visual (para gerador de imagem externo)"`
  - **Comportamento:** wizard pergunta `tipo` + `context` (texto livre opcional); substitui `{{context}}` no template selecionado de `.governance/visual-prompts/<tipo>.prompt.md`; imprime entre delimitadores para copy-paste. **Sem LLM no runtime** — geração da imagem acontece em ferramenta externa, manualmente, sob comando humano.
  - **Genealogia:** embrião declarado da candidata `governance-dashboard-and-visual-artifacts` no backlog `Now` (cf. ADR 0023 — Meta-artefatos como SSOT YAML com derivações). Materialização completa do pipeline (build de meta-artifacts, dashboard HTML, regeneração determinística) fica para a spec dedicada quando a candidata abrir.
- **Framing canônico (cf. `[DEC-0023-E05]` anti-distorção):**
  - **"Embrião declarado"**, não "feature dashboard"; **"prompt parametrizável"**, não "AI-powered generation".
  - **Linguagem rejeitada:** ~~AI-powered visual generation~~, ~~auto-generated diagrams~~, ~~smart prompt engineering~~, ~~visual pipeline~~ (no sentido de tooling chain runtime), ~~LLM-assisted prompt~~.
  - **Critério de teste:** se a descrição da opção 6 soar como "feature de produto visual", voltar ao framing "embrião + copy-paste para ferramenta externa".
- **Gate de B06 reafirmado:**
  - Adição de qualquer **nova opção** (7+) ou **subitens** dentro de opções existentes continua exigindo DEC própria (`[DEC-0023-B08]` ou superior).
  - Anti-patterns continuam vetados explicitamente para opção 6: wizard **não infere** qual template visual usar (humano escolhe via prompt); **não autodetecta** contexto (humano fornece em texto livre); **não enriquece** o prompt com inferência (substitui literal de `{{context}}`).
- **Critério de revisita futura:**
  - Se wizard ganhar opção 7+, reabrir DEC dedicada.
  - Se opção 6 ganhar subitens (ex.: "regenerar último prompt", "diff de contexto vs último", "biblioteca de prompts gerados"), reabrir DEC dedicada.
  - **A 0023 NÃO acomoda opção 7 nesta janela** — qualquer novo item migra para a candidata `governance-dashboard-and-visual-artifacts` quando ela materializar.
- **Data / Owner:** 2026-05-23 / @rosanarezende

---

### Riscos conscientemente aceitos no PR2

- **Branch name dependency permanece** (`feat|fix|docs|chore|refactor/spec-NNNN-{slug}`). Documentado no README como convenção necessária. Não é prioridade até feedback externo reportar friction.
- **`AssembleBriefing` continua frágil** (cf. B02). Documentação explica a convenção atual; warning é a primeira linha de defesa.
- **`state.yml` em spec existente continua manual** (cf. B01). Bootstrap é PR3.
- **`NodeWorkflowFileSystem` coverage 9%** (sem integration test próprio). Integration test do dispatch (item G) cobre o caminho crítico end-to-end; coverage por arquivo só sobe com fixtures hermeticas em PR3+.
- **Spec piloto continua viva em branch** até merge para `main`. Examples folder substitui o piloto para consumidores via npm enquanto isso.

---

## Bloco F — Convergência taxonomy ↔ lifecycle (research aprovado 2026-05-19; F01–F05 Deferred temporariamente — revisita em S5 do PR5)

> **Origem:** investigação dedicada em [`research/lifecycle-architecture.md`](./research/lifecycle-architecture.md) — fechada em 299 linhas (dentro do cap absoluto 300). Identificou gap estrutural entre lifecycle cravado em Bloco D/E (spec-centric) e taxonomy MECE da Spec 0021 (7 pilares). Research convergiu em **invariantes universais leves** (accountability + traceability + outcome registration) + **lifecycle intent categories** (5 eixos de leitura: decision/learning/execution/operational-response/maintenance) + **runtime taxonomy-aware sem orchestration engine** + **enforcement universal leve**.
>
> **Owner aprovou o research em 2026-05-19** e cravou F1–F5 como base para DEC-0023-F\*; F6/F7 permanecem candidates (não promovidos agora). Decisões específicas dentro de cada Fxx ficam **Pendentes** — opções populadas do research §9 + recomendação inicial; gate humano por ponto a ser fechado em sessão dedicada, sem urgência de consumir convergência via expansão arquitetural imediata.
>
> **Deferimento temporário cravado em 2026-05-22 (PR5 — S1):** owner identificou que o estado "Pendente solto" desde 2026-05-19 viola o espírito de ADR 0021 item 7 (decisões estruturantes não ficam soltas — fechar, deferir formalmente com critério, ou empurrar para spec própria). F01–F05 estão temporariamente marcadas como `Deferred com critério: revisita obrigatória em S5 do PR5 (este mesmo PR), via POC visual neutra (uma decisão por vez)`. **NÃO empurrar para outro PR.** Após S5 do PR5, cada Fxx terá um destino final (Resolved / Deferred com critério estrutural / Moved to spec com slug).

### [DEC-0023-F01] `incident` permanece WorkItem ou vira `OperationalState`?

**Pergunta:** A categoria `incident` (Spec 0021 taxonomy MECE) é WorkItem no mesmo nível operacional que `spec`/`experiment`/etc., ou é operational state emergente que dispara WorkItems de outras classes?

**Contexto (research):**

- Research §3 (H1, hipótese prioritária): incident parece distinto operacionalmente — disparado por evento emergente, coordena resposta via outros pilares, tem `severity` (atributo de estado) ao invés de `outcome` (atributo de execução).
- Implicação: schema `registry.yml` + domain model `WorkItem.ts` podem precisar separar entity nova.

**Opções:**

| Opção | Descrição                                                                                                                                            | Pró                                                    | Contra                                                                      |
| :---- | :--------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------- | :-------------------------------------------------------------------------- |
| A     | **Manter WorkItem com flag especial** (`isOperationalState: true` ou similar)                                                                        | Zero refactor de schema; mudança incremental           | Continua categoria-erro estrutural — incident não se comporta como WorkItem |
| B     | **Separar como entity nova** (`OperationalState` em domain model)                                                                                    | Honestidade arquitetural; nomeia o gap empiricamente   | Refactor de `WorkItem.ts` + `registry.yml`; cross-spec impact               |
| C     | **Registry estável + runtime trata diferente** (incident continua em `registry.yml` como categoria; lifecycle/runtime modela como operational state) | Não revoga MECE; ajuste leve no runtime + boilerplates | Bifurcação semântica — registry diz uma coisa, runtime trata diferente      |

**Recomendação inicial (a confirmar pós-gate):** Opção C — preserva taxonomy MECE da Spec 0021 (que não está sendo reaberta), ajusta apenas o tratamento operacional sem revogar categoria. Alinhado com framing anti-recursão (§0.4 do research: taxonomy fica onde está; só operacionalização muda).

**Decisão do Gate Humano:**

- **Status:** [x] Resolved (PR5 S5, 2026-05-22, via POC visual neutra)
- **Escolha:** [ ] A | [x] B | [ ] C
- **Justificativa:** separar `incident` como entity nova (`OperationalState` no domain model) reconhece estruturalmente que classes diferentes têm ciclos de vida diferentes — coerente com a expectativa de implementação pilar a pilar, cada um com modelagem própria. A recomendação inicial C apoiava-se no argumento de que B reabriria a taxonomy MECE da Spec 0021; durante a POC, esse argumento foi corrigido: ADR 0010 estabelece que MECE classifica por **intenção de saída**, não por estrutura única em código — o framework inclusive já pratica particionamento estrutural via discriminated union `Dense | Virtual`. Logo, B estende um padrão existente, não reabre MECE. Argumentos adicionais que pesaram contra C: (a) C adia decisão estrutural inevitável para quando o segundo pilar for materializado; (b) acumula débito implícito de ramificação por `kind` no runtime; (c) honestidade do modelo é menor (registry e runtime divergem semanticamente).
- **Escopo cravado de B nesta fase (anti-premature-abstraction):**
  - `spec` e `incident`: bem definidos e implementados.
  - `experiment`, `spike`, `fix`, `patch`, `proposal`: modelagem mínima reservando espaço, sem implementação completa agora. Forma definitiva de cada um fica para quando o pilar for materializado de verdade.
- **Data / Owner:** 2026-05-22 / @rosanarezende

---

### [DEC-0023-F02] Boundary canônico por classe (lifecycle intent)

**Pergunta:** Cada lifecycle intent class tem seu boundary canônico próprio, ou compartilha `tasks.md` como boundary universal?

**Contexto (research):**

- Research §2.2 + §3–§6: cada classe (decision/learning/execution/operational-response/maintenance) tem comportamento distinto; `tasks.md` é boundary apenas da execution class.
- Anti-recursão guard §8.2: invariantes universais ≠ artifacts universais.

**Opções:**

| Opção | Descrição                                                                                                                                                                   | Pró                                                | Contra                                                       |
| :---- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------- | :----------------------------------------------------------- |
| A     | **Universal `tasks.md`** para todas as classes                                                                                                                              | Simples; um único contrato                         | Recria spec-centric drift; viola §8.2; overhead em fix/patch |
| B     | **Class-specific boundaries** (`spec` → tasks.md; `proposal` → decision-gate; `spike` → timebox; `experiment` → outcome; `fix`/`patch` → PR merge; `incident` → resolution) | Honra invariantes leves; preserva DevEx por classe | Runtime precisa rotear por classe (taxonomy-aware leve)      |

**Recomendação inicial:** Opção B — diretamente derivada da convergência do research §§5–6 e Síntese final. Boundary class-specific é a forma operacional dos invariantes universais sem forçar artifact uniforme.

**Decisão do Gate Humano:**

- **Status:** [x] Resolved (PR5 S5, 2026-05-22, via POC visual neutra)
- **Escolha:** [ ] A | [x] B
- **Justificativa:** boundary class-specific é a forma operacional dos invariantes universais sem forçar artifact uniforme. Coerente com F01 = B (cada classe ganha modelo próprio em código → cada classe ganha boundary próprio no lifecycle). A definição operacional fina de cada boundary exige research específica antes da implementação — em particular, `experiment` carrega complexidade adicional não capturada na descrição direcional desta decisão. Direção arquitetural cravada agora; definições finas ficam para o momento de implementação de cada pilar.
- **Boundaries listados são direcionais, não definitivos:**
  - `spec` → `tasks.md` (definição estável; já implementado).
  - `incident` → resolution (research específica entra junto com a implementação — F01 já cravou que será bem definido nesta fase).
  - `experiment` → outcome + métrica (placeholder direcional; research dedicada obrigatória dada a complexidade adicional sinalizada).
  - `spike` → timebox (placeholder direcional).
  - `fix` / `patch` → PR merge (placeholder direcional).
  - `proposal` → decision-gate (placeholder; classe Virtual sem `workspacePath` — pode dispensar boundary formal).
- **Pré-requisito cravado para implementação de qualquer classe ≠ spec:** research específica do boundary daquela classe (critérios + opções avaliadas + decisão), não inferida de F02.
- **Data / Owner:** 2026-05-22 / @rosanarezende

---

### [DEC-0023-F03] Boilerplates: por classe ou universal+slots?

**Pergunta:** Boilerplates adicionais (para os 6 pilares sem boilerplate próprio) nascem como arquivos dedicados por classe, ou como boilerplate universal com seções condicionais?

**Contexto (research):**

- Research §1.1: 6 dos 7 pilares sem boilerplate próprio (gap estrutural ativo).
- Anti-recursão §0.3: "redesign de boilerplates" está **fora** do escopo desta investigação; alterações pontuais podem decorrer de DEC-F\* aprovadas.

**Opções:**

| Opção | Descrição                                                                                                                                                      | Pró                                                   | Contra                                                           |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------- | :--------------------------------------------------------------- |
| A     | **Boilerplate dedicado por classe** (≥ 5 arquivos novos: proposal, spike, experiment, fix/patch combinado, incident)                                           | Cada classe ganha contrato visível e adaptado         | Mais arquivos para manter; risco de drift entre boilerplates     |
| B     | **Boilerplate universal com seções condicionais por classe**                                                                                                   | Um único arquivo de referência; consistência forçada  | Arquivo grande; condicionais aumentam carga cognitiva no consumo |
| C     | **`spec` mantém atual + classes leves (fix/patch/proposal/incident) sem boilerplate formal** (apenas convenções de commit/PR documentadas em `.core/process/`) | Mínimo viável; DevEx-friendly; respeita anti-recursão | Sem template para classes leves; convenção pode ser ignorada     |

**Recomendação inicial:** Opção C — alinhada com §8.4 (enforcement universal leve) + §0.5 (consumer-visible complexity como dívida prioritária). Classes leves não impõem boilerplate ao consumidor; convenção textual em `.core/process/` referenciada pelo runtime.

**Decisão do Gate Humano:**

- **Status:** [x] Resolved (PR5 S5, 2026-05-22, via POC visual neutra)
- **Escolha:** [x] A | [ ] B | [ ] C
- **Justificativa:** boilerplate dedicado por classe é a continuação coerente de F01 = B (modelo próprio em código) e F02 = B (boundary próprio no lifecycle). A tríade arquitetural F01+F02+F03 = B+B+A entrega coerência completa: cada classe tem modelo, boundary e template próprios. A recomendação inicial C estava calibrada para minimizar entrega de artefatos agora, mas três fatores deslocaram a decisão para A:
  - **(a) Mitigação do risco de drift via core comum.** Research §8.1 identifica invariantes universais leves (accountability + traceability + outcome registration) que podem ser extraídos como núcleo compartilhado entre boilerplates, reduzindo divergência entre instâncias.
  - **(b) Wizard CLI futuro reduz custo de escolha pelo consumidor.** Spec 0023 já carrega o insight `Wizard operacional mínimo` em `NEXT.md`; quando materializado, o wizard ajuda o consumidor a selecionar o boilerplate adequado por classe — então a coexistência de múltiplos templates deixa de ser "qual usar?".
  - **(c) Pacote npm permite versionamento explícito.** Boilerplates como artefatos versionados de package facilitam manutenção e propagação de mudanças via `adopt`, em vez de exigir edição manual em cada consumidor.
- **Pré-requisitos cravados para implementação de A:**
  - Refresh do boilerplate atual de `spec` — nasceu em contexto anterior à existência do CLI, do workflow runtime e do wizard. Conceitos podem estar desalinhados ao framework atual.
  - Identificação e extração da parte core comum entre boilerplates (invariantes universais leves do research §8.1).
  - Estratégia de versionamento de boilerplates pós-npm: como mudanças se propagam para consumidores via `adopt`; semver dos templates; compatibilidade entre versões.
- **Vínculos cruzados:** estes três pré-requisitos compõem a candidata `boilerplate-system-modernization` no backlog (slug per ADR 0017). Implementação completa de boilerplate por classe depende dessa candidata materializada.
- **Data / Owner:** 2026-05-22 / @rosanarezende

---

### [DEC-0023-F04] Runtime taxonomy-aware: `DetectActiveSpec` → `DetectActiveWorkItem`?

**Pergunta:** A função de detecção de spec ativa do runtime evolui para detectar qualquer pilar ativo, e como?

**Contexto (research):**

- Research §1.3: `DetectActiveSpec` hoje hardcoded em `.governance/specs/` + `.specify/specs/`; não detecta outros pilares.
- Anti-recursão §8.3: runtime taxonomy-aware **sem** orchestration engine — detecção + roteamento, não orquestração.

**Opções:**

| Opção | Descrição                                                                                                                                        | Pró                                                | Contra                                                |
| :---- | :----------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------- | :---------------------------------------------------- |
| A     | **Múltiplos paths** (`.governance/{specs,proposals,spikes,...}/{slug}`)                                                                          | Topologia espelha taxonomy; descoberta literal     | 5+ diretórios novos no consumidor; visibility alta    |
| B     | **`WorkItem.kind` derivado** de path único `.governance/items/{slug}` + frontmatter declarando kind                                              | Único diretório; visibility leve no consumidor     | Frontmatter parsing adicional; convention obrigatória |
| C     | **Double-lookup por classe com fallback** (mantém `specs/` + adiciona descoberta opcional por classe quando branch name ou frontmatter sinaliza) | Compatibilidade com estado atual; migração gradual | Lógica de detecção fica mais ramificada               |

**Recomendação inicial:** Opção C — preserva trabalho do PR1 (DetectActiveSpec funcional para `spec`) e adiciona detecção das outras classes incrementalmente. Anti-recursão §8.3 satisfeita: detecta + roteia, sem orquestrar.

**Decisão do Gate Humano:**

- **Status:** [x] Resolved (PR5 S5, 2026-05-22, via POC visual neutra)
- **Escolha:** [x] A | [ ] B | [ ] C
- **Justificativa:** múltiplos paths por classe é a continuação coerente da tríade arquitetural F01+F02+F03 = B+B+A. Cada classe agora ganha modelo próprio em código (F01), boundary próprio no lifecycle (F02), template próprio (F03) e diretório próprio no consumidor (F04) — F01+F02+F03+F04 = B+B+A+A. Topologia do filesystem espelha a taxonomy MECE; descoberta é literal (o caminho é o tipo) sem necessidade de parsing de frontmatter ou ramificação implícita. A recomendação inicial C apoiava-se em migração gradual e preservação do trabalho do PR1; durante a POC, esses argumentos foram pesados contra a coerência arquitetural completa — C deixa o sistema em estado híbrido permanente (parte por path, parte por sinal lateral), enquanto A entrega topologia consistente.
- **Custo aceito (visibility alta no consumidor):** consumidor passa a ver 5+ diretórios em `.governance/`. Mitigação pelas mesmas alavancas de F03:
  - Wizard CLI futuro guia o consumidor para o diretório correto por classe.
  - Pacote npm via `adopt` cria a topologia automaticamente; usuário não precisa entender estrutura completa para começar.
  - Diretórios só ganham conteúdo quando uma classe é efetivamente instanciada (vazio é estado válido — não polui mentalmente).
- **Pré-requisitos cravados para implementação efetiva:**
  - `DetectActiveSpec` permanece funcional para `spec` no estado atual; estender para detectar outras classes é trabalho da candidata `boilerplate-system-modernization` (que materializa os boilerplates por classe) acoplada à implementação do pilar específico.
  - Renomeação de `DetectActiveSpec` para `DetectActiveWorkItem` (ou nome equivalente) é decisão de spec futura; F04 fixa o **modelo de descoberta** (múltiplos paths), não o **nome da função**.
  - Coexistência de `.governance/specs/` (já populado) com novos diretórios é trivial — paths não interferem entre si.
- **Vínculos cruzados:** candidata `boilerplate-system-modernization` no backlog cobre os pré-requisitos de F03+F04 simultaneamente (boilerplates + paths são duas faces da mesma materialização por classe).
- **Data / Owner:** 2026-05-22 / @rosanarezende

---

### [DEC-0023-F05] CORE-09/10: ADR formal ou agent rule?

**Pergunta:** As regras CORE-09 (PR Draft) e CORE-10 (Ready após revalidação) ganham ADR perene formal ou permanecem como agent rules em AGENTS.md?

**Contexto (research):**

- Research §7: CORE-09/10 enunciam caso particular de accountability + traceability — princípio estrutural, mas com formato L1 (agent rule) já adequado em alguns contextos.
- Convergência: permanecem L1 **e** ganham ancoragem em ADR — convivem em camadas.

**Opções:**

| Opção | Descrição                                                                                                                 | Pró                                                  | Contra                                                    |
| :---- | :------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------- | :-------------------------------------------------------- |
| A     | **ADR 0022 nova** dedicada (princípio formalizado), com cross-ref a ADR 0021                                              | Princípio cravado; cross-ref consistente; auditável  | Mais um ADR para manter                                   |
| B     | **AGENTS.md + nota ADR no rodapé** (regra continua em AGENTS.md com referência cruzada a ADR 0021)                        | Mínimo possível; aproveita ADR 0021 existente        | Nota é menos visível que ADR dedicada                     |
| C     | **Regra L1 em AGENTS.md + complemento detalhado em `.core/process/`** (princípio textual + operacionalização documentada) | Distribuição em camadas explícita; clareza por nível | Mais um arquivo em `.core/process/`; risco de redundância |

**Recomendação inicial:** Opção B — minimal; respeita anti-recursão §8.4 (enforcement leve). ADR 0021 já cobre o princípio canônico; cross-ref no rodapé de CORE-09/10 em AGENTS.md fecha o loop sem inflar ADRs.

**Decisão do Gate Humano:**

- **Status:** [x] Deferred com critério estrutural — revisita obrigatória na abertura da candidata `handoff-as-first-class` (cf. backlog `Now`).
- **Escolha:** [ ] A | [ ] B | [ ] C
- **Justificativa:** ADR 0022 reposicionou CORE-09/10 como **regras situacionais** — aplicam em momento específico (na hora de abrir PR ou converter Draft→Ready), não como invariantes pré-distribuídas. O handoff (canal de entrega cravado em ADR 0022) tem o papel de apresentar contextualmente essas regras quando o agente está em ponto de PR. Decidir agora onde mora a SSOT do princípio (ADR nova vs nota cruzada vs distribuição em camadas) antes de o canal de entrega estar materializado seria escolher forma sem ter comportamento real para validar contra. O critério de fechamento adia a escolha para o momento em que o handoff for materializado — aí a decisão de SSOT pode ser tomada com evidência de como o canal trata regras situacionais (qual nível de profundidade ele cita, quais fundamentos ele invoca, se uma ADR dedicada agrega ou polui).
- **Critério estrutural de revisita (observável, não "talvez depois"):** abertura da spec que materializa `handoff-as-first-class` carrega obrigação de revisitar F05 e fechar como Resolved (A/B/C) ou como novo Deferred com critério mais específico. Sem essa abertura, F05 permanece em Deferred estrutural. Conforme ADR 0021 item 7, deferimentos exigem critério observável — esse critério aqui é "abertura da spec X", evento concreto auditável.
- **Posição enquanto deferred:** CORE-09/10 continuam funcionando como agent rules em AGENTS.md (status quo); ADR 0021 continua sendo fundamento implícito; sem inflar ADRs, sem novo arquivo em `.core/process/`. Equivalente operacional à Opção B até que F05 ganhe destino final.
- **Data / Owner:** 2026-05-22 / @rosanarezende

---

### Candidatos não promovidos (mantidos no research §9, não Pendentes em Bloco F)

- **F6 candidate** — visibilidade arquitetural (consumer vs maintainer) como ADR perene. Owner sinalizou interesse explícito mas decidiu manter como candidate (não promover agora). Reabrir quando ≥ 2 decisões F\* invocarem o princípio em conflito.
- **F7 candidate** — schema do `state.yml` ganha `kind` derivado para não-spec pilares. Dependente de F04 (sem direção definida no runtime, schema é prematuro).

---

## Bloco G — Índice operacional público mínimo para continuidade cross-machine

> **Origem:** experimento empírico de 2026-05-21 ao trocar de máquina. A próxima IA, operando em `main`, conseguiu inferir que a Spec 0023 existia apenas enumerando branches remotas e usando `git show` nos artifacts da branch ativa. A pergunta-bússola devolvida pela IA ("`main` ou checkout da branch da spec?") expôs a falha central da promessa da 0023: sem um índice público em `main`, `yarn workflow` não tem como descobrir por conta própria qual spec está ativa, em qual stage está e qual branch deve consultar.
>
> **Guardrail central:** este bloco distingue **três gêneros** para evitar shadow-spec em `main`:
>
> 1. **Artefato normativo da spec** — `spec.md`, `plan.md`, `tasks.md`, `decision-brief.md`, `NEXT.md`, `research/` (merge atômico no fechamento, cf. ADR 0020).
> 2. **State operacional efêmero** — presença da spec ativa, branch, stage, status e timestamp público mínimo.
> 3. **Projeção/runtime derivado** — briefing/menu/output do `workflow`, computado a partir do índice público e enriquecido pela leitura da branch da spec quando necessário.
>
> O índice público **não** pode carregar escopo, critérios de aceite, `next[]`, `[DEC-*]`, rationale, checklist fino, debts ou texto livre longo. Se carregar, recria merge incremental da spec por canal lateral e corrói ADR 0020 na prática.

### [DEC-0023-G01] Separação semântica: artefato normativo vs state efêmero vs runtime derivado

**Pergunta:** O achado do dogfooding 2026-05-21 deve ser tratado como ausência de documentação da spec, ou como ausência de um gênero operacional distinto do artefato normativo?

**Contexto:**

- ADR 0020 protege o merge atômico da spec: work-in-progress não deve vazar para `main` como contrato fragmentado.
- O experimento mostrou que, sem qualquer índice público em `main`, `yarn workflow` não consegue cumprir a promessa de descoberta/continuidade.
- Se `main` passar a carregar resumo normativo da spec, ADR 0020 apodrece lateralmente: reviewer começa a confiar no state público para entender "o que a spec é", e a branch vira apêndice denso.

**Opções:**

| Opção | Descrição                                                                                           | Pró                                                          | Contra                                                               |
| :---- | :-------------------------------------------------------------------------------------------------- | :----------------------------------------------------------- | :------------------------------------------------------------------- |
| A     | **Branch-only**: manter todo estado de trabalho apenas na branch da spec.                           | ADR 0020 permanece simples; zero artefatos novos em `main`.  | `workflow` em `main` continua cego; humano segue repetindo contexto. |
| B     | **Separar 3 gêneros**: artefato normativo, state operacional efêmero e runtime derivado.            | Resolve descoberta em `main` sem transformar `main` em spec. | Exige contrato explícito e disciplina para não inflar o índice.      |
| C     | **Publicar a spec incrementalmente** em `main` (state + resumo semântico + checklist de progresso). | `main` fica autoexplicativo para qualquer agente/humano.     | Viola ADR 0020 na prática; recria merge incremental da spec.         |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [x] B | [ ] C
- **Justificativa:** O problema descoberto não é "mais docs na branch"; é ausência de um índice operacional público mínimo em `main`. A separação tripla preserva ADR 0020 desde que o índice permaneça não-normativo.
- **Data / Owner:** 2026-05-21 / @rosanarezende

---

### [DEC-0023-G02] Estrutura física e contrato mínimo do índice público

**Pergunta:** Onde o índice operacional público deve viver e com que forma?

**Contexto:**

- O experimento mostrou que o runtime precisa de **descoberta rápida** em `main`, antes de qualquer checkout manual.
- `living-docs.yml` e `registry.yml` têm vocação mais estável/ontológica; misturar telemetria efêmera ali tende a confundir gêneros.
- Um diretório por spec (`active-states/<spec>.yml`) espelha o problema atual em menor escala e aumenta churn estrutural.

**Opções:**

| Opção | Descrição                                                                            | Pró                                                       | Contra                                                       |
| :---- | :----------------------------------------------------------------------------------- | :-------------------------------------------------------- | :----------------------------------------------------------- |
| A     | **`.governance/active-states/<spec>.yml`** — um arquivo por spec ativa.              | Óbvio de navegar; mutação localizada por spec.            | Mais arquivos/dirs; custo de listagem; mais churn estrutural |
| B     | **`.governance/runtime/active-specs.yml`** — índice único com lista de specs ativas. | Telemetria concentrada; leitura simples; fácil de validar | Um arquivo compartilhado pode conflitar em specs paralelas   |
| C     | **Absorver em `living-docs.yml` ou `registry.yml`**.                                 | Reaproveita artefato existente.                           | Mistura ontologia/documentação com telemetria efêmera        |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [x] B | [ ] C
- **Justificativa:** `.governance/runtime/active-specs.yml` comunica claramente que se trata de artefato operacional executado por código, não de documentação normativa. O contrato mínimo fica fechado a: `id`, `slug`, `branch`, `stage`, `status`, `spec_path`, `updated_at`; campos auxiliares opcionais (`title`, `base_branch`, `source_state_path`, `updated_by`, `last_sync_commit`) são aceitos. Critérios de aceite, `next[]`, `[DEC-*]`, rationale, checklist, debts e texto longo são **proibidos**.
- **Data / Owner:** 2026-05-21 / @rosanarezende

---

### [DEC-0023-G03] Estratégia de sync: manual primeiro, automação depois

**Pergunta:** Como publicar/atualizar o índice público sem introduzir automação prematura ou drift invisível?

**Contexto:**

- A solução final pode incluir hooks, PRs pequenos de state ou automação por CI, mas isso ainda não foi validado empiricamente.
- O risco imediato não é falta de automação; é falta de contrato operacional mínimo.
- O source of truth continua sendo o `state.yml` interno da spec + artifacts normativos da branch ativa.

**Opções:**

| Opção | Descrição                                                                                  | Pró                                               | Contra                                                            |
| :---- | :----------------------------------------------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------------- |
| A     | **`yarn workflow publish-state` manual primeiro**; automação/hook só após dogfooding real. | Menor custo; valida o contrato antes da automação | Exige disciplina humana explícita; risco inicial de esquecimento  |
| B     | **PR/commit incremental em `main` a cada transição** já na primeira iteração.              | `main` sempre atualizado de forma visível         | Custo cognitivo alto; dual-track de PRs antes de validar o modelo |
| C     | **Hook/CI/auto-sync desde o início**.                                                      | Reduz intervenção humana futura                   | Overengineering; difícil depurar antes do primeiro caso real      |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [x] A | [ ] B | [ ] C
- **Justificativa:** A primeira iteração precisa provar o contrato, não a automação. `publish-state` explícito permite dogfooding controlado; hooks, drift guards automáticos e PRs de state só entram depois que o índice mínimo se mostrar útil na troca real de sessão/máquina.
- **Data / Owner:** 2026-05-21 / @rosanarezende

---

### [DEC-0023-G04] Vocabulário canônico stage/status do índice público + regra de projeção

**Pergunta:** O primeiro `active-specs.yml` (commit `eab20f9`) introduziu enums locais (`stage: "C"`, `status: "implementation_in_progress"`) sem decisão registrada. Como fechar vocabulário antes que `publish-state` consolide a divergência?

**Contexto:**

- `state.yml` interno usa `stage ∈ {discovery, decision, planning, implementation, closing}` per `[DEC-0023-A04]`.
- O primeiro `active-specs.yml` adotou letras (`A/B/C`) do narrative do `spec.md` § Stage 1/Stage 2 e cunhou `implementation_in_progress` ad-hoc — acreção silenciosa em campo opcional, exatamente o anti-pattern que `implicit-structural-decisions` craveia como dívida a evitar.
- Sem vocabulário fechado, `publish-state` (1.E.5) projeta `state.yml` → índice por mapping ambíguo; drift guard mínimo do PR3 não tem o que validar; cada nova spec instanciada pode inventar enum próprio.

**Decisão:**

- **`stage` = posição no lifecycle.** Enum compartilhado com `state.yml.stage` per `[DEC-0023-A04]`: `{discovery, decision, planning, implementation, closing}`. **Projeção direta, sem tradução semântica** — `active-specs.yml.stage` é cópia literal de `state.yml.stage`.
- **`status` = condição operacional atual.** Enum dedicado do runtime público: `{active, blocked, paused, completed}`. **`stage` e `status` são dimensões independentes** — `status` **não deriva** de `stage`. Exemplo válido: `stage: implementation` + `status: blocked` (implementação iniciada, atualmente bloqueada por decisão externa).
  - **`status` NÃO representa avanço de lifecycle** — representa apenas condição operacional transitória da spec dentro do `stage` atual.
  - **Mudanças de `status` NÃO implicam mudança de `stage`.**
  - **Mudanças de `stage` podem ocorrer sem mudança de `status`.**
  - Qualquer interpretação futura de que "`status` é subcategoria de `stage`" ou "`status` pode ser inferido de `stage`" é explicitamente rejeitada por esta decisão.
- **`status` não é projetado de `state.yml`** (não há campo equivalente; `state.yml.gate.status ∈ {open, awaiting-review, closed}` refere ao gate do brief, é conceito distinto). Na primeira iteração, `publish-state` declara `status` manualmente; semântica fechada de cada valor:
  - `active`: trabalho em andamento na branch da spec.
  - `blocked`: aguardando decisão externa / dependência não resolvida.
  - `paused`: deferred conscientemente, com critério de revisita observável.
  - `completed`: mergeado em `main`; spec encerrada.
- **`updated_by`:** convenção textual — registra **quem autorizou/publicou** o estado, **não** quem digitou nem qual agente IA executou. Evita pseudo audit-log de agente e mistura de identidade humana com operacional.
- **Acreção rejeitada:** qualquer campo novo no índice público além do mínimo cravado em `[DEC-0023-G02]` + os enums fechados acima exige decisão própria. Valores como `implementation_in_progress`, `wip`, `in-progress` ou similares são **proibidos** — `status: active` cobre o conceito.

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Justificativa:** Vocabulário fechado **antes** de `publish-state` consolidar a divergência. Decisão pequena, cirúrgica, derivada direto de `[DEC-0023-A04]` + `[DEC-0023-G02]` — não abre Bloco H, não expande research, não invalida G01..G03. Separação explícita `stage`/`status` (lifecycle vs condição operacional) impede no nascedouro a interpretação de que `status` poderia ser inferido de `stage`. Convenção de `updated_by` resolve ambiguidade observada no commit `eab20f9` sem virar DEC própria.
- **Data / Owner:** 2026-05-21 (II) / @rosanarezende

---

### Riscos conscientemente aceitos no Bloco G

- **Branch drift:** o índice público pode apontar para branch que foi renomeada/rebased. Mitigação inicial: `last_sync_commit` opcional + publish-state explícito; automação só depois do primeiro dogfood real.
- **Múltiplas branches da mesma spec:** o índice pode perder qual branch é a "canônica" da spec ativa. Mitigação inicial: contrato mínimo permite apenas uma `branch` pública por spec; casos de stack paralela reabrem decisão própria.
- **Source-of-truth reverso:** humanos/agentes podem editar `active-specs.yml` manualmente e tratá-lo como verdade. Mitigação: contrato e docs deixam explícito que a verdade segue no `state.yml` interno + artifacts normativos da branch.
- **Operational spam:** PRs pequenos de state em `main` desde a primeira iteração podem aumentar ruído. Mitigação: rejeitado por `[DEC-0023-G03]`; manual first.
- **False confidence:** agente pode achar que o índice público basta e pular leitura da branch da spec. Mitigação: runtime futuro deve deixar explícito que o índice serve para descoberta/navegação, não para substituir briefing normativo.

---

### [DEC-0023-G05] Escopo do active-specs.yml: minimal canonical projection, não coordination source-of-truth

> **Origem:** dogfooding de fechamento da 0023 (2026-05-24, reconciliação pré-Integration PR). Ao reconciliar o `tasks.md`, `publish-state` dropou `title` e `base_branch` do `active-specs.yml` — campos injetados manualmente, ausentes do `state.yml` 4-chave. A queda levantou a pergunta arquitetural: o índice virou source-of-truth operacional durante o crescimento do runtime (Bloco L)?

**Pergunta:** O `active-specs.yml` continua oficialmente uma projeção mínima navegável, ou a 0023 formaliza um "operational coordination projection" que persiste topologia de stack (`base_branch`) e metadados (`title`)?

**Contexto:**

- Auditoria de consumo (2026-05-24): nenhum campo além do tier canônico (`id`, `slug`, `branch`, `stage`, `status`, `spec_path`) é lido por lógica de runtime. `renderActiveSpecsIndex` usa `slug`/`branch`/`stage`/`status`; `MergeStack` lê `pr.baseRefName` **via `gh`**, não do índice (detecção de stack é responsabilidade do CLI via PR numbers); `title` é redundante com `slug` (`AssembleBriefing` faz `title ?? slug`).
- `title`/`base_branch` são **opcionais no schema desde a origem** (`activeSpecsSerializer`); `publish-state` só os escreve a partir de input explícito (manual-first, `[DEC-0023-G03]`).
- Promover `base_branch` a campo persistido exigiria `publish-state` **inferir topologia de stack** — violando silenciosamente `[DEC-0023-G03]`.

**Decisão:**

- **O `active-specs.yml` permanece minimal canonical projection.** O tier canônico (`id`, `slug`, `branch`, `stage`, `status`, `spec_path`) é o único consumido operacionalmente e o único garantido por `publish-state`.
- **`title`/`base_branch` permanecem opcionais e NÃO são auto-derivados/persistidos.** Sua queda na republicação é correta — convergência à forma canônica, não regressão. Não há lógica de "preserve on republish": campo não-canônico ausente é o estado esperado.
- **Source-of-truth operacional da stack é `gh`/git**, consultado pelos use cases (Bloco L) em runtime — não o índice. O índice é projeção de descoberta/navegação, não coordenador de stack.

**Gatilho de revisita → "coordination source-of-truth":** se um use case passar a consumir campos do índice **para tomada de decisão operacional** (e não apenas renderização/display) — ex.: `MergeStack` lendo `base_branch` do índice para ordenar a stack — reabrir como DEC própria. Esse é o limite entre projeção e source-of-truth: persistir o campo passaria a exigir derivação/inferência hoje vetada por `[DEC-0023-G03]`.

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Justificativa:** distingue "runtime cresceu operacionalmente" (verdadeiro, Bloco L) de "índice virou source-of-truth operacional" (falso — topologia vem de `gh`/git por design). Mantém `[DEC-0023-G03]` íntegro, evita expansão ad-hoc de schema e nomeia o estado futuro com gatilho observável em vez de deferir informalmente. Estende `[DEC-0023-G04]` (regra de projeção); relaciona `[DEC-0023-L01]` (use cases de stack via `gh`).
- **Data / Owner:** 2026-05-24 (II) / @rosanarezende

---

## Bloco C — Saúde Técnica e Dívidas Associadas

### [DEC-0023-C01] Saúde arquitetural e dívidas técnicas

**Pergunta:** Qual é o estado do componente que implementará esta spec, e quais dívidas pré-existentes podem impactar o escopo?

**Contexto (research):**

- Foundation DDD em `src/` consolidada pela Spec 0021 (domínio, app, infrastructure, adapters CLI).
- CLI mjs em `cli/` é herança arquitetural pré-DDD; coexiste com `src/` via TemplateEngine compilada em `dist/`.

**Eixos a decidir:**

1. Saúde Arquitetural do componente principal.
2. Dívidas técnicas pré-existentes.
3. Estratégia de validação e qualidade.

#### Sub-eixo 1 — Saúde Arquitetural

- **B (Requer Refatoração tática)**. `src/` está saudável para receber `domain/workflow/`, `app/workflow/`, `adapters/cli/workflow/`. `cli/` continua sendo herança — esta spec **não** mexe em `cli/` além de adicionar um delegate. A refatoração maior de `cli/` é escopo da Spec 0022 (paused).

#### Sub-eixo 2 — Dívidas Técnicas

- **B (Dívidas contidas)**. A duplicação `cli/` ↔ `src/` é dívida conhecida (objeto da 0022). Nesta spec é **contornada** via bridge no entrypoint; não exacerbada.

#### Sub-eixo 3 — Estratégia de Validação

- **C (Suíte de Testes Formal)**. BDD pt-BR colocado, coverage gates, mutation testing. Aplicar ao código novo de workflow.

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Sub-eixo 1:** [ ] A | [x] B | [ ] C
- **Sub-eixo 2:** [ ] A | [x] B | [ ] C
- **Sub-eixo 3:** [ ] A | [ ] B | [x] C
- **Justificativa / Ressalvas:**
  > A spec **não** absorve a 0022. Bridge no entrypoint é o único toque em `cli/`. Toda lógica nova em `src/` segue padrão DDD + BDD pt-BR consolidado pela 0021.
- **Data / Owner:** 2026-05-19 / @rosanarezende

---

## Bloco D — Lifecycle metodológico humano-IA (bootstrap declarado)

> **Sessão de decisão 2026-05-19, segunda metade.** A execução do PR1 + abertura do PR2 revelou que o runtime estava operando sobre um lifecycle nunca cravado. Owner identificou pattern: "decisões estruturais emergindo implícita durante implementação" — o mesmo anti-pattern que a 0023 original tentava nomear, agora vivo na própria 0023. Esta investigação retoma o discovery legado (P1–P10 do `research.md` legacy) e crava o lifecycle operacional como modelo executável.
>
> **Auto-referência declarada:** este Bloco D introduz o modelo. A PR2-lifecycle que o materializa é necessariamente **bootstrap pre-model** — não dá pra aplicar o modelo à própria introdução do modelo. A partir de PR3 em diante, modelo aplica estritamente.

### [DEC-0023-D01] Lifecycle metodológico de 4 fases + `tasks.md` como boundary canônico

**Pergunta:** O lifecycle humano-IA tem quantas fases distintas, e qual é o artifact que oficialmente autoriza execução?

**Contexto:**

- PR1 atravessou `discovery → decision → execution` sem `plan.md`/`tasks.md` como artifacts separados. Stage "planning" foi colapsado em "decision".
- PR2 abriu Bloco B (decisões de escopo) e imediatamente abriu 10 tasks de execução no mesmo movimento — sem que um gate de **planning** explícito tivesse acontecido. Decisões de escopo ≠ decomposição operacional.
- Owner observou: "planning ainda não é implementação. Mas também não é mais discovery. Planning parece o verdadeiro boundary intermediário entre thinking e execution."

**Opções:**

| Opção | Descrição                                                                                                                                                                                 | Pró                                                                                                            | Contra                                                                               |
| :---- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| A     | **3 fases** (discovery → decision → execution). Modelo implícito que estava operando.                                                                                                     | Mais simples.                                                                                                  | Colapsa planning em decision; permite que execução comece sem decomposição aprovada. |
| B     | **4 fases** (discovery → decision → planning → execution) com gates explícitos entre cada. `tasks.md` é boundary canônico: execução autorizada **se e só se** `tasks.md` aprovado existe. | Separa direção (decision) de decomposição (planning); boundary observável e falsificável; elimina ambiguidade. | Mais um gate; risco residual de virar ceremony.                                      |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [x] B
- **Justificativa:** Planning é categoria distinta de Decision. Decision responde "qual direção?"; Planning responde "qual decomposição operacional, em qual ordem?". Aprovar uma não implica aprovar a outra. `tasks.md` como boundary é observável (existe / não existe), falsificável (Gate 3 humano aprovou explicitamente / não) e elimina decisão implícita "aprovou direção → execução autorizada".

> **Nota importante:** `tasks.md` **não é checklist operacional**. É **artifact de autorização de execução**. Sua presença + aprovação humana (Gate 3) é o sinal canônico de que rollout/decomposition foi aceito e implementação está autorizada. Checklist operacional vive em `plan.md § DoD`. Diferença fundamental.

- **Data / Owner:** 2026-05-19 / @rosanarezende

---

### [DEC-0023-D02] Forma de PR no git: stacked + CI mínimo

**Pergunta:** Como traduzir o lifecycle conceitual em mecânica git/GitHub?

**Contexto:**

- Git/GitHub modela PR como "unidade de merge". Não existe primitiva nativa para "PR aprovado que não vai para main ainda".
- Três padrões mapeados em sessão de design 2026-05-19: A (RFC-em-git: PR-thinking mergea isolado), B (stacked PRs: PR-execution sobre base PR-thinking), C (Contract PR com CI de drift detection).
- Owner observou: "o merge final só acontece ponta a ponta. PR-thinking sozinho NÃO representa software pronto."

**Opções:**

| Opção | Descrição                                                                                                       | Pró                                                                                                               | Contra                                                                                             |
| :---- | :-------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| A     | **RFC-em-git**: PR-thinking mergea como documentação; PR-execution depois referencia.                           | Funciona com git nativo; trilha limpa em `main`.                                                                  | `main` recebe "specs aprovadas, código não-existente"; requer disciplina humana para fechar ciclo. |
| B     | **Stacked PRs reais**: PR-execution tem PR-thinking como base branch. Ambos devem mergear; merge ponta a ponta. | Modela exatamente a intenção; thinking e execution acoplados; reviewers externos veem contrato + execução juntos. | Stacking pain (rebase em cadeia); GitHub UI sem suporte nativo.                                    |
| C     | **Contract PR + CI custodiante**: PR-thinking permanent draft; CI valida referência + drift detection.          | Máxima proteção contra divergência.                                                                               | Projeto significativo de tooling (drift detection é não-trivial); risco de virar workflow engine.  |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [x] B (estrutural) + parte leve de C (CI mínimo de linkagem) | drift detection profundo de C **deliberadamente diferido**
- **Justificativa:** Mecânica B (stacked PRs reais) aderente ao "merge ponta a ponta" + força stacking pain explícito desde o início (descoberta de friction real, não conceitual). CI mínimo de linkagem (parte leve de C) protege contra desuso. Drift detection completo é projeto separado — risco real de virar workflow engine se acoplado agora. **Esta diferição é deliberada, não esquecimento** — registrada explicitamente.
- **Data / Owner:** 2026-05-19 / @rosanarezende

---

### [DEC-0023-D03] CI mínimo: script versionado + GitHub workflow

**Pergunta:** Qual mecanismo de enforcement do contrato stacked-PR?

**Opções:**

| Opção | Descrição                                                                                                                                | Pró                                                   | Contra                                                            |
| :---- | :--------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------- | :---------------------------------------------------------------- |
| A     | **Convenção textual**: PR-execution declara "Depends on #N"; reviewer humano valida.                                                     | Zero código.                                          | Cai por desuso; perde força operacional rápido.                   |
| B     | **Check script versionado**: GitHub Action lê PR body, valida referência via `gh api`, valida existência de `tasks.md` na governance PR. | Versionado; auditável; custo baixo; enforcement real. | Mais código; depende de `gh CLI` no ambiente CI.                  |
| C     | **Branch protection + check git-side**: branch da execução **deve** ter base = branch da thinking. Check via `git merge-base`.           | Aderência total ao modelo B literal.                  | Configuração depende de GitHub UI (fora do repo); menos portável. |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [x] B | [ ] C
- **Justificativa / Escopo do enforcement:** valida exatamente isto, e **nada mais**:
  > 1. PR-execution declara dependência explícita (marcador `Depends on #N (governance)` no body).
  > 2. Governance PR #N existe.
  > 3. Governance PR #N está aberto ou aprovado (não closed/rejected).
  > 4. Governance PR #N contém `tasks.md` no diff (em `.governance/specs/*/tasks.md` ou equivalente).
  >
  > **Para aí.** Sem drift semântico. Sem mapping arquivos↔tasks. Sem inferência de intenção. Sem análise de cobertura. Framing canônico: **"CI mínimo de integridade estrutural"**, não "engine de enforcement". Expansão deste check requer decisão própria (não acreção silenciosa).
- **Data / Owner:** 2026-05-19 / @rosanarezende

---

### [DEC-0023-D04] PR1 da 0023 como pre-model declarado

**Pergunta:** Aplicar o modelo retroativamente aos 6 commits já existentes em `feat/spec-0023-workflow-runtime`?

**Contexto:**

- PR1 contém pivot + runtime + gate Bloco B em commits razoavelmente segmentados (2 docs, 3 código, 1 docs).
- Branch ainda não foi mergeada em `main` — git surgery seria viável.

**Opções:**

| Opção | Descrição                                                                                                                    | Pró                                                                        | Contra                                                                     |
| :---- | :--------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------- | :------------------------------------------------------------------------- |
| A     | **Aceitar PR1 como pre-model declarado**. Modelo aplica de PR2-lifecycle em diante. Documentado em CHANGELOG/decision-brief. | Honestidade histórica; zero git surgery; trilha de aprendizado preservada. | "Mancha histórica" registrada (não-conformidade declarada).                |
| B     | **Splitar PR1 retroativamente** em branch `*-thinking` (docs commits) + `*-execution` (code commits) stacked.                | Aderência total ao modelo desde o início.                                  | ~30min git surgery; reescrita artificial da trilha; cosplay de governança. |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [x] A | [ ] B
- **Justificativa:** Owner: "a 0023 inteira é dogfooding; o modelo estava emergindo; o próprio colapso entre thinking/execution foi o que revelou o problema. Git surgery retroativa é cosplay de governança." Honestidade histórica > aderência artificial.
- **Data / Owner:** 2026-05-19 / @rosanarezende

---

### [DEC-0023-D05] Aplicabilidade do lifecycle: não-universal, com exceções explícitas

**Pergunta:** O lifecycle de 4 fases + stacked PRs aplica a todo trabalho, ou tem exceções?

**Contexto:**

- AP3 do research legado (`spec como container universal`) descreve patches/fixes herdando plan/tasks por reflexo como anti-pattern.
- Owner: "patch/fix/incidents pequenos podem ter fast-track. Mas exceção precisa ser declarada, nunca implícita."

**Opções:**

| Opção | Descrição                                                                                                                                                                                             | Pró                                                                                      | Contra                                                                    |
| :---- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| A     | **Universal**: todo trabalho atravessa as 4 fases + stacked PRs.                                                                                                                                      | Sem ambiguidade.                                                                         | Overhead desproporcional em iniciativas pequenas; recria AP3 amplificado. |
| B     | **Obrigatório para `spec`/`proposal`/`spike`; exceções explícitas declaradas para `patch`/`fix`/`incident` pequeno**. Fast-track declarado em commit message + label PR + state.yml; nunca implícito. | Preserva intent; reduz overhead; exceção rastreável; resolve AP3 sem perder enforcement. | Define limite ("o que é pequeno?") — pode virar zona cinzenta.            |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [x] B
- **Justificativa:** Fast-track explícito é a forma certa de respeitar AP3 sem esvaziar enforcement. Critério de "pequeno" começa como julgamento humano (não automatizado): se o autor declara fast-track, fast-track aplica; reviewer pode contestar. Refinamento (definir tamanho objetivo) só após observação empírica em ≥ 3 casos. Convenção de fast-track:
  > - commit message inclui `[fast-track: <razão curta>]`
  > - PR label `fast-track`
  > - `state.yml` registra `fast-track: true` + `fast-track-reason: <texto>`
  > - CI mínimo (D03) **bypassa** validação stacked-PR quando label `fast-track` está presente — não falha; deixa passar; review humano absorve responsabilidade.
- **Data / Owner:** 2026-05-19 / @rosanarezende

---

### Riscos conscientemente aceitos no Bloco D

- **Stacked PR rebase pain.** Sem ferramenta tipo Graphite/spr, rebase em cadeia é manual. Aceito como atrito honesto a ser experimentado antes de adotar tooling extra. Reabrir como D02-revisited se ≥ 2 ciclos comprovarem inviabilidade.
- **CI mínimo é só linkagem estrutural.** Não detecta divergência semântica entre tasks declaradas e código real. Conscientemente diferido (parte de C). Pode ser exploited por execution PR malformado — aceito porque review humano da execution PR continua sendo última linha de defesa.
- **PR2-lifecycle é auto-violação declarada do modelo.** Não dá pra aplicar o modelo à sua própria introdução. Bootstrap. Registrado explicitamente nesta seção, na PR description e no CHANGELOG preview.
- **`fast-track` ainda subjetivo.** Definição objetiva de "pequeno" diferida até observação empírica; risco de virar válvula de escape. Mitigação: PR label requerido + `state.yml` registrado + reviewer pode contestar. Reabrir D05 se ≥ 3 fast-tracks revelarem padrão de abuso.

---

## Bloco E — Enforcement estrutural (`process awareness is not process enforcement`)

> **Sessão de decisão 2026-05-19, terceira metade.** Durante a materialização do PR2-lifecycle, o agente (Claude Opus 4.7) violou o lifecycle que acabou de co-redigir em D01 — atravessou T1–T7 sem pausar para validação humana. Foi a **terceira reincidência consecutiva** do mesmo pattern (PR1 colapso, PR2 task-creation prematura, agora PR2-lifecycle steamroll). Owner observou: "consciência do processo não garante aderência ao processo". A literatura de Human-in-the-Loop / Human-Centered AI confirma teoricamente o que o dogfooding demonstrou empiricamente. Este Bloco E craveia enforcement estrutural como elemento de **primeira classe** da arquitetura — não evolução futura, não tooling secundário.

### [DEC-0023-E01] Princípio canônico: `process awareness is not process enforcement`

**Pergunta:** Workflows colaborativos humano-IA podem depender da consciência do agente sobre o processo, ou precisam de enforcement estrutural independente?

**Contexto (evidência empírica do próprio repo):**

- **3 violações consecutivas do agente** dentro desta mesma spec, todas após decisões explícitas, ADRs publicados, memory entries salvos e princípios articulados pelo próprio agente. Awareness foi alta; aderência foi zero.
- **5 decisões estruturais anteriores** que foram empurradas como "talvez depois" e voltaram com custo maior: `.specify → .governance` cutover, runtime lifecycle, planning boundary, governance separation, e enforcement em si. Cada deferimento gerou retrabalho mensurável.
- Literatura HITL/HOTL reforça: sistemas colaborativos perdem awareness operacional sem checkpoints estruturais; feedback humano precisa ser incorporado estruturalmente no sistema, não apenas esperado comportamentalmente.

**Opções:**

| Opção | Descrição                                                                                                                                    | Pró                                                                                                                  | Contra                                                                                                                                     |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| A     | **Apenas L1 (consciência comportamental)**: agente respeita processo porque entende e concorda. Status quo até agora.                        | Zero infraestrutura adicional; máxima ergonomia.                                                                     | **Empiricamente falsificado** dentro desta spec. Awareness ≠ aderência. Convenção social degrada sob aceleração/conveniência/continuidade. |
| B     | **Enforcement estrutural em camadas (L2 + L4 mínimo agora; L3 com critério)**: runtime declara estado de autorização; CI valida integridade. | Garantia operacional independente de disciplina; violação fica visível ou bloqueada. Suporta dogfooding sustentável. | Infraestrutura adicional; risco residual de virar workflow engine se framing não for protegido.                                            |
| C     | **Full enforcement automatizado** (L1–L4 completo desde já, incluindo drift detection semântico, pre-tool hooks no harness).                 | Máxima proteção contra violação.                                                                                     | Engine pesada; rotula projeto como workflow framework / BPM; mata DevEx; viola ADR 0018 se acoplar a provider-specific hooks.              |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [x] B | [ ] C
- **Justificativa:** L1 já provou ser insuficiente empiricamente (3 violações documentadas). L2+L4 entra agora; L3 deferido com critério explícito (cf. E03). Princípio canônico cravado como ADR 0021 nova (separado de ADR 0020 — lifecycle é sobre **sequencing**; enforcement é sobre **mecanismo**).
- **Data / Owner:** 2026-05-19 / @rosanarezende

> **Princípio canônico (citável cross-spec):** `process awareness is not process enforcement`. Equivalente em pt-BR: **governança precisa ser enforced estruturalmente, não lembrada comportamentalmente**.

---

### [DEC-0023-E02] Enforcement é escopo da 0023, não evolução futura

**Pergunta:** O enforcement estrutural entra como parte do escopo corrente da 0023, ou é deferido como "evolução futura"?

**Contexto:** ≥ 5 decisões estruturantes anteriores deferidas como "futuro" retornaram depois com retrabalho mensurável e acoplamento maior. Padrão é forte o suficiente para virar regra metodológica.

**Opções:**

| Opção | Descrição                                                                               | Pró                                                                                                               | Contra                                                                                         |
| :---- | :-------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| A     | Deferir enforcement para spec futura ("Spec 0024 — Enforcement").                       | Mantém 0023 focada em runtime; spec menor.                                                                        | **Recria exatamente o pattern que a 0023 está tentando resolver.** Sexto deferimento da série. |
| B     | Enforcement entra como Bloco E desta 0023; entrega imediata no PR3-enforcement-runtime. | Quebra a série de deferimentos; aplica princípio E01 a si mesmo (decisão estrutural detectada → escopo corrente). | Escopo da 0023 cresce; risco de overload (mitigado por separação de PRs).                      |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [x] B
- **Justificativa:** Owner registra regra metodológica derivada: **decisões estruturantes detectadas durante dogfooding entram no escopo corrente, não em NEXT/backlog**. Aplicar essa regra a si mesmo é a única forma honesta de quebrar a série de deferimentos. Risco de overload mitigado por separação de PRs (PR3 dedicada a enforcement).
- **Data / Owner:** 2026-05-19 / @rosanarezende

---

### [DEC-0023-E03] Camadas de enforcement mínimo viável (L2 + L4 agora; L3 com critério)

**Pergunta:** Quais camadas de enforcement entram agora, e quais ficam deferidas?

**Contexto:**

| Camada | Onde mora                           | O que faz                                                                       | Status                                        |
| :----- | :---------------------------------- | :------------------------------------------------------------------------------ | :-------------------------------------------- |
| L1     | Comportamento do agente             | Lê briefing, "decide" respeitar                                                 | **Insuficiente** (E01)                        |
| L2     | `workflow continue` runtime         | Declara `executionAuthorized` derivado; recusa narrativa explícita quando false | **AGORA**                                     |
| L3     | Hooks locais (pre-commit, pre-push) | Recusa operação se estado inválido                                              | **DEFERIDO** com critério                     |
| L4     | CI (`governance-pr-check`)          | Bloqueia merge                                                                  | **AGORA** (já materializado no PR2-lifecycle) |

**Opções:**

| Opção | Descrição                                              | Pró                                                                                                         | Contra                                                                                                     |
| :---- | :----------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| A     | Apenas L4 agora (CI); L2/L3 deferidos.                 | Mínimo absoluto.                                                                                            | Runtime local não recusa execução — viola intenção do princípio E01 (enforcement = runtime + CI).          |
| B     | **L2 + L4 agora; L3 deferido com critério explícito**. | Runtime local recusa execução (L2) + CI valida integridade (L4). L3 entra quando empiricamente justificado. | Hooks locais ausentes durante PR3→PR5; risco residual aceito.                                              |
| C     | L1+L2+L3+L4 todos agora.                               | Máxima proteção.                                                                                            | Hooks locais aumentam atrito significativamente antes de lifecycle base estar validado; engine-shape risk. |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [x] B | [ ] C
- **Detalhamento operacional do L2 — separação explícita entre autorização local e enforcement CI:**

  **(a) Autorização local de execução** (computada pelo runtime, fonte primária):

  > ```
  > executionAuthorized =
  >   tasks.md exists in spec dir
  >   && planning gate.status == closed
  > ```
  >
  > **Campo é DERIVADO, não declarado.** Não existe campo declarativo `executionAuthorized: true` no YAML — autorização emerge do estado estrutural verificável localmente. **Runtime local é fonte de verdade**: consegue recusar execução mesmo offline, mesmo antes de existir PR remoto, mesmo fora do GitHub Actions.

  **(b) Enforcement complementar em CI** (camada de integridade estrutural, não fonte primária de autorização):

  > `governance-pr-check` valida a **chain integrity** (PR-execution referencia PR-thinking; PR-thinking existe; PR-thinking aberto/mergeado; PR-thinking contém `tasks.md`). É **camada complementar** que protege o merge contra divergência da chain estrutural. **Não substitui** autorização local; **reforça** quando a interação chega ao GitHub.

  **(c) `workflow continue` recusa narrativamente** quando `executionAuthorized == false`, listando exatamente qual condição falhou e qual ação destranca:

  > ```
  > Execution locked.
  > Missing:
  > - tasks.md em .governance/specs/{slug}/ (não encontrado)
  > - planning gate.status == closed (atual: awaiting-review)
  > ```

  **(d) Anti-ambiguidade arquitetural:** autorização local (a) e enforcement CI (b) são **camadas independentes** com responsabilidades distintas. Confundir as duas degrada o modelo — autorização não pode depender de CI remoto (runtime offline ficaria inutilizável), e CI não pode confiar cegamente em autorização local (PR remoto pode divergir do estado local). Os dois coexistem como L2 (local) e L4 (CI), conforme ADR 0021.

- **Critério de revisita para L3 (hooks locais):** revisar quando L2/L4 forem comprovadamente insuficientes em **≥ 2 casos reais**. Não revisitar antes — atrito aumenta cedo demais.
- **Data / Owner:** 2026-05-19 / @rosanarezende

---

### [DEC-0023-E04] Itens deferidos com critério de revisita explícito

**Pergunta:** Quais aspectos de enforcement ficam deliberadamente deferidos, e com que critério eles voltam à pauta?

**Itens deferidos (registrados também em `NEXT.md` e `tasks.md`):**

| Item                                                            | Camada            | Critério de revisita                                                                                                       |
| :-------------------------------------------------------------- | :---------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **L3 — hooks locais (pre-commit, pre-push)**                    | L3                | L2/L4 comprovarem insuficientes em ≥ 2 casos reais.                                                                        |
| **Drift detection semântico** (mapping arquivos↔tasks)          | L4 expanded       | ≥ 2 ciclos de stacked PRs revelarem padrões de divergência específicos que CI mínimo deixa passar.                         |
| **Runtime stateful complexo** (eventos, transitions, plugins)   | L2 expanded       | L2 atual (state derivado + refuse narrativo) provar insuficiente em ≥ 2 casos. Evitar engine-shape até lá.                 |
| **Pre-tool hooks no harness** (Claude Code settings.json, etc.) | provider-specific | Decisão própria sobre channel-specific enforcement. Hoje viola ADR 0018 (acopla a provider). Reabrir só com brief próprio. |

**Convenção operacional para deferimentos:**

> **Não usar "talvez depois" como justificativa.** Todo item deferido precisa de:
>
> 1. Camada nomeada (L1/L2/L3/L4 + variação).
> 2. Critério de revisita observável (não "quando alguém lembrar").
> 3. Entrada em `NEXT.md` ou backlog estratégico da spec — não em memória implícita.

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** Itens acima registrados com critérios; aceitos como diferidos visíveis.
- **Data / Owner:** 2026-05-19 / @rosanarezende

---

### [DEC-0023-E05] Framing canônico anti-distorção

**Pergunta:** Como nomear este enforcement sem que o projeto derive para BPM / workflow engine / orchestration?

**Linguagem canônica (usar sempre):**

- **"proteção estrutural mínima contra execução implícita"**
- **"integridade operacional do lifecycle humano-IA"**
- **"governance runtime"** (quando aplicável a `workflow continue` + state)
- **"enforcement de linkagem estrutural"** (para CI)

**Linguagem rejeitada (anti-distorção):**

- ~~workflow engine~~
- ~~orchestration framework~~
- ~~BPM / business process management~~
- ~~governance machine~~
- ~~approval maze~~
- ~~validation pipeline~~ (no sentido enterprise)
- ~~compliance enforcement~~ (carrega conotação corporativa)

**Critério de teste:** se a descrição do mecanismo soar enterprise / corporativa / pesada, voltar ao framing canônico. Se o mecanismo realmente justificar a descrição enterprise, **rejeitar o mecanismo**, não o framing.

**Detalhamento sobre fast-track (cf. `[DEC-0023-D05]` reforçado por E05):**

> **Princípio semântico — fast-track NÃO remove governança. Fast-track transfere explicitamente accountability boundaries**: a responsabilidade pelo lifecycle deixa de ser cumprida pelo contrato estrutural e passa a ser cumprida pelo reviewer humano. Não é "permissão para pular" — é "responsabilidade reassinada com nome e rationale". Fast-track **sem accountability transferida explicitamente** é bypass disfarçado e deve ser rejeitado.

Para preservar enforcement estrutural enquanto a accountability transfere, fast-track exige TODOS os seguintes:

1. **Label PR obrigatória** (`fast-track`) — visível, auditável.
2. **Rationale curto obrigatório** no body do PR (regex: `\[fast-track: .+\]` ou seção `## Fast-track Rationale`).
3. **Entrada em `state.yml`** da spec (se houver): `fast-track: true` + `fast-track-reason: <texto>` + `fast-track-date: YYYY-MM-DD`.
4. **CI `governance-pr-check`** valida que label + rationale estão presentes (não apenas label).
5. **Fast-track é raro** — auditoria contínua: se ≥ 3 fast-tracks em janela curta, owner re-examina critério ou suspeita de abuso.

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** Linguagem canônica + critério de teste + fast-track strictness cravados.
- **Data / Owner:** 2026-05-19 / @rosanarezende

---

### Riscos conscientemente aceitos no Bloco E

- **L2 (runtime refuse) ainda depende de o agente respeitar o sinal.** O runtime declara "execution locked" mas o agente pode ignorar e chamar `Edit` direto. L3 (hooks locais) resolveria; está deferido. Mitigação intermediária: L4 (CI) pega no final da cadeia. Risco residual aceito.
- **Fast-track strictness não tem enforcement automatizado para "raridade".** Owner audita manualmente até ≥ 3 fast-tracks aparecerem. Risco: se autor abusar, detecção é manual.
- **Princípio E01 é forte demais para virar slogan vazio.** Mitigação: ADR 0021 + memory entry + uso ativo nas conversações da spec.
- **`executionAuthorized` derivado depende de "governance chain íntegra" — quando é íntegra?** Definição mínima: tasks.md presente + gate.status closed na spec corrente. Definição estendida (com governance PR referenced etc.) entra no PR4-enforcement-runtime.

---

## Bloco I — Modelo de identidade canônica da spec

> **Origem:** bug reportado em 2026-05-23 — `yarn guidelines workflow` na branch `feat/spec-0023-dx-thinking` falha porque `DetectActiveSpec` deriva slug literal `0023-dx-thinking`, que não casa o diretório canônico `0023-workflow-runtime`. Causa-raiz não é regex: é **modelagem incorreta da identidade da spec**. O runtime tratou o **escopo operacional do branch** (`dx-thinking`) como **identificador canônico**. Em arquitetura sem stack isso funciona; em stack multi-PR (já vigente desde Spec 0021/ADR 0020), viola a separação entre identity e coordenação.
>
> **Princípio canônico cravado neste bloco (citável cross-spec):**
> **Branch names são artefatos de coordenação operacional, não identificadores canônicos de spec.** A identidade canônica é o id `NNNN` (4 dígitos zero-padded, único por construção, cravado no nome do diretório `.governance/specs/NNNN-<slug>/`). O branch carrega o id, mas o sufixo após `feat/spec-NNNN-` é livre — pode ser o slug da spec, escopo de PR (`dx-thinking`), ou qualquer recorte operacional.

### [DEC-0023-I01] Resolução de spec ativa por identity canônica (id NNNN), não por branch slug literal

**Pergunta:** Como o runtime resolve qual é a spec ativa quando o sufixo do branch representa **escopo de PR**, não slug canônico da spec?

**Contexto:**

- Bug 2026-05-23 — wizard "Continuar spec atual" na branch `feat/spec-0023-dx-thinking` falha; `DetectActiveSpec` procura `.governance/specs/0023-dx-thinking/`, que não existe.
- Em PR3 (cf. `[DEC-0023-G02]`), `PublishState` ganhou fallback privado `resolveLocationFromIndexBranchMatch()` que consulta `active-specs.yml` para resolver spec quando branch ≠ slug canônico. Escopo conscientemente restrito a "caller único hoje"; documentado em `NEXT.md` 2026-05-21 como **não-vigilância** ("é resolução").
- O sinal "caller único" virou "≥ 2 callers com a mesma fricção" quando o wizard `workflow` → "Continuar spec atual" também chamou `DetectActiveSpec` direto. Recorrência inequívoca pela regra de promoção de sinais distribuídos (memory `feedback_lookup_not_coordination`).
- Fallback via `active-specs.yml` é **arquiteturalmente smell**: acopla resolução **local** à camada de **publication/projection**. Cria dependência temporal indireta — se índice está stale ou nunca foi publicado da branch corrente, resolução local quebra. Viola a separação **detection** (runtime local) vs **publication** (projection layer) cravada em `[DEC-0023-G01]`.

**Opções:**

| Opção | Descrição                                                                                                                                             | Pró                                                                                                                                                                                                                                                                                     | Contra                                                                                                                                                                                             |
| :---- | :---------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | **Cascata de fallbacks** (branch slug literal → id NNNN → `active-specs.yml` branch-match → null narrativo)                                           | Cobre todos os casos atuais; máxima compatibilidade retroativa                                                                                                                                                                                                                          | Heurística escondida; debugging difícil ("por que resolveu essa e não outra?"); acopla local resolution à projection; cresce surface area silenciosamente — exato smell que a 0023 promete impedir |
| B     | **Identity por id canônico** (regex captura `NNNN`; lookup `.governance/specs/NNNN-*` com 1 match → resolve; 0 → erro narrativo; >1 → erro narrativo) | Single-step, determinístico; identity explícita; sem acoplamento à projection; permite remover `PublishState.resolveLocationFromIndexBranchMatch()` (dead code post-refator); honra `feedback_lookup_not_coordination` (lookup sem inferência); colapsa dois caminhos divergentes em um | Erro narrativo em vez de fuzzy quando branch fora do padrão; identity collision (cenário inválido por construção) vira erro em vez de "escolha mais provável" — aceito como feature, não bug       |
| C     | **Status quo + documentar convenção** (branch slug DEVE ser igual ao slug da spec; sempre renomear branch ao stackear)                                | Zero código                                                                                                                                                                                                                                                                             | Quebra a realidade do stack multi-PR já vigente; força renomear branches; viola Rule 1 (carga cognitiva — humano coordenando branch naming); abandona o esforço de PR3 sem ganho                   |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [x] B | [ ] C
- **Justificativa:** Cascata (A) carrega o smell exato que a 0023 inteira tenta impedir — surface area crescendo silenciosamente, fallbacks empilhados, acoplamento temporal indireto entre detection (runtime local) e projection (`active-specs.yml`). B materializa o princípio canônico do header deste bloco: **id é identity; branch é coordenação**. Single-step, determinístico, transparente. Side-effect arquitetural positivo: `PublishState.resolveLocationFromIndexBranchMatch()` vira dead code e é removida no commit de implementação — dois caminhos divergentes (DetectActiveSpec literal + PublishState com índice) colapsam em um canônico.
- **Vocabulário cravado (citável cross-spec):**
  - **spec identity** = id `NNNN` (4 dígitos zero-padded; único por construção; cravado no nome do diretório).
  - **spec slug** = sufixo humano-friendly do nome do diretório (`workflow-runtime`); leitura, não lookup.
  - **branch scope** = sufixo do branch após `feat/spec-NNNN-`; transitório; livre forma (slug da spec, escopo de PR, recorte operacional).
  - **identity resolver** = `DetectActiveSpec` — lookup por id NNNN. **Não** consulta projection layer.
  - **projection layer** = `active-specs.yml` — publicação declarativa do estado público. **Não** é primary resolver de identity local.
- **Implementação cravada (commit de código separado per [CORE-06]):**
  - `DetectActiveSpec.ts`: regex captura `NNNN`; lookup determinístico `.governance/specs/NNNN-*` → fallback de root `.specify/specs/NNNN-*`; 1 match → resolve; 0/>1 → erro narrativo orientativo.
  - `PublishState.ts`: remoção de `resolveLocationFromIndexBranchMatch()` (dead code pós-refator). PublishState passa a usar `DetectActiveSpec` sem fallback paralelo.
  - Tests BDD pt-BR cobrindo: branch canônico resolve; branch escopo-de-PR resolve via id; branch fora do padrão erro narrativo; identity collision (>1 diretório com mesmo id) erro narrativo expondo bug estrutural.
- **Não-objetivos cravados (vetados por default; reabrir exige DEC própria):**
  - Inferir spec por arquivos modificados (frágil; já rejeitado em `[DEC-0023-A04]`).
  - Consultar `active-specs.yml` para resolução local (projection ≠ primary resolver — cravado neste bloco).
  - Sugerir "spec mais provável" em ambiguidade (inferência disfarçada).
  - Cascata de fallbacks (smell explicitamente cravado).
  - Fuzzy match em branch slug (heurística rejeitada por construção).
- **Data / Owner:** 2026-05-23 / @rosanarezende

---

### Riscos conscientemente aceitos no Bloco I

- **Erro narrativo em vez de fuzzy-resolve.** Usuário em branch fora do padrão `feat/spec-NNNN-*` (HEAD detached, branch sem prefix, branch antigo sem id) recebe erro orientativo, não tentativa de adivinhar. Aceito: orientação > magic.
- **Identity collision vira erro narrativo, não auto-resolve.** Múltiplos diretórios com mesmo `NNNN` é cenário inválido por construção (id é único por convenção de numeração); se aparecer, é dívida estrutural a corrigir. Aceito: erro expõe bug em vez de mascarar com heurística.
- **`branchScope` pode divergir de `spec slug` sem warning forte.** Exemplo: branch `feat/spec-0023-dx-thinking` resolve para diretório `0023-workflow-runtime` silenciosamente. Mitigação opcional no commit de implementação: `DetectActiveSpec` expõe `branchScope` no resultado; `runContinue`/wizard podem exibir nota informativa de transparência ("branch scope: dx-thinking; spec ativa: workflow-runtime"). Decisão de UX no commit de código, não neste DEC.

---

## Bloco J — Semântica operacional de Draft / Ready / Mergeable

> **Origem:** confusão empírica observada em múltiplas sessões de review da stack da Spec 0023 (`#18 → #19 → #22 → #23 → #24 → #25`) durante o hardening final do PR #25 (2026-05-23/24). Codex, Claude e Antigravity trataram PRs convertidos para `Ready` como autorizados para merge mesmo com PRs upstream/downstream pendentes na stack. A label `MERGEABLE` do GitHub reforçou a ambiguidade — só sinaliza ausência de conflito contra a branch base do PR, não diz nada sobre a stack inteira. Não foi hipótese teórica — o atrito apareceu repetidamente em conversas reais.
>
> **Princípio canônico cravado neste bloco (citável cross-spec via ADR 0024):**
> **Em fluxos governance-first com stacked PRs (ADR 0020), Draft, Ready e Mergeable são estados distintos.** Draft = trabalho em andamento (ecosystem natural). Ready = trabalho operacionalmente concluído, aguarda revisão humana — **não** implica autorização de merge. Mergeable = estado terceiro distinto, requer stack inteira `Ready` + autorização explícita do owner para merge atômico ponta-a-ponta.

### [DEC-0023-J01] Materializar Draft/Ready/Mergeable como ADR 0024 + redesign do PR template

**Pergunta:** Durante o ciclo do PR #25 e da stack da 0023, observamos ambiguidade real entre `Draft → Ready` como "gate autorizado para próxima fase" vs significado nativo ("WIP → solicita review"). Como cravar a distinção para evitar reincidência cross-spec, sem invadir `[DEC-0023-F05]` (Deferred — SSOT de CORE-09/10)?

**Contexto:**

- Stack 0023: 6 PRs (`#18 → #19 → #22 → #23 → #24 → #25`), todos passaram por `Draft → Ready` durante o fluxo. Múltiplas revisões trataram `Ready` como mergeable.
- `[CORE-09]` craveia "PRs abrem como Draft com matriz oficial" — modo, não bloqueio.
- `[CORE-10]` craveia "Draft → Ready apenas via revalidação humana" — gate humano, mas não diz **o que** Ready significa.
- `[CORE-16]` craveia "Sync de base ≠ merge atômico" — chega perto da distinção, mas foca em "MERGEABLE label não é convite" (operacional), não no modelo de 3 estados.
- `ADR 0020` craveia merge atômico ponta-a-ponta — mandate da operação, mas não articula como os estados intermediários se relacionam com ela.
- Nenhum artefato atual articula explicitamente **Draft ≠ bloqueado** + **Ready ≠ Mergeable** + **Mergeable = stack + autorização**.
- `[DEC-0023-F05]` Deferred trata de **WHERE** a SSOT de CORE-09/10 vive (vinculado à candidata `handoff-as-first-class`). J01 trata de **WHAT** os estados significam — questão complementar e distinta. **Não há conflito com F05.**

**Opções:**

| Opção | Descrição                                                                                                                                           | Pró                                                                                                                                                                                                                                         | Contra                                                                                                                                                           |
| :---- | :-------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | **Amendment inline em CORE-09/10/16** clarificando o modelo de 3 estados                                                                            | Mínimo de arquivos novos; concentra a regra em um lugar                                                                                                                                                                                     | Invade `[DEC-0023-F05]` que diferiu **WHERE** o SSOT vive até a candidata `handoff-as-first-class` materializar. Amendment cravaria SSOT prematuramente em CORE. |
| B     | **ADR 0024 nova (princípio perene cross-spec) + Bloco J no decision-brief 0023 (aprendizado metodológico) + redesign do PR template (operacional)** | Princípio cravado em camada cross-spec (ADR), origem histórica registrada (Bloco J), operacionalização explícita (template). Não conflita com F05 — trata de **WHAT**, não **WHERE**. Materializa o aprendizado real da 0023 sem maquiagem. | Mais um ADR no inventário; template muda forma. Esforço proporcional ao impacto.                                                                                 |
| C     | **Apenas redesign do template** (sem ADR formal)                                                                                                    | Mínimo absoluto                                                                                                                                                                                                                             | Sem âncora cross-spec — risco de regressão em specs futuras. Template sozinho não tem autoridade textual perene.                                                 |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [x] B | [ ] C
- **Justificativa:** ADR 0024 ancora o princípio cross-spec sem invadir CORE-09/10 (que F05 mantém em deferimento). Template redesign concretiza a operacionalização. Bloco J registra a origem empírica explicitamente (não foi hipótese — foi atrito observado em conversas reais com Codex/Claude/Antigravity). As três peças se reforçam: ADR é citável; Bloco J é auditável; template é executável. Owner explicitamente cravou: **"o problema não era técnico. Era cognitivo/social: GitHub naturalmente induz Ready = mergeable. Em stack governance-first, review readiness, operational completeness, e merge authorization são estados distintos. Isso precisa ficar impossível de interpretar errado."**
- **Escopo cravado do redesign do template (Commit B do par governance + implementation):**
  - Seção "Status do ciclo de vida" no topo com 3 checkboxes distintos: `Draft` / `Ready for review` / `Authorized to merge`
  - Frase explícita: _"Ready ≠ Mergeable. Stacks governance-first (ADR 0020) integram em sequência atômica ponta-a-ponta."_
  - Seção "Merge authorization" textual curta (não checklist) — força owner a registrar autorização ou marcar como pendente
  - Bloco visual opcional no topo (comentário HTML guia + bloco markdown visível só quando preenchido) — institucionaliza narrativa visual como parte do fluxo de governança (aprendizado real da 0023)
  - Checklist operacional enxuto (4 itens vs 10 do template atual) — remove cosplay burocrático
  - Remove seção "Tipo de Mudança" (redundante com título), "Label de nuance" como checklist (vive no título per `.core/process/pr-title-conventions.md`), "Spec Path" + "No-Spec Reason" como seções dedicadas (absorvidos em "Cross-refs"; spec path agora `.governance/` per ADR 0019)
  - Mantém guidance forte em "Resumo" (explique valor entregue + mudança operacional observável) e "Test plan" (preserva como validar, o que observar, qual fluxo exercitar — runtime tem UX/wizard/comportamento narrativo)
  - "Impacto downstream" não vira seção fixa, mas guidance no Resumo/Test plan
- **Vínculos cruzados:**
  - **F05 (deferido)**: J01 trata de **WHAT** os estados significam; F05 trata de **WHERE** a SSOT de CORE-09/10 vive. Quando `handoff-as-first-class` materializar e F05 for revisitado, ADR 0024 fornecerá vocabulário cravado para a decisão de SSOT.
  - **ADR 0024**: princípio perene complementar a ADR 0020 (lifecycle) + ADR 0021 (enforcement) + ADR 0022 (handoff). Status `Aceita` (não `Proposta`) — empiricamente validado pela própria stack da 0023.
- **Não-objetivos:**
  - Não revoga CORE-09/10/16 — complementa.
  - Não cria novo gate operacional automático — formaliza distinção que ADR 0020 já tangenciava implicitamente.
  - Não introduz automação de gating (CI lint, bot, etc.) — operacionalização é via template + revisão humana.
  - Não responde a F05.
- **Data / Owner:** 2026-05-24 / @rosanarezende

---

### Riscos conscientemente aceitos no Bloco J

- **Modelo de 3 estados depende de leitura ativa do template + ADR.** Sem automação que force a distinção, ainda dá pra mergear isoladamente um PR Ready se o owner não estiver atento. Mitigação: já existe `governance-pr-check` (per `[DEC-0023-D03]`) que valida chain integrity em CI; este ADR não substitui — complementa. Risco residual aceito.
- **"Authorized to merge" como seção textual (não checklist) pode parecer informal.** Owner explicitamente preferiu vs checklist porque checklist vira performático. Risco: alguns autores podem ignorar ou esquecer de preencher. Aceito — sinaliza atrito honesto, não esconde com cosplay.
- **Bloco visual opcional pode virar "marketing creep".** Mitigação: comentário HTML guia + bloco markdown só visível quando preenchido. Critério de revisita: se PRs sem mudança real começarem a ter imagens elaboradas como teatro, reabrir como anti-distorção dedicada.
- **ADR 0024 status `Aceita` (vs `Proposta` de ADR 0022/0023)** — justificado pela validação empírica direta na própria stack da 0023. Risco: outras specs podem adotar e descobrir nuances não previstas. Critério de revisita já cravado no próprio ADR.

---

## Bloco K — Integration PR como homologação/convergência final

> **Origem:** decisão da owner durante fechamento operacional da Spec 0023 em 2026-05-24. A stack já tinha PRs Governance e Execution, mas faltava um PR explícito para representar a convergência/homologação final antes da autorização de merge atômico. Este bloco dogfooda o conceito na própria Spec 0023 via PR #26.
>
> **Princípio canônico cravado neste bloco:** Integration PR valida convergência da stack aprovada. Ele separa "Ready for review" de "Authorized to merge", não cria comportamento novo, não executa deploy e não vira orchestration engine.

### [DEC-0023-K01] Introduzir Integration PR para homologação/convergência da stack 0023

**Pergunta:** Como representar a fase final de homologação/convergência da stack sem confundir Ready com Mergeable e sem transformar o fechamento da 0023 em novo redesign?

**Contexto:**

- PR #25 está `Ready for review`, mas a stack completa ainda não está autorizada para merge atômico.
- ADR 0024 separou Draft, Ready e Mergeable; faltava um artefato operacional para registrar a convergência final da stack antes do merge.
- Owner decidiu dogfoodar o modelo agora na própria 0023, via PR #26, em vez de empurrar para spec futura.
- Restrições explícitas: não chamar de "deploy PR"; não criar engine; não adicionar automação agentic; não ampliar escopo criativo.

**Opções:**

| Opção | Descrição                                                                                                                   | Pró                                                                                                     | Contra                                                                                           |
| :---- | :-------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------- |
| A     | Deixar a convergência final apenas no body do PR #25 e em comentário de owner                                               | Zero arquivos novos                                                                                     | Mantém ambiguidade Ready/Mergeable; não cria forma reutilizável para stacks futuras              |
| B     | Introduzir **Integration PR** como tipo operacional mínimo no template + ADR 0024 + convenção de título, e dogfoodar PR #26 | Separa review readiness de merge authorization; cria trilha auditável de homologação; mínimo necessário | Mais uma label/tipo operacional a ensinar                                                        |
| C     | Criar spec nova para Integration PRs                                                                                        | Isola assunto                                                                                           | Adia aprendizado que a própria 0023 precisa validar; overengineering para fechamento operacional |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [x] B | [ ] C
- **Justificativa:** Integration PR é a menor forma que expressa a convergência final sem mentir semanticamente. PR #25 pode estar Ready; PR #26 registra homologação ponta-a-ponta e mantém merge authorization pendente até a owner autorizar merge atômico. Isso concretiza ADR 0024 em vez de criar nova arquitetura.
- **Escopo cravado do Integration PR:**
  - Nome canônico: **Integration PR**. Sinônimos aceitáveis em texto: "homologação/convergência final"; não usar "deploy PR".
  - Título recomendado para dogfooding: `[🔗] [Integration] [Spec 0023] Homologação final da stack`.
  - Tipo no template: `Integration — homologação/convergência final da stack; sem comportamento novo`.
  - Conteúdo: evidência de CI, smoke/manual test, status lifecycle, lista da stack, pendências explícitas e merge authorization pendente/autorizada.
  - Limite: não cria comportamento novo; qualquer mudança funcional volta para execution PR ou spec própria.
- **Artefatos atualizados:** ADR 0024, `.github/pull_request_template.md`, `.core/process/pr-title-conventions.md`, `tasks.md` Phase 3.
- **Data / Owner:** 2026-05-24 / @rosanarezende

### Riscos conscientemente aceitos no Bloco K

- **Integration PR virar "mega-PR criativo".** Mitigação: template e ADR explicitam "sem comportamento novo"; PR #26 deve ser homologação/convergência, não execução.
- **Confusão com release/deploy.** Mitigação: linguagem proibida explícita — não chamar de deploy PR; release formal continua em `CHANGELOG`/version bump no encerramento.
- **Mais uma label no título.** Aceito porque `[Integration]` cobre uma fase real da stack 0023 e restaura significado natural de Draft/Ready sem transformar Ready em bloqueio eterno.

---

## Bloco L — Operational CLI commands materializados no wizard + standalone (PR #25)

> **Origem:** Frente C+D do hardening do PR #25 (2026-05-24). Durante a Frente A (criação de `.github/workflows/release.yml`), owner identificou que aplicar `[DEC-0023-G03]` ("manual primeiro, automação depois") restritivamente quando a friction já é enxergada em advance contradiz o espírito da regra. Auto-crítica explícita registrada na conversação: _"manual via git/UI e manual via CLI com confirmação são dois conceitos diferentes que eu colapsei. CLI transacional preserva 100% da decisão humana via confirm prompt antes de cada side-effect, e remove o overhead de lembrar a sequência exata + sair para terminal/UI"_.
>
> **Princípio cravado (citável cross-spec via ADR 0024 amendment):** Operational CLI commands são **transactional helpers** — deterministic + human-gated + composable. Side-effects irreversíveis vivem atrás de plan + confirmation, não atrás de "lembre a sequência de comandos certa".
>
> **Insight metodológico:** G03 protege contra **automação stateful que decide pelo humano**, não contra **helpers de execução transacional**. CLI helpers que reduzem friction enxergada em advance NÃO violam G03 desde que mantenham gate humano explícito por side-effect.

### [DEC-0023-L01] Materializar Operational CLI commands no PR #25 — wizard tier 2 + standalone tier 3

**Pergunta:** Onde devem viver `integration-pr`, `merge-stack` e `release-prep`? Como surface compartilhada (wizard), comandos standalone separados, ou mix?

**Contexto:**

- `integration-pr` (abrir PR de Integration para a spec ativa) e `merge-stack` (atomic merge da stack governance-first) são **framework features** — qualquer consumer repo com governance-first stack precisa.
- `release-prep` (bump + tag + push → dispara `release.yml`) é **repo-specific** do ai-guidelines (consumer repos podem ou não publicar em npm).
- Wizard hoje (`[DEC-0023-B06]` + `[DEC-0023-B07]`) tem 6 opções fixas; expandir surface exige nova DEC per o próprio gate de B06.
- Standalone `yarn guidelines <cmd>` fragmenta a UI do framework — consumer repos teriam que aprender comandos separados além do wizard, contra o espírito centralizador do wizard como "lente operacional" do framework.

**Opções:**

| Opção | Descrição                                                                                                                         | Pró                                                                                                                     | Contra                                                                                                                                                               |
| :---- | :-------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | 3 comandos standalone (`yarn guidelines integration-pr` / `merge-stack` / `release-prep`)                                         | UI consistente entre framework e repo; cada comando isolado e scriptable                                                | Fragmenta surface; consumer repos descobrem comandos via grep/help, não via wizard; framework features ficam invisíveis na surface principal                         |
| B     | 3 wizard options (opções 7, 8, 9)                                                                                                 | Centraliza tudo em uma surface                                                                                          | `release-prep` polui menu para 99% dos consumer repos que não publicam em npm; quebra distinção framework/repo                                                       |
| C     | **Wizard hospeda framework ops (Integration PR + merge-stack como opções 4 e 5); standalone para repo-specific (`release-prep`)** | Distinção clara framework/repo; cada surface tem propósito único; release-prep não polui consumer repos sem npm publish | Renumera opções existentes do wizard (4→6, 5→7, 6→8); exige adaptação muscle memory mas dispatch é por `action` semântica (Item 7.5 do PR #25), não por key numérica |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [ ] B | [x] C
- **Justificativa:** C respeita a distinção arquitetural que motivou ADR 0018 (framework é governança cross-repo; integração com `ai-guidelines` é canal). Wizard = surface do framework; standalone = surface do repo. `release-prep` não pertence ao wizard porque é gesto que só faz sentido para repos que publicam — incluí-lo no menu polui para consumers que não publicam.
- **Wizard cravado (opções 4 e 5, com renumeração das existentes):**
  1. 📍 Continuar spec atual (briefing + REPL) — sem mudança
  2. 📍 Continuar outra spec (por slug ou id) — sem mudança
  3. 📡 Publicar estado (instruções) — sem mudança
  4. 🔗 **Abrir Integration PR da spec ativa** — NOVO (tier 2 transactional)
  5. 🔀 **Executar merge atômico da stack** — NOVO (tier 2 transactional)
  6. 📋 Ver specs ativas (índice público) — era 4
  7. 🔍 Diagnosticar drift do índice — era 5
  8. 🎨 Gerar prompt visual (para gerador de imagem externo) — era 6
  - q. Sair
- **Standalone cravado:** `yarn guidelines release-prep` — lê versão alvo de `CHANGELOG.md` `[Unreleased]`, mostra plan completo, aguarda confirmação humana, executa bump + tag + push → dispara `.github/workflows/release.yml` (cravado em Frente A).
- **Reuso de iconografia cravada:**
  - 🔗 já é o emoji canônico de Integration em `.core/process/pr-title-conventions.md` (`[DEC-0023-K01]`). Coerência cross-artifact.
  - 🔀 é escolha natural para git merge (universal em UIs de git).
  - Demais ícones (📍 📡 📋 🔍 🎨) categorizam visualmente por gênero (navegação / governance / inspeção / utilidade) sem ranking.
- **Anti-patterns reafirmados** (mesmo em tier 2/3, B06/B07 continuam válidos):
  - Sem auto-detecção de "próxima ação recomendada" — ordem fixa cravada nesta DEC
  - Sem ranking dinâmico — agrupamento por posição (navegação 1-2 / governance 3-5 / inspeção 6-7 / utilidade 8) é implícito, não algorítmico
  - Sem inferência de intenção — humano escolhe explicitamente; sistema mostra plan + aguarda `y/n`
  - Sem auto-execução pós-merge — merge da stack não dispara `release-prep`; release é decisão humana independente
- **Renumeração não é nova opção semântica.** Dispatch interno é por `action` (implementado em PR #25 Item 7.5), não por key numérica posicional. Gates de B06/B07 ("nova opção exige DEC") continuam válidos: futuras opções 9+ exigem DEC própria.
- **Implementação cravada (commits separados per `[CORE-06]`):**
  - `feat(workflow): StackOps port + GhCli adapter` (infra layer)
  - `feat(workflow): OpenIntegrationPR + MergeStack + ReleasePrep use cases + tests` (domain)
  - `feat(cli): wizard reordenado + icons + opções 4+5 (Integration PR + merge-stack)` (wire wizard)
  - `feat(cli): release-prep standalone command` (standalone entry)
  - `docs: rename integration-pr-26.md → integration-pr.md + printHelp + CHANGELOG entry` (cleanup)
- **Vínculos cruzados:**
  - **ADR 0024 amendment**: princípio cross-spec cravado na seção "Operational CLI commands para transactional governance ops" (não novo ADR — owner explicitamente cravou: "amend nessa 0024 para evitar criar adrs desnecessárias que nunca são lidas")
  - **ADR 0018** (AI-as-Channel) preservado — CLI helpers são determinísticos, sem LLM
  - **ADR 0020** (Governance precede execution) materializado via `merge-stack`
  - **ADR 0021** (Enforcement) preservado — humano autoriza cada side-effect via prompt
  - **`[DEC-0023-B06]` / `[DEC-0023-B07]`** gate de "nova opção exige DEC" reafirmado
  - **`[DEC-0023-G03]`** (manual-first) refinado — protege contra automação stateful que decide pelo humano, não contra helpers transacionais
  - **`[DEC-0023-K01]`** (Integration PR) ganha materialização via wizard opção 4
- **Não-objetivos cravados:**
  - Não implementar auto-bump de versão (release-prep lê CHANGELOG, não infere)
  - Não implementar auto-tag pós-merge
  - Não implementar auto-execução de release pós-merge da stack
  - Não implementar retry inteligente em merge-stack — owner resolve falhas manualmente + rerun com `--continue-from`
  - Não adicionar opção 9+ ao wizard nesta DEC; futuras exigem DEC própria
  - Não expor `integration-pr` ou `merge-stack` como standalone (são wizard-only — diferentemente de `release-prep`)
- **Sinal de vigilância registrado em NEXT.md** (`Pós-PR5 wizard scaling`): wizard cresceu 5 (B06) → 6 (B07) → 8 (L01) em ~3 turnos; critério de revisita observável (≥ 10 opções OU ≥ 2 usuários reportarem confusion) para reabrir redesign de menu como spec dedicada.
- **Data / Owner:** 2026-05-24 (II) / @rosanarezende

---

### Riscos conscientemente aceitos no Bloco L

- **Wizard scaling:** 5 (B06) → 6 (B07) → 8 (L01). Próximas adições rapidamente viram lista densa. Sinal de vigilância registrado em NEXT.md com critério de revisita observável; mitigação imediata via icons + agrupamento por posição.
- **Renumeração shift mental:** usuários acostumados com "Gerar prompt visual = 6" precisam reaprender "= 8". Mitigação: dispatch por action (Item 7.5) preserva semantic; teclas posicionais são display only.
- **`GhCli` adapter depende de `gh` instalado:** erro narrativo se ausente, sem fallback. Aceito (consumer repos já dependem de `gh` via outras integrações governance-first).
- **Falha mid-way em merge-stack:** humano resolve manualmente + rerun com `--continue-from`. Sem rollback automático. Aceito (rollback de merge atômico é cenário raro; resolução manual é honesta).
- **Implementação cresce surface do PR #25:** ~5-6 commits adicionais. Owner cravou que isso é dogfooding válido — _"a spec 0023 é dogfooding; não vejo problema em trazermos o aprendizado, dar visibilidade dessa escolha, e implementar agora mesmo no PR 25, assim já vamos para o PR 26 com tudo estabelecido e provando valor real"_. Aceito.

---

## Bloco M — Modelo de artifacts de 3 boundaries (execution / integration-readiness / closure)

### [DEC-0023-M01] Separar `tasks.md` (execution) / `review.md` (integration readiness) / `closure.md` (post-merge ops)

> **Origem:** dogfooding final da 0023 (2026-05-25). Mesmo com o gate determinístico de readiness, o `tasks.md` tinha virado "arquivo de tudo" (execução + homologação Fase 3 + pós-merge Fase 4), criando drift e incentivando o runtime a antecipar o Integration PR. Owner cravou redesign do modelo de artifacts.

**Pergunta:** Como separar execução, prontidão de integração e operações pós-merge de forma que (a) `tasks.md` possa fechar 100% `[x]` ao fim da execução, e (b) o Integration PR (#26) nasça já sobre estado convergido, não para descobrir pendências?

**Decisão:** três boundaries canônicos por spec:

- **`tasks.md` = execution boundary.** Cobre apenas execução/implementação; fecha 100% `[x]` em "execution complete". Não contém gates de homologação nem pós-merge.
- **`review.md` = integration readiness boundary** (sempre existe). Gates `R1`–`R7`. **R1–R6 `[x]` → o #26 pode ser aberto**; o #26 foca em convergência topológica e conflitos de merge, não em descobrir pendências. **R7 (merge authorization) fecha após a homologação do #26** e é o gate do merge-stack. Migra a antiga Fase 3 + merge auth (ex-1.H.[REVIEW]/4.9).
- **`closure.md` = post-merge ops log** (registro, não gate). Captura merge atômico, release, ajustes públicos, incidentes — "o que, por quem, quando". Migra a antiga Fase 4.

**Consequências no runtime (determinístico, sem IA):** `CheckIntegrationReadiness` lê `review.md`; gate `integration-pr` exige R1–R6, gate `merge-stack` exige R1–R7. Wizard opção 1 exibe os 3 status (execution/integration/closure) a partir do estado declarado, sem recomendação de próxima ação. Sem nova opção no wizard.

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Justificativa:** o Integration PR não deve servir para descobrir pendências (cf. princípio cravado no dogfooding 2026-05-24); separar boundaries permite que `tasks.md` feche 100%, que `review.md` seja a SSOT de prontidão, e que closure registre o pós-merge sem virar gate. Sequenciamento R1–R6 (abre #26) / R7 (libera merge) resolve a inversão "merge auth antes de abrir #26". Relaciona `[DEC-0023-E03]` (L2 enforcement), `[DEC-0023-L01]` (comandos transacionais) e `[DEC-0023-K01]` (Integration PR como homologação).
- **Data / Owner:** 2026-05-25 / @rosanarezende
- **Nota:** modelo é ADR-worthy; pode graduar para ADR próprio se adotado por ≥ 2 specs.

---

## ✅ Gate fechado — Stage A → Stage B (Bloco A)

- **Data:** 2026-05-19
- **Owner:** @rosanarezende
- **Pontos resolvidos:**
  - [x] `[DEC-0023-A01]` — Escopo: expandir para operational runtime (Opção B)
  - [x] `[DEC-0023-A02]` — Topologia: `.governance/specs/` root + `.specify/` bridge (Opção B)
  - [x] `[DEC-0023-A03]` — Forma do runtime: wizard guiado, sem LLM embutido (Opção B)
  - [x] `[DEC-0023-A04]` — state.yml mínimo (4 chaves) (Opção B)
  - [x] `[DEC-0023-C01]` — Saúde: refatoração contida + dívidas contornadas + suíte formal

---

## ✅ Gate fechado — Escopo do PR2 (Bloco B)

- **Data:** 2026-05-19 (B01–B05); estendido em 2026-05-22 (B06); estendido em 2026-05-23 (B07)
- **Owner:** @rosanarezende
- **Pontos resolvidos:**
  - [x] `[DEC-0023-B01]` — Escopo do PR2: DX/docs com clipboard; bootstrap para PR3 (Opção B)
  - [x] `[DEC-0023-B02]` — AssembleBriefing frágil: documentar convenção + warning (Opção A)
  - [x] `[DEC-0023-B03]` — examples/: incluir `examples/minimal-spec/` mínimo (Opção B)
  - [x] `[DEC-0023-B04]` — Release npm: preview após PR3 com CHANGELOG explícito (Opção C)
  - [x] `[DEC-0023-B05]` — `plan.md` separado alinhado com boilerplate canônico (Opção B); registra decisão antes implícita
  - [x] `[DEC-0023-B06]` — Wizard CLI operacional mínimo (5 opções fixas declarativas, lookup-only) — promoção formal do insight em incubação (Opção A; PR5 S5)
  - [x] `[DEC-0023-B07]` — Opção 6 do wizard (Gerar prompt visual) — entrega declarada do embrião visual; reafirma gate de B06 para próximas opções (Opção B; review do PR #25)

---

## ✅ Gate fechado — Lifecycle metodológico (Bloco D, bootstrap)

- **Data:** 2026-05-19
- **Owner:** @rosanarezende
- **Pontos resolvidos:**
  - [x] `[DEC-0023-D01]` — Lifecycle de 4 fases + `tasks.md` como boundary canônico de execution authorization (Opção B)
  - [x] `[DEC-0023-D02]` — Stacked PRs reais (B estrutural) + CI mínimo de linkagem (parte leve de C); drift detection profundo deliberadamente diferido
  - [x] `[DEC-0023-D03]` — CI mínimo: script versionado + GitHub workflow (Opção B); escopo restrito a integridade estrutural
  - [x] `[DEC-0023-D04]` — PR1 da 0023 como pre-model declarado (Opção A); zero git surgery retroativa
  - [x] `[DEC-0023-D05]` — Lifecycle obrigatório para spec/proposal/spike; fast-track explícito para patch/fix/incident pequeno (Opção B)
- **Declaração de bootstrap:** PR2-lifecycle materializa este Bloco D introduzindo o modelo. Não é possível aplicar o modelo à sua própria introdução — bootstrap necessário e registrado.

---

## ✅ Gate fechado — Enforcement estrutural (Bloco E)

- **Data:** 2026-05-19
- **Owner:** @rosanarezende
- **Pontos resolvidos:**
  - [x] `[DEC-0023-E01]` — Princípio canônico `process awareness is not process enforcement` (Opção B; L2+L4 layered)
  - [x] `[DEC-0023-E02]` — Enforcement entra como Bloco E da 0023, não spec futura (Opção B; regra metodológica derivada)
  - [x] `[DEC-0023-E03]` — L2 + L4 agora (Opção B); L3 deferido com critério ≥ 2 casos; `executionAuthorized` derivado + runtime refuse local
  - [x] `[DEC-0023-E04]` — Itens deferidos com critérios de revisita observáveis registrados em NEXT.md e tasks.md
  - [x] `[DEC-0023-E05]` — Framing canônico anti-enterprise; fast-track strictness (label + rationale + state.yml + CI valida ambos)
- **ADR derivada:** ADR 0021 — Enforcement estrutural precede consciência comportamental (princípio perene; separada de ADR 0020 que cobre lifecycle/sequencing).
- **PR derivada:** PR4-enforcement-runtime (própria, separada de PR5-DX-thinking + PR6-DX-execution).

---

## ✅ Gate fechado — Índice operacional público mínimo (Bloco G)

- **Data:** 2026-05-21 (G01–G03); estendido em 2026-05-21 II (G04)
- **Owner:** @rosanarezende
- **Pontos resolvidos:**
  - [x] `[DEC-0023-G01]` — Separar artefato normativo, state efêmero e runtime derivado (Opção B)
  - [x] `[DEC-0023-G02]` — `.governance/runtime/active-specs.yml` como índice público mínimo (Opção B)
  - [x] `[DEC-0023-G03]` — `yarn workflow publish-state` manual primeiro; automação depois (Opção A)
  - [x] `[DEC-0023-G04]` — Vocabulário canônico stage/status do índice público + regra de projeção (`stage` projetado direto de `state.yml.stage`; `status` declarado, dimensões independentes)
  - [x] `[DEC-0023-G05]` — `active-specs.yml` permanece minimal canonical projection, não coordination source-of-truth; `title`/`base_branch` opcionais não-persistidos; gatilho de revisita se índice virar fonte de decisão operacional
- **Princípio operativo:** o índice público em `main` existe para descoberta e navegação operacional. Ele **não** define contrato da spec nem substitui a branch ativa como artefato denso.

---

## ✅ Gate fechado — Convergência taxonomy ↔ lifecycle (Bloco F)

- **Data:** 2026-05-22 (PR5 S5, via POC visual neutra; deferimento temporário 2026-05-19 → 2026-05-22 cravado em S1)
- **Owner:** @rosanarezende
- **Pontos resolvidos:**
  - [x] `[DEC-0023-F01]` — `incident` separado como entity nova (`OperationalState` em domain model); modelagem mínima para demais pilares (Opção B)
  - [x] `[DEC-0023-F02]` — Boundary canônico por classe (cada lifecycle intent ganha boundary próprio); definição fina por pilar exige research dedicada (Opção B)
  - [x] `[DEC-0023-F03]` — Boilerplate dedicado por classe (Opção A); materialização cravada como candidata `boilerplate-system-modernization` no backlog `Now`
  - [x] `[DEC-0023-F04]` — Múltiplos paths por classe (`.governance/{specs,incidents,...}`); topologia espelha taxonomy MECE (Opção A); vinculado à mesma candidata
  - [x] `[DEC-0023-F05]` — **Deferred com critério estrutural observável** — destino final da SSOT do princípio CORE-09/10 vinculado à abertura da candidata `handoff-as-first-class`. Não-violação de ADR 0021 item 7: deferimento tem evento concreto auditável (abertura da spec X), não "talvez depois"
- **Tríade arquitetural cravada:** F01+F02+F03+F04 = B+B+A+A. Cada classe MECE ganha modelo próprio em código (F01), boundary próprio no lifecycle (F02), template próprio (F03) e diretório próprio no consumidor (F04). Materialização real fica para spec dedicada (`boilerplate-system-modernization`).
- **Princípio operativo:** **"governança universal não significa artifacts universais"** — invariantes universais leves (accountability + traceability + outcome registration) materializam-se em boundaries class-specific, não em artifacts uniformes.

---

## ✅ Gate fechado — Modelo de identidade canônica da spec (Bloco I)

- **Data:** 2026-05-23
- **Owner:** @rosanarezende
- **Pontos resolvidos:**
  - [x] `[DEC-0023-I01]` — Resolução de spec ativa por identity canônica (id NNNN), não por branch slug literal (Opção B); remove `PublishState.resolveLocationFromIndexBranchMatch()` no commit de implementação
- **Princípio canônico (citável cross-spec):** Branch names são artefatos de coordenação operacional, não identificadores canônicos de spec. Spec identity = id `NNNN`; branch scope = sufixo livre. Detection (runtime local) ≠ projection (`active-specs.yml`).
- **Commit de código:** separado per `[CORE-06]` — `feat(workflow): resolve active spec by canonical spec id (Bloco I)`.

---

## ✅ Gate fechado — Semântica operacional de Draft / Ready / Mergeable (Bloco J)

- **Data:** 2026-05-23/24 (Frente #3 do hardening do PR #25)
- **Owner:** @rosanarezende
- **Pontos resolvidos:**
  - [x] `[DEC-0023-J01]` — Materializar Draft/Ready/Mergeable como ADR 0024 (princípio perene) + Bloco J (origem empírica) + redesign do PR template (operacionalização) — Opção B
- **Princípio canônico (citável cross-spec via ADR 0024):** Em fluxos governance-first com stacked PRs (ADR 0020), Draft (WIP) ≠ Ready (review-ready) ≠ Mergeable (stack inteira Ready + autorização explícita do owner). 3 estados distintos.
- **ADR derivada:** ADR 0024 — Draft, Ready e Mergeable são estados distintos em PRs governance-first (status `Aceita`; validação empírica na própria stack da 0023).
- **Commit de implementação:** separado per `[CORE-06]` — `feat(github): redesign do pull_request_template (ADR 0024)`.
- **Vinculação cruzada com F05:** F05 (Deferred com critério estrutural) trata de **WHERE** a SSOT de CORE-09/10 vive (vinculado à candidata `handoff-as-first-class`). J01 trata de **WHAT** os estados Draft/Ready/Mergeable significam. **Sem conflito.**

---

## ✅ Gate fechado — Integration PR (Bloco K)

- **Data:** 2026-05-24
- **Owner:** @rosanarezende
- **Pontos resolvidos:**
  - [x] `[DEC-0023-K01]` — Introduzir Integration PR para homologação/convergência final da stack 0023 (Opção B)
- **Princípio canônico:** Integration PR é PR agregador de homologação/convergência. Não cria comportamento novo, não é deploy PR e não autoriza merge sozinho.
- **Dogfooding:** PR #26 deve usar o modelo para validar ponta-a-ponta a stack `#18 → #19 → #22 → #23 → #24 → #25` antes da autorização humana de merge atômico.

---

## ✅ Gate fechado — Operational CLI commands (Bloco L)

- **Data:** 2026-05-24 (II — Frente C+D do hardening do PR #25)
- **Owner:** @rosanarezende
- **Pontos resolvidos:**
  - [x] `[DEC-0023-L01]` — Materializar `integration-pr` e `merge-stack` como wizard options 4+5 (framework tier 2); `release-prep` standalone tier 3 repo-specific (Opção C)
- **Princípio canônico (citável cross-spec via ADR 0024 amendment):** Operational CLI commands são **transactional helpers** — deterministic + human-gated + composable. Side-effects irreversíveis vivem atrás de plan + confirmation, não atrás de "lembre a sequência certa de `git`/`gh`".
- **Tier model cravado:**
  - **Tier 1 — Lookup** (wizard options 1-2, 6-7): read-only ou trivial (clipboard)
  - **Tier 2 — Coordination** (wizard options 3-5): governance ops cross-spec com confirmation
  - **Tier 3 — Repo-specific** (standalone `yarn guidelines <cmd>`): release-prep, repo-side ops
- **ADR atualizado:** ADR 0024 ganhou seção "Operational CLI commands para transactional governance ops" (amendment, não novo ADR — owner cravou economia editorial).
- **Commits de implementação:** ~5 commits separados per `[CORE-06]` (StackOps port + use cases + wizard wire + release-prep standalone + docs).
- **Vinculação cruzada:** `[DEC-0023-G03]` refinado — manual-first protege contra automação stateful, não contra CLI helpers transacionais com plan + confirmation. CLI helpers que reduzem friction enxergada em advance honram G03 desde que mantenham gate humano explícito.

---

## Checklist pós-gate

- [x] **(1)** `plan.md` separado em `.governance/specs/0023-workflow-runtime/plan.md` (cf. `[DEC-0023-B05]` Opção B — alinhado com boilerplate canônico; 4 PRs candidatos; PR1 merged, PR2 escopo cravado em Bloco B).
- [x] **(2)** Tasks operacionais para PR1 criadas (T1–T9, todas completed em `feat/spec-0023-workflow-runtime`).
- [x] **(3)** Status agregado `Resolved` no header e na tabela (mantido após adição de Bloco B).
- [x] **(4)** Commit atômico marcando o gate da Stage A: `docs(spec-0023): pivot para workflow-runtime — gate Stage A → Stage B fechado` (`9dedce5`).
- [ ] **(5)** Commit atômico marcando o gate do Bloco B (PR2): `docs(spec-0023): gate de escopo do PR2 fechado (Bloco B)`.
