# POC — listener de falhas de login (suporte proativo)

> Prova de viabilidade do `exploration-302`. `fate: promoted` → base da `deliv-230` (ajuda sob demanda).
> **Fica aqui no workspace do exploration** (não é deletado); a delivery a **absorve por referência**.

## O que prova

O support consegue escutar o evento de falha, contar por sessão e disparar um handler após N.

## Contrato de evento (definido pela POC)

- canal: `login` · mensagem: `step-failed` · payload: `{ field, attempts }`

## Esboço (pseudo — API do substrato anonimizada)

    bus.listen("login", "step-failed", ({ attempts }) => {
      if (attempts >= N) offerProactiveHelp(); // gancho que a delivery productiza
    });

## Como a delivery absorve

`deliv-230` referencia este exploration (`derives-from: acme-mfe-support/exploration-302`) e productiza o listener + o
gancho `offerProactiveHelp`. _(o A/B do proativo = experiment dedicado — próxima iteração, via proposal.)_
