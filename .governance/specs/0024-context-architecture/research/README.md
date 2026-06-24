# Research da Spec 0024

Esta pasta guarda evidências, investigações, dogfood, snapshots de status, revisões externas e registros de lacunas encontrados durante a Spec 0024.

Ela **não é fonte operacional de verdade**.

## Ordem de autoridade

**Ordem canônica única:** [`GOVERNANCE-CATALOG.md` §1.A](../../../../.core/governance/GOVERNANCE-CATALOG.md) (Ordem de autoridade). Esta pasta **não** mantém ordem própria; abaixo, só a instância local da Spec 0024, coerente com a canônica:

1. `state.yml` — topologia, cursor e próximo movimento estrutural.
2. `tasks.md` — checkpoint/etapa e checklist vigente.
3. `decision-brief.md` — decisões humanas registradas (DEC).
4. `reviews/` + `gates/` — findings, dispositions, Human Gate.
5. Git/GitHub — branch, PR, commits, CI.
6. `assets/` — projeção visual; nunca SSOT.
7. Arquivos desta pasta (`research/`, com `artifact-kind`) — contexto datado; nunca contrato atual.

## Como usar

- Use arquivos `research/` para entender por que uma decisão surgiu, qual dogfood a motivou e quais riscos foram observados.
- Não use um arquivo de status antigo como contrato atual sem confirmar contra `state.yml`, `tasks.md`, `decision-brief.md`, Git e GitHub.
- Quando um achado daqui virar trabalho executável, promova para DEC, PIT, plano, task ou artefato governado apropriado antes de agir.
- Quando um arquivo citar testes, comandos ou caminhos, trate como snapshot datado; confirme o estado atual no código antes de concluir.

## Débito conhecido

A pasta ainda mistura pesquisa, status, dogfood e backlog. A triagem estrutural da organização de `research/` foi registrada como trabalho do próximo nó, para não misturar reorganização documental ampla com os reparos operacionais deste checkpoint.
