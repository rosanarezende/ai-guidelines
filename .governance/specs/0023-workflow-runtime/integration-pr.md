# Integration PR — body source (Spec 0023)

> **Uso:** body source consumido pelo comando `yarn guidelines workflow` opção 4 (`🔗 Abrir Integration PR da spec ativa`) para criar o Integration PR final da stack via `OpenIntegrationPR` use case (cf. `[DEC-0023-L01]`). Arquivo é artifact da spec, não output runtime. **Convenção cravada em L01:** filename é `integration-pr.md` (sem número de PR — número só é conhecido após `gh pr create`). `OpenIntegrationPR.plan()` auto-detecta este arquivo em `<spec_dir>/integration-pr.md`. Owner mantém `Owner authorization` como `pendente` no body até autorização textual explícita de merge atômico.
>
> **Título do PR** é auto-gerado pelo comando como `[🔗] [Integration] [Spec NNNN] Homologação final da stack` (override disponível via `OpenIntegrationPRInput.titleOverride`). Não declarar título neste arquivo — wizard cuida disso.

## Visual de valor entregue (opcional)

<!-- Reusar imagem do PR #25 ou anexar novo visual de convergência, se houver. -->

## Status do ciclo de vida

> **Draft, Ready e Mergeable são estados distintos** (cf. ADR 0024).
> Este PR de Integration pode estar `Ready` sem estar `Authorized to merge`.

- [ ] **Draft** — trabalho em andamento; não solicita review ainda
- [ ] **Ready for review** — homologação/convergência operacional concluída; aguarda revisão humana
- [ ] **Authorized to merge** — owner autorizou merge atômico da stack completa

## PR Type

- [x] 🔗 Integration — homologação/convergência final da stack; sem comportamento novo

## Posição na stack

- **Stack atual**: Integration PR terminal da Spec 0023 (**#27**)
- **Upstream (depends on)**: `#26` (bootstrap alignment — tip da stack)
- **Downstream (followed by)**: terminal — merge atômico ponta-a-ponta após autorização explícita

- [ ] Mergeable isoladamente (sem stack governance-first)
- [x] Apenas merge atômico ponta-a-ponta da stack (per ADR 0020)
- [x] Integration PR — agrega evidência de convergência; não autoriza merge sozinho

## Merge authorization

**Owner authorization**: pendente

## Resumo

Este PR homologa a convergência final da stack da Spec 0023 antes do merge atômico. Ele não cria comportamento novo. Seu papel é consolidar evidência de que a stack `#18 → #19 → #22 → #23 → #24 → #25 → #26` está coerente ponta-a-ponta, com lifecycle consistente, PR bodies atualizados e validações verdes.

Escopo:

- confirmar que PR #25 está operacionalmente encerrado e Ready;
- validar `yarn ci` e smoke manual do workflow runtime;
- checar drift final de `spec.md`, `tasks.md`, `state.yml`, `decision-brief.md`, `NEXT.md`, `CHANGELOG.md`, ADR 0024, template de PR e title conventions;
- manter merge authorization explicitamente pendente até a owner autorizar o merge atômico da stack.

Fora de escopo:

- comportamento novo no runtime;
- redesign de lifecycle;
- nova automação de merge/deploy;
- LLM/agentic orchestration no runtime.

## Test plan

```bash
yarn ci
yarn build && yarn guidelines workflow
yarn guidelines continue 0023
```

Validação manual esperada:

- `workflow` abre wizard com opções declarativas, sem auto-detecção inteligente;
- `continue 0023` resolve a spec por id canônico e mostra briefing coerente;
- PRs upstream (#25, #26) permanecem `Ready for review`, mas sem `Authorized to merge`;
- este Integration PR (#27) registra homologação/convergência e mantém merge authorization pendente até autorização textual da owner.

## Cross-refs

- **Spec**: `.governance/specs/0023-workflow-runtime/`
- **ADRs aplicáveis**: ADR 0018, ADR 0020, ADR 0021, ADR 0024
- **DECs aplicáveis**: DEC-0023-J01, DEC-0023-K01, DEC-0023-L01, DEC-0023-M01, DEC-0023-N01, DEC-0023-O01
- **Linked issue**: ausente

## Checklist operacional

- [ ] `yarn format ; yarn validate` verde antes do push
- [ ] `yarn ci` verde antes de pedir autorização de merge
- [ ] Sem comportamento novo além de homologação/convergência
- [ ] Merge authorization mantida como pendente até autorização textual da owner

## Disclosure de IA

Preparação do modelo Integration PR: Codex (GPT-5) atuando como mantenedor operacional; decisão final e autorização de merge permanecem com Rosana Rezende.
