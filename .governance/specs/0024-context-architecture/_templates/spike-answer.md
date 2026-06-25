---
node: spike-answer # fecho do spike — a RESPOSTA (não o código). Split do antigo learning-record.
brief: <ref ao intent-brief do spike>
verdict: respondido | inconclusivo
sealed: true
# data no corpo
---

# Resposta do spike — <título>

> O **entregável é a resposta**, não o código. O código de POC **não dá merge** — fica num **PR de investigação
> fechado sem merge**; só a resposta + as descobertas vão pro **repo** (aqui), pra ninguém re-investigar o mesmo ponto.

## A resposta

- **Pergunta:** <a dúvida investigada>
- **Resposta:** <funciona / não funciona / depende — com a evidência>
- **Recomendação (bounded):** <adotar | descartar | seguir por X> — o humano decide

## Descobertas (pra dar base a uma análise futura)

- <achados úteis, refs `file#anchor`>

## Destino

- **resolve** a decisão/finding que abriu o spike. Pode **levar a** um `delivery`/`experiment`/`fix` — ou nada
  (concluiu que não funciona; código descartado).
