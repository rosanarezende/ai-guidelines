---
node: exploration-answer
verdict: "viável (pub/sub conta as falhas e dispara após N); SE proativo AJUDA é hipótese de produto → experiment dedicado"
promoted: poc/failure-listener.md
---

# Resposta — suporte proativo é viável?

**Viável.** A POC confirma: o support escuta o evento de falha por pub/sub, mantém um contador por sessão e dispara um handler ao atingir N falhas. Contrato de evento definido (canal `login`, mensagem `step-failed`, payload `{ field, attempts }`).

## value-beyond-answer (a POC durável)

A POC — o listener de contagem de falhas — está em `poc/failure-listener.md` (esboço + contrato de evento). `fate: promoted`: a delivery de **ajuda sob demanda** a **absorve** por referência (`derives-from`) e productiza. Nada é deletado — o conhecimento fica no repo.

## fronteira (viabilidade ≠ valor)

Se ABORDAR proativamente **ajuda ou atrapalha** a conclusão do login é uma **hipótese de PRODUTO** — não se resolve aqui. Vira um **experiment** em intent dedicada (via proposal), quando priorizado.
