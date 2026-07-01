---
node: intent-brief
kind: delivery
sealed: true
---

# Intent — endpoints OAuth (api)

## Kernel

- **Pretendemos:** login social funcionando na API
- **Fazendo:** endpoints authorize/callback/refresh com a lib escolhida
- **Saberemos por:** fluxo OAuth ponta-a-ponta verde em staging
- **Pronto quando:** a web (`frontend/deliv-001`) autentica via estes endpoints

## Espinha

- **Problema:** só temos e-mail/senha; fricção alta no cadastro.
- **Resultado desejado:** usuário entra com Google/GitHub.
- **Fora-de-escopo:** SSO corporativo/SAML.
- **Sinal de sucesso:** taxa de conclusão de login social em staging.

## Corpo (`kind: delivery`)

- **Requisitos:** authorize, callback, refresh; armazenar tokens cifrados.
- **Critério de aceite:** o frontend completa login com Google e GitHub em staging.
- **Não-objetivos:** providers além de Google/GitHub nesta entrega.
- **Restrições:** a lib OAuth vem do `spike-001`.

> Nasceu de `prop-001` (proposal aceita). **Coordena com `frontend/deliv-001`** (a UI). Fecha no `gate`.
