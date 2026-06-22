# Research da Spec 0024

Esta pasta guarda evidências, investigações, dogfood, snapshots de status, revisões externas e registros de lacunas encontrados durante a Spec 0024.

Ela **não é fonte operacional de verdade**.

## Ordem de autoridade

Quando houver divergência, use esta ordem:

1. `.governance/specs/0024-context-architecture/state.yml` para topologia, cursor e próximo movimento estrutural.
2. `.governance/specs/0024-context-architecture/tasks.md` para checkpoint/sub-checkpoint e checklist vigente.
3. `.governance/specs/0024-context-architecture/decision-brief.md` para decisões humanas registradas.
4. `reviews/`, `gates/`, Git e GitHub para fatos de review, gate, branch, PR e CI.
5. Arquivos desta pasta apenas como evidência histórica ou contexto explicativo.

## Como usar

- Use arquivos `research/` para entender por que uma decisão surgiu, qual dogfood a motivou e quais riscos foram observados.
- Não use um arquivo de status antigo como contrato atual sem confirmar contra `state.yml`, `tasks.md`, `decision-brief.md`, Git e GitHub.
- Quando um achado daqui virar trabalho executável, promova para DEC, PIT, plano, task ou artefato governado apropriado antes de agir.
- Quando um arquivo citar testes, comandos ou caminhos, trate como snapshot datado; confirme o estado atual no código antes de concluir.

## Débito conhecido

A pasta ainda mistura pesquisa, status, dogfood e backlog. A triagem estrutural da organização de `research/` foi registrada como trabalho do próximo nó, para não misturar reorganização documental ampla com os reparos operacionais deste checkpoint.
