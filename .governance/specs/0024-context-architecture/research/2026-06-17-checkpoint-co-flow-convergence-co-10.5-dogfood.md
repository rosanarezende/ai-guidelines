# Dogfood CO-10.5 — UX, linguagem humana e convergência do wizard

## Contexto

Durante CO-10.4, o fluxo governado já estava tecnicamente convergindo: `flow`, `work`,
`decide` e o registry compartilhavam a derivação de próxima ação. Mesmo assim, a experiência
humana ainda exigia conhecimento interno do framework.

O problema observado não era uma nova regra de lifecycle. Era a forma como o estado governado
era apresentado para Rosana.

## Evidência observada

`npm run flow` mostrava uma primeira tela com:

- termos internos como `cockpit`, `briefing`, `review governado`, `comando mutante` e `wizard`;
- opções avançadas que abriam o fluxo legado sem explicar o risco ou o propósito;
- `init`, `adopt` e `update` expostos como alternativas equivalentes, mesmo quando o repositório
  já estava governado e o caminho normal era `update`;
- grupos de providers com rótulos técnicos como `Entrypoints com adapter runtime`;
- uma experiência visual do Clack ainda próxima de menu simples, apesar de o adapter já suportar
  `groupMultiselect`, `tasks`, `taskLog`, `spinner`, status e cancelamento limpo.

## Decisão aplicada

`[DEC-0024-G13]` criou `CO-10.5 — UX, linguagem humana e convergência do wizard`, deslocando a
falsificação/Human Gate para `CO-10.6`.

O objetivo do novo sub-checkpoint é tornar `npm run flow` uma experiência guiada para a pessoa
humana, sem mover regra de negócio para o wizard.

## Mudanças dogfoodadas nesta rodada

- A primeira tela passou a priorizar linguagem simples: estado atual, agora/depois, pendências,
  alternativas e próximo passo recomendado.
- O menu principal passou a falar por intenção humana:
  - ver resumo completo do estado;
  - fazer a próxima ação recomendada;
  - validar minhas mudanças;
  - ver decisões do fluxo;
  - ver orientação de trabalho / handoff para colar na LLM de preferência;
  - ver tipos de revisão disponíveis;
  - atualizar este repositório quando ele já é governado.
- O caminho `Mais opções` deixou de abrir diretamente o wizard legado e passou a expor opções
  explícitas, como ver specs ativas, diagnosticar índice, gerar prompt visual, entender publicação
  de estado e entender operações finais da stack.
- Provisioning passou a ser contextual:
  - repositório já governado → caminho normal `update`;
  - repositório existente sem governança → caminho normal `adopt`;
  - diretório vazio → caminho normal `init`;
  - operações fora do caminho normal ficam em modo avançado com aviso.
- Providers/features continuam com os mesmos valores internos, mas agora são apresentados como
  ferramentas de IA e práticas de trabalho, agrupadas por intenção humana.
- `FLOW.html` passou a explicar a experiência em três jornadas separadas, cada uma com sua própria
  simulação visual inspirada no Clack:
  - projeto novo → `init`;
  - projeto existente → `adopt`;
  - repo já em uso → `flow`/`update`/lifecycle.
- O aviso não bloqueante de `insights:check` sobre percepções recorrentes, observado com
  `PIT-0011`, deixou de ficar escondido na validação completa: o handoff passa a carregar o
  fato `graduationCandidate` e o `GovernedFlow` projeta a ação "Ver percepções recorrentes que
  precisam de decisão". O wizard apenas abre `npm run flow -- insight list`; promover ou
  descartar continua sendo decisão humana explícita.

## Divergência eliminada

Antes, a pessoa precisava entender termos internos para escolher a próxima tela correta. Depois,
o wizard ainda usa `GovernedFlow`, registry e comandos existentes, mas a apresentação guia a pessoa
pela intenção real.

Isso reduz a classe de conflito "dois caminhos tentando explicar o mesmo estado" sem criar uma
nova fonte de verdade.

## O que ainda falta no CO-10.5

- Revisar todo o vocabulário restante do `flow`, `help`, intents e comandos avançados.
- Usar `taskLog` onde houver validação com saída contínua útil.
- Testar mais estados reais do wizard antes de declarar readiness.
- Garantir que o caminho legado `workflow` fique compatibilizado ou explicitamente subordinado ao
  novo `flow`, sem parecer outro produto.

## Fronteira

Esta rodada não executou Ready, Human Gate, merge, avanço de sub-checkpoint nem abertura de novo PR.
