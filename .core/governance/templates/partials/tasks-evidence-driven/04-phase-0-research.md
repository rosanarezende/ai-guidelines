### Sub-bloco [0.Research] — Stage 1: produzir researches

> Pesquisa instrumental, externa ou empírica que alimenta os pontos `[DEC-NNNN-*]` do `decision-brief.md`. **Toda research deve alimentar pelo menos um ponto `[DEC-*]`** — research que não alimenta está fora de escopo.
>
> **Critério de parada (ver `governance-foundation.md` § "Contrato da cadeia"):** a research **para quando há material suficiente para decidir**, não quando resta uma única resposta. Decidir é proibido à research — ela entrega **opções vivas e comparáveis** (simetria informacional: mesmo conjunto mínimo de perguntas por opção, inclusive "quando NÃO escolher") ao decision-brief, declarando o `Modo de gate` (`escolha`/`aceitação`); não entrega uma conclusão. **Torna comparável, não convence.**

- [ ] **0.R.1** Listar perguntas de research a responder (uma linha por arquivo) em `plan.md` § Research lifecycle, cada pergunta cruzada com o ponto `[DEC-*]` correspondente.
- [ ] **0.R.2** Produzir `research/YYYY-MM-DD-<tema>.md` por pergunta. Cada arquivo cita fontes (URL + ID externo quando aplicável: CWE-NNN, paper, benchmark publicado, transcrição).
- [ ] **0.R.3** Validar critério: cada research cobre pelo menos uma pergunta do `plan.md` E alimenta pelo menos um ponto `[DEC-*]`. Sem ambos, research sai do escopo (mover para `_drafts/` ou descartar).
- [ ] **0.R.4** Análise de débitos: atualizar `NEXT.md` com eventuais insights secundários.
- [ ] **0.R.[COMMIT]** texto de commit incremental sugerido: "research(spec-NNNN): sínteses Stage 1 publicadas". A IA deve fornecer a sugestão de commit como saída padrão de fechamento do sub-bloco, sem perguntar.
