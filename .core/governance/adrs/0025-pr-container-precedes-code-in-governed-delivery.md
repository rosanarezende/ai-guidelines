# ADR 0025 — Contêiner de PR precede o código em entrega governada

**Status**: Aceita
**Origem histórica**: Spec 0024 (`context-architecture`) — convergência durante o Human Gate do PR #34 e a abertura do nó `pr-cli-cutover` (2026-06-04). Deliberação Claude → ChatGPT → owner.
**Relaciona-se com**:

- [`CORE-09`](../../rules/top/agents-core.md) (PRs abrem como Draft) — este ADR adiciona o **timing** que CORE-09 não enuncia; CORE-09 ganha um pointer mínimo para cá.
- [`CORE-11`](../../rules/top/agents-core.md) (agir mediante plano formado) — já distingue trabalho que sobrevive à sessão (governado) de ajuste local descartável; este ADR herda esse eixo.
- [`ADR 0010`](./0010-taxonomy-mece-pillars.md) (taxonomia MECE) — fonte das **exceções por natureza** (classes de WorkItem).
- [`ADR 0020`](./0020-governance-precede-execution.md) (governança precede execução) — o contêiner é a unidade de rastreabilidade do trabalho governado.
- [`ADR 0024`](./0024-draft-ready-mergeable-distinct-states.md) (Draft/Ready/Mergeable) — define o **estado** Draft (WIP); este ADR define **quando** abri-lo.

---

## Princípio

> **Em entrega governada, o contêiner de PR (Draft) é aberto no início do desenvolvimento — antes de o código acumular — para que a topology represente fielmente o estado de trabalho em tempo real.** Trabalho de manutenção e de aprendizado é código-primeiro por natureza; exploração circunstancial dentro de trabalho governado é exceção declarada.

## Contexto

`CORE-09` governa o **estado** de abertura de um PR ("abre como Draft"), mas é silencioso quanto ao **momento** da abertura. Na ausência dessa regra, o default de fato é **conteúdo-primeiro**: o código é materializado e só então o PR é aberto. Isso produz duas patologias atemporais:

1. **Janela de drift entre realidade e representação.** Enquanto o código avança numa branch sem PR, a representação topológica do trabalho diz `planned`. Existe um intervalo em que a topology **mente** sobre o que está em andamento — exatamente a classe de divergência que governança repo-first existe para eliminar ("a representação deve seguir a realidade, não atrasá-la").
2. **Acoplamento circular na promoção do nó.** Quando o lifecycle topológico amarra `active ⟺ existe PR`, não há como marcar um nó `active` sem o PR — mas o conteúdo-primeiro só cria o PR depois que o trabalho já começou. O contêiner-primeiro dissolve o ciclo: o PR nasce primeiro e o nó liga-se a ele desde o primeiro commit.

A patologia (1) é a motivação primária. A (2) é consequência operacional benéfica, não o fim em si.

## Decisão

1. **Contêiner-primeiro é o default de entrega governada.** Unidades de trabalho cuja intenção de saída é entrega/validação estruturada (`spec`, `experiment` — cf. ADR 0010) abrem seu PR `Draft` no **início** do desenvolvimento. O contêiner é a casa onde os commits se acumulam, não o invólucro aplicado ao final.

2. **A ligação topológica é imediata.** Onde o lifecycle de nós exige `active ⟺ contêiner`, a transição `planned → active` ocorre na abertura do Draft, ligando o nó ao PR desde o commit 1. A topology passa a refletir o trabalho em tempo real.

3. **Exceção por natureza (classe).** Classes cujo lifecycle é, por intenção, time-boxed ou de manutenção — `spike` (PoC/prototype), `fix`, `patch`, `incident` — são **código-primeiro**: o foco é o código local; a conexão com PR é diferida ou dispensada (um `spike` pode nunca virar PR; `proposal` não tem ciclo de código). A exceção **não é mecanismo novo** — é a própria classe ADR 0010.

4. **Exceção por circunstância (opt-out declarado).** Mesmo numa entrega governada, é legítimo declarar um início **código-primeiro** para uma fase exploratória (prototipar/medir antes de abrir o contêiner). A exceção é **explícita e registrada** — coerente com "nada de continuação implícita" (ADR 0022) — barata de invocar, deixando rastro do desvio.

5. **Enforcement é soft.** O default é guiado, não imposto: superfícies de orientação (`workflow`/`continue`/projeção de estado) podem **sugerir** que um nó é elegível para contêiner Draft. **Nunca** é gate bloqueante — forçar o contêiner em todo trabalho recriaria o anti-padrão "spec como contêiner universal" e mataria a fluidez que as exceções existem para preservar.

6. **Fronteira com CORE-09.** CORE-09 permanece dono do **estado** ("abre como Draft, com a matriz oficial"); este ADR é dono do **timing** ("aberto no início, em entrega governada") e das **exceções**. CORE-09 carrega apenas um pointer mínimo para este ADR; a nuance vive aqui — a regra runtime é enxuta por higiene de injeção e por classificação (ADR 0015), não por restrição mecânica.

## Aplicações

- **Primeira instância:** o nó `pr-cli-cutover` (Spec 0024) abre contêiner-primeiro — Draft criado no início, nó ligado ao PR, e o trabalho de cutover acumula dentro dele.
- **Lifecycle de nós:** a transição `planned → active(contêiner) → … → Ready → concluded` passa a ter gatilho de abertura no início do dev para nós governados.
- **Projeções de orientação:** `workflow`/`continue` podem emitir o nudge de elegibilidade descrito no item 5.

## Alternativas avaliadas e rejeitadas

| Opção                                                           | Por que rejeitada                                                                                                                                                                               |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Conteúdo-primeiro como default (status quo)**                 | Mantém a janela de drift e o acoplamento circular; a topology atrasa a realidade.                                                                                                               |
| **Gate duro forçando Draft para todo trabalho**                 | Recria o anti-padrão "spec como contêiner universal"; mata a fluidez de `fix`/`patch`/`spike`; viola a economia das exceções.                                                                   |
| **Registrar a prática como Insight (estágio-0)**                | Estágio errado: Insight é para percepção emergente em amadurecimento. Aqui há dor observada → solução escolhida → aplicação imediata: é decisão, e decisão arquitetural perene é ADR (CORE-15). |
| **Codificar a nuance (timing + exceções) na injeção universal** | Nuance é reference-grade; pertence ao ADR. A injeção universal carrega só o pointer (ADR 0015 + higiene de injeção).                                                                            |
| **Opt-out por inferência (sistema decide quando é exploração)** | Viola "nada de continuação implícita"; o desvio precisa ser declarado pelo humano.                                                                                                              |

## Consequências

### Positivas

- A topology representa o trabalho **em tempo real**; fecha a janela de divergência realidade↔representação (ataque direto à classe de drift que motiva a Spec 0024).
- Dissolve o acoplamento circular `active ⟺ contêiner` na abertura de nós.
- A casa de rastreabilidade (PR) existe desde o commit 1 — proveniência e revisão acumulam de forma contínua, não retroativa.

### Negativas / Riscos

- Um contêiner aberto cedo demais pode ficar **ocioso** se o trabalho estagnar. Mitigação: `Draft` significa WIP, não bloqueio (ADR 0024); o estado é honesto, não dívida.
- A exceção por circunstância exige **disciplina humana** para ser declarada (não inferida). Aceito como custo da fluidez — é o mesmo custo de granularidade fina já assumido em ADR 0010.

## Nota histórica

Nascido durante o Human Gate do PR #34 da Spec 0024, na deliberação Claude → ChatGPT → owner. A premissa inicial de que o orçamento de tokens da injeção (`~1443/1500` no escopo universal) seria uma **restrição dura** foi revalidada e refutada: o orçamento é puramente consultivo (warning, nunca bloqueia build/validate/runtime). A revisão dessa premissa abriu uma investigação arquitetural separada — a dependência residual de contexto via `AGENTS.md` vs. seleção via `KnowledgeGraph` — que **não** é objeto deste ADR.
