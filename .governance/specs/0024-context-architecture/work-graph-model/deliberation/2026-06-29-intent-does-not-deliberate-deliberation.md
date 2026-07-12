# Deliberação — a intent NÃO delibera (exploration = ferramenta; q/r/d = etapa de work) — em q/r/d

- Data: 2026-06-29 · Spec 0024 · Natureza: **research/deliberação, não-autoridade** (insumo de DEC).
- Em divergência vencem `state.yml`/`tasks.md`/`decision-brief.md`/gates/Git.
- Formato q/r/d (insight owner): `questions` (pergunta + opções, "o antes") · `researches` (embasamento/referências) · `decisions` ("o depois"). Aplicado e PROVADO na sim.

---

## Questions (o que estava em aberto)

### Q1 — a intent DELIBERA? onde mora o q/r/d?

- (a) a intent tem `deliberation.yml` ao lado (q/r/d no nível do objetivo) · (b) a intent **não** delibera — q/r/d é etapa de **work/exploration**, e a intent só **usa** a ferramenta `exploration`.

### Q2 — como chamar a "pergunta" que a intent lança à exploration?

- manter `question` (confunde com o q/r/d) · renomear. "question" deve ficar reservada pro q/r/d.

### Q3 — sem `deliberation.yml`, onde fica o GATE (o dono aceita/rejeita o verdict)?

- (a) um arquivo de gate ao lado · (b) **derivar** do breakdown (uma work nasce da exploration = aceito; nenhuma = rejeitado).

---

## Researches (embasamento — referências; num q/r/d real, cada uma seria documentada a fundo)

- **R1** (→Q1/Q2): `exploration` é **FERRAMENTA** (Lente 4 do tracker) — usável em qualquer host, a qualquer tempo (até no meio de um experiment); recebe uma pergunta → devolve verdict. `q/r/d` é **etapa do fluxo de um WORK** (ou de uma exploration). Logo NÃO são iguais.
- **R2** (→Q3): o **teste da spike rejeitada** (`captcha-spike_1` na sim): 2 explorations `throwaway` (form-validation + captcha) com gates **OPOSTOS** (e1 aceito, e3 rejeitado) ⇒ **`fate` ≠ gate** — o gate vem do **breakdown** (`derives-from`), não do destino do output.
- **R3** (→Q3): `derives-from` = **PROVENIÊNCIA** (de onde a work nasceu), não "absorve código" — já no tracker (Lente 3); a sim só sub-aplicava. Aplicado a `form-component_1` → o gate deriva limpo.
- _(bônus do teste: o `deliberation.yml` da intent também cacheava a resposta cross-repo — sem ele, o gate honestamente depende da projeção do repo-fonte.)_

---

## Decisions (owner 2026-06-29)

### D1 (resolve Q1) — **a intent NÃO delibera** (opção b)

q/r/d é etapa de **work/exploration**, não de intent. A intent **usa** a ferramenta `exploration` (lança um ponto → recebe verdict). **Sem `deliberation.yml` na intent** (removido do domínio/ports/FileHostRepository + do arquivo da sim).

### D2 (resolve Q2) — **`explores`** (na ferramenta) + ids `e1/e2/e3`

O subject do que se explora mora na **exploration** (`explores`), universal (funciona em qualquer host). O `open-questions` da intent virou **`explores: [{id, subject}]`**; "question" fica reservada pro q/r/d (de work). Ids `eN` (explore-point) ≠ `qN` (q/r/d question).

### D3 (resolve Q3) — **gate DERIVA do breakdown**

aceito = alguma work `derives-from` a exploration (proveniência) · rejeitado = exploration done + nenhuma work deriva · pendente = exploration não-done. **Sem marcador novo** — `derives-from` (proveniência) + o verdict bastam. Provado na sim (e1 aceito, e2 aceito, e3 rejeitado).

---

## Aplicado

`_lib/{model,derive,ports,build,check}.ts` + `FileHostRepository`/`FileRepository` + a view + a sim (intent.yml `explores`, `captcha-spike_1` rejeitada, `deliberation.yml` da intent removido). Commits `5c54e655` (modelo) + `0d2a7c42` (rename). Detalhe no tracker.
