# Auditoria rodada 2 — os 4 tipos moram na mesma categoria "trabalho"?

- Data: 2026-06-30 · agente revisor externo · **apoio, não-autoridade**.
- **Incorporado:** `experiment`→APRENDIZADO · `fix`+`patch`→`maintenance` (com dimensões) · as 5 famílias. Virou a [deliberação da taxonomia](../deliberation/2026-06-30-work-taxonomy-deliberation.md) e as Lentes 3-4 do tracker v2.

## Prompt

```
Rodada 2 — MESMA análise. Desde a rodada 1 (aprovado): incident->instrumento reativo de ciclo
proprio (nao sai de breakdown); source ortogonal (planned|reactive) universal; principio: modelar
TODOS os fluxos (implementacao faseada). NOVA PERGUNTA: os 4 tipos restantes (delivery/experiment/
fix/patch) moram TODOS na categoria "trabalho"? (1) EXPERIMENT: output direto = aprendizado
(won/lost), nao capacidade comprometida (essa vem no won->delivery) — aplicando o teste "entrega
valor de PRODUTO?", seria instrumento de aprendizado que shippa (irmao da exploration)? (dual-track,
discovery vs delivery, plataformas de experimentacao). (2) FIX/PATCH: parecem MANUTENCAO; o
discriminador e so VISIBILIDADE — deveria virar dimensao colapsando num "maintenance"? (ISO/IEC
14764 corretiva/adaptativa/perfectiva/preventiva; ITIL standard/normal/emergency; issue types Jira/
Azure/Linear). (3) O padrao e "MENOS tipos, MAIS dimensoes ortogonais"? (Kanban classes of service).
Sobra categoria melhor que "trabalho"? SAIDA: tabela de gaps + top riscos + veredito (experiment e
trabalho ou instrumento; fix/patch = 2 tipos ou 1+dimensao). Cite fontes, org ficticia.
```

## Resposta (verbatim, condensado)

**Veredito curto.** A hipótese "menos tipos, mais dimensões" está correta, mas não deve virar minimalismo cego. `experiment` deve **sair de `work`** e virar **instrumento executável de aprendizado**. `fix`+`patch` devem colapsar em **`maintenance`** com dimensões obrigatórias (`visibility`, `maintenance-mode`, `change-class`).

**Gaps (essência).** `experiment` como work × dual-track (SVPG/Patton): discovery foca aprendizado, não software → promover a `learning-instrument`, mas **com lifecycle operacional** (flag/exposure/metric/guardrail/decision-rule/cleanup). `experiment won → delivery` × Scrum Increment: separar `experiment-run` de `productization` (`results-in: delivery|maintenance`). `fix`/`patch` separados × ISO/IEC/IEEE 14764: só por visibilidade é taxonomia fraca → `maintenance + maintenance-mode: corrective|adaptive|perfective|preventive`. Visibilidade × Jira/Azure: `visibility: user-visible|internal|operator-visible|security-visible`. Manutenção/mudança × ITIL: `change-class: standard|normal|emergency`. "Menos tipos, mais dimensões" × Kanban: **cada dimensão precisa de semântica operacional + lint** (senão vira tag decorativa). `proposal`/`exploration`/`experiment` × dual-track/OST: família `learning/discovery instruments`.

**Top riscos.** (1) experiment como work comum (maior risco conceitual); (2) maintenance submodelada sem `maintenance-mode`; (3) dimensões sem enforcement; (4) perda de semântica humana (UI precisa de presets); (5) experiment sem cleanup (flags mortas); (6) maintenance virando buraco negro (precisa reason/mode/impact); (7) categoria raiz "trabalho" fraca.

**Veredito experiment:** não é `work kind` no nível de delivery/maintenance. É **instrumento executável de aprendizado**: roda intervenção real, pode exigir código/expor usuários, mas seu output governado é **aprendizado + decisão**. won→`delivery`; lost→`maintenance`/nada; inconclusivo→nova exploration/experiment.

**Veredito fix/patch:** viram **`kind: maintenance`** com dimensões mínimas `maintenance-mode` · `visibility` · `source` · `change-class` · `service-class`. Presets: "fix" = `maintenance+corrective+user-visible`; "patch" = `maintenance+internal/security/operator-visible` — UX/alias, não ontologia.

**Categoria melhor (raiz):** `value-change` (delivery) · `maintenance` · `learning` (exploration, experiment) · `response` (incident) · `intake` (proposal, register/candidate). Preserva "modelar todos os fluxos; implementação faseia".
