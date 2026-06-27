---
node: spike-answer
sealed: true
---

# Resposta do spike — <título>

> O entregável é a **resposta**, não o código. Este doc é a **casa do conteúdo** do fecho;
> o registry indexa `status`/`fate`/`closed-at` e **referencia este doc via `closed-by`** — aqui é só conteúdo, sem aresta.

## A resposta

- **Pergunta:** <a mesma `question` do spike-brief>
- **Verdict (1 linha):** <a resposta — espelha o `verdict-inline` da intent; no spike simples, a intent É a casa>
- **Evidência:** <funciona / não funciona / depende — com a prova>
- **Recomendação (_bounded_):** <adotar | descartar | seguir por X>

## Descobertas (pra não re-investigar)

- <achados úteis, refs `file#anchor`>

## Destino (`fate`)

- **`promoted`** → a POC de valor persiste em `works/spike_<slug>/poc/`; o trabalho que a produtiza declara `derives-from` apontando o spike.
- **`throwaway`** → o código jogável morre **depois** de capturar esta resposta (não dá merge).
- **`parked`** → guardado, sem ação agora.
- pode **levantar** um `proposal` (lado `raised-by` do proposal) e **resolver** a open-question da intent.
