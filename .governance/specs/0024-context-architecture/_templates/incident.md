---
node: incident
severity: <low | medium | high | critical> # ⚠️ idioma: o enum do código é EN (IncidentSeverity); manter EN ou PT? (iterar)
status: <mitigando | mitigado | resolvido> # ⚠️ status próprio do incident (não está no LifecycleStatus do código) — confirmar (iterar)
# ⚠️ MECANISMO A DEFINIR (frente dedicada): o registro destrava merge-priority + ci-bypass COM PRAZO (o bypass
#    EXPIRA → sem débito; um alerta garante o postmortem no prazo). COMO exatamente, ainda em aberto.
unlocks:
  merge-priority-ate: <YYYY-MM-DD>
  ci-bypass-ate: <YYYY-MM-DD>
---

# 🚨 Incidente — <título>

> **Blameless:** não é sobre "quem causou".

## Informações gerais

- **Data:** · **Severidade:** · **Status:** · **Afetado:**

## O que aconteceu

<narrativa curta>

## Investigação

- **Evidências:** (refs `file#anchor`) · **Hipótese mais provável:**

## Ações executadas (mitigação)

- <o que apagou o incêndio>

## Postmortem (causa-raiz + prevenção)

- **Causa raiz:**
- **Prevenção:** <regras/checks/monitoramento pra não repetir>
- **Follow-ups:** <gera `fix` / `patch` / `proposal`>
