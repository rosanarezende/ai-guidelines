---
node: intent-brief
kind: incident
sealed: false # incident é DOC VIVO — acretua causa-raiz/prevenção; NÃO sela
---

# Intent — refresh de token OAuth quebrou em produção

## Kernel

- **Pretendemos:** restaurar o refresh de token
- **Fazendo:** corrigir a validação de expiração
- **Saberemos por:** refresh verde em produção
- **Pronto quando:** reproduzir e passar

## Corpo (`kind: incident`)

- ⊛ **Severidade:** alta (usuários deslogados em massa)
- **O que quebrou + impacto:** refresh rejeitava tokens válidos por clock-skew; sessões caíam.
- **Linha do tempo:** 09:10 alerta · 09:25 reproduzido · 09:50 mitigado (rollback).
- **Mitigação / recuperação:** rollback do deploy do refresh.

## Postmortem (acretado DEPOIS — por isso o doc é VIVO)

- **Causa raiz:** comparação de expiração sem tolerância a clock-skew.
- **Prevenção:** tolerância de 60s; teste de skew; alerta de taxa de refresh-fail.
- **Follow-up:** `fix-001` (`registry/fix.yml`) — robustez a clock-skew.

> Doc VIVO, **não selado**. Sem `gate`/`learning-record` — o registro É o fecho. **Spawnou `fix-001`**.
