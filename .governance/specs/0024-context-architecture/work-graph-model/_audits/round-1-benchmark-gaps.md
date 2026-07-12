# Auditoria rodada 1 — benchmark de gaps do modelo

- Data: 2026-06-30 · agente revisor externo (auditor adversarial) · **apoio, não-autoridade**.
- **Incorporado:** o eixo `source: planned|reactive` ortogonal; o veredito "incident não sai de breakdown planejado". Base da deliberação da taxonomia.

## Prompt

```
Você é um REVISOR ARQUITETURAL ADVERSARIAL (conselheiro técnico direto, auditor — não um
cheerleader). Framework de GOVERNANÇA file-first que modela "o trabalho como um grafo tipado",
org FICTÍCIA e ANONIMIZADA (acme-*). Faça um BENCHMARK contra prior art pública e ache os GAPS.
LEIA: o tracker (5 lentes), o fluxo iniciativa→works, as deliberações, model.ts.
Modelo em 1 parágrafo: iniciativa REGISTRADA (negócio) → TRIAGEM (eng: dúvidas→itens, dispõe cada,
matcher advisory, valida contratos) → INVESTIGAÇÃO → GATE humano (promover/descartar) → INTENT +
breakdown. 5 tipos de trabalho MECE: delivery/experiment/incident/fix/patch + 2 ferramentas
(exploration/proposal). File-first, banco DERIVADO, backend PLUGÁVEL.
TAREFA: ache os GAPS (o que falta/é arriscado, não validação). Prior art: Jira/Linear/Azure/Shape
Up/SAFe · dual-track/OST/Amazon PR-FAQ/RICE-ICE · Backstage/CODEOWNERS · SRE/incident.io/PagerDuty ·
feature-flags/A-B · ADR/RFC/GraphRAG/MCP-A2A. Estresse: (1) o breakdown nos 5 tipos e se incident
cabe; (2) registro→triagem→gate→intent; (3) o matcher advisory; (4) file-first+grafo-derivado+move;
(5) exploration como gate de viabilidade; (6) o que falta por completo. SAÍDA: tabela de gaps +
top riscos + veredito do incidente. Cite fontes públicas, org fictícia.
```

## Resposta (verbatim)

**Veredito curto.** O maior gap não é "faltam mais tipos"; é que vocês estão misturando **tipo de trabalho** com **origem/intake** e **classe de serviço**. A prior art sustenta separar trabalho planejado de trabalho reativo, mas **não** sustenta dizer que `fix` nunca é planejado. Sustenta, sim, que `incident` não deve sair de um breakdown planejado: ele é declarado por evento/impacto; o breakdown pode planejar prevenção, preparo, rollback, hardening ou correção definitiva.

**Fatos observados.** WorkKind = delivery|experiment|incident|fix|patch; `intent?: string|null` permite reativos standalone; Register/Triage/Gate existem; TriageItem tem exploration|answered|needs-info. Divergências: o tracker fala em status específico pra incidentes, mas model.ts usa draft|active|done pra todos; proposal/UI permitem promover pra incident; e há duas leituras de gate (uma antiga em que o gate deriva de works; a nova em que gate vem antes da intent ativada).

**Tabela de gaps (resumo).**

- **5 tipos MECE** × Azure/Jira/Kanban: `reativo` está virando propriedade do tipo, não do fluxo → adicionar dimensões ortogonais (`kind`/`source`/`service-class`/`priority`/`planned-in`).
- **`incident`** × SRE/incident.io: modelo raso; status genérico não expressa mitigação/resolução/postmortem → lifecycle próprio, impedir criação por breakdown planejado.
- **`fix`** × bug tracking: a hipótese "fix nunca planejado" é falsa → permitir fix no breakdown quando a intent é correção/estabilização; marcar `source=planned|reactive`.
- **Registro→triagem** × Linear Triage: falta SLA de triagem, dono de fila, capacidade, escalonamento.
- **Gate** × Shape Up/Amazon/OST: a intent tem enquadramento mas pouco "betável" — falta appetite, non-goals, alternativas.
- **Matcher** × Backstage/CODEOWNERS: sugere repo mas não sabe carga/autoridade/ownership stale/confiança → score/explicação/threshold/unknown/escalonamento/freshness.
- **File-first+move** × data store com history: falta id estável forte, event log, invariants, snapshot assinado.
- **Exploration** × Shape Up/spikes/OST: pode virar fila de pesquisa sem fim → timebox, pergunta falsificável, stop rule, fate obrigatório.

**Top riscos ranqueados.** (1) confundir tipo com reatividade; (2) incidente submodelado; (3) capacidade/priorização ausentes; (4) matcher sem contrato de confiança; (5) file-first sem event log semântico; (6) exploration sem stop-rule; (7) experiment/release sem instrumentação; (8) ownership/RACI fraco.

**Incidente no breakdown — veredito:** NÃO coloque `incident` como saída de breakdown planejado. Incident é resposta a impacto real/iminente; o que se planeja é **capacidade de responder** e **prevenção** (runbook, alertas, canary/rollback, hardening, correção definitiva, game day, postmortem actions). `breakdown` planejado gera `delivery`/`experiment`/`patch`/`fix`; `fix` quando a intent visa corrigir/estabilizar; `incident` só por `declare incident`/alerta/trigger, ligado por `occurred-during`/`caused-by`/`related-to`, nunca como filho de `breaks-into`.
