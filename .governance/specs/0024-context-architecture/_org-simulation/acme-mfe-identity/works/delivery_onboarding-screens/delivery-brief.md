---
node: work-brief
kind: delivery
id: deliv-120
intent: intent-001
sealed: true
---

# Delivery — telas de onboarding (MFE)

> Capacidade decidida: as telas do novo fluxo de onboarding, montadas pelo `acme-shell`.

## Kernel

- **Pretendemos:** o usuário completa o onboarding em telas guiadas dentro do MFE.
- **Fazendo:** MFE em `acme-mfe-identity`, consumindo o `acme-design-system` e a API.
- **Saberemos por:** telas integradas e montadas pelo shell.
- **Pronto quando:** fluxo completo navegável, atrás de feature flag.

## Espinha

- **Problema / contexto:** abandono alto no onboarding atual.
- **Resultado desejado:** fluxo mais simples e guiado.
- **Limite / fora-de-escopo:** não mexe em billing.

## Corpo

- **Requisitos:** consome o **contrato** da API de onboarding (`acme-api/deliv-101`).
- **Critério de aceite:** shell monta o MFE; o progresso dos passos persiste.
- **Não-objetivos · Restrições de design:** —
