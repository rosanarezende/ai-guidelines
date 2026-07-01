# Fluxo da iniciativa aos trabalhos — registro · triagem · investigação · gate · intent · breakdown (5 tipos)

- Data: 2026-06-30 · Spec 0024 · Natureza: **síntese de referência, não-autoridade** (companion do tracker `tracker.md`).
- **O tracker continua o SSOT das decisões.** Este doc DESCREVE o fluxo ponta-a-ponta (sintetiza o decidido) e marca o que ainda é **🔶 hipótese a estressar** (sobretudo o breakdown nos 5 tipos). Em divergência vencem `state.yml`/tracker/gates/Git.
- Org fictícia ANONIMIZADA (`acme-*`). Nenhum nome/fonte confidencial é versionado.
- **Como usar:** alimentar junto com o tracker; cada 🔶 que fechar vira decisão no tracker; cada gap que o benchmark achar entra aqui.

---

## 0. O ciclo, em uma figura

```
   NEGÓCIO                         ENGENHARIA                        DONO/HUMANO
   ───────                         ──────────                        ───────────
 [registrar] ─► registers/candidates/<id>/
      │            register.yml
      ▼
 [registrada] ─(detalhe: ver/editar)─► [iniciar triagem]
                                            │
                                            ▼
                                         [triagem] ── triage.yml (itens · disposições · matcher · contratos · viabilidade)
                                            │
                                            ▼
                                       [investigação] ── explorations DISPARADAS rodam nos work-repos → verdicts
                                            │                       (viabilidade é TESTADA aqui)
                                            ▼
                                          [GATE] ── gate.yml ── promover│descartar
                                            │
                ┌───────────────────────────┴───────────────────────────┐
            promover (viável)                                      descartar (inviável/repriorização)
                │                                                          │
                ▼                                                          ▼
        consolida register+triage → intents/<id>/intent.yml        só move p/ registers/archived/<id>/
        + move candidata p/ archived/  (ciclo fechado)             (nada nasce em intents/)
                │
                ▼
        [intent ATIVADA] ──(breakdown: ato do dono)──► WORKS (os 5 tipos) ──► cada work: brief → q/r/d → merge → fecho
                                                          (delivery · experiment · [reativos: incident · fix · patch])
```

---

## 1. Registro — face de NEGÓCIO (status `registrada`)

- **Quem:** negócio (PM, product, quem tem a dor). **Onde:** `registers/candidates/<id>/register.yml`.
- **O quê (o "quê" da iniciativa):** **título** + **descrição** (o par mais importante) · **enquadramento** (problema de negócio / do cliente · driver estratégico / métrica) · **pessoas** (`registered-by` = quem cadastrou · `owner` = accountable · `stakeholders`) · **referências/links** · **dúvidas em linguagem de negócio** (`open-questions`).
- **O que NÃO entra aqui:** contratos, explore-points técnicos, roteamento. Isso é triagem (engenharia). _(D9/D10 da [deliberação](../deliberation/2026-06-30-intent-authoring-shape-deliberation.md).)_
- **id:** gerado no submit (`slug-do-título_<random ~16-bit>`), não editável.
- **Pós-registro:** vai pro **detalhe da candidata** (ver/editar) — **não** direto pra triagem (quem registra pode não ser quem tria). Lá um botão **inicia a triagem**.

## 2. Triagem — face de ENGENHARIA (status `triagem`)

- **Quem:** engenharia (ou quem assume o "iniciar triagem"). **Onde:** `registers/candidates/<id>/triage.yml` (ao lado do register).
- **Itens a investigar/decidir** (`items`): cada um vem de uma **dúvida do negócio** (`from-doubt`) **OU** é **levantado pela própria eng** na fase (a investigação revela novas incógnitas). Cada item tem `id`/`title` próprios.
- **Disposição de cada item:**
  - **`exploration`** → precisa investigar → vira um **explore-point** (`{id, title, details}`) que será **DISPARADO como uma `exploration`** no work-repo certo.
  - **`answered`** → o eng **responde direto** (já sabe; não precisa investigar).
  - **`needs-info`** → falta informação → **volta pro NEGÓCIO** com um **`assignee`** + `blocked-since` → o read-model deriva **quem** segura e **por quanto tempo** o fluxo está bloqueado (D8; a dor do remoto, agora medível).
- **Matcher (advisory):** a eng **simula** o matcher (léxico · LLM local · API) sobre os campos editados (descrição + título do item + detalhe) → **sugere os repos**. Nunca decide (a Q4 do [roteamento](../deliberation/2026-06-29-vertical-routing-deliberation.md)); o humano confirma.
- **Contratos validados:** um **contrato** é um **ponto de interface compartilhado entre repos** (componente · api · evento · serviço) que a iniciativa coordena (ex.: `form-component` provido pelo design-system, consumido pelos MFEs). A eng valida os contratos (a partir dos `provides` reais dos manifestos) — aceita/corrige/adiciona/remove.
- **Viabilidade:** notas que se acumulam.

## 3. Investigação (status `investigacao`)

- As **explorations disparadas rodam** nos work-repos (`<repo>/.governance/explorations/`), declaram `answers: <intent>#<explore-id>` e **publicam o verdict** de volta (a arquitetura de projeções publicadas).
- **Disparar exploration NÃO ativa a intent** — é aqui que a **viabilidade é testada**: uma exploration pode mostrar que a iniciativa é **inviável**.
- O host agrega os verdicts → o dashboard de triagem mostra viabilidade + tempo-bloqueado.

## 4. Gate — DECISÃO (não deliberação)

- **Onde:** `registers/candidates/<id>/gate.yml`. **É decisão, não q/r/d** (a intent não delibera; tem um **gate de ativação**).
- **`outcome`:** `promoted` (viável + contratos validados) **|** `discarded` (inviável, ou repriorização — distinguidos pelo `rationale`). + `decided-by` · `decided-at` · `rationale` · resumo de viabilidade.

## 5. Ativação — consolidação + move (ciclo fechado)

- **Promover** → **consolida** register + triage em `intents/<id>/intent.yml` (não copia cru: enquadramento + **explore-points validados** + **contratos**) **e move** a candidata p/ `registers/archived/<id>/` (a jornada completa: register + triage + gate). **Descartar** → só arquiva.
- **Refs por id estável** (`<id>#<explore-id>`); o host resolve em `candidates/`→`intents/`→`archived/` — mover não quebra link. Histórico preservado (`git mv` quando rastreado; senão `fs.rename` + detecção de rename do git).
- A **intent ativada** é o objetivo durável, pronta pro **breakdown**.

---

## 6. Breakdown da intent em TRABALHOS — os 5 tipos 🔶 (o que estressar)

> **🔶 Esta é a fronteira a estressar.** O tracker já decidiu peças (intent `breaks-into` works; "as deliveries nascem só DEPOIS que os explore-points são respondidos"; "o breakdown é o ato do dono"; reativos são lane separada). Aqui consolido a **hipótese de fluxo** + os pontos a validar (sim + benchmark + gate da owner).

**Quando:** o breakdown acontece **pós-ativação** — a intent já é viável e os contratos estão validados. O **dono materializa** os works como arquivos `draft` (registry + brief), com as dependências postas; `active` exige `assignee` + início real.

**Como a resolução vira trabalho:** cada **explore-point resolvido** (verdict) + cada **contrato `known`** indica **qual repo precisa de entrega** e **contra qual contrato**. A intent `breaks-into` N works (um por repo que precisa de trabalho); o caminho crítico sai das dependências (`blocked-by` entre works · `coordinates-with` o contrato).

### Os 5 tipos × o breakdown (hipótese)

| tipo            | vem do breakdown PLANEJADO da intent?                                                                                                                                                                                                 | natureza                | exemplo na iniciativa de login                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| **delivery**    | **SIM — é a saída principal.** Constrói a capacidade decidida, por repo.                                                                                                                                                              | planejado               | `form-component` (DS) · `login-mfe` (identity) · `help-on-demand` (support)          |
| **experiment**  | **ÀS VEZES.** Quando a intent embute uma **hipótese a testar**. Mais comum: um `proposal` abre uma **intent dedicada** pro experiment (às vezes paralela).                                                                            | planejado (raro inline) | "suporte proativo melhora a conclusão?" → `proposal` → intent dedicada de experiment |
| **patch**       | **PODE.** Manutenção **habilitadora** que a entrega exige (bump de dep, migração) entra no plano. Mas patch standalone (dívida) nasce reativo.                                                                                        | planejado _ou_ reativo  | "subir a versão do design-system pra expor o token"                                  |
| **fix**         | **RARAMENTE planejado.** Fix corrige um bug que o **usuário vê** — quase sempre **reativo/standalone** ou percebido durante o trabalho.                                                                                               | reativo (quase sempre)  | bug no form percebido durante o `login-mfe`                                          |
| **incident** 🔶 | **HIPÓTESE: NÃO.** Incident é **reativo** (contém um problema grave, blameless) — **não** sai do plano de uma intent. Pode **ocorrer DURANTE** a execução dos works da intent e **retroalimentar** (postmortem → fix/patch/proposal). | reativo (sempre)        | uma falha grave em produção durante o rollout do login                               |

### A leitura (hipótese a validar)

- **Saídas PLANEJADAS do breakdown:** **delivery** (principal) · **experiment** (quando há hipótese; geralmente via proposal→intent dedicada) · **patch** (quando é habilitador).
- **REATIVOS — não saem do plano, surgem durante/depois:** **incident** e **fix**. São **lane separada** (o tracker: "reativos ficam sem intent por padrão"). Podem ser **disparados pela execução** de um work da intent e **retroalimentar** o sistema (postmortem/`raises` → `proposal`/`fix`/`patch`).
- **Sobre o incidente (a pergunta da owner):** **provavelmente NÃO cabe no breakdown** — ele não é planejável a partir do objetivo. Cabe no MODELO como tipo de trabalho (reativo), mas entra por **gatilho**, não por **plano**. _(🔶 estressar: e quando a própria iniciativa É "resolver uma classe de incidentes"? Aí a intent existe, mas os works dela seriam delivery/patch de prevenção — o incidente individual segue reativo.)_

### Pontos a estressar (🔶 abertos)

1. **Incident no breakdown:** confirmar que é só reativo (não planejado). Benchmark: como SRE/postmortem frameworks separam "trabalho planejado" de "resposta a incidente".
2. **Experiment inline × dedicado:** quando o experiment fica DENTRO da intent vs. abre intent própria (o tracker permite ambos; falta o critério claro na UI/fluxo).
3. **Fix/patch percebidos durante o trabalho:** o caminho `proposal`/`raises` que captura "achei um bug/dívida enquanto entregava" — como isso aparece no fluxo da intent sem travar a entrega.
4. **Quem faz o breakdown:** é a mesma pessoa da triagem (eng) ou o `owner` accountable? O "ato do dono" precisa de assignee.
5. **Granularidade do work:** 1 explore-point resolvido → 1 delivery? ou N? e o `coordinates-with` quando 2 repos compartilham 1 contrato.

---

## 7. O ciclo de vida de CADA trabalho (depois do breakdown)

Cada work nasce `draft` e segue (Lente 2 do tracker): **abrir** (`<kind>-brief`) → **investigar/decidir** (o próprio **q/r/d** do work — `question`/`research`/`decision`, o coração; opcional mas é onde está o valor) → **executar** (fazer) → **entregar** (merge) → **acompanhar** (fecho denso só em experiment→`outcome` e incident→`postmortem`; delivery/fix/patch só verificam).

- **`active` exige `assignee` + início real.** "Bloqueado"/"pausado" são **derivados** (de `blocked-by` + status dos bloqueadores), não guardados.
- **Retroalimentação:** os fechos (`exploration-answer`/`experiment-outcome`/`incident-postmortem`) viram conhecimento que alimenta a deliberação; um work pode **`raises`** um `proposal` (ideia/dívida percebida) sem travar.

---

## 8. Mapa de artefatos por fase (arquivos)

| fase         | artefato                                                            | onde                                                         |
| ------------ | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| registro     | `register.yml`                                                      | `acme-governance/registers/candidates/<id>/`                 |
| triagem      | `triage.yml`                                                        | idem                                                         |
| investigação | `exploration` (+ answer)                                            | `<work-repo>/.governance/explorations/<id>/`                 |
| gate         | `gate.yml`                                                          | candidata                                                    |
| ativação     | `intent.yml` (+ candidata → `archived/`)                            | `acme-governance/intents/<id>/` · `registers/archived/<id>/` |
| breakdown    | `registry/<kind>.yml` + `<kind>-brief`                              | `<work-repo>/.governance/works/<kind>/<slug>_<num>/`         |
| work q/r/d   | `questions/`·`research/`·`deliberation.yml`                         | dentro do work                                               |
| fecho        | `experiment-outcome` · `incident-postmortem` · `exploration-answer` | `closings/` do work                                          |

---

## 9. Hipóteses fechadas × abertas (resumo)

- ✅ **decidido (tracker):** intent `breaks-into` works · breakdown pós-resolução é ato do dono · reativos (incident/fix/patch) = lane separada, opcionalmente sem intent · `active` exige assignee · bloqueado/pausado = derivado · 5 tipos por intenção de saída.
- 🔶 **a estressar (este doc + benchmark + sim):** quais tipos saem do breakdown PLANEJADO (hipótese: delivery sempre · experiment/patch às vezes · incident/fix nunca) · incident é só reativo · critério experiment inline×dedicado · captura de fix/patch durante o trabalho · granularidade do work.
