<!-- ai-guidelines-template: decision-brief-boilerplate v=2 -->

# Decision Brief — Spec 0024 Handoff as First-Class

> Spec: [`./spec.md`](./spec.md)
> Plan: [`./plan.md`](./plan.md)
> Tasks: [`./tasks.md`](./tasks.md)
> Status agregado: **Open**
> Última atualização: 2026-05-28 (3ª iteração do dia) — integração dos turnos tri-party 4 e 5 (ChatGPT review da iteração D04 + ChatGPT review do PR #31 já mergeado): expansão de D04 com sub-questão "critérios de elevação" + nova `[DEC-0024-F04]` ("invariantes estruturais sob enforcement sistêmico vs humano") no Bloco F. Cf. obs #6 do preâmbulo (cravada na 2ª iteração) e seção "Continuação tri-party — 3º turno e seguintes" em `research/2026-05-28-this-session-as-evidence.md`.
>
> **2026-05-29 (elevação) —** a 0024 foi elevada a **spec fundacional de arquitetura de contexto** (decisão da owner). Adicionado **Bloco G — Arquitetura Fundacional** (`G00`-`G05`; `G00` = unidade primária, **raiz**); invariante de ordem **"nenhuma DEC de A-F estabiliza até `G00 Resolved`"**; reconciliação **`evidence-driven ≠ research-only`** (implementação dentro da 0024). Cf. `spec.md`, `research/2026-05-29-architectural-inventory.md` e obs #7 abaixo.

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

7. **A pergunta da unidade primária de modelagem é load-bearing e recorrente** (observado 2026-05-22 → 2026-05-29). O sinal "as fronteiras `deterministic/mixed/evidence-driven` estão borradas" apareceu em ≥ 2 contextos independentes: (a) backlog `boilerplate-system-modernization` linha 78 (2026-05-22 — spec "deterministic" carregando `decision-brief.md`); (b) esta sessão (reconciliação `evidence-driven ≠ research-only` + inconsistência observada entre `spec.md` e `decision-brief` sobre Stage 2). **Observação operacional (não-decisional):** a taxonomia de tipos de spec e a unidade primária de modelagem influenciam diretamente seleção/promoção/projeção/handoff. A **decisão** decorrente — elevar a 0024 a spec fundacional + abrir o Bloco G — está cravada em `spec.md` e no inventário arquitetural (`research/2026-05-29-architectural-inventory.md`); aqui registra-se apenas o **fato observado** que a motivou.

8. **O decisor humano é um consumidor de contexto ainda não modelado** (observado por dogfooding nesta sessão, 2026-05-29). A tomada de decisão da própria 0024 seguiu um fluxo recorrente: `research produz opções → decision-brief organiza tensões → leitor tardio (ChatGPT) expõe pressupostos ocultos → visualizações (overview.png/v2) constroem modelos mentais → owner decide → plan/tasks derivam`. Esse fluxo **consolida mecanismos já observados isoladamente** — leitor tardio (NEXT #2 + evidence artifact), curadoria via prompts estruturados, artefatos visuais — num processo governado distinto de research e de implementação. **Fato observado, não-decisional**; a hipótese arquitetural decorrente (`decision session`) vive em `[DEC-0024-G05]`.

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

O **Bloco G — Arquitetura Fundacional** (adicionado 2026-05-29 com a elevação da spec) é a **camada-base**: precede A-F e define _o que existe / como evolui / como se relaciona_. **`G00` é a DEC RAIZ** (unidade primária de modelagem). **Invariante de ordem: nenhuma DEC dos blocos A-F é estruturalmente estável — nem `Resolved` no gate — enquanto `G00` não estiver `Resolved`.** G00 pode reinterpretar DECs `Open` de A-F.

Os blocos **A, B, D, E, F** mapeiam um-para-um aos **5 eixos de pressão arquitetural** (per síntese 2026-05-28 / cf. [`research/2026-05-28-pressure-axes-scope.md`](./research/2026-05-28-pressure-axes-scope.md)). O **Bloco C — Saúde Técnica** é bloco **transversal mandatório** do template canônico de decision-brief (cf. [`.ai-guidelines/templates/decision-brief-boilerplate.md`](../../../.ai-guidelines/templates/decision-brief-boilerplate.md) § "Bloco C") — **não** um sexto eixo de pressão.

- **Bloco G** — Arquitetura Fundacional _(camada-base; precede A-F; `G00` raiz)_
- **Bloco A** — Seleção _(eixo de pressão)_
- **Bloco B** — Persistência _(eixo de pressão)_
- **Bloco C** — Saúde Técnica _(transversal mandatório — template)_
- **Bloco D** — Promoção _(eixo de pressão)_
- **Bloco E** — Projeção _(eixo de pressão)_
- **Bloco F** — Governança _(eixo de pressão)_

Pontos iniciais entram como `Open` com pergunta cravada e contexto pendente. Opções emergem da research (**Fonte A** interna + **Fonte B** externa) dos sistemas enumerados em `spec.md § Pesquisa de contexto`.

---

## Bloco G — Arquitetura Fundacional

> **Camada-base (precede A-F; adicionada 2026-05-29 com a elevação da spec).** Define _o que existe / como evolui / como se relaciona_ no framework. `G00` é a **DEC RAIZ**; G01-G05 dependem dela. Espinha arquitetural: `G00 unidade → G01 pilares → G02 taxonomia → G03 promotion pipeline → G04 contrato materializável → G05 projeções`.
>
> **Invariante de ordem:** nenhuma DEC de A-F é estruturalmente estável (nem `Resolved` no gate) enquanto `G00` não estiver `Resolved`. G00 pode reinterpretar DECs `Open` de A-F (D04, E01-E03, F01-F04, A01-A03).
>
> **Base de evidência (DUAS fontes obrigatórias):** **Fonte A** — auditoria estrutural interna (artefatos/histórico + inventário arquitetural); **Fonte B** — research externa (Hermes, Spec Kitty, Open Code, Cursor, Anthropic) para revelar **modelos alternativos** e evitar viés de confirmação. **Nenhuma DEC de G fecha só com Fonte A.**
>
> **Fronteira modelo ≠ migração:** G decide o _modelo_ (taxonomia, contrato, core, projeção). A _migração/execução_ (retrofit, cutover, re-modeling de domínio) é Grupo B do inventário — faseada, fora desta camada. Cf. [`research/2026-05-29-architectural-inventory.md`](./research/2026-05-29-architectural-inventory.md).

### [DEC-0024-G00] (RAIZ) Qual é a unidade primária de modelagem do framework?

**Pergunta:** O framework modela o trabalho primariamente por `spec`, por `pilar` (work-item kind, ADR 0010), por `lifecycle`, por `artefato`, ou por uma **categoria ainda não identificada**? Hoje assume-se implicitamente `spec = unidade primária`.

**Contexto (research):**

- **Hipótese a investigar (recomendação inicial, NÃO veredito):** `pilar = unidade primária`, e a `spec` é apenas uma _projeção organizacional_ de um work-item do pilar `spec`. Se verdadeiro, explica a erosão de `deterministic/mixed/evidence-driven`, o reaparecimento dos mesmos artefatos, o desconforto com boilerplates e a própria necessidade de handoff.
- **Fonte A:** ADR 0010 já estabelece `WorkItemKind` (7 pilares) como classificação MECE no domínio; o lifecycle e os boilerplates, porém, são hoje spec-cêntricos. Há tensão a auditar.
- **Fonte B (obrigatória):** como Hermes/Cursor/Open Code/Spec Kitty modelam a unidade primária (task? skill? session? spec?) — revela modelos alternativos.
- **Disciplina de falsificação (anti-fechamento-prematuro):** o risco dominante da spec passou de "escopo" para **fechar G00 cedo demais**. Fonte B tem papel **ativo de refutar** a hipótese favorita; G00 fecha por sobrevivência à refutação, não por confirmação. Lista de candidatas não-exaustiva (manter aberta "categoria não identificada"). Cf. `research/2026-05-28-pressure-axes-scope.md § Camada fundacional`.
- **Dependentes:** G01-G05 e DECs `Open` de A-F dependem do resultado (invariante de ordem).

**Status:** Open

### [DEC-0024-G01] Os 7 pilares MECE (ADR 0010) são a estrutura primária?

**Pergunta:** A relação canônica é `tipo da spec → artefatos → lifecycle` (modelo atual implícito) ou a inversão `7 pilares → artefatos necessários → lifecycle → tipo percebido da spec`?

**Contexto (research):**

- ADR 0010 (Aceita) crava os 7 pilares (`spec/experiment/spike/incident` Dense + `fix/patch/proposal` Virtual) por intenção de saída, com política de promoção (`proposal→spec`, `experiment→spec`). **A taxonomia MECE não está em questão** — investiga-se se ela é a **raiz da modelagem** (e da arquitetura de contexto), em vez de subordinada à `spec`.
- Depende de G00. Se `pilar = unidade primária`, esta inversão é provavelmente confirmada.

**Status:** Open

### [DEC-0024-G02] A taxonomia `deterministic/mixed/evidence-driven` é entidade de primeira classe ou sintoma?

**Pergunta:** Os tipos de spec (`governance-foundation.md § "Tipos de spec"` + GR-0101, materializados nos boilerplates `tasks-deterministic/mixed/evidence-driven`) são classificação de primeira classe, ou **consequência emergente** de (pilar + certeza-de-design + artefatos necessários)?

**Contexto (research):**

- **Hipótese (owner, recomendação inicial, NÃO veredito):** é sintoma, não entidade. Evidência Fonte A: spec "deterministic" carregando `decision-brief.md` (backlog `boilerplate-system-modernization` linha 78); fronteiras borradas (obs #7 do preâmbulo).
- **Não tem ADR própria** (vive em doc de processo + GR-0101) → mais maleável que ADR 0010, **mas** está assada no engine de recipes/boilerplates → mudá-la tem ripple no template system (Grupo B / `boilerplate-system-modernization`).
- Depende de G00/G01. Fonte B: sistemas externos usam classificação equivalente? Por quê / por quê não?
- **Atenção de esforço (research):** se `G01` resolver como `pilar → artefatos → lifecycle`, G02 pode tornar-se **parcialmente trivial** (G01 responde a maior parte). Não superinvestir em G02 antes de G01 fechar.

**Status:** Open

### [DEC-0024-G03] Qual é o promotion pipeline canônico?

**Pergunta:** Como unidades evoluem? Reconciliar a **promoção de work-item** (ADR 0010: `proposal→spec`, `experiment→spec`) com a **cadeia de promoção contextual** (`observação→sinal→regra situacional→regra formal→ADR`, cf. D01-D04). São o mesmo pipeline em níveis diferentes, ou dois pipelines distintos?

**Contexto (research):**

- **Reconcilia `[DEC-0024-D04]`** ("unidade canônica de promoção contextual"), que passa a ser **consequência** de G00/G03, não DEC isolada do Bloco D.
- Fonte A: ADR 0010 § promoção + os DECs D01-D04. Fonte B: Hermes (skill loop), Spec Kitty (coordenação spec-driven).

**Status:** Open

### [DEC-0024-G04] Qual é o contrato mínimo de boilerplate + o core comum?

**Pergunta:** Qual é o **núcleo compartilhado** que todo boilerplate (por pilar/tipo) instancia, e o **contrato mínimo** que impede uma nova spec de reproduzir o lifecycle antigo (ex.: a inversão `[DEC-0023-D01]`)?

**Contexto (research):**

- **Posição arquitetural (núcleo, NÃO consequência operacional):** após a elevação, G04 é a **camada de materialização física** do modelo decidido em G00-G03 — onde a ontologia (`unidade → pilares → taxonomia → pipeline`) vira artefato instanciável. Não é "apenas contrato de boilerplate"; é o ponto em que o núcleo arquitetural se torna concreto.
- **Modelo, não migração:** G04 define o _core_ + contrato e prova com **1 boilerplate de referência**. O retrofit dos 6 boilerplates por classe + versionamento + stack-agnostic é Grupo B (`boilerplate-system-modernization`).
- Liga `[DEC-0024-F04]` (invariantes sob enforcement) — o contrato declara quais invariantes são enforced sistemicamente vs humanos.
- Fonte A: research §8.1 da 0023 (invariantes universais: accountability + traceability + outcome registration); boilerplates atuais.

**Status:** Open

### [DEC-0024-G05] Quais projeções derivam da mesma SSOT, e como cada consumidor a recebe?

**Pergunta:** Uma SSOT (state + tasks + decision-brief + ADRs + registry) gera N projeções determinísticas por consumidor (handoff, wizard, `AGENTS.md`, briefing, dashboard). Qual o modelo canônico de projeção (formato + densidade + gatilho por consumidor)?

**Contexto (research):**

- **Eleva e consolida o Bloco E** (E01-E03 passam a ser instâncias deste modelo). Handoff = uma projeção; dashboard = Grupo C consumidor.
- Liga ADR 0023 (meta-artefatos YAML SSOT + derivações determinísticas; **sem LLM no runtime** — ADR 0018).
- Fonte B: Cursor (session restore), Open Code (provider-agnostic), Anthropic Dreaming (curated review).
- **Consumidor de primeira classe ainda não modelado — o decisor humano no gate.** Hipótese emergente (dogfooding 2026-05-29, cf. obs #8 do preâmbulo): existe um processo governado **`decision session`** — distinto de research e de implementação — em que o owner transforma opções abertas em decisões confiáveis. Perguntas abertas: o `decision-brief` sozinho basta, ou há projeções complementares que apoiam a decisão (diagramas, comparações, leitor tardio, dashboards, simulações)? A resposta final da 0024 pode ser uma **família** de projeções (`handoff`, `briefing`, `decision-session`, `dashboard`, `review`), não só `handoff`. Sem DEC própria por ora — pergunta aberta dentro de G05 (regra 7: sinal emergente).

**Status:** Open

### Critério de saída do Bloco G

G fecha **somente** quando `G00`-`G05` estão `Resolved` no gate, cada uma com evidência **Fonte A + Fonte B**. `G00` resolve-se **antes** de estabilizar A-F. G parcialmente aberto bloqueia o fechamento do Stage 1.

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
>
> **Reenquadramento (2026-05-29):** com a elevação da spec, `[DEC-0024-D04]` passa a ser **consequência de `[DEC-0024-G00]`/`[DEC-0024-G03]`** (unidade primária + promotion pipeline). D04 **não fecha antes de G00**. Mantido no Bloco D por continuidade de numeração; sua resolução deriva do Bloco G.

### [DEC-0024-D04] Qual é a unidade canônica de promoção contextual?

**Pergunta:** Antes de responder D01-D03, qual é a **taxonomia das unidades promovíveis**? Hoje o framework usa termos diversos sem hierarquia formal: _observação, padrão, sinal recorrente, regra situacional, regra formal, skill, insight, comportamento, ADR_. Sem nomeação clara, fica difícil responder operacionalmente "quando algo sobe de nível?".

> **Reenquadramento (2026-05-29):** a research principal desta questão vive em `[DEC-0024-G03]` (promotion pipeline canônico). **D04 documenta as implicações operacionais de G03 — não cresce como pergunta independente** e não fecha antes de G00/G03.

**Contexto (research):**

- **Origem:** insight cravado via review do ChatGPT do PR #30 (3º turno tri-party desta sessão / 2026-05-28). Cf. preâmbulo § obs #6 + `research/2026-05-28-this-session-as-evidence.md` § "Continuação tri-party — 3º turno".
- **Hipótese inicial a investigar** (não confirmada — emerge da research): pode existir cadeia tipo `observação → sinal recorrente → regra situacional → regra formal → ADR`, com critérios de elevação cravados em cada degrau (ex.: ≥ N casos sem fechamento = sinal recorrente; sinal recorrente + ≥ 1 sessão de design = regra situacional; ≥ 2 specs validando = regra formal; etc.).
- **Vocabulário existente a mapear:** ai-guidelines tem `ADR`, `CORE`, `GR`, `opt-in`, `DEC`, `regra situacional` (mencionada em [DEC-0023-F05]); Hermes tem `skill`; Cursor tem peças do `harness`; Open Code não tem unidade promovível (stateless por design). Cada vocabulário deve ser mapeado contra a hipótese.
- **Conexão estrutural:** sem D04 resolvido, `D01` (como observações viram regras?), `D02` (handoff promove autonomamente?) e `D03` (onde mora a curadoria?) ficam mal-formuladas — todas pressupõem uma unidade nomeada que ainda não existe.
- **Sub-questão dupla — taxonomia + transições** (refinamento via ChatGPT 4º turno, 2026-05-28): D04 carrega de fato 2 perguntas distintas convivendo: **(a) qual é a unidade promovível?** (a cadeia em si) e **(b) qual o mecanismo de transição entre níveis?** (critérios de elevação). Sem (b), a taxonomia vira classificação estática, não lifecycle operacional. Research deve cobrir as duas; se a separação se mostrar útil durante a investigação, considerar split em D04 (taxonomia) + D05 (critérios) — não-cravado agora para evitar fragmentação prematura.

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

### [DEC-0024-F04] Quais artefatos governados têm invariantes estruturais sob enforcement sistêmico vs comportamento humano?

**Pergunta:** O caso `state.yml` (descoberto e fechado via PR #31) é o primeiro artefato governado a sofrer do padrão "invariante existe → sistema não enforce → agente precisa lembrar → drift". Quais outros artefatos do framework carregam invariantes estruturais que **ainda dependem de revisão humana** em vez de enforcement sistêmico determinístico? Quais merecem gates equivalentes a `state-yml:check` / `living-docs:check` / `governance-pr-check`?

**Contexto (research):**

- **Origem:** insight cravado via review do ChatGPT do PR #31 (5º turno tri-party desta sessão / 2026-05-28). Cf. `research/2026-05-28-this-session-as-evidence.md` § "Continuação tri-party — 3º turno e seguintes".
- **Padrão estrutural a investigar** (não restrito a YAML schema):
  ```text
  invariante existe → sistema não enforce → agente precisa lembrar → drift
  ```
  PR #31 fechou esse padrão para `state.yml` movendo enforcement para o validate global. F04 pergunta: quais outros artefatos comportam-se assim hoje?
- **Candidatos óbvios a investigar** (lista inicial — research pode expandir/refinar):
  - **`decision-brief.md`** — estrutura de blocos, IDs `[DEC-NNNN-XYZ]`, contrato form B vs C, drift entre headers individuais e tabela "Resumo de status" (template explicitamente nota: "drift bloqueia o gate; coerência é responsabilidade humana — não há script de geração nesta versão").
  - **`tasks.md`** — sub-block IDs (`1.X.N`/`1.X.[COMMIT]`/`1.X.[REVIEW]`), state machine de checkboxes (`[ ]` / `[/]` / `[x]`), marker `[COMMIT]` ausente em commits reais (per `[DEC-0023-D01]` boundary).
  - **`backlog.md`** — estrutura de entries (Em execução / Now / Candidatas / Later); contrato de campos obrigatórios por entry (Fonte, Princípio, Escopo, Pré-requisitos, Slug).
  - **ADRs** — estados (`Proposta` / `Aceita` / `Superseded`); formato canônico do header; cross-refs sempre bidirecionais.
  - **Meta-artefatos YAML futuros** (per ADR 0023) — cada um nasceria com gate equivalente como pré-condição (anti-paper).
- **Conexão arquitetural com Bloco F:** F01 (autoridade), F02 (auditabilidade), F03 (governance-first invariante) cobrem _quem decide_ e _como fica registrado_. F04 cobre _quais invariantes são enforceable hoje vs dependem de humano_ — completa o quadro de governança auditável.
- **Conexão com backlog `coverage-rigor-enforcement`:** essa candidata (backlog `Candidatas`) já trata de pisos por arquivo + 100% em paths críticos + forcing function de CI. F04 fornece a **lista de invariantes** que aquela spec implementadora deveria cobrir; pode virar input direto quando essa candidata abrir.
- **Não-objetivo (preservado):** F04 NÃO propõe que o framework valide tudo automaticamente. A pergunta é qual o **subconjunto que se beneficia** de enforcement sistêmico — alguns invariantes seguem sendo melhor curados por humano (decisões editoriais, narrative coherence). Critério proposto a investigar: "se um agente pode introduzir drift sem perceber, e o drift é mecanicamente detectável, então é candidato a gate".

**Status:** Open

---

## Resumo de status

| ID               | Bloco      | Status |
| :--------------- | :--------- | :----- |
| `[DEC-0024-G00]` | G _(raiz)_ | Open   |
| `[DEC-0024-G01]` | G          | Open   |
| `[DEC-0024-G02]` | G          | Open   |
| `[DEC-0024-G03]` | G          | Open   |
| `[DEC-0024-G04]` | G          | Open   |
| `[DEC-0024-G05]` | G          | Open   |
| `[DEC-0024-A01]` | A          | Open   |
| `[DEC-0024-A02]` | A          | Open   |
| `[DEC-0024-A03]` | A          | Open   |
| `[DEC-0024-B01]` | B          | Open   |
| `[DEC-0024-B02]` | B          | Open   |
| `[DEC-0024-C01]` | C          | Open   |
| `[DEC-0024-D01]` | D          | Open   |
| `[DEC-0024-D02]` | D          | Open   |
| `[DEC-0024-D03]` | D          | Open   |
| `[DEC-0024-D04]` | D          | Open   |
| `[DEC-0024-E01]` | E          | Open   |
| `[DEC-0024-E02]` | E          | Open   |
| `[DEC-0024-E03]` | E          | Open   |
| `[DEC-0024-F01]` | F          | Open   |
| `[DEC-0024-F02]` | F          | Open   |
| `[DEC-0024-F03]` | F          | Open   |
| `[DEC-0024-F04]` | F          | Open   |

**Status agregado:** `Open` — research em curso, opções pendentes. **Ordem de fechamento:** `G00` (raiz) → demais G → A-F. Nenhuma DEC de A-F estabiliza antes de `G00 Resolved` (invariante de ordem).

---

## ✅ Gate fechado

> Bloco final assinado pelo owner quando **todos** os pontos estão `Resolved`. **Não preencher** antes disso.

- **Data:** [pendente]
- **Owner:** [pendente]
- **Pontos resolvidos:**
  - [ ] `[DEC-0024-G00]` (raiz) ... `[DEC-0024-G05]` · `[DEC-0024-A01]` ... `[DEC-0024-F04]`

---

## Checklist pós-gate

> **[MANDATÓRIO]** Após assinatura do gate, executar os 4 passos abaixo de forma atômica.

- [ ] **(1)** `plan.md` v2 publicado: cada subseção de design técnico deriva de um `[DEC-0024-XYZ]` e referencia o ponto.
- [ ] **(2)** `tasks.md` v2 publicado: placeholder de Stage 2 substituído por tasks operacionais.
- [ ] **(3)** Status agregado desta brief mudado para `Resolved`.
- [ ] **(4)** Commit atômico marcando o gate (`docs(spec-0024): gate humano fechado — plan v2 + tasks v2 publicados`).
