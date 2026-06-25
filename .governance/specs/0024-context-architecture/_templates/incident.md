---
node: incident
severity: <baixa | média | alta | crítica> # ⊛ exigido
status: <mitigando | mitigado | resolvido> # doc VIVO — acretua até a prevenção
unlocks: # registro RÁPIDO destrava barreiras COM PRAZO (apaga incêndio sem débito; o bypass EXPIRA — GG-0005)
  merge-priority-ate: <YYYY-MM-DD>
  ci-bypass-ate: <YYYY-MM-DD> # um ALERTA dispara no prazo pra garantir o postmortem
# data no corpo
---

# 🚨 Incidente — <título>

> **Blameless.** Não é sobre "quem causou" — é sobre conter e **não repetir**. Registrar é rápido e simples.

## Informações gerais

- **Data:** · **Severidade:** · **Status:** · **O que/quem foi afetado:**

## O que aconteceu

<narrativa curta>

## Investigação

- **Evidências:** (refs `file#anchor`)
- **Hipótese mais provável:**

## Ações executadas (mitigação)

- <o que foi feito pra apagar o incêndio>

## Postmortem (causa-raiz + prevenção) — **leve, mas garantido pelo alerta**

- **Causa raiz:**
- **Prevenção:** <regras/checks/monitoramento pra não repetir>
- **Follow-ups:** <gera `fix` (correção definitiva) / `patch` (hardening) / `proposal`>

<!-- O registro RÁPIDO destrava merge/CI COM PRAZO (bypass expira → sem débito). O postmortem é o artefato
     principal: LEVE o bastante pra dar vontade de fazer, e GARANTIDO por um alerta atrelado ao prazo. Blameless. -->
