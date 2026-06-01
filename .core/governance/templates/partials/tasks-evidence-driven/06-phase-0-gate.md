### Sub-bloco [0.Gate] — Gate humano (decision-brief → Resolved)

> **[MANDATÓRIO]** Stage 2 (Fase 1+) só inicia após este gate fechar. Pontos podem resolver em rodada única ou em múltiplas rodadas; status `Partial` é estado válido enquanto algumas decisões esperam mais research.

- [ ] **0.G.1** Owner revisa `decision-brief.md` com todos os pontos `[DEC-NNNN-*]` em status `Pendente` e opções preenchidas.
- [ ] **0.G.2** Para cada ponto, conforme o **`Modo de gate`** (`escolha` = owner arbitra entre opções vivas; `aceitação` = owner aceita / rejeita / reenquadra um finding convergido — ver `governance-foundation.md` § "Contrato da cadeia"): owner crava o ato + justificativa + data no bloco "Decisão do Gate Humano"; status muda para `Resolved`.
- [ ] **0.G.3** Pontos que demandem mais research voltam para [0.Research] com tarefa derivada. Iterar até zero pontos `Pendente`/`Partial`.
- [ ] **0.G.4** Status agregado do `decision-brief.md` mudado para `Resolved` (data + owner). Bloco final "✅ Gate fechado" assinado.
- [ ] **0.G.5** `plan.md` v2 publicado: seções de design técnico derivadas das decisões cravadas. Cada subseção referencia o `[DEC-NNNN-*]` correspondente. Stage 2 deixa de ser placeholder.
- [ ] **0.G.6** `tasks.md` v2: este arquivo é atualizado — Fases 1–4 abaixo passam de placeholder para tasks operacionais derivadas do plan v2. Status atualizado para `In Progress (Stage 2)`.
- [ ] **0.G.7** Análise de débitos: atualizar `NEXT.md`.
- [ ] **0.G.[COMMIT]** texto de commit atômico sugerido: "docs(spec-NNNN): gate humano fechado — plan v2 + tasks v2 publicados". A IA deve fornecer a sugestão de commit como saída padrão de fechamento do sub-bloco, sem perguntar.
