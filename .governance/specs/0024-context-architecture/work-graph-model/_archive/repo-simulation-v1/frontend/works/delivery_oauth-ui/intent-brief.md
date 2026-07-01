---
node: intent-brief
kind: delivery
sealed: true
---

# Intent — tela de login social (ui)

## Kernel

- **Pretendemos:** usuário logar com Google/GitHub na web
- **Fazendo:** botões OAuth + fluxo de redirect/callback
- **Saberemos por:** login social concluído em staging
- **Pronto quando:** a UI autentica via `backend/deliv-001`

## Espinha

- **Problema:** cadastro com e-mail/senha tem fricção.
- **Resultado desejado:** 1 clique para entrar.
- **Fora-de-escopo:** tela de gestão de contas vinculadas.
- **Sinal de sucesso:** conclusão de login social em staging.

## Corpo (`kind: delivery`)

- **Requisitos:** botões Google/GitHub; tratar redirect/callback; estados de erro.
- **Critério de aceite:** login social completo em staging contra a api.
- **Não-objetivos:** providers além de Google/GitHub.
- **Restrições:** depende dos endpoints de `backend/deliv-001` (**cross-repo**).

> **Coordena com `backend/deliv-001`** (a API). A posição do botão veio de `exp-001` (won). Fecha no `gate`.
