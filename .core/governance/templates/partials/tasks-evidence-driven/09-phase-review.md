---

## Fase de Review (Gate de Homologação)

> **Fase exclusiva para empacotamento e homologação.** Nenhuma implementação nova após este ponto, exceto correções demandadas pelo review humano.

- [ ] **3.1** Atualizar header da `spec.md`: status → `In Review`.
- [ ] **3.2** Pipeline canônico verde: rodar a suíte completa (install bloqueado/immutable + format check + test com coverage). Ex. no `ai-guidelines`: `yarn check:repo`. Em outros stacks: `npm ci && npm run lint && npm test`, `pnpm install --frozen-lockfile && pnpm verify`, ou equivalente.
- [ ] **3.3** Critérios de aceite de `spec.md` (alto nível) e DoD de `plan.md` (detalhado) confirmados ponto-a-ponto.
- [ ] **3.4** `decision-brief.md`: validar que todos os pontos `[DEC-NNNN-*]` estão `Resolved` e que cada decisão cravada está refletida no design do `plan.md` v2. Discrepância → bloqueia review.
- [ ] **3.5** Validar a entrega em **ambiente real** quando aplicável: rodar a feature em consumidor / staging / espelho de prod, revisando regressões. Para specs do `ai-guidelines` que tocam compilador/rules, o canal canônico é `yarn guidelines adopt --target ../<consumidor> --dry-run`. Specs puramente internas (refactor sem mudança de comportamento, ajustes de teste, etc.) podem registrar "não-aplicável" no PR com justificativa.
- [ ] **3.6** PR atualizado com descrição em 3 etapas (contexto → decisões cravadas com cross-ref ao `decision-brief.md` → impacto cross-spec) conforme regra de PR collab.
- [ ] **3.7** **[MANDATÓRIO]** Aguardar **Gate de Review Humano** — homologação técnica formal. **Não prosseguir** para Fase 4 sem aprovação explícita.
- [ ] **3.8** Aplicar correções demandadas em loops de review até aprovação; cada correção é commit incremental rastreável.
