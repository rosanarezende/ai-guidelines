### Sub-bloco [0.Setup] — Bootstrap e instanciação

- [ ] **0.1** **Bootstrap**: ler `roadmap/backlog.md` (spec ativa, prioridades, candidatas absorvidas) e `.core/process/governance-foundation.md` § "Tipos de spec".
- [ ] **0.2** **Tipo de spec** confirmado como `evidence-driven` no header da `spec.md`. Critério-teste: _"o design depende de evidência técnica/pesquisa ainda não coletada?"_ → **sim**.
- [ ] **0.3** **Slug semântico** definido (ex.: `<domínio>-<verbo-curto>`); o **número (NNNN)** só é alocado na criação da branch.
- [ ] **0.4** Branch `feat/spec-NNNN-<slug>` criada a partir de `main`.
- [ ] **0.5** `spec.md` instanciado a partir de `.specify/templates/spec-boilerplate.md`; header completo com `Tipo de spec: evidence-driven` e campo `Decision Brief` apontando para `./decision-brief.md`.
- [ ] **0.6** **[MANDATÓRIO]** Validação Humana inicial: owner aprova problema e escopo definidos no `spec.md` **antes** de avançar para Stage 1.
- [ ] **0.7** `plan.md` instanciado a partir de `.specify/templates/plan-boilerplate.md` com bloco **Stage 1 / Stage 2 placeholder** (Stage 2 fica em placeholder até o gate fechar).
- [ ] **0.8** `tasks.md` (este arquivo) instanciado a partir desta variante.
- [ ] **0.9** `decision-brief.md` instanciado a partir de `.specify/templates/decision-brief-boilerplate.md` com pontos `[DEC-NNNN-*]` listados em status `Pendente`, sem opções preenchidas (opções entram no sub-bloco [0.Brief]).
- [ ] **0.10** `roadmap/backlog.md` atualizado: spec movida para "Em execução"; candidatas absorvidas migradas para `roadmap/historico.md` com ponteiro à spec absorvedora.
- [ ] **0.11** `NEXT.md` instanciado (mandatório).
- [ ] **0.12** Criar Pull Request em Draft. O agente usa o template do repositório se existir (ex: `.github/pull_request_template.md`), preenchendo as informações da spec. Caso não exista template, adicionar uma descrição concisa do contexto e escopo inicial.
- [ ] **0.[COMMIT]** texto de commit atômico sugerido: "chore(spec-NNNN): setup inicial da spec". A IA deve fornecer a sugestão de commit como saída padrão de fechamento do sub-bloco, sem perguntar ao usuário.
