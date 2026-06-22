# CO-10.8.1 — Dogfood: classificação de reparabilidade precisa viver no runtime

Data: 2026-06-21
Spec: 0024 — context-architecture
Checkpoint: checkpoint-co-flow-continuation
PR: #44 — co-flow-continuation

## Dor observada

Durante o dogfood do `GovernanceDoctor`, a classificação dos drifts ficou clara em
artefatos humanos:

- Drift #1 é reparável com preview e confirmação porque `active.yml` é projeção
  derivável por `publish-state`.
- Drifts #2, #3 e #4 envolvem topologia, cursor, `next` narrado ou narrativa em
  `tasks.md`; portanto exigem decisão humana ou correção governada, não reparo
  automático.

O problema: se essa classificação ficasse apenas no mapa visual ou no research, o
framework continuaria exigindo que a pessoa conhecesse a discussão interna para
entender o que fazer. Isso repete a dor original: governança compreensível só para
mantenedores.

## Decisão de produto

A classificação de reparabilidade passa a ser dado estruturado do diagnóstico.

Cada issue do `GovernanceDoctor` deve dizer explicitamente qual é a autoridade do
reparo:

- `auto`: reparo automático seguro.
- `confirm`: reparo seguro com preview e confirmação.
- `human-decision`: exige decisão humana/governada.
- `blocked`: bloqueado até corrigir a fonte.

O comando `drift` continua read-only, mas mostra essa classificação. O comando
`repair` continua sendo a superfície de escrita; quando não houver reparo automático
seguro, ele deve listar os pontos que exigem decisão humana ou correção prévia, em
vez de apenas dizer que não há nada reparável.

## Implementado nesta fatia

- `GovernanceDoctorIssue` ganhou `repairAuthority`.
- Branch stale (#1) é classificado como `confirm`.
- Divergências de cursor/topologia/`next` (#2/#3) são classificadas como
  `human-decision`.
- Incoerência de narrativa de sub-checkpoint em `tasks.md` (#4) é classificada como
  `human-decision`.
- Erros de parse/schema são classificados como `blocked`.
- A copy de `governanceDoctor` deixou de sugerir regenerar `next` narrado
  automaticamente.
- `repair` mostra os drifts não automáticos e seus caminhos seguros, sem montar plano
  de escrita para eles.

## Falsificação adicionada

- Teste do doctor prova que branch stale é `confirm`.
- Teste do doctor prova que divergência de topologia/narração é `human-decision`.
- Teste do doctor prova que incoerência em `tasks.md` é `human-decision`.
- Teste do comando `repair` prova que drift `human-decision` não monta plano de
  escrita automática.
- Teste do comando `repair` prova que drift `blocked` não monta plano de escrita
  automática.

## Fora do escopo

- Auto-reparar os drifts #2, #3 ou #4.
- Alterar topologia, Ready, Human Gate ou `tasks.md` por heurística.
- Implementar a detecção completa de todo subtipo do Drift #4.

## Regra aprendida

Se uma conclusão de governança é necessária para orientar a pessoa no fluxo diário,
ela não pode ficar apenas em research, tracker ou conversa. Ela precisa virar
comportamento do runtime, locale e teste positivo.
