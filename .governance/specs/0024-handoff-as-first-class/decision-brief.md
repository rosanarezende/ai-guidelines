<!-- ai-guidelines-template: decision-brief-boilerplate v=2 -->

# Decision Brief — Spec 0024 Handoff as First-Class

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Tasks: [`./tasks.md`](./tasks.md)
> Status agregado: **Open**
> Última atualização: 2026-05-28 (2ª iteração do dia) — instanciação inicial + integração do 3º turno tri-party (review do ChatGPT do PR #30): adiciona obs #6 ao preâmbulo + cria `[DEC-0024-D04]` ("unidade canônica de promoção") como pré-requisito de D01-D03.

> **Artefato canônico do gate humano entre Stage 1 (research) e Stage 2 (design + implementação).** Esta spec é `evidence-driven`. Apresenta opções com tradeoffs antes do gate humano e registra decisões validadas após o gate. **Permanece no diretório da spec após o merge** como artefato histórico.

---

## Preâmbulo — Síntese empírica observada (não-decisional, cravada)

> Este preâmbulo registra **fatos operacionais observados** que motivam a spec, não decisões a serem tomadas. Cravado para impedir que research re-derive premissas já validadas. Cresce conforme novas observações empíricas emergirem (com cross-ref a research artifacts).

**Observações cravadas:**

1. **Handoff situado > distribuição estática** (Spec 0023 PR4 / 2026-05-22 + sessão de planejamento desta spec / 2026-05-28). Sessão IA iniciada com handoff redigido manualmente alcançou aderência ao processo qualitativamente superior à sessão iniciada apenas com `AGENTS.md` + arquivos por canal. Diferença não-marginal, de classe operacional. Princípio cravado em ADR 0022.

2. **Memory feedbacks de provider não viajam** (observação 2026-05-20). Salvos em `~/.claude/projects/.../memory/` são local-only — não viajam entre providers nem entre máquinas. Gap estrutural: contexto que deveria ser portável acumula em camada não-portável.

3. **Pressão "consciência ≠ aderência" é universal, não única do projeto** (síntese de transcrições 2026-05-28). Lucas Montano abre vídeo Hermes literalmente com "quantas vezes essa semana tu teve que explicar a mesma coisa pro cloud?" — exatamente a formulação do ai-guidelines. Diferencial do framework: leitura **governance-first** da pressão (não memory-first como Hermes/OpenCloud, não harness-first como Cursor SDK).

4. **Tri-party humano + Claude + ChatGPT emergiu sem ritual** (sessão 2026-05-28, segundo caso documentado após Spec 0023 PR5/PR #25). ChatGPT como segunda opinião sobre tensão da cláusula anti-paper da ADR 0023; Claude como implementador + análise; owner como decisão final. Cf. item `[1.H.10]` da 0023 (avaliação de promoção a ADR pendente; critério "≥ 2 specs adicionais OU adoção espontânea").

5. **Lifecycle de spec/decision-brief/ADR já É pipeline de promoção** (insight crystalized 2026-05-28). Hermes faz `task completion → pattern extraction → skill creation → skill refinement` em agent runtime. ai-guidelines faz `observação → backlog → spec → decision-brief → ADR/regra` em governance lifecycle. Mesma forma estrutural. Implicação: handoff = projeção/lookup; aprendizado vive no lifecycle humano-curado existente. Conflar viola ADR 0018.

6. **Pipeline de promoção tem unidade nomeada faltando** (insight crystalized via review do ChatGPT do PR #30 — 3º turno tri-party da sessão / 2026-05-28). Embora o lifecycle exista (obs #5), o framework usa termos diversos sem hierarquia formal: _observação, padrão, sinal recorrente, regra situacional, regra formal, skill, insight, comportamento, ADR_. Sem taxonomia clara, perguntas de Bloco D ficam indefinidas (não há resposta operacional para "quando algo sobe de nível?"). Hipótese inicial: pode existir cadeia tipo `observação → sinal recorrente → regra situacional → regra formal → ADR`, mas forma exata emerge da research dos sistemas externos. Cravado como `[DEC-0024-D04]` (pré-requisito para D01-D03). Cf. seção "Continuação tri-party — 3º turno" em `research/2026-05-28-this-session-as-evidence.md`.

**Convergências observadas em sistemas externos** (síntese rápida; detalhada em `research/`):

- Markdown vence como SSOT (Hermes, Cursor, Open Code, ai-guidelines — todos).
- Harness é o produto, modelo é commodity (Lucas Montano "modelo = 20%, harness = 80%"; Cursor SDK valida).
- Provider-agnosticism é diferencial econômico (Open Code; Microsoft cancellation do Cloud Code valida pressão de custo).
- Skill-as-procedure (Hermes) e tasks-as-boundary (ai-guidelines) são leituras diferentes da mesma pressão.

**Lacuna observada (diferencial governance-first do ai-guidelines):**

Nenhum dos sistemas estudados trata **governança do próprio processo** como eixo de primeira classe. Hermes governa skills; Cursor governa código; Open Code é stateless; ai-guidelines governa o processo spec/decision/execution. Esse é o nicho que esta spec precisa preservar e investigar.

---

## Legenda canônica de status

| Status     | Significado                                                                                                        |
| :--------- | :----------------------------------------------------------------------------------------------------------------- |
| `Open`     | Ponto criado, sem opções populadas (ainda em research).                                                            |
| `Pendente` | Opções populadas com tradeoffs, aguardando o gate humano.                                                          |
| `Partial`  | Algumas sub-decisões cravadas, outras abertas. Aplica-se apenas a pontos com sub-eixos.                            |
| `Resolved` | Escolha cravada com data + owner. **Imutável** — mudanças posteriores vão para `plan.md` § "Decisões revisitadas". |

**Status agregado da brief:** `Open` enquanto nenhum ponto saiu de `Open`/`Pendente`. `Partial` quando ≥ 1 ponto está `Resolved` mas há outros não-resolvidos. `Resolved` quando todos os pontos estão `Resolved` — gatilho do checklist pós-gate.

---

## Convenção de IDs

- **Formato:** `[DEC-0024-XYZ]` — `X` = letra do bloco (A, B, …); `YZ` = sequência ordinal de 2 dígitos.
- **Pontos derivados** durante research: abrir novo ponto com nota de origem; manter sequência sem reusar gaps.
- Após `Resolved`, **nunca editar retroativamente** — mudanças vão para `plan.md` § "Decisões revisitadas".

---

## Estrutura dos blocos

Os blocos **A, B, D, E, F** mapeiam um-para-um aos **5 eixos de pressão arquitetural** (per síntese 2026-05-28 / cf. [`research/2026-05-28-pressure-axes-scope.md`](./research/2026-05-28-pressure-axes-scope.md)). O **Bloco C — Saúde Técnica** é bloco **transversal mandatório** do template canônico de decision-brief (cf. [`.ai-guidelines/templates/decision-brief-boilerplate.md`](../../../.ai-guidelines/templates/decision-brief-boilerplate.md) § "Bloco C") — **não** um sexto eixo de pressão.

- **Bloco A** — Seleção _(eixo de pressão)_
- **Bloco B** — Persistência _(eixo de pressão)_
- **Bloco C** — Saúde Técnica _(transversal mandatório — template)_
- **Bloco D** — Promoção _(eixo de pressão)_
- **Bloco E** — Projeção _(eixo de pressão)_
- **Bloco F** — Governança _(eixo de pressão)_

Pontos iniciais entram como `Open` com pergunta cravada e contexto pendente. Opções emergem da research dos sistemas externos enumerados em `spec.md § Pesquisa de contexto`.

---

## Bloco A — Seleção

> Quem seleciona contexto, quando e quanto. Eixo central per síntese empírica ("seleção é o problema").

### [DEC-0024-A01] Quem faz seleção contextual?

**Pergunta:** A seleção de contexto operacional (regras situacionais, slice de estado, ordem de leitura) é feita pelo **agente** (inferência por turno), pelo **sistema** (lookup determinístico), ou pelo **humano** (curadoria explícita)? Mais provavelmente: qual combinação?

**Contexto (research):**

- Pendente — alimentado por análise comparativa (Hermes/Cursor/Open Code/Anthropic/Spec Kitty).
- Hipótese a investigar: ai-guidelines convergente para "sistema seleciona, humano cura, agente consome" (per ADR 0021 + 0022). Confirmar via convergência com sistemas externos.

**Status:** Open

### [DEC-0024-A02] Quando a seleção acontece?

**Pergunta:** Boot único de sessão (handoff), per-turno (re-seleção contínua), per-task (intermediário), on-demand (sob comando humano), ou múltiplos pontos? Custo amortizável vs recorrente.

**Contexto (research):**

- Pendente. Pressão empírica: per-turno é caro; boot é o sweet-spot mas perde contexto novo dentro da sessão; on-demand cobre intermediário mas exige saber quando pedir.

**Status:** Open

### [DEC-0024-A03] Quanto contexto é descartado?

**Pergunta:** Qual o critério para incluir vs excluir contexto na projeção entregue? Como evitar "carregar AGENTS.md inteiro" (rules-as-payload) e "perder regra crítica" (rules-as-catalog underdelivery)?

**Contexto (research):**

- Pendente. Conecta com formulação "custo de seleção" cravada na sessão 2026-05-28 — eixo da decisão entre payload mode e catalog mode.

**Status:** Open

---

## Bloco B — Persistência

> O que persiste vs o que é situado/efêmero. Quem tem autoridade sobre persistência.

### [DEC-0024-B01] O que persiste vs o que expira?

**Pergunta:** Quais categorias de informação são SSOT persistente (regras, decisões, ADRs, state.yml) vs derivações situadas (handoff projetado, wizard menu, briefing) vs ephemeral (memória de provider, transcripts de sessão)?

**Contexto (research):**

- Hermes: 3 camadas (session / persistent / skill); Cursor: session vs codebase index.
- Hipótese: ai-guidelines já tem clareza forte aqui (SSOT em git, projeções derivadas, memory de provider banida da governança). Investigar se sistemas externos têm pressão que o framework ainda não modelou.

**Status:** Open

### [DEC-0024-B02] Quem tem autoridade sobre persistência?

**Pergunta:** Sistema decide automaticamente o que persiste (skill auto-creation tipo Hermes), humano decide via PR (modelo atual), ou modelo híbrido (sistema sugere, humano promove)?

**Contexto (research):**

- Hermes opera modelo automático. ai-guidelines opera modelo humano-curado.
- Pressão a verificar: o modelo automático escala melhor em volume mas perde governança; o modelo curado escala melhor em qualidade mas tem custo cognitivo. Há ponto ótimo intermediário?

**Status:** Open

---

## Bloco C — Saúde Técnica e Dívidas Associadas

> **Bloco Mandatório.** Adaptado para spec research-first: o componente que implementará a spec **não existe ainda** — emerge das decisões de eixo. Análise restrita ao que é observável em Stage 1.

### [DEC-0024-C01] Saúde arquitetural e dívidas técnicas (research-first scope)

**Pergunta:** Qual é o estado de saúde dos componentes existentes que **serão tocados pela implementação derivada desta spec** (Stage 2, spec separada), e quais dívidas técnicas já mapeadas podem impactar o escopo?

**Contexto (research):**

- Para uma spec research-first, este bloco mapeia componentes-alvo prováveis: `src/cli/workflow.ts` (runtime atual), `src/app/workflow/*` (use cases), `src/app/ports/*` (porta de prompts), `cli/` (entrypoint legado), `AGENTS.md` raiz (SSOT).
- Dívidas conhecidas: `cli-mjs-to-src-ddd-cutover` (item vivo do backlog); `coverage-rigor-enforcement` (Now §3 indireto).

**Eixos a decidir:**

1. **Saúde Arquitetural:** Qual é o diagnóstico do runtime existente que abrigará o handoff?
2. **Dívidas Técnicas:** As dívidas conhecidas (cli legado, coverage rigor) bloqueiam a implementação derivada?
3. **Estratégia de Validação e Qualidade:** A suíte atual (682 testes, BDD pt-BR) é suficiente para a implementação derivada?

#### Sub-eixo 1 — Saúde Arquitetural

| Opção | Descrição                                                                                                               |
| :---- | :---------------------------------------------------------------------------------------------------------------------- |
| A     | **Saudável:** runtime atual (Spec 0023) é coeso o suficiente para absorver handoff como nova projeção sem refactor.     |
| B     | **Requer Refatoração:** integração do handoff exige refactor tático (ex.: extrair "projection layer" de `workflow.ts`). |
| C     | **Requer Re-arquitetura:** runtime atual não suporta múltiplas projeções; precisa redesign antes da implementação.      |

#### Sub-eixo 2 — Dívidas Técnicas

| Opção | Descrição                                                                                                                                            |
| :---- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | **Nenhuma Dívida Relevante:** dívidas conhecidas (cli legado, coverage) não impactam handoff.                                                        |
| B     | **Dívidas Contidas:** dívidas podem ser isoladas; plan de implementação registra mas não expande escopo.                                             |
| C     | **Dívidas Bloqueadoras:** cli legado e/ou coverage gap bloqueiam handoff seguro; escopo da spec implementadora **deve ser expandido** para pagá-las. |

#### Sub-eixo 3 — Estratégia de Validação e Qualidade

| Opção | Descrição                                                                                                                                         |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| A     | **Suficiente:** suíte atual (BDD pt-BR + integration tests + smoke) cobre testes do handoff sem expansão metodológica.                            |
| B     | **Requer Extensão:** handoff precisa de categoria nova de testes (ex.: snapshot de projeção, validação de slice selection); plan v2 declara.      |
| C     | **Requer Reforma:** validation strategy atual é insuficiente (cf. backlog `coverage-rigor-enforcement`); spec depende da reforma fechar primeiro. |

**Decisão do Gate Humano:**

- **Status:** [ ] Pendente | [ ] Resolvido
- **Sub-eixo 1 — Saúde Arquitetural:** [ ] A [ ] B [ ] C
- **Sub-eixo 2 — Dívidas Técnicas:** [ ] A [ ] B [ ] C
- **Sub-eixo 3 — Estratégia de Validação e Qualidade:** [ ] A [ ] B [ ] C
- **Justificativa / Ressalvas:** >
  [Pendente até research consolidar análise dos componentes-alvo prováveis.]
- **Data / Owner:** [pendente] / [pendente]

---

## Bloco D — Promoção

> Como observações viram regras. Onde mora a curadoria humana. Crítico — protege o diferencial governance-first.
>
> **Nota de leitura:** `[DEC-0024-D04]` é **pré-requisito** para `D01-D03`. Sem taxonomia clara da _unidade promovível_, perguntas sobre "como sobe de nível?" / "quem promove?" / "onde mora a curadoria?" ficam indefinidas. Research deve cravar D04 primeiro (ou em paralelo) e usar as respostas para ancorar D01-D03.

### [DEC-0024-D04] Qual é a unidade canônica de promoção contextual?

**Pergunta:** Antes de responder D01-D03, qual é a **taxonomia das unidades promovíveis**? Hoje o framework usa termos diversos sem hierarquia formal: _observação, padrão, sinal recorrente, regra situacional, regra formal, skill, insight, comportamento, ADR_. Sem nomeação clara, fica difícil responder operacionalmente "quando algo sobe de nível?".

**Contexto (research):**

- **Origem:** insight cravado via review do ChatGPT do PR #30 (3º turno tri-party desta sessão / 2026-05-28). Cf. preâmbulo § obs #6 + `research/2026-05-28-this-session-as-evidence.md` § "Continuação tri-party — 3º turno".
- **Hipótese inicial a investigar** (não confirmada — emerge da research): pode existir cadeia tipo `observação → sinal recorrente → regra situacional → regra formal → ADR`, com critérios de elevação cravados em cada degrau (ex.: ≥ N casos sem fechamento = sinal recorrente; sinal recorrente + ≥ 1 sessão de design = regra situacional; ≥ 2 specs validando = regra formal; etc.).
- **Vocabulário existente a mapear:** ai-guidelines tem `ADR`, `CORE`, `GR`, `opt-in`, `DEC`, `regra situacional` (mencionada em [DEC-0023-F05]); Hermes tem `skill`; Cursor tem peças do `harness`; Open Code não tem unidade promovível (stateless por design). Cada vocabulário deve ser mapeado contra a hipótese.
- **Conexão estrutural:** sem D04 resolvido, `D01` (como observações viram regras?), `D02` (handoff promove autonomamente?) e `D03` (onde mora a curadoria?) ficam mal-formuladas — todas pressupõem uma unidade nomeada que ainda não existe.

**Status:** Open

### [DEC-0024-D01] Como observações viram regras situacionais?

**Pergunta:** O pipeline atual (observação → backlog → spec → decision-brief → ADR/regra) é suficiente para promover padrões a regras situacionais entregues pelo handoff, ou precisa de etapa intermediária ("candidate situational rule" antes de virar CORE/GR formal)?

**Contexto (research):**

- Hipótese cravada na sessão 2026-05-28: o lifecycle existente JÁ é o pipeline de promoção; handoff só projeta o que o lifecycle promoveu. Não há aprendizado novo no handoff.
- A verificar: regras situacionais (tipo `CORE-09/10` per `[DEC-0023-F05]`) precisam de promoção tradicional via ADR, ou cabem como categoria intermediária ("situational" entre `universal` e `opt-in`)?

**Status:** Open

### [DEC-0024-D02] Handoff promove autonomamente?

**Pergunta:** O handoff (runtime determinístico) pode promover padrões observados em sessões a skills/regras automaticamente, ou toda promoção exige ato humano explícito?

**Contexto (research):**

- **Resposta provavelmente já cravada** por ADR 0018 + ADR 0022: NÃO. Handoff é projeção; aprendizado humano-no-loop.
- Mantido como DEC explícita para registro defensivo — impede que research deriva para Hermes-style learning loop.
- Hermes resolve via runtime separado que CHAMA LLM para extrair pattern; ai-guidelines não tem esse runtime nem o terá (ADR 0018).

**Status:** Open (recomendação inicial: cravar como "NÃO" — formaliza não-objetivo de spec.md)

### [DEC-0024-D03] Onde mora a curadoria humana?

**Pergunta:** Em que momento operacional o humano cura padrões observados em regras (PR? wizard? comando explícito? hook?)? Existe overhead que pode ser reduzido sem perder a curadoria?

**Contexto (research):**

- Pendente — emerge da análise comparativa (Hermes hooks, Cursor session management, Anthropic dreaming review).

**Status:** Open

---

## Bloco E — Projeção

> Mesma SSOT, múltiplas projeções por consumidor. Conecta com ADR 0023 generalizada (com freio anti-paper).

### [DEC-0024-E01] Mesma SSOT gera múltiplas projeções?

**Pergunta:** O conjunto SSOT (state.yml + tasks.md + decision-brief + ADRs vigentes + AGENTS.md) deve gerar N projeções determinísticas por consumidor (handoff completo, wizard menu, briefing curto, dashboard HTML, etc.), ou cada projeção é decisão independente?

**Contexto (research):**

- ADR 0023 generaliza "SSOT + derivações" para meta-artefatos. Esta DEC investiga se a generalização vale para o handoff também (estendendo o princípio) ou se handoff é caso à parte.
- Matriz por consumidor (Humano/Agente/Git/Dashboard/Busca → Markdown/HTML/handoff/índice/visualização) emergiu na síntese da sessão 2026-05-28.

**Status:** Open

### [DEC-0024-E02] Como cada consumidor recebe contexto?

**Pergunta:** Para cada consumidor identificado (sessão IA fresca, sessão IA continuando, humano operador via wizard, humano lendo PR, etc.), qual o formato e densidade ótimos?

**Contexto (research):**

- Pendente — alimentado por análise de Hermes (skill/memory render), Cursor (session restore), Open Code (provider-agnostic formato).

**Status:** Open

### [DEC-0024-E03] Formato canônico por consumidor?

**Pergunta:** Markdown vence como SSOT (convergência observada). Mas para projeção, o formato ótimo varia: HTML para humano denso? Markdown estruturado para agente? Slice YAML para script? Critério de escolha?

**Contexto (research):**

- Vídeo 1 (Lucas Montano HTML vs MD) trata exatamente disso, mas em superfície. Argumento real: projeções especializadas por consumidor. Vale conectar com ADR 0023.

**Status:** Open

---

## Bloco F — Governança

> Quem tem autoridade final. Trilha auditável. Diferencial governance-first vs outros sistemas. Eixo único do ai-guidelines.

### [DEC-0024-F01] Quem tem autoridade sobre o que merece ser lembrado?

**Pergunta:** O sistema (handoff/runtime) tem autoridade para decidir o que projetar? O humano (via comando explícito)? A combinação (sistema sugere ranking, humano confirma)?

**Contexto (research):**

- Conecta com governance-pr-check + wizard atual: sistema enforces, humano autoriza. Provável que handoff siga mesmo padrão.
- Eixo único do ai-guidelines — nenhum dos sistemas externos trata autoridade governada como pergunta de primeira classe.

**Status:** Open

### [DEC-0024-F02] Trilha auditável de projeções?

**Pergunta:** Cada projeção entregue (handoff de sessão X, briefing de sessão Y) deve deixar trilha auditável (log/artifact versionado) ou é efêmera por design?

**Contexto (research):**

- Pendente — investigar tensão entre "auditabilidade" (governance) e "low-overhead" (DX).

**Status:** Open

### [DEC-0024-F03] Diferencial governance-first como invariante?

**Pergunta:** O posicionamento "governança do próprio processo como eixo de primeira classe" deve virar invariante declarado (ADR nova?) ou continuar como leitura emergente do conjunto ADR 0018 + 0020 + 0021 + 0022?

**Contexto (research):**

- Síntese 2026-05-28: nenhum sistema externo estudado tem governance-as-first-class. Esse é o nicho diferenciador.
- Decisão depende de quanto sinal a research consolidar — se for forte, vira ADR; se ambíguo, fica como leitura distribuída.

**Status:** Open

---

## Resumo de status

| ID               | Bloco | Status |
| :--------------- | :---- | :----- |
| `[DEC-0024-A01]` | A     | Open   |
| `[DEC-0024-A02]` | A     | Open   |
| `[DEC-0024-A03]` | A     | Open   |
| `[DEC-0024-B01]` | B     | Open   |
| `[DEC-0024-B02]` | B     | Open   |
| `[DEC-0024-C01]` | C     | Open   |
| `[DEC-0024-D01]` | D     | Open   |
| `[DEC-0024-D02]` | D     | Open   |
| `[DEC-0024-D03]` | D     | Open   |
| `[DEC-0024-D04]` | D     | Open   |
| `[DEC-0024-E01]` | E     | Open   |
| `[DEC-0024-E02]` | E     | Open   |
| `[DEC-0024-E03]` | E     | Open   |
| `[DEC-0024-F01]` | F     | Open   |
| `[DEC-0024-F02]` | F     | Open   |
| `[DEC-0024-F03]` | F     | Open   |

**Status agregado:** `Open` — research em curso, opções pendentes.

---

## ✅ Gate fechado

> Bloco final assinado pelo owner quando **todos** os pontos estão `Resolved`. **Não preencher** antes disso.

- **Data:** [pendente]
- **Owner:** [pendente]
- **Pontos resolvidos:**
  - [ ] `[DEC-0024-A01]` ... `[DEC-0024-F03]`

---

## Checklist pós-gate

> **[MANDATÓRIO]** Após assinatura do gate, executar os 4 passos abaixo de forma atômica.

- [ ] **(1)** `plan.md` v2 publicado: cada subseção de design técnico deriva de um `[DEC-0024-XYZ]` e referencia o ponto.
- [ ] **(2)** `tasks.md` v2 publicado: placeholder de Stage 2 substituído por tasks operacionais.
- [ ] **(3)** Status agregado desta brief mudado para `Resolved`.
- [ ] **(4)** Commit atômico marcando o gate (`docs(spec-0024): gate humano fechado — plan v2 + tasks v2 publicados`).
