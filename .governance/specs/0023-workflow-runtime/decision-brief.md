<!-- ai-guidelines-template: decision-brief-boilerplate v=2 -->

# Decision Brief — Spec 0023 Workflow Runtime

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md) (criado em 2026-05-19 conforme `[DEC-0023-B05]`).
> Tasks: tasklist da sessão de implementação (PR1).
> Status agregado: **Resolved**
> Última atualização: 2026-05-19 — gate Stage A → Stage B fechado (Bloco A); gate de escopo do PR2 fechado (Bloco B, incluindo B05 sobre plan.md inline vs separado).

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
| `[DEC-0023-C01]` | C     | Resolved |

**Status agregado:** Resolved.

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

| Opção | Descrição                                                                                                                                                                                     | Pró                                                                                                                         | Contra                                                                                                                   |
| :---- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| A     | **Múltiplos comandos especializados** (start-spec, review-research, etc.)                                                                                                                     | Responsabilidades explícitas.                                                                                               | Cresce a superfície; humano lembra comandos; viola "reduz carga cognitiva".                                              |
| B     | **Wizard contextual** (`workflow` + atalho `continue`): REPL local, briefing + menu numerado + texto livre que gera **context bundle** copy-paste-ready para sessão IA. **Sem LLM embutido.** | Superfície mínima; AI-as-Channel preservado; runtime offline-friendly; conversação fica onde já é boa (Claude Code/Cursor). | Tradeoff: terminal puro não tem chat; usuário cola bundle no agente IA externo.                                          |
| C     | **REPL com LLM embutido**: runtime chama Claude/OpenAI API internamente, interpreta intenção, responde.                                                                                       | UX conversacional direta.                                                                                                   | Viola ADR 0018; cria dependência de provider; custo recorrente; concorre com Claude Code/Cursor; framework vira wrapper. |

**Recomendação inicial (a confirmar pós-gate):** Opção B — única coerente com ADR 0018 e com a métrica de cognitive load.

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:**
  - [ ] A
  - [x] B
  - [ ] C
- **Justificativa / Ressalvas:**
  > B preserva AI-as-Channel, mantém runtime AI-agnóstico, offline-friendly, sem custo de provider. Texto livre vira context bundle copy-paste-ready; quando o humano está dentro de um agente IA, o agente pode chamar `workflow briefing` por baixo e usar o output. **Não embutir LLM no framework** é restrição arquitetural cravada.
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
- Clipboard detection é **acabamento** do bundle UX existente, não comando novo.

**Opções:**

| Opção | Descrição                                              | Pró                                                        | Contra                                                                           |
| :---- | :----------------------------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------------------------------- |
| A     | PR2 = docs only; clipboard junto com bootstrap em PR3. | Disciplina absoluta com "sem abstrações novas".            | Bundle UX fica meia-pronto durante todo o PR2; docs precisariam apologizar.      |
| B     | PR2 = DX/docs com clipboard; bootstrap fica para PR3.  | Bundle UX fica completo; bootstrap recebe decisão própria. | Linha "abstração nova vs acabamento" precisa ser explícita.                      |
| C     | PR2 = DX/docs + bootstrap.                             | Tudo junto, próximo release tem mais coisa.                | Bootstrap nasce sem decision-brief próprio; risco AP1 (planning antes research). |

**Decisão do Gate Humano:**

- **Status:** [x] Resolvido
- **Escolha:** [ ] A | [x] B | [ ] C
- **Justificativa:** Clipboard é acabamento essencial do bundle (heart da experiência AI-as-Channel). Sem ele, o fluxo parece incompleto e a tese principal ("runtime como lente, IA como canal") perde força operacional. Bootstrap é comando novo, merece decisão própria — vai para PR3 com brief próprio.
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
| B     | Lançar preview após PR2 (docs/DX entregue, bootstrap ainda ausente).  | Discovery (README) e bundle (clipboard) prontos.               | Runtime continua "leitor only"; quem tenta criar spec se vira só. |
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

### Riscos conscientemente aceitos no PR2

- **Branch name dependency permanece** (`feat|fix|docs|chore|refactor/spec-NNNN-{slug}`). Documentado no README como convenção necessária. Não é prioridade até feedback externo reportar friction.
- **`AssembleBriefing` continua frágil** (cf. B02). Documentação explica a convenção atual; warning é a primeira linha de defesa.
- **`state.yml` em spec existente continua manual** (cf. B01). Bootstrap é PR3.
- **`NodeWorkflowFileSystem` coverage 9%** (sem integration test próprio). Integration test do dispatch (item G) cobre o caminho crítico end-to-end; coverage por arquivo só sobe com fixtures hermeticas em PR3+.
- **Spec piloto continua viva em branch** até merge para `main`. Examples folder substitui o piloto para consumidores via npm enquanto isso.

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

- **Data:** 2026-05-19
- **Owner:** @rosanarezende
- **Pontos resolvidos:**
  - [x] `[DEC-0023-B01]` — Escopo do PR2: DX/docs com clipboard; bootstrap para PR3 (Opção B)
  - [x] `[DEC-0023-B02]` — AssembleBriefing frágil: documentar convenção + warning (Opção A)
  - [x] `[DEC-0023-B03]` — examples/: incluir `examples/minimal-spec/` mínimo (Opção B)
  - [x] `[DEC-0023-B04]` — Release npm: preview após PR3 com CHANGELOG explícito (Opção C)
  - [x] `[DEC-0023-B05]` — `plan.md` separado alinhado com boilerplate canônico (Opção B); registra decisão antes implícita

---

## Checklist pós-gate

- [x] **(1)** `plan.md` separado em `.governance/specs/0023-workflow-runtime/plan.md` (cf. `[DEC-0023-B05]` Opção B — alinhado com boilerplate canônico; 4 PRs candidatos; PR1 merged, PR2 escopo cravado em Bloco B).
- [x] **(2)** Tasks operacionais para PR1 criadas (T1–T9, todas completed em `feat/spec-0023-workflow-runtime`).
- [x] **(3)** Status agregado `Resolved` no header e na tabela (mantido após adição de Bloco B).
- [x] **(4)** Commit atômico marcando o gate da Stage A: `docs(spec-0023): pivot para workflow-runtime — gate Stage A → Stage B fechado` (`9dedce5`).
- [ ] **(5)** Commit atômico marcando o gate do Bloco B (PR2): `docs(spec-0023): gate de escopo do PR2 fechado (Bloco B)`.
