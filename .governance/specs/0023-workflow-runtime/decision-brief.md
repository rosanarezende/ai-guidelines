<!-- ai-guidelines-template: decision-brief-boilerplate v=2 -->

# Decision Brief — Spec 0023 Workflow Runtime

> Spec: [`./spec.md`](./spec.md)
> Plan: inline no `spec.md` § Rollout (vira `./plan.md` próprio quando ≥ 4 PRs).
> Tasks: tasklist da sessão de implementação (PR1).
> Status agregado: **Resolved**
> Última atualização: 2026-05-19 — gate Stage A → Stage B fechado; pivot materializado.

> **Artefato canônico do gate humano entre Stage 1 (research) e Stage 2 (design + implementação).** Para esta spec, a Stage 1 é a investigação documentada na pasta legacy `.specify/specs/0023-governance-workflow-discovery-model/` (research.md + anexos). Este brief materializa o gate Stage A → Stage B com 4 decisões cravadas em sessão de design 2026-05-19.

---

## Resumo de status

| ID               | Bloco | Status   |
| :--------------- | :---- | :------- |
| `[DEC-0023-A01]` | A     | Resolved |
| `[DEC-0023-A02]` | A     | Resolved |
| `[DEC-0023-A03]` | A     | Resolved |
| `[DEC-0023-A04]` | A     | Resolved |
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

## ✅ Gate fechado

- **Data:** 2026-05-19
- **Owner:** @rosanarezende
- **Pontos resolvidos:**
  - [x] `[DEC-0023-A01]` — Escopo: expandir para operational runtime (Opção B)
  - [x] `[DEC-0023-A02]` — Topologia: `.governance/specs/` root + `.specify/` bridge (Opção B)
  - [x] `[DEC-0023-A03]` — Forma do runtime: wizard guiado, sem LLM embutido (Opção B)
  - [x] `[DEC-0023-A04]` — state.yml mínimo (4 chaves) (Opção B)
  - [x] `[DEC-0023-C01]` — Saúde: refatoração contida + dívidas contornadas + suíte formal

---

## Checklist pós-gate

- [x] **(1)** `plan.md` inline em `spec.md` § Rollout (4 PRs candidatos; PR1 ativo).
- [x] **(2)** Tasks operacionais para PR1 criadas (T1–T9 — tasklist da sessão de implementação).
- [x] **(3)** Status agregado `Resolved` no header e na tabela.
- [ ] **(4)** Commit atômico marcando o gate: `docs(spec-0023): pivot para workflow-runtime — gate Stage A → Stage B fechado`.
