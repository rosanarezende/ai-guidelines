---
node: intent-brief
kind: experiment
sealed: true # sela a HIPÓTESE/MÉTRICAS — anti-mover-trave
---

# Intent — posição do botão de login social aumenta conversão?

## Kernel

- **Pretendemos:** +conversão de cadastro
- **Fazendo:** testar botão OAuth acima vs abaixo do formulário
- **Saberemos por:** taxa de cadastro concluído
- **Pronto quando:** significância

## Espinha

- **Problema:** cadastro abandonado na primeira tela.
- **Resultado desejado:** +conversão de cadastro.
- **Fora-de-escopo:** copy dos botões.
- **Sinal de sucesso:** cadastro concluído.

## Corpo (`kind: experiment`)

- ⊛ **Hipótese:** botão OAuth acima do formulário converte mais.
- ⊛ **Métricas:** principal=cadastro-concluído · auxiliar=cliques OAuth · tradeoff=erros de form.
- **Objetivos de aprendizado:** à primeira vista, o usuário prefere social ou e-mail?
- **Solution design (MVT):** A/B da posição do botão.
- **Instrumentação:** `signup_view` · `oauth_click` · `signup_done`.
- **Segmentação:** novos visitantes; 50/50.

> Sela a hipótese. Fecha em `learning-record` (won → **informa** `frontend/deliv-001`).
