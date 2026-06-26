---
artifact-kind: research
subject: "benchmark — todo trabalho precisa de uma intent? como ferramentas/métodos reais (Jira, Linear, Azure DevOps, SAFe, Shape Up) lidam com tarefas independentes (bug fix, patch) vs trabalho orientado a objetivo"
date: 2026-06-26
reviewer: internal
method: benchmark
---

# Benchmark — todo trabalho precisa de uma `intent`?

> **Não-autoridade.** Insumo da rodada "todo trabalho tem intent?" (camada `intent` / governança global).
> **Pergunta:** se a `intent` é a camada de governança ampla, como ferramentas reais tratam tarefas
> **independentes** (bug fix, patch standalone)?
> **Mapeamento:** nossa `intent` ≈ epic / initiative / bet · nosso `work` ≈ story / task / bug · nosso `banco` ≈
> board / backlog (a visão de tudo).

## O que cada ferramenta/método faz

### Jira

- `Task` e `Bug` são unidades **standalone** — irmãs de `Story`, no **mesmo nível**. **Não precisam** de epic.
- Linkar a um epic **só** quando faz parte de uma iniciativa maior; bug/tarefa de rotina fica **solto** (best
  practice explícita: manter solto pra não inchar a estrutura).

### Linear

- Issues **não** precisam pertencer a um Project; bugs aceitos na triagem rodam sob as **mesmas regras** (DoD) que
  issues de projeto.
- **Initiatives agrupam Projects (objetivos), não issues** — a camada de governança agrupa **metas**; issues
  standalone vivem fora dela.

### Azure DevOps

- Hierarquia `Epic → Feature → Story → Task` existe, mas itens podem ficar **sem pai** (unparented). Não força pai.

### SAFe (o extremo "tudo rastreável")

- `Epic` (portfólio) → `Feature` → `Story` com **traceability** ("força outcome-thinking"); orçamento **lean** vai
  pro **value stream** (SAFe **desencoraja** o modelo de financiar por projeto).
- Mesmo aqui, **bugs/defeitos não sobem na cadeia do portfólio** — são tratados no nível do time; só **epics
  direcionados a objetivo** (incl. _enabler epics_ de infra) entram no portfólio.

### Shape Up (Basecamp)

- Separa **explicitamente** "reactive work" (bugs, < 3 dias, urgente, vindo de suporte/ops) dos **bets** (objetivos
  moldados).
- Reactive work é **lane separada** (capacidade reservada / cool-down entre ciclos); **sem backlog central**; cada
  dev mantém a **própria** lista de bugs.

## Os dois polos

|                            | Tudo amarrado a objetivo (SAFe-ish)              | **Pai opcional** (Jira · Linear · Shape Up)              |
| -------------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| **Pró**                    | traceability total · outcome-thinking · - rework | leve · escala · casa com a realidade (bugs são reativos) |
| **Contra**                 | overhead · bloat · quebra no reativo/rotina      | parte do trabalho sem "porquê" **explícito**             |
| **Visibilidade do "tudo"** | via a cadeia de links                            | via o **board/backlog** (mostra tudo, com ou sem pai)    |

**Convergência:** mesmo no extremo (SAFe), **tarefas independentes/bugs NÃO são forçadas** num epic. O padrão
**dominante** é **pai opcional**; trabalho reativo vira **lane separada**; e a visibilidade de _tudo_ vem do
**board** (= nosso **banco**), **não** de forçar um pai em cada item.

## Paralelo com o nosso modelo

- `intent` ≈ epic / initiative / bet → **opcional**, pra trabalho **orientado a objetivo** (multi-passo /
  multi-repo / vale rastrear como meta).
- `incident` / `fix` / `patch` = nossos tipos **reativos/rotina** → casam com a "reactive lane" do Shape Up →
  **sem intent por padrão**; vivem no **banco**.
- `delivery` / `experiment` / `spike` rumo a um objetivo → naturalmente **sob uma intent**.
- O **"tudo lá"** (cross-referência · padrões · SDD/DDD) = o **banco** (agrega **TODOS** os trabalhos), exatamente
  como o board do Jira/Linear mostra issues **com ou sem** epic.
- Um trabalho pode ser **adotado** por uma intent **depois** (= mover uma issue pra baixo de um epic).

## Recomendação (fundamentada)

**`intent` OPCIONAL / emergente** — não forçar todo trabalho a ter uma. Ganha-se traceability **onde** há intent
(objetivo que vale); a governança ampla de _tudo_ vem do **banco**. Isso (a) casa com a realidade de bugs reativos,
(b) é o padrão dominante da indústria, e (c) **escala** de dev solo a enterprise sem cerimônia. O risco do polo
oposto (forçar pai) — overhead + quebra no trabalho reativo — é justamente o que as ferramentas evitam.

## Implicação: framework tool-plugável (facilita adoção)

O mapeamento limpo (`intent` ≈ epic/initiative/bet · `work` ≈ story/task/bug · `banco` ≈ board) abre uma porta: o
framework pode oferecer **adapters** pra **plugar** nessas ferramentas (Jira/Linear/Azure/…). Times adotam
**incremental** — mantêm a ferramenta deles e ganham a camada de governança por cima (sync). É o princípio
**contrato-first** estendido pra **integração**, não só pro storage. _(construir adapters = frente futura.)_

## Fontes

- Jira: [Atlassian — Epics tutorial](https://www.atlassian.com/agile/tutorials/epics) ·
  [Epics, stories, themes](https://www.atlassian.com/agile/project-management/epics-stories-themes) ·
  [Story vs Epic vs Task](https://mgtechsoft.com/blog/story-vs-epic-vs-task-whats-the-difference-in-jira/)
- Linear: [Projects](https://linear.app/docs/projects) · [Initiatives](https://linear.app/docs/initiatives) ·
  [Conceptual model](https://linear.app/docs/conceptual-model)
- Azure DevOps: [About work items](https://learn.microsoft.com/en-us/azure/devops/boards/work-items/about-work-items)
- SAFe: [Epic — Scaled Agile Framework](https://scaledagileframework.com/epic/) ·
  [Lean Portfolio Management / Epics](https://agility-at-scale.com/safe/lpm/epics/)
- Shape Up: [Bets, Not Backlogs](https://basecamp.com/shapeup/2.1-chapter-07) ·
  [Shape Up is for features, not all dev work](https://www.ryansinger.co/shape-up-is-for-features-not-all-development-work/)
- Traceability (prós): [Reducing rework: traceability epic→code→tests](https://agileseekers.com/blog/reducing-rework-traceability-from-epic-to-code-and-tests)
